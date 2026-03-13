# Statement Convertor Roadmap

**Created:** 2025-03-12  
**Depth:** Quick  
**Phases:** 6  
**Requirements:** 22 v1 requirements

## Overview

This roadmap delivers a TypeScript CLI tool that converts BNP Paribas Fortis credit card PDF statements to Rydoo-compatible Excel format. The phases progress from foundation setup through specialized PDF handling, data extraction, Excel generation, and finally CLI integration with an extensible architecture.

## Phase 1: Project Setup

**Goal:** Developer can build and run the TypeScript CLI from source

**Dependencies:** None

**Plans:** 2 plans

**Plan List:**

- [x] 01-01-PLAN.md — Initialize npm project, configure TypeScript, create folder structure
- [x] 01-02-PLAN.md — Install dependencies, create CLI entry point, configure build scripts and tooling

**Requirements:**

- ARCH-01: TypeScript implementation
- ARCH-02: Installable via npm

**Success Criteria:**

1. Developer can clone repository and run `npm install` successfully
2. Developer can run `npm run build` to compile TypeScript without errors
3. Developer can run `npm run dev` to execute CLI in development mode
4. Project structure includes src/, dist/, and proper tsconfig.json

**Context:** Foundation phase establishing TypeScript toolchain and project structure.

---

## Phase 2: PDF Parsing Infrastructure

**Goal:** System can extract raw text and structure from BNP PDFs

**Dependencies:** Phase 1 (Project Setup)

**Plans:** 2 plans in 2 waves

**Plan List:**

- [x] 02-01-PLAN.md — Install pdf-parse, create PDF parser infrastructure and types
- [x] 02-02-PLAN.md — Implement BNP parser with card number extraction and transaction table identification

**Requirements:**

- PARSE-01: Parse BNP Paribas Fortis PDF credit card statements
- PARSE-02: Extract transaction table with date, description, amount columns
- PARSE-03: Handle multi-page PDFs
- PARSE-04: Extract card number from PDF header (not filename)

**Success Criteria:**

1. System can parse single-page BNP PDF and extract raw text content
2. System can identify transaction table boundaries in parsed text
3. System handles multi-page PDFs without losing transaction data
4. System extracts complete card number from PDF header ("Numéro de carte XXXX")
5. Parser returns structured intermediate format with raw text sections

**Context:** Core infrastructure for PDF-to-text conversion. Uses pdf-parse library.

---

## Phase 3: Data Extraction

**Goal:** System can extract structured transaction data from parsed PDF content

**Dependencies:** Phase 2 (PDF Parsing Infrastructure)

**Plans:** 2 plans in 1 wave (parallel)

**Plan List:**

- [x] 03-01-PLAN.md — Create Transaction type and French date parser utility
- [x] 03-02-PLAN.md — Implement amount parser and transaction row extraction

**Requirements:**

- EXTRACT-01: Extract transaction date (Date de transaction)
- EXTRACT-02: Extract merchant name (Description)
- EXTRACT-03: Extract amount in EUR
- EXTRACT-04: Extract original currency for foreign transactions
- EXTRACT-05: Format dates as M/D/YYYY

**Success Criteria:**

1. System extracts "Date de transaction" field and converts to M/D/YYYY format
2. System extracts "Description" field as merchant name
3. System extracts EUR amount, handling comma as decimal separator
4. System detects foreign currency transactions and extracts original currency code
5. System returns array of structured transaction objects with all required fields

**Context:** Data transformation layer converting raw text to typed transaction objects.

---

## Phase 4: Excel Generation

**Goal:** System can generate Rydoo-compatible Excel files from transaction data

**Dependencies:** Phase 3 (Data Extraction)

**Requirements:**

- EXCEL-01: Generate Rydoo-compatible .xlsx format
- EXCEL-02: Map to columns: TransactionDate, Amount, Merchant, CurrencyCode, CardNumber, AccountCurrency, AccountAmount
- EXCEL-03: Use card number from PDF (last 4 digits)
- EXCEL-04: Set AccountCurrency to EUR
- EXCEL-05: AccountAmount equals Amount for EUR transactions

**Plans:** 2 plans in 2 waves

**Plan List:**

- [x] 04-01-PLAN.md — Install xlsx, create ExcelGenerator class
- [x] 04-02-PLAN.md — Add tests for Excel generation and Rydoo compatibility

**Success Criteria:**

1. System generates .xlsx file that Rydoo can import without errors
2. Excel contains all 7 required columns in correct order (A-G)
3. CardNumber column shows last 4 digits extracted from PDF header
4. AccountCurrency column contains "EUR" for all transactions
5. AccountAmount equals Amount for EUR transactions; foreign transactions preserve original

**Context:** Output generation using SheetJS (xlsx library) with Rydoo-compatible formatting.

---

## Phase 5: CLI Interface and Integration

**Goal:** Users can run CLI to convert PDFs to Excel via folder-based workflow

**Dependencies:** Phase 4 (Excel Generation)

**Requirements:**

- CLI-01: Read PDFs from input/ folder automatically
- CLI-02: Move processed PDFs to processed/ folder
- CLI-03: Write Excel output to output/ folder
- CLI-04: Support --bank flag (default: bnp)
- CLI-05: Show progress and summary after processing
- ARCH-03: Extensible parser interface (strategy pattern) for future banks

**Success Criteria:**

