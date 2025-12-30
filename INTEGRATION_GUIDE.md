# WinScope Integration Guide
## Adding WinScope to Your Existing Platform

**Goal:** Keep your beautiful frontend UI, upgrade the backend intelligence.

---

## 📁 File Structure After Integration

```
Singh_Automation_Agent/
├── api/
│   └── [your existing Vercel API routes]
├── agent.js                    # Your existing agent
├── sam.js                      # Your existing SAM integration
├── index.html                  # Your existing frontend
├── proposal-editor.html        # Your existing editor
│
└── winscope/                   # NEW - WinScope backend
    ├── winscope_api.py         # Main API server
    ├── winscope-integration.js # Frontend connector
    ├── winscope_intelligence_network.py
    ├── winscope_document_intelligence.py
    ├── winscope_master_orchestrator.py
    ├── requirements.txt
    └── .env                    # API keys
```

---

## 🚀 Step-by-Step Integration

### Step 1: Add WinScope Files to Your Repo

```bash
cd Singh_Automation_Agent

# Create winscope directory
mkdir winscope
cd winscope

# Copy all WinScope files here:
# - winscope_api.py
# - winscope-integration.js
# - winscope_intelligence_network.py
# - winscope_document_intelligence.py
# - winscope_master_orchestrator.py
# - requirements.txt
```

### Step 2: Configure Environment Variables

Create `winscope/.env`:

```bash
# WinScope Configuration
ANTHROPIC_API_KEY=your-anthropic-key-here
SAM_GOV_API_KEY=your-sam-api-key-here

# Company Profile
COMPANY_NAME=Singh Automation
COMPANY_UEI=GJ1DPYQ3X8K5
COMPANY_CAGE=86VF7
COMPANY_CONTACT=Albert Mizuno
COMPANY_PHONE=786-344-8955
COMPANY_EMAIL=albert@singhautomation.com

# NAICS Codes
NAICS_CODES=333249,541330,541512,541715,237130,333922
```

### Step 3: Deploy WinScope Backend

**Option A: Deploy to Same VPS as Frontend (Recommended)**

```bash
# SSH into your server
cd /path/to/Singh_Automation_Agent/winscope

# Install Python dependencies
pip install -r requirements.txt

# Install Playwright browsers
playwright install chromium

# Run WinScope API (production)
uvicorn winscope_api:app --host 0.0.0.0 --port 8000 --workers 2

# Or run with PM2 for auto-restart
pm2 start "uvicorn winscope_api:app --host 0.0.0.0 --port 8000" --name winscope-api
pm2 save
```

**Option B: Deploy to Separate VPS**

```bash
# On a new VPS (DigitalOcean $20/month droplet)
git clone https://github.com/Albert69/Singh_Automation_Agent.git
cd Singh_Automation_Agent/winscope

# Same installation steps as above
pip install -r requirements.txt
playwright install chromium
uvicorn winscope_api:app --host 0.0.0.0 --port 8000

# Note the server IP address for frontend configuration
```

### Step 4: Update Your Frontend

**A) Add WinScope Integration Script to index.html**

In your `index.html`, before the closing `</head>` tag:

```html
<!-- WinScope Integration -->
<script src="winscope/winscope-integration.js"></script>
<script>
    // Configure WinScope API URL
    WinScope.config.apiUrl = 'http://YOUR_SERVER_IP:8000';
    // For production: 'https://api.your-domain.com'
</script>
```

**B) Modify Your "Scan Live Data" Button Handler**

In your existing `agent.js` or wherever you handle the scan button:

**OLD CODE:**
```javascript
async function handleScanClick() {
    // Your current scraping logic
    const opportunities = await scrapeSAM();
    displayOpportunities(opportunities);
}
```

**NEW CODE:**
```javascript
async function handleScanClick() {
    try {
        showLoadingIndicator('Scanning 50+ portals...');
        
        // Use WinScope instead of your old scraper
        const scanResult = await WinScope.scanPortals();
        
        // Get discovered opportunities
        const opportunities = await WinScope.getOpportunities({
            minScore: 50,  // Only show matches >=50%
            limit: 100
        });
        
        hideLoadingIndicator();
        displayOpportunities(opportunities);
        
        // Update stats
        updateStats({
            total: opportunities.length,
            qualified: opportunities.filter(o => o.match_score >= 65).length,
            highScore: opportunities.filter(o => o.match_score >= 80).length
        });
        
    } catch (error) {
        console.error('Scan failed:', error);
        showError('Scan failed. Please try again.');
    }
}
```

**C) Modify Your "Request Distributor Quote" Button Handler**

**OLD CODE:**
```javascript
async function handleQuoteRequest(opportunityId) {
    // Your current RFQ generation
    const rfq = generateBasicRFQ(opportunity);
    // Returns RFQ with "TBD" fields
}
```

