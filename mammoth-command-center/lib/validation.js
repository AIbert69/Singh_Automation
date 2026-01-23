/**
 * Mammoth Command Center - Validation Schemas
 * Zod-based validation for all data models
 */

import { z } from 'zod';

// =============================================================================
// COMMON SCHEMAS
// =============================================================================

export const uuidSchema = z.string().uuid();

export const emailSchema = z.string().email().max(255);

export const phoneSchema = z.string()
  .regex(/^[\d\s\-+()]+$/, 'Invalid phone number format')
  .max(20)
  .optional()
  .nullable();

export const urlSchema = z.string().url().max(500).optional().nullable();

export const dateSchema = z.string().datetime().or(z.date());

export const currencySchema = z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD']);

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
  orderBy: z.string().optional(),
  ascending: z.boolean().default(false)
});

// =============================================================================
// COMPANY SCHEMAS
// =============================================================================

export const companyCodeSchema = z.enum(['MDX', 'SHD', 'DBL']);

export const companySchema = z.object({
  id: uuidSchema.optional(),
  name: z.string().min(1).max(100),
  code: z.string().min(2).max(10),
  logo_url: urlSchema,
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  settings: z.record(z.unknown()).optional()
});

// =============================================================================
// CONTACT SCHEMAS
// =============================================================================

export const contactStatusSchema = z.enum(['lead', 'prospect', 'customer', 'churned', 'inactive']);

export const contactSchema = z.object({
  id: uuidSchema.optional(),
  company_id: uuidSchema,
  first_name: z.string().max(50).optional().nullable(),
  last_name: z.string().max(50).optional().nullable(),
  email: emailSchema.optional().nullable(),
  phone: phoneSchema,
  organization: z.string().max(200).optional().nullable(),
  title: z.string().max(100).optional().nullable(),
  lead_source: z.string().max(50).optional().nullable(),
  status: contactStatusSchema.default('lead'),
  tags: z.array(z.string()).default([]),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional()
  }).optional(),
  social_links: z.object({
    linkedin: urlSchema,
    twitter: urlSchema,
    website: urlSchema
  }).optional(),
  metadata: z.record(z.unknown()).optional(),
  lead_score: z.number().int().min(0).max(100).default(0)
});

export const contactCreateSchema = contactSchema.omit({ id: true });

export const contactUpdateSchema = contactSchema.partial().omit({ id: true, company_id: true });

export const contactFilterSchema = z.object({
  company_id: uuidSchema.optional(),
  status: contactStatusSchema.optional(),
  search: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
  lead_score_min: z.number().int().min(0).optional(),
  lead_score_max: z.number().int().max(100).optional(),
  ...paginationSchema.shape
});

// =============================================================================
// DEAL SCHEMAS
// =============================================================================

export const dealStageSchema = z.enum([
  'lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'
]);

export const dealSchema = z.object({
  id: uuidSchema.optional(),
  company_id: uuidSchema,
  contact_id: uuidSchema.optional().nullable(),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  value: z.number().min(0).max(999999999999).default(0),
  currency: currencySchema.default('USD'),
  stage: dealStageSchema.default('lead'),
  probability: z.number().int().min(0).max(100).default(10),
  expected_close: z.string().optional().nullable(),
  actual_close: z.string().optional().nullable(),
  assigned_to: uuidSchema.optional().nullable(),
  lost_reason: z.string().max(200).optional().nullable(),
  won_reason: z.string().max(200).optional().nullable(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).optional()
});

export const dealCreateSchema = dealSchema.omit({ id: true });

export const dealUpdateSchema = dealSchema.partial().omit({ id: true, company_id: true });

export const dealFilterSchema = z.object({
  company_id: uuidSchema.optional(),
  stage: dealStageSchema.optional(),
  stages: z.array(dealStageSchema).optional(),
  assigned_to: uuidSchema.optional(),
  contact_id: uuidSchema.optional(),
  value_min: z.number().min(0).optional(),
  value_max: z.number().optional(),
  expected_close_from: z.string().optional(),
  expected_close_to: z.string().optional(),
  exclude_closed: z.boolean().default(false),
  ...paginationSchema.shape
});

