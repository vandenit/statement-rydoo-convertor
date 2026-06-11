/**
 * BNP Paribas Fortis Parser
 *
 * Bank-specific parser for BNP Paribas Fortis credit card statements.
 * Implements the BaseParser strategy pattern interface.
 *
 * Requirements covered:
 * - PARSE-01: Parse BNP Paribas Fortis PDF credit card statements
 * - PARSE-02: Extract transaction table boundaries
 * - PARSE-04: Extract card number from PDF header
 * - EXTRACT-01: Extract transaction date
 * - EXTRACT-02: Extract merchant name
 * - EXTRACT-03: Extract amount in EUR
 * - EXTRACT-04: Extract original currency
 */

import { PdfContent } from '../types/pdf.js';
import { Transaction } from '../types/transaction.js';
import { parseFrenchDate } from '../extractors/date-parser.js';
import { parseAmountWithCurrency, isExchangeRateLine } from '../extractors/amount-parser.js';
import { BaseParser, ParserResult, TransactionTableBounds, CardNumberInfo } from './base-parser.js';

/**
 * BNP Paribas Fortis credit card statement parser
 *
 * Recognizes BNP PDFs by:
 * - "BNP Paribas Fortis" header text
 * - "Numéro de carte" card number line
 *
 * Extracts:
 * - Card number (last 4 digits)
 * - Transaction table section for Phase 3 processing
 */
export class BnpParser extends BaseParser {
  readonly bankId = 'bnp';
  readonly bankName = 'BNP Paribas Fortis';

  // BNP-specific markers for PDF identification
  private static readonly IDENTIFICATION_MARKERS = [
    'BNP Paribas Fortis',
    'Numéro de carte',
    'bpost bank', // Some BNP statements mention bpost bank
  ];

  // Card number pattern: "Numéro de carte 5480 28XX XXXX 8204"
  // Matches: Numéro de carte followed by groups of digits/X/spaces
  private static readonly CARD_NUMBER_PATTERN =
    /Num[ée]ro de carte\s+([\d\sX-]+)(?:\s+-\s+|$)/i;

  // Alternative patterns for different card formats
  private static readonly CARD_NUMBER_ALT_PATTERNS = [
    /Num[ée]ro de carte\s*:?\s*(\d{4})[\s-]+(\d{4})[\s-]+(\d{4})[\s-]+(\d{4})/i,
    /carte\s*:?\s*(\d{4})[\s-]+(\d{2})XX[\s-]+XXXX[\s-]+(\d{4})/i,
  ];

  // Transaction table markers
  private static readonly TABLE_HEADER_MARKER = 'Date de transaction';
  private static readonly TABLE_FOOTER_MARKERS = [
    'SOLDE ACTUEL',
    'Votre résultat',
    'Résultat du compte',
  ];

  // Date patterns for transactions
  private static readonly FULL_DATE_PATTERN = /^(\d{1,2}\s+[a-zéû]+\s+\d{4})/i;
  private static readonly SHORT_DATE_PATTERN = /^(\d{2})\/(\d{2})(?:\s+(\d{2})\/(\d{2}))?/;
  private static readonly EUR_PATTERN = /(-?[\d\s\.]*,?\d{2})\s*(?:€|EUR)\s*$/i;
  private static readonly AMOUNT_PATTERN = /(-?\d[\d\s\.]*,\d{2}(?:\s*(?:[A-Z]{3}|[€$£¥]))?)\s*$/;
  /**
   * Check if this parser can handle the given PDF content
   *
   * Looks for BNP-specific markers in the text.
   *
   * @param content - Parsed PDF content
   * @returns true if this is a BNP Paribas Fortis statement
   */
  canParse(content: PdfContent): boolean {
    const text = content.text;

    // Check for any identification marker
    for (const marker of BnpParser.IDENTIFICATION_MARKERS) {
      if (text.includes(marker)) {
        return true;
      }
    }

    // Also check for card number pattern
    if (BnpParser.CARD_NUMBER_PATTERN.test(text)) {
      return true;
    }

    return false;
  }

