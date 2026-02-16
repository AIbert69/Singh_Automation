// Singh Automation - Health Check API
// PRODUCTION BUILD - Structured logging, requestId tracking
// Deploy to: /api/health.js on Vercel

import { testClaudeConnection } from '../lib/claude-api.js';

export default async function handler(req, res) {
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const log = (level, message, data = {}) => {
        console.log(JSON.stringify({ level, requestId, timestamp: new Date().toISOString(), message, ...data }));
    };
    
    // CORS - Allow production, preview deployments, and local development
    const allowedOrigins = ['https://singh-automation.vercel.app', 'https://singhautomation.com', 'http://localhost:3000', 'http://localhost:5173'];
    const origin = req.headers.origin;
    const isAllowed = allowedOrigins.includes(origin) ||
        (origin && origin.endsWith('.vercel.app') && origin.includes('singh-automation'));
    if (isAllowed) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Request-ID');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        requestId,
        services: {},
        connectivity: {}
    };

    // Check Claude API key and connectivity
    const claudeKey = process.env.ANTHROPIC_API_KEY;
    const hasClaudeKey = !!(claudeKey && claudeKey.length > 20);
    health.services.claude = hasClaudeKey;

    // Test actual Claude API connectivity (only if testing=true query param)
    if (req.query.testing === 'true' && hasClaudeKey) {
        log('info', 'Testing Claude API connectivity');
        const connectionTest = await testClaudeConnection(claudeKey);
        health.connectivity.claude = connectionTest;
        log('info', 'Claude connectivity test complete', connectionTest);
    }

    // Check SAM.gov API key
    const samKey = process.env.SAM_API_KEY || process.env.SAM_GOV_API_KEY;
    health.services.sam = !!(samKey && samKey.length > 20);
    health.services.samPublic = true; // Public API always available as fallback

    // Shorthand for frontend
    health.sam = health.services.sam || health.services.samPublic;
    health.claude = health.services.claude;

    // Determine overall status
    const errors = [];
    const warnings = [];

    if (!health.services.claude) {
        errors.push('ANTHROPIC_API_KEY not configured');
    } else if (health.connectivity.claude && !health.connectivity.claude.connected) {
        warnings.push(`Claude API unreachable: ${health.connectivity.claude.error || 'Unknown error'}`);
    }

    if (!health.services.sam) {
        // Not an error - public API works
    }

    if (errors.length > 0) {
        health.status = 'degraded';
        health.errors = errors;
        health.warning = 'Some features unavailable: ' + errors.join(', ');
        log('warn', 'Health check degraded', { errors });
    } else if (warnings.length > 0) {
        health.status = 'warning';
        health.warnings = warnings;
        log('warn', 'Health check warnings', { warnings });
    } else {
        log('info', 'Health check passed', { services: health.services });
    }

    return res.status(200).json(health);
}
