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

    // ═══════════════════════════════════════════════════════════════════════════
    // CHECK 1: API Health & Connectivity
    // ═══════════════════════════════════════════════════════════════════════════
    try {
        const healthResponse = await fetch(`${baseUrl}/api/health`, { timeout: 10000 });
        const healthData = await healthResponse.json();

        if (healthData.status === 'ok') {
            auditResults.checks.push({
                name: 'API Health',
                status: 'pass',
                message: 'All API services healthy',
                details: healthData.services
            });
        } else if (healthData.status === 'degraded') {
            auditResults.checks.push({
                name: 'API Health',
                status: 'warn',
                message: `Degraded: ${healthData.warning || 'Some services unavailable'}`,
                details: healthData.services
            });
            auditResults.score -= 10;
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
        const samResponse = await fetch(`${baseUrl}/api/sam-live?limit=1&days=7`, { timeout: 15000 });
        const samData = await samResponse.json();

        if (samResponse.ok && samData.opportunities && samData.opportunities.length > 0) {
            auditResults.checks.push({
                name: 'SAM.gov Live API',
                status: 'pass',
                message: `Live connection working (${samData.total || samData.opportunities.length} opportunities available)`,
                details: { source: samData.source, count: samData.total }
            });
        } else if (samResponse.ok && samData.opportunities?.length === 0) {
            auditResults.checks.push({
                name: 'SAM.gov Live API',
                status: 'warn',
                message: 'Connection OK but no opportunities returned',
                details: samData
            });
            auditResults.score -= 5;
        } else {
            auditResults.checks.push({
                name: 'SAM.gov Live API',
                status: 'fail',
                message: samData.error || 'SAM.gov API request failed',
                details: samData
            });
            auditResults.score -= 20;
            auditResults.bugs.push({
                id: `BUG-${Date.now()}-sam`,
                severity: 'high',
                title: 'SAM.gov API Connection Failed',
                description: samData.error || 'Unable to fetch live opportunities',
                component: 'api/sam-live.js'
            });
        }
    } catch (err) {
        auditResults.checks.push({
            name: 'SAM.gov Live API',
            status: 'fail',
            message: `SAM API error: ${err.message}`
        });
        auditResults.score -= 20;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CHECK 3: Demo Data Presence in Production
    // ═══════════════════════════════════════════════════════════════════════════
    try {
        // Check main SAM endpoint for demo data
        const samCheck = await fetch(`${baseUrl}/api/sam`, { timeout: 10000 });
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
            auditResults.score -= 15;
            auditResults.bugs.push({
                id: `BUG-${Date.now()}-demo`,
                severity: 'medium',
                title: 'Demo Data Visible in Production',
                description: `${demoOpps.length} demo opportunities are being returned to users`,
                component: 'api/sam.js'
            });
        }
    } catch (err) {
        auditResults.checks.push({
            name: 'Demo Data Check',
            status: 'warn',
            message: `Could not check for demo data: ${err.message}`
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CHECK 4: NAICS Code Consistency
    // ═══════════════════════════════════════════════════════════════════════════
    const expectedNaicsCodes = [
        // Singh Automation
        '333249', '333922', '541330', '541512', '541715', '238210', '493110', '811310',
        // Singh Thermal Systems
        '333248', '326150', '327993', '238310', '335999',
        // Singh Vision Systems
        '333511', '326199'
    ];

    try {
        // Verify NAICS codes are being used in queries
        const samLiveCheck = await fetch(`${baseUrl}/api/sam-live?limit=1`, { timeout: 10000 });
        const samLiveData = await samLiveCheck.json();

        if (samLiveData.queryParams?.naicsCodes) {
            const usedCodes = samLiveData.queryParams.naicsCodes;
            const missingCodes = expectedNaicsCodes.filter(c => !usedCodes.includes(c));
            const extraCodes = usedCodes.filter(c => !expectedNaicsCodes.includes(c));

            if (missingCodes.length === 0 && extraCodes.length === 0) {
                auditResults.checks.push({
                    name: 'NAICS Code Sync',
                    status: 'pass',
                    message: `All ${expectedNaicsCodes.length} NAICS codes properly configured`
                });
            } else {
                auditResults.checks.push({
                    name: 'NAICS Code Sync',
                    status: 'warn',
                    message: `NAICS codes mismatch: ${missingCodes.length} missing, ${extraCodes.length} extra`,
                    details: { missing: missingCodes, extra: extraCodes }
                });
                auditResults.score -= 10;
            }
        } else {
            auditResults.checks.push({
                name: 'NAICS Code Sync',
                status: 'info',
                message: 'NAICS codes not exposed in API response (internal use only)'
            });
        }
    } catch (err) {
        auditResults.checks.push({
            name: 'NAICS Code Sync',
            status: 'warn',
            message: `Could not verify NAICS codes: ${err.message}`
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CHECK 5: Agent (Claude) API Connectivity
    // ═══════════════════════════════════════════════════════════════════════════
    try {
        // Quick test of agent endpoint (just check if it responds, don't actually call Claude)
        const agentCheck = await fetch(`${baseUrl}/api/agent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'ping', mode: 'test' }),
            timeout: 5000
        });

        // Even a 400 (missing message) or 500 (no API key) tells us the endpoint is reachable
        if (agentCheck.status === 200 || agentCheck.status === 400) {
            auditResults.checks.push({
                name: 'Agent_SAM Endpoint',
                status: 'pass',
                message: 'Agent endpoint reachable'
            });
        } else if (agentCheck.status === 500) {
            const agentData = await agentCheck.json().catch(() => ({}));
            if (agentData.error?.includes('API key')) {
                auditResults.checks.push({
                    name: 'Agent_SAM Endpoint',
                    status: 'warn',
                    message: 'Endpoint reachable but Claude API key may be missing'
                });
                auditResults.score -= 10;
            } else {
                auditResults.checks.push({
                    name: 'Agent_SAM Endpoint',
                    status: 'warn',
                    message: `Endpoint error: ${agentData.error || 'Unknown'}`
                });
                auditResults.score -= 10;
            }
        }
    } catch (err) {
        auditResults.checks.push({
            name: 'Agent_SAM Endpoint',
            status: 'fail',
            message: `Agent endpoint unreachable: ${err.message}`
        });
        auditResults.score -= 15;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CHECK 6: Email/Report System (Resend)
    // ═══════════════════════════════════════════════════════════════════════════
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey && resendKey.startsWith('re_')) {
        auditResults.checks.push({
            name: 'Email System (Resend)',
            status: 'pass',
            message: 'Resend API key configured'
        });
    } else {
        auditResults.checks.push({
            name: 'Email System (Resend)',
            status: 'warn',
            message: 'Resend API key not configured - daily reports disabled'
        });
        auditResults.score -= 5;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CHECK 7: Critical Environment Variables
    // ═══════════════════════════════════════════════════════════════════════════
    const envChecks = [
        { name: 'SAM_API_KEY', required: true },
        { name: 'ANTHROPIC_API_KEY', required: true },
        { name: 'RESEND_API_KEY', required: false },
        { name: 'REPORT_EMAIL', required: false }
    ];

    const envStatus = envChecks.map(e => ({
        name: e.name,
        configured: !!process.env[e.name],
        required: e.required
    }));

    const missingRequired = envStatus.filter(e => e.required && !e.configured);

    if (missingRequired.length === 0) {
        auditResults.checks.push({
            name: 'Environment Variables',
            status: 'pass',
            message: 'All required environment variables configured',
            details: envStatus.map(e => `${e.name}: ${e.configured ? '✓' : '✗'}`)
        });
    } else {
        auditResults.checks.push({
            name: 'Environment Variables',
            status: 'fail',
            message: `Missing required: ${missingRequired.map(e => e.name).join(', ')}`,
            details: envStatus
        });
        auditResults.score -= 20;
        auditResults.bugs.push({
            id: `BUG-${Date.now()}-env`,
            severity: 'critical',
            title: 'Missing Required Environment Variables',
            description: `Missing: ${missingRequired.map(e => e.name).join(', ')}`,
            component: 'vercel.json / Environment'
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CHECK 8: Response Time Performance
    // ═══════════════════════════════════════════════════════════════════════════
    const latencyMs = Date.now() - startTime;

    if (latencyMs < 5000) {
        auditResults.checks.push({
            name: 'Audit Performance',
            status: 'pass',
            message: `Audit completed in ${latencyMs}ms`
        });
    } else if (latencyMs < 15000) {
        auditResults.checks.push({
            name: 'Audit Performance',
            status: 'warn',
            message: `Audit took ${latencyMs}ms (>5s threshold)`
        });
        auditResults.score -= 5;
    } else {
        auditResults.checks.push({
            name: 'Audit Performance',
            status: 'fail',
            message: `Audit took ${latencyMs}ms (>15s critical threshold)`
        });
        auditResults.score -= 10;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CALCULATE FINAL STATUS
    // ═══════════════════════════════════════════════════════════════════════════
    auditResults.score = Math.max(0, auditResults.score);

    const failedChecks = auditResults.checks.filter(c => c.status === 'fail');
    const warnChecks = auditResults.checks.filter(c => c.status === 'warn');

    if (failedChecks.length > 0) {
        auditResults.status = 'fail';
        auditResults.summary = `AUDIT FAILED: ${failedChecks.length} critical issues, ${warnChecks.length} warnings`;
    } else if (warnChecks.length > 0) {
        auditResults.status = 'warn';
        auditResults.summary = `AUDIT WARNING: ${warnChecks.length} issues require attention`;
    } else {
        auditResults.status = 'pass';
        auditResults.summary = 'AUDIT PASSED: All systems operational';
    }

    auditResults.duration_ms = Date.now() - startTime;

    console.log(`[${requestId}] COR Audit complete: ${auditResults.status} (score: ${auditResults.score})`);

    return res.status(200).json(auditResults);
}
