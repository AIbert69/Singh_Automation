-- Mammoth Command Center Database Schema
-- Multi-tenant architecture with Row-Level Security (RLS)
-- Designed for Supabase (PostgreSQL)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- Companies Table (Tenants)
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL UNIQUE,
    logo_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#3B82F6',
    secondary_color VARCHAR(7) DEFAULT '#1E40AF',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for company lookups
CREATE INDEX idx_companies_code ON companies(code);

-- Seed the three Mammoth companies
INSERT INTO companies (name, code, primary_color, secondary_color, settings) VALUES
    ('MammothDX', 'MDX', '#10B981', '#059669', '{"industry": "Diagnostics & Analytics", "sales_cycle_days": 90}'),
    ('Shield', 'SHD', '#3B82F6', '#1E40AF', '{"industry": "Security Solutions", "sales_cycle_days": 60}'),
    ('Durablue', 'DBL', '#8B5CF6', '#6D28D9', '{"industry": "Industrial Durability", "sales_cycle_days": 120}');

-- =============================================================================
-- USERS & AUTHENTICATION
-- =============================================================================

-- Users Table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    avatar_url TEXT,
    role VARCHAR(20) DEFAULT 'sales_rep' CHECK (role IN ('admin', 'manager', 'sales_rep', 'marketing', 'viewer')),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-Company Association (many-to-many)
CREATE TABLE user_companies (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'sales_rep' CHECK (role IN ('admin', 'manager', 'sales_rep', 'marketing', 'viewer')),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, company_id)
);

-- Index for fast user-company lookups
CREATE INDEX idx_user_companies_user ON user_companies(user_id);
CREATE INDEX idx_user_companies_company ON user_companies(company_id);

-- =============================================================================
-- CONTACTS / CRM
-- =============================================================================

-- Contact Status Enum
CREATE TYPE contact_status AS ENUM ('lead', 'prospect', 'customer', 'churned', 'inactive');

-- Contacts Table
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email VARCHAR(255),
    phone VARCHAR(20),
    organization VARCHAR(200),
    title VARCHAR(100),
    lead_source VARCHAR(50),
    status contact_status DEFAULT 'lead',
    tags TEXT[] DEFAULT '{}',
    address JSONB DEFAULT '{}',
    social_links JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    lead_score INTEGER DEFAULT 0,
    last_contacted_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for contacts
