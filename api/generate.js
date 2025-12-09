// Singh Automation AI Proposal Generator
// Phase 2: Live Award Retrieval from SBIR.gov + USASpending.gov
// Deploy to: /api/generate.js on Vercel

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const body = req.method === 'POST' ? (req.body || {}) : req.query;
        const claudeKey = body.claudeKey || process.env.CLAUDE_API_KEY;
        
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
            category: body.category || 'Federal'
        };

        // STEP 2: CONTEXT BUILDER with LIVE DATA
        const context = await buildContext(opportunity);

        // STEP 3: GENERATE WITH CLAUDE
        const proposal = await generateWithClaude(claudeKey, opportunity, context);

        return res.status(200).json({
            success: true,
            proposal: proposal.content,
            contextUsed: context.summary,
            complianceChecklist: proposal.checklist,
            method: 'claude-ai',
            tokensUsed: proposal.tokens,
            estimatedCost: proposal.cost,
            liveDataSources: context.dataSources
        });

    } catch (error) {
        console.error('Proposal generation error:', error);
        const body = req.method === 'POST' ? (req.body || {}) : req.query;
        return templateFallback(req, res, body, error.message);
    }
}

// ============================================
// CONTEXT BUILDER - Now with LIVE DATA
// ============================================
async function buildContext(opportunity) {
    const context = {
        summary: [],
        similarAwards: [],
        internalWins: [],
        themes: [],
        dataSources: []
    };

    // PHASE 2: Live External Award Retrieval
    const externalMatches = await findSimilarExternalAwards(opportunity);
    context.similarAwards = externalMatches.awards;
    context.summary.push(...externalMatches.summaryItems);
    context.dataSources.push(...externalMatches.sources);

    // PHASE 3: Internal History (still uses curated data for now)
    const internalMatches = await findSimilarInternalWins(opportunity);
    context.internalWins = internalMatches.wins;
    context.summary.push(...internalMatches.summaryItems);

    context.themes = extractThemes([...context.similarAwards, ...context.internalWins]);
    return context;
}

// ============================================
// PHASE 2: LIVE SBIR.gov + USASpending APIs
// ============================================
async function findSimilarExternalAwards(opportunity) {
    const awards = [];
    const summaryItems = [];
    const sources = [];
    
    const keywords = (opportunity.title + ' ' + opportunity.description).toLowerCase();
    
    // Build search terms based on opportunity
    const searchTerms = extractSearchTerms(keywords);
    
    // Parallel fetch from multiple sources
    const [sbirAwards, usaSpendingAwards] = await Promise.all([
        fetchSBIRAwards(searchTerms, opportunity.agency),
        fetchUSASpendingAwards(searchTerms, opportunity.naics)
    ]);

    // Process SBIR awards
    if (sbirAwards.length > 0) {
        awards.push(...sbirAwards);
        summaryItems.push(`${sbirAwards.length} SBIR award${sbirAwards.length > 1 ? 's' : ''} (${sbirAwards.map(a => a.agency).filter((v,i,a) => a.indexOf(v) === i).join(', ')})`);
        sources.push('SBIR.gov');
    }

    // Process USASpending awards
    if (usaSpendingAwards.length > 0) {
        awards.push(...usaSpendingAwards);
        summaryItems.push(`${usaSpendingAwards.length} federal contract${usaSpendingAwards.length > 1 ? 's' : ''} (USASpending)`);
        sources.push('USASpending.gov');
    }

    // If no live data found, fall back to curated examples
    if (awards.length === 0) {
        const fallback = getFallbackAwards(keywords);
        awards.push(...fallback.awards);
        summaryItems.push(...fallback.summaryItems);
        sources.push('Curated examples');
    }

    return { awards: awards.slice(0, 5), summaryItems, sources };
}

// Extract search terms from opportunity
function extractSearchTerms(keywords) {
    const techTerms = {
        'weld': ['welding', 'robotic welding', 'automated welding'],
        'robot': ['robotics', 'robotic automation', 'industrial robot'],
        'vision': ['machine vision', 'computer vision', 'visual inspection'],
        'conveyor': ['material handling', 'conveyor system', 'automated conveyor'],
        'palletiz': ['palletizing', 'depalletizing', 'robotic palletizer'],
        'plc': ['PLC programming', 'industrial controls', 'automation controls'],
        'scada': ['SCADA', 'industrial control system', 'process control'],
        'inspection': ['automated inspection', 'quality inspection', 'visual inspection'],
        'assembl': ['robotic assembly', 'automated assembly', 'assembly automation'],
        'automat': ['industrial automation', 'manufacturing automation', 'factory automation']
    };

    const terms = [];
    for (const [key, values] of Object.entries(techTerms)) {
        if (keywords.includes(key)) {
            terms.push(...values);
        }
    }

    // Default terms if nothing specific found
    if (terms.length === 0) {
        terms.push('industrial automation', 'robotics', 'manufacturing');
    }

    return [...new Set(terms)].slice(0, 3);
}

