// Singh Automation - Live SAM.gov Search API
// REAL DATA ONLY - No demo/mock/sample data
// Queries SAM.gov API directly for live contract opportunities

export default async function handler(req, res) {
    const startTime = Date.now();
    const requestId = `sam_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // CORS headers
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
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // REQUIRE real API key - no fallbacks
    const SAM_API_KEY = process.env.SAM_GOV_API_KEY || process.env.SAM_API_KEY;

    if (!SAM_API_KEY) {
        return res.status(503).json({
            success: false,
            error: 'SAM.gov API key not configured',
            message: 'Set SAM_GOV_API_KEY in environment variables',
            requestId,
        });
    }

    // Singh Automation target profile
    const NAICS_CODES = ['333249', '333922', '541330', '541512', '541715', '238210'];
    const KEYWORDS = [
        'robotics', 'automation', 'robot', 'PLC', 'SCADA', 'conveyor',
        'material handling', 'vision system', 'FANUC', 'welding', 'controls'
    ];
    const PRIORITY_AGENCIES = [
        'defense', 'army', 'navy', 'air force', 'dla', 'nasa', 'doe', 'dod'
    ];

    // Parse query params
    const days = Math.min(parseInt(req.query.days) || 60, 90);
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const customKeywords = req.query.keywords ? req.query.keywords.split(',').map(k => k.trim()) : [];
    const searchKeywords = customKeywords.length > 0 ? customKeywords : KEYWORDS;

    // Build date range
    const today = new Date();
    const fromDate = new Date(today);
    fromDate.setDate(fromDate.getDate() - days);

    const formatDate = (d) => {
        return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
    };

    const postedFrom = formatDate(fromDate);
    const postedTo = formatDate(today);

    // Fetch with timeout helper
    const fetchWithTimeout = async (url, timeoutMs = 15000) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeout);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`SAM.gov API error: ${response.status} - ${errorText}`);
                return { error: `HTTP ${response.status}: ${errorText.substring(0, 200)}` };
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeout);
            console.error(`Fetch error: ${error.message}`);
            return { error: error.message };
        }
    };

    // Score opportunity based on Singh Automation fit
    const scoreOpportunity = (opp) => {
        let score = 0;
        const reasons = [];
        const breakdown = { naics: 0, keywords: 0, agency: 0, value: 0, setAside: 0 };

        const title = (opp.title || '').toLowerCase();
        const description = (opp.description || '').toLowerCase();
        const fullText = `${title} ${description}`;
        const agency = (opp.fullParentPathName || opp.departmentName || '').toLowerCase();
        const setAside = (opp.typeOfSetAsideDescription || '').toLowerCase();

        // NAICS match (25 points)
        if (opp.naicsCode && NAICS_CODES.includes(opp.naicsCode)) {
            score += 25;
            breakdown.naics = 25;
            reasons.push(`NAICS ${opp.naicsCode}`);
        }

        // Keyword matches (up to 35 points)
        let kwScore = 0;
        const matchedKw = [];
        for (const kw of KEYWORDS) {
            if (fullText.includes(kw.toLowerCase()) && kwScore < 35) {
                kwScore += 5;
                matchedKw.push(kw);
            }
        }
        score += kwScore;
        breakdown.keywords = kwScore;
        if (matchedKw.length > 0) {
            reasons.push(`Keywords: ${matchedKw.slice(0, 3).join(', ')}`);
        }

        // Priority agency (15 points)
        if (PRIORITY_AGENCIES.some(a => agency.includes(a))) {
            score += 15;
            breakdown.agency = 15;
            reasons.push('Priority agency');
        }

        // Value range $25K-$5M (15 points)
        const value = parseFloat(opp.award?.amount) || 0;
        if (value >= 25000 && value <= 5000000) {
            score += 15;
            breakdown.value = 15;
            reasons.push(`Value: $${(value / 1000).toFixed(0)}K`);
        } else if (value === 0) {
            score += 5; // Unknown value, partial credit
            breakdown.value = 5;
        }

        // Small business set-aside (10 points)
        if (setAside.includes('small business') || setAside.includes('total small')) {
            score += 10;
            breakdown.setAside = 10;
            reasons.push('Small Business set-aside');
        }

        // Recommendation
        let recommendation, color;
        if (score >= 65) {
            recommendation = 'PURSUE';
            color = '#22c55e';
        } else if (score >= 40) {
            recommendation = 'WATCH';
            color = '#f59e0b';
        } else {
            recommendation = 'SKIP';
            color = '#6b7280';
        }

        return { score, recommendation, color, reasons, breakdown };
    };

    try {
        const opportunities = [];
        const seenIds = new Set();
        let apiCallCount = 0;
        let successCount = 0;

        // Search by keywords (limit to 5 to avoid rate limiting)
        const keywordSearches = searchKeywords.slice(0, 5).map(keyword => {
            const url = `https://api.sam.gov/opportunities/v2/search?api_key=${SAM_API_KEY}&keyword=${encodeURIComponent(keyword)}&postedFrom=${encodeURIComponent(postedFrom)}&postedTo=${encodeURIComponent(postedTo)}&limit=30`;
            return { url, type: 'keyword', term: keyword };
        });

        // Search by NAICS codes (limit to 3)
        const naicsSearches = NAICS_CODES.slice(0, 3).map(code => {
            const url = `https://api.sam.gov/opportunities/v2/search?api_key=${SAM_API_KEY}&naics=${code}&postedFrom=${encodeURIComponent(postedFrom)}&postedTo=${encodeURIComponent(postedTo)}&limit=30`;
            return { url, type: 'naics', term: code };
        });

        const allSearches = [...keywordSearches, ...naicsSearches];

        // Execute searches in parallel
        const errors = [];
        const results = await Promise.all(
            allSearches.map(async (search) => {
                apiCallCount++;
                const data = await fetchWithTimeout(search.url);
                if (data?.opportunitiesData) {
                    successCount++;
                } else if (data?.error) {
                    errors.push({ type: search.type, term: search.term, error: data.error });
                }
                return { ...search, data };
            })
        );

        // Process results
        for (const result of results) {
            if (!result.data?.opportunitiesData) continue;

            for (const opp of result.data.opportunitiesData) {
                // Skip duplicates
                if (seenIds.has(opp.noticeId)) continue;
                seenIds.add(opp.noticeId);

                // Extract contact info
                let contact = null;
                if (opp.pointOfContact?.length > 0) {
                    const poc = opp.pointOfContact[0];
                    contact = {
                        name: poc.fullName || `${poc.firstName || ''} ${poc.lastName || ''}`.trim() || null,
                        email: poc.email || null,
                        phone: poc.phone || null,
                    };
                }

                // Score the opportunity
                const scoring = scoreOpportunity(opp);

                opportunities.push({
                    // Core fields
                    id: opp.noticeId,
                    title: opp.title || 'Untitled',
                    solicitationNumber: opp.solicitationNumber || opp.noticeId,

                    // Agency info
                    agency: opp.fullParentPathName || opp.departmentName || 'Unknown Agency',
                    subAgency: opp.organizationName || null,
                    office: opp.officeAddress || null,

                    // Dates
                    postedDate: opp.postedDate || null,
                    responseDeadline: opp.responseDeadLine || null,
                    archiveDate: opp.archiveDate || null,

                    // Classification
                    naicsCode: opp.naicsCode || null,
                    naicsDescription: opp.naicsDescription || null,
                    classificationCode: opp.classificationCode || null,
                    setAside: opp.typeOfSetAsideDescription || 'Full and Open',
                    type: opp.type || opp.baseType || 'Solicitation',

                    // Value
                    estimatedValue: opp.award?.amount || null,

                    // Location
                    placeOfPerformance: opp.placeOfPerformance?.city?.name
                        ? `${opp.placeOfPerformance.city.name}, ${opp.placeOfPerformance.state?.code || ''}`
                        : null,

                    // Description (truncated)
                    description: opp.description ? opp.description.substring(0, 2000) : null,

                    // Links
                    link: `https://sam.gov/opp/${opp.noticeId}/view`,

                    // Contact
                    contact,

                    // Scoring
                    score: scoring.score,
                    recommendation: scoring.recommendation,
                    recommendationColor: scoring.color,
                    matchReasons: scoring.reasons,
                    scoreBreakdown: scoring.breakdown,

                    // Metadata
                    isLive: true,
                    source: 'SAM.gov',
                    fetchedAt: new Date().toISOString(),
                });
            }
        }

        // Sort by score (highest first)
        opportunities.sort((a, b) => b.score - a.score);

        // Apply limit
        const limitedResults = opportunities.slice(0, limit);

        // Calculate stats
        const stats = {
            total: limitedResults.length,
            pursue: limitedResults.filter(o => o.recommendation === 'PURSUE').length,
            watch: limitedResults.filter(o => o.recommendation === 'WATCH').length,
            skip: limitedResults.filter(o => o.recommendation === 'SKIP').length,
            avgScore: limitedResults.length > 0
                ? Math.round(limitedResults.reduce((sum, o) => sum + o.score, 0) / limitedResults.length)
                : 0,
            apiCalls: apiCallCount,
            successfulCalls: successCount,
            dateRange: { from: postedFrom, to: postedTo },
        };

        const latencyMs = Date.now() - startTime;

        return res.status(200).json({
            success: true,
            requestId,
            timestamp: new Date().toISOString(),
            latencyMs,
            stats,
            opportunities: limitedResults,
            errors: errors.length > 0 ? errors.slice(0, 3) : undefined,
        });

    } catch (error) {
        console.error('Live search error:', error);

        return res.status(500).json({
            success: false,
            error: error.message,
            requestId,
            timestamp: new Date().toISOString(),
        });
    }
}
