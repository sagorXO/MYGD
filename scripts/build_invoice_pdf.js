const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const outputPath = path.resolve(__dirname, '../Documents/05_Commercial_Invoice_Milestone_0.pdf');
const shortOutputPath = path.resolve(__dirname, '../Documents/05. Advance Invoice.pdf');

const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Commercial Invoice - MGD-INV-2026-001</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Oswald:wght@500;600;700&display=swap');

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    @page {
      size: A4 portrait;
      margin: 0;
    }

    body {
      font-family: 'Figtree', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1F1F21;
      background: #FFFFFF;
      line-height: 1.35;
      font-size: 11.5px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      padding: 30px 40px 24px 40px;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #E50D7E;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }

    .brand-col h1 {
      font-family: 'Oswald', sans-serif;
      font-size: 25px;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: #1F1F21;
      line-height: 1.1;
      text-transform: uppercase;
    }

    .brand-col h1 span {
      color: #E50D7E;
    }

    .brand-tagline {
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 1.2px;
      color: #646469;
      text-transform: uppercase;
      margin-top: 3px;
    }

    .badge-doc {
      display: inline-block;
      margin-top: 6px;
      padding: 2.5px 8px;
      background: #1F1F21;
      color: #00FCED;
      font-family: 'JetBrains Mono', monospace;
      font-size: 8.5px;
      font-weight: 600;
      border-radius: 3px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .meta-col {
      text-align: right;
    }

    .invoice-title {
      font-family: 'Oswald', sans-serif;
      font-size: 19px;
      font-weight: 600;
      color: #E50D7E;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .meta-grid {
      margin-top: 4px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      line-height: 1.5;
    }

    .meta-grid span.label {
      color: #646469;
    }

    .meta-grid span.val {
      font-weight: 600;
      color: #1F1F21;
    }

    /* Parties */
    .parties-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 14px;
    }

    .party-card {
      background: #F8F8FA;
      border: 1px solid #E2E2E6;
      border-radius: 5px;
      padding: 10px 12px;
    }

    .party-header {
      font-family: 'Oswald', sans-serif;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #E50D7E;
      margin-bottom: 4px;
      border-bottom: 1px solid #E2E2E6;
      padding-bottom: 3px;
    }

    .party-name {
      font-size: 12.5px;
      font-weight: 700;
      color: #1F1F21;
      margin-bottom: 1px;
    }

    .party-title {
      font-size: 10px;
      font-weight: 600;
      color: #4A4A4F;
      margin-bottom: 3px;
    }

    .party-details {
      font-size: 10px;
      color: #55555A;
      line-height: 1.4;
    }

    /* Table */
    .table-title {
      font-family: 'Oswald', sans-serif;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.8px;
      color: #1F1F21;
      text-transform: uppercase;
      margin-bottom: 6px;
    }

    table.invoice-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }

    table.invoice-table th {
      background: #1F1F21;
      color: #FFFFFF;
      font-family: 'Oswald', sans-serif;
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      padding: 6px 8px;
      text-align: left;
    }

    table.invoice-table th.center { text-align: center; }
    table.invoice-table th.right { text-align: right; }

    table.invoice-table td {
      padding: 8px;
      border-bottom: 1px solid #E2E2E6;
      vertical-align: top;
      font-size: 10.5px;
    }

    table.invoice-table td.center { text-align: center; font-family: 'JetBrains Mono', monospace; }
    table.invoice-table td.right { text-align: right; font-family: 'JetBrains Mono', monospace; font-weight: 600; }

    .item-name {
      font-weight: 700;
      color: #1F1F21;
      font-size: 11.5px;
      margin-bottom: 3px;
    }

    .item-desc {
      color: #55555A;
      font-size: 9.8px;
      line-height: 1.4;
    }

    .item-desc ul {
      margin-left: 12px;
      margin-top: 2px;
    }

    /* Summary */
    .summary-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 12px;
    }

    .summary-box {
      width: 260px;
      background: #F8F8FA;
      border: 1px solid #E2E2E6;
      border-radius: 5px;
      padding: 8px 12px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      margin-bottom: 3px;
      color: #55555A;
    }

    .summary-row.total {
      border-top: 1.5px solid #E50D7E;
      padding-top: 5px;
      margin-top: 5px;
      font-size: 13px;
      font-weight: 700;
      color: #1F1F21;
    }

    .summary-row.total .amount {
      color: #E50D7E;
      font-family: 'JetBrains Mono', monospace;
    }

    /* Bank & Remittance Details (Bank Only) */
    .remittance-container {
      background: #FBFBFC;
      border: 1.5px solid #1F1F21;
      border-radius: 6px;
      padding: 12px 16px;
      margin-bottom: 14px;
    }

    .remittance-title {
      font-family: 'Oswald', sans-serif;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #E50D7E;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #EAEAEF;
      padding-bottom: 4px;
    }

    .remittance-badge {
      background: #E50D7E;
      color: #FFFFFF;
      font-family: 'JetBrains Mono', monospace;
      font-size: 8.5px;
      padding: 1px 6px;
      border-radius: 3px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .bank-card {
      display: grid;
      grid-template-columns: 1.2fr 1.3fr;
      gap: 16px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      line-height: 1.55;
    }

    .bank-field-label {
      color: #646469;
      font-family: 'Figtree', sans-serif;
      font-size: 9.5px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .bank-field-value {
      color: #1F1F21;
      font-weight: 600;
    }

    .highlight-beneficiary {
      color: #1F1F21;
      font-size: 11.5px;
      font-weight: 700;
      letter-spacing: 0.3px;
    }

    .highlight-iban {
      color: #E50D7E;
      font-weight: 700;
      background: #FEEBF4;
      padding: 2px 5px;
      border-radius: 3px;
      display: inline-block;
      letter-spacing: 0.4px;
      font-size: 10.5px;
      margin-top: 1px;
    }

    /* Footer Signatures */
    .signatures-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 25px;
      margin-top: 10px;
      border-top: 1px solid #E2E2E6;
      padding-top: 10px;
    }

    .sig-col {
      font-size: 10px;
    }

    .sig-label {
      font-weight: 700;
      color: #646469;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 22px;
      font-size: 9.5px;
    }

    .sig-line {
      border-top: 1px solid #1F1F21;
      padding-top: 3px;
      font-weight: 600;
    }

    .sig-name {
      font-size: 11px;
      color: #1F1F21;
    }

    .sig-sub {
      color: #646469;
      font-size: 9px;
    }

    .legal-note {
      margin-top: 8px;
      font-size: 8.5px;
      color: #8E8E93;
      text-align: center;
      line-height: 1.3;
    }
  </style>
</head>
<body>
  <div class="page">
    <div>
      <!-- Header -->
      <div class="header">
        <div class="brand-col">
          <h1>MY GERMAN <span>DÖNER</span></h1>
          <div class="brand-tagline">BITE THE HYPE • THE FIRST REAL GERMAN DOENER IN CYPRUS</div>
          <div class="badge-doc">Official Commercial Invoice • Milestone 0</div>
        </div>
        <div class="meta-col">
          <div class="invoice-title">COMMERCIAL INVOICE</div>
          <div class="meta-grid">
            <div><span class="label">Invoice No: </span><span class="val">MGD-INV-2026-001</span></div>
            <div><span class="label">Invoice Date: </span><span class="val">August 24, 2026</span></div>
            <div><span class="label">Due Date: </span><span class="val">August 27, 2026 (Net-3)</span></div>
            <div><span class="label">Currency: </span><span class="val">EUR (€)</span></div>
          </div>
        </div>
      </div>

      <!-- Parties -->
      <div class="parties-container">
        <div class="party-card">
          <div class="party-header">ISSUED BY (SERVICE PROVIDER / CONTRACTOR)</div>
          <div class="party-name">MD. SAIED SAGAR</div>
          <div class="party-title">Systems Architect & Lead Software Engineer</div>
          <div class="party-details">
            Paphos, Republic of Cyprus<br>
            <strong>Email:</strong> saiedsagar1@gmail.com | <strong>Phone:</strong> +357 94 106975<br>
            <strong>Tax Ref:</strong> Pending / Small Enterprise (Cyprus)
          </div>
        </div>

        <div class="party-card">
          <div class="party-header">BILLED TO (CLIENT)</div>
          <div class="party-name">MY GERMAN DÖNER TRADING LTD</div>
          <div class="party-title">Attn: RICO & OLIVER (Owners / Managing Directors)</div>
          <div class="party-details">
            Pavlides Court, Agíou Stefánou Street 134, 8260 Emba, Paphos, Cyprus<br>
            <strong>Branches:</strong> Emba (Flagship) & Limassol Marina Hub<br>
            <strong>Email:</strong> rico@mygermandoener.com / oli@mygermandoener.com
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="table-title">Itemized Professional Services Scope</div>
      <table class="invoice-table">
        <thead>
          <tr>
            <th class="center" style="width: 7%;">Item</th>
            <th style="width: 63%;">Description of Deliverables</th>
            <th class="center" style="width: 10%;">Qty</th>
            <th class="right" style="width: 20%;">Amount (€)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="center">01</td>
            <td>
              <div class="item-name">Initial Advance Deposit & Stage 0 Kickoff Mobilization</div>
              <div class="item-desc">
                Professional software architecture, hardware integration & operational deployment:
                <ul>
                  <li><strong>Local Store Server Initialization:</strong> On-premise Windows PC (192.168.1.50) unattended background service configuration, SQLite WAL embedded database & real-time SSE event broker (<15ms).</li>
                  <li><strong>Dual-Till FOH Central Order Ingestion:</strong> Unified sequential ticket numbering for iPad Web POS (/pos) and Shopify POS terminal.</li>
                  <li><strong>Kitchen Thermal Print Spooler:</strong> TCP Port 9100 network spooling to Station 1 (Indoor Assembly) and Station 2 (Outdoor Grill).</li>
                  <li><strong>Shopify & Link4Pay Bridge:</strong> Shopify Admin/Storefront GraphQL API app provisioning and terminal card flow setup.</li>
                  <li><strong>System 2 Overhead Signage:</strong> Initial 4x 4K Digital Menu Board layout templates and high-resolution graphic assets.</li>
                </ul>
                <em>(Per Master Software Services Agreement & Schedule B - Stage 0 Mobilization)</em>
              </div>
            </td>
            <td class="center">1</td>
            <td class="right">€ 1,000.00</td>
          </tr>
        </tbody>
      </table>

      <!-- Summary -->
      <div class="summary-section">
        <div class="summary-box">
          <div class="summary-row">
            <span>Subtotal (Net):</span>
            <span style="font-family: 'JetBrains Mono', monospace; font-weight: 600;">€ 1,000.00</span>
          </div>
          <div class="summary-row">
            <span>Cyprus VAT (19% / Exempt*):</span>
            <span style="font-family: 'JetBrains Mono', monospace; font-weight: 600;">€ 0.00*</span>
          </div>
          <div class="summary-row total">
            <span>TOTAL DUE:</span>
            <span class="amount">€ 1,000.00 EUR</span>
          </div>
        </div>
      </div>

      <!-- Bank Details (Bank Only - EUROBANK CYPRUS) -->
      <div class="remittance-container">
        <div class="remittance-title">
          <span>🏦 BANK REMITTANCE INSTRUCTIONS (EUROBANK CYPRUS)</span>
          <span class="remittance-badge">SEPA BANK TRANSFER ONLY</span>
        </div>
        <div class="bank-card">
          <div>
            <div><span class="bank-field-label">Account Name / Beneficiary:</span></div>
            <div class="highlight-beneficiary">AHMED MD ASHIK</div>
            <div style="font-size: 8.5px; color: #646469; margin-bottom: 4px;">(Ashik Ahmed)</div>
            
            <div><span class="bank-field-label">Account Number:</span></div>
            <div class="bank-field-value">121-10-H81775-01</div>

            <div style="margin-top: 3px;"><span class="bank-field-label">Currency:</span></div>
            <div class="bank-field-value">EUR (€)</div>
          </div>

          <div>
            <div><span class="bank-field-label">Bank Name & Branch:</span></div>
            <div class="bank-field-value">EUROBANK LIMITED (Reg. No. HE6771)</div>
            <div style="font-size: 8.5px; color: #646469; margin-bottom: 4px;">200 Athalassa Ave & Limassol Ave, Nicosia, Cyprus</div>

            <div><span class="bank-field-label">SWIFT / BIC Code:</span></div>
            <div class="bank-field-value" style="font-size: 10.5px; letter-spacing: 0.5px;">HEBACY2N</div>

            <div style="margin-top: 3px;"><span class="bank-field-label">IBAN (Electronic Format):</span></div>
            <div class="highlight-iban">CY880050012100012110H8177501</div>
            <div style="font-size: 8.5px; color: #646469; margin-top: 2px;"><strong>Payment Reference:</strong> MGD-INV-2026-001 (MY GERMAN DONER)</div>
          </div>
        </div>
      </div>
    </div>

    <div>
      <!-- Signatures -->
      <div class="signatures-row">
        <div class="sig-col">
          <div class="sig-label">Issued By:</div>
          <div class="sig-line">
            <div class="sig-name">MD. SAIED SAGAR</div>
            <div class="sig-sub">Lead Systems Architect & Software Engineer</div>
          </div>
        </div>
        <div class="sig-col">
          <div class="sig-label">Acknowledged & Approved By:</div>
          <div class="sig-line">
            <div class="sig-name">RICO & OLIVER</div>
            <div class="sig-sub">Managing Directors • MY GERMAN DÖNER TRADING LTD</div>
          </div>
        </div>
      </div>

      <div class="legal-note">
        *Stated net of VAT under applicable Cyprus small enterprise threshold / Article 11A. Governing Law: Contract Law of the Republic of Cyprus (Cap. 149).
      </div>
    </div>
  </div>
</body>
</html>
`;

(async () => {
  try {
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle' });
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        bottom: '10mm',
        left: '10mm',
        right: '10mm'
      }
    });
    fs.copyFileSync(outputPath, shortOutputPath);
    await browser.close();
    console.log(`✅ Single-page Bank-Only PDF Invoice successfully created at:\n  - ${outputPath}\n  - ${shortOutputPath}`);
  } catch (err) {
    console.error('Error generating PDF invoice:', err);
    process.exit(1);
  }
})();
