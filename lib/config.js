/**
 * @fileoverview Centralized configuration management for Singh Automation
 * @module lib/config
 *
 * All configuration values are loaded from environment variables with sensible defaults.
 * This module ensures configuration is validated at startup and provides type-safe access.
 */

/**
 * @typedef {Object} Config
 * @property {Object} api - API configuration
 * @property {Object} timeouts - Timeout configuration in milliseconds
 * @property {Object} rateLimit - Rate limiting configuration
 * @property {Object} cors - CORS configuration
 * @property {Object} features - Feature flags
 */

/**
 * Validates that required environment variables are set
 * @throws {Error} If required variables are missing
 */
function validateRequiredEnvVars() {
    const required = ['SAM_API_KEY'];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missing.join(', ')}. ` +
            `Please check your .env file or environment configuration.`
        );
    }
}

/**
 * Parses a comma-separated string into an array
 * @param {string} value - Comma-separated string
 * @param {string[]} defaultValue - Default value if empty
 * @returns {string[]}
 */
function parseArrayEnv(value, defaultValue = []) {
    if (!value) return defaultValue;
    return value.split(',').map(s => s.trim()).filter(Boolean);
}

/**
 * Parses an integer from environment variable
 * @param {string} value - String value
 * @param {number} defaultValue - Default value
 * @returns {number}
 */
function parseIntEnv(value, defaultValue) {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parses a boolean from environment variable
 * @param {string} value - String value
 * @param {boolean} defaultValue - Default value
 * @returns {boolean}
 */
function parseBoolEnv(value, defaultValue) {
    if (value === undefined || value === null || value === '') return defaultValue;
    return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Application configuration object
 * @type {Config}
 */
export const config = {
    /** API Keys and External Services */
    api: {
        /** SAM.gov API key - REQUIRED */
        get samApiKey() {
            const key = process.env.SAM_API_KEY;
            if (!key) {
                throw new Error('SAM_API_KEY environment variable is required');
            }
            return key;
        },

        /** Anthropic Claude API key */
        get anthropicApiKey() {
            return process.env.ANTHROPIC_API_KEY || '';
        },

        /** WinScope backend URL */
        winscopeUrl: process.env.WINSCOPE_API_URL || 'http://localhost:8000',
    },

    /** Timeout Configuration (milliseconds) */
    timeouts: {
        /** External API fetch timeout */
        fetch: parseIntEnv(process.env.FETCH_TIMEOUT_MS, 8000),

        /** Claude API timeout */
        claude: parseIntEnv(process.env.CLAUDE_TIMEOUT_MS, 90000),

        /** Job polling timeout */
        jobPolling: parseIntEnv(process.env.JOB_TIMEOUT_MS, 300000),

        /** Retry delays for exponential backoff */
        retryDelays: [2000, 4000, 8000, 16000],
    },

    /** Rate Limiting Configuration */
    rateLimit: {
        /** Maximum requests per window */
        max: parseIntEnv(process.env.RATE_LIMIT_MAX, 60),

        /** Window size in milliseconds */
        windowMs: parseIntEnv(process.env.RATE_LIMIT_WINDOW_MS, 60000),
    },

    /** CORS Configuration */
    cors: {
        /** Allowed origins for CORS */
        allowedOrigins: parseArrayEnv(
            process.env.ALLOWED_ORIGINS,
            [
                'https://singh-automation.vercel.app',
                'https://singhautomation.com',
                'http://localhost:3000',
                'http://localhost:5173'
            ]
        ),

        /** Pattern for dynamic origin validation (Vercel preview deployments) */
        allowedOriginPattern: /^https:\/\/singh-automation.*\.vercel\.app$/,

        /** Allowed HTTP methods */
        allowedMethods: ['GET', 'POST', 'OPTIONS'],

        /** Allowed headers */
        allowedHeaders: ['Content-Type', 'X-Request-ID', 'Authorization'],
    },

    /** Feature Flags */
    features: {
        /** Enable debug logging */
        debugMode: parseBoolEnv(process.env.DEBUG_MODE, false),

        /** Use mock data for testing */
        useMockData: parseBoolEnv(process.env.USE_MOCK_DATA, false),
    },

    /** Singh Companies Profile (Automation, Thermal Systems, Vision Systems, Medical Automation) */
    companyProfile: {
        /** Eligible NAICS codes */
        naicsCodes: [
            // Singh Automation - Robotics & Engineering
            '333249', // Other Industrial Machinery Manufacturing (PRIMARY)
            '333922', // Conveyor and Conveying Equipment Manufacturing
            '541330', // Engineering Services
            '541512', // Computer Systems Design Services
            '541715', // R&D in Physical, Engineering, Life Sciences
            '238210', // Electrical Contractors
            '493110', // General Warehousing and Storage
            '811310', // Commercial/Industrial Machinery Repair
            '541511', // Custom Computer Programming (PLC/HMI/SCADA logic)
            '332710', // Machine Shops (fabrication/spare parts)
            // Singh Thermal Systems - Insulation & Foam
            '333248', // All Other Industrial Machinery Manufacturing
            '326150', // Urethane and Other Foam Product Manufacturing
            '327993', // Mineral Wool Manufacturing
            '238310', // Drywall and Insulation Contractors
            '335999', // Misc Electrical Equipment Manufacturing
            '332322', // Sheet Metal Work Mfg (metal jacketing/cladding)
            '238220', // HVAC Contractors (bundled mechanical/insulation)
            // Singh Vision Systems - Molding & Plastics
            '333511', // Industrial Mold Manufacturing
            '326199', // All Other Plastics Product Manufacturing
            '334511', // Search/Detection/Nav Instruments (sensors/optics)
            // Singh Medical Automation - Pharma & Medical Device Assembly
            '333993', // Packaging Machinery (blister packs, bottling, labeling)
            '333999', // General Purpose Machinery (robotic cells)
            '334510', // Electromedical Apparatus Mfg (medical robot components)
        ],

        /** Target client NAICS codes (opportunities serving these industries) */
        targetClientNaics: [
            '325412', // Pharmaceutical Preparation Mfg
            '339112', // Surgical & Medical Instrument Mfg
            '339113', // Surgical Appliance & Supplies Mfg
        ],

        /** Matching keywords for opportunities */
        keywords: [
            // Singh Automation keywords
            'robotic', 'welding', 'automation', 'conveyor', 'warehouse', 'PLC', 'SCADA',
            'machine vision', 'systems integration', 'FANUC', 'industrial', 'manufacturing',
            'material handling', 'assembly', 'packaging', 'palletizing', 'AMR', 'AGV',
            // Singh Thermal Systems keywords
            'insulation', 'thermal', 'hot runner', 'barrel insulation', 'foam', 'heat',
            'injection molding', 'battery insulation', 'lithium', 'Li-ion', 'thermal management',
            'energy efficiency', 'military-grade', 'high temperature', 'mineral wool',
            // Singh Vision Systems keywords
            'mold', 'molding', 'tooling', 'plastics', 'injection mold', 'die', 'casting',
            // Singh Medical Automation keywords
            'cleanroom', 'FDA compliance', 'GMP', 'sterile packaging', 'blister packaging',
            'vial filling', 'medical device assembly', 'vision inspection', 'serialization',
            'validation services', 'IQ/OQ/PQ', 'pharmaceutical', 'pharma automation',
            'aseptic', 'isolator', 'fill finish', 'lyophilization', 'syringe filling',
        ],

        /** Negative keywords - opportunities containing these are likely NO-GO */
        negativeKeywords: [
            // Medical staffing/services (not equipment)
            'medical staffing', 'nursing services', 'physician', 'clinical trial management',
            'patient care', 'healthcare staffing', 'medical billing', 'telehealth services',
            // General services Singh doesn't do
            'janitorial', 'custodial', 'waste disposal', 'food service', 'catering',
            'landscaping', 'security guard', 'cleaning services', 'laundry',
            // IT/Software only (no hardware)
            'software development only', 'web development', 'mobile app',
        ],

        /** Certifications held */
        certifications: ['Small Business', 'MBE', 'WBENC'],

        /** Certifications NOT held (automatic NO-GO) */
        notCertified: ['SDVOSB', 'VOSB', '8(a)', 'HUBZone', 'WOSB', 'EDWOSB'],

        /** Contract vehicles NOT held */
        noVehicles: [
            'SeaPort NxG', 'SeaPort-e', 'OASIS', 'OASIS+', 'GSA MAS', 'GSA Schedule',
            'SEWP', 'CIO-SP3', 'STARS III', 'Alliant 2', 'ITES-3S', 'T4NG'
        ],
    },

    /** Scoring Configuration */
    scoring: {
        /** Points awarded for NAICS code match */
        naicsMatchPoints: 30,

        /** Points awarded per keyword match */
        keywordMatchPoints: 5,

        /** Points awarded for compatible set-aside */
        setAsidePoints: 20,

        /** Minimum score for GO recommendation */
        goThreshold: 50,

        /** Minimum score for Review recommendation */
        reviewThreshold: 25,

        /** Compatible set-aside types */
        compatibleSetAsides: [
            'small business', 'total small business', 'unrestricted',
            'full and open', 'competitive'
        ],
    },
};

/**
 * Validates configuration at module load (development only)
 */
export function validateConfig() {
    try {
        validateRequiredEnvVars();
        return { valid: true, errors: [] };
    } catch (error) {
        return { valid: false, errors: [error.message] };
    }
}

export default config;
