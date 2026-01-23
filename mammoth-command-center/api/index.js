/**
 * Mammoth Command Center - API Router
 * Main entry point for serverless API endpoints
 */

import { validateInput } from '../lib/validation.js';
import {
  companyCodeSchema,
  contactFilterSchema,
  dealFilterSchema,
  taskFilterSchema,
  campaignFilterSchema
} from '../lib/validation.js';

// CORS headers for API responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

/**
 * Create JSON response helper
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders
  });
}

/**
 * Error response helper
 */
function errorResponse(message, status = 400, details = null) {
  return jsonResponse({
    success: false,
    error: {
      message,
      details,
      timestamp: new Date().toISOString()
    }
  }, status);
}

/**
 * Success response helper
 */
function successResponse(data, meta = {}) {
  return jsonResponse({
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  });
}

/**
 * Parse request body safely
 */
async function parseBody(request) {
  try {
    const text = await request.text();
    return text ? JSON.parse(text) : {};
  } catch {
    return null;
  }
}

/**
 * Extract query parameters
 */
function getQueryParams(url) {
  const params = {};
  const searchParams = new URL(url).searchParams;
  for (const [key, value] of searchParams) {
    params[key] = value;
  }
  return params;
}

// =============================================================================
// API ROUTE HANDLERS
// =============================================================================

/**
 * GET /api/mammoth/companies
 * List all companies
 */
export async function getCompanies(request, supabase) {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('name');

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse(data);
}

/**
 * GET /api/mammoth/contacts
 * List contacts with filtering
 */
