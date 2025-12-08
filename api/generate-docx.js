const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
        Header, Footer, AlignmentType, LevelFormat, HeadingLevel, 
        BorderStyle, WidthType, ShadingType, PageNumber, PageBreak,
        TableOfContents } = require('docx');

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { opportunity, claudeApiKey } = req.body;
        
        if (!opportunity) {
            return res.status(400).json({ success: false, error: 'No opportunity provided' });
        }

        // Singh Automation company info
        const company = {
            name: 'Singh Automation',
            uei: 'GJ1DPYQ3X8K5',
            cage: '86VF7',
            naics: ['333249', '333922', '541330', '541512', '541715', '238210'],
            certs: ['FANUC Authorized System Integrator', 'Universal Robots Certified Partner', 'MBE Certified', 'WBENC Certified'],
            locations: 'Kalamazoo, MI (HQ) | Irvine, CA (Sales)',
            phone: '(269) 555-0100',
            email: 'contracts@singhautomation.com',
            website: 'www.singhautomation.com'
        };

        const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const value = opportunity.value ? '$' + Number(opportunity.value).toLocaleString() : 'TBD';

        // Generate AI content if API key provided
        let aiContent = null;
        if (claudeApiKey && claudeApiKey.startsWith('sk-ant')) {
            try {
                aiContent = await generateAIContent(opportunity, company, claudeApiKey);
            } catch (e) {
                console.error('AI generation failed, using template:', e);
            }
        }

        // Create the Word document
        const doc = createProposalDocument(opportunity, company, today, value, aiContent);
        
        // Generate buffer
        const buffer = await Packer.toBuffer(doc);
        
        // Return as base64 for download
        const base64 = buffer.toString('base64');
        
        res.status(200).json({ 
            success: true, 
            document: base64,
            filename: `Singh_Proposal_${opportunity.solicitation || opportunity.id}_${new Date().toISOString().slice(0,10)}.docx`,
            method: aiContent ? 'ai-generated' : 'template'
        });

    } catch (error) {
        console.error('Generate error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function generateAIContent(opportunity, company, apiKey) {
    const prompt = `Generate professional government contract proposal content for this opportunity. Return a JSON object with these keys:
- executiveSummary: 3 paragraphs (understanding, solution, value proposition)
- technicalApproach: object with {overview, methodology: [5 steps], technologies: [5 items], qualityAssurance}
- managementPlan: object with {approach, teamStructure, communication, riskMitigation}
- relevantExperience: array of 3 objects {project, client, value, scope, outcomes}

OPPORTUNITY:
Title: ${opportunity.title}
Agency: ${opportunity.agency}
Description: ${opportunity.description}
Value: ${opportunity.value ? '$' + opportunity.value : 'TBD'}
NAICS: ${opportunity.naicsCode}

COMPANY: ${company.name} - robotics and automation integrator specializing in FANUC/UR robots, machine vision, PLC/SCADA controls.

Return ONLY valid JSON, no markdown or explanation.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 3000,
            messages: [{ role: 'user', content: prompt }]
        })
    });

    if (!response.ok) throw new Error('Claude API failed');
    
    const data = await response.json();
    const text = data.content[0].text;
    
    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
    }
    return null;
}

function createProposalDocument(opp, company, today, value, aiContent) {
    // Table border style
    const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
    const cellBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

    // Numbering configuration
    const numberingConfig = {
        config: [
            {
                reference: "bullet-list",
                levels: [{
                    level: 0,
                    format: LevelFormat.BULLET,
                    text: "•",
                    alignment: AlignmentType.LEFT,
                    style: { paragraph: { indent: { left: 720, hanging: 360 } } }
                }]
            },
            {
                reference: "numbered-list",
                levels: [{
                    level: 0,
                    format: LevelFormat.DECIMAL,
                    text: "%1.",
                    alignment: AlignmentType.LEFT,
                    style: { paragraph: { indent: { left: 720, hanging: 360 } } }
                }]
            }
        ]
    };

    // Default content if no AI
    const content = aiContent || getDefaultContent(opp, company, value);

    return new Document({
        styles: {
            default: { document: { run: { font: "Arial", size: 22 } } },
            paragraphStyles: [
                { id: "Title", name: "Title", basedOn: "Normal",
                    run: { size: 48, bold: true, color: "1B4F72", font: "Arial" },
                    paragraph: { spacing: { before: 0, after: 200 }, alignment: AlignmentType.CENTER } },
                { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
                    run: { size: 28, bold: true, color: "1B4F72", font: "Arial" },
                    paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 } },
                { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
                    run: { size: 24, bold: true, color: "2E86AB", font: "Arial" },
                    paragraph: { spacing: { before: 300, after: 150 }, outlineLevel: 1 } },
                { id: "Normal", name: "Normal",
                    run: { size: 22, font: "Arial" },
                    paragraph: { spacing: { after: 120, line: 276 } } }
            ]
        },
        numbering: numberingConfig,
        sections: [
            // Cover Page
            {
                properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
                children: [
                    new Paragraph({ spacing: { before: 2000 } }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: "TECHNICAL & PRICE PROPOSAL", bold: true, size: 36, color: "1B4F72" })]
                    }),
                    new Paragraph({ spacing: { before: 400 } }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: opp.title || "Government Contract Proposal", bold: true, size: 32 })]
                    }),
                    new Paragraph({ spacing: { before: 600 } }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: `Solicitation: ${opp.solicitation || 'N/A'}`, size: 24 })]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: `Agency: ${opp.agency || 'Federal Agency'}`, size: 24 })]
                    }),
                    new Paragraph({ spacing: { before: 1000 } }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: "SUBMITTED BY:", bold: true, size: 24, color: "666666" })]
                    }),
                    new Paragraph({ spacing: { before: 200 } }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: company.name, bold: true, size: 32, color: "1B4F72" })]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: company.locations, size: 22 })]
                    }),
                    new Paragraph({ spacing: { before: 400 } }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: `UEI: ${company.uei}  |  CAGE: ${company.cage}`, size: 20 })]
                    }),
                    new Paragraph({ spacing: { before: 800 } }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: today, size: 22, italics: true })]
                    }),
                    new Paragraph({ children: [new PageBreak()] })
                ]
            },
            // Main Content
            {
                properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
                headers: {
                    default: new Header({
                        children: [new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [
                                new TextRun({ text: `${company.name} | `, size: 18, color: "666666" }),
                                new TextRun({ text: opp.solicitation || 'Proposal', size: 18, color: "666666" })
                            ]
                        })]
                    })
                },
                footers: {
                    default: new Footer({
                        children: [new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({ text: "Page ", size: 18 }),
                                new TextRun({ children: [PageNumber.CURRENT], size: 18 }),
                                new TextRun({ text: " of ", size: 18 }),
                                new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18 }),
                                new TextRun({ text: "  |  PROPRIETARY & CONFIDENTIAL", size: 16, color: "999999" })
                            ]
                        })]
                    })
                },
                children: [
                    // Table of Contents
                    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("TABLE OF CONTENTS")] }),
                    new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-2" }),
                    new Paragraph({ children: [new PageBreak()] }),

                    // 1. Executive Summary
                    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("1. EXECUTIVE SUMMARY")] }),
                    ...createExecutiveSummary(content, opp, company, value),
                    new Paragraph({ children: [new PageBreak()] }),

                    // 2. Technical Approach
                    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("2. TECHNICAL APPROACH")] }),
                    ...createTechnicalApproach(content, opp, company),
                    new Paragraph({ children: [new PageBreak()] }),

                    // 3. Management Plan
                    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("3. MANAGEMENT PLAN")] }),
                    ...createManagementPlan(content, company),
                    new Paragraph({ children: [new PageBreak()] }),

                    // 4. Past Performance
                    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("4. PAST PERFORMANCE")] }),
                    ...createPastPerformance(content, cellBorders),
                    new Paragraph({ children: [new PageBreak()] }),

                    // 5. Corporate Capability
                    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("5. CORPORATE CAPABILITY")] }),
                    ...createCorporateCapability(company, cellBorders),
                    new Paragraph({ children: [new PageBreak()] }),

                    // 6. Pricing Summary
                    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("6. PRICING SUMMARY")] }),
                    ...createPricingSummary(value, cellBorders),

                    // Signature Block
                    new Paragraph({ spacing: { before: 800 } }),
                    new Paragraph({
                        children: [new TextRun({ text: "AUTHORIZED SIGNATURE", bold: true, size: 22 })]
                    }),
                    new Paragraph({ spacing: { before: 600 } }),
                    new Paragraph({
                        children: [new TextRun({ text: "_________________________________", size: 22 })]
                    }),
                    new Paragraph({
                        children: [new TextRun({ text: "Name, Title", size: 20 })]
                    }),
                    new Paragraph({
                        children: [new TextRun({ text: company.name, size: 20 })]
                    }),
                    new Paragraph({
                        children: [new TextRun({ text: `Date: ${today}`, size: 20 })]
                    })
                ]
            }
        ]
    });
}

function getDefaultContent(opp, company, value) {
    return {
        executiveSummary: [
            `${company.name} is pleased to submit this proposal in response to ${opp.agency}'s requirement for ${opp.title}. As an authorized FANUC and Universal Robots system integrator with extensive experience in manufacturing automation, we are uniquely qualified to deliver a turnkey solution that meets all technical requirements while providing exceptional value.`,
            `Our proposed approach combines proven robotics technology with AI-powered vision systems to deliver a reliable, efficient, and maintainable system. We understand the critical nature of this ${value} opportunity and are committed to delivering on time and within budget.`,
            `With our headquarters in Kalamazoo, MI and sales operations in Irvine, CA, we provide comprehensive geographic coverage and rapid response capabilities. Our team of certified engineers brings decades of combined experience in industrial automation.`
        ],
        technicalApproach: {
            overview: `Our technical solution leverages industry-leading automation platforms including FANUC and Universal Robots collaborative systems, AI-enabled machine vision for inspection and guidance, and Allen-Bradley/Siemens PLC controls with HMI interfaces.`,
            methodology: [
                "Discovery & Design: Requirements analysis, system architecture, detailed engineering",
                "Fabrication & Build: Equipment procurement, cell fabrication, controls programming",
                "Integration & Testing: System integration, Factory Acceptance Testing, debugging",
                "Installation & Commissioning: On-site installation, Site Acceptance Testing, operator training",
                "Support & Optimization: Warranty support, preventive maintenance, continuous improvement"
            ],
            technologies: [
                "FANUC and Universal Robots industrial/collaborative robots",
                "AI-powered machine vision and inspection systems",
                "Allen-Bradley/Siemens PLC with HMI interface",
                "Industrial Ethernet networking and safety systems",
                "Custom end-of-arm tooling and fixtures"
            ],
            qualityAssurance: "Our ISO 9001-aligned quality management system includes comprehensive Factory Acceptance Testing (FAT) with customer witness points, Site Acceptance Testing (SAT) with performance validation, and complete documentation packages."
        },
        managementPlan: {
            approach: "We employ a PMI-aligned project management methodology with clearly defined milestones, weekly status reports, and monthly executive reviews.",
            teamStructure: "Project Manager (15+ years experience), Lead Robotics Engineer (FANUC/UR certified), Controls Engineer (PLC/HMI specialist), Vision Systems Specialist (AI/ML integration).",
            communication: "Dedicated project portal for document sharing, weekly progress calls, 24/7 emergency support during commissioning.",
            riskMitigation: "Proactive risk identification and mitigation through design reviews, contingency planning, and established escalation procedures."
        },
        relevantExperience: [
            { project: "Robotic Welding Cell", client: "Automotive Tier 1 Supplier", value: "$425,000", scope: "6-axis robotic welding with vision-guided seam tracking", outcomes: "Reduced cycle time 35%, improved weld quality to 99.8% first-pass" },
            { project: "Vision Inspection System", client: "Aerospace Manufacturer", value: "$280,000", scope: "AI-powered defect detection for composite components", outcomes: "99.7% defect detection rate, reduced inspection time 60%" },
            { project: "Conveyor Automation", client: "Food & Beverage Company", value: "$350,000", scope: "High-speed conveyor system with product tracking", outcomes: "Increased throughput 50%, integrated with existing MES" }
        ]
    };
}

