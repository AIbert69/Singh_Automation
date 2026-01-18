/**
 * @fileoverview Unit tests for opportunity qualification logic
 * @module tests/qualification.test
 */

import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { qualifyOpportunity, qualifyOpportunities, filterByStatus, sortByScore } from '../lib/qualification.js';

// Mock the config module
jest.unstable_mockModule('../lib/config.js', () => ({
    default: {
        companyProfile: {
            naicsCodes: ['333249', '333922', '541330'],
            keywords: ['robotic', 'welding', 'automation', 'PLC', 'SCADA'],
            certifications: ['Small Business', 'MBE'],
            notCertified: ['SDVOSB', '8(a)', 'HUBZone'],
            noVehicles: ['SeaPort NxG', 'OASIS', 'GSA MAS'],
        },
        scoring: {
            naicsMatchPoints: 30,
            keywordMatchPoints: 5,
            setAsidePoints: 20,
            goThreshold: 50,
            reviewThreshold: 25,
            compatibleSetAsides: ['small business', 'full and open', 'unrestricted'],
        },
    },
}));

describe('qualifyOpportunity', () => {
    const mockProfile = {
        naicsCodes: ['333249', '333922', '541330'],
        keywords: ['robotic', 'welding', 'automation', 'PLC', 'SCADA'],
        certifications: ['Small Business', 'MBE'],
        notCertified: ['SDVOSB', '8(a)', 'HUBZone'],
        noVehicles: ['SeaPort NxG', 'OASIS', 'GSA MAS'],
    };

    describe('Domain Kill Filters (NO-GO)', () => {
        test('should KILL academic/university opportunities', () => {
            const opp = {
                id: 'test-academic',
                title: 'University Research Lab Automation',
                description: 'Robotics system for college campus',
            };

            const result = qualifyOpportunity(opp, mockProfile);

            expect(result.status).toBe('NO-GO');
            expect(result.recommendation).toBe('KILLED');
            expect(result.reason).toContain('Academic');
        });

        test('should KILL traffic/highway infrastructure', () => {
            const opp = {
                id: 'test-traffic',
                title: 'Traffic Signal Control System',
                description: 'Highway intersection automation upgrade',
            };

            const result = qualifyOpportunity(opp, mockProfile);

            expect(result.status).toBe('NO-GO');
            expect(result.recommendation).toBe('KILLED');
            expect(result.reason).toContain('Traffic');
        });

        test('should KILL janitorial/labor services', () => {
            const opp = {
                id: 'test-janitorial',
                title: 'Custodial Services Contract',
                description: 'Janitorial and cleaning services',
            };

            const result = qualifyOpportunity(opp, mockProfile);

            expect(result.status).toBe('NO-GO');
            expect(result.recommendation).toBe('KILLED');
            expect(result.reason).toContain('labor');
        });

        test('should KILL building insulation (but NOT industrial thermal)', () => {
            const oppBuilding = {
                id: 'test-building-insulation',
                title: 'Building Insulation Project',
                description: 'Attic insulation and weatherization',
            };

            const oppIndustrial = {
                id: 'test-industrial-thermal',
                title: 'Thermal Management System',
                description: 'Hot runner barrel insulation for injection molding',
            };

            const resultBuilding = qualifyOpportunity(oppBuilding, mockProfile);
            const resultIndustrial = qualifyOpportunity(oppIndustrial, mockProfile);

            expect(resultBuilding.status).toBe('NO-GO');
            expect(resultBuilding.recommendation).toBe('KILLED');
            expect(resultIndustrial.status).not.toBe('NO-GO'); // Should pass through
        });

        test('should KILL security guard services (but NOT security systems)', () => {
            const opp = {
                id: 'test-security-guard',
                title: 'Security Officer Staffing',
                description: 'Security personnel for access control officer duties',
            };

            const result = qualifyOpportunity(opp, mockProfile);

            expect(result.status).toBe('NO-GO');
            expect(result.recommendation).toBe('KILLED');
            expect(result.reason).toContain('Security guard');
        });
    });

    describe('Certification Disqualifications (NO-GO)', () => {
        test('should return NO-GO for SDVOSB set-aside', () => {
            const opp = {
                id: 'test-1',
                title: 'Test Opportunity',
                setAside: 'SDVOSB',
            };

            const result = qualifyOpportunity(opp, mockProfile);

            expect(result.status).toBe('NO-GO');
            expect(result.reason).toContain('SDVOSB');
            expect(result.recommendation).toBe('No-Go');
        });

        test('should return NO-GO for Service-Disabled Veteran set-aside', () => {
            const opp = {
                id: 'test-2',
                title: 'Test Opportunity',
                setAside: 'Service-Disabled Veteran-Owned Small Business',
            };

            const result = qualifyOpportunity(opp, mockProfile);

            expect(result.status).toBe('NO-GO');
        });

        test('should return NO-GO for 8(a) set-aside', () => {
            const opp = {
                id: 'test-3',
                title: 'Test Opportunity',
                setAside: '8(a) Program',
            };

            const result = qualifyOpportunity(opp, mockProfile);

            expect(result.status).toBe('NO-GO');
            expect(result.reason).toContain('8(a)');
        });

        test('should return NO-GO for HUBZone set-aside', () => {
            const opp = {
                id: 'test-4',
                title: 'Test Opportunity',
                setAside: 'HUBZone',
            };

            const result = qualifyOpportunity(opp, mockProfile);

            expect(result.status).toBe('NO-GO');
            expect(result.reason).toContain('HUBZone');
        });

        test('should return NO-GO for contract vehicle restriction', () => {
            const opp = {
                id: 'test-5',
                title: 'SeaPort NxG Contract Opportunity',
                description: 'This contract is for SeaPort NxG holders only',
            };

            const result = qualifyOpportunity(opp, mockProfile);

            expect(result.status).toBe('NO-GO');
            expect(result.reason).toContain('SeaPort NxG');
        });
    });

    describe('GO Recommendations', () => {
        test('should return GO for matching NAICS + keywords + compatible set-aside', () => {
            const opp = {
                id: 'test-6',
                title: 'Robotic Welding System Installation',
                description: 'Industrial automation with PLC controls',
                naicsCode: '333249',
                setAside: 'Small Business',
            };

            const result = qualifyOpportunity(opp, mockProfile);

            expect(result.status).toBe('GO');
            expect(result.score).toBeGreaterThanOrEqual(50);
            expect(result.recommendation).toBe('GO');
        });

        test('should return GO with high score for multiple keyword matches', () => {
            const opp = {
                id: 'test-7',
                title: 'Robotic Welding Automation System',
                description: 'PLC-based SCADA control for robotic welding automation',
                naicsCode: '333249',
                setAside: 'Full and Open',
            };

            const result = qualifyOpportunity(opp, mockProfile);

            expect(result.status).toBe('GO');
            expect(result.score).toBeGreaterThan(50);
            expect(result.breakdown.keywords).toBeDefined();
        });
    });

    describe('Review Recommendations', () => {
        test('should return Review for partial matches', () => {
            const opp = {
                id: 'test-8',
                title: 'Industrial Equipment',
                description: 'Some automation components',
                naicsCode: '999999', // Non-matching NAICS
                setAside: 'Small Business',
            };

            const result = qualifyOpportunity(opp, mockProfile);

            expect(result.status).toBe('Review');
            expect(result.recommendation).toBe('Review');
        });

        test('should return Review for low score opportunities', () => {
            const opp = {
                id: 'test-9',
                title: 'Office Supplies',
                description: 'General office equipment',
            };

            const result = qualifyOpportunity(opp, mockProfile);

            expect(result.status).toBe('Review');
            expect(result.reason).toContain('Limited match');
        });
    });

    describe('Scoring', () => {
        test('should award 30 points for NAICS match', () => {
            const oppWithNaics = {
                id: 'test-10',
                title: 'Test',
                naicsCode: '333249',
            };

            const oppWithoutNaics = {
                id: 'test-11',
                title: 'Test',
                naicsCode: '999999',
            };

            const resultWith = qualifyOpportunity(oppWithNaics, mockProfile);
            const resultWithout = qualifyOpportunity(oppWithoutNaics, mockProfile);

            expect(resultWith.score - resultWithout.score).toBe(30);
        });

        test('should award 5 points per keyword match', () => {
            const opp1Keyword = {
                id: 'test-12',
                title: 'Robotic system',
            };

            const opp3Keywords = {
                id: 'test-13',
                title: 'Robotic welding automation',
            };

            const result1 = qualifyOpportunity(opp1Keyword, mockProfile);
            const result3 = qualifyOpportunity(opp3Keywords, mockProfile);

            expect(result3.score).toBeGreaterThan(result1.score);
        });

        test('should award 20 points for compatible set-aside', () => {
            const oppWithSetAside = {
                id: 'test-14',
                title: 'Test',
                setAside: 'Small Business',
            };

            const oppWithoutSetAside = {
                id: 'test-15',
                title: 'Test',
                setAside: '',
            };

            const resultWith = qualifyOpportunity(oppWithSetAside, mockProfile);
            const resultWithout = qualifyOpportunity(oppWithoutSetAside, mockProfile);

            expect(resultWith.score - resultWithout.score).toBe(20);
        });
    });

    describe('Edge Cases', () => {
        test('should handle empty opportunity', () => {
            const opp = { id: 'empty' };

            const result = qualifyOpportunity(opp, mockProfile);

            expect(result).toBeDefined();
            expect(result.status).toBeDefined();
        });

        test('should handle null/undefined values gracefully', () => {
            const opp = {
                id: 'test-null',
                title: null,
                description: undefined,
                setAside: null,
            };

            const result = qualifyOpportunity(opp, mockProfile);

            expect(result).toBeDefined();
            expect(result.status).toBe('Review');
        });

        test('should be case-insensitive for keyword matching', () => {
            const oppUpper = {
                id: 'test-upper',
                title: 'ROBOTIC WELDING AUTOMATION',
            };

            const oppLower = {
                id: 'test-lower',
                title: 'robotic welding automation',
            };

            const resultUpper = qualifyOpportunity(oppUpper, mockProfile);
            const resultLower = qualifyOpportunity(oppLower, mockProfile);

            expect(resultUpper.score).toBe(resultLower.score);
        });
    });
});

