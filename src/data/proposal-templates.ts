// src/data/proposal-templates.ts
// Reusable proposal templates for federal and commercial bids
// Based on actual Navy robotic welding cell proposal structure

export type ProposalSection = {
  id: string;
  title: string;
  required: boolean;
  pageEstimate: number;
  template: string;
};

export type ProposalTemplate = {
  id: string;
  name: string;
  type: "Federal FFP" | "Federal CPFF" | "Commercial" | "SBIR";
  sections: ProposalSection[];
};

// ============================================================================
// COVER LETTER TEMPLATE
// ============================================================================

export const coverLetterTemplate = `
SINGH AUTOMATION
1234 Industrial Parkway
Kalamazoo, MI 49001
Tel: (269) 555-1234

[DATE]

[CONTRACTING_OFFICER_NAME]
[AGENCY_NAME]
[ADDRESS]

RE: Solicitation [SOLICITATION_NUMBER]
    [PROJECT_TITLE]

Dear [CONTRACTING_OFFICER_TITLE]:

Singh Automation is pleased to submit our proposal for [BRIEF_SCOPE_DESCRIPTION].

As a certified Small Business with 15+ years of robotic integration experience, we offer:

• FANUC Authorized System Integrator status
• In-house UL 508A panel shop
• Proven industrial automation experience
• Full-service capability from design through training

Our [CONTRACT_TYPE] price of $[TOTAL_PRICE] includes all equipment, engineering,
installation, training, documentation, and [WARRANTY_PERIOD] warranty.

We confirm availability to begin work within [START_DAYS] days of award and
deliver within [DELIVERY_WEEKS] weeks.

Respectfully submitted,

_________________________
Gurdeep Singh
Owner, Singh Automation
gsingh@singhautomation.com
(269) 555-1234
`;

// ============================================================================
// TECHNICAL APPROACH TEMPLATE
// ============================================================================

export const technicalApproachTemplate = `
## SECTION 3: TECHNICAL APPROACH

### 3.1 System Overview

Singh Automation proposes a turnkey [SYSTEM_TYPE] engineered for [APPLICATION]
at [LOCATION]. Our solution integrates proven industrial components with
customer-specific requirements for reliability, maintainability, and operator safety.

**Proposed System Architecture:**

[ARCHITECTURE_DIAGRAM]

---

### 3.1.1 [MAJOR_COMPONENT_1]

| Specification | Value | Requirement |
|---------------|-------|-------------|
| [SPEC_1] | [VALUE_1] | [REQ_1] |
| [SPEC_2] | [VALUE_2] | [REQ_2] |
| [SPEC_3] | [VALUE_3] | [REQ_3] |

**Why [BRAND]:** [JUSTIFICATION]

---

### 3.2 Controls Architecture

#### 3.2.1 PLC: [PLC_MODEL]

| Component | Part Number | Function |
|-----------|-------------|----------|
| CPU | [PART_NUM] | Main processor |
| Safety | [PART_NUM] | Safety partner |
| I/O | [PART_NUM] | Field devices |

#### 3.2.2 HMI: [HMI_MODEL]

[HMI_DESCRIPTION]

---

### 3.3 Safety Systems

#### 3.3.1 Risk Assessment

Singh will perform a comprehensive risk assessment per:
- **ISO 12100** - General principles for design
- **ISO 10218-1/2** - Robot safety requirements
- **ANSI/RIA 15.06** - Industrial robot safety
- **OSHA 1910.212** - Machine guarding

#### 3.3.2 Safety Controls

| Safety Function | Implementation |
|-----------------|----------------|
| E-Stop | Category 0 stop, hardwired + safety PLC |
| Guard doors | Interlocked, key-transfer system |
| Light curtains | Entry points, Type 4 |
| Perimeter | Fixed steel fencing |

---

### 3.4 Project Execution Plan

#### 3.4.1 Schedule ([TOTAL_WEEKS] Weeks Total)

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Design | Weeks 1-[DESIGN_END] | Drawings, panel layout, BOM |
| Fabrication | Weeks [FAB_START]-[FAB_END] | Panel, guarding, base frame |
| Integration | Weeks [INT_START]-[INT_END] | Robot mount, wiring, programming |
| FAT | Week [FAT_WEEK] | Customer witness test |
| Delivery | Week [SHIP_WEEK] | Rigging, transport |
| Install | Weeks [INST_START]-[INST_END] | Anchor, connect, power-up |
| SAT | Week [SAT_WEEK] | Acceptance testing |
| Training | Week [TRAIN_WEEK] | Operator + maintenance |

---

### 3.5 Training

#### Operator Training ([OP_HOURS] hours / [OP_DAYS] days)

| Day | Topic |
|-----|-------|
| 1 | Safety, system overview, power-up/shutdown |
| 2 | HMI operation, job selection |
| 3 | Parameter adjustment, basic troubleshooting |
| 4 | Hands-on practice |
| 5 | Proficiency check |

#### Maintenance Training ([MAINT_HOURS] hours / [MAINT_DAYS] days)

| Day | Topic |
|-----|-------|
| 1 | Preventive maintenance, consumables |
| 2 | Electrical troubleshooting, spare parts |

---

### 3.6 Documentation Deliverables

| Document | Format | Quantity |
|----------|--------|----------|
| O&M Manual | Hard copy + PDF | 3 + electronic |
| Electrical Drawings | AutoCAD + PDF | Per customer std |
| Mechanical Drawings | AutoCAD + PDF | Per customer std |
| PLC Program | Archive | Electronic |
| Robot Program | Backup | Electronic |
| Risk Assessment | PDF | Electronic |

---

### 3.7 Warranty & Support

| Coverage | Terms |
|----------|-------|
| Duration | [WARRANTY_MONTHS] months from SAT acceptance |
| Parts | Full replacement, no charge |
| Labor | Included for warranty repairs |
| Phone Support | 24/7 hotline, [PHONE_RESPONSE]-hour response |
| On-Site | [ONSITE_RESPONSE]-hour dispatch for critical issues |
`;

