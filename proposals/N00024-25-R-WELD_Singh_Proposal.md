# PROPOSAL

## Robotic Welding Cell for Ship Hull Repair
### Solicitation N00024-25-R-WELD

**Submitted to:**
Naval Sea Systems Command (NAVSEA)
Norfolk Naval Shipyard

**Submitted by:**
Singh Automation
1234 Industrial Parkway
Kalamazoo, MI 49001

**Date:** January 2025
**Total Price:** $925,000 (Firm Fixed Price)

---

# VOLUME I: COVER LETTER

---

**SINGH AUTOMATION**
1234 Industrial Parkway
Kalamazoo, MI 49001
Tel: (269) 555-1234

January 5, 2025

Contracting Officer
Naval Sea Systems Command
Norfolk Naval Shipyard
Norfolk, VA 23709

**RE: Solicitation N00024-25-R-WELD**
**Robotic Welding Cell for Ship Hull Repair**

Dear Contracting Officer:

Singh Automation is pleased to submit our proposal for the design, fabrication, delivery, installation, and commissioning of a robotic MIG welding cell for Norfolk Naval Shipyard.

As a certified Small Business with 15+ years of robotic integration experience, we offer:

- **FANUC Authorized System Integrator** status with proven robot deployment
- **In-house UL 508A panel shop** for control system fabrication
- **Allen-Bradley/Rockwell expertise** for PLC and safety system programming
- **Full-service capability** from design through training and warranty support

Our firm fixed price of **$925,000** includes all equipment, engineering, installation, training, documentation, and 1-year warranty coverage.

We confirm availability to begin work within 10 days of award and deliver a fully operational system within 16 weeks.

Singh Automation understands the Navy's mission requirements and is committed to delivering a reliable, maintainable welding cell that will serve Norfolk Naval Shipyard for years to come.

Respectfully submitted,

**Gurdeep Singh**
Owner, Singh Automation
gsingh@singhautomation.com
(269) 555-1234

---

# VOLUME II: TECHNICAL PROPOSAL

---

## Section 3: Technical Approach

### 3.1 System Overview

Singh Automation proposes a turnkey robotic MIG welding cell engineered for steel hull plate fabrication at Norfolk Naval Shipyard. Our solution integrates proven industrial components with Navy-specific requirements for reliability, maintainability, and operator safety.

#### Proposed System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    ROBOTIC WELDING CELL                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   FANUC      │    │   2-AXIS     │    │   LINCOLN    │      │
│  │  ArcMate     │◄──►│  POSITIONER  │    │  POWER WAVE  │      │
│  │   100iD      │    │  2,500 lb    │    │    455M      │      │
│  └──────┬───────┘    └──────────────┘    └──────┬───────┘      │
│         │                                        │              │
│         ▼                                        ▼              │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              UL 508A CONTROL PANEL                      │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │    │
│  │  │ CompactLogix│  │ GuardLogix  │  │ PanelView   │     │    │
│  │  │    5380     │  │   Safety    │  │  Plus 7     │     │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  SAFETY PERIMETER: Light curtains + hard guarding       │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

### 3.1.1 Robot Selection: FANUC ArcMate 100iD

| Specification | Value | Requirement Met |
|---------------|-------|-----------------|
| Payload | 12 kg | Exceeds torch + cable weight |
| Reach | 1,632 mm | Full positioner coverage |
| Repeatability | ±0.03 mm | Precision weld placement |
| Axes | 6 | Full dexterity for complex welds |
| IP Rating | IP67 | Weld environment rated |
| Controller | R-30iB Plus | Current generation |

**Why FANUC:** Industry-leading reliability (400,000+ hr MTBF), extensive Navy shipyard install base, strong domestic support network. Singh Automation is a FANUC Authorized System Integrator with 15+ years integration experience.

---

### 3.1.2 Positioner: 2-Axis Headstock/Tailstock

| Specification | Value |
|---------------|-------|
| Capacity | 2,500 lb (exceeds 2,000 lb requirement) |
| Tilt Range | +90° / -45° |
| Rotation | 360° continuous |
| Drive | Servo (integrated with robot controller) |
| Table Size | 48" x 60" |

