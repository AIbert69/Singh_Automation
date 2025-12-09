export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    
    const body = req.method === 'POST' ? (req.body || {}) : req.query;
    const title = body.title || 'Untitled Project';
    const agency = body.agency || 'Federal Agency';
    const solicitation = body.solicitation || 'TBD';
    const value = Number(String(body.value || 350000).replace(/[^0-9]/g, '')) || 350000;
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const proposal = `# Technical Proposal for ${title}

## Solicitation Information
- **Solicitation Number:** ${solicitation}
- **Agency:** ${agency}
- **Submitted by:** Singh Automation
- **Date:** ${today}
- **Contact:** Kalamazoo, MI (HQ) | Irvine, CA (Sales)
- **UEI:** GJ1DPYQ3X8K5 | **CAGE:** 86VF7

---

## 1. Executive Summary

Singh Automation is pleased to submit this proposal in response to ${agency}'s requirement for ${title}.

As an authorized FANUC and Universal Robots (UR) system integrator with extensive experience in manufacturing automation, Singh Automation is uniquely positioned to deliver a turnkey solution that:

- Meets or exceeds all technical and performance requirements
- Integrates seamlessly with existing operations and safety standards
- Provides a robust platform for future automation expansion

Our proposed solution combines proven industrial robotic platforms with AI-enabled vision systems and modern controls architecture. With engineering headquarters in Kalamazoo, MI and sales/support operations in Irvine, CA, we provide responsive regional coverage and ongoing lifecycle support.

**Estimated Project Value:** $${value.toLocaleString()}

This investment includes engineering, equipment, integration, installation, training, and documentation.

---

## 2. Technical Approach

### 2.1 System Design

The proposed system will be designed as a fully integrated, safety-compliant automation solution leveraging industry-standard components:

**Robotics Platform:**
- FANUC 6-axis industrial robots for high-payload, high-precision applications
- Universal Robots (UR) collaborative robots for flexible, human-adjacent operations
- Robot selection optimized for payload capacity, reach envelope, and cycle-time requirements

**Vision & Sensing:**
- AI-enabled machine vision for part detection, orientation, and quality inspection
- High-resolution industrial cameras with appropriate lighting solutions
- Optional laser tracking for dynamic path correction and seam tracking

**Controls & HMI:**
- Allen-Bradley or Siemens PLC platform based on customer preference and existing infrastructure
- Industrial HMI touchscreen for operator interface, job selection, and status monitoring
- Full integration with safety PLC and emergency stop circuits
- Network connectivity for remote diagnostics and data collection

**Cell Infrastructure:**
- Custom-designed fixtures and tooling optimized for target applications
- Perimeter guarding with safety-rated access doors and light curtains
- Lockout/tagout provisions and safety signage per OSHA requirements
- Utility connections (electrical, pneumatic, network) with proper cable management

### 2.2 Implementation Phases

**Phase 1: Discovery & Design (Weeks 1-4)**
- Detailed requirements gathering and on-site assessment
- Development of system architecture and functional design specification
- 3D layout and simulation for cycle time validation
- Design review and approval with customer stakeholders

**Phase 2: Fabrication & Build (Weeks 5-10)**
- Procurement of robots, controls, and major components
- Fabrication of custom fixtures, guarding, and panels
- Controls panel build and initial software development
- Component-level testing and quality verification

**Phase 3: Integration & FAT (Weeks 11-14)**
- Complete mechanical and electrical integration at Singh facility
- Robot programming and path optimization
- Vision system calibration and algorithm tuning
- Formal Factory Acceptance Test (FAT) with customer witness

**Phase 4: Installation & SAT (Weeks 15-18)**
- Shipment and on-site installation
- Power-up, I/O checkout, and system commissioning
- Operator and maintenance training
- Site Acceptance Test (SAT) and performance validation

**Phase 5: Support & Optimization (Ongoing)**
- Warranty support per contract terms
- Optional preventive maintenance program
- Production optimization and continuous improvement support

### 2.3 Quality Assurance

All work will be performed under Singh Automation's quality management system:
- Documented design and engineering change control
- Incoming inspection for critical components
- Standardized test procedures for FAT and SAT
- Complete as-built documentation package

---

## 3. Management Approach

### 3.1 Project Management

Singh Automation employs a formal project management methodology aligned with PMI best practices:

- **Scope Management:** Detailed requirements documentation and change control process
- **Schedule Management:** Milestone-based project plan with weekly status tracking
- **Risk Management:** Risk register maintained from project kickoff with mitigation actions
- **Communication:** Weekly status reports and monthly executive summaries

### 3.2 Key Personnel

**Project Manager**
- 15+ years experience in automation project delivery
- Responsible for scope, schedule, budget, and customer communication
- Single point of contact for all project matters

**Lead Robotics Engineer**
- FANUC and UR certified programmer
- Responsible for robot selection, programming, and optimization
- Expert in welding, material handling, and assembly applications

**Controls Engineer**
- Allen-Bradley and Siemens certified
- Responsible for PLC/HMI programming and safety system design
- Experience with industrial networks and MES integration

**Vision Systems Engineer**
- Expert in machine vision and AI-based inspection
- Responsible for camera selection, lighting design, and algorithm development
- Experience with Cognex, Keyence, and custom vision solutions

### 3.3 Communication Plan

- Weekly project status calls during active phases
- Monthly executive summary reports
- 24/7 emergency contact during installation and ramp-up
- Shared document repository for drawings, submittals, and reports

---

## 4. Past Performance

### Project 1: Robotic Welding Cell - Automotive Tier-1 Supplier
- **Contract Value:** $425,000
- **Scope:** Design and integration of dual-robot welding cell with vision-guided seam tracking, multi-fixture positioning, and automated part handling
- **Results:** 35% reduction in cycle time, 99.8% first-pass weld quality, elimination of manual rework station
- **Timeline:** Delivered on schedule, commissioned in 16 weeks

### Project 2: Vision Inspection System - Aerospace Composites Manufacturer
- **Contract Value:** $280,000
- **Scope:** AI-powered defect detection system for carbon fiber components with high-resolution imaging, custom ML models, and MES integration
- **Results:** 99.7% defect detection rate, 60% reduction in inspection time, full traceability integration
- **Timeline:** Delivered 2 weeks early with expanded detection capabilities

### Project 3: Conveyor & Palletizing System - Food & Beverage Facility
- **Contract Value:** $350,000
- **Scope:** High-speed conveyor system with robotic palletizing, case packing, and automated stretch wrapping
- **Results:** 50% increase in throughput, seamless integration with existing plant controls, reduced labor requirements
- **Timeline:** Delivered on schedule with zero safety incidents

---

## 5. Corporate Capability

### Company Overview
Singh Automation is a certified small business specializing in industrial automation, robotics integration, and manufacturing systems. Founded with a mission to bring world-class automation solutions to manufacturers of all sizes.

### Core Competencies
- Robotic welding and joining systems
- Material handling and palletizing
- Machine vision and AI-based inspection
- PLC/HMI controls and safety systems
- Turnkey cell design and integration

### Registrations & Certifications
- **UEI:** GJ1DPYQ3X8K5
- **CAGE Code:** 86VF7
- **NAICS Codes:** 333249, 333922, 541330, 541512, 541715, 238210
- **Certifications:** Small Business, MBE, WBENC
- **Partnerships:** FANUC Authorized Integrator, Universal Robots Certified Partner

### Facilities
- **Headquarters:** Kalamazoo, MI - Engineering, integration, and testing
- **Sales Office:** Irvine, CA - West coast sales and customer support

---

## 6. Pricing Summary

| Category | Amount | Percentage |
|----------|--------|------------|
| Engineering & Design | $${Math.round(value * 0.15).toLocaleString()} | 15% |
| Equipment & Materials | $${Math.round(value * 0.45).toLocaleString()} | 45% |
| Integration & Programming | $${Math.round(value * 0.25).toLocaleString()} | 25% |
| Installation & Commissioning | $${Math.round(value * 0.10).toLocaleString()} | 10% |
| Training & Documentation | $${Math.round(value * 0.05).toLocaleString()} | 5% |
| **Total Proposed Price** | **$${value.toLocaleString()}** | **100%** |

*Pricing is based on preliminary scope understanding and is subject to adjustment following detailed requirements review.*

---

## 7. Conclusion

Singh Automation is committed to delivering a high-quality automation solution that meets ${agency}'s requirements for ${title}. Our combination of technical expertise, proven past performance, and customer-focused approach makes us an ideal partner for this project.

We welcome the opportunity to discuss our proposal and answer any questions.

**Singh Automation**
Kalamazoo, MI (Headquarters) | Irvine, CA (Sales & Support)
UEI: GJ1DPYQ3X8K5 | CAGE: 86VF7
`;

    return res.status(200).json({ success: true, proposal: proposal, method: 'template' });
}