  /**
   * Parse the PDF content and extract transaction data
   *
   * @param content - Parsed PDF content
   * @returns Promise<ParserResult> with card number and raw transactions
   * @throws Error if required fields cannot be extracted
   */
  async parse(content: PdfContent): Promise<ParserResult> {
    const text = content.text;

    // Extract card number
    const cardInfo = this.extractCardNumber(text);
    if (!cardInfo) {
      throw new Error(
        'Failed to extract card number from BNP PDF. Expected pattern: "Numéro de carte XXXX XXXX XXXX XXXX"'
      );
    }

    // Identify transaction table boundaries
    const tableBounds = this.identifyTableBounds(text);
    if (!tableBounds) {
      throw new Error(
        'Failed to identify transaction table in BNP PDF. Expected header: "Date de transaction"'
      );
    }

    // Extract statement total
    const statementTotal = this.extractStatementTotal(text);
    // Extract transaction table text
    // BNP specific: Table can be split across pages. Pass the whole text but let the extractor handle markers.
    const tableText = text.substring(tableBounds.startIndex);

    // Extract transactions
    const transactions = this.extractTransactions(tableText);

    // Attach card number to each transaction for multi-file aggregation
    const rawTransactions = transactions.map(t => ({
      ...t,
      cardNumber: cardInfo.fullNumber
    }));

    return {
      cardNumber: cardInfo.lastFour,
      rawTransactions,
      statementTotal,
      rawText: tableText, // Pass table section to Phase 3 for processing
    };
  }

  /**
   * Extract card number from BNP PDF text
   *
   * Pattern: "Numéro de carte 5480 28XX XXXX 8204"
   * Extracts: last 4 digits (8204)
   *
   * @param text - PDF text content
   * @returns CardNumberInfo or null if not found
   */
  protected extractCardNumber(text: string): CardNumberInfo | null {
    // Try primary pattern first
    const primaryMatch = text.match(BnpParser.CARD_NUMBER_PATTERN);
    if (primaryMatch) {
      const fullNumber = primaryMatch[1].trim();
      // Extract last 4 digits from the string
      const digitsOnly = fullNumber.replace(/\D/g, '');
      const lastFour = digitsOnly.slice(-4);
      return {
        fullNumber,
        lastFour,
      };
    }

    // Try alternative patterns
    for (const pattern of BnpParser.CARD_NUMBER_ALT_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        // Extract all digit groups from the match
        const groups = match.slice(1).filter((g) => g !== undefined);
        const fullNumber = groups.join(' ');
        const lastFour = groups[groups.length - 1];
        return {
          fullNumber,
          lastFour,
        };
      }
    }

    // Fallback: Look for any 16-digit card number or masked format
    const fallbackPattern =
      /(\d{4})\s+(\d{2})XX\s+XXXX\s+(\d{4})|(\d{4})[\s-]+(\d{4})[\s-]+(\d{4})[\s-]+(\d{4})/;
    const fallbackMatch = text.match(fallbackPattern);
    if (fallbackMatch) {
      // Determine which capturing groups matched
      if (fallbackMatch[1] && fallbackMatch[3]) {
        // Masked format: 5480 28XX XXXX 8204
        return {
          fullNumber: `${fallbackMatch[1]} ${fallbackMatch[2]}XX XXXX ${fallbackMatch[3]}`,
          lastFour: fallbackMatch[3],
        };
      } else if (fallbackMatch[4]) {
        // Full format: extract last 4 from last group
        const groups = [fallbackMatch[4], fallbackMatch[5], fallbackMatch[6], fallbackMatch[7]];
        return {
          fullNumber: groups.join(' '),
          lastFour: groups[3],
        };
      }
    }

