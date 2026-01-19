/**
 * Singh Automation - Scraped Opportunities API
 *
 * IMPORTANT: This endpoint was designed to serve opportunities scraped from
 * state/local portals that don't have APIs. However, the Python scrapers
 * are NOT YET IMPLEMENTED and connected.
 *
 * DO NOT serve demo/fake data - only return real scraped opportunities.
 * When scrapers are implemented, data will come from:
 * - A JSON file updated by GitHub Actions
 * - A database (Supabase, PlanetScale, etc.)
 * - An S3 bucket
 *
 * For now, this returns an empty array with portal links for manual search.
 */

// NO FAKE DATA - Only return real scraped opportunities when scrapers are active
const SCRAPED_OPPORTUNITIES = [];

export default function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Filter parameters
        const { source, state, minValue, maxValue, status } = req.query;

        let opportunities = [...SCRAPED_OPPORTUNITIES];

        // Apply filters
        if (source) {
            opportunities = opportunities.filter(o =>
                o.source.toLowerCase().includes(source.toLowerCase())
            );
        }

        if (state) {
            opportunities = opportunities.filter(o =>
                o.location?.toLowerCase().includes(state.toLowerCase())
            );
        }

        if (minValue) {
            const min = parseInt(minValue);
            opportunities = opportunities.filter(o => (o.value || 0) >= min);
        }

        if (maxValue) {
            const max = parseInt(maxValue);
            opportunities = opportunities.filter(o => (o.value || 0) <= max);
        }

        if (status) {
            opportunities = opportunities.filter(o =>
                o.status?.toLowerCase() === status.toLowerCase()
            );
        }

        // Calculate summary stats
        const totalValue = opportunities.reduce((sum, o) => sum + (o.value || 0), 0);
        const sources = [...new Set(opportunities.map(o => o.source))];

        return res.status(200).json({
            success: true,
            source: 'Portal Scrapers (Michigan SIGMA, Cal eProcure, Texas SmartBuy)',
            lastUpdated: new Date().toISOString(),
            count: opportunities.length,
            totalValue,
            sources,
            note: 'Scrapers not yet active - use portal links in main scanner to search manually',
            scrapersActive: false,
            manualSearchRequired: true,
            opportunities
        });

    } catch (error) {
        console.error('Scraped API error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch scraped opportunities',
            message: error.message
        });
    }
}
