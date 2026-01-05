// src/data/portfolio.ts
// Singh Automation & STS (Singh Thermal Solutions) Portfolio Data
// Combines robotics/automation capabilities with thermal/insulation expertise
// Evidence fields provide traceability to source documents

export type EvidenceRef = {
  file: string;          // filename
  lineRange: string;     // line range from extraction
  note?: string;
};

export type PastPerformanceProject = {
  id: string;
  title: string;
  sector: "Robotics & Automation" | "Injection Molding" | "Battery Safety" | "Thermal/Insulation" | "Other";
  scopeSummary: string;
  environment: string[];
  workPerformed: string[];
  measuredResults: string[];
  valueUSD: number | null;
  customerName: string | null;
  customerPOC?: {
    name: string;
    title: string;
    email: string;
    phone?: string;
  };
  dates: {
    start: string | null;
    end: string | null;
  };
  location?: string;
  naicsCodes?: string[];
  evidence: EvidenceRef[];
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  department: "Leadership" | "Engineering" | "Operations" | "Advisory";
  summary: string[];
  capabilities?: string[];
  certifications?: string[];
  priorCompanies: string[];
  resumePdfAvailable: boolean;
  evidence: EvidenceRef[];
};

export type Service = {
  id: string;
  name: string;
  category:
    | "Robotics & Automation"
    | "Thermal Insulation Engineering"
    | "Injection Molding Optimization"
    | "Battery Fire Containment"
    | "Tooling & Manufacturing Support"
    | "Controls & Integration"
    | "Testing & Validation";
  description: string;
  deliverables: string[];
  naicsCodes?: string[];
  typicalLeadTime: string | null;
  typicalValue?: string;
  evidence: EvidenceRef[];
};

// ============================================================================
// PAST PERFORMANCE PROJECTS
// ============================================================================

export const pastPerformance: PastPerformanceProject[] = [
  // ROBOTICS & AUTOMATION PROJECTS
  {
    id: "pp-lippert-window-automation",
    title: "Multi-Robot Window Automation System",
    sector: "Robotics & Automation",
    scopeSummary:
      "Designed, built, and commissioned a 5-robot manufacturing cell for window assembly automation including precision assembly, quality inspection, high-speed packaging, material handling, and custom design capabilities.",
    environment: [
      "Window manufacturing facility",
      "5-robot integrated cell",
      "FANUC robots with vision systems",
      "Allen-Bradley CompactLogix PLC",
      "Full safety perimeter with guarding",
    ],
    workPerformed: [
      "Precision Assembly Robot - High-accuracy component assembly with reduced errors",
      "Automated Quality Inspection Robot - Vision-based defect detection",
      "High-Speed Packaging Robot - Automated material handling and packaging",
      "Material Handling Robot - Inter-station part transfer optimization",
      "Custom Product Design Robot - R&D prototyping support",
      "Full UL 508A control panel design and build",
      "Allen-Bradley PLC programming and HMI development",
      "Safety system design per ISO 10218 and ANSI/RIA R15.06",
      "FAT/SAT execution with customer witness",
      "Operator and maintenance training program",
    ],
    measuredResults: [
      "Enhanced productivity through task-specific automation",
      "100% defect screening via vision inspection",
      "Reduced manual assembly errors significantly",
      "On-time delivery (9-month schedule)",
      "Ongoing customer relationship established",
    ],
    valueUSD: 1600000,
    customerName: "Lippert Industries",
    customerPOC: {
      name: "Tim Widner",
      title: "VP - Glass",
      email: "Twidner@lci1.com",
    },
    dates: { start: "2024-01", end: "2024-09" },
    location: "Bristol, Indiana",
    naicsCodes: ["333249", "541512", "541330"],
    evidence: [
      {
        file: "singhautomation.com/product/window-automation",
        lineRange: "Full page",
        note: "Product page with project details",
      },
    ],
  },

  // THERMAL/INSULATION PROJECTS
  {
    id: "pp-hot-runner-insulation-retrofit",
    title: "Hot Runner Insulation Retrofit (Packaging Caps, 8-Cavity)",
    sector: "Injection Molding",
    scopeSummary:
      "Applied STS MG insulation retrofit to main hot runner and reset process temperatures while maintaining short-shot behavior, achieving 53% startup time reduction and 22% cycle time reduction.",
    environment: [
      "Packaging mold – caps, 8-cavity",
      "250-ton press",
      "Material: Exxon LDPE",
      "Husky hot runner system",
      "Prior hot runner temp: 425°F; barrel temps: 450°F",
    ],
    workPerformed: [
      "STS MG insulation retrofit applied to main hot runner (hot drops not insulated)",
      "Reset temperatures to original targets: 375°F manifold and 390°F barrel",
      "Maintained equivalent short-shot behavior vs prior 425°F settings",
      "Process optimization and validation",
    ],
    measuredResults: [
      "Startup (ambient → setpoint) reduced from 13.28 min to 6.21 min (-53%)",
      "Cycle time reduced from 7.69 sec to 5.96 sec (-22%)",
      "Throughput: 20/min, 1,200/hr, 28,800/day, 576,000/month, 6,912,000/year",
      "Payback period: < 1 month",
    ],
    valueUSD: null,
    customerName: null,
    dates: { start: null, end: null },
    naicsCodes: ["333249", "541330"],
    evidence: [
      {
        file: "230717 Hot Runner Insulation by STS.pdf",
        lineRange: "L26-L58",
        note: "Case details, settings, and quantified results",
      },
    ],
  },

  {
    id: "pp-ul-battery-thermal-runaway-containment",
    title: "UL Battery Thermal Runaway Containment (25×25 Array)",
    sector: "Battery Safety",
    scopeSummary:
      "Developed and tested thermal runaway containment solution for 25×25 battery array, demonstrating containment of thermal event to single cell with granular insulation system.",
    environment: [
      "25×25 battery array test configuration",
      "Center cell heated until thermal runaway initiated",
      "UL test protocol compliance",
    ],
    workPerformed: [
      "Applied granular insulation for thermal runaway containment",
      "Developed deployable blanket method for containment/suppression",
      "Conducted thermal runaway propagation testing",
      "Documented containment performance metrics",
    ],
    measuredResults: [
      "Baseline: within 2 seconds, energy from 1 battery ignited other 24",
      "With granular insulation: only 1 battery lost; remaining 24 tested good",
      "Cardboard packaging survived thermal event",
      "Blanket deployment: ~12 seconds to drape; full containment of heat & flames",
    ],
    valueUSD: null,
    customerName: null,
    dates: { start: null, end: null },
    naicsCodes: ["541715", "541330"],
    evidence: [
      {
        file: "250610 STS Deck.pdf",
        lineRange: "L35-L50",
        note: "Thermal runaway scenario and containment results",
      },
      {
        file: "231214 Li Battery Insulation Matl.pdf",
        lineRange: "L17-L21",
        note: "Blanket application containment description",
      },
    ],
  },
];