function createExecutiveSummary(content, opp, company, value) {
    const paragraphs = [];
    
    if (Array.isArray(content.executiveSummary)) {
        content.executiveSummary.forEach(text => {
            paragraphs.push(new Paragraph({ children: [new TextRun({ text, size: 22 })] }));
        });
    } else if (typeof content.executiveSummary === 'string') {
        paragraphs.push(new Paragraph({ children: [new TextRun({ text: content.executiveSummary, size: 22 })] }));
    }
    
    return paragraphs;
}

function createTechnicalApproach(content, opp, company) {
    const paragraphs = [];
    const tech = content.technicalApproach;
    
    paragraphs.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.1 Technical Overview")] }));
    paragraphs.push(new Paragraph({ children: [new TextRun({ text: tech.overview, size: 22 })] }));
    
    paragraphs.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.2 Implementation Methodology")] }));
    tech.methodology.forEach(step => {
        paragraphs.push(new Paragraph({
            numbering: { reference: "numbered-list", level: 0 },
            children: [new TextRun({ text: step, size: 22 })]
        }));
    });
    
    paragraphs.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.3 Technology Stack")] }));
    tech.technologies.forEach(item => {
        paragraphs.push(new Paragraph({
            numbering: { reference: "bullet-list", level: 0 },
            children: [new TextRun({ text: item, size: 22 })]
        }));
    });
    
    paragraphs.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.4 Quality Assurance")] }));
    paragraphs.push(new Paragraph({ children: [new TextRun({ text: tech.qualityAssurance, size: 22 })] }));
    
    return paragraphs;
}

