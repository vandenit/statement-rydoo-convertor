import * as fs from 'fs';
import * as path from 'path';
import { bnpParser } from '../parsers/bnp-parser.js';
import { parsePdf } from '../parsers/pdf-parser.js';
import { ExcelGenerator } from '../generators/excel-generator.js';

import { Transaction } from '../types/transaction.js';

export interface ConversionResult {
  pdfPath: string;
  transactionCount: number;
  cardNumber: string;
  transactions: Transaction[];
  success: boolean;
  statementTotal?: number;
  calculatedTotal?: number;
  isValidTotal?: boolean;
  error?: string;
}

export class StatementConverter {
  /**
   * Parses a single PDF file and returns transactions
   */
  async convert(pdfPath: string): Promise<ConversionResult> {
    const filename = path.basename(pdfPath, '.pdf');
    
    try {
      if (!fs.existsSync(pdfPath)) {
        throw new Error(`File not found: ${pdfPath}`);
      }

      const buffer = fs.readFileSync(pdfPath);
      const pdfContent = await parsePdf(buffer);
      
      // For now we only have BnpParser. In the future, we can add detection logic here.
      const result = await bnpParser.parse(pdfContent);
      
      const calculatedTotal = result.rawTransactions.reduce((sum, t) => sum + t.amount, 0);
      const isValidTotal = result.statementTotal !== undefined 
        ? Math.abs(calculatedTotal - result.statementTotal) < 0.01 
        : true;

      return {
        pdfPath,
        transactionCount: result.rawTransactions.length,
        cardNumber: result.cardNumber,
        transactions: result.rawTransactions,
        statementTotal: result.statementTotal,
        calculatedTotal,
        isValidTotal,
        success: true
      };
    } catch (error: any) {
      return {
        pdfPath,
        transactionCount: 0,
        cardNumber: 'unknown',
        transactions: [],
        success: false,
        error: error.message
      };
    }
  }
}
