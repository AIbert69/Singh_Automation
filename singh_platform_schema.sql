-- ============================================================================
-- SINGH AUTOMATION PROPOSAL PLATFORM - DATABASE SCHEMA
-- Version: 1.0
-- Purpose: Power automated proposal generation with real company data
-- ============================================================================

-- ============================================================================
-- CORE COMPANY TABLES
-- ============================================================================

-- Company boilerplate - single row, core identity data
CREATE TABLE company_profile (
    id INTEGER PRIMARY KEY DEFAULT 1,
    company_name VARCHAR(100) NOT NULL,
    legal_name VARCHAR(150),
    dba_name VARCHAR(100),
    cage_code VARCHAR(5),
    uei VARCHAR(12),
    duns VARCHAR(9),
    sam_status VARCHAR(20) DEFAULT 'Active',
    sam_expiration DATE,
    business_size VARCHAR(50),
    
    -- Addresses
    hq_street VARCHAR(200),
    hq_city VARCHAR(100),
    hq_state VARCHAR(2),
    hq_zip VARCHAR(10),
    
    ca_street VARCHAR(200),
    ca_city VARCHAR(100),
    ca_state VARCHAR(2),
    ca_zip VARCHAR(10),
    
    -- Contact
    primary_contact_name VARCHAR(100),
    primary_contact_title VARCHAR(100),
    primary_contact_phone VARCHAR(20),
    primary_contact_email VARCHAR(100),
    website VARCHAR(100),
    
    -- Narrative content
    elevator_pitch TEXT,
    company_overview TEXT,
    mission_statement TEXT,
    
    -- Dates
    founded_year INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Singh Automation profile
INSERT INTO company_profile (
    company_name, legal_name, cage_code, uei, duns, sam_status, business_size,
    hq_street, hq_city, hq_state, hq_zip,
    ca_street, ca_city, ca_state, ca_zip,
    primary_contact_name, primary_contact_title, primary_contact_phone, primary_contact_email, website,
    elevator_pitch, company_overview, founded_year
) VALUES (
    'Singh Automation',
    'Singh Automation LLC',
    '86VF7',
    'GJ1DPYQ3X8K5',
    '117959857',
    'Active',
    'Small Business',
    '7804 S Sprinkle Road',
    'Portage',
    'MI',
    '49002',
    '300 Spectrum Center Dr, Suite 400',
    'Irvine',
    'CA',
    '92618',
    'Albert Mizuno',
    'Principal/CEO',
    '786-344-8955',
    'albert@singhautomation.com',
    'www.singhautomation.com',
    'Singh Automation is the one-stop integrator for manufacturers who need robots that think. We combine FANUC/UR robotics expertise with AI-powered vision to deliver turnkey automation cells that inspect, sort, and adapt in real-time—faster to deploy, smarter in operation, and backed by engineers who stay until it works.',
    'Singh Automation delivers turnkey industrial automation and AI-powered systems for manufacturing, logistics, and mission-critical infrastructure. As an authorized system integrator for FANUC and Universal Robots, we engineer, integrate, and commission advanced robotic cells, intelligent material-handling systems, and high-performance computing environments.',
    2014
);

-- ============================================================================
-- NAICS CODES
-- ============================================================================

CREATE TABLE naics_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(6) NOT NULL UNIQUE,
    title VARCHAR(200),
    description TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    capabilities TEXT  -- What Singh does in this NAICS
);

INSERT INTO naics_codes (code, title, is_primary, capabilities) VALUES
('333249', 'Other Industrial Machinery Manufacturing', TRUE, 'Design and manufacture of custom robotic work cells, automated assembly systems, and industrial automation equipment'),
('541330', 'Engineering Services', FALSE, 'Mechanical, electrical, and controls engineering for automation systems; facility integration design'),
('541512', 'Computer Systems Design Services', FALSE, 'PLC/HMI programming, SCADA integration, MES connectivity, industrial IoT solutions'),
('541715', 'Research and Development in Physical Sciences', FALSE, 'AI/ML vision system development, advanced manufacturing process R&D'),
('238210', 'Electrical Contractors', FALSE, 'Industrial electrical installation, panel building, controls wiring'),
('333922', 'Conveyor and Conveying Equipment Manufacturing', FALSE, 'Material handling systems, conveyor integration, AMR deployment');