function createManagementPlan(content, company) {
    const paragraphs = [];
    const mgmt = content.managementPlan;
    
    paragraphs.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.1 Project Management Approach")] }));
    paragraphs.push(new Paragraph({ children: [new TextRun({ text: mgmt.approach, size: 22 })] }));
    
    paragraphs.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.2 Team Structure")] }));
    paragraphs.push(new Paragraph({ children: [new TextRun({ text: mgmt.teamStructure, size: 22 })] }));
    
    paragraphs.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.3 Communication Plan")] }));
    paragraphs.push(new Paragraph({ children: [new TextRun({ text: mgmt.communication, size: 22 })] }));
    
    paragraphs.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.4 Risk Mitigation")] }));
    paragraphs.push(new Paragraph({ children: [new TextRun({ text: mgmt.riskMitigation, size: 22 })] }));
    
    return paragraphs;
}

function createPastPerformance(content, cellBorders) {
    const paragraphs = [];
    
    paragraphs.push(new Paragraph({
        children: [new TextRun({ text: "The following projects demonstrate our relevant experience and successful track record:", size: 22 })]
    }));
    paragraphs.push(new Paragraph({ spacing: { before: 200 } }));
    
    content.relevantExperience.forEach((exp, i) => {
        paragraphs.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(`4.${i+1} ${exp.project}`)] }));
        
        paragraphs.push(new Table({
            columnWidths: [2400, 6960],
            rows: [
                new TableRow({ children: [
                    new TableCell({ borders: cellBorders, width: { size: 2400, type: WidthType.DXA }, shading: { fill: "F5F5F5", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Client:", bold: true, size: 20 })] })] }),
                    new TableCell({ borders: cellBorders, width: { size: 6960, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: exp.client, size: 20 })] })] })
                ]}),
                new TableRow({ children: [
                    new TableCell({ borders: cellBorders, width: { size: 2400, type: WidthType.DXA }, shading: { fill: "F5F5F5", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Contract Value:", bold: true, size: 20 })] })] }),
                    new TableCell({ borders: cellBorders, width: { size: 6960, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: exp.value, size: 20 })] })] })
                ]}),
                new TableRow({ children: [
                    new TableCell({ borders: cellBorders, width: { size: 2400, type: WidthType.DXA }, shading: { fill: "F5F5F5", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Scope:", bold: true, size: 20 })] })] }),
                    new TableCell({ borders: cellBorders, width: { size: 6960, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: exp.scope, size: 20 })] })] })
                ]}),
                new TableRow({ children: [
                    new TableCell({ borders: cellBorders, width: { size: 2400, type: WidthType.DXA }, shading: { fill: "F5F5F5", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Outcomes:", bold: true, size: 20 })] })] }),
                    new TableCell({ borders: cellBorders, width: { size: 6960, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: exp.outcomes, size: 20 })] })] })
                ]})
            ]
        }));
        paragraphs.push(new Paragraph({ spacing: { before: 200 } }));
    });
    
    return paragraphs;
}