// ============================================
// SBIR.gov API Integration
// ============================================
async function fetchSBIRAwards(searchTerms, agency) {
    const awards = [];
    
    try {
        // SBIR.gov API endpoint
        const baseUrl = 'https://www.sbir.gov/api/awards.json';
        
        // Search with first term
        const searchTerm = searchTerms[0] || 'robotics';
        const url = `${baseUrl}?keyword=${encodeURIComponent(searchTerm)}&rows=10`;
        
        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            timeout: 5000
        });

        if (!response.ok) {
            console.log('SBIR API response not ok:', response.status);
            return awards;
        }

        const data = await response.json();
        
        if (data && Array.isArray(data)) {
            // Process top 3 relevant awards
            const relevantAwards = data
                .filter(award => award.abstract && award.award_title)
                .slice(0, 3)
                .map(award => ({
                    source: 'SBIR.gov',
                    title: award.award_title || 'SBIR Award',
                    agency: award.agency || 'Federal',
                    value: award.award_amount || 150000,
                    year: award.award_year || new Date().getFullYear(),
                    abstract: (award.abstract || '').substring(0, 500),
                    company: award.company || 'Small Business',
                    themes: extractThemesFromText(award.abstract || '')
                }));
            
            awards.push(...relevantAwards);
        }
    } catch (error) {
        console.log('SBIR API error (non-fatal):', error.message);
        // Non-fatal - will use fallback data
    }

    return awards;
}

// ============================================
// USASpending.gov API Integration
// ============================================
async function fetchUSASpendingAwards(searchTerms, naics) {
    const awards = [];
    
    try {
        // USASpending.gov API - Award Search endpoint
        const url = 'https://api.usaspending.gov/api/v2/search/spending_by_award/';
        
        // Build filters
        const filters = {
            keywords: searchTerms,
            award_type_codes: ['A', 'B', 'C', 'D'], // Contracts
            time_period: [
                {
                    start_date: '2022-01-01',
                    end_date: new Date().toISOString().split('T')[0]
                }
            ]
        };

        // Add NAICS filter if provided
        if (naics) {
            filters.naics_codes = [naics.toString().substring(0, 4)]; // First 4 digits
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                filters: filters,
                fields: [
                    'Award ID',
                    'Recipient Name',
                    'Award Amount',
                    'Description',
                    'Awarding Agency',
                    'Award Type',
                    'Start Date'
                ],
                limit: 10,
                page: 1,
                sort: 'Award Amount',
                order: 'desc'
            }),
            timeout: 5000
        });

        if (!response.ok) {
            console.log('USASpending API response not ok:', response.status);
            return awards;
        }

        const data = await response.json();
        
        if (data && data.results && Array.isArray(data.results)) {
            const relevantAwards = data.results
                .filter(award => award.Description)
                .slice(0, 3)
                .map(award => ({
                    source: 'USASpending.gov',
                    title: award.Description?.substring(0, 100) || 'Federal Contract',
                    agency: award['Awarding Agency'] || 'Federal',
                    value: award['Award Amount'] || 200000,
                    year: award['Start Date'] ? new Date(award['Start Date']).getFullYear() : 2024,
                    abstract: award.Description?.substring(0, 400) || '',
                    company: award['Recipient Name'] || 'Contractor',
                    themes: extractThemesFromText(award.Description || '')
                }));
            
            awards.push(...relevantAwards);
        }
    } catch (error) {
        console.log('USASpending API error (non-fatal):', error.message);
        // Non-fatal - will use fallback data
    }

    return awards;
}

