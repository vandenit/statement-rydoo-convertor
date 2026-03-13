---
phase: 07-bugfixes
plan: 01
subsystem: extraction
tags: [bugfix, parsing, dates, amounts]

# Dependency graph
requires:
  - phase: 05-cli-integration
provides:
  - Corrected parsing for foreign transactions
  - Locale-independent date handling

# Tech tracking
tech-stack:
  modified: [src/parsers/bnp-parser.ts, src/generators/excel-generator.ts]

key-decisions:
  - 'Implemented multi-line lookahead in BnpParser to find EUR equivalent of foreign transactions'
  - 'Switched Excel generation to native Date objects with cellDates: true to avoid locale interpretation bugs'

# Metrics
duration: 15min
completed: 2026-03-13
---

# Phase 7: Bugfixes Summary

**Fixed critical parsing issues in foreign transactions and date formatting**

## Accomplishments

- **Multi-line Amount Fix**: Corrected `BnpParser` to look ahead for the EUR amount (e.g. at the bottom of a 3-line transaction) rather than picking the foreign amount on the first line.
- **Locale-Aware Date Fix**: Switched to native Excel Date objects. Instead of writing `2/4/2026` as a string (which Belgian users see as April 2nd), we now write the Date object, so Excel displays it correctly according to the user's settings.

---

_Phase: 07-bugfixes_
_Completed: 2026-03-13_
