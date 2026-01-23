/**
 * Mammoth Command Center - Configuration Tests
 */

import {
  COMPANIES,
  DEAL_STAGES,
  TASK_PRIORITIES,
  CONTACT_STATUSES,
  CAMPAIGN_TYPES,
  formatCurrency,
  formatNumber,
  getCompany,
  getActiveDealStages,
  calculateWeightedPipeline,
  getRelativeTime,
  isTaskOverdue,
  getPriorityWeight
} from '../lib/config.js';

describe('Configuration', () => {
  describe('Company Configuration', () => {
    test('should have all three companies defined', () => {
      expect(COMPANIES.MDX).toBeDefined();
      expect(COMPANIES.SHD).toBeDefined();
      expect(COMPANIES.DBL).toBeDefined();
    });

    test('each company should have required properties', () => {
      Object.values(COMPANIES).forEach(company => {
        expect(company.code).toBeDefined();
        expect(company.name).toBeDefined();
        expect(company.primaryColor).toBeDefined();
        expect(company.industry).toBeDefined();
      });
    });

    test('MammothDX should have correct properties', () => {
      expect(COMPANIES.MDX.name).toBe('MammothDX');
      expect(COMPANIES.MDX.code).toBe('MDX');
      expect(COMPANIES.MDX.industry).toBe('Diagnostics & Analytics');
    });

    test('Shield should have correct properties', () => {
      expect(COMPANIES.SHD.name).toBe('Shield');
      expect(COMPANIES.SHD.code).toBe('SHD');
      expect(COMPANIES.SHD.industry).toBe('Security Solutions');
    });

    test('Durablue should have correct properties', () => {
      expect(COMPANIES.DBL.name).toBe('Durablue');
      expect(COMPANIES.DBL.code).toBe('DBL');
      expect(COMPANIES.DBL.industry).toBe('Industrial Durability');
    });
  });

  describe('Deal Stages', () => {
    test('should have all required stages', () => {
      expect(DEAL_STAGES.lead).toBeDefined();
      expect(DEAL_STAGES.qualified).toBeDefined();
      expect(DEAL_STAGES.proposal).toBeDefined();
      expect(DEAL_STAGES.negotiation).toBeDefined();
      expect(DEAL_STAGES.closed_won).toBeDefined();
      expect(DEAL_STAGES.closed_lost).toBeDefined();
    });

    test('each stage should have order and probability', () => {
      Object.values(DEAL_STAGES).forEach(stage => {
        expect(typeof stage.order).toBe('number');
        expect(typeof stage.probability).toBe('number');
        expect(stage.probability).toBeGreaterThanOrEqual(0);
        expect(stage.probability).toBeLessThanOrEqual(100);
      });
    });

    test('closed_won should have 100% probability', () => {
      expect(DEAL_STAGES.closed_won.probability).toBe(100);
    });

    test('closed_lost should have 0% probability', () => {
      expect(DEAL_STAGES.closed_lost.probability).toBe(0);
    });
  });

  describe('Task Priorities', () => {
    test('should have all priority levels', () => {
      expect(TASK_PRIORITIES.low).toBeDefined();
      expect(TASK_PRIORITIES.medium).toBeDefined();
      expect(TASK_PRIORITIES.high).toBeDefined();
      expect(TASK_PRIORITIES.urgent).toBeDefined();
    });
  });

  describe('Contact Statuses', () => {
    test('should have all status types', () => {
      expect(CONTACT_STATUSES.lead).toBeDefined();
      expect(CONTACT_STATUSES.prospect).toBeDefined();
      expect(CONTACT_STATUSES.customer).toBeDefined();
      expect(CONTACT_STATUSES.churned).toBeDefined();
    });
  });

  describe('Campaign Types', () => {
    test('should have common campaign types', () => {
      expect(CAMPAIGN_TYPES.email).toBeDefined();
      expect(CAMPAIGN_TYPES.social).toBeDefined();
      expect(CAMPAIGN_TYPES.event).toBeDefined();
      expect(CAMPAIGN_TYPES.webinar).toBeDefined();
    });
  });
});

