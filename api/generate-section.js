// /api/generate-section.js
// Federal Proposal Expert AI v2.0
// Implements: (1) Expert System Prompt, (2) RAG Context Injection, (3) Few-Shot Examples

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
    const { section, opportunity, companyInfo } = req.body;
    
    if (!section || !opportunity) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // METHOD 1: Expert System Prompt (FAR/DFARS knowledge)
    const systemPrompt = EXPERT_SYSTEM_PROMPT;
    
    // METHOD 2: RAG - Get relevant reference documents for this section
    const ragContext = getRAGContext(section);
    
    // METHOD 3: Few-Shot Examples - Get winning proposal excerpts
    const fewShotExamples = getFewShotExamples(section);
    
    // Build the complete user prompt
    const userPrompt = buildUserPrompt(section, opportunity, companyInfo, ragContext, fewShotExamples);
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
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
// METHOD 1: EXPERT SYSTEM PROMPT
// Embeds FAR/DFARS knowledge, win strategies, compliance rules
// =============================================================================
const EXPERT_SYSTEM_PROMPT = `You are a Shipley-certified federal proposal writer with 20+ years experience and a 75%+ win rate. You have deep expertise in:

## REGULATORY MASTERY
- FAR Part 15: Contracting by Negotiation (source selection, competitive range, discussions)
- FAR Part 12: Commercial Items acquisition
- FAR Part 16: Contract Types (FFP, T&M, CPFF, CPIF)
- FAR Part 19: Small Business Programs (8(a), HUBZone, SDVOSB, WOSB)
- DFARS: DoD-specific requirements, ITAR, cybersecurity (CMMC, NIST 800-171)
- GSA MAS: FAR 8.4 ordering procedures, BPA establishment

## PROPOSAL ARCHITECTURE
Standard federal three-volume structure:

**VOLUME I - TECHNICAL/MANAGEMENT**
Sections typically include:
- Factor 1: Technical Approach (responds to PWS/SOW line-by-line)
- Factor 2: Management Approach (org chart, staffing, QC, comms)
- Factor 3: Key Personnel (resumes, certs, clearances)
- Factor 4: Transition Plan (phase-in, knowledge transfer)

**VOLUME II - PAST PERFORMANCE**
- 3-5 contract references, most relevant first
- CPARS ratings if available
- Relevance matrix mapping past work to current PWS
- Problems/corrective actions (shows maturity)

**VOLUME III - PRICE/COST**
- Fully-burdened labor rates by category
- Basis of Estimate (BOE) for hours
- ODCs with quotes/justification
- Fee/profit rationale

## SHIPLEY WIN STRATEGIES

**The 4 C's of Winning Proposals:**
1. COMPLIANT - Address every Section L/M requirement explicitly
2. COMPELLING - Lead with discriminators, not descriptions
3. CREDIBLE - Prove claims with metrics, names, specifics
4. CUSTOMER-FOCUSED - Write from evaluator's perspective

**Ghosting Competitors:**
- "Unlike approaches that require extensive customization..."
- "Our direct OEM relationship eliminates third-party delays..."
- "Small business agility ensures dedicated senior attention..."

**Theme Statements:**
Every section should open with a benefit statement:
"[DISCRIMINATOR] enables [BENEFIT] resulting in [PROOF POINT]"

## EVALUATION SCORING (How SSEBs Think)

**Outstanding/Exceptional (Blue):**
- Exceeds requirements in ways that benefit the Government
- Multiple significant strengths
- No weaknesses or deficiencies

**Good/Acceptable (Green):**
- Meets all requirements
- Some strengths
- Minor weaknesses acceptable

**Marginal (Yellow):**
- Fails to meet some requirements
- Weaknesses outweigh strengths
- Risk of unsuccessful performance

**Unacceptable (Red):**
- Fails to meet requirements
- Major deficiencies
- Unacceptable risk

## WRITING STANDARDS
- Active voice: "Singh Automation will deliver" not "Delivery will be made"
- Specific metrics: "reduced downtime 40%" not "significantly improved"
- Federal terminology: "shall" (mandatory), "will" (commitment), "may" (optional)
- Cross-reference PWS: "(Ref: PWS §3.2.1)"
- Numbered sections: 1.0, 1.1, 1.1.1, 1.1.2
- Bold key terms and win themes
- Tables for complex data
- Action captions: "Figure 1: Singh Automation's Proven 3-Phase Implementation Approach Ensures On-Time Delivery"

## SMALL BUSINESS POSITIONING
Emphasize:
- Direct principal involvement (not layers of management)
- Agile decision-making (no corporate bureaucracy)
- Competitive rates (lower overhead than large primes)
- Dedicated focus (not just another task order)
- Local presence (rapid response, relationship building)
- Hungry to perform (reputation on every contract)`;

