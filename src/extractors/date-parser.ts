/**
 * French Date Parser Utility
 *
 * Parses French date strings from BNP PDFs and converts to Date objects.
 * BNP PDFs use French month names like "12 mars 2024".
 *
 * Requirements covered:
 * - EXTRACT-01: Extract transaction date
 * - EXTRACT-05: Format dates as M/D/YYYY
 */

/**
 * Map of French month names to month numbers (1-12)
 */
export const FRENCH_MONTHS: Readonly<Record<string, number>> = {
  janvier: 1,
  février: 2,
  fevrier: 2, // Alternate spelling without accent
  mars: 3,
  avril: 4,
  mai: 5,
  juin: 6,
  juillet: 7,
  août: 8,
  aout: 8, // Alternate spelling without accent
  septembre: 9,
  octobre: 10,
  novembre: 11,
  décembre: 12,
  decembre: 12, // Alternate spelling without accent
};

/**
 * Parse a French date string to a Date object
 *
 * Handles formats like:
 * - "12 mars 2024" (standard)
 * - "1 janvier 2024" (single digit day)
 * - "  15 avril  2024  " (extra whitespace)
 *
 * @param dateStr - French date string
 * @returns Date object or null if parsing fails
 */
export function parseFrenchDate(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') {
    return null;
  }

  // Normalize whitespace and trim
  const normalized = dateStr.trim().replace(/\s+/g, ' ');

  // Pattern: day month year (e.g., "12 mars 2024")
  // Day: 1-31 (with or without leading zero)
  // Month: French month name
  // Year: 4 digits
  const pattern = /^(\d{1,2})\s+([a-zéû]+)\s+(\d{4})$/i;
  const match = normalized.match(pattern);

  if (!match) {
    return null;
  }

  const day = parseInt(match[1], 10);
  const monthName = match[2].toLowerCase();
  const year = parseInt(match[3], 10);

  // Look up month number
  const month = FRENCH_MONTHS[monthName];

  if (!month) {
    return null;
  }

  // Validate day range
  if (day < 1 || day > 31) {
    return null;
  }

  // Create date (months are 0-indexed in JavaScript Date)
  const date = new Date(year, month - 1, day);

  // Verify the date is valid (catches invalid dates like Feb 30)
  if (date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return date;
}

/**
 * Format a Date object as M/D/YYYY string
 *
 * Output format for Rydoo import.
 * Examples:
 * - March 12, 2024 → "3/12/2024"
 * - December 1, 2024 → "12/1/2024"
 *
 * @param date - Date object to format
 * @returns Formatted string in M/D/YYYY format
 */
export function formatDateMDY(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('Invalid date provided to formatDateMDY');
  }

  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate(); // 1-31
  const year = date.getFullYear(); // 4-digit year

  return `${month}/${day}/${year}`;
}

/**
 * Parse a French date and format as M/D/YYYY in one step
 *
 * Convenience function combining parseFrenchDate and formatDateMDY.
 *
 * @param dateStr - French date string (e.g., "12 mars 2024")
 * @returns Formatted M/D/YYYY string or null if parsing fails
 */
export function parseAndFormatFrenchDate(dateStr: string): string | null {
  const date = parseFrenchDate(dateStr);
  if (!date) {
    return null;
  }
  return formatDateMDY(date);
}
