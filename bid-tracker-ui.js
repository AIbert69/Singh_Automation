/**
 * Bid Tracker UI Component
 * ========================
 *
 * Adds bid tracking functionality to the Singh Automation dashboard:
 * - BID/PASS buttons on each opportunity row
 * - Decision modal for recording reasons
 * - Outcome recording modal
 * - Win rate dashboard panel
 *
 * Uses localStorage via bid-storage.js for persistence.
 */

// =============================================================================
// STORAGE INTEGRATION (inline for browser compatibility)
// =============================================================================

const BidStorage = {
    STORAGE_KEY: 'singh_bids',

    getAllTracked() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    },

    saveTracked(tracked) {
        const all = this.getAllTracked();
        const existingIndex = all.findIndex(t => t.id === tracked.id);
        if (existingIndex >= 0) {
            all[existingIndex] = { ...all[existingIndex], ...tracked, updatedAt: new Date().toISOString() };
        } else {
            all.push({ ...tracked, createdAt: new Date().toISOString() });
        }
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(all));
        return tracked;
    },

    getTrackedById(id) {
        return this.getAllTracked().find(t => t.id === id) || null;
    },

    getStats() {
        const all = this.getAllTracked();
        const stats = {
            total: all.length,
            bids: all.filter(t => t.decision === 'BID').length,
            wins: all.filter(t => t.outcome === 'WON').length,
            losses: all.filter(t => t.outcome === 'LOST').length,
            pending: all.filter(t => t.decision === 'BID' && !t.outcome).length,
            revenueWon: all.filter(t => t.outcome === 'WON')
                .reduce((sum, t) => sum + (t.actualValue || t.estimatedValue || 0), 0),
            byTier: { GO: { bids: 0, wins: 0 }, EVALUATE: { bids: 0, wins: 0 }, PASS: { bids: 0, wins: 0 } }
        };

        all.forEach(t => {
            const tier = t.qualificationStatus || 'PASS';
            if (stats.byTier[tier]) {
                if (t.decision === 'BID') stats.byTier[tier].bids++;
                if (t.outcome === 'WON') stats.byTier[tier].wins++;
            }
        });

        Object.keys(stats.byTier).forEach(tier => {
            const { bids, wins } = stats.byTier[tier];
            stats.byTier[tier].winRate = bids > 0 ? Math.round((wins / bids) * 100) : 0;
        });

        return stats;
    }
};

// =============================================================================
// UI COMPONENTS
// =============================================================================

/**
 * Creates the bid decision modal HTML
 */
