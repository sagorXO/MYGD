const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

async function createPitchPdf() {
  const pdfDoc = await PDFDocument.create();
  
  // Landscape 16:9 aspect ratio in points: 960 x 540 pt
  const pageWidth = 960;
  const pageHeight = 540;

  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const assetsDir = path.join(__dirname, '../assets/slides');

  const slides = [
    {
      num: 1,
      tag: "PROBLEM & DIAGNOSIS",
      title: "The Status Quo vs. The Modern Unified Future",
      subtitle: "Transforming 12 Disconnected Tools into One Connected Operations Engine",
      image: "slide_01_status_quo.jpg",
      takeaway: "Eliminates WhatsApp ordering chaos, 2000-era POS failure risks, and absent-owner blindness."
    },
    {
      num: 2,
      tag: "SYSTEM ARCHITECTURE",
      title: "The 3-Layer Architectural Fortress (Offline Edge)",
      subtitle: "Zero-Downtime Architecture Engineered for High-Volume Fast-Casual Restaurants",
      image: "slide_02_architecture.jpg",
      takeaway: "Layer 2 In-Store Edge Mini-PC keeps tills, printers, and kitchen screens running 100% offline."
    },
    {
      num: 3,
      tag: "MODULAR BLUEPRINT",
      title: "The 11 Modular Building Blocks (Phased Value)",
      subtitle: "Comprehensive Restaurant Operating System Structured Across 8 Phased Milestones",
      image: "slide_03_building_blocks.jpg",
      takeaway: "Each module delivers immediate standalone value before the next is built. First value in Week 3."
    },
    {
      num: 4,
      tag: "OPERATIONAL IMPACT",
      title: "Real-World Scenarios Solved",
      subtitle: "Predictive Bakery Alerts, Remote Owner HUD, and Instant Multi-Store Synchronization",
      image: "slide_04_real_world_scenarios.jpg",
      takeaway: "Automatic 15:30 bakery reorder triggers prevent 21:00 bread stockouts and lost revenue."
    },
    {
      num: 5,
      tag: "GUEST EXPERIENCE & BRAND",
      title: "Brand Identity & Touch Kiosk Customizer",
      subtitle: "BITE THE HYPE — 3-Step Meat Customizer, 5-Flame Spice Meter, and Meal Combos",
      image: "slide_05_kiosk_customizer.jpg",
      takeaway: "Streamlined touch UX drives 18-24% higher Average Order Value (AOV) via 1-tap combo upsells."
    },
    {
      num: 6,
      tag: "KITCHEN SPEED & FLOW",
      title: "Multi-Station Kitchen Display System (KDS)",
      subtitle: "Grill, Assembly, and Fryer Station Routing with Cook Claim Locking and Urgency Timers",
      image: "slide_06_kitchen_kds.jpg",
      takeaway: "Single-tap claim locking prevents double-prepped tickets; keeps ticket times under 4 minutes."
    },
    {
      num: 7,
      tag: "COMMERCIAL HARDWARE",
      title: "In-Store Hardware & Infrastructure Stack",
      subtitle: "Commercial-Grade Open Hardware Stack with Zero Proprietary Vendor Lock-In",
      image: "slide_07_hardware_stack.jpg",
      takeaway: "Complete hardware package ~€2,800 to €3,400 one-time capital investment per restaurant."
    },
    {
      num: 8,
      tag: "FINANCIAL JUSTIFICATION",
      title: "Financial ROI & Monthly Cost Savings",
      subtitle: "+€6,000+ / Month Value Created Per Store — System Pays for Itself in < 4 Months",
      image: "slide_08_financial_roi.jpg",
      takeaway: "Recovers lost sales, stops food waste, eliminates SaaS subscriptions, and boosts throughput."
    },
    {
      num: 9,
      tag: "RISK & COMPLIANCE",
      title: "Enterprise Risk Analysis & Defenses",
      subtitle: "Architectural Protections Against Internet Outages, Staff Resistance, and Cyprus Taxes",
      image: "slide_09_risk_mitigation.jpg",
      takeaway: "Native 19% Cyprus VAT engine, offline SQLite WAL failover, and visual McDonald's-style build sheets."
    },
    {
      num: 10,
      tag: "STRATEGIC ROADMAP",
      title: "Strategic System Roadmap & Immediate Next Steps",
      subtitle: "Clear 8-Phase Rollout Plan with Immediate Phase 1 Kickoff in Emba / Paphos",
      image: "slide_10_strategic_roadmap.jpg",
      takeaway: "Phase 1 Digital Checklists & HACCP Logbook goes live in Week 3."
    },
    {
      num: 11,
      tag: "COMPREHENSIVE READINESS",
      title: "Full Coverage of Missing Sections 4-9 & Operational Gaps",
      subtitle: "Complete Engineering Solutions for Timeline, Hardware, Cost ROI, Decisions & Next Steps",
      image: "slide_11_gap_coverage.jpg",
      takeaway: "Every uncaptured brief section and client open question is resolved and 100% ready for execution."
    }
  ];

  // ==========================================
  // 1. EXECUTIVE COVER SLIDE
  // ==========================================
  const coverPage = pdfDoc.addPage([pageWidth, pageHeight]);
  
  // Background: Dark Charcoal #0D0D0F
  coverPage.drawRectangle({
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    color: rgb(0.05, 0.05, 0.06),
  });

  // Top Neon Accent Bar
  coverPage.drawRectangle({
    x: 0,
    y: pageHeight - 6,
    width: pageWidth,
    height: 6,
    color: rgb(0.9, 0.05, 0.49), // Electric Magenta
  });

  // Brand Pill Badge
  coverPage.drawRectangle({
    x: 80,
    y: 415,
    width: 250,
    height: 28,
    color: rgb(0.1, 0.1, 0.12),
    borderColor: rgb(0.0, 0.98, 0.93), // Neon Cyan
    borderWidth: 1,
  });
  coverPage.drawText("EXECUTIVE PROPOSAL & STRATEGY", {
    x: 95,
    y: 424,
    size: 9.5,
    font: helveticaBold,
    color: rgb(0.0, 0.98, 0.93),
  });

  // Main Title
  coverPage.drawText("MY GERMAN DÖNER", {
    x: 80,
    y: 345,
    size: 44,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });

  coverPage.drawText("CONNECTED OPERATIONS CONTROL SYSTEM", {
    x: 80,
    y: 305,
    size: 19,
    font: helveticaBold,
    color: rgb(0.9, 0.05, 0.49),
  });

  // Subtitle / Tagline
  coverPage.drawText("One Connected System Instead of Twelve Disconnected Tools", {
    x: 80,
    y: 262,
    size: 14,
    font: helvetica,
    color: rgb(0.85, 0.85, 0.88),
  });

  coverPage.drawText("An Offline-Resilient, Multi-Store Digital Nervous System for Fast-Casual Scale", {
    x: 80,
    y: 242,
    size: 12,
    font: helvetica,
    color: rgb(0.65, 0.65, 0.7),
  });

  // Divider Line
  coverPage.drawLine({
    start: { x: 80, y: 205 },
    end: { x: pageWidth - 80, y: 205 },
    thickness: 1,
    color: rgb(0.2, 0.2, 0.23),
  });

  // Metadata Grid
  const metaY = 140;
  // Col 1: Target Audience
  coverPage.drawText("TARGET STAKEHOLDERS", { x: 80, y: metaY + 25, size: 9, font: helveticaBold, color: rgb(0.0, 0.98, 0.93) });
  coverPage.drawText("Rico & Oli (Founders / Owners)", { x: 80, y: metaY + 10, size: 11, font: helveticaBold, color: rgb(1, 1, 1) });
  coverPage.drawText("Markus (Project & Technical Lead)", { x: 80, y: metaY - 5, size: 10, font: helvetica, color: rgb(0.8, 0.8, 0.82) });

  // Col 2: Locations
  coverPage.drawText("DEPLOYMENT LOCATIONS", { x: 350, y: metaY + 25, size: 9, font: helveticaBold, color: rgb(0.0, 0.98, 0.93) });
  coverPage.drawText("Emba / Paphos Flagship (Live)", { x: 350, y: metaY + 10, size: 11, font: helveticaBold, color: rgb(1, 1, 1) });
  coverPage.drawText("Limassol Marina (Expansion)", { x: 350, y: metaY - 5, size: 10, font: helvetica, color: rgb(0.8, 0.8, 0.82) });

  // Col 3: Architecture
  coverPage.drawText("CORE ARCHITECTURE", { x: 620, y: metaY + 25, size: 9, font: helveticaBold, color: rgb(0.0, 0.98, 0.93) });
  coverPage.drawText("3-Layer Offline Edge + Cloud HQ", { x: 620, y: metaY + 10, size: 11, font: helveticaBold, color: rgb(1, 1, 1) });
  coverPage.drawText("11 Building Blocks • 8 Phased Milestones", { x: 620, y: metaY - 5, size: 10, font: helvetica, color: rgb(0.8, 0.8, 0.82) });

  // Bottom Footer
  coverPage.drawText("CONFIDENTIAL & PROPRIETARY • BITE THE HYPE • MYGERMANDOENER.COM", {
    x: 80,
    y: 50,
    size: 9,
    font: helvetica,
    color: rgb(0.4, 0.4, 0.45),
  });

  // ==========================================
  // 2. EMBED EACH OF THE 11 SLIDES
  // ==========================================
  for (const slide of slides) {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Background: Dark Slate
    page.drawRectangle({
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
      color: rgb(0.05, 0.05, 0.06),
    });

    // Top Accent Bar
    page.drawRectangle({
      x: 0,
      y: pageHeight - 4,
      width: pageWidth,
      height: 4,
      color: rgb(0.9, 0.05, 0.49),
    });

    // Header Meta
    page.drawText(`SLIDE ${String(slide.num).padStart(2, '0')} / 11 • ${slide.tag}`, {
      x: 40,
      y: pageHeight - 26,
      size: 8.5,
      font: helveticaBold,
      color: rgb(0.0, 0.98, 0.93),
    });

    page.drawText(slide.title.toUpperCase(), {
      x: 230,
      y: pageHeight - 26,
      size: 10,
      font: helveticaBold,
      color: rgb(1, 1, 1),
    });

    page.drawText("MY GERMAN DÖNER CONTROL SYSTEM", {
      x: pageWidth - 240,
      y: pageHeight - 26,
      size: 8.5,
      font: helvetica,
      color: rgb(0.5, 0.5, 0.55),
    });

    // Divider Line
    page.drawLine({
      start: { x: 40, y: pageHeight - 34 },
      end: { x: pageWidth - 40, y: pageHeight - 34 },
      thickness: 1,
      color: rgb(0.18, 0.18, 0.2),
    });

    // Load and Embed Image from assetsDir
    const imgPath = path.join(assetsDir, slide.image);
    if (fs.existsSync(imgPath)) {
      const imgBytes = fs.readFileSync(imgPath);
      const embeddedImg = await pdfDoc.embedJpg(imgBytes);

      // 16:9 Image Box: x=40, y=70, w=880, h=420
      const imgW = 880;
      const imgH = 420;
      const imgX = 40;
      const imgY = 72;

      page.drawImage(embeddedImg, {
        x: imgX,
        y: imgY,
        width: imgW,
        height: imgH,
      });

      // Border around slide frame
      page.drawRectangle({
        x: imgX,
        y: imgY,
        width: imgW,
        height: imgH,
        borderColor: rgb(0.2, 0.2, 0.23),
        borderWidth: 1,
      });
    }

    // Bottom Takeaway Footer Pill
    page.drawRectangle({
      x: 40,
      y: 18,
      width: pageWidth - 80,
      height: 38,
      color: rgb(0.1, 0.1, 0.12),
      borderColor: rgb(0.2, 0.2, 0.23),
      borderWidth: 1,
    });

    page.drawText("STRATEGIC TAKEAWAY:", {
      x: 55,
      y: 33,
      size: 8.5,
      font: helveticaBold,
      color: rgb(0.9, 0.05, 0.49),
    });

    page.drawText(slide.takeaway, {
      x: 185,
      y: 33,
      size: 9,
      font: helvetica,
      color: rgb(0.9, 0.9, 0.92),
    });
  }

  // ==========================================
  // 3. EXECUTIVE APPENDIX & SUMMARY SLIDE
  // ==========================================
  const summaryPage = pdfDoc.addPage([pageWidth, pageHeight]);
  
  summaryPage.drawRectangle({
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    color: rgb(0.05, 0.05, 0.06),
  });

  // Top Neon Bar
  summaryPage.drawRectangle({
    x: 0,
    y: pageHeight - 6,
    width: pageWidth,
    height: 6,
    color: rgb(0.0, 0.98, 0.93),
  });

  summaryPage.drawText("EXECUTIVE DECISION SUMMARY & IMMEDIATE KICKOFF", {
    x: 40,
    y: pageHeight - 42,
    size: 18,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });

  summaryPage.drawText("Actionable Next Steps for Rico, Oli, and Markus to Launch Phase 1", {
    x: 40,
    y: pageHeight - 64,
    size: 11,
    font: helvetica,
    color: rgb(0.7, 0.7, 0.75),
  });

  // 3 Column Action Cards
  const cardW = 275;
  const cardH = 345;
  const cardY = 65;

  // Card 1: The Business Value
  summaryPage.drawRectangle({
    x: 40,
    y: cardY,
    width: cardW,
    height: cardH,
    color: rgb(0.1, 0.1, 0.12),
    borderColor: rgb(0.9, 0.05, 0.49),
    borderWidth: 1,
  });

  summaryPage.drawText("1. FINANCIAL & ROI METRICS", {
    x: 55,
    y: cardY + cardH - 28,
    size: 11,
    font: helveticaBold,
    color: rgb(0.9, 0.05, 0.49),
  });

  const roiLines = [
    "• +€6,000+ Net Monthly Value / Store",
    "• €450/mo saved on cancelled SaaS",
    "• €1,850/mo saved on prevented waste",
    "• €2,100/mo gain via kiosk upsells",
    "• System pays for itself in < 4 months",
    "• 100% intellectual property ownership",
    "• Zero recurring per-terminal license fees"
  ];
  let rY = cardY + cardH - 58;
  for (const line of roiLines) {
    summaryPage.drawText(line, { x: 55, y: rY, size: 9.5, font: helvetica, color: rgb(0.85, 0.85, 0.88) });
    rY -= 22;
  }

  // Card 2: Core Architectural Guarantees
  summaryPage.drawRectangle({
    x: 342,
    y: cardY,
    width: cardW,
    height: cardH,
    color: rgb(0.1, 0.1, 0.12),
    borderColor: rgb(0.0, 0.98, 0.93),
    borderWidth: 1,
  });

  summaryPage.drawText("2. ARCHITECTURAL GUARANTEES", {
    x: 357,
    y: cardY + cardH - 28,
    size: 11,
    font: helveticaBold,
    color: rgb(0.0, 0.98, 0.93),
  });

  const archLines = [
    "• Zero-Downtime Local Edge Hub",
    "• Tills & KDS run 100% offline",
    "• 1 Single Source of Truth for Prices",
    "• Multi-store ready (Emba + Limassol)",
    "• Automatic 19% Cyprus VAT calculation",
    "• McDonald's-style photo build sheets",
    "• 15:30 predictive bakery PO alerts"
  ];
  let aY = cardY + cardH - 58;
  for (const line of archLines) {
    summaryPage.drawText(line, { x: 357, y: aY, size: 9.5, font: helvetica, color: rgb(0.85, 0.85, 0.88) });
    aY -= 22;
  }

  // Card 3: Kickoff Action Items
  summaryPage.drawRectangle({
    x: 645,
    y: cardY,
    width: cardW,
    height: cardH,
    color: rgb(0.1, 0.1, 0.12),
    borderColor: rgb(0.9, 0.66, 0.24), // Gold
    borderWidth: 1,
  });

  summaryPage.drawText("3. CLIENT ACTION CHECKLIST", {
    x: 660,
    y: cardY + cardH - 28,
    size: 11,
    font: helveticaBold,
    color: rgb(0.9, 0.66, 0.24),
  });

  const clientLines = [
    "• Provide existing SOP checklists",
    "• Provide supplier contacts & rules",
    "• Finalize meat gram weights (150g/100g)",
    "• Approve Milestone 1 SOW & Scope",
    "• Phase 1 Deployment target: 3 Weeks",
    "• First live value: Digital HACCP Log",
    "• Contact: lead-engineer@mygd.dev"
  ];
  let cY = cardY + cardH - 58;
  for (const line of clientLines) {
    summaryPage.drawText(line, { x: 660, y: cY, size: 9.5, font: helvetica, color: rgb(0.85, 0.85, 0.88) });
    cY -= 22;
  }

  // Footer
  summaryPage.drawText("MY GERMAN DÖNER CONTROL SYSTEM • Paphos Flagship & Limassol Expansion • © 2026 All Rights Reserved", {
    x: 40,
    y: 28,
    size: 8.5,
    font: helvetica,
    color: rgb(0.4, 0.4, 0.45),
  });

  // Save to Documents/ and project root
  const pdfBytes = await pdfDoc.save();
  
  const targetDir = path.join(__dirname, '../Documents');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const outDocPath = path.join(targetDir, 'MY_GERMAN_DONER_Executive_Pitch_Deck.pdf');
  const outRootPath = path.join(__dirname, '../MY_GERMAN_DONER_Executive_Pitch_Deck.pdf');

  fs.writeFileSync(outDocPath, pdfBytes);
  fs.writeFileSync(outRootPath, pdfBytes);

  console.log('13-page PDF successfully generated at:');
  console.log('1.', outDocPath);
  console.log('2.', outRootPath);
  console.log('Total pages:', pdfDoc.getPageCount());
}

createPitchPdf().catch(err => {
  console.error('Error creating 13-page PDF:', err);
  process.exit(1);
});
