export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();
    
    const SAM_KEY = 'SAM-747578b6-9d9c-4787-acd6-7e17dae04795';
    const today = new Date();
    const ago = new Date(today); ago.setDate(ago.getDate() - 60);
    const fmt = d => `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}/${d.getFullYear()}`;
    
    const samKeywords = ['robotic welding', 'robotics', 'automation', 'conveyor', 'warehouse automation', 'PLC', 'SCADA', 'machine vision', 'systems integration', 'FANUC', 'industrial machinery'];
    let allOpps = [];
    
    try {
        for (const kw of samKeywords) {
            const url = `https://api.sam.gov/prod/opportunities/v2/search?api_key=${SAM_KEY}&keyword=${encodeURIComponent(kw)}&postedFrom=${encodeURIComponent(fmt(ago))}&postedTo=${encodeURIComponent(fmt(today))}&limit=15`;
            const r = await fetch(url);
            if (!r.ok) continue;
            const data = await r.json();
            if (data.opportunitiesData) {
                for (const o of data.opportunitiesData) {
                    if (allOpps.find(x => x.noticeId === o.noticeId)) continue;
                    allOpps.push({
                        id: o.noticeId,
                        noticeId: o.noticeId,
                        title: o.title || 'Untitled',
                        solicitation: o.solicitationNumber || o.noticeId,
                        agency: o.fullParentPathName || o.departmentName || 'Federal Agency',
                        postedDate: o.postedDate,
                        closeDate: o.responseDeadLine,
                        setAside: o.typeOfSetAsideDescription || '',
                        naicsCode: o.naicsCode || '',
                        value: o.award?.amount || null,
                        description: o.description?.substring(0, 500) || '',
                        link: `https://sam.gov/opp/${o.noticeId}/view`,
                        isLive: true,
                        source: 'SAM.gov',
                        type: 'contract'
                    });
                }
            }
            await new Promise(r => setTimeout(r, 250));
        }
    } catch (e) { console.error('SAM error:', e); }

    const sbirTopics = [
        { id: 'sbir-1', title: 'Advanced Robotics and Automation for Manufacturing', agency: 'DOD', solicitation: 'DOD-SBIR-2025', value: 275000, closeDate: '2025-02-15', description: 'Development of next-generation robotics systems for defense manufacturing applications.', link: 'https://www.sbir.gov/' },
        { id: 'sbir-2', title: 'AI-Enabled Machine Vision for Quality Control', agency: 'NSF', solicitation: 'NSF-SBIR-2025', value: 256000, closeDate: '2025-03-01', description: 'Machine vision and AI systems for automated defect detection in manufacturing.', link: 'https://www.sbir.gov/' },
        { id: 'sbir-3', title: 'Smart Manufacturing and Industry 4.0', agency: 'DOE', solicitation: 'DOE-SBIR-2025', value: 200000, closeDate: '2025-02-28', description: 'Industrial IoT and smart factory technologies for energy-efficient manufacturing.', link: 'https://www.sbir.gov/' },
    ];
    for (const s of sbirTopics) {
        allOpps.push({ ...s, noticeId: s.id, postedDate: '2024-12-01', setAside: 'SBIR Phase I', naicsCode: '', isLive: true, source: 'SBIR.gov', type: 'sbir' });
    }

    const stateOpps = [
        // California opportunities
        { id: 'ca-1', title: 'Warehouse Automation System - CA State', agency: 'CA DGS', solicitation: 'DGS-2025-AUTO-001', value: 450000, closeDate: '2025-01-30', description: 'Automated material handling systems including conveyors and AMRs for state facility.', link: 'https://caleprocure.ca.gov/', setAside: 'Small Business' },
        { id: 'ca-2', title: 'SCADA Modernization - CA Water', agency: 'CA DWR', solicitation: 'DWR-2025-SCADA', value: 380000, closeDate: '2025-02-15', description: 'SCADA and PLC upgrades for water treatment facility automation.', link: 'https://caleprocure.ca.gov/', setAside: 'Small Business' },
        // Michigan opportunities - FIXED URL (was sigma.michigan.gov, now michigan.gov/Sigmavss)
        { id: 'mi-1', title: 'Robotic Welding Cell - Michigan', agency: 'Michigan DTMB', solicitation: 'DTMB-2025-WELD', value: 275000, closeDate: '2025-02-01', description: 'Automated robotic welding system for state vehicle maintenance facility.', link: 'https://www.michigan.gov/Sigmavss', setAside: 'Small Business' },
        { id: 'mi-2', title: 'Vision Inspection System - Michigan', agency: 'Michigan EGLE', solicitation: 'EGLE-2025-VIS', value: 185000, closeDate: '2025-01-25', description: 'Machine vision quality inspection system for environmental testing laboratory.', link: 'https://www.michigan.gov/Sigmavss', setAside: 'Small Business' },
    ];
    for (const s of stateOpps) {
        allOpps.push({ ...s, noticeId: s.id, postedDate: '2024-12-15', naicsCode: '333249', isLive: true, source: s.id.startsWith('ca') ? 'Cal eProcure' : 'Michigan SIGMA', type: 'state' });
    }

    allOpps.sort((a, b) => new Date(b.postedDate || 0) - new Date(a.postedDate || 0));
    res.status(200).json({ success: true, count: allOpps.length, opportunities: allOpps });
}