// ============================================================================
// TEAM MEMBERS
// ============================================================================

export const team: TeamMember[] = [
  // LEADERSHIP
  {
    id: "tm-gurdeep-singh",
    name: "Gurdeep Singh",
    role: "Owner / Chairman",
    department: "Leadership",
    summary: [
      "Owner of Singh Automation and Chairman of SVS/STS",
      "Prior leadership roles at TAC and Stryker",
      "Deep experience in manufacturing automation and medical devices",
    ],
    priorCompanies: ["TAC", "Stryker"],
    resumePdfAvailable: false,
    evidence: [
      { file: "250610 STS Deck.pdf", lineRange: "L24-L29" },
    ],
  },
  {
    id: "tm-jas-kaur",
    name: "Jas Kaur",
    role: "Owner",
    department: "Leadership",
    summary: [
      "Co-owner with background in Banking, Marketing, and IT",
      "Business operations and financial oversight",
    ],
    priorCompanies: [],
    resumePdfAvailable: false,
    evidence: [
      { file: "250610 STS Deck.pdf", lineRange: "L30-L34" },
    ],
  },
  {
    id: "tm-charlie-rupert",
    name: "Charlie Rupert",
    role: "CEO",
    department: "Leadership",
    summary: [
      "Executive leadership experience at Magneti Marelli, MPG, and AAM",
      "Automotive and manufacturing industry veteran",
    ],
    priorCompanies: ["Magneti Marelli", "MPG", "AAM"],
    resumePdfAvailable: false,
    evidence: [
      { file: "250610 STS Deck.pdf", lineRange: "L35-L40" },
    ],
  },
  {
    id: "tm-david-mih",
    name: "David Mih",
    role: "COO",
    department: "Leadership",
    summary: [
      "Operations management at MANN+HUMMEL, Magneti Marelli, MPG, and AAM",
      "Manufacturing operations and supply chain expertise",
    ],
    priorCompanies: ["MANN+HUMMEL", "Magneti Marelli", "MPG", "AAM"],
    resumePdfAvailable: false,
    evidence: [
      { file: "250610 STS Deck.pdf", lineRange: "L42-L47" },
    ],
  },

  // ENGINEERING TEAM
  {
    id: "tm-mangay-peram",
    name: "Mangay Peram",
    role: "Project Manager",
    department: "Engineering",
    summary: [
      "Project planning, execution, and delivery management",
      "Customer interface and stakeholder communication",
      "Budget, schedule, and resource management",
      "Risk identification and mitigation",
    ],
    capabilities: [
      "Project scope definition and WBS development",
      "Schedule management (Gantt, critical path)",
      "Budget forecasting and cost control",
      "Customer and vendor coordination",
      "Design review facilitation",
      "FAT/SAT planning and execution",
    ],
    priorCompanies: [],
    resumePdfAvailable: false,
    evidence: [
      { file: "Internal", lineRange: "N/A", note: "Key personnel for proposals" },
    ],
  },
  {
    id: "tm-aditya-kurde",
    name: "Aditya Kurde",
    role: "Electrical & Controls Engineer / Technical Lead",
    department: "Engineering",
    summary: [
      "Lead engineer for electrical design, PLC programming, and robot integration",
      "Expert in Allen-Bradley, Siemens, and multi-vendor PLC platforms",
      "FANUC, ABB, KUKA, Yaskawa, Universal Robots integration",
      "Safety system design per ISO 13849, ISO 10218, ANSI/RIA R15.06",
    ],
    capabilities: [
      "Electrical system design (schematics, panel layout, BOM)",
      "PLC programming (Allen-Bradley, Siemens, Omron, Beckhoff)",
      "HMI development (PanelView, FactoryTalk)",
      "Robot integration via EtherNet/IP, Profinet",
      "UL 508A panel design, NFPA 79 compliance",
      "Safety PLC programming (GuardLogix)",
      "FAT/SAT execution and commissioning",
      "Operator and maintenance training",
    ],
    certifications: [
      "UL 508A Panel Design",
      "NFPA 79 Compliance",
      "Rockwell Automation Certified",
    ],
    priorCompanies: [],
    resumePdfAvailable: false,
    evidence: [
      { file: "Internal", lineRange: "N/A", note: "Key personnel for proposals" },
    ],
  },
  {
    id: "tm-bhargav-gali",
    name: "Bhargav Nandan Gali",
    role: "Vision Systems Engineer",
    department: "Engineering",
    summary: [
      "Machine vision design, programming, and integration specialist",
      "Robot-guided vision applications expert",
      "Back-end and front-end software development for vision data systems",
    ],
    capabilities: [
      "Vision system design (Cognex, Keyence, Omron, Banner)",
      "Camera, lens, and lighting selection/optimization",
      "Robot-guided vision integration",
      "Inspection algorithm development",
      "API development for vision-to-PLC/MES integration",
      "Dashboard development for inspection results",
      "FAT/SAT support and operator training",
    ],
    priorCompanies: [],
    resumePdfAvailable: false,
    evidence: [
      { file: "Internal", lineRange: "N/A", note: "Key personnel for proposals" },
    ],
  },
  {
    id: "tm-mayur-joshi",
    name: "Mayur Joshi",
    role: "Machine Builder",
    department: "Operations",
    summary: [
      "Mechanical and electrical assembly of automated machinery",
      "Robot cell build and wiring expertise",
      "Installation and commissioning support",
    ],
    capabilities: [
      "Mechanical assembly per drawings (frames, guarding, tooling, EOAT)",
      "Electrical wiring per schematics (panels, field devices)",
      "Robot installation and tool mounting",
      "I/O checkout and debugging",
      "Equipment preparation and shipping",
      "On-site installation support",
    ],
    priorCompanies: [],
    resumePdfAvailable: false,
    evidence: [
      { file: "Internal", lineRange: "N/A", note: "Key personnel for proposals" },
    ],
  },
  {
    id: "tm-sony-singh",
    name: "Sony Singh",
    role: "Machine Builder",
    department: "Operations",
    summary: [
      "Mechanical and electrical assembly specialist",
      "Safety device installation and verification",
      "Field installation and startup support",
    ],
    capabilities: [
      "Industrial robot cell assembly (FANUC, ABB, KUKA)",
      "Control panel wiring and termination",
      "Safety device installation (light curtains, E-stops, interlocks)",
      "Rigging and equipment transport",
      "Customer site installation and startup",
    ],
    priorCompanies: [],
    resumePdfAvailable: false,
    evidence: [
      { file: "Internal", lineRange: "N/A", note: "Key personnel for proposals" },
    ],
  },

  // ADVISORY
  {
    id: "tm-kevin-wise",
    name: "Kevin Wise",
    role: "Advisor (Non-Automotive BD)",
    department: "Advisory",
    summary: [
      "Prior CFO at iMFLUX (injection molding innovation)",
      "Prior Procter & Gamble executive",
      "Non-automotive business development advisor",
    ],
    priorCompanies: ["iMFLUX", "Procter & Gamble"],
    resumePdfAvailable: false,
    evidence: [
      { file: "250610 STS Deck.pdf", lineRange: "L48-L53" },
    ],
  },
];

