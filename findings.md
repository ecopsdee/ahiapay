# Findings & Decisions

## Requirements
<!-- Captured from user request and invoice image -->
- Web application to help Nigerian importers generate proforma invoices for Form M banking
- Must match the format shown in the reference invoice image
- Invoice must include: supplier company header, buyer details, itemized goods table, totals, shipping info, banking/beneficiary details, and company stamp/seal

## Visual/Browser Findings — Invoice Image Analysis

### Company Header Section (Supplier)
- Chinese characters: 瑞安市天酬进出口贸易有限公司 (shown at top)
- English name: **TEAM-GO I & E CO., LTD.(RUIAN)**
- Address: Floor 2, No 359, Chengnan Road, Dongshan Economic development zone, Ruian, Zhejiang, China
- TEL: 0086-577-65898000
- FAX: 0086-577-65807808
- Title: **发 票 / PROFORMA INVOICE**

### Invoice Metadata (Top Right)
- 号码 / No: `109-002-C`
- 售货确认号码 / Sales Confirmation No: `DITTO`
- 日期 / Date: `AUGUST 8, 2020`

### Buyer/Recipient Section (TO:)
- Company: Lakoview Global Services LTD
- Address: Plot 3299 Amuwo Ind Estate, Amuwo Odofin Lagos State NIGERIA
- TEL: 08035068068
- E-mail: alex09@yahoo.com

### Items Table Columns
| Column | Example |
|--------|---------|
| S/N | 1 |
| HSCODE | 8481200000 |
| DESCRIPTION OF GOODS | ENGINE VALVE |
| BRAND NAME | HIPO BRAND |
| QUANTITY | 300,000 PCS |
| UNIT PRICE USD | 0.17 USD |
| AMOUNT USD | 51,000.00 USD |

### Totals Section
- **TOTAL F.O.B CHINA:** 51,000.00 USD
- **TOTAL SEA FREIGHT CHINA:** 9,000.00 USD
- **TOTAL C&F: ONNE P/H NIGERIA:** 60,000.00 USD

### Text Summary Below Table
- **TOTAL:** TWENTY THOUSAND US DOLLARS (amount in words)
- **COUNTRY OF ORIGIN:** CHINA
- **COUNTRY OF SUPPLY:** CHINA
- **PRODUCT CERTIFICATION NO:** CSIC20NPR1250
- **PARTIAL SHIPMENT:** ALLOWED

### Beneficiary/Banking Section
- **BENEFICIARY NAME:** TEAM-GO I & E CO., LTD.(RUIAN)
- **BENEFICIARY BANK:** CHINA CONSTRUCTION BANK ZHEJIANG BRANCH
- **BANK ACCOUNT NO:** 33050162613500000360
- **BANK ADDRESS:** ZHEJIANG BRANCH
- **BANK SWIFT:** PCBCCNBJZJW
- **INTERMEDIARY BANK:** CITIBANK N.A., NEW YORK
- **SWIFT:** CITIUS33

### Company Stamp/Seal
- Red stamp/seal in bottom-right corner with Chinese characters
- Text: 瑞安市天酬进出口贸易有限公司
- English: Team-go I&E Co., Ltd. (Ruian)

## Research Findings
- Form M is a mandatory document required by the Central Bank of Nigeria (CBN) for all imports into Nigeria
- The proforma invoice is one of the mandatory documents needed to process Form M
- Key fields regulators look for: HS Code, Country of Origin, Country of Supply, port of destination, banking details
- Invoice must be in USD or applicable foreign currency
- Partial shipment status must be declared

## Technical Decisions (User-Confirmed)
| Decision | Rationale |
|----------|-----------|
| Vanilla HTML/CSS/JS | Simple, fast to build, no framework overhead |
| PDF generation via html2pdf.js | Client-side PDF generation, no server needed |
| EmailJS for email delivery | User provides email → PDF sent to inbox. No backend required |
| No Supabase for MVP | Supabase not needed yet; EmailJS handles delivery. Can add later for invoice history |
| No authentication | Open tool anyone can use |
| Single template format | Just the one format from the reference invoice image |
| Image uploads for header & stamp | Users upload their company header image (letterhead) and stamp/seal image. They may not be able to type foreign characters |
| Form + Live Preview layout | Best UX — see invoice changes in real-time |

## Resources
- Project root: `c:\Users\Surface\Documents\projects\formapay`
- Existing dependency: `@supabase/supabase-js ^2.98.0`

---
*Update this file after every 2 view/browser/search operations*
*This prevents visual information from being lost*
