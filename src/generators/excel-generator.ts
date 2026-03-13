import * as XLSX from 'xlsx';
import type { Transaction, ParserResult } from '../types/transaction.js';

/**
 * Options for Excel generation
 */
export interface ExcelOptions {
  /** Output file path */
  outputPath: string;
  /** Sheet name (default: 'Transactions') */
  sheetName?: string;
}

/**
 * Generate Rydoo-compatible Excel file from transactions
 *
 * Column mapping (Rydoo format):
 * - A: TransactionDate (M/D/YYYY format)
 * - B: Amount
 * - C: Merchant
 * - D: CurrencyCode
 * - E: CardNumber
 * - F: AccountCurrency
 * - G: AccountAmount
 */
export function generateExcel(
  transactions: Transaction[],
  cardNumberFallback: string,
  options: ExcelOptions
): void {
  // Build header rows
  const headerRow1 = [
    'Date of transaction (required)',
    'Original transaction amount (required)',
    'Merchant name (required)',
    'Original currency code (required)',
    'Enter the last four digits of the card ONLY (required)',
    'Billed currency in bank  statement (required)',
    'Billed amount in bank statement (required)',
    'Please do not remove this row or change the order of columns.',
  ];

  const headerRow2 = [
    'TransactionDate',
    'Amount',
    'Merchant',
    'CurrencyCode',
    'CardNumber',
    'AccountCurrency',
    'AccountAmount',
  ];

  // Build row data
  const dataRows = transactions.map((t) => [
    t.date,
    t.amount,
    t.description,
    t.originalCurrency || 'EUR',
    t.cardNumber || cardNumberFallback,
    'EUR',
    t.amount,
  ]);

  // Combine headers and data
  const allRows = [headerRow1, headerRow2, ...dataRows];

  // Create worksheet from Array of Arrays (AOA)
  const worksheet = XLSX.utils.aoa_to_sheet(allRows, { cellDates: true });

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName || 'Transactions');

  // Write to file
  XLSX.writeFile(workbook, options.outputPath);
}

export class ExcelGenerator {
  generate(transactions: Transaction[], cardNumber: string, outputPath: string): void {
    generateExcel(transactions, cardNumber, { outputPath });
  }
}