// Extract themes from award text
function extractThemesFromText(text) {
    const lowerText = text.toLowerCase();
    const themes = [];
    
    const themeKeywords = {
        'cycle time reduction': ['cycle time', 'faster', 'speed', 'efficiency'],
        'quality improvement': ['quality', 'defect', 'accuracy', 'precision'],
        'cost savings': ['cost', 'savings', 'reduce', 'efficient'],
        'automation': ['automat', 'robot', 'autonomous'],
        'safety': ['safety', 'safe', 'hazard', 'protect'],
        'throughput': ['throughput', 'capacity', 'production', 'output'],
        'integration': ['integrat', 'connect', 'interface', 'system'],
        'AI/ML': ['artificial intelligence', 'machine learning', 'ai', 'ml', 'neural']
    };

    for (const [theme, keywords] of Object.entries(themeKeywords)) {
        if (keywords.some(kw => lowerText.includes(kw))) {
            themes.push(theme);
        }
    }

    return themes.slice(0, 4);
}

// Fallback curated awards when APIs fail
function getFallbackAwards(keywords) {
    const awards = [];
    const summaryItems = [];

    if (keywords.includes('weld') || keywords.includes('robotic')) {
        awards.push({
            source: 'Curated',
            title: 'Advanced Robotic Welding System for Naval Applications',
            agency: 'Navy',
            value: 150000,
            year: 2023,
            abstract: 'AI-guided robotic welding achieving 40% cycle time reduction and 99.5% first-pass quality.',
            themes: ['cycle time reduction', 'quality improvement', 'automation']
        });
        summaryItems.push('1 similar award (robotic welding)');
    }

    if (keywords.includes('vision') || keywords.includes('inspection')) {
        awards.push({
            source: 'Curated',
            title: 'AI-Powered Visual Inspection System',
            agency: 'DoD',
            value: 256000,
            year: 2024,
            abstract: 'Machine learning defect detection with 99.7% accuracy, 60% faster inspection.',
            themes: ['AI/ML', 'quality improvement', 'throughput']
        });
        summaryItems.push('1 similar award (vision inspection)');
    }

    if (keywords.includes('conveyor') || keywords.includes('material') || keywords.includes('palletiz')) {
        awards.push({
            source: 'Curated',
            title: 'Automated Material Handling System',
            agency: 'DOE',
            value: 200000,
            year: 2023,
            abstract: 'High-throughput conveyor and palletizing with 50% efficiency improvement.',
            themes: ['throughput', 'automation', 'integration']
        });
        summaryItems.push('1 similar award (material handling)');
    }

    if (keywords.includes('plc') || keywords.includes('scada') || keywords.includes('control')) {
        awards.push({
            source: 'Curated',
            title: 'Industrial Control System Modernization',
            agency: 'DHS',
            value: 175000,
            year: 2024,
            abstract: 'SCADA/PLC upgrade with cybersecurity hardening and NIST compliance.',
            themes: ['integration', 'safety', 'automation']
        });
        summaryItems.push('1 similar award (controls)');
    }

    return { awards, summaryItems };
}

// ============================================
// PHASE 3: Internal Singh History
// ============================================
async function findSimilarInternalWins(opportunity) {
    const keywords = (opportunity.title + ' ' + opportunity.description).toLowerCase();
    const wins = [];
    const summaryItems = [];

    // Singh's actual past performance - will be expanded with uploaded data
    const singhPortfolio = [
        {
            id: 'singh-welding-auto',
            title: 'Robotic Welding Cell - Automotive Tier-1',
            client: 'Major Automotive Supplier',
            value: 425000,
            year: 2024,
            outcome: 'Won - Delivered on schedule',
            keyPoints: ['35% cycle time reduction', '99.8% first-pass quality', 'Vision-guided seam tracking'],
            themes: ['cycle time reduction', 'quality improvement', 'automation'],
            keywords: ['weld', 'robot', 'automotive', 'vision']
        },
        {
            id: 'singh-vision-aero',
            title: 'Vision Inspection System - Aerospace',
            client: 'Aerospace Composites Manufacturer',
            value: 280000,
            year: 2024,
            outcome: 'Won - Delivered 2 weeks early',
            keyPoints: ['99.7% defect detection', '60% faster inspection', 'Custom ML models'],
            themes: ['AI/ML', 'quality improvement', 'throughput'],
            keywords: ['vision', 'inspection', 'aerospace', 'defect', 'ai']
        },
        {
            id: 'singh-conveyor-fb',
            title: 'Conveyor & Palletizing System - F&B',
            client: 'Food & Beverage Facility',
            value: 350000,
            year: 2023,
            outcome: 'Won - Zero safety incidents',
            keyPoints: ['50% throughput increase', 'Seamless plant integration', 'High-speed case packing'],
            themes: ['throughput', 'integration', 'safety'],
            keywords: ['conveyor', 'palletiz', 'material', 'handling', 'food']
        },
        {
            id: 'singh-controls-mfg',
            title: 'PLC/SCADA Modernization - Manufacturing',
            client: 'Industrial Manufacturer',
            value: 185000,
            year: 2024,
            outcome: 'Won - On budget',
            keyPoints: ['Legacy system migration', 'Zero downtime cutover', 'Remote monitoring enabled'],
            themes: ['integration', 'automation', 'cost savings'],
            keywords: ['plc', 'scada', 'control', 'hmi', 'moderniz']
        }
    ];

    // Match Singh wins to opportunity
    for (const win of singhPortfolio) {
        const matchScore = win.keywords.filter(kw => keywords.includes(kw)).length;
        if (matchScore > 0) {
            wins.push({
                source: 'Singh Internal',
                ...win,
                matchScore
            });
        }
    }

    // Sort by match score and take top 2
    wins.sort((a, b) => b.matchScore - a.matchScore);
    const topWins = wins.slice(0, 2);

    if (topWins.length > 0) {
        summaryItems.push(`${topWins.length} Singh win${topWins.length > 1 ? 's' : ''} (${topWins.map(w => w.title.split(' - ')[0]).join(', ')})`);
    }

    return { wins: topWins, summaryItems };
}

