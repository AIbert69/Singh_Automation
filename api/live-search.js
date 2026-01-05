// Singh Automation AgentSam LIVE Contract Scanner
// Real-time SAM.gov search with AI scoring engine
// Deploy to: /api/live-search.js on Vercel

export default async function handler(req, res) {
    const startTime = Date.now();
    const requestId = `live_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const log = (level, message, data = {}) => {
        console.log(JSON.stringify({ level, requestId, timestamp: new Date().toISOString(), message, ...data }));
    };

    log('info', 'AgentSam Live Search started');

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

    // ========== SINGH AUTOMATION COMPANY PROFILE ==========
    const companyProfile = {
        name: 'Singh Automation LLC',
        cage: '86VF7',
        uei: 'GJ1DPYQ3X8K5',
        contact: 'albert@singhautomation.com',

        // Target NAICS codes
        naicsCodes: ['333249', '333922', '541330', '541512', '541715', '238210'],

        // Target keywords (weighted)
        keywords: [
            { term: 'robotics', weight: 5 },
            { term: 'robot', weight: 5 },
            { term: 'automation', weight: 5 },
            { term: 'material handling', weight: 5 },
            { term: 'vision system', weight: 5 },
            { term: 'machine vision', weight: 5 },
            { term: 'PLC', weight: 5 },
            { term: 'SCADA', weight: 5 },
            { term: 'HMI', weight: 4 },
            { term: 'FANUC', weight: 5 },
            { term: 'ABB', weight: 4 },
            { term: 'KUKA', weight: 4 },
            { term: 'Yaskawa', weight: 4 },
            { term: 'conveyor', weight: 5 },
            { term: 'factory modernization', weight: 5 },
            { term: 'controls', weight: 4 },
            { term: 'industrial', weight: 3 },
            { term: 'manufacturing', weight: 3 },
            { term: 'welding', weight: 5 },
            { term: 'palletizer', weight: 5 },
            { term: 'integrator', weight: 5 },
            { term: 'control panel', weight: 5 },
            { term: 'servo', weight: 4 },
            { term: 'VFD', weight: 4 },
            { term: 'Allen-Bradley', weight: 5 },
            { term: 'Rockwell', weight: 5 },
            { term: 'Siemens', weight: 4 },
        ],

        // Priority agencies
        priorityAgencies: [
            'DLA', 'Defense Logistics Agency',
            'DOD', 'Department of Defense',
            'Army', 'Department of the Army', 'US Army',
            'Navy', 'Department of the Navy', 'US Navy', 'NAVSEA', 'NAVAIR',
            'Air Force', 'Department of the Air Force', 'USAF',
            'NASA', 'National Aeronautics',
            'DOE', 'Department of Energy',
            'GSA', 'General Services Administration',
        ],

        // Value range
        minValue: 25000,
        maxValue: 5000000,
    };

    // ========== SCORING ENGINE ==========
    function scoreOpportunity(opp) {
        let score = 0;
        const matchReasons = [];
        const breakdown = {
            naics: 0,
            keywords: 0,
            agency: 0,
            value: 0,
            setAside: 0,
        };

        const title = (opp.title || '').toLowerCase();
        const description = (opp.description || '').toLowerCase();
        const fullText = `${title} ${description}`;
        const agency = (opp.agency || opp.fullParentPathName || opp.departmentName || '').toLowerCase();

        // 1. NAICS Code Match (25 points)
        if (opp.naicsCode && companyProfile.naicsCodes.includes(opp.naicsCode)) {
            score += 25;
            breakdown.naics = 25;
            matchReasons.push(`NAICS ${opp.naicsCode} match`);
        }

        // 2. Keyword Matches (up to 35 points, 5 per hit, capped at 7 hits)
        const keywordHits = [];
        let keywordScore = 0;
        for (const kw of companyProfile.keywords) {
            if (fullText.includes(kw.term.toLowerCase())) {
                if (keywordScore < 35) {
                    keywordScore += kw.weight;
                    keywordHits.push(kw.term);
                }
            }
        }
        keywordScore = Math.min(keywordScore, 35);
        score += keywordScore;
        breakdown.keywords = keywordScore;
        if (keywordHits.length > 0) {
            matchReasons.push(`Keywords: ${keywordHits.slice(0, 5).join(', ')}${keywordHits.length > 5 ? '...' : ''}`);
        }

        // 3. Priority Agency (15 points)
        const isPriorityAgency = companyProfile.priorityAgencies.some(a => agency.includes(a.toLowerCase()));
        if (isPriorityAgency) {
            score += 15;
            breakdown.agency = 15;
            matchReasons.push('Priority agency (DoD/NASA/DLA)');
        }

        // 4. Value in Range $25K-$5M (15 points)
        const value = parseFloat(opp.award?.amount) || parseFloat(opp.estimatedValue) || 0;
        if (value >= companyProfile.minValue && value <= companyProfile.maxValue) {
            score += 15;
            breakdown.value = 15;
            matchReasons.push(`Value in range: $${(value/1000).toFixed(0)}K`);
        } else if (value === 0) {
            // Unknown value - give partial credit
            score += 5;
            breakdown.value = 5;
        }

        // 5. Small Business Set-Aside (10 points)
        const setAside = (opp.typeOfSetAsideDescription || opp.setAside || '').toLowerCase();
        const smallBusinessSetAsides = ['small business', 'total small', 'sba', 'emerging small'];
        if (smallBusinessSetAsides.some(sa => setAside.includes(sa))) {
            score += 10;
            breakdown.setAside = 10;
            matchReasons.push('Small Business set-aside');
        }

        // Determine recommendation
        let recommendation;
        let recommendationColor;
        if (score >= 65) {
            recommendation = 'PURSUE';
            recommendationColor = '#22c55e'; // green
        } else if (score >= 40) {
            recommendation = 'WATCH';
            recommendationColor = '#f59e0b'; // amber
        } else {
            recommendation = 'SKIP';
            recommendationColor = '#ef4444'; // red
        }

        return {
            score,
            recommendation,
            recommendationColor,
            matchReasons,
            breakdown,
        };
    }

    // ========== SAM.GOV API SEARCH ==========
    const SAM_KEY = process.env.SAM_API_KEY || 'DEMO_KEY';

    // Get search parameters from query
    const {
        keywords = '',
        naics = '',
        days = '60',
        limit = '100',
    } = req.query;

    // Build date range
    const today = new Date();
    const ago = new Date(today);
    ago.setDate(ago.getDate() - parseInt(days));
    const fmt = d => `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}/${d.getFullYear()}`;

    // Search terms - use provided or defaults
    const searchKeywords = keywords ? keywords.split(',') : [
        'robotics', 'automation', 'material handling', 'PLC', 'SCADA',
        'FANUC', 'conveyor', 'factory modernization', 'robot', 'vision system'
    ];

    const searchNaics = naics ? naics.split(',') : companyProfile.naicsCodes;

    const allOpportunities = [];
    const seenIds = new Set();
    const errors = [];

    // Helper function to fetch with timeout
    const fetchWithTimeout = async (url, label, timeoutMs = 10000) => {
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

    // Search by keywords
    log('info', 'Searching SAM.gov by keywords', { keywords: searchKeywords });

    const keywordSearches = searchKeywords.slice(0, 5).map(kw => ({
        url: `https://api.sam.gov/opportunities/v2/search?api_key=${SAM_KEY}&keyword=${encodeURIComponent(kw)}&postedFrom=${encodeURIComponent(fmt(ago))}&postedTo=${encodeURIComponent(fmt(today))}&limit=50`,
        label: `Keyword:${kw}`,
    }));

    // Search by NAICS codes
    log('info', 'Searching SAM.gov by NAICS', { naics: searchNaics });

    const naicsSearches = searchNaics.slice(0, 3).map(code => ({
        url: `https://api.sam.gov/opportunities/v2/search?api_key=${SAM_KEY}&naics=${encodeURIComponent(code)}&postedFrom=${encodeURIComponent(fmt(ago))}&postedTo=${encodeURIComponent(fmt(today))}&limit=50`,
        label: `NAICS:${code}`,
    }));

    // Execute all searches in parallel
    const allSearches = [...keywordSearches, ...naicsSearches];
    const results = await Promise.all(
        allSearches.map(({ url, label }) => fetchWithTimeout(url, label))
    );

    // Process results
    for (const data of results) {
        if (!data?.opportunitiesData) continue;

        for (const opp of data.opportunitiesData) {
            if (seenIds.has(opp.noticeId)) continue;
            seenIds.add(opp.noticeId);

            // Extract contact info
            let contact = null;
            if (opp.pointOfContact?.length > 0) {
                const poc = opp.pointOfContact[0];
                contact = {
                    name: poc.fullName || `${poc.firstName || ''} ${poc.lastName || ''}`.trim(),
                    email: poc.email,
                    phone: poc.phone,
                };
            }

            // Build opportunity object
            const opportunity = {
                id: opp.noticeId,
                title: opp.title || 'Untitled',
                solicitationNumber: opp.solicitationNumber || opp.noticeId,
                agency: opp.fullParentPathName || opp.departmentName || 'Federal Agency',
                subAgency: opp.organizationName || null,
                postedDate: opp.postedDate,
                responseDeadline: opp.responseDeadLine,
                naicsCode: opp.naicsCode || '',
                naicsDescription: opp.naicsDescription || '',
                classificationCode: opp.classificationCode || '',
                setAside: opp.typeOfSetAsideDescription || 'Full and Open',
                type: opp.type || opp.baseType || 'Solicitation',
                estimatedValue: opp.award?.amount || null,
                placeOfPerformance: opp.placeOfPerformance?.city?.name
                    ? `${opp.placeOfPerformance.city.name}, ${opp.placeOfPerformance.state?.code || ''}`
                    : opp.officeAddress || null,
                description: opp.description?.substring(0, 2000) || '',
                link: `https://sam.gov/opp/${opp.noticeId}/view`,
                contact,
                isActive: opp.active !== false,
            };

            // Score the opportunity
            const scoring = scoreOpportunity(opportunity);
            opportunity.score = scoring.score;
            opportunity.recommendation = scoring.recommendation;
            opportunity.recommendationColor = scoring.recommendationColor;
            opportunity.matchReasons = scoring.matchReasons;
            opportunity.scoreBreakdown = scoring.breakdown;

            allOpportunities.push(opportunity);
        }
    }

    // Sort by score (highest first)
    allOpportunities.sort((a, b) => b.score - a.score);

    // Apply limit
    const limitedResults = allOpportunities.slice(0, parseInt(limit));

    // Calculate stats
    const stats = {
        total: limitedResults.length,
        pursue: limitedResults.filter(o => o.recommendation === 'PURSUE').length,
        watch: limitedResults.filter(o => o.recommendation === 'WATCH').length,
        skip: limitedResults.filter(o => o.recommendation === 'SKIP').length,
        avgScore: limitedResults.length > 0
            ? Math.round(limitedResults.reduce((sum, o) => sum + o.score, 0) / limitedResults.length)
            : 0,
        topAgencies: [...new Set(limitedResults.slice(0, 20).map(o => o.agency))].slice(0, 5),
        searchedKeywords: searchKeywords,
        searchedNaics: searchNaics,
        dateRange: { from: fmt(ago), to: fmt(today) },
    };

    const totalTime = Date.now() - startTime;
    log('info', 'Live search complete', { stats, totalTime });

    return res.status(200).json({
        success: true,
        requestId,
        timestamp: new Date().toISOString(),
        latencyMs: totalTime,
        stats,
        companyProfile: {
            name: companyProfile.name,
            cage: companyProfile.cage,
            uei: companyProfile.uei,
        },
        opportunities: limitedResults,
    });
}
