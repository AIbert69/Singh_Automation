// Singh Automation - Subcontracting Opportunities API v2
// Now includes: Prime contractor contact database, subcontracting portal links
// Deploy to: /api/subcontracting.js on Vercel

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const body = req.method === 'POST' ? (req.body || {}) : req.query;
        
        const options = {
            daysBack: parseInt(body.daysBack) || 90,
            minAmount: parseInt(body.minAmount) || 500000,
            maxAmount: parseInt(body.maxAmount) || 50000000,
            limit: Math.min(parseInt(body.limit) || 50, 100),
            filterTier: body.filterTier || 'all'
        };

        const opportunities = await fetchSubcontractingOpportunities(options);
        
        const stats = {
            total: opportunities.length,
            hot: opportunities.filter(o => o.tier === 'hot').length,
            warm: opportunities.filter(o => o.tier === 'warm').length,
            cold: opportunities.filter(o => o.tier === 'cold').length,
            totalValue: opportunities.reduce((sum, o) => sum + (o.awardAmount || 0), 0)
        };

        return res.status(200).json({
            success: true,
            opportunities,
            stats,
            filters: options,
            dataSources: ['USASpending.gov'],
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Subcontracting API error:', error);
        return res.status(500).json({
            success: false,
            error: error.message,
            opportunities: [],
            stats: { total: 0, hot: 0, warm: 0, cold: 0, totalValue: 0 }
        });
    }
}

// ============================================
// PRIME CONTRACTOR CONTACT DATABASE
// ============================================
const PRIME_CONTACTS = {
    // Major Construction Primes
    "turner construction": {
        portalUrl: "https://www.turnerconstruction.com/subcontractors",
        email: "turner@tcco.com",
        phone: "(212) 229-6000",
        helpDesk: "servicedesk@tcco.com",
        notes: "Register via Vertikal prequalification platform"
    },
    "hensel phelps": {
        portalUrl: "https://www.henselphelps.com/trade-partners/",
        email: null,
        phone: null,
        supplierDiversity: "blewis@henselphelps.com",
        notes: "Regional contact pages available - select your region for local contacts"
    },
    "fluor": {
        portalUrl: "https://www.fluor.com/sustainability/supply-chain/become-a-supplier",
        email: null,
        notes: "Register through supplier portal"
    },
    "bechtel": {
        portalUrl: "https://www.bechtel.com/suppliers/",
        email: null,
        notes: "Supplier registration required"
    },
    "kiewit": {
        portalUrl: "https://www.kiewit.com/business-with-us/subcontractors/",
        email: null,
        notes: "District-specific contact information"
    },
    "skanska": {
        portalUrl: "https://www.usa.skanska.com/about-skanska/subcontractor-info/",
        email: null,
        notes: "Register via subcontractor portal"
    },
    "whiting-turner": {
        portalUrl: "https://www.whiting-turner.com/subcontractors/",
        email: null,
        notes: "Online prequalification system"
    },
    "clark construction": {
        portalUrl: "https://www.clarkconstruction.com/subcontractors",
        email: null,
        notes: "Subcontractor prequalification required"
    },
    "mortenson": {
        portalUrl: "https://www.mortenson.com/subcontractors",
        email: null,
        notes: "Trade partner registration"
    },
    "dpr construction": {
        portalUrl: "https://www.dpr.com/company/trade-partners",
        email: null,
        notes: "Trade partner portal"
    },

    // Defense/IT Primes
    "leidos": {
        portalUrl: "https://www.leidos.com/suppliers",
        supplierPortal: "https://leidos-supply.app.jaggaer.com/",
        email: "suppliersupport@leidos.com",
        notes: "Must be invited by Leidos team member first. Register in Jaggaer supplier portal."
    },
    "booz allen": {
        portalUrl: "https://www.boozallen.com/e/insight/blog/how-to-become-a-booz-allen-subcontractor.html",
        email: null,
        notes: "Small business liaison program available"
    },
    "saic": {
        portalUrl: "https://www.saic.com/who-we-are/small-business",
        email: "smallbusiness@saic.com",
        notes: "Active small business program"
    },
    "general dynamics": {
        portalUrl: "https://www.gd.com/suppliers",
        email: null,
        notes: "Multiple business units - find specific division"
    },
    "northrop grumman": {
        portalUrl: "https://www.northropgrumman.com/suppliers/",
        email: null,
        notes: "Supplier registration portal"
    },
    "raytheon": {
        portalUrl: "https://www.rtx.com/suppliers",
        email: null,
        notes: "RTX supplier portal (includes Raytheon)"
    },
    "lockheed martin": {
        portalUrl: "https://www.lockheedmartin.com/en-us/suppliers.html",
        email: null,
        notes: "Supplier Wire registration system"
    },
    "bae systems": {
        portalUrl: "https://www.baesystems.com/en/our-company/inc-businesses/supplier-information",
        email: null,
        notes: "Supplier information portal"
    },
    "l3harris": {
        portalUrl: "https://www.l3harris.com/company/suppliers",
        email: null,
        notes: "Supplier registration required"
    },
    "mantech": {
        portalUrl: "https://www.mantech.com/suppliers",
        email: null,
        notes: "Supplier diversity program"
    },
    "caci": {
        portalUrl: "https://www.caci.com/small-business",
        email: null,
        notes: "Small business teaming"
    },
    "peraton": {
        portalUrl: "https://www.peraton.com/suppliers/",
        email: null,
        notes: "Supplier portal"
    },

    // Engineering Primes
    "aecom": {
        portalUrl: "https://aecom.com/supplier-information/",
        email: null,
        notes: "Supplier registration"
    },
    "jacobs": {
        portalUrl: "https://www.jacobs.com/about/suppliers",
        email: null,
        notes: "Supplier portal"
    },
    "parsons": {
        portalUrl: "https://www.parsons.com/suppliers/",
        email: null,
        notes: "Supplier information"
    },
    "tetra tech": {
        portalUrl: "https://www.tetratech.com/about/suppliers/",
        email: null,
        notes: "Subcontractor opportunities"
    }
};