// ============================================================================
// PAST PERFORMANCE TEMPLATE
// ============================================================================

export const pastPerformanceTemplate = `
## SECTION 5: PAST PERFORMANCE

### Contract #[NUMBER]: [PROJECT_TITLE]

| Field | Details |
|-------|---------|
| **Client** | [CLIENT_NAME] |
| **Contract Value** | $[VALUE] |
| **Period of Performance** | [START_DATE] – [END_DATE] |
| **Location** | [LOCATION] |
| **POC** | [POC_NAME], [POC_TITLE] |
| **Contact** | [POC_EMAIL] / [POC_PHONE] |

#### Scope of Work

[SCOPE_DESCRIPTION]

#### Technical Similarities to Current Requirement

| Requirement | Project Experience |
|-------------|-------------------|
| [REQ_1] | ✓ [EXPERIENCE_1] |
| [REQ_2] | ✓ [EXPERIENCE_2] |
| [REQ_3] | ✓ [EXPERIENCE_3] |

#### Results Achieved

| Metric | Outcome |
|--------|---------|
| [METRIC_1] | [RESULT_1] |
| [METRIC_2] | [RESULT_2] |
| [METRIC_3] | [RESULT_3] |
`;

// ============================================================================
// COST PROPOSAL TEMPLATE
// ============================================================================