function createBidModal() {
    const modal = document.createElement('div');
    modal.id = 'bidModal';
    modal.className = 'bid-modal';
    modal.innerHTML = `
        <div class="bid-modal-content">
            <div class="bid-modal-header">
                <h3 id="bidModalTitle">Record Decision</h3>
                <button class="bid-modal-close" onclick="closeBidModal()">&times;</button>
            </div>
            <div class="bid-modal-body">
                <input type="hidden" id="bidModalOppId">
                <input type="hidden" id="bidModalAction">

                <div class="bid-form-group">
                    <label>Opportunity</label>
                    <p id="bidModalOppTitle" class="bid-modal-opp-title"></p>
                </div>

                <div class="bid-form-group" id="decisionGroup">
                    <label>Decision</label>
                    <div class="bid-decision-btns">
                        <button class="bid-decision-btn bid" onclick="selectDecision('BID')">
                            <span class="icon">✓</span> BID
                        </button>
                        <button class="bid-decision-btn pass" onclick="selectDecision('NO_BID')">
                            <span class="icon">✗</span> PASS
                        </button>
                    </div>
                </div>

                <div class="bid-form-group" id="outcomeGroup" style="display:none">
                    <label>Outcome</label>
                    <div class="bid-outcome-btns">
                        <button class="bid-outcome-btn won" onclick="selectOutcome('WON')">WON</button>
                        <button class="bid-outcome-btn lost" onclick="selectOutcome('LOST')">LOST</button>
                        <button class="bid-outcome-btn no-award" onclick="selectOutcome('NO_AWARD')">NO AWARD</button>
                    </div>
                </div>

                <div class="bid-form-group" id="valueGroup" style="display:none">
                    <label>Actual Value ($)</label>
                    <input type="number" id="bidActualValue" placeholder="Contract value if won">
                </div>

                <div class="bid-form-group">
                    <label>Notes (optional)</label>
                    <textarea id="bidNotes" rows="3" placeholder="Why this decision? Key factors..."></textarea>
                </div>
            </div>
            <div class="bid-modal-footer">
                <button class="btn btn-secondary" onclick="closeBidModal()">Cancel</button>
                <button class="btn btn-primary" id="bidSaveBtn" onclick="saveBidDecision()">Save</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

/**
 * Creates the win rate dashboard panel
 */
function createWinRateDashboard() {
    const dashboard = document.createElement('div');
    dashboard.id = 'winRateDashboard';
    dashboard.className = 'panel win-rate-dashboard';
    dashboard.innerHTML = `
        <div class="panel-header">
            <span class="icon">📊</span>
            <span class="panel-title">Win Rate Tracker</span>
        </div>
        <div class="win-rate-content">
            <div class="win-rate-summary">
                <div class="win-stat">
                    <span class="win-stat-value" id="totalBids">0</span>
                    <span class="win-stat-label">Bids</span>
                </div>
                <div class="win-stat won">
                    <span class="win-stat-value" id="totalWins">0</span>
                    <span class="win-stat-label">Wins</span>
                </div>
                <div class="win-stat pending">
                    <span class="win-stat-value" id="totalPending">0</span>
                    <span class="win-stat-label">Pending</span>
                </div>
            </div>
            <div class="win-rate-revenue">
                <span class="revenue-label">Revenue Won</span>
                <span class="revenue-value" id="revenueWon">$0</span>
            </div>
            <div class="win-rate-tiers">
                <div class="tier-row">
                    <span class="tier-name go">GO</span>
                    <div class="tier-bar"><div class="tier-bar-fill" id="goBar"></div></div>
                    <span class="tier-rate" id="goRate">0%</span>
                </div>
                <div class="tier-row">
                    <span class="tier-name eval">EVAL</span>
                    <div class="tier-bar"><div class="tier-bar-fill eval" id="evalBar"></div></div>
                    <span class="tier-rate" id="evalRate">0%</span>
                </div>
            </div>
            <div class="win-rate-validation" id="scoringValidation"></div>
        </div>
    `;
    return dashboard;
}

/**
 * Injects required CSS styles
 */
function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Bid Modal */
        .bid-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 10000;
            align-items: center;
            justify-content: center;
        }
        .bid-modal.active { display: flex; }
        .bid-modal-content {
            background: #1a2332;
            border-radius: 16px;
            width: 90%;
            max-width: 480px;
            border: 1px solid #2d3748;
        }
        .bid-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 1.25rem;
            border-bottom: 1px solid #2d3748;
        }
        .bid-modal-header h3 { margin: 0; font-size: 1.1rem; }
        .bid-modal-close {
            background: none;
            border: none;
            color: #6b7280;
            font-size: 1.5rem;
            cursor: pointer;
        }
        .bid-modal-close:hover { color: #fff; }
        .bid-modal-body { padding: 1.25rem; }
        .bid-modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 0.75rem;
            padding: 1rem 1.25rem;
            border-top: 1px solid #2d3748;
        }
        .bid-form-group { margin-bottom: 1rem; }
        .bid-form-group label {
            display: block;
            font-size: 0.75rem;
            color: #9ca3af;
            text-transform: uppercase;
            margin-bottom: 0.5rem;
        }
        .bid-modal-opp-title {
            font-size: 0.95rem;
            color: #fff;
            margin: 0;
        }
        .bid-form-group input,
        .bid-form-group textarea {
            width: 100%;
            padding: 0.75rem;
            background: #0f1419;
            border: 1px solid #2d3748;
            border-radius: 8px;
            color: #fff;
            font-size: 0.9rem;
        }
        .bid-form-group input:focus,
        .bid-form-group textarea:focus {
            outline: none;
            border-color: #10b981;
        }

        /* Decision Buttons */
        .bid-decision-btns, .bid-outcome-btns {
            display: flex;
            gap: 0.75rem;
        }
        .bid-decision-btn, .bid-outcome-btn {
            flex: 1;
            padding: 0.75rem;
            border: 2px solid #2d3748;
            border-radius: 8px;
            background: transparent;
            color: #9ca3af;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }
        .bid-decision-btn:hover, .bid-outcome-btn:hover {
            border-color: #6b7280;
            color: #fff;
        }
        .bid-decision-btn.selected.bid {
            border-color: #10b981;
            background: rgba(16, 185, 129, 0.1);
            color: #10b981;
        }
        .bid-decision-btn.selected.pass {
            border-color: #6b7280;
            background: rgba(107, 114, 128, 0.1);
            color: #9ca3af;
        }
        .bid-outcome-btn.selected.won {
            border-color: #10b981;
            background: rgba(16, 185, 129, 0.1);
            color: #10b981;
        }
        .bid-outcome-btn.selected.lost {
            border-color: #ef4444;
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
        }
        .bid-outcome-btn.selected.no-award {
            border-color: #6b7280;
            background: rgba(107, 114, 128, 0.1);
            color: #9ca3af;
        }

        /* Tracking Buttons in Table */
        .track-btns {
            display: flex;
            gap: 0.25rem;
        }
        .track-btn {
            padding: 0.4rem 0.6rem;
            border: none;
            border-radius: 6px;
            font-size: 0.7rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s;
        }
        .track-btn.bid {
            background: rgba(16, 185, 129, 0.1);
            color: #10b981;
            border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .track-btn.bid:hover {
            background: #10b981;
            color: #fff;
        }
        .track-btn.pass {
            background: rgba(107, 114, 128, 0.1);
            color: #9ca3af;
            border: 1px solid rgba(107, 114, 128, 0.3);
        }
        .track-btn.pass:hover {
            background: #6b7280;
            color: #fff;
        }
        .track-btn.outcome {
            background: rgba(59, 130, 246, 0.1);
            color: #3b82f6;
            border: 1px solid rgba(59, 130, 246, 0.3);
        }
        .tracked-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            padding: 0.3rem 0.6rem;
            border-radius: 6px;
            font-size: 0.7rem;
            font-weight: 600;
        }
        .tracked-badge.bid {
            background: rgba(16, 185, 129, 0.1);
            color: #10b981;
        }
        .tracked-badge.won {
            background: rgba(16, 185, 129, 0.2);
            color: #10b981;
        }
        .tracked-badge.lost {
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
        }
        .tracked-badge.no-bid {
            background: rgba(107, 114, 128, 0.1);
            color: #6b7280;
        }

        /* Win Rate Dashboard */
        .win-rate-dashboard {
            margin-top: 1rem;
        }
        .win-rate-content { padding: 0.5rem 0; }
        .win-rate-summary {
            display: flex;
            justify-content: space-around;
            margin-bottom: 1rem;
        }
        .win-stat { text-align: center; }
        .win-stat-value {
            display: block;
            font-size: 1.5rem;
            font-weight: 700;
            color: #fff;
        }
        .win-stat.won .win-stat-value { color: #10b981; }
        .win-stat.pending .win-stat-value { color: #f59e0b; }
        .win-stat-label {
            font-size: 0.7rem;
            color: #6b7280;
            text-transform: uppercase;
        }
        .win-rate-revenue {
            display: flex;
            justify-content: space-between;
            padding: 0.75rem;
            background: rgba(16, 185, 129, 0.1);
            border-radius: 8px;
            margin-bottom: 1rem;
        }
        .revenue-label { color: #9ca3af; font-size: 0.85rem; }
        .revenue-value { color: #10b981; font-weight: 700; }
        .win-rate-tiers { margin-bottom: 1rem; }
        .tier-row {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.5rem;
        }
        .tier-name {
            width: 40px;
            font-size: 0.7rem;
            font-weight: 600;
        }
        .tier-name.go { color: #10b981; }
        .tier-name.eval { color: #f59e0b; }
        .tier-bar {
            flex: 1;
            height: 8px;
            background: #2d3748;
            border-radius: 4px;
            overflow: hidden;
        }
        .tier-bar-fill {
            height: 100%;
            background: #10b981;
            border-radius: 4px;
            transition: width 0.3s;
        }
        .tier-bar-fill.eval { background: #f59e0b; }
        .tier-rate {
            width: 35px;
            text-align: right;
            font-size: 0.8rem;
            font-weight: 600;
            color: #fff;
        }
        .win-rate-validation {
            padding: 0.5rem 0.75rem;
            border-radius: 6px;
            font-size: 0.8rem;
        }
        .win-rate-validation.valid {
            background: rgba(16, 185, 129, 0.1);
            color: #10b981;
        }
        .win-rate-validation.invalid {
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
        }
        .win-rate-validation.unknown {
            background: rgba(107, 114, 128, 0.1);
            color: #9ca3af;
        }
    `;
    document.head.appendChild(style);
}