// ============================================
// SINGH AUTOMATION CONFIGURATION
// ============================================
const SINGH_CONFIG = {
    company: {
        name: "Singh Automation",
        cage: "86VF7",
        uei: "GJ1DPYQ3X8K5"
    },
    
    targetNAICS: ["333249", "541330", "541512", "541715", "238210", "333922"],
    
    scopeKeywords: [
        "robot", "robotic", "robotics", "automat", "automation", "automated",
        "vision system", "machine vision", "ai vision", "material handling", "conveyor",
        "amr", "autonomous mobile robot", "warehouse", "logistics automation",
        "manufacturing modernization", "cobot", "collaborative robot",
        "fanuc", "universal robot", "pick and place", "palletizing",
        "inspection system", "quality inspection", "plc", "scada", "controls"
    ],
    
    nonSpecialistTerms: [
        "construction", "general contractor", "building", "facilities", 
        "engineering", "logistics", "consulting", "management", "it services",
        "staffing", "support services"
    ],
    
    specialistTerms: [
        "robot", "automat", "fanuc", "kuka", "abb", "yaskawa", "integrat", "motion", "servo"
    ]
};

// ============================================
// GET PRIME CONTACT INFO
// ============================================
function getPrimeContactInfo(recipientName) {
    const nameLower = recipientName.toLowerCase();
    
    for (const [key, info] of Object.entries(PRIME_CONTACTS)) {
        if (nameLower.includes(key)) {
            return info;
        }
    }
    
    // Default search suggestion
    return {
        portalUrl: `https://www.google.com/search?q=${encodeURIComponent(recipientName + " subcontractor supplier portal")}`,
        email: null,
        notes: "Search for this company's supplier/subcontractor registration portal",
        isGenericSearch: true
    };
}

// ============================================
// USASPENDING API - AWARD FETCHING
// ============================================
async function fetchSubcontractingOpportunities(options) {
    const { daysBack, minAmount, maxAmount, limit } = options;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    
    const url = 'https://api.usaspending.gov/api/v2/search/spending_by_award/';
    
    const payload = {
        filters: {
            time_period: [{
                start_date: startDate.toISOString().split('T')[0],
                end_date: new Date().toISOString().split('T')[0]
            }],
            award_type_codes: ["A", "B", "C", "D"],
            award_amounts: [{
                lower_bound: minAmount,
                upper_bound: maxAmount
            }],
            naics_codes: SINGH_CONFIG.targetNAICS.map(n => ({ naics_code: n }))
        },
        fields: [
            "Award ID", "Recipient Name", "Recipient UEI", "Award Amount",
            "Description", "Awarding Agency", "Awarding Sub Agency",
            "Place of Performance City", "Place of Performance State Code",
            "NAICS Code", "NAICS Description", "Contract Award Type",
            "Start Date", "End Date", "generated_internal_id", "internal_id"
        ],
        limit: limit,
        page: 1,
        sort: "Award Amount",
        order: "desc"
    };

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
            console.error('USASpending API error:', response.status);
            return getFallbackOpportunities();
        }

        const data = await response.json();
        
        if (!data.results || !Array.isArray(data.results) || data.results.length === 0) {
            return getFallbackOpportunities();
        }

        const opportunities = data.results
            .map(award => processAward(award))
            .filter(opp => opp.score >= 25)
            .sort((a, b) => b.score - a.score);

        return opportunities.length > 0 ? opportunities : getFallbackOpportunities();

    } catch (error) {
        console.error('USASpending fetch error:', error);
        return getFallbackOpportunities();
    }
}

