// Singh Automation - Subcontracting Opportunities API
// Deploy to: /api/subcontracting.js on Vercel
// Fetches federal contracts from USASpending.gov and identifies subcontracting opportunities

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // Singh Automation's target NAICS codes for robotics/automation
        const targetNaics = [
            '333249', // Industrial Machinery Manufacturing
            '333318', // Other Commercial/Service Machinery
            '541330', // Engineering Services
            '541512', // Computer Systems Design
            '333923', // Overhead Cranes/Hoists
            '332710', // Machine Shops
            '541714', // R&D in Physical Sciences
            '541715', // R&D in Engineering
        ];

        // Keywords that indicate automation/robotics needs
        const automationKeywords = [
            'robot', 'robotic', 'automation', 'automated', 'AMR', 'AGV',
            'conveyor', 'material handling', 'vision system', 'inspection',
            'welding', 'assembly', 'manufacturing', 'warehouse', 'logistics',
            'palletizing', 'pick and place', 'FANUC', 'Universal Robot',
            'cobot', 'collaborative robot', 'machine vision', 'AI inspection',
            'production line', 'industrial automation', 'PLC', 'SCADA'
        ];

        // Try to fetch from USASpending.gov API
        let opportunities = [];
        let isLive = false;

        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 90);
            const startDate = thirtyDaysAgo.toISOString().split('T')[0];
            const endDate = new Date().toISOString().split('T')[0];

            const response = await fetch('https://api.usaspending.gov/api/v2/search/spending_by_award/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filters: {
                        time_period: [{ start_date: startDate, end_date: endDate }],
                        award_type_codes: ['A', 'B', 'C', 'D'], // Contracts
                        award_amounts: [{ lower_bound: 500000, upper_bound: 100000000 }],
                        naics_codes: targetNaics
                    },
                    fields: [
                        'Award ID',
                        'Recipient Name',
                        'Award Amount',
                        'Description',
                        'Awarding Agency',
                        'Awarding Sub Agency',
                        'Place of Performance City',
                        'Place of Performance State',
                        'NAICS Code',
                        'NAICS Description',
                        'Start Date',
                        'generated_internal_id'
                    ],
                    limit: 50,
                    page: 1,
                    sort: 'Award Amount',
                    order: 'desc'
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.results && data.results.length > 0) {
                    isLive = true;
                    opportunities = data.results.map(award => {
                        const description = (award['Description'] || '').toLowerCase();
                        
                        // Calculate match score based on keywords
                        let matchScore = 50; // Base score
                        let signals = [];
                        
                        automationKeywords.forEach(keyword => {
                            if (description.includes(keyword.toLowerCase())) {
                                matchScore += 5;
                                if (signals.length < 5) {
                                    signals.push(keyword);
                                }
                            }
                        });
                        
                        // Cap at 98%
                        matchScore = Math.min(matchScore, 98);
                        
                        // Add context signals
                        if (award['Award Amount'] > 5000000) signals.push('Large contract ($5M+)');
                        if (award['Award Amount'] > 10000000) signals.push('Major contract ($10M+)');
                        
                        // Determine tier
                        const tier = matchScore >= 75 ? 'hot' : matchScore >= 55 ? 'warm' : 'cold';
                        
                        // Check if prime is likely not an automation specialist
                        const primeName = award['Recipient Name'] || '';
                        const primeIsGC = /construction|building|civil|architect|engineer(?!ing automation)/i.test(primeName);
                        if (primeIsGC) {
                            signals.push('Prime is not automation specialist');
                            matchScore = Math.min(matchScore + 10, 98);
                        }

                        return {
                            // Normalized field names for frontend
                            recipientName: award['Recipient Name'] || 'Unknown Contractor',
                            awardAmount: award['Award Amount'] || 0,
                            agency: award['Awarding Agency'] || award['Awarding Sub Agency'] || 'Federal Agency',
                            description: award['Description'] || 'Federal contract award',
                            location: award['Place of Performance State'] 
                                ? `${award['Place of Performance City'] || ''}, ${award['Place of Performance State']}`
                                : 'USA',
                            naicsCode: award['NAICS Code'] || '',
                            naicsDescription: award['NAICS Description'] || '',
                            score: matchScore,
                            tier: tier,
                            signals: signals.length > 0 ? signals : ['Federal contract', 'Potential subcontracting'],
                            usaSpendingUrl: award['generated_internal_id'] 
                                ? `https://www.usaspending.gov/award/${award['generated_internal_id']}`
                                : 'https://www.usaspending.gov',
                            awardId: award['Award ID'] || '',
                            startDate: award['Start Date'] || '',
                            // Also include snake_case versions for compatibility
                            recipient_name: award['Recipient Name'] || 'Unknown Contractor',
                            award_amount: award['Award Amount'] || 0,
                            match_score: matchScore
                        };
                    });
                    
                    // Sort by score descending
                    opportunities.sort((a, b) => b.score - a.score);
                }
            }
        } catch (apiError) {
            console.error('USASpending API error:', apiError);
        }

        // If no live data, use demo data
        if (opportunities.length === 0) {
            opportunities = getDemoData();
            isLive = false;
        }

        return res.status(200).json({
            success: true,
            live: isLive,
            count: opportunities.length,
            opportunities: opportunities,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Subcontracting API error:', error);
        return res.status(500).json({
            success: false,
            error: error.message,
            opportunities: getDemoData(),
            live: false
        });
    }
}

