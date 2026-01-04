# Singh Automation Platform - API Specification
## Proposal Generation Endpoints

This document defines the API endpoints needed to power automated proposal generation from the database schema.

---

## 1. Company Profile

### GET /api/company/profile
Returns complete company profile for boilerplate insertion.

**Response:**
```json
{
  "company_name": "Singh Automation LLC",
  "cage": "86VF7",
  "uei": "GJ1DPYQ3X8K5",
  "duns": "117959857",
  "sam_status": "Active",
  "business_size": "Small Business",
  "headquarters": {
    "street": "7804 S Sprinkle Road",
    "city": "Portage",
    "state": "MI",
    "zip": "49002"
  },
  "california_office": {
    "street": "300 Spectrum Center Dr, Suite 400",
    "city": "Irvine",
    "state": "CA",
    "zip": "92618"
  },
  "primary_contact": {
    "name": "Albert Mizuno",
    "title": "Principal/CEO",
    "phone": "786-344-8955",
    "email": "albert@singhautomation.com"
  },
  "website": "www.singhautomation.com",
  "elevator_pitch": "Singh Automation is the one-stop integrator...",
  "company_overview": "Singh Automation delivers turnkey industrial automation...",
  "founded_year": 2014
}
```

---

## 2. NAICS Codes

### GET /api/company/naics
Returns all NAICS codes with capabilities.

### GET /api/company/naics/{code}
Returns specific NAICS with Singh's capabilities in that area.

**Use case:** Match opportunity NAICS to show relevant capabilities in proposal.

---

## 3. Certifications

### GET /api/company/certifications
Returns active certifications.

**Response:**
```json
{
  "certifications": [
    {
      "name": "FANUC Authorized System Integrator",
      "type": "OEM",
      "issuer": "FANUC America Corporation",
      "status": "Active",
      "description": "Authorized to design, build, and support FANUC robotic systems..."
    },
    ...
  ]
}
```

---

## 4. Key Personnel

### GET /api/personnel
Returns all key personnel.

### GET /api/personnel/by-role?role={proposal_role}
Returns personnel matching a proposal role (e.g., "Program Manager", "Technical Lead").

### GET /api/personnel/{id}
Returns full detail for one person including bio, experience, prior employers.

**Example - Proposal Generation Query:**
```
GET /api/personnel/by-role?role=Program Manager

Response:
{
  "personnel": [
    {
      "id": 2,
      "name": "David Mih",
      "title": "COO / General Manager",
      "proposal_role": "Program Manager",
      "proposal_responsibility": "Overall program responsibility, cost/schedule/scope management...",
      "years_experience": 15,
      "prior_employers": ["MANN+HUMMEL", "Magneti Marelli", "MPG", "AAM"],
      "plant_launches": [
        "MANN+HUMMEL Queretaro MX",
        "Marelli Lighting Pulaski TN",
        "Marelli Lighting Clarkston MI",
        "MPG Transmission Ramos MX"
      ],
      "bio_short": "Operations executive with 15+ years in automotive manufacturing..."
    }
  ]
}
```

---

## 5. Past Performance

### GET /api/past-performance
Returns all completed contracts suitable for past performance citations.

### GET /api/past-performance/search?tags={tags}&naics={naics}&min_value={value}
Search past performance by relevance.

**Parameters:**
- `tags`: Comma-separated relevance tags (e.g., "welding,robotics,DoD")
- `naics`: NAICS code to match
- `min_value`: Minimum contract value
- `limit`: Number of results (default 3)

**Example - Find relevant past performance for welding RFP:**
```
GET /api/past-performance/search?tags=welding,robotics&naics=333249&limit=3

Response:
{
  "matches": [
    {
      "id": 1,
      "project_name": "Robotic Welding Cell - Automotive Assembly",
      "client_name": "Major Automotive Tier 1",
      "client_type": "Commercial",
      "contract_value": 450000.00,
      "period_of_performance": "March 2023 - September 2023",
      "scope_summary": "Turnkey robotic welding cell for automotive frame assembly...",
      "outcomes": "Achieved 99.2% weld quality rate. 40% cycle time reduction...",
      "relevance_score": 0.95,
      "matched_tags": ["welding", "robotics", "FANUC"],
      "reference": {
        "name": "[Reference Name]",
        "title": "[Title]",
        "phone": "[Phone]",
        "email": "[Email]"
      }
    },
    ...
  ]
}
```

