// /api/validate.js - Claude-Powered Opportunity Validation
// Deploy to Vercel: vercel --prod

const SINGH_PROFILE = {
    name: 'Singh Automation LLC',
    cage: '86VF7',
    uei: 'GJ1DPYQ3X8K5',
    naics: ['333249', '333922', '541330', '541512', '541715', '238210'],
    certifications: ['Small Business', 'MBE', 'WBENC', 'FANUC ASI', 'UR CSP'],
    locations: ['Kalamazoo, MI', 'Irvine, CA'],
    capabilities: [
        'FANUC robotic integration',
        'Universal Robots cobot deployment',
        'Allen-Bradley PLC programming',
        'Siemens PLC programming',
        'SCADA/HMI development',
        'Vision system integration (Cognex, Keyence)',
        'Robotic welding cells',
        'Conveyor automation',
        'Safety system design'
    ],
    excluded: ['8(a)', 'hubzone', 'vosb', 'sdvosb', 'wosb', 'edwosb']
};

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Request-ID');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }
    
    const requestId = req.headers['x-request-id'] || req.body?.requestId || crypto.randomUUID();
    
    // Check for Claude API key
    const claudeKey = process.env.ANTHROPIC_API_KEY;
    if (!claudeKey) {
        return res.status(503).json({
            success: false,
            error: 'ANTHROPIC_API_KEY not configured',
            requestId,
        });
    }
    
    try {
        const { opportunity } = req.body;
        
        if (!opportunity) {
            return res.status(400).json({
                success: false,
                error: 'Missing opportunity data',
                requestId,
            });
        }
        
        console.log(`[${requestId}] Validating: ${opportunity.title}`);
        
        // Build validation prompt
        const prompt = buildValidationPrompt(opportunity);
        
        // Call Claude API
        const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': claudeKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 2000,
                messages: [{ role: 'user', content: prompt }],
            }),
            signal: AbortSignal.timeout(55000),
        });
        
        if (!claudeResponse.ok) {
            const errorText = await claudeResponse.text();
            throw new Error(`Claude API error ${claudeResponse.status}: ${errorText}`);
        }
        
        const claudeData = await claudeResponse.json();
        const responseText = claudeData.content?.[0]?.text || '';
        
        // Parse Claude's response
        const analysis = parseValidationResponse(responseText, opportunity);
        
        console.log(`[${requestId}] Validation result: ${analysis.validation.recommendation}`);
        
        return res.status(200).json({
            success: true,
            analysis,
            requestId,
            timestamp: new Date().toISOString(),
            tokensUsed: {
                input: claudeData.usage?.input_tokens || 0,
                output: claudeData.usage?.output_tokens || 0,
            },
        });
        
    } catch (error) {
        console.error(`[${requestId}] Validation error:`, error.message);
        
        return res.status(500).json({
            success: false,
            error: error.message,
            requestId,
            timestamp: new Date().toISOString(),
        });
    }
}

function buildValidationPrompt(opp) {
    return `You are a government contracting advisor for Singh Automation LLC. Analyze this opportunity and provide a GO/REVIEW/NO-GO recommendation.

## Company Profile
- Name: ${SINGH_PROFILE.name}
- CAGE: ${SINGH_PROFILE.cage} | UEI: ${SINGH_PROFILE.uei}
- NAICS Codes: ${SINGH_PROFILE.naics.join(', ')}
- Certifications: ${SINGH_PROFILE.certifications.join(', ')}
- Locations: ${SINGH_PROFILE.locations.join(', ')}
- Capabilities: ${SINGH_PROFILE.capabilities.join(', ')}
- NOT eligible for: ${SINGH_PROFILE.excluded.join(', ')} set-asides

## Opportunity Details
- Title: ${opp.title}
- Agency: ${opp.agency}
- Solicitation: ${opp.solicitation || opp.noticeId || 'N/A'}
- Value: $${(opp.value || 0).toLocaleString()}
- NAICS: ${opp.naicsCode || 'Not specified'}
- Set-Aside: ${opp.setAside || 'Full & Open'}
- Close Date: ${opp.closeDate || 'Not specified'}
- Description: ${opp.description || 'No description provided'}

## Instructions
Analyze this opportunity and respond in this EXACT JSON format:
{
    "recommendation": "GO" or "REVIEW" or "NO-GO",
    "confidence": 0-100,
    "checks": [
        {"name": "NAICS Code Match", "status": "PASS/WARN/FAIL", "detail": "explanation"},
        {"name": "Set-Aside Eligibility", "status": "PASS/WARN/FAIL", "detail": "explanation"},
        {"name": "Timeline Feasibility", "status": "PASS/WARN/FAIL", "detail": "explanation"},
        {"name": "Geographic Scope", "status": "PASS/WARN/FAIL", "detail": "explanation"},
        {"name": "Capability Match", "status": "PASS/WARN/FAIL", "detail": "explanation"},
        {"name": "Competition Level", "status": "PASS/WARN/FAIL", "detail": "explanation"}
    ],
    "summary": "2-3 sentence summary of recommendation",
    "risks": ["risk 1", "risk 2"],
    "nextSteps": ["step 1", "step 2", "step 3"]
}

Respond ONLY with the JSON, no other text.`;
}

function parseValidationResponse(text, opp) {
    try {
        // Try to extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                validation: {
                    recommendation: parsed.recommendation || 'REVIEW',
                    confidence: parsed.confidence || 70,
                    checks: parsed.checks || [],
                    summary: parsed.summary || '',
                    risks: parsed.risks || [],
                },
                timeline: {
                    milestones: generateMilestones(opp),
                },
                nextSteps: parsed.nextSteps || [],
            };
        }
    } catch (e) {
        console.warn('Failed to parse Claude response as JSON:', e.message);
    }
    
    // Fallback if parsing fails
    return {
        validation: {
            recommendation: 'REVIEW',
            confidence: 50,
            checks: [
                { name: 'Analysis', status: 'WARN', detail: 'Manual review required - automated analysis incomplete' }
            ],
            summary: 'Automated analysis could not be completed. Please review manually.',
        },
        timeline: {
            milestones: generateMilestones(opp),
        },
    };
}

function generateMilestones(opp) {
    const closeDate = opp.closeDate ? new Date(opp.closeDate) : new Date(Date.now() + 30 * 86400000);
    const daysLeft = Math.max(1, Math.floor((closeDate - new Date()) / 86400000));
    
    return [
        { task: 'Review solicitation documents', daysFromNow: 0, critical: true },
        { task: 'Prepare questions for CO', daysFromNow: Math.min(3, daysLeft - 5), critical: false },
        { task: 'Draft technical approach', daysFromNow: Math.min(7, daysLeft - 3), critical: true },
        { task: 'Internal review', daysFromNow: Math.min(10, daysLeft - 2), critical: false },
        { task: 'Submit proposal', daysFromNow: daysLeft - 1, critical: true },
    ];
}