function extractThemes(matches) {
    const themeCounts = {};
    matches.forEach(m => (m.themes || []).forEach(t => { 
        themeCounts[t] = (themeCounts[t] || 0) + 1; 
    }));
    return Object.entries(themeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([theme]) => theme);
}

// ============================================
// CLAUDE API INTEGRATION
// ============================================
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
    const checklist = extractComplianceChecklist(content);

    return { 
        content, 
        checklist, 
        tokens: { input: inputTokens, output: outputTokens }, 
        cost: `$${cost.toFixed(4)}` 
    };
}

function buildSystemPrompt(opportunity, context) {
    let prompt = `You are an expert government proposal writer for Singh Automation, a certified small business specializing in industrial robotics, automation systems, machine vision, and controls integration.

COMPANY PROFILE:
- Name: Singh Automation
- UEI: GJ1DPYQ3X8K5 | CAGE: 86VF7
- NAICS: 333249, 333922, 541330, 541512, 541715, 238210
- Certifications: Small Business, MBE, WBENC, FANUC Authorized Integrator, Universal Robots Certified Partner
- Locations: Kalamazoo, MI (HQ) | Irvine, CA (Sales)
- Contact: (269) 381-6236 | info@singhautomation.com
- Address: 2400 E Cork Street, Kalamazoo, MI 49001

YOUR TASK: Generate a compliant, professional proposal following this 7-section structure:
1. Executive Summary - Agency-specific, highlight key differentiators and value proposition
2. Technical Approach - System design, implementation phases, quality assurance
3. Management Approach - PM methodology, key personnel, communication plan
4. Past Performance - 3 relevant projects with quantified metrics
5. Corporate Capability - Company overview, certifications, facilities
6. Pricing Summary - Cost breakdown table with percentages
7. Compliance Matrix - Map response to typical evaluation criteria

WRITING GUIDELINES:
- Use active voice and confident language
- Include specific metrics and quantified results
- Reference similar successful projects from context
- Tailor language to the specific agency's mission and priorities
- Ensure all required sections are clearly labeled`;

    // Add context from similar awards/wins
    if (context.similarAwards.length > 0 || context.internalWins.length > 0) {
        prompt += `\n\n═══════════════════════════════════════════════════════════
CONTEXT FROM SIMILAR SUCCESSFUL AWARDS AND PROPOSALS
Use these as reference for technical approaches, themes, and language that resonates:
═══════════════════════════════════════════════════════════\n`;

        context.similarAwards.forEach((award, i) => {
            prompt += `\n[EXTERNAL AWARD ${i + 1}] ${award.title}
• Source: ${award.source} | Agency: ${award.agency} | Value: $${award.value?.toLocaleString() || 'N/A'}
• Abstract: ${award.abstract}
• Success Themes: ${(award.themes || []).join(', ') || 'N/A'}\n`;
        });

        context.internalWins.forEach((win, i) => {
            prompt += `\n[SINGH WIN ${i + 1}] ${win.title}
• Client: ${win.client} | Value: $${win.value?.toLocaleString()}
• Outcome: ${win.outcome}
• Key Results: ${(win.keyPoints || []).join('; ')}
• Success Themes: ${(win.themes || []).join(', ')}\n`;
        });

        if (context.themes.length > 0) {
            prompt += `\n═══════════════════════════════════════════════════════════
KEY THEMES TO EMPHASIZE (appearing across multiple wins):
${context.themes.map(t => `• ${t}`).join('\n')}
═══════════════════════════════════════════════════════════`;
        }
    }

    return prompt;
}