---

## 6. Pricing Intelligence

### GET /api/pricing/labor-rates
Returns current labor rate schedule.

### GET /api/pricing/equipment?category={category}&search={term}
Search equipment pricing.

**Example:**
```
GET /api/pricing/equipment?category=Robot&search=FANUC

Response:
{
  "items": [
    {
      "description": "FANUC M-710iC/50 Robot",
      "unit_cost": 45000.00,
      "unit_price": 58500.00,
      "margin_pct": 30.0
    },
    {
      "description": "FANUC ARC Mate 100iD Welding Robot",
      "unit_cost": 52000.00,
      "unit_price": 67600.00,
      "margin_pct": 30.0
    },
    ...
  ]
}
```

### GET /api/pricing/similar-contracts?naics={naics}&min_value={min}&max_value={max}
Find similar historical contracts for pricing guidance.

### POST /api/pricing/estimate
Generate pricing estimate based on scope.

**Request:**
```json
{
  "project_type": "robotic_welding_cell",
  "equipment": [
    {"item": "FANUC ARC Mate 100iD", "quantity": 1},
    {"item": "Lincoln Power Wave S500", "quantity": 1},
    {"item": "Servo Positioner 2000kg", "quantity": 1}
  ],
  "labor_hours": {
    "engineering": 400,
    "programming": 200,
    "installation": 160,
    "training": 40
  },
  "travel_trips": 3,
  "target_margin": 25
}
```

**Response:**
```json
{
  "estimate": {
    "equipment_cost": 107000,
    "equipment_price": 139100,
    "labor_cost": 64000,
    "labor_price": 96000,
    "travel_cost": 4500,
    "travel_price": 5850,
    "total_cost": 175500,
    "total_price": 241000,
    "margin_pct": 27.2,
    "similar_contracts": [
      {
        "project_name": "Robotic Welding Cell - Automotive",
        "value": 450000,
        "relevance": "High"
      }
    ],
    "price_recommendation": "Based on similar projects, recommended range: $220K-$280K"
  }
}
```

---

## 7. Boilerplate Content

### GET /api/boilerplate
Returns all active boilerplate sections.

### GET /api/boilerplate/{section_name}
Returns specific boilerplate section.

### GET /api/boilerplate/by-type?type={section_type}
Returns boilerplate sections by type (Overview, Technical, Management, Quality, Risk).

---

## 8. Proposal Generation

### POST /api/proposal/generate
**Main endpoint for proposal generation.**

**Request:**
```json
{
  "opportunity_id": 123,
  "template": "Technical_Management",
  "solicitation_number": "TACOM-FY25-WELD",
  "title": "Army Depot Welding Cells",
  "agency": "US Army TACOM",
  "naics": "333249",
  "contract_value": 1800000,
  "requirements": {
    "technical_keywords": ["welding", "robotic", "vision", "safety"],
    "personnel_roles": ["Program Manager", "Technical Lead", "Operations Lead", "QA Manager"],
    "past_perf_count": 3
  },
  "custom_content": {
    "understanding": "US Army TACOM requires automated welding cells for depot operations...",
    "solution_highlights": ["FANUC platform", "80% cycle time reduction", "integrated vision QC"]
  }
}
```

**Response:**
```json
{
  "proposal_id": "PROP-2026-001",
  "status": "generated",
  "sections": [
    {
      "number": "1",
      "title": "Executive Summary",
      "content": "[Generated content with company data merged]",
      "word_count": 450
    },
    {
      "number": "2", 
      "title": "Technical Approach",
      "content": "[Generated content]",
      "word_count": 1200
    },
    ...
  ],
  "personnel_assigned": [
    {"role": "Program Manager", "name": "David Mih", "source": "auto-matched"},
    {"role": "Technical Lead", "name": "Soorya Sridhar", "source": "auto-matched"}
  ],
  "past_performance_matched": [
    {"id": 1, "project": "Robotic Welding Cell", "relevance_score": 0.95}
  ],
  "pricing_estimate": {
    "total": 1800000,
    "breakdown": {...}
  },
  "export_formats": ["docx", "pdf", "markdown"],
  "gamma_export_url": "/api/proposal/PROP-2026-001/export/markdown"
}
```