describe('Utility Functions', () => {
  describe('formatCurrency', () => {
    test('should format USD currency correctly', () => {
      expect(formatCurrency(1000)).toBe('$1,000');
      expect(formatCurrency(1000000)).toBe('$1,000,000');
      expect(formatCurrency(0)).toBe('$0');
    });

    test('should handle decimal values', () => {
      expect(formatCurrency(1234.56)).toBe('$1,235');
    });
  });

  describe('formatNumber', () => {
    test('should format thousands with K', () => {
      expect(formatNumber(1000)).toBe('1K');
      expect(formatNumber(1500)).toBe('1.5K');
      expect(formatNumber(50000)).toBe('50K');
    });

    test('should format millions with M', () => {
      expect(formatNumber(1000000)).toBe('1M');
      expect(formatNumber(2500000)).toBe('2.5M');
    });

    test('should return plain number for values under 1000', () => {
      expect(formatNumber(500)).toBe('500');
      expect(formatNumber(0)).toBe('0');
    });
  });

  describe('getCompany', () => {
    test('should return company by code', () => {
      const company = getCompany('MDX');
      expect(company).toBeDefined();
      expect(company.name).toBe('MammothDX');
    });

    test('should return null for invalid code', () => {
      expect(getCompany('INVALID')).toBeNull();
    });
  });

  describe('getActiveDealStages', () => {
    test('should return only non-closed stages', () => {
      const stages = getActiveDealStages();
      const stageKeys = stages.map(s => s.key);

      expect(stageKeys).toContain('lead');
      expect(stageKeys).toContain('qualified');
      expect(stageKeys).toContain('proposal');
      expect(stageKeys).toContain('negotiation');
      expect(stageKeys).not.toContain('closed_won');
      expect(stageKeys).not.toContain('closed_lost');
    });

    test('should be sorted by order', () => {
      const stages = getActiveDealStages();
      for (let i = 1; i < stages.length; i++) {
        expect(stages[i].order).toBeGreaterThan(stages[i - 1].order);
      }
    });
  });

  describe('calculateWeightedPipeline', () => {
    test('should calculate weighted value correctly', () => {
      const deals = [
        { value: 100000, stage: 'lead', probability: 10 },
        { value: 50000, stage: 'proposal', probability: 50 }
      ];
      const weighted = calculateWeightedPipeline(deals);
      expect(weighted).toBe(35000); // (100000 * 0.1) + (50000 * 0.5)
    });

    test('should return 0 for empty array', () => {
      expect(calculateWeightedPipeline([])).toBe(0);
    });
  });

  describe('getRelativeTime', () => {
    test('should return "just now" for recent times', () => {
      const now = new Date().toISOString();
      expect(getRelativeTime(now)).toBe('just now');
    });

    test('should return minutes ago', () => {
      const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      expect(getRelativeTime(tenMinsAgo)).toBe('10m ago');
    });

    test('should return hours ago', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      expect(getRelativeTime(twoHoursAgo)).toBe('2h ago');
    });

    test('should return days ago', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      expect(getRelativeTime(threeDaysAgo)).toBe('3d ago');
    });
  });

  describe('isTaskOverdue', () => {
    test('should return true for overdue pending task', () => {
      const task = {
        due_date: new Date(Date.now() - 86400000).toISOString(),
        status: 'pending'
      };
      expect(isTaskOverdue(task)).toBe(true);
    });

    test('should return false for completed task', () => {
      const task = {
        due_date: new Date(Date.now() - 86400000).toISOString(),
        status: 'completed'
      };
      expect(isTaskOverdue(task)).toBe(false);
    });

    test('should return false for future task', () => {
      const task = {
        due_date: new Date(Date.now() + 86400000).toISOString(),
        status: 'pending'
      };
      expect(isTaskOverdue(task)).toBe(false);
    });

    test('should return false for task without due date', () => {
      const task = { status: 'pending' };
      expect(isTaskOverdue(task)).toBe(false);
    });
  });

  describe('getPriorityWeight', () => {
    test('should return correct weights', () => {
      expect(getPriorityWeight('urgent')).toBe(4);
      expect(getPriorityWeight('high')).toBe(3);
      expect(getPriorityWeight('medium')).toBe(2);
      expect(getPriorityWeight('low')).toBe(1);
    });

    test('should return 0 for unknown priority', () => {
      expect(getPriorityWeight('unknown')).toBe(0);
    });
  });
});
