/**
 * Mammoth Command Center - Supabase Client
 * Database client with real-time subscriptions and multi-tenant support
 */

import { SUPABASE_CONFIG } from './config.js';

// Supabase client singleton
let supabaseClient = null;

/**
 * Initialize Supabase client
 * @param {Object} options - Configuration options
 * @returns {Object} Supabase client instance
 */
export function createClient(options = {}) {
  if (supabaseClient && !options.forceNew) {
    return supabaseClient;
  }

  const { url, anonKey } = { ...SUPABASE_CONFIG, ...options };

  if (!url || !anonKey) {
    console.warn('Supabase credentials not configured. Using mock client.');
    return createMockClient();
  }

  // Dynamic import for Supabase (works in both Node and browser)
  if (typeof window !== 'undefined' && window.supabase) {
    supabaseClient = window.supabase.createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
  } else {
    // For serverless/Node environment
    supabaseClient = {
      url,
      anonKey,
      from: (table) => createQueryBuilder(table, url, anonKey),
      auth: createAuthClient(url, anonKey),
      channel: (name) => createRealtimeChannel(name),
      rpc: (fn, params) => callRpc(fn, params, url, anonKey)
    };
  }

  return supabaseClient;
}

/**
 * Create a mock client for development without Supabase
 */
function createMockClient() {
  const mockData = {
    companies: [
      { id: '1', code: 'MDX', name: 'MammothDX', primary_color: '#10B981' },
      { id: '2', code: 'SHD', name: 'Shield', primary_color: '#3B82F6' },
      { id: '3', code: 'DBL', name: 'Durablue', primary_color: '#8B5CF6' }
    ],
    contacts: [],
    deals: [],
    tasks: [],
    emails: [],
    campaigns: []
  };

  return {
    from: (table) => ({
      select: () => Promise.resolve({ data: mockData[table] || [], error: null }),
      insert: (data) => Promise.resolve({ data: [{ id: crypto.randomUUID(), ...data }], error: null }),
      update: (data) => ({ eq: () => Promise.resolve({ data: [data], error: null }) }),
      delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      eq: () => ({ select: () => Promise.resolve({ data: [], error: null }) })
    }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signIn: () => Promise.resolve({ data: null, error: null }),
      signOut: () => Promise.resolve({ error: null })
    },
    channel: () => ({
      on: () => ({ subscribe: () => {} }),
      subscribe: () => {},
      unsubscribe: () => {}
    })
  };
}

/**
 * Create query builder for a table
 */
function createQueryBuilder(table, url, anonKey) {
  let queryString = '';
  let method = 'GET';
  let body = null;
  let filters = [];

  const headers = {
    'Content-Type': 'application/json',
    'apikey': anonKey,
    'Authorization': `Bearer ${anonKey}`
  };

  const execute = async () => {
    try {
      let endpoint = `${url}/rest/v1/${table}`;

      if (filters.length > 0) {
        endpoint += '?' + filters.join('&');
      }

      if (queryString) {
        endpoint += (endpoint.includes('?') ? '&' : '?') + queryString;
      }

      const response = await fetch(endpoint, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });

      if (!response.ok) {
        const error = await response.json();
        return { data: null, error };
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      return { data: null, error: { message: error.message } };
    }
  };

  return {
    select(columns = '*') {
      queryString = `select=${columns}`;
      return this;
    },
    insert(data) {
      method = 'POST';
      body = Array.isArray(data) ? data : [data];
      headers['Prefer'] = 'return=representation';
      return this;
    },
    update(data) {
      method = 'PATCH';
      body = data;
      headers['Prefer'] = 'return=representation';
      return this;
    },
    upsert(data) {
      method = 'POST';
      body = Array.isArray(data) ? data : [data];
      headers['Prefer'] = 'return=representation,resolution=merge-duplicates';
      return this;
    },
    delete() {
      method = 'DELETE';
      return this;
    },
    eq(column, value) {
      filters.push(`${column}=eq.${encodeURIComponent(value)}`);
      return this;
    },
    neq(column, value) {
      filters.push(`${column}=neq.${encodeURIComponent(value)}`);
      return this;
    },
    gt(column, value) {
      filters.push(`${column}=gt.${encodeURIComponent(value)}`);
      return this;
    },
    gte(column, value) {
      filters.push(`${column}=gte.${encodeURIComponent(value)}`);
      return this;
    },
    lt(column, value) {
      filters.push(`${column}=lt.${encodeURIComponent(value)}`);
      return this;
    },
    lte(column, value) {
      filters.push(`${column}=lte.${encodeURIComponent(value)}`);
      return this;
    },
    like(column, pattern) {
      filters.push(`${column}=like.${encodeURIComponent(pattern)}`);
      return this;
    },
    ilike(column, pattern) {
      filters.push(`${column}=ilike.${encodeURIComponent(pattern)}`);
      return this;
    },
    is(column, value) {
      filters.push(`${column}=is.${value}`);
      return this;
    },
    in(column, values) {
      filters.push(`${column}=in.(${values.map(v => encodeURIComponent(v)).join(',')})`);
      return this;
    },
    contains(column, value) {
      filters.push(`${column}=cs.${encodeURIComponent(JSON.stringify(value))}`);
      return this;
    },
    containedBy(column, value) {
      filters.push(`${column}=cd.${encodeURIComponent(JSON.stringify(value))}`);
      return this;
    },
    order(column, { ascending = true } = {}) {
      const direction = ascending ? 'asc' : 'desc';
      queryString += (queryString ? '&' : '') + `order=${column}.${direction}`;
      return this;
    },
    limit(count) {
      queryString += (queryString ? '&' : '') + `limit=${count}`;
      return this;
    },
    range(from, to) {
      headers['Range'] = `${from}-${to}`;
      headers['Range-Unit'] = 'items';
      return this;
    },
    single() {
      headers['Accept'] = 'application/vnd.pgrst.object+json';
      return this;
    },
    maybeSingle() {
      this.limit(1);
      return {
        then: async (resolve) => {
          const result = await execute();
          if (result.error) {
            resolve({ data: null, error: result.error });
          } else {
            resolve({ data: result.data?.[0] || null, error: null });
          }
        }
      };
    },
    then: (resolve) => execute().then(resolve),
    catch: (reject) => execute().catch(reject)
  };
}

