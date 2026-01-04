/**
 * @fileoverview Daily Digest Email Generator
 * @module api/digest
 *
 * Generates HTML email digest of urgent opportunities and pipeline status.
 * Can be called:
 * - Manually via GET /api/digest
 * - Via cron job to trigger email send
 * - POST with email to send to specific address
 *
 * @author Singh Automation
 * @version 1.0.0
 */

import config from '../lib/config.js';
import { qualifyOpportunity } from '../lib/qualification.js';
import { fetchWithTimeout } from '../lib/errors.js';
import { handleCors } from '../middleware/cors.js';
import { setupRequest } from '../middleware/security.js';

// =============================================================================
// DIGEST GENERATOR
// =============================================================================

/**
 * Generates the HTML email content
 * @param {Object[]} opportunities - Array of opportunities
 * @param {Object} stats - Pipeline statistics
 * @returns {string} HTML email content
 */
function generateDigestHtml(opportunities, stats) {
    const urgent = opportunities.filter(o => {
        const score = o.qualification?.score || 0;
        if (score < 50) return false;
        const closeDate = o.closeDate || o.response_deadline;
        if (!closeDate) return false;
        const daysRemaining = Math.ceil((new Date(closeDate) - new Date()) / (1000 * 60 * 60 * 24));
        return daysRemaining >= 0 && daysRemaining <= 7;
    });

    const goOpps = opportunities.filter(o => (o.qualification?.score || 0) >= 70);
    const evalOpps = opportunities.filter(o => {
        const score = o.qualification?.score || 0;
        return score >= 50 && score < 70;
    });

    const formatValue = (val) => val ? `$${(val / 1000).toFixed(0)}K` : 'TBD';
    const formatDate = (dateStr) => {
        if (!dateStr) return 'TBD';
        const date = new Date(dateStr);
        const days = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));
        if (days < 0) return 'CLOSED';
        if (days <= 3) return `⚠️ ${days}d`;
        if (days <= 7) return `${days}d`;
        return date.toLocaleDateString();
    };

    const oppRow = (opp) => {
        const score = opp.qualification?.score || 0;
        const tier = score >= 70 ? 'GO' : score >= 50 ? 'EVAL' : 'PASS';
        const tierColor = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#6b7280';

        return `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                    <strong>${opp.title || 'Untitled'}</strong><br>
                    <span style="color: #6b7280; font-size: 12px;">${opp.agency || 'Unknown'}</span>
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
                    <span style="background: ${tierColor}22; color: ${tierColor}; padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 12px;">
                        ${tier} ${score}%
                    </span>
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    ${formatValue(opp.value || opp.estimated_value)}
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">
                    ${formatDate(opp.closeDate || opp.response_deadline)}
                </td>
            </tr>
        `;
    };

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Singh Automation - Daily Digest</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981, #06b6d4); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 24px;">Singh Automation</h1>
            <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Daily Opportunity Digest</p>
        </div>

        <!-- Stats Summary -->
        <div style="background: white; padding: 20px; border-bottom: 1px solid #e5e7eb;">
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="text-align: center; padding: 10px;">
                        <div style="font-size: 28px; font-weight: 700; color: #10b981;">${goOpps.length}</div>
                        <div style="font-size: 12px; color: #6b7280; text-transform: uppercase;">GO</div>
                    </td>
                    <td style="text-align: center; padding: 10px;">
                        <div style="font-size: 28px; font-weight: 700; color: #f59e0b;">${evalOpps.length}</div>
                        <div style="font-size: 12px; color: #6b7280; text-transform: uppercase;">Evaluate</div>
                    </td>
                    <td style="text-align: center; padding: 10px;">
                        <div style="font-size: 28px; font-weight: 700; color: #ef4444;">${urgent.length}</div>
                        <div style="font-size: 12px; color: #6b7280; text-transform: uppercase;">Urgent</div>
                    </td>
                    <td style="text-align: center; padding: 10px;">
                        <div style="font-size: 28px; font-weight: 700; color: #3b82f6;">${opportunities.length}</div>
                        <div style="font-size: 12px; color: #6b7280; text-transform: uppercase;">Total</div>
                    </td>
                </tr>
            </table>
        </div>

        ${urgent.length > 0 ? `
        <!-- Urgent Section -->
        <div style="background: #fef3c7; padding: 16px 20px; border-left: 4px solid #f59e0b;">
            <h2 style="margin: 0 0 12px; color: #92400e; font-size: 16px;">⚠️ Closing This Week (${urgent.length})</h2>
            <table width="100%" cellpadding="0" cellspacing="0" style="background: white; border-radius: 8px; overflow: hidden;">
                <thead>
                    <tr style="background: #f9fafb;">
                        <th style="padding: 10px 12px; text-align: left; font-size: 11px; color: #6b7280; text-transform: uppercase;">Opportunity</th>
                        <th style="padding: 10px 12px; text-align: center; font-size: 11px; color: #6b7280; text-transform: uppercase;">Score</th>
                        <th style="padding: 10px 12px; text-align: right; font-size: 11px; color: #6b7280; text-transform: uppercase;">Value</th>
                        <th style="padding: 10px 12px; text-align: right; font-size: 11px; color: #6b7280; text-transform: uppercase;">Due</th>
                    </tr>
                </thead>
                <tbody>
                    ${urgent.slice(0, 5).map(oppRow).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}

        ${goOpps.length > 0 ? `
        <!-- GO Opportunities -->
        <div style="background: white; padding: 20px;">
            <h2 style="margin: 0 0 12px; color: #065f46; font-size: 16px;">✓ GO Opportunities (${goOpps.length})</h2>
            <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <thead>
                    <tr style="background: #f9fafb;">
                        <th style="padding: 10px 12px; text-align: left; font-size: 11px; color: #6b7280; text-transform: uppercase;">Opportunity</th>
                        <th style="padding: 10px 12px; text-align: center; font-size: 11px; color: #6b7280; text-transform: uppercase;">Score</th>
                        <th style="padding: 10px 12px; text-align: right; font-size: 11px; color: #6b7280; text-transform: uppercase;">Value</th>
                        <th style="padding: 10px 12px; text-align: right; font-size: 11px; color: #6b7280; text-transform: uppercase;">Due</th>
                    </tr>
                </thead>
                <tbody>
                    ${goOpps.slice(0, 10).map(oppRow).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}

        ${evalOpps.length > 0 ? `
        <!-- EVALUATE Opportunities -->
        <div style="background: white; padding: 20px; border-top: 1px solid #e5e7eb;">
            <h2 style="margin: 0 0 12px; color: #92400e; font-size: 16px;">◐ Evaluate (${evalOpps.length})</h2>
            <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <thead>
                    <tr style="background: #f9fafb;">
                        <th style="padding: 10px 12px; text-align: left; font-size: 11px; color: #6b7280; text-transform: uppercase;">Opportunity</th>
                        <th style="padding: 10px 12px; text-align: center; font-size: 11px; color: #6b7280; text-transform: uppercase;">Score</th>
                        <th style="padding: 10px 12px; text-align: right; font-size: 11px; color: #6b7280; text-transform: uppercase;">Value</th>
                        <th style="padding: 10px 12px; text-align: right; font-size: 11px; color: #6b7280; text-transform: uppercase;">Due</th>
                    </tr>
                </thead>
                <tbody>
                    ${evalOpps.slice(0, 5).map(oppRow).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}

        <!-- Pipeline Stats -->
        ${stats ? `
        <div style="background: #f9fafb; padding: 20px; border-top: 1px solid #e5e7eb;">
            <h3 style="margin: 0 0 12px; font-size: 14px; color: #374151;">Pipeline Tracking</h3>
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Active Bids:</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600;">${stats.bids || 0}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Wins:</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #10b981;">${stats.wins || 0}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Pending Outcomes:</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #f59e0b;">${stats.pending || 0}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Revenue Won:</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #10b981;">$${((stats.revenueWon || 0) / 1000000).toFixed(2)}M</td>
                </tr>
            </table>
        </div>
        ` : ''}

        <!-- Footer -->
        <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
            <p style="margin: 0 0 8px;">
                <a href="https://singh-automation.vercel.app" style="color: #10b981; text-decoration: none;">Open Dashboard</a>
            </p>
            <p style="margin: 0;">
                Singh Automation LLC | CAGE: 86VF7 | UEI: GJ1DPYQ3X8K5<br>
                ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
        </div>
    </div>
</body>
</html>
    `;

    return html;
}

/**
 * Generates plain text version of digest
 * @param {Object[]} opportunities - Array of opportunities
 * @returns {string} Plain text content
 */
function generateDigestText(opportunities) {
    const urgent = opportunities.filter(o => {
        const score = o.qualification?.score || 0;
        if (score < 50) return false;
        const closeDate = o.closeDate || o.response_deadline;
        if (!closeDate) return false;
        const daysRemaining = Math.ceil((new Date(closeDate) - new Date()) / (1000 * 60 * 60 * 24));
        return daysRemaining >= 0 && daysRemaining <= 7;
    });

    const goOpps = opportunities.filter(o => (o.qualification?.score || 0) >= 70);

    let text = `SINGH AUTOMATION - DAILY DIGEST
${'='.repeat(40)}
${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

SUMMARY
- GO Opportunities: ${goOpps.length}
- Closing This Week: ${urgent.length}
- Total Scanned: ${opportunities.length}

`;

    if (urgent.length > 0) {
        text += `⚠️ URGENT - CLOSING THIS WEEK\n${'-'.repeat(30)}\n`;
        urgent.slice(0, 5).forEach(o => {
            text += `• ${o.title}\n  ${o.agency} | Score: ${o.qualification?.score || 0}%\n\n`;
        });
    }

    if (goOpps.length > 0) {
        text += `\n✓ GO OPPORTUNITIES\n${'-'.repeat(30)}\n`;
        goOpps.slice(0, 10).forEach(o => {
            text += `• ${o.title}\n  ${o.agency} | Score: ${o.qualification?.score || 0}%\n\n`;
        });
    }

    text += `\n${'='.repeat(40)}\nView full dashboard: https://singh-automation.vercel.app\n`;

    return text;
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

/**
 * API handler for generating daily digest
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export default async function handler(req, res) {
    // Handle CORS
    if (handleCors(req, res)) return;

    const { requestId, log } = setupRequest(req, res);
    log('info', 'Digest API request');

    try {
        // Fetch current opportunities
        const samApiKey = config.api.samApiKey;
        const today = new Date();
        const ago = new Date(today);
        ago.setDate(ago.getDate() - 30);

        // Quick fetch of SAM opportunities
        const formatDate = (d) => `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;

        const keywords = ['robotic welding', 'automation', 'conveyor', 'PLC', 'SCADA'];
        const opportunities = [];
        const seenIds = new Set();

        await Promise.all(keywords.map(async (kw) => {
            try {
                const url = `https://api.sam.gov/prod/opportunities/v2/search?api_key=${samApiKey}&keyword=${encodeURIComponent(kw)}&postedFrom=${encodeURIComponent(formatDate(ago))}&postedTo=${encodeURIComponent(formatDate(today))}&limit=10`;
                const response = await fetchWithTimeout(url, `SAM:${kw}`, { timeout: 8000 });
                const data = await response.json();

                if (data?.opportunitiesData) {
                    for (const o of data.opportunitiesData) {
                        if (seenIds.has(o.noticeId)) continue;
                        seenIds.add(o.noticeId);

                        const opp = {
                            id: o.noticeId,
                            title: o.title,
                            agency: o.fullParentPathName || o.departmentName,
                            closeDate: o.responseDeadLine,
                            value: o.award?.amount,
                            naicsCode: o.naicsCode,
                            setAside: o.typeOfSetAsideDescription,
                            description: o.description
                        };

                        const qualification = qualifyOpportunity(opp, config.companyProfile);
                        opp.qualification = qualification;
                        opportunities.push(opp);
                    }
                }
            } catch (err) {
                log('warn', `Digest fetch failed: ${kw}`, { error: err.message });
            }
        }));

        // Query params
        const format = req.query.format || 'html';
        const preview = req.query.preview === 'true';

        // Pipeline stats (would come from bid storage in real implementation)
        const stats = {
            bids: 0,
            wins: 0,
            pending: 0,
            revenueWon: 0
        };

        if (format === 'json') {
            return res.status(200).json({
                success: true,
                digest: {
                    date: new Date().toISOString(),
                    total: opportunities.length,
                    go: opportunities.filter(o => (o.qualification?.score || 0) >= 70).length,
                    evaluate: opportunities.filter(o => {
                        const s = o.qualification?.score || 0;
                        return s >= 50 && s < 70;
                    }).length,
                    urgent: opportunities.filter(o => {
                        const score = o.qualification?.score || 0;
                        if (score < 50) return false;
                        const closeDate = o.closeDate;
                        if (!closeDate) return false;
                        const days = Math.ceil((new Date(closeDate) - new Date()) / (1000 * 60 * 60 * 24));
                        return days >= 0 && days <= 7;
                    }).length,
                    opportunities: opportunities.slice(0, 20)
                },
                requestId
            });
        }

        if (format === 'text') {
            const text = generateDigestText(opportunities);
            res.setHeader('Content-Type', 'text/plain');
            return res.status(200).send(text);
        }

        // HTML format (default)
        const html = generateDigestHtml(opportunities, stats);

        if (preview) {
            res.setHeader('Content-Type', 'text/html');
            return res.status(200).send(html);
        }

        // Return HTML content that can be used by email service
        return res.status(200).json({
            success: true,
            digest: {
                subject: `Singh Automation Digest - ${opportunities.filter(o => (o.qualification?.score || 0) >= 70).length} GO, ${opportunities.filter(o => {
                    const score = o.qualification?.score || 0;
                    if (score < 50) return false;
                    const closeDate = o.closeDate;
                    if (!closeDate) return false;
                    const days = Math.ceil((new Date(closeDate) - new Date()) / (1000 * 60 * 60 * 24));
                    return days >= 0 && days <= 7;
                }).length} Urgent`,
                html,
                text: generateDigestText(opportunities),
                date: new Date().toISOString()
            },
            requestId
        });

    } catch (error) {
        log('error', 'Digest generation failed', { error: error.message });
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to generate digest', details: error.message },
            requestId
        });
    }
}