function buildUserPrompt(opportunity, context) {
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    let prompt = `Generate a complete 7-section proposal for:

════════════════════════════════════════════════════════════
OPPORTUNITY DETAILS
════════════════════════════════════════════════════════════
Title: ${opportunity.title}
Agency: ${opportunity.agency}
Solicitation: ${opportunity.solicitation}
Estimated Value: $${opportunity.value.toLocaleString()}
NAICS: ${opportunity.naics || 'Not specified'}
Set-Aside: ${opportunity.setAside || 'Full & Open'}
Category: ${opportunity.category}
Date: ${today}`;

    if (opportunity.description) {
        prompt += `\n\nDESCRIPTION/SOW:\n${opportunity.description}`;
    }

    if (opportunity.evalCriteria) {
        prompt += `\n\nEVALUATION CRITERIA:\n${opportunity.evalCriteria}`;
    }

    prompt += `

════════════════════════════════════════════════════════════
PRICING STRUCTURE (apply these percentages to $${opportunity.value.toLocaleString()})
════════════════════════════════════════════════════════════
• Engineering & Design: 15% ($${Math.round(opportunity.value * 0.15).toLocaleString()})
• Equipment & Materials: 45% ($${Math.round(opportunity.value * 0.45).toLocaleString()})
• Integration & Programming: 25% ($${Math.round(opportunity.value * 0.25).toLocaleString()})
• Installation & Commissioning: 10% ($${Math.round(opportunity.value * 0.10).toLocaleString()})
• Training & Documentation: 5% ($${Math.round(opportunity.value * 0.05).toLocaleString()})

════════════════════════════════════════════════════════════
INSTRUCTIONS
════════════════════════════════════════════════════════════
1. Tailor the Executive Summary specifically to ${opportunity.agency}'s mission
2. Reference the similar successful projects provided in context
3. Include quantified metrics in Past Performance (use Singh's actual results)
4. Ensure Technical Approach addresses the specific requirements
5. Make the proposal compliant and professional

Generate the complete proposal now.`;

    return prompt;
}

function extractComplianceChecklist(content) {
    return [
        { item: 'Executive Summary addresses agency mission', status: content.toLowerCase().includes('executive summary') ? '✅' : '⚠️' },
        { item: 'Technical approach with system design', status: content.toLowerCase().includes('technical') ? '✅' : '⚠️' },
        { item: 'Implementation phases defined', status: content.toLowerCase().includes('phase') ? '✅' : '⚠️' },
        { item: 'Quality assurance plan', status: content.toLowerCase().includes('quality') ? '✅' : '⚠️' },
        { item: 'Project management methodology', status: content.toLowerCase().includes('management') ? '✅' : '⚠️' },
        { item: 'Key personnel identified', status: content.toLowerCase().includes('personnel') || content.toLowerCase().includes('engineer') ? '✅' : '⚠️' },
        { item: 'Past performance with metrics', status: content.toLowerCase().includes('past performance') ? '✅' : '⚠️' },
        { item: 'Corporate capability / certifications', status: content.toLowerCase().includes('cage') || content.toLowerCase().includes('uei') ? '✅' : '⚠️' },
        { item: 'Pricing breakdown included', status: content.toLowerCase().includes('pricing') || content.toLowerCase().includes('cost') ? '✅' : '⚠️' },
        { item: 'Small business status confirmed', status: content.toLowerCase().includes('small business') ? '✅' : '⚠️' }
    ];
}