/**
 * Create auth client
 */
function createAuthClient(url, anonKey) {
  const headers = {
    'Content-Type': 'application/json',
    'apikey': anonKey
  };

  return {
    async getUser() {
      const token = typeof localStorage !== 'undefined'
        ? localStorage.getItem('supabase.auth.token')
        : null;

      if (!token) {
        return { data: { user: null }, error: null };
      }

      try {
        const response = await fetch(`${url}/auth/v1/user`, {
          headers: { ...headers, 'Authorization': `Bearer ${token}` }
        });
        const user = await response.json();
        return { data: { user }, error: null };
      } catch (error) {
        return { data: { user: null }, error: { message: error.message } };
      }
    },

    async signInWithPassword({ email, password }) {
      try {
        const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ email, password })
        });
        const data = await response.json();

        if (data.access_token && typeof localStorage !== 'undefined') {
          localStorage.setItem('supabase.auth.token', data.access_token);
        }

        return { data, error: null };
      } catch (error) {
        return { data: null, error: { message: error.message } };
      }
    },

    async signOut() {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('supabase.auth.token');
      }
      return { error: null };
    },

    onAuthStateChange(callback) {
      // Simplified auth state listener
      return {
        data: { subscription: { unsubscribe: () => {} } }
      };
    }
  };
}

/**
 * Create realtime channel
 */
function createRealtimeChannel(name) {
  const listeners = [];

  return {
    on(event, config, callback) {
      listeners.push({ event, config, callback });
      return this;
    },
    subscribe(callback) {
      // In production, this would connect to Supabase Realtime
      if (callback) callback('SUBSCRIBED');
      return this;
    },
    unsubscribe() {
      listeners.length = 0;
    }
  };
}

/**
 * Call RPC function
 */
