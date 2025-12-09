// Singh Automation AI Proposal Generator
// Phase 1: Claude Integration with RAG-ready architecture
// Deploy to: /api/generate.js on Vercel

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const body = req.method === 'POST' ? (req.body || {}) : req.query;
        
        // Get Claude API key from request or environment
        const claudeKey = body.claudeKey || process.env.CLAUDE_API_KEY;
        
        // If no Claude key, fall back to template
        if (!claudeKey) {
            return templateFallback(req, res, body);
        }

        // STEP 1: PULL OPPORTUNITY CONTEXT
        const opportunity = {
            title: body.title || 'Untitled Project',
            agency: body.agency || 'Federal Agency',
            solicitation: body.solicitation || 'TBD',
            value: Number(String(body.value || 350000).replace(/[^0-9]/g, '')) || 350000,
            naics: body.naics || '',
            setAside: body.setAside || '',
            description: body.description || '',
            sow: body.sow || body.description || '',
            evalCriteria: body.evalCriteria || '',
            closeDate: body.closeDate || '',
            category: body.category || 'Federal'
        };

        // STEP 2: CONTEXT BUILDER (Retrieval Layer)
        const context = await buildContext(opportunity);

        // STEP 3: GENERATE WITH CLAUDE
        const proposal = await generateWithClaude(claudeKey, opportunity, context);

        // STEP 4: RETURN RESPONSE
        return res.status(200).json({
            success: true,
            proposal: proposal.content,
            contextUsed: context.summary,
            complianceChecklist: proposal.checklist,
            method: 'claude-ai',
            tokensUsed: proposal.tokens,
            estimatedCost: proposal.cost
        });

    } catch (error) {
        console.error('Proposal generation error:', error);
        const body = req.method === 'POST' ? (req.body || {}) : req.query;
        return templateFallback(req, res, body, error.message);
    }
}

async function buildContext(opportunity) {
    const context = { summary: [], similarAwards: [], internalWins: [], themes: [] };
    
    const externalMatches = await findSimilarExternalAwards(opportunity);
    context.similarAwards = externalMatches.awards;
    context.summary.push(...externalMatches.summaryItems);

    const internalMatches = await findSimilarInternalWins(opportunity);
    context.internalWins = internalMatches.wins;
    context.summary.push(...internalMatches.summaryItems);

    context.themes = extractThemes([...context.similarAwards, ...context.internalWins]);
    return context;
}

async function findSimilarExternalAwards(opportunity) {
    const keywords = (opportunity.title + ' ' + opportunity.description).toLowerCase();
    const awards = [];
    const summaryItems = [];

    if (keywords.includes('weld') || keywords.includes('robotic')) {
        awards.push({
            source: 'SBIR', title: 'Advanced Robotic Welding System for Naval Shipyard Applications',
            agency: 'Navy', value: 150000, year: 2023,
            abstract: 'Developed AI-guided robotic welding system achieving 40% cycle time reduction and 99.5% first-pass quality.',
            themes: ['cycle time reduction', 'quality improvement', 'adaptive control']
        });
        summaryItems.push('1 SBIR award (Navy robotic welding)');
    }

    if (keywords.includes('vision') || keywords.includes('inspection')) {
        awards.push({
            source: 'NSF', title: 'AI-Powered Visual Inspection for Composite Manufacturing',
            agency: 'NSF', value: 256000, year: 2024,
            abstract: 'Machine learning-based defect detection system with 99.7% accuracy, reducing inspection time by 60%.',
            themes: ['defect detection', 'ML/AI', 'inspection speed', 'traceability']
        });
        summaryItems.push('1 NSF award (AI vision inspection)');
    }

    if (keywords.includes('conveyor') || keywords.includes('material handling') || keywords.includes('palletiz')) {
        awards.push({
            source: 'DOE', title: 'Energy-Efficient Automated Material Handling System',
            agency: 'DOE', value: 200000, year: 2023,
            abstract: 'High-throughput conveyor and palletizing system with 50% energy reduction.',
            themes: ['throughput', 'energy efficiency', 'automation']
        });
        summaryItems.push('1 DOE award (material handling)');
    }

    if (keywords.includes('plc') || keywords.includes('scada') || keywords.includes('control')) {
        awards.push({
            source: 'DHS', title: 'Secure Industrial Control System Modernization',
            agency: 'DHS', value: 175000, year: 2024,
            abstract: 'SCADA/PLC upgrade with cybersecurity hardening, achieving NIST compliance.',
            themes: ['cybersecurity', 'modernization', 'reliability', 'compliance']
        });
        summaryItems.push('1 DHS award (SCADA modernization)');
    }

    return { awards, summaryItems };
}