// =============================================================================
// METHOD 2: RAG - REFERENCE DOCUMENT KNOWLEDGE BASE
// Actual excerpts from GSA RFPs, SOWs, QASPs for context injection
// =============================================================================
const RAG_KNOWLEDGE_BASE = {
  // From Strategic Communications RFP (OASIS)
  rfp_structure: `FEDERAL RFP STRUCTURE (Source: GSA OASIS Sample RFP)

1. INTRODUCTION
2. PURPOSE AND SCOPE  
3. PERFORMANCE REQUIREMENTS - Reference PWS attachment
4. PERIOD OF PERFORMANCE - Base + Option periods format:
   Base Period: [Date] - [Date]
   Option Period One: [Date] - [Date]
   Option Period Two: [Date] - [Date]
   
5. GENERAL INFORMATION
   - CLINs for labor, ODCs, travel
   - Not-to-Exceed amounts for ODCs
   - CAF (Contract Access Fee) typically 0.75%
   
6. INSTRUCTIONS TO OFFEROR
   "Offerors shall provide their proposals by addressing each factor, sub-factor, and element in the format and sequence identified in the RFP."
   
7. PROPOSAL FORMAT
   - Volume I: Technical (page-limited)
   - Volume II: Past Performance (usually 2-3 pages per reference)
   - Volume III: Price (no page limit)
   
   Standard formatting:
   - Margins: 1 inch all sides
   - Page Size: 8.5 x 11 inches
   - Font: 11-12pt Times New Roman or Arial
   - Single or 1.5 spacing`,

  // From OASIS RFP - Technical Volume structure
  technical_approach: `TECHNICAL VOLUME REQUIREMENTS (Source: GSA OASIS RFP)

Section 1 - Primary NAICS
The Offeror shall be registered under one of the following NAICS codes as its primary code in SAM.gov.

Section 2 - Technical Approach
"The Offeror shall demonstrate its knowledge and understanding of the requirements of the PWS, to include knowledge and understanding of each task area."

"The Offeror shall list each proposed major subcontractor, by name, and identify the capabilities the subcontractor will provide."

Section 3 - Management Approach
a. Management & Staffing Plans
"The Offeror shall provide a Management Plan that describes its approach to managing all aspects of the Task Order."

"The Offeror shall provide a Staffing Plan to identify the labor categories necessary to accomplish all PWS requirements."

b. Key Personnel
"The Offeror shall provide resumes, limited to two pages per resume, for Key Personnel."
"The Offeror shall provide a letter of commitment for each Key Personnel position."

c. Transition-In Plan
"The Offeror shall provide a Transition-In Plan with a realistic and achievable approach to assuming full contractual responsibility, without disruption to ongoing operations."`,

  // From OASIS RFP - Past Performance requirements
  past_performance: `PAST PERFORMANCE VOLUME REQUIREMENTS (Source: GSA OASIS RFP)

DEFINITIONS:
- Recent: Services performed within the past 3-5 years
- Relevant: Similar in size, scope, and complexity to current requirement

REQUIRED INFORMATION FOR EACH REFERENCE:
a. Government contracting activity and Procuring Contracting Officer's name, email, phone
b. Government COR name, email, phone
c. Contract Number (for IDIQs, include both contract and order numbers)
d. Contract Type (FFP, CR, T&M, etc.)
e. Awarded price or estimated cost
f. Period of performance
g. Brief description of work performed
h. Relevance to current requirement

"The Government plans to rely on existing documentation from Federal databases (CPARS, PPIRS, FAPIIS) to the maximum extent practicable."

EVALUATION:
- How recent and relevant is the experience?
- Quality of performance (schedule, cost, technical)
- Customer satisfaction
- Problems encountered and resolution effectiveness`,

  // From QASP Sample - Quality requirements
  quality_assurance: `QUALITY ASSURANCE REQUIREMENTS (Source: USACE QASP Sample)

QASP PURPOSE:
"This quality assurance surveillance plan (QASP) has been developed to objectively assess Contractor support of the Government's requirements."

SURVEILLANCE METHODS:
1. 100% Inspection - Every deliverable reviewed
2. Random Sampling - Statistical sample of work
3. Periodic Inspection - Scheduled reviews
4. Customer Feedback - User satisfaction surveys

PERFORMANCE STANDARDS:
| Metric | Acceptable | Marginal | Unacceptable |
|--------|------------|----------|--------------|
| On-time Delivery | 95%+ | 90-94% | <90% |
| Quality Score | 95%+ | 90-94% | <90% |
| Customer Satisfaction | 4.5+ | 4.0-4.4 | <4.0 |

REMEDIES FOR NON-PERFORMANCE:
- Written notice of deficiency
- Cure notice (10 days to correct)
- Negative CPARS rating
- Termination for default`,

  // From SOW Sample - Statement of Work structure  
  sow_structure: `STATEMENT OF WORK STRUCTURE (Source: FDA BPA SOW)

STANDARD SOW SECTIONS:
1.0 BACKGROUND
    - Agency mission context
    - Current situation/problem
    - Why this requirement exists

2.0 OBJECTIVE
    - What the Government needs to accomplish
    - Desired end state

3.0 SCOPE
    "Independently, and not as an agent of the Government, the Contractor shall provide the required personnel, materials, services..."
    
    - Task Area 1: [Description]
    - Task Area 2: [Description]
    - Task Area 3: [Description]

4.0 SPECIFIC TASKS AND DELIVERABLES
    4.1 Task 1
        4.1.1 Subtask
        Deliverable: [Name], Due: [Timeframe]
    
5.0 PERSONNEL REQUIREMENTS
    - Key Personnel positions
    - Qualifications
    - Substitution procedures

6.0 GOVERNMENT-FURNISHED PROPERTY/INFORMATION

7.0 SECURITY REQUIREMENTS

8.0 PERIOD OF PERFORMANCE

9.0 PLACE OF PERFORMANCE

10.0 DELIVERABLES SCHEDULE`
};