The positioner enables single-setup welding of hull plate assemblies, reducing handling and improving weld quality through optimal torch angles for all weld joints.

---

### 3.1.3 Welding Equipment

**Power Source: Lincoln Electric Power Wave 455M**
- 450A @ 100% duty cycle (exceeds 500A intermittent requirement)
- Advanced waveform control for steel (spray, pulse, STT modes)
- PowerConnect for automatic voltage sensing
- Production Monitoring capability for weld data logging

**Wire Feeder: Lincoln Power Feed 84**
- Dual-drive, industrial duty
- Digital interface to Power Wave
- Reliable wire feed for extended production runs

**Torch: Binzel ABIROB W 600 (water-cooled)**
- 600A rating, continuous duty
- Quick-change consumables for minimal downtime
- Integrated crash sensor protection

**Consumables Specification:**
- Wire: ER70S-6, 0.045" diameter
- Gas: 90% Argon / 10% CO2 (C10)
- Suitable for 3/8" to 1" steel per AWS D1.1

---

### 3.2 Controls Architecture

#### 3.2.1 PLC: Allen-Bradley CompactLogix 5380

| Component | Part Number | Function |
|-----------|-------------|----------|
| CPU | 5069-L320ER | Main processor, 2MB memory |
| Safety Partner | 5069-L306ERS2 | GuardLogix safety CPU |
| Digital I/O | 5069-IB16 / OB16 | Field device interface |
| Analog I/O | 5069-IF8 | Process monitoring |
| Communications | Embedded | EtherNet/IP for all devices |

#### 3.2.2 HMI: PanelView Plus 7 (15" widescreen)

The operator interface provides:
- Job selection and weld schedule recall
- Real-time weld parameter display (amps, volts, WFS)
- Alarm history and diagnostics
- Production counting and tracking
- USB port for program backup

#### 3.2.3 Communications Architecture

```
┌─────────────┐     EtherNet/IP      ┌─────────────┐
│   FANUC     │◄────────────────────►│ CompactLogix│
│ Controller  │                      │    PLC      │
└─────────────┘                      └──────┬──────┘
                                            │
       ┌────────────────┬───────────────────┼───────────────┐
       │                │                   │               │
       ▼                ▼                   ▼               ▼
┌───────────┐    ┌───────────┐      ┌───────────┐   ┌───────────┐
│  Lincoln  │    │ PanelView │      │ GuardLogix│   │  Remote   │
│Power Wave │    │    HMI    │      │  Safety   │   │   I/O     │
└───────────┘    └───────────┘      └───────────┘   └───────────┘
```

All communications utilize industrial EtherNet/IP protocol for reliability and ease of diagnostics.

---

### 3.3 Safety Systems

#### 3.3.1 Risk Assessment

Singh Automation will perform a comprehensive risk assessment per:
- **ISO 12100** - General principles for design
- **ISO 10218-1/2** - Robot safety requirements
- **ANSI/RIA 15.06** - Industrial robot safety (US standard)
- **OSHA 1910.212** - Machine guarding requirements
- **NFPA 79** - Electrical standard for industrial machinery

Complete risk assessment documentation will be delivered with O&M manuals.

#### 3.3.2 Safety Controls: GuardLogix (SIL 2 / PLd)

| Safety Function | Implementation |
|-----------------|----------------|
| E-Stop | Category 0 stop, hardwired + safety PLC monitored |
| Guard Doors | Safety-rated interlocks with key-transfer system |
| Light Curtains | Type 4, at entry points, muting during auto cycle |
| Perimeter | Fixed steel mesh fencing, 6' height minimum |
| Two-Hand Control | Required for teach pendant operation |
| Speed Monitoring | Reduced speed in manual mode |

#### 3.3.3 Weld-Specific Safety

- Amber welding curtains on all open sides
- Fume extraction connection points provided
- Arc flash detection with robot pause
- Grounding studs per NFPA 79
- Fire extinguisher mounting location

---

