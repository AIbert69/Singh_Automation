-- ============================================================================
-- SINGH AUTOMATION PLATFORM - MASTER DATA
-- Purpose: Single source of truth for proposal generation
-- Integrates with: Proposal Generator, Gamma Export, Verification Workflow
-- ============================================================================
-- 
-- HOW TO USE:
-- 1. Import this SQL into your platform database (SQLite or PostgreSQL)
-- 2. Platform queries these tables when generating proposals
-- 3. Verification flags tell the system what data is safe to use
-- 4. Missing/unverified data triggers [ACTION REQUIRED] placeholders
--
-- ============================================================================


-- ============================================================================
-- TABLE 1: PAST PERFORMANCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS past_performance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- PROJECT IDENTIFICATION
    project_name TEXT NOT NULL,
    project_code TEXT,  -- Internal reference (e.g., "LIP-2024-001")
    
    -- CUSTOMER
    customer_name TEXT NOT NULL,
    customer_legal_name TEXT,  -- For contracts: exact legal entity
    customer_type TEXT CHECK(customer_type IN ('Commercial', 'Federal', 'State', 'DoD_Prime', 'Municipal')),
    customer_website TEXT,
    
    -- CONTRACT VALUE
    contract_value REAL,
    contract_value_verified INTEGER DEFAULT 0,  -- 0=No, 1=Yes
    contract_value_source TEXT,  -- "Invoice total", "PO", "Contract", "Estimate"
    
    -- PERIOD OF PERFORMANCE
    start_date TEXT,  -- ISO format: YYYY-MM-DD
    end_date TEXT,
    pop_verified INTEGER DEFAULT 0,
    
    -- LOCATION
    city TEXT,
    state TEXT,
    
    -- SCOPE & DELIVERABLES
    scope_summary TEXT,  -- 2-3 sentence summary for proposals
    deliverables TEXT,  -- Comma-separated list
    
    -- OUTCOMES (Must be specific and measurable)
    outcomes TEXT,
    outcomes_verified INTEGER DEFAULT 0,
    outcome_metrics TEXT,  -- JSON: {"cycle_time_reduction": "40%", "throughput": "2400/hr"}
    
    -- REFERENCE CONTACT
    ref_name TEXT,
    ref_title TEXT,
    ref_email TEXT,
    ref_phone TEXT,
    ref_approved INTEGER DEFAULT 0,  -- Has reference agreed to be contacted?
    ref_last_contacted TEXT,  -- Date last verified
    
    -- RELEVANCE MATCHING
    naics_codes TEXT,  -- Comma-separated: "333249,541330"
    keywords TEXT,  -- For search: "robotics,welding,vision,assembly"
    
    -- VERIFICATION STATUS
    -- VERIFIED = All fields confirmed, safe to use
    -- PARTIAL = Some fields unverified, will flag in proposal
    -- UNVERIFIED = Do not use in proposals
    -- FLAGGED = Known issues, requires review
    verification_status TEXT DEFAULT 'UNVERIFIED' 
        CHECK(verification_status IN ('VERIFIED', 'PARTIAL', 'UNVERIFIED', 'FLAGGED')),
    verification_notes TEXT,
    verified_by TEXT,
    verified_date TEXT,
    
    -- DOCUMENTS ON FILE
    has_contract_copy INTEGER DEFAULT 0,
    has_invoices INTEGER DEFAULT 0,
    has_reference_letter INTEGER DEFAULT 0,
    
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);