// =============================================================================
// METHOD 3: FEW-SHOT EXAMPLES
// Winning proposal excerpts that demonstrate excellent writing
// =============================================================================
const FEW_SHOT_EXAMPLES = {
  executive_summary: `WINNING EXECUTIVE SUMMARY EXAMPLE:

1.0 EXECUTIVE SUMMARY

Singh Automation LLC is pleased to submit this proposal in response to Solicitation W912DY-25-R-0034 for Robotic Welding System Integration Services. **As a FANUC Authorized System Integrator with 23 years of technical excellence, Singh Automation offers the Government a proven, low-risk solution that will reduce maintenance facility downtime by 40% while delivering lifecycle cost savings exceeding $180,000.** (Ref: PWS §1.0)

1.1 Understanding of Requirements
The Michigan Department of Technology, Management & Budget requires a state-of-the-art automated robotic welding system to modernize operations at the state vehicle maintenance facility. Singh Automation understands that success requires not merely equipment installation, but a comprehensive solution encompassing:
• Seamless integration with existing facility infrastructure (Ref: PWS §3.1)
• Minimal disruption to ongoing maintenance operations (Ref: PWS §3.2)
• Comprehensive training enabling Government self-sufficiency (Ref: PWS §4.0)
• Long-term reliability backed by OEM warranty support (Ref: PWS §5.0)

1.2 Key Discriminators

**Discriminator 1: Direct OEM Partnership Eliminates Risk**
Unlike integrators who rely on third-party suppliers, Singh Automation's direct FANUC and Universal Robots certifications provide the Government with factory-trained technicians, priority parts access, and full warranty coverage—reducing equipment downtime risk by 60% compared to industry averages.

**Discriminator 2: Proven Government Performance**  
Singh Automation has successfully delivered 47 automation projects for federal, state, and municipal clients, including a $320,000 robotic welding cell for the U.S. Navy Norfolk Naval Shipyard completed 15 days ahead of schedule with zero defects.

**Discriminator 3: Local Michigan Presence Ensures Rapid Response**
Headquartered in Kalamazoo, MI—just 90 miles from the project site—Singh Automation guarantees 4-hour emergency response times versus the 24-48 hour industry standard.

**Discriminator 4: Small Business Value**
As a certified small business, Singh Automation delivers senior-level expertise on every project without the overhead burden of large defense contractors, resulting in 15-20% cost savings while exceeding performance requirements.`,

  technical_approach: `WINNING TECHNICAL APPROACH EXAMPLE:

2.0 TECHNICAL APPROACH

**Singh Automation's proven three-phase methodology ensures on-time delivery with zero operational disruption, leveraging our 150+ successful integrations to deliver a turnkey robotic welding system that exceeds Government performance requirements.**

2.1 Technical Understanding
Singh Automation has thoroughly analyzed the PWS requirements and identified the following critical success factors:

| PWS Requirement | Success Factor | Singh Automation Approach |
|-----------------|----------------|---------------------------|
| §3.1 System Integration | Compatibility with existing infrastructure | Pre-installation site survey; Allen-Bradley PLC integration |
| §3.2 Minimal Downtime | Operations continuity | Phased implementation; off-hours installation |
| §3.3 Weld Quality | Consistent, defect-free welds | FANUC Arc Mate with AI vision; real-time monitoring |
| §4.0 Training | Government self-sufficiency | 40-hour certified operator training; maintenance procedures |

2.2 Proposed Solution

2.2.1 System Architecture
Singh Automation proposes a FANUC Arc Mate 120iD robotic welding cell featuring:
• **Robot:** FANUC Arc Mate 120iD (1,885mm reach, ±0.02mm repeatability)
• **Controller:** FANUC R-30iB Plus with ArcTool software
• **Power Source:** Lincoln Electric Power Wave R450 (450A capacity)
• **Positioner:** FANUC 2-axis servo positioner (500kg capacity)
• **Safety:** SICK microScan3 area scanner, Category 3 PLd compliant

2.2.2 Implementation Methodology
Singh Automation will execute this project using our ISO 9001:2015-compliant integration methodology:

**Phase 1: Planning & Design (Weeks 1-4)**
Task 1.1: Site Survey & Requirements Validation
- Conduct detailed facility assessment
- Document existing infrastructure connections
- Validate utility requirements (480V/3-phase, compressed air)
- **Deliverable:** Site Assessment Report (Week 2)

Task 1.2: System Design
- Develop detailed system layout drawings
- Create electrical schematics and PLC logic
- Design custom fixturing for Government-specified parts
- **Deliverable:** Design Package for Government Approval (Week 4)`,

  past_performance: `WINNING PAST PERFORMANCE EXAMPLE:

5.0 PAST PERFORMANCE

5.1 Contract Reference #1: Robotic Welding System - Norfolk Naval Shipyard

**Contract Information**
| Field | Details |
|-------|---------|
| Contract Number | N00024-22-C-4521 |
| Agency | Naval Sea Systems Command (NAVSEA) |
| Contract Type | Firm Fixed Price |
| Value | $318,750 |
| Period of Performance | March 2022 - September 2022 |
| NAICS | 333249 |

**Point of Contact**
Contracting Officer: James Morrison, james.morrison@navy.mil, (757) 555-0142
COR: Technical Warrant Officer Lisa Chen, lisa.chen@navy.mil, (757) 555-0198

**Scope of Work**
Singh Automation designed, fabricated, installed, and commissioned a FANUC robotic welding cell for hull repair operations at Norfolk Naval Shipyard. The project included:
- FANUC Arc Mate 100iD robot with Lincoln Power Wave welding system
- Custom 3-axis positioner for ship hull sections up to 2,000 lbs
- Integration with shipyard MES (Manufacturing Execution System)
- 80 hours of operator and maintenance training
- 2-year warranty with 24/7 technical support

**Relevance to Current Requirement**
| Current PWS Requirement | Norfolk Project Experience |
|-------------------------|----------------------------|
| Robotic welding system integration | ✓ Identical scope |
| Government facility environment | ✓ Secure DoD shipyard |
| Training for Government personnel | ✓ 80 hours delivered |
| Integration with existing systems | ✓ MES integration completed |

**Performance Highlights**
• **Schedule:** Delivered 15 days ahead of contracted completion date
• **Quality:** Zero defects at final acceptance; passed all weld certifications
• **Cost:** Completed within budget; no modifications or change orders
• **CPARS Rating:** Exceptional (5.0/5.0)

**Quote from COR:** "Singh Automation's team demonstrated exceptional technical competence and professionalism throughout this project. Their proactive communication and problem-solving approach made them a true partner in our mission."`,

  management_approach: `WINNING MANAGEMENT APPROACH EXAMPLE:

3.0 MANAGEMENT APPROACH

**Singh Automation's management philosophy centers on proactive communication, senior-level accountability, and continuous improvement—delivering 98% on-time performance across 150+ government projects.**

3.1 Organizational Structure

Singh Automation assigns dedicated senior personnel to every Government contract, ensuring direct accountability and rapid decision-making.

[ORGANIZATIONAL CHART]
                    ┌─────────────────┐
                    │ Albert Mizuno   │
                    │ Principal/CEO   │
                    │ Executive       │
                    │ Oversight       │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │ Program Manager │
                    │ [TBD]           │
                    │ Contract POC    │
                    └────────┬────────┘
            ┌────────────────┼────────────────┐
            │                │                │
    ┌───────┴───────┐ ┌──────┴──────┐ ┌──────┴──────┐
    │ Technical Lead│ │ QA Manager  │ │ Safety Mgr  │
    │ [TBD]         │ │ [TBD]       │ │ [TBD]       │
    └───────┬───────┘ └─────────────┘ └─────────────┘
            │
    ┌───────┴───────┐
    │ Installation  │
    │ Technicians   │
    └───────────────┘

**Key Management Features:**
• **Single Point of Contact:** Program Manager empowered to make decisions
• **Senior Oversight:** Principal reviews all major deliverables
• **Small Team Advantage:** No bureaucratic layers; issues resolved in hours, not weeks

3.2 Communication Plan

| Meeting Type | Frequency | Attendees | Deliverable |
|--------------|-----------|-----------|-------------|
| Kickoff | Once (Day 1) | PM, TL, COR, CO | Meeting Minutes |
| Status | Weekly | PM, COR | Status Report |
| Progress Review | Monthly | PM, TL, COR | Progress Report |
| Executive Review | Quarterly | Principal, PM, COR | Executive Summary |

**Reporting:**
Singh Automation provides clear, concise reporting tailored to Government needs:
- **Weekly Status Report:** Task completion, upcoming milestones, issues/risks
- **Monthly Progress Report:** Cost/schedule performance, variance analysis, risk register
- **Ad-Hoc Issue Reports:** Within 24 hours of any significant issue`
};

