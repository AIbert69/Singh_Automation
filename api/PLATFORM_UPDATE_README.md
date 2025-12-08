# Singh Automation Platform - Updates

## Files to Deploy

| File | Destination | Purpose |
|------|-------------|---------|
| `sam.js` | Vercel `/api/sam.js` | Enhanced API with SBIR, DIBBS, States, Email Alerts |
| `generate.js` | Vercel `/api/generate.js` | Proposal generator matching your Word template |
| `index.html` | Netlify | Frontend with new filters, categories, email subscription |

---

## New Features Added

### 1. ✅ Proposal Template - Now Matches Your Word Doc

The proposal generator now outputs this exact 7-section structure:
1. Solicitation Information + Primary Contact
2. Executive Summary (3 paragraphs)
3. Technical Approach (System Design, Phases, QA)
4. Management Approach (PM, Personnel, Communication)
5. Past Performance (3 projects with outcomes)
6. Corporate Capability (NAICS, Certs, Locations)
7. Pricing Summary (table with percentages)
8. Contact

### 2. ✅ Multi-Source Opportunity Search

Now searching:
- SAM.gov (Federal contracts)
- SBIR.gov API (Small Business Innovation Research)
- DIBBS (DoD parts/components)
- State Portals: CA, MI, TX, OH, FL
- Forecasts (upcoming opportunities)

### 3. ✅ Email Alerts (Framework Ready)

Users can subscribe for:
- Daily digest
- Weekly summary
- Instant alerts (new opportunities)

**To fully enable**, you'll need:
- SendGrid API key (free tier available)
- Database (Vercel KV, Supabase, or MongoDB)

---

## LinkedIn Integration - Options & Reality Check

### The Problem

LinkedIn **does NOT have a public API** for scraping contacts or opportunities. Their official APIs are:
- Only available to approved partners
- Require expensive enterprise agreements
- Limited to specific use cases (recruitment, marketing)

### Legal/Safe Options

| Option | Cost | Pros | Cons |
|--------|------|------|------|
| **LinkedIn Sales Navigator** | $100/mo | Official, safe, great filters | Manual export, no API |
| **Evaboot** (Chrome extension) | $29/mo | Works with Sales Navigator | Needs Sales Nav subscription |
| **PhantomBuster** | $59/mo | Automated workflows | Risk of account ban |
| **Bright Data** | $500+/mo | Enterprise-grade, legal | Expensive |
| **Manual Prospecting** | Free | Zero risk | Time-consuming |

### Recommended Approach for Singh Automation

Instead of scraping LinkedIn, build a **Contact Database** in your platform:

1. **When you win a contract**, save the contact info
2. **Import LinkedIn connections** manually via CSV export
3. **Use LinkedIn Sales Navigator** for finding new contacts
4. **Integrate with your CRM** (HubSpot free tier works great)

### If You Still Want LinkedIn Integration

I can add a **"LinkedIn Search Helper"** that:
- Opens LinkedIn with pre-filled search queries
- Helps you find procurement officers by agency
- Provides templates for connection requests

But it **cannot automatically scrape** data without violating LinkedIn's terms.

---

## Quick Start

1. **Deploy to Vercel:**
   - Upload `sam.js` to `/api/sam.js`
   - Upload `generate.js` to `/api/generate.js`

2. **Deploy to Netlify:**
   - Upload `index.html` (drag & drop)

3. **Test:**
   - Go to https://samgov.netlify.app/
   - Click Scan
   - Check that all tabs work (Federal, SBIR, State, DIBBS)
   - Try generating a proposal

---

## What's Next?

Potential enhancements:
- [ ] SendGrid email integration for alerts
- [ ] Database for storing subscriptions
- [ ] LinkedIn search helper links
- [ ] Contact/CRM database
- [ ] Mobile app (React Native)
- [ ] Chrome extension for quick proposal generation

Let me know which you'd like to prioritize!
