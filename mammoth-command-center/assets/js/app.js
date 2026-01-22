/**
 * Mammoth Command Center - Main Application
 * Multi-company business automation dashboard
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  companies: {
    MDX: { name: 'MammothDX', color: '#10B981', icon: '🔬' },
    SHD: { name: 'Shield', color: '#3B82F6', icon: '🛡️' },
    DBL: { name: 'Durablue', color: '#8B5CF6', icon: '⚙️' }
  },
  dealStages: ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'],
  dealStageLabels: {
    lead: 'Lead',
    qualified: 'Qualified',
    proposal: 'Proposal',
    negotiation: 'Negotiation',
    closed_won: 'Won',
    closed_lost: 'Lost'
  },
  dealStageProbabilities: {
    lead: 10,
    qualified: 25,
    proposal: 50,
    negotiation: 75,
    closed_won: 100,
    closed_lost: 0
  },
  dealStageColors: {
    lead: '#6B7280',
    qualified: '#3B82F6',
    proposal: '#8B5CF6',
    negotiation: '#F59E0B',
    closed_won: '#10B981',
    closed_lost: '#EF4444'
  },
  taskPriorities: ['low', 'medium', 'high', 'urgent'],
  campaignTypes: ['email', 'social', 'event', 'webinar', 'trade_show', 'content', 'ads']
};

// =============================================================================
// STATE MANAGEMENT
// =============================================================================

const state = {
  currentCompany: 'all',
  currentView: 'dashboard',
  data: {
    contacts: [],
    deals: [],
    tasks: [],
    emails: [],
    campaigns: [],
    activities: []
  },
  ui: {
    sidebarOpen: true,
    modalOpen: false
  }
};

// =============================================================================
// MOCK DATA (for demonstration)
// =============================================================================

function generateMockData() {
  // Generate sample contacts
  state.data.contacts = [
    { id: '1', company_id: 'MDX', first_name: 'Sarah', last_name: 'Chen', email: 'sarah.chen@biotech.com', organization: 'BioTech Labs', title: 'Director of Operations', status: 'customer', lead_score: 85, last_contacted_at: new Date(Date.now() - 86400000).toISOString() },
    { id: '2', company_id: 'MDX', first_name: 'Michael', last_name: 'Rodriguez', email: 'mrodriguez@healthsys.org', organization: 'HealthSys Inc', title: 'CTO', status: 'prospect', lead_score: 72, last_contacted_at: new Date(Date.now() - 172800000).toISOString() },
    { id: '3', company_id: 'SHD', first_name: 'David', last_name: 'Martinez', email: 'dmartinez@securebank.com', organization: 'SecureBank Financial', title: 'CISO', status: 'customer', lead_score: 90, last_contacted_at: new Date(Date.now() - 43200000).toISOString() },
    { id: '4', company_id: 'SHD', first_name: 'Amanda', last_name: 'Williams', email: 'awilliams@citygovt.gov', organization: 'City Government', title: 'Security Director', status: 'prospect', lead_score: 65, last_contacted_at: new Date(Date.now() - 259200000).toISOString() },
    { id: '5', company_id: 'DBL', first_name: 'Robert', last_name: 'Kim', email: 'rkim@aerotech.com', organization: 'AeroTech Manufacturing', title: 'VP Engineering', status: 'customer', lead_score: 88, last_contacted_at: new Date(Date.now() - 21600000).toISOString() },
    { id: '6', company_id: 'DBL', first_name: 'Lisa', last_name: 'Anderson', email: 'landerson@construct.com', organization: 'BuildRight Construction', title: 'Procurement Manager', status: 'lead', lead_score: 45, last_contacted_at: new Date(Date.now() - 432000000).toISOString() }
  ];

  // Generate sample deals
  state.data.deals = [
    { id: '1', company_id: 'MDX', contact_id: '1', title: 'DX Platform Enterprise License', value: 150000, stage: 'negotiation', probability: 75, expected_close: addDays(new Date(), 15).toISOString() },
    { id: '2', company_id: 'MDX', contact_id: '2', title: 'Analytics Suite Implementation', value: 75000, stage: 'proposal', probability: 50, expected_close: addDays(new Date(), 30).toISOString() },
    { id: '3', company_id: 'MDX', contact_id: null, title: 'Data Pipeline Integration', value: 45000, stage: 'qualified', probability: 25, expected_close: addDays(new Date(), 45).toISOString() },
    { id: '4', company_id: 'SHD', contact_id: '3', title: 'Full Security Assessment', value: 120000, stage: 'negotiation', probability: 80, expected_close: addDays(new Date(), 7).toISOString() },
    { id: '5', company_id: 'SHD', contact_id: '4', title: 'Physical Security System Upgrade', value: 250000, stage: 'proposal', probability: 45, expected_close: addDays(new Date(), 60).toISOString() },
    { id: '6', company_id: 'SHD', contact_id: null, title: 'Monitoring Services Contract', value: 36000, stage: 'lead', probability: 10, expected_close: addDays(new Date(), 90).toISOString() },
    { id: '7', company_id: 'DBL', contact_id: '5', title: 'Protective Coating Contract', value: 180000, stage: 'proposal', probability: 60, expected_close: addDays(new Date(), 20).toISOString() },
    { id: '8', company_id: 'DBL', contact_id: '6', title: 'Industrial Materials Supply', value: 95000, stage: 'qualified', probability: 30, expected_close: addDays(new Date(), 50).toISOString() },
    { id: '9', company_id: 'DBL', contact_id: null, title: 'Durability Testing Services', value: 55000, stage: 'lead', probability: 15, expected_close: addDays(new Date(), 75).toISOString() }
  ];

  // Generate sample tasks
  state.data.tasks = [
    { id: '1', company_id: 'MDX', title: 'Follow up with BioTech Labs', description: 'Discuss contract renewal terms', priority: 'high', status: 'pending', due_date: addDays(new Date(), 1).toISOString(), deal_id: '1' },
    { id: '2', company_id: 'MDX', title: 'Prepare analytics demo', description: 'Create demo for HealthSys presentation', priority: 'medium', status: 'in_progress', due_date: addDays(new Date(), 3).toISOString(), deal_id: '2' },
    { id: '3', company_id: 'SHD', title: 'Security assessment report', description: 'Complete final report for SecureBank', priority: 'urgent', status: 'pending', due_date: new Date().toISOString(), deal_id: '4' },
    { id: '4', company_id: 'SHD', title: 'City RFP response', description: 'Submit response to government RFP', priority: 'high', status: 'pending', due_date: addDays(new Date(), 5).toISOString(), deal_id: '5' },
    { id: '5', company_id: 'DBL', title: 'Coating samples delivery', description: 'Ship samples to AeroTech for testing', priority: 'medium', status: 'completed', due_date: addDays(new Date(), -1).toISOString(), deal_id: '7' },
    { id: '6', company_id: 'DBL', title: 'Quote for BuildRight', description: 'Prepare pricing quote for construction materials', priority: 'medium', status: 'pending', due_date: addDays(new Date(), 2).toISOString(), deal_id: '8' },
    { id: '7', company_id: 'MDX', title: 'Send proposal follow-up', description: 'Email reminder about pending proposal', priority: 'low', status: 'pending', due_date: addDays(new Date(), -2).toISOString(), deal_id: '3' }
  ];

  // Generate sample emails
  state.data.emails = [
    { id: '1', company_id: 'MDX', contact_id: '1', direction: 'inbound', subject: 'Re: Contract Renewal Discussion', body_preview: 'Thank you for the updated terms. We have reviewed them with our team and have a few questions...', sent_at: new Date(Date.now() - 3600000).toISOString(), is_read: false, sentiment: 'positive' },
    { id: '2', company_id: 'SHD', contact_id: '3', direction: 'inbound', subject: 'Urgent: Security Incident Report Needed', body_preview: 'We need the security assessment report by end of day today. The board meeting is tomorrow...', sent_at: new Date(Date.now() - 7200000).toISOString(), is_read: false, sentiment: 'urgent' },
    { id: '3', company_id: 'DBL', contact_id: '5', direction: 'outbound', subject: 'Coating Samples Shipped', body_preview: 'The protective coating samples have been shipped via FedEx. Tracking number: 1234567890...', sent_at: new Date(Date.now() - 86400000).toISOString(), is_read: true, sentiment: 'neutral' },
    { id: '4', company_id: 'MDX', contact_id: '2', direction: 'inbound', subject: 'Demo Request - Analytics Suite', body_preview: 'Our team would like to schedule a demo of your analytics platform. We are particularly interested in...', sent_at: new Date(Date.now() - 172800000).toISOString(), is_read: true, sentiment: 'positive' },
    { id: '5', company_id: 'SHD', contact_id: '4', direction: 'outbound', subject: 'RFP Response - Security System Upgrade', body_preview: 'Please find attached our comprehensive proposal for the city security system upgrade project...', sent_at: new Date(Date.now() - 259200000).toISOString(), is_read: true, sentiment: 'neutral' }
  ];

  // Generate sample campaigns
  state.data.campaigns = [
    { id: '1', company_id: 'MDX', name: 'Q1 Healthcare Outreach', type: 'email', status: 'active', start_date: new Date().toISOString(), end_date: addDays(new Date(), 30).toISOString(), budget: 5000, actual_spend: 2100, metrics: { sent: 1500, opened: 450, clicked: 120, converted: 15 } },
    { id: '2', company_id: 'MDX', name: 'Lab Conference 2026', type: 'event', status: 'scheduled', start_date: addDays(new Date(), 45).toISOString(), end_date: addDays(new Date(), 47).toISOString(), budget: 15000, actual_spend: 0, metrics: { sent: 0, opened: 0, clicked: 0, converted: 0 } },
    { id: '3', company_id: 'SHD', name: 'Cybersecurity Awareness Month', type: 'content', status: 'draft', start_date: addDays(new Date(), 60).toISOString(), end_date: addDays(new Date(), 90).toISOString(), budget: 8000, actual_spend: 0, metrics: { sent: 0, opened: 0, clicked: 0, converted: 0 } },
    { id: '4', company_id: 'DBL', name: 'Manufacturing Trade Show', type: 'trade_show', status: 'scheduled', start_date: addDays(new Date(), 30).toISOString(), end_date: addDays(new Date(), 33).toISOString(), budget: 25000, actual_spend: 5000, metrics: { sent: 0, opened: 0, clicked: 0, converted: 0 } },
    { id: '5', company_id: 'SHD', name: 'Enterprise Security Webinar', type: 'webinar', status: 'active', start_date: addDays(new Date(), -7).toISOString(), end_date: addDays(new Date(), 14).toISOString(), budget: 3000, actual_spend: 1500, metrics: { sent: 800, opened: 320, clicked: 95, converted: 8 } }
  ];

  // Generate sample activities
  state.data.activities = [
    { id: '1', company_id: 'MDX', type: 'email_received', title: 'Email from Sarah Chen', description: 'Re: Contract Renewal Discussion', created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: '2', company_id: 'SHD', type: 'deal_updated', title: 'Deal stage changed', description: 'Full Security Assessment moved to Negotiation', created_at: new Date(Date.now() - 7200000).toISOString() },
    { id: '3', company_id: 'DBL', type: 'task_completed', title: 'Task completed', description: 'Coating samples delivery', created_at: new Date(Date.now() - 14400000).toISOString() },
    { id: '4', company_id: 'MDX', type: 'contact_created', title: 'New contact added', description: 'Jennifer Thompson from State Research Institute', created_at: new Date(Date.now() - 28800000).toISOString() },
    { id: '5', company_id: 'SHD', type: 'campaign_launched', title: 'Campaign launched', description: 'Enterprise Security Webinar', created_at: new Date(Date.now() - 43200000).toISOString() },
    { id: '6', company_id: 'DBL', type: 'note_added', title: 'Note added', description: 'Added pricing discussion notes to BuildRight deal', created_at: new Date(Date.now() - 57600000).toISOString() }
  ];
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

function formatNumber(value) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
}

function filterByCompany(items) {
  if (state.currentCompany === 'all') return items;
  return items.filter(item => item.company_id === state.currentCompany);
}

function getCompanyBadge(companyCode) {
  const company = CONFIG.companies[companyCode];
  if (!company) return '';
  return `<span class="company-badge" data-company="${companyCode}">
    <span class="company-dot" data-company="${companyCode}"></span>
    ${company.name}
  </span>`;
}

function getStatusBadge(status) {
  return `<span class="status-badge ${status}">${status.replace('_', ' ')}</span>`;
}

function getPriorityBadge(priority) {
  return `<span class="priority-badge ${priority}">${priority}</span>`;
}

function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✗' : type === 'warning' ? '⚠' : 'ℹ'}</div>
    <div class="toast-content">
      <div class="toast-message">${message}</div>
    </div>
  `;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

// =============================================================================
// DASHBOARD RENDERING
// =============================================================================

function renderDashboard() {
  renderCompanyStats();
  renderPipelineOverview();
  renderActivityFeed();
  renderTasksDueToday();
  renderUpcomingDeals();
  renderAlerts();
  renderActiveCampaigns();
  updateNavBadges();
}

function renderCompanyStats() {
  const container = document.getElementById('companyStats');
  const deals = filterByCompany(state.data.deals);
  const tasks = filterByCompany(state.data.tasks);
  const emails = filterByCompany(state.data.emails);

  // Calculate metrics
  const totalPipeline = deals.filter(d => !d.stage.startsWith('closed_')).reduce((sum, d) => sum + d.value, 0);
  const activeDeals = deals.filter(d => !d.stage.startsWith('closed_')).length;
  const pendingTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length;
  const unreadEmails = emails.filter(e => !e.is_read && e.direction === 'inbound').length;

  container.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Total Pipeline</div>
      <div class="stat-value">${formatCurrency(totalPipeline)}</div>
      <div class="stat-change positive">+12% from last month</div>
      <div class="stat-icon">💰</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Active Deals</div>
      <div class="stat-value">${activeDeals}</div>
      <div class="stat-change positive">+3 this week</div>
      <div class="stat-icon">📊</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Pending Tasks</div>
      <div class="stat-value">${pendingTasks}</div>
      <div class="stat-change ${pendingTasks > 5 ? 'negative' : ''}">
        ${pendingTasks > 5 ? 'Needs attention' : 'On track'}
      </div>
      <div class="stat-icon">✓</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Unread Emails</div>
      <div class="stat-value">${unreadEmails}</div>
      <div class="stat-change ${unreadEmails > 0 ? 'negative' : 'positive'}">
        ${unreadEmails > 0 ? 'Requires response' : 'All caught up'}
      </div>
      <div class="stat-icon">📧</div>
    </div>
  `;
}

function renderPipelineOverview() {
  const deals = filterByCompany(state.data.deals).filter(d => !d.stage.startsWith('closed_'));
  const stages = ['lead', 'qualified', 'proposal', 'negotiation'];

  // Calculate stage totals
  const stageTotals = {};
  let maxValue = 0;
  stages.forEach(stage => {
    stageTotals[stage] = deals.filter(d => d.stage === stage).reduce((sum, d) => sum + d.value, 0);
    if (stageTotals[stage] > maxValue) maxValue = stageTotals[stage];
  });

  const container = document.getElementById('pipelineMini');
  container.innerHTML = stages.map(stage => {
    const height = maxValue > 0 ? Math.max((stageTotals[stage] / maxValue) * 100, 10) : 10;
    return `
      <div class="pipeline-bar" style="height: ${height}%; background: ${CONFIG.dealStageColors[stage]};">
        <div class="pipeline-bar-label">${CONFIG.dealStageLabels[stage]}</div>
      </div>
    `;
  }).join('');

  // Update totals
  const totalValue = deals.reduce((sum, d) => sum + d.value, 0);
  const weightedValue = deals.reduce((sum, d) => sum + (d.value * (CONFIG.dealStageProbabilities[d.stage] || d.probability) / 100), 0);

  document.getElementById('totalPipeline').textContent = formatCurrency(totalValue);
  document.getElementById('weightedPipeline').textContent = formatCurrency(weightedValue);
}

function renderActivityFeed() {
  const activities = filterByCompany(state.data.activities).slice(0, 6);
  const container = document.getElementById('activityFeed');

  if (activities.length === 0) {
    container.innerHTML = '<div class="empty-state"><p class="text-muted">No recent activity</p></div>';
    return;
  }

  const activityIcons = {
    email_received: '📥',
    email_sent: '📤',
    deal_updated: '📊',
    deal_created: '💼',
    deal_won: '🎉',
    task_completed: '✓',
    task_created: '➕',
    contact_created: '👤',
    campaign_launched: '🚀',
    note_added: '📝'
  };

  container.innerHTML = activities.map(activity => `
    <div class="activity-item">
      <div class="activity-icon">${activityIcons[activity.type] || '📋'}</div>
      <div class="activity-content">
        <div class="activity-text">
          ${getCompanyBadge(activity.company_id)}
          <strong>${activity.title}</strong>
        </div>
        <div class="activity-time">${formatRelativeTime(activity.created_at)}</div>
      </div>
    </div>
  `).join('');
}

function renderTasksDueToday() {
  const today = new Date().toDateString();
  const tasks = filterByCompany(state.data.tasks)
    .filter(t => new Date(t.due_date).toDateString() === today && t.status !== 'completed')
    .slice(0, 5);

  const container = document.getElementById('tasksDueToday');

  if (tasks.length === 0) {
    container.innerHTML = '<div class="empty-state"><p class="text-muted">No tasks due today</p></div>';
    return;
  }

  container.innerHTML = tasks.map(task => `
    <div class="list-item">
      <input type="checkbox" style="accent-color: var(--color-brand-primary);" onchange="completeTask('${task.id}')">
      <div style="flex: 1; min-width: 0;">
        <div class="text-truncate">${task.title}</div>
        <div class="text-muted" style="font-size: var(--font-size-xs);">
          ${getCompanyBadge(task.company_id)}
          ${getPriorityBadge(task.priority)}
        </div>
      </div>
    </div>
  `).join('');
}

function renderUpcomingDeals() {
  const deals = filterByCompany(state.data.deals)
    .filter(d => !d.stage.startsWith('closed_'))
    .sort((a, b) => new Date(a.expected_close) - new Date(b.expected_close))
    .slice(0, 5);

  const container = document.getElementById('upcomingDeals');

  if (deals.length === 0) {
    container.innerHTML = '<div class="empty-state"><p class="text-muted">No upcoming deals</p></div>';
    return;
  }

  container.innerHTML = deals.map(deal => `
    <div class="list-item" style="cursor: pointer;" onclick="viewDeal('${deal.id}')">
      <div style="flex: 1; min-width: 0;">
        <div class="text-truncate font-medium">${deal.title}</div>
        <div class="text-muted" style="font-size: var(--font-size-xs);">
          ${getCompanyBadge(deal.company_id)}
          ${getStatusBadge(deal.stage)}
        </div>
      </div>
      <div class="text-right">
        <div class="font-semibold">${formatCurrency(deal.value)}</div>
        <div class="text-muted" style="font-size: var(--font-size-xs);">${formatDate(deal.expected_close)}</div>
      </div>
    </div>
  `).join('');
}

function renderAlerts() {
  const alerts = [];

  // Check for overdue tasks
  const overdueTasks = filterByCompany(state.data.tasks)
    .filter(t => new Date(t.due_date) < new Date() && t.status !== 'completed' && t.status !== 'cancelled');
  if (overdueTasks.length > 0) {
    alerts.push({ type: 'error', title: `${overdueTasks.length} overdue task(s)`, description: 'Requires immediate attention' });
  }

  // Check for unanswered emails
  const unansweredEmails = filterByCompany(state.data.emails)
    .filter(e => !e.is_read && e.direction === 'inbound');
  if (unansweredEmails.length > 0) {
    alerts.push({ type: 'warning', title: `${unansweredEmails.length} unread email(s)`, description: 'Awaiting response' });
  }

  // Check for stale deals
  const staleDeals = filterByCompany(state.data.deals)
    .filter(d => !d.stage.startsWith('closed_'));
  if (staleDeals.length > 0) {
    alerts.push({ type: 'warning', title: 'Deal activity reminder', description: 'Some deals may need follow-up' });
  }

  const container = document.getElementById('alertsPanel');
  document.getElementById('alertCount').textContent = `${alerts.length} items`;

  if (alerts.length === 0) {
    container.innerHTML = '<div class="empty-state"><p class="text-success">All clear! No alerts.</p></div>';
    return;
  }

  container.innerHTML = alerts.map(alert => `
    <div class="alert-item">
      <div class="alert-icon ${alert.type}">${alert.type === 'error' ? '!' : '⚠'}</div>
      <div class="alert-content">
        <div class="alert-title">${alert.title}</div>
        <div class="alert-description">${alert.description}</div>
      </div>
    </div>
  `).join('');
}

function renderActiveCampaigns() {
  const campaigns = filterByCompany(state.data.campaigns)
    .filter(c => c.status === 'active' || c.status === 'scheduled')
    .slice(0, 5);

  const container = document.getElementById('campaignsTableBody');

  if (campaigns.length === 0) {
    container.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No active campaigns</td></tr>';
    return;
  }

  container.innerHTML = campaigns.map(campaign => {
    const progress = campaign.metrics.sent > 0
      ? Math.round((campaign.metrics.opened / campaign.metrics.sent) * 100)
      : 0;

    return `
      <tr>
        <td class="font-medium">${campaign.name}</td>
        <td>${getCompanyBadge(campaign.company_id)}</td>
        <td><span class="text-capitalize">${campaign.type.replace('_', ' ')}</span></td>
        <td>${getStatusBadge(campaign.status)}</td>
        <td>
          <div class="progress-bar" style="width: 100px;">
            <div class="progress-bar-fill" style="width: ${progress}%;"></div>
          </div>
          <span class="text-muted" style="font-size: var(--font-size-xs);">${progress}% open rate</span>
        </td>
        <td>${formatCurrency(campaign.budget)}</td>
      </tr>
    `;
  }).join('');
}

function updateNavBadges() {
  const deals = filterByCompany(state.data.deals).filter(d => !d.stage.startsWith('closed_'));
  const tasks = filterByCompany(state.data.tasks).filter(t => t.status !== 'completed' && t.status !== 'cancelled');
  const unread = filterByCompany(state.data.emails).filter(e => !e.is_read && e.direction === 'inbound');

  document.getElementById('pipelineCount').textContent = deals.length;
  document.getElementById('taskCount').textContent = tasks.length;
  document.getElementById('unreadCount').textContent = unread.length;
}

// =============================================================================
// PIPELINE VIEW
// =============================================================================

function renderPipelineView() {
  const stages = ['lead', 'qualified', 'proposal', 'negotiation'];
  const deals = filterByCompany(state.data.deals);
  const container = document.getElementById('kanbanBoard');

  container.innerHTML = stages.map(stage => {
    const stageDeals = deals.filter(d => d.stage === stage);
    const stageTotal = stageDeals.reduce((sum, d) => sum + d.value, 0);

    return `
      <div class="kanban-column" style="min-width: 300px; background: var(--color-bg-secondary); border-radius: var(--radius-lg); border: 1px solid var(--color-border);">
        <div style="padding: var(--space-4); border-bottom: 1px solid var(--color-border);">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-2">
              <div style="width: 8px; height: 8px; border-radius: 50%; background: ${CONFIG.dealStageColors[stage]};"></div>
              <span class="font-semibold">${CONFIG.dealStageLabels[stage]}</span>
              <span class="text-muted">(${stageDeals.length})</span>
            </div>
            <span class="text-muted" style="font-size: var(--font-size-sm);">${formatCurrency(stageTotal)}</span>
          </div>
        </div>
        <div style="padding: var(--space-3); max-height: 500px; overflow-y: auto;">
          ${stageDeals.map(deal => renderDealCard(deal)).join('')}
          ${stageDeals.length === 0 ? '<div class="text-center text-muted" style="padding: var(--space-8);">No deals</div>' : ''}
        </div>
      </div>
    `;
  }).join('');
}

function renderDealCard(deal) {
  const contact = state.data.contacts.find(c => c.id === deal.contact_id);
  const daysUntilClose = Math.ceil((new Date(deal.expected_close) - new Date()) / 86400000);

  return `
    <div class="card" style="margin-bottom: var(--space-3); cursor: pointer;" onclick="viewDeal('${deal.id}')">
      <div class="card-body" style="padding: var(--space-3);">
        <div class="font-medium text-truncate mb-2">${deal.title}</div>
        <div class="flex justify-between items-center mb-2">
          <span class="font-semibold">${formatCurrency(deal.value)}</span>
          <span class="text-muted" style="font-size: var(--font-size-xs);">${deal.probability}%</span>
        </div>
        ${contact ? `
          <div class="flex items-center gap-2 mb-2">
            <div class="avatar avatar-sm">${contact.first_name[0]}${contact.last_name[0]}</div>
            <span class="text-muted" style="font-size: var(--font-size-xs);">${contact.first_name} ${contact.last_name}</span>
          </div>
        ` : ''}
        <div class="flex justify-between items-center">
          ${getCompanyBadge(deal.company_id)}
          <span class="text-muted" style="font-size: var(--font-size-xs);">
            ${daysUntilClose > 0 ? `${daysUntilClose}d left` : daysUntilClose === 0 ? 'Today' : 'Overdue'}
          </span>
        </div>
      </div>
    </div>
  `;
}

// =============================================================================
// CONTACTS VIEW
// =============================================================================

function renderContactsView() {
  const contacts = filterByCompany(state.data.contacts);
  const container = document.getElementById('contactsTableBody');

  if (contacts.length === 0) {
    container.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No contacts found</td></tr>';
    return;
  }

  container.innerHTML = contacts.map(contact => `
    <tr onclick="viewContact('${contact.id}')" style="cursor: pointer;">
      <td>
        <div class="flex items-center gap-3">
          <div class="avatar">${contact.first_name[0]}${contact.last_name[0]}</div>
          <div>
            <div class="font-medium">${contact.first_name} ${contact.last_name}</div>
            <div class="text-muted" style="font-size: var(--font-size-xs);">${contact.email}</div>
          </div>
        </div>
      </td>
      <td>${contact.organization || '-'}</td>
      <td>${getCompanyBadge(contact.company_id)}</td>
      <td>${getStatusBadge(contact.status)}</td>
      <td>
        <div class="flex items-center gap-2">
          <div class="progress-bar" style="width: 60px; height: 6px;">
            <div class="progress-bar-fill" style="width: ${contact.lead_score}%; background: ${contact.lead_score > 70 ? 'var(--color-success)' : contact.lead_score > 40 ? 'var(--color-warning)' : 'var(--color-error)'}"></div>
          </div>
          <span style="font-size: var(--font-size-xs);">${contact.lead_score}</span>
        </div>
      </td>
      <td class="text-muted" style="font-size: var(--font-size-sm);">${formatRelativeTime(contact.last_contacted_at)}</td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation(); editContact('${contact.id}')">Edit</button>
      </td>
    </tr>
  `).join('');
}

// =============================================================================
// TASKS VIEW
// =============================================================================

function renderTasksView(filter = 'all') {
  let tasks = filterByCompany(state.data.tasks);

  switch (filter) {
    case 'today':
      const today = new Date().toDateString();
      tasks = tasks.filter(t => new Date(t.due_date).toDateString() === today);
      break;
    case 'overdue':
      tasks = tasks.filter(t => new Date(t.due_date) < new Date() && t.status !== 'completed');
      break;
    case 'completed':
      tasks = tasks.filter(t => t.status === 'completed');
      break;
    case 'my':
      // In real app, filter by current user
      break;
  }

  // Sort by due date and priority
  tasks.sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority] || new Date(a.due_date) - new Date(b.due_date);
  });

  const container = document.getElementById('tasksList');

  if (tasks.length === 0) {
    container.innerHTML = '<div class="empty-state"><p class="text-muted">No tasks found</p></div>';
    return;
  }

  container.innerHTML = tasks.map(task => {
    const isOverdue = new Date(task.due_date) < new Date() && task.status !== 'completed';
    const deal = state.data.deals.find(d => d.id === task.deal_id);

    return `
      <div class="list-item ${task.status === 'completed' ? 'text-muted' : ''}">
        <input type="checkbox" ${task.status === 'completed' ? 'checked' : ''}
               style="accent-color: var(--color-brand-primary);"
               onchange="toggleTask('${task.id}')">
        <div style="flex: 1; min-width: 0;">
          <div class="flex items-center gap-2">
            <span class="${task.status === 'completed' ? 'text-muted' : 'font-medium'}"
                  style="${task.status === 'completed' ? 'text-decoration: line-through;' : ''}">${task.title}</span>
            ${getPriorityBadge(task.priority)}
          </div>
          <div class="flex items-center gap-2 mt-1" style="font-size: var(--font-size-xs);">
            ${getCompanyBadge(task.company_id)}
            ${deal ? `<span class="text-muted">• ${deal.title}</span>` : ''}
          </div>
        </div>
        <div class="text-right">
          <div class="${isOverdue ? 'text-error' : 'text-muted'}" style="font-size: var(--font-size-sm);">
            ${formatDate(task.due_date)}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// =============================================================================
// EMAIL VIEW
// =============================================================================

function renderEmailView(folder = 'inbox') {
  let emails = filterByCompany(state.data.emails);

  switch (folder) {
    case 'inbox':
      emails = emails.filter(e => e.direction === 'inbound' && !e.is_archived);
      break;
    case 'needs_response':
      emails = emails.filter(e => e.direction === 'inbound' && !e.is_read);
      break;
    case 'sent':
      emails = emails.filter(e => e.direction === 'outbound');
      break;
    case 'starred':
      emails = emails.filter(e => e.is_starred);
      break;
    case 'archived':
      emails = emails.filter(e => e.is_archived);
      break;
  }

  const container = document.getElementById('emailList');
  document.getElementById('inboxCount').textContent = filterByCompany(state.data.emails).filter(e => e.direction === 'inbound' && !e.is_read).length;

  if (emails.length === 0) {
    container.innerHTML = '<div class="empty-state"><p class="text-muted">No emails</p></div>';
    return;
  }

  container.innerHTML = emails.map(email => {
    const contact = state.data.contacts.find(c => c.id === email.contact_id);
    const sentimentColors = { positive: 'var(--color-success)', negative: 'var(--color-error)', urgent: 'var(--color-warning)', neutral: 'var(--color-text-muted)' };

    return `
      <div class="list-item ${!email.is_read ? 'font-medium' : ''}" style="cursor: pointer; ${!email.is_read ? 'background: rgba(59, 130, 246, 0.05);' : ''}">
        <div class="flex items-center gap-3" style="flex: 1; min-width: 0;">
          ${contact ? `<div class="avatar">${contact.first_name[0]}${contact.last_name[0]}</div>` : '<div class="avatar">?</div>'}
          <div style="flex: 1; min-width: 0;">
            <div class="flex items-center gap-2">
              <span class="text-truncate">${contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown'}</span>
              ${getCompanyBadge(email.company_id)}
              ${email.sentiment ? `<span style="width: 8px; height: 8px; border-radius: 50%; background: ${sentimentColors[email.sentiment]};"></span>` : ''}
            </div>
            <div class="text-truncate ${!email.is_read ? '' : 'text-muted'}" style="font-size: var(--font-size-sm);">${email.subject}</div>
            <div class="text-truncate text-muted" style="font-size: var(--font-size-xs);">${email.body_preview}</div>
          </div>
        </div>
        <div class="text-muted" style="font-size: var(--font-size-xs); white-space: nowrap;">${formatRelativeTime(email.sent_at)}</div>
      </div>
    `;
  }).join('');
}

// =============================================================================
// CAMPAIGNS VIEW
// =============================================================================

function renderCampaignsView() {
  const campaigns = filterByCompany(state.data.campaigns);

  // Render stats
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0);
  const totalSpend = campaigns.reduce((sum, c) => sum + c.actual_spend, 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + (c.metrics?.converted || 0), 0);

  document.getElementById('campaignStats').innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Active Campaigns</div>
      <div class="stat-value">${activeCampaigns}</div>
      <div class="stat-icon">🚀</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Total Budget</div>
      <div class="stat-value">${formatCurrency(totalBudget)}</div>
      <div class="stat-icon">💰</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Total Spend</div>
      <div class="stat-value">${formatCurrency(totalSpend)}</div>
      <div class="stat-change">${Math.round((totalSpend / totalBudget) * 100)}% of budget</div>
      <div class="stat-icon">📊</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Conversions</div>
      <div class="stat-value">${totalConversions}</div>
      <div class="stat-icon">🎯</div>
    </div>
  `;

  // Render table
  const container = document.getElementById('allCampaignsTableBody');

  if (campaigns.length === 0) {
    container.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No campaigns</td></tr>';
    return;
  }

  container.innerHTML = campaigns.map(campaign => {
    const openRate = campaign.metrics.sent > 0 ? Math.round((campaign.metrics.opened / campaign.metrics.sent) * 100) : 0;
    const clickRate = campaign.metrics.opened > 0 ? Math.round((campaign.metrics.clicked / campaign.metrics.opened) * 100) : 0;

    return `
      <tr>
        <td class="font-medium">${campaign.name}</td>
        <td>${getCompanyBadge(campaign.company_id)}</td>
        <td><span class="text-capitalize">${campaign.type.replace('_', ' ')}</span></td>
        <td>${getStatusBadge(campaign.status)}</td>
        <td>
          <div style="font-size: var(--font-size-xs);">
            ${formatDate(campaign.start_date)} - ${formatDate(campaign.end_date)}
          </div>
        </td>
        <td>
          <div>${formatCurrency(campaign.actual_spend)} / ${formatCurrency(campaign.budget)}</div>
          <div class="progress-bar" style="width: 80px; height: 4px; margin-top: 4px;">
            <div class="progress-bar-fill" style="width: ${(campaign.actual_spend / campaign.budget) * 100}%;"></div>
          </div>
        </td>
        <td>
          <div style="font-size: var(--font-size-xs);">
            <span class="text-success">${openRate}% open</span> •
            <span class="text-info">${clickRate}% click</span>
          </div>
        </td>
        <td>
          <button class="btn btn-ghost btn-sm">View</button>
        </td>
      </tr>
    `;
  }).join('');
}

// =============================================================================
// WORKFLOWS VIEW
// =============================================================================

function renderWorkflowsView() {
  const container = document.getElementById('workflowsList');

  const workflows = [
    { id: '1', name: 'New Lead Welcome', trigger: 'contact_created', status: 'active', runs: 156, description: 'Send welcome email to new leads' },
    { id: '2', name: 'Stale Deal Alert', trigger: 'schedule', status: 'active', runs: 42, description: 'Alert when deals inactive for 7 days' },
    { id: '3', name: 'Deal Won Celebration', trigger: 'deal_won', status: 'active', runs: 23, description: 'Send thank you and start onboarding' },
    { id: '4', name: 'Email Response Reminder', trigger: 'email_not_replied', status: 'active', runs: 89, description: 'Remind about unanswered emails after 24h' },
    { id: '5', name: 'Proposal Follow-up', trigger: 'deal_stage_changed', status: 'paused', runs: 15, description: 'Follow up on proposals after 5 days' }
  ];

  container.innerHTML = workflows.map(workflow => `
    <div class="card">
      <div class="card-body">
        <div class="flex justify-between items-start mb-4">
          <div>
            <h4 class="font-semibold">${workflow.name}</h4>
            <p class="text-muted" style="font-size: var(--font-size-sm);">${workflow.description}</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="status-badge ${workflow.status === 'active' ? 'closed_won' : 'lead'}">${workflow.status}</span>
          </div>
        </div>
        <div class="flex justify-between items-center">
          <div class="text-muted" style="font-size: var(--font-size-sm);">
            Trigger: <span class="text-primary">${workflow.trigger.replace('_', ' ')}</span>
          </div>
          <div class="text-muted" style="font-size: var(--font-size-sm);">
            ${workflow.runs} runs
          </div>
        </div>
      </div>
      <div class="card-footer">
        <div class="flex justify-between">
          <button class="btn btn-ghost btn-sm">Edit</button>
          <button class="btn btn-ghost btn-sm">${workflow.status === 'active' ? 'Pause' : 'Activate'}</button>
        </div>
      </div>
    </div>
  `).join('');
}

// =============================================================================
// NAVIGATION & VIEW MANAGEMENT
// =============================================================================

function switchView(viewName) {
  state.currentView = viewName;

  // Update nav items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.view === viewName);
  });

  // Hide all views
  document.querySelectorAll('.view').forEach(view => {
    view.classList.add('hidden');
    view.classList.remove('active');
  });

  // Show selected view
  const viewElement = document.getElementById(`${viewName}View`);
  if (viewElement) {
    viewElement.classList.remove('hidden');
    viewElement.classList.add('active');
  }

  // Update header title
  const titles = {
    dashboard: 'Dashboard',
    pipeline: 'Sales Pipeline',
    contacts: 'Contacts',
    emails: 'Email Command Center',
    tasks: 'Tasks',
    campaigns: 'Campaigns',
    workflows: 'Automation Workflows'
  };
  document.getElementById('pageTitle').textContent = titles[viewName] || 'Dashboard';

  // Render view content
  switch (viewName) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'pipeline':
      renderPipelineView();
      break;
    case 'contacts':
      renderContactsView();
      break;
    case 'emails':
      renderEmailView();
      break;
    case 'tasks':
      renderTasksView();
      break;
    case 'campaigns':
      renderCampaignsView();
      break;
    case 'workflows':
      renderWorkflowsView();
      break;
  }
}

function switchCompany(companyCode) {
  state.currentCompany = companyCode;
  switchView(state.currentView);
}

// =============================================================================
// MODAL MANAGEMENT
// =============================================================================

function openModal(title, content, onConfirm) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = content;
  document.getElementById('modalBackdrop').classList.add('open');
  state.ui.modalOpen = true;

  if (onConfirm) {
    document.getElementById('modalConfirm').onclick = () => {
      onConfirm();
      closeModal();
    };
  }
}

function closeModal() {
  document.getElementById('modalBackdrop').classList.remove('open');
  state.ui.modalOpen = false;
}

// =============================================================================
// ACTION HANDLERS
// =============================================================================

function viewDeal(dealId) {
  const deal = state.data.deals.find(d => d.id === dealId);
  if (!deal) return;

  const contact = state.data.contacts.find(c => c.id === deal.contact_id);

  openModal(`Deal: ${deal.title}`, `
    <div class="mb-4">
      <div class="text-muted mb-1">Value</div>
      <div class="font-semibold" style="font-size: var(--font-size-2xl);">${formatCurrency(deal.value)}</div>
    </div>
    <div class="grid-2 mb-4">
      <div>
        <div class="text-muted mb-1">Stage</div>
        ${getStatusBadge(deal.stage)}
      </div>
      <div>
        <div class="text-muted mb-1">Probability</div>
        <div>${deal.probability}%</div>
      </div>
      <div>
        <div class="text-muted mb-1">Company</div>
        ${getCompanyBadge(deal.company_id)}
      </div>
      <div>
        <div class="text-muted mb-1">Expected Close</div>
        <div>${formatDate(deal.expected_close)}</div>
      </div>
    </div>
    ${contact ? `
      <div class="mb-4">
        <div class="text-muted mb-2">Primary Contact</div>
        <div class="flex items-center gap-3">
          <div class="avatar">${contact.first_name[0]}${contact.last_name[0]}</div>
          <div>
            <div class="font-medium">${contact.first_name} ${contact.last_name}</div>
            <div class="text-muted" style="font-size: var(--font-size-xs);">${contact.organization}</div>
          </div>
        </div>
      </div>
    ` : ''}
  `);
}

function viewContact(contactId) {
  const contact = state.data.contacts.find(c => c.id === contactId);
  if (!contact) return;

  const deals = state.data.deals.filter(d => d.contact_id === contactId);

  openModal(`${contact.first_name} ${contact.last_name}`, `
    <div class="flex items-center gap-4 mb-6">
      <div class="avatar avatar-xl">${contact.first_name[0]}${contact.last_name[0]}</div>
      <div>
        <div class="font-semibold" style="font-size: var(--font-size-xl);">${contact.first_name} ${contact.last_name}</div>
        <div class="text-muted">${contact.title || ''}</div>
        <div class="text-muted">${contact.organization || ''}</div>
      </div>
    </div>
    <div class="grid-2 mb-4">
      <div>
        <div class="text-muted mb-1">Email</div>
        <div>${contact.email}</div>
      </div>
      <div>
        <div class="text-muted mb-1">Status</div>
        ${getStatusBadge(contact.status)}
      </div>
      <div>
        <div class="text-muted mb-1">Company</div>
        ${getCompanyBadge(contact.company_id)}
      </div>
      <div>
        <div class="text-muted mb-1">Lead Score</div>
        <div class="flex items-center gap-2">
          <div class="progress-bar" style="width: 60px; height: 6px;">
            <div class="progress-bar-fill" style="width: ${contact.lead_score}%;"></div>
          </div>
          <span>${contact.lead_score}</span>
        </div>
      </div>
    </div>
    ${deals.length > 0 ? `
      <div class="mb-4">
        <div class="text-muted mb-2">Associated Deals</div>
        ${deals.map(d => `<div class="mb-1">${d.title} - ${formatCurrency(d.value)}</div>`).join('')}
      </div>
    ` : ''}
  `);
}

function editContact(contactId) {
  showToast('Contact editing coming soon', 'info');
}

function completeTask(taskId) {
  const task = state.data.tasks.find(t => t.id === taskId);
  if (task) {
    task.status = 'completed';
    renderDashboard();
    showToast('Task completed!', 'success');
  }
}

function toggleTask(taskId) {
  const task = state.data.tasks.find(t => t.id === taskId);
  if (task) {
    task.status = task.status === 'completed' ? 'pending' : 'completed';
    renderTasksView();
  }
}

// =============================================================================
// QUICK ADD FUNCTIONALITY
// =============================================================================

function showQuickAdd() {
  const btn = document.getElementById('quickAddBtn');
  const dropdown = document.getElementById('quickAddDropdown');
  const rect = btn.getBoundingClientRect();

  dropdown.style.display = 'block';
  dropdown.style.top = `${rect.bottom + 8}px`;
  dropdown.style.right = `${window.innerWidth - rect.right}px`;
}

function hideQuickAdd() {
  document.getElementById('quickAddDropdown').style.display = 'none';
}

function handleQuickAddAction(action) {
  hideQuickAdd();

  switch (action) {
    case 'add-contact':
      openModal('Add Contact', `
        <div class="form-group">
          <label class="form-label">Company</label>
          <select class="form-select" id="newContactCompany">
            <option value="MDX">MammothDX</option>
            <option value="SHD">Shield</option>
            <option value="DBL">Durablue</option>
          </select>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">First Name</label>
            <input type="text" class="form-input" id="newContactFirstName" placeholder="John">
          </div>
          <div class="form-group">
            <label class="form-label">Last Name</label>
            <input type="text" class="form-input" id="newContactLastName" placeholder="Doe">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" class="form-input" id="newContactEmail" placeholder="john@company.com">
        </div>
        <div class="form-group">
          <label class="form-label">Organization</label>
          <input type="text" class="form-input" id="newContactOrg" placeholder="Company Inc">
        </div>
      `, () => {
        showToast('Contact created successfully!', 'success');
      });
      break;

    case 'add-deal':
      openModal('Add Deal', `
        <div class="form-group">
          <label class="form-label">Company</label>
          <select class="form-select">
            <option value="MDX">MammothDX</option>
            <option value="SHD">Shield</option>
            <option value="DBL">Durablue</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Deal Title</label>
          <input type="text" class="form-input" placeholder="New opportunity...">
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Value</label>
            <input type="number" class="form-input" placeholder="50000">
          </div>
          <div class="form-group">
            <label class="form-label">Stage</label>
            <select class="form-select">
              <option value="lead">Lead</option>
              <option value="qualified">Qualified</option>
              <option value="proposal">Proposal</option>
              <option value="negotiation">Negotiation</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Expected Close Date</label>
          <input type="date" class="form-input">
        </div>
      `, () => {
        showToast('Deal created successfully!', 'success');
      });
      break;

    case 'add-task':
      openModal('Add Task', `
        <div class="form-group">
          <label class="form-label">Company</label>
          <select class="form-select">
            <option value="MDX">MammothDX</option>
            <option value="SHD">Shield</option>
            <option value="DBL">Durablue</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Task Title</label>
          <input type="text" class="form-input" placeholder="What needs to be done?">
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Due Date</label>
            <input type="date" class="form-input">
          </div>
          <div class="form-group">
            <label class="form-label">Priority</label>
            <select class="form-select">
              <option value="low">Low</option>
              <option value="medium" selected>Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="form-textarea" placeholder="Add details..."></textarea>
        </div>
      `, () => {
        showToast('Task created successfully!', 'success');
      });
      break;

    case 'compose-email':
      showToast('Email composer coming soon', 'info');
      break;

    case 'schedule-meeting':
      showToast('Meeting scheduler coming soon', 'info');
      break;
  }
}

// =============================================================================
// EVENT LISTENERS
// =============================================================================

function initEventListeners() {
  // Navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const view = item.dataset.view;
      if (view) switchView(view);
    });
  });

  // Company switcher
  document.getElementById('companySwitcher').addEventListener('change', (e) => {
    switchCompany(e.target.value);
  });

  // Quick add
  document.getElementById('quickAddBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    const dropdown = document.getElementById('quickAddDropdown');
    if (dropdown.style.display === 'block') {
      hideQuickAdd();
    } else {
      showQuickAdd();
    }
  });

  document.querySelectorAll('#quickAddDropdown .dropdown-item').forEach(item => {
    item.addEventListener('click', () => {
      handleQuickAddAction(item.dataset.action);
    });
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#quickAddDropdown') && !e.target.closest('#quickAddBtn')) {
      hideQuickAdd();
    }
  });

  // Modal
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalCancel').addEventListener('click', closeModal);
  document.getElementById('modalBackdrop').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modalBackdrop')) {
      closeModal();
    }
  });

  // Task tabs
  document.querySelectorAll('#taskTabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#taskTabs .tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderTasksView(tab.dataset.filter);
    });
  });

  // Email folders
  document.querySelectorAll('#emailFolders .list-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('#emailFolders .list-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      renderEmailView(item.dataset.folder);
    });
  });

  // Global search
  document.getElementById('globalSearch').addEventListener('input', (e) => {
    // Implement global search functionality
    console.log('Search:', e.target.value);
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Escape to close modal
    if (e.key === 'Escape' && state.ui.modalOpen) {
      closeModal();
    }

    // Ctrl/Cmd + K for search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('globalSearch').focus();
    }
  });

  // Hash navigation
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1);
    if (hash) switchView(hash);
  });
}

// =============================================================================
// INITIALIZATION
// =============================================================================

function init() {
  // Generate mock data
  generateMockData();

  // Initialize event listeners
  initEventListeners();

  // Check hash for initial view
  const hash = window.location.hash.slice(1);
  if (hash) {
    switchView(hash);
  } else {
    renderDashboard();
  }

  console.log('Mammoth Command Center initialized');
}

// Start the application
document.addEventListener('DOMContentLoaded', init);

// Export for global access
window.viewDeal = viewDeal;
window.viewContact = viewContact;
window.editContact = editContact;
window.completeTask = completeTask;
window.toggleTask = toggleTask;
