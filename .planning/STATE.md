# Statement Convertor: Project State

**Project:** Statement Convertor  
**Repository:** statement-convertor  
**Created:** 2025-03-12

## Core Value

Users can convert credit card statements to Rydoo format without manual data entry — upload PDFs, get Excel ready for import.

## Current Position

**Current Phase:** 2 — PDF Parsing Infrastructure  
**Current Plan:** 02-01  
**Status:** In Progress (1/2 plans complete in current phase)

### Phase Progress

```
[██████░░░░░░░░░░░░░░] 30% Overall (1.5/5 phases completed)
```

**Phase Status:**
| Phase | Progress | State |
|-------|----------|-------|
| 1 - Project Setup | 100% | 🟢 Completed |
| 2 - PDF Parsing Infrastructure | 50% | 🟡 In Progress |
| 3 - Data Extraction | 0% | 🔵 Not Started |
| 4 - Excel Generation | 0% | 🔵 Not Started |
| 5 - CLI Interface and Integration | 0% | 🔵 Not Started |

## Current Focus

**Immediate Next Step:** Execute 02-02-PLAN.md — BNP Parser Implementation

**Phase 2 Goal:** System can extract raw text and structure from BNP PDFs

**Phase 2 Plan 1 Completed:** ✓ PDF Parsing Infrastructure

- pdf-parse library installed and configured
- Type definitions created (PdfContent, PdfPage)
- parsePdf function implemented with per-page support
- Parser module exports ready

**Success Criteria for Current Phase:**

1. ✓ System can parse single-page BNP PDF and extract raw text content
2. ⏳ System can identify transaction table boundaries in parsed text (next plan)
3. ✓ System handles multi-page PDFs without losing transaction data (infrastructure ready)
4. ⏳ System extracts complete card number from PDF header ("Numéro de carte XXXX") (next plan)
5. ✓ Parser returns structured intermediate format with raw text sections

## Performance Metrics

| Metric                 | Value | Target |
| ---------------------- | ----- | ------ |
| Phases Completed       | 1.5/5 | 5      |
| Requirements Delivered | 2/21  | 21     |
| Success Criteria Met   | 5/23  | 23     |
| Plans Completed        | 3/7   | 7      |
| Days Since Start       | 0     | -      |

## Accumulated Context

### Decisions Made

1. **Use pdf-parse v2.x class-based API**: Installed pdf-parse v2.4.5 which uses `new PDFParse({ data: buffer })` pattern with explicit `getText()` and `destroy()` methods.
2. **Use require() with createRequire for CommonJS modules**: pdf-parse uses CommonJS exports, so we use `createRequire(import.meta.url)` to import it in ESM context.
3. **Structured types for multi-page support**: Created PdfPage interface with pageNumber and text fields to support per-page content extraction (PARSE-03).

### Open Questions

1. Should we use npm or pnpm for package management? (default: npm)
2. Should we add ESLint/Prettier setup in Phase 1 or defer to later? (recommend: Phase 1)

### Known Blockers

_No blockers._

### Technical Debt

_No technical debt accumulated._

### Architecture Notes

**Planned Pattern:** Strategy pattern for bank parsers

- Interface: `BankParser { canParse(pdf): boolean; parse(pdf): Transaction[] }`
- BNP implementation: `BnpParser implements BankParser`
- Future: `KbcParser`, `IngParser`, etc.

**Folder Structure (Planned):**

```
statement-convertor/
├── src/
│   ├── parsers/
│   │   ├── index.ts          # Parser registry
│   │   ├── base-parser.ts    # Abstract base
│   │   └── bnp-parser.ts     # BNP implementation
│   ├── extractors/
│   │   └── transaction-extractor.ts
│   ├── generators/
│   │   └── excel-generator.ts
│   ├── cli.ts                # CLI entry point
│   └── index.ts              # Main export
├── input/                    # PDF input folder
├── output/                   # Excel output folder
├── processed/                # Processed PDFs
├── dist/                     # Compiled output
└── package.json
```

### Library Selection (from Research)

- **PDF Parsing:** pdf-parse (npm)
- **Excel Generation:** xlsx (SheetJS)
- **CLI Framework:** commander
- **Output Styling:** chalk (optional)

## Session Continuity

### Last Session

2026-03-12 - Completed 02-01-PLAN.md (PDF Parsing Infrastructure)

- Installed pdf-parse v2.4.5
- Created PDF type definitions
- Implemented parsePdf function
- Created parser module index

### Current Work

Phase 2: PDF Parsing Infrastructure - Plan 1 of 2 complete

- PDF text extraction foundation ready
- Ready to implement BNP-specific parser

### Next Actions

1. Execute 02-02-PLAN.md — BNP Parser Implementation
2. Implement card number extraction from "Numéro de carte" header
3. Identify transaction table boundaries in parsed text
4. Build BNP parser using strategy pattern

### Files in Progress

_No files currently being worked on._

## Checkpoints

### Phase 1 Entry

- [x] PROJECT.md created
- [x] REQUIREMENTS.md created
- [x] ROADMAP.md created
- [x] STATE.md created
- [x] Phase 1 plan created
- [x] Phase 1 plans executed
- [x] Phase 1 verification passed

### Phase 2 Entry (Prerequisites)

- [x] TypeScript builds successfully
- [x] Project structure established
- [x] npm install works
- [x] pdf-parse library installed
- [x] PDF types created
- [x] parsePdf function implemented

### Phase 3 Entry (Prerequisites)

- [ ] PDF text extraction works
- [ ] Transaction table identification works
- [ ] Card number extraction works

### Phase 4 Entry (Prerequisites)

- [ ] Date parsing works
- [ ] Amount parsing works
- [ ] Transaction objects created

### Phase 5 Entry (Prerequisites)

- [ ] Excel generation works
- [ ] All columns mapped correctly
- [ ] Rydoo compatibility verified

### Project Complete

- [ ] CLI processes input/ folder
- [ ] Processed PDFs moved to processed/
- [ ] Excel written to output/
- [ ] --bank flag works
- [ ] Summary output displayed
- [ ] Strategy pattern implemented

## Notes

### Date Handling

BNP PDFs use French date format: "12 mars 2024" → must convert to "3/12/2024"

### Amount Handling

BNP PDFs use European number format: "-19,00" → must convert to -19.00

### Foreign Currency

Format: "-19,00 USD" with exchange rate on following line → extract USD as CurrencyCode

### Card Number Extraction

Source text: "Numéro de carte 5480 28XX XXXX 8204" → extract "8204" (last 4 digits)

---

_State file initialized: 2025-03-12_
