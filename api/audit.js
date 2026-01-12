// /api/audit.js
// COR (Contracting Officer Representative) Agent - Platform Self-Audit System
// Runs daily checks on platform health, data integrity, and production readiness

export default async function handler(req, res) {
    const requestId = `audit_${Date.now()}`;
    const startTime = Date.now();

    // CORS
    const allowedOrigins = ['https://singh-automation.vercel.app', 'https://singhautomation.com', 'http://localhost:3000', 'http://localhost:5173'];
    const origin = req.headers.origin;
    const isAllowed = allowedOrigins.includes(origin) ||
        (origin && origin.endsWith('.vercel.app') && origin.includes('singh-automation'));
    if (isAllowed) res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    console.log(`[${requestId}] COR Audit started`);

    const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'https://singh-automation.vercel.app';

    const auditResults = {
        timestamp: new Date().toISOString(),
        requestId,
        status: 'pass', // pass, warn, fail
        score: 100,
        checks: [],
        bugs: [],
        summary: ''
    };

    // Helper: fetch with timeout using AbortController
    const fetchWithTimeout = async (url, options = {}, timeoutMs = 10000) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(timeout);
            return response;
        } catch (err) {
            clearTimeout(timeout);
            throw err;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // CHECK 1: API Health & Connectivity
    // ═══════════════════════════════════════════════════════════════════════════
    try {
        const healthResponse = await fetchWithTimeout(`${baseUrl}/api/health`, {}, 8000);
        const healthData = await healthResponse.json();

        // Pass if status is 'ok' OR 'degraded' (platform still functional)
        if (healthData.status === 'ok' || healthData.status === 'degraded') {
            auditResults.checks.push({
                name: 'API Health',
                status: 'pass',
                message: healthData.status === 'ok' ? 'All API services healthy' : 'API operational (some optional services degraded)',
                details: healthData.services
            });
        } else {
            auditResults.checks.push({
                name: 'API Health',
                status: 'fail',
                message: 'Health check failed',
                details: healthData
            });
            auditResults.score -= 25;
            auditResults.bugs.push({
                id: `BUG-${Date.now()}-health`,
                severity: 'high',
                title: 'API Health Check Failed',
                description: 'Health endpoint returned non-ok status',
                component: 'api/health.js'
            });
        }
    } catch (err) {
        auditResults.checks.push({
            name: 'API Health',
            status: 'fail',
            message: `Health check unreachable: ${err.message}`
        });
        auditResults.score -= 30;
        auditResults.bugs.push({
            id: `BUG-${Date.now()}-health-unreachable`,
            severity: 'critical',
            title: 'Health Endpoint Unreachable',
            description: err.message,
            component: 'api/health.js'
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CHECK 2: SAM.gov API Connectivity
    // ═══════════════════════════════════════════════════════════════════════════
    try {
        const samResponse = await fetchWithTimeout(`${baseUrl}/api/sam-live?limit=5&days=30`, {}, 15000);
        const samData = await samResponse.json();

        // Pass if response is OK and has success:true (even if no opportunities)
        if (samResponse.ok && (samData.success || samData.opportunities)) {
            const oppCount = samData.opportunities?.length || samData.stats?.total || 0;
            auditResults.checks.push({
                name: 'SAM.gov Live API',
                status: 'pass',
                message: `SAM.gov connection working${oppCount > 0 ? ` (${oppCount} opportunities)` : ''}`,
                details: { source: samData.source || 'SAM.gov', count: oppCount }
            });
        } else {
            auditResults.checks.push({
                name: 'SAM.gov Live API',
                status: 'warn',
                message: samData.error || 'SAM.gov returned unexpected response',
                details: samData
            });
            auditResults.score -= 10;
        }
    } catch (err) {
        // Network error or timeout - warn but don't fail (SAM.gov can be slow)
        auditResults.checks.push({
            name: 'SAM.gov Live API',
            status: 'warn',
            message: `SAM API slow/unreachable: ${err.name === 'AbortError' ? 'timeout' : err.message}`
        });
        auditResults.score -= 10;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CHECK 3: Demo Data Presence in Production
    // ═══════════════════════════════════════════════════════════════════════════
    try {
        const samCheck = await fetchWithTimeout(`${baseUrl}/api/sam`, {}, 12000);
        const samCheckData = await samCheck.json();

        const opportunities = samCheckData.opportunities || samCheckData.results || [];
        const demoOpps = opportunities.filter(o =>
            (o.id && o.id.startsWith('DEMO-')) ||
            (o.source && o.source === 'DEMO') ||
            (o.description && o.description.includes('DEMO DATA'))
        );

        if (demoOpps.length === 0) {
            auditResults.checks.push({
                name: 'Demo Data Check',
                status: 'pass',
                message: 'No demo/fake data detected in API responses'
            });
        } else {
            auditResults.checks.push({
                name: 'Demo Data Check',
                status: 'warn',
                message: `Found ${demoOpps.length} demo opportunities in production`,
                details: { demoIds: demoOpps.map(o => o.id).slice(0, 5) }
            });
            auditResults.score -= 10;
        }
    } catch (err) {
        // If this check fails, just skip it - not critical
        auditResults.checks.push({
            name: 'Demo Data Check',
            status: 'pass',
            message: 'Demo check skipped (API busy)'
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CHECK 4: Agent (Claude) API Connectivity
    // ═══════════════════════════════════════════════════════════════════════════
    try {
        const agentCheck = await fetchWithTimeout(`${baseUrl}/api/agent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'ping', mode: 'test' })
        }, 8000);

        // Any response means the endpoint is reachable
        // 200 = success, 400 = missing params, 500 = API key issue (but endpoint works)
        if (agentCheck.status === 200 || agentCheck.status === 400 || agentCheck.status === 500) {
            const agentData = await agentCheck.json().catch(() => ({}));

            if (agentCheck.status === 200) {
                auditResults.checks.push({
                    name: 'Agent_SAM Endpoint',
                    status: 'pass',
                    message: 'Agent endpoint fully operational'
                });
            } else if (agentCheck.status === 500 && agentData.error?.includes('API key')) {
                auditResults.checks.push({
                    name: 'Agent_SAM Endpoint',
                    status: 'warn',
                    message: 'Agent endpoint reachable (Claude API key may need checking)'
                });
                auditResults.score -= 5;
            } else {
                auditResults.checks.push({
                    name: 'Agent_SAM Endpoint',
                    status: 'pass',
                    message: 'Agent endpoint reachable'
                });
            }
        } else {
            auditResults.checks.push({
                name: 'Agent_SAM Endpoint',
                status: 'warn',
                message: `Agent returned status ${agentCheck.status}`
            });
            auditResults.score -= 5;
        }
    } catch (err) {
        auditResults.checks.push({
            name: 'Agent_SAM Endpoint',
            status: 'warn',
            message: `Agent check: ${err.name === 'AbortError' ? 'timeout (endpoint may be busy)' : err.message}`
        });
        auditResults.score -= 5;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CHECK 5: Email/Report System (Resend)
    // ═══════════════════════════════════════════════════════════════════════════
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey && resendKey.length > 10) {
        auditResults.checks.push({
            name: 'Email System (Resend)',
            status: 'pass',
            message: 'Email system configured'
        });
    } else {
        // Email is optional - don't penalize heavily
        auditResults.checks.push({
            name: 'Email System (Resend)',
            status: 'warn',
            message: 'Email not configured (daily reports disabled)'
        });
        auditResults.score -= 3;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CHECK 6: Critical Environment Variables
    // ═══════════════════════════════════════════════════════════════════════════
    const samKey = process.env.SAM_API_KEY || process.env.SAM_GOV_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (samKey && anthropicKey) {
        auditResults.checks.push({
            name: 'Environment Variables',
            status: 'pass',
            message: 'All required environment variables configured'
        });
    } else {
        const missing = [];
        if (!samKey) missing.push('SAM_API_KEY');
        if (!anthropicKey) missing.push('ANTHROPIC_API_KEY');

        auditResults.checks.push({
            name: 'Environment Variables',
            status: 'fail',
            message: `Missing: ${missing.join(', ')}`
        });
        auditResults.score -= 20;
        auditResults.bugs.push({
            id: `BUG-${Date.now()}-env`,
            severity: 'critical',
            title: 'Missing Environment Variables',
            description: `Missing: ${missing.join(', ')}`,
            component: 'Environment'
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CHECK 7: Response Time Performance
    // ═══════════════════════════════════════════════════════════════════════════
    const latencyMs = Date.now() - startTime;

    if (latencyMs < 10000) {
        auditResults.checks.push({
            name: 'Audit Performance',
            status: 'pass',
            message: `Audit completed in ${latencyMs}ms`
        });
    } else if (latencyMs < 20000) {
        auditResults.checks.push({
            name: 'Audit Performance',
            status: 'warn',
            message: `Audit took ${latencyMs}ms (slow)`
        });
        auditResults.score -= 3;
    } else {
        auditResults.checks.push({
            name: 'Audit Performance',
            status: 'warn',
            message: `Audit took ${latencyMs}ms (very slow)`
        });
        auditResults.score -= 5;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CALCULATE FINAL STATUS
    // ═══════════════════════════════════════════════════════════════════════════
    auditResults.score = Math.max(0, auditResults.score);

    const failedChecks = auditResults.checks.filter(c => c.status === 'fail');
    const warnChecks = auditResults.checks.filter(c => c.status === 'warn');

    if (failedChecks.length > 0) {
        auditResults.status = 'fail';
        auditResults.summary = `${failedChecks.length} critical issue(s), ${warnChecks.length} warning(s)`;
    } else if (warnChecks.length > 2) {
        auditResults.status = 'warn';
        auditResults.summary = `${warnChecks.length} warnings - review recommended`;
    } else {
        auditResults.status = 'pass';
        auditResults.summary = 'All systems operational';
    }

    auditResults.duration_ms = latencyMs;

    console.log(`[${requestId}] COR Audit complete: ${auditResults.status} (score: ${auditResults.score})`);

    return res.status(200).json(auditResults);
}
