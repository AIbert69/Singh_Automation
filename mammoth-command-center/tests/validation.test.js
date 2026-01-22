/**
 * Mammoth Command Center - Validation Tests
 */

import {
  validateInput,
  validateOrThrow,
  sanitizeString,
  uuidSchema,
  emailSchema,
  contactSchema,
  contactCreateSchema,
  dealSchema,
  dealStageSchema,
  taskSchema,
  taskPrioritySchema,
  campaignSchema,
  workflowSchema
} from '../lib/validation.js';
import { z } from 'zod';

describe('Schema Validation', () => {
  describe('uuidSchema', () => {
    test('should accept valid UUID', () => {
      const result = uuidSchema.safeParse('550e8400-e29b-41d4-a716-446655440000');
      expect(result.success).toBe(true);
    });

    test('should reject invalid UUID', () => {
      const result = uuidSchema.safeParse('not-a-uuid');
      expect(result.success).toBe(false);
    });
  });

  describe('emailSchema', () => {
    test('should accept valid email', () => {
      const result = emailSchema.safeParse('test@example.com');
      expect(result.success).toBe(true);
    });

    test('should reject invalid email', () => {
      const result = emailSchema.safeParse('invalid-email');
      expect(result.success).toBe(false);
    });
  });

  describe('dealStageSchema', () => {
    test('should accept valid stages', () => {
      const validStages = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
      validStages.forEach(stage => {
        const result = dealStageSchema.safeParse(stage);
        expect(result.success).toBe(true);
      });
    });

    test('should reject invalid stage', () => {
      const result = dealStageSchema.safeParse('invalid_stage');
      expect(result.success).toBe(false);
    });
  });

  describe('taskPrioritySchema', () => {
    test('should accept valid priorities', () => {
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      validPriorities.forEach(priority => {
        const result = taskPrioritySchema.safeParse(priority);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('contactSchema', () => {
    test('should accept valid contact', () => {
      const contact = {
        company_id: '550e8400-e29b-41d4-a716-446655440000',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        organization: 'Acme Corp',
        status: 'lead'
      };
      const result = contactSchema.safeParse(contact);
      expect(result.success).toBe(true);
    });

    test('should require company_id', () => {
      const contact = {
        first_name: 'John',
        last_name: 'Doe'
      };
      const result = contactSchema.safeParse(contact);
      expect(result.success).toBe(false);
    });

    test('should default status to lead', () => {
      const contact = {
        company_id: '550e8400-e29b-41d4-a716-446655440000'
      };
      const result = contactSchema.safeParse(contact);
      expect(result.success).toBe(true);
      expect(result.data.status).toBe('lead');
    });
  });

  describe('dealSchema', () => {
    test('should accept valid deal', () => {
      const deal = {
        company_id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'New Opportunity',
        value: 50000,
        stage: 'proposal'
      };
      const result = dealSchema.safeParse(deal);
      expect(result.success).toBe(true);
    });

    test('should require title', () => {
      const deal = {
        company_id: '550e8400-e29b-41d4-a716-446655440000',
        value: 50000
      };
      const result = dealSchema.safeParse(deal);
      expect(result.success).toBe(false);
    });

    test('should validate probability range 0-100', () => {
      const deal = {
        company_id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Test Deal',
        probability: 150
      };
      const result = dealSchema.safeParse(deal);
      expect(result.success).toBe(false);
    });

    test('should default currency to USD', () => {
      const deal = {
        company_id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Test Deal'
      };
      const result = dealSchema.safeParse(deal);
      expect(result.success).toBe(true);
      expect(result.data.currency).toBe('USD');
    });
  });

  describe('taskSchema', () => {
    test('should accept valid task', () => {
      const task = {
        company_id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Follow up with client',
        priority: 'high',
        status: 'pending'
      };
      const result = taskSchema.safeParse(task);
      expect(result.success).toBe(true);
    });

    test('should require title', () => {
      const task = {
        company_id: '550e8400-e29b-41d4-a716-446655440000'
      };
      const result = taskSchema.safeParse(task);
      expect(result.success).toBe(false);
    });

    test('should default priority to medium', () => {
      const task = {
        company_id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Test Task'
      };
      const result = taskSchema.safeParse(task);
      expect(result.success).toBe(true);
      expect(result.data.priority).toBe('medium');
    });
  });

  describe('campaignSchema', () => {
    test('should accept valid campaign', () => {
      const campaign = {
        company_id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Q1 Marketing Campaign',
        type: 'email',
        status: 'draft'
      };
      const result = campaignSchema.safeParse(campaign);
      expect(result.success).toBe(true);
    });

    test('should require name', () => {
      const campaign = {
        company_id: '550e8400-e29b-41d4-a716-446655440000',
        type: 'email'
      };
      const result = campaignSchema.safeParse(campaign);
      expect(result.success).toBe(false);
    });

    test('should validate campaign type', () => {
      const campaign = {
        company_id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Campaign',
        type: 'invalid_type'
      };
      const result = campaignSchema.safeParse(campaign);
      expect(result.success).toBe(false);
    });
  });

  describe('workflowSchema', () => {
    test('should accept valid workflow', () => {
      const workflow = {
        company_id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Lead Welcome',
        trigger: 'contact_created',
        actions: [
          { type: 'send_email', config: { template: 'welcome' } }
        ]
      };
      const result = workflowSchema.safeParse(workflow);
      expect(result.success).toBe(true);
    });

    test('should require at least one action', () => {
      const workflow = {
        company_id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Empty Workflow',
        trigger: 'contact_created',
        actions: []
      };
      const result = workflowSchema.safeParse(workflow);
      expect(result.success).toBe(false);
    });
  });
});

describe('Validation Helpers', () => {
  describe('validateInput', () => {
    test('should return success for valid input', () => {
      const schema = z.object({ name: z.string() });
      const result = validateInput(schema, { name: 'Test' });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ name: 'Test' });
    });

    test('should return error for invalid input', () => {
      const schema = z.object({ name: z.string() });
      const result = validateInput(schema, { name: 123 });
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateOrThrow', () => {
    test('should return data for valid input', () => {
      const schema = z.object({ name: z.string() });
      const result = validateOrThrow(schema, { name: 'Test' });
      expect(result).toEqual({ name: 'Test' });
    });

    test('should throw for invalid input', () => {
      const schema = z.object({ name: z.string() });
      expect(() => validateOrThrow(schema, { name: 123 })).toThrow();
    });

    test('should throw with ValidationError name', () => {
      const schema = z.object({ name: z.string() });
      try {
        validateOrThrow(schema, { name: 123 });
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.statusCode).toBe(400);
      }
    });
  });

  describe('sanitizeString', () => {
    test('should remove null bytes', () => {
      const result = sanitizeString('test\x00string');
      expect(result).toBe('teststring');
    });

    test('should remove script tags', () => {
      const result = sanitizeString('<script>alert("xss")</script>hello');
      expect(result).toBe('hello');
    });

    test('should trim whitespace', () => {
      const result = sanitizeString('  test  ');
      expect(result).toBe('test');
    });

    test('should return empty string for non-string input', () => {
      expect(sanitizeString(123)).toBe('');
      expect(sanitizeString(null)).toBe('');
      expect(sanitizeString(undefined)).toBe('');
    });

    test('should limit string length', () => {
      const longString = 'a'.repeat(20000);
      const result = sanitizeString(longString);
      expect(result.length).toBeLessThanOrEqual(10000);
    });
  });
});
