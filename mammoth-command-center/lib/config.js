/**
 * Mammoth Command Center - Configuration
 * Centralized configuration for the multi-company business automation platform
 */

// Company Definitions
export const COMPANIES = {
  MDX: {
    id: null, // Set from database
    code: 'MDX',
    name: 'MammothDX',
    industry: 'Diagnostics & Analytics',
    primaryColor: '#10B981',
    secondaryColor: '#059669',
    salesCycleDays: 90,
    icon: '🔬',
    description: 'Diagnostic testing, data analysis platforms, predictive analytics solutions'
  },
  SHD: {
    id: null,
    code: 'SHD',
    name: 'Shield',
    industry: 'Security Solutions',
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
    salesCycleDays: 60,
    icon: '🛡️',
    description: 'Physical security systems, cybersecurity consulting, monitoring services'
  },
  DBL: {
    id: null,
    code: 'DBL',
    name: 'Durablue',
    industry: 'Industrial Durability',
    primaryColor: '#8B5CF6',
    secondaryColor: '#6D28D9',
    salesCycleDays: 120,
    icon: '⚙️',
    description: 'Protective coatings, industrial materials, durability testing'
  }
};

// Deal Stages with metadata
export const DEAL_STAGES = {
  lead: {
    name: 'Lead',
    order: 1,
    probability: 10,
    color: '#6B7280',
    description: 'Initial contact or inquiry'
  },
  qualified: {
    name: 'Qualified',
    order: 2,
    probability: 25,
    color: '#3B82F6',
    description: 'Verified fit and budget'
  },
  proposal: {
    name: 'Proposal',
    order: 3,
    probability: 50,
    color: '#8B5CF6',
    description: 'Proposal submitted'
  },
  negotiation: {
    name: 'Negotiation',
    order: 4,
    probability: 75,
    color: '#F59E0B',
    description: 'Terms being negotiated'
  },
  closed_won: {
    name: 'Closed Won',
    order: 5,
    probability: 100,
    color: '#10B981',
    description: 'Deal successfully closed'
  },
  closed_lost: {
    name: 'Closed Lost',
    order: 6,
    probability: 0,
    color: '#EF4444',
    description: 'Deal lost'
  }
};

// Task Priority Configuration
export const TASK_PRIORITIES = {
  low: { name: 'Low', color: '#6B7280', icon: '○' },
  medium: { name: 'Medium', color: '#3B82F6', icon: '◐' },
  high: { name: 'High', color: '#F59E0B', icon: '●' },
  urgent: { name: 'Urgent', color: '#EF4444', icon: '◉' }
};

// Task Status Configuration
export const TASK_STATUSES = {
  pending: { name: 'Pending', color: '#6B7280', icon: '○' },
  in_progress: { name: 'In Progress', color: '#3B82F6', icon: '◐' },
  completed: { name: 'Completed', color: '#10B981', icon: '✓' },
  cancelled: { name: 'Cancelled', color: '#EF4444', icon: '✗' }
};

// Contact Status Configuration
export const CONTACT_STATUSES = {
  lead: { name: 'Lead', color: '#6B7280', description: 'New potential customer' },
  prospect: { name: 'Prospect', color: '#3B82F6', description: 'Qualified and engaged' },
  customer: { name: 'Customer', color: '#10B981', description: 'Active customer' },
  churned: { name: 'Churned', color: '#EF4444', description: 'Former customer' },
  inactive: { name: 'Inactive', color: '#9CA3AF', description: 'No recent activity' }
};

// Campaign Types
export const CAMPAIGN_TYPES = {
  email: { name: 'Email Campaign', icon: '📧', color: '#3B82F6' },
  social: { name: 'Social Media', icon: '📱', color: '#8B5CF6' },
  event: { name: 'Event', icon: '📅', color: '#10B981' },
  webinar: { name: 'Webinar', icon: '🎥', color: '#F59E0B' },
  trade_show: { name: 'Trade Show', icon: '🏢', color: '#6366F1' },
  content: { name: 'Content Marketing', icon: '📝', color: '#EC4899' },
  ads: { name: 'Paid Advertising', icon: '📢', color: '#14B8A6' },
  other: { name: 'Other', icon: '📋', color: '#6B7280' }
};

