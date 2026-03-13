import { describe, it, expect, afterEach } from 'vitest';
import { generateExcel } from './excel-generator.js';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import type { Transaction } from '../types/transaction.js';

describe('generateExcel', () => {
  const testOutputPath = '/tmp/test-output.xlsx';

  afterEach(() => {
    if (fs.existsSync(testOutputPath)) {
      fs.unlinkSync(testOutputPath);
    }
  });

  it('should create Excel file with correct columns', () => {
    const transactions: Transaction[] = [
      {
        date: new Date('2024-03-15'),
        description: 'AMAZON EU SARL',
        amount: -19.0,
        originalCurrency: 'EUR',
      },
    ];

    generateExcel(transactions, '8204', { outputPath: testOutputPath });

    const workbook = XLSX.readFile(testOutputPath);
    const sheet = workbook.Sheets['Transactions'];
    const headers = XLSX.utils.sheet_to_json(sheet, { header: 1 })[0] as string[];

    expect(headers).toEqual([
      'TransactionDate',
      'Amount',
      'Merchant',
      'CurrencyCode',
      'CardNumber',
      'AccountCurrency',
      'AccountAmount',
    ]);
  });

  it('should format dates as M/D/YYYY', () => {
    const transactions: Transaction[] = [
      {
        date: new Date('2024-03-12'),
        description: 'TEST MERCHANT',
        amount: -25.0,
        originalCurrency: 'EUR',
      },
    ];

    generateExcel(transactions, '1234', { outputPath: testOutputPath });

    const workbook = XLSX.readFile(testOutputPath);
    const sheet = workbook.Sheets['Transactions'];
    const data = XLSX.utils.sheet_to_json(sheet)[0] as Record<string, unknown>;

    expect(data.TransactionDate).toBe('3/12/2024');
  });

  it('should use card number from PDF', () => {
    const transactions: Transaction[] = [
      {
        date: new Date('2024-03-15'),
        description: 'TEST',
        amount: -10.0,
        originalCurrency: 'EUR',
      },
    ];

    generateExcel(transactions, '8204', { outputPath: testOutputPath });

    const workbook = XLSX.readFile(testOutputPath);
    const sheet = workbook.Sheets['Transactions'];
    const data = XLSX.utils.sheet_to_json(sheet)[0] as Record<string, unknown>;

    expect(data.CardNumber).toBe('8204');
  });

  it('should set AccountCurrency to EUR', () => {
    const transactions: Transaction[] = [
      {
        date: new Date('2024-03-15'),
        description: 'TEST',
        amount: -10.0,
        originalCurrency: 'EUR',
      },
    ];

    generateExcel(transactions, '1234', { outputPath: testOutputPath });

    const workbook = XLSX.readFile(testOutputPath);
    const sheet = workbook.Sheets['Transactions'];
    const data = XLSX.utils.sheet_to_json(sheet)[0] as Record<string, unknown>;

    expect(data.AccountCurrency).toBe('EUR');
  });

  it('should handle foreign currency transactions', () => {
    const transactions: Transaction[] = [
      {
        date: new Date('2024-03-15'),
        description: 'AMAZON.COM',
        amount: -45.0,
        originalCurrency: 'USD',
      },
    ];

    generateExcel(transactions, '8204', { outputPath: testOutputPath });

    const workbook = XLSX.readFile(testOutputPath);
    const sheet = workbook.Sheets['Transactions'];
    const data = XLSX.utils.sheet_to_json(sheet)[0] as Record<string, unknown>;

    expect(data.CurrencyCode).toBe('USD');
    expect(data.AccountAmount).toBe(-45.0);
  });

  it('should handle multiple transactions', () => {
    const transactions: Transaction[] = [
      {
        date: new Date('2024-03-10'),
        description: 'STORE 1',
        amount: -20.0,
        originalCurrency: 'EUR',
      },
      {
        date: new Date('2024-03-15'),
        description: 'STORE 2',
        amount: -30.0,
        originalCurrency: 'GBP',
      },
      {
        date: new Date('2024-03-20'),
        description: 'REFUND',
        amount: 15.0,
        originalCurrency: 'EUR',
      },
    ];

    generateExcel(transactions, '5678', { outputPath: testOutputPath });

    const workbook = XLSX.readFile(testOutputPath);
    const sheet = workbook.Sheets['Transactions'];
    const data = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];

    expect(data).toHaveLength(3);
    expect(data[0].Merchant).toBe('STORE 1');
    expect(data[1].CurrencyCode).toBe('GBP');
    expect(data[2].Amount).toBe(15.0);
  });
});