### GET /api/proposal/{id}/export/{format}
Export generated proposal in specified format.

---

## 9. Proposal Section Generation (Detailed)

### POST /api/proposal/section/executive-summary
Generate just the executive summary section.

### POST /api/proposal/section/technical-approach
Generate technical approach with equipment specs from pricing DB.

### POST /api/proposal/section/key-personnel
Auto-assign and format key personnel section.

**Request:**
```json
{
  "roles_needed": ["Program Manager", "Technical Lead", "Operations Lead", "QA Manager"],
  "format": "table"
}
```

**Response:**
```json
{
  "section_content": "...",
  "personnel_table": [
    {
      "role": "Program Manager",
      "name": "David Mih",
      "title": "COO / General Manager",
      "responsibility": "Overall program responsibility...",
      "experience": "15+ years",
      "qualifications": "MANN+HUMMEL, Magneti Marelli, MPG, AAM; 4 plant launches"
    },
    ...
  ]
}
```

### POST /api/proposal/section/past-performance
Auto-select and format past performance section.

**Request:**
```json
{
  "match_criteria": {
    "tags": ["welding", "robotics"],
    "naics": "333249",
    "min_value": 100000
  },
  "count": 3,
  "format": "detailed"
}
```

---

## 10. Implementation Notes

### Database Queries for Proposal Generation

**Get relevant past performance:**
```sql
SELECT * FROM contracts 
WHERE status = 'COMPLETE'
  AND (relevance_tags LIKE '%welding%' OR relevance_tags LIKE '%robotics%')
  AND naics_code = '333249'
ORDER BY contract_value DESC
LIMIT 3;
```

**Get personnel for role:**
```sql
SELECT * FROM key_personnel
WHERE proposal_role = 'Program Manager'
  AND is_key_personnel = TRUE;
```

**Get equipment pricing:**
```sql
SELECT * FROM line_items
WHERE category = 'EQUIPMENT'
  AND is_standard_item = TRUE
  AND description LIKE '%FANUC%welding%';
```

**Get boilerplate:**
```sql
SELECT * FROM boilerplate
WHERE section_name IN ('company_overview', 'value_proposition', 'technical_methodology')
  AND is_active = TRUE;
```

---

## 11. Gamma Export Format

For export to Gamma, return clean markdown with clear section headers:

```markdown
# Technical and Management Proposal
## Army Depot Welding Cells (Forecast)

**Solicitation:** TACOM-FY25-WELD | **CAGE:** 86VF7 | **UEI:** GJ1DPYQ3X8K5

---

## Executive Summary

Singh Automation LLC proposes a turnkey automation solution...

[Content with all placeholders filled from database]

---

## Technical Approach

### System Architecture

| Component | Specification |
|-----------|---------------|
| Robot Platform | FANUC ARC Mate 100iD |
| Controller | FANUC R-30iB Plus |
| Welding Power | Lincoln Power Wave S500 |

[Continue with populated data]

---

## Key Personnel

| Role | Name | Experience | Qualifications |
|------|------|------------|----------------|
| Program Manager | David Mih | 15+ years | MANN+HUMMEL, Marelli, 4 plant launches |

[Populated from key_personnel table]

---

## Past Performance

### Reference 1: Robotic Welding Cell - Automotive Assembly
- **Client:** Major Automotive Tier 1
- **Value:** $450,000
- **Period:** March 2023 - September 2023
- **Relevance:** Direct match - robotic welding cell integration

[Populated from contracts table]
```

---

## 12. Error Handling

All endpoints return standard error format:
```json
{
  "error": true,
  "code": "PAST_PERF_NOT_FOUND",
  "message": "No past performance matches the criteria. Consider broadening search tags.",
  "suggestions": ["Remove min_value filter", "Add related tags: automation, manufacturing"]
}
```

---

## 13. Webhook for Proposal Updates

### POST /api/webhooks/proposal-status
Notify when proposal data needs refresh (e.g., new contract completed, personnel change).

---

*End of API Specification*
