/**
 * Base Parser Module
 *
 * Abstract base class implementing the Strategy pattern for bank-specific parsers.
 * Provides common functionality and enforces the parser interface.
 *
 * Architecture: ARCH-03 - Extensible parser interface
 * Pattern: Strategy pattern with template method
 */

import { PdfContent } from '../types/pdf.js';
import {
  ParserResult,
  Transaction,
  RawTransaction,
  TransactionTableBounds,
  CardNumberInfo,
} from '../types/transaction.js';

/**
 * Abstract base class for bank-specific parsers
 *
 * Implements the BankParser interface with common functionality
 * and template methods for bank-specific implementations.
 */
export abstract class BaseParser {
  /**
   * Bank identifier (e.g., "bnp", "kbc", "ing")
   */
  abstract readonly bankId: string;

  /**
   * Bank display name (e.g., "BNP Paribas Fortis")
   */
  abstract readonly bankName: string;

  /**
   * Check if this parser can handle the given PDF content
   *
   * @param content - Parsed PDF content with text and page information
   * @returns true if this parser recognizes the PDF format
   *
   * Implementation should look for bank-specific markers in the text.
   */
  abstract canParse(content: PdfContent): boolean;

  /**
   * Parse the PDF content and extract transaction data
   *
   * @param content - Parsed PDF content with text and page information
   * @returns Promise<ParserResult> - Extracted card number and raw transactions
   * @throws Error if parsing fails or format is unrecognized
   */
  abstract parse(content: PdfContent): Promise<ParserResult>;

  /**
   * Extract card number information from PDF text
   *
   * @param text - Full text content from PDF
   * @returns CardNumberInfo with full number and last 4 digits, or null if not found
   *
   * Override in subclass for bank-specific patterns.
   */
  protected abstract extractCardNumber(text: string): CardNumberInfo | null;

  /**
   * Identify transaction table boundaries in PDF text
   *
   * @param text - Full text content from PDF
   * @returns TransactionTableBounds with start/end indices and markers, or null if not found
   *
   * Override in subclass for bank-specific table structures.
   */
  protected abstract identifyTableBounds(text: string): TransactionTableBounds | null;

  /**
   * Extract transactions from the transaction table section
   *
   * @param tableText - Text content of the transaction table section
   * @returns Array of Transaction objects with parsed data
   *
   * Override in subclass for bank-specific row parsing.
   * Phase 3: Returns fully parsed Transaction objects
   */
  protected abstract extractTransactions(tableText: string): Transaction[];

  /**
   * Utility: Find first occurrence of any pattern in text
   *
   * @param text - Text to search
   * @param patterns - Array of patterns to look for
   * @returns Index of first match, or -1 if none found
   */
  protected findFirstMatch(text: string, patterns: string[]): number {
    for (const pattern of patterns) {
      const index = text.indexOf(pattern);
      if (index !== -1) {
        return index;
      }
    }
    return -1;
  }

  /**
   * Utility: Extract text between start and end markers
   *
   * @param text - Full text to extract from
   * @param startMarker - Marker that indicates start of section
   * @param endMarkers - Array of markers that indicate end of section (first match wins)
   * @returns Extracted text between markers, or empty string if not found
   */
  protected extractBetweenMarkers(text: string, startMarker: string, endMarkers: string[]): string {
    const startIndex = text.indexOf(startMarker);
    if (startIndex === -1) {
      return '';
    }

    const searchStart = startIndex + startMarker.length;
    let endIndex = text.length;

    for (const endMarker of endMarkers) {
      const markerIndex = text.indexOf(endMarker, searchStart);
      if (markerIndex !== -1 && markerIndex < endIndex) {
        endIndex = markerIndex;
      }
    }

    return text.substring(searchStart, endIndex).trim();
  }

  /**
   * Utility: Extract last 4 digits from card number
   *
   * @param cardNumber - Full or masked card number
   * @returns Last 4 digits
   */
  protected extractLastFour(cardNumber: string): string {
    // Remove all spaces and non-digit characters
    const cleaned = cardNumber.replace(/\D/g, '');
    // Return last 4 digits
    return cleaned.slice(-4);
  }
}

// Re-export types for convenience
export {
  ParserResult,
  RawTransaction,
  TransactionTableBounds,
  CardNumberInfo,
} from '../types/transaction.js';