**NEW CODE:**
```javascript
async function handleQuoteRequest(opportunityId) {
    try {
        showLoadingIndicator('Processing documents and generating RFQ...');
        
        // Use WinScope to get REAL data
        const rfq = await WinScope.completeWorkflow(opportunityId);
        
        hideLoadingIndicator();
        
        // Display RFQ (with real data, no TBDs!)
        displayRFQ({
            document: rfq.rfqDocument,
            confidence: rfq.fulfillmentConfidence,
            lineItems: rfq.lineItemsCount
        });
        
    } catch (error) {
        console.error('RFQ generation failed:', error);
        showError('Could not generate RFQ. Please try again.');
    }
}
```

**D) Update Your Opportunity Display**

Modify your opportunity card renderer to show WinScope data:

```javascript
function renderOpportunityCard(opp) {
    return `
        <div class="opportunity-card" data-score="${opp.match_score}">
            <div class="score-badge">${opp.match_score}%</div>
            <h3>${opp.title}</h3>
            <p class="agency">${opp.agency}</p>
            <p class="portal-badge">${opp.source_portal}</p>
            
            <div class="metadata">
                <span>Value: ${opp.estimated_value ? '$' + (opp.estimated_value/1000000).toFixed(1) + 'M' : 'TBD'}</span>
                <span>Due: ${formatDate(opp.due_date)}</span>
                <span>${opp.set_aside || 'Unrestricted'}</span>
            </div>
            
            ${opp.match_score >= 65 ? `
                <button onclick="requestQuote('${opp.id}')" class="quote-btn">
                    📋 Request Distributor Quote
                </button>
            ` : ''}
        </div>
    `;
}
```

---

## 🔄 What Changes

### Before WinScope:
```
User clicks "Scan" 
  → Scrapes SAM.gov only
  → Shows basic opportunities
  → User clicks "Request Quote"
  → Gets RFQ with "TBD" everywhere
```

### After WinScope:
```
User clicks "Scan"
  → WinScope scans 50+ portals simultaneously
  → AI scores each opportunity (0-100)
  → Shows high-quality matches

User clicks "Request Quote"
  → WinScope downloads actual solicitation docs
  → Extracts BOMs, quantities, delivery location
  → Generates RFQ with REAL data
  → No more "TBD" fields!
```

---

## 🎯 Quick Test

After integration, test the workflow:

```javascript
// In browser console:

// 1. Scan portals
await WinScope.scanPortals();

// 2. Get opportunities
const opps = await WinScope.getOpportunities();
console.log(`Found ${opps.length} opportunities`);

// 3. Generate RFQ for top opportunity
const topOpp = opps[0];
const rfq = await WinScope.completeWorkflow(topOpp.id);
console.log(rfq.rfqDocument);
// Should show RFQ with real data!
```

---

## 🔧 Configuration Options

### Customize Scoring Thresholds

In `winscope-integration.js`:

```javascript
WinScope.config.minMatchScore = 60;  // Only show opps >= 60%
WinScope.config.autoProcessThreshold = 85;  // Auto-process >= 85%
```

### Add Custom Portals

In `winscope_intelligence_network.py`, add to `PortalRegistry.get_all_portals()`:

```python
PortalConfig(
    name="Your Custom Portal",
    url="https://customportal.gov",
    portal_type=PortalType.STATE_WEB,
    strategy=ScrapingStrategy.PLAYWRIGHT,
    scrape_frequency_hours=12,
    naics_codes=["333249"],
    keywords=["automation"],
    selectors={
        "opportunity_list": "div.opp-card",
        "title": "h3.title"
    }
)
```

---

## 📊 Monitoring

View WinScope status and metrics:

```javascript
// Get platform stats
const stats = await WinScope.getStats();
console.log(stats);
// {
//   total_opportunities: 41,
//   high_score_count: 12,
//   qualified_count: 22,
//   portals_monitored: 50,
//   backend_status: "connected"
// }
```

---

## 🚨 Troubleshooting

### Backend Not Connecting

```javascript
// Check if WinScope API is running
fetch('http://YOUR_SERVER_IP:8000/')
    .then(r => r.json())
    .then(console.log);

// Should return: { status: "online", service: "WinScope API", ... }
```

### CORS Errors

In `winscope_api.py`, add your frontend URL to allowed origins:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://singh-automation.vercel.app",
        "https://your-custom-domain.com"  # Add this
    ],
    ...
)
```

### Scraping Failures

Check WinScope logs:

```bash
# View API logs
pm2 logs winscope-api

# Or if running directly:
tail -f winscope.log
```

---

## 🎉 You're Done!

Your platform now has:

✅ **50+ portal monitoring** (vs. just SAM.gov)  
✅ **AI-powered scoring** (0-100 match quality)  
✅ **Real document extraction** (no more TBDs)  
✅ **Complete RFQ generation** (with actual data)  
✅ **Continuous learning** (gets smarter over time)

**Same beautiful UI. Much more powerful backend.**

---

## 📞 Need Help?

If something isn't working:

1. Check WinScope API status: `curl http://localhost:8000/`
2. Check browser console for errors
3. Review API logs: `pm2 logs winscope-api`
4. Test individual functions in browser console

Contact: albert@singhautomation.com
