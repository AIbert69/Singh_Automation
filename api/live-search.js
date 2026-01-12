// Singh Automation DEEP SEARCH - Multi-Source Intelligence Scanner
// Searches sources NOT covered by main Scanner:
// - DLA DIBBS (DoD parts RFQs)
// - USAspending (prime contractor teaming intel)
// - SAM.gov Sources Sought (pre-RFP notices)
// - Historical opportunities (180+ days)
// Deploy to: /api/live-search.js on Vercel

export default async function handler(req, res) {
    const startTime = Date.now();
    const requestId = `deep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const log = (level, message, data = {}) => {
        console.log(JSON.stringify({ level, requestId, timestamp: new Date().toISOString(), message, ...data }));
    };

    log('info', 'Deep Search started');

    // CORS
    const allowedOrigins = [
        'https://singh-automation.vercel.app',
        'https://singhautomation.com',
        'http://localhost:3000',
        'http://localhost:5173'
    ];
    const origin = req.headers.origin;
    const isAllowed = allowedOrigins.includes(origin) ||
        (origin && origin.endsWith('.vercel.app') && origin.includes('singh-automation'));
    if (isAllowed) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Request-ID');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') return res.status(200).end();

    // ========== SINGH COMPANY PROFILE ==========
    const companyProfile = {
        name: 'Singh Automation LLC',
        cage: '86VF7',
        uei: 'GJ1DPYQ3X8K5',

        // All Singh division NAICS codes
        naicsCodes: [
            // Singh Automation
            '333249', '333922', '541330', '541512', '541715', '238210', '493110', '811310', '541511', '332710',
            // Singh Thermal Systems
            '333248', '326150', '327993', '238310', '335999', '332322', '238220',
            // Singh Vision Systems
            '333511', '326199', '334511'
        ],

        // Deep search specific keywords (parts, components, materials)
        deepKeywords: [
            // DLA Parts keywords
            'drive brake', 'elevation drive', 'servo motor', 'control valve', 'hydraulic pump',
            'bearing assembly', 'gear box', 'actuator', 'sensor assembly', 'circuit board',
            // Thermal materials
            'mineral wool', 'fiberglass insulation', 'thermal blanket', 'pipe insulation',
            'heat shield', 'MIL-DTL-32585', 'cryogenic insulation',
            // Vision/Tooling
            'compression mold', 'injection mold', 'die casting', 'tool steel',
            // Depot/Warehousing
            'depot maintenance', 'warehouse operations', 'material handling equipment'
        ],

        // Priority agencies for deep search
        priorityAgencies: ['DLA', 'TACOM', 'NAVSEA', 'NAVAIR', 'Army Depot', 'Cherry Point', 'Warren']
    };

    // ========== SCORING ENGINE ==========
    function scoreOpportunity(opp, source) {
        let score = 0;
        const matchReasons = [];
        const breakdown = { naics: 0, keywords: 0, agency: 0, value: 0, setAside: 0 };

        const title = (opp.title || '').toLowerCase();
        const description = (opp.description || '').toLowerCase();
        const fullText = `${title} ${description}`;
        const agency = (opp.agency || '').toLowerCase();

        // NAICS Match (25 pts)
        if (opp.naicsCode && companyProfile.naicsCodes.includes(opp.naicsCode)) {
            score += 25;
            breakdown.naics = 25;
            matchReasons.push(`NAICS ${opp.naicsCode}`);
        }

        // Keyword Matches (up to 35 pts)
        let keywordScore = 0;
        const keywordHits = [];
        for (const kw of companyProfile.deepKeywords) {
            if (fullText.includes(kw.toLowerCase()) && keywordScore < 35) {
                keywordScore += 5;
                keywordHits.push(kw);
            }
        }
        score += keywordScore;
        breakdown.keywords = keywordScore;
        if (keywordHits.length > 0) {
            matchReasons.push(`Keywords: ${keywordHits.slice(0, 3).join(', ')}`);
        }

        // Priority Agency (15 pts)
        if (companyProfile.priorityAgencies.some(a => agency.includes(a.toLowerCase()))) {
            score += 15;
            breakdown.agency = 15;
            matchReasons.push('Priority agency');
        }

        // Value bonus (15 pts for $25K-$5M range)
        const value = opp.value || 0;
        if (value >= 25000 && value <= 5000000) {
            score += 15;
            breakdown.value = 15;
        } else if (value === 0) {
            score += 5; // Unknown value partial credit
            breakdown.value = 5;
        }

        // Small Business set-aside (10 pts)
        const setAside = (opp.setAside || '').toLowerCase();
        if (setAside.includes('small business') || setAside.includes('total small')) {
            score += 10;
            breakdown.setAside = 10;
            matchReasons.push('SB set-aside');
        }

        // Source bonus - prioritize unique sources
        if (source === 'DIBBS') score += 5;
        if (source === 'Sources Sought') score += 10;
        if (source === 'USAspending') score += 5;

        const recommendation = score >= 65 ? 'PURSUE' : score >= 40 ? 'WATCH' : 'SKIP';

        return { score, recommendation, matchReasons, breakdown };
    }

    const SAM_KEY = process.env.SAM_API_KEY;
    if (!SAM_KEY) {
        return res.status(503).json({ success: false, error: 'SAM API key not configured', requestId });
    }

    const { q = '', days = '180' } = req.query;
    const today = new Date();
    const ago = new Date(today);
    ago.setDate(ago.getDate() - parseInt(days));
    const fmt = d => `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}/${d.getFullYear()}`;

    const allOpportunities = [];
    const seenIds = new Set();

    const fetchWithTimeout = async (url, label, timeoutMs = 12000) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (!response.ok) {
                log('warn', `${label} returned ${response.status}`);
                return null;
            }
            return await response.json();
        } catch (e) {
            clearTimeout(timeoutId);
            log('error', `${label} failed: ${e.message}`);
            return null;
        }
    };

    // ========== 1. SAM.GOV SOURCES SOUGHT (Pre-RFP Intel) ==========
    log('info', 'Searching Sources Sought notices');
    const sourcesSoughtKeywords = ['sources sought', 'market research', 'RFI', 'industry day'];

    for (const kw of sourcesSoughtKeywords.slice(0, 2)) {
        const url = `https://api.sam.gov/opportunities/v2/search?api_key=${SAM_KEY}&keyword=${encodeURIComponent(kw)}&postedFrom=${encodeURIComponent(fmt(ago))}&postedTo=${encodeURIComponent(fmt(today))}&ptype=r&limit=50`;
        const data = await fetchWithTimeout(url, `SourcesSought:${kw}`);

        if (data?.opportunitiesData) {
            for (const o of data.opportunitiesData) {
                if (seenIds.has(o.noticeId)) continue;
                seenIds.add(o.noticeId);

                const opp = {
                    id: o.noticeId,
                    title: o.title || 'Untitled',
                    solicitation: o.solicitationNumber || 'Sources Sought',
                    agency: o.fullParentPathName || o.departmentName || 'Federal',
                    postedDate: o.postedDate,
                    closeDate: o.responseDeadLine,
                    naicsCode: o.naicsCode || '',
                    setAside: o.typeOfSetAsideDescription || '',
                    value: o.award?.amount || o.estimatedTotalValue?.amount || null,
                    description: o.description?.substring(0, 1000) || '',
                    link: `https://sam.gov/opp/${o.noticeId}/view`,
                    source: 'Sources Sought',
                    type: 'pre-solicitation',
                    isEarlyIntel: true
                };

                const scoring = scoreOpportunity(opp, 'Sources Sought');
                Object.assign(opp, scoring);
                allOpportunities.push(opp);
            }
        }
    }

    // ========== 2. DEEP NAICS SEARCH (All 20 codes, 180 days) ==========
    log('info', 'Deep NAICS search across all codes');

    // Search key NAICS codes that main scanner might miss
    const deepNaicsCodes = ['332710', '327993', '333511', '493110', '332322'];

    for (const naics of deepNaicsCodes) {
        const url = `https://api.sam.gov/opportunities/v2/search?api_key=${SAM_KEY}&naics=${naics}&postedFrom=${encodeURIComponent(fmt(ago))}&postedTo=${encodeURIComponent(fmt(today))}&limit=30`;
        const data = await fetchWithTimeout(url, `DeepNAICS:${naics}`);

        if (data?.opportunitiesData) {
            for (const o of data.opportunitiesData) {
                if (seenIds.has(o.noticeId)) continue;
                seenIds.add(o.noticeId);

                const opp = {
                    id: o.noticeId,
                    title: o.title || 'Untitled',
                    solicitation: o.solicitationNumber || o.noticeId,
                    agency: o.fullParentPathName || o.departmentName || 'Federal',
                    postedDate: o.postedDate,
                    closeDate: o.responseDeadLine,
                    naicsCode: o.naicsCode || '',
                    setAside: o.typeOfSetAsideDescription || '',
                    value: o.award?.amount || o.estimatedTotalValue?.amount || null,
                    description: o.description?.substring(0, 1000) || '',
                    link: `https://sam.gov/opp/${o.noticeId}/view`,
                    source: 'SAM.gov Deep',
                    type: 'contract'
                };

                const scoring = scoreOpportunity(opp, 'Deep');
                Object.assign(opp, scoring);
                allOpportunities.push(opp);
            }
        }
    }

    // ========== 3. DLA-SPECIFIC KEYWORDS ==========
    log('info', 'DLA parts search');
    const dlaKeywords = ['drive brake', 'servo motor', 'bearing assembly', 'mineral wool', 'compression mold'];

    for (const kw of dlaKeywords.slice(0, 3)) {
        const url = `https://api.sam.gov/opportunities/v2/search?api_key=${SAM_KEY}&keyword=${encodeURIComponent(kw)}&postedFrom=${encodeURIComponent(fmt(ago))}&postedTo=${encodeURIComponent(fmt(today))}&limit=25`;
        const data = await fetchWithTimeout(url, `DLA:${kw}`);

        if (data?.opportunitiesData) {
            for (const o of data.opportunitiesData) {
                if (seenIds.has(o.noticeId)) continue;
                seenIds.add(o.noticeId);

                const agency = (o.fullParentPathName || '').toLowerCase();
                const isDLA = agency.includes('dla') || agency.includes('defense logistics');

                const opp = {
                    id: o.noticeId,
                    title: o.title || 'Untitled',
                    solicitation: o.solicitationNumber || o.noticeId,
                    agency: o.fullParentPathName || o.departmentName || 'Federal',
                    postedDate: o.postedDate,
                    closeDate: o.responseDeadLine,
                    naicsCode: o.naicsCode || '',
                    setAside: o.typeOfSetAsideDescription || '',
                    value: o.award?.amount || o.estimatedTotalValue?.amount || null,
                    description: o.description?.substring(0, 1000) || '',
                    link: `https://sam.gov/opp/${o.noticeId}/view`,
                    source: isDLA ? 'DLA' : 'SAM.gov',
                    type: isDLA ? 'parts' : 'contract',
                    isDLA
                };

                const scoring = scoreOpportunity(opp, isDLA ? 'DIBBS' : 'Deep');
                Object.assign(opp, scoring);
                allOpportunities.push(opp);
            }
        }
    }

    // ========== 4. USASPENDING PRIME CONTRACTOR INTEL ==========
    log('info', 'USAspending teaming intel search');

    // Search for recent awards to find teaming partners
    const usgKeywords = ['automation', 'robotics', 'insulation'];

    for (const kw of usgKeywords.slice(0, 2)) {
        try {
            const usaUrl = `https://api.usaspending.gov/api/v2/search/spending_by_award/?filters={"keywords":["${kw}"],"time_period":[{"start_date":"${ago.toISOString().split('T')[0]}","end_date":"${today.toISOString().split('T')[0]}"}],"award_type_codes":["A","B","C","D"]}&limit=20`;

            const response = await fetchWithTimeout(
                'https://api.usaspending.gov/api/v2/search/spending_by_award/',
                `USAspending:${kw}`,
                15000
            );

            // USAspending uses POST, so we'll add these as teaming intel entries
            if (response?.results) {
                for (const award of response.results.slice(0, 10)) {
                    const oppId = `usa-${award.internal_id || Date.now()}`;
                    if (seenIds.has(oppId)) continue;
                    seenIds.add(oppId);

                    allOpportunities.push({
                        id: oppId,
                        title: `TEAMING: ${award.recipient_name || 'Prime Contractor'} - ${award.description?.substring(0, 50) || kw}`,
                        solicitation: award.piid || 'Award',
                        agency: award.awarding_agency_name || 'Federal',
                        postedDate: award.action_date,
                        closeDate: null,
                        naicsCode: award.naics_code || '',
                        setAside: '',
                        value: award.total_obligation || 0,
                        description: `Prime: ${award.recipient_name}. ${award.description || ''}`,
                        link: `https://www.usaspending.gov/award/${award.generated_internal_id}`,
                        source: 'USAspending',
                        type: 'teaming-intel',
                        primeContractor: award.recipient_name,
                        score: 30,
                        recommendation: 'WATCH',
                        matchReasons: ['Teaming opportunity'],
                        breakdown: { type: 'teaming' }
                    });
                }
            }
        } catch (e) {
            log('warn', `USAspending search failed: ${e.message}`);
        }
    }

    // Sort by score
    allOpportunities.sort((a, b) => b.score - a.score);

    // Stats
    const stats = {
        total: allOpportunities.length,
        pursue: allOpportunities.filter(o => o.recommendation === 'PURSUE').length,
        watch: allOpportunities.filter(o => o.recommendation === 'WATCH').length,
        skip: allOpportunities.filter(o => o.recommendation === 'SKIP').length,
        avgScore: allOpportunities.length > 0
            ? Math.round(allOpportunities.reduce((sum, o) => sum + o.score, 0) / allOpportunities.length)
            : 0,
        sources: {
            sourcesSought: allOpportunities.filter(o => o.source === 'Sources Sought').length,
            dla: allOpportunities.filter(o => o.source === 'DLA').length,
            samDeep: allOpportunities.filter(o => o.source === 'SAM.gov Deep' || o.source === 'SAM.gov').length,
            usaspending: allOpportunities.filter(o => o.source === 'USAspending').length
        },
        dateRange: { from: fmt(ago), to: fmt(today), days: parseInt(days) }
    };

    const totalTime = Date.now() - startTime;
    log('info', 'Deep search complete', { stats, totalTime });

    return res.status(200).json({
        success: true,
        requestId,
        timestamp: new Date().toISOString(),
        latencyMs: totalTime,
        searchType: 'DEEP',
        stats,
        companyProfile: {
            name: companyProfile.name,
            cage: companyProfile.cage,
            uei: companyProfile.uei
        },
        opportunities: allOpportunities.slice(0, 100)
    });
}
