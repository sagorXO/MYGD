# SCHEDULE C — CLIENT TECHNICAL PREREQUISITES & TOOLING AGREEMENT
### Master Software Services Agreement • Final Revision 3.1 (Authoritative)

> **Document Type:** Schedule C to Master Software Services Agreement (MSA)  
> **Project Name:** MY GERMAN DÖNER Connected Operations Control System  
> **Lead Systems Architect:** MD. SAIED SAGAR (Sole Implementation Engineer)  
> **Client Stakeholders:** RICO & OLIVER (Founders & Managing Directors), Markus (Project Lead)  
> **Effective Date:** August 24, 2026  

---

## 1. Purpose & Client Responsibilities

To ensure the timely and efficient delivery of the **MY GERMAN DÖNER Operations Control Suite**, the Client acknowledges and agrees to provide the following technical prerequisites, account credentials, on-premise hardware infrastructure, and brand assets in accordance with the timelines defined herein.

---

## 2. Technical Prerequisites & Access Requirements

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                CLIENT PREREQUISITES MATRIX                                       │
├─────┬──────────────────────────┬─────────────────────────────────────────────────┬───────────────┤
│ Cat │ Requirement              │ Technical Details / Scope                       │ Target Date   │
├─────┼──────────────────────────┼─────────────────────────────────────────────────┼───────────────┤
│ A   │ Shopify Admin Access     │ Collaborator / Custom App Developer Permissions │ Day 1 Kickoff │
│ B   │ Link4Pay Terminal Params │ Terminal ID, Merchant ID & Pairing Protocol     │ Week 1        │
│ C   │ DNS & Domain Access      │ Subdomain DNS Delegation (mygermandoener.com)   │ Week 2        │
│ D   │ Developer Tooling & AI   │ Dedicated AI Infrastructure Allowance           │ Day 1 Kickoff │
│ E   │ Food Photography Handoff │ High-Resolution Menu Product Imagery            │ Week 2        │
│ F   │ Local On-Premise PC      │ Dedicated Windows Server PC at 192.168.1.50     │ Week 1        │
│ G   │ Dual Thermal Printers    │ 2x Ethernet ESC/POS Printers on TCP Port 9100   │ Week 1        │
│ H   │ In-Store Network Setup   │ Dual-WAN Router with 4G LTE Backup SIM          │ Prior to UAT  │
└─────┴──────────────────────────┴─────────────────────────────────────────────────┴───────────────┘
```

---

### Category A: Shopify Store Credentials & API Access
* **Shopify Storefronts:** Provisioning of Collaborator access or Custom App API keys (`shpat_...`) on the active Shopify store account for Admin API, Storefront API, and multi-location activation (Emba Flagship and Limassol Marina).

---

### Category B: Link4Pay Card Terminal Parameters
* **Payment Terminal Identification:** Client will supply merchant ID, terminal serial numbers, and transaction communication guidelines for the Link4Pay standalone terminals deployed at the Emba and Limassol cashier counters.

---

### Category C: Domain & DNS Configuration (`mygermandoener.com`)
* The Client shall provide DNS CNAME / A-Record access or configure the following dedicated subdomains pointing to the cloud Linux VPS:
  - `admin.mygermandoener.com` (Executive & Backoffice Portal)
  - `boards.mygermandoener.com` (Digital Menu Board Streaming Player)
  - `order.mygermandoener.com` (Limassol Mobile Pre-Order & Delivery App)

---

### Category D: Developer AI Infrastructure & Tooling Provisioning
* **Developer AI Infrastructure:** Provisioning of a dedicated developer AI tooling subscription (or funded API allowance of $150–$200/mo) dedicated to the Lead Architect for high-speed terminal automation, code generation, continuous codebase AST indexing, and real-time architectural simulations throughout the active implementation period.

---

### Category E: Food Photography & Brand Assets
* **Menu Photography:** High-resolution appetizing macro photography of all core menu items (Classic Veal/Beef Döner, Chicken Döner, Dürum Wraps, Döner Boxes, Berlin Currywurst, Fries, Sauces, and Drinks) prepared and photographed in-store, per RICO's directive.
* **Brand Assets:** Vector SVG logo files, official color palettes, and typography assets.

---

### Category F: Local In-Store Windows Server PC (`192.168.1.50`)
* **Dedicated Windows PC:** Provisioning of a dedicated in-store Windows PC connected via Ethernet LAN, assigned a static IP reservation at `192.168.1.50`.
* **Service Hosting:** Configured with administrator privileges to allow the installation and execution of the local Next.js background service (via NSSM or WinSW), local SQLite WAL database, SSE local broker, and raw TCP printer spooler.

---

### Category G: Dual Thermal Kitchen Printers (Port 9100)
* **Station 1 Indoor Assembly Printer:** Hardwired Ethernet connection assigned a static IP, accepting raw ESC/POS text streams on TCP Port 9100.
* **Station 2 Outdoor Charcoal Grill Printer:** Hardwired Ethernet connection assigned a static IP, accepting raw ESC/POS meat carving ticket streams on TCP Port 9100.

---

### Category H: In-Store Network Infrastructure & 4G Failover
* **Local Area Network (LAN):** High-speed Gigabit Ethernet drops to the countertop POS till, Windows PC server, and both thermal printers.
* **Wi-Fi Coverage:** Dedicated 5GHz private staff network for the wall tablets (`/staff`) and 4x 4K Overhead Smart TVs.
* **4G LTE Cellular Failover:** Installation of a Dual-WAN router equipped with an active 4G/5G data SIM card to guarantee continuous cloud synchronization.

---

### IN WITNESS WHEREOF, the Parties have executed this Schedule C as of the date first above written.

```
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
