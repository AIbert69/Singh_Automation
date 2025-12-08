// Singh Automation Proposal Generator API - Proper DOCX format
// Deploy to: /api/generate.js on Vercel

import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, Header, Footer, 
         AlignmentType, HeadingLevel, BorderStyle, WidthType, LevelFormat, PageNumber, ShadingType } from 'docx';

// Company data
const company = {
    name: 'Singh Automation',
    uei: 'GJ1DPYQ3X8K5',
    cage: '86VF7',
    hq: 'Kalamazoo, MI',
    sales: 'Irvine, CA',
    naics: ['333249', '333922', '541330', '541512', '541715', '238210'],
    certs: ['FANUC Authorized System Integrator', 'Universal Robots Certified Partner', 'MBE Certified', 'WBENC Certified']
};

// Past performance
const pastPerformance = [
    { name: 'Robotic Welding Cell – Automotive Tier-1 Supplier', value: 425000,
      scope: 'Design and integration of a 6-axis robotic welding cell with vision-guided seam tracking and multi-part fixturing.',
      outcomes: '35% reduction in cycle time, first-pass weld quality improved to 99.8%, significant reduction in manual rework.' },
    { name: 'Vision Inspection System – Aerospace Manufacturer', value: 280000,
      scope: 'AI-driven defect detection system for composite components with high-resolution cameras and custom ML models.',
      outcomes: '99.7% defect detection rate, 60% reduction in inspection time, integration with existing MES.' },
    { name: 'Conveyor Automation – Food & Beverage Facility', value: 350000,
      scope: 'High-speed conveyor and sorting system with product tracking and automated diverting.',
      outcomes: '50% increase in throughput, seamless integration with plant controls and existing MES.' }
];

// Table border helper
function tableBorders() {
    const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
    return { top: border, bottom: border, left: border, right: border };
}

// Pricing row helper
function pricingRow(category, amount, percent) {
    return new TableRow({
        children: [
            new TableCell({ borders: tableBorders(), width: { size: 4000, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: category, size: 22, font: 'Arial' })] })] }),
            new TableCell({ borders: tableBorders(), width: { size: 2500, type: WidthType.DXA },
                children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `$${Math.round(amount).toLocaleString()}`, size: 22, font: 'Arial' })] })] }),
            new TableCell({ borders: tableBorders(), width: { size: 1500, type: WidthType.DXA },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: percent, size: 22, font: 'Arial' })] })] })
        ]
    });
}

// Bullet item helper
function bulletItem(text) {
    return new Paragraph({
        numbering: { reference: 'bullet-list', level: 0 },
        spacing: { before: 60, after: 60 },
        children: [new TextRun({ text, size: 22, font: 'Arial' })]
    });
}

// Normal paragraph helper
function para(text, options = {}) {
    return new Paragraph({
        spacing: { before: options.before || 120, after: options.after || 120 },
        children: [new TextRun({ text, size: 22, font: 'Arial', bold: options.bold, italics: options.italics })]
    });
}

// Labeled paragraph helper
function labeledPara(label, text) {
    return new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [
            new TextRun({ text: label + ': ', bold: true, size: 22, font: 'Arial' }),
            new TextRun({ text, size: 22, font: 'Arial' })
        ]
    });
}

