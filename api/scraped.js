/**
 * Singh Automation - Scraped Opportunities API
 *
 * Serves opportunities scraped from state/local portals that don't have APIs.
 * Data is collected by Python scrapers and stored in scraped_data.json.
 *
 * For now, this returns demo data. In production, this would read from:
 * - A JSON file updated by GitHub Actions
 * - A database (Supabase, PlanetScale, etc.)
 * - An S3 bucket
 */

// Demo data for Michigan SIGMA and other portals
// This simulates what the Python scrapers would return
const SCRAPED_OPPORTUNITIES = [
    {
        id: 'mi-sigma-2024-001',
        source: 'Michigan SIGMA',
        title: 'MDOT ITS Traffic Control System Upgrade',
        agency: 'Michigan Department of Transportation',
        solicitation: 'MDOT-2024-ITS-001',
        value: 450000,
        closeDate: '2024-03-15',
        postedDate: '2024-01-10',
        description: 'Upgrade of traffic control PLC systems along I-94 corridor. Includes Allen-Bradley ControlLogix PLCs, HMI panels, and SCADA integration. Contractor must have experience with industrial automation and traffic management systems.',
        location: 'Detroit, MI',
        link: 'https://sigma.michigan.gov/webapp/PRDVSS2X1/AltSelfService',
        naicsCode: '334513',
        setAside: 'Small Business',
        type: 'state',
        isLive: true,
        matchScore: 88,
        status: 'GO',
        statusReason: 'Direct PLC/SCADA match - Singh core capability',
    },
    {
        id: 'mi-sigma-2024-002',
        source: 'Michigan SIGMA',
        title: 'University of Michigan - Robotics Lab Equipment',
        agency: 'University of Michigan',
        solicitation: 'UM-PROC-2024-0156',
        value: 275000,
        closeDate: '2024-02-28',
        postedDate: '2024-01-05',
        description: 'Procurement of FANUC robotic arms, servo controllers, and Cognex machine vision systems for engineering research lab. Must include installation, programming, and training.',
        location: 'Ann Arbor, MI',
        link: 'https://procurement.umich.edu/',
        naicsCode: '333514',
        setAside: '',
        type: 'state',
        isLive: true,
        matchScore: 92,
        status: 'GO',
        statusReason: 'Robotics & vision systems - perfect Singh match',
    },
    {
        id: 'mi-sigma-2024-003',
        source: 'Michigan SIGMA',
        title: 'DTMB Data Center Cooling Automation',
        agency: 'Michigan DTMB',
        solicitation: 'DTMB-2024-DC-042',
        value: 180000,
        closeDate: '2024-04-01',
        postedDate: '2024-01-12',
        description: 'Automated HVAC control system for state data center. BACnet integration, VFD-controlled fans, environmental monitoring sensors, and PLC-based control logic.',
        location: 'Lansing, MI',
        link: 'https://sigma.michigan.gov/webapp/PRDVSS2X1/AltSelfService',
        naicsCode: '238220',
        setAside: 'Small Business',
        type: 'state',
        isLive: true,
        matchScore: 75,
        status: 'REVIEW',
        statusReason: 'HVAC automation - review Singh thermal division capability',
    },
    {
        id: 'mi-sigma-2024-004',
        source: 'Michigan SIGMA',
        title: 'Wayne County - Conveyor System for Processing Facility',
        agency: 'Wayne County',
        solicitation: 'WC-PW-2024-089',
        value: 320000,
        closeDate: '2024-03-30',
        postedDate: '2024-01-08',
        description: 'Material handling conveyor system for county recycling facility. Includes motor controls, proximity sensors, safety interlocks, and operator HMI stations.',
        location: 'Detroit, MI',
        link: 'https://waynecounty.com/departments/procurement/',
        naicsCode: '333922',
        setAside: 'Local Business Preference',
        type: 'county',
        isLive: true,
        matchScore: 85,
        status: 'GO',
        statusReason: 'Conveyor automation - Singh specialty',
    },
    {
        id: 'ca-eprocure-2024-001',
        source: 'California eProcure',
        title: 'Caltrans - Highway Sign Control Systems',
        agency: 'California Department of Transportation',
        solicitation: 'CT-2024-SIGN-018',
        value: 580000,
        closeDate: '2024-03-20',
        postedDate: '2024-01-15',
        description: 'Dynamic message sign control systems for I-5 corridor. PLC-based controllers, LED driver boards, remote SCADA access, and cellular communication modules.',
        location: 'Sacramento, CA',
        link: 'https://caleprocure.ca.gov/pages/public-search.aspx',
        naicsCode: '334513',
        setAside: 'Small Business',
        type: 'state',
        isLive: true,
        matchScore: 82,
        status: 'GO',
        statusReason: 'Control systems match - Singh California division',
    },
    {
        id: 'ca-county-2024-001',
        source: 'San Diego County',
        title: 'SD Airport - Baggage Handling System Modernization',
        agency: 'San Diego International Airport',
        solicitation: 'SAN-2024-BHS-003',
        value: 1250000,
        closeDate: '2024-04-15',
        postedDate: '2024-01-18',
        description: 'Modernization of Terminal 2 baggage handling system. Includes conveyor controls, RFID tracking, PLC upgrades, and integration with airline departure control systems.',
        location: 'San Diego, CA',
        link: 'https://www.san.org/Airport-Authority/Opportunities',
        naicsCode: '333922',
        setAside: 'DBE',
        type: 'county',
        isLive: true,
        matchScore: 90,
        status: 'GO',
        statusReason: 'High-value conveyor automation - prime opportunity',
    },
    {
        id: 'tx-smartbuy-2024-001',
        source: 'Texas SmartBuy',
        title: 'TxDOT - Bridge Inspection Robot System',
        agency: 'Texas Department of Transportation',
        solicitation: 'TXDOT-2024-MAINT-072',
        value: 340000,
        closeDate: '2024-03-25',
        postedDate: '2024-01-20',
        description: 'Robotic bridge inspection system with crawling mechanism, non-destructive testing sensors, and wireless video transmission. Must integrate with TxDOT asset management system.',
        location: 'Austin, TX',
        link: 'https://comptroller.texas.gov/purchasing/contracts/',
        naicsCode: '333514',
        setAside: 'HUB',
        type: 'state',
        isLive: true,
        matchScore: 78,
        status: 'REVIEW',
        statusReason: 'Robotics match - verify Texas HUB requirements',
    },
];