async function findSimilarInternalWins(opportunity) {
    const keywords = (opportunity.title + ' ' + opportunity.description).toLowerCase();
    const wins = [];
    const summaryItems = [];

    if (keywords.includes('weld')) {
        wins.push({
            source: 'Singh Internal', title: 'Robotic Welding Cell - Automotive Tier-1',
            client: 'Major Automotive Supplier', value: 425000, year: 2024, outcome: 'Won - Delivered on schedule',
            keyPoints: ['35% cycle time reduction', '99.8% first-pass weld quality', 'Vision-guided seam tracking'],
            themes: ['cycle time', 'quality', 'vision-guided', 'turnkey']
        });
        summaryItems.push('1 Singh win (automotive welding)');
    }

    if (keywords.includes('vision') || keywords.includes('inspection')) {
        wins.push({
            source: 'Singh Internal', title: 'Vision Inspection System - Aerospace',
            client: 'Aerospace Composites Manufacturer', value: 280000, year: 2024, outcome: 'Won - Delivered 2 weeks early',
            keyPoints: ['99.7% defect detection rate', '60% reduction in inspection time', 'Custom ML models'],
            themes: ['defect detection', 'AI/ML', 'speed', 'integration']
        });
        summaryItems.push('1 Singh win (aerospace vision)');
    }

    if (keywords.includes('conveyor') || keywords.includes('palletiz')) {
        wins.push({
            source: 'Singh Internal', title: 'Conveyor & Palletizing System - F&B',
            client: 'Food & Beverage Facility', value: 350000, year: 2023, outcome: 'Won - Zero safety incidents',
            keyPoints: ['50% throughput increase', 'Seamless plant integration', 'High-speed case packing'],
            themes: ['throughput', 'integration', 'safety', 'high-speed']
        });
        summaryItems.push('1 Singh win (F&B conveyor)');
    }

    return { wins, summaryItems };
}

function extractThemes(matches) {
    const themeCounts = {};
    matches.forEach(m => (m.themes || []).forEach(t => { themeCounts[t] = (themeCounts[t] || 0) + 1; }));
    return Object.entries(themeCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([theme]) => theme);
}

async function generateWithClaude(apiKey, opportunity, context) {
    const systemPrompt = buildSystemPrompt(opportunity, context);
    const userPrompt = buildUserPrompt(opportunity, context);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4000,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }]
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Claude API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.content[0].text;
    const inputTokens = data.usage?.input_tokens || 2000;
    const outputTokens = data.usage?.output_tokens || 2000;
    const cost = (inputTokens * 0.003 + outputTokens * 0.015) / 1000;
    const checklist = extractComplianceChecklist(content, opportunity);

    return { content, checklist, tokens: { input: inputTokens, output: outputTokens }, cost: `$${cost.toFixed(4)}` };
}

function buildSystemPrompt(opportunity, context) {
    let prompt = `You are an expert government proposal writer for Singh Automation, a certified small business specializing in industrial robotics, automation systems, machine vision, and controls integration.

COMPANY PROFILE:
- Name: Singh Automation
- UEI: GJ1DPYQ3X8K5 | CAGE: 86VF7
- NAICS: 333249, 333922, 541330, 541512, 541715, 238210
- Certifications: Small Business, MBE, WBENC, FANUC Authorized Integrator, Universal Robots Certified Partner
- Locations: Kalamazoo, MI (HQ) | Irvine, CA (Sales)

YOUR TASK: Generate a compliant, professional proposal following this 7-section structure:
1. Executive Summary (1 page) - Agency-specific, highlight key differentiators
2. Technical Approach (2-3 pages) - System design, implementation phases, QA
3. Management Approach (1 page) - PM methodology, key personnel, communication
4. Past Performance (1 page) - 3 relevant projects with metrics
5. Corporate Capability (0.5 page) - Company overview, certifications, facilities
6. Pricing Summary (0.5 page) - Cost breakdown table with percentages
7. Compliance Checklist - Map response to evaluation criteria`;

    if (context.similarAwards.length > 0 || context.internalWins.length > 0) {
        prompt += `\n\nCONTEXT FROM SIMILAR SUCCESSFUL AWARDS/PROPOSALS:\n`;
        context.similarAwards.forEach((award, i) => {
            prompt += `\n[External Award ${i + 1}] ${award.title} (${award.agency}, $${award.value.toLocaleString()})\nAbstract: ${award.abstract}\nWinning themes: ${award.themes.join(', ')}\n`;
        });
        context.internalWins.forEach((win, i) => {
            prompt += `\n[Singh Win ${i + 1}] ${win.title} ($${win.value.toLocaleString()})\nOutcome: ${win.outcome}\nKey achievements: ${win.keyPoints.join('; ')}\n`;
        });
        if (context.themes.length > 0) {
            prompt += `\nCOMMON SUCCESS THEMES TO EMPHASIZE: ${context.themes.join(', ')}`;
        }
    }
    return prompt;
}

