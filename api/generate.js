// Singh Automation Proposal Generator API
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    
    try {
        const body = req.method === 'POST' ? req.body : req.query;
        const title = body.title || 'Untitled Project';
        const agency = body.agency || 'Federal Agency';
        const solicitation = body.solicitation || 'TBD';
        let value = parseInt(String(body.value || 350000).replace(/[^0-9]/g, '')) || 350000;
        
        const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        
        const proposal = `# Technical Proposal for ${title}

## Solicitation Information
- **Solicitation:** ${solicitation}
- **Agency:** ${agency}
- **Submitted by:** Singh Automation
- **Date:** ${today}

**Contact:** Singh Automation | Kalamazoo, MI (HQ) | Irvine, CA (Sales)
**UEI:** GJ1DPYQ3X8K5 | **CAGE:** 86VF7

---

## 1. Executive Summary

Singh Automation is pleased to submit this proposal for ${title}. As an authorized FANUC and Universal Robots integrator, we deliver turnkey automation solutions that meet technical requirements, integrate with existing operations, and provide a platform for future expansion.

**Estimated Value:** $${value.toLocaleString()}

---

## 2. Technical Approach

### 2.1 System Design
- **Robotics:** FANUC 6-axis / Universal Robots collaborative robots
- **Vision:** AI-enabled machine vision for inspection and guidance
- **Controls:** Allen-Bradley or Siemens PLC with industrial HMI
- **Infrastructure:** Custom fixtures, safety guarding, utility connections

### 2.2 Implementation Phases
- **Phase 1 (Weeks 1-4):** Discovery & Design
- **Phase 2 (Weeks 5-10):** Fabrication & Build
- **Phase 3 (Weeks 11-14):** Integration & FAT
- **Phase 4 (Weeks 15-18):** Installation & SAT
- **Phase 5:** Support & Optimization

---

## 3. Management Approach

- Formal PM framework aligned with PMI best practices
- Weekly status reports and milestone reviews
- Risk register maintained from kickoff
- 24/7 support during installation

**Key Personnel:** Project Manager, Lead Robotics Engineer, Controls Engineer, Vision Specialist

---

## 4. Past Performance

**Robotic Welding Cell - Automotive Tier-1** | $425,000
- 35% cycle time reduction, 99.8% first-pass quality

**Vision Inspection - Aerospace** | $280,000
- 99.7% defect detection, 60% faster inspection

**Conveyor Automation - Food & Beverage** | $350,000
- 50% throughput increase, seamless MES integration

---

## 5. Corporate Capability

- **UEI:** GJ1DPYQ3X8K5 | **CAGE:** 86VF7
- **NAICS:** 333249, 333922, 541330, 541512, 541715, 238210
- **Certs:** FANUC ASI, UR Certified, MBE, WBENC
- **Locations:** Kalamazoo, MI (HQ) | Irvine, CA (Sales)

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

*Singh Automation appreciates the opportunity to propose on this project.*`;

        return res.status(200).json({ success: true, proposal: proposal, method: 'template' });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