CREATE INDEX idx_contacts_company ON contacts(company_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_status ON contacts(company_id, status);
CREATE INDEX idx_contacts_organization ON contacts(organization);
CREATE INDEX idx_contacts_lead_score ON contacts(company_id, lead_score DESC);

-- =============================================================================
-- DEALS / SALES PIPELINE
-- =============================================================================

-- Deal Stage Enum
CREATE TYPE deal_stage AS ENUM ('lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost');

-- Deals Table
CREATE TABLE deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    value DECIMAL(12, 2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    stage deal_stage DEFAULT 'lead',
    probability INTEGER DEFAULT 10 CHECK (probability >= 0 AND probability <= 100),
    expected_close DATE,
    actual_close DATE,
    assigned_to UUID REFERENCES users(id),
    lost_reason VARCHAR(200),
    won_reason VARCHAR(200),
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    stage_changed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for deals
CREATE INDEX idx_deals_company ON deals(company_id);
CREATE INDEX idx_deals_stage ON deals(company_id, stage);
CREATE INDEX idx_deals_assigned ON deals(assigned_to);
CREATE INDEX idx_deals_contact ON deals(contact_id);
CREATE INDEX idx_deals_expected_close ON deals(company_id, expected_close);
CREATE INDEX idx_deals_value ON deals(company_id, value DESC);

-- Deal Stage History (for tracking progression)
CREATE TABLE deal_stage_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    from_stage deal_stage,
    to_stage deal_stage NOT NULL,
    changed_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deal_history_deal ON deal_stage_history(deal_id);

-- =============================================================================
-- TASKS
-- =============================================================================

-- Task Priority Enum
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Task Status Enum
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- Tasks Table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    priority task_priority DEFAULT 'medium',
    status task_status DEFAULT 'pending',
    due_date TIMESTAMPTZ,
    reminder_at TIMESTAMPTZ,
    assigned_to UUID REFERENCES users(id),
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES users(id),
    parent_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    recurrence JSONB,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for tasks
CREATE INDEX idx_tasks_company ON tasks(company_id);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(company_id, status);
CREATE INDEX idx_tasks_due_date ON tasks(company_id, due_date);
CREATE INDEX idx_tasks_deal ON tasks(deal_id);
CREATE INDEX idx_tasks_contact ON tasks(contact_id);
CREATE INDEX idx_tasks_priority ON tasks(company_id, priority);

-- Task Dependencies
CREATE TABLE task_dependencies (
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (task_id, depends_on_task_id)
);

-- =============================================================================
-- EMAILS
-- =============================================================================

-- Email Direction Enum
CREATE TYPE email_direction AS ENUM ('inbound', 'outbound');

-- Email Sentiment Enum
CREATE TYPE email_sentiment AS ENUM ('positive', 'neutral', 'negative', 'urgent');

-- Emails Table
CREATE TABLE emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
    gmail_id VARCHAR(100),
    thread_id VARCHAR(100),
    direction email_direction NOT NULL,
    from_address VARCHAR(255),
    to_addresses TEXT[],
    cc_addresses TEXT[],
    subject VARCHAR(500),
    body_text TEXT,
    body_html TEXT,
    body_preview VARCHAR(500),
    attachments JSONB DEFAULT '[]',
    sent_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    replied_at TIMESTAMPTZ,
    ai_summary TEXT,
    ai_action_items JSONB DEFAULT '[]',
    sentiment email_sentiment,
    category VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    is_starred BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for emails
CREATE INDEX idx_emails_company ON emails(company_id);
CREATE INDEX idx_emails_contact ON emails(contact_id);
CREATE INDEX idx_emails_deal ON emails(deal_id);
CREATE INDEX idx_emails_thread ON emails(thread_id);
CREATE INDEX idx_emails_gmail ON emails(gmail_id);
CREATE INDEX idx_emails_direction ON emails(company_id, direction);
CREATE INDEX idx_emails_sent_at ON emails(company_id, sent_at DESC);
CREATE INDEX idx_emails_category ON emails(company_id, category);
CREATE INDEX idx_emails_unread ON emails(company_id, is_read) WHERE is_read = FALSE;

-- Email Templates
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    subject VARCHAR(500),
    body_html TEXT,
    body_text TEXT,
    category VARCHAR(50),
    merge_fields JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_templates_company ON email_templates(company_id);
CREATE INDEX idx_email_templates_category ON email_templates(company_id, category);

-- =============================================================================
-- CAMPAIGNS
-- =============================================================================

-- Campaign Type Enum
CREATE TYPE campaign_type AS ENUM ('email', 'social', 'event', 'webinar', 'trade_show', 'content', 'ads', 'other');

-- Campaign Status Enum
CREATE TYPE campaign_status AS ENUM ('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled');

-- Campaigns Table
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    type campaign_type DEFAULT 'email',
    status campaign_status DEFAULT 'draft',
    start_date DATE,
    end_date DATE,
    budget DECIMAL(10, 2) DEFAULT 0,
    actual_spend DECIMAL(10, 2) DEFAULT 0,
    target_audience JSONB DEFAULT '{}',
    goals JSONB DEFAULT '{}',
    metrics JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    assets JSONB DEFAULT '[]',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for campaigns
CREATE INDEX idx_campaigns_company ON campaigns(company_id);
CREATE INDEX idx_campaigns_status ON campaigns(company_id, status);
CREATE INDEX idx_campaigns_type ON campaigns(company_id, type);
CREATE INDEX idx_campaigns_dates ON campaigns(company_id, start_date, end_date);

-- Campaign Contacts (many-to-many)
CREATE TABLE campaign_contacts (
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    converted_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (campaign_id, contact_id)
);

CREATE INDEX idx_campaign_contacts_campaign ON campaign_contacts(campaign_id);
CREATE INDEX idx_campaign_contacts_contact ON campaign_contacts(contact_id);

-- =============================================================================
-- ACTIVITIES & AUDIT LOG
-- =============================================================================

-- Activity Type Enum
CREATE TYPE activity_type AS ENUM (
    'email_sent', 'email_received', 'email_opened',
    'call_made', 'call_received', 'meeting_scheduled', 'meeting_completed',
    'note_added', 'task_created', 'task_completed',
    'deal_created', 'deal_updated', 'deal_won', 'deal_lost',
    'contact_created', 'contact_updated',
    'campaign_launched', 'campaign_completed',
    'document_uploaded', 'document_viewed',
    'other'
);

-- Activities Table (Timeline)
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    email_id UUID REFERENCES emails(id) ON DELETE SET NULL,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    type activity_type NOT NULL,
    title VARCHAR(200),
    description TEXT,
    metadata JSONB DEFAULT '{}',
    performed_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for activities
CREATE INDEX idx_activities_company ON activities(company_id);
CREATE INDEX idx_activities_contact ON activities(contact_id);
CREATE INDEX idx_activities_deal ON activities(deal_id);
CREATE INDEX idx_activities_type ON activities(company_id, type);
CREATE INDEX idx_activities_created ON activities(company_id, created_at DESC);

-- Audit Log (for compliance)
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_company ON audit_log(company_id);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_table ON audit_log(table_name);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);

-- =============================================================================
-- NOTES & COMMENTS
-- =============================================================================

CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notes_company ON notes(company_id);
CREATE INDEX idx_notes_contact ON notes(contact_id);
CREATE INDEX idx_notes_deal ON notes(deal_id);

-- =============================================================================
-- AUTOMATION WORKFLOWS
-- =============================================================================

-- Workflow Trigger Type
CREATE TYPE workflow_trigger AS ENUM (
    'contact_created', 'contact_status_changed',
    'deal_created', 'deal_stage_changed', 'deal_won', 'deal_lost',
    'task_created', 'task_completed', 'task_overdue',
    'email_received', 'email_opened', 'email_not_replied',
    'campaign_started', 'campaign_ended',
    'schedule', 'manual'
);

-- Workflows Table
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    trigger workflow_trigger NOT NULL,
    trigger_config JSONB DEFAULT '{}',
    actions JSONB NOT NULL DEFAULT '[]',
    conditions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    run_count INTEGER DEFAULT 0,
    last_run_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workflows_company ON workflows(company_id);
CREATE INDEX idx_workflows_trigger ON workflows(company_id, trigger);
CREATE INDEX idx_workflows_active ON workflows(company_id, is_active) WHERE is_active = TRUE;

-- Workflow Execution Log
CREATE TABLE workflow_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    trigger_data JSONB,
    status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    execution_log JSONB DEFAULT '[]'
);

