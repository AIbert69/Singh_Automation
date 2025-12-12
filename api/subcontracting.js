// SUBCONTRACTING FIELD MAPPING FIX
// Replace your existing renderSubOpportunities function with this one
// This handles all the different field name formats from USASpending.gov API

function renderSubOpportunities() {
    const container = document.getElementById('subList');
    if (!container) return;
    
    const filtered = currentSubFilter === 'all' 
        ? subOpportunities 
        : subOpportunities.filter(o => {
            const tier = o.tier || o.priority || (getScore(o) >= 70 ? 'hot' : getScore(o) >= 50 ? 'warm' : 'cold');
            return tier === currentSubFilter;
        });
    
    if (!filtered.length) {
        container.innerHTML = `<div style="text-align: center; padding: 3rem; color: var(--gray);">
            <div style="font-size: 2rem; margin-bottom: 1rem;">📭</div>
            <p>No ${currentSubFilter === 'all' ? '' : currentSubFilter + ' '}opportunities found</p>
        </div>`;
        return;
    }
    
    container.innerHTML = filtered.map((opp, idx) => {
        // ========== FIELD NAME NORMALIZATION ==========
        // Handle ALL possible field name formats from USASpending.gov API
        
        // Prime contractor name - try all possible field names
        const prime = opp.recipientName 
            || opp.recipient_name 
            || opp['Recipient Name']
            || opp.prime 
            || opp.prime_contractor
            || opp.primeContractor
            || opp.contractor_name
            || opp.vendor_name
            || opp.awardee
            || 'Unknown Prime';
        
        // Award amount - try all possible field names
        const amount = opp.awardAmount 
            || opp.award_amount 
            || opp['Award Amount']
            || opp.total_obligation
            || opp.totalObligation
            || opp.amount
            || opp.value
            || opp.contract_value
            || 0;
        
        // Agency
        const agency = opp.agency 
            || opp.awarding_agency
            || opp.awarding_agency_name
            || opp['Awarding Agency']
            || opp.funding_agency
            || 'Federal Agency';
        
        // Location
        const location = opp.location 
            || opp.place_of_performance
            || opp.pop_city_name
            || opp['Place of Performance']
            || (opp.pop_city ? `${opp.pop_city}, ${opp.pop_state}` : '')
            || 'USA';
        
        // Description
        const description = opp.description 
            || opp.award_description
            || opp['Description']
            || opp.contract_description
            || 'Contract award';
        
        // NAICS
        const naicsCode = opp.naicsCode 
            || opp.naics_code 
            || opp.naics
            || opp['NAICS']
            || opp.naics_description
            || '';
        
        // Score
        const score = opp.score 
            || opp.match_score 
            || opp.matchScore
            || opp.relevance_score
            || 75;
        
        // Tier (hot/warm/cold)
        const tier = opp.tier 
            || opp.priority 
            || (score >= 70 ? 'hot' : score >= 50 ? 'warm' : 'cold');
        
        // Signals/tags
        const signals = opp.signals 
            || opp.keywords 
            || opp.tags 
            || [];
        
        // USASpending link
        const usaSpendingUrl = opp.usaSpendingUrl 
            || opp.usaspending_url
            || opp.contract_link
            || opp.award_link
            || (opp.generated_internal_id ? `https://www.usaspending.gov/award/${opp.generated_internal_id}` : 'https://www.usaspending.gov');
        
        // ========== RENDERING ==========
        const tierClass = tier === 'hot' ? 'hot' : tier === 'warm' ? 'warm' : 'cold';
        const amountFormatted = formatCurrency(amount);
        
        return `
            <div class="sub-card ${tierClass}">
                <div class="sub-card-header">
                    <div>
                        <div class="sub-prime">${escapeHtml(prime)}</div>
                        <div class="sub-meta">
                            <span>🏛️ ${escapeHtml(agency)}</span>
                            <span>📍 ${escapeHtml(location)}</span>
                            ${naicsCode ? `<span>📋 ${escapeHtml(naicsCode)}</span>` : ''}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <span class="sub-score ${tierClass}">${score}%</span>
                        <div class="sub-amount">${amountFormatted}</div>
                    </div>
                </div>
                <p class="sub-desc">${escapeHtml(truncateText(description, 200))}</p>
                <div class="sub-signals">
                    <span class="sub-signal tier-${tierClass}">${tier.toUpperCase()}</span>
                    ${Array.isArray(signals) ? signals.slice(0, 4).map(s => `<span class="sub-signal">${escapeHtml(s)}</span>`).join('') : ''}
                </div>
                <div class="sub-actions">
                    <a href="${usaSpendingUrl}" target="_blank" class="btn btn-secondary btn-sm">View on USASpending →</a>
                    <button class="btn btn-primary btn-sm" onclick="showSubOutreach(${idx})">📧 Draft Outreach</button>
                </div>
            </div>
        `;
    }).join('');
}

// Helper function to get score from various field names
function getScore(opp) {
    return opp.score || opp.match_score || opp.matchScore || opp.relevance_score || 75;
}

// Format currency helper
function formatCurrency(amount) {
    if (!amount || amount === 0) return '$0';
    if (amount >= 1000000) {
        return '$' + (amount / 1000000).toFixed(1) + 'M';
    } else if (amount >= 1000) {
        return '$' + (amount / 1000).toFixed(0) + 'K';
    }
    return '$' + amount.toFixed(0);
}

// Escape HTML helper
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Truncate text helper
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Also fix the showSubOutreach function
function showSubOutreach(idx) {
    const filtered = currentSubFilter === 'all' 
        ? subOpportunities 
        : subOpportunities.filter(o => {
            const score = o.score || o.match_score || o.matchScore || 75;
            const tier = o.tier || o.priority || (score >= 70 ? 'hot' : score >= 50 ? 'warm' : 'cold');
            return tier === currentSubFilter;
        });
    
    const opp = filtered[idx];
    if (!opp) return;
    
    // Normalize field names
    const prime = opp.recipientName || opp.recipient_name || opp['Recipient Name'] || opp.prime || 'Prime Contractor';
    const agency = opp.agency || opp.awarding_agency || opp['Awarding Agency'] || 'Federal Agency';
    const description = opp.description || opp.award_description || 'contract';
    
    // Generate email
    const email = generateSubOutreachEmail(prime, agency, description);
    
    // Fill modal
    document.getElementById('outreachTo').value = `${prime} - Contracts/Subcontracting Department`;
    document.getElementById('outreachSubject').value = `Subcontracting Partnership Inquiry – Robotics & Automation Capabilities`;
    document.getElementById('outreachBody').value = email;
    
    // Show modal
    document.getElementById('outreachModal').classList.add('active');
}

function generateSubOutreachEmail(prime, agency, description) {
    return `Dear ${prime} Team,

I noticed your recent contract award with ${agency} involving ${description.substring(0, 100).toLowerCase()}...

Singh Automation is a FANUC and Universal Robots authorized integrator specializing in industrial robotics, AI vision systems, and warehouse automation. We're based in both Kalamazoo, MI and Irvine, CA.

If your team needs support executing the robotics, automation, or vision inspection portions of this contract, we'd welcome the opportunity to discuss teaming arrangements.

Our certifications include:
• FANUC Authorized System Integrator (ASI)
• Universal Robots Certified System Partner (UR CSP)
• MBE/WBENC certified

Would you have 15 minutes this week for a brief call to explore potential collaboration?

Best regards,

Gurdeep Singh
Founder/CEO, Singh Automation
+1 (269) 779-2179
g@singhus.com
www.singhautomation.com`;
}
