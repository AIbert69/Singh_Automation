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

        // Singh Automation company info for proposal
        const companyInfo = {
            name: 'Singh Automation',
            uei: 'GJ1DPYQ3X8K5',
            cage: '86VF7',
            naics: ['333249', '333922', '541330', '541512', '541715', '238210'],
            certs: ['FANUC Authorized System Integrator', 'Universal Robots Certified Partner', 'MBE', 'WBENC'],
            locations: 'Kalamazoo, MI (HQ) | Irvine, CA (Sales)',
            capabilities: [
                'Robotic welding and assembly systems',
                'AI-powered machine vision and inspection',
                'Material handling and conveyor automation',
                'PLC/SCADA controls and integration',
                'Factory modernization and Industry 4.0'
            ],
            pastPerformance: [
                { client: 'Automotive Tier 1 Supplier', project: 'Robotic Welding Cell', value: '$425K', outcome: 'Reduced cycle time 35%' },
                { client: 'Aerospace Manufacturer', project: 'Vision Inspection System', value: '$280K', outcome: '99.7% defect detection' },
                { client: 'Food & Beverage Co', project: 'Conveyor Automation', value: '$350K', outcome: 'Increased throughput 50%' }
            ]
        };

        // Build the prompt for Claude
        const prompt = `You are a proposal writer for Singh Automation, a robotics and automation systems integrator. Generate a professional government contract proposal for the following opportunity.

OPPORTUNITY DETAILS:
- Title: ${opportunity.title}
- Agency: ${opportunity.agency}
- Solicitation: ${opportunity.solicitation || 'N/A'}
- Value: ${opportunity.value ? '$' + Number(opportunity.value).toLocaleString() : 'TBD'}
- NAICS: ${opportunity.naicsCode || 'N/A'}
- Set-Aside: ${opportunity.setAside || 'Full & Open Competition'}
- Description: ${opportunity.description || 'No description provided'}

COMPANY INFORMATION:
- Company: ${companyInfo.name}
- UEI: ${companyInfo.uei}
- CAGE: ${companyInfo.cage}
- NAICS Codes: ${companyInfo.naics.join(', ')}
- Certifications: ${companyInfo.certs.join(', ')}
- Locations: ${companyInfo.locations}
- Core Capabilities: ${companyInfo.capabilities.join('; ')}

PAST PERFORMANCE:
${companyInfo.pastPerformance.map(p => `- ${p.client}: ${p.project} (${p.value}) - ${p.outcome}`).join('\n')}

Generate a complete proposal with the following sections:

# PROPOSAL: ${opportunity.title}

## 1. EXECUTIVE SUMMARY
Brief overview of our understanding and proposed solution (2-3 paragraphs)

## 2. TECHNICAL APPROACH
Detailed methodology including:
- System design approach
- Technology stack (FANUC/UR robots, vision systems, controls)
- Implementation phases
- Quality assurance

## 3. MANAGEMENT APPROACH
- Project management methodology
- Team structure and key personnel
- Communication and reporting plan
- Risk mitigation

## 4. PAST PERFORMANCE
Relevant experience demonstrating capability (use the past performance provided)

## 5. CORPORATE CAPABILITY
Company overview, certifications, and qualifications

## 6. PRICING SUMMARY
High-level cost breakdown by category (labor, equipment, integration, training)

Format the proposal professionally. Be specific to the opportunity requirements. Use confident, professional language appropriate for government contracting.`;

        let proposal = '';
        let method = 'template';

        // Try Claude API if key provided
        if (claudeApiKey && claudeApiKey.startsWith('sk-ant')) {
            try {
                const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': claudeApiKey,
                        'anthropic-version': '2023-06-01'
                    },
                    body: JSON.stringify({
                        model: 'claude-sonnet-4-20250514',
                        max_tokens: 4000,
                        messages: [{ role: 'user', content: prompt }]
                    })
                });

                if (claudeResponse.ok) {
                    const claudeData = await claudeResponse.json();
                    proposal = claudeData.content[0].text;
                    method = 'claude-ai';
                } else {
                    const errorData = await claudeResponse.json();
                    console.error('Claude API error:', errorData);
                    throw new Error(errorData.error?.message || 'Claude API failed');
                }
            } catch (claudeError) {
                console.error('Claude error:', claudeError);
                // Fall back to template
                proposal = generateTemplateProposal(opportunity, companyInfo);
                method = 'template-fallback';
            }
        } else {
            // No API key - use template
            proposal = generateTemplateProposal(opportunity, companyInfo);
            method = 'template';
        }

        res.status(200).json({ 
            success: true, 
            proposal,
            method,
            opportunity: opportunity.title
        });

    } catch (error) {
        console.error('Generate error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

function generateTemplateProposal(opp, company) {
    const value = opp.value ? '$' + Number(opp.value).toLocaleString() : 'TBD';
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    return `# PROPOSAL: ${opp.title}

**Submitted by:** ${company.name}
**Date:** ${today}
**Solicitation:** ${opp.solicitation || 'N/A'}
**Agency:** ${opp.agency || 'N/A'}

---

## 1. EXECUTIVE SUMMARY

${company.name} is pleased to submit this proposal in response to the ${opp.agency}'s requirement for ${opp.title}. As an authorized FANUC and Universal Robots system integrator with extensive experience in manufacturing automation, we are uniquely qualified to deliver a turnkey solution that meets all technical requirements while providing exceptional value.

Our proposed approach combines proven robotics technology with AI-powered vision systems to deliver a reliable, efficient, and maintainable system. With our headquarters in Kalamazoo, MI and sales operations in Irvine, CA, we provide comprehensive coverage and rapid response capabilities.

We understand this ${value} opportunity requires ${opp.description || 'advanced automation capabilities'}, and we are committed to delivering a solution that exceeds expectations.

---

## 2. TECHNICAL APPROACH

### 2.1 System Design
Our solution leverages industry-leading automation platforms:
- **Robotics:** FANUC and Universal Robots collaborative systems
- **Vision:** AI-enabled machine vision for inspection and guidance
- **Controls:** Allen-Bradley/Siemens PLC with HMI interface
- **Integration:** Full systems integration with existing equipment

### 2.2 Implementation Phases
1. **Discovery & Design (Weeks 1-4):** Requirements analysis, system architecture, detailed engineering
2. **Fabrication & Build (Weeks 5-10):** Equipment procurement, cell fabrication, controls programming
3. **Integration & Testing (Weeks 11-14):** System integration, FAT, debugging
4. **Installation & Commissioning (Weeks 15-18):** On-site installation, SAT, operator training
5. **Support & Optimization (Ongoing):** Warranty support, preventive maintenance, continuous improvement

### 2.3 Quality Assurance
- ISO 9001-aligned quality management system
- Factory Acceptance Testing (FAT) with customer witness
- Site Acceptance Testing (SAT) with performance validation
- Comprehensive documentation package

---

## 3. MANAGEMENT APPROACH

### 3.1 Project Management
- PMI-aligned methodology with defined milestones
- Weekly status reports and monthly executive reviews
- Risk register with mitigation strategies
- Change control process

### 3.2 Key Personnel
- **Project Manager:** 15+ years automation experience
- **Lead Robotics Engineer:** FANUC/UR certified programmer
- **Controls Engineer:** PLC/HMI specialist
- **Vision Systems Specialist:** AI/ML integration expert

### 3.3 Communication Plan
- Dedicated project portal for document sharing
- Weekly progress calls with customer team
- 24/7 emergency support during commissioning

---

## 4. PAST PERFORMANCE

### Project 1: Robotic Welding Cell - Automotive Tier 1
- **Value:** $425,000
- **Scope:** 6-axis robotic welding cell with vision-guided seam tracking
- **Outcome:** Reduced cycle time 35%, improved weld quality to 99.8% first-pass

### Project 2: Vision Inspection System - Aerospace Manufacturer  
- **Value:** $280,000
- **Scope:** AI-powered defect detection for composite components
- **Outcome:** 99.7% defect detection rate, reduced inspection time 60%

### Project 3: Conveyor Automation - Food & Beverage
- **Value:** $350,000
- **Scope:** High-speed conveyor system with product tracking
- **Outcome:** Increased throughput 50%, integrated with existing MES

---

## 5. CORPORATE CAPABILITY

**${company.name}** is a certified small business automation integrator specializing in robotics, vision systems, and factory automation.

**Credentials:**
- UEI: ${company.uei}
- CAGE Code: ${company.cage}
- NAICS: ${company.naics.join(', ')}

**Certifications:**
${company.certs.map(c => '- ' + c).join('\n')}

**Locations:** ${company.locations}

---

## 6. PRICING SUMMARY

| Category | Estimated Cost |
|----------|---------------|
| Engineering & Design | 15% |
| Equipment & Materials | 45% |
| Integration & Programming | 25% |
| Installation & Commissioning | 10% |
| Training & Documentation | 5% |
| **Total Estimated Value** | **${value}** |

*Detailed pricing to be provided upon request or per RFP requirements.*

---

## CONTACT

**${company.name}**
${company.locations}
UEI: ${company.uei} | CAGE: ${company.cage}

*We look forward to the opportunity to serve ${opp.agency}.*
`;
}