// Generate the proposal document
function generateProposal(opportunity) {
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const value = opportunity.value || 350000;
    
    return new Document({
        styles: {
            default: { document: { run: { font: 'Arial', size: 22 } } },
            paragraphStyles: [
                { id: 'Title', name: 'Title', basedOn: 'Normal',
                    run: { size: 48, bold: true, color: '1B4F72', font: 'Arial' },
                    paragraph: { spacing: { before: 0, after: 240 }, alignment: AlignmentType.CENTER } },
                { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
                    run: { size: 28, bold: true, color: '1B4F72', font: 'Arial' },
                    paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0 } },
                { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
                    run: { size: 24, bold: true, color: '2E86AB', font: 'Arial' },
                    paragraph: { spacing: { before: 240, after: 100 }, outlineLevel: 1 } },
                { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
                    run: { size: 22, bold: true, color: '333333', font: 'Arial' },
                    paragraph: { spacing: { before: 180, after: 80 }, outlineLevel: 2 } }
            ]
        },
        numbering: {
            config: [
                { reference: 'bullet-list',
                    levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
                        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }
            ]
        },
        sections: [{
            properties: {
                page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
            },
            headers: {
                default: new Header({
                    children: [new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [new TextRun({ text: 'Singh Automation – Technical Proposal', size: 18, font: 'Arial', color: '666666' })]
                    })]
                })
            },
            footers: {
                default: new Footer({
                    children: [new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({ text: 'Page ', size: 18, font: 'Arial' }),
                            new TextRun({ children: [PageNumber.CURRENT], size: 18, font: 'Arial' }),
                            new TextRun({ text: ' of ', size: 18, font: 'Arial' }),
                            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, font: 'Arial' })
                        ]
                    })]
                })
            },
            children: [
                // TITLE
                new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun(`Technical Proposal for ${opportunity.title}`)] }),
                
                // SOLICITATION INFO
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('Solicitation Information')] }),
                labeledPara('Solicitation', opportunity.solicitation || 'TBD'),
                labeledPara('Agency', opportunity.agency || 'TBD'),
                labeledPara('Submitted by', company.name),
                labeledPara('Date', today),
                
                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Primary Contact')] }),
                para(company.name),
                para(`${company.hq} (Headquarters) | ${company.sales} (Sales)`),
                para(`UEI: ${company.uei} | CAGE: ${company.cage}`),
                
                // 1. EXECUTIVE SUMMARY
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('1. Executive Summary')] }),
                para(`${company.name} is pleased to submit this proposal in response to ${opportunity.agency}'s requirement for ${opportunity.title}.`),
                para(`As an authorized FANUC and Universal Robots (UR) system integrator with extensive experience in manufacturing automation, Singh Automation is well positioned to deliver a turnkey solution that meets or exceeds all technical and performance requirements, integrates cleanly with existing operations and safety standards, and provides a robust platform for future automation expansion.`),
                para(`Our proposed solution combines proven industrial robotic platforms with AI-enabled vision systems and modern controls architecture. With engineering based in ${company.hq} and sales and support in ${company.sales}, we provide responsive regional coverage and ongoing lifecycle support.`),
                para(`The estimated value of this project is $${value.toLocaleString()}, inclusive of engineering, equipment, integration, installation, and training. Singh Automation is committed to delivering a system that improves quality, increases throughput, and reduces manual rework.`),
                
                // 2. TECHNICAL APPROACH
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('2. Technical Approach')] }),
                
                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('2.1 System Design')] }),
                para('The proposed system will be designed as a fully integrated, safety-compliant solution leveraging industry-standard components:'),
                bulletItem('Robotics: FANUC 6-axis industrial robot and/or Universal Robots collaborative robot (UR), selected to match payload, reach, and cycle-time requirements.'),
                bulletItem('Vision & Sensing: AI-enabled machine vision for part detection, quality inspection, and guidance. Optional laser tracking for dynamic path correction.'),
                bulletItem('Controls & HMI: Allen-Bradley or Siemens PLC platform. Industrial HMI for operator interface, job selection, and status monitoring.'),
                bulletItem('Cell Infrastructure: Custom fixtures and tooling designed for target applications. Perimeter guarding, safety devices, and lockout/tagout hardware.'),
                bulletItem('Integration: Interface to existing equipment and upstream/downstream systems where applicable.'),
                
                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('2.2 Implementation Phases')] }),
                para('Singh Automation will deliver the project in clearly defined phases with milestone reviews:'),
                
                new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun('Phase 1: Discovery & Design (Weeks 1–4)')] }),
                bulletItem('Detailed requirements gathering and on-site assessment'),
                bulletItem('Development of system architecture, layout, and functional design specifications'),
                bulletItem('Design reviews and approvals with stakeholders'),
                
                new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun('Phase 2: Fabrication & Build (Weeks 5–10)')] }),
                bulletItem('Procurement of robots, controls, and components'),
                bulletItem('Fabrication of fixtures, guarding, and panels'),
                bulletItem('Controls panel build and software development'),
                
                new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun('Phase 3: Integration & FAT (Weeks 11–14)')] }),
                bulletItem('Complete mechanical and electrical integration at Singh Automation facility'),
                bulletItem('Programming and testing'),
                bulletItem('Formal Factory Acceptance Test (FAT) with customer witness'),
                
                new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun('Phase 4: Installation & SAT (Weeks 15–18)')] }),
                bulletItem('Delivery and on-site installation'),
                bulletItem('Power-up, I/O checkout, and system commissioning'),
                bulletItem('Site Acceptance Test (SAT) to validate performance'),
                
                new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun('Phase 5: Support & Optimization (Post-Installation)')] }),
                bulletItem('Warranty support for the defined period'),
                bulletItem('Optional preventive-maintenance program'),
                bulletItem('Process optimization support as new applications are introduced'),
                
                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('2.3 Quality Assurance')] }),
                para('Quality will be managed through a structured process aligned with ISO 9001 principles:'),
                bulletItem('Documented design and engineering change control'),
                bulletItem('Standardized test plans for FAT and SAT'),
                bulletItem('Traceable issue tracking and resolution'),
                bulletItem('Comprehensive as-built documentation'),
                
                // 3. MANAGEMENT APPROACH
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('3. Management Approach')] }),
                
                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('3.1 Project Management')] }),
                para('Singh Automation will employ a formal project management framework aligned with PMI best practices:'),
                bulletItem('Defined scope, schedule, and budget baseline'),
                bulletItem('Milestone-based project plan with clear deliverables'),
                bulletItem('Weekly status reports summarizing progress, risks, and actions'),
                bulletItem('Formal review gates at the end of the Design, FAT, and SAT phases'),
                
                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('3.2 Key Personnel')] }),
                para('Representative roles for this engagement include:'),
                bulletItem('Project Manager: Over 15 years in automation and integration projects'),
                bulletItem('Lead Robotics Engineer: FANUC/UR certified'),
                bulletItem('Controls Engineer: PLC/HMI specialist'),
                bulletItem('Vision Systems Specialist: Expert in AI/ML-based vision'),
                
                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('3.3 Communication Plan')] }),
                para('Effective communication is central to the project\'s success:'),
                bulletItem('Weekly project calls during design, build, and commissioning'),
                bulletItem('Monthly executive summaries highlighting key milestones'),
                bulletItem('Shared project document portal for drawings, schedules, and test reports'),
                bulletItem('24/7 support during installation and initial production ramp-up'),
                
                // 4. PAST PERFORMANCE
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('4. Past Performance')] }),
                para('The following representative projects demonstrate Singh Automation\'s relevant experience:'),
                
                ...pastPerformance.flatMap((proj, i) => [
                    new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(`Project ${i + 1}: ${proj.name}`)] }),
                    bulletItem(`Contract Value: $${proj.value.toLocaleString()}`),
                    bulletItem(`Scope: ${proj.scope}`),
                    bulletItem(`Outcomes: ${proj.outcomes}`)
                ]),
                
                // 5. CORPORATE CAPABILITY
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('5. Corporate Capability')] }),
                para('Singh Automation is a certified small-business automation integrator specializing in robotics, vision, and factory automation.'),
                
                new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun('Core Competencies')] }),
                bulletItem('Robotic welding and material handling systems'),
                bulletItem('AI-enabled machine vision and quality inspection'),
                bulletItem('PLC/HMI controls engineering and safety systems'),
                bulletItem('Turnkey cell design, fabrication, and integration'),
                
                new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun('Company Data')] }),
                bulletItem(`UEI: ${company.uei}`),
                bulletItem(`CAGE: ${company.cage}`),
                bulletItem(`Primary NAICS Codes: ${company.naics.join(', ')}`),
                
                new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun('Certifications')] }),
                ...company.certs.map(cert => bulletItem(cert)),
                
                new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun('Locations')] }),
                bulletItem(`Headquarters: ${company.hq}`),
                bulletItem(`Sales & Support: ${company.sales}`),
                
                // 6. PRICING SUMMARY
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('6. Pricing Summary')] }),
                para(`The following high-level cost breakdown is aligned with an estimated total project value of $${value.toLocaleString()}.`),
                
                new Table({
                    columnWidths: [4000, 2500, 1500],
                    rows: [
                        new TableRow({
                            tableHeader: true,
                            children: [
                                new TableCell({ borders: tableBorders(), shading: { fill: '1B4F72', type: ShadingType.CLEAR }, width: { size: 4000, type: WidthType.DXA },
                                    children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: 'Category', bold: true, color: 'FFFFFF', size: 22, font: 'Arial' })] })] }),
                                new TableCell({ borders: tableBorders(), shading: { fill: '1B4F72', type: ShadingType.CLEAR }, width: { size: 2500, type: WidthType.DXA },
                                    children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Estimated Amount', bold: true, color: 'FFFFFF', size: 22, font: 'Arial' })] })] }),
                                new TableCell({ borders: tableBorders(), shading: { fill: '1B4F72', type: ShadingType.CLEAR }, width: { size: 1500, type: WidthType.DXA },
                                    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '% of Total', bold: true, color: 'FFFFFF', size: 22, font: 'Arial' })] })] })
                            ]
                        }),
                        pricingRow('Engineering & Design', value * 0.15, '15%'),
                        pricingRow('Equipment & Materials', value * 0.45, '45%'),
                        pricingRow('Integration & Programming', value * 0.25, '25%'),
                        pricingRow('Installation & Commissioning', value * 0.10, '10%'),
                        pricingRow('Training & Documentation', value * 0.05, '5%'),
                        new TableRow({
                            children: [
                                new TableCell({ borders: tableBorders(), shading: { fill: 'E8E8E8', type: ShadingType.CLEAR }, width: { size: 4000, type: WidthType.DXA },
                                    children: [new Paragraph({ children: [new TextRun({ text: 'Total Estimated Value', bold: true, size: 22, font: 'Arial' })] })] }),
                                new TableCell({ borders: tableBorders(), shading: { fill: 'E8E8E8', type: ShadingType.CLEAR }, width: { size: 2500, type: WidthType.DXA },
                                    children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `$${value.toLocaleString()}`, bold: true, size: 22, font: 'Arial' })] })] }),
                                new TableCell({ borders: tableBorders(), shading: { fill: 'E8E8E8', type: ShadingType.CLEAR }, width: { size: 1500, type: WidthType.DXA },
                                    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '100%', bold: true, size: 22, font: 'Arial' })] })] })
                            ]
                        })
                    ]
                }),
                
                para('This pricing summary is for planning purposes and may be refined based on final technical scope and options selected.', { before: 200 }),
                
                // 7. CONTACT
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('7. Contact')] }),
                para(company.name, { bold: true }),
                para(`${company.hq} (HQ) | ${company.sales} (Sales)`),
                para(`UEI: ${company.uei} | CAGE: ${company.cage}`),
                para(''),
                para('We appreciate the opportunity to propose on this project and look forward to supporting your automation needs.', { italics: true })
            ]
        }]
    });
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    
    try {
        // Get opportunity from request
        const opportunity = req.method === 'POST' ? req.body : req.query;
        
        if (!opportunity.title) {
            return res.status(400).json({ error: 'Missing opportunity title' });
        }
        
        // Parse value if string
        if (typeof opportunity.value === 'string') {
            opportunity.value = parseInt(opportunity.value.replace(/[^0-9]/g, '')) || 350000;
        }
        
        // Generate the document
        const doc = generateProposal(opportunity);
        const buffer = await Packer.toBuffer(doc);
        
        // Return as downloadable file
        const filename = `Singh_Proposal_${opportunity.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)}.docx`;
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', buffer.length);
        
        return res.status(200).send(buffer);
        
    } catch (error) {
        console.error('Generate error:', error);
        return res.status(500).json({ error: error.message });
    }
}