export async function getContacts(request, supabase) {
  const params = getQueryParams(request.url);
  const validation = validateInput(contactFilterSchema, params);

  if (!validation.success) {
    return errorResponse(validation.error);
  }

  const { company_id, status, search, page = 1, pageSize = 25 } = validation.data;

  let query = supabase
    .from('contacts')
    .select('*, deals:deals(count)', { count: 'exact' });

  if (company_id) {
    query = query.eq('company_id', company_id);
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,organization.ilike.%${search}%`);
  }

  query = query
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse(data, {
    total: count,
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    totalPages: Math.ceil(count / pageSize)
  });
}

/**
 * POST /api/mammoth/contacts
 * Create a new contact
 */
export async function createContact(request, supabase) {
  const body = await parseBody(request);
  if (!body) {
    return errorResponse('Invalid request body');
  }

  const { data, error } = await supabase
    .from('contacts')
    .insert([body])
    .select()
    .single();

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse(data, { action: 'created' });
}

/**
 * PATCH /api/mammoth/contacts/:id
 * Update a contact
 */
export async function updateContact(request, supabase, contactId) {
  const body = await parseBody(request);
  if (!body) {
    return errorResponse('Invalid request body');
  }

  const { data, error } = await supabase
    .from('contacts')
    .update(body)
    .eq('id', contactId)
    .select()
    .single();

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse(data, { action: 'updated' });
}

/**
 * DELETE /api/mammoth/contacts/:id
 * Delete a contact
 */
export async function deleteContact(request, supabase, contactId) {
  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', contactId);

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse({ id: contactId }, { action: 'deleted' });
}

/**
 * GET /api/mammoth/deals
 * List deals with filtering
 */
export async function getDeals(request, supabase) {
  const params = getQueryParams(request.url);
  const validation = validateInput(dealFilterSchema, params);

  if (!validation.success) {
    return errorResponse(validation.error);
  }

  const { company_id, stage, exclude_closed, page = 1, pageSize = 25 } = validation.data;

  let query = supabase
    .from('deals')
    .select(`
      *,
      contact:contacts(id, first_name, last_name, email, organization)
    `, { count: 'exact' });

  if (company_id) {
    query = query.eq('company_id', company_id);
  }

  if (stage) {
    query = query.eq('stage', stage);
  }

  if (exclude_closed) {
    query = query.not('stage', 'in', '(closed_won,closed_lost)');
  }

  query = query
    .order('expected_close', { ascending: true })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse(data, {
    total: count,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
}

/**
 * POST /api/mammoth/deals
 * Create a new deal
 */
export async function createDeal(request, supabase) {
  const body = await parseBody(request);
  if (!body) {
    return errorResponse('Invalid request body');
  }

  const { data, error } = await supabase
    .from('deals')
    .insert([body])
    .select(`
      *,
      contact:contacts(id, first_name, last_name, email, organization)
    `)
    .single();

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse(data, { action: 'created' });
}

/**
 * PATCH /api/mammoth/deals/:id
 * Update a deal
 */
export async function updateDeal(request, supabase, dealId) {
  const body = await parseBody(request);
  if (!body) {
    return errorResponse('Invalid request body');
  }

  const { data, error } = await supabase
    .from('deals')
    .update(body)
    .eq('id', dealId)
    .select(`
      *,
      contact:contacts(id, first_name, last_name, email, organization)
    `)
    .single();

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse(data, { action: 'updated' });
}

/**
 * PATCH /api/mammoth/deals/:id/stage
 * Update deal stage with history tracking
 */
export async function updateDealStage(request, supabase, dealId) {
  const body = await parseBody(request);
  if (!body || !body.stage) {
    return errorResponse('Stage is required');
  }

  const { stage, notes } = body;

  // Update the deal (trigger will handle history and probability)
  const { data, error } = await supabase
    .from('deals')
    .update({ stage })
    .eq('id', dealId)
    .select(`
      *,
      contact:contacts(id, first_name, last_name, email, organization)
    `)
    .single();

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse(data, { action: 'stage_updated' });
}

/**
 * GET /api/mammoth/tasks
 * List tasks with filtering
 */
export async function getTasks(request, supabase) {
  const params = getQueryParams(request.url);
  const validation = validateInput(taskFilterSchema, params);

  if (!validation.success) {
    return errorResponse(validation.error);
  }

  const { company_id, status, priority, overdue, page = 1, pageSize = 50 } = validation.data;

  let query = supabase
    .from('tasks')
    .select(`
      *,
      deal:deals(id, title),
      contact:contacts(id, first_name, last_name)
    `, { count: 'exact' });

  if (company_id) {
    query = query.eq('company_id', company_id);
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (priority) {
    query = query.eq('priority', priority);
  }

  if (overdue === 'true') {
    query = query
      .lt('due_date', new Date().toISOString())
      .neq('status', 'completed')
      .neq('status', 'cancelled');
  }

  query = query
    .order('due_date', { ascending: true })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse(data, {
    total: count,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
}

/**
 * POST /api/mammoth/tasks
 * Create a new task
 */
export async function createTask(request, supabase) {
  const body = await parseBody(request);
  if (!body) {
    return errorResponse('Invalid request body');
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert([body])
    .select(`
      *,
      deal:deals(id, title),
      contact:contacts(id, first_name, last_name)
    `)
    .single();

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse(data, { action: 'created' });
}

/**
 * PATCH /api/mammoth/tasks/:id
 * Update a task
 */
export async function updateTask(request, supabase, taskId) {
  const body = await parseBody(request);
  if (!body) {
    return errorResponse('Invalid request body');
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(body)
    .eq('id', taskId)
    .select()
    .single();

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse(data, { action: 'updated' });
}

/**
 * PATCH /api/mammoth/tasks/:id/complete
 * Mark task as completed
 */
export async function completeTask(request, supabase, taskId) {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', taskId)
    .select()
    .single();

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse(data, { action: 'completed' });
}

/**
 * GET /api/mammoth/campaigns
 * List campaigns with filtering
 */
export async function getCampaigns(request, supabase) {
  const params = getQueryParams(request.url);
  const validation = validateInput(campaignFilterSchema, params);

  if (!validation.success) {
    return errorResponse(validation.error);
  }

  const { company_id, status, type, page = 1, pageSize = 25 } = validation.data;

  let query = supabase
    .from('campaigns')
    .select('*', { count: 'exact' });

  if (company_id) {
    query = query.eq('company_id', company_id);
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (type) {
    query = query.eq('type', type);
  }

  query = query
    .order('start_date', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse(data, {
    total: count,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
}

/**
 * POST /api/mammoth/campaigns
 * Create a new campaign
 */
export async function createCampaign(request, supabase) {
  const body = await parseBody(request);
  if (!body) {
    return errorResponse('Invalid request body');
  }

  const { data, error } = await supabase
    .from('campaigns')
    .insert([body])
    .select()
    .single();

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse(data, { action: 'created' });
}

/**
 * GET /api/mammoth/activities
 * List recent activities
 */
export async function getActivities(request, supabase) {
  const params = getQueryParams(request.url);
  const { company_id, contact_id, deal_id, limit = 25 } = params;

  let query = supabase
    .from('activities')
    .select(`
      *,
      contact:contacts(id, first_name, last_name),
      deal:deals(id, title)
    `);

  if (company_id) {
    query = query.eq('company_id', company_id);
  }

  if (contact_id) {
    query = query.eq('contact_id', contact_id);
  }

  if (deal_id) {
    query = query.eq('deal_id', deal_id);
  }

  query = query
    .order('created_at', { ascending: false })
    .limit(parseInt(limit));

  const { data, error } = await query;

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse(data);
}

/**
 * GET /api/mammoth/dashboard/metrics
 * Get dashboard KPIs
 */
export async function getDashboardMetrics(request, supabase) {
  const params = getQueryParams(request.url);
  const { company_id } = params;

  // Build queries based on company filter
  const companyFilter = company_id ? { company_id } : {};

  // Get pipeline summary
  let pipelineQuery = supabase
    .from('deals')
    .select('stage, value, probability')
    .not('stage', 'in', '(closed_won,closed_lost)');

  if (company_id) {
    pipelineQuery = pipelineQuery.eq('company_id', company_id);
  }

  // Get task counts
  let taskQuery = supabase
    .from('tasks')
    .select('status, priority', { count: 'exact' })
    .neq('status', 'cancelled');

  if (company_id) {
    taskQuery = taskQuery.eq('company_id', company_id);
  }

  // Get email stats
  let emailQuery = supabase
    .from('emails')
    .select('is_read, direction', { count: 'exact' })
    .eq('direction', 'inbound')
    .eq('is_read', false);

  if (company_id) {
    emailQuery = emailQuery.eq('company_id', company_id);
  }

  // Get active campaigns
  let campaignQuery = supabase
    .from('campaigns')
    .select('id', { count: 'exact' })
    .eq('status', 'active');

  if (company_id) {
    campaignQuery = campaignQuery.eq('company_id', company_id);
  }

  const [
    pipelineResult,
    taskResult,
    emailResult,
    campaignResult
  ] = await Promise.all([
    pipelineQuery,
    taskQuery,
    emailResult,
    campaignQuery
  ]);

  // Calculate metrics
  const deals = pipelineResult.data || [];
  const totalPipeline = deals.reduce((sum, d) => sum + (d.value || 0), 0);
  const weightedPipeline = deals.reduce((sum, d) => sum + ((d.value || 0) * (d.probability || 0) / 100), 0);

  const metrics = {
    pipeline: {
      total: totalPipeline,
      weighted: weightedPipeline,
      dealCount: deals.length,
      byStage: deals.reduce((acc, d) => {
        acc[d.stage] = (acc[d.stage] || 0) + 1;
        return acc;
      }, {})
    },
    tasks: {
      pending: taskResult.count || 0,
      overdue: 0 // Would need additional query
    },
    emails: {
      unread: emailResult.count || 0
    },
    campaigns: {
      active: campaignResult.count || 0
    }
  };

  return successResponse(metrics);
}

/**
 * GET /api/mammoth/health
 * Health check endpoint
 */
export async function healthCheck() {
  return successResponse({
    status: 'healthy',
    service: 'mammoth-command-center',
    version: '1.0.0'
  });
}

// =============================================================================
// MAIN REQUEST HANDLER
// =============================================================================

/**
 * Main API handler for Vercel serverless function
 */
export default async function handler(request) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/mammoth', '');
    const method = request.method;

    // Import Supabase client (would be configured in actual deployment)
    // const supabase = createClient();

    // For now, return a placeholder indicating the API structure
    return successResponse({
      message: 'Mammoth Command Center API',
      path,
      method,
      availableEndpoints: [
        'GET /api/mammoth/health',
        'GET /api/mammoth/companies',
        'GET /api/mammoth/contacts',
        'POST /api/mammoth/contacts',
        'PATCH /api/mammoth/contacts/:id',
        'DELETE /api/mammoth/contacts/:id',
        'GET /api/mammoth/deals',
        'POST /api/mammoth/deals',
        'PATCH /api/mammoth/deals/:id',
        'PATCH /api/mammoth/deals/:id/stage',
        'GET /api/mammoth/tasks',
        'POST /api/mammoth/tasks',
        'PATCH /api/mammoth/tasks/:id',
        'PATCH /api/mammoth/tasks/:id/complete',
        'GET /api/mammoth/campaigns',
        'POST /api/mammoth/campaigns',
        'GET /api/mammoth/activities',
        'GET /api/mammoth/dashboard/metrics'
      ]
    });
  } catch (error) {
    console.error('API Error:', error);
    return errorResponse('Internal server error', 500, error.message);
  }
}

export const config = {
  runtime: 'edge'
};
