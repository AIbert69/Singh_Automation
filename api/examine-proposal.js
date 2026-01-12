// /api/examine-proposal.js
// COR Proposal Examiner - Reviews opportunities/proposals for red flags and compliance issues
// Uses Claude to simulate a Contracting Officer's review perspective

export default async function handler(req, res) {
    const requestId = `examine_${Date.now()}`;

    // CORS
    const allowedOrigins = ['https://singh-automation.vercel.app', 'https://singhautomation.com', 'http://localhost:3000', 'http://localhost:5173'];
    const origin = req.headers.origin;
    const isAllowed = allowedOrigins.includes(origin) ||
        (origin && origin.endsWith('.vercel.app') && origin.includes('singh-automation'));
    if (isAllowed) res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!ANTHROPIC_API_KEY) {
        return res.status(500).json({ error: 'Anthropic API key not configured' });
    }

    try {
        const { opportunity, proposalDraft, mode = 'quick' } = req.body;

        if (!opportunity) {
            return res.status(400).json({ error: 'Missing opportunity data' });
        }

        // Build examination context
        const systemPrompt = `You are a seasoned Contracting Officer Representative (COR) reviewing proposals and opportunities for compliance and red flags. You have 15+ years of experience with federal contracting.

YOUR ROLE:
- Review opportunities/proposals with a critical, compliance-focused eye
- Identify red flags that would cause rejection or poor evaluation
- Check for FAR compliance issues
- Verify set-aside eligibility claims
- Assess past performance relevance
- Flag missing or incomplete information

SINGH AUTOMATION PROFILE:
- Small Business (SB)
- Woman-Owned Small Business (WOSB) - certified
- Minority Business Enterprise (MBE)
- NOT 8(a), HUBZone, SDVOSB, or VOSB
- Primary NAICS: 333249 (Industrial Machinery Manufacturing)
- Secondary: 541330 (Engineering), 541512 (Computer Systems), 541715 (R&D)
- Specialties: Robotics, Automation, Material Handling, PLC/SCADA, Machine Vision

RED FLAGS TO CHECK:
1. Set-aside mismatch (opportunity requires certification Singh doesn't have)
2. Contract vehicle requirement (GSA, OASIS, SeaPort that Singh doesn't hold)
3. Unrealistic timeline (response deadline too short)
4. Scope mismatch (work outside Singh's core capabilities)
5. Past performance gaps (no relevant federal work in similar scope)
6. Geographic restrictions that Singh can't meet
7. Security clearance requirements not held
8. Incumbent advantage (likely wired for current contractor)
9. Value mismatch (too large for Singh's bonding capacity >$5M without partner)
10. Missing certifications or registrations

OUTPUT FORMAT:
Provide a structured review with:
1. VERDICT: GO / NO-GO / CONDITIONAL (with specific conditions)
2. COMPLIANCE SCORE: X/100
3. RED FLAGS: List any disqualifying issues
4. YELLOW FLAGS: List concerns that need addressing
5. STRENGTHS: What Singh brings to this opportunity
6. RECOMMENDATION: Specific action steps

Be direct and specific. Don't hedge. If something is a problem, say so clearly.`;

        const userPrompt = `OPPORTUNITY TO REVIEW:
Title: ${opportunity.title || 'Untitled'}
Solicitation: ${opportunity.solicitation || opportunity.noticeId || 'N/A'}
Agency: ${opportunity.agency || 'Unknown'}
Value: $${((opportunity.value || 0) / 1000).toFixed(0)}K
NAICS: ${opportunity.naicsCode || 'Not specified'}
Set-Aside: ${opportunity.setAside || 'None/Full & Open'}
Response Deadline: ${opportunity.closeDate || opportunity.responseDeadLine || 'Not specified'}
Place of Performance: ${opportunity.placeOfPerformance || 'Not specified'}

DESCRIPTION:
${(opportunity.description || opportunity.fullDescription || 'No description available').substring(0, 4000)}

${proposalDraft ? `
PROPOSAL DRAFT TO REVIEW:
${proposalDraft.substring(0, 6000)}
` : ''}

MODE: ${mode === 'deep' ? 'DEEP REVIEW - Provide comprehensive analysis' : 'QUICK REVIEW - Focus on key go/no-go factors'}

Provide your COR review now.`;

        // Call Claude
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: mode === 'deep' ? 3000 : 1500,
                system: systemPrompt,
                messages: [{ role: 'user', content: userPrompt }]
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`[${requestId}] Claude API error:`, errText);
            return res.status(500).json({ error: 'COR review failed', details: errText });
        }

        const data = await response.json();
        const reviewText = data.content[0].text;

        // Parse the review to extract structured data
        const verdict = extractVerdict(reviewText);
        const complianceScore = extractScore(reviewText);
        const redFlags = extractFlags(reviewText, 'RED FLAGS');
        const yellowFlags = extractFlags(reviewText, 'YELLOW FLAGS');

        return res.status(200).json({
            success: true,
            requestId,
            opportunity: {
                id: opportunity.id || opportunity.noticeId,
                title: opportunity.title,
                agency: opportunity.agency
            },
            review: {
                verdict,
                complianceScore,
                redFlagCount: redFlags.length,
                yellowFlagCount: yellowFlags.length,
                redFlags,
                yellowFlags,
                fullReview: reviewText
            },
            model: 'claude-3-5-sonnet-20241022',
            tokens: data.usage?.output_tokens || 0
        });

    } catch (error) {
        console.error(`[${requestId}] Examine error:`, error);
        return res.status(500).json({ error: error.message });
    }
}

// Helper functions to parse COR review output
function extractVerdict(text) {
    const verdictMatch = text.match(/VERDICT:\s*(GO|NO-GO|CONDITIONAL|NO GO)/i);
    if (verdictMatch) {
        const v = verdictMatch[1].toUpperCase();
        return v === 'NO GO' ? 'NO-GO' : v;
    }
    // Try to infer from context
    if (text.toLowerCase().includes('disqualif') || text.toLowerCase().includes('cannot bid')) {
        return 'NO-GO';
    }
    if (text.toLowerCase().includes('conditional') || text.toLowerCase().includes('with conditions')) {
        return 'CONDITIONAL';
    }
    return 'REVIEW';
}

function extractScore(text) {
    const scoreMatch = text.match(/COMPLIANCE SCORE:\s*(\d+)\s*\/\s*100/i);
    if (scoreMatch) {
        return parseInt(scoreMatch[1], 10);
    }
    // Try alternative formats
    const altMatch = text.match(/score[:\s]+(\d+)/i);
    if (altMatch) {
        return parseInt(altMatch[1], 10);
    }
    return null;
}

function extractFlags(text, section) {
    const flags = [];
    const sectionRegex = new RegExp(`${section}[:\\s]*([\\s\\S]*?)(?=(?:YELLOW FLAGS|STRENGTHS|RECOMMENDATION|$))`, 'i');
    const match = text.match(sectionRegex);

    if (match) {
        const content = match[1];
        // Extract bullet points or numbered items
        const items = content.match(/[-•\d.]\s*(.+?)(?=\n[-•\d.]|\n\n|$)/g);
        if (items) {
            items.forEach(item => {
                const cleaned = item.replace(/^[-•\d.]\s*/, '').trim();
                if (cleaned && cleaned.length > 5) {
                    flags.push(cleaned);
                }
            });
        }
    }
    return flags;
}