// ============================================
// AWARD PROCESSING & SCORING
// ============================================
function processAward(award) {
    const recipientName = award["Recipient Name"] || "Unknown Contractor";
    const description = award["Description"] || "";
    const awardAmount = award["Award Amount"] || 0;
    const agency = award["Awarding Agency"] || "Federal Agency";
    const subAgency = award["Awarding Sub Agency"] || "";
    const state = award["Place of Performance State Code"] || "";
    const city = award["Place of Performance City"] || "";
    const naicsCode = award["NAICS Code"] || "";
    const naicsDesc = award["NAICS Description"] || "";
    const startDate = award["Start Date"] || "";
    const endDate = award["End Date"] || "";
    const awardId = award["Award ID"] || "";
    // generated_internal_id is the key for direct USASpending links (e.g. CONT_AWD_xxx)
    const generatedId = award["generated_internal_id"] || "";

    const scoring = scoreOpportunity({ recipientName, description, awardAmount, state, naicsCode });
    const outreach = generateOutreachEmail({ recipientName, description, agency, awardAmount });
    const primeContact = getPrimeContactInfo(recipientName);

    // Build direct USASpending URL using generated_internal_id (CONT_AWD format)
    let usaSpendingUrl = "https://www.usaspending.gov/search";
    if (generatedId) {
        usaSpendingUrl = `https://www.usaspending.gov/award/${generatedId}`;
    }

    return {
        awardId,
        generatedInternalId: generatedId, // For reference
        recipientName,
        recipientUei: award["Recipient UEI"] || "",
        description: description.substring(0, 500),
        awardAmount,
        agency,
        subAgency,
        state,
        city,
        location: city && state ? `${city}, ${state}` : state || "Not specified",
        naicsCode,
        naicsDesc,
        startDate,
        endDate,
        score: scoring.score,
        tier: scoring.tier,
        signals: scoring.signals,
        outreachSubject: outreach.subject,
        outreachBody: outreach.body,
        // Enhanced contact info
        primeContact: primeContact,
        usaSpendingUrl: usaSpendingUrl
    };
}

function scoreOpportunity({ recipientName, description, awardAmount, state, naicsCode }) {
    let score = 0;
    const signals = [];
    
    const descLower = description.toLowerCase();
    const nameLower = recipientName.toLowerCase();
    
    const keywordMatches = SINGH_CONFIG.scopeKeywords.filter(kw => descLower.includes(kw.toLowerCase()));
    if (keywordMatches.length > 0) {
        score += Math.min(keywordMatches.length * 8, 30);
        signals.push(`Scope: ${keywordMatches.slice(0, 3).join(", ")}`);
    }
    
    const isSpecialist = SINGH_CONFIG.specialistTerms.some(term => nameLower.includes(term));
    if (!isSpecialist) {
        score += 25;
        signals.push("Prime is not automation specialist");
    }
    
    const isGeneralContractor = SINGH_CONFIG.nonSpecialistTerms.some(term => nameLower.includes(term));
    if (isGeneralContractor) {
        score += 20;
        signals.push("General/facilities contractor");
    }
    
    if (awardAmount >= 10000000) { score += 20; signals.push("Large contract ($10M+)"); }
    else if (awardAmount >= 5000000) { score += 15; signals.push("Large contract ($5M+)"); }
    else if (awardAmount >= 1000000) { score += 10; signals.push("Mid-size contract ($1M+)"); }
    
    if (state === "MI" || state === "CA") { score += 10; signals.push(`Location: ${state}`); }
    if (SINGH_CONFIG.targetNAICS.includes(naicsCode)) { score += 10; signals.push(`NAICS: ${naicsCode}`); }
    if (awardAmount >= 750000) { score += 5; signals.push("Sub plan likely required"); }

    const cappedScore = Math.min(score, 100);
    let tier = 'cold';
    if (cappedScore >= 65) tier = 'hot';
    else if (cappedScore >= 45) tier = 'warm';

    return { score: cappedScore, tier, signals };
}