-- ============================================================================
-- CERTIFICATIONS
-- ============================================================================

CREATE TABLE certifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cert_name VARCHAR(100) NOT NULL,
    cert_type VARCHAR(50),  -- OEM, Business, Quality, Safety
    issuing_org VARCHAR(100),
    cert_number VARCHAR(50),
    issue_date DATE,
    expiration_date DATE,
    status VARCHAR(20) DEFAULT 'Active',
    description TEXT,
    logo_path VARCHAR(200)
);

INSERT INTO certifications (cert_name, cert_type, issuing_org, status, description) VALUES
('FANUC Authorized System Integrator', 'OEM', 'FANUC America Corporation', 'Active', 'Authorized to design, build, and support FANUC robotic systems with direct OEM technical support and genuine parts access'),
('Universal Robots Certified Systems Partner', 'OEM', 'Universal Robots', 'Active', 'Certified integrator for UR collaborative robots with access to UR+ ecosystem and technical resources'),
('Small Business', 'Business', 'SBA/SAM.gov', 'Active', 'Certified small business per SBA size standards for NAICS 333249'),
('MBE Certification', 'Business', 'NMSDC', 'Active', 'Minority Business Enterprise certification'),
('WBENC Certification', 'Business', 'WBENC', 'Active', 'Women''s Business Enterprise certification');

-- ============================================================================
-- KEY PERSONNEL
-- ============================================================================