// Demo/fallback data with realistic prime contractors
function getDemoData() {
    return [
        {
            recipientName: 'Turner Construction Company',
            recipient_name: 'Turner Construction Company',
            awardAmount: 8200000,
            award_amount: 8200000,
            agency: 'U.S. Army Corps of Engineers',
            description: 'Modernization of manufacturing facility including automated material handling systems and robotic assembly integration',
            location: 'Huntsville, AL',
            naicsCode: '333249',
            score: 86,
            match_score: 86,
            tier: 'hot',
            signals: ['Scope: robot, robotic, automat', 'Prime is not automation specialist', 'General/facilities contractor', 'Large contract ($5M+)'],
            usaSpendingUrl: 'https://www.usaspending.gov',
            contact: {
                portal: 'https://www.turnerconstruction.com/subcontractors',
                email: 'subcontracting@tcco.com'
            }
        },
        {
            recipientName: 'Hensel Phelps Construction',
            recipient_name: 'Hensel Phelps Construction',
            awardAmount: 12400000,
            award_amount: 12400000,
            agency: 'Defense Logistics Agency',
            description: 'Distribution center automation upgrade including AMR deployment and conveyor system installation',
            location: 'Tracy, CA',
            naicsCode: '333923',
            score: 90,
            match_score: 90,
            tier: 'hot',
            signals: ['Scope: automat, automation, conveyor', 'Prime is not automation specialist', 'Large contract ($10M+)', 'Location: CA'],
            usaSpendingUrl: 'https://www.usaspending.gov',
            contact: {
                portal: 'https://www.henselphelps.com/subcontractors/',
                email: 'subcontractors@henselphelps.com'
            }
        },
        {
            recipientName: 'Leidos Holdings Inc',
            recipient_name: 'Leidos Holdings Inc',
            awardAmount: 5700000,
            award_amount: 5700000,
            agency: 'U.S. Air Force',
            description: 'Advanced manufacturing technology development for vision-based inspection systems',
            location: 'Dayton, OH',
            naicsCode: '541512',
            score: 63,
            match_score: 63,
            tier: 'warm',
            signals: ['Scope: inspection system', 'Prime is not automation specialist', 'Large contract ($5M+)', 'NAICS: 541512'],
            usaSpendingUrl: 'https://www.usaspending.gov',
            contact: {
                portal: 'https://www.leidos.com/suppliers',
                email: 'supplier.diversity@leidos.com'
            }
        },
        {
            recipientName: 'Clark Construction Group',
            recipient_name: 'Clark Construction Group',
            awardAmount: 6800000,
            award_amount: 6800000,
            agency: 'U.S. Navy',
            description: 'Shipyard facility upgrades with robotic welding stations and automated inspection equipment',
            location: 'Norfolk, VA',
            naicsCode: '333249',
            score: 88,
            match_score: 88,
            tier: 'hot',
            signals: ['Scope: robotic welding, automated inspection', 'Prime is not automation specialist', 'Large contract ($5M+)'],
            usaSpendingUrl: 'https://www.usaspending.gov',
            contact: {
                portal: 'https://www.clarkconstruction.com/subcontractors',
                email: null
            }
        },
        {
            recipientName: 'AECOM',
            recipient_name: 'AECOM',
            awardAmount: 4300000,
            award_amount: 4300000,
            agency: 'Department of Energy',
            description: 'Laboratory automation and material handling system design for nuclear facility',
            location: 'Oak Ridge, TN',
            naicsCode: '541330',
            score: 72,
            match_score: 72,
            tier: 'warm',
            signals: ['Scope: automation, material handling', 'Engineering prime', 'DOE facility'],
            usaSpendingUrl: 'https://www.usaspending.gov',
            contact: {
                portal: 'https://aecom.com/about-aecom/suppliers/',
                email: null
            }
        }
    ];
}