export const dealStageUpdateSchema = z.object({
  deal_id: uuidSchema,
  stage: dealStageSchema,
  notes: z.string().max(1000).optional()
});

// =============================================================================
// TASK SCHEMAS
// =============================================================================

export const taskPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);

export const taskStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'cancelled']);

export const recurrenceSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  interval: z.number().int().min(1).max(365).default(1),
  end_date: z.string().optional(),
  end_after_occurrences: z.number().int().min(1).optional(),
  days_of_week: z.array(z.number().int().min(0).max(6)).optional(),
  day_of_month: z.number().int().min(1).max(31).optional()
});

export const taskSchema = z.object({
  id: uuidSchema.optional(),
  company_id: uuidSchema,
  deal_id: uuidSchema.optional().nullable(),
  contact_id: uuidSchema.optional().nullable(),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  priority: taskPrioritySchema.default('medium'),
  status: taskStatusSchema.default('pending'),
  due_date: z.string().optional().nullable(),
  reminder_at: z.string().optional().nullable(),
  assigned_to: uuidSchema.optional().nullable(),
  parent_task_id: uuidSchema.optional().nullable(),
  recurrence: recurrenceSchema.optional().nullable(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).optional()
});

export const taskCreateSchema = taskSchema.omit({ id: true });

export const taskUpdateSchema = taskSchema.partial().omit({ id: true, company_id: true });

export const taskFilterSchema = z.object({
  company_id: uuidSchema.optional(),
  status: taskStatusSchema.optional(),
  statuses: z.array(taskStatusSchema).optional(),
  priority: taskPrioritySchema.optional(),
  priorities: z.array(taskPrioritySchema).optional(),
  assigned_to: uuidSchema.optional(),
  deal_id: uuidSchema.optional(),
  contact_id: uuidSchema.optional(),
  due_from: z.string().optional(),
  due_to: z.string().optional(),
  overdue: z.boolean().optional(),
  ...paginationSchema.shape
});

// =============================================================================
// EMAIL SCHEMAS
// =============================================================================

export const emailDirectionSchema = z.enum(['inbound', 'outbound']);

export const emailSentimentSchema = z.enum(['positive', 'neutral', 'negative', 'urgent']);

export const emailSchema = z.object({
  id: uuidSchema.optional(),
  company_id: uuidSchema,
  contact_id: uuidSchema.optional().nullable(),
  deal_id: uuidSchema.optional().nullable(),
  gmail_id: z.string().max(100).optional().nullable(),
  thread_id: z.string().max(100).optional().nullable(),
  direction: emailDirectionSchema,
  from_address: emailSchema.optional().nullable(),
  to_addresses: z.array(z.string().email()).default([]),
  cc_addresses: z.array(z.string().email()).default([]),
  subject: z.string().max(500).optional().nullable(),
  body_text: z.string().optional().nullable(),
  body_html: z.string().optional().nullable(),
  body_preview: z.string().max(500).optional().nullable(),
  attachments: z.array(z.object({
    filename: z.string(),
    mimeType: z.string(),
    size: z.number(),
    url: z.string().optional()
  })).default([]),
  sent_at: z.string().optional().nullable(),
  received_at: z.string().optional().nullable(),
  opened_at: z.string().optional().nullable(),
  clicked_at: z.string().optional().nullable(),
  replied_at: z.string().optional().nullable(),
  ai_summary: z.string().optional().nullable(),
  ai_action_items: z.array(z.string()).default([]),
  sentiment: emailSentimentSchema.optional().nullable(),
  category: z.string().max(50).optional().nullable(),
  is_read: z.boolean().default(false),
  is_starred: z.boolean().default(false),
  is_archived: z.boolean().default(false),
  metadata: z.record(z.unknown()).optional()
});

export const emailCreateSchema = emailSchema.omit({ id: true });