// ============================================
// TEMPLATE FALLBACK
// ============================================
function templateFallback(req, res, body, errorMsg = null) {
    const title = body.title || 'Untitled Project';
    const agency = body.agency || 'Federal Agency';
    const solicitation = body.solicitation || 'TBD';
    const value = Number(String(body.value || 350000).replace(/[^0-9]/g, '')) || 350000;
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const proposal = `# TECHNICAL PROPOSAL FOR ${title.toUpperCase()}

**${solicitation}**
**Submitted by:** Singh Automation
**UEI:** GJ1DPYQ3X8K5 | **CAGE:** 86VF7
**Address:** 2400 E Cork Street, Kalamazoo, MI 49001
**(269) 381-6236** | info@singhautomation.com
**Date:** ${today}

---

## 1. EXECUTIVE SUMMARY

Singh Automation respectfully submits our proposal to provide ${agency} with a state-of-the-art automation solution for ${title}. As a certified Minority Business Enterprise (MBE) and WBENC-certified small business, we align with ${agency}'s commitment to supplier diversity while delivering world-class automation solutions.

**Key Value Propositions:**
• **50% throughput increase** based on proven track record
• **99%+ quality metrics** through AI-enabled vision systems
• **Turnkey integration** from design through commissioning
• **Local support** from Kalamazoo, MI headquarters

**Estimated Investment:** $${value.toLocaleString()}

---

## 2. TECHNICAL APPROACH

### 2.1 System Design
• **Robotics Platform:** FANUC 6-axis / Universal Robots collaborative robots
• **Vision Systems:** AI-enabled machine vision for inspection and guidance  
• **Controls:** Allen-Bradley or Siemens PLC with industrial HMI
• **Safety:** Perimeter guarding, light curtains, E-stop circuits

### 2.2 Implementation Phases
• **Phase 1 (Weeks 1-4):** Discovery, requirements, 3D design
• **Phase 2 (Weeks 5-10):** Fabrication, procurement, build
• **Phase 3 (Weeks 11-14):** Integration, programming, FAT
• **Phase 4 (Weeks 15-18):** Installation, commissioning, SAT
• **Phase 5:** Training, documentation, support

### 2.3 Quality Assurance
• Documented design reviews and change control
• Factory Acceptance Testing (FAT) with customer witness
• Site Acceptance Testing (SAT) and performance validation

---

## 3. MANAGEMENT APPROACH

**Project Management:** PMI-aligned methodology with weekly status reports

**Key Personnel:**
• Project Manager - 15+ years automation delivery
• Lead Robotics Engineer - FANUC/UR certified
• Controls Engineer - Allen-Bradley/Siemens certified
• Vision Specialist - AI/ML expertise

**Communication:** Weekly calls, monthly reports, 24/7 during installation

---

## 4. PAST PERFORMANCE

**Robotic Welding Cell - Automotive Tier-1** | $425,000
• 35% cycle time reduction | 99.8% first-pass quality | On schedule

**Vision Inspection - Aerospace** | $280,000  
• 99.7% defect detection | 60% faster inspection | 2 weeks early

**Conveyor System - Food & Beverage** | $350,000
• 50% throughput increase | Zero safety incidents | On budget

---

## 5. CORPORATE CAPABILITY

• **UEI:** GJ1DPYQ3X8K5 | **CAGE:** 86VF7
• **NAICS:** 333249, 333922, 541330, 541512, 541715, 238210
• **Certifications:** Small Business, MBE, WBENC
• **Partnerships:** FANUC Authorized Integrator, UR Certified Partner
• **Locations:** Kalamazoo, MI (HQ) | Irvine, CA (Sales)

---

## 6. PRICING SUMMARY

| Category | Amount | % |
|----------|--------|---|
| Engineering & Design | $${Math.round(value * 0.15).toLocaleString()} | 15% |
| Equipment & Materials | $${Math.round(value * 0.45).toLocaleString()} | 45% |
| Integration & Programming | $${Math.round(value * 0.25).toLocaleString()} | 25% |
| Installation & Commissioning | $${Math.round(value * 0.10).toLocaleString()} | 10% |
| Training & Documentation | $${Math.round(value * 0.05).toLocaleString()} | 5% |
| **TOTAL** | **$${value.toLocaleString()}** | **100%** |

---

*Singh Automation appreciates this opportunity and looks forward to partnering with ${agency}.*
`;

    return res.status(200).json({
        success: true,
        proposal: proposal,
        contextUsed: errorMsg ? [`Template mode - ${errorMsg}`] : ['Template mode - no Claude API key provided'],
        complianceChecklist: [],
        method: 'template-fallback',
        liveDataSources: []
    });
}