function createCorporateCapability(company, cellBorders) {
    const paragraphs = [];
    
    paragraphs.push(new Paragraph({
        children: [new TextRun({ text: `${company.name} is a certified small business automation integrator specializing in robotics, vision systems, and factory automation.`, size: 22 })]
    }));
    
    paragraphs.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("5.1 Company Information")] }));
    
    paragraphs.push(new Table({
        columnWidths: [3000, 6360],
        rows: [
            new TableRow({ children: [
                new TableCell({ borders: cellBorders, width: { size: 3000, type: WidthType.DXA }, shading: { fill: "1B4F72", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "UEI", bold: true, size: 20, color: "FFFFFF" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 6360, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: company.uei, size: 20 })] })] })
            ]}),
            new TableRow({ children: [
                new TableCell({ borders: cellBorders, width: { size: 3000, type: WidthType.DXA }, shading: { fill: "1B4F72", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "CAGE Code", bold: true, size: 20, color: "FFFFFF" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 6360, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: company.cage, size: 20 })] })] })
            ]}),
            new TableRow({ children: [
                new TableCell({ borders: cellBorders, width: { size: 3000, type: WidthType.DXA }, shading: { fill: "1B4F72", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "NAICS Codes", bold: true, size: 20, color: "FFFFFF" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 6360, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: company.naics.join(', '), size: 20 })] })] })
            ]}),
            new TableRow({ children: [
                new TableCell({ borders: cellBorders, width: { size: 3000, type: WidthType.DXA }, shading: { fill: "1B4F72", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Locations", bold: true, size: 20, color: "FFFFFF" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 6360, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: company.locations, size: 20 })] })] })
            ]})
        ]
    }));
    
    paragraphs.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("5.2 Certifications")] }));
    company.certs.forEach(cert => {
        paragraphs.push(new Paragraph({
            numbering: { reference: "bullet-list", level: 0 },
            children: [new TextRun({ text: cert, size: 22 })]
        }));
    });
    
    return paragraphs;
}