CREATE INDEX idx_workflow_exec_workflow ON workflow_executions(workflow_id);
CREATE INDEX idx_workflow_exec_status ON workflow_executions(status);

-- =============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's company IDs
CREATE OR REPLACE FUNCTION get_user_company_ids()
RETURNS UUID[] AS $$
    SELECT ARRAY_AGG(company_id)
    FROM user_companies
    WHERE user_id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- RLS Policies for contacts
CREATE POLICY "Users can view contacts in their companies"
    ON contacts FOR SELECT
    USING (company_id = ANY(get_user_company_ids()));

CREATE POLICY "Users can insert contacts in their companies"
    ON contacts FOR INSERT
    WITH CHECK (company_id = ANY(get_user_company_ids()));

CREATE POLICY "Users can update contacts in their companies"
    ON contacts FOR UPDATE
    USING (company_id = ANY(get_user_company_ids()));

CREATE POLICY "Users can delete contacts in their companies"
    ON contacts FOR DELETE
    USING (company_id = ANY(get_user_company_ids()));

-- RLS Policies for deals
CREATE POLICY "Users can view deals in their companies"
    ON deals FOR SELECT
    USING (company_id = ANY(get_user_company_ids()));

CREATE POLICY "Users can insert deals in their companies"
    ON deals FOR INSERT
    WITH CHECK (company_id = ANY(get_user_company_ids()));

CREATE POLICY "Users can update deals in their companies"
    ON deals FOR UPDATE
    USING (company_id = ANY(get_user_company_ids()));

CREATE POLICY "Users can delete deals in their companies"
    ON deals FOR DELETE
    USING (company_id = ANY(get_user_company_ids()));

-- RLS Policies for tasks
CREATE POLICY "Users can view tasks in their companies"
    ON tasks FOR SELECT
    USING (company_id = ANY(get_user_company_ids()));

CREATE POLICY "Users can insert tasks in their companies"
    ON tasks FOR INSERT
    WITH CHECK (company_id = ANY(get_user_company_ids()));

CREATE POLICY "Users can update tasks in their companies"
    ON tasks FOR UPDATE
    USING (company_id = ANY(get_user_company_ids()));

CREATE POLICY "Users can delete tasks in their companies"
    ON tasks FOR DELETE
    USING (company_id = ANY(get_user_company_ids()));

-- RLS Policies for emails
CREATE POLICY "Users can view emails in their companies"
    ON emails FOR SELECT
    USING (company_id = ANY(get_user_company_ids()));