describe('qualifyOpportunities', () => {
    const mockProfile = {
        naicsCodes: ['333249'],
        keywords: ['robotic', 'automation'],
        certifications: ['Small Business'],
        notCertified: ['SDVOSB'],
        noVehicles: [],
    };

    test('should qualify multiple opportunities', () => {
        const opportunities = [
            { id: '1', title: 'Robotic System', naicsCode: '333249', setAside: 'Small Business' },
            { id: '2', title: 'Office Supplies', setAside: 'SDVOSB' },
            { id: '3', title: 'Automation Project', setAside: 'Full and Open' },
        ];

        const results = qualifyOpportunities(opportunities, mockProfile);

        expect(results).toHaveLength(3);
        expect(results[0].qualification.status).toBe('GO');
        expect(results[1].qualification.status).toBe('NO-GO');
        expect(results[2].qualification.status).toBeDefined();
    });

    test('should add qualification properties to each opportunity', () => {
        const opportunities = [{ id: '1', title: 'Test' }];

        const results = qualifyOpportunities(opportunities, mockProfile);

        expect(results[0].qualification).toBeDefined();
        expect(results[0].status).toBeDefined();
        expect(results[0].statusReason).toBeDefined();
        expect(results[0].recommendation).toBeDefined();
    });
});

describe('filterByStatus', () => {
    const opportunities = [
        { id: '1', qualification: { status: 'GO' } },
        { id: '2', qualification: { status: 'NO-GO' } },
        { id: '3', qualification: { status: 'Review' } },
        { id: '4', qualification: { status: 'GO' } },
    ];

    test('should filter by GO status', () => {
        const result = filterByStatus(opportunities, 'GO');
        expect(result).toHaveLength(2);
        expect(result.every(o => o.qualification.status === 'GO')).toBe(true);
    });

    test('should filter by NO-GO status', () => {
        const result = filterByStatus(opportunities, 'NO-GO');
        expect(result).toHaveLength(1);
    });

    test('should filter by Review status', () => {
        const result = filterByStatus(opportunities, 'Review');
        expect(result).toHaveLength(1);
    });

    test('should return all when status is "all"', () => {
        const result = filterByStatus(opportunities, 'all');
        expect(result).toHaveLength(4);
    });
});

describe('sortByScore', () => {
    test('should sort opportunities by score descending', () => {
        const opportunities = [
            { id: '1', qualification: { score: 30 } },
            { id: '2', qualification: { score: 80 } },
            { id: '3', qualification: { score: 50 } },
        ];

        const result = sortByScore(opportunities);

        expect(result[0].qualification.score).toBe(80);
        expect(result[1].qualification.score).toBe(50);
        expect(result[2].qualification.score).toBe(30);
    });

    test('should handle missing scores', () => {
        const opportunities = [
            { id: '1', qualification: { score: 50 } },
            { id: '2', qualification: {} },
            { id: '3' },
        ];

        const result = sortByScore(opportunities);

        expect(result[0].qualification.score).toBe(50);
    });

    test('should not mutate original array', () => {
        const opportunities = [
            { id: '1', qualification: { score: 30 } },
            { id: '2', qualification: { score: 80 } },
        ];

        const result = sortByScore(opportunities);

        expect(opportunities[0].id).toBe('1');
        expect(result[0].id).toBe('2');
    });
});
