/**
 * Singh Automation Platform - Frontend Agent
 * ============================================
 *
 * Handles scanning, opportunity display, and RFQ generation.
 * This is the main client-side JavaScript for the Singh Automation dashboard.
 *
 * Security Features:
 * - XSS prevention via proper escaping and event listeners
 * - Race condition prevention via Promise-based queue
 * - Input validation before API calls
 *
 * @author Singh Automation
 * @version 2.0.0
 */

// =============================================================================
// GLOBAL STATE
// =============================================================================

/** @type {Object[]} Current list of opportunities */
let currentOpportunities = [];

/** @type {Promise|null} Current processing promise for race condition prevention */
let processingPromise = null;

/** @type {AbortController|null} Current abort controller for cancellable requests */
let currentAbortController = null;

// =============================================================================
// INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('[Singh] Agent initializing...');

    // Setup event listeners (not inline onclick - XSS prevention)
    setupEventListeners();

    // Check WinScope connection
    try {
        if (typeof WinScope !== 'undefined') {
            const status = await WinScope.checkStatus();
            if (status.status === 'online') {
                console.log('[Singh] WinScope backend connected');
                updateBackendStatus(true);
            } else {
                console.warn('[Singh] WinScope backend offline');
                updateBackendStatus(false);
            }
        } else {
            console.warn('[Singh] WinScope not available');
            updateBackendStatus(false);
        }
    } catch (err) {
        console.warn('[Singh] Could not connect to backend:', err.message);
        updateBackendStatus(false);
    }

    console.log('[Singh] Agent ready');
});

/**
 * Sets up event listeners for interactive elements
 * Using addEventListener instead of inline onclick to prevent XSS
 */
function setupEventListeners() {
    // Scan button
    const scanBtn = document.getElementById('scanBtn');
    if (scanBtn) {
        scanBtn.addEventListener('click', handleScanClick);
    }

    // Filter buttons
    const filterBtns = document.querySelectorAll('[data-filter]');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const filter = e.target.dataset.filter;
            filterOpportunities(filter);
        });
    });

    // Delegate click events for dynamically created quote buttons
    const tableBody = document.getElementById('opportunitiesTable');
    if (tableBody) {
        tableBody.addEventListener('click', handleTableClick);
    }
}

/**
 * Handles clicks within the opportunities table (event delegation)
 * @param {Event} event - Click event
 */
function handleTableClick(event) {
    const target = event.target;

    // Check if clicked element is a quote button
    if (target.classList.contains('quote-btn')) {
        const opportunityId = target.dataset.opportunityId;
        if (opportunityId && isValidId(opportunityId)) {
            requestDistributorQuote(opportunityId);
        }
    }

    // Check if clicked element is a link (allow default behavior)
    if (target.tagName === 'A') {
        return; // Let the link work normally
    }
}

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Validates an opportunity ID to prevent injection
 * @param {string} id - ID to validate
 * @returns {boolean} - True if valid
 */
function isValidId(id) {
    if (!id || typeof id !== 'string') return false;
    // Allow alphanumeric, hyphens, and underscores only
    return /^[a-zA-Z0-9_-]+$/.test(id) && id.length <= 100;
}

/**
 * Escapes HTML to prevent XSS attacks
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    if (typeof str !== 'string') str = String(str);

    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Escapes a string for use in HTML attributes
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
function escapeAttr(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// =============================================================================
// MAIN FUNCTIONS
// =============================================================================

/**
 * Handles scan button click with race condition prevention
 */
async function handleScanClick() {
    // If already processing, show notification and return
    if (processingPromise) {
        showNotification('Scan already in progress...', 'warning');
        return;
    }

    // Create new processing promise
    processingPromise = scanOpportunities();

    try {
        await processingPromise;
    } finally {
        // Always clear the promise when done
        processingPromise = null;
    }
}

/**
 * Scans all procurement portals for opportunities
 * @returns {Promise<void>}
 */
