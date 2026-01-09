// /api/cron/daily-scan.js
// Automated Daily Opportunity Scan + Email Report
// Runs every day at 7:00 AM EST via Vercel Cron

export const config = {
    schedule: '0 12 * * *' // 12:00 UTC = 7:00 AM EST
};

export default async function handler(req, res) {
    const startTime = Date.now();
    const runId = `cron_${Date.now()}`;

    console.log(`[${runId}] Daily scan started`);

    try {
        // Get base URL from environment or default
        const baseUrl = process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : 'https://singh-automation.vercel.app';

        // ═══════════════════════════════════════════════════════════════════
        // STEP 1: Fetch fresh opportunities from SAM.gov
        // ═══════════════════════════════════════════════════════════════════
        console.log(`[${runId}] Fetching SAM.gov opportunities...`);

        const samResponse = await fetch(`${baseUrl}/api/sam-live?days=3&limit=50`, {
            headers: { 'Content-Type': 'application/json' }
        });

        let samOpportunities = [];
        if (samResponse.ok) {
            const samData = await samResponse.json();
            samOpportunities = samData.opportunities || [];
            console.log(`[${runId}] SAM.gov returned ${samOpportunities.length} opportunities`);
        } else {
            console.error(`[${runId}] SAM.gov fetch failed: ${samResponse.status}`);
        }

        // ═══════════════════════════════════════════════════════════════════
        // STEP 2: Fetch subcontracting opportunities from USASpending
        // ═══════════════════════════════════════════════════════════════════
        console.log(`[${runId}] Fetching subcontracting opportunities...`);

        const subResponse = await fetch(`${baseUrl}/api/subcontracting?daysBack=7&limit=20`, {
            headers: { 'Content-Type': 'application/json' }
        });

        let subOpportunities = [];
        if (subResponse.ok) {
            const subData = await subResponse.json();
            subOpportunities = (subData.opportunities || []).map(opp => ({
                title: `SUBK: ${opp.recipientName} - ${opp.awardDescription || 'Prime Contract'}`,
                agency: opp.awardingAgencyName,
                naics: opp.naicsCode,
                value_est: `$${(opp.awardAmount / 1000000).toFixed(1)}M`,
                description: `Prime contractor: ${opp.recipientName}. Award: ${opp.awardDescription}. Potential subcontracting opportunity.`,
                type: 'subcontracting',
                tier: opp.tier
            }));
            console.log(`[${runId}] Subcontracting returned ${subOpportunities.length} opportunities`);
        } else {
            console.error(`[${runId}] Subcontracting fetch failed: ${subResponse.status}`);
        }

        // ═══════════════════════════════════════════════════════════════════
        // STEP 3: Combine all opportunities
        // ═══════════════════════════════════════════════════════════════════
        const allOpportunities = [
            ...samOpportunities.map(opp => ({
                title: opp.title,
                agency: opp.agency,
                solicitation_number: opp.noticeId || opp.solicitation,
                naics: opp.naicsCode,
                set_aside: opp.setAside,
                value_est: opp.value ? `$${(opp.value / 1000).toFixed(0)}K` : 'TBD',
                description: opp.description,
                deadline: opp.responseDeadLine || opp.closeDate,
                link: opp.uiLink || `https://sam.gov/opp/${opp.noticeId}/view`,
                matchScore: opp.matchScore,
                type: 'sam'
            })),
            ...subOpportunities
        ];

        console.log(`[${runId}] Total opportunities to analyze: ${allOpportunities.length}`);

        // ═══════════════════════════════════════════════════════════════════
        // STEP 4: Generate and send the daily report
        // ═══════════════════════════════════════════════════════════════════
        if (allOpportunities.length === 0) {
            console.log(`[${runId}] No opportunities found, skipping email`);
            return res.status(200).json({
                success: true,
                runId,
                message: 'No opportunities found today',
                emailSent: false
            });
        }

        console.log(`[${runId}] Generating daily report...`);

        const reportResponse = await fetch(`${baseUrl}/api/daily-report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                opportunities: allOpportunities,
                sendEmail: true,
                recipientEmail: process.env.REPORT_EMAIL || 'albert@singhautomation.com'
            })
        });

        const reportData = await reportResponse.json();
        const latencyMs = Date.now() - startTime;

        if (reportData.success) {
            console.log(`[${runId}] Daily report sent successfully in ${latencyMs}ms`);
            return res.status(200).json({
                success: true,
                runId,
                message: 'Daily scan complete, email sent',
                stats: {
                    samOpportunities: samOpportunities.length,
                    subOpportunities: subOpportunities.length,
                    totalAnalyzed: allOpportunities.length,
                    latencyMs
                },
                emailSent: reportData.email?.sent || false
            });
        } else {
            console.error(`[${runId}] Report generation failed:`, reportData.error);
            return res.status(500).json({
                success: false,
                runId,
                error: reportData.error,
                latencyMs
            });
        }

    } catch (error) {
        console.error(`[${runId}] Daily scan error:`, error);
        return res.status(500).json({
            success: false,
            runId,
            error: error.message
        });
    }
}
