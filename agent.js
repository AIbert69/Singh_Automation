/**
 * Singh Automation Platform - Agent
 * ==================================
 * Handles scanning, opportunities, and RFQ generation
 * 
 * Upload to: /agent.js (root of repo)
 */

// ==================== GLOBAL STATE ====================

let currentOpportunities = [];
let isProcessing = false;

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Singh Automation Agent initializing...');
    
    // Check WinScope connection
    try {
        const status = await WinScope.checkStatus();
        if (status.status === 'online') {
            console.log('✅ WinScope backend connected');
            updateBackendStatus(true);
        } else {
            console.warn('⚠️ WinScope backend offline');
            updateBackendStatus(false);
        }
    } catch (err) {
        console.warn('⚠️ Could not connect to backend:', err.message);
        updateBackendStatus(false);
    }
    
    console.log('✅ Agent ready');
});

// ==================== MAIN FUNCTIONS ====================

/**
 * Scan all procurement portals
 * Called when user clicks "Scan Live Data" button
 */
async function scanOpportunities() {
    if (isProcessing) {
        showNotification('Scan already in progress...', 'warning');
        return;
    }
    
    try {
        isProcessing = true;
        console.log('🔍 Starting WinScope scan...');
        
        // Show loading
        showLoadingIndicator('Scanning 50+ procurement portals...');
        updateScanButton('scanning');
        
        // Use WinScope to scan all portals
        const scanResult = await WinScope.scanPortals();
        console.log('Scan result:', scanResult);
        
        // Get discovered opportunities
        const opportunities = await WinScope.getOpportunities({
            minScore: 50,
            limit: 100
        });
        
        console.log(`✅ Found ${opportunities.length} opportunities`);
        
        // Update display
        currentOpportunities = opportunities;
        displayOpportunities(opportunities);
        updateStats(opportunities);
        
        // Hide loading
        hideLoadingIndicator();
        updateScanButton('ready');
        
        showNotification(`Found ${opportunities.length} opportunities!`, 'success');
        
    } catch (error) {
        console.error('❌ Scan failed:', error);
        hideLoadingIndicator();
        updateScanButton('ready');
        isProcessing = false;
        
        showNotification('Scan failed. Is the backend running?', 'error');
    }
    
    isProcessing = false;
}

/**
 * Request distributor quote for an opportunity
 */
async function requestDistributorQuote(opportunityId) {
    try {
        console.log('📝 Generating RFQ for:', opportunityId);
        showLoadingIndicator('Generating RFQ with real data...');
        
        // Use WinScope to generate RFQ
        const rfq = await WinScope.generateRFQ(opportunityId);
        
        hideLoadingIndicator();
        
        // Display RFQ (you can customize this)
        displayRFQ(rfq);
        
        showNotification('RFQ generated successfully!', 'success');
        
    } catch (error) {
        console.error('❌ RFQ generation failed:', error);
        hideLoadingIndicator();
        showNotification('RFQ generation failed', 'error');
    }
}

/**
 * Filter opportunities by score
 */
function filterOpportunities(filter) {
    if (!currentOpportunities.length) {
        showNotification('No opportunities to filter. Run a scan first.', 'warning');
        return;
    }
    
    let filtered;
    if (filter === 'high') {
        filtered = currentOpportunities.filter(o => o.match_score >= 80);
    } else if (filter === 'medium') {
        filtered = currentOpportunities.filter(o => o.match_score >= 50 && o.match_score < 80);
    } else {
        filtered = currentOpportunities;
    }
    
    displayOpportunities(filtered);
    showNotification(`Showing ${filtered.length} opportunities`, 'success');
}

// ==================== DISPLAY FUNCTIONS ====================

/**
 * Display opportunities in the table
 */