// ============================================
// OUTREACH EMAIL GENERATION
// ============================================
function generateOutreachEmail({ recipientName, description, agency, awardAmount }) {
    const descLower = description.toLowerCase();
    
    let capability = "industrial robotics integration and automation systems";
    if (descLower.includes("vision") || descLower.includes("inspection")) {
        capability = "AI-powered vision systems and automated inspection";
    } else if (descLower.includes("warehouse") || descLower.includes("logistics") || descLower.includes("material handling")) {
        capability = "warehouse automation and material handling systems";
    } else if (descLower.includes("manufacturing") || descLower.includes("assembly")) {
        capability = "robotic manufacturing cells and production automation";
    } else if (descLower.includes("amr") || descLower.includes("mobile robot") || descLower.includes("agv")) {
        capability = "autonomous mobile robots (AMR) and AGV integration";
    } else if (descLower.includes("weld")) {
        capability = "robotic welding systems and automation";
    } else if (descLower.includes("conveyor") || descLower.includes("palletiz")) {
        capability = "conveyor systems and robotic palletizing";
    }

    const shortDesc = description.length > 60 ? description.substring(0, 60) + "..." : description;
    const subject = `Subcontracting Support – ${shortDesc}`;
    
    const body = `Dear ${recipientName} Team,

I noticed your company was recently awarded a contract with ${agency} involving ${description.substring(0, 150).toLowerCase()}${description.length > 150 ? '...' : ''}.

Singh Automation is a FANUC and Universal Robots authorized integrator specializing in ${capability}. If your team needs support executing the robotics, automation, or vision systems portion of this contract, we'd welcome the opportunity to discuss teaming.

Our qualifications:
• FANUC Authorized System Integrator (ASI)
• Universal Robots Certified System Partner (CSP)
• CAGE Code: 86VF7 | UEI: GJ1DPYQ3X8K5
• Certified Small Business, MBE, WBENC
• NAICS: 333249, 541330, 541512, 541715

We have facilities in both Michigan and California and can mobilize quickly for projects nationwide.

Would you be available for a brief call this week to explore potential collaboration?

Best regards,

Singh Automation
www.singhautomation.com
(269) 381-6236
2400 E Cork Street, Kalamazoo, MI 49001`;

    return { subject, body };
}

// ============================================
// FALLBACK DATA - WITH REAL CONTACTS
// ============================================
function getFallbackOpportunities() {
    const fallbackData = [
        {
            recipientName: "Turner Construction Company",
            description: "Modernization of manufacturing facility including automated material handling systems and robotic assembly integration",
            awardAmount: 8200000,
            agency: "U.S. Army",
            state: "AL",
            city: "Huntsville",
            naicsCode: "236220",
            awardId: null // No real award ID for demo
        },
        {
            recipientName: "Hensel Phelps",
            description: "Distribution center automation upgrade including AMR deployment and conveyor system installation",
            awardAmount: 12400000,
            agency: "Defense Logistics Agency",
            state: "CA",
            city: "Tracy",
            naicsCode: "236220",
            awardId: null
        },
        {
            recipientName: "Leidos Holdings Inc",
            description: "Advanced manufacturing technology development for vision-based inspection systems",
            awardAmount: 5700000,
            agency: "U.S. Air Force",
            state: "OH",
            city: "Dayton",
            naicsCode: "541512",
            awardId: null
        }
    ];

    return fallbackData.map(data => {
        const scoring = scoreOpportunity({
            recipientName: data.recipientName,
            description: data.description,
            awardAmount: data.awardAmount,
            state: data.state,
            naicsCode: data.naicsCode
        });
        
        const outreach = generateOutreachEmail({
            recipientName: data.recipientName,
            description: data.description,
            agency: data.agency,
            awardAmount: data.awardAmount
        });

        const primeContact = getPrimeContactInfo(data.recipientName);

        return {
            awardId: data.awardId,
            generatedInternalId: null, // No real contract ID for demo data
            recipientName: data.recipientName,
            recipientUei: "",
            description: data.description,
            awardAmount: data.awardAmount,
            agency: data.agency,
            subAgency: "",
            state: data.state,
            city: data.city,
            location: `${data.city}, ${data.state}`,
            naicsCode: data.naicsCode,
            naicsDesc: "",
            startDate: "",
            endDate: "",
            score: scoring.score,
            tier: scoring.tier,
            signals: scoring.signals,
            outreachSubject: outreach.subject,
            outreachBody: outreach.body,
            primeContact: primeContact,
            usaSpendingUrl: primeContact.portalUrl || "https://www.usaspending.gov/search", // Link to supplier portal instead
            isDemoData: true,
            demoNote: "This is sample data. Use the Prime Contact portal to find real opportunities with this contractor."
        };
    });
}