1. User can run `statement-convertor` and it processes all PDFs in input/ folder
2. After processing, PDFs are moved from input/ to processed/ folder
3. Generated Excel files appear in output/ folder with timestamped filenames
4. User can run with `--bank bnp` (explicit) or omit (uses default)
5. CLI shows progress bar/spinner during processing and summary (files processed, transactions extracted, output path)
6. Parser architecture uses strategy pattern allowing new bank parsers to be added

**Context:** Final integration phase connecting all components into user-facing CLI with extensible architecture.

---

## Phase 6: Windows Distribution

**Goal:** Provide a single portable .exe for Windows users without Node.js requirements

**Dependencies:** Phase 5 (CLI Interface and Integration)

**Requirements:**

- DIST-01: Portable Windows executable (.exe) containing Node.js runtime

**Success Criteria:**

1. A standalone `statement-convertor.exe` is generated for Windows
2. The executable runs on Windows without requiring Node.js to be installed globally
3. The executable includes all necessary assets and dependencies

**Context:** Packaging phase to ensure ease of use for non-technical users.

---

## Progress

| Phase                             | Status         | Started    | Completed  |
| --------------------------------- | -------------- | ---------- | ---------- |
| 1 - Project Setup                 | 🟢 Completed   | 2025-03-12 | 2025-03-12 |
| 2 - PDF Parsing Infrastructure    | 🟢 Completed   | 2025-03-12 | 2025-03-12 |
| 3 - Data Extraction               | 🟢 Completed   | 2026-03-12 | 2026-03-12 |
| 5 - CLI Interface and Integration | 🟢 Completed   | 2026-03-13 | 2026-03-13 |
| 6 - Windows Distribution          | 🟢 Completed   | 2026-03-13 | 2026-03-13 |
| 7 - Bugfixes (Amount & Date)      | 🟢 Completed   | 2026-03-13 | 2026-03-13 |
| 8 - Final Polish & Multi-file     | 🟢 Completed   | 2026-03-13 | 2026-03-13 |
| 9 - macOS Distribution            | 🟢 Completed   | 2026-03-13 | 2026-03-13 |
| 10 - CI/CD & GitHub Releases       | 🟢 Completed   | 2026-03-13 | 2026-03-13 |

**Legend:**

- 🔵 Not Started
- 🟡 In Progress
- 🟢 Completed
- ⏸️ Paused

---

## Requirement Coverage

| Requirement | Phase | Description                                                                                                 |
| ----------- | ----- | ----------------------------------------------------------------------------------------------------------- |
| PARSE-01    | 2     | Parse BNP Paribas Fortis PDF credit card statements                                                         |
| PARSE-02    | 2     | Extract transaction table with date, description, amount columns                                            |
| PARSE-03    | 2     | Handle multi-page PDFs                                                                                      |
| PARSE-04    | 2     | Extract card number from PDF header (not filename)                                                          |
| EXTRACT-01  | 3     | Extract transaction date (Date de transaction)                                                              |
| EXTRACT-02  | 3     | Extract merchant name (Description)                                                                         |
| EXTRACT-03  | 3     | Extract amount in EUR                                                                                       |
| EXTRACT-04  | 3     | Extract original currency for foreign transactions                                                          |
| EXTRACT-05  | 3     | Format dates as M/D/YYYY                                                                                    |
| EXCEL-01    | 4     | Generate Rydoo-compatible .xlsx format                                                                      |
| EXCEL-02    | 4     | Map to columns: TransactionDate, Amount, Merchant, CurrencyCode, CardNumber, AccountCurrency, AccountAmount |
| EXCEL-03    | 4     | Use card number from PDF (last 4 digits)                                                                    |
| EXCEL-04    | 4     | Set AccountCurrency to EUR                                                                                  |
| EXCEL-05    | 4     | AccountAmount equals Amount for EUR transactions                                                            |
| CLI-01      | 5     | Read PDFs from input/ folder automatically                                                                  |
| CLI-02      | 5     | Move processed PDFs to processed/ folder                                                                    |
| CLI-03      | 5     | Write Excel output to output/ folder                                                                        |
| CLI-04      | 5     | Support --bank flag (default: bnp)                                                                          |
| CLI-05      | 5     | Show progress and summary after processing                                                                  |
| ARCH-01     | 1     | TypeScript implementation                                                                                   |
| ARCH-02     | 1     | Installable via npm                                                                                         |
| ARCH-03     | 5     | Extensible parser interface (strategy pattern) for future banks                                             |
| DIST-01     | 6     | Portable Windows executable (.exe) containing Node.js runtime                                               |

**Coverage Summary:**

- Total v1 requirements: 21
- Mapped to phases: 21
- Orphaned: 0 ✓
- Duplicates: 0 ✓

---

## Dependencies Between Phases

```
Phase 1 (Setup)
    ↓
Phase 2 (PDF Parsing)
    ↓
Phase 3 (Data Extraction)
    ↓
Phase 4 (Excel Generation)
    ↓
Phase 5 (CLI + Integration)
    ↓
Phase 6 (Windows Distribution)
    ↓
Phase 7 (Bugfixes)
    ↓
Phase 8 (Final Polish)
    ↓
Phase 9 (macOS Distribution)
    ↓
Phase 10 (CI/CD & Releases)
```

Linear dependency chain — each phase builds on the previous.

---

## Risk Notes

**Phase 2 Risk:** PDF text extraction quality depends on BNP PDF generation. If tables are images instead of text, may need OCR fallback (out of scope for v1).

**Phase 3 Risk:** Date parsing must handle French month names ("janvier", "février", etc.) in BNP PDFs.

**Phase 4 Risk:** Rydoo Excel format requirements may need validation against actual Rydoo import (user should test early).

---

_Last updated: 2025-03-12_
