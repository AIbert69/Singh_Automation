// /api/generate-section.js - Simple working version

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
    const { section, opportunity } = req.body;
    
    if (!section || !opportunity) {
      return res.status(400).json({ success: false, error: 'Missing section or opportunity' });
    }

    const title = opportunity.title || 'Government Contract';
    const agency = opportunity.agency || opportunity.departmentName || 'Federal Agency';
    const desc = opportunity.description || '';
    const value = opportunity.value || 'TBD';

    const prompt = `Write a ${section} section for a federal government proposal.

OPPORTUNITY:
- Title: ${title}
- Agency: ${agency}
- Description: ${desc}
- Value: ${value}

COMPANY:
- Name: Singh Automation LLC
- CAGE: 86VF7
- UEI: GJ1DPYQ3X8K5
- HQ: Kalamazoo, MI
- Capabilities: FANUC & Universal Robots Integration, AI Vision Systems, PLC/SCADA Controls, Conveyor Systems

Write professional federal proposal content with clear headers and sections.`;

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
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic error:', err);
      return res.status(500).json({ success: false, error: 'AI request failed' });
    }

    const data = await response.json();
    
    return res.status(200).json({
      success: true,
      content: data.content[0].text,
      section: section
    });

  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}
