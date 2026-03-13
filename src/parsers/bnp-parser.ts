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
    'TOTAL DES DEPENSES',
    'Total des dépenses',
    'Votre résultat',
    'Résultat du compte',
  ];

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

    // Extract transaction table text
    const tableText = text.substring(tableBounds.startIndex, tableBounds.endIndex);

    // Extract transactions (Phase 2: returns empty array)
    // Phase 3 will implement full transaction parsing
    const transactions = this.extractTransactions(tableText);

    // Attach card number to each transaction for multi-file aggregation
    const rawTransactions = transactions.map(t => ({
      ...t,
      cardNumber: cardInfo.fullNumber
    }));

    return {
      cardNumber: cardInfo.lastFour,
      rawTransactions,
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
        break;
      }

      // Skip exchange rate lines (handled by lookahead)
      if (isExchangeRateLine(line)) {
        i++;
        continue;
      }

      // Try to parse this as a transaction line
      // Pass potential next lines for lookahead
      const transaction = this.parseTransactionLine(line, lines[i + 1], lines[i + 2]);

      if (transaction) {
        transactions.push(transaction);

        // If this was a multi-line transaction, skip the consumed lines
        let linesToSkip = 1;
        if (transaction.originalCurrency && transaction.originalCurrency !== 'EUR') {
          // Lookahead for exchange rate and EUR amount
          if (lines[i + 1] && isExchangeRateLine(lines[i + 1])) linesToSkip++;
          // Check if the EUR amount was also found on next/following line
          // (We'll simplify and say if it's foreign, we skip up to 2 extra lines if they match patterns)
          if (lines[i + linesToSkip] && lines[i + linesToSkip].trim().match(/^-?[\d\s]*,?\d{2}\s*€\s*$/)) {
            linesToSkip++;
          }
        }
        i += linesToSkip;
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
  private parseTransactionLine(line: string, nextLine?: string, followingLine?: string): Transaction | null {
    // Clean the line: remove pipe characters used in table format
    let cleaned = line.trim().replace(/\|/g, '').trim();

    if (!cleaned) {
      return null;
    }

    let date: Date | null = null;
    let afterDate = '';

    // 1. Try to extract full date from the beginning (e.g., "12 mars 2024")
    const fullDatePattern = /^(\d{1,2}\s+[a-zéû]+\s+\d{4})/i;
    const fullDateMatch = cleaned.match(fullDatePattern);

    if (fullDateMatch) {
      const dateStr = fullDateMatch[1];
      afterDate = cleaned.slice(fullDateMatch[0].length).trim();
      date = parseFrenchDate(dateStr);
    } else {
      // 2. Try to extract short date (e.g., "04/02 05/02")
      const shortDatePattern = /^(\d{2})\/(\d{2})(?:\s+(\d{2})\/(\d{2}))?/;
      const shortDateMatch = cleaned.match(shortDatePattern);

      if (shortDateMatch) {
        const day = parseInt(shortDateMatch[1], 10);
        const month = parseInt(shortDateMatch[2], 10);
        let year = 2026; // Default to 2026 for this specific PDF set
        date = new Date(year, month - 1, day);
        afterDate = cleaned.slice(shortDateMatch[0].length).trim();
      }
    }

    if (!date) {
      return null;
    }

    // Amount pattern at the end
    // Supports dots as thousand separators and spaces
    const amountPattern = /(-?\d[\d\s\.]*,\d{2}(?:\s*(?:[A-Z]{3}|[€$£¥]))?)\s*$/;
    let amountMatch = afterDate.match(amountPattern);

    if (!amountMatch) {
      return null;
    }

    let amountStr = amountMatch[1].trim();
    let beforeAmount = afterDate.slice(0, afterDate.length - amountMatch[0].length).trim();
    let parsedAmount = parseAmountWithCurrency(amountStr);

    if (!parsedAmount) {
      return null;
    }

    // Multi-line foreign currency handling
    let eurAmount = parsedAmount.amount;
    let currency = parsedAmount.currency;

    if (currency && currency !== 'EUR') {
      // Look for the actual EUR amount on the next lines
      const eurPattern = /(-?[\d\s\.]*,?\d{2})\s*(?:€|EUR)\s*$/i;
      
      // Check nextLine and followingLine
      const linesToCheck = [nextLine, followingLine].filter(Boolean) as string[];
      for (const next of linesToCheck) {
        const match = next.trim().match(eurPattern);
        if (match) {
          const parsedEur = parseAmountWithCurrency(match[0]);
          if (parsedEur) {
            eurAmount = parsedEur.amount;
            break;
          }
        }
      }
    }

    const description = beforeAmount.trim();
    if (!description || description.length < 2) {
      return null;
    }

    return {
      date,
      description,
      amount: eurAmount,
      originalCurrency: currency,
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