// =============================================================================
// RAG CONTEXT RETRIEVAL FUNCTION
// Selects relevant reference documents based on section type
// =============================================================================
function getRAGContext(section) {
  const sectionToRAG = {
    executive: [RAG_KNOWLEDGE_BASE.rfp_structure],
    technical: [RAG_KNOWLEDGE_BASE.technical_approach, RAG_KNOWLEDGE_BASE.sow_structure],
    management: [RAG_KNOWLEDGE_BASE.technical_approach, RAG_KNOWLEDGE_BASE.quality_assurance],
    personnel: [RAG_KNOWLEDGE_BASE.technical_approach],
    past: [RAG_KNOWLEDGE_BASE.past_performance],
    quality: [RAG_KNOWLEDGE_BASE.quality_assurance],
    risk: [RAG_KNOWLEDGE_BASE.quality_assurance, RAG_KNOWLEDGE_BASE.sow_structure],
    pricing: [RAG_KNOWLEDGE_BASE.rfp_structure],
    transition: [RAG_KNOWLEDGE_BASE.technical_approach]
  };
  
  return sectionToRAG[section]?.join('\n\n---\n\n') || '';
}

// =============================================================================
// FEW-SHOT EXAMPLES RETRIEVAL FUNCTION
// Returns winning proposal excerpts for the relevant section
// =============================================================================
function getFewShotExamples(section) {
  const sectionToExamples = {
    executive: FEW_SHOT_EXAMPLES.executive_summary,
    technical: FEW_SHOT_EXAMPLES.technical_approach,
    management: FEW_SHOT_EXAMPLES.management_approach,
    personnel: FEW_SHOT_EXAMPLES.management_approach, // Similar structure
    past: FEW_SHOT_EXAMPLES.past_performance,
    quality: '', // Use RAG only
    risk: '', // Use RAG only
    pricing: '', // Use RAG only
    transition: FEW_SHOT_EXAMPLES.technical_approach // Similar phased approach
  };
  
  return sectionToExamples[section] || '';
}

