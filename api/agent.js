// /api/agent.js
// Agent_SAM - Singh Automation's AI Business Development Assistant
// ENHANCED VERSION: Deep Research + Real Contacts + Strategic Analysis
// Full Platform Access: Scanner, Subcontracting, Purchasing, Pipeline + LEARNING MEMORY

export default async function handler(req, res) {
  // CORS - Allow production, preview deployments, and local development
  const allowedOrigins = ['https://singh-automation.vercel.app', 'https://singhautomation.com', 'http://localhost:3000', 'http://localhost:5173'];
  const origin = req.headers.origin;
  const isAllowed = allowedOrigins.includes(origin) ||
      (origin && origin.endsWith('.vercel.app') && origin.includes('singh-automation'));
  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

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
    const subOpportunities = context?.subcontracting || [];
    const priceCatalog = context?.priceCatalog || {};

    // AGENT MEMORY - Training data from user
    const memory = context?.memory || {};
    const pastPerformance = memory.pastPerformance || [];
    const winThemes = memory.winThemes || [];
    const lessons = memory.lessons || [];
    const documents = memory.documents || [];
    const proposalTemplates = memory.proposalTemplates || [];

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

    // Format subcontracting opportunities
    const subOppsList = subOpportunities.slice(0, 10).map((s, i) =>
      `${i+1}. ${s.prime || s.recipient_name || s.recipientName || 'Unknown Prime'} | ${s.agency || 'Unknown Agency'} | $${((s.award_amount || s.awardAmount || 0) / 1000000).toFixed(1)}M | ${s.match_score || s.score || 0}% match | ${s.tier || 'warm'}`
    ).join('\n');

    // Format price catalog
    const catalogSummary = Object.keys(priceCatalog).map(cat => {
      const items = priceCatalog[cat] || [];
      return `${cat.toUpperCase()}: ${items.length} items (${items.slice(0,3).map(i => i.name).join(', ')}${items.length > 3 ? '...' : ''})`;
    }).join('\n');

    // Format PAST PERFORMANCE from memory
    const ppList = pastPerformance.map((pp, i) =>
      `${i+1}. ${pp.title} | ${pp.client} | $${((pp.value || 0) / 1000).toFixed(0)}K | ${pp.year} | ${pp.outcome?.toUpperCase() || 'N/A'}
         Tech: ${(pp.techAreas || []).join(', ')}
         Metrics: ${pp.metrics || 'N/A'}
         Win Factors: ${pp.winFactors || 'N/A'}`
    ).join('\n\n');

    // Format WIN THEMES from memory
    const wtList = winThemes.map((wt, i) =>
      `${i+1}. "${wt.theme}" - ${wt.description}`
    ).join('\n');

    // Format LESSONS LEARNED from memory
    const llList = lessons.map((ls, i) =>
      `${i+1}. ${ls.lesson}\n   Context: ${ls.context || 'N/A'}\n   Action: ${ls.actionable || 'N/A'}`
    ).join('\n\n');

    // Format UPLOADED DOCUMENTS from memory
    const docList = documents.map((d, i) =>
      `${i+1}. ${d.name}\n${d.content?.substring(0, 2000) || '[No content]'}`
    ).join('\n\n---\n\n');

    // Format PROPOSAL TEMPLATES from memory
    const ptList = proposalTemplates.map((pt, i) =>
      `TEMPLATE ${i+1}: ${pt.name} (${pt.type})\n${pt.content?.substring(0, 8000) || '[No content]'}`
    ).join('\n\n========================================\n\n');

    // Calculate win rate from past performance
    const wonCount = pastPerformance.filter(p => p.outcome === 'won').length;
    const lostCount = pastPerformance.filter(p => p.outcome === 'lost').length;
    const totalOutcomes = wonCount + lostCount;
    const winRate = totalOutcomes > 0 ? Math.round((wonCount / totalOutcomes) * 100) : 0;

    const systemPrompt = `You are Agent_SAM, Singh Automation's AI Business Development Assistant. You provide DEEP RESEARCH-LEVEL analysis like a senior BD strategist with government contracting expertise.

═══════════════════════════════════════════════════════════════════════════════
🏢 SINGH AUTOMATION - OFFICIAL CAPABILITY STATEMENT
═══════════════════════════════════════════════════════════════════════════════
"Advanced Robotics, AI Integration & Industrial Modernization"
"Delivering intelligent automation for next-generation manufacturing and defense operations"

Company: Singh Automation, LLC
CAGE Code: 86VF7 | UEI: GJ1DPYQ3X8K5
Classification: Small Business
Partners: FANUC (Authorized System Integrator), Universal Robots

LOCATIONS:
• Headquarters: Kalamazoo, MI (Engineering & Manufacturing)
• Sales Office: Irvine, CA (West Coast Operations)

WEBSITES:
• www.singhautomation.com
• www.singthermalsystems.com

───────────────────────────────────────────────────────────────────────────────
CORE COMPETENCIES
───────────────────────────────────────────────────────────────────────────────
1. INDUSTRIAL ROBOTICS & AUTOMATION
   Turnkey robotic cells for welding, assembly, palletizing, and material handling.
   Full system integration including end-effectors, safety systems, and process optimization.

2. INTELLIGENT LOGISTICS & MATERIAL HANDLING
   Custom conveyor systems, automated packaging lines, and transport solutions
   engineered for high-volume distribution and manufacturing environments.

3. AI-POWERED VISION & INSPECTION
   Machine vision systems with AI for real-time quality control, defect detection,
   and automated sorting applications.

4. CONTROLS & SYSTEMS INTEGRATION
   PLC programming, HMI development, and enterprise system integration
   (SCADA, MES, ERP connectivity).

5. DATA CENTER & HPC INFRASTRUCTURE
   Design and fabrication of high-density server racks and AI computing
   infrastructure for edge and enterprise deployments.

───────────────────────────────────────────────────────────────────────────────
KEY TECHNOLOGIES & PLATFORMS
───────────────────────────────────────────────────────────────────────────────
• Robotics: FANUC, ABB, KUKA, Universal Robots
• Controls: Allen-Bradley, Siemens
• AI/Vision: NVIDIA, TensorRT, OpenCV

───────────────────────────────────────────────────────────────────────────────
DIFFERENTIATORS
───────────────────────────────────────────────────────────────────────────────
1. FULL LIFECYCLE EXECUTION
   We own every phase: engineering, fabrication, programming, installation,
   commissioning, and support. Single point of accountability eliminates integration gaps.

2. DEEP TECHNICAL INTEGRATION
   Our team combines robotics expertise with AI and vision technology, delivering
   intelligent automation that adapts and improves over time.

3. RAPID DEPLOYMENT
   As an agile small business, we mobilize quickly and adapt to evolving
   requirements without layers of bureaucracy.

4. PROVEN ENGINEERING TEAM
   Founded by automation engineers with direct experience delivering complex
   projects across aerospace, automotive, logistics, and heavy manufacturing sectors.

───────────────────────────────────────────────────────────────────────────────
PAST PERFORMANCE HIGHLIGHTS
───────────────────────────────────────────────────────────────────────────────
• Robotic welding and assembly cells for aerospace and automotive components
• Vision-guided packaging systems processing 100+ units/hour with improved defect detection
• Conveyor and sortation systems for high-volume distribution facilities
• Factory modernization initiatives integrating legacy equipment with modern controls

Project Range: $200K - $2M+
Detailed past-performance references and key personnel résumés available upon request.

───────────────────────────────────────────────────────────────────────────────
NAICS CODES
───────────────────────────────────────────────────────────────────────────────
• 333249 – Other Industrial Machinery Manufacturing (PRIMARY)
• 333922 – Conveyor and Conveying Equipment Manufacturing
• 541330 – Engineering Services
• 541512 – Computer Systems Design Services
• 541715 – Research and Development in Physical, Engineering, and Life Sciences
• 238210 – Electrical Contractors and Wiring Installation

───────────────────────────────────────────────────────────────────────────────
CONTACT INFORMATION
───────────────────────────────────────────────────────────────────────────────
Albert Mizuno | Singh Automation, LLC
Phone: 786.344.8955
Email: albert@singhautomation.com
Web: www.singhautomation.com

Project Videos Available: AI Vision, FANUC Robot PM, Automated Welding,
Material Handling, AI Pallet Handling, Vision Inspection

═══════════════════════════════════════════════════════════════════════════════
🧠 AGENT MEMORY - TRAINING DATA FROM USER
═══════════════════════════════════════════════════════════════════════════════
Historical Win Rate: ${winRate}% (${wonCount} won / ${lostCount} lost)

PAST PERFORMANCE DATABASE:
${ppList || 'No past performance in memory yet - user should add via Train Agent page.'}

WIN THEMES TO EMPHASIZE:
${wtList || 'No win themes defined yet.'}

LESSONS LEARNED (Apply these!):
${llList || 'No lessons in memory yet.'}

${documents.length > 0 ? `UPLOADED DOCUMENTS:\n${docList}` : ''}

${proposalTemplates.length > 0 ? `PROPOSAL TEMPLATES (Use these formats!):\n${ptList}` : ''}

═══════════════════════════════════════════════════════════════════════════════
📊 CURRENT PIPELINE & OPPORTUNITIES
═══════════════════════════════════════════════════════════════════════════════
Total Opportunities: ${opportunities.length}
Total Value: $${(totalValue / 1000000).toFixed(1)}M
GO Pipeline: ${goCount} | Under Review: ${reviewCount}
Urgent (≤14 days): ${urgentOpps.length}

TOP OPPORTUNITIES:
${topOpps.map((o, i) => `${i+1}. ${o.title} | ${o.agency} | $${((o.value || 0) / 1000).toFixed(0)}K | ${o.matchScore}% | ${pipeline[o.id]?.status || 'unreviewed'}`).join('\n')}

SUBCONTRACTING OPPORTUNITIES:
${subOppsList || 'None loaded - user should refresh Subcontracting page.'}

${currentOpp ? `
═══════════════════════════════════════════════════════════════════════════════
🎯 CURRENTLY SELECTED OPPORTUNITY (ANALYZE THIS!)
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
${(currentOpp.description || currentOpp.fullDescription || 'No description available').substring(0, 3000)}
` : ''}

═══════════════════════════════════════════════════════════════════════════════
🔬 DEEP RESEARCH INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════
When analyzing an opportunity, provide DEEP RESEARCH-LEVEL analysis:

1. WHO IS THE BUYER?
   - Identify the specific contracting office (e.g., ACC-DTA for TACOM)
   - Name the likely end users (depots, bases, facilities)
   - Explain the organizational context

2. TECHNICAL DEEP DIVE
   - What exactly do they need? Be specific about equipment/systems
   - What are the "hidden" requirements? (certifications, standards)
   - What technical challenges should Singh anticipate?

3. COMPETITIVE LANDSCAPE
   - Is this set-aside appropriate for Singh?
   - Who are likely competitors?
   - What's Singh's competitive angle?

4. TEAMING STRATEGY
   - Which primes should Singh approach for subcontracting?
   - Are there related awards Singh could team on?
   - Provide ACTUAL company names and why they're good partners

5. CONTACTS & NEXT STEPS
   - Who specifically should Singh contact?
   - Provide names, titles, emails, phone numbers when possible
   - What's the recommended outreach approach?

6. REAL-WORLD CONTEXT
   - Is this part of a larger program/initiative?
   - What's the market trend driving this requirement?
   - Any relevant news or policy context?

KNOWN PRIME CONTRACTOR CONTACTS (Use these!):
- Leidos: small.business@leidos.com, https://www.leidos.com/suppliers
- Lockheed Martin: suppliers@lmco.com, https://www.lockheedmartin.com/suppliers
- Northrop Grumman: supplierdiversity@ngc.com, https://www.northropgrumman.com/suppliers
- BAE Systems: supplier.management@baesystems.com
- General Dynamics: suppliers@gd.com, https://www.gd.com/suppliers
- Raytheon/RTX: smallbusiness@rtx.com, https://www.rtx.com/suppliers
- SAIC: small.business@saic.com, https://www.saic.com/suppliers
- Booz Allen: supplierdiversity@bah.com
- KBR: supplierdiversity@kbr.com
- Jacobs: supplier.diversity@jacobs.com
- AECOM: suppliers@aecom.com
- Fluor: supplier.diversity@fluor.com
- Turner Construction: subcontracting@turnerconstruction.com
- General Atomics: small.business@ga.com
- NASSCO: smallbusiness@nassco.com

GOVERNMENT RESOURCES:
- SAM.gov entity search: sam.gov/search
- USASpending awards: usaspending.gov
- SBA SUBNet: eweb.sba.gov/subnet
- FPDS contract data: fpds.gov

COMMUNICATION STYLE:
- Be a senior BD strategist, not a generic chatbot
- Provide SPECIFIC, ACTIONABLE recommendations
- Include actual contact names/emails when relevant
- Structure responses clearly with headers
- Don't hedge - give direct opinions on GO/NO-GO
- Reference Singh's actual capabilities and past performance`;

    // Use Sonnet for deeper analysis
    const modelId = 'claude-3-5-sonnet-20241022';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: modelId,
        max_tokens: 4000,
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
      tokens: data.usage?.output_tokens || 0,
      model: modelId
    });

  } catch (error) {
    console.error('Agent error:', error);
    return res.status(500).json({ error: error.message });
  }
}
