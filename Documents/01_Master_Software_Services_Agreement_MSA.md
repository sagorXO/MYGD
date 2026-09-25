# MASTER SOFTWARE SERVICES AGREEMENT (MSA)
### Governed by the Contract Law of the Republic of Cyprus (Cap. 149)

**THIS MASTER SOFTWARE SERVICES AGREEMENT** (the "Agreement") is made and entered into as of the **24th day of August, 2026** (the "Effective Date"),

### BY AND BETWEEN:

1. **MD. SAIED SAGAR**, an independent Systems Architect and Lead Software Engineer, having his professional address in Paphos, Republic of Cyprus (Email: `saiedsagar1@gmail.com`, Tel: `+357 94 106975`) (hereinafter referred to as the **"Contractor"**, which expression shall include his heirs, personal representatives, and permitted assigns);

AND

2. **MY GERMAN DÖNER TRADING LTD** (or its operating corporate entity and authorized restaurant partnerships), a private limited company duly incorporated and registered under the laws of the Republic of Cyprus, having its principal restaurant operating address at Pavlides Court, Agíou Stefánou Street 134, 8260 Emba, Paphos, Cyprus, and its secondary branch at Limassol Marina Commercial Promenade, Limassol, Cyprus, represented herein by its Co-Founders and Managing Directors, **RICO** and **OLIVER** (hereinafter referred to as the **"Client"**, which expression shall include its successors and permitted assigns).

The Contractor and the Client are hereinafter collectively referred to as the **"Parties"** and individually as a **"Party"**.

---

### PREAMBLE & RECITALS

**WHEREAS:**
A. The Client operates fast-casual restaurant enterprises in the Republic of Cyprus under the brand name **MY GERMAN DÖNER** and requires a custom, hybrid on-premise and cloud connected restaurant operations control suite structured across 5 Integrated Systems (Public Ordering, 4x 4K Digital Signage, FOH Cashier Till, Dual-Station Kitchen Routing, and Master BOH Dashboard);  
B. The Contractor possesses specialized technical expertise in enterprise software architecture, full-stack systems engineering, real-time event broadcasting, local network TCP socket engineering, and hybrid cloud/edge deployment; and  
C. The Client desires to engage the Contractor as the sole systems architect and lead implementation engineer to develop, deploy, and maintain the custom operations software system, and the Contractor agrees to perform such services on the terms and subject to the conditions set forth herein.

**NOW, THEREFORE, IT IS HEREBY AGREED BY AND BETWEEN THE PARTIES AS FOLLOWS:**

---

### SECTION 1: DEFINITIONS AND INTERPRETATION

1.1 In this Agreement, unless the context otherwise requires, the following terms shall have the following meanings:
- **"Agreement"** means this Master Software Services Agreement together with all Schedules, Annexes, and Statements of Work attached hereto or executed pursuant to this Agreement.
- **"Applicable Law"** means the laws of the Republic of Cyprus, including the **Contract Law (Cap. 149)**, the **Protection of Natural Persons with regard to the Processing of Personal Data Law of 2018 (Law 125(I)/2018)**, the **Cyprus Value Added Tax Law (Law 95(I)/2000 as amended)**, and all binding European Union regulations.
- **"Background Intellectual Property"** or **"Background IP"** means any and all intellectual property, proprietary tools, generic libraries, algorithms, foundational code, pre-existing frameworks, methodologies, and know-how owned by or licensed to the Contractor prior to the Effective Date or developed independently outside the scope of this Agreement.
- **"Deliverables"** means all software code, modules, user interfaces, database schemas, APIs, documentation, and technical assets specifically created and delivered by the Contractor to the Client under a Statement of Work.
- **"Foreground Intellectual Property"** or **"Foreground IP"** means all intellectual property rights in the custom Deliverables authored specifically for the Client pursuant to this Agreement.
- **"Hybrid Architecture"** means the combination of the local on-premise Windows server running at static LAN IP `192.168.1.50` (handling local SQLite WAL storage, SSE event routing, and TCP:9100 printer spooling with 100% offline autonomy) and the cloud Linux VPS (handling the public web portal, central sync PostgreSQL database, and remote BI reporting).
- **"Milestone"** means a defined phase of work and associated deliverable set forth in the Statement of Work with an agreed payment trigger.
- **"SOW"** or **"Statement of Work"** means a written agreement executed by both Parties detailing specific technical deliverables, timelines, and fees, substantially in the form of **Schedule A**.
- **"Specifications"** means the functional and technical requirements set forth in the Master Product Requirements Document (PRD Revision 3.3) and the Technical Architecture Document.

---

### SECTION 2: SCOPE OF SERVICES & SOLE LEAD DEVELOPER

