# Requirements: Statement Convertor

**Defined:** 2025-03-12
**Core Value:** Users can convert credit card statements to Rydoo format without manual data entry — upload PDFs, get Excel ready for import.

## v1 Requirements

### PDF Parsing

- [ ] **PARSE-01**: Parse BNP Paribas Fortis PDF credit card statements
- [ ] **PARSE-02**: Extract transaction table with date, description, amount columns
- [ ] **PARSE-03**: Handle multi-page PDFs
- [ ] **PARSE-04**: Extract card number from PDF header (not filename)

### Data Extraction

- [ ] **EXTRACT-01**: Extract transaction date (Date de transaction)
- [ ] **EXTRACT-02**: Extract merchant name (Description)
- [ ] **EXTRACT-03**: Extract amount in EUR
- [ ] **EXTRACT-04**: Extract original currency for foreign transactions
- [ ] **EXTRACT-05**: Format dates as M/D/YYYY

### Excel Generation

- [ ] **EXCEL-01**: Generate Rydoo-compatible .xlsx format
- [ ] **EXCEL-02**: Map to columns: TransactionDate, Amount, Merchant, CurrencyCode, CardNumber, AccountCurrency, AccountAmount
- [ ] **EXCEL-03**: Use card number from PDF (last 4 digits)
- [ ] **EXCEL-04**: Set AccountCurrency to EUR
- [ ] **EXCEL-05**: AccountAmount equals Amount for EUR transactions

### CLI Interface

- [ ] **CLI-01**: Read PDFs from input/ folder automatically
- [ ] **CLI-02**: Move processed PDFs to processed/ folder
- [ ] **CLI-03**: Write Excel output to output/ folder
- [ ] **CLI-04**: Support --bank flag (default: bnp)
- [ ] **CLI-05**: Show progress and summary after processing

### Architecture

- [ ] **ARCH-01**: TypeScript implementation
- [ ] **ARCH-02**: Installable via npm
- [ ] **ARCH-03**: Extensible parser interface (strategy pattern) for future banks

## v2 Requirements

### Additional Banks

- **BANK-01**: Support for other Belgian banks (KBC, ING)
- **BANK-02**: Automatic bank detection from PDF content

### Enhanced Features

- **ENH-01**: GUI/web interface option
- **ENH-02**: Direct Rydoo API upload
- **ENH-03**: Manual transaction editing before export

## Out of Scope

| Feature | Reason |
|---------|--------|
| GUI/web interface | CLI-only for v1, planned for v2 |
| Direct Rydoo API upload | Excel export sufficient, API adds complexity |
| Automatic bank detection | User specifies --bank, planned for v2 |
| Manual transaction editing | Process all transactions as-is |
| Support for non-Belgian banks | Focus on BNP first, expand later |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PARSE-01 | Phase 2 | Pending |
| PARSE-02 | Phase 2 | Pending |
| PARSE-03 | Phase 2 | Pending |
| PARSE-04 | Phase 2 | Pending |
| EXTRACT-01 | Phase 3 | Pending |
| EXTRACT-02 | Phase 3 | Pending |
| EXTRACT-03 | Phase 3 | Pending |
| EXTRACT-04 | Phase 3 | Pending |
| EXTRACT-05 | Phase 3 | Pending |
| EXCEL-01 | Phase 4 | Pending |
| EXCEL-02 | Phase 4 | Pending |
| EXCEL-03 | Phase 4 | Pending |
| EXCEL-04 | Phase 4 | Pending |
| EXCEL-05 | Phase 4 | Pending |
| CLI-01 | Phase 5 | Pending |
| CLI-02 | Phase 5 | Pending |
| CLI-03 | Phase 5 | Pending |
| CLI-04 | Phase 5 | Pending |
| CLI-05 | Phase 5 | Pending |
| ARCH-01 | Phase 1 | Pending |
| ARCH-02 | Phase 1 | Pending |
| ARCH-03 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 21 total
- Mapped to phases: 21
- Unmapped: 0 ✓

### Phase Summary

| Phase | Requirements | Description |
|-------|--------------|-------------|
| Phase 1 | ARCH-01, ARCH-02 | Project Setup — TypeScript toolchain and npm package |
| Phase 2 | PARSE-01 to PARSE-04 | PDF Parsing Infrastructure — text extraction and table parsing |
| Phase 3 | EXTRACT-01 to EXTRACT-05 | Data Extraction — structured transaction objects |
| Phase 4 | EXCEL-01 to EXCEL-05 | Excel Generation — Rydoo-compatible .xlsx output |
| Phase 5 | CLI-01 to CLI-05, ARCH-03 | CLI Interface and Integration — folder workflow and strategy pattern |

---
*Requirements defined: 2025-03-12*
*Last updated: 2025-03-12 after CLI interface adjustment*
