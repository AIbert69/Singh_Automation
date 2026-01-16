-- Sam Agent 2.0 Database Schema
-- PostgreSQL (Supabase compatible)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Opportunities table - stores all scraped procurement opportunities
CREATE TABLE IF NOT EXISTS opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source TEXT NOT NULL,                    -- sam.gov, dibbs, usaspending, michigan, california
    source_id TEXT,                          -- Original ID from source system
    title TEXT NOT NULL,
    description TEXT,
    naics_codes TEXT[],
    due_date TIMESTAMP WITH TIME ZONE,
    posted_date TIMESTAMP WITH TIME ZONE,
    agency TEXT,
    office TEXT,
    location TEXT,
    place_of_performance TEXT,
    state TEXT,
    estimated_value DECIMAL(15, 2),
    contract_type TEXT,                      -- fixed-price, cost-plus, t&m, etc.
    set_aside TEXT,                          -- small business, 8(a), HUBZone, etc.
    url TEXT,
    solicitation_number TEXT,
    point_of_contact JSONB,                  -- {name, email, phone}
    raw_data JSONB,                          -- Full original response
    fit_score INTEGER DEFAULT 0,             -- 0-100 calculated score
    fit_analysis TEXT,                       -- Claude's analysis
    strategic_recommendation TEXT,           -- pursue, pass, watch
    status TEXT DEFAULT 'new',               -- new, reviewed, pursuing, passed, won, lost
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_source_id UNIQUE (source, source_id),
    CONSTRAINT valid_fit_score CHECK (fit_score >= 0 AND fit_score <= 100),
    CONSTRAINT valid_status CHECK (status IN ('new', 'reviewed', 'pursuing', 'passed', 'won', 'lost'))
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_opportunities_source ON opportunities(source);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_fit_score ON opportunities(fit_score DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_due_date ON opportunities(due_date);
CREATE INDEX IF NOT EXISTS idx_opportunities_posted_date ON opportunities(posted_date DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_naics ON opportunities USING GIN(naics_codes);

-- Daily briefings table - AI-generated daily summaries
CREATE TABLE IF NOT EXISTS briefings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE,
    summary TEXT NOT NULL,
    opportunities_found INTEGER DEFAULT 0,
    top_opportunities JSONB,                 -- Array of top opportunity summaries
    strategic_advice TEXT,
    action_items TEXT[],
    insight TEXT,                            -- "Hidden gem" insight
    market_trends TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_briefings_date ON briefings(date DESC);

-- Memory table - persistent context for the AI advisor
CREATE TABLE IF NOT EXISTS memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    category TEXT,                           -- priorities, contacts, preferences, etc.
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memory_key ON memory(key);
CREATE INDEX IF NOT EXISTS idx_memory_category ON memory(category);

-- Actions table - tracks user interactions for learning
CREATE TABLE IF NOT EXISTS actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL,               -- viewed, pursued, bid_submitted, won, lost, passed
    notes TEXT,
    outcome TEXT,                            -- success, failure, pending
    metadata JSONB,                          -- Additional action context
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_action_type CHECK (
        action_type IN ('viewed', 'pursued', 'bid_submitted', 'won', 'lost', 'passed', 'bookmarked', 'dismissed')
    )
);

CREATE INDEX IF NOT EXISTS idx_actions_opportunity ON actions(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_actions_type ON actions(action_type);
CREATE INDEX IF NOT EXISTS idx_actions_created ON actions(created_at DESC);

-- Contacts table - procurement contacts and relationships
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    title TEXT,
    agency TEXT,
    email TEXT,
    phone TEXT,
    linkedin_url TEXT,
    notes TEXT,
    relationship_score INTEGER DEFAULT 0,    -- 0-100, how strong the relationship is
    last_contact_date DATE,
    opportunities_associated UUID[],         -- Opportunity IDs associated with this contact
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contacts_agency ON contacts(agency);
CREATE INDEX IF NOT EXISTS idx_contacts_relationship ON contacts(relationship_score DESC);

-- Events table - networking events, industry days, etc.
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT,                         -- industry_day, conference, webinar, ptac, sba
    date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    location TEXT,
    virtual_link TEXT,
    agency TEXT,
    url TEXT,
    relevance_score INTEGER DEFAULT 50,
    status TEXT DEFAULT 'upcoming',          -- upcoming, attended, missed
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);

-- Competitors table - track competitor wins and patterns
CREATE TABLE IF NOT EXISTS competitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    cage_code TEXT,
    uei TEXT,
    naics_codes TEXT[],
    capabilities TEXT,
    total_awards INTEGER DEFAULT 0,
    total_value DECIMAL(15, 2) DEFAULT 0,
    avg_contract_size DECIMAL(15, 2),
    primary_agencies TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_competitors_name ON competitors(name);

-- Scrape logs table - track scraper runs
CREATE TABLE IF NOT EXISTS scrape_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source TEXT NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'running',           -- running, completed, failed
    opportunities_found INTEGER DEFAULT 0,
    opportunities_new INTEGER DEFAULT 0,
    error_message TEXT,
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_scrape_logs_source ON scrape_logs(source);
CREATE INDEX IF NOT EXISTS idx_scrape_logs_started ON scrape_logs(started_at DESC);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_opportunities_updated_at
    BEFORE UPDATE ON opportunities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memory_updated_at
    BEFORE UPDATE ON memory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competitors_updated_at
    BEFORE UPDATE ON competitors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (Supabase)
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_logs ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated access (adjust based on your auth setup)
CREATE POLICY "Enable all access for authenticated users" ON opportunities
    FOR ALL USING (true);

CREATE POLICY "Enable all access for authenticated users" ON briefings
    FOR ALL USING (true);

CREATE POLICY "Enable all access for authenticated users" ON memory
    FOR ALL USING (true);

CREATE POLICY "Enable all access for authenticated users" ON actions
    FOR ALL USING (true);

CREATE POLICY "Enable all access for authenticated users" ON contacts
    FOR ALL USING (true);

CREATE POLICY "Enable all access for authenticated users" ON events
    FOR ALL USING (true);

CREATE POLICY "Enable all access for authenticated users" ON competitors
    FOR ALL USING (true);

CREATE POLICY "Enable all access for authenticated users" ON scrape_logs
    FOR ALL USING (true);