// =============================================================================
// MODAL FUNCTIONS (global scope for onclick handlers)
// =============================================================================

let currentModalOpp = null;
let selectedDecision = null;
let selectedOutcome = null;

window.openBidModal = function(oppId, oppTitle, action = 'decision') {
    currentModalOpp = { id: oppId, title: oppTitle };
    selectedDecision = null;
    selectedOutcome = null;

    document.getElementById('bidModalOppId').value = oppId;
    document.getElementById('bidModalAction').value = action;
    document.getElementById('bidModalOppTitle').textContent = oppTitle;
    document.getElementById('bidNotes').value = '';

    // Reset button states
    document.querySelectorAll('.bid-decision-btn, .bid-outcome-btn').forEach(btn => {
        btn.classList.remove('selected');
    });

    // Show appropriate fields
    if (action === 'outcome') {
        document.getElementById('bidModalTitle').textContent = 'Record Outcome';
        document.getElementById('decisionGroup').style.display = 'none';
        document.getElementById('outcomeGroup').style.display = 'block';
        document.getElementById('valueGroup').style.display = 'block';
    } else {
        document.getElementById('bidModalTitle').textContent = 'Record Decision';
        document.getElementById('decisionGroup').style.display = 'block';
        document.getElementById('outcomeGroup').style.display = 'none';
        document.getElementById('valueGroup').style.display = 'none';
    }

    document.getElementById('bidModal').classList.add('active');
};