### 3.4 Project Execution Plan

#### 3.4.1 Schedule (16 Weeks Total)

```
Week:  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16
       ├──┴──┴──┴──┤                                    Design
                   ├──┴──┴──┴──┴──┤                     Fabrication
                                  ├──┴──┤              Integration
                                        ├──┤           FAT
                                           ├──┤        Ship/Install
                                              ├──┴──┤  SAT/Training
                                                    ├─ Handoff
```

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Design | Weeks 1-4 | Approval drawings, panel layout, BOM, safety plan |
| Fabrication | Weeks 5-9 | Control panel, guarding, base frame, fixtures |
| Integration | Weeks 10-11 | Robot mount, wiring, PLC/robot programming |
| FAT | Week 12 | Customer witness test at Singh facility |
| Delivery | Week 13 | Rigging, transport to Norfolk Naval Shipyard |
| Installation | Weeks 13-14 | Anchor, connect, power-up, I/O checkout |
| SAT | Week 15 | Acceptance testing per approved ATP |
| Training | Week 16 | Operator (40 hr) + Maintenance (16 hr) training |

#### 3.4.2 Logistics

- **Origin:** Singh Automation, Kalamazoo, MI
- **Destination:** Norfolk Naval Shipyard, VA
- **Transport:** Flatbed truck, weather-protected
- **Rigging:** 20-ton crane required (Navy-provided or Singh rental)

#### 3.4.3 Installation Plan

| Day | Activity |
|-----|----------|
| 1 | Receive shipment, stage equipment, verify utilities available |
| 2 | Set robot base and positioner, anchor to floor |
| 3 | Set control panel, run conduit and cables |
| 4 | Power-up, I/O checkout, safety system verification |
| 5 | Weld tests, parameter tuning, final adjustments |

#### 3.4.4 Factory Acceptance Test (FAT)

FAT will be conducted at Singh Automation's facility in Kalamazoo, MI. Navy representatives are invited to witness. Test protocol includes:

- Power-up and safety system verification
- Robot motion and positioner coordination
- Weld parameter verification on test plates
- Cycle time demonstration
- HMI functionality review
- Documentation review

#### 3.4.5 Site Acceptance Test (SAT)

SAT will be conducted at Norfolk Naval Shipyard after installation. Test protocol includes:

- All FAT tests repeated on-site
- Integration with facility utilities
- Production weld demonstration on actual hull plate material
- Operator proficiency verification
- Final punch list and closeout

---

### 3.5 Training

#### Operator Training (40 hours / 5 days)

| Day | Topic |
|-----|-------|
| 1 | Safety procedures, system overview, power-up/shutdown sequences |
| 2 | HMI operation, job selection, part loading procedures |
| 3 | Weld schedules, parameter adjustment, quality inspection |
| 4 | Basic troubleshooting, alarm recovery, consumable replacement |
| 5 | Hands-on practice with supervision, proficiency evaluation |

**Attendees:** Up to 8 operators
**Location:** Norfolk Naval Shipyard (on the installed equipment)
**Materials:** Training manual, quick reference cards, certificate of completion

#### Maintenance Training (16 hours / 2 days)

| Day | Topic |
|-----|-------|
| 1 | Preventive maintenance schedule, lubrication, consumable management |
| 2 | Electrical troubleshooting, spare parts identification, PLC diagnostics |

**Attendees:** Up to 4 maintenance technicians
**Materials:** Maintenance manual, PM checklists, troubleshooting guide

---

### 3.6 Documentation Deliverables

| Document | Format | Quantity |
|----------|--------|----------|
| O&M Manual | Hard copy + PDF | 3 hard copies + electronic |
| Electrical Drawings | AutoCAD DWG + PDF | Per NAVSEA standard |
| Mechanical Drawings | AutoCAD DWG + PDF | Per NAVSEA standard |
| PLC Program | Studio 5000 archive | Electronic media |
| Robot Program | FANUC backup | Electronic media |
| Risk Assessment | PDF | Electronic |
| FAT/SAT Test Reports | PDF | Electronic |
| Training Materials | Hard copy + PDF | Per attendee |
| Spare Parts List | Excel + PDF | Electronic |