// ============================================================================
// SERVICES
// ============================================================================

export const services: Service[] = [
  // ROBOTICS & AUTOMATION SERVICES
  {
    id: "svc-robotic-welding-cells",
    name: "Robotic Welding Cell Design & Integration",
    category: "Robotics & Automation",
    description:
      "Turnkey robotic welding cells including robot selection, positioner integration, weld equipment, controls, safety systems, and commissioning.",
    deliverables: [
      "System design and engineering",
      "Robot and positioner integration (FANUC, ABB, KUKA, Yaskawa)",
      "Welding equipment integration (Lincoln, Miller, Fronius)",
      "UL 508A control panel",
      "Safety system per ISO 10218",
      "FAT/SAT and operator training",
      "O&M documentation",
    ],
    naicsCodes: ["333249", "541512", "333992"],
    typicalLeadTime: "12-20 weeks",
    typicalValue: "$500K - $2M",
    evidence: [
      { file: "singhautomation.com", lineRange: "Services", note: "Core capability" },
    ],
  },
  {
    id: "svc-robot-integration",
    name: "Industrial Robot Integration",
    category: "Robotics & Automation",
    description:
      "Integration of industrial robots for material handling, assembly, palletizing, machine tending, and inspection applications.",
    deliverables: [
      "Robot selection and EOAT design",
      "Cell layout and simulation",
      "PLC/robot integration",
      "Vision-guided robotics",
      "Safety system design",
      "Programming and commissioning",
    ],
    naicsCodes: ["333249", "541512"],
    typicalLeadTime: "8-16 weeks",
    typicalValue: "$200K - $1.5M",
    evidence: [
      { file: "singhautomation.com", lineRange: "Services", note: "Core capability" },
    ],
  },
  {
    id: "svc-vision-systems",
    name: "Machine Vision Systems",
    category: "Robotics & Automation",
    description:
      "Machine vision solutions for inspection, guidance, measurement, and identification including robot-guided applications.",
    deliverables: [
      "Vision system design and hardware selection",
      "Lighting and optics optimization",
      "Vision algorithm development",
      "Robot/PLC integration",
      "Dashboard and reporting",
      "Training and documentation",
    ],
    naicsCodes: ["541512", "334513"],
    typicalLeadTime: "4-12 weeks",
    typicalValue: "$50K - $300K",
    evidence: [
      { file: "Internal", lineRange: "N/A", note: "Bhargav Gali capability" },
    ],
  },

  // CONTROLS & INTEGRATION SERVICES
  {
    id: "svc-controls-panels",
    name: "UL 508A Control Panel Design & Build",
    category: "Controls & Integration",
    description:
      "Custom control panel design, fabrication, and UL 508A listing for industrial automation applications.",
    deliverables: [
      "Electrical schematics and panel layout",
      "Component selection and BOM",
      "Panel fabrication and wiring",
      "UL 508A labeling",
      "I/O checkout and testing",
    ],
    naicsCodes: ["335313", "541512"],
    typicalLeadTime: "4-8 weeks",
    typicalValue: "$15K - $100K",
    evidence: [
      { file: "Internal", lineRange: "N/A", note: "In-house panel shop" },
    ],
  },
  {
    id: "svc-plc-programming",
    name: "PLC/HMI Programming & Integration",
    category: "Controls & Integration",
    description:
      "PLC and HMI programming for Allen-Bradley, Siemens, and other platforms including safety PLC implementation.",
    deliverables: [
      "PLC program development",
      "HMI screen design",
      "Safety PLC programming",
      "Network configuration",
      "Commissioning and debug",
      "Documentation and training",
    ],
    naicsCodes: ["541512", "541511"],
    typicalLeadTime: "2-8 weeks",
    typicalValue: "$20K - $150K",
    evidence: [
      { file: "Internal", lineRange: "N/A", note: "Aditya Kurde capability" },
    ],
  },

  // THERMAL/INSULATION SERVICES
  {
    id: "svc-hot-runner-insulation-retrofit",
    name: "Hot Runner Insulation Retrofit & Process Optimization",
    category: "Injection Molding Optimization",
    description:
      "Insulation retrofit and process reset to reduce startup time and cycle time with documented ROI metrics.",
    deliverables: [
      "Retrofit plan (insulated components defined)",
      "STS MG insulation installation",
      "Process parameter optimization",
      "Before/after metrics capture (startup time, cycle time)",
      "ROI documentation",
    ],
    naicsCodes: ["333249", "541330"],
    typicalLeadTime: "2-4 weeks",
    typicalValue: "$25K - $100K",
    evidence: [
      { file: "230717 Hot Runner Insulation by STS.pdf", lineRange: "L26-L58" },
    ],
  },
  {
    id: "svc-insulation-design-to-kit",
    name: "Insulation Design-to-Fabrication Kits",
    category: "Thermal Insulation Engineering",
    description:
      "CAD-based insulation design with laser-cut fabrication and shipment as install-ready kit or on-site install support.",
    deliverables: [
      "CAD design from customer drawings/scans",
      "Laser-cut fabricated insulation kit",
      "Install instructions or on-site install support",
      "Material certification documentation",
    ],
    naicsCodes: ["541330", "332999"],
    typicalLeadTime: "2-3 weeks",
    evidence: [
      { file: "231214 Li Battery Insulation Matl.pdf", lineRange: "L48-L53" },
    ],
  },
  {
    id: "svc-encapsulation-formats",
    name: "Encapsulation Formats: Quilted (Flex) + SS Foil (Rigid)",
    category: "Thermal Insulation Engineering",
    description:
      "Insulation solutions in quilted fabric and stainless-steel foil formats, including laser-cut rigid solutions for high-temperature applications.",
    deliverables: [
      "Quilted (flexible) insulation components",
      "SS foil rigid insulation components",
      "Laser-cut patterns and fitment design",
      "Installation hardware and fasteners",
    ],
    naicsCodes: ["541330", "332999"],
    typicalLeadTime: "2-4 weeks",
    evidence: [
      { file: "231214 Li Battery Insulation Matl.pdf", lineRange: "L1-L15" },
    ],
  },
  {
    id: "svc-battery-fire-containment",
    name: "Lithium Battery Fire Containment Systems",
    category: "Battery Fire Containment",
    description:
      "Containment and suppression systems for battery thermal runaway scenarios including granular, board, and deployable blanket formats.",
    deliverables: [
      "Containment materials selection (granular, compressed board, blanket)",
      "Packaging or deployment approach design",
      "Test evidence package",
      "Installation and deployment training",
    ],
    naicsCodes: ["541715", "541330"],
    typicalLeadTime: "3-6 weeks",
    evidence: [
      { file: "250610 STS Deck.pdf", lineRange: "L35-L50" },
      { file: "231214 Li Battery Insulation Matl.pdf", lineRange: "L17-L21" },
    ],
  },

  // TESTING & VALIDATION SERVICES
  {
    id: "svc-ul2596-tag-evidence",
    name: "UL 2596 TaG Test Evidence Package",
    category: "Testing & Validation",
    description:
      "Evidence package for UL 2596 Torch & Grit (TaG) test scenario with cold-face performance documentation.",
    deliverables: [
      "TaG scenario summary (test conditions)",
      "Cold-face temperature behavior data",
      "Delta-T performance narrative",
      "Compliance documentation for customer review",
    ],
    naicsCodes: ["541380"],
    typicalLeadTime: "1-2 weeks",
    evidence: [
      { file: "240110 UL Test Report[47].pdf", lineRange: "L1-L13" },
    ],
  },
  {
    id: "svc-safety-risk-assessment",
    name: "Machine Safety Risk Assessment",
    category: "Testing & Validation",
    description:
      "Comprehensive risk assessment per ISO 12100, ISO 10218, and ANSI/RIA R15.06 with documentation for compliance.",
    deliverables: [
      "Hazard identification and risk scoring",
      "Risk reduction measures",
      "Safety device specification",
      "Compliance documentation",
      "Validation test procedures",
    ],
    naicsCodes: ["541330", "541690"],
    typicalLeadTime: "1-3 weeks",
    typicalValue: "$5K - $25K",
    evidence: [
      { file: "Internal", lineRange: "N/A", note: "Standard service offering" },
    ],
  },

  // TOOLING & MANUFACTURING SUPPORT
  {
    id: "svc-tooling-global",
    name: "Tooling & Global Tool-Shop Access",
    category: "Tooling & Manufacturing Support",
    description:
      "Tooling support with AI-driven CAM and access to partner tool shops in multiple countries for cost-effective sourcing.",
    deliverables: [
      "Tooling design review and DFM feedback",
      "CAM programming support",
      "Supplier coordination and quoting",
      "Quality inspection at source",
      "Logistics coordination",
    ],
    naicsCodes: ["333514", "541330"],
    typicalLeadTime: "4-12 weeks (tooling dependent)",
    evidence: [
      { file: "250610 STS Deck.pdf", lineRange: "L55-L60", note: "Tool shop access" },
      { file: "250610 STS Deck.pdf", lineRange: "L1-L7", note: "AI-driven CAM" },
    ],
  },
  {
    id: "svc-facility-capacity",
    name: "Injection Molding Production Capacity",
    category: "Injection Molding Optimization",
    description:
      "Production capacity for injection molding from 300-ton to 3500-ton presses for prototype through production volumes.",
    deliverables: [
      "Capacity planning and scheduling",
      "Process development and validation",
      "Quality documentation (PPAP, FMEA)",
      "Production runs",
    ],
    naicsCodes: ["326199", "333511"],
    typicalLeadTime: "Quote dependent",
    evidence: [
      { file: "250610 STS Deck.pdf", lineRange: "L2-L8" },
    ],
  },
];