CREATE POLICY "Users can insert emails in their companies"
    ON emails FOR INSERT
    WITH CHECK (company_id = ANY(get_user_company_ids()));

CREATE POLICY "Users can update emails in their companies"
    ON emails FOR UPDATE
    USING (company_id = ANY(get_user_company_ids()));

-- RLS Policies for campaigns
CREATE POLICY "Users can view campaigns in their companies"
    ON campaigns FOR SELECT
    USING (company_id = ANY(get_user_company_ids()));

CREATE POLICY "Users can insert campaigns in their companies"
    ON campaigns FOR INSERT
    WITH CHECK (company_id = ANY(get_user_company_ids()));

CREATE POLICY "Users can update campaigns in their companies"
    ON campaigns FOR UPDATE
    USING (company_id = ANY(get_user_company_ids()));

CREATE POLICY "Users can delete campaigns in their companies"
    ON campaigns FOR DELETE
    USING (company_id = ANY(get_user_company_ids()));

-- RLS Policies for activities
CREATE POLICY "Users can view activities in their companies"
    ON activities FOR SELECT
    USING (company_id = ANY(get_user_company_ids()));

CREATE POLICY "Users can insert activities in their companies"
    ON activities FOR INSERT
    WITH CHECK (company_id = ANY(get_user_company_ids()));

-- RLS Policies for notes
CREATE POLICY "Users can view notes in their companies"
    ON notes FOR SELECT
    USING (company_id = ANY(get_user_company_ids()));

CREATE POLICY "Users can insert notes in their companies"
    ON notes FOR INSERT
    WITH CHECK (company_id = ANY(get_user_company_ids()));

CREATE POLICY "Users can update notes in their companies"
    ON notes FOR UPDATE
    USING (company_id = ANY(get_user_company_ids()));

CREATE POLICY "Users can delete notes in their companies"
    ON notes FOR DELETE
    USING (company_id = ANY(get_user_company_ids()));

-- RLS Policies for workflows
CREATE POLICY "Users can view workflows in their companies"
    ON workflows FOR SELECT
    USING (company_id = ANY(get_user_company_ids()));

CREATE POLICY "Users can manage workflows in their companies"
    ON workflows FOR ALL
    USING (company_id = ANY(get_user_company_ids()));

-- RLS Policies for email_templates
CREATE POLICY "Users can view templates in their companies"
    ON email_templates FOR SELECT
    USING (company_id = ANY(get_user_company_ids()));

CREATE POLICY "Users can manage templates in their companies"
    ON email_templates FOR ALL
    USING (company_id = ANY(get_user_company_ids()));

-- =============================================================================
-- TRIGGERS & FUNCTIONS
-- =============================================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update_updated_at trigger to all tables with updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_emails_updated_at BEFORE UPDATE ON emails
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Deal stage change trigger
CREATE OR REPLACE FUNCTION log_deal_stage_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.stage IS DISTINCT FROM NEW.stage THEN
        INSERT INTO deal_stage_history (deal_id, from_stage, to_stage, changed_by)
        VALUES (NEW.id, OLD.stage, NEW.stage, auth.uid());

        NEW.stage_changed_at = NOW();

        -- Update probability based on stage
        NEW.probability = CASE NEW.stage
            WHEN 'lead' THEN 10
            WHEN 'qualified' THEN 25
            WHEN 'proposal' THEN 50
            WHEN 'negotiation' THEN 75
            WHEN 'closed_won' THEN 100
            WHEN 'closed_lost' THEN 0
        END;

        -- Set actual_close date when deal closes
        IF NEW.stage IN ('closed_won', 'closed_lost') THEN
            NEW.actual_close = CURRENT_DATE;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deal_stage_change BEFORE UPDATE ON deals
    FOR EACH ROW EXECUTE FUNCTION log_deal_stage_change();

-- Task completion trigger
CREATE OR REPLACE FUNCTION handle_task_completion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = NOW();
        NEW.completed_by = auth.uid();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_completion BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION handle_task_completion();

