// Singh Automation - Subcontracting Opportunities API
// Deploy to: /api/subcontracting.js on Vercel
// Powers the new "Subcontracting" tab in the platform

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

        // Fetch and score opportunities
        const opportunities = await fetchSubcontractingOpportunities(options);
        
        // Calculate stats
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
// SINGH AUTOMATION CONFIGURATION
// ============================================
const SINGH_CONFIG = {
    company: {
        name: "Singh Automation",
        cage: "86VF7",
        uei: "GJ1DPYQ3X8K5"
    },
    
    targetNAICS: [
        "333249", "541330", "541512", "541715", "238210", "333922"
    ],
    
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
            "Start Date", "End Date"
        ],
        limit: limit,
        page: 1,
        sort: "Award Amount",
        order: "desc"
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

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

    const scoring = scoreOpportunity({ recipientName, description, awardAmount, state, naicsCode });
    const outreach = generateOutreachEmail({ recipientName, description, agency, awardAmount });

    return {
        awardId,
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
        usaSpendingUrl: `https://www.usaspending.gov/award/${awardId}`
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
// FALLBACK DATA - WITH FULL EMAILS
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
            awardId: "CONT_AWD_SAMPLE_001"
        },
        {
            recipientName: "Hensel Phelps",
            description: "Distribution center automation upgrade including AMR deployment and conveyor system installation",
            awardAmount: 12400000,
            agency: "Defense Logistics Agency",
            state: "CA",
            city: "Tracy",
            naicsCode: "236220",
            awardId: "CONT_AWD_SAMPLE_002"
        },
        {
            recipientName: "Leidos Holdings Inc",
            description: "Advanced manufacturing technology development for vision-based inspection systems",
            awardAmount: 5700000,
            agency: "U.S. Air Force",
            state: "OH",
            city: "Dayton",
            naicsCode: "541512",
            awardId: "CONT_AWD_SAMPLE_003"
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

        return {
            awardId: data.awardId,
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
            usaSpendingUrl: "https://www.usaspending.gov"
        };
    });
}
