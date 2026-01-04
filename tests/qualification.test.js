/**
 * @fileoverview Unit tests for opportunity qualification logic
 * @module tests/qualification.test
 */

import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { qualifyOpportunity, qualifyOpportunities, filterByStatus, sortByScore } from '../lib/qualification.js';

// Mock the config module - using tiered scoring thresholds
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
            goThreshold: 70,           // GO: high confidence
            evaluateThreshold: 50,     // EVALUATE: promising, needs capacity decision
            passThreshold: 50,         // PASS: below this threshold
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

    describe('Automatic Disqualifications (NO-GO)', () => {
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

    describe('GO Recommendations (≥70 points)', () => {
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
            expect(result.score).toBeGreaterThanOrEqual(70);
            expect(result.recommendation).toContain('Pursue');
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
            expect(result.score).toBeGreaterThanOrEqual(70);
            expect(result.breakdown.keywords).toBeDefined();
        });
    });

    describe('EVALUATE Recommendations (50-69 points)', () => {
        test('should return EVALUATE for partial matches with some keywords', () => {
            const opp = {
                id: 'test-8',
                title: 'Industrial Automation Equipment',
                description: 'Some robotic components for welding',
                naicsCode: '999999', // Non-matching NAICS
                setAside: 'Small Business',
            };

            const result = qualifyOpportunity(opp, mockProfile);

            expect(result.status).toBe('EVALUATE');
            expect(result.recommendation).toContain('Evaluate');
            expect(result.score).toBeGreaterThanOrEqual(50);
            expect(result.score).toBeLessThan(70);
        });

        test('should return EVALUATE for NAICS match without many keywords', () => {
            const opp = {
                id: 'test-8b',
                title: 'Equipment Installation',
                naicsCode: '333249',
                setAside: 'Small Business',
            };

            const result = qualifyOpportunity(opp, mockProfile);

            expect(result.status).toBe('EVALUATE');
            expect(result.score).toBeGreaterThanOrEqual(50);
        });
    });

    describe('PASS Recommendations (<50 points)', () => {
        test('should return PASS for low score opportunities', () => {
            const opp = {
                id: 'test-9',
                title: 'Office Supplies',
                description: 'General office equipment',
            };

            const result = qualifyOpportunity(opp, mockProfile);

            expect(result.status).toBe('PASS');
            expect(result.reason).toContain('Low match');
        });

        test('should return PASS for non-matching opportunity', () => {
            const opp = {
                id: 'test-9b',
                title: 'Catering Services',
                description: 'Food service for federal building',
                naicsCode: '722310',
            };

            const result = qualifyOpportunity(opp, mockProfile);

            expect(result.status).toBe('PASS');
            expect(result.score).toBeLessThan(50);
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
            expect(result.status).toBe('PASS'); // No matching data = low score = PASS
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
        { id: '3', qualification: { status: 'EVALUATE' } },
        { id: '4', qualification: { status: 'GO' } },
        { id: '5', qualification: { status: 'PASS' } },
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

    test('should filter by EVALUATE status', () => {
        const result = filterByStatus(opportunities, 'EVALUATE');
        expect(result).toHaveLength(1);
    });

    test('should filter by PASS status', () => {
        const result = filterByStatus(opportunities, 'PASS');
        expect(result).toHaveLength(1);
    });

    test('should filter actionable opportunities (GO + EVALUATE)', () => {
        const result = filterByStatus(opportunities, 'actionable');
        expect(result).toHaveLength(3); // 2 GO + 1 EVALUATE
        expect(result.every(o =>
            o.qualification.status === 'GO' || o.qualification.status === 'EVALUATE'
        )).toBe(true);
    });

    test('should return all when status is "all"', () => {
        const result = filterByStatus(opportunities, 'all');
        expect(result).toHaveLength(5);
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