export const emailFilterSchema = z.object({
  company_id: uuidSchema.optional(),
  contact_id: uuidSchema.optional(),
  deal_id: uuidSchema.optional(),
  direction: emailDirectionSchema.optional(),
  sentiment: emailSentimentSchema.optional(),
  category: z.string().optional(),
  is_read: z.boolean().optional(),
  is_starred: z.boolean().optional(),
  search: z.string().max(200).optional(),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
  ...paginationSchema.shape
});

export const emailDraftSchema = z.object({
  company_id: uuidSchema,
  contact_id: uuidSchema.optional(),
  deal_id: uuidSchema.optional(),
  to_addresses: z.array(z.string().email()).min(1),
  cc_addresses: z.array(z.string().email()).default([]),
  subject: z.string().min(1).max(500),
  body_html: z.string(),
  schedule_at: z.string().optional(),
  template_id: uuidSchema.optional()
});

// =============================================================================
// CAMPAIGN SCHEMAS
// =============================================================================

export const campaignTypeSchema = z.enum([
  'email', 'social', 'event', 'webinar', 'trade_show', 'content', 'ads', 'other'
]);

export const campaignStatusSchema = z.enum([
  'draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'
]);

export const campaignSchema = z.object({
  id: uuidSchema.optional(),
  company_id: uuidSchema,
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  type: campaignTypeSchema.default('email'),
  status: campaignStatusSchema.default('draft'),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  budget: z.number().min(0).default(0),
  actual_spend: z.number().min(0).default(0),
  target_audience: z.object({
    segments: z.array(z.string()).optional(),
    filters: z.record(z.unknown()).optional(),
    estimated_reach: z.number().optional()
  }).optional(),
  goals: z.object({
    primary: z.string().optional(),
    metrics: z.array(z.object({
      name: z.string(),
      target: z.number()
    })).optional()
  }).optional(),
  metrics: z.object({
    sent: z.number().default(0),
    delivered: z.number().default(0),
    opened: z.number().default(0),
    clicked: z.number().default(0),
    converted: z.number().default(0),
    revenue: z.number().default(0)
  }).optional(),
  tags: z.array(z.string()).default([]),
  assets: z.array(z.object({
    type: z.string(),
    name: z.string(),
    url: z.string()
  })).default([])
});

export const campaignCreateSchema = campaignSchema.omit({ id: true });

export const campaignUpdateSchema = campaignSchema.partial().omit({ id: true, company_id: true });

export const campaignFilterSchema = z.object({
  company_id: uuidSchema.optional(),
  type: campaignTypeSchema.optional(),
  types: z.array(campaignTypeSchema).optional(),
  status: campaignStatusSchema.optional(),
  statuses: z.array(campaignStatusSchema).optional(),
  start_from: z.string().optional(),
  start_to: z.string().optional(),
  ...paginationSchema.shape
});

// =============================================================================
// WORKFLOW SCHEMAS
// =============================================================================

export const workflowTriggerSchema = z.enum([
  'contact_created', 'contact_status_changed',
  'deal_created', 'deal_stage_changed', 'deal_won', 'deal_lost',
  'task_created', 'task_completed', 'task_overdue',
  'email_received', 'email_opened', 'email_not_replied',
  'campaign_started', 'campaign_ended',
  'schedule', 'manual'
]);

export const workflowActionSchema = z.object({
  type: z.enum([
    'send_email', 'create_task', 'update_deal', 'update_contact',
    'send_notification', 'webhook', 'delay', 'condition'
  ]),
  config: z.record(z.unknown())
});

export const workflowSchema = z.object({
  id: uuidSchema.optional(),
  company_id: uuidSchema,
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional().nullable(),
  trigger: workflowTriggerSchema,
  trigger_config: z.record(z.unknown()).default({}),
  actions: z.array(workflowActionSchema).min(1),
  conditions: z.record(z.unknown()).optional(),
  is_active: z.boolean().default(true)
});

export const workflowCreateSchema = workflowSchema.omit({ id: true });