// Campaign Statuses
export const CAMPAIGN_STATUSES = {
  draft: { name: 'Draft', color: '#6B7280' },
  scheduled: { name: 'Scheduled', color: '#3B82F6' },
  active: { name: 'Active', color: '#10B981' },
  paused: { name: 'Paused', color: '#F59E0B' },
  completed: { name: 'Completed', color: '#8B5CF6' },
  cancelled: { name: 'Cancelled', color: '#EF4444' }
};

// Email Sentiments
export const EMAIL_SENTIMENTS = {
  positive: { name: 'Positive', color: '#10B981', icon: '😊' },
  neutral: { name: 'Neutral', color: '#6B7280', icon: '😐' },
  negative: { name: 'Negative', color: '#EF4444', icon: '😟' },
  urgent: { name: 'Urgent', color: '#F59E0B', icon: '⚡' }
};

// Email Categories (Smart Folders)
export const EMAIL_CATEGORIES = {
  needs_response: { name: 'Needs Response', color: '#EF4444', icon: '📨' },
  waiting: { name: 'Waiting', color: '#F59E0B', icon: '⏳' },
  fyi: { name: 'FYI', color: '#6B7280', icon: '📋' },
  scheduled: { name: 'Scheduled', color: '#3B82F6', icon: '🕐' },
  archived: { name: 'Archived', color: '#9CA3AF', icon: '📦' }
};

// User Roles
export const USER_ROLES = {
  admin: {
    name: 'Administrator',
    permissions: ['all'],
    description: 'Full access to all companies and settings'
  },
  manager: {
    name: 'Manager',
    permissions: ['read', 'write', 'delete', 'assign', 'reports'],
    description: 'Team oversight and reports'
  },
  sales_rep: {
    name: 'Sales Rep',
    permissions: ['read', 'write', 'own_records'],
    description: 'Manage own deals and contacts'
  },
  marketing: {
    name: 'Marketing',
    permissions: ['read', 'write', 'campaigns', 'email_templates'],
    description: 'Campaign and template management'
  },
  viewer: {
    name: 'Viewer',
    permissions: ['read'],
    description: 'Read-only access'
  }
};

// Activity Types
export const ACTIVITY_TYPES = {
  email_sent: { name: 'Email Sent', icon: '📤', color: '#3B82F6' },
  email_received: { name: 'Email Received', icon: '📥', color: '#10B981' },
  email_opened: { name: 'Email Opened', icon: '👁️', color: '#8B5CF6' },
  call_made: { name: 'Call Made', icon: '📞', color: '#F59E0B' },
  call_received: { name: 'Call Received', icon: '📲', color: '#10B981' },
  meeting_scheduled: { name: 'Meeting Scheduled', icon: '📅', color: '#6366F1' },
  meeting_completed: { name: 'Meeting Completed', icon: '✅', color: '#10B981' },
  note_added: { name: 'Note Added', icon: '📝', color: '#6B7280' },
  task_created: { name: 'Task Created', icon: '➕', color: '#3B82F6' },
  task_completed: { name: 'Task Completed', icon: '✓', color: '#10B981' },
  deal_created: { name: 'Deal Created', icon: '💼', color: '#8B5CF6' },
  deal_updated: { name: 'Deal Updated', icon: '📊', color: '#F59E0B' },
  deal_won: { name: 'Deal Won', icon: '🎉', color: '#10B981' },
  deal_lost: { name: 'Deal Lost', icon: '❌', color: '#EF4444' },
  contact_created: { name: 'Contact Created', icon: '👤', color: '#3B82F6' },
  contact_updated: { name: 'Contact Updated', icon: '✏️', color: '#6B7280' },
  campaign_launched: { name: 'Campaign Launched', icon: '🚀', color: '#8B5CF6' },
  campaign_completed: { name: 'Campaign Completed', icon: '🏁', color: '#10B981' },
  document_uploaded: { name: 'Document Uploaded', icon: '📄', color: '#6366F1' },
  document_viewed: { name: 'Document Viewed', icon: '📖', color: '#6B7280' }
};

