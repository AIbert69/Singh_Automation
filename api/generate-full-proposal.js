// /api/generate-full-proposal.js
// Singh Automation - Submission-Ready Proposal Generator
// Uses REAL company data, clearly marks sections requiring manual input

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
    const { opportunity } = req.body;
    
    if (!opportunity) {
      return res.status(400).json({ success: false, error: 'Missing opportunity data' });
    }

    const title = opportunity.title || 'Government Contract';
    const agency = opportunity.agency || opportunity.departmentName || 'Government Agency';
    const desc = opportunity.description || '';
    const value = opportunity.value ? `$${Number(opportunity.value).toLocaleString()}` : '[INSERT VALUE]';
    const solicitation = opportunity.noticeId || opportunity.id || opportunity.solicitation || '[INSERT SOLICITATION NUMBER]';
    const naics = opportunity.naicsCode || '333249';
    const state = opportunity.state || '';
    
    // Determine if state or federal
    const isState = state || agency.toLowerCase().includes('state') || agency.toLowerCase().includes('dtmb') || agency.toLowerCase().includes('dgs');
    const agencyType = isState ? 'state' : 'federal';

    const prompt = `You are a proposal writer for Singh Automation LLC. Generate a COMPLETE, PROFESSIONAL proposal.

CRITICAL RULES:
1. Use ONLY the verified company information provided below - do not invent claims
2. Mark any section requiring client input with **[ACTION REQUIRED: description]**
3. Do NOT include unverifiable metrics (no "40% reduction" unless proven)
4. Do NOT use "federal" language if this is a state/local opportunity
5. Write in confident but honest language - no hedging phrases
6. Past Performance section should have structured placeholders, not blank tables

OPPORTUNITY DETAILS:
- Title: ${title}
- Solicitation: ${solicitation}
- Agency: ${agency}
- Agency Type: ${agencyType}
- Estimated Value: ${value}
- NAICS: ${naics}
- Description: ${desc}

═══════════════════════════════════════════════════════════════════════════════
VERIFIED SINGH AUTOMATION INFORMATION (USE ONLY THIS DATA)
═══════════════════════════════════════════════════════════════════════════════

COMPANY LEGAL INFO:
- Legal Name: Singh Automation LLC
- CAGE Code: 86VF7
- UEI: GJ1DPYQ3X8K5
- Business Type: Small Business, LLC
- Primary NAICS: 333249 (Industrial Machinery Manufacturing)
- Additional NAICS: 333922, 541330, 541512, 541715, 238210

LOCATIONS:
- Headquarters: 7804 S Sprinkle Road, Portage, MI 49002
- Detroit Office: 41000 Woodward Ave, Bloomfield Twp, MI 48304
- California Office: 300 Spectrum Center Dr, Suite 400, Irvine, CA 92618
- Engineering Center: Chennai, India (controls engineering support)

CONTACT:
- Email: gs@singhautomation.com
- Website: singhautomation.com

KEY PERSONNEL (REAL - Use these names):
1. Gurdeep Singh - Owner & Chairman
   - Role: Executive oversight, strategic planning, business development
   - Proposal Role: Executive Sponsor / Principal

2. David Mih - COO / General Manager
   - Role: Day-to-day operations, program management, Kalamazoo production oversight
   - Proposal Role: Program Manager
   
3. Soorya Sridhar - Project Manager, Electrical
   - Role: Controls and robot programming, system integration, PLC programming, project management
   - Proposal Role: Technical Lead (Controls/Electrical)
   
4. Sonny Singh - Operations Manager
   - Role: Mechanical systems, fabrication, assembly, FAT, SAT, system integration
   - Proposal Role: Technical Lead (Mechanical/Integration)
   
5. Ricardo del Olmo Parrado - Resource & Compliance Manager
   - Role: Documentation compliance, project documentation, customer communication
   - Proposal Role: QA/Compliance Manager

CAPABILITIES (VERIFIED):
- FANUC robotics integration (Authorized System Integrator - claimed on website)
- Universal Robots integration (CSP Partner - claimed on website)
- PLC programming and controls (Allen-Bradley, Siemens)
- Machine vision systems
- System integration and turnkey solutions
- Mechanical fabrication and assembly
- Factory Acceptance Testing (FAT)
- Site Acceptance Testing (SAT)

CERTIFICATIONS STATUS:
- FANUC Authorized System Integrator: Claimed **[ACTION REQUIRED: Add certificate number]**
- Universal Robots CSP: Claimed **[ACTION REQUIRED: Add certificate number]**
- Small Business: Yes (verify SAM.gov registration current)

═══════════════════════════════════════════════════════════════════════════════
GENERATE THE FOLLOWING PROPOSAL SECTIONS:
═══════════════════════════════════════════════════════════════════════════════

**COVER PAGE**
- Company name, logo placeholder, solicitation info, submission date, contact

**TABLE OF CONTENTS**
- List all sections with page number placeholders

**1.0 EXECUTIVE SUMMARY** (1 page)
- Opening statement of capability and interest
- Understanding of requirements (reference the description provided)
- Why Singh Automation is qualified (use verified capabilities only)
- Value proposition (small business, multiple locations, direct OEM relationships)
- Close with commitment statement

**2.0 TECHNICAL APPROACH** (2-3 pages)
- 2.1 Understanding of Requirements
- 2.2 Proposed Solution (use real equipment: FANUC robots, appropriate welding systems)
- 2.3 Implementation Methodology
  - Phase 1: Design & Engineering
  - Phase 2: Fabrication & FAT
  - Phase 3: Installation & SAT
  - Phase 4: Training & Closeout
- 2.4 Deliverables Table
- 2.5 Value-Added Features

**3.0 MANAGEMENT APPROACH** (1-2 pages)
- 3.1 Project Organization (use real names from Key Personnel above)
- 3.2 Roles & Responsibilities (map real people to roles)
- 3.3 Communication Plan (meetings, reports, escalation)
- 3.4 Schedule Management
- 3.5 Risk Management Overview

**4.0 KEY PERSONNEL** (1-2 pages)
Use the REAL personnel listed above:
- 4.1 Program Manager: David Mih
- 4.2 Technical Lead: Soorya Sridhar or Sonny Singh (pick based on scope)
- 4.3 QA/Compliance: Ricardo del Olmo Parrado
Include: Role, responsibilities, qualifications summary
Add: **[ACTION REQUIRED: Attach resumes for each key person]**

**5.0 PAST PERFORMANCE** (1-2 pages)
Create 3 structured placeholders:

**Reference 1:**
- Project Name: **[ACTION REQUIRED: Insert project name]**
- Customer: **[ACTION REQUIRED: Insert customer name]**
- Contract Value: **[ACTION REQUIRED: Insert value]**
- Period: **[ACTION REQUIRED: Insert dates]**
- Scope: **[ACTION REQUIRED: Describe work performed]**
- Relevance: **[ACTION REQUIRED: Explain similarity to current requirement]**
- POC: **[ACTION REQUIRED: Name, phone, email - with permission]**

(Repeat structure for Reference 2 and 3)

Note: "Singh Automation has completed numerous robotics and automation projects. Representative examples are provided above. Additional references available upon request."

**6.0 QUALITY ASSURANCE** (1 page)
- QA/QC approach
- FAT procedures
- SAT procedures  
- Documentation control
- Non-conformance handling

**7.0 SAFETY** (0.5 page)
- Safety approach for installation
- Compliance with OSHA, NFPA 79, relevant standards

**8.0 PRICING** (placeholder)
**[ACTION REQUIRED: Complete pricing in accordance with solicitation instructions]**
- Provide CLIN structure template if appropriate

**ATTACHMENTS CHECKLIST:**
□ Key Personnel Resumes **[ACTION REQUIRED]**
□ FANUC ASI Certificate **[ACTION REQUIRED]**
□ Universal Robots CSP Certificate **[ACTION REQUIRED]**
□ SAM.gov Registration Verification
□ W-9 (available at singhautomation.com)
□ Certificate of Insurance **[ACTION REQUIRED]**
□ Past Performance Reference Authorization Letters **[ACTION REQUIRED]**

═══════════════════════════════════════════════════════════════════════════════
FORMATTING:
- Use numbered sections (1.0, 1.1, 2.0, etc.)
- Bold section headers
- Use tables where appropriate
- Professional but not overly formal tone
- ${isState ? 'Use state procurement language, not federal jargon' : 'Use appropriate federal proposal language'}
- No bullet-point heavy formatting - use prose with occasional lists
═══════════════════════════════════════════════════════════════════════════════

Generate the complete proposal now:`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 8000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic error:', err);
      return res.status(500).json({ success: false, error: 'AI request failed: ' + err });
    }

    const data = await response.json();
    
    return res.status(200).json({
      success: true,
      content: data.content[0].text,
      tokens: data.usage?.output_tokens || 0
    });

  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}