export default function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Filter parameters
        const { source, state, minValue, maxValue, status } = req.query;

        let opportunities = [...SCRAPED_OPPORTUNITIES];

        // Apply filters
        if (source) {
            opportunities = opportunities.filter(o =>
                o.source.toLowerCase().includes(source.toLowerCase())
            );
        }

        if (state) {
            opportunities = opportunities.filter(o =>
                o.location?.toLowerCase().includes(state.toLowerCase())
            );
        }

        if (minValue) {
            const min = parseInt(minValue);
            opportunities = opportunities.filter(o => (o.value || 0) >= min);
        }

        if (maxValue) {
            const max = parseInt(maxValue);
            opportunities = opportunities.filter(o => (o.value || 0) <= max);
        }

        if (status) {
            opportunities = opportunities.filter(o =>
                o.status?.toLowerCase() === status.toLowerCase()
            );
        }

        // Calculate summary stats
        const totalValue = opportunities.reduce((sum, o) => sum + (o.value || 0), 0);
        const sources = [...new Set(opportunities.map(o => o.source))];

        return res.status(200).json({
            success: true,
            source: 'Portal Scrapers (Michigan SIGMA, Cal eProcure, Texas SmartBuy)',
            lastUpdated: new Date().toISOString(),
            count: opportunities.length,
            totalValue,
            sources,
            note: 'Demo data - actual scrapers run via GitHub Actions every 6 hours',
            opportunities
        });

    } catch (error) {
        console.error('Scraped API error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch scraped opportunities',
            message: error.message
        });
    }
}
