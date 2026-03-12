/**
 * Amount Parser Tests
 *
 * Test coverage for:
 * - Comma decimal separator parsing
 * - Space thousand separators
 * - Currency code extraction
 * - Exchange rate line detection
 * - Edge cases and error handling
 */

import { describe, it, expect } from 'vitest';
import {
  parseAmount,
  parseAmountWithCurrency,
  isExchangeRateLine,
  extractAmountFromCell,
  formatAmount,
  type ParsedAmount,
} from './amount-parser.js';

describe('parseAmount', () => {
  describe('basic parsing', () => {
    it('should parse simple amount with comma decimal', () => {
      expect(parseAmount('19,00')).toBe(19.0);
      expect(parseAmount('-19,00')).toBe(-19.0);
      expect(parseAmount('123,45')).toBe(123.45);
    });

    it('should parse amount with period decimal (fallback)', () => {
      expect(parseAmount('19.00')).toBe(19.0);
      expect(parseAmount('-19.50')).toBe(-19.5);
    });

    it('should handle positive and negative signs', () => {
      expect(parseAmount('+12,50')).toBe(12.5);
      expect(parseAmount('-45,00')).toBe(-45.0);
      expect(parseAmount('78,90')).toBe(78.9);
    });

    it('should handle whitespace', () => {
      expect(parseAmount('  19,00  ')).toBe(19.0);
      expect(parseAmount('\t-12,50\n')).toBe(-12.5);
    });
  });

  describe('thousand separators', () => {
    it('should parse amount with space thousand separator', () => {
      expect(parseAmount('1 234,56')).toBe(1234.56);
      expect(parseAmount('12 345,67')).toBe(12345.67);
      expect(parseAmount('1 234 567,89')).toBe(1234567.89);
    });

    it('should parse negative amount with space separator', () => {
      expect(parseAmount('-1 234,56')).toBe(-1234.56);
      expect(parseAmount('-12 345,00')).toBe(-12345.0);
    });

    it('should parse amount with non-breaking space', () => {
      expect(parseAmount('1\u00A0234,56')).toBe(1234.56);
      expect(parseAmount('1\u202F234,56')).toBe(1234.56);
    });
  });

  describe('edge cases', () => {
    it('should handle zero amounts', () => {
      expect(parseAmount('0,00')).toBe(0);
      expect(parseAmount('0')).toBe(0);
      expect(parseAmount('-0,00')).toBe(-0);
    });

    it('should handle large numbers', () => {
      expect(parseAmount('999 999,99')).toBe(999999.99);
      expect(parseAmount('1 000 000,00')).toBe(1000000.0);
    });

    it('should return null for invalid inputs', () => {
      expect(parseAmount('')).toBeNull();
      expect(parseAmount('  ')).toBeNull();
      expect(parseAmount('abc')).toBeNull();
      expect(parseAmount('N/A')).toBeNull();
    });

    it('should return null for null/undefined', () => {
      expect(parseAmount(null as unknown as string)).toBeNull();
      expect(parseAmount(undefined as unknown as string)).toBeNull();
    });

    it('should handle single digit decimals', () => {
      expect(parseAmount('19,5')).toBe(19.5);
      expect(parseAmount('-19,5')).toBe(-19.5);
    });
  });
});