2.1 **Engagement:** The Client hereby engages the Contractor, and the Contractor hereby agrees, to design, build, test, integrate, and deploy the **MY GERMAN DÖNER Operations Control Suite** in accordance with the terms and specifications set out in this Agreement and the attached Statements of Work.

2.2 **Statements of Work:** Each project phase or deployment scope shall be documented in a Statement of Work (SOW). The initial scope is set forth in **Schedule A (Statement of Work Revision 3.1)**. In the event of any conflict between this MSA and an SOW, the terms of this MSA shall prevail unless explicitly stated otherwise in the SOW.

2.3 **Sole Implementation Engineer:** The Parties expressly acknowledge and agree that the Contractor is the sole lead software engineer and technical authority responsible for the architecture and implementation of the system.

2.4 **Change Control Procedure:** Any request by either Party to modify the scope, deliverables, or specifications defined in an SOW shall be submitted in writing. The Contractor shall evaluate the technical and financial impact of the requested change and provide a written **Change Order Proposal**. No change shall be binding until signed by authorized representatives of both Parties.

---

### SECTION 3: PERFORMANCE STANDARDS & USER ACCEPTANCE TESTING (UAT)

3.1 **Standard of Performance:** The Contractor shall perform the services with reasonable care, professional diligence, and in accordance with recognized industry best practices.

3.2 **Milestone Deliverable Submission:** Upon completing a Milestone defined in an SOW, the Contractor shall notify the Client in writing and deploy the completed Deliverables to the designated testing or staging environment.

3.3 **Acceptance Period & Procedures:**
(a) The Client shall have a period of **five (5) business days** from the date of deliverable notification (the "Review Period") to perform User Acceptance Testing (UAT) against the functional specifications set forth in the SOW.  
(b) If the Deliverables satisfy the agreed specifications, the Client shall provide written sign-off or release the corresponding monthly Milestone payment.  
(c) If the Client identifies reproducible material non-conformities ("Defects"), the Client shall submit a consolidated, detailed written punch-list of Defects to the Contractor within the Review Period.  
(d) The Contractor shall rectify the verified Defects within seven (7) business days at no additional charge and resubmit the Deliverable for re-verification.  
(e) **Deemed Acceptance:** If the Client fails to provide written notice of rejection or approval within the Review Period, or puts the Deliverable into active commercial use in a live store, the Deliverable shall be deemed irrevocably accepted by the Client.

---

### SECTION 4: FEES, PAYMENT TERMS, SETTLEMENT OPTIONS & CYPRUS DUAL VAT

4.1 **Total Fixed Contract Fee:** The total fixed contract fee for the development, phased deployment, and comprehensive 12-month support of the MY GERMAN DÖNER Operations Control Suite is **€12,000.00 (Twelve Thousand Euros)**.

4.2 **Advance Payment:** The Client shall pay an upfront advance payment of **€1,000.00 (One Thousand Euros)** upon execution of this Agreement prior to the commencement of development services.

4.3 **Monthly Structured Installments:** Following the advance payment, the remaining balance of **€11,000.00 (Eleven Thousand Euros)** shall be paid in **eleven (11) consecutive monthly installments of €1,000.00 (One Thousand Euros) per month**, payable in accordance with the schedule set forth in **Schedule B**.

4.4 **Settlement Methods & Payment Terms:** Invoices issued by the Contractor shall be due and payable within **seven (7) calendar days** of the invoice date. All payments under this Agreement are **payable via SEPA Electronic Bank Transfer or Direct Cash Remittance against an Official Written & Signed Payment Voucher / Receipt**.

4.5 **Cyprus Statutory Dual-Rate Value Added Tax (VAT):** All fees stated herein are exclusive of Value Added Tax. In accordance with the **Cyprus Value Added Tax Law (Law 95(I)/2000 as amended)**:
(a) Statutory Cyprus VAT shall be applied to invoices where applicable under Cyprus commercial rules.  
(b) The software platform's fiscal ledger strictly enforces Cyprus statutory dual VAT rates: **9% Reduced VAT** for all prepared foods, dine-in, takeaway, and non-alcoholic beverages ($\text{Net} = \frac{\text{Gross}}{1.09}$), and **19% Standard VAT** strictly applied to alcoholic beverages ($\text{Net} = \frac{\text{Gross}}{1.19}$).

4.6 **Late Payment Statutory Interest:** If the Client fails to make any payment due under this Agreement by the due date, statutory interest shall accrue on the overdue amount at the rate prescribed by the **Cyprus Law on Combating Late Payment in Commercial Transactions (Law 73(I)/2012)** from the due date until full payment is received.

