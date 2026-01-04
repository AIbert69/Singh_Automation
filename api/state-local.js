// Singh Automation State & Local Procurement Scraper
// Automates searching of state/county portals for relevant opportunities

export default async function handler(req, res) {
    const startTime = Date.now();

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
    if (req.method === 'OPTIONS') return res.status(200).end();

    // Keywords to search for automation opportunities
    const searchKeywords = [
        'automation', 'robotic', 'welding', 'PLC', 'SCADA',
        'conveyor', 'controls', 'manufacturing', 'industrial'
    ];

    const allOpps = [];
    const errors = [];

    // ========== 1. PUBLICPURCHASE.COM ==========
    // Free aggregator covering many CA and MI agencies
    try {
        const ppResults = await scrapePublicPurchase(searchKeywords);
        allOpps.push(...ppResults);
    } catch (e) {
        errors.push({ source: 'PublicPurchase', error: e.message });
    }

    // ========== 2. PLANETBIDS ==========
    // Many California cities and counties use this platform
    try {
        const pbResults = await scrapePlanetBids(searchKeywords);
        allOpps.push(...pbResults);
    } catch (e) {
        errors.push({ source: 'PlanetBids', error: e.message });
    }

    // ========== 3. MICHIGAN SIGMA ==========
    // Michigan state procurement system
    try {
        const miResults = await scrapeMichiganSIGMA(searchKeywords);
        allOpps.push(...miResults);
    } catch (e) {
        errors.push({ source: 'Michigan SIGMA', error: e.message });
    }

    // ========== 4. CAL EPROCURE RSS ==========
    // California state - check for RSS feed
    try {
        const caResults = await scrapeCalEprocure(searchKeywords);
        allOpps.push(...caResults);
    } catch (e) {
        errors.push({ source: 'Cal eProcure', error: e.message });
    }

    // ========== 5. BIDNETDIRECT (Free Tier) ==========
    try {
        const bidnetResults = await scrapeBidNetDirect(searchKeywords);
        allOpps.push(...bidnetResults);
    } catch (e) {
        errors.push({ source: 'BidNet', error: e.message });
    }

    const totalTime = Date.now() - startTime;

    res.status(200).json({
        success: true,
        count: allOpps.length,
        opportunities: allOpps,
        errors: errors.length > 0 ? errors : undefined,
        sources: ['PublicPurchase', 'PlanetBids', 'Michigan SIGMA', 'Cal eProcure', 'BidNet'],
        timestamp: new Date().toISOString(),
        latencyMs: totalTime
    });
}

// ========== SCRAPER FUNCTIONS ==========

async function scrapePublicPurchase(keywords) {
    const opportunities = [];

    // PublicPurchase search endpoint
    // Regions: CA (California), MI (Michigan)
    const regions = ['CA', 'MI'];

    for (const region of regions) {
        for (const keyword of keywords.slice(0, 3)) { // Limit to avoid rate limiting
            try {
                const searchUrl = `https://www.publicpurchase.com/gems/browse/browseByAdvanced.html?state=${region}&keyword=${encodeURIComponent(keyword)}&status=O`;

                const response = await fetch(searchUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': 'text/html,application/xhtml+xml'
                    },
                    signal: AbortSignal.timeout(5000)
                });

                if (!response.ok) continue;

                const html = await response.text();

                // Parse opportunities from HTML
                const parsed = parsePublicPurchaseHTML(html, region, keyword);
                opportunities.push(...parsed);

            } catch (e) {
                // Continue on individual failures
                console.log(`PublicPurchase ${region}/${keyword} failed: ${e.message}`);
            }
        }
    }

    return deduplicateOpps(opportunities);
}

