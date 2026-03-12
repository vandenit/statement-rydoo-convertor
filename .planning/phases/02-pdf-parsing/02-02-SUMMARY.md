---
phase: 02-pdf-parsing
plan: 02
subsystem: parser
tags:
  - typescript
  - strategy-pattern
  - bnp
  - pdf-parsing

# Dependency graph
requires:
  - phase: 02-01
    provides: PDF parser infrastructure and PdfContent types
provides:
  - Transaction type definitions (RawTransaction, ParserResult)
  - BaseParser abstract class with Strategy pattern
  - BnpParser implementation for BNP Paribas Fortis
  - Card number extraction from PDF header
  - Transaction table boundary identification
  - Parser module exports via index.ts
affects:
  - Phase 3 (Data Extraction) - will use RawTransaction types
  - Phase 5 (CLI) - will use BnpParser for bank detection

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Strategy pattern for bank parsers (ARCH-03)
    - Template method pattern in BaseParser
    - Abstract base class with protected utility methods
    - Multiple regex pattern matching for robust extraction

key-files:
  created:
    - src/types/transaction.ts
    - src/parsers/base-parser.ts
    - src/parsers/bnp-parser.ts
  modified:
    - src/parsers/index.ts

key-decisions:
  - 'Used abstract class BaseParser instead of interface for shared utility methods'
  - 'Card extraction uses multiple regex patterns for robustness (primary + alternates + fallback)'
  - "Transaction table identified by header 'Date de transaction' and footer markers"
  - 'Phase 2 returns empty rawTransactions array - Phase 3 will implement row parsing'
  - 'Exported singleton bnpParser instance for convenience'

patterns-established:
  - 'Strategy pattern: Each bank parser extends BaseParser and implements canParse/parse'
  - 'Template method: BaseParser defines extraction flow, subclasses implement specifics'
  - 'Protected utilities: BaseParser provides helper methods for common operations'
  - 'Multiple pattern matching: Primary → Alternates → Fallback for robust extraction'

# Metrics
duration: 15min
completed: 2026-03-12
---

# Phase 2 Plan 2: BNP Parser Implementation Summary

**BNP-specific parser with card number extraction and transaction table identification using Strategy pattern architecture**

## Performance

- **Duration:** 15 min
- **Started:** 2026-03-12T12:15:00Z (estimated)
- **Completed:** 2026-03-12T12:30:00Z (estimated)
- **Tasks:** 4
- **Files modified:** 3 created, 1 modified

## Accomplishments

- Created transaction type definitions (RawTransaction, ParserResult, BankParser interface)
- Implemented BaseParser abstract class with Strategy pattern (ARCH-03)
- Built BnpParser with card number extraction and table boundary detection
- Updated parser index with clean exports for all parser types
- All code compiles with `npm run build`

## Task Commits

Each task was committed atomically:

1. **Task 1: Create transaction types** - `a8afa75` (feat)
2. **Task 2: Create base parser interface** - `5fd667d` (feat)
3. **Task 3: Implement BNP parser** - `3185d9c` (feat)
4. **Task 4: Update parser index exports** - `a4c684d` (feat)

**Plan metadata:** `[pending - to be added after final commit]` (docs: complete plan)

## Files Created/Modified

- `src/types/transaction.ts` - RawTransaction, ParserResult, BankParser types
- `src/parsers/base-parser.ts` - BaseParser abstract class with template methods
- `src/parsers/bnp-parser.ts` - BnpParser with BNP-specific extraction logic
- `src/parsers/index.ts` - Updated exports for BnpParser, BaseParser, transaction types

## Decisions Made

1. **Abstract class over interface**: Used `abstract class BaseParser` instead of just an interface because we needed shared utility methods (findFirstMatch, extractBetweenMarkers, extractLastFour) that all bank parsers would use.

2. **Multiple regex patterns for card extraction**: Implemented primary pattern + alternative patterns + fallback pattern to handle variations in BNP PDF formatting. This provides robustness against slight format differences.

3. **Empty transactions array in Phase 2**: BnpParser.parse() returns empty rawTransactions array. The transaction table text is passed via rawText for Phase 3 to implement row-by-row parsing. This separates concerns: Phase 2 identifies sections, Phase 3 parses content.

4. **Singleton export pattern**: Exported `bnpParser` singleton instance alongside `BnpParser` class for convenience. Most use cases will use the singleton.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed smoothly.

## BNP Parser Implementation Details

### Card Number Extraction

The parser looks for:

- Pattern: `Numéro de carte 5480 28XX XXXX 8204`
- Extracts: last 4 digits (8204)
- Multiple patterns supported for robustness

### Transaction Table Boundaries

- **Header marker**: `Date de transaction`
- **Footer markers**: `SOLDE ACTUEL`, `TOTAL DES DEPENSES`, `Total des dépenses`, `Votre résultat`, `Résultat du compte`
- Returns table section text for Phase 3 processing

### Strategy Pattern Usage

```typescript
// Usage example:
const parser = new BnpParser();
if (parser.canParse(pdfContent)) {
  const result = await parser.parse(pdfContent);
  console.log(result.cardNumber); // "8204"
  console.log(result.rawText); // Transaction table section
}
```

## Next Phase Readiness

**Ready for Phase 3 (Data Extraction)**

Requirements met:

- ✓ ParserResult interface defined with cardNumber, rawTransactions, rawText
- ✓ BnpParser identifies transaction table boundaries
- ✓ BnpParser extracts card number (last 4 digits)
- ✓ Strategy pattern interface established (ARCH-03)

Phase 3 can now:

1. Import RawTransaction and ParserResult types
2. Implement row-by-row transaction parsing from rawText
3. Convert raw dates ("12 mars 2024") to M/D/YYYY format
4. Parse amounts with comma decimal separator
5. Detect and extract foreign currency codes

**No blockers or concerns.**

---

_Phase: 02-pdf-parsing_
_Completed: 2026-03-12_
