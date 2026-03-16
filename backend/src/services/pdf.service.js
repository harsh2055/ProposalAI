/**
 * PDF Service — Generate professional proposal PDFs using PDFKit
 */

const PDFDocument = require("pdfkit");
const logger = require("../utils/logger");

// Brand colors
const COLORS = {
  primary: "#1a1a2e",
  accent: "#6c63ff",
  text: "#333333",
  lightText: "#666666",
  border: "#e5e7eb",
  background: "#f9fafb",
  white: "#ffffff",
};

/**
 * Convert hex color to RGB array for PDFKit
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
}

/**
 * Draw a section header
 */
function drawSectionHeader(doc, title) {
  doc.moveDown(0.5);
  doc
    .fillColor(COLORS.accent)
    .fontSize(14)
    .font("Helvetica-Bold")
    .text(title.toUpperCase(), { characterSpacing: 1 });
  
  // Underline
  const y = doc.y + 4;
  doc
    .moveTo(doc.page.margins.left, y)
    .lineTo(doc.page.width - doc.page.margins.right, y)
    .strokeColor(COLORS.accent)
    .lineWidth(1.5)
    .stroke();
  
  doc.moveDown(0.5);
}

/**
 * Draw page header with logo area and proposal title
 */
function drawHeader(doc, proposal) {
  const { width, margins } = doc.page;
  const contentWidth = width - margins.left - margins.right;

  // Header background
  doc.rect(0, 0, width, 100).fill(COLORS.primary);

  // Company/User name
  doc
    .fillColor(COLORS.white)
    .fontSize(10)
    .font("Helvetica")
    .text(
      proposal.user?.name || "ProposalAI",
      margins.left,
      20,
      { width: contentWidth }
    );

  // Proposal title
  doc
    .fillColor(COLORS.white)
    .fontSize(22)
    .font("Helvetica-Bold")
    .text(proposal.title, margins.left, 40, { width: contentWidth });

  // Accent line
  doc
    .moveTo(margins.left, 80)
    .lineTo(margins.left + 60, 80)
    .strokeColor(COLORS.accent)
    .lineWidth(3)
    .stroke();

  doc.y = 120;
}

/**
 * Draw client info block
 */
function drawClientBlock(doc, proposal) {
  if (!proposal.client) return;

  const { margins } = doc.page;
  const blockY = doc.y;

  doc.rect(margins.left, blockY, 200, 70).fill(COLORS.background);

  doc
    .fillColor(COLORS.lightText)
    .fontSize(8)
    .font("Helvetica")
    .text("PREPARED FOR", margins.left + 10, blockY + 10);

  doc
    .fillColor(COLORS.text)
    .fontSize(13)
    .font("Helvetica-Bold")
    .text(proposal.client.name, margins.left + 10, blockY + 22);

  doc
    .fillColor(COLORS.lightText)
    .fontSize(10)
    .font("Helvetica")
    .text(proposal.client.company, margins.left + 10, blockY + 40)
    .text(proposal.client.email, margins.left + 10, blockY + 54);

  // Date block
  doc
    .fillColor(COLORS.lightText)
    .fontSize(8)
    .text("DATE", 400, blockY + 10)
    .fillColor(COLORS.text)
    .fontSize(11)
    .text(new Date(proposal.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }), 400, blockY + 22);

  doc.y = blockY + 90;
}

/**
 * Add page numbers to existing pages
 */
function addPageNumbers(doc) {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    doc
      .fillColor(COLORS.lightText)
      .fontSize(9)
      .text(
        `Page ${i + 1} of ${range.count}`,
        0,
        doc.page.height - 40,
        { align: "center" }
      );
  }
}

/**
 * Write a content section
 */
function writeSection(doc, title, content) {
  if (!content) return;

  drawSectionHeader(doc, title);

  doc
    .fillColor(COLORS.text)
    .fontSize(10.5)
    .font("Helvetica")
    .text(content, {
      align: "justify",
      lineGap: 4,
    });

  doc.moveDown(1.5);
}

/**
 * Main function: generate PDF buffer from proposal data
 */
async function generatePDF(proposal) {
  return new Promise((resolve, reject) => {
    const buffers = [];

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 60, bottom: 60, left: 60, right: 60 },
      bufferPages: true,
      info: {
        Title: proposal.title,
        Author: proposal.user?.name || "ProposalAI",
        Subject: "Business Proposal",
        Creator: "ProposalAI",
      },
    });

    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => {
      addPageNumbers(doc);
      resolve(Buffer.concat(buffers));
    });
    doc.on("error", reject);

    // ── Page 1: Cover ────────────────────────────────────────────
    drawHeader(doc, proposal);
    doc.moveDown(1);
    drawClientBlock(doc, proposal);

    doc.moveDown(2);

    // Executive summary strip
    if (proposal.projectOverview) {
      const firstSentence = proposal.projectOverview.split(".")[0] + ".";
      doc
        .rect(
          doc.page.margins.left,
          doc.y,
          doc.page.width - doc.page.margins.left - doc.page.margins.right,
          50
        )
        .fill("#f0eeff");

      doc
        .fillColor(COLORS.accent)
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("EXECUTIVE SUMMARY", doc.page.margins.left + 10, doc.y - 45);

      doc
        .fillColor(COLORS.text)
        .fontSize(10)
        .font("Helvetica")
        .text(firstSentence, doc.page.margins.left + 10, doc.y - 30, {
          width: doc.page.width - doc.page.margins.left - doc.page.margins.right - 20,
        });

      doc.y = doc.y + 20;
    }

    doc.moveDown(1);

    // ── Proposal Sections ────────────────────────────────────────
    const sections = [
      { title: "1. Project Overview", content: proposal.projectOverview },
      { title: "2. Scope of Work", content: proposal.scopeOfWork },
      { title: "3. Deliverables", content: proposal.deliverables },
      { title: "4. Timeline", content: proposal.timeline },
      { title: "5. Pricing Breakdown", content: proposal.pricing },
      { title: "6. Terms & Conditions", content: proposal.terms },
      { title: "7. Closing Statement", content: proposal.closingStatement },
    ];

    for (const section of sections) {
      // Check remaining space; add new page if needed
      if (doc.y > doc.page.height - 200) {
        doc.addPage();
      }
      writeSection(doc, section.title, section.content);
    }

    // ── Footer ───────────────────────────────────────────────────
    doc
      .moveDown(2)
      .fillColor(COLORS.lightText)
      .fontSize(8)
      .text(
        `Generated by ProposalAI • ${new Date().toLocaleDateString()}`,
        { align: "center" }
      );

    doc.flushPages();
    doc.end();

    logger.info(`PDF generated for proposal: ${proposal.id}`);
  });
}

module.exports = { generatePDF };
