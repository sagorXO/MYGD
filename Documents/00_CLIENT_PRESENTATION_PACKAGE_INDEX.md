# 🥙 MY GERMAN DÖNER — Connected Operations Control Suite
## Client Presentation Package & Master Document Index (Final Release)

> **Executive Client Package:** Final Revision 3.3  
> **Prepared For:** RICO & OLIVER (Founders & Managing Directors), Markus (Project Lead)  
> **Prepared By:** MD. SAIED SAGAR (Lead Systems Architect & Sole Implementation Engineer)  
> **Jurisdiction:** Republic of Cyprus (Cyprus Contract Law Cap. 149 & EU GDPR Law 125(I)/2018)  
> **Fiscal Regime:** Cyprus Statutory Dual-Rate VAT (9% Food & Soft Drinks / 19% Alcoholic Beverages)  
> **Deployment Architecture:** Hybrid Edge (Windows PC at static LAN IP `192.168.1.50`) + Cloud Linux VPS (Hostinger/Hetzner)  
> **Locations:** Emba / Paphos (Flagship Store) & Limassol Marina (Delivery Hub ~80%)  
> **Official Website:** [mygermandoener.com](https://mygermandoener.com/) | **Brand Slogan:** *"BITE THE HYPE"*  
> **Commercial Terms:** **€12,000.00 Fixed Contract Value** (€1,000.00 Advance Deposit + €1,000.00 / Month for 11 Months — 12-Month Total Active Term)  
> **Accepted Settlement Methods:** SEPA Electronic Bank Transfer or Direct Cash Remittance against Signed Official Receipt  

---

## 1. Executive Package Overview

This document package delivers the complete, legally binding, and engineering-ready documentation for the **MY GERMAN DÖNER Operations Control Suite**. It unifies all restaurant operations into a high-performance, real-time control system structured into **5 Integrated Systems** with **100% In-Store Offline Autonomy**.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  THE 5 INTEGRATED SYSTEMS                                        │
├─────┬────────────────────────────────────────────────────────┬───────────────────────────────────┤
│ Sys │ Integrated System Domain                               │ Infrastructure & Interface        │
├─────┼────────────────────────────────────────────────────────┼───────────────────────────────────┤
│ S1  │ Public Brand & Ordering Platform                       │ Next.js SSR/ISR on Cloud Linux VPS│
│ S2  │ Overhead 4x 4K Digital Signage & Queue TV              │ 3840x2160 Vector CMS (/boards, TV)│
│ S3  │ Front-of-House (FOH) Cashier Till                      │ iPad Web POS (/pos) + Link4Pay    │
│ S4  │ Kitchen Production & Dual-Station Routing              │ Dual Thermal Printers (TCP:9100)  │
│ S5  │ Back-of-House (BOH) Master Operations Dashboard        │ Unified Admin (/admin) & Dual-VAT │
└─────┴────────────────────────────────────────────────────────┴───────────────────────────────────┘
```

---

## 2. Complete Document Catalog

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  CLIENT DOCUMENT SUITE MAP                                       │
├─────┬────────────────────────────────────────────────────────┬───────────────────┬───────────────┤
│ Ref │ Document Title                                         │ Format            │ Purpose       │
├─────┼────────────────────────────────────────────────────────┼───────────────────┼───────────────┤
│ 00  │ Master Presentation Package Index (This Document)      │ Markdown          │ Master Guide  │
│ PRD │ Master Product Requirements Document (PRD v3.3)         │ Markdown          │ Spec SSOT     │
│ 01  │ Master Software Services Agreement (MSA)               │ Word (.docx) & MD │ Legal Engine  │
│ 02  │ Statement of Work (SOW Revision 3.1 — Schedule A)      │ Word (.docx) & MD │ Scope & Specs │
│ 03  │ Commercial Milestones & Payment Schedule (Schedule B)  │ Word (.docx) & MD │ Financials    │
│ 04  │ Client Technical Prerequisites & Tooling (Schedule C)  │ Word (.docx) & MD │ Prereqs & AI  │
│ 05  │ Commercial Invoice — Milestone 0 (€2,000 Advance)      │ Word (.docx) & MD │ Billing       │
│ 06  │ Executive Pitch Deck & Presentation Companion          │ Markdown          │ Presentation  │
│ 07  │ Hardware Procurement & Store Deployment Guide          │ Markdown          │ Hardware BOM  │
│ 08  │ Staff Operations & Standard Operating Procedures (SOP) │ Markdown          │ Staff Training│
└─────┴────────────────────────────────────────────────────────┴───────────────────┴───────────────┘
```

---

## 3. Core Architectural & Operational Highlights

1. **Compute Topology & 100% In-Store Offline Autonomy:**
   - **Local In-Store Server (Static IP `192.168.1.50`):** Dedicated on-premise Windows PC running as an unattended background service (via NSSM/WinSW). Hosts the local Next.js instance, SQLite WAL database, SSE local event broker (<15ms latency), and raw TCP print spooler (Port 9100).
   - **Zero Internet Dependency:** If WAN internet disconnects, cash sales, drawer kicks, dual kitchen printing, and menu screens operate 100% uninterrupted locally.
   - **Cloud Tier:** High-availability Linux VPS (Hostinger KVM / Hetzner Ubuntu 24.04 with Docker) running `mygermandoener.com`, PostgreSQL sync database, remote owner BI analytics, and delivery bridges.
2. **Cyprus Statutory Dual-Rate VAT Compliance (Law 95(I)/2000):**
   - **9% Reduced VAT:** Applied to all prepared foods, dine-in, takeaway, and non-alcoholic drinks ($\text{Net} = \frac{\text{Gross}}{1.09}$).
   - **19% Standard VAT:** Strictly applied to alcoholic beverages ($\text{Net} = \frac{\text{Gross}}{1.19}$).
3. **Overhead 4x 4K Digital Signage & Queue TV:**
   - 4 overhead 4K Smart TVs displaying zero-reflow, GPU-accelerated vector layouts driven locally from `192.168.1.50` with sub-500ms Sold-Out sync and dayparting:
     * Screen 1: Hero Brand & Signature Bestsellers ("BITE THE HYPE", rotating spit 4K loop).
     * Screen 2: Original German Döner & Platters (Veal/Beef, Chicken, Mixed).
     * Screen 3: Dürum Wraps & Döner Boxes.
     * Screen 4: Specialties, Loaded Fries, Combos (+€3.50), Homemade Sauces & Drinks.
4. **Dual Kitchen Thermal Printers & KDS Phase 1 Scope:**
   - Store 01 operates two physical Ethernet thermal printers over raw TCP (Port 9100):
     * Station 1: Indoor Assembly Line ESC/POS Printer.
     * Station 2: Outdoor Charcoal Rotisserie/Grill ESC/POS Printer.
   - KDS Phase 1 provides responsive dual-station web views (`/kds/indoor` and `/kds/grill`), ready for the client's planned future mounting of 2x Kitchen Smart TVs.
5. **Dual-Till Front-of-House (FOH) Concurrency & Central Ingestion:**
   - Full retirement of the legacy Windows 7 touch terminal.
   - Front-of-House operates concurrently across **Register 1 (iPad 10.9" Custom Web POS `/pos`)** and **Register 2 (Dedicated Shopify POS Hardware Terminal)** during peak rushes.
   - The on-premise Windows server (`192.168.1.50`) acts as the single central order ingestion engine, maintaining a unified sequential order queue across both registers for kitchen chits and the Customer Pickup TV (`/display`).
   - Orders from both tills trigger identical split printing across the 2x LAN thermal printers (Port 9100) and central real-time BOM spit meat deductions.
6. **Commercial Dual Settlement Option:**
   - All contract payments are payable via **SEPA Electronic Bank Transfer** or **Direct Cash Remittance against an Official Written & Signed Payment Voucher / Receipt**.

---

## 4. Financial & Payment Structure Summary

| Payment Stage | Operational & Deliverable Scope | Amount (€) | Settlement Trigger |
|:---|:---|:---:|:---|
| **Advance Deposit (M0)** | Kickoff, Schema Init, Local Windows Server (`192.168.1.50`) Setup | **€ 1,000.00** | Due upon contract execution |
| **Month 1 Installment** | **M1 Checklists & HACCP Logbook** + **M2 Supplier Ordering Engine** | **€ 1,000.00** | Due 30 days post-kickoff (Net-7) |
| **Month 2 Installment** | **M3 Dynamic Stock & Spit Depletion** + **Modern iPad Web POS** | **€ 1,000.00** | Due 60 days post-kickoff (Net-7) |
| **Month 3 Installment** | **M9 Executive Reporting Dashboard** + **Cyprus Dual-VAT Ledger** | **€ 1,000.00** | Due 90 days post-kickoff (Net-7) |
| **Month 4 Installment** | **M7 Staff Shift Scheduling** + **4-Digit PIN Timeclock** | **€ 1,000.00** | Due 120 days post-kickoff (Net-7) |
| **Month 5 Installment** | **M8 Visual Build Sheets** + **Assembly Training SOP Guides** | **€ 1,000.00** | Due 150 days post-kickoff (Net-7) |
| **Month 6 Installment** | **M10 4x 4K Overhead Digital Menu Board CMS** | **€ 1,000.00** | Due 180 days post-kickoff (Net-7) |
| **Month 7 Installment** | **M5 Dual-Station KDS & Raw TCP Thermal Print Spooler** | **€ 1,000.00** | Due 210 days post-kickoff (Net-7) |
| **Month 8 Installment** | **M6 Limassol Pre-Order & Delivery Flow** + **Public App** | **€ 1,000.00** | Due 240 days post-kickoff (Net-7) |
| **Month 9 Installment** | **Store 02 Limassol Live Integration & Scaling** | **€ 1,000.00** | Due 270 days post-kickoff (Net-7) |
| **Month 10 Installment** | **Advanced BI Analytics, Food Cost & Waste Tracking** | **€ 1,000.00** | Due 300 days post-kickoff (Net-7) |
| **Month 11 Installment** | **Production Warranty Audit, Final Transition & Sign-Off** | **€ 1,000.00** | Due 330 days post-kickoff (Net-7) |
| **TOTAL CONTRACT VALUE** | **Complete 5-System Connected Platform with 12-Month SLA Support** | **€ 12,000.00** | **100% Fixed Price Scope** |

---

## 5. Execution Roadmap

1. **Step 1:** Review and sign **Master Software Services Agreement (MSA)** and **Statement of Work (SOW Revision 3.1)**.
2. **Step 2:** Settle **Milestone 0 Advance Commercial Invoice (€1,000.00)** via SEPA Bank Transfer or Direct Cash Remittance.
3. **Step 3:** Provision Shopify App credentials, configure on-premise Windows PC (`192.168.1.50`), and verify dual thermal printers on TCP Port 9100.
4. **Step 4:** Kick off Phase 1 development (M1 Checklists & M2 Supplier Ordering).

---
*MY GERMAN DÖNER Operations Control Suite — Client Presentation Package*