-- INSERT: LIPPERT WINDOW AUTOMATION (from Albert_Details_on_SA.docx)
INSERT INTO past_performance (
    project_name, project_code,
    customer_name, customer_type, customer_website,
    contract_value, contract_value_verified, contract_value_source,
    start_date, end_date, pop_verified,
    city, state,
    scope_summary, deliverables,
    outcomes, outcomes_verified, outcome_metrics,
    ref_name, ref_title, ref_email, ref_approved,
    naics_codes, keywords,
    verification_status, verification_notes
) VALUES (
    'Window Automation - 5-Robot Manufacturing Cell',
    'LIP-2024-001',
    'Lippert Components',
    'Commercial',
    'https://www.lippert.com/',
    1600000,
    0,  -- NOT VERIFIED - stated as "best estimate"
    'Estimate - needs invoice verification',
    '2024-01-01',
    '2024-09-30',
    1,  -- Dates confirmed in source doc
    'Bristol',
    'Indiana',
    'Turnkey 5-robot automated manufacturing cell for window production including precision assembly, automated quality inspection with vision systems, high-speed packaging, material handling, and custom product design capabilities.',
    'Precision Assembly Robot, Automated Quality Inspection Robot, High-Speed Packaging Robot, Material Handling Robot, Custom Product Design Robot, Vision Systems, PLC Controls, Safety Systems, FAT, SAT, Training',
    'Enhanced productivity through task-specific automation, improved quality via automated inspection, cost efficiency through reduced manual labor, scalable system design',
    0,  -- NOT VERIFIED - no specific metrics documented
    NULL,  -- NEEDS: {"cycle_time_reduction": "X%", "throughput": "X units/hr", "labor_savings": "$X"}
    'Tim Widner',
    'VP - Glass',
    'Twidner@lci1.com',
    0,  -- NOT VERIFIED - need to confirm he will accept reference calls
    '333249,541330,541512',
    'robotics,automation,assembly,vision,inspection,packaging,material handling,manufacturing,window',
    'PARTIAL',
    'Contract value needs invoice verification. Outcomes need specific metrics. Reference approval pending.'
);


-- ============================================================================
-- TABLE 2: KEY PERSONNEL
-- ============================================================================

CREATE TABLE IF NOT EXISTS key_personnel (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- IDENTITY
    full_name TEXT NOT NULL,
    title TEXT,
    email TEXT,
    phone TEXT,
    
    -- ROLE CLASSIFICATION
    role_category TEXT CHECK(role_category IN ('Executive', 'Engineering', 'Operations', 'Management', 'QA')),
    
    -- FOR PROPOSALS
    proposal_role TEXT,  -- "Program Manager", "Technical Lead", "Controls Engineer"
    proposal_responsibilities TEXT,  -- What they do on contracts
    
    -- QUALIFICATIONS
    skills TEXT,  -- Comma-separated
    platforms TEXT,  -- "Allen-Bradley, Siemens, FANUC, Cognex"
    certifications TEXT,  -- Individual certs held
    years_experience INTEGER,
    
    -- PRIOR EXPERIENCE (for proposal narrative)
    prior_employers TEXT,
    notable_projects TEXT,
    
    -- RESUME
    resume_on_file INTEGER DEFAULT 0,
    resume_path TEXT,
    resume_updated TEXT,  -- Date last updated
    
    -- STATUS
    employment_status TEXT DEFAULT 'ACTIVE' CHECK(employment_status IN ('ACTIVE', 'INACTIVE', 'CONTRACTOR')),
    availability_percent INTEGER DEFAULT 100,  -- For commitment letters
    
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);


-- INSERT: KEY PERSONNEL (from Albert_Details_on_SA.docx)
INSERT INTO key_personnel (full_name, title, role_category, proposal_role, proposal_responsibilities, skills, platforms, resume_on_file) VALUES

('Aditya Kurde', 
 'Electrical & Controls Engineer', 
 'Engineering',
 'Controls Engineer',
 'Electrical system design, controls programming (PLC/HMI), robotics integration, safety systems design and validation, commissioning, FAT/SAT support, technical documentation',
 'PLC programming, HMI development, motion control, safety logic (ISO 13849), vision system integration, industrial communications (Ethernet/IP, Profinet, TCP/IP, IO-Link)',
 'Allen-Bradley, Siemens, Omron, Beckhoff, FANUC, ABB, KUKA, Yaskawa, Universal Robots',
 0),

