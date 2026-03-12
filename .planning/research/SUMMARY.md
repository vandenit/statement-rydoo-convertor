# Research Summary: Statement Convertor

**Research skipped** — User is familiar with domain (PDF parsing, Excel generation) and provided clear requirements.

## Quick Notes

**PDF Parsing Options:**
- pdf-parse (npm): Most popular, extracts text
- pdf2json: Structured output, good for tables
- pdfjs-dist: Mozilla's PDF.js, robust but complex

**Excel Generation:**
- xlsx (SheetJS): Industry standard, mature
- exceljs: Good for styling, but heavier

**TypeScript CLI Tools:**
- commander: CLI argument parsing
- chalk: Colored output
- ora: Loading spinners

**Architecture Pattern:**
- Strategy pattern for bank parsers (extensible)
- Each parser implements: canParse(pdf), parse(pdf) → transactions[]

## Recommendations

1. **pdf-parse** for text extraction (simple, works well with BNP layout)
2. **xlsx** for Excel generation (standard, lightweight)
3. **commander** for CLI (most popular, well-documented)
4. Strategy pattern for extensibility