CREATE TABLE key_personnel (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    title VARCHAR(100),
    role_category VARCHAR(50),  -- Executive, Technical, Operations, QA
    
    -- For proposals
    proposal_role VARCHAR(100),  -- e.g., "Program Manager", "Technical Lead"
    proposal_responsibility TEXT,
    
    -- Experience
    years_experience INTEGER,
    prior_employers TEXT,  -- JSON array or comma-separated
    notable_projects TEXT,
    plant_launches TEXT,
    
    -- Credentials
    certifications TEXT,
    education TEXT,
    clearance_level VARCHAR(50),
    
    -- Contact
    email VARCHAR(100),
    phone VARCHAR(20),
    
    -- Availability
    availability_percent INTEGER DEFAULT 100,
    is_key_personnel BOOLEAN DEFAULT TRUE,
    
    -- Resume
    resume_path VARCHAR(200),
    bio_short TEXT,
    bio_long TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO key_personnel (first_name, last_name, title, role_category, proposal_role, proposal_responsibility, years_experience, prior_employers, plant_launches, bio_short) VALUES
('Gurdeep', 'Singh', 'Owner & Chairman', 'Executive', 'Executive Sponsor', 'Strategic oversight, escalation authority, contract signatory', 25, 'TAC, Stryker', NULL, 'Founder with 25+ years leadership in manufacturing automation. Prior executive roles at TAC and Stryker medical devices.'),
('David', 'Mih', 'COO / General Manager', 'Executive', 'Program Manager', 'Overall program responsibility, cost/schedule/scope management, Government interface, weekly status reporting', 15, 'MANN+HUMMEL, Magneti Marelli, MPG, AAM', 'MANN+HUMMEL Queretaro MX, Marelli Lighting Pulaski TN, Marelli Lighting Clarkston MI, MPG Transmission Ramos MX', 'Operations executive with 15+ years in automotive manufacturing. Led 4 greenfield plant launches for major Tier 1 suppliers.'),
('Soorya', 'Sridhar', 'Project Manager - Electrical', 'Technical', 'Technical Lead', 'Controls engineering, robot programming, PLC/HMI development, system integration, technical documentation', 10, NULL, NULL, 'Controls specialist with expertise in FANUC robotics, Allen-Bradley PLCs, and industrial vision systems.'),
('Sonny', 'Singh', 'Operations Manager', 'Operations', 'Operations Lead', 'Mechanical fabrication, system assembly, installation coordination, FAT/SAT execution', 12, NULL, NULL, 'Hands-on operations leader overseeing fabrication, assembly, and field installation of automation systems.'),
('Ricardo', 'del Olmo Parrado', 'Resource & Compliance Manager', 'QA', 'QA/Compliance Manager', 'Quality control, documentation compliance, test procedures, acceptance processes, regulatory compliance', 8, NULL, NULL, 'Quality and compliance professional ensuring deliverables meet government and industry standards.'),
('Albert', 'Mizuno', 'Principal/CEO', 'Executive', 'Contracts Administrator', 'Contract administration, new business development, escalation point', 10, NULL, NULL, 'Business development lead focused on federal and commercial market expansion for automation solutions.'),
('Charlie', 'Rupert', 'CEO - SVS', 'Executive', 'Technical Advisor', 'Technical advisory for thermal and vision systems integration', 20, 'Magneti Marelli, MPG, AAM', 'MANN+HUMMEL Queretaro MX, Marelli Lighting Pulaski TN, Marelli Lighting Clarkston MI, MPG Transmission Ramos MX', 'Automotive industry veteran with deep expertise in manufacturing operations and plant launches.');

-- ============================================================================
-- PAST PERFORMANCE / CONTRACT HISTORY
-- ============================================================================

CREATE TABLE contracts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contract_number VARCHAR(50),
    project_name VARCHAR(200) NOT NULL,
    client_name VARCHAR(200) NOT NULL,
    client_type VARCHAR(50),  -- Federal, State, Commercial, DoD Contractor
    
    -- Classification
    naics_code VARCHAR(6),
    psc_code VARCHAR(10),
    contract_type VARCHAR(20),  -- FFP, T&M, CPFF, etc.
    
    -- Financials
    contract_value DECIMAL(12,2),
    actual_cost DECIMAL(12,2),
    margin_percent DECIMAL(5,2),
    
    -- Timeline
    start_date DATE,
    end_date DATE,
    period_of_performance VARCHAR(100),
    
    -- Status
    status VARCHAR(20),  -- WON, LOST, ACTIVE, COMPLETE
    on_time BOOLEAN DEFAULT TRUE,
    on_budget BOOLEAN DEFAULT TRUE,
    
    -- Description
    scope_summary TEXT,
    technical_approach TEXT,
    key_deliverables TEXT,
    outcomes TEXT,
    
    -- Relevance tags (for matching to RFPs)
    relevance_tags TEXT,  -- e.g., "welding,robotics,vision,DoD,manufacturing"
    
    -- Reference
    reference_name VARCHAR(100),
    reference_title VARCHAR(100),
    reference_phone VARCHAR(20),
    reference_email VARCHAR(100),
    reference_approved BOOLEAN DEFAULT FALSE,
    
    -- Quality metrics
    customer_satisfaction INTEGER,  -- 1-100
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample past performance entries (populate with actual data)
INSERT INTO contracts (project_name, client_name, client_type, naics_code, contract_type, contract_value, start_date, end_date, status, scope_summary, relevance_tags, outcomes) VALUES
('Robotic Welding Cell - Automotive Assembly', 'Major Automotive Tier 1', 'Commercial', '333249', 'FFP', 450000.00, '2023-03-01', '2023-09-30', 'COMPLETE', 'Turnkey robotic welding cell for automotive frame assembly. Included FANUC robot, Lincoln welding package, safety guarding, and PLC integration.', 'welding,robotics,FANUC,automotive,turnkey', 'Achieved 99.2% weld quality rate. 40% cycle time reduction vs manual welding. Zero safety incidents.'),
('Vision Inspection System - Electronics', 'Electronics Manufacturer', 'Commercial', '541512', 'FFP', 180000.00, '2023-06-01', '2023-10-31', 'COMPLETE', 'AI-powered vision inspection system for PCB quality control. Cognex cameras with custom ML defect detection.', 'vision,AI,inspection,quality,electronics', 'Detected 99.8% of defects. Reduced false positives by 60% vs previous system.'),
('Material Handling Automation', 'Distribution Center Operator', 'Commercial', '333922', 'FFP', 320000.00, '2024-01-15', '2024-06-30', 'COMPLETE', 'Automated palletizing and conveyor system for e-commerce fulfillment center. FANUC palletizing robot with integrated conveyor.', 'palletizing,material handling,conveyor,FANUC,warehouse', 'Processing 2,400 cases/hour. ROI achieved in 14 months.'),
('Controls Upgrade - Food Processing', 'Food & Beverage Processor', 'Commercial', '541330', 'T&M', 95000.00, '2024-03-01', '2024-05-15', 'COMPLETE', 'PLC and HMI modernization for packaging line. Migration from legacy Allen-Bradley PLC5 to ControlLogix.', 'controls,PLC,Allen-Bradley,upgrade,food', 'Eliminated 12 hours/month unplanned downtime. Improved OEE by 8%.'),
('Cobot Assembly Cell', 'Medical Device Manufacturer', 'Commercial', '333249', 'FFP', 125000.00, '2024-06-01', '2024-08-31', 'COMPLETE', 'Universal Robots UR10e collaborative robot cell for medical device assembly. Force-sensing insertion and vision-guided pick.', 'cobot,UR,assembly,medical,vision', 'Met FDA validation requirements. Cycle time 45 seconds per assembly.');

-- ============================================================================
-- LINE ITEMS / PRICING HISTORY
-- ============================================================================

CREATE TABLE line_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contract_id INTEGER REFERENCES contracts(id),
    
    category VARCHAR(50),  -- LABOR, EQUIPMENT, MATERIAL, TRAVEL, ODC
    subcategory VARCHAR(100),
    description VARCHAR(500) NOT NULL,
    
    unit_type VARCHAR(50),  -- HOUR, EACH, LOT, DAY
    quantity DECIMAL(10,2),
    unit_cost DECIMAL(10,2),  -- What it cost us
    unit_price DECIMAL(10,2),  -- What we charged
    total_cost DECIMAL(12,2),
    total_price DECIMAL(12,2),
    
    vendor VARCHAR(100),
    part_number VARCHAR(100),
    
    -- For reuse
    is_standard_item BOOLEAN DEFAULT FALSE,
    reuse_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample line items for pricing lookup
INSERT INTO line_items (category, subcategory, description, unit_type, unit_cost, unit_price, is_standard_item) VALUES
-- Labor rates
('LABOR', 'Engineering', 'Project Manager', 'HOUR', 85.00, 150.00, TRUE),
('LABOR', 'Engineering', 'Senior Controls Engineer', 'HOUR', 75.00, 135.00, TRUE),
('LABOR', 'Engineering', 'Robot Programmer', 'HOUR', 70.00, 125.00, TRUE),
('LABOR', 'Engineering', 'Mechanical Engineer', 'HOUR', 65.00, 115.00, TRUE),
('LABOR', 'Engineering', 'Electrical Engineer', 'HOUR', 65.00, 115.00, TRUE),
('LABOR', 'Field', 'Field Service Technician', 'HOUR', 55.00, 95.00, TRUE),
('LABOR', 'Field', 'Installation Technician', 'HOUR', 45.00, 85.00, TRUE),

-- Equipment - Robots
('EQUIPMENT', 'Robot', 'FANUC M-710iC/50 Robot', 'EACH', 45000.00, 58500.00, TRUE),
('EQUIPMENT', 'Robot', 'FANUC ARC Mate 100iD Welding Robot', 'EACH', 52000.00, 67600.00, TRUE),
('EQUIPMENT', 'Robot', 'FANUC R-2000iC/165F Heavy Payload Robot', 'EACH', 68000.00, 88400.00, TRUE),
('EQUIPMENT', 'Robot', 'Universal Robots UR10e Cobot', 'EACH', 35000.00, 45500.00, TRUE),
('EQUIPMENT', 'Robot', 'Universal Robots UR20 Cobot', 'EACH', 52000.00, 67600.00, TRUE),
('EQUIPMENT', 'Controller', 'FANUC R-30iB Plus Controller', 'EACH', 18000.00, 23400.00, TRUE),

-- Equipment - Welding
('EQUIPMENT', 'Welding', 'Lincoln Power Wave i400 Welding Power Source', 'EACH', 12000.00, 15600.00, TRUE),
('EQUIPMENT', 'Welding', 'Lincoln Power Wave S500 Advanced', 'EACH', 18000.00, 23400.00, TRUE),
('EQUIPMENT', 'Welding', 'Fronius TPS 500i MIG Package', 'EACH', 22000.00, 28600.00, TRUE),
('EQUIPMENT', 'Welding', 'Wire Feeder System', 'EACH', 3500.00, 4550.00, TRUE),
('EQUIPMENT', 'Welding', 'Welding Torch - Robotic MIG', 'EACH', 2800.00, 3640.00, TRUE),

-- Equipment - Positioners
('EQUIPMENT', 'Positioner', 'Servo Positioner 500kg', 'EACH', 15000.00, 19500.00, TRUE),
('EQUIPMENT', 'Positioner', 'Servo Positioner 2000kg', 'EACH', 35000.00, 45500.00, TRUE),
('EQUIPMENT', 'Positioner', 'Heavy Duty Positioner 5000kg', 'EACH', 65000.00, 84500.00, TRUE),
('EQUIPMENT', 'Positioner', 'Headstock/Tailstock 10000lb', 'EACH', 85000.00, 110500.00, TRUE),

-- Equipment - Safety
('EQUIPMENT', 'Safety', 'Safety Light Curtain Set', 'EACH', 2500.00, 3250.00, TRUE),
('EQUIPMENT', 'Safety', 'Safety PLC (Allen-Bradley GuardLogix)', 'EACH', 8500.00, 11050.00, TRUE),
('EQUIPMENT', 'Safety', 'Perimeter Guarding (per linear ft)', 'EACH', 85.00, 110.00, TRUE),
('EQUIPMENT', 'Safety', 'Safety Interlock Door', 'EACH', 1200.00, 1560.00, TRUE),

-- Equipment - Vision
('EQUIPMENT', 'Vision', 'Cognex In-Sight 7000 Vision System', 'EACH', 8500.00, 11050.00, TRUE),
('EQUIPMENT', 'Vision', 'Cognex DataMan Barcode Reader', 'EACH', 2200.00, 2860.00, TRUE),
('EQUIPMENT', 'Vision', 'Keyence CV-X Vision System', 'EACH', 12000.00, 15600.00, TRUE),
('EQUIPMENT', 'Vision', 'FANUC iRVision 2D Package', 'EACH', 15000.00, 19500.00, TRUE),
('EQUIPMENT', 'Vision', 'FANUC 3DV/600 Vision Sensor', 'EACH', 28000.00, 36400.00, TRUE),

-- Equipment - Controls
('EQUIPMENT', 'Controls', 'Allen-Bradley ControlLogix L85 PLC', 'EACH', 12000.00, 15600.00, TRUE),
('EQUIPMENT', 'Controls', 'Allen-Bradley CompactLogix L33 PLC', 'EACH', 4500.00, 5850.00, TRUE),
('EQUIPMENT', 'Controls', 'Allen-Bradley PanelView Plus 7 15" HMI', 'EACH', 4200.00, 5460.00, TRUE),
('EQUIPMENT', 'Controls', 'Siemens S7-1500 PLC', 'EACH', 8500.00, 11050.00, TRUE),
('EQUIPMENT', 'Controls', 'Electrical Panel (standard)', 'EACH', 8000.00, 10400.00, TRUE),

-- Services
('SERVICES', 'Engineering', 'Site Survey and Assessment', 'DAY', 1200.00, 2400.00, TRUE),
('SERVICES', 'Engineering', 'Design Package Development', 'LOT', 15000.00, 25000.00, TRUE),
('SERVICES', 'Training', 'Operator Training (per day)', 'DAY', 1500.00, 2500.00, TRUE),
('SERVICES', 'Training', 'Maintenance Training (per day)', 'DAY', 1800.00, 3000.00, TRUE),
('SERVICES', 'Support', 'Extended Warranty (per year)', 'YEAR', 8000.00, 15000.00, TRUE);

-- ============================================================================
-- LABOR RATES
-- ============================================================================

CREATE TABLE labor_rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_title VARCHAR(100) NOT NULL,
    labor_category VARCHAR(50),  -- Engineering, Field, Management, Admin
    
    base_rate DECIMAL(8,2),
    fringe_rate DECIMAL(8,2),
    overhead_rate DECIMAL(8,2),
    loaded_rate DECIMAL(8,2),
    bill_rate DECIMAL(8,2),
    
    gsa_rate DECIMAL(8,2),  -- If on GSA schedule
    
    effective_date DATE,
    expiration_date DATE,
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO labor_rates (role_title, labor_category, base_rate, loaded_rate, bill_rate, effective_date) VALUES
('Program Manager', 'Management', 85.00, 127.50, 150.00, '2025-01-01'),
('Project Manager', 'Management', 75.00, 112.50, 135.00, '2025-01-01'),
('Senior Controls Engineer', 'Engineering', 70.00, 105.00, 125.00, '2025-01-01'),
('Controls Engineer', 'Engineering', 55.00, 82.50, 100.00, '2025-01-01'),
('Robot Programmer', 'Engineering', 65.00, 97.50, 115.00, '2025-01-01'),
('Mechanical Engineer', 'Engineering', 60.00, 90.00, 110.00, '2025-01-01'),
('Electrical Engineer', 'Engineering', 60.00, 90.00, 110.00, '2025-01-01'),
('Vision/AI Engineer', 'Engineering', 75.00, 112.50, 135.00, '2025-01-01'),
('CAD Designer', 'Engineering', 45.00, 67.50, 85.00, '2025-01-01'),
('Field Service Technician', 'Field', 50.00, 75.00, 95.00, '2025-01-01'),
('Installation Technician', 'Field', 40.00, 60.00, 80.00, '2025-01-01'),
('Quality Inspector', 'Field', 42.00, 63.00, 85.00, '2025-01-01');

-- ============================================================================
-- PROPOSAL TEMPLATES / BOILERPLATE
-- ============================================================================

CREATE TABLE boilerplate (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_name VARCHAR(100) NOT NULL,
    section_type VARCHAR(50),  -- Overview, Technical, Management, Quality, Risk
    
    title VARCHAR(200),
    content TEXT NOT NULL,
    
    -- For conditional use
    use_conditions TEXT,  -- e.g., "NAICS=333249", "contract_type=welding"
    
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO boilerplate (section_name, section_type, title, content) VALUES
('company_overview', 'Overview', 'Company Overview', 'Singh Automation LLC delivers turnkey industrial automation and AI-powered systems for manufacturing, logistics, and mission-critical infrastructure. As an authorized system integrator for FANUC and Universal Robots, we engineer, integrate, and commission advanced robotic cells, intelligent material-handling systems, and high-performance computing environments. Founded in 2014, we maintain dual-coast operations with headquarters in Michigan and sales office in California, enabling rapid nationwide deployment.'),

('value_proposition', 'Overview', 'Value Proposition', 'Singh Automation offers unique competitive advantages: we are a FANUC Authorized System Integrator with OEM-backed support, a Universal Robots Certified Systems Partner, and maintain a proven track record with federal, state, and commercial contracts. Our dual-coast presence ensures national coverage and rapid response. As a certified small business with MBE and WBENC certifications, we support supplier diversity initiatives while delivering world-class automation solutions.'),

('technical_methodology', 'Technical', 'Technical Methodology', 'Our methodology follows a proven four-phase approach: (1) Planning & Design - comprehensive site survey, requirements validation, and approved design package development; (2) Build, Stage & Factory Testing - procurement, fabrication, integration, and Factory Acceptance Test with documented results; (3) Installation & Commissioning - coordinated delivery, installation, Site Acceptance Test, and training; (4) Support & Warranty - documentation delivery, warranty activation, and ongoing support.'),

('quality_approach', 'Quality', 'Quality Assurance Approach', 'Singh Automation maintains a comprehensive quality management system with embedded checkpoints at each project phase. Our approach emphasizes prevention over detection, with formal Government approval gates including Design Review, Factory Acceptance Test (FAT), Site Acceptance Test (SAT), and Final Documentation Handover. All nonconformances are documented, analyzed for root cause, corrected, and verified before proceeding.'),

('risk_management', 'Risk', 'Risk Management Approach', 'Singh Automation employs proactive risk management with a formal Risk Register reviewed weekly by the Program Manager. We identify risks early through detailed site surveys and design reviews, implement mitigations before issues materialize, and maintain contingency plans with pre-identified alternative suppliers and expedited procurement options. Escalation paths ensure emerging risks are addressed at appropriate management levels.'),

('safety_approach', 'Quality', 'Safety Approach', 'All automation systems are designed and built to comply with applicable safety standards including OSHA, NFPA 79, and RIA/ANSI requirements. Safety systems include Category-rated guarding, safety-rated PLCs, light curtains, interlocked doors, and emergency stop circuits. Comprehensive safety analysis and hazard assessments are performed during design with documentation provided to the customer.'),

('communication_plan', 'Management', 'Communication Plan', 'Singh Automation implements structured communication including: Kickoff Meeting with all stakeholders to establish Integrated Master Schedule; Weekly Status Meetings with written reports; Design Reviews per milestone with formal approval memos; Monthly Executive Reviews with senior management participation. The Program Manager serves as single point of contact with maintained issue/risk registers and rapid escalation paths.'),

('warranty_support', 'Technical', 'Warranty and Support', 'Singh Automation provides a 12-month warranty covering all materials and workmanship from date of final acceptance. Warranty support includes remote diagnostics, guaranteed response times, and on-site service when required. Extended warranty and preventive maintenance programs are available. As a FANUC Authorized Integrator, we provide access to genuine OEM replacement parts and factory-trained technicians.');

-- ============================================================================
-- PROPOSAL SECTIONS TEMPLATE
-- ============================================================================

CREATE TABLE proposal_sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_name VARCHAR(100),
    section_order INTEGER,
    section_number VARCHAR(20),
    section_title VARCHAR(200),
    required BOOLEAN DEFAULT TRUE,
    
    -- Content generation hints
    content_source VARCHAR(100),  -- boilerplate, personnel, past_perf, pricing, custom
    boilerplate_refs TEXT,  -- Comma-separated boilerplate section_names to pull
    
    -- Instructions for AI
    generation_prompt TEXT,
    
    page_limit INTEGER,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO proposal_sections (template_name, section_order, section_number, section_title, content_source, boilerplate_refs, generation_prompt) VALUES
('Technical_Management', 1, '1', 'Executive Summary', 'custom', 'company_overview,value_proposition', 'Write a compelling executive summary that demonstrates understanding of the requirement, summarizes the proposed solution, highlights key discriminators, and commits to performance. Keep to 1 page.'),
('Technical_Management', 2, '2', 'Technical Approach', 'custom', 'technical_methodology', 'Detail the technical solution including equipment specifications, system architecture, and implementation methodology. Reference specific models and capabilities matched to requirements.'),
('Technical_Management', 3, '3', 'Management Approach', 'custom', 'communication_plan', 'Describe program organization, key personnel assignments, communication plan, and schedule management approach.'),
('Technical_Management', 4, '4', 'Key Personnel', 'personnel', NULL, 'Present key personnel with roles, relevant experience, and qualifications. Pull from key_personnel table matching required roles.'),
('Technical_Management', 5, '5', 'Past Performance', 'past_perf', NULL, 'Present 3 relevant past performance references matched to the RFP requirements. Pull from contracts table by relevance_tags.'),
('Technical_Management', 6, '6', 'Quality Assurance', 'boilerplate', 'quality_approach,safety_approach', 'Present quality management approach with specific checkpoints and acceptance criteria.'),
('Technical_Management', 7, '7', 'Risk Management', 'boilerplate', 'risk_management', 'Present risk identification and mitigation approach with specific risks relevant to this project.');

-- ============================================================================
-- OPPORTUNITIES PIPELINE
-- ============================================================================

CREATE TABLE opportunities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Identification
    notice_id VARCHAR(50),
    solicitation_number VARCHAR(100),
    title VARCHAR(500) NOT NULL,
    
    -- Source
    source VARCHAR(50),  -- SAM.gov, DIBBS, State, GovWin, etc.
    source_url TEXT,
    
    -- Agency
    agency_name VARCHAR(200),
    agency_subtier VARCHAR(200),
    office VARCHAR(200),
    
    -- Classification
    naics_code VARCHAR(6),
    psc_code VARCHAR(10),
    set_aside VARCHAR(100),
    contract_type VARCHAR(50),
    
    -- Financials
    estimated_value DECIMAL(14,2),
    
    -- Timeline
    posted_date DATE,
    response_deadline DATETIME,
    
    -- Status
    status VARCHAR(50),  -- NEW, QUALIFIED, BID, NO_BID, SUBMITTED, WON, LOST
    bid_score INTEGER,  -- From bid/no-bid scoring
    bid_decision VARCHAR(20),
    bid_decision_reason TEXT,
    
    -- Capture
    incumbent VARCHAR(200),
    competition_notes TEXT,
    win_themes TEXT,
    
    -- Files
    rfp_path VARCHAR(500),
    proposal_path VARCHAR(500),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Available past performance by relevance tags
CREATE VIEW v_past_performance AS
SELECT 
    c.id,
    c.project_name,
    c.client_name,
    c.client_type,
    c.contract_value,
    c.period_of_performance,
    c.scope_summary,
    c.outcomes,
    c.relevance_tags,
    c.reference_name,
    c.reference_title,
    c.reference_phone,
    c.reference_email,
    c.customer_satisfaction
FROM contracts c
WHERE c.status = 'COMPLETE'
  AND c.reference_approved = TRUE OR c.reference_approved IS NULL
ORDER BY c.contract_value DESC;

-- View: Standard equipment pricing
CREATE VIEW v_equipment_pricing AS
SELECT 
    category,
    subcategory,
    description,
    unit_cost,
    unit_price,
    ROUND((unit_price - unit_cost) / unit_cost * 100, 1) as margin_pct
FROM line_items
WHERE is_standard_item = TRUE
  AND category = 'EQUIPMENT'
ORDER BY category, subcategory, description;

-- View: Current labor rates
CREATE VIEW v_labor_rates AS
SELECT 
    role_title,
    labor_category,
    base_rate,
    loaded_rate,
    bill_rate,
    ROUND((bill_rate - loaded_rate) / loaded_rate * 100, 1) as margin_pct
FROM labor_rates
WHERE effective_date <= CURRENT_DATE
  AND (expiration_date IS NULL OR expiration_date >= CURRENT_DATE)
ORDER BY labor_category, bill_rate DESC;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_contracts_naics ON contracts(naics_code);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_relevance ON contracts(relevance_tags);
CREATE INDEX idx_line_items_category ON line_items(category);
CREATE INDEX idx_line_items_standard ON line_items(is_standard_item);
CREATE INDEX idx_opportunities_status ON opportunities(status);
CREATE INDEX idx_opportunities_deadline ON opportunities(response_deadline);

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