function parsePublicPurchaseHTML(html, region, keyword) {
    const opps = [];

    // Look for bid listings in the HTML
    // Pattern: <a href="/gems/bid/bidView.html?bidId=XXXXX">Title</a>
    const bidPattern = /<a\s+href="\/gems\/bid\/bidView\.html\?bidId=(\d+)"[^>]*>([^<]+)<\/a>/gi;
    let match;

    while ((match = bidPattern.exec(html)) !== null) {
        const bidId = match[1];
        const title = match[2].trim();

        // Only include if title contains relevant keywords
        const titleLower = title.toLowerCase();
        const isRelevant = ['automation', 'robot', 'weld', 'plc', 'scada', 'control', 'conveyor', 'manufacturing', 'industrial', 'electrical']
            .some(kw => titleLower.includes(kw));

        if (isRelevant || titleLower.includes(keyword.toLowerCase())) {
            opps.push({
                id: `pp-${bidId}`,
                noticeId: `pp-${bidId}`,
                title: title,
                agency: `${region} Agency (PublicPurchase)`,
                link: `https://www.publicpurchase.com/gems/bid/bidView.html?bidId=${bidId}`,
                source: 'PublicPurchase',
                type: 'state-local',
                category: region === 'CA' ? 'California' : 'Michigan',
                state: region,
                isLive: true,
                postedDate: new Date().toISOString().split('T')[0],
                status: 'Review',
                statusReason: 'State/local opportunity - review for fit',
                matchedKeyword: keyword
            });
        }
    }

    return opps;
}

async function scrapePlanetBids(keywords) {
    const opportunities = [];

    // PlanetBids agencies (many CA cities/counties)
    // Their public search page
    const agencies = [
        { code: 'ocsd', name: 'Orange County Sanitation District' },
        { code: 'ocwd', name: 'Orange County Water District' },
        { code: 'lacsd', name: 'LA County Sanitation Districts' },
        { code: 'sdcwa', name: 'San Diego County Water Authority' },
    ];

    for (const agency of agencies) {
        try {
            // PlanetBids public bid listing page pattern
            const url = `https://pbsystem.planetbids.com/portal/${agency.code}/bo/bo-search`;

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json, text/html'
                },
                signal: AbortSignal.timeout(5000)
            });

            if (!response.ok) continue;

            const contentType = response.headers.get('content-type');

            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                if (data.bids && Array.isArray(data.bids)) {
                    for (const bid of data.bids) {
                        const titleLower = (bid.title || bid.name || '').toLowerCase();
                        const isRelevant = keywords.some(kw => titleLower.includes(kw.toLowerCase()));

                        if (isRelevant) {
                            opportunities.push({
                                id: `pb-${agency.code}-${bid.id || Date.now()}`,
                                noticeId: `pb-${agency.code}-${bid.id}`,
                                title: bid.title || bid.name,
                                agency: agency.name,
                                closeDate: bid.closeDate || bid.dueDate,
                                link: `https://pbsystem.planetbids.com/portal/${agency.code}/bo/bo-detail/${bid.id}`,
                                source: 'PlanetBids',
                                type: 'state-local',
                                category: 'California',
                                state: 'CA',
                                isLive: true,
                                postedDate: bid.postedDate || new Date().toISOString().split('T')[0],
                                status: 'Review',
                                statusReason: 'PlanetBids opportunity - review scope'
                            });
                        }
                    }
                }
            }

        } catch (e) {
            console.log(`PlanetBids ${agency.code} failed: ${e.message}`);
        }
    }

    return opportunities;
}

async function scrapeMichiganSIGMA(keywords) {
    const opportunities = [];

    try {
        // Michigan SIGMA vendor self-service portal
        // Try their public bid search
        const searchUrl = 'https://sigma.michigan.gov/webapp/PRDVSS2X1/AltSelfService';

        // SIGMA uses a complex JSF-based interface, limited scraping possible
        // Instead, we'll check their RSS/XML feed if available
        const rssUrl = 'https://www.michigan.gov/budget/-/media/Project/Websites/budget/Procurement/rss/procurement-rss.xml';

        const response = await fetch(rssUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Singh-Automation-Bot/1.0)',
                'Accept': 'application/rss+xml, application/xml, text/xml'
            },
            signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
            const xml = await response.text();
            const parsed = parseRSSFeed(xml, 'Michigan', keywords);
            opportunities.push(...parsed);
        }

    } catch (e) {
        console.log(`Michigan SIGMA failed: ${e.message}`);
    }

    return opportunities;
}

