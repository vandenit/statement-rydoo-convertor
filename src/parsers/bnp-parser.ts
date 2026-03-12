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
 */

import { PdfContent } from '../types/pdf.js';
import {
  BaseParser,
  ParserResult,
  RawTransaction,
  TransactionTableBounds,
  CardNumberInfo,
} from './base-parser.js';

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
  // Matches: Numéro de carte followed by groups of digits with XX placeholders
  private static readonly CARD_NUMBER_PATTERN =
    /Num[ée]ro de carte\s+(\d{4})\s+(\d{2})XX\s+XXXX\s+(\d{4})/i;

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
    const rawTransactions = this.extractTransactions(tableText);

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
      const fullNumber = `${primaryMatch[1]} ${primaryMatch[2]}XX XXXX ${primaryMatch[3]}`;
      return {
        fullNumber,
        lastFour: primaryMatch[3],
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
   * - Header: "Date de transaction"
   * - Columns: Date de transaction | Description | Montant en euros
   * - Footer: "SOLDE ACTUEL" or "TOTAL DES DEPENSES"
   *
   * @param text - PDF text content
   * @returns TransactionTableBounds or null if not found
   */
  protected identifyTableBounds(text: string): TransactionTableBounds | null {
    // Find table header
    const headerIndex = text.indexOf(BnpParser.TABLE_HEADER_MARKER);
    if (headerIndex === -1) {
      return null;
    }

    // Find the end of the header line
    const headerLineEnd = text.indexOf('\n', headerIndex);
    const headerLine =
      headerLineEnd !== -1
        ? text.substring(headerIndex, headerLineEnd).trim()
        : text.substring(headerIndex).trim();

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
   * Extract raw transactions from the transaction table section
   *
   * Phase 2: Returns empty array - table section identification only
   * Phase 3: Will implement full row parsing to extract individual transactions
   *
   * @param tableText - Text content of the transaction table section
   * @returns Array of RawTransaction objects (empty for Phase 2)
   */
  protected extractTransactions(tableText: string): RawTransaction[] {
    // Phase 2: Transaction identification only
    // The tableText is returned in rawText for Phase 3 processing
    return [];
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