// ============================================================================
// COMPANY CAPABILITIES SUMMARY (for proposals)
// ============================================================================

export const companyCapabilities = {
  name: "Singh Automation / STS (Singh Thermal Solutions)",
  businessType: "Small Business",
  certifications: ["Small Business", "MBE", "WBENC"],
  locations: [
    { city: "Kalamazoo", state: "MI", type: "HQ / Manufacturing" },
    { city: "Irvine", state: "CA", type: "West Coast Office" },
  ],
  naicsCodes: [
    { code: "541512", description: "Computer Systems Design Services" },
    { code: "541330", description: "Engineering Services" },
    { code: "541511", description: "Custom Computer Programming" },
    { code: "541715", description: "R&D Physical Sciences" },
    { code: "333249", description: "Industrial Machinery Manufacturing" },
    { code: "238210", description: "Electrical Contractors" },
    { code: "334513", description: "Instruments for Measuring/Control" },
    { code: "332312", description: "Fabricated Structural Metal" },
    { code: "333514", description: "Special Tooling/Fixtures" },
    { code: "333922", description: "Conveyor Equipment Manufacturing" },
  ],
  coreCompetencies: [
    "Robotic welding cell design and integration",
    "Industrial robot integration (FANUC, ABB, KUKA, Yaskawa, UR)",
    "UL 508A control panel design and fabrication",
    "PLC/HMI programming (Allen-Bradley, Siemens)",
    "Machine vision systems",
    "Safety system design (ISO 10218, ANSI/RIA R15.06)",
    "Thermal insulation engineering",
    "Battery fire containment systems",
    "Injection molding optimization",
  ],
  equipmentBrands: [
    "FANUC", "ABB", "KUKA", "Yaskawa", "Universal Robots",
    "Allen-Bradley", "Siemens", "Rockwell",
    "Lincoln Electric", "Miller", "Fronius",
    "Cognex", "Keyence", "Omron", "Banner",
  ],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const portfolioIndex = {
  pastPerformanceById: Object.fromEntries(pastPerformance.map(p => [p.id, p])),
  teamById: Object.fromEntries(team.map(m => [m.id, m])),
  servicesById: Object.fromEntries(services.map(s => [s.id, s])),
};

// Get team members by department
export function getTeamByDepartment(dept: TeamMember["department"]): TeamMember[] {
  return team.filter(m => m.department === dept);
}

// Get services by category
export function getServicesByCategory(cat: Service["category"]): Service[] {
  return services.filter(s => s.category === cat);
}

// Get past performance by sector
export function getPastPerformanceBySector(sector: PastPerformanceProject["sector"]): PastPerformanceProject[] {
  return pastPerformance.filter(p => p.sector === sector);
}

// Get services by NAICS code
export function getServicesByNAICS(naicsCode: string): Service[] {
  return services.filter(s => s.naicsCodes?.includes(naicsCode));
}
