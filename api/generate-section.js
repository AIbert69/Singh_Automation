// /api/generate-section.js
// Federal Proposal Expert AI - Trained on FAR/DFARS, GSA templates, and winning strategies

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ success: false, error: 'API key not configured' });
  }

  try {
    const { section, opportunity, companyInfo, volume } = req.body;
    
    if (!section || !opportunity) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Build expert system prompt + section-specific prompt
    const systemPrompt = buildExpertSystemPrompt();
    const userPrompt = buildSectionPrompt(section, opportunity, companyInfo, volume);
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
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
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    return res.status(200).json({
      success: true,
      content: data.content[0].text,
      section: section,
      tokens: data.usage?.output_tokens || 0
    });

  } catch (error) {
    console.error('Generate section error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// =============================================================================
// EXPERT SYSTEM PROMPT - Federal Proposal Knowledge Base
// =============================================================================
function buildExpertSystemPrompt() {
  return `You are a senior federal proposal writer with 20+ years experience winning government contracts. You have deep expertise in:

## REGULATORY KNOWLEDGE
- Federal Acquisition Regulation (FAR) Parts 12, 15, 16
- Defense FAR Supplement (DFARS) for DoD contracts
- GSA Multiple Award Schedule (MAS) procedures (FAR 8.4)
- Small Business regulations (FAR 19)
- Service Contract Act and Davis-Bacon Act compliance

## PROPOSAL STRUCTURE EXPERTISE
You write proposals following the standard federal three-volume format:

**VOLUME I - TECHNICAL PROPOSAL**
- Section 1: Technical Approach (responds to PWS/SOW requirements)
- Section 2: Management Approach (org structure, staffing, QC)
- Section 3: Key Personnel (qualifications, certifications, clearances)
- Section 4: Transition Plan (phase-in/phase-out)

**VOLUME II - PAST PERFORMANCE**
- Contract references with: Contract #, Agency, CO/COR contact, Period, Value
- Relevance statements mapping past work to current requirements
- Performance metrics and achievements
- Problems encountered and corrective actions

**VOLUME III - PRICE/COST**
- Labor categories with rates
- Other Direct Costs (ODCs)
- Travel estimates
- Materials/equipment
- Fee/profit calculations

## WIN STRATEGY PRINCIPLES
1. **Compliance First**: Address every requirement in Section L/M
2. **Theme Every Section**: Lead with discriminators and benefits
3. **Prove Don't Claim**: Use metrics, numbers, specifics
4. **Ghost Competition**: Subtly highlight competitor weaknesses
5. **Make It Easy**: Help evaluators find strengths quickly

## EVALUATION CRITERIA UNDERSTANDING
You understand how Source Selection Evaluation Boards (SSEBs) score proposals:
- Outstanding/Exceptional: Exceeds requirements, significant strengths, no weaknesses
- Good/Acceptable: Meets requirements, strengths outweigh weaknesses
- Marginal: Some requirements not met, significant weaknesses
- Unacceptable: Fails to meet requirements

## FORMATTING STANDARDS
- Use numbered sections (1.0, 1.1, 1.1.1)
- Bold key terms and win themes
- Use tables for complex data
- Include compliance matrix references
- Cross-reference PWS/SOW paragraphs
- 1-inch margins, 11-12pt font standard

## WRITING STYLE
- Active voice, action verbs
- Specific and quantifiable claims
- Customer-focused (use "Government" not "you")
- Confident but not arrogant
- Compliant language ("shall", "will", "The Contractor shall")

## SMALL BUSINESS ADVANTAGES
For small business proposals, emphasize:
- Agile decision-making and rapid response
- Direct access to leadership
- Competitive pricing without large-company overhead
- Dedicated project focus
- Local presence and responsiveness

Always produce content that is:
1. Compliant with stated requirements
2. Compelling with clear win themes
3. Credible with proof points
4. Consistent across all sections`;
}

// =============================================================================
// SECTION-SPECIFIC PROMPTS
// =============================================================================
function buildSectionPrompt(section, opportunity, companyInfo, volume) {
  const company = companyInfo || {
    name: 'Singh Automation LLC',
    cage: '86VF7',
    uei: 'GJ1DPYQ3X8K5',
    hq: 'Kalamazoo, MI',
    sales: 'Irvine, CA',
    naics: ['333249', '333922', '541330', '541512', '541715', '238210'],
    capabilities: [
      'FANUC & Universal Robots Certified Integration',
      'AI Vision Systems & Machine Learning',
      'PLC/SCADA Controls (Allen-Bradley, Siemens)',
      'Conveyor Systems & Material Handling',
      'HPC Infrastructure & Data Center Equipment'
    ],
    certs: ['FANUC Authorized Integrator', 'Universal Robots CSP', 'Small Business'],
    discriminators: [
      'Authorized FANUC & Universal Robots Integrator with OEM warranty support',
      '23+ years technical excellence delivering complex integration projects',
      'Dual-location presence: HQ in Kalamazoo MI, Sales in Irvine CA',
      'Small business agility with competitive pricing and dedicated focus'
    ]
  };

  const opp = {
    title: opportunity.title || 'Government Contract',
    agency: opportunity.agency || opportunity.departmentName || 'Federal Agency',
    description: opportunity.description || '',
    value: opportunity.value ? `$${Number(opportunity.value).toLocaleString()}` : 'TBD',
    id: opportunity.noticeId || opportunity.id || '',
    naics: opportunity.naicsCode || '',
    type: opportunity.type || 'Contract'
  };

  const prompts = {
    executive: `Generate an EXECUTIVE SUMMARY for this federal proposal.

SOLICITATION DETAILS:
- Title: ${opp.title}
- Solicitation #: ${opp.id}
- Agency: ${opp.agency}
- Estimated Value: ${opp.value}
- NAICS: ${opp.naics}
- Description: ${opp.description}

CONTRACTOR:
- Company: ${company.name}
- CAGE: ${company.cage} | UEI: ${company.uei}
- Locations: ${company.hq} (HQ), ${company.sales} (Sales)
- Capabilities: ${company.capabilities.join('; ')}
- Certifications: ${company.certs.join(', ')}

KEY DISCRIMINATORS TO EMPHASIZE:
${company.discriminators.map((d, i) => `${i + 1}. ${d}`).join('\n')}

Generate a 1-2 page Executive Summary with these sections:

1.0 EXECUTIVE SUMMARY
1.1 Understanding of Requirements
1.2 Proposed Solution Overview  
1.3 Key Discriminators (4 compelling reasons with proof points)
1.4 Relevant Experience Summary
1.5 Commitment Statement

Use proper federal proposal formatting with numbered sections. Bold key themes. Be specific and compelling.`,

    technical: `Generate a TECHNICAL APPROACH section for this federal proposal.

SOLICITATION: ${opp.title} | ${opp.agency} | ${opp.value}
DESCRIPTION: ${opp.description}

CONTRACTOR CAPABILITIES:
${company.capabilities.map(c => `• ${c}`).join('\n')}

Generate detailed Technical Approach:

2.0 TECHNICAL APPROACH
2.1 Technical Understanding
2.2 Proposed Solution
  2.2.1 Solution Architecture
  2.2.2 Methodology
2.3 Implementation Plan
  2.3.1 Phase 1: Planning & Design
  2.3.2 Phase 2: Implementation
  2.3.3 Phase 3: Deployment & Transition
2.4 Tools & Technologies
2.5 Innovation & Value-Added

Include specific technologies for industrial automation, robotics, PLC/SCADA, AI vision. Use numbered sections.`,

    management: `Generate a MANAGEMENT APPROACH section.

SOLICITATION: ${opp.title} | ${opp.agency} | ${opp.value}
COMPANY: ${company.name} | ${company.hq} (HQ), ${company.sales} (Sales)

Generate:

3.0 MANAGEMENT APPROACH
3.1 Program Management Philosophy
3.2 Organizational Structure
3.3 Staffing Plan
3.4 Communication Plan (Meetings, Reports, Escalation)
3.5 Quality Management
3.6 Risk Management
3.7 Security Management
3.8 Subcontract Management

Use proper federal formatting with numbered sections.`,

    personnel: `Generate KEY PERSONNEL section.

SOLICITATION: ${opp.title} | ${opp.agency}
COMPANY: ${company.name}
CERTIFICATIONS: ${company.certs.join(', ')}

Generate:

4.0 KEY PERSONNEL
4.1 Key Personnel Summary Table
4.2 Program Manager (Qualifications, Responsibilities, Experience)
4.3 Technical Lead (Qualifications, Responsibilities, Experience)
4.4 QA Manager (Qualifications, Responsibilities, Experience)
4.5 Personnel Qualifications Matrix
4.6 Staffing Continuity

Use [TBD] for names. Include FANUC, UR, Allen-Bradley certifications where relevant.`,

    past: `Generate PAST PERFORMANCE section.

SOLICITATION: ${opp.title} | ${opp.agency} | ${opp.value}
DESCRIPTION: ${opp.description}
COMPANY: ${company.name} | CAGE: ${company.cage}

Generate:

5.0 PAST PERFORMANCE
5.1 Past Performance Summary
5.2 Contract Reference #1 (Contract Info, POC, Scope, Relevance, Highlights, Problems/Solutions)
5.3 Contract Reference #2
5.4 Contract Reference #3
5.5 Past Performance Summary Matrix

Use [PLACEHOLDER] for specifics. Make contracts relevant to industrial automation, robotics, SCADA.`,

    quality: `Generate QUALITY ASSURANCE section.

SOLICITATION: ${opp.title} | ${opp.agency}
COMPANY: ${company.name}

Generate:

6.0 QUALITY ASSURANCE PLAN
6.1 Quality Management System Overview
6.2 Quality Organization
6.3 Quality Control Procedures (Inspection Points table)
6.4 Documentation and Records
6.5 Non-Conformance Management
6.6 Continuous Improvement
6.7 Certifications and Standards
6.8 QASP Support`,

    risk: `Generate RISK MANAGEMENT section.

SOLICITATION: ${opp.title} | ${opp.agency}
DESCRIPTION: ${opp.description}

Generate:

7.0 RISK MANAGEMENT PLAN
7.1 Risk Management Approach
7.2 Risk Management Process (Identification, Assessment tables, Prioritization)
7.3 Identified Risks (5 risks with: Description, Probability, Impact, Score, Mitigation, Contingency, Owner)
7.4 Risk Register Table
7.5 Risk Monitoring and Reporting
7.6 Risk Communication`,

    pricing: `Generate PRICING/COST structure.

SOLICITATION: ${opp.title} | ${opp.agency} | ${opp.value}

Generate:

8.0 PRICE/COST PROPOSAL
8.1 Pricing Summary (CLIN table)
8.2 Labor Rates Table
8.3 Other Direct Costs Table
8.4 Travel Table
8.5 Price Basis
8.6 Assumptions

Use [PLACEHOLDER] for actual amounts.`,

    transition: `Generate TRANSITION PLAN section.

SOLICITATION: ${opp.title} | ${opp.agency}
COMPANY: ${company.name}

Generate:

9.0 TRANSITION PLAN
9.1 Transition-In Plan (Timeline table, Knowledge Transfer, Personnel)
9.2 Transition-Out Plan (Activities, Deliverables)
9.3 Transition Risk Mitigation Table`
  };

  return prompts[section] || prompts.executive;
}