// =============================================================================
// BUILD USER PROMPT - Combines opportunity data + RAG + Few-Shot
// =============================================================================
function buildUserPrompt(section, opportunity, companyInfo, ragContext, fewShotExamples) {
  const company = companyInfo || {
    name: 'Singh Automation LLC',
    cage: '86VF7',
    uei: 'GJ1DPYQ3X8K5',
    hq: 'Kalamazoo, MI',
    sales: 'Irvine, CA',
    phone: '786.344.8955',
    email: 'albert@singhautomation.com',
    naics: ['333249', '333922', '541330', '541512', '541715', '238210'],
    capabilities: [
      'FANUC & Universal Robots Certified Integration',
      'AI Vision Systems & Machine Learning',
      'PLC/SCADA Controls (Allen-Bradley, Siemens)',
      'Conveyor Systems & Material Handling',
      'HPC Infrastructure & Data Center Equipment'
    ],
    certs: ['FANUC Authorized System Integrator', 'Universal Robots CSP', 'Small Business'],
    discriminators: [
      'Authorized FANUC & Universal Robots Integrator with direct OEM support and full warranty coverage',
      '23+ years technical excellence with 150+ successful automation projects delivered on-time',
      'Dual-location presence: HQ in Kalamazoo MI (rapid Midwest response), Sales in Irvine CA (West Coast coverage)',
      'Small business agility with 15-20% cost savings vs. large defense contractors'
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

  // Build the complete prompt with all three methods
  let prompt = `Generate a ${section.toUpperCase()} section for this federal proposal.

## SOLICITATION DETAILS
- Title: ${opp.title}
- Solicitation Number: ${opp.id}
- Agency: ${opp.agency}
- Estimated Value: ${opp.value}
- NAICS: ${opp.naics}
- Description: ${opp.description}

## CONTRACTOR INFORMATION
- Company: ${company.name}
- CAGE Code: ${company.cage}
- UEI: ${company.uei}
- Headquarters: ${company.hq}
- Sales Office: ${company.sales}
- Phone: ${company.phone}
- Email: ${company.email}

### Capabilities
${company.capabilities.map(c => `• ${c}`).join('\n')}

### Certifications
${company.certs.join(', ')}

### Key Discriminators (MUST emphasize these)
${company.discriminators.map((d, i) => `${i + 1}. ${d}`).join('\n')}

### NAICS Codes
${company.naics.join(', ')}
`;

  // Add RAG context if available
  if (ragContext) {
    prompt += `

## REFERENCE: FEDERAL RFP/SOW STANDARDS
Use these actual federal document excerpts as reference for proper structure and terminology:

${ragContext}
`;
  }

  // Add few-shot examples if available
  if (fewShotExamples) {
    prompt += `

## EXAMPLE: WINNING PROPOSAL EXCERPT
Model your output after this winning proposal example:

${fewShotExamples}
`;
  }

  // Add section-specific instructions
  prompt += getSectionInstructions(section);

  return prompt;
}

// =============================================================================
// SECTION-SPECIFIC INSTRUCTIONS
// =============================================================================
function getSectionInstructions(section) {
  const instructions = {
    executive: `

## YOUR TASK: Generate EXECUTIVE SUMMARY

Create a compelling 1-2 page Executive Summary with these sections:

1.0 EXECUTIVE SUMMARY
- Opening theme statement with key discriminator and quantified benefit

1.1 Understanding of Requirements
- Demonstrate deep understanding of agency mission and needs
- Reference specific PWS/SOW requirements
- Show insight into challenges

1.2 Proposed Solution Overview
- High-level technical approach
- Key technologies and methodologies
- How solution exceeds requirements

1.3 Key Discriminators
- 4 compelling discriminators with proof points
- Each must include: Claim → Evidence → Benefit
- Ghost competitors where appropriate

1.4 Relevant Experience Summary
- 2-3 most relevant past performance highlights
- Quantified achievements
- Direct relevance to this requirement

1.5 Commitment Statement
- Confident closing
- Commitment to partnership
- Readiness to perform

FORMAT: Use numbered sections, bold key themes, include tables where appropriate.`,

    technical: `

## YOUR TASK: Generate TECHNICAL APPROACH

Create a detailed Technical Approach with these sections:

2.0 TECHNICAL APPROACH
- Opening theme statement

2.1 Technical Understanding
- Requirement-by-requirement understanding table
- Critical success factors
- Technical challenges identified

2.2 Proposed Solution
2.2.1 System Architecture/Solution Design
- Specific technologies, equipment, or methodologies
- How components integrate
- Compliance with requirements

2.2.2 Implementation Methodology
- Industry standards followed (ISO, IEEE, NIST)
- Quality approach integrated into execution

2.3 Implementation Plan
2.3.1 Phase 1: Planning & Design
- Specific tasks with deliverables
- Durations in weeks

2.3.2 Phase 2: Implementation/Execution
- Specific tasks with deliverables

2.3.3 Phase 3: Deployment & Closeout
- Testing, training, transition tasks

2.4 Tools & Technologies
- Specific tools, software, equipment by name
- Justification for selections

2.5 Innovation & Value-Added Features
- Approaches exceeding requirements
- Cost savings or efficiency gains

FORMAT: Use numbered sections, include requirements traceability table, bold key terms.`,

    management: `

## YOUR TASK: Generate MANAGEMENT APPROACH

Create a comprehensive Management Approach with these sections:

3.0 MANAGEMENT APPROACH
- Opening theme statement on management philosophy

3.1 Organizational Structure
- Text description of org chart
- Roles and reporting relationships
- Key features (small team advantage, senior access)

3.2 Roles and Responsibilities
- Program Manager duties
- Technical Lead duties
- QA Manager duties

3.3 Staffing Plan
- Labor categories
- FTE allocation
- Ramp-up approach

3.4 Communication Plan
- Meeting schedule table (Type, Frequency, Attendees, Output)
- Reporting requirements
- Escalation procedures

3.5 Quality Management
- QC procedures
- Inspection approach
- Continuous improvement

3.6 Risk Management
- Risk identification approach
- Mitigation strategies
- Monitoring and reporting

3.7 Security Approach (if applicable)
- Personnel security
- Information security
- Clearance management

FORMAT: Use numbered sections, include tables for meetings and staffing.`,

    personnel: `

## YOUR TASK: Generate KEY PERSONNEL section

Create Key Personnel section with:

4.0 KEY PERSONNEL

4.1 Key Personnel Summary
Table: Position | Name | Years Exp | Certifications | Availability

4.2 Program Manager
- Qualifications (education, experience, certs)
- Responsibilities
- Relevant experience highlights

4.3 Technical Lead
- Qualifications
- Responsibilities  
- Relevant experience

4.4 Quality Assurance Manager
- Qualifications
- Responsibilities
- Relevant experience

4.5 Staffing Continuity
- Retention commitment
- Succession planning
- Substitution procedures

Use [TBD] or [NAME] as placeholders for actual names.
Include relevant certifications: PMP, FANUC, Allen-Bradley, OSHA, etc.`,

    past: `

## YOUR TASK: Generate PAST PERFORMANCE section

Create Past Performance section with 3 contract references:

5.0 PAST PERFORMANCE

5.1 Past Performance Overview
- Summary of relevant experience
- Total similar contracts/value

5.2 Contract Reference #1: [Most Relevant Contract]
Table format for contract info:
| Field | Details |
| Contract Number | [NUMBER] |
| Agency | [AGENCY] |
| Contract Type | Firm Fixed Price |
| Value | $[VALUE] |
| Period | [START] - [END] |
| NAICS | [CODE] |

POC Information:
- Contracting Officer: [Name], [Email], [Phone]
- COR: [Name], [Email], [Phone]

Scope of Work: 2-3 paragraphs describing work

Relevance Table:
| Current Requirement | Past Performance |
| [Requirement] | ✓ How met |

Performance Highlights:
• Schedule: [Achievement]
• Quality: [Achievement]
• Cost: [Achievement]
• CPARS Rating: [Rating]

5.3 Contract Reference #2
[Same format]

5.4 Contract Reference #3
[Same format]

5.5 Past Performance Matrix
Summary table of all references

Use [PLACEHOLDER] for specific details to be filled in later.
Make contracts relevant to industrial automation, robotics, controls.`,

    quality: `

## YOUR TASK: Generate QUALITY ASSURANCE section

6.0 QUALITY ASSURANCE PLAN

6.1 Quality Management System
- QMS overview (ISO 9001 alignment)
- Quality policy statement

6.2 Quality Organization
- QA Manager authority
- Quality responsibilities

6.3 Quality Control Procedures
Table: Milestone | Inspection Type | Acceptance Criteria | Documentation

6.4 Inspection and Testing
- Factory Acceptance Testing
- Site Acceptance Testing
- Performance verification

6.5 Documentation Control
- Version control
- Records retention
- Deliverable review process

6.6 Non-Conformance Management
- Identification procedures
- Root cause analysis
- Corrective/preventive action

6.7 Continuous Improvement
- Metrics tracked
- Lessons learned process
- Process improvement

6.8 QASP Support
- Government surveillance support
- Access for inspections
- Corrective action response`,

    risk: `

## YOUR TASK: Generate RISK MANAGEMENT section

7.0 RISK MANAGEMENT PLAN

7.1 Risk Management Approach
- Methodology overview
- Alignment with industry standards

7.2 Risk Process
- Identification methods
- Assessment criteria (P x I matrix)
- Prioritization thresholds

7.3 Risk Assessment Matrix
Table showing P (1-3) x I (1-3) scoring

7.4 Identified Risks
For each of 5 risks:
**RISK #X: [Name]**
- Description: [What could go wrong]
- Probability: [H/M/L] ([1-3])
- Impact: [H/M/L] ([1-3])
- Score: [1-9]
- Mitigation: [Prevention strategy]
- Contingency: [If it happens]
- Owner: [Role]

Include realistic risks:
1. Technical integration complexity
2. Supply chain/delivery delays
3. Key personnel availability
4. Requirements changes
5. Site access/coordination

7.5 Risk Register
Summary table of all risks

7.6 Risk Monitoring
- Review frequency
- Reporting approach
- Escalation triggers`,

    pricing: `

## YOUR TASK: Generate PRICING/COST structure

8.0 PRICE/COST PROPOSAL

8.1 Price Summary
CLIN table:
| CLIN | Description | Qty | Unit | Unit Price | Extended |
| 0001 | Base Period | 1 | Lot | $[X] | $[X] |
| 0002 | Option Year 1 | 1 | Lot | $[X] | $[X] |
| 1001 | ODCs | 1 | Lot | NTE $[X] | $[X] |

8.2 Labor Rates
| Labor Category | Hourly Rate | Est Hours | Extended |
| Program Manager | $[X] | [X] | $[X] |
| Technical Lead | $[X] | [X] | $[X] |

8.3 Other Direct Costs
| Item | Description | Qty | Unit Cost | Extended |

8.4 Travel
| Trip | Purpose | Trips | People | Days | Cost |

8.5 Basis of Estimate
- Labor rate basis
- Hours estimation methodology
- ODC pricing sources

8.6 Assumptions
- GFP/GFI assumptions
- Site access assumptions
- Period of performance

Use $[PLACEHOLDER] for actual amounts.`,

    transition: `

## YOUR TASK: Generate TRANSITION PLAN

9.0 TRANSITION PLAN

9.1 Transition-In Approach
- Philosophy and timeline overview

9.2 Transition-In Schedule
Table: Week | Activity | Responsible | Deliverable
Week 1: Kickoff, receive GFI
Week 2: Personnel onboarding, site survey
Week 3: Knowledge transfer
Week 4: Full operations

9.3 Knowledge Transfer
- Documentation review
- Incumbent coordination (if applicable)
- Shadow period

9.4 Personnel Transition
- Key personnel Day 1 availability
- Clearance processing
- Training requirements

9.5 Transition-Out Plan
- 90/60/30 day activities
- Documentation deliverables
- Property return procedures

9.6 Transition Risks
Table: Risk | Mitigation`
  };

  return instructions[section] || instructions.executive;
}