---

### 3.7 Warranty & Support

| Coverage | Terms |
|----------|-------|
| Duration | 12 months from SAT acceptance date |
| Parts | Full replacement at no charge (excludes consumables) |
| Labor | Included for all warranty repairs |
| Phone Support | 24/7 technical hotline, 4-hour response commitment |
| On-Site Response | 48-hour dispatch for critical down situations |
| Exclusions | Consumables (tips, liners, wire), operator misuse, unauthorized modifications |

**Extended Warranty:** Optional additional years available upon request.

---

# VOLUME III: PAST PERFORMANCE

---

## Section 5: Past Performance

### Contract #1: Multi-Robot Window Automation System

| Field | Details |
|-------|---------|
| **Client** | Lippert Industries |
| **Contract Value** | $1,600,000 |
| **Period of Performance** | January 2024 – September 2024 |
| **Location** | Bristol, Indiana |
| **Point of Contact** | Tim Widner, VP - Glass |
| **Contact Information** | Twidner@lci1.com |

#### Scope of Work

Singh Automation designed, built, and commissioned a 5-robot manufacturing cell for window assembly automation:

| Robot | Function |
|-------|----------|
| 1. Precision Assembly Robot | High-accuracy component assembly |
| 2. Quality Inspection Robot | Vision-based defect detection |
| 3. High-Speed Packaging Robot | Automated packaging operations |
| 4. Material Handling Robot | Inter-station part transfer |
| 5. Custom Design Robot | R&D prototyping support |

#### Technical Similarities to Navy Welding Cell

| Navy Requirement | Lippert Project Experience |
|------------------|---------------------------|
| FANUC robot integration | ✓ Multi-robot FANUC cell with coordinated motion |
| Allen-Bradley PLC/HMI | ✓ CompactLogix + PanelView Plus implementation |
| Safety systems | ✓ Full perimeter guarding, light curtains, E-stops |
| UL 508A control panel | ✓ In-house panel design and fabrication |
| FAT/SAT process | ✓ Customer witness testing with formal acceptance |
| Operator training | ✓ Comprehensive training program delivered |

#### Results Achieved

| Metric | Outcome |
|--------|---------|
| Productivity | Significant throughput increase via automation |
| Quality | 100% inspection via integrated vision system |
| Labor | Reduced manual errors and rework |
| Schedule | On-time delivery (9-month program) |
| Customer Relationship | Ongoing partnership established |

---

### Contract #2: Hot Runner Insulation Retrofit

| Field | Details |
|-------|---------|
| **Sector** | Injection Molding |
| **Application** | Packaging mold, 8-cavity, 250-ton press |
| **Scope** | Thermal insulation retrofit and process optimization |

#### Results Achieved

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Startup Time | 13.28 min | 6.21 min | **-53%** |
| Cycle Time | 7.69 sec | 5.96 sec | **-22%** |
| Payback Period | - | - | **< 1 month** |

*Demonstrates Singh's engineering rigor and measurable results delivery.*

---

### Contract #3: Battery Thermal Runaway Containment

| Field | Details |
|-------|---------|
| **Sector** | Battery Safety / R&D |
| **Application** | Lithium battery thermal runaway containment |
| **Test Configuration** | 25×25 battery array |

#### Results Achieved

| Scenario | Outcome |
|----------|---------|
| Baseline (no protection) | 1 battery ignited remaining 24 within 2 seconds |
| With containment system | Only 1 battery lost; 24 remaining tested good |

*Demonstrates Singh's capability in safety-critical engineering and testing protocols.*

---

# VOLUME IV: KEY PERSONNEL

---

## Section 4: Key Personnel

### Organization Chart

```
                    ┌─────────────────┐
                    │  Mangay Peram   │
                    │ Project Manager │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ Aditya Kurde  │    │Bhargav Nandan │    │ Mayur Joshi   │
│  Controls &   │    │    Gali       │    │ Sony Singh    │
│ Technical Lead│    │Vision Systems │    │Machine Build  │
└───────────────┘    └───────────────┘    └───────────────┘
```