// Workflow Triggers
export const WORKFLOW_TRIGGERS = {
  contact_created: { name: 'Contact Created', category: 'contacts' },
  contact_status_changed: { name: 'Contact Status Changed', category: 'contacts' },
  deal_created: { name: 'Deal Created', category: 'deals' },
  deal_stage_changed: { name: 'Deal Stage Changed', category: 'deals' },
  deal_won: { name: 'Deal Won', category: 'deals' },
  deal_lost: { name: 'Deal Lost', category: 'deals' },
  task_created: { name: 'Task Created', category: 'tasks' },
  task_completed: { name: 'Task Completed', category: 'tasks' },
  task_overdue: { name: 'Task Overdue', category: 'tasks' },
  email_received: { name: 'Email Received', category: 'emails' },
  email_opened: { name: 'Email Opened', category: 'emails' },
  email_not_replied: { name: 'Email Not Replied (24h)', category: 'emails' },
  campaign_started: { name: 'Campaign Started', category: 'campaigns' },
  campaign_ended: { name: 'Campaign Ended', category: 'campaigns' },
  schedule: { name: 'Scheduled Time', category: 'system' },
  manual: { name: 'Manual Trigger', category: 'system' }
};

// API Configuration
export const API_CONFIG = {
  baseUrl: process.env.MAMMOTH_API_URL || '/api/mammoth',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000
};

// Supabase Configuration
export const SUPABASE_CONFIG = {
  url: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
};

// Claude AI Configuration
export const AI_CONFIG = {
  model: 'claude-sonnet-4-20250514',
  maxTokens: 4096,
  temperature: 0.7,
  features: {
    emailSummary: true,
    emailDraft: true,
    sentimentAnalysis: true,
    dealInsights: true,
    taskParsing: true
  }
};

// Dashboard Refresh Intervals (in milliseconds)
export const REFRESH_INTERVALS = {
  realtime: 5000,      // Real-time updates
  dashboard: 30000,    // Dashboard KPIs
  pipeline: 60000,     // Pipeline data
  emails: 30000,       // Email sync
  tasks: 60000,        // Task list
  campaigns: 300000    // Campaign metrics (5 min)
};

// Pagination Defaults
export const PAGINATION = {
  defaultPageSize: 25,
  maxPageSize: 100,
  contactsPerPage: 50,
  dealsPerPage: 25,
  tasksPerPage: 50,
  emailsPerPage: 50,
  activitiesPerPage: 25
};

// Date Formats
export const DATE_FORMATS = {
  display: 'MMM d, yyyy',
  displayWithTime: 'MMM d, yyyy h:mm a',
  input: 'yyyy-MM-dd',
  api: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
};

// Currency Configuration
export const CURRENCY_CONFIG = {
  default: 'USD',
  supported: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
  locale: 'en-US'
};

// Format currency value
export function formatCurrency(value, currency = 'USD') {
  return new Intl.NumberFormat(CURRENCY_CONFIG.locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

// Format large numbers
export function formatNumber(value) {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

// Get company by code
export function getCompany(code) {
  return COMPANIES[code] || null;
}

// Get all active deal stages (excluding closed)
export function getActiveDealStages() {
  return Object.entries(DEAL_STAGES)
    .filter(([key]) => !key.startsWith('closed_'))
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => a.order - b.order);
}

// Calculate weighted pipeline value
export function calculateWeightedPipeline(deals) {
  return deals.reduce((total, deal) => {
    const stage = DEAL_STAGES[deal.stage];
    const probability = stage ? stage.probability : deal.probability || 0;
    return total + (deal.value * probability / 100);
  }, 0);
}

// Get relative time string
export function getRelativeTime(date) {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return then.toLocaleDateString();
}

// Check if task is overdue
export function isTaskOverdue(task) {
  if (!task.due_date || task.status === 'completed' || task.status === 'cancelled') {
    return false;
  }
  return new Date(task.due_date) < new Date();
}

// Get priority weight for sorting
export function getPriorityWeight(priority) {
  const weights = { urgent: 4, high: 3, medium: 2, low: 1 };
  return weights[priority] || 0;
}

export default {
  COMPANIES,
  DEAL_STAGES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  CONTACT_STATUSES,
  CAMPAIGN_TYPES,
  CAMPAIGN_STATUSES,
  EMAIL_SENTIMENTS,
  EMAIL_CATEGORIES,
  USER_ROLES,
  ACTIVITY_TYPES,
  WORKFLOW_TRIGGERS,
  API_CONFIG,
  SUPABASE_CONFIG,
  AI_CONFIG,
  REFRESH_INTERVALS,
  PAGINATION,
  DATE_FORMATS,
  CURRENCY_CONFIG,
  formatCurrency,
  formatNumber,
  getCompany,
  getActiveDealStages,
  calculateWeightedPipeline,
  getRelativeTime,
  isTaskOverdue,
  getPriorityWeight
};