4.7 **Suspension of Services:** If any invoice remains unpaid for more than fourteen (14) calendar days past its due date, the Contractor reserves the right to suspend development, deployment, or cloud operations until all outstanding sums are settled in full.

---

### SECTION 5: INTELLECTUAL PROPERTY RIGHTS

5.1 **Foreground Intellectual Property Assignment:** Subject to full, final, and unconditional payment of all fees due under this Agreement, the Contractor hereby assigns to the Client all right, title, and interest in and to the custom Foreground Intellectual Property created specifically and exclusively for the Client under this Agreement.

5.2 **Background Intellectual Property Retained:** The Contractor retains all right, title, and ownership in and to all **Background Intellectual Property**, including general architecture frameworks, reusable library modules, algorithms, build scripts, and developer tooling.

5.3 **License to Background IP:** The Contractor hereby grants to the Client a perpetual, irrevocable, worldwide, non-exclusive, royalty-free, transferable license to use, execute, display, and operate the Background IP solely as incorporated into and necessary for the operation of the Deliverables for the Client's internal restaurant business operations.

5.4 **Client Materials & Trademarks:** The Client retains full ownership of all brand trademarks, logos, menu items, recipe formulations, marketing assets, and proprietary restaurant data provided to the Contractor. The Client grants the Contractor a limited, non-exclusive license to use such materials solely to perform the services under this Agreement.

---

### SECTION 6: CONFIDENTIALITY & TRADE SECRETS

6.1 **Confidentiality Obligation:** Each Party undertakes that it shall not at any time disclose to any third party any confidential information concerning the business, recipes, operations, financial records, source code, pricing structures, or affairs of the other Party, except as permitted under Section 6.2.

6.2 **Permitted Disclosures:** A Party may disclose confidential information:
(a) To its employees, officers, professional advisers, or contractors who need to know such information for the purposes of exercising the Party's rights or carrying out its obligations under this Agreement; and  
(b) As may be required by law, a court of competent jurisdiction in Cyprus, or any governmental or regulatory authority.

6.3 **Duration:** The confidentiality obligations under this Section shall survive the expiration or termination of this Agreement for a period of **five (5) years**.

---

### SECTION 7: DATA PROTECTION & GDPR COMPLIANCE

7.1 **Statutory Compliance:** Both Parties shall comply with all applicable requirements of the **EU General Data Protection Regulation (Regulation (EU) 2016/679 - GDPR)** and the **Cyprus Data Protection Law (Law 125(I)/2018)**.

7.2 **Roles of the Parties:** With respect to customer personal data (e.g. mobile pre-orders) and employee timeclock data processed through the software, the Client is the **Data Controller** and the Contractor acts as the **Data Processor**.

7.3 **Processor Obligations:** The Contractor shall:
(a) Process personal data only on documented written instructions from the Client;  
(b) Ensure that appropriate technical and organizational security measures are implemented to protect personal data against unauthorized or unlawful processing, accidental loss, destruction, or damage;  
(c) Assist the Client in responding to data subject rights requests under GDPR;  
(d) Notify the Client without undue delay upon becoming aware of a confirmed personal data security breach.

---

### SECTION 8: WARRANTIES & DEFECT REMEDY

8.1 **Contractor Warranty:** The Contractor warrants that:
(a) The Deliverables will conform in all material respects to the Specifications set forth in the SOW;  
(b) The software will be delivered free of known malicious code, viruses, or intentional backdoors.

8.2 **Ongoing Maintenance & Support Coverage:** Throughout the 12-month active term of this Agreement, the Contractor shall provide ongoing bug fixing, technical support, and defect resolution for verified reproducible errors reported in writing by the Client.

8.3 **Warranty Exclusions:** The warranty in Section 8.2 does not cover defects or failures arising from:
(a) Modifications made by the Client or third parties not authorized in writing by the Contractor;  
(b) Hardware failures, physical damage, power surges, or local internet outages;  
(c) Third-party API changes or service outages (including Shopify API changes, Link4Pay gateway outages, or cloud hosting outages).

8.4 **Disclaimer:** Except as expressly set forth herein, all services and deliverables are provided on an "as is" and "as available" basis, and the Contractor disclaims all other warranties, whether statutory, express, or implied.

---

### SECTION 9: LIMITATION OF LIABILITY

9.1 **Direct Damages Cap:** To the maximum extent permitted under the Contract Law of Cyprus (Cap. 149), the Contractor's total aggregate liability arising out of or in connection with this Agreement, whether in contract, tort (including negligence), breach of statutory duty, or otherwise, shall be strictly limited to the **total fees actually paid by the Client to the Contractor under this Agreement in the twelve (12) months preceding the claim**.