('Bhargav Nandan Gali',
 'Vision Systems Engineer',
 'Engineering', 
 'Vision Systems Engineer',
 'Machine vision system design, camera/lens/lighting selection, vision algorithm development, robot-guided vision applications, system commissioning, back-end and front-end software development, API integration',
 'Machine vision algorithms, inspection systems, image processing, data processing, dashboard development, MES/SCADA connectivity',
 'Cognex, Keyence, Omron, Banner',
 0),

('Mayur Joshi',
 'Machine Builder',
 'Operations',
 'Installation Technician',
 'Mechanical assembly, electrical wiring, robotic cell assembly, control panel wiring, sensor/motor installation, debugging, equipment preparation and shipping, FAT/SAT support',
 'Robotic cell assembly, control panel wiring, mechanical debugging, pneumatics, field installation',
 'FANUC, Universal Robots',
 0),

('Sonny Singh',
 'Machine Builder',
 'Operations',
 'Operations Lead',
 'Mechanical assembly, electrical wiring, system integration support, field installation coordination, equipment shipping and receiving',
 'Robotic cell assembly, mechanical systems, control panel wiring, field installation',
 'FANUC, Universal Robots',
 0),

('Mangay Peram',
 'Project Manager',
 'Management',
 'Project Manager',
 'Project planning and scheduling, team leadership, execution monitoring, risk management, stakeholder communication, budget management, resource allocation',
 'Project planning, timeline management, client communication, budget forecasting, risk mitigation',
 NULL,
 0);


-- ============================================================================
-- TABLE 3: CERTIFICATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS certifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    cert_name TEXT NOT NULL,
    cert_type TEXT CHECK(cert_type IN ('OEM', 'Business', 'Quality', 'Safety', 'Other')),
    issuing_org TEXT,
    
    -- STATUS
    status TEXT CHECK(status IN ('ACTIVE', 'EXPIRED', 'LAPSED', 'PENDING')),
    effective_date TEXT,
    expiration_date TEXT,
    
    -- VERIFICATION
    verified INTEGER DEFAULT 0,
    verification_source TEXT,  -- "Letter dated X", "Certificate #Y"
    cert_on_file INTEGER DEFAULT 0,
    cert_path TEXT,
    
    -- FOR PROPOSALS
    can_claim INTEGER DEFAULT 1,  -- 0 = DO NOT USE IN PROPOSALS
    claim_language TEXT,  -- Exact wording to use
    
    notes TEXT,
    
    created_at TEXT DEFAULT (datetime('now'))
);


-- INSERT: CERTIFICATIONS (from Albert_Details_on_SA.docx)
INSERT INTO certifications (cert_name, cert_type, issuing_org, status, effective_date, expiration_date, verified, verification_source, can_claim, claim_language, notes) VALUES

('FANUC Authorized System Integrator',
 'OEM',
 'FANUC America Corporation',
 'ACTIVE',
 '2025-04-01',
 '2026-03-31',
 1,
 'Renewal letter from Dick Motley, Director - ASI Network, dated 3/31/2025',
 1,
 'Singh Automation is a FANUC Authorized System Integrator with direct OEM support and access to genuine parts.',
 'Renewed annually. Letter on file.'),

('Universal Robots Certified Systems Partner',
 'OEM',
 'Universal Robots',
 'LAPSED',
 NULL,
 '2024-12-31',
 1,
 'Albert confirmation: stopped ASI December 2024',
 0,  -- DO NOT CLAIM
 NULL,
 '⚠️ DO NOT CLAIM IN PROPOSALS - Certification lapsed December 2024'),

('SAM.gov Registration',
 'Business',
 'SAM.gov',
 'ACTIVE',
 NULL,
 NULL,
 1,
 'SAM.gov profile - UEI: GJ1DPYQ3X8K5, CAGE: 86VF7',
 1,
 'Singh Automation is registered in SAM.gov (UEI: GJ1DPYQ3X8K5, CAGE: 86VF7)',
 'Check expiration annually'),

