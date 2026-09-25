import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

OUTPUT_DIR = "/Users/saiedsagar/DEVELOPER/DEVELOPER/MYGD/Documents"

# Colors
COLOR_PRIMARY = RGBColor(31, 31, 33)      # Charcoal #1F1F21
COLOR_MAGENTA = RGBColor(229, 13, 126)   # Magenta #E50D7E
COLOR_CYAN = RGBColor(0, 252, 237)       # Cyan #00FCED
COLOR_GOLD = RGBColor(229, 169, 60)      # Gold #E5A93C
COLOR_MUTED = RGBColor(100, 100, 105)
COLOR_WHITE = RGBColor(255, 255, 255)

HEX_PRIMARY = "1F1F21"
HEX_MAGENTA = "E50D7E"
HEX_LIGHT_BG = "F4F4F6"

def set_cell_background(cell, fill_hex):
    tcPr = cell._element.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._element.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def add_header(doc, title, subtitle=None):
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(2)
    run_brand = p_title.add_run("MY GERMAN DÖNER\n")
    run_brand.font.name = "Arial"
    run_brand.font.size = Pt(16)
    run_brand.font.bold = True
    run_brand.font.color.rgb = COLOR_MAGENTA

    run_title = p_title.add_run(title)
    run_title.font.name = "Arial"
    run_title.font.size = Pt(13.5)
    run_title.font.bold = True
    run_title.font.color.rgb = COLOR_PRIMARY

    if subtitle:
        p_sub = doc.add_paragraph()
        p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_sub.paragraph_format.space_before = Pt(2)
        p_sub.paragraph_format.space_after = Pt(14)
        run_sub = p_sub.add_run(subtitle)
        run_sub.font.name = "Arial"
        run_sub.font.size = Pt(9.5)
        run_sub.font.italic = True
        run_sub.font.color.rgb = COLOR_MUTED

    p_div = doc.add_paragraph()
    p_div.paragraph_format.space_before = Pt(0)
    p_div.paragraph_format.space_after = Pt(12)
    run_div = p_div.add_run("―" * 58)
    run_div.font.color.rgb = COLOR_MAGENTA

