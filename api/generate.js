// Singh Automation Proposal Generator API
// Deploy to: /api/generate.js on Vercel

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    
    try {
        // Get opportunity from request
        const body = req.method === 'POST' ? req.body : req.query;
        const opportunity = body.opportunity || body;
        
        if (!opportunity.title) {
            return res.status(400).json({ error: 'Missing opportunity title' });
        }
        
        // Parse value if string
        let value = opportunity.value || 350000;
        if (typeof value === 'string') {
            value = parseInt(value.replace(/[^0-9]/g, '')) || 350000;
        }
        
        const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        
        // Generate proposal markdown
        const proposal = `# Technical Proposal for ${opportunity.title}

## Solicitation Information
- **Solicitation:** ${opportunity.solicitation || 'TBD'}
- **Agency:** ${opportunity.agency || 'TBD'}
- **Submitted by:** Singh Automation
- **Date:** ${today}

### Primary Contact
Singh Automation
Kalamazoo, MI (Headquarters) | Irvine, CA (Sales)
UEI: GJ1DPYQ3X8K5 | CAGE: 86VF7

---

## 1. Executive Summary

Singh Automation is pleased to submit this proposal in response to ${opportunity.agency || 'the agency'}'s requirement for ${opportunity.title}.

As an authorized FANUC and Universal Robots (UR) system integrator with extensive experience in manufacturing automation, Singh Automation is well positioned to deliver a turnkey solution that meets or exceeds all technical and performance requirements, integrates cleanly with existing operations and safety standards, and provides a robust platform for future automation expansion.

Our proposed solution combines proven industrial robotic platforms with AI-enabled vision systems and modern controls architecture. With engineering based in Kalamazoo, MI and sales and support in Irvine, CA, we provide responsive regional coverage and ongoing lifecycle support.

The estimated value of this project is $${value.toLocaleString()}, inclusive of engineering, equipment, integration, installation, and training. Singh Automation is committed to delivering a system that improves quality, increases throughput, and reduces manual rework.

---

## 2. Technical Approach

### 2.1 System Design

The proposed system will be designed as a fully integrated, safety-compliant solution leveraging industry-standard components:

- **Robotics:** FANUC 6-axis industrial robot and/or Universal Robots collaborative robot (UR), selected to match payload, reach, and cycle-time requirements.
- **Vision & Sensing:** AI-enabled machine vision for part detection, quality inspection, and guidance. Optional laser tracking for dynamic path correction.
- **Controls & HMI:** Allen-Bradley or Siemens PLC platform. Industrial HMI for operator interface, job selection, and status monitoring.
- **Cell Infrastructure:** Custom fixtures and tooling designed for target applications. Perimeter guarding, safety devices, and lockout/tagout hardware.
- **Integration:** Interface to existing equipment and upstream/downstream systems where applicable.

### 2.2 Implementation Phases

Singh Automation will deliver the project in clearly defined phases with milestone reviews:

**Phase 1: Discovery & Design (Weeks 1-4)**
- Detailed requirements gathering and on-site assessment
- Development of system architecture, layout, and functional design specifications
- Design reviews and approvals with stakeholders

**Phase 2: Fabrication & Build (Weeks 5-10)**
- Procurement of robots, controls, and components
- Fabrication of fixtures, guarding, and panels
- Controls panel build and software development

**Phase 3: Integration & FAT (Weeks 11-14)**
- Complete mechanical and electrical integration at Singh Automation facility
- Programming and testing
- Formal Factory Acceptance Test (FAT) with customer witness

**Phase 4: Installation & SAT (Weeks 15-18)**
- Delivery and on-site installation
- Power-up, I/O checkout, and system commissioning
- Site Acceptance Test (SAT) to validate performance

**Phase 5: Support & Optimization (Post-Installation)**
- Warranty support for the defined period
- Optional preventive-maintenance program
- Process optimization support as new applications are introduced

### 2.3 Quality Assurance

Quality will be managed through a structured process aligned with ISO 9001 principles:
- Documented design and engineering change control
- Standardized test plans for FAT and SAT
- Traceable issue tracking and resolution
- Comprehensive as-built documentation

---

## 3. Management Approach

### 3.1 Project Management

Singh Automation will employ a formal project management framework aligned with PMI best practices:
- Defined scope, schedule, and budget baseline
- Milestone-based project plan with clear deliverables
- Weekly status reports summarizing progress, risks, and actions
- Formal review gates at the end of the Design, FAT, and SAT phases

### 3.2 Key Personnel

- **Project Manager:** Over 15 years in automation and integration projects
- **Lead Robotics Engineer:** FANUC/UR certified
- **Controls Engineer:** PLC/HMI specialist
- **Vision Systems Specialist:** Expert in AI/ML-based vision

### 3.3 Communication Plan

- Weekly project calls during design, build, and commissioning
- Monthly executive summaries highlighting key milestones
- Shared project document portal for drawings, schedules, and test reports
- 24/7 support during installation and initial production ramp-up

---

## 4. Past Performance

**Project 1: Robotic Welding Cell - Automotive Tier-1 Supplier**
- Contract Value: $425,000
- Scope: Design and integration of a 6-axis robotic welding cell with vision-guided seam tracking
- Outcomes: 35% reduction in cycle time, 99.8% first-pass weld quality

**Project 2: Vision Inspection System - Aerospace Manufacturer**
- Contract Value: $280,000
- Scope: AI-driven defect detection system for composite components
- Outcomes: 99.7% defect detection rate, 60% reduction in inspection time

**Project 3: Conveyor Automation - Food & Beverage Facility**
- Contract Value: $350,000
- Scope: High-speed conveyor and sorting system with product tracking
- Outcomes: 50% increase in throughput, seamless MES integration

---

## 5. Corporate Capability

**Company Data:**
- UEI: GJ1DPYQ3X8K5
- CAGE: 86VF7
- NAICS: 333249, 333922, 541330, 541512, 541715, 238210

**Certifications:**
- FANUC Authorized System Integrator
- Universal Robots Certified Partner
- MBE Certified
- WBENC Certified

**Locations:**
- Headquarters: Kalamazoo, MI
- Sales & Support: Irvine, CA

---

## 6. Pricing Summary

| Category | Amount | % |
|----------|--------|---|
| Engineering & Design | $${Math.round(value * 0.15).toLocaleString()} | 15% |
| Equipment & Materials | $${Math.round(value * 0.45).toLocaleString()} | 45% |
| Integration & Programming | $${Math.round(value * 0.25).toLocaleString()} | 25% |
| Installation & Commissioning | $${Math.round(value * 0.10).toLocaleString()} | 10% |
| Training & Documentation | $${Math.round(value * 0.05).toLocaleString()} | 5% |
| **Total** | **$${value.toLocaleString()}** | **100%** |

---

## 7. Contact

**Singh Automation**
Kalamazoo, MI (HQ) | Irvine, CA (Sales)
UEI: GJ1DPYQ3X8K5 | CAGE: 86VF7

We appreciate the opportunity to propose on this project.`;

        return res.status(200).json({ 
            success: true, 
            proposal: proposal,
            method: 'template'
        });
        
    } catch (error) {
        console.error('Generate error:', error);
        return res.status(500).json({ error: error.message });
    }
}
