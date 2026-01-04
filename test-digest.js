#!/usr/bin/env node
/**
 * Test script for daily digest email generation
 * Run: node test-digest.js
 *
 * This generates the digest HTML and saves it to digest-preview.html
 * for viewing in a browser.
 */

import fs from 'fs';

// Mock opportunities for testing (simulates what would come from SAM.gov)
const mockOpportunities = [
    {
        id: 'test-1',
        title: 'Robotic Welding System for Navy Shipyard',
        agency: 'Department of the Navy - NAVSEA',
        closeDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
        value: 2500000,
        qualification: { score: 85, status: 'GO' }
    },
    {
        id: 'test-2',
        title: 'Industrial Automation Controls Upgrade',
        agency: 'Department of the Army - AMC',
        closeDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days
        value: 1800000,
        qualification: { score: 78, status: 'GO' }
    },
    {
        id: 'test-3',
        title: 'PLC Programming Services for Manufacturing',
        agency: 'Department of Defense - DLA',
        closeDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days - URGENT
        value: 450000,
        qualification: { score: 72, status: 'GO' }
    },
    {
        id: 'test-4',
        title: 'Conveyor System Installation',
        agency: 'General Services Administration',
        closeDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
        value: 950000,
        qualification: { score: 65, status: 'EVALUATE' }
    },
    {
        id: 'test-5',
        title: 'SCADA System Modernization',
        agency: 'Department of Energy',
        closeDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days - URGENT
        value: 1200000,
        qualification: { score: 58, status: 'EVALUATE' }
    },
    {
        id: 'test-6',
        title: 'Warehouse Automation Project',
        agency: 'Department of Veterans Affairs',
        closeDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 21 days
        value: 3200000,
        qualification: { score: 52, status: 'EVALUATE' }
    },
    {
        id: 'test-7',
        title: 'Machine Vision Quality Control System',
        agency: 'NASA',
        closeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        value: 750000,
        qualification: { score: 45, status: 'PASS' }
    }
];

// Mock pipeline stats (simulates data from bid-storage)
const mockStats = {
    bids: 12,
    wins: 3,
    pending: 5,
    revenueWon: 4250000
};

/**
 * Generates the HTML email content
 */
function generateDigestHtml(opportunities, stats) {
    const urgent = opportunities.filter(o => {
        const score = o.qualification?.score || 0;
        if (score < 50) return false;
        const closeDate = o.closeDate;
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
                    ${formatValue(opp.value)}
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">
                    ${formatDate(opp.closeDate)}
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
        <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px; border-radius: 0 0 12px 12px; background: white;">
            <p style="margin: 0 0 8px;">
                <a href="https://singh-automation.vercel.app" style="color: #10b981; text-decoration: none; font-weight: 600;">Open Dashboard →</a>
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

// Generate the digest
console.log('📧 Generating Daily Digest Email...\n');

const html = generateDigestHtml(mockOpportunities, mockStats);

// Save to file for preview
fs.writeFileSync('digest-preview.html', html);
console.log('✅ Digest saved to: digest-preview.html');

// Print summary
const urgent = mockOpportunities.filter(o => {
    const score = o.qualification?.score || 0;
    if (score < 50) return false;
    const closeDate = o.closeDate;
    if (!closeDate) return false;
    const days = Math.ceil((new Date(closeDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 7;
});

const goCount = mockOpportunities.filter(o => (o.qualification?.score || 0) >= 70).length;
const evalCount = mockOpportunities.filter(o => {
    const s = o.qualification?.score || 0;
    return s >= 50 && s < 70;
}).length;

console.log('\n📊 Digest Summary:');
console.log(`   GO Opportunities:     ${goCount}`);
console.log(`   EVALUATE Opportunities: ${evalCount}`);
console.log(`   Urgent (≤7 days):     ${urgent.length}`);
console.log(`   Total Scanned:        ${mockOpportunities.length}`);
console.log(`\n   Pipeline Stats:`);
console.log(`   - Active Bids: ${mockStats.bids}`);
console.log(`   - Wins: ${mockStats.wins}`);
console.log(`   - Pending: ${mockStats.pending}`);
console.log(`   - Revenue Won: $${(mockStats.revenueWon / 1000000).toFixed(2)}M`);

console.log('\n📬 To view the email:');
console.log('   1. Open digest-preview.html in a browser');
console.log('   2. Or run: npx serve . and visit localhost:3000/digest-preview.html');
console.log('\n🚀 To test the live API (requires SAM_API_KEY):');
console.log('   curl "https://singh-automation.vercel.app/api/digest?preview=true"');
