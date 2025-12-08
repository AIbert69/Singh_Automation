// Generate Proposal API - Matches Singh Automation Template Format
// Deploy to: /api/generate.js on Vercel

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { opportunity, claudeApiKey } = req.body;
        
        if (!opportunity) {
            return res.status(400).json({ success: false, error: 'No opportunity provided' });
        }

        // Singh Automation company info
        const company = {
            name: 'Singh Automation',
            uei: 'GJ1DPYQ3X8K5',
            cage: '86VF7',
            naics: ['333249', '333922', '541330', '541512', '541715', '238210'],
            certs: ['FANUC Authorized System Integrator', 'Universal Robots Certified Partner', 'MBE Certified', 'WBENC Certified'],
            hq: 'Kalamazoo, MI',
            sales: 'Irvine, CA'
        };

        const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const value = opportunity.value ? '$' + Number(opportunity.value).toLocaleString() : 'TBD';

        let proposal = '';

        // Try AI generation first
        if (claudeApiKey && claudeApiKey.startsWith('sk-ant')) {
            try {
                proposal = await generateWithClaude(opportunity, company, claudeApiKey, today, value);
            } catch (e) {
                console.error('Claude API error:', e);
                proposal = generateTemplate(opportunity, company, today, value);
            }
        } else {
            proposal = generateTemplate(opportunity, company, today, value);
        }

        res.status(200).json({ 
            success: true, 
            proposal,
            method: claudeApiKey ? 'ai-generated' : 'template'
        });

    } catch (error) {
        console.error('Generate error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function generateWithClaude(opp, company, apiKey, today, value) {
    const prompt = `You are a proposal writer for ${company.name}, a certified small business automation integrator specializing in robotics, vision systems, and factory automation.

Generate a professional government contract proposal for:
- Title: ${opp.title}
- Solicitation: ${opp.solicitation || 'N/A'}
- Agency: ${opp.agency}
- Value: ${value}
- Description: ${opp.description}

Use this EXACT format with markdown headers:

# Technical Proposal for [Title]

# Solicitation Information
Solicitation: [Number]
Agency: [Agency Name]
Submitted by: Singh Automation
Date: ${today}

## Primary Contact
Singh Automation
${company.hq} (Headquarters) | ${company.sales} (Sales)
UEI: ${company.uei} | CAGE: ${company.cage}

# 1. Executive Summary
[3 paragraphs: understanding of requirement, proposed solution, value proposition]

# 2. Technical Approach

## 2.1 System Design
[Detailed technical solution with bullet points for: Robotics, Vision & Sensing, Controls & HMI, Cell Infrastructure, Integration]

## 2.2 Implementation Phases
[5 numbered phases with weeks: Discovery & Design, Fabrication & Build, Integration & FAT, Installation & SAT, Support & Optimization]

## 2.3 Quality Assurance
[Quality management aligned with ISO 9001]

# 3. Management Approach

## 3.1 Project Management
[PMI-aligned methodology]

## 3.2 Key Personnel
[Project Manager, Lead Robotics Engineer, Controls Engineer, Vision Systems Specialist]

## 3.3 Communication Plan
[Weekly calls, monthly summaries, shared portal, 24/7 support]

# 4. Past Performance
[3 relevant projects with Contract Value, Scope, Outcomes]
- Project 1: Robotic Welding Cell - Automotive Tier-1 ($425,000)
- Project 2: Vision Inspection System - Aerospace ($280,000)  
- Project 3: Conveyor Automation - Food & Beverage ($350,000)

# 5. Corporate Capability
Core Competencies, Company Data (UEI, CAGE, NAICS), Certifications, Locations

# 6. Pricing Summary
| Category | Estimated Amount | % of Total |
Engineering & Design | 15%
Equipment & Materials | 45%
Integration & Programming | 25%
Installation & Commissioning | 10%
Training & Documentation | 5%
Total: ${value}

# 7. Contact
Singh Automation
${company.hq} (HQ) | ${company.sales} (Sales)
UEI: ${company.uei} | CAGE: ${company.cage}

Generate professional, detailed content for each section. Be specific to the opportunity requirements.`;

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
            messages: [{ role: 'user', content: prompt }]
        })
    });

    if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
}