('Small Business',
 'Business',
 'SBA',
 'ACTIVE',
 NULL,
 NULL,
 1,
 'SAM.gov registration',
 1,
 'Singh Automation is a certified Small Business',
 NULL);


-- ============================================================================
-- TABLE 4: COMPANY PROFILE
-- ============================================================================

CREATE TABLE IF NOT EXISTS company_profile (
    id INTEGER PRIMARY KEY DEFAULT 1,
    
    company_name TEXT DEFAULT 'Singh Automation',
    legal_name TEXT DEFAULT 'Singh Automation LLC',
    
    -- IDENTIFIERS
    cage_code TEXT DEFAULT '86VF7',
    uei TEXT DEFAULT 'GJ1DPYQ3X8K5',
    duns TEXT DEFAULT '117959857',
    
    -- ADDRESSES
    hq_street TEXT DEFAULT '7804 S Sprinkle Road',
    hq_city TEXT DEFAULT 'Portage',
    hq_state TEXT DEFAULT 'MI',
    hq_zip TEXT DEFAULT '49002',
    
    ca_street TEXT DEFAULT '300 Spectrum Center Dr, Suite 400',
    ca_city TEXT DEFAULT 'Irvine',
    ca_state TEXT DEFAULT 'CA',
    ca_zip TEXT DEFAULT '92618',
    
    -- CONTACT
    primary_contact TEXT DEFAULT 'Albert Mizuno',
    primary_title TEXT DEFAULT 'Principal/CEO',
    primary_phone TEXT DEFAULT '786-344-8955',
    primary_email TEXT DEFAULT 'albert@singhautomation.com',
    website TEXT DEFAULT 'www.singhautomation.com',
    
    -- NAICS
    naics_primary TEXT DEFAULT '333249',
    naics_all TEXT DEFAULT '333249,541330,541512,541715,238210,333922',
    
    -- NARRATIVES
    elevator_pitch TEXT DEFAULT 'Singh Automation is the one-stop integrator for manufacturers who need robots that think. We combine FANUC robotics expertise with AI-powered vision to deliver turnkey automation cells that inspect, sort, and adapt in real-time.',
    
    company_overview TEXT DEFAULT 'Singh Automation delivers turnkey industrial automation and AI-powered systems for manufacturing, logistics, and mission-critical infrastructure. As a FANUC Authorized System Integrator, we engineer, integrate, and commission advanced robotic cells, intelligent material-handling systems, and high-performance computing environments.',
    
    founded_year INTEGER DEFAULT 2014
);

INSERT OR REPLACE INTO company_profile (id) VALUES (1);


-- ============================================================================
-- TABLE 5: OPPORTUNITY SUBMISSIONS
-- Track submission requirements for each opportunity
-- ============================================================================

CREATE TABLE IF NOT EXISTS opportunities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- IDENTIFICATION
    title TEXT NOT NULL,
    solicitation_number TEXT,
    
    -- SOURCE (Critical: must have working link)
    source_portal TEXT,  -- "SAM.gov", "Grants.gov", "DIBBS", etc.
    posting_url TEXT NOT NULL,
    posting_url_verified INTEGER DEFAULT 0,
    posting_url_last_checked TEXT,
    
    -- SUBMISSION METHOD
    submission_method TEXT CHECK(submission_method IN ('EMAIL', 'PORTAL', 'MAIL', 'FAX')),
    
    -- If EMAIL
    submission_email TEXT,
    email_subject_line TEXT,  -- Required format
    email_instructions TEXT,
    
    -- If PORTAL
    portal_url TEXT,
    portal_account_created INTEGER DEFAULT 0,
    
    -- CONTACTS
    co_name TEXT,  -- Contracting Officer
    co_email TEXT,
    co_phone TEXT,
    
    -- DEADLINES
    questions_due TEXT,
    proposal_due TEXT,
    timezone TEXT DEFAULT 'Eastern',
    
    -- REQUIREMENTS
    page_limit INTEGER,
    file_format TEXT,  -- "PDF", "Word", "Both"
    separate_volumes INTEGER DEFAULT 0,  -- Tech/Price separate?
    
    -- STATUS
    status TEXT DEFAULT 'IDENTIFIED' 
        CHECK(status IN ('IDENTIFIED', 'QUALIFIED', 'DRAFTING', 'REVIEW', 'SUBMITTED', 'WON', 'LOST', 'NO_BID')),
    
    -- VERIFICATION
    submission_verified INTEGER DEFAULT 0,
    verified_by TEXT,
    verified_date TEXT,
    
    notes TEXT,
    
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);