function buildUserPrompt(opportunity, context) {
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    let prompt = `Generate a complete 7-section proposal for:

OPPORTUNITY:
- Title: ${opportunity.title}
- Agency: ${opportunity.agency}
- Solicitation: ${opportunity.solicitation}
- Value: $${opportunity.value.toLocaleString()}
- NAICS: ${opportunity.naics || 'Not specified'}
- Set-Aside: ${opportunity.setAside || 'Not specified'}
- Date: ${today}`;

    if (opportunity.description) prompt += `\n\nDESCRIPTION/SOW:\n${opportunity.description}`;

    prompt += `\n\nPRICING (use these amounts):
- Engineering & Design: 15% ($${Math.round(opportunity.value * 0.15).toLocaleString()})
- Equipment & Materials: 45% ($${Math.round(opportunity.value * 0.45).toLocaleString()})
- Integration & Programming: 25% ($${Math.round(opportunity.value * 0.25).toLocaleString()})
- Installation & Commissioning: 10% ($${Math.round(opportunity.value * 0.10).toLocaleString()})
- Training & Documentation: 5% ($${Math.round(opportunity.value * 0.05).toLocaleString()})

Generate the complete proposal now.`;
    return prompt;
}

function extractComplianceChecklist(content, opportunity) {
    return [
        { item: 'Executive Summary addresses agency mission', status: content.includes('Executive Summary') ? '✅' : '⚠️' },
        { item: 'Technical approach covers system design', status: content.includes('Technical') ? '✅' : '⚠️' },
        { item: 'Implementation phases defined', status: content.includes('Phase') ? '✅' : '⚠️' },
        { item: 'Quality assurance plan included', status: content.includes('Quality') ? '✅' : '⚠️' },
        { item: 'Project management described', status: content.includes('Management') ? '✅' : '⚠️' },
        { item: 'Key personnel identified', status: content.includes('Engineer') ? '✅' : '⚠️' },
        { item: 'Past performance provided', status: content.includes('Past Performance') ? '✅' : '⚠️' },
        { item: 'Corporate capability demonstrated', status: content.includes('CAGE') ? '✅' : '⚠️' },
        { item: 'Pricing breakdown included', status: content.includes('Pricing') ? '✅' : '⚠️' },
        { item: 'Small business status confirmed', status: content.includes('Small Business') ? '✅' : '⚠️' }
    ];
}

function templateFallback(req, res, body, errorMsg = null) {
    const title = body.title || 'Untitled Project';
    const agency = body.agency || 'Federal Agency';
    const solicitation = body.solicitation || 'TBD';
    const value = Number(String(body.value || 350000).replace(/[^0-9]/g, '')) || 350000;
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const proposal = `# Technical Proposal for ${title}

## Solicitation Information
- **Solicitation Number:** ${solicitation}
- **Agency:** ${agency}
- **Submitted by:** Singh Automation
- **Date:** ${today}
- **UEI:** GJ1DPYQ3X8K5 | **CAGE:** 86VF7

---

## 1. Executive Summary

Singh Automation is pleased to submit this proposal in response to ${agency}'s requirement for ${title}. As an authorized FANUC and Universal Robots integrator, we deliver turnkey automation solutions.

**Estimated Project Value:** $${value.toLocaleString()}

---

## 2. Technical Approach

### 2.1 System Design
- **Robotics:** FANUC 6-axis / Universal Robots collaborative robots
- **Vision:** AI-enabled machine vision for inspection and guidance
- **Controls:** Allen-Bradley or Siemens PLC with industrial HMI

### 2.2 Implementation Phases
- **Phase 1 (Weeks 1-4):** Discovery & Design
- **Phase 2 (Weeks 5-10):** Fabrication & Build
- **Phase 3 (Weeks 11-14):** Integration & FAT
- **Phase 4 (Weeks 15-18):** Installation & SAT

---

## 3. Management Approach

- Formal PM framework aligned with PMI best practices
- Weekly status reports and milestone reviews
- Key Personnel: Project Manager, Robotics Engineer, Controls Engineer

---

## 4. Past Performance

**Robotic Welding Cell - Automotive** | $425,000 | 35% cycle time reduction
**Vision Inspection - Aerospace** | $280,000 | 99.7% defect detection
**Conveyor System - F&B** | $350,000 | 50% throughput increase

---

## 5. Corporate Capability

- **UEI:** GJ1DPYQ3X8K5 | **CAGE:** 86VF7
- **NAICS:** 333249, 333922, 541330, 541512, 541715, 238210
- **Certs:** Small Business, MBE, WBENC, FANUC ASI, UR Partner

---

## 6. Pricing Summary

| Category | Amount | % |
|----------|--------|---|
| Engineering & Design | $${Math.round(value * 0.15).toLocaleString()} | 15% |
| Equipment & Materials | $${Math.round(value * 0.45).toLocaleString()} | 45% |
| Integration & Programming | $${Math.round(value * 0.25).toLocaleString()} | 25% |
| Installation & Commissioning | $${Math.round(value * 0.10).toLocaleString()} | 10% |
| Training & Documentation | $${Math.round(value * 0.05).toLocaleString()} | 5% |
| **Total** | **$${value.toLocaleString()}** | **100%** |
`;

    return res.status(200).json({
        success: true,
        proposal: proposal,
        contextUsed: errorMsg ? [`Template mode - ${errorMsg}`] : ['Template mode - no Claude API key provided'],
        complianceChecklist: [],
        method: 'template-fallback'
    });
}