async function scanOpportunities() {
    console.log('[Singh] Starting scan...');

    // Create abort controller for this scan
    currentAbortController = new AbortController();

    try {
        showLoadingIndicator('Scanning SAM.gov, SBIR, Grants.gov...');
        updateScanButton('scanning');

        let opportunities;

        // Try WinScope first, fall back to direct API
        if (typeof WinScope !== 'undefined') {
            const scanResult = await WinScope.scanPortals();
            console.log('[Singh] Scan result:', scanResult);

            opportunities = await WinScope.getOpportunities({
                minScore: 50,
                limit: 100
            });
        } else {
            // Direct API call fallback
            const response = await fetch('/api/v1/scan', {
                signal: currentAbortController.signal
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            opportunities = data.opportunities || [];
        }

        console.log(`[Singh] Found ${opportunities.length} opportunities`);

        // Update display
        currentOpportunities = opportunities;
        displayOpportunities(opportunities);
        updateStats(opportunities);

        showNotification(`Found ${opportunities.length} opportunities!`, 'success');

    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('[Singh] Scan was cancelled');
            showNotification('Scan cancelled', 'info');
        } else {
            console.error('[Singh] Scan failed:', error);
            showNotification('Scan failed. Check console for details.', 'error');
        }
    } finally {
        hideLoadingIndicator();
        updateScanButton('ready');
        currentAbortController = null;
    }
}

/**
 * Cancels the current scan operation
 */
function cancelScan() {
    if (currentAbortController) {
        currentAbortController.abort();
    }
}

/**
 * Requests a distributor quote for an opportunity
 * @param {string} opportunityId - Opportunity ID (validated)
 */
async function requestDistributorQuote(opportunityId) {
    // Validate ID again (defense in depth)
    if (!isValidId(opportunityId)) {
        showNotification('Invalid opportunity ID', 'error');
        return;
    }

    try {
        console.log('[Singh] Generating RFQ for:', opportunityId);
        showLoadingIndicator('Generating RFQ with real data...');

        let rfq;

        if (typeof WinScope !== 'undefined') {
            rfq = await WinScope.generateRFQ(opportunityId);
        } else {
            // Direct API fallback
            const response = await fetch('/api/v1/rfq', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ opportunityId })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            rfq = await response.json();
        }

        hideLoadingIndicator();
        displayRFQ(rfq);
        showNotification('RFQ generated successfully!', 'success');

    } catch (error) {
        console.error('[Singh] RFQ generation failed:', error);
        hideLoadingIndicator();
        showNotification('RFQ generation failed', 'error');
    }
}

/**
 * Filters opportunities by tiered status
 * @param {'all' | 'go' | 'evaluate' | 'actionable' | 'urgent'} filter - Filter type
 */
function filterOpportunities(filter) {
    if (!currentOpportunities.length) {
        showNotification('No opportunities to filter. Run a scan first.', 'warning');
        return;
    }

    let filtered;
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    switch (filter) {
        case 'go':
            // GO only (≥70) - high confidence
            filtered = currentOpportunities.filter(o =>
                (o.match_score || o.qualification?.score || 0) >= 70
            );
            break;
        case 'evaluate':
            // EVALUATE only (50-69) - needs capacity decision
            filtered = currentOpportunities.filter(o => {
                const score = o.match_score || o.qualification?.score || 0;
                return score >= 50 && score < 70;
            });
            break;
        case 'actionable':
            // GO + EVALUATE (≥50) - worth looking at
            filtered = currentOpportunities.filter(o =>
                (o.match_score || o.qualification?.score || 0) >= 50
            );
            break;
        case 'urgent':
            // Closing within 7 days AND actionable
            filtered = currentOpportunities.filter(o => {
                const score = o.match_score || o.qualification?.score || 0;
                if (score < 50) return false;
                const closeDate = o.response_deadline || o.closeDate;
                if (!closeDate) return false;
                const date = new Date(closeDate);
                return date >= now && date <= sevenDaysFromNow;
            });
            break;
        default:
            filtered = currentOpportunities;
    }

    displayOpportunities(filtered);
    const filterNames = { go: 'GO', evaluate: 'EVALUATE', actionable: 'actionable', urgent: 'urgent', all: 'all' };
    showNotification(`Showing ${filtered.length} ${filterNames[filter] || ''} opportunities`, 'success');
}

// =============================================================================
// DISPLAY FUNCTIONS
// =============================================================================

/**
 * Displays opportunities in the table
 * Uses safe DOM manipulation to prevent XSS
 * @param {Object[]} opportunities - Array of opportunities
 */
function displayOpportunities(opportunities) {
    const tbody = document.getElementById('opportunitiesTable');
    const countEl = document.getElementById('resultCount');

    if (!tbody) return;

    // Clear existing content safely
    tbody.innerHTML = '';

    if (!opportunities || opportunities.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 6;
        cell.innerHTML = `
            <div class="empty-state">
                <h3>No opportunities found</h3>
                <p>Try adjusting your filters or run a new scan</p>
            </div>
        `;
        row.appendChild(cell);
        tbody.appendChild(row);

        if (countEl) countEl.textContent = '0 results';
        return;
    }

    // Build table rows safely
    opportunities.forEach(opp => {
        const row = createOpportunityRow(opp);
        tbody.appendChild(row);
    });

    if (countEl) countEl.textContent = `${opportunities.length} results`;
}