def add_section_heading(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(4)
    run = p.add_run(text)
    run.font.name = "Arial"
    run.font.size = Pt(11)
    run.font.bold = True
    run.font.color.rgb = COLOR_PRIMARY
    return p

def add_body_p(doc, text, bold_prefix=None, space_after=6, italic=False):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_b = p.add_run(bold_prefix)
        r_b.font.name = "Arial"
        r_b.font.size = Pt(9.5)
        r_b.font.bold = True
        r_b.font.color.rgb = COLOR_PRIMARY
    r = p.add_run(text)
    r.font.name = "Arial"
    r.font.size = Pt(9.5)
    r.font.italic = italic
    r.font.color.rgb = COLOR_PRIMARY
    return p

def add_bullet(doc, text, bold_prefix=None):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_b = p.add_run(bold_prefix)
        r_b.font.name = "Arial"
        r_b.font.size = Pt(9.5)
        r_b.font.bold = True
        r_b.font.color.rgb = COLOR_PRIMARY
    r = p.add_run(text)
    r.font.name = "Arial"
    r.font.size = Pt(9.5)
    r.font.color.rgb = COLOR_PRIMARY
    return p

def add_signature_block(doc):
    add_section_heading(doc, "EXECUTION & SIGNATURES")
    add_body_p(doc, "IN WITNESS WHEREOF, the Parties hereto have caused this Agreement to be executed by their duly authorized representatives as of the Effective Date written above.")
    
    table = doc.add_table(rows=1, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    # Left column: Contractor
    cell_l = table.cell(0, 0)
    cell_l.width = Inches(3.2)
    set_cell_margins(cell_l, top=120, bottom=120, left=120, right=120)
    set_cell_background(cell_l, HEX_LIGHT_BG)
    p_l = cell_l.paragraphs[0]
    p_l.paragraph_format.space_after = Pt(2)
    r1 = p_l.add_run("FOR THE CONTRACTOR:\n")
    r1.font.bold = True
    r1.font.size = Pt(9.5)
    r1.font.color.rgb = COLOR_MAGENTA
    r2 = p_l.add_run("MD. SAIED SAGAR\nSystems Architect & Lead Engineer\n\n\n___________________________________\nSignature\nDate: ________________________\nTel: +357 94 106975\nEmail: saiedsagar1@gmail.com")
    r2.font.size = Pt(9)

    # Right column: Client
    cell_r = table.cell(0, 1)
    cell_r.width = Inches(3.2)
    set_cell_margins(cell_r, top=120, bottom=120, left=120, right=120)
    set_cell_background(cell_r, HEX_LIGHT_BG)
    p_r = cell_r.paragraphs[0]
    p_r.paragraph_format.space_after = Pt(2)
    r3 = p_r.add_run("FOR THE CLIENT:\n")
    r3.font.bold = True
    r3.font.size = Pt(9.5)
    r3.font.color.rgb = COLOR_MAGENTA
    r4 = p_r.add_run("MY GERMAN DÖNER TRADING LTD\nOwners & Managing Directors\n\n\n___________________________________\nSignature (RICO)\nDate: ________________________\n\n___________________________________\nSignature (OLIVER)\nDate: ________________________")
    r4.font.size = Pt(9)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

# ==============================================================================
# 1. DOCX: MASTER SOFTWARE SERVICES AGREEMENT (MSA)
# ==============================================================================
def build_msa_docx(filename="01. Master Software Services Agreement (MSA).docx"):
    doc = docx.Document()
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    add_header(doc, "MASTER SOFTWARE SERVICES AGREEMENT (MSA)", "Governed by the Contract Law of the Republic of Cyprus (Cap. 149)")

    add_body_p(doc, "This MASTER SOFTWARE SERVICES AGREEMENT (the \"Agreement\") is made and entered into as of the 24th day of August, 2026 (the \"Effective Date\"), by and between:")
    add_body_p(doc, "MD. SAIED SAGAR, an independent Systems Architect and Lead Software Engineer, having his professional address in Paphos, Republic of Cyprus (Email: saiedsagar1@gmail.com, Tel: +357 94 106975) (hereinafter referred to as the \"Contractor\"); and", bold_prefix="1. CONTRACTOR: ")
    add_body_p(doc, "MY GERMAN DÖNER TRADING LTD (and/or its operating restaurant partnerships), duly incorporated and operating under the laws of the Republic of Cyprus, having its principal restaurant at Pavlides Court, Agíou Stefánou Street 134, 8260 Emba, Paphos, and its branch at Limassol Marina Commercial Promenade, Limassol, Cyprus, represented by its Co-Founders and Managing Directors, RICO and OLIVER (hereinafter referred to as the \"Client\").", bold_prefix="2. CLIENT: ")

    add_section_heading(doc, "RECITALS")
    add_body_p(doc, "WHEREAS, the Client operates fast-casual restaurant enterprises in Cyprus under the brand name 'MY GERMAN DÖNER' and requires a custom, hybrid on-premise and cloud connected operations control suite structured across 5 Integrated Systems (Public Ordering, 4x 4K Digital Signage, FOH Cashier Till, Dual-Station Kitchen Routing, and Master BOH Dashboard);")
    add_body_p(doc, "WHEREAS, the Contractor possesses specialized expertise in enterprise software architecture, full-stack systems engineering, real-time event broadcasting, local network TCP socket engineering, and hybrid cloud/edge deployment; and")
    add_body_p(doc, "WHEREAS, the Client wishes to engage the Contractor as the sole systems architect and lead implementation engineer, and the Contractor agrees to perform such services on the terms set forth herein.")

    add_section_heading(doc, "1. DEFINITIONS & INTERPRETATION")
    add_bullet(doc, "the Contract Law of Cyprus (Cap. 149), the Processing of Personal Data Law of 2018 (Law 125(I)/2018), the Cyprus Value Added Tax Law (Law 95(I)/2000 as amended), and applicable EU Regulations.", bold_prefix="\"Applicable Law\": ")
    add_bullet(doc, "the architecture combining an on-premise Windows server PC at static LAN IP 192.168.1.50 (local SQLite WAL, SSE broker, TCP:9100 print spooler with 100% offline autonomy) with a cloud Linux VPS (public web app, central sync PostgreSQL, remote BI reporting).", bold_prefix="\"Hybrid Compute Model\": ")
    add_bullet(doc, "all custom software code, modules, user interfaces, database schemas, APIs, and documentation created for the Client under a Statement of Work.", bold_prefix="\"Deliverables\": ")
    add_bullet(doc, "pre-existing libraries, algorithms, generic tools, frameworks, and know-how owned or developed by the Contractor prior to or independently of this Agreement.", bold_prefix="\"Background IP\": ")
    add_bullet(doc, "all custom intellectual property specifically authored for the Client under this Agreement.", bold_prefix="\"Foreground IP\": ")
    add_bullet(doc, "a detailed implementation and milestone agreement executed under this MSA (Schedule A).", bold_prefix="\"Statement of Work (SOW)\": ")

    add_section_heading(doc, "2. SCOPE OF SERVICES & SOLE LEAD DEVELOPER")
    add_body_p(doc, "The Client engages the Contractor, and the Contractor agrees, to design, build, test, integrate, deploy, and maintain the MY GERMAN DÖNER Operations Control Suite as set forth in Schedule A (SOW Revision 3.1). The Parties agree that MD. SAIED SAGAR is the sole implementation engineer and technical authority on this project.")

    add_section_heading(doc, "3. FEES, ADVANCE PAYMENT, SETTLEMENT METHODS & SCHEDULE")
    add_body_p(doc, "The total fixed contract fee for the development, phased rollout, and 12-month comprehensive maintenance of the system is €12,000.00 EUR (Twelve Thousand Euros).", bold_prefix="3.1 Fixed Contract Price: ")
    add_body_p(doc, "The Client shall pay an initial upfront advance deposit of €1,000.00 EUR upon execution of this Agreement prior to development kickoff.", bold_prefix="3.2 Advance Deposit: ")
    add_body_p(doc, "The remaining balance of €11,000.00 EUR shall be paid in eleven (11) consecutive monthly installments of €1,000.00 EUR per month, as detailed in Schedule B.", bold_prefix="3.3 Monthly Installments: ")
    add_body_p(doc, "Invoices are payable within seven (7) calendar days. All payments under this Agreement are payable via SEPA Electronic Bank Transfer or Direct Cash Remittance against an Official Written & Signed Payment Voucher / Receipt. In accordance with Cyprus VAT Law (Law 95(I)/2000), the platform strictly calculates statutory dual-rate VAT: 9% Reduced VAT on food, dine-in, takeaway, and non-alcoholic drinks (Net = Gross / 1.09) and 19% Standard VAT on alcoholic beverages (Net = Gross / 1.19). Overdue balances accrue interest per Cyprus Law 73(I)/2012.", bold_prefix="3.4 Settlement Methods & Cyprus Dual VAT: ")

    add_section_heading(doc, "4. USER ACCEPTANCE TESTING (UAT) & QUALITY STANDARDS")
    add_body_p(doc, "The Client shall have five (5) business days following deliverable notification to conduct User Acceptance Testing (UAT). If reproducible material non-conformities ('Defects') are reported, the Contractor shall rectify them within seven (7) business days. In the absence of written rejection within 5 business days, or upon active commercial store use, deliverables are deemed irrevocably accepted.")

    add_section_heading(doc, "5. INTELLECTUAL PROPERTY RIGHTS")
    add_body_p(doc, "Upon full and final settlement of all fees due under this Agreement, the Contractor assigns to the Client all right, title, and interest in the custom Foreground IP. The Contractor retains Background IP and grants the Client a perpetual, irrevocable, worldwide, royalty-free, non-exclusive license to use Background IP embedded in the Deliverables for internal restaurant operations.")

    add_section_heading(doc, "6. CONFIDENTIALITY & DATA PROTECTION (GDPR)")
    add_body_p(doc, "Both Parties agree to maintain strict confidentiality regarding restaurant recipes, trade secrets, financials, and source code for five (5) years post-termination. Both Parties shall comply with EU GDPR (Regulation (EU) 2016/679) and Cyprus Data Protection Law (Law 125(I)/2018). The Client acts as Data Controller and the Contractor acts as Data Processor.")

    add_section_heading(doc, "7. WARRANTIES, MAINTENANCE & LIMITATION OF LIABILITY")
    add_body_p(doc, "The Contractor provides ongoing defect resolution and technical maintenance throughout the 12-month active term. Direct liability of the Contractor is capped at the total fees actually paid by the Client in the preceding 12 months. Indirect or consequential damages are expressly excluded.")

    add_section_heading(doc, "8. GOVERNING LAW & DISPUTE RESOLUTION")
    add_body_p(doc, "This Agreement is governed by the Contract Law of the Republic of Cyprus (Cap. 149). Any dispute not resolved amicably within 14 days shall be subject to the exclusive jurisdiction of the competent District Courts of Cyprus (Paphos or Limassol District), without prejudice to Cyprus Arbitration Law (Cap. 4).")

    add_signature_block(doc)
    doc.save(os.path.join(OUTPUT_DIR, filename))
    print(f"✅ Generated: {filename}")

# ==============================================================================
# 2. DOCX: STATEMENT OF WORK (SOW)
# ==============================================================================
def build_sow_docx(filename="02_Statement_of_Work_SOW.docx"):
    doc = docx.Document()
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    add_header(doc, "SCHEDULE A — STATEMENT OF WORK (SOW)", "Master Software Services Agreement • Revision 3.1 (Authoritative)")

    add_body_p(doc, "PROJECT NAME: MY GERMAN DÖNER Operations Control Suite\nLEAD SYSTEMS ARCHITECT: MD. SAIED SAGAR (Sole Implementation Engineer)\nCLIENT / OWNERS: RICO and OLIVER (MY GERMAN DÖNER TRADING LTD)\nLOCATIONS: Emba / Paphos (Flagship) & Limassol Marina (Delivery Hub ~80%)\nCONTRACT VALUE: €12,000.00 EUR (€1,000 Advance + €1,000 / Month for 11 Months — 12-Month Active SLA Term)\nSETTLEMENT OPTIONS: SEPA Bank Wire or Direct Cash Remittance against Signed Receipt\nEFFECTIVE DATE: August 24, 2026", bold_prefix="PROJECT PARTICULARS:\n")

    add_section_heading(doc, "1. HYBRID SYSTEM ARCHITECTURAL BLUEPRINT")
    add_bullet(doc, "Hosted on Linux VPS (Hostinger KVM / Hetzner Ubuntu 24.04 Docker) serving public web pre-orders (mygermandoener.com), multi-tenant PostgreSQL sync, and remote executive BI analytics.", bold_prefix="Layer 3 (Cloud Tier): ")
    add_bullet(doc, "On-premise Windows PC running as an unattended background service (via NSSM/WinSW) at static LAN IP 192.168.1.50. Hosts central dual-till ingestion engine (direct LAN API + Shopify POS webhook), unified sequential ticket queue, central real-time BOM & spit depletion engine, local SQLite WAL (<2ms LAN latency), SSE broker (<15ms broadcast), and raw TCP printer spooler (Port 9100). Ensures 100% offline store autonomy.", bold_prefix="Layer 2 (Local In-Store Server): ")
    add_bullet(doc, "Dual-Till FOH Concurrency (Register 1: iPad 10.9\" Web POS /pos + Link4Pay + 24V RJ12 cash drawer; Register 2: Dedicated Shopify POS Hardware Terminal), dual physical Ethernet kitchen printers (Station 1 Indoor Assembly, Station 2 Outdoor Charcoal Grill on Port 9100), dual responsive web KDS endpoints (/kds/indoor, /kds/grill), 43\" customer pickup TV (/display), 10.1\" staff tablet (/staff), and 4x 4K Overhead Smart TVs (/boards?screen=1..4).", bold_prefix="Layer 1 (Store Touchpoints): ")

    add_section_heading(doc, "2. DELIVERABLE SCOPE: THE 5 INTEGRATED SYSTEMS")
    
    systems = [
        ("System 1: Public Brand & Ordering Platform", "High-performance Next.js SSR/ISR web application (mygermandoener.com), multi-store profile hubs for Emba and Limassol Marina (~80% delivery), and dynamic queue-based ETA calculation."),
        ("System 2: Overhead 4x 4K Digital Signage & Queue TV", "3840x2160 vector layouts rendered locally from 192.168.1.50, sub-500ms Sold-Out sync, automated dayparting across 4 screens (Hero, Döner, Wraps/Boxes, Combos/Drinks), and /display customer wait board with chimes."),
        ("System 3: Front-of-House (FOH) Dual-Till Cashier Operations", "Dual-till concurrency: Register 1 (iPad 10.9\" Web POS /pos) + Register 2 (Dedicated Shopify POS Terminal). Central order ingestion and unified sequential ticket numbering on 192.168.1.50. Multi-till split printing across Station 1 & 2 LAN printers (Port 9100) and central real-time BOM spit meat deductions. 3-step customizer, Link4Pay terminal flow, 24V RJ12 drawer kick, and reverse Cyprus Dual-VAT calculation (9% Food / 19% Beer)."),
        ("System 4: Kitchen Production & Routing", "Dual physical Ethernet thermal printers on TCP Port 9100 (Station 1 Indoor Assembly & Station 2 Outdoor Charcoal Grill) + responsive dual-station web KDS (/kds/indoor, /kds/grill) ready for 2x future kitchen TVs."),
        ("System 5: Back-of-House (BOH) Master Dashboard", "Single-pane-of-glass management (/admin): instant price push in <500ms, 1-tap Sold-Out matrix, gram-level meat/spit BOM tracking, digital HACCP 0-5°C & >=63°C logs, >€250 WhatsApp PO approval gate, and daily dual-VAT sales reporting.")
    ]

    for title, desc in systems:
        add_bullet(doc, desc, bold_prefix=f"{title}: ")

    add_section_heading(doc, "3. ACCEPTANCE CRITERIA & SIGN-OFF")
    add_body_p(doc, "Each module shall be deployed to a staging environment and validated against the functional acceptance criteria defined in Master PRD Revision 3.3. The Client has a 5-business-day review window per module.")

    add_signature_block(doc)
    doc.save(os.path.join(OUTPUT_DIR, filename))
    print(f"✅ Generated: {filename}")

# ==============================================================================
# 3. DOCX: COMMERCIAL MILESTONES & PAYMENT SCHEDULE
# ==============================================================================
def build_milestones_docx(filename="03_Commercial_Milestones_and_Payment_Schedule.docx"):
    doc = docx.Document()
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    add_header(doc, "SCHEDULE B — COMMERCIAL PAYMENT SCHEDULE & SLA", "Master Software Services Agreement • Revision 3.1 (Authoritative)")

    add_body_p(doc, "TOTAL CONTRACT VALUE: €12,000.00 EUR (Twelve Thousand Euros)\nPAYMENT STRUCTURE: €1,000.00 Advance Deposit + €1,000.00 / Month for 11 Consecutive Months (12-Month Total Active Term)\nACCEPTED SETTLEMENT: SEPA Electronic Bank Wire OR Direct Cash Remittance against Signed Receipt\nCONTRACTOR: MD. SAIED SAGAR | CLIENT: RICO & OLIVER (MY GERMAN DÖNER TRADING LTD)\nEFFECTIVE DATE: August 24, 2026", bold_prefix="COMMERCIAL SUMMARY:\n")

    add_section_heading(doc, "1. STRUCTURED 12-MONTH PAYMENT & DELIVERABLE SCHEDULE")

    table = doc.add_table(rows=13, cols=4)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    headers = ["Payment Stage", "Deliverables & Operational Focus", "Amount (€)", "Payment Terms"]
    widths = [Inches(1.3), Inches(3.2), Inches(1.1), Inches(1.0)]

    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].text = title
        hdr_cells[i].width = widths[i]
        set_cell_background(hdr_cells[i], HEX_PRIMARY)
        set_cell_margins(hdr_cells[i], top=100, bottom=100, left=100, right=100)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p.runs:
            r.font.bold = True
            r.font.size = Pt(8.5)
            r.font.color.rgb = COLOR_WHITE

    rows_data = [
        ("Advance / M0", "Kickoff, Schema Init, Local Windows Server (192.168.1.50) Setup", "€ 1,000.00", "Due on Signing"),
        ("Month 1", "M1 Checklists & HACCP Logbook + M2 Supplier Ordering", "€ 1,000.00", "Net-7 Days"),
        ("Month 2", "M3 Dynamic Stock & Spit Depletion + Modern iPad Web POS", "€ 1,000.00", "Net-7 Days"),
        ("Month 3", "M9 Executive Reporting Dashboard & Cyprus Dual-VAT Ledger", "€ 1,000.00", "Net-7 Days"),
        ("Month 4", "M7 Staff Shift Scheduling & 4-Digit PIN Timeclock", "€ 1,000.00", "Net-7 Days"),
        ("Month 5", "M8 Visual Build Sheets & Assembly Training SOP Guides", "€ 1,000.00", "Net-7 Days"),
        ("Month 6", "System 2: 4x 4K Overhead Digital Menu Board CMS", "€ 1,000.00", "Net-7 Days"),
        ("Month 7", "System 4: Dual-Station KDS & Raw TCP Print Spooler", "€ 1,000.00", "Net-7 Days"),
        ("Month 8", "System 1: Limassol Pre-Order & Delivery Flow + Public App", "€ 1,000.00", "Net-7 Days"),
        ("Month 9", "Store 02 Limassol Marina Live Integration & Scaling", "€ 1,000.00", "Net-7 Days"),
        ("Month 10", "Advanced BI Analytics, Food Cost & Waste Tracking", "€ 1,000.00", "Net-7 Days"),
        ("Month 11", "Production Warranty Audit, Final Transition & Sign-Off", "€ 1,000.00", "Net-7 Days"),
    ]

    for idx, (stage, scope, amt, terms) in enumerate(rows_data):
        row_cells = table.rows[idx + 1].cells
        bg_color = HEX_LIGHT_BG if idx % 2 == 0 else "FFFFFF"
        for i, val in enumerate([stage, scope, amt, terms]):
            row_cells[i].text = val
            row_cells[i].width = widths[i]
            set_cell_background(row_cells[i], bg_color)
            set_cell_margins(row_cells[i], top=70, bottom=70, left=90, right=90)
            p = row_cells[i].paragraphs[0]
            p.runs[0].font.size = Pt(8.5)
            p.runs[0].font.color.rgb = COLOR_PRIMARY
            if i in [0, 2]:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                p.runs[0].font.bold = True
            elif i == 3:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER

    add_section_heading(doc, "2. SERVICE LEVEL AGREEMENT (SLA) & SUPPORT TIERS")
    add_body_p(doc, "Included within the 12-month contract value is full engineering maintenance for both the local Windows server PC (192.168.1.50) and cloud Linux VPS, database backups, security patches, and emergency response times:")
    add_bullet(doc, "Entire system down, local server crash, or till unable to process sales — Response < 1 Hour (Immediate emergency triage).", bold_prefix="Severity 1 (Critical Outage): ")
    add_bullet(doc, "Core module impaired (e.g. Menu Board dark, thermal print spool fail) — Response < 4 Hours (Same-day resolution).", bold_prefix="Severity 2 (Major Impairment): ")
    add_bullet(doc, "Minor UI glitch or non-blocking inquiry — Response < 24 Hours.", bold_prefix="Severity 3 (Minor / Cosmetic): ")

    add_section_heading(doc, "3. REMITTANCE & SETTLEMENT OPTIONS")
    add_body_p(doc, "Option 1: Direct Cash Remittance against an Official Written & Signed Payment Voucher / Receipt.")
    add_body_p(doc, "Option 2: SEPA Bank Wire Transfer — Beneficiary: AHMED MD ASHIK (Designated for MD. SAIED SAGAR) | Bank: EUROBANK LIMITED (Cyprus) | IBAN: CY88 0050 0121 0001 2110 H817 7501 (Electronic: CY880050012100012110H8177501) | BIC/SWIFT: HEBACY2N | Currency: EUR (€)")

    add_signature_block(doc)
    doc.save(os.path.join(OUTPUT_DIR, filename))
    print(f"✅ Generated: {filename}")

# ==============================================================================
# 4. DOCX: CLIENT TECHNICAL PREREQUISITES & TOOLING
# ==============================================================================
def build_prereqs_docx(filename="04_Client_Technical_Prerequisites_and_Tooling.docx"):
    doc = docx.Document()
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    add_header(doc, "SCHEDULE C — CLIENT TECHNICAL PREREQUISITES & TOOLING", "Master Software Services Agreement • Revision 3.1 (Authoritative)")

    add_body_p(doc, "The Client acknowledges and agrees to provide the following technical credentials, hardware access, AI infrastructure, and brand assets to ensure seamless delivery:")

    add_section_heading(doc, "1. LOCAL ON-PREMISE WINDOWS SERVER PC (192.168.1.50)")
    add_bullet(doc, "Dedicated in-store Windows PC assigned static LAN IP 192.168.1.50 on Gigabit LAN to run local Next.js, SQLite WAL, SSE broker, and raw TCP printer spooler via NSSM/WinSW background service.", bold_prefix="Windows Server PC: ")

    add_section_heading(doc, "2. DUAL ETHERNET THERMAL KITCHEN PRINTERS")
    add_bullet(doc, "Hardwired Ethernet connection for Station 1 (Indoor Assembly) and Station 2 (Outdoor Charcoal Grill) accepting raw ESC/POS chits on TCP Port 9100.", bold_prefix="Thermal Printers (Port 9100): ")

    add_section_heading(doc, "3. SHOPIFY STORE API & LINK4PAY CREDENTIALS")
    add_bullet(doc, "Collaborator or Custom App developer access on Shopify Admin with permissions for Products, Inventory, Orders, Locations, and Storefront API.", bold_prefix="Shopify Admin API: ")
    add_bullet(doc, "Merchant ID, Terminal ID, and pairing guidelines for standalone Link4Pay in-store card terminals.", bold_prefix="Link4Pay Parameters: ")

    add_section_heading(doc, "4. DOMAIN & DNS CONFIGURATION (mygermandoener.com)")
    add_bullet(doc, "DNS delegation for subdomains: admin.mygermandoener.com, boards.mygermandoener.com, order.mygermandoener.com pointing to cloud Linux VPS.", bold_prefix="Subdomain Routing: ")

    add_section_heading(doc, "5. DEVELOPER AI INFRASTRUCTURE & REPOSITORY INDEXING")
    add_bullet(doc, "Provisioning of a dedicated AI infrastructure tooling allowance ($150-$200/mo) dedicated to the Lead Architect for high-speed terminal automation, continuous codebase indexing, and real-time simulations.", bold_prefix="AI Tooling Provisioning: ")

    add_section_heading(doc, "6. HIGH-RESOLUTION FOOD PHOTOGRAPHY")
    add_bullet(doc, "Macro photography of all core items (Classic Döner, Dürum, Döner Box, Currywurst, Fries, Sauces, Drinks) prepared and photographed in-store, per RICO's directive.", bold_prefix="Menu Photography: ")

    add_section_heading(doc, "7. IN-STORE NETWORK & 4G FAILOVER")
    add_bullet(doc, "Cat6 Ethernet cabling to POS iPad stand, Windows server PC, and both thermal printers, plus Dual-WAN router with 4G LTE backup SIM.", bold_prefix="Network & Hardware: ")

    add_signature_block(doc)
    doc.save(os.path.join(OUTPUT_DIR, filename))
    print(f"✅ Generated: {filename}")

# ==============================================================================
# 5. DOCX: COMMERCIAL INVOICE — MILESTONE 0
# ==============================================================================
def build_invoice_docx(filename="05_Commercial_Invoice_Milestone_0.docx"):
    doc = docx.Document()
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    add_header(doc, "COMMERCIAL INVOICE — MILESTONE 0 (ADVANCE DEPOSIT)", "Republic of Cyprus Commercial Invoicing Standard")

    table_top = doc.add_table(rows=1, cols=2)
    table_top.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_top.autofit = False

    # Left: Seller
    cell_s = table_top.cell(0, 0)
    cell_s.width = Inches(3.2)
    set_cell_margins(cell_s, 80, 80, 80, 80)
    p_s = cell_s.paragraphs[0]
    r_s1 = p_s.add_run("ISSUED BY (SERVICE PROVIDER):\n")
    r_s1.font.bold = True
    r_s1.font.size = Pt(8.5)
    r_s1.font.color.rgb = COLOR_MAGENTA
    r_s2 = p_s.add_run("MD. SAIED SAGAR\nSystems Architect & Lead Software Engineer\nPaphos, Republic of Cyprus\nEmail: saiedsagar1@gmail.com\nTel: +357 94 106975\nCyprus TIC / Tax Ref: [Pending/Small Enterprise]")
    r_s2.font.size = Pt(8.5)

    # Right: Buyer
    cell_b = table_top.cell(0, 1)
    cell_b.width = Inches(3.2)
    set_cell_margins(cell_b, 80, 80, 80, 80)
    p_b = cell_b.paragraphs[0]
    r_b1 = p_b.add_run("BILLED TO (CLIENT):\n")
    r_b1.font.bold = True
    r_b1.font.size = Pt(8.5)
    r_b1.font.color.rgb = COLOR_MAGENTA
    r_b2 = p_b.add_run("MY GERMAN DÖNER TRADING LTD\nAttn: RICO & OLIVER (Managing Directors)\nPavlides Court, Agíou Stefánou Street 134\n8260 Emba, Paphos, Republic of Cyprus\nEmail: rico@mygermandoener.com\nWebsite: mygermandoener.com")
    r_b2.font.size = Pt(8.5)

    add_body_p(doc, "\nINVOICE NUMBER: MGD-INV-2026-001  |  INVOICE DATE: August 24, 2026  |  DUE DATE: Net-3 Days (August 27, 2026)", bold_prefix="INVOICE PARTICULARS: ", space_after=10)

    table = doc.add_table(rows=2, cols=4)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    headers = ["Item", "Description of Professional Services", "Qty", "Amount (€)"]
    widths = [Inches(0.6), Inches(4.2), Inches(0.6), Inches(1.2)]

    hdr = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr[i].text = title
        hdr[i].width = widths[i]
        set_cell_background(hdr[i], HEX_PRIMARY)
        set_cell_margins(hdr[i], 100, 100, 100, 100)
        p = hdr[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p.runs:
            r.font.bold = True
            r.font.size = Pt(8.5)
            r.font.color.rgb = COLOR_WHITE

    row_cells = table.rows[1].cells
    items = [
        "01",
        "Initial Advance Deposit & Milestone 0 Kickoff:\n• Hybrid Architecture Setup & Local Windows Server PC Init (Static IP 192.168.1.50)\n• Dual Ethernet Thermal Print Spooler Configuration (TCP Port 9100)\n• Shopify Development App Provisioning & Storefront API Integration\n• System 2: 4x 4K Overhead Digital Menu Board Design Prototypes\n(Per Master Services Agreement & Schedule B - Milestone 0)",
        "1",
        "€ 1,000.00"
    ]
    for i, val in enumerate(items):
        row_cells[i].text = val
        row_cells[i].width = widths[i]
        set_cell_background(row_cells[i], HEX_LIGHT_BG)
        set_cell_margins(row_cells[i], 90, 90, 90, 90)
        p = row_cells[i].paragraphs[0]
        p.runs[0].font.size = Pt(8.5)
        p.runs[0].font.color.rgb = COLOR_PRIMARY
        if i in [0, 2]:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        elif i == 3:
            p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
            p.runs[0].font.bold = True

    add_body_p(doc, "\nSUBTOTAL (NET):  € 1,000.00\nCYPRUS VAT (19% / Exempt*):  € 0.00*\nTOTAL AMOUNT DUE:  € 1,000.00 EUR", bold_prefix="TOTAL SUMMARY:\n", space_after=12)

    add_section_heading(doc, "SETTLEMENT & BANK REMITTANCE INSTRUCTIONS (SEPA BANK TRANSFER ONLY)")
    add_body_p(doc, "Settlement Method: SEPA Electronic Bank Wire Transfer Only")
    add_body_p(doc, "Eurobank Cyprus Remittance Details:\nBeneficiary / Account Name: AHMED MD ASHIK (ASHIK AHMED)\nBank Name: EUROBANK LIMITED\nBank Address: Corner Limassol & 200 Athalassa Avenue, 2025 Strovolos, Nicosia, Cyprus (Reg. No. HE6771)\nAccount Number: 121-10-H81775-01\nCurrency: EUR (€)\nIBAN (Paper Format): CY88 0050 0121 0001 2110 H817 7501\nIBAN (Electronic Format): CY880050012100012110H8177501\nBIC / SWIFT Code: HEBACY2N\nPayment Reference: MGD-INV-2026-001 (MY GERMAN DONER)")

    doc.save(os.path.join(OUTPUT_DIR, filename))
    print(f"✅ Generated: {filename}")

if __name__ == "__main__":
    # Clean standardized names matching markdown
    build_msa_docx("01_Master_Software_Services_Agreement_MSA.docx")
    build_sow_docx("02_Statement_of_Work_SOW.docx")
    build_milestones_docx("03_Commercial_Milestones_and_Payment_Schedule.docx")
    build_prereqs_docx("04_Client_Technical_Prerequisites_and_Tooling.docx")
    build_invoice_docx("05_Commercial_Invoice_Milestone_0.docx")

    print("🚀 All Client Contract DOCX files built successfully!")