---

### Mangay Peram — Project Manager

**Role on Contract:** Overall project accountability, schedule, budget, customer interface

**Responsibilities:**
- Define project scope, deliverables, and milestones
- Manage schedule, budget, and resource allocation
- Lead customer kickoff, design reviews, FAT/SAT
- Risk identification and mitigation
- Weekly status reporting to Navy COR

**Relevant Experience:**
- Led $1.6M Lippert 5-robot automation project (on-time delivery)
- Multi-site project coordination
- Stakeholder management across engineering and operations

---

### Aditya Kurde — Electrical & Controls Engineer / Technical Lead

**Role on Contract:** Lead engineer for electrical design, PLC programming, robot integration, commissioning

**Core Competencies:**
- Electrical system design (schematics, panel layout, BOM)
- PLC programming (Allen-Bradley CompactLogix, GuardLogix)
- HMI development (PanelView Plus, FactoryTalk)
- Robot integration (FANUC, ABB, KUKA, Yaskawa, UR)
- Safety system design per ISO 13849, ISO 10218, ANSI/RIA R15.06
- Industrial protocols: EtherNet/IP, Profinet, TCP/IP, IO-Link

**Certifications:**
- UL 508A Panel Design
- NFPA 79 Compliance
- Rockwell Automation Certified

**Relevant Experience:**
- Lippert Window Automation — Controls lead, 5-robot integration
- Multiple industrial robot cell commissioning projects
- Safety PLC implementation and validation

---

### Bhargav Nandan Gali — Vision Systems Engineer

**Role on Contract:** Machine vision integration, quality inspection systems

**Core Competencies:**
- Vision system design (Cognex, Keyence, Omron, Banner)
- Camera, lens, and lighting optimization
- Robot-guided vision applications
- Vision-to-PLC integration
- Inspection data logging and reporting

**Relevant Experience:**
- Lippert Quality Inspection Robot — Vision system lead
- Multiple vision-guided pick-and-place implementations

---

### Mayur Joshi — Machine Builder

**Role on Contract:** Mechanical/electrical assembly, wiring, installation support

**Core Competencies:**
- Mechanical assembly per drawings (frames, guarding, tooling, EOAT)
- Electrical wiring per schematics (panels, field devices)
- Robot installation and tool mounting
- I/O checkout and debugging
- On-site installation support

---

### Sony Singh — Machine Builder

**Role on Contract:** Mechanical/electrical assembly, safety device installation, field support

**Core Competencies:**
- Industrial robot cell assembly (FANUC, ABB, KUKA)
- Control panel wiring and termination
- Safety device installation (light curtains, E-stops, interlocks)
- Rigging and equipment transport
- Customer site startup support

---

# VOLUME V: COST PROPOSAL

---

## Section 6: Cost/Price Proposal

### 6.1 Pricing Summary

| CLIN | Description | Qty | Unit Price | Extended |
|------|-------------|-----|------------|----------|
| 0001 | Robotic Welding Cell - Design, Build, Deliver | 1 | $742,500 | $742,500 |
| 0002 | Installation & Commissioning (Norfolk) | 1 | $87,500 | $87,500 |
| 0003 | Training (Operator 40hr + Maintenance 16hr) | 1 | $35,000 | $35,000 |
| 0004 | Documentation Package | 1 | $15,000 | $15,000 |
| 0005 | 1-Year Extended Warranty | 1 | $45,000 | $45,000 |
| | **TOTAL FIRM FIXED PRICE** | | | **$925,000** |

---

### 6.2 CLIN 0001 Cost Breakdown

#### Major Equipment

| Item | Manufacturer | Model | Cost |
|------|--------------|-------|------|
| Robot | FANUC | ArcMate 100iD/12 w/ R-30iB+ | $85,000 |
| Positioner | FANUC | 2-axis, 2,500 lb | $45,000 |
| Welding Power Source | Lincoln | Power Wave 455M/STT | $28,000 |
| Wire Feeder | Lincoln | Power Feed 84 | $4,500 |
| Torch | Binzel | ABIROB W 600 water-cooled | $6,500 |
| Torch Cleaner | Binzel | TC3000 | $8,500 |
| **Subtotal Equipment** | | | **$177,500** |