export const costProposalTemplate = `
## SECTION 6: COST PROPOSAL

### [SOLICITATION_NUMBER] - [PROJECT_TITLE]

---

### 6.1 Pricing Summary

| CLIN | Description | Qty | Unit Price | Extended |
|------|-------------|-----|------------|----------|
| 0001 | [MAIN_DELIVERABLE] | 1 | $[PRICE_1] | $[PRICE_1] |
| 0002 | Installation & Commissioning | 1 | $[PRICE_2] | $[PRICE_2] |
| 0003 | Training | 1 | $[PRICE_3] | $[PRICE_3] |
| 0004 | Documentation | 1 | $[PRICE_4] | $[PRICE_4] |
| 0005 | Extended Warranty | 1 | $[PRICE_5] | $[PRICE_5] |
| | **TOTAL [CONTRACT_TYPE]** | | | **$[TOTAL]** |

---

### 6.2 Cost Breakdown - CLIN 0001

#### Major Equipment

| Item | Manufacturer | Model | Cost |
|------|--------------|-------|------|
| [EQUIP_1] | [MFR_1] | [MODEL_1] | $[COST_1] |
| [EQUIP_2] | [MFR_2] | [MODEL_2] | $[COST_2] |
| **Subtotal Equipment** | | | **$[EQUIP_SUBTOTAL]** |

#### Engineering Labor

| Role | Hours | Rate | Cost |
|------|-------|------|------|
| Project Management | [PM_HRS] | $[PM_RATE] | $[PM_COST] |
| Mechanical Engineering | [ME_HRS] | $[ME_RATE] | $[ME_COST] |
| Electrical Engineering | [EE_HRS] | $[EE_RATE] | $[EE_COST] |
| Controls Programming | [CTRL_HRS] | $[CTRL_RATE] | $[CTRL_COST] |
| **Subtotal Engineering** | | | **$[ENG_SUBTOTAL]** |

#### Subtotals & Markup

| Category | Cost |
|----------|------|
| Equipment | $[EQUIP_SUBTOTAL] |
| Controls | $[CTRL_SUBTOTAL] |
| Engineering | $[ENG_SUBTOTAL] |
| **Direct Costs** | **$[DIRECT_TOTAL]** |
| G&A ([GA_PCT]%) | $[GA_COST] |
| Profit ([PROFIT_PCT]%) | $[PROFIT_COST] |
| **CLIN 0001 Total** | **$[CLIN1_TOTAL]** |

---

### 6.3 Payment Schedule

| Milestone | % | Amount | Timing |
|-----------|---|--------|--------|
| Award / Kickoff | [MS1_PCT]% | $[MS1_AMT] | Net 30 from award |
| Design Approval | [MS2_PCT]% | $[MS2_AMT] | Week [MS2_WEEK] |
| FAT Complete | [MS3_PCT]% | $[MS3_AMT] | Week [MS3_WEEK] |
| SAT Acceptance | [MS4_PCT]% | $[MS4_AMT] | Week [MS4_WEEK] |
| Final | [MS5_PCT]% | $[MS5_AMT] | Week [MS5_WEEK] |

---

### 6.4 Assumptions & Exclusions

**Assumptions:**
- [ASSUMPTION_1]
- [ASSUMPTION_2]
- [ASSUMPTION_3]

**Exclusions:**
- [EXCLUSION_1]
- [EXCLUSION_2]
- [EXCLUSION_3]
`;

// ============================================================================
// KEY PERSONNEL TEMPLATE
// ============================================================================

export const keyPersonnelTemplate = `
## SECTION 4: KEY PERSONNEL

### [NAME] — [ROLE]

**Role on Contract:** [CONTRACT_ROLE]

**Responsibilities:**
- [RESPONSIBILITY_1]
- [RESPONSIBILITY_2]
- [RESPONSIBILITY_3]

**Qualifications:**
- [QUALIFICATION_1]
- [QUALIFICATION_2]
- [QUALIFICATION_3]

**Relevant Experience:**
- [PROJECT_1] — [ROLE_1]
- [PROJECT_2] — [ROLE_2]
- [PROJECT_3] — [ROLE_3]

**Certifications:**
- [CERT_1]
- [CERT_2]
`;

// ============================================================================
// COMPLIANCE MATRIX TEMPLATE
// ============================================================================

export const complianceMatrixTemplate = `
## COMPLIANCE MATRIX

### [SOLICITATION_NUMBER] - [PROJECT_TITLE]

| # | SOW Requirement | Proposal Section | Page | Compliant | Notes |
|---|-----------------|------------------|------|-----------|-------|
| 1.1 | [REQ_1] | [SECTION_1] | [PAGE_1] | ✓ | [NOTE_1] |
| 1.2 | [REQ_2] | [SECTION_2] | [PAGE_2] | ✓ | [NOTE_2] |
| 2.1 | [REQ_3] | [SECTION_3] | [PAGE_3] | ✓ | [NOTE_3] |

### Compliance Summary

| Category | Requirements | Compliant | Exceptions |
|----------|--------------|-----------|------------|
| [CAT_1] | [COUNT_1] | [COMP_1] | [EXC_1] |
| [CAT_2] | [COUNT_2] | [COMP_2] | [EXC_2] |
| **TOTAL** | **[TOTAL_REQ]** | **[TOTAL_COMP]** | **[TOTAL_EXC]** |
`;

// ============================================================================
// COMPLETE PROPOSAL TEMPLATES
// ============================================================================