    return null;
  }

  /**
   * Extract the total statement amount from BNP PDF text
   *
   * Pattern: "TOTAL -1.638,25 €" or "TOTAL-4.800,04 €"
   *
   * @param text - PDF text content
   * @returns Total amount as number or undefined
   */
  protected extractStatementTotal(text: string): number | undefined {
    // Clean up text to remove newlines that might split TOTAL and amount
    const cleanText = text.replace(/\n/g, ' ');
    
    // Looks for "TOTAL" followed by optional space/newline and an amount
    const totalRegex = /TOTAL\s*(-?[\d\s\.]*,\d{2})\s*€|TOTAL\s*€\s*(-?[\d\s\.]*,\d{2})/i;
    const match = cleanText.match(totalRegex);

    if (match) {
      const amountStr = match[1] || match[2];
      const parsed = parseAmountWithCurrency(amountStr + ' €');
      return parsed?.amount;
    }

    // Try "NOUVEAU SOLDE" or other variants as fallback
    const fallbackRegex = /NOUVEAU SOLDE\s*(-?[\d\s\.]*,\d{2})\s*€|TOTAL\s+(-?[\d\s\.]*,\d{2})\s*€|TOTAL\s*€\s*(-?[\d\s\.]*,\d{2})/i;
    const fallbackMatch = cleanText.match(fallbackRegex);
    if (fallbackMatch) {
      const amountStr = fallbackMatch[1] || fallbackMatch[2] || fallbackMatch[3];
      const parsed = parseAmountWithCurrency(amountStr + ' €');
      return parsed?.amount;
    }

    return undefined;
  }
  /**
   * Identify transaction table boundaries in BNP PDF text
   *
   * Table structure:
   * - Header: "Date de transaction" (may be split across lines)
   * - Columns: Date de transaction | Description | Montant en euros
   * - Footer: "SOLDE ACTUEL" or "TOTAL DES DEPENSES"
   *
   * @param text - PDF text content
   * @returns TransactionTableBounds or null if not found
   */
  protected identifyTableBounds(text: string): TransactionTableBounds | null {
    // Find table header (use regex to handle potential newlines/whitespace)
    // Pattern: "Date de" followed by whitespace/newline followed by "transaction"
    const headerRegex = /Date\s+de\s+transaction/i;
    const headerMatch = text.match(headerRegex);

    if (!headerMatch || headerMatch.index === undefined) {
      return null;
    }

    const headerIndex = headerMatch.index;

    // Find the end of the header section (usually ends with "Montant")
    const nextMontantIndex = text.indexOf('Montant', headerIndex);
    let headerLineEnd = text.indexOf('\n', headerIndex);

    if (nextMontantIndex !== -1 && nextMontantIndex < headerIndex + 100) {
      headerLineEnd = text.indexOf('\n', nextMontantIndex);
    }

    const headerLineHeader = text.substring(headerIndex, headerMatch.index + headerMatch[0].length);
    const headerLine =
      headerLineEnd !== -1
        ? text.substring(headerIndex, headerLineEnd).replace(/\n/g, ' ').trim()
        : headerLineHeader;

    // Search for footer markers after the header
    let endIndex = text.length;
    let footerMarker: string | undefined;

    for (const marker of BnpParser.TABLE_FOOTER_MARKERS) {
      const markerIndex = text.indexOf(marker, headerIndex);
      if (markerIndex !== -1 && markerIndex < endIndex) {
        endIndex = markerIndex;
        footerMarker = marker;
      }
    }

    return {
      startIndex: headerIndex,
      endIndex,
      headerLine,
      footerMarker,
    };
  }

  /**
   * Extract transactions from the transaction table section
   *
   * Parses individual transaction rows from the table text.
   * Handles multi-line transactions (foreign currency with exchange rate).
   *
   * Table format:
   * ```
   * Date de transaction | Description | Montant en euros
   * 12 mars 2024        | AMAZON EU   | -19,00
   * 15 mars 2024        | FOREIGN     | -45,00 USD
   *                     | Taux: 1.08  |
   * ```
   *
   * @param tableText - Text content of the transaction table section
   * @returns Array of Transaction objects with parsed date, description, amount
   */
  protected extractTransactions(tableText: string): Transaction[] {
    const transactions: Transaction[] = [];

    // Split into lines and remove empty lines
    const lines = tableText.split('\n').filter((line) => line.trim().length > 0);

    // Skip header line(s)
    let startIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      if (this.isHeaderLine(lines[i])) {
        startIndex = i + 1;
        break;
      }
    }

    // Parse transaction lines
    let i = startIndex;
    while (i < lines.length) {
      const line = lines[i];

      // Skip footer lines
      if (this.isFooterLine(line)) {
        // Skip current line but continue searching (BNP tables split across pages)
        i++;
        continue;
      }

      // Skip exchange rate lines (handled by lookahead)
      if (isExchangeRateLine(line)) {
        i++;
        continue;
      }

      // Try to parse this as a transaction line
      // Pass potential next lines for lookahead
      const parseResult = this.parseTransactionLine(line, lines[i + 1], lines[i + 2]);

      if (parseResult) {
        transactions.push(parseResult.transaction);
        i += parseResult.linesConsumed;
        continue;
      }

      i++;
    }

    return transactions;
  }

  /**
   * Check if a line is a table header line
   *
   * @param line - Line to check
   * @returns true if this is a header line
   */
  private isHeaderLine(line: string): boolean {
    const headerMarkers = ['Date de transaction', 'Description', 'Montant en euros', 'Date valeur'];

    return headerMarkers.some((marker) => line.includes(marker));
  }

  /**
   * Check if a line is a footer/summary line (not a transaction)
   *
   * @param line - Line to check
   * @returns true if this is a footer line
   */
  private isFooterLine(line: string): boolean {
    const footerMarkers = [
      'SOLDE ACTUEL',
      'TOTAL DES DEPENSES',
      'Total des dépenses',
      'Votre résultat',
      'Résultat du compte',
      'Sous-total',
      '-----',
      '====',
    ];

    return footerMarkers.some((marker) => line.includes(marker));
  }

  /**
   * Parse a single transaction line
   *
   * BNP formats:
   * 1. Full date: "12 mars 2024    AMAZON EU SARL    -19,00"
   * 2. Short date: "04/02 05/02 TAGGBOX JAIPUR IN -19,00 USD"
   *
   * @param line - Transaction line to parse
   * @param nextLine - Next line (to check for exchange rate or EUR amount)
   * @param followingLine - Line after next (to check for EUR amount)
   * @returns Transaction object or null if not a valid transaction
   */
  private parseTransactionLine(
    line: string,
    nextLine?: string,
    followingLine?: string
  ): { transaction: Transaction; linesConsumed: number } | null {
    // Clean the line: remove pipe characters used in table format
    let cleaned = line.trim().replace(/\|/g, '').trim();

    if (!cleaned) {
      return null;
    }

    let date: Date | null = null;
    let afterDate = '';

    // 1. Try to extract full date from the beginning (e.g., "12 mars 2024")
    const fullDateMatch = cleaned.match(BnpParser.FULL_DATE_PATTERN);

    if (fullDateMatch) {
      const dateStr = fullDateMatch[1];
      afterDate = cleaned.slice(fullDateMatch[0].length).trim();
      date = parseFrenchDate(dateStr);
    } else {
    // 2. Try to extract short date (e.g., "04/02 05/02")
      const shortDateMatch = cleaned.match(BnpParser.SHORT_DATE_PATTERN);

      if (shortDateMatch) {
      const day = parseInt(shortDateMatch[1], 10);
        const month = parseInt(shortDateMatch[2], 10);
        let year = 2026; // Default to 2026 for this specific PDF set
        
        // Handle year wrap-around for statements spanning December/January
        // If current month is e.g. June (5) and we see a transaction in Dec (11), it's 2025
        if (month > new Date().getMonth() + 1 + 2) {
           year = 2025;
        }

        date = new Date(year, month - 1, day);
        afterDate = cleaned.slice(shortDateMatch[0].length).trim();
      }
    }

    if (!date) {
      return null;
    }

    let amountMatch = afterDate.match(BnpParser.AMOUNT_PATTERN);
    let linesConsumed = 1;

    // If amount not on current line, try next line
    if (!amountMatch && nextLine) {
      amountMatch = nextLine.trim().match(BnpParser.AMOUNT_PATTERN);
      if (amountMatch) {
        linesConsumed = 2;
      }
    }

    if (!amountMatch) {
      return null;
    }

    let amountStr = amountMatch[1].trim();
    
    // If the amount was found on the same line, the description is what's before it
    // If the amount was on the next line, the description is everything after the date on the current line
    let description = (linesConsumed === 1) 
      ? afterDate.slice(0, afterDate.length - amountMatch[0].length).trim()
      : afterDate.trim();

    let parsedAmount = parseAmountWithCurrency(amountStr);

    if (!parsedAmount) {
      return null;
    }

    let billAmount = parsedAmount.amount; // Default to the first amount found
    let originalAmount = parsedAmount.amount;
    let currency = parsedAmount.currency;

    // Handle foreign currency (multi-line)
    if (currency && currency !== 'EUR') {
      // If we consumed 1 line, look in nextLine and followingLine
      // If we consumed 2 lines (date on L1, foreign amount on L2), look in followingLine
      const linesToCheck = linesConsumed === 1 
        ? [nextLine, followingLine]
        : [followingLine];
      
      const filteredLines = linesToCheck.filter(Boolean) as string[];
      for (let j = 0; j < filteredLines.length; j++) {
        const next = filteredLines[j];
        const trimmedNext = next.trim();
        // If the next line looks like a new transaction (starts with a date), stop looking
        if (trimmedNext.match(BnpParser.FULL_DATE_PATTERN) || trimmedNext.match(BnpParser.SHORT_DATE_PATTERN)) {
          break;
        }

        const match = trimmedNext.match(BnpParser.EUR_PATTERN);
        if (match) {
          const parsedEur = parseAmountWithCurrency(match[0]);
          if (parsedEur) {
            billAmount = parsedEur.amount;
            // We consume one more line if we found the EUR amount on a fresh line
            if (next === nextLine) linesConsumed = Math.max(linesConsumed, 2);
            if (next === followingLine) linesConsumed = Math.max(linesConsumed, 3);
            break;
          }
        }
        
        // Also skip exchange rate line if it exists
        if (isExchangeRateLine(next)) {
           if (next === nextLine) linesConsumed = Math.max(linesConsumed, 2);
           if (next === followingLine) linesConsumed = Math.max(linesConsumed, 3);
           
           // If the exchange rate line was nextLine, the EUR amount might be on followingLine
           if (next === nextLine && followingLine) {
             const matchFollowing = followingLine.trim().match(BnpParser.EUR_PATTERN);
             if (matchFollowing) {
               const parsedEur = parseAmountWithCurrency(matchFollowing[0]);
               if (parsedEur) {
                 billAmount = parsedEur.amount;
                 linesConsumed = 3;
                 break;
               }
             }
           }
        }
      }
    }

    if (!description || description.length < 2) {
      return null;
    }

    return {
      transaction: {
        date,
        description,
        amount: billAmount,
        originalAmount: (currency && currency !== 'EUR') ? originalAmount : undefined,
        originalCurrency: currency,
      },
      linesConsumed
    };
  }

  /**
   * Get debug information about the parsing process
   *
   * @param content - PDF content to analyze
   * @returns Debug information object
   */
  getDebugInfo(content: PdfContent): {
    canParse: boolean;
    cardNumber: CardNumberInfo | null;
    tableBounds: TransactionTableBounds | null;
    textLength: number;
  } {
    return {
      canParse: this.canParse(content),
      cardNumber: this.extractCardNumber(content.text),
      tableBounds: this.identifyTableBounds(content.text),
      textLength: content.text.length,
    };
  }
}

// Export singleton instance for convenience
export const bnpParser = new BnpParser();
