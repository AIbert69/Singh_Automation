/**
 * @fileoverview LocalStorage persistence layer for bid tracking
 * @module lib/bid-storage
 *
 * Stores tracked opportunities in browser localStorage.
 * Data structure:
 * - singh_bids: Array of TrackedOpportunity objects
 * - singh_bids_meta: Metadata (last sync, version)
 */

const STORAGE_KEY = 'singh_bids';
const META_KEY = 'singh_bids_meta';
const CURRENT_VERSION = 1;

/**
 * Gets all tracked opportunities from storage
 * @returns {Array} Array of tracked opportunities
 */
export function getAllTracked() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('[BidStorage] Error reading from localStorage:', error);
        return [];
    }
}

/**
 * Saves a tracked opportunity
 * @param {Object} tracked - Tracked opportunity object
 * @returns {Object} The saved opportunity
 */
export function saveTracked(tracked) {
    try {
        const all = getAllTracked();
        const existingIndex = all.findIndex(t => t.id === tracked.id);

        if (existingIndex >= 0) {
            // Update existing
            all[existingIndex] = { ...all[existingIndex], ...tracked, updatedAt: new Date().toISOString() };
        } else {
            // Add new
            all.push({ ...tracked, createdAt: new Date().toISOString() });
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
        updateMeta();
        return tracked;
    } catch (error) {
        console.error('[BidStorage] Error saving to localStorage:', error);
        throw error;
    }
}

/**
 * Gets a single tracked opportunity by ID
 * @param {string} id - Opportunity ID
 * @returns {Object|null} Tracked opportunity or null
 */
export function getTrackedById(id) {
    const all = getAllTracked();
    return all.find(t => t.id === id) || null;
}

/**
 * Updates decision for an opportunity
 * @param {string} id - Opportunity ID
 * @param {string} decision - BID | NO_BID | REVIEWING
 * @param {string} [reason] - Optional reason
 * @returns {Object|null} Updated opportunity or null
 */
export function updateDecision(id, decision, reason = null) {
    const tracked = getTrackedById(id);
    if (!tracked) return null;

    tracked.decision = decision;
    tracked.decisionDate = new Date().toISOString();
    if (reason) tracked.decisionReason = reason;

    return saveTracked(tracked);
}

/**
 * Records outcome for an opportunity
 * @param {string} id - Opportunity ID
 * @param {string} outcome - WON | LOST | NO_AWARD | WITHDRAWN
 * @param {Object} [details] - Additional details
 * @returns {Object|null} Updated opportunity or null
 */
export function recordOutcome(id, outcome, details = {}) {
    const tracked = getTrackedById(id);
    if (!tracked) return null;

    tracked.outcome = outcome;
    tracked.outcomeDate = new Date().toISOString();
    if (details.actualValue) tracked.actualValue = details.actualValue;
    if (details.notes) tracked.metadata = { ...tracked.metadata, notes: details.notes };

    return saveTracked(tracked);
}

/**
 * Deletes a tracked opportunity
 * @param {string} id - Opportunity ID
 * @returns {boolean} True if deleted
 */
export function deleteTracked(id) {
    try {
        const all = getAllTracked();
        const filtered = all.filter(t => t.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        updateMeta();
        return true;
    } catch (error) {
        console.error('[BidStorage] Error deleting:', error);
        return false;
    }
}

/**
 * Gets opportunities filtered by decision status
 * @param {string} decision - Decision filter
 * @returns {Array} Filtered opportunities
 */
export function getByDecision(decision) {
    return getAllTracked().filter(t => t.decision === decision);
}

/**
 * Gets opportunities filtered by outcome
 * @param {string} outcome - Outcome filter
 * @returns {Array} Filtered opportunities
 */
export function getByOutcome(outcome) {
    return getAllTracked().filter(t => t.outcome === outcome);
}

/**
 * Gets pending opportunities (no outcome yet, decision is BID or SUBMITTED)
 * @returns {Array} Pending opportunities
 */
export function getPending() {
    return getAllTracked().filter(t =>
        (t.decision === 'BID' || t.decision === 'SUBMITTED') && !t.outcome
    );
}

/**
 * Gets statistics summary
 * @returns {Object} Statistics
 */
export function getStats() {
    const all = getAllTracked();

    const stats = {
        total: all.length,
        byDecision: {
            BID: 0,
            NO_BID: 0,
            REVIEWING: 0,
            DISCOVERED: 0
        },
        byOutcome: {
            WON: 0,
            LOST: 0,
            NO_AWARD: 0,
            PENDING: 0
        },
        byTier: {
            GO: { total: 0, bids: 0, wins: 0 },
            EVALUATE: { total: 0, bids: 0, wins: 0 },
            PASS: { total: 0, bids: 0, wins: 0 }
        },
        revenueWon: 0,
        pipelineValue: 0
    };

    all.forEach(t => {
        // Count by decision
        if (t.decision && stats.byDecision[t.decision] !== undefined) {
            stats.byDecision[t.decision]++;
        }

        // Count by outcome
        if (t.outcome) {
            if (stats.byOutcome[t.outcome] !== undefined) {
                stats.byOutcome[t.outcome]++;
            }
            if (t.outcome === 'WON') {
                stats.revenueWon += t.actualValue || t.estimatedValue || 0;
            }
        } else if (t.decision === 'BID' || t.decision === 'SUBMITTED') {
            stats.byOutcome.PENDING++;
            stats.pipelineValue += t.estimatedValue || 0;
        }

        // Count by tier
        const tier = t.qualificationStatus || 'PASS';
        if (stats.byTier[tier]) {
            stats.byTier[tier].total++;
            if (t.decision === 'BID' || t.decision === 'SUBMITTED') {
                stats.byTier[tier].bids++;
            }
            if (t.outcome === 'WON') {
                stats.byTier[tier].wins++;
            }
        }
    });

    // Calculate win rates
    Object.keys(stats.byTier).forEach(tier => {
        const { bids, wins } = stats.byTier[tier];
        stats.byTier[tier].winRate = bids > 0 ? Math.round((wins / bids) * 100) : 0;
    });

    return stats;
}

/**
 * Updates metadata
 */
function updateMeta() {
    const meta = {
        version: CURRENT_VERSION,
        lastUpdated: new Date().toISOString(),
        count: getAllTracked().length
    };
    localStorage.setItem(META_KEY, JSON.stringify(meta));
}

/**
 * Gets metadata
 * @returns {Object} Metadata
 */
export function getMeta() {
    try {
        const data = localStorage.getItem(META_KEY);
        return data ? JSON.parse(data) : { version: CURRENT_VERSION, count: 0 };
    } catch {
        return { version: CURRENT_VERSION, count: 0 };
    }
}

/**
 * Exports all data as JSON string
 * @returns {string} JSON string
 */
export function exportData() {
    return JSON.stringify({
        version: CURRENT_VERSION,
        exportedAt: new Date().toISOString(),
        data: getAllTracked()
    }, null, 2);
}

/**
 * Imports data from JSON string
 * @param {string} jsonString - JSON data
 * @returns {{ success: boolean, imported: number, error?: string }}
 */
export function importData(jsonString) {
    try {
        const parsed = JSON.parse(jsonString);
        const data = parsed.data || parsed;

        if (!Array.isArray(data)) {
            return { success: false, imported: 0, error: 'Invalid data format' };
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        updateMeta();
        return { success: true, imported: data.length };
    } catch (error) {
        return { success: false, imported: 0, error: error.message };
    }
}

/**
 * Clears all tracked data
 * @returns {boolean} True if cleared
 */
export function clearAll() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(META_KEY);
        return true;
    } catch {
        return false;
    }
}

export default {
    getAllTracked,
    saveTracked,
    getTrackedById,
    updateDecision,
    recordOutcome,
    deleteTracked,
    getByDecision,
    getByOutcome,
    getPending,
    getStats,
    getMeta,
    exportData,
    importData,
    clearAll
};