/**
 * Calculates days remaining until deadline
 * @param {string} dateStr - Date string
 * @returns {{ days: number, urgent: boolean, overdue: boolean }}
 */
function getDaysRemaining(dateStr) {
    if (!dateStr) return { days: null, urgent: false, overdue: false };
    const now = new Date();
    const deadline = new Date(dateStr);
    const diffMs = deadline - now;
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return {
        days,
        urgent: days >= 0 && days <= 7,
        overdue: days < 0
    };
}

/**
 * Creates a table row for an opportunity using safe DOM methods
 * @param {Object} opp - Opportunity object
 * @returns {HTMLTableRowElement}
 */
function createOpportunityRow(opp) {
    const row = document.createElement('tr');

    // Get score safely - using tiered thresholds
    const score = opp.match_score || opp.qualification?.score || 0;
    const scoreClass = score >= 70 ? 'score-high' :    // GO
                       score >= 50 ? 'score-medium' :   // EVALUATE
                       'score-low';                     // PASS
    const statusLabel = score >= 70 ? 'GO' : score >= 50 ? 'EVAL' : 'PASS';

    // Format value
    const value = opp.estimated_value || opp.value;
    const valueDisplay = value ? `$${(value / 1000).toFixed(0)}K` : 'TBD';

    // Calculate days remaining with urgency
    const dueDate = opp.response_deadline || opp.closeDate;
    const { days, urgent, overdue } = getDaysRemaining(dueDate);

    // Title cell
    const titleCell = document.createElement('td');
    const titleStrong = document.createElement('strong');
    titleStrong.textContent = opp.title || 'Untitled';
    titleCell.appendChild(titleStrong);

    if (opp.solicitation_number || opp.solicitation) {
        const br = document.createElement('br');
        const small = document.createElement('small');
        small.style.color = '#666';
        small.textContent = opp.solicitation_number || opp.solicitation;
        titleCell.appendChild(br);
        titleCell.appendChild(small);
    }
    row.appendChild(titleCell);

    // Agency cell
    const agencyCell = document.createElement('td');
    agencyCell.textContent = opp.agency || 'Unknown';
    row.appendChild(agencyCell);

    // Score cell with status label
    const scoreCell = document.createElement('td');
    const scoreSpan = document.createElement('span');
    scoreSpan.className = `score ${scoreClass}`;
    scoreSpan.textContent = `${statusLabel} ${score}%`;
    scoreCell.appendChild(scoreSpan);
    row.appendChild(scoreCell);

    // Value cell
    const valueCell = document.createElement('td');
    valueCell.textContent = valueDisplay;
    row.appendChild(valueCell);

    // Date cell with urgency indicator
    const dateCell = document.createElement('td');
    if (days !== null) {
        if (overdue) {
            dateCell.innerHTML = `<span style="color:#ef4444;font-weight:600">CLOSED</span>`;
        } else if (urgent) {
            dateCell.innerHTML = `<span style="color:#f59e0b;font-weight:600">${days}d left</span>`;
        } else {
            dateCell.textContent = `${days}d`;
        }
    } else {
        dateCell.textContent = 'TBD';
    }
    row.appendChild(dateCell);

    // Action cell - button label reflects actual action
    const actionCell = document.createElement('td');
    const actionBtn = document.createElement('button');
    actionBtn.className = 'btn btn-primary quote-btn';
    actionBtn.style.cssText = 'padding:8px 16px;font-size:13px';
    actionBtn.textContent = 'View RFQ';  // Fixed: accurate label
    // Store ID in data attribute (safe - not interpolated into JS)
    actionBtn.dataset.opportunityId = opp.id;
    actionCell.appendChild(actionBtn);
    row.appendChild(actionCell);

    return row;
}

/**
 * Displays RFQ details in a modal or alert
 * @param {Object} rfq - RFQ object
 */