-- Activity logging trigger for deals
CREATE OR REPLACE FUNCTION log_deal_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO activities (company_id, deal_id, contact_id, type, title, performed_by)
        VALUES (NEW.company_id, NEW.id, NEW.contact_id, 'deal_created', 'Deal created: ' || NEW.title, auth.uid());
    ELSIF TG_OP = 'UPDATE' AND OLD.stage IS DISTINCT FROM NEW.stage THEN
        INSERT INTO activities (company_id, deal_id, contact_id, type, title, metadata, performed_by)
        VALUES (
            NEW.company_id,
            NEW.id,
            NEW.contact_id,
            CASE NEW.stage
                WHEN 'closed_won' THEN 'deal_won'
                WHEN 'closed_lost' THEN 'deal_lost'
                ELSE 'deal_updated'
            END,
            'Deal stage changed to ' || NEW.stage,
            jsonb_build_object('from_stage', OLD.stage, 'to_stage', NEW.stage),
            auth.uid()
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deal_activity_log AFTER INSERT OR UPDATE ON deals
    FOR EACH ROW EXECUTE FUNCTION log_deal_activity();

-- =============================================================================
-- VIEWS FOR COMMON QUERIES
-- =============================================================================

-- Pipeline summary view
CREATE OR REPLACE VIEW pipeline_summary AS
SELECT
    d.company_id,
    c.name as company_name,
    c.code as company_code,
    d.stage,
    COUNT(*) as deal_count,
    SUM(d.value) as total_value,
    SUM(d.value * d.probability / 100) as weighted_value,
    AVG(d.probability) as avg_probability
FROM deals d
JOIN companies c ON d.company_id = c.id
WHERE d.stage NOT IN ('closed_won', 'closed_lost')
GROUP BY d.company_id, c.name, c.code, d.stage;

-- Task summary view
CREATE OR REPLACE VIEW task_summary AS
SELECT
    t.company_id,
    c.name as company_name,
    t.status,
    t.priority,
    COUNT(*) as task_count,
    COUNT(*) FILTER (WHERE t.due_date < NOW() AND t.status != 'completed') as overdue_count
FROM tasks t
JOIN companies c ON t.company_id = c.id
GROUP BY t.company_id, c.name, t.status, t.priority;

-- Email response time view
CREATE OR REPLACE VIEW email_response_metrics AS
SELECT
    e.company_id,
    c.name as company_name,
    DATE_TRUNC('day', e.received_at) as day,
    COUNT(*) as emails_received,
    COUNT(*) FILTER (WHERE e.replied_at IS NOT NULL) as emails_replied,
    AVG(EXTRACT(EPOCH FROM (e.replied_at - e.received_at)) / 3600) as avg_response_hours
FROM emails e
JOIN companies c ON e.company_id = c.id
WHERE e.direction = 'inbound'
GROUP BY e.company_id, c.name, DATE_TRUNC('day', e.received_at);

-- Contact engagement score view
CREATE OR REPLACE VIEW contact_engagement AS
SELECT
    co.id as contact_id,
    co.company_id,
    co.first_name,
    co.last_name,
    co.email,
    co.organization,
    co.status,
    COUNT(DISTINCT e.id) as email_count,
    COUNT(DISTINCT d.id) as deal_count,
    SUM(d.value) as total_deal_value,
    MAX(a.created_at) as last_activity,
    co.lead_score
FROM contacts co
LEFT JOIN emails e ON co.id = e.contact_id
LEFT JOIN deals d ON co.id = d.contact_id
LEFT JOIN activities a ON co.id = a.contact_id
GROUP BY co.id;

-- =============================================================================
-- SAMPLE DATA FOR DEVELOPMENT
-- =============================================================================

-- Note: Run this section only for development/testing

-- Get company IDs for sample data
DO $$
DECLARE
    mdx_id UUID;
    shd_id UUID;
    dbl_id UUID;
BEGIN
    SELECT id INTO mdx_id FROM companies WHERE code = 'MDX';
    SELECT id INTO shd_id FROM companies WHERE code = 'SHD';
    SELECT id INTO dbl_id FROM companies WHERE code = 'DBL';

    -- Sample contacts for MammothDX
    INSERT INTO contacts (company_id, first_name, last_name, email, organization, title, status, lead_source, tags)
    VALUES
        (mdx_id, 'Sarah', 'Chen', 'sarah.chen@biotech.com', 'BioTech Labs', 'Director of Operations', 'customer', 'referral', ARRAY['enterprise', 'diagnostics']),
        (mdx_id, 'Michael', 'Rodriguez', 'mrodriguez@healthsys.org', 'HealthSys Inc', 'CTO', 'prospect', 'website', ARRAY['healthcare', 'analytics']),
        (mdx_id, 'Jennifer', 'Thompson', 'jthompson@research.edu', 'State Research Institute', 'Lab Manager', 'lead', 'conference', ARRAY['research', 'government']);

    -- Sample contacts for Shield
    INSERT INTO contacts (company_id, first_name, last_name, email, organization, title, status, lead_source, tags)
    VALUES
        (shd_id, 'David', 'Martinez', 'dmartinez@securebank.com', 'SecureBank Financial', 'CISO', 'customer', 'referral', ARRAY['financial', 'enterprise']),
        (shd_id, 'Amanda', 'Williams', 'awilliams@citygovt.gov', 'City Government', 'Security Director', 'prospect', 'bid', ARRAY['government', 'physical-security']);

    -- Sample contacts for Durablue
    INSERT INTO contacts (company_id, first_name, last_name, email, organization, title, status, lead_source, tags)
    VALUES
        (dbl_id, 'Robert', 'Kim', 'rkim@aerotech.com', 'AeroTech Manufacturing', 'VP Engineering', 'customer', 'trade-show', ARRAY['aerospace', 'manufacturing']),
        (dbl_id, 'Lisa', 'Anderson', 'landerson@construct.com', 'BuildRight Construction', 'Procurement Manager', 'prospect', 'cold-outreach', ARRAY['construction', 'coatings']);

    -- Sample deals
    INSERT INTO deals (company_id, contact_id, title, value, stage, probability, expected_close)
    SELECT
        c.company_id,
        c.id,
        CASE
            WHEN c.organization = 'BioTech Labs' THEN 'DX Platform Enterprise License'
            WHEN c.organization = 'HealthSys Inc' THEN 'Analytics Suite Implementation'
            WHEN c.organization = 'SecureBank Financial' THEN 'Full Security Assessment'
            WHEN c.organization = 'City Government' THEN 'Physical Security System Upgrade'
            WHEN c.organization = 'AeroTech Manufacturing' THEN 'Protective Coating Contract'
            WHEN c.organization = 'BuildRight Construction' THEN 'Industrial Materials Supply'
            ELSE 'General Opportunity'
        END,
        CASE
            WHEN c.status = 'customer' THEN 150000
            WHEN c.status = 'prospect' THEN 75000
            ELSE 25000
        END,
        CASE
            WHEN c.status = 'customer' THEN 'negotiation'
            WHEN c.status = 'prospect' THEN 'proposal'
            ELSE 'qualified'
        END,
        CASE
            WHEN c.status = 'customer' THEN 75
            WHEN c.status = 'prospect' THEN 50
            ELSE 25
        END,
        CURRENT_DATE + INTERVAL '30 days' * RANDOM() * 3
    FROM contacts c
    WHERE c.organization IS NOT NULL;

    -- Sample tasks
    INSERT INTO tasks (company_id, title, description, priority, status, due_date)
    VALUES
        (mdx_id, 'Follow up with BioTech Labs', 'Discuss contract renewal terms', 'high', 'pending', NOW() + INTERVAL '2 days'),
        (mdx_id, 'Prepare analytics demo', 'Create demo for HealthSys presentation', 'medium', 'in_progress', NOW() + INTERVAL '5 days'),
        (shd_id, 'Security assessment report', 'Complete final report for SecureBank', 'urgent', 'pending', NOW() + INTERVAL '1 day'),
        (shd_id, 'City RFP response', 'Submit response to government RFP', 'high', 'pending', NOW() + INTERVAL '7 days'),
        (dbl_id, 'Coating samples delivery', 'Ship samples to AeroTech for testing', 'medium', 'completed', NOW() - INTERVAL '1 day'),
        (dbl_id, 'Quote for BuildRight', 'Prepare pricing quote for construction materials', 'medium', 'pending', NOW() + INTERVAL '3 days');

    -- Sample campaigns
    INSERT INTO campaigns (company_id, name, type, status, start_date, end_date, budget)
    VALUES
        (mdx_id, 'Q1 Healthcare Outreach', 'email', 'active', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 5000),
        (mdx_id, 'Lab Conference 2026', 'event', 'scheduled', CURRENT_DATE + INTERVAL '45 days', CURRENT_DATE + INTERVAL '47 days', 15000),
        (shd_id, 'Cybersecurity Awareness Month', 'content', 'draft', CURRENT_DATE + INTERVAL '60 days', CURRENT_DATE + INTERVAL '90 days', 8000),
        (dbl_id, 'Manufacturing Trade Show', 'trade_show', 'scheduled', CURRENT_DATE + INTERVAL '30 days', CURRENT_DATE + INTERVAL '33 days', 25000);

END $$;
