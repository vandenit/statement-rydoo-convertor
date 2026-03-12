/**
 * French Date Parser Tests
 *
 * Comprehensive test coverage for date parsing utilities.
 * Tests all 12 French months, edge cases, and error handling.
 */

import { describe, it, expect } from 'vitest';
import {
  FRENCH_MONTHS,
  parseFrenchDate,
  formatDateMDY,
  parseAndFormatFrenchDate,
} from './date-parser.js';

describe('FRENCH_MONTHS', () => {
  it('should contain all 12 month values (with accent-free variants)', () => {
    const months = Object.values(FRENCH_MONTHS);
    // 12 months + 3 accent-free variants = 15 entries
    expect(months).toHaveLength(15);
    // But only 12 unique values (1-12)
    expect(new Set(months)).toHaveLength(12);
  });

  it('should have month numbers 1-12', () => {
    const uniqueMonths = [...new Set(Object.values(FRENCH_MONTHS))].sort((a, b) => a - b);
    expect(uniqueMonths).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('should map standard French month names', () => {
    expect(FRENCH_MONTHS['janvier']).toBe(1);
    expect(FRENCH_MONTHS['février']).toBe(2);
    expect(FRENCH_MONTHS['mars']).toBe(3);
    expect(FRENCH_MONTHS['avril']).toBe(4);
    expect(FRENCH_MONTHS['mai']).toBe(5);
    expect(FRENCH_MONTHS['juin']).toBe(6);
    expect(FRENCH_MONTHS['juillet']).toBe(7);
    expect(FRENCH_MONTHS['août']).toBe(8);
    expect(FRENCH_MONTHS['septembre']).toBe(9);
    expect(FRENCH_MONTHS['octobre']).toBe(10);
    expect(FRENCH_MONTHS['novembre']).toBe(11);
    expect(FRENCH_MONTHS['décembre']).toBe(12);
  });

  it('should map accent-free variants', () => {
    expect(FRENCH_MONTHS['fevrier']).toBe(2);
    expect(FRENCH_MONTHS['aout']).toBe(8);
    expect(FRENCH_MONTHS['decembre']).toBe(12);
  });
});

describe('parseFrenchDate', () => {
  it('should parse standard French dates', () => {
    const date = parseFrenchDate('12 mars 2024');
    expect(date).not.toBeNull();
    expect(date?.getFullYear()).toBe(2024);
    expect(date?.getMonth()).toBe(2); // March is 2 (0-indexed)
    expect(date?.getDate()).toBe(12);
  });

  it('should parse all 12 French months', () => {
    const testCases = [
      { input: '15 janvier 2024', month: 0, day: 15 },
      { input: '20 février 2024', month: 1, day: 20 },
      { input: '12 mars 2024', month: 2, day: 12 },
      { input: '5 avril 2024', month: 3, day: 5 },
      { input: '25 mai 2024', month: 4, day: 25 },
      { input: '30 juin 2024', month: 5, day: 30 },
      { input: '14 juillet 2024', month: 6, day: 14 },
      { input: '1 août 2024', month: 7, day: 1 },
      { input: '10 septembre 2024', month: 8, day: 10 },
      { input: '31 octobre 2024', month: 9, day: 31 },
      { input: '15 novembre 2024', month: 10, day: 15 },
      { input: '25 décembre 2024', month: 11, day: 25 },
    ];

    for (const { input, month, day } of testCases) {
      const date = parseFrenchDate(input);
      expect(date, `Failed to parse: ${input}`).not.toBeNull();
      expect(date?.getMonth(), `Wrong month for: ${input}`).toBe(month);
      expect(date?.getDate(), `Wrong day for: ${input}`).toBe(day);
      expect(date?.getFullYear(), `Wrong year for: ${input}`).toBe(2024);
    }
  });

  it('should parse single digit days', () => {
    const date = parseFrenchDate('1 janvier 2024');
    expect(date).not.toBeNull();
    expect(date?.getDate()).toBe(1);
  });

  it('should parse double digit days', () => {
    const date = parseFrenchDate('31 décembre 2024');
    expect(date).not.toBeNull();
    expect(date?.getDate()).toBe(31);
  });

  it('should handle extra whitespace', () => {
    const date = parseFrenchDate('  15  avril  2024  ');
    expect(date).not.toBeNull();
    expect(date?.getDate()).toBe(15);
    expect(date?.getMonth()).toBe(3);
  });

  it('should handle multiple spaces between components', () => {
    const date = parseFrenchDate('1   mai   2024');
    expect(date).not.toBeNull();
    expect(date?.getDate()).toBe(1);
    expect(date?.getMonth()).toBe(4);
  });

  it('should handle accent-free month names', () => {
    expect(parseFrenchDate('1 fevrier 2024')).not.toBeNull();
    expect(parseFrenchDate('1 aout 2024')).not.toBeNull();
    expect(parseFrenchDate('1 decembre 2024')).not.toBeNull();
  });

  it('should handle case insensitivity', () => {
    expect(parseFrenchDate('1 MARS 2024')).not.toBeNull();
    expect(parseFrenchDate('1 Mars 2024')).not.toBeNull();
    expect(parseFrenchDate('1 mArS 2024')).not.toBeNull();
  });

  it('should reject invalid day numbers', () => {
    expect(parseFrenchDate('0 janvier 2024')).toBeNull();
    expect(parseFrenchDate('32 janvier 2024')).toBeNull();
    expect(parseFrenchDate('99 mars 2024')).toBeNull();
  });

  it('should reject invalid month names', () => {
    expect(parseFrenchDate('15 invalid 2024')).toBeNull();
    expect(parseFrenchDate('1 xyz 2024')).toBeNull();
    expect(parseFrenchDate('1 2024')).toBeNull();
  });

  it('should reject invalid year formats', () => {
    expect(parseFrenchDate('15 janvier 24')).toBeNull();
    expect(parseFrenchDate('15 janvier 202')).toBeNull();
  });

  it('should reject invalid date formats', () => {
    expect(parseFrenchDate('')).toBeNull();
    expect(parseFrenchDate('janvier 2024')).toBeNull();
    expect(parseFrenchDate('15 2024')).toBeNull();
    expect(parseFrenchDate('invalid')).toBeNull();
  });

  it('should handle different years', () => {
    expect(parseFrenchDate('1 janvier 2023')?.getFullYear()).toBe(2023);
    expect(parseFrenchDate('1 janvier 2025')?.getFullYear()).toBe(2025);
    expect(parseFrenchDate('1 janvier 1999')?.getFullYear()).toBe(1999);
  });

  it('should reject invalid dates', () => {
    // February 30 doesn't exist
    expect(parseFrenchDate('30 février 2024')).toBeNull();
    // April 31 doesn't exist
    expect(parseFrenchDate('31 avril 2024')).toBeNull();
  });
});

describe('formatDateMDY', () => {
  it('should format dates as M/D/YYYY', () => {
    expect(formatDateMDY(new Date(2024, 2, 12))).toBe('3/12/2024');
    expect(formatDateMDY(new Date(2024, 0, 1))).toBe('1/1/2024');
    expect(formatDateMDY(new Date(2024, 11, 25))).toBe('12/25/2024');
  });

  it('should format single digit months without leading zero', () => {
    expect(formatDateMDY(new Date(2024, 0, 15))).toBe('1/15/2024');
    expect(formatDateMDY(new Date(2024, 8, 1))).toBe('9/1/2024');
  });

  it('should format single digit days without leading zero', () => {
    expect(formatDateMDY(new Date(2024, 5, 1))).toBe('6/1/2024');
    expect(formatDateMDY(new Date(2024, 5, 9))).toBe('6/9/2024');
  });

  it('should throw on invalid date', () => {
    expect(() => formatDateMDY(new Date('invalid'))).toThrow('Invalid date');
  });
});

describe('parseAndFormatFrenchDate', () => {
  it('should parse and format in one step', () => {
    expect(parseAndFormatFrenchDate('12 mars 2024')).toBe('3/12/2024');
    expect(parseAndFormatFrenchDate('1 janvier 2024')).toBe('1/1/2024');
    expect(parseAndFormatFrenchDate('31 décembre 2024')).toBe('12/31/2024');
  });

  it('should return null for invalid dates', () => {
    expect(parseAndFormatFrenchDate('invalid')).toBeNull();
    expect(parseAndFormatFrenchDate('')).toBeNull();
    expect(parseAndFormatFrenchDate('32 janvier 2024')).toBeNull();
  });

  it('should handle all 12 months correctly', () => {
    expect(parseAndFormatFrenchDate('15 janvier 2024')).toBe('1/15/2024');
    expect(parseAndFormatFrenchDate('15 février 2024')).toBe('2/15/2024');
    expect(parseAndFormatFrenchDate('15 mars 2024')).toBe('3/15/2024');
    expect(parseAndFormatFrenchDate('15 avril 2024')).toBe('4/15/2024');
    expect(parseAndFormatFrenchDate('15 mai 2024')).toBe('5/15/2024');
    expect(parseAndFormatFrenchDate('15 juin 2024')).toBe('6/15/2024');
    expect(parseAndFormatFrenchDate('15 juillet 2024')).toBe('7/15/2024');
    expect(parseAndFormatFrenchDate('15 août 2024')).toBe('8/15/2024');
    expect(parseAndFormatFrenchDate('15 septembre 2024')).toBe('9/15/2024');
    expect(parseAndFormatFrenchDate('15 octobre 2024')).toBe('10/15/2024');
    expect(parseAndFormatFrenchDate('15 novembre 2024')).toBe('11/15/2024');
    expect(parseAndFormatFrenchDate('15 décembre 2024')).toBe('12/15/2024');
  });
});