function displayOpportunities(opportunities) {
    const tbody = document.getElementById('opportunitiesTable');
    const countEl = document.getElementById('resultCount');
    
    if (!opportunities || opportunities.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <h3>No opportunities found</h3>
                        <p>Try adjusting your filters or run a new scan</p>
                    </div>
                </td>
            </tr>
        `;
        countEl.textContent = '0 results';
        return;
    }
    
    tbody.innerHTML = opportunities.map(opp => {
        const scoreClass = opp.match_score >= 80 ? 'score-high' : 
                          opp.match_score >= 50 ? 'score-medium' : 'score-low';
        
        const value = opp.estimated_value ? 
            '$' + (opp.estimated_value / 1000).toFixed(0) + 'K' : 'TBD';
        
        const dueDate = opp.response_deadline ? 
            new Date(opp.response_deadline).toLocaleDateString() : 'TBD';
        
        return `
            <tr>
                <td>
                    <strong>${escapeHtml(opp.title || 'Untitled')}</strong>
                    <br><small style="color:#666">${escapeHtml(opp.solicitation_number || '')}</small>
                </td>
                <td>${escapeHtml(opp.agency || 'Unknown')}</td>
                <td><span class="score ${scoreClass}">${opp.match_score}%</span></td>
                <td>${value}</td>
                <td>${dueDate}</td>
                <td>
                    <button class="btn btn-primary" style="padding:8px 16px;font-size:13px" 
                            onclick="requestDistributorQuote('${opp.id}')">
                        Get Quote
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    countEl.textContent = `${opportunities.length} results`;
}

/**
 * Display RFQ details
 */
function displayRFQ(rfq) {
    // Simple alert for now - you can make this fancier
    const message = `
RFQ Generated!
==============
Title: ${rfq.title || 'N/A'}
Agency: ${rfq.agency || 'N/A'}
Quantity: ${rfq.quantity || 'N/A'}
Location: ${rfq.delivery_location || 'N/A'}
Due: ${rfq.due_date || 'N/A'}

Part Numbers:
${(rfq.part_numbers || []).join(', ') || 'None specified'}

Click OK to copy to clipboard.
    `;
    
    if (confirm(message)) {
        navigator.clipboard.writeText(JSON.stringify(rfq, null, 2))
            .then(() => showNotification('RFQ copied to clipboard!', 'success'))
            .catch(() => showNotification('Could not copy to clipboard', 'error'));
    }
}

/**
 * Update stats cards
 */
function updateStats(opportunities) {
    const total = opportunities.length;
    const qualified = opportunities.filter(o => o.match_score >= 50).length;
    const highScore = opportunities.filter(o => o.match_score >= 80).length;
    
    const totalValue = opportunities.reduce((sum, o) => {
        return sum + (o.estimated_value || 0);
    }, 0);
    
    document.getElementById('statTotal').textContent = total;
    document.getElementById('statQualified').textContent = qualified;
    document.getElementById('statHighScore').textContent = highScore;
    document.getElementById('statValue').textContent = '$' + (totalValue / 1000000).toFixed(1) + 'M';
}

// ==================== UI HELPERS ====================

function showLoadingIndicator(message) {
    const overlay = document.getElementById('loadingOverlay');
    const text = document.getElementById('loadingText');
    if (overlay) overlay.classList.add('active');
    if (text) text.textContent = message || 'Loading...';
}

function hideLoadingIndicator() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.remove('active');
}

function updateScanButton(state) {
    const btn = document.getElementById('scanBtn');
    if (!btn) return;
    
    if (state === 'scanning') {
        btn.disabled = true;
        btn.textContent = '⏳ Scanning...';
    } else {
        btn.disabled = false;
        btn.textContent = '🔍 Scan Live Data';
    }
}

function updateBackendStatus(online) {
    const dot = document.getElementById('statusDot');
    const text = document.getElementById('statusText');
    
    if (dot) dot.classList.toggle('online', online);
    if (text) text.textContent = online ? 'Backend connected' : 'Backend offline';
}

function showNotification(message, type) {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 4000);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));
}

// ==================== READY ====================

console.log('✅ Agent.js loaded');