async function callRpc(fn, params, url, anonKey) {
  try {
    const response = await fetch(`${url}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      },
      body: JSON.stringify(params)
    });

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    return { data: null, error: { message: error.message } };
  }
}

// =============================================================================
// HIGH-LEVEL DATA ACCESS FUNCTIONS
// =============================================================================

/**
 * Get all companies
 */
export async function getCompanies() {
  const client = createClient();
  return client.from('companies').select('*').order('name');
}

/**
 * Get contacts for a company
 * @param {string} companyId - Company UUID
 * @param {Object} options - Query options
 */
export async function getContacts(companyId, options = {}) {
  const client = createClient();
  let query = client.from('contacts').select('*');

  if (companyId && companyId !== 'all') {
    query = query.eq('company_id', companyId);
  }

  if (options.status) {
    query = query.eq('status', options.status);
  }

  if (options.search) {
    query = query.or(`first_name.ilike.%${options.search}%,last_name.ilike.%${options.search}%,email.ilike.%${options.search}%,organization.ilike.%${options.search}%`);
  }

  query = query.order(options.orderBy || 'created_at', { ascending: options.ascending ?? false });

  if (options.limit) {
    query = query.limit(options.limit);
  }

  return query;
}

/**
 * Get deals for a company
 * @param {string} companyId - Company UUID
 * @param {Object} options - Query options
 */
export async function getDeals(companyId, options = {}) {
  const client = createClient();
  let query = client.from('deals').select(`
    *,
    contact:contacts(id, first_name, last_name, email, organization)
  `);

  if (companyId && companyId !== 'all') {
    query = query.eq('company_id', companyId);
  }

  if (options.stage) {
    query = query.eq('stage', options.stage);
  }

  if (options.assignedTo) {
    query = query.eq('assigned_to', options.assignedTo);
  }

  if (options.excludeClosed) {
    query = query.not('stage', 'in', '(closed_won,closed_lost)');
  }

  query = query.order(options.orderBy || 'created_at', { ascending: options.ascending ?? false });

  if (options.limit) {
    query = query.limit(options.limit);
  }

  return query;
}

/**
 * Get tasks for a company
 * @param {string} companyId - Company UUID
 * @param {Object} options - Query options
 */
export async function getTasks(companyId, options = {}) {
  const client = createClient();
  let query = client.from('tasks').select(`
    *,
    deal:deals(id, title),
    contact:contacts(id, first_name, last_name)
  `);

  if (companyId && companyId !== 'all') {
    query = query.eq('company_id', companyId);
  }

  if (options.status) {
    query = query.eq('status', options.status);
  }

  if (options.priority) {
    query = query.eq('priority', options.priority);
  }

  if (options.assignedTo) {
    query = query.eq('assigned_to', options.assignedTo);
  }

  if (options.dueToday) {
    const today = new Date().toISOString().split('T')[0];
    query = query.gte('due_date', today).lt('due_date', today + 'T23:59:59');
  }

  if (options.overdue) {
    query = query.lt('due_date', new Date().toISOString()).neq('status', 'completed');
  }

  query = query.order(options.orderBy || 'due_date', { ascending: options.ascending ?? true });

  if (options.limit) {
    query = query.limit(options.limit);
  }

  return query;
}

/**
 * Get emails for a company
 * @param {string} companyId - Company UUID
 * @param {Object} options - Query options
 */
export async function getEmails(companyId, options = {}) {
  const client = createClient();
  let query = client.from('emails').select(`
    *,
    contact:contacts(id, first_name, last_name, email, organization)
  `);

  if (companyId && companyId !== 'all') {
    query = query.eq('company_id', companyId);
  }

  if (options.direction) {
    query = query.eq('direction', options.direction);
  }

  if (options.unreadOnly) {
    query = query.eq('is_read', false);
  }

  if (options.category) {
    query = query.eq('category', options.category);
  }

  query = query.order(options.orderBy || 'sent_at', { ascending: options.ascending ?? false });

  if (options.limit) {
    query = query.limit(options.limit);
  }

  return query;
}

/**
 * Get campaigns for a company
 * @param {string} companyId - Company UUID
 * @param {Object} options - Query options
 */
export async function getCampaigns(companyId, options = {}) {
  const client = createClient();
  let query = client.from('campaigns').select('*');

  if (companyId && companyId !== 'all') {
    query = query.eq('company_id', companyId);
  }

  if (options.status) {
    query = query.eq('status', options.status);
  }

  if (options.type) {
    query = query.eq('type', options.type);
  }

  query = query.order(options.orderBy || 'start_date', { ascending: options.ascending ?? false });

  if (options.limit) {
    query = query.limit(options.limit);
  }

  return query;
}

/**
 * Get activities for timeline
 * @param {Object} options - Query options
 */
export async function getActivities(options = {}) {
  const client = createClient();
  let query = client.from('activities').select(`
    *,
    contact:contacts(id, first_name, last_name),
    deal:deals(id, title)
  `);

  if (options.companyId && options.companyId !== 'all') {
    query = query.eq('company_id', options.companyId);
  }

  if (options.contactId) {
    query = query.eq('contact_id', options.contactId);
  }

  if (options.dealId) {
    query = query.eq('deal_id', options.dealId);
  }

  if (options.types) {
    query = query.in('type', options.types);
  }

  query = query.order('created_at', { ascending: false });

  if (options.limit) {
    query = query.limit(options.limit);
  }

  return query;
}

/**
 * Get dashboard metrics
 * @param {string} companyId - Company UUID or 'all'
 */
export async function getDashboardMetrics(companyId) {
  const client = createClient();

  // Get pipeline summary
  const pipelineQuery = companyId && companyId !== 'all'
    ? client.from('pipeline_summary').select('*').eq('company_id', companyId)
    : client.from('pipeline_summary').select('*');

  // Get task summary
  const taskQuery = companyId && companyId !== 'all'
    ? client.from('task_summary').select('*').eq('company_id', companyId)
    : client.from('task_summary').select('*');

  const [pipelineResult, taskResult] = await Promise.all([
    pipelineQuery,
    taskQuery
  ]);

  return {
    pipeline: pipelineResult.data || [],
    tasks: taskResult.data || [],
    error: pipelineResult.error || taskResult.error
  };
}

/**
 * Subscribe to real-time changes
 * @param {string} table - Table name
 * @param {Function} callback - Callback for changes
 * @param {Object} filter - Optional filter
 */
export function subscribeToChanges(table, callback, filter = {}) {
  const client = createClient();
  const channel = client.channel(`${table}-changes`);

  let subscription = channel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: table,
      ...filter
    },
    (payload) => {
      callback(payload);
    }
  );

  subscription.subscribe();

  return () => {
    channel.unsubscribe();
  };
}

export default {
  createClient,
  getCompanies,
  getContacts,
  getDeals,
  getTasks,
  getEmails,
  getCampaigns,
  getActivities,
  getDashboardMetrics,
  subscribeToChanges
};
