// /api/generate-section.js
// AI-powered proposal section generator using Claude

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ 
      success: false, 
      error: 'ANTHROPIC_API_KEY not configured' 
    });
  }

  try {
    const { section, opportunity, companyInfo } = req.body;
    
    if (!section || !opportunity) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: section, opportunity' 
      });
    }

    // Build the prompt based on section type
    const prompt = buildSectionPrompt(section, opportunity, companyInfo);
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const generatedContent = data.content[0].text;

    return res.status(200).json({
      success: true,
      content: generatedContent,
      section: section,
      tokens: data.usage?.output_tokens || 0
    });

  } catch (error) {
    console.error('Generate section error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

function buildSectionPrompt(section, opportunity, companyInfo) {
  const company = companyInfo || {
    name: 'Singh Automation LLC',
    cage: '86VF7',
    uei: 'GJ1DPYQ3X8K5',
    hq: 'Kalamazoo, MI',
    sales: 'Irvine, CA',
    capabilities: [
      'FANUC & Universal Robots Integration',
      'AI Vision Systems',
      'PLC/SCADA Controls (Allen-Bradley, Siemens)',
      'Conveyor Systems & Material Handling',
      'HPC Infrastructure'
    ],
    certs: ['FANUC ASI', 'UR CSP', 'MBE', 'WBENC']
  };

  const oppTitle = opportunity.title || 'Government Contract';
  const oppAgency = opportunity.agency || opportunity.departmentName || 'Federal Agency';
  const oppDesc = opportunity.description || '';
  const oppValue = opportunity.value ? `$${opportunity.value.toLocaleString()}` : 'TBD';
  const oppId = opportunity.noticeId || opportunity.id || '';

  const sectionPrompts = {
    executive: `Write a compelling Executive Summary for a federal government proposal.

OPPORTUNITY:
- Title: ${oppTitle}
- Agency: ${oppAgency}
- Solicitation: ${oppId}
- Estimated Value: ${oppValue}
- Description: ${oppDesc}

COMPANY:
- Name: ${company.name}
- CAGE: ${company.cage}
- UEI: ${company.uei}
- Headquarters: ${company.hq}
- Sales Office: ${company.sales}
- Core Capabilities: ${company.capabilities.join(', ')}

Write a 1-2 page executive summary that:
1. Opens with a clear statement of understanding
2. Highlights 3-4 key discriminators
3. Summarizes the technical approach
4. Emphasizes relevant experience
5. Closes with confidence statement

Use professional federal proposal language. Include specific company details. Format with clear headers.`,

    technical: `Write a Technical Approach section for a federal government proposal.

OPPORTUNITY:
- Title: ${oppTitle}
- Agency: ${oppAgency}
- Description: ${oppDesc}
- Value: ${oppValue}

COMPANY CAPABILITIES:
${company.capabilities.map(c => '- ' + c).join('\n')}

Write a detailed technical approach that:
1. Demonstrates understanding of requirements
2. Describes the proposed solution with specific technologies
3. Outlines implementation phases/tasks
4. Identifies tools, methodologies, and standards
5. Highlights innovations and value-adds
6. Addresses quality and risk mitigation

Use technical language appropriate for federal evaluators. Include specific technologies and methodologies. Format with numbered sections and clear headers.`,

    management: `Write a Management Plan section for a federal government proposal.

OPPORTUNITY:
- Title: ${oppTitle}
- Agency: ${oppAgency}
- Value: ${oppValue}

COMPANY:
- Name: ${company.name}
- Locations: HQ in ${company.hq}, Sales in ${company.sales}

Write a management plan that includes:
1. Organizational structure with key roles
2. Communication plan (meetings, reports, escalation)
3. Quality management approach
4. Schedule management
5. Risk management framework
6. Subcontractor management (if applicable)

Include an organizational chart description. Use professional federal proposal language.`,

    personnel: `Write a Key Personnel section for a federal government proposal.

OPPORTUNITY:
- Title: ${oppTitle}
- Agency: ${oppAgency}
- Requirements: ${oppDesc}

COMPANY:
- Name: ${company.name}
- Certifications: ${company.certs.join(', ')}

Write key personnel descriptions for:
1. Program Manager - responsible for overall contract execution
2. Technical Lead - responsible for technical solution delivery
3. Quality Assurance Manager - responsible for quality control

For each person include:
- Role and responsibilities
- Required qualifications (education, certifications, clearances)
- Years of experience required
- Relevant skills

Note: Use [NAME] as placeholder for actual names. Format as a professional proposal section.`,

    past: `Write a Past Performance section for a federal government proposal.

OPPORTUNITY:
- Title: ${oppTitle}
- Agency: ${oppAgency}
- Description: ${oppDesc}

COMPANY:
- Name: ${company.name}
- Capabilities: ${company.capabilities.join(', ')}

Write past performance narratives for 3 relevant contracts. For each include:
1. Contract name and number
2. Customer agency and POC (use [POC NAME] placeholder)
3. Contract value and period
4. Scope of work
5. Relevance to current opportunity
6. Key achievements and metrics
7. Problems encountered and solutions

Focus on contracts similar in scope, complexity, and value. Use [PLACEHOLDER] for specific details to be filled in.`,

    quality: `Write a Quality Assurance section for a federal government proposal.

OPPORTUNITY:
- Title: ${oppTitle}
- Agency: ${oppAgency}

COMPANY:
- Name: ${company.name}
- Certifications: ${company.certs.join(', ')}

Write a quality assurance plan that includes:
1. QA/QC organizational responsibilities
2. Quality control procedures
3. Inspection and testing protocols
4. Documentation and reporting
5. Corrective action procedures
6. Continuous improvement approach
7. Relevant certifications and standards (ISO, AS9100, etc.)

Use professional quality management language appropriate for federal proposals.`,

    risk: `Write a Risk Mitigation section for a federal government proposal.

OPPORTUNITY:
- Title: ${oppTitle}
- Agency: ${oppAgency}
- Description: ${oppDesc}

Write a risk management plan that includes:
1. Risk identification methodology
2. Risk assessment matrix (likelihood x impact)
3. Top 5 identified risks with:
   - Risk description
   - Likelihood (Low/Medium/High)
   - Impact (Low/Medium/High)
   - Mitigation strategy
   - Contingency plan
4. Risk monitoring and reporting approach

Focus on realistic risks for this type of work. Use professional risk management language.`
  };

  return sectionPrompts[section] || sectionPrompts.executive;
}