#### Controls & Electrical

| Item | Description | Cost |
|------|-------------|------|
| Control Panel | UL 508A, 480V main, 120V control | $35,000 |
| PLC | Allen-Bradley CompactLogix 5380 | $8,500 |
| Safety PLC | GuardLogix (safety partner) | $6,500 |
| HMI | PanelView Plus 7 - 15" | $5,500 |
| VFD/Servo Drives | Positioner drives | $12,000 |
| Wiring/Conduit | Field wiring materials | $8,000 |
| **Subtotal Controls** | | **$75,500** |

#### Safety & Guarding

| Item | Description | Cost |
|------|-------------|------|
| Perimeter Fencing | Steel frame, mesh panels, 6' height | $18,000 |
| Light Curtains | Type 4, entry points (2) | $12,000 |
| Safety Interlocks | Door switches, key transfer | $4,500 |
| E-Stop Stations | (4) locations | $2,000 |
| Welding Curtains | Amber, 4 sides | $3,500 |
| Arc Flash Protection | Sensors and controls | $4,500 |
| **Subtotal Safety** | | **$44,500** |

#### Mechanical Fabrication

| Item | Description | Cost |
|------|-------------|------|
| Robot Base/Pedestal | Fabricated steel, machined | $15,000 |
| Positioner Foundation | Anchor frame, leveling | $8,000 |
| Tooling Fixtures | Weld fixtures for hull plates | $25,000 |
| Misc Fab | Brackets, guards, covers | $7,000 |
| **Subtotal Mechanical** | | **$55,000** |

#### Engineering Labor

| Role | Hours | Rate | Cost |
|------|-------|------|------|
| Project Management | 120 | $125 | $15,000 |
| Mechanical Engineering | 160 | $115 | $18,400 |
| Electrical Engineering | 200 | $120 | $24,000 |
| Controls Programming | 240 | $125 | $30,000 |
| Robot Programming | 160 | $130 | $20,800 |
| Safety Engineering | 80 | $115 | $9,200 |
| Documentation | 60 | $95 | $5,700 |
| **Subtotal Engineering** | **1,020 hrs** | | **$123,100** |

#### Integration & Test

| Item | Description | Cost |
|------|-------------|------|
| Shop Assembly | Build, wire, debug | $45,000 |
| FAT | 3-day test with customer witness | $12,500 |
| Consumables | Wire, gas, test plates | $4,500 |
| **Subtotal Integration** | | **$62,000** |

#### CLIN 0001 Summary

| Category | Cost |
|----------|------|
| Equipment | $177,500 |
| Controls | $75,500 |
| Safety | $44,500 |
| Mechanical | $55,000 |
| Engineering | $123,100 |
| Integration | $62,000 |
| **Direct Costs** | **$537,600** |
| G&A (15%) | $80,640 |
| Profit (10%) | $53,760 |
| Contingency (5%) | $26,880 |
| Shipping (MI → VA) | $18,500 |
| Bond (1.5%) | $8,064 |
| Taxes | $0 (Government exempt) |
| **CLIN 0001 Total** | **$742,500** |

---

### 6.3 CLIN 0002 Cost Breakdown (Installation)

| Item | Days | Rate/Day | Cost |
|------|------|----------|------|
| Installation Lead | 10 | $1,200 | $12,000 |
| Electrician | 10 | $950 | $9,500 |
| Machine Builder | 10 | $850 | $8,500 |
| Robot Programmer | 8 | $1,300 | $10,400 |
| Travel (3 crew × 10 days) | - | - | $15,000 |
| Per Diem ($75/day × 3 × 10) | - | - | $2,250 |
| Rental Equipment (rigging) | - | - | $8,500 |
| SAT Execution | 3 | $3,500 | $10,500 |
| Punch List/Closeout | 2 | $1,200 | $2,400 |
| **CLIN 0002 Total** | | | **$87,500** |

