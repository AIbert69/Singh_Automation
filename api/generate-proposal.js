// /api/generate-proposal.js
// Singh Automation - Professional Government Contracts Proposal Generator
// Format: FAR/DFAR Compliant Technical & Management Volume
// Returns downloadable .docx file

import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
         Header, Footer, AlignmentType, LevelFormat, HeadingLevel, BorderStyle,
         WidthType, ShadingType, PageNumber, PageBreak } from 'docx';

export default async function handler(req, res) {
  // CORS - Allow production, preview deployments, and local development
  const allowedOrigins = ['https://singh-automation.vercel.app', 'https://singhautomation.com', 'http://localhost:3000', 'http://localhost:5173'];
  const origin = req.headers.origin;
  const isAllowed = allowedOrigins.includes(origin) ||
      (origin && origin.endsWith('.vercel.app') && origin.includes('singh-automation'));
  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { opportunity } = req.body;

    if (!opportunity) {
      return res.status(400).json({ error: 'Missing opportunity data' });
    }

    // === OPPORTUNITY DATA ===
    const title = opportunity.title || 'Government Contract';
    const solicitation = opportunity.solicitation || opportunity.noticeId || opportunity.id || '[SOLICITATION #]';
    const agency = opportunity.agency || opportunity.departmentName || 'Government Agency';
    const value = opportunity.value ? `$${Number(opportunity.value).toLocaleString()}` : 'TBD';
    const naics = opportunity.naicsCode || '333249';
    const description = opportunity.description || '';
    const closeDate = opportunity.closeDate || '[RESPONSE DATE]';
    const setAside = opportunity.setAside || 'Full and Open Competition';

    // === SINGH AUTOMATION DATA ===
    const company = {
      name: "Singh Automation LLC",
      cage: "86VF7",
      uei: "GJ1DPYQ3X8K5",
      duns: "117959857",
      hq: "7804 S Sprinkle Road, Portage, MI 49002",
      detroit: "41000 Woodward Ave, Bloomfield Twp, MI 48304",
      california: "300 Spectrum Center Dr, Suite 400, Irvine, CA 92618",
      phone: "269-321-0442",
      email: "albert@singhautomation.com",
      website: "www.singhautomation.com"
    };

    const personnel = {
      executive: { name: "Gurdeep Singh", title: "Owner & Chairman" },
      contact: { name: "Albert Mizuno", title: "Principal/CEO", phone: "786-344-8955", email: "albert@singhautomation.com" },
      pm: { name: "David Mih", title: "COO / General Manager" },
      techLead: { name: "Soorya Sridhar", title: "Project Manager - Electrical" },
      opsLead: { name: "Sonny Singh", title: "Operations Manager" },
      qa: { name: "Ricardo del Olmo Parrado", title: "Resource & Compliance Manager" }
    };

    // === PROFESSIONAL GOV CONTRACT STYLES ===
    const navy = "1B365D";      // Professional navy blue
    const gold = "B8860B";      // Government gold accent
    const darkGray = "333333";
    const lightGray = "666666";
    const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" };
    const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };
    const headerShading = { fill: navy, type: ShadingType.CLEAR };
    const altRowShading = { fill: "F5F5F5", type: ShadingType.CLEAR };
    const highlightShading = { fill: "FFF8DC", type: ShadingType.CLEAR };  // Cornsilk for action items
    const successShading = { fill: "E8F5E9", type: ShadingType.CLEAR };    // Light green for compliance

    // === HELPER FUNCTIONS ===
    const sectionHeader = (number, text) => new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 240 },
      border: { bottom: { color: navy, size: 8, style: BorderStyle.SINGLE } },
      children: [
        new TextRun({ text: `SECTION ${number}: `, bold: true, size: 28, color: gold }),
        new TextRun({ text: text.toUpperCase(), bold: true, size: 28, color: navy })
      ]
    });

    const heading2 = (text) => new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 280, after: 160 },
      children: [new TextRun({ text, bold: true, size: 24, color: navy })]
    });

    const heading3 = (text) => new Paragraph({
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 200, after: 120 },
      children: [new TextRun({ text, bold: true, size: 22, color: darkGray })]
    });

    const para = (text, options = {}) => new Paragraph({
      spacing: { after: 180, line: 276 },  // 1.15 line spacing
      alignment: options.center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
      children: [new TextRun({ text, size: 22, font: "Times New Roman", ...options })]
    });

    const boldPara = (label, value) => new Paragraph({
      spacing: { after: 100 },
      children: [
        new TextRun({ text: label, bold: true, size: 22, font: "Times New Roman" }),
        new TextRun({ text: value, size: 22, font: "Times New Roman" })
      ]
    });

    const actionItem = (text) => new Paragraph({
      spacing: { before: 80, after: 160 },
      shading: highlightShading,
      indent: { left: 360 },
      border: { left: { color: gold, size: 16, style: BorderStyle.SINGLE } },
      children: [
        new TextRun({ text: "[ACTION REQUIRED] ", bold: true, size: 20, color: "8B4513" }),
        new TextRun({ text, size: 20, italics: true, color: darkGray })
      ]
    });

    const bulletPoint = (text, ref = "bullet-list") => new Paragraph({
      numbering: { reference: ref, level: 0 },
      spacing: { after: 100, line: 276 },
      children: [new TextRun({ text, size: 22, font: "Times New Roman" })]
    });

    const numberedItem = (text, ref = "numbered-list") => new Paragraph({
      numbering: { reference: ref, level: 0 },
      spacing: { after: 100, line: 276 },
      children: [new TextRun({ text, size: 22, font: "Times New Roman" })]
    });

    const complianceNote = (text) => new Paragraph({
      spacing: { before: 80, after: 160 },
      shading: successShading,
      indent: { left: 360 },
      border: { left: { color: "2E7D32", size: 16, style: BorderStyle.SINGLE } },
      children: [
        new TextRun({ text: "✓ ", bold: true, size: 20, color: "2E7D32" }),
        new TextRun({ text, size: 20, color: darkGray })
      ]
    });

    // === BUILD DOCUMENT ===
    const doc = new Document({
      styles: {
        default: { document: { run: { font: "Times New Roman", size: 22 } } },
        paragraphStyles: [
          { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
            run: { size: 28, bold: true, color: navy, font: "Arial" },
            paragraph: { spacing: { before: 400, after: 240 } } },
          { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
            run: { size: 24, bold: true, color: navy, font: "Arial" },
            paragraph: { spacing: { before: 280, after: 160 } } },
          { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
            run: { size: 22, bold: true, color: darkGray, font: "Arial" },
            paragraph: { spacing: { before: 200, after: 120 } } }
        ]
      },
      numbering: {
        config: [
          { reference: "bullet-list",
            levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
          { reference: "numbered-list",
            levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
          { reference: "alpha-list",
            levels: [{ level: 0, format: LevelFormat.LOWER_LETTER, text: "%1)", alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }
        ]
      },
      sections: [{
        properties: {
          page: { margin: { top: 1440, right: 1296, bottom: 1440, left: 1296 } }  // 1" top/bottom, 0.9" sides
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                border: { bottom: { color: navy, size: 6, style: BorderStyle.SINGLE } },
                spacing: { after: 120 },
                children: [
                  new TextRun({ text: "SINGH AUTOMATION LLC", bold: true, size: 18, font: "Arial", color: navy }),
                  new TextRun({ text: "  |  ", size: 18, color: lightGray }),
                  new TextRun({ text: "Technical & Management Proposal", size: 18, font: "Arial", color: lightGray }),
                  new TextRun({ text: "  |  ", size: 18, color: lightGray }),
                  new TextRun({ text: solicitation, size: 18, font: "Arial", color: navy })
                ]
              })
            ]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                border: { top: { color: navy, size: 6, style: BorderStyle.SINGLE } },
                spacing: { before: 120 },
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "PROPRIETARY INFORMATION", size: 16, font: "Arial", color: lightGray }),
                  new TextRun({ text: "  |  ", size: 16, color: lightGray }),
                  new TextRun({ text: "Page ", size: 16, font: "Arial", color: lightGray }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, font: "Arial" }),
                  new TextRun({ text: " of ", size: 16, font: "Arial", color: lightGray }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, font: "Arial" })
                ]
              })
            ]
          })
        },
        children: [
          // ============ COVER PAGE ============
          // Top accent bar with navy/gold
          new Paragraph({
            shading: { fill: navy, type: ShadingType.CLEAR },
            spacing: { after: 0 },
            children: [new TextRun({ text: " ", size: 24 })]
          }),
          new Paragraph({
            shading: { fill: gold, type: ShadingType.CLEAR },
            spacing: { after: 0 },
            children: [new TextRun({ text: " ", size: 4 })]
          }),

          new Paragraph({ spacing: { before: 800 } }),

          // Document classification
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [new TextRun({ text: "VOLUME I: TECHNICAL AND MANAGEMENT PROPOSAL", bold: true, size: 24, font: "Arial", color: lightGray })]
          }),

          // Main title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [new TextRun({ text: title.toUpperCase(), bold: true, size: 36, font: "Arial", color: navy })]
          }),

          // Divider
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 100 },
            children: [new TextRun({ text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━", size: 20, color: gold })]
          }),

          // Solicitation details table
          new Table({
            columnWidths: [4680, 4680],
            rows: [
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: headerShading, width: { size: 4680, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SOLICITATION NUMBER", bold: true, color: "FFFFFF", size: 18, font: "Arial" })] })] }),
                new TableCell({ borders: cellBorders, shading: headerShading, width: { size: 4680, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ISSUING AGENCY", bold: true, color: "FFFFFF", size: 18, font: "Arial" })] })] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, width: { size: 4680, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 100 }, children: [new TextRun({ text: solicitation, size: 24, bold: true, font: "Arial" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 4680, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 100 }, children: [new TextRun({ text: agency, size: 22, font: "Arial" })] })] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 4680, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "NAICS CODE", bold: true, size: 18, font: "Arial", color: lightGray })] })] }),
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 4680, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SET-ASIDE", bold: true, size: 18, font: "Arial", color: lightGray })] })] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, width: { size: 4680, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 80 }, children: [new TextRun({ text: naics, size: 22, font: "Arial" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 4680, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 80 }, children: [new TextRun({ text: setAside, size: 22, font: "Arial" })] })] })
              ]})
            ]
          }),

          new Paragraph({ spacing: { before: 600 } }),

          // Submitted by section
          new Paragraph({ alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "SUBMITTED BY", size: 20, font: "Arial", color: lightGray, allCaps: true })]
          }),

          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 },
            children: [new TextRun({ text: "SINGH AUTOMATION LLC", bold: true, size: 32, font: "Arial", color: navy })]
          }),

          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 },
            children: [new TextRun({ text: "Industrial Automation & Robotics Integration", size: 20, italics: true, font: "Arial", color: lightGray })]
          }),

          // Offeror info table
          new Table({
            columnWidths: [2340, 2340, 2340, 2340],
            rows: [
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: headerShading, width: { size: 2340, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "CAGE", bold: true, color: "FFFFFF", size: 16, font: "Arial" })] })] }),
                new TableCell({ borders: cellBorders, shading: headerShading, width: { size: 2340, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "UEI", bold: true, color: "FFFFFF", size: 16, font: "Arial" })] })] }),
                new TableCell({ borders: cellBorders, shading: headerShading, width: { size: 2340, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "DUNS", bold: true, color: "FFFFFF", size: 16, font: "Arial" })] })] }),
                new TableCell({ borders: cellBorders, shading: headerShading, width: { size: 2340, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SIZE", bold: true, color: "FFFFFF", size: 16, font: "Arial" })] })] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 80 }, children: [new TextRun({ text: company.cage, size: 20, bold: true, font: "Arial" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 80 }, children: [new TextRun({ text: company.uei, size: 18, font: "Arial" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 80 }, children: [new TextRun({ text: company.duns, size: 18, font: "Arial" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 80 }, children: [new TextRun({ text: "Small Business", size: 18, font: "Arial" })] })] })
              ]})
            ]
          }),

          new Paragraph({ spacing: { before: 300 } }),

          // Address
          new Paragraph({ alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Principal Place of Business: ", size: 18, font: "Arial", color: lightGray }),
              new TextRun({ text: company.hq, size: 18, font: "Arial" })
            ]
          }),

          new Paragraph({ spacing: { before: 400 } }),

          // Contact info box
          new Table({
            columnWidths: [9360],
            rows: [
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: { fill: "F8F9FA", type: ShadingType.CLEAR }, width: { size: 9360, type: WidthType.DXA },
                  children: [
                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120 }, children: [new TextRun({ text: "AUTHORIZED REPRESENTATIVE & PRIMARY POINT OF CONTACT", bold: true, size: 18, font: "Arial", color: navy })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100 }, children: [new TextRun({ text: `${personnel.contact.name}, ${personnel.contact.title}`, size: 20, font: "Arial" })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Tel: ${personnel.contact.phone}  |  Email: ${personnel.contact.email}`, size: 18, font: "Arial", color: navy })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: `Web: ${company.website}`, size: 18, font: "Arial", color: lightGray })] })
                  ]
                })
              ]})
            ]
          }),

          new Paragraph({ spacing: { before: 400 } }),

          // Dates and validity
          new Paragraph({ alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Date Submitted: ", size: 18, font: "Arial", color: lightGray }),
              new TextRun({ text: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), size: 18, font: "Arial", bold: true })
            ]
          }),
          new Paragraph({ alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Response Due: ", size: 18, font: "Arial", color: lightGray }),
              new TextRun({ text: closeDate, size: 18, font: "Arial", bold: true })
            ]
          }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100 },
            children: [new TextRun({ text: "This proposal is valid for 120 calendar days from submission date", size: 16, font: "Arial", italics: true, color: lightGray })]
          }),

          // Bottom accent bar
          new Paragraph({ spacing: { before: 600 } }),
          new Paragraph({
            shading: { fill: gold, type: ShadingType.CLEAR },
            spacing: { after: 0 },
            children: [new TextRun({ text: " ", size: 4 })]
          }),
          new Paragraph({
            shading: { fill: navy, type: ShadingType.CLEAR },
            spacing: { after: 0 },
            children: [new TextRun({ text: " ", size: 24 })]
          }),

          new Paragraph({ children: [new PageBreak()] }),
          
          // ============ TABLE OF CONTENTS ============
          new Paragraph({
            spacing: { before: 200, after: 300 },
            border: { bottom: { color: navy, size: 8, style: BorderStyle.SINGLE } },
            children: [new TextRun({ text: "TABLE OF CONTENTS", bold: true, size: 28, font: "Arial", color: navy })]
          }),

          // TOC entries
          new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: "Section 1: Executive Summary", size: 22, font: "Times New Roman" }), new TextRun({ text: " .................................................... 3", size: 22, font: "Times New Roman", color: lightGray })] }),
          new Paragraph({ children: [new TextRun({ text: "Section 2: Technical Approach", size: 22, font: "Times New Roman" }), new TextRun({ text: " ................................................... 4", size: 22, font: "Times New Roman", color: lightGray })] }),
          new Paragraph({ children: [new TextRun({ text: "Section 3: Management Approach", size: 22, font: "Times New Roman" }), new TextRun({ text: " ............................................... 6", size: 22, font: "Times New Roman", color: lightGray })] }),
          new Paragraph({ children: [new TextRun({ text: "Section 4: Key Personnel", size: 22, font: "Times New Roman" }), new TextRun({ text: " ............................................................ 7", size: 22, font: "Times New Roman", color: lightGray })] }),
          new Paragraph({ children: [new TextRun({ text: "Section 5: Past Performance", size: 22, font: "Times New Roman" }), new TextRun({ text: " ..................................................... 8", size: 22, font: "Times New Roman", color: lightGray })] }),
          new Paragraph({ children: [new TextRun({ text: "Section 6: Quality Assurance", size: 22, font: "Times New Roman" }), new TextRun({ text: " .................................................... 9", size: 22, font: "Times New Roman", color: lightGray })] }),
          new Paragraph({ children: [new TextRun({ text: "Section 7: Risk Management", size: 22, font: "Times New Roman" }), new TextRun({ text: " .................................................. 10", size: 22, font: "Times New Roman", color: lightGray })] }),
          new Paragraph({ children: [new TextRun({ text: "Appendix A: Compliance Matrix", size: 22, font: "Times New Roman" }), new TextRun({ text: " ................................................ 11", size: 22, font: "Times New Roman", color: lightGray })] }),
          new Paragraph({ children: [new TextRun({ text: "Appendix B: Required Attachments", size: 22, font: "Times New Roman" }), new TextRun({ text: " ........................................... 12", size: 22, font: "Times New Roman", color: lightGray })] }),

          new Paragraph({ children: [new PageBreak()] }),

          // ============ SECTION 1: EXECUTIVE SUMMARY ============
          sectionHeader("1", "Executive Summary"),

          // Opening statement with highlight
          new Paragraph({
            shading: successShading,
            spacing: { before: 200, after: 200 },
            border: { left: { color: "2E7D32", size: 16, style: BorderStyle.SINGLE } },
            indent: { left: 360 },
            children: [
              new TextRun({ text: "Singh Automation LLC", bold: true, size: 22, font: "Times New Roman" }),
              new TextRun({ text: ` respectfully submits this proposal in response to Solicitation `, size: 22, font: "Times New Roman" }),
              new TextRun({ text: solicitation, bold: true, size: 22, font: "Times New Roman" }),
              new TextRun({ text: ` for `, size: 22, font: "Times New Roman" }),
              new TextRun({ text: title, bold: true, size: 22, font: "Times New Roman" }),
              new TextRun({ text: `. As a `, size: 22, font: "Times New Roman" }),
              new TextRun({ text: "FANUC Authorized System Integrator", bold: true, size: 22, font: "Times New Roman", color: navy }),
              new TextRun({ text: ", we offer proven technical excellence backed by direct OEM partnership and certified Small Business status.", size: 22, font: "Times New Roman" })
            ]
          }),

          heading2("1.1 Understanding of the Requirement"),
          para(`${agency} requires ${description || 'industrial automation and robotics solutions to modernize operations, enhance manufacturing capabilities, and improve operational efficiency'}. Singh Automation has carefully reviewed the solicitation requirements and possesses complete understanding of the technical, schedule, and compliance requirements necessary for successful contract performance.`),

          heading2("1.2 Summary of Proposed Solution"),
          para("Singh Automation proposes a comprehensive turnkey automation solution encompassing:"),
          bulletPoint("FANUC industrial robotics with integrated safety systems and controllers"),
          bulletPoint("Allen-Bradley/Siemens PLC programming and facility integration"),
          bulletPoint("Factory Acceptance Testing (FAT) at Singh Automation facility"),
          bulletPoint("Site Acceptance Testing (SAT) with Government witness points"),
          bulletPoint("Comprehensive operator and maintenance training program"),
          bulletPoint("12-month warranty with guaranteed response times"),

          heading2("1.3 Offeror Qualifications"),

          // Discriminators table
          new Table({
            columnWidths: [3120, 6240],
            rows: [
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: headerShading, width: { size: 3120, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun({ text: "DISCRIMINATOR", bold: true, color: "FFFFFF", size: 18, font: "Arial" })] })] }),
                new TableCell({ borders: cellBorders, shading: headerShading, width: { size: 6240, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun({ text: "BENEFIT TO GOVERNMENT", bold: true, color: "FFFFFF", size: 18, font: "Arial" })] })] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "FANUC Authorized SI", bold: true, size: 20, font: "Times New Roman" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 6240, type: WidthType.DXA }, children: [para("Direct OEM technical support, factory-trained engineers, genuine replacement parts, priority service scheduling")] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Small Business", bold: true, size: 20, font: "Times New Roman" })] })] }),
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 6240, type: WidthType.DXA }, children: [para("Agile decision-making, competitive pricing, direct executive access, supports small business goals")] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Dual-Coast Presence", bold: true, size: 20, font: "Times New Roman" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 6240, type: WidthType.DXA }, children: [para("Michigan HQ and California office enable rapid nationwide deployment and reduced travel costs")] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Turnkey Capability", bold: true, size: 20, font: "Times New Roman" })] })] }),
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 6240, type: WidthType.DXA }, children: [para("Single point of responsibility from design through commissioning reduces coordination risk")] })
              ]})
            ]
          }),

          heading2("1.4 Commitment to Performance"),
          new Paragraph({
            shading: { fill: "F0F8FF", type: ShadingType.CLEAR },
            spacing: { before: 200, after: 200 },
            border: { left: { color: navy, size: 16, style: BorderStyle.SINGLE } },
            indent: { left: 360 },
            children: [new TextRun({ text: "Singh Automation commits to delivering a high-quality automation solution that meets or exceeds all solicitation requirements, on schedule and within budget. Our leadership team is prepared to authorize immediate commencement of work upon contract award.", size: 22, font: "Times New Roman", italics: true })]
          }),

          new Paragraph({ children: [new PageBreak()] }),
          
          // ============ SECTION 2: TECHNICAL APPROACH ============
          sectionHeader("2", "Technical Approach"),

          heading2("2.1 Technical Understanding"),
          para(`Based on thorough review of the solicitation, ${agency} requires an automated system capable of high-precision, repeatable operations that integrates seamlessly with existing facility infrastructure. The solution must comply with applicable safety standards (OSHA, NFPA 79, RIA) and include comprehensive operator training and documentation packages.`),

          heading2("2.2 Proposed Technical Solution"),
          heading3("2.2.1 Equipment Specifications"),
          new Table({
            columnWidths: [2800, 6560],
            rows: [
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: headerShading, width: { size: 2800, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun({ text: "COMPONENT", bold: true, color: "FFFFFF", size: 18, font: "Arial" })] })] }),
                new TableCell({ borders: cellBorders, shading: headerShading, width: { size: 6560, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun({ text: "TECHNICAL SPECIFICATION", bold: true, color: "FFFFFF", size: 18, font: "Arial" })] })] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Robot System", bold: true, size: 20, font: "Times New Roman" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 6560, type: WidthType.DXA }, children: [para("FANUC industrial robot (model per final requirements analysis)")] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Controller", bold: true, size: 20, font: "Times New Roman" })] })] }),
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 6560, type: WidthType.DXA }, children: [para("FANUC R-30iB Plus with iRVision capability")] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Safety System", bold: true, size: 20, font: "Times New Roman" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 6560, type: WidthType.DXA }, children: [para("Category 3 PLd safety-rated guarding per OSHA/NFPA 79/RIA")] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Controls Integration", bold: true, size: 20, font: "Times New Roman" })] })] }),
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 6560, type: WidthType.DXA }, children: [para("Allen-Bradley ControlLogix PLC with EtherNet/IP interface")] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "HMI", bold: true, size: 20, font: "Times New Roman" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 6560, type: WidthType.DXA }, children: [para("Allen-Bradley PanelView Plus 7 touchscreen interface")] })
              ]})
            ]
          }),

          heading2("2.3 Work Breakdown Structure"),
          heading3("Phase 1: Design & Engineering"),
          para("Duration: Weeks 1-4. Site survey and requirements validation, preliminary and final design package development, customer design review meeting, design approval milestone."),

          heading3("Phase 2: Fabrication & Integration"),
          para("Duration: Weeks 5-10. Component procurement and expediting, robotic cell fabrication and assembly, controls integration and programming, Factory Acceptance Test (FAT) with customer witness option."),

          heading3("Phase 3: Installation & Commissioning"),
          para("Duration: Weeks 11-14. Equipment delivery and rigging, mechanical and electrical installation, system commissioning and tuning, Site Acceptance Test (SAT) with Government witness."),

          heading3("Phase 4: Training & Warranty"),
          para("Duration: Weeks 15-16. Operator training (16 hours), maintenance training (8 hours), as-built documentation delivery, 12-month warranty period commencement."),

          new Paragraph({ children: [new PageBreak()] }),
          
          // ============ SECTION 3: MANAGEMENT APPROACH ============
          sectionHeader("3", "Management Approach"),

          heading2("3.1 Program Organization"),
          para(`Singh Automation will establish a dedicated project team with clear lines of authority and direct Government communication channels. ${personnel.pm.name} will serve as Program Manager with full authority for day-to-day contract execution.`),

          new Table({
            columnWidths: [2800, 3280, 3280],
            rows: [
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: headerShading, width: { size: 2800, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ROLE", bold: true, color: "FFFFFF", size: 18, font: "Arial" })] })] }),
                new TableCell({ borders: cellBorders, shading: headerShading, width: { size: 3280, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ASSIGNED PERSONNEL", bold: true, color: "FFFFFF", size: 18, font: "Arial" })] })] }),
                new TableCell({ borders: cellBorders, shading: headerShading, width: { size: 3280, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "RESPONSIBILITY", bold: true, color: "FFFFFF", size: 18, font: "Arial" })] })] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Executive Sponsor", bold: true, size: 20, font: "Times New Roman" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3280, type: WidthType.DXA }, children: [para(personnel.executive.name)] }),
                new TableCell({ borders: cellBorders, width: { size: 3280, type: WidthType.DXA }, children: [para("Strategic oversight, escalation authority")] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Program Manager", bold: true, size: 20, font: "Times New Roman" })] })] }),
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 3280, type: WidthType.DXA }, children: [para(personnel.pm.name)] }),
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 3280, type: WidthType.DXA }, children: [para("Contract execution, schedule, budget")] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Technical Lead", bold: true, size: 20, font: "Times New Roman" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3280, type: WidthType.DXA }, children: [para(personnel.techLead.name)] }),
                new TableCell({ borders: cellBorders, width: { size: 3280, type: WidthType.DXA }, children: [para("Controls engineering, programming")] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Operations Lead", bold: true, size: 20, font: "Times New Roman" })] })] }),
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 3280, type: WidthType.DXA }, children: [para(personnel.opsLead.name)] }),
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 3280, type: WidthType.DXA }, children: [para("Fabrication, installation, field ops")] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "QA/Compliance Mgr", bold: true, size: 20, font: "Times New Roman" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3280, type: WidthType.DXA }, children: [para(personnel.qa.name)] }),
                new TableCell({ borders: cellBorders, width: { size: 3280, type: WidthType.DXA }, children: [para("Quality control, documentation")] })
              ]})
            ]
          }),

          heading2("3.2 Communication Plan"),
          para("Singh Automation implements a structured communication framework to ensure Government visibility into project status and facilitate rapid issue resolution:"),

          new Table({
            columnWidths: [2340, 1800, 2600, 2620],
            rows: [
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: headerShading, width: { size: 2340, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "EVENT", bold: true, color: "FFFFFF", size: 16, font: "Arial" })] })] }),
                new TableCell({ borders: cellBorders, shading: headerShading, width: { size: 1800, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "FREQUENCY", bold: true, color: "FFFFFF", size: 16, font: "Arial" })] })] }),
                new TableCell({ borders: cellBorders, shading: headerShading, width: { size: 2600, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PARTICIPANTS", bold: true, color: "FFFFFF", size: 16, font: "Arial" })] })] }),
                new TableCell({ borders: cellBorders, shading: headerShading, width: { size: 2620, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "DELIVERABLE", bold: true, color: "FFFFFF", size: 16, font: "Arial" })] })] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [para("Kickoff Meeting")] }),
                new TableCell({ borders: cellBorders, width: { size: 1800, type: WidthType.DXA }, children: [para("Once")] }),
                new TableCell({ borders: cellBorders, width: { size: 2600, type: WidthType.DXA }, children: [para("All stakeholders")] }),
                new TableCell({ borders: cellBorders, width: { size: 2620, type: WidthType.DXA }, children: [para("Integrated Master Schedule")] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 2340, type: WidthType.DXA }, children: [para("Status Meeting")] }),
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 1800, type: WidthType.DXA }, children: [para("Weekly")] }),
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 2600, type: WidthType.DXA }, children: [para("PM, COR, Tech Leads")] }),
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 2620, type: WidthType.DXA }, children: [para("Written Status Report")] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [para("Design Reviews")] }),
                new TableCell({ borders: cellBorders, width: { size: 1800, type: WidthType.DXA }, children: [para("Per milestone")] }),
                new TableCell({ borders: cellBorders, width: { size: 2600, type: WidthType.DXA }, children: [para("Technical teams")] }),
                new TableCell({ borders: cellBorders, width: { size: 2620, type: WidthType.DXA }, children: [para("Design approval memo")] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 2340, type: WidthType.DXA }, children: [para("Executive Review")] }),
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 1800, type: WidthType.DXA }, children: [para("Monthly")] }),
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 2600, type: WidthType.DXA }, children: [para("Exec Sponsor, CO/COR")] }),
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 2620, type: WidthType.DXA }, children: [para("Executive Summary")] })
              ]})
            ]
          }),

          new Paragraph({ children: [new PageBreak()] }),
          
          // ============ SECTION 4: KEY PERSONNEL ============
          sectionHeader("4", "Key Personnel"),

          para("Singh Automation proposes the following key personnel, each with demonstrated experience in automation project execution:"),

          heading2(`4.1 Program Manager: ${personnel.pm.name}`),
          boldPara("Current Position: ", `${personnel.pm.title}, Singh Automation LLC`),
          boldPara("Role on Contract: ", "Overall program responsibility, schedule and budget management, Government interface"),
          boldPara("Availability: ", "100% dedicated during critical project phases"),
          actionItem("Complete with years of experience, relevant certifications, education credentials. Attach resume to Appendix B."),

          heading2(`4.2 Technical Lead: ${personnel.techLead.name}`),
          boldPara("Current Position: ", `${personnel.techLead.title}, Singh Automation LLC`),
          boldPara("Role on Contract: ", "Controls engineering, robot programming, PLC/HMI development, system integration"),
          boldPara("Certifications: ", "FANUC Certified, Allen-Bradley Certified"),
          actionItem("Complete with years of experience, FANUC/UR certifications, education credentials. Attach resume to Appendix B."),

          heading2(`4.3 Operations Lead: ${personnel.opsLead.name}`),
          boldPara("Current Position: ", `${personnel.opsLead.title}, Singh Automation LLC`),
          boldPara("Role on Contract: ", "Mechanical fabrication, system assembly, installation, FAT/SAT execution"),
          boldPara("Qualifications: ", "Journeyman credentials, OSHA 30-hour certified"),
          actionItem("Complete with years of experience, relevant qualifications. Attach resume to Appendix B."),

          heading2(`4.4 Quality Assurance Manager: ${personnel.qa.name}`),
          boldPara("Current Position: ", `${personnel.qa.title}, Singh Automation LLC`),
          boldPara("Role on Contract: ", "Quality control, documentation compliance, test procedures, acceptance processes"),
          boldPara("Certifications: ", "ISO 9001 Lead Auditor (or equivalent)"),
          actionItem("Complete with years of experience, quality certifications. Attach resume to Appendix B."),

          new Paragraph({ children: [new PageBreak()] }),
          
          // ============ SECTION 5: PAST PERFORMANCE ============
          sectionHeader("5", "Past Performance"),

          para("Singh Automation provides the following past performance references demonstrating relevant experience in industrial automation and robotics integration. Each reference represents work of similar scope, complexity, and technical requirements to this solicitation."),

          heading2("5.1 Reference Project 1: Lippert Components Window Automation"),

          new Table({
            columnWidths: [3120, 6240],
            rows: [
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Project Title:", bold: true, size: 20, font: "Times New Roman" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 6240, type: WidthType.DXA }, children: [para("Window Automation - 5-Robot Manufacturing Cell")] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Customer:", bold: true, size: 20, font: "Times New Roman" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 6240, type: WidthType.DXA }, children: [para("Lippert Components - Bristol, Indiana")] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Contract Value:", bold: true, size: 20, font: "Times New Roman" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 6240, type: WidthType.DXA }, children: [para("$1,600,000")] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Period of Performance:", bold: true, size: 20, font: "Times New Roman" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 6240, type: WidthType.DXA }, children: [para("January 2024 - September 2024")] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Scope of Work:", bold: true, size: 20, font: "Times New Roman" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 6240, type: WidthType.DXA }, children: [para("Designed, built, and installed 5-robot FANUC manufacturing cell for automated window fabrication. System includes material handling, precision assembly, and integrated vision-based quality inspection. Full PLC controls and safety system integration.")] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Relevance:", bold: true, size: 20, font: "Times New Roman" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 6240, type: WidthType.DXA }, children: [para("Demonstrates Singh Automation's capability in multi-robot cell design, FANUC integration, vision systems, PLC programming, and industrial manufacturing automation at scale.")] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Reference POC:", bold: true, size: 20, font: "Times New Roman" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 6240, type: WidthType.DXA }, children: [para("Tim Widner, VP - Glass, Lippert Components, Twidner@lci1.com")] })
              ]})
            ]
          }),

          heading2("5.2 Reference Project 2"),
          actionItem("Complete with second project reference"),

          new Table({
            columnWidths: [3120, 6240],
            rows: [
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Project Title:", bold: true, size: 20, font: "Times New Roman" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 6240, type: WidthType.DXA }, children: [para("[Insert project name]")] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Customer:", bold: true, size: 20, font: "Times New Roman" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 6240, type: WidthType.DXA }, children: [para("[Customer organization name]")] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Contract Value:", bold: true, size: 20, font: "Times New Roman" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 6240, type: WidthType.DXA }, children: [para("[$ amount]")] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Period of Performance:", bold: true, size: 20, font: "Times New Roman" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 6240, type: WidthType.DXA }, children: [para("[MM/YYYY - MM/YYYY]")] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Scope/Relevance:", bold: true, size: 20, font: "Times New Roman" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 6240, type: WidthType.DXA }, children: [para("[Description and similarity to current requirement]")] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Reference POC:", bold: true, size: 20, font: "Times New Roman" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 6240, type: WidthType.DXA }, children: [para("[Name, Title, Phone, Email]")] })
              ]})
            ]
          }),

          heading2("5.3 Reference Project 3"),
          actionItem("Complete with third project reference"),

          new Table({
            columnWidths: [3120, 6240],
            rows: [
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Project Title:", bold: true, size: 20, font: "Times New Roman" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 6240, type: WidthType.DXA }, children: [para("[Insert project name]")] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Customer:", bold: true, size: 20, font: "Times New Roman" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 6240, type: WidthType.DXA }, children: [para("[Customer organization name]")] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Contract Value:", bold: true, size: 20, font: "Times New Roman" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 6240, type: WidthType.DXA }, children: [para("[$ amount]")] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Period of Performance:", bold: true, size: 20, font: "Times New Roman" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 6240, type: WidthType.DXA }, children: [para("[MM/YYYY - MM/YYYY]")] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Scope/Relevance:", bold: true, size: 20, font: "Times New Roman" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 6240, type: WidthType.DXA }, children: [para("[Description and similarity to current requirement]")] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Reference POC:", bold: true, size: 20, font: "Times New Roman" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 6240, type: WidthType.DXA }, children: [para("[Name, Title, Phone, Email]")] })
              ]})
            ]
          }),

          new Paragraph({ children: [new PageBreak()] }),
          
          // ============ SECTION 6: QUALITY ASSURANCE ============
          sectionHeader("6", "Quality Assurance"),

          heading2("6.1 Quality Management System"),
          para(`Singh Automation maintains a comprehensive quality management system overseen by ${personnel.qa.name}. Our approach emphasizes prevention over detection, with quality built into every project phase.`),

          heading2("6.2 Quality Control Checkpoints"),
          new Table({
            columnWidths: [2340, 3500, 3500],
            rows: [
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: headerShading, width: { size: 2340, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun({ text: "MILESTONE", bold: true, color: "FFFFFF", size: 16, font: "Arial" })] })] }),
                new TableCell({ borders: cellBorders, shading: headerShading, width: { size: 3500, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun({ text: "INSPECTION/TEST", bold: true, color: "FFFFFF", size: 16, font: "Arial" })] })] }),
                new TableCell({ borders: cellBorders, shading: headerShading, width: { size: 3500, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun({ text: "ACCEPTANCE CRITERIA", bold: true, color: "FFFFFF", size: 16, font: "Arial" })] })] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [para("Design Review")] }),
                new TableCell({ borders: cellBorders, width: { size: 3500, type: WidthType.DXA }, children: [para("100% requirements traceability review")] }),
                new TableCell({ borders: cellBorders, width: { size: 3500, type: WidthType.DXA }, children: [para("All requirements traced to design elements")] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 2340, type: WidthType.DXA }, children: [para("FAT")] }),
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 3500, type: WidthType.DXA }, children: [para("Functional test of all operating modes")] }),
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 3500, type: WidthType.DXA }, children: [para("100% test procedures pass")] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [para("SAT")] }),
                new TableCell({ borders: cellBorders, width: { size: 3500, type: WidthType.DXA }, children: [para("On-site functional verification")] }),
                new TableCell({ borders: cellBorders, width: { size: 3500, type: WidthType.DXA }, children: [para("System meets all contract requirements")] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 2340, type: WidthType.DXA }, children: [para("Final Acceptance")] }),
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 3500, type: WidthType.DXA }, children: [para("Documentation review, training completion")] }),
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 3500, type: WidthType.DXA }, children: [para("All deliverables complete and accepted")] })
              ]})
            ]
          }),

          heading2("6.3 Non-Conformance Management"),
          para("Any non-conformances identified during inspections or testing will be documented, analyzed for root cause, corrected, and verified before proceeding. The Government will be notified of any non-conformances that may impact schedule or performance."),

          new Paragraph({ children: [new PageBreak()] }),

          // ============ SECTION 7: RISK MANAGEMENT ============
          sectionHeader("7", "Risk Management"),

          heading2("7.1 Risk Management Approach"),
          para("Singh Automation employs a proactive risk management methodology. The Program Manager maintains a formal Risk Register reviewed weekly, with escalation paths for emerging risks that exceed defined thresholds."),

          heading2("7.2 Identified Risks and Mitigations"),
          new Table({
            columnWidths: [2200, 1000, 1000, 2580, 2580],
            rows: [
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: headerShading, width: { size: 2200, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun({ text: "RISK", bold: true, color: "FFFFFF", size: 14, font: "Arial" })] })] }),
                new TableCell({ borders: cellBorders, shading: headerShading, width: { size: 1000, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PROB", bold: true, color: "FFFFFF", size: 14, font: "Arial" })] })] }),
                new TableCell({ borders: cellBorders, shading: headerShading, width: { size: 1000, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "IMPACT", bold: true, color: "FFFFFF", size: 14, font: "Arial" })] })] }),
                new TableCell({ borders: cellBorders, shading: headerShading, width: { size: 2580, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun({ text: "MITIGATION", bold: true, color: "FFFFFF", size: 14, font: "Arial" })] })] }),
                new TableCell({ borders: cellBorders, shading: headerShading, width: { size: 2580, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun({ text: "CONTINGENCY", bold: true, color: "FFFFFF", size: 14, font: "Arial" })] })] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, width: { size: 2200, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Equipment lead time exceeds schedule", size: 18, font: "Times New Roman" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 1000, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "M", size: 18 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 1000, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "H", size: 18 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 2580, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Early procurement; FANUC priority status", size: 18 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 2580, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Expedited shipping; alternate sources", size: 18 })] })] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 2200, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Site integration complications", size: 18, font: "Times New Roman" })] })] }),
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 1000, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "M", size: 18 })] })] }),
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 1000, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "M", size: 18 })] })] }),
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 2580, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Detailed site survey; ICD documentation", size: 18 })] })] }),
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 2580, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Extended on-site support", size: 18 })] })] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, width: { size: 2200, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Scope creep during design", size: 18, font: "Times New Roman" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 1000, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "M", size: 18 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 1000, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "M", size: 18 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 2580, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Formal change control process", size: 18 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 2580, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Contract modification", size: 18 })] })] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 2200, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Key personnel unavailability", size: 18, font: "Times New Roman" })] })] }),
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 1000, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "L", size: 18 })] })] }),
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 1000, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "M", size: 18 })] })] }),
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 2580, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Cross-training; backup assignments", size: 18 })] })] }),
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 2580, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Subcontractor support", size: 18 })] })] })
              ]})
            ]
          }),

          new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: "Legend: L = Low, M = Medium, H = High", size: 18, font: "Times New Roman", italics: true, color: lightGray })] }),

          new Paragraph({ children: [new PageBreak()] }),

          // ============ APPENDIX A: COMPLIANCE MATRIX ============
          sectionHeader("A", "Compliance Matrix"),

          para("The following matrix demonstrates Singh Automation's compliance with key solicitation requirements:"),

          new Table({
            columnWidths: [4680, 2340, 2340],
            rows: [
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: headerShading, width: { size: 4680, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun({ text: "REQUIREMENT", bold: true, color: "FFFFFF", size: 16, font: "Arial" })] })] }),
                new TableCell({ borders: cellBorders, shading: headerShading, width: { size: 2340, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "COMPLIANCE", bold: true, color: "FFFFFF", size: 16, font: "Arial" })] })] }),
                new TableCell({ borders: cellBorders, shading: headerShading, width: { size: 2340, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SECTION REF", bold: true, color: "FFFFFF", size: 16, font: "Arial" })] })] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, width: { size: 4680, type: WidthType.DXA }, children: [para("Technical approach addressing all PWS requirements")] }),
                new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "COMPLIANT", size: 18, bold: true, color: "2E7D32" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Section 2", size: 18 })] })] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 4680, type: WidthType.DXA }, children: [para("Management approach and organization")] }),
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "COMPLIANT", size: 18, bold: true, color: "2E7D32" })] })] }),
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Section 3", size: 18 })] })] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, width: { size: 4680, type: WidthType.DXA }, children: [para("Key personnel with required qualifications")] }),
                new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "COMPLIANT", size: 18, bold: true, color: "2E7D32" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Section 4", size: 18 })] })] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 4680, type: WidthType.DXA }, children: [para("Past performance references (minimum 3)")] }),
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "COMPLIANT", size: 18, bold: true, color: "2E7D32" })] })] }),
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Section 5", size: 18 })] })] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, width: { size: 4680, type: WidthType.DXA }, children: [para("Quality assurance plan")] }),
                new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "COMPLIANT", size: 18, bold: true, color: "2E7D32" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Section 6", size: 18 })] })] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 4680, type: WidthType.DXA }, children: [para("Small Business certification")] }),
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "COMPLIANT", size: 18, bold: true, color: "2E7D32" })] })] }),
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SAM.gov", size: 18 })] })] })
              ]})
            ]
          }),

          actionItem("Review solicitation Section L/M requirements and update compliance matrix as needed"),

          new Paragraph({ children: [new PageBreak()] }),

          // ============ APPENDIX B: REQUIRED ATTACHMENTS ============
          sectionHeader("B", "Required Attachments"),

          para("The following attachments are required prior to proposal submission:"),

          new Paragraph({ spacing: { before: 300 } }),

          // Attachments checklist table
          new Table({
            columnWidths: [5460, 1800, 2100],
            rows: [
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: headerShading, width: { size: 5460, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun({ text: "ATTACHMENT", bold: true, color: "FFFFFF", size: 16, font: "Arial" })] })] }),
                new TableCell({ borders: cellBorders, shading: headerShading, width: { size: 1800, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "STATUS", bold: true, color: "FFFFFF", size: 16, font: "Arial" })] })] }),
                new TableCell({ borders: cellBorders, shading: headerShading, width: { size: 2100, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "RESPONSIBILITY", bold: true, color: "FFFFFF", size: 16, font: "Arial" })] })] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, width: { size: 5460, type: WidthType.DXA }, children: [para("Key Personnel Resumes (4)")] }),
                new TableCell({ borders: cellBorders, width: { size: 1800, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "☐ Pending", size: 18 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 2100, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "HR/Personnel", size: 18 })] })] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 5460, type: WidthType.DXA }, children: [para("FANUC Authorized System Integrator Certificate")] }),
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 1800, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "☐ Pending", size: 18 })] })] }),
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 2100, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Operations", size: 18 })] })] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, width: { size: 5460, type: WidthType.DXA }, children: [para("SAM.gov Registration (Active)")] }),
                new TableCell({ borders: cellBorders, width: { size: 1800, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "☑ Complete", size: 18, color: "2E7D32" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 2100, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Compliance", size: 18 })] })] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, width: { size: 5460, type: WidthType.DXA }, children: [para("W-9 Form (Current)")] }),
                new TableCell({ borders: cellBorders, width: { size: 1800, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "☑ Complete", size: 18, color: "2E7D32" })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 2100, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Finance", size: 18 })] })] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 5460, type: WidthType.DXA }, children: [para("Certificate of Insurance")] }),
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 1800, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "☐ Pending", size: 18 })] })] }),
                new TableCell({ borders: cellBorders, shading: altRowShading, width: { size: 2100, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Finance", size: 18 })] })] })
              ]}),
              new TableRow({ children: [
                new TableCell({ borders: cellBorders, width: { size: 5460, type: WidthType.DXA }, children: [para("SF 330 (if required by solicitation)")] }),
                new TableCell({ borders: cellBorders, width: { size: 1800, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "☐ If Required", size: 18 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 2100, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "BD Team", size: 18 })] })] })
              ]})
            ]
          }),

          new Paragraph({ spacing: { before: 400 } }),

          // Final review checklist
          new Paragraph({
            shading: successShading,
            spacing: { before: 200, after: 100 },
            border: { left: { color: "2E7D32", size: 16, style: BorderStyle.SINGLE } },
            indent: { left: 360 },
            children: [new TextRun({ text: "PRE-SUBMISSION CHECKLIST", bold: true, size: 22, font: "Arial", color: "2E7D32" })]
          }),

          new Paragraph({ spacing: { before: 100 }, children: [new TextRun({ text: "☐  All [ACTION REQUIRED] items completed", size: 20, font: "Times New Roman" })] }),
          new Paragraph({ children: [new TextRun({ text: "☐  Past performance references verified and current", size: 20, font: "Times New Roman" })] }),
          new Paragraph({ children: [new TextRun({ text: "☐  All attachments gathered and formatted", size: 20, font: "Times New Roman" })] }),
          new Paragraph({ children: [new TextRun({ text: "☐  Compliance matrix reviewed against Section L/M", size: 20, font: "Times New Roman" })] }),
          new Paragraph({ children: [new TextRun({ text: "☐  Executive review and sign-off obtained", size: 20, font: "Times New Roman" })] }),
          new Paragraph({ children: [new TextRun({ text: "☐  Proposal submitted before deadline", size: 20, font: "Times New Roman" })] }),

          new Paragraph({ spacing: { before: 400 } }),

          // End statement
          new Paragraph({
            alignment: AlignmentType.CENTER,
            shading: { fill: navy, type: ShadingType.CLEAR },
            spacing: { before: 200, after: 200 },
            children: [new TextRun({ text: "END OF VOLUME I: TECHNICAL AND MANAGEMENT PROPOSAL", bold: true, size: 20, font: "Arial", color: "FFFFFF" })]
          })
        ]
      }]
    });

    // Generate document buffer
    const buffer = await Packer.toBuffer(doc);
    
    // Set response headers for file download
    const filename = `Singh_Proposal_${title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50)}.docx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    
    return res.status(200).send(buffer);

  } catch (error) {
    console.error('Error generating proposal:', error);
    return res.status(500).json({ error: error.message });
  }
}