describe('parseAmountWithCurrency', () => {
  describe('amount only', () => {
    it('should parse amount without currency', () => {
      const result = parseAmountWithCurrency('-19,00');
      expect(result).toEqual({ amount: -19.0 });
    });

    it('should parse positive amount without currency', () => {
      const result = parseAmountWithCurrency('123,45');
      expect(result).toEqual({ amount: 123.45 });
    });
  });

  describe('with currency code', () => {
    it('should parse amount with USD currency', () => {
      const result = parseAmountWithCurrency('-45,00 USD');
      expect(result).toEqual({ amount: -45.0, currency: 'USD' });
    });

    it('should parse amount with EUR currency', () => {
      const result = parseAmountWithCurrency('19,50 EUR');
      expect(result).toEqual({ amount: 19.5, currency: 'EUR' });
    });

    it('should parse amount with GBP currency', () => {
      const result = parseAmountWithCurrency('-100,00 GBP');
      expect(result).toEqual({ amount: -100.0, currency: 'GBP' });
    });

    it('should parse amount with CHF currency', () => {
      const result = parseAmountWithCurrency('250,00 CHF');
      expect(result).toEqual({ amount: 250.0, currency: 'CHF' });
    });

    it('should parse amount with CAD/AUD/JPY', () => {
      expect(parseAmountWithCurrency('50,00 CAD')).toEqual({
        amount: 50.0,
        currency: 'CAD',
      });
      expect(parseAmountWithCurrency('75,25 AUD')).toEqual({
        amount: 75.25,
        currency: 'AUD',
      });
      expect(parseAmountWithCurrency('1000 JPY')).toEqual({
        amount: 1000,
        currency: 'JPY',
      });
    });
  });

  describe('with thousand separators and currency', () => {
    it('should parse amount with space separator and currency', () => {
      const result = parseAmountWithCurrency('-1 234,56 USD');
      expect(result).toEqual({ amount: -1234.56, currency: 'USD' });
    });

    it('should parse large amount with currency', () => {
      const result = parseAmountWithCurrency('10 000,00 EUR');
      expect(result).toEqual({ amount: 10000.0, currency: 'EUR' });
    });
  });

  describe('whitespace handling', () => {
    it('should handle no space before currency', () => {
      const result = parseAmountWithCurrency('-45,00USD');
      expect(result).toEqual({ amount: -45.0, currency: 'USD' });
    });

    it('should handle extra whitespace', () => {
      const result = parseAmountWithCurrency('  -45,00   USD  ');
      expect(result).toEqual({ amount: -45.0, currency: 'USD' });
    });
  });

  describe('edge cases', () => {
    it('should return null for invalid amount with currency', () => {
      expect(parseAmountWithCurrency('abc USD')).toBeNull();
      expect(parseAmountWithCurrency('N/A EUR')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(parseAmountWithCurrency('')).toBeNull();
    });

    it('should return null for whitespace only', () => {
      expect(parseAmountWithCurrency('   ')).toBeNull();
    });
  });
});

describe('isExchangeRateLine', () => {
  describe('French formats', () => {
    it('should detect "Taux: X.XX" pattern', () => {
      expect(isExchangeRateLine('Taux: 1.08')).toBe(true);
      expect(isExchangeRateLine('Taux: 0.89')).toBe(true);
    });

    it('should detect "Taux : X.XX" pattern with space', () => {
      expect(isExchangeRateLine('Taux : 1.08')).toBe(true);
      expect(isExchangeRateLine('Taux : 0,92')).toBe(true);
    });

    it('should detect "Taux" with comma decimal', () => {
      expect(isExchangeRateLine('Taux: 1,08')).toBe(true);
      expect(isExchangeRateLine('Taux : 0,92')).toBe(true);
    });

    it('should handle case insensitivity', () => {
      expect(isExchangeRateLine('TAUX: 1.08')).toBe(true);
      expect(isExchangeRateLine('taux: 1.08')).toBe(true);
      expect(isExchangeRateLine('Taux: 1.08')).toBe(true);
    });

    it('should handle extra whitespace', () => {
      expect(isExchangeRateLine('  Taux: 1.08  ')).toBe(true);
      expect(isExchangeRateLine('Taux:  1.08')).toBe(true);
    });
  });

  describe('English formats', () => {
    it('should detect "Exchange rate" pattern', () => {
      expect(isExchangeRateLine('Exchange rate: 1.08')).toBe(true);
      expect(isExchangeRateLine('Exchange rate: 0.89')).toBe(true);
    });

    it('should handle various exchange rate formats', () => {
      expect(isExchangeRateLine('Rate: 1.12')).toBe(true);
      expect(isExchangeRateLine('Cours: 1.08')).toBe(true);
    });
  });

  describe('non-exchange rate lines', () => {
    it('should return false for transaction descriptions', () => {
      expect(isExchangeRateLine('AMAZON EU SARL')).toBe(false);
      expect(isExchangeRateLine('Carrefour Market')).toBe(false);
      expect(isExchangeRateLine('Uber *TRIP HELP.uber.com')).toBe(false);
    });

    it('should return false for dates', () => {
      expect(isExchangeRateLine('12 mars 2024')).toBe(false);
      expect(isExchangeRateLine('15/03/2024')).toBe(false);
    });

    it('should return false for amounts', () => {
      expect(isExchangeRateLine('-19,00')).toBe(false);
      expect(isExchangeRateLine('45,00 USD')).toBe(false);
    });

    it('should return false for empty or whitespace', () => {
      expect(isExchangeRateLine('')).toBe(false);
      expect(isExchangeRateLine('   ')).toBe(false);
    });

    it('should not match partial "Taux" in descriptions', () => {
      expect(isExchangeRateLine('Restaurant Taux vents')).toBe(false);
      expect(isExchangeRateLine('Tauxedo Shop')).toBe(false);
    });
  });
});

describe('extractAmountFromCell', () => {
  it('should extract amount from cell text', () => {
    expect(extractAmountFromCell('-19,00')).toEqual({ amount: -19.0 });
    expect(extractAmountFromCell('  -45,00 USD  ')).toEqual({
      amount: -45.0,
      currency: 'USD',
    });
  });

  it('should handle multiple spaces', () => {
    expect(extractAmountFromCell('-19,00    EUR')).toEqual({
      amount: -19.0,
      currency: 'EUR',
    });
  });

  it('should return null for invalid cell content', () => {
    expect(extractAmountFromCell('')).toBeNull();
    expect(extractAmountFromCell('Description')).toBeNull();
  });
});

describe('formatAmount', () => {
  it('should format amount without currency', () => {
    expect(formatAmount(-19.0)).toBe('-19.00');
    expect(formatAmount(123.45)).toBe('123.45');
    expect(formatAmount(0)).toBe('0.00');
  });

  it('should format amount with currency', () => {
    expect(formatAmount(-19.0, 'USD')).toBe('-19.00 USD');
    expect(formatAmount(123.45, 'EUR')).toBe('123.45 EUR');
  });
});

describe('BNP PDF transaction examples', () => {
  it('should parse typical BNP transaction amounts', () => {
    // Standard EUR transaction
    expect(parseAmount('-19,00')).toBe(-19.0);

    // Foreign currency transaction
    const foreign = parseAmountWithCurrency('-45,00 USD');
    expect(foreign).toEqual({ amount: -45.0, currency: 'USD' });

    // Refund/positive amount
    expect(parseAmount('25,00')).toBe(25.0);

    // Large amount with space separator
    expect(parseAmount('1 250,00')).toBe(1250.0);
  });

  it('should detect exchange rate lines in BNP format', () => {
    expect(isExchangeRateLine('Taux: 1.08')).toBe(true);
    expect(isExchangeRateLine('Taux : 0.92')).toBe(true);
  });
});
