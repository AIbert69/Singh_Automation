/**
 * @fileoverview Bid/Outcome Tracking for Singh Automation
 * @module lib/bid-tracking
 *
 * This module provides the data structures and utilities for tracking
 * bid decisions and outcomes. This is the foundation for:
 * - Validating that scoring algorithms predict wins
 * - Calculating actual ROI from the platform
 * - Improving qualification over time
 *
 * ## Bid Lifecycle
 *
 * 1. DISCOVERED - Opportunity found via scan
 * 2. REVIEWING - Under active evaluation
 * 3. BID - Decision made to pursue
 * 4. NO_BID - Decision made to pass
 * 5. SUBMITTED - Proposal submitted
 * 6. WON / LOST / NO_AWARD / PENDING - Final outcome
 *
 * ## Usage
 *
 * Track decisions:
 * ```js
 * const tracked = trackBidDecision(opportunity, 'BID', { estimatedEffort: '40hrs' });
 * ```
 *
 * Record outcomes:
 * ```js
 * const result = recordOutcome(opportunityId, 'WON', { actualValue: 1500000 });
 * ```
 */

/**
 * @typedef {'DISCOVERED' | 'REVIEWING' | 'BID' | 'NO_BID' | 'SUBMITTED'} BidDecision
 */

/**
 * @typedef {'PENDING' | 'WON' | 'LOST' | 'NO_AWARD' | 'WITHDRAWN'} BidOutcome
 */

/**
 * @typedef {Object} TrackedOpportunity
 * @property {string} id - Opportunity ID
 * @property {string} title - Opportunity title
 * @property {string} agency - Contracting agency
 * @property {number} qualificationScore - Score at time of discovery
 * @property {string} qualificationStatus - Status (GO/EVALUATE/PASS) at discovery
 * @property {number} estimatedValue - Estimated contract value
 * @property {string} closeDate - Response deadline
 * @property {BidDecision} decision - Current bid decision
 * @property {string} decisionDate - When decision was made
 * @property {string} [decisionReason] - Why this decision was made
 * @property {BidOutcome} [outcome] - Final outcome (if known)
 * @property {string} [outcomeDate] - When outcome was recorded
 * @property {number} [actualValue] - Actual contract value (if won)
 * @property {Object} [metadata] - Additional tracking data
 */

/**
 * Creates a tracked opportunity record from a scanned opportunity
 * @param {Object} opportunity - Raw opportunity from scan
 * @param {BidDecision} decision - Initial decision
 * @param {Object} [metadata] - Additional data
 * @returns {TrackedOpportunity}
 */
export function trackBidDecision(opportunity, decision, metadata = {}) {
    const score = opportunity.match_score || opportunity.qualification?.score || 0;
    const status = score >= 70 ? 'GO' : score >= 50 ? 'EVALUATE' : 'PASS';

    return {
        id: opportunity.id,
        title: opportunity.title || 'Untitled',
        agency: opportunity.agency || 'Unknown',
        qualificationScore: score,
        qualificationStatus: status,
        estimatedValue: opportunity.estimated_value || opportunity.value || 0,
        closeDate: opportunity.response_deadline || opportunity.closeDate || null,
        decision,
        decisionDate: new Date().toISOString(),
        decisionReason: metadata.reason || null,
        outcome: null,
        outcomeDate: null,
        actualValue: null,
        metadata: {
            source: opportunity.source || 'unknown',
            naicsCode: opportunity.naicsCode || null,
            setAside: opportunity.setAside || null,
            ...metadata
        }
    };
}

/**
 * Records the outcome of a bid
 * @param {TrackedOpportunity} tracked - Tracked opportunity
 * @param {BidOutcome} outcome - Final outcome
 * @param {Object} [details] - Outcome details
 * @returns {TrackedOpportunity}
 */
export function recordOutcome(tracked, outcome, details = {}) {
    return {
        ...tracked,
        outcome,
        outcomeDate: new Date().toISOString(),
        actualValue: details.actualValue || null,
        metadata: {
            ...tracked.metadata,
            winReason: details.winReason || null,
            lossReason: details.lossReason || null,
            competitor: details.competitor || null,
            lessonsLearned: details.lessonsLearned || null
        }
    };
}

/**
 * Calculates win rate by qualification tier
 * @param {TrackedOpportunity[]} opportunities - Array of tracked opportunities
 * @returns {Object} Win rates by tier
 */
