/**
 * Transaction Type Definitions
 *
 * Intermediate types for raw transaction data extracted from PDF.
 * These are converted to final Transaction format in Phase 3 (Data Extraction).
 *
 * Requirements covered:
 * - PARSE-02: Extract transaction table with date, description, amount columns
 * - PARSE-04: Extract card number from PDF header
 */

/**
 * Raw transaction data as extracted from PDF
 * Intermediate format before parsing and transformation
 */
export interface RawTransaction {
  /** Raw date string from PDF (e.g., "12 mars 2024") */
  date: string;
  /** Merchant name/description from PDF */
  description: string;
  /** Raw amount string (e.g., "-19,00" or "-19,00 USD") */
  amount: string;
  /** Original currency code for foreign transactions (e.g., "USD") */
  originalCurrency?: string;
}

/**
 * Result of parsing a PDF statement
 * Contains extracted card number and parsed transaction data
 */
export interface ParserResult {
  /** Last 4 digits of card number (e.g., "8204") */
  cardNumber: string;
  /** Array of parsed transactions extracted from PDF */
  rawTransactions: Transaction[];
  /** Full PDF text for debugging */
  rawText: string;
}

/**
 * Base parser interface implementing the Strategy pattern
 *
 * Architecture: ARCH-03 - Extensible parser interface
 * Each bank parser implements this interface for automatic bank detection
 */
export interface BankParser {
  /**
   * Check if this parser can handle the given PDF content
   *
   * @param text - Full text content from PDF
   * @returns true if this parser recognizes the PDF format
   */
  canParse(text: string): boolean;

  /**
   * Parse the PDF content and extract transaction data
   *
   * @param text - Full text content from PDF
   * @returns Promise<ParserResult> - Extracted card number and raw transactions
   * @throws Error if parsing fails
   */
  parse(text: string): Promise<ParserResult>;
}

/**
 * Transaction table boundary markers
 * Used to identify transaction sections in PDF text
 */
export interface TransactionTableBounds {
  /** Start index of transaction table in text */
  startIndex: number;
  /** End index of transaction table in text */
  endIndex: number;
  /** Header line of the table (e.g., "Date de transaction") */
  headerLine: string;
  /** Footer marker that ends the table (e.g., "SOLDE ACTUEL") */
  footerMarker?: string;
}

/**
 * Card number extraction result
 */
export interface CardNumberInfo {
  /** Full card number from PDF (e.g., "5480 28XX XXXX 8204") */
  fullNumber: string;
  /** Last 4 digits (e.g., "8204") */
  lastFour: string;
  /** Card type if detected (e.g., "VISA", "MASTERCARD") */
  cardType?: string;
}

/**
 * Parsed transaction with typed fields
 *
 * Clean data structure with proper types for downstream processing.
 * Converted from RawTransaction in Phase 3 (Data Extraction).
 *
 * Requirements covered:
 * - EXTRACT-01: Extract transaction date as Date object
 * - EXTRACT-03: Extract amount as number
 * - EXTRACT-04: Extract original currency code
 * - EXTRACT-05: Format dates as M/D/YYYY for output
 */
export interface Transaction {
  /** Parsed date as Date object */
  date: Date;
  /** Merchant name/description */
  description: string;
  /** Amount as number (negative for debits, positive for credits) */
  amount: number;
  /** Original currency code for foreign transactions (e.g., "USD") */
  originalCurrency?: string;
  /** Card number associated with this transaction */
  cardNumber?: string;
}
