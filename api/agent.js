// /api/agent.js
// Agent_SAM - Singh Automation's AI Business Development Assistant
// Conversational + Autonomous + Proposal Co-Pilot

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { message, context, mode } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Missing message' });
    }

    // Build context from provided data
    const opportunities = context?.opportunities || [];
    const pipeline = context?.pipeline || {};
    const currentOpp = context?.currentOpportunity || null;
    
    // Count pipeline stats
    const goCount = Object.values(pipeline).filter(p => p.status === 'go').length;
    const reviewCount = Object.values(pipeline).filter(p => p.status === 'review').length;
    const totalValue = opportunities.reduce((sum, o) => sum + (parseFloat(o.value) || 0), 0);
    
    // Get top opportunities
    const topOpps = opportunities
      .filter(o => o.matchScore >= 70)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);
    
    // Get urgent opportunities (closing within 14 days)
    const now = new Date();
    const urgentOpps = opportunities.filter(o => {
      if (!o.closeDate) return false;
      const close = new Date(o.closeDate);
      const days = Math.ceil((close - now) / (1000 * 60 * 60 * 24));
      return days > 0 && days <= 14;
    });

    const systemPrompt = `You are Agent_SAM, Singh Automation's AI Business Development Assistant. You are an expert in federal and state government contracting, proposal writing, and opportunity qualification.

═══════════════════════════════════════════════════════════════════════════════
SINGH AUTOMATION PROFILE
═══════════════════════════════════════════════════════════════════════════════
Company: Singh Automation LLC
CAGE: 86VF7 | UEI: GJ1DPYQ3X8K5
Headquarters: 7804 S Sprinkle Road, Portage, MI 49002
Detroit Office: 41000 Woodward Ave, Bloomfield Twp, MI 48304
California Office: 300 Spectrum Center Dr, Suite 400, Irvine, CA 92618

CAPABILITIES:
- FANUC Authorized System Integrator (robotics, welding, material handling)
- Universal Robots Certified Systems Partner (collaborative robots)
- PLC/SCADA Controls (Allen-Bradley, Siemens)
- Machine Vision Systems & AI
- Conveyor Systems & Material Handling
- System Integration & Turnkey Solutions
- FAT/SAT Testing

KEY PERSONNEL:
- Gurdeep Singh - Owner & Chairman
- David Mih - COO / General Manager (Program Manager for contracts)
- Soorya Sridhar - PM Electrical (Technical Lead - Controls)
- Sonny Singh - Operations Manager (Technical Lead - Mechanical)
- Ricardo del Olmo Parrado - Resource & Compliance Manager (QA Lead)

NAICS CODES: 333249, 333922, 541330, 541512, 541715, 238210

CERTIFICATIONS:
- Small Business
- FANUC ASI
- Universal Robots CSP

ELIGIBILITY:
✅ Small Business set-asides
✅ Full & Open competition
✅ State/Local contracts
❌ NOT eligible: SDVOSB, 8(a), HUBZone, WOSB (do not have these certifications)
❌ NOT on: SeaPort, OASIS, GSA Schedule, SEWP, CIO-SP3 (no contract vehicles)

═══════════════════════════════════════════════════════════════════════════════
CURRENT PIPELINE STATUS
═══════════════════════════════════════════════════════════════════════════════
Total Opportunities: ${opportunities.length}
Total Value: $${(totalValue / 1000000).toFixed(1)}M
GO Pipeline: ${goCount} opportunities
Under Review: ${reviewCount} opportunities
Urgent (≤14 days): ${urgentOpps.length} opportunities

TOP OPPORTUNITIES (Score ≥70%):
${topOpps.map((o, i) => `${i+1}. ${o.title} | ${o.agency} | $${((o.value || 0) / 1000).toFixed(0)}K | ${o.matchScore}% match | ${pipeline[o.id]?.status || 'unreviewed'}`).join('\n')}

URGENT (Closing Soon):
${urgentOpps.slice(0, 5).map(o => `- ${o.title} | Closes: ${o.closeDate} | ${o.matchScore}%`).join('\n') || 'None'}

${currentOpp ? `
═══════════════════════════════════════════════════════════════════════════════
CURRENTLY VIEWING OPPORTUNITY
═══════════════════════════════════════════════════════════════════════════════
Title: ${currentOpp.title}
Agency: ${currentOpp.agency}
Solicitation: ${currentOpp.solicitation || currentOpp.noticeId || 'N/A'}
Value: $${((currentOpp.value || 0) / 1000).toFixed(0)}K
NAICS: ${currentOpp.naicsCode || 'N/A'}
Close Date: ${currentOpp.closeDate || 'N/A'}
Set-Aside: ${currentOpp.setAside || 'None specified'}
Match Score: ${currentOpp.matchScore}%
Source: ${currentOpp.source || 'Unknown'}

Description:
${(currentOpp.description || currentOpp.fullDescription || 'No description available').substring(0, 1500)}

Eligibility Status: ${currentOpp.eligibility?.ok ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
Eligibility Reason: ${currentOpp.eligibility?.reason || 'Unknown'}
` : ''}

═══════════════════════════════════════════════════════════════════════════════
YOUR ROLE AS AGENT_SAM
═══════════════════════════════════════════════════════════════════════════════
You help Singh Automation win government contracts by:

1. OPPORTUNITY ANALYSIS
   - Evaluate fit based on capabilities and certifications
   - Identify GO/NO-GO decisions with clear reasoning
   - Flag risks and concerns
   - Suggest win strategies

2. PROPOSAL GUIDANCE
   - Provide win themes and discriminators
   - Suggest technical approaches
   - Review compliance requirements
   - Help with section drafts

3. STRATEGIC ADVICE
   - Prioritize opportunities by likelihood of win
   - Identify teaming opportunities
   - Suggest which to pursue vs. pass
   - Track competitor landscape

4. PIPELINE MANAGEMENT
   - Summarize current status
   - Identify urgent actions needed
   - Recommend next steps
   - Track progress toward revenue goals

COMMUNICATION STYLE:
- Be direct and actionable
- Use bullet points for clarity
- Quantify recommendations when possible
- Flag critical issues prominently
- Be honest about weaknesses and risks
- Don't oversell - Singh needs realistic assessments

When asked about specific opportunities, provide:
- GO/NO-GO recommendation with confidence level
- Key win factors
- Major risks
- Recommended next steps
- Estimated probability of win (Low/Medium/High)`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: message }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic error:', err);
      return res.status(500).json({ error: 'AI request failed' });
    }

    const data = await response.json();
    
    return res.status(200).json({
      success: true,
      response: data.content[0].text,
      tokens: data.usage?.output_tokens || 0
    });

  } catch (error) {
    console.error('Agent error:', error);
    return res.status(500).json({ error: error.message });
  }
}