export function calculateWinRatesByTier(opportunities) {
    const bids = opportunities.filter(o => o.decision === 'BID' || o.decision === 'SUBMITTED');
    const withOutcomes = bids.filter(o => o.outcome === 'WON' || o.outcome === 'LOST');

    const tiers = {
        GO: { bids: 0, wins: 0, totalValue: 0, wonValue: 0 },
        EVALUATE: { bids: 0, wins: 0, totalValue: 0, wonValue: 0 },
        PASS: { bids: 0, wins: 0, totalValue: 0, wonValue: 0 }
    };

    withOutcomes.forEach(o => {
        const tier = o.qualificationStatus;
        if (tiers[tier]) {
            tiers[tier].bids++;
            tiers[tier].totalValue += o.estimatedValue || 0;
            if (o.outcome === 'WON') {
                tiers[tier].wins++;
                tiers[tier].wonValue += o.actualValue || o.estimatedValue || 0;
            }
        }
    });

    // Calculate win rates
    Object.keys(tiers).forEach(tier => {
        tiers[tier].winRate = tiers[tier].bids > 0
            ? Math.round((tiers[tier].wins / tiers[tier].bids) * 100)
            : 0;
    });

    return tiers;
}

/**
 * Calculates overall pipeline metrics
 * @param {TrackedOpportunity[]} opportunities - Array of tracked opportunities
 * @returns {Object} Pipeline metrics
 */
export function calculatePipelineMetrics(opportunities) {
    const now = new Date();

    const metrics = {
        totalTracked: opportunities.length,
        activeBids: opportunities.filter(o =>
            o.decision === 'BID' || o.decision === 'SUBMITTED'
        ).length,
        pendingOutcomes: opportunities.filter(o =>
            (o.decision === 'BID' || o.decision === 'SUBMITTED') && !o.outcome
        ).length,
        totalWins: opportunities.filter(o => o.outcome === 'WON').length,
        totalLosses: opportunities.filter(o => o.outcome === 'LOST').length,
        revenueWon: opportunities
            .filter(o => o.outcome === 'WON')
            .reduce((sum, o) => sum + (o.actualValue || o.estimatedValue || 0), 0),
        avgQualificationScore: 0,
        avgWinningScore: 0
    };

    // Calculate average scores
    const withScores = opportunities.filter(o => o.qualificationScore > 0);
    if (withScores.length > 0) {
        metrics.avgQualificationScore = Math.round(
            withScores.reduce((sum, o) => sum + o.qualificationScore, 0) / withScores.length
        );
    }

    const wins = opportunities.filter(o => o.outcome === 'WON');
    if (wins.length > 0) {
        metrics.avgWinningScore = Math.round(
            wins.reduce((sum, o) => sum + o.qualificationScore, 0) / wins.length
        );
    }

    return metrics;
}

/**
 * Validates that scoring is predictive
 * Returns true if GO opportunities win more often than EVALUATE
 * @param {TrackedOpportunity[]} opportunities - Array of tracked opportunities
 * @returns {{ valid: boolean, message: string, data: Object }}
 */
export function validateScoringAccuracy(opportunities) {
    const rates = calculateWinRatesByTier(opportunities);

    const goWinRate = rates.GO.winRate;
    const evalWinRate = rates.EVALUATE.winRate;
    const minSampleSize = 5;

    // Need enough data to validate
    if (rates.GO.bids < minSampleSize || rates.EVALUATE.bids < minSampleSize) {
        return {
            valid: null, // Unknown - not enough data
            message: `Need at least ${minSampleSize} bids per tier to validate. GO: ${rates.GO.bids}, EVALUATE: ${rates.EVALUATE.bids}`,
            data: rates
        };
    }

    // GO should win more often than EVALUATE
    if (goWinRate > evalWinRate) {
        return {
            valid: true,
            message: `Scoring is predictive. GO wins ${goWinRate}% vs EVALUATE ${evalWinRate}%`,
            data: rates
        };
    }

    return {
        valid: false,
        message: `Scoring needs calibration. GO wins ${goWinRate}% but EVALUATE wins ${evalWinRate}%`,
        data: rates
    };
}

export default {
    trackBidDecision,
    recordOutcome,
    calculateWinRatesByTier,
    calculatePipelineMetrics,
    validateScoringAccuracy
};