async function scrapeCalEprocure(keywords) {
    const opportunities = [];

    try {
        // Cal eProcure doesn't have a public RSS, but we can try their search
        // They use a Bonfire-based system now
        const searchUrl = 'https://caleprocure.ca.gov/pages/Events-BS3/event-search.aspx';

        const response = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html'
            },
            signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
            const html = await response.text();

            // Parse any visible bid listings
            // Look for automation-related opportunities
            const bidPattern = /event-detail\.aspx\?e=([^"&]+)[^>]*>([^<]+)/gi;
            let match;

            while ((match = bidPattern.exec(html)) !== null) {
                const eventId = match[1];
                const title = match[2].trim();

                const titleLower = title.toLowerCase();
                const isRelevant = keywords.some(kw => titleLower.includes(kw.toLowerCase()));

                if (isRelevant) {
                    opportunities.push({
                        id: `calepro-${eventId}`,
                        noticeId: `calepro-${eventId}`,
                        title: title,
                        agency: 'California State',
                        link: `https://caleprocure.ca.gov/pages/Events-BS3/event-detail.aspx?e=${eventId}`,
                        source: 'Cal eProcure',
                        type: 'state-local',
                        category: 'California',
                        state: 'CA',
                        isLive: true,
                        postedDate: new Date().toISOString().split('T')[0],
                        status: 'Review',
                        statusReason: 'California state opportunity'
                    });
                }
            }
        }

    } catch (e) {
        console.log(`Cal eProcure failed: ${e.message}`);
    }

    return opportunities;
}

async function scrapeBidNetDirect(keywords) {
    const opportunities = [];

    try {
        // BidNet Direct has a public search
        // Focus on CA and MI
        const states = ['california', 'michigan'];

        for (const state of states) {
            const searchUrl = `https://www.bidnetdirect.com/browse/${state}`;

            const response = await fetch(searchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html'
                },
                signal: AbortSignal.timeout(5000)
            });

            if (!response.ok) continue;

            const html = await response.text();

            // Parse bid listings
            // Pattern varies but typically includes bid links
            const bidPattern = /\/browse\/bids\/([^"\/]+)[^>]*>([^<]+)/gi;
            let match;

            while ((match = bidPattern.exec(html)) !== null) {
                const bidId = match[1];
                const title = match[2].trim();

                const titleLower = title.toLowerCase();
                const isRelevant = keywords.some(kw => titleLower.includes(kw.toLowerCase()));

                if (isRelevant) {
                    opportunities.push({
                        id: `bidnet-${bidId}`,
                        noticeId: `bidnet-${bidId}`,
                        title: title,
                        agency: `${state.charAt(0).toUpperCase() + state.slice(1)} (BidNet)`,
                        link: `https://www.bidnetdirect.com/browse/bids/${bidId}`,
                        source: 'BidNet',
                        type: 'state-local',
                        category: state === 'california' ? 'California' : 'Michigan',
                        state: state === 'california' ? 'CA' : 'MI',
                        isLive: true,
                        postedDate: new Date().toISOString().split('T')[0],
                        status: 'Review',
                        statusReason: 'BidNet opportunity - review for fit'
                    });
                }
            }
        }

    } catch (e) {
        console.log(`BidNet failed: ${e.message}`);
    }

    return opportunities;
}

function parseRSSFeed(xml, source, keywords) {
    const opportunities = [];

    // Basic RSS item parsing
    const itemPattern = /<item>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemPattern.exec(xml)) !== null) {
        const itemXml = match[1];

        const title = extractTag(itemXml, 'title');
        const link = extractTag(itemXml, 'link');
        const description = extractTag(itemXml, 'description');
        const pubDate = extractTag(itemXml, 'pubDate');

        if (!title) continue;

        const fullText = `${title} ${description}`.toLowerCase();
        const isRelevant = keywords.some(kw => fullText.includes(kw.toLowerCase()));

        if (isRelevant) {
            opportunities.push({
                id: `rss-${source.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                noticeId: `rss-${source.toLowerCase()}-${title.substring(0, 20).replace(/\W/g, '')}`,
                title: title,
                agency: source,
                description: description?.substring(0, 500),
                link: link || '#',
                source: `${source} RSS`,
                type: 'state-local',
                category: source.includes('Michigan') ? 'Michigan' : 'California',
                state: source.includes('Michigan') ? 'MI' : 'CA',
                isLive: true,
                postedDate: pubDate ? new Date(pubDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                status: 'Review',
                statusReason: `${source} RSS opportunity`
            });
        }
    }

    return opportunities;
}

function extractTag(xml, tagName) {
    const pattern = new RegExp(`<${tagName}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tagName}>|<${tagName}[^>]*>([^<]*)<\\/${tagName}>`, 'i');
    const match = xml.match(pattern);
    return match ? (match[1] || match[2] || '').trim() : null;
}

function deduplicateOpps(opps) {
    const seen = new Set();
    return opps.filter(opp => {
        const key = `${opp.title}-${opp.agency}`.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}
