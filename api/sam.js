export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();
    
    const API_KEY = 'SAM-747578b6-9d9c-4787-acd6-7e17dae04795';
    const today = new Date();
    const ago = new Date(today); ago.setDate(ago.getDate() - 30);
    const fmt = d => `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}/${d.getFullYear()}`;
    
    const keywords = ['robotics', 'automation', 'welding', 'PLC', 'conveyor', 'warehouse automation'];
    let opps = [];
    
    try {
        for (const kw of keywords) {
            const url = `https://api.sam.gov/prod/opportunities/v2/search?api_key=${API_KEY}&keyword=${encodeURIComponent(kw)}&postedFrom=${encodeURIComponent(fmt(ago))}&postedTo=${encodeURIComponent(fmt(today))}&limit=10`;
            const r = await fetch(url);
            if (!r.ok) continue;
            const data = await r.json();
            if (data.opportunitiesData) {
                for (const o of data.opportunitiesData) {
                    if (opps.find(x => x.noticeId === o.noticeId)) continue;
                    opps.push({
                        id: o.noticeId, noticeId: o.noticeId, title: o.title || 'Untitled',
                        solicitation: o.solicitationNumber || o.noticeId,
                        agency: o.fullParentPathName || o.departmentName || 'Federal Agency',
                        postedDate: o.postedDate, closeDate: o.responseDeadLine,
                        setAside: o.typeOfSetAsideDescription || '', naicsCode: o.naicsCode || '',
                        value: o.award?.amount || null, description: o.description?.substring(0, 500) || '',
                        link: `https://sam.gov/opp/${o.noticeId}/view`, isLive: true, source: 'SAM.gov'
                    });
                }
            }
            await new Promise(r => setTimeout(r, 300));
        }
        res.status(200).json({ success: true, count: opps.length, opportunities: opps });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
}
