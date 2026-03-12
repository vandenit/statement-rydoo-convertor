# Statement Convertor: Project State

**Project:** Statement Convertor  
**Repository:** statement-convertor  
**Created:** 2025-03-12

## Core Value

Users can convert credit card statements to Rydoo format without manual data entry — upload PDFs, get Excel ready for import.

## Current Position

**Current Phase:** 3 — Data Extraction  
**Current Plan:** 03-01  
**Status:** In Progress (1/2 plans complete)

### Phase Progress

```
[██████████░░░░░░░░░░] 50% Overall (2.5/5 phases completed)
```

**Phase Status:**
| Phase | Progress | State |
|-------|----------|-------|
| 1 - Project Setup | 100% | 🟢 Completed |
| 2 - PDF Parsing Infrastructure | 100% | 🟢 Completed |
| 3 - Data Extraction | 50% | 🟡 In Progress |
| 4 - Excel Generation | 0% | 🔵 Not Started |
| 5 - CLI Interface and Integration | 0% | 🔵 Not Started |

## Current Focus

**Immediate Next Step:** Execute 03-02-PLAN.md — Amount Parser and Transaction Row Extraction

**Phase 2 Complete:** ✓ PDF Parsing Infrastructure

- Plan 02-01: PDF parser infrastructure with pdf-parse
- Plan 02-02: BNP parser with card extraction and table identification

**Phase 2 Accomplishments:**

1. ✓ System can parse single-page BNP PDF and extract raw text content
2. ✓ System can identify transaction table boundaries in parsed text
3. ✓ System handles multi-page PDFs without losing transaction data
4. ✓ System extracts complete card number from PDF header ("Numéro de carte XXXX")
5. ✓ Parser returns structured intermediate format with raw text sections
6. ✓ Strategy pattern architecture implemented (ARCH-03)

## Performance Metrics

| Metric                 | Value | Target |
| ---------------------- | ----- | ------ |
| Phases Completed       | 2.5/5 | 5      |
| Requirements Delivered | 8/21  | 21     |
| Success Criteria Met   | 13/23 | 23     |
| Plans Completed        | 5/7   | 7      |
| Days Since Start       | 0     | -      |

## Accumulated Context

### Decisions Made

1. **Use pdf-parse v2.x class-based API**: Installed pdf-parse v2.4.5 which uses `new PDFParse({ data: buffer })` pattern with explicit `getText()` and `destroy()` methods.
2. **Use require() with createRequire for CommonJS modules**: pdf-parse uses CommonJS exports, so we use `createRequire(import.meta.url)` to import it in ESM context.
3. **Structured types for multi-page support**: Created PdfPage interface with pageNumber and text fields to support per-page content extraction (PARSE-03).
4. **Abstract class for parser base**: Used `abstract class BaseParser` instead of interface to provide shared utility methods (findFirstMatch, extractBetweenMarkers) to all bank parsers.
5. **Multiple regex patterns for robust extraction**: Implemented primary + alternative + fallback regex patterns for card number extraction to handle BNP PDF format variations.
6. **Phase separation for transaction parsing**: Phase 2 identifies table boundaries and returns raw section text. Phase 3 implements row-by-row transaction parsing. This separates section identification from content parsing.
7. **Accent-free French month variants**: Added fevrier, aout, decembre variants in FRENCH_MONTHS alongside accented versions for robustness against PDF text extraction variations.
8. **M/D/YYYY date format**: Confirmed Rydoo expects M/D/YYYY format (no leading zeros) for transaction dates.
9. **Readonly constant pattern**: Used `Readonly<Record<string, number>>` for FRENCH_MONTHS to ensure immutability at compile time.

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

2026-03-12 - Completed 03-01-PLAN.md (Transaction Types and Date Parsing)

- Added Transaction interface with Date and number types
- Created French date parser supporting all 12 months
- Implemented parseFrenchDate(), formatDateMDY(), parseAndFormatFrenchDate()
- Added comprehensive test suite (25 tests)
- All tests pass successfully

### Current Work

Phase 3: Data Extraction - 50% Complete

- ✓ Transaction interface with typed fields
- ✓ French date parsing infrastructure
- ⏳ Amount parsing and transaction row extraction (next)

### Next Actions

1. Execute 03-02-PLAN.md — Amount Parser and Transaction Row Extraction
2. Parse amounts with comma decimal separator (EXTRACT-03)
3. Detect and extract foreign currency codes (EXTRACT-04)
4. Extract transaction rows from table section text

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

- [x] PDF text extraction works
- [x] Transaction table identification works
- [x] Card number extraction works

### Phase 4 Entry (Prerequisites)

- [x] Date parsing works
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
