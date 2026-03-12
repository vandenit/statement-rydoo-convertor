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
  cardNumber: string,
  options: ExcelOptions
): void {
  // Format date as M/D/YYYY (e.g., "3/12/2024")
  const formatDate = (date: Date): string => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // Build row data
  const rows = transactions.map((t) => ({
    TransactionDate: formatDate(t.date),
    Amount: t.amount,
    Merchant: t.description,
    CurrencyCode: t.originalCurrency || 'EUR',
    CardNumber: cardNumber,
    AccountCurrency: 'EUR',
    AccountAmount: t.amount,
  }));

  // Create workbook and worksheet
  const worksheet = XLSX.utils.json_to_sheet(rows);
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