function generateTemplate(opp, company, today, value) {
    const valueNum = parseFloat(opp.value) || 275000;
    
    return `# Technical Proposal for ${opp.title}

# Solicitation Information

Solicitation: ${opp.solicitation || 'N/A'}

Agency: ${opp.agency || 'Federal Agency'}

Submitted by: Singh Automation

Date: ${today}

## Primary Contact

Singh Automation

${company.hq} (Headquarters) | ${company.sales} (Sales)

UEI: ${company.uei} | CAGE: ${company.cage}

# 1. Executive Summary

Singh Automation is pleased to submit this proposal in response to ${opp.agency}'s requirement for ${opp.title}.

As an authorized FANUC and Universal Robots (UR) system integrator with extensive experience in manufacturing automation, Singh Automation is well positioned to deliver a turnkey solution that meets or exceeds all technical and performance requirements, integrates cleanly with existing operations and safety standards, and provides a robust platform for future automation expansion.

Our proposed solution combines proven industrial robotic platforms with AI-enabled vision systems and modern controls architecture. With engineering based in Kalamazoo, MI and sales and support in Irvine, CA, we provide responsive regional coverage and ongoing lifecycle support.

The estimated value of this project is ${value}, inclusive of engineering, equipment, integration, installation, and training. Singh Automation is committed to delivering a system that improves quality, increases throughput, and reduces manual rework.

# 2. Technical Approach

## 2.1 System Design

The proposed system will be designed as a fully integrated, safety-compliant solution leveraging industry-standard components:

- **Robotics:** FANUC 6-axis industrial robot and/or Universal Robots collaborative robot (UR), selected to match payload, reach, and cycle-time requirements.

- **Vision & Sensing:** AI-enabled machine vision for part detection, quality inspection, and guidance. Optional laser tracking for dynamic path correction.

- **Controls & HMI:** Allen-Bradley or Siemens PLC platform. Industrial HMI for operator interface, job selection, and status monitoring. Integration with safety PLC and interlocks.

- **Cell Infrastructure:** Custom fixtures and tooling designed for target applications. Perimeter guarding, safety devices, and lockout/tagout hardware. Utility connections and cable management as required.

- **Integration:** Interface to existing equipment and upstream/downstream systems where applicable. Provision for future recipe additions and expansions.

## 2.2 Implementation Phases

Singh Automation will deliver the project in clearly defined phases with milestone reviews:

1. **Discovery & Design (Weeks 1–4):** Detailed requirements gathering and on-site assessment. Development of system architecture, layout, and functional design specifications. Design reviews and approvals with stakeholders.

2. **Fabrication & Build (Weeks 5–10):** Procurement of robots, controls, and components. Fabrication of fixtures, guarding, and panels. Controls panel build and software development.

3. **Integration & Factory Acceptance Testing (Weeks 11–14):** Complete mechanical and electrical integration at Singh Automation's facility. Programming and testing. Formal Factory Acceptance Test (FAT) with customer witness.

4. **Installation & Site Acceptance Testing (Weeks 15–18):** Delivery and on-site installation. Power-up, I/O checkout, and system commissioning. Site Acceptance Test (SAT) to validate performance.

5. **Support & Optimization (Post-Installation):** Warranty support for the defined period. Optional preventive-maintenance program. Process optimization support as new applications are introduced.

## 2.3 Quality Assurance

Quality will be managed through a structured process aligned with ISO 9001 principles, including documented design and engineering change control, standardized test plans for FAT and SAT, traceable issue tracking and resolution, and comprehensive as-built documentation.

# 3. Management Approach

## 3.1 Project Management

Singh Automation will employ a formal project management framework aligned with PMI best practices. The approach includes a defined scope, schedule, and budget baseline, a milestone-based project plan with clear deliverables, weekly status reports summarizing progress, risks, and actions, and formal review gates at the end of the Design, FAT, and SAT phases.

A risk register will be maintained from project kickoff, including mitigation actions for technical, schedule, and supply-chain risks.

## 3.2 Key Personnel

Representative roles for this engagement include:

- **Project Manager:** Over 15 years in automation and integration projects; responsible for overall delivery, schedule, and communication.

- **Lead Robotics Engineer:** FANUC/UR certified; responsible for robot selection, path programming, and cycle-time optimization.

- **Controls Engineer:** PLC/HMI specialist; responsible for controls architecture, safety integration, and operator interface.

- **Vision Systems Specialist:** Expert in AI/ML-based vision; responsible for camera selection, lighting design, and algorithm configuration.

## 3.3 Communication Plan

Effective communication is central to the project's success. The plan includes weekly project calls during design, build, and commissioning; monthly executive summaries highlighting key milestones and decisions; a shared project document portal for drawings, schedules, and test reports; and 24/7 support during installation and initial production ramp-up.

# 4. Past Performance

The following representative projects demonstrate Singh Automation's relevant experience:

**Project 1: Robotic Welding Cell – Automotive Tier-1 Supplier**
- Contract Value: $425,000
- Scope: Design and integration of a 6-axis robotic welding cell with vision-guided seam tracking and multi-part fixturing.
- Outcomes: 35% reduction in cycle time, first-pass weld quality improved to 99.8%, significant reduction in manual rework.

**Project 2: Vision Inspection System – Aerospace Manufacturer**
- Contract Value: $280,000
- Scope: AI-driven defect detection system for composite components with high-resolution cameras and custom ML models.
- Outcomes: 99.7% defect detection rate, 60% reduction in inspection time, integration with existing MES.

**Project 3: Conveyor Automation – Food & Beverage Facility**
- Contract Value: $350,000
- Scope: High-speed conveyor and sorting system with product tracking and automated diverting.
- Outcomes: 50% increase in throughput, seamless integration with plant controls and existing MES.

# 5. Corporate Capability

Singh Automation is a certified small-business automation integrator specializing in robotics, vision, and factory automation.

**Core Competencies:**
- Robotic welding and material handling systems
- AI-enabled machine vision and quality inspection
- PLC/HMI controls engineering and safety systems
- Turnkey cell design, fabrication, and integration

**Company Data:**
- UEI: ${company.uei}
- CAGE: ${company.cage}
- Primary NAICS Codes: ${company.naics.join(', ')}

**Certifications:**
${company.certs.map(c => '- ' + c).join('\n')}

**Locations:**
- Headquarters: ${company.hq}
- Sales & Support: ${company.sales}

# 6. Pricing Summary

The following high-level cost breakdown is aligned with an estimated total project value of ${value}.

| Category | Estimated Amount | % of Total |
|----------|------------------|------------|
| Engineering & Design | $${Math.round(valueNum * 0.15).toLocaleString()} | 15% |
| Equipment & Materials | $${Math.round(valueNum * 0.45).toLocaleString()} | 45% |
| Integration & Programming | $${Math.round(valueNum * 0.25).toLocaleString()} | 25% |
| Installation & Commissioning | $${Math.round(valueNum * 0.10).toLocaleString()} | 10% |
| Training & Documentation | $${Math.round(valueNum * 0.05).toLocaleString()} | 5% |
| **Total Estimated Value** | **${value}** | **100%** |

This pricing summary is for planning purposes and may be refined based on final technical scope and options selected.

# 7. Contact

Singh Automation

${company.hq} (HQ) | ${company.sales} (Sales)

UEI: ${company.uei} | CAGE: ${company.cage}

We appreciate the opportunity to propose on this project and look forward to supporting your automation needs.`;
}