function displayRFQ(rfq) {
    const parts = Array.isArray(rfq.part_numbers) ? rfq.part_numbers.join(', ') : 'None specified';

    const message = `
RFQ Generated!
==============
Title: ${escapeHtml(rfq.title || 'N/A')}
Agency: ${escapeHtml(rfq.agency || 'N/A')}
Quantity: ${escapeHtml(rfq.quantity || 'N/A')}
Location: ${escapeHtml(rfq.delivery_location || 'N/A')}
Due: ${escapeHtml(rfq.due_date || 'N/A')}

Part Numbers: ${escapeHtml(parts)}

Click OK to copy to clipboard.
    `;

    if (confirm(message)) {
        navigator.clipboard.writeText(JSON.stringify(rfq, null, 2))
            .then(() => showNotification('RFQ copied to clipboard!', 'success'))
            .catch(() => showNotification('Could not copy to clipboard', 'error'));
    }
}

/**
 * Updates stats cards with opportunity data
 * Uses tiered scoring: GO (≥70), EVALUATE (50-69), PASS (<50)
 * @param {Object[]} opportunities - Array of opportunities
 */
function updateStats(opportunities) {
    const total = opportunities.length;

    // GO opportunities (high confidence, ≥70)
    const goOpportunities = opportunities.filter(o => {
        const score = o.match_score || o.qualification?.score || 0;
        return score >= 70;
    });

    // EVALUATE opportunities (promising, 50-69)
    const evaluateOpportunities = opportunities.filter(o => {
        const score = o.match_score || o.qualification?.score || 0;
        return score >= 50 && score < 70;
    });

    // Closing soon (within 7 days) - only for actionable opportunities
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const closingSoon = opportunities.filter(o => {
        const score = o.match_score || o.qualification?.score || 0;
        if (score < 50) return false; // Don't count PASS opportunities
        const closeDate = o.response_deadline || o.closeDate;
        if (!closeDate) return false;
        const date = new Date(closeDate);
        return date >= now && date <= sevenDaysFromNow;
    }).length;

    // Pipeline value: ONLY count GO opportunities (honest number)
    const goValue = goOpportunities.reduce((sum, o) => {
        return sum + (o.estimated_value || o.value || 0);
    }, 0);

    // Average score across actionable opportunities
    const actionable = [...goOpportunities, ...evaluateOpportunities];
    const avgScore = actionable.length > 0
        ? Math.round(actionable.reduce((sum, o) => sum + (o.match_score || o.qualification?.score || 0), 0) / actionable.length)
        : 0;

    const setElementText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    setElementText('statTotal', total);
    setElementText('statQualified', goOpportunities.length + evaluateOpportunities.length);
    setElementText('statHighScore', goOpportunities.length);
    setElementText('statClosingSoon', closingSoon);
    setElementText('statValue', `$${(goValue / 1000000).toFixed(1)}M`);
    setElementText('statAvgScore', `${avgScore}%`);
}

// =============================================================================
// UI HELPERS
// =============================================================================

/**
 * Shows the loading overlay
 * @param {string} message - Loading message
 */
function showLoadingIndicator(message) {
    const overlay = document.getElementById('loadingOverlay');
    const text = document.getElementById('loadingText');

    if (overlay) overlay.classList.add('active');
    if (text) text.textContent = message || 'Loading...';
}

/**
 * Hides the loading overlay
 */
function hideLoadingIndicator() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.remove('active');
}

/**
 * Updates the scan button state
 * @param {'ready' | 'scanning'} state - Button state
 */
function updateScanButton(state) {
    const btn = document.getElementById('scanBtn');
    if (!btn) return;

    if (state === 'scanning') {
        btn.disabled = true;
        btn.textContent = 'Scanning...';
    } else {
        btn.disabled = false;
        btn.textContent = 'Scan Live Data';
    }
}

/**
 * Updates the backend connection status indicator
 * @param {boolean} online - Whether backend is online
 */
function updateBackendStatus(online) {
    const dot = document.getElementById('statusDot');
    const text = document.getElementById('statusText');

    if (dot) dot.classList.toggle('online', online);
    if (text) text.textContent = online ? 'Backend connected' : 'Backend offline';
}

/** @type {number|null} Current notification timeout */
let notificationTimeout = null;

/**
 * Shows a notification message
 * @param {string} message - Message to display
 * @param {'success' | 'error' | 'warning' | 'info'} type - Notification type
 */
function showNotification(message, type) {
    // Clear any existing timeout
    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
        notificationTimeout = null;
    }

    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Auto-remove after delay
    notificationTimeout = setTimeout(() => {
        notification.remove();
        notificationTimeout = null;
    }, 4000);
}

// =============================================================================
// EXPORTS (for testing)
// =============================================================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        escapeHtml,
        escapeAttr,
        isValidId,
        filterOpportunities,
        updateStats,
    };
}

console.log('[Singh] Agent.js loaded - v2.0.0');