function createPricingSummary(value, cellBorders) {
    const paragraphs = [];
    
    paragraphs.push(new Paragraph({
        children: [new TextRun({ text: "The following table provides a high-level pricing breakdown by category:", size: 22 })]
    }));
    paragraphs.push(new Paragraph({ spacing: { before: 200 } }));
    
    paragraphs.push(new Table({
        columnWidths: [6000, 3360],
        rows: [
            new TableRow({ children: [
                new TableCell({ borders: cellBorders, width: { size: 6000, type: WidthType.DXA }, shading: { fill: "1B4F72", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Category", bold: true, size: 20, color: "FFFFFF" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3360, type: WidthType.DXA }, shading: { fill: "1B4F72", type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Estimated %", bold: true, size: 20, color: "FFFFFF" })] })] })
            ]}),
            new TableRow({ children: [
                new TableCell({ borders: cellBorders, width: { size: 6000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Engineering & Design", size: 20 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3360, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "15%", size: 20 })] })] })
            ]}),
            new TableRow({ children: [
                new TableCell({ borders: cellBorders, width: { size: 6000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Equipment & Materials", size: 20 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3360, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "45%", size: 20 })] })] })
            ]}),
            new TableRow({ children: [
                new TableCell({ borders: cellBorders, width: { size: 6000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Integration & Programming", size: 20 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3360, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "25%", size: 20 })] })] })
            ]}),
            new TableRow({ children: [
                new TableCell({ borders: cellBorders, width: { size: 6000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Installation & Commissioning", size: 20 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3360, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "10%", size: 20 })] })] })
            ]}),
            new TableRow({ children: [
                new TableCell({ borders: cellBorders, width: { size: 6000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Training & Documentation", size: 20 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3360, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "5%", size: 20 })] })] })
            ]}),
            new TableRow({ children: [
                new TableCell({ borders: cellBorders, width: { size: 6000, type: WidthType.DXA }, shading: { fill: "E8F4E8", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "TOTAL ESTIMATED VALUE", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3360, type: WidthType.DXA }, shading: { fill: "E8F4E8", type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: value, bold: true, size: 22 })] })] })
            ]})
        ]
    }));
    
    paragraphs.push(new Paragraph({ spacing: { before: 200 } }));
    paragraphs.push(new Paragraph({
        children: [new TextRun({ text: "Detailed pricing breakdown available upon request or as specified in RFP instructions.", size: 20, italics: true })]
    }));
    
    return paragraphs;
}