window.closeBidModal = function() {
    document.getElementById('bidModal').classList.remove('active');
    currentModalOpp = null;
};

window.selectDecision = function(decision) {
    selectedDecision = decision;
    document.querySelectorAll('.bid-decision-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.closest('.bid-decision-btn').classList.add('selected');
};

window.selectOutcome = function(outcome) {
    selectedOutcome = outcome;
    document.querySelectorAll('.bid-outcome-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.closest('.bid-outcome-btn').classList.add('selected');

    // Show value field for wins
    document.getElementById('valueGroup').style.display =
        outcome === 'WON' ? 'block' : 'none';
};

window.saveBidDecision = function() {
    const oppId = document.getElementById('bidModalOppId').value;
    const action = document.getElementById('bidModalAction').value;
    const notes = document.getElementById('bidNotes').value;

    // Find the opportunity from current list
    const opp = window.currentOpportunities?.find(o => o.id === oppId);
    if (!opp) {
        showNotification('Opportunity not found', 'error');
        return;
    }

    const score = opp.match_score || opp.qualification?.score || 0;
    const tier = score >= 70 ? 'GO' : score >= 50 ? 'EVALUATE' : 'PASS';

    if (action === 'outcome') {
        if (!selectedOutcome) {
            showNotification('Please select an outcome', 'warning');
            return;
        }

        const actualValue = parseFloat(document.getElementById('bidActualValue').value) || null;
        const tracked = BidStorage.getTrackedById(oppId);

        if (tracked) {
            tracked.outcome = selectedOutcome;
            tracked.outcomeDate = new Date().toISOString();
            tracked.actualValue = actualValue;
            tracked.metadata = { ...tracked.metadata, notes };
            BidStorage.saveTracked(tracked);
        }

        showNotification(`Outcome recorded: ${selectedOutcome}`, 'success');
    } else {
        if (!selectedDecision) {
            showNotification('Please select a decision', 'warning');
            return;
        }

        const tracked = {
            id: oppId,
            title: opp.title || 'Untitled',
            agency: opp.agency || 'Unknown',
            qualificationScore: score,
            qualificationStatus: tier,
            estimatedValue: opp.estimated_value || opp.value || 0,
            closeDate: opp.response_deadline || opp.closeDate || null,
            decision: selectedDecision,
            decisionDate: new Date().toISOString(),
            decisionReason: notes || null,
            outcome: null,
            metadata: { source: opp.source || 'scan' }
        };

        BidStorage.saveTracked(tracked);
        showNotification(`Decision recorded: ${selectedDecision}`, 'success');
    }

    closeBidModal();
    updateWinRateDashboard();
    refreshTrackingButtons();
};

// =============================================================================
// DASHBOARD UPDATE
// =============================================================================

function updateWinRateDashboard() {
    const stats = BidStorage.getStats();

    const setEl = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    setEl('totalBids', stats.bids);
    setEl('totalWins', stats.wins);
    setEl('totalPending', stats.pending);
    setEl('revenueWon', `$${(stats.revenueWon / 1000000).toFixed(2)}M`);

    // Win rate bars
    const goBar = document.getElementById('goBar');
    const evalBar = document.getElementById('evalBar');
    if (goBar) goBar.style.width = `${stats.byTier.GO.winRate}%`;
    if (evalBar) evalBar.style.width = `${stats.byTier.EVALUATE.winRate}%`;

    setEl('goRate', `${stats.byTier.GO.winRate}%`);
    setEl('evalRate', `${stats.byTier.EVALUATE.winRate}%`);

    // Scoring validation
    const validationEl = document.getElementById('scoringValidation');
    if (validationEl) {
        const goWins = stats.byTier.GO.wins;
        const evalWins = stats.byTier.EVALUATE.wins;
        const goBids = stats.byTier.GO.bids;
        const evalBids = stats.byTier.EVALUATE.bids;

        if (goBids < 3 || evalBids < 3) {
            validationEl.className = 'win-rate-validation unknown';
            validationEl.textContent = `Need more data (${goBids} GO, ${evalBids} EVAL bids)`;
        } else if (stats.byTier.GO.winRate > stats.byTier.EVALUATE.winRate) {
            validationEl.className = 'win-rate-validation valid';
            validationEl.textContent = '✓ Scoring is predictive';
        } else {
            validationEl.className = 'win-rate-validation invalid';
            validationEl.textContent = '⚠ Scoring needs calibration';
        }
    }
}

/**
 * Refreshes tracking buttons on opportunity rows
 */
function refreshTrackingButtons() {
    document.querySelectorAll('[data-track-id]').forEach(container => {
        const oppId = container.dataset.trackId;
        const tracked = BidStorage.getTrackedById(oppId);

        if (tracked) {
            let badge = '';
            if (tracked.outcome === 'WON') {
                badge = '<span class="tracked-badge won">✓ WON</span>';
            } else if (tracked.outcome === 'LOST') {
                badge = '<span class="tracked-badge lost">✗ LOST</span>';
            } else if (tracked.decision === 'BID') {
                badge = `<span class="tracked-badge bid">BID</span>
                         <button class="track-btn outcome" onclick="openBidModal('${oppId}', '', 'outcome')">Outcome</button>`;
            } else if (tracked.decision === 'NO_BID') {
                badge = '<span class="tracked-badge no-bid">PASSED</span>';
            }
            container.innerHTML = badge;
        }
    });
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Adds tracking buttons to an opportunity row
 * Call this when creating rows in createOpportunityRow
 */
window.addTrackingButtons = function(row, opp) {
    const trackCell = document.createElement('td');
    trackCell.dataset.trackId = opp.id;

    const tracked = BidStorage.getTrackedById(opp.id);

    if (tracked) {
        if (tracked.outcome === 'WON') {
            trackCell.innerHTML = '<span class="tracked-badge won">✓ WON</span>';
        } else if (tracked.outcome === 'LOST') {
            trackCell.innerHTML = '<span class="tracked-badge lost">✗ LOST</span>';
        } else if (tracked.decision === 'BID') {
            trackCell.innerHTML = `
                <span class="tracked-badge bid">BID</span>
                <button class="track-btn outcome" onclick="openBidModal('${opp.id}', '${(opp.title || '').replace(/'/g, "\\'")}', 'outcome')">Outcome</button>
            `;
        } else if (tracked.decision === 'NO_BID') {
            trackCell.innerHTML = '<span class="tracked-badge no-bid">PASSED</span>';
        }
    } else {
        trackCell.innerHTML = `
            <div class="track-btns">
                <button class="track-btn bid" onclick="openBidModal('${opp.id}', '${(opp.title || '').replace(/'/g, "\\'")}', 'decision')">BID</button>
                <button class="track-btn pass" onclick="openBidModal('${opp.id}', '${(opp.title || '').replace(/'/g, "\\'")}', 'decision')">PASS</button>
            </div>
        `;
    }

    row.appendChild(trackCell);
    return row;
};

/**
 * Initialize bid tracker UI
 */
function initBidTracker() {
    console.log('[BidTracker] Initializing...');

    // Inject styles
    injectStyles();

    // Create modal
    createBidModal();

    // Create and insert dashboard
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        const dashboard = createWinRateDashboard();
        sidebar.appendChild(dashboard);
    }

    // Update dashboard with existing data
    updateWinRateDashboard();

    console.log('[BidTracker] Initialized');
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBidTracker);
} else {
    initBidTracker();
}

// Export for use in other scripts
window.BidTracker = {
    BidStorage,
    updateWinRateDashboard,
    refreshTrackingButtons,
    addTrackingButtons: window.addTrackingButtons
};

console.log('[BidTracker] Module loaded');
