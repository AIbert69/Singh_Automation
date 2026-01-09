// /api/daily-report.js
// Agent_SAM Daily Email Report Generator
// Analyzes opportunities and sends formatted HTML email summary

export default async function handler(req, res) {
    const startTime = Date.now();
    const requestId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // CORS
    const allowedOrigins = ['https://singh-automation.vercel.app', 'https://singhautomation.com', 'http://localhost:3000'];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin) || (origin && origin.includes('singh-automation'))) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (!ANTHROPIC_API_KEY) {
        return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
    }

    try {
        const { opportunities, sendEmail = false, recipientEmail } = req.body;

        if (!opportunities || !Array.isArray(opportunities)) {
            return res.status(400).json({ error: 'opportunities array required' });
        }

        // ═══════════════════════════════════════════════════════════════════
        // AGENT_SAM EMAIL REPORT SYSTEM PROMPT
        // ═══════════════════════════════════════════════════════════════════
        const systemPrompt = `You are Agent_SAM, the Senior Business Development Lead for Singh Automation LLC.

COMPANY PROFILE:
- Woman-Owned Small Business (WOSB) & Minority Business Enterprise (MBE)
- FANUC Authorized System Integrator
- CAGE: 86VF7 | UEI: GJ1DPYQ3X8K5
- Locations: Kalamazoo, MI (HQ) | Irvine, CA (Sales)

YOUR GOAL:
Analyze the incoming government solicitations and generate a clean, HTML-formatted email summary for the Director (Albert). Be decisive - recommend GO or WATCH for each relevant opportunity.

═══════════════════════════════════════════════════════════════════════════════
MATCH CRITERIA
═══════════════════════════════════════════════════════════════════════════════

PRIMARY MATCHES (High Priority - Include in PRIORITY ACTIONS):
• Robotics (FANUC, Yaskawa, ABB, KUKA, Universal Robots)
• Industrial Automation & Systems Integration
• Robotic Welding Cells (NOT manual welding services)
• PLC / SCADA / HMI / Controls Engineering
• Conveyor Systems & Material Handling
• Machine Vision / AI Vision Systems
• Warehouse Automation / AMR / AGV
• Factory Modernization / Retrofit

SINGH THERMAL SYSTEMS MATCHES (Also High Priority):
• Industrial Insulation (hot runner, barrel, thermal)
• Injection Molding Equipment
• Foam Manufacturing
• Battery Thermal Management

NAICS CODES (These are automatic matches):
333249 - Industrial Machinery (PRIMARY)
333922 - Conveyor Equipment
541330 - Engineering Services
541512 - Computer Systems Design
541715 - R&D Services
333248 - Plastics Machinery
326150 - Foam Products
333511 - Industrial Mold Manufacturing

MEDIUM PRIORITY (Include in WATCH LIST):
• Large prime contracts with automation scope (subcontracting potential)
• DoD depot maintenance with modernization language
• DLA Distribution (SP3300) - any material handling
• Navy Shipyard (NAVSEA) maintenance
• Opportunities requiring GSA Schedule we don't have (note this)

═══════════════════════════════════════════════════════════════════════════════
AUTOMATIC REJECT (Do NOT include - just count for archive report):
═══════════════════════════════════════════════════════════════════════════════
• Commodity Supplies (gases, office supplies, janitorial, paper)
• Pure Construction (roofing, paving, HVAC) unless SCADA/controls mentioned
• Medical / Surgical / Pharmaceutical
• IT Hardware/Software (laptops, licenses) unless controls-related
• Staffing/HR services (unless technical engineering)
• Food Services / Catering
• Vehicle Fleet (unless automation/robotics mentioned)
• Grounds Maintenance / Landscaping
• Security Guard Services
• Manual Welding Services (NOT robotic)
• Set-asides we don't qualify for: SDVOSB, 8(a), HUBZone

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

Return ONLY the HTML code for the email body. Do not include markdown code blocks.
Start directly with the HTML content.

Use this exact structure:

<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 700px; margin: 0 auto; background: #0f1419; color: #ffffff; padding: 20px; border-radius: 12px;">

  <div style="text-align: center; padding-bottom: 15px; border-bottom: 1px solid #2d3748;">
    <h2 style="color: #10b981; margin: 0;">🤖 Agent_SAM Daily Intel Brief</h2>
    <p style="color: #6b7280; margin: 5px 0;">[Today's Date]</p>
  </div>

  <div style="background: #1a2332; padding: 15px; border-radius: 8px; margin: 15px 0;">
    <p style="margin: 0;"><b>📊 Summary:</b> Found <span style="color: #10b981;">[X] High-Value Leads</span> | <span style="color: #f59e0b;">[Y] Watch List</span> | Filtered <span style="color: #6b7280;">[Z] Junk</span></p>
  </div>

  <h3 style="color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 8px;">✅ PRIORITY ACTIONS</h3>

  [For each priority opportunity:]
  <div style="background: #1a2332; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #10b981;">
    <b style="font-size: 16px;">[Title]</b><br>
    <span style="background: #10b981; color: #000; padding: 2px 8px; border-radius: 4px; font-size: 12px;">Match: [XX]%</span>
    <span style="color: #6b7280;"> | [Agency] | [Value if known]</span><br>
    <p style="color: #9ca3af; margin: 8px 0;"><i>Why: [1 sentence explaining fit]</i></p>
    <p style="margin: 5px 0;"><b>NAICS:</b> [Code] | <b>Set-Aside:</b> [Type] | <b>Deadline:</b> [Date]</p>
    <a href="[SAM.gov link or notice ID]" style="color: #3b82f6;">View Opportunity →</a>
  </div>

  <h3 style="color: #f59e0b; border-bottom: 2px solid #f59e0b; padding-bottom: 8px;">⚠️ WATCH LIST</h3>

  [For each watch list item - same format but with orange border-left color #f59e0b]

  <hr style="border: none; border-top: 1px solid #2d3748; margin: 20px 0;">

  <div style="background: #1a1a1a; padding: 12px; border-radius: 8px; font-size: 12px; color: #6b7280;">
    <b>🗑️ Auto-Archive Report:</b> Filtered [X] solicitations<br>
    <i>Reasons: [List top 3-5 rejection categories, e.g., "Medical Supplies (12), Janitorial (8), Construction (5)"]</i><br><br>
    <span style="color: #10b981;">● Agent_SAM Online</span> | Singh Automation BD Assistant
  </div>

</div>

IMPORTANT RULES:
1. Be concise - 1 sentence max for "Why" explanations
2. Include SAM.gov links when notice IDs are available: https://sam.gov/opp/[noticeId]/view
3. Score opportunities 1-100 based on keyword/NAICS match
4. If no priority opportunities found, say "No high-priority matches today. Pipeline remains [X] opportunities."
5. Always provide actionable intel - what should Albert do?`;

        // ═══════════════════════════════════════════════════════════════════
        // CALL CLAUDE API
        // ═══════════════════════════════════════════════════════════════════
        const today = new Date().toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });

        const userMessage = `Today's Date: ${today}

Here are ${opportunities.length} raw solicitations to analyze:

${JSON.stringify(opportunities, null, 2)}

Generate the HTML email report. Remember:
- PRIORITY ACTIONS = Direct matches for Singh
- WATCH LIST = Subcontracting potential or partial matches
- Count and categorize rejections for the archive report
- Be decisive with GO recommendations`;

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
                messages: [{ role: 'user', content: userMessage }]
            })
        });

        if (!response.ok) {
            const err = await response.text();
            console.error('Claude API error:', err);
            return res.status(500).json({ error: 'AI report generation failed', details: err });
        }

        const data = await response.json();
        const emailHtml = data.content[0].text;

        // ═══════════════════════════════════════════════════════════════════
        // SEND EMAIL (if requested and Resend configured)
        // ═══════════════════════════════════════════════════════════════════
        let emailResult = null;

        if (sendEmail && RESEND_API_KEY) {
            const recipient = recipientEmail || 'albert@singhautomation.com';

            try {
                const emailResponse = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${RESEND_API_KEY}`
                    },
                    body: JSON.stringify({
                        from: 'Agent_SAM <onboarding@resend.dev>',
                        to: [recipient],
                        subject: `🤖 Daily Opportunity Scan: ${new Date().toLocaleDateString()}`,
                        html: emailHtml
                    })
                });

                if (emailResponse.ok) {
                    emailResult = { sent: true, to: recipient };
                } else {
                    const emailErr = await emailResponse.text();
                    emailResult = { sent: false, error: emailErr };
                }
            } catch (emailError) {
                emailResult = { sent: false, error: emailError.message };
            }
        }

        const latencyMs = Date.now() - startTime;

        return res.status(200).json({
            success: true,
            requestId,
            report: emailHtml,
            email: emailResult,
            stats: {
                opportunitiesAnalyzed: opportunities.length,
                latencyMs
            }
        });

    } catch (error) {
        console.error('Daily report error:', error);
        return res.status(500).json({
            error: error.message,
            requestId
        });
    }
}