// =============================================================================
// NOTE SCHEMAS
// =============================================================================

export const noteSchema = z.object({
  id: uuidSchema.optional(),
  company_id: uuidSchema,
  contact_id: uuidSchema.optional().nullable(),
  deal_id: uuidSchema.optional().nullable(),
  task_id: uuidSchema.optional().nullable(),
  content: z.string().min(1).max(10000),
  is_pinned: z.boolean().default(false)
});

export const noteCreateSchema = noteSchema.omit({ id: true });

// =============================================================================
// ACTIVITY SCHEMAS
// =============================================================================

export const activityTypeSchema = z.enum([
  'email_sent', 'email_received', 'email_opened',
  'call_made', 'call_received', 'meeting_scheduled', 'meeting_completed',
  'note_added', 'task_created', 'task_completed',
  'deal_created', 'deal_updated', 'deal_won', 'deal_lost',
  'contact_created', 'contact_updated',
  'campaign_launched', 'campaign_completed',
  'document_uploaded', 'document_viewed',
  'other'
]);

export const activitySchema = z.object({
  id: uuidSchema.optional(),
  company_id: uuidSchema,
  contact_id: uuidSchema.optional().nullable(),
  deal_id: uuidSchema.optional().nullable(),
  task_id: uuidSchema.optional().nullable(),
  email_id: uuidSchema.optional().nullable(),
  campaign_id: uuidSchema.optional().nullable(),
  type: activityTypeSchema,
  title: z.string().max(200).optional(),
  description: z.string().max(5000).optional(),
  metadata: z.record(z.unknown()).optional()
});

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validate input against a schema
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @param {unknown} data - Data to validate
 * @returns {{ success: boolean, data?: unknown, error?: string }}
 */
export function validateInput(schema, data) {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (err) {
    if (err instanceof z.ZodError) {
      const message = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return { success: false, error: message };
    }
    return { success: false, error: 'Validation failed' };
  }
}

/**
 * Validate input and throw on error
 * @param {z.ZodSchema} schema - Zod schema
 * @param {unknown} data - Data to validate
 * @returns {unknown} Validated data
 * @throws {Error} If validation fails
 */
export function validateOrThrow(schema, data) {
  const result = validateInput(schema, data);
  if (!result.success) {
    const error = new Error(result.error);
    error.name = 'ValidationError';
    error.statusCode = 400;
    throw error;
  }
  return result.data;
}

/**
 * Sanitize string input
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeString(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/\0/g, '') // Remove null bytes
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .trim()
    .slice(0, 10000); // Limit length
}

export default {
  // Common
  uuidSchema,
  emailSchema,
  phoneSchema,
  urlSchema,
  dateSchema,
  currencySchema,
  paginationSchema,
  // Company
  companyCodeSchema,
  companySchema,
  // Contact
  contactStatusSchema,
  contactSchema,
  contactCreateSchema,
  contactUpdateSchema,
  contactFilterSchema,
  // Deal
  dealStageSchema,
  dealSchema,
  dealCreateSchema,
  dealUpdateSchema,
  dealFilterSchema,
  dealStageUpdateSchema,
  // Task
  taskPrioritySchema,
  taskStatusSchema,
  taskSchema,
  taskCreateSchema,
  taskUpdateSchema,
  taskFilterSchema,
  recurrenceSchema,
  // Email
  emailDirectionSchema,
  emailSentimentSchema,
  emailSchema,
  emailCreateSchema,
  emailFilterSchema,
  emailDraftSchema,
  // Campaign
  campaignTypeSchema,
  campaignStatusSchema,
  campaignSchema,
  campaignCreateSchema,
  campaignUpdateSchema,
  campaignFilterSchema,
  // Workflow
  workflowTriggerSchema,
  workflowActionSchema,
  workflowSchema,
  workflowCreateSchema,
  // Note
  noteSchema,
  noteCreateSchema,
  // Activity
  activityTypeSchema,
  activitySchema,
  // Helpers
  validateInput,
  validateOrThrow,
  sanitizeString
};