---

### 6.4 CLIN 0003 Cost Breakdown (Training)

| Course | Days | Attendees | Cost |
|--------|------|-----------|------|
| Operator Training (40 hr) | 5 | Up to 8 | $25,000 |
| Maintenance Training (16 hr) | 2 | Up to 4 | $10,000 |
| Training Materials | - | - | Included |
| **CLIN 0003 Total** | | | **$35,000** |

---

### 6.5 CLIN 0004 Cost Breakdown (Documentation)

| Deliverable | Cost |
|-------------|------|
| O&M Manual (3 hard copies + electronic) | $6,000 |
| Electrical Drawings (AutoCAD + PDF) | $4,000 |
| Mechanical Drawings (AutoCAD + PDF) | $3,000 |
| PLC/Robot Program Backup | $1,000 |
| Risk Assessment Report | $1,000 |
| **CLIN 0004 Total** | **$15,000** |

---

### 6.6 CLIN 0005 Cost Breakdown (Extended Warranty)

| Coverage | Cost |
|----------|------|
| Parts Reserve (1 year) | $15,000 |
| Labor Reserve (3 trips estimated) | $18,000 |
| Phone Support (24/7 for 1 year) | $6,000 |
| PM Visit (1 included) | $6,000 |
| **CLIN 0005 Total** | **$45,000** |

---

### 6.7 Payment Schedule

| Milestone | Percentage | Amount | Timing |
|-----------|------------|--------|--------|
| Award / Kickoff | 20% | $185,000 | Net 30 from award |
| Design Approval | 15% | $138,750 | Week 4 |
| Equipment Procurement | 25% | $231,250 | Week 6 |
| FAT Complete | 20% | $185,000 | Week 12 |
| SAT Acceptance | 15% | $138,750 | Week 15 |
| Training Complete / Final | 5% | $46,250 | Week 16 |
| **Total** | **100%** | **$925,000** | |

---

### 6.8 Assumptions & Exclusions

**Assumptions:**
- 480V/3-phase power available within 25' of cell location
- Compressed air (90 PSI, 15 CFM) available at cell location
- Customer provides crane/rigging for unloading (or Singh rental included)
- Normal working hours (M-F, 7AM-5PM) for installation
- Government-furnished weld procedure specification (or AWS D1.1 default)
- Floor is level concrete, suitable for machine anchoring

**Exclusions:**
- Fume extraction system (ducting to building HVAC)
- Floor preparation or repairs
- Building modifications (walls, doors, roof penetrations)
- Consumables beyond initial testing (wire, tips, gas)
- Spare parts inventory (quoted separately upon request)
- Second shift or weekend work (available at additional cost)

---

# VOLUME VI: REPRESENTATIONS & CERTIFICATIONS

---

## Section 7: Representations and Certifications

### 7.1 Business Information

| Item | Information |
|------|-------------|
| Legal Name | Singh Automation, LLC |
| DBA | Singh Automation |
| Address | 1234 Industrial Parkway, Kalamazoo, MI 49001 |
| UEI Number | [To be provided] |
| CAGE Code | [To be provided] |
| Tax ID | [To be provided] |
| SAM.gov Status | Active |

### 7.2 Business Size & Classification

| Certification | Status |
|---------------|--------|
| Small Business | **Yes** |
| Minority Business Enterprise (MBE) | **Yes** |
| WBENC Certified | **Yes** |
| Service-Disabled Veteran-Owned (SDVOSB) | No |
| 8(a) Program | No |
| HUBZone | No |
| Women-Owned Small Business (WOSB) | No |

### 7.3 NAICS Codes

| Code | Description |
|------|-------------|
| 333249 | Other Industrial Machinery Manufacturing (Primary) |
| 541512 | Computer Systems Design Services |
| 541330 | Engineering Services |
| 238210 | Electrical Contractors |
| 333514 | Special Die and Tool Manufacturing |

### 7.4 Representations

Singh Automation hereby represents and certifies that:

1. All information provided in this proposal is accurate and complete.
2. Singh Automation is not debarred, suspended, or otherwise ineligible to contract with the Federal Government.
3. Singh Automation has not been convicted of fraud or any other offense indicating a lack of business integrity.
4. Singh Automation complies with all applicable laws and regulations.
5. Singh Automation maintains appropriate insurance coverage for the work proposed.

---

# APPENDICES

---

## Appendix A: Compliance Matrix

| # | SOW Requirement | Proposal Section | Page | Compliant |
|---|-----------------|------------------|------|-----------|
| **System Design** |
| 1.1 | Robotic MIG welding cell for steel (3/8" - 1") | 3.1 | 4 | ✓ |
| 1.2 | 6-axis industrial robot (FANUC or equiv) | 3.1.1 | 5 | ✓ |
| 1.3 | 2-axis positioner (min 2,000 lb) | 3.1.2 | 5 | ✓ |
| 1.4 | Welding power source (min 500A) | 3.1.3 | 6 | ✓ |
| 1.5 | Water-cooled torch | 3.1.3 | 6 | ✓ |
| **Controls** |
| 2.1 | UL 508A control panel | 3.2 | 7 | ✓ |
| 2.2 | Allen-Bradley PLC | 3.2.1 | 7 | ✓ |
| 2.3 | HMI touchscreen (min 12") | 3.2.2 | 8 | ✓ |
| 2.4 | EtherNet/IP communications | 3.2.3 | 8 | ✓ |
| **Safety** |
| 3.1 | OSHA 1910.212 guarding | 3.3 | 9 | ✓ |
| 3.2 | ISO 10218 compliance | 3.3.1 | 9 | ✓ |
| 3.3 | Safety PLC (SIL 2 / PLd) | 3.3.2 | 10 | ✓ |
| 3.4 | E-stops, interlocks | 3.3.2 | 10 | ✓ |
| 3.5 | Welding curtains | 3.3.3 | 10 | ✓ |
| **Installation** |
| 4.1 | Factory Acceptance Test | 3.4.4 | 11 | ✓ |
| 4.2 | Delivery to Norfolk | 3.4.2 | 11 | ✓ |
| 4.3 | Installation and anchor | 3.4.3 | 12 | ✓ |
| 4.4 | Site Acceptance Test | 3.4.5 | 12 | ✓ |
| **Training** |
| 5.1 | Operator training (40 hr) | 3.5 | 13 | ✓ |
| 5.2 | Maintenance training (16 hr) | 3.5 | 13 | ✓ |
| 5.3 | O&M manuals | 3.6 | 14 | ✓ |
| 5.4 | As-built drawings | 3.6 | 14 | ✓ |
| **Warranty** |
| 6.1 | 1-year warranty | 3.7 | 15 | ✓ |
| 6.2 | Phone/on-site response | 3.7 | 15 | ✓ |
| **Total** | **27 Requirements** | | | **27 Compliant** |

---

## Appendix B: Company Capability Statement

**SINGH AUTOMATION**

*Robotics & Automation Integration | Controls Engineering | Thermal Solutions*

**Core Capabilities:**
- Robotic welding cell design and integration
- Industrial robot integration (FANUC, ABB, KUKA, Yaskawa, Universal Robots)
- UL 508A control panel design and fabrication
- PLC/HMI programming (Allen-Bradley, Siemens)
- Machine vision systems (Cognex, Keyence)
- Safety system design (ISO 10218, ANSI/RIA R15.06)
- Thermal insulation engineering
- Injection molding optimization

**Certifications:**
- Small Business
- MBE (Minority Business Enterprise)
- WBENC Certified
- FANUC Authorized System Integrator

**Locations:**
- Headquarters: Kalamazoo, MI
- West Coast: Irvine, CA

**Contact:**
- Web: www.singhautomation.com
- Email: info@singhautomation.com
- Phone: (269) 555-1234

---

## END OF PROPOSAL

**Singh Automation**
*Your Partner in Automation Excellence*

---

*This proposal is valid for 90 days from date of submission.*
