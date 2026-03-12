# Statement Convertor

## What This Is

A TypeScript CLI tool that converts credit card statement PDFs (starting with BNP Paribas Fortis) into Rydoo-compatible Excel format for expense reporting. Designed with an open/closed principle to easily add support for other banks.

## Core Value

Users can convert credit card statements to Rydoo format without manual data entry — upload PDFs, get Excel ready for import.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Parse BNP Paribas Fortis PDF credit card statements
- [ ] Extract transaction data: date, merchant, amount, currency
- [ ] Extract card number from PDF header (not filename)
- [ ] Generate Rydoo-compatible Excel (.xlsx) with correct column mapping
- [ ] Folder-based workflow: read PDFs from input/ folder
- [ ] Move processed PDFs to processed/ folder
- [ ] Write Excel output to output/ folder
- [ ] Date format: M/D/YYYY exactly as Rydoo expects
- [ ] Handle foreign currency transactions (original + EUR amounts)
- [ ] CLI with --bank flag (default: bnp) for extensibility
- [ ] TypeScript with Node.js, installable via npm

### Out of Scope

- GUI/web interface — CLI only for v1
- Direct Rydoo API upload — Excel export only
- Automatic bank detection — user specifies or uses default
- Editing/validation UI — process all transactions as-is
- Support for banks other than BNP — planned for v2

## Context

**BNP PDF Structure:**
- Header contains card number: "Numéro de carte 5480 28XX XXXX 8204"
- Transaction table columns: Date de transaction | Date de règlement | Description | Montant
- Amounts show original currency for foreign transactions (e.g., "-19,00 USD" with exchange rate)
- Most transactions are EUR

**Rydoo Excel Template Columns:**
- A: TransactionDate (M/D/YYYY)
- B: Amount (negative for expenses)
- C: Merchant
- D: CurrencyCode
- E: CardNumber (last 4 digits from PDF)
- F: AccountCurrency (EUR)
- G: AccountAmount (same as B for EUR transactions)

**Mapping (BNP → Rydoo):**
- Date de transaction → TransactionDate
- Description → Merchant
- Montant (EUR) → Amount
- Original currency (if different) → CurrencyCode
- Card number from PDF header → CardNumber
- AccountCurrency always EUR
- AccountAmount = Amount

## Constraints

- **Platform**: macOS primarily (user's environment)
- **Runtime**: Node.js (installable via npm)
- **Language**: TypeScript
- **Output format**: Excel .xlsx (Rydoo compatible)
- **Date format**: Must be M/D/YYYY exactly
- **Card number source**: Must come from PDF content, not filename

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Card number from PDF | Security — filename might be wrong/masked | — Pending |
| --bank flag with default | Extensibility without breaking existing usage | — Pending |
| Folder workflow (input/processed/output) | Clean separation, prevents reprocessing | — Pending |
| TypeScript + Node CLI | User's preferred stack, easy distribution | — Pending |
| Excel output only (no API) | Simpler v1, Rydoo has Excel import | — Pending |

---
*Last updated: 2025-03-12 after initialization*