export const proposalTemplates: ProposalTemplate[] = [
  {
    id: "federal-ffp-automation",
    name: "Federal FFP - Automation/Robotics",
    type: "Federal FFP",
    sections: [
      { id: "cover", title: "Cover Letter", required: true, pageEstimate: 1, template: coverLetterTemplate },
      { id: "technical", title: "Technical Volume", required: true, pageEstimate: 15, template: technicalApproachTemplate },
      { id: "past-perf", title: "Past Performance", required: true, pageEstimate: 5, template: pastPerformanceTemplate },
      { id: "cost", title: "Cost/Price Volume", required: true, pageEstimate: 8, template: costProposalTemplate },
      { id: "personnel", title: "Key Personnel", required: true, pageEstimate: 4, template: keyPersonnelTemplate },
      { id: "compliance", title: "Compliance Matrix", required: true, pageEstimate: 2, template: complianceMatrixTemplate },
    ],
  },
  {
    id: "commercial-automation",
    name: "Commercial - Automation Quote",
    type: "Commercial",
    sections: [
      { id: "cover", title: "Cover Letter", required: true, pageEstimate: 1, template: coverLetterTemplate },
      { id: "technical", title: "Technical Proposal", required: true, pageEstimate: 8, template: technicalApproachTemplate },
      { id: "cost", title: "Pricing", required: true, pageEstimate: 3, template: costProposalTemplate },
    ],
  },
];

// ============================================================================
// HELPER: Generate filled proposal
// ============================================================================

export type ProposalData = {
  solicitation: {
    number: string;
    title: string;
    agency: string;
    dueDate: string;
    contractType: string;
  };
  pricing: {
    total: number;
    clins: { description: string; price: number }[];
  };
  schedule: {
    totalWeeks: number;
    startDays: number;
  };
  system: {
    type: string;
    application: string;
    location: string;
  };
};

export function fillTemplate(template: string, data: Record<string, string>): string {
  let filled = template;
  for (const [key, value] of Object.entries(data)) {
    filled = filled.replace(new RegExp(`\\[${key}\\]`, 'g'), value);
  }
  return filled;
}

// ============================================================================
// NAVY WELDING CELL - COMPLETED PROPOSAL
// ============================================================================

export const navyWeldingCellProposal = {
  id: "navy-welding-cell-n00024-25",
  solicitation: {
    number: "N00024-25-R-WELD",
    title: "Robotic Welding Cell for Ship Hull Repair",
    agency: "Naval Sea Systems Command (NAVSEA)",
    location: "Norfolk Naval Shipyard, VA",
    naics: "333249",
    setAside: "Total Small Business",
    dueDate: "TBD",
  },
  pricing: {
    total: 925000,
    clins: [
      { number: "0001", description: "Welding Cell - Design, Build, Deliver", price: 742500 },
      { number: "0002", description: "Installation & Commissioning", price: 87500 },
      { number: "0003", description: "Training (Operator + Maintenance)", price: 35000 },
      { number: "0004", description: "Documentation Package", price: 15000 },
      { number: "0005", description: "1-Year Extended Warranty", price: 45000 },
    ],
  },
  schedule: {
    totalWeeks: 16,
    phases: [
      { name: "Design", weeks: "1-4" },
      { name: "Fabrication", weeks: "5-9" },
      { name: "Integration", weeks: "10-11" },
      { name: "FAT", weeks: "12" },
      { name: "Delivery", weeks: "13" },
      { name: "Install", weeks: "13-14" },
      { name: "SAT", weeks: "15" },
      { name: "Training", weeks: "16" },
    ],
  },
  equipment: {
    robot: { manufacturer: "FANUC", model: "ArcMate 100iD/12", cost: 85000 },
    positioner: { manufacturer: "FANUC", model: "2-axis 2,500 lb", cost: 45000 },
    welder: { manufacturer: "Lincoln", model: "Power Wave 455M", cost: 28000 },
    plc: { manufacturer: "Allen-Bradley", model: "CompactLogix 5380", cost: 8500 },
    safetyPlc: { manufacturer: "Allen-Bradley", model: "GuardLogix", cost: 6500 },
    hmi: { manufacturer: "Allen-Bradley", model: "PanelView Plus 7 15\"", cost: 5500 },
  },
  team: [
    { name: "Mangay Peram", role: "Project Manager" },
    { name: "Aditya Kurde", role: "Controls Engineer / Technical Lead" },
    { name: "Bhargav Nandan Gali", role: "Vision Systems Engineer" },
    { name: "Mayur Joshi", role: "Machine Builder" },
    { name: "Sony Singh", role: "Machine Builder" },
  ],
  pastPerformance: [
    {
      project: "Multi-Robot Window Automation",
      client: "Lippert Industries",
      value: 1600000,
      poc: { name: "Tim Widner", title: "VP - Glass", email: "Twidner@lci1.com" },
    },
  ],
  status: "COMPLETE",
  goNoGo: "GO",
  winProbability: "70-75%",
};