-- ============================================================================
-- VIEWS: FOR PLATFORM QUERIES
-- ============================================================================

-- View: Past performance ready for proposals (verified or partial)
CREATE VIEW IF NOT EXISTS v_usable_past_performance AS
SELECT 
    id,
    project_name,
    customer_name,
    contract_value,
    contract_value_verified,
    start_date,
    end_date,
    city || ', ' || state as location,
    scope_summary,
    outcomes,
    outcomes_verified,
    ref_name,
    ref_title,
    ref_email,
    ref_approved,
    keywords,
    verification_status,
    verification_notes
FROM past_performance
WHERE verification_status IN ('VERIFIED', 'PARTIAL')
ORDER BY contract_value DESC;


-- View: Active certifications only (safe to claim)
CREATE VIEW IF NOT EXISTS v_active_certifications AS
SELECT 
    cert_name,
    issuing_org,
    expiration_date,
    claim_language,
    notes
FROM certifications
WHERE status = 'ACTIVE' AND can_claim = 1;


-- View: Personnel available for proposals
CREATE VIEW IF NOT EXISTS v_available_personnel AS
SELECT 
    full_name,
    title,
    proposal_role,
    proposal_responsibilities,
    skills,
    platforms,
    resume_on_file,
    CASE WHEN resume_on_file = 0 THEN '⚠️ Resume needed' ELSE 'OK' END as resume_status
FROM key_personnel
WHERE employment_status = 'ACTIVE'
ORDER BY 
    CASE role_category 
        WHEN 'Management' THEN 1
        WHEN 'Engineering' THEN 2
        WHEN 'Operations' THEN 3
    END;


-- View: Data verification dashboard
CREATE VIEW IF NOT EXISTS v_verification_dashboard AS
SELECT 'Past Performance' as category, project_name as item, verification_status as status, verification_notes as issues
FROM past_performance
WHERE verification_status != 'VERIFIED'
UNION ALL
SELECT 'Certification', cert_name, status, notes
FROM certifications  
WHERE status != 'ACTIVE' OR can_claim = 0
UNION ALL
SELECT 'Personnel', full_name, 
    CASE WHEN resume_on_file = 0 THEN 'INCOMPLETE' ELSE 'OK' END,
    CASE WHEN resume_on_file = 0 THEN 'Resume not on file' ELSE NULL END
FROM key_personnel
WHERE resume_on_file = 0;


-- ============================================================================
-- PLATFORM INTEGRATION QUERIES
-- Copy these into your proposal generator
-- ============================================================================

/*
-- Get past performance for a proposal (matched by keywords):
SELECT * FROM v_usable_past_performance 
WHERE keywords LIKE '%robotics%' OR keywords LIKE '%welding%'
ORDER BY contract_value DESC
LIMIT 3;

-- Get personnel for specific role:
SELECT * FROM v_available_personnel
WHERE proposal_role = 'Controls Engineer';

-- Get certifications safe to claim:
SELECT cert_name, claim_language FROM v_active_certifications;

-- Check what needs verification before next proposal:
SELECT * FROM v_verification_dashboard;

-- Get company boilerplate:
SELECT * FROM company_profile WHERE id = 1;
*/


-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
