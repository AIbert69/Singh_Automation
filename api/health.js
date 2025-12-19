// /api/health.js - Backend Health Check
// Deploy to Vercel: vercel --prod

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Request-ID');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {}
    };
    
    // Check Claude API key
    const claudeKey = process.env.ANTHROPIC_API_KEY;
    health.services.claude = !!(claudeKey && claudeKey.startsWith('sk-ant-'));
    
    // Check SAM.gov API key (optional - public API may work without)
    const samKey = process.env.SAM_API_KEY;
    health.services.sam = true; // SAM.gov public API available
    
    // Overall status
    health.sam = health.services.sam;
    health.claude = health.services.claude;
    
    if (!health.services.claude) {
        health.status = 'degraded';
        health.warning = 'Claude API key not configured - proposal/validation features unavailable';
    }
    
    return res.status(200).json(health);
}