9.2 **Exclusion of Consequential Losses:** In no event shall either Party be liable to the other Party for any indirect, incidental, special, punitive, or consequential damages, including loss of profits, loss of sales, loss of reputation, food spoilage, or business interruption.

---

### SECTION 10: TERM, TERMINATION & HANDOVER

10.1 **Term:** This Agreement shall commence on the Effective Date and shall continue in full force and effect for the full twelve (12) month implementation and support period, unless terminated earlier pursuant to this Section 10.

10.2 **Termination for Cause:** Either Party may terminate this Agreement with immediate effect by written notice to the other Party if:
(a) The other Party commits a material breach of this Agreement and fails to remedy such breach within **fourteen (14) calendar days** of receiving written notice requiring remedy; or  
(b) The other Party becomes insolvent, enters into liquidation, makes an arrangement with creditors, or ceases to carry on business.

10.3 **Consequences of Termination:** Upon termination of this Agreement for any reason:
(a) The Client shall immediately pay the Contractor for all work completed, pro-rated installments in progress, and unreimbursed expenses incurred up to the date of termination;  
(b) Subject to receipt of full payment for completed work, the Contractor shall deliver to the Client the latest stable build of Deliverables completed up to the date of termination.

---

### SECTION 11: FORCE MAJEURE

11.1 Neither Party shall be in breach of this Agreement or liable for delay in performing, or failure to perform, any of its obligations if such delay or failure results from events, circumstances, or causes beyond its reasonable control, including acts of God, flood, fire, war, civil commotion, national power grid failures, submarine cable outages, or governmental restrictions. In such circumstances, the time for performance shall be extended by a period equivalent to the period of delay.

---

### SECTION 12: DISPUTE RESOLUTION & GOVERNING LAW

12.1 **Governing Law:** This Agreement, and any dispute or claim arising out of or in connection with it or its subject matter or formation (including non-contractual disputes or claims), shall be governed by and construed in accordance with the **Contract Law of the Republic of Cyprus (Cap. 149)** and relevant European Union legislation applicable in Cyprus.

12.2 **Amicable Settlement:** In the event of any controversy, claim, or dispute arising out of or relating to this Agreement, the designated representatives of both Parties (MD. SAIED SAGAR for the Contractor, and RICO/OLIVER for the Client) shall meet in good faith within seven (7) days of written notice to attempt an amicable resolution.

12.3 **Jurisdiction:** If the dispute is not settled amicably within fourteen (14) days of such meeting, the dispute shall be submitted to the exclusive jurisdiction of the competent **District Courts of the Republic of Cyprus (Paphos or Limassol District)**, without prejudice to the Parties' right to refer the matter to arbitration under the **Cyprus Arbitration Law (Cap. 4)** by mutual written agreement.

---

### SECTION 13: MISCELLANEOUS PROVISIONS

13.1 **Entire Agreement:** This Agreement, together with Schedules A, B, and C and the Master PRD, constitutes the entire agreement between the Parties and supersedes all prior negotiations, representations, understandings, or agreements, whether written or oral, relating to its subject matter.

13.2 **Severability:** If any provision of this Agreement is held to be invalid, illegal, or unenforceable by any court of competent jurisdiction in Cyprus, such provision shall be severed and the remaining provisions shall continue in full force and effect.

13.3 **No Partnership or Agency:** Nothing in this Agreement shall be construed as creating a partnership, joint venture, agency, or employment relationship between the Parties.

13.4 **Notices:** Any notice given under this Agreement shall be in writing and delivered by hand, registered courier, or confirmed email to the respective addresses set out in the preamble.

13.5 **Counterparts:** This Agreement may be executed in any number of counterparts, each of which when executed shall constitute an original, and all counterparts together shall constitute one and the same instrument. Electronic signatures (DocuSign, scanned PDF) shall be deemed valid and legally binding under Cyprus Law.

---

### IN WITNESS WHEREOF, the Parties hereto have caused this Master Software Services Agreement to be executed by their duly authorized representatives as of the Effective Date.

```
SIGNED AND DELIVERED BY:

For the Contractor:                          For the Client:
MD. SAIED SAGAR                              MY GERMAN DÖNER TRADING LTD




_________________________________________    _________________________________________
MD. SAIED SAGAR                              RICO
Systems Architect & Lead Engineer            Co-Founder & Managing Director
Date: ___________________________________    Date: ___________________________________




                                             _________________________________________
                                             OLIVER
                                             Co-Founder & Managing Director
                                             Date: ___________________________________
```

---
*Schedule A: Statement of Work (SOW Revision 3.1)*  
*Schedule B: Commercial Milestones, Payment Schedule & SLA Agreement*  
*Schedule C: Client Technical Prerequisites & Tooling Agreement*
