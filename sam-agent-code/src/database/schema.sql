-- Sam Agent 2.0 Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- OPPORTUNITIES TABLE
-- Core table for storing procurement opportunities
-- ============================================
CREATE TABLE opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source TEXT NOT NULL,                    -- sam.gov, dibbs, state, local
    source_id TEXT,                          -- Original ID from source
    title TEXT NOT NULL,
    description TEXT,
    naics_codes TEXT[] DEFAULT '{}',
    psc_codes TEXT[] DEFAULT '{}',
    due_date TIMESTAMP WITH TIME ZONE,
    posted_date TIMESTAMP WITH TIME ZONE,
    archive_date TIMESTAMP WITH TIME ZONE,
    agency TEXT,
    sub_agency TEXT,
    office TEXT,
    location TEXT,
    place_of_performance TEXT,
    state TEXT,
    estimated_value DECIMAL(15, 2),
    contract_type TEXT,                      -- FFP, T&M, CPFF, etc.
    set_aside TEXT,
    url TEXT,
    solicitation_number TEXT,
    raw_data JSONB DEFAULT '{}',

    -- Scoring and analysis
    fit_score INTEGER DEFAULT 0,             -- 0-100
    fit_analysis TEXT,
    recommendation TEXT,                     -- pursue, review, watch, pass
    ai_analysis JSONB DEFAULT '{}',

    -- Status tracking
    status TEXT DEFAULT 'new',               -- new, reviewed, pursuing, bid, won, lost, passed
    user_notes TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    UNIQUE(source, source_id)
);

-- Index for common queries
CREATE INDEX idx_opportunities_status ON opportunities(status);
CREATE INDEX idx_opportunities_fit_score ON opportunities(fit_score DESC);
CREATE INDEX idx_opportunities_due_date ON opportunities(due_date);
CREATE INDEX idx_opportunities_source ON opportunities(source);
CREATE INDEX idx_opportunities_naics ON opportunities USING GIN(naics_codes);

-- ============================================
-- BRIEFINGS TABLE
-- Daily AI-generated briefings
-- ============================================
CREATE TABLE briefings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE UNIQUE NOT NULL,
    summary TEXT NOT NULL,
    opportunities_found INTEGER DEFAULT 0,
    opportunities_scored INTEGER DEFAULT 0,
    top_opportunities JSONB DEFAULT '[]',    -- Array of top opportunity summaries
    strategic_advice TEXT,
    action_items TEXT[] DEFAULT '{}',
    market_insights TEXT,
    hidden_gem TEXT,                         -- One insight others would miss

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_briefings_date ON briefings(date DESC);

-- ============================================
-- MEMORY TABLE
-- Persistent context and learning
-- ============================================
CREATE TABLE memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    category TEXT,                           -- priorities, pursuits, learning, etc.
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_memory_key ON memory(key);
CREATE INDEX idx_memory_category ON memory(category);

-- ============================================
-- ACTIONS TABLE
-- Track user actions for learning
-- ============================================
CREATE TABLE actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL,               -- viewed, pursued, bid, won, lost, passed
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_actions_opportunity ON actions(opportunity_id);
CREATE INDEX idx_actions_type ON actions(action_type);
CREATE INDEX idx_actions_created ON actions(created_at DESC);

-- ============================================
-- CONTACTS TABLE
-- Government contacts and relationships
-- ============================================
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    title TEXT,
    agency TEXT,
    email TEXT,
    phone TEXT,
    notes TEXT,
    last_contact TIMESTAMP WITH TIME ZONE,
    relationship_score INTEGER DEFAULT 0,    -- 0-10
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_contacts_agency ON contacts(agency);

-- ============================================
-- SCRAPE_LOGS TABLE
-- Track scraping history
-- ============================================
CREATE TABLE scrape_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source TEXT NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'running',           -- running, completed, failed
    opportunities_found INTEGER DEFAULT 0,
    opportunities_new INTEGER DEFAULT 0,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_scrape_logs_source ON scrape_logs(source);
CREATE INDEX idx_scrape_logs_started ON scrape_logs(started_at DESC);

-- ============================================
-- CHAT_HISTORY TABLE
-- Store chat conversations with Sam
-- ============================================
CREATE TABLE chat_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL,
    role TEXT NOT NULL,                      -- user, assistant
    content TEXT NOT NULL,
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chat_session ON chat_history(session_id);
CREATE INDEX idx_chat_created ON chat_history(created_at DESC);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER update_opportunities_timestamp
    BEFORE UPDATE ON opportunities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_memory_timestamp
    BEFORE UPDATE ON memory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_contacts_timestamp
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (Optional)
-- Enable if using Supabase Auth
-- ============================================

-- ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE briefings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE memory ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- INITIAL DATA
-- ============================================

-- Insert default memory values
INSERT INTO memory (key, value, category) VALUES
    ('priorities', '["Win first federal contract", "Build past performance", "Expand NAICS coverage"]', 'priorities'),
    ('preferences', '{"min_contract_value": 50000, "max_contract_value": 5000000, "notification_time": "07:00", "notification_enabled": true}', 'preferences'),
    ('active_pursuits', '[]', 'active_pursuits'),
    ('wins', '[]', 'wins'),
    ('losses', '[]', 'losses')
ON CONFLICT (key) DO NOTHING;
