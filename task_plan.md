# Task Plan: Proforma Invoice Generator for Nigeria Form M

## Goal
Build a web application that helps Nigerian importers generate professional proforma invoices required for CBN Form M banking applications, matching the exact format shown in the reference invoice.

## Current Phase
Phase 1

## Phases

### Phase 1: Requirements & Discovery
- [x] Analyze reference invoice image — capture all fields, layout, and sections
- [x] Identify Nigeria Form M specific requirements (HS Code, country of origin, etc.)
- [x] Document findings in findings.md
- **Status:** complete

### Phase 2: Planning & Structure
- [/] Define app architecture (HTML/CSS/JS + PDF generation)
- [ ] Plan UI layout — form input + live preview
- [ ] Define data model for invoice fields
- [ ] Create implementation plan for user review
- **Status:** in_progress

### Phase 3: Implementation — Core UI
- [ ] Create project structure (index.html, styles.css, app.js)
- [ ] Build the invoice input form (all sections)
- [ ] Build the live invoice preview panel
- [ ] Style to match the reference invoice format
- **Status:** pending

### Phase 4: Implementation — Features
- [ ] Add line item add/remove functionality
- [ ] Auto-calculate totals (FOB, freight, C&F)
- [ ] Number-to-words conversion for total amount
- [ ] Company logo/stamp image upload
- [ ] PDF export functionality
- **Status:** pending

### Phase 5: Testing & Verification
- [ ] Test form input → preview rendering
- [ ] Test calculations (unit price × qty, totals)
- [ ] Test PDF generation and download
- [ ] Test with sample data matching reference invoice
- [ ] Test responsive design
- **Status:** pending

### Phase 6: Delivery
- [ ] Review all output files
- [ ] Ensure deliverables are complete
- [ ] Deliver to user
- **Status:** pending

## Key Questions
1. Should invoice data be saved to Supabase for retrieval later? → **No, email delivery instead. User provides email, PDF sent to inbox.**
2. Should there be user authentication / multi-user support? → **No, open tool for anyone.**
3. Should we support multiple invoice templates or just the single format shown? → **Single format from reference image.**
4. How to handle bilingual headers? → **Upload images for header and stamp. Users can't type foreign chars.**

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Client-side only MVP | Fastest path to a working tool; PDF generated in browser |
| Vanilla HTML/CSS/JS | Simple project; no framework overhead |
| html2pdf.js for PDF export | Converts DOM to PDF directly |
| EmailJS for email delivery | Send PDF to user's email from browser, no backend |
| Image uploads for header/stamp | Users upload letterhead and seal images |
| No auth, no Supabase | Open tool; Supabase not needed for MVP |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| (none yet) | — | — |

## Notes
- Update phase status as you progress: pending → in_progress → complete
- Re-read this plan before major decisions (attention manipulation)
- Log ALL errors — they help avoid repetition
