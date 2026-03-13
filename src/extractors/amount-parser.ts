/**
 * Amount Parser Utility
 *
 * Handles European number formats with comma decimal separators
 * and currency code detection for foreign transactions.
 *
 * Requirements covered:
 * - EXTRACT-03: Extract amount in EUR, handling comma as decimal separator
 * - EXTRACT-04: Extract original currency code for foreign transactions
 */

/**
 * Result of parsing an amount with optional currency
 */
export interface ParsedAmount {
  /** Amount as number (negative for debits, positive for credits) */
  amount: number;
  /** Original currency code (e.g., "USD", "GBP") for foreign transactions */
  currency?: string;
}

/**
 * Parse an amount string to a number
 *
 * Handles European format with comma decimal separator:
 * - "-19,00" → -19.00
 * - "1 234,56" → 1234.56 (space as thousand separator)
 * - "+12,50" → 12.50
 *
 * @param amountStr - Raw amount string from PDF
 * @returns Parsed number or null if invalid
 */
export function parseAmount(amountStr: string): number | null {
  if (!amountStr || typeof amountStr !== 'string') {
    return null;
  }

  const trimmed = amountStr.trim();
  if (!trimmed) {
    return null;
  }

  // Remove spaces and dots (thousand separators)
  // Handle both regular spaces, dots, and non-breaking spaces
  let cleaned = trimmed.replace(/[\s\.]+/g, '');

  // Replace comma decimal with period
  cleaned = cleaned.replace(',', '.');

  // Parse the number
  const value = parseFloat(cleaned);

  // Check if result is valid
  if (isNaN(value)) {
    return null;
  }

  return value;
}

/**
 * Parse an amount string that may include a currency code
 *
 * Handles formats like:
 * - "-19,00" → { amount: -19.00 }
 * - "-45,00 USD" → { amount: -45.00, currency: "USD" }
 * - "12,50 EUR" → { amount: 12.50, currency: "EUR" }
 *
 * Currency detection:
 * - Looks for 3-letter currency codes at the end
 * - Common codes: EUR, USD, GBP, CHF, CAD, AUD, JPY, etc.
 *
 * @param amountStr - Raw amount string possibly with currency
 * @returns ParsedAmount object or null if invalid
 */
export function parseAmountWithCurrency(amountStr: string): ParsedAmount | null {
  if (!amountStr || typeof amountStr !== 'string') {
    return null;
  }

  const trimmed = amountStr.trim();
  if (!trimmed) {
    return null;
  }

  // Check for currency code at the end (3-letter uppercase code)
  // Matches: "-45,00 USD" or "-45,00USD" or "123,45 USD" at end of string
  const currencyPattern = /^(.*?)\s*([A-Z]{3}|[€$£¥])\s*$/;
  const match = trimmed.match(currencyPattern);

  if (match) {
    const amountPart = match[1].trim();
    let currency = match[2];
    
    // Normalize symbols to codes
    if (currency === '€') currency = 'EUR';
    if (currency === '$') currency = 'USD';
    if (currency === '£') currency = 'GBP';

    // Parse the amount part (without currency)
    const amount = parseAmount(amountPart);

    if (amount !== null) {
      return {
        amount,
        currency,
      };
    }
  }

  // No currency code found or invalid, try parsing as plain amount
  const amount = parseAmount(trimmed);

  if (amount !== null) {
    return { amount };
  }

  return null;
}

/**
 * Check if a line is an exchange rate information line
 *
 * BNP PDFs include exchange rate info on a separate line:
 * "Taux: 1.08" or "Taux : 1,08" or "Exchange rate: 1.08"
 *
 * These lines should be skipped when parsing transactions.
 *
 * @param line - Line of text from PDF
 * @returns true if this is an exchange rate line
 */
export function isExchangeRateLine(line: string): boolean {
  if (!line || typeof line !== 'string') {
    return false;
  }

  const trimmed = line.trim();
  if (!trimmed) {
    return false;
  }

  // Common patterns for exchange rate lines
  const exchangeRatePatterns = [
    /^Taux\s*:?\s*[\d,\.]+/i, // French: "Taux: 1.08" or "Taux : 1,08"
    /^Exchange\s+rate\s*:?\s*[\d,\.]+/i, // English: "Exchange rate: 1.08"
    /^Cours\s*:?\s*[\d,\.]+/i, // Alternative French
    /^Rate\s*:?\s*[\d,\.]+/i, // Short form
  ];

  return exchangeRatePatterns.some((pattern) => pattern.test(trimmed));
}

/**
 * Extract amount from a BNP PDF table cell
 *
 * Handles the specific format used in BNP transaction tables:
 * - Amounts are typically right-aligned
 * - May include currency code for foreign transactions
 * - Uses comma as decimal separator
 *
 * @param cellText - Text from the amount cell
 * @returns ParsedAmount or null if not a valid amount
 */
export function extractAmountFromCell(cellText: string): ParsedAmount | null {
  if (!cellText || typeof cellText !== 'string') {
    return null;
  }

  // Clean up the cell text (remove extra whitespace)
  const cleaned = cellText.trim().replace(/\s+/g, ' ');

  return parseAmountWithCurrency(cleaned);
}

/**
 * Format a number as currency string for display
 *
 * @param amount - Number to format
 * @param currency - Optional currency code
 * @returns Formatted string (e.g., "-19.00 EUR" or "45.50")
 */
export function formatAmount(amount: number, currency?: string): string {
  const formatted = amount.toFixed(2);
  return currency ? `${formatted} ${currency}` : formatted;
}
