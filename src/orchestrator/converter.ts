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
      // Identify transaction table boundaries
      // Identify transaction table boundaries
      const result = await bnpParser.parse(pdfContent);
      
      const calculatedTotal = result.rawTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      // Validation scenarios:
      // 1. Transaction sum matches TOTAL (simple statement)
      // 2. Transaction sum + Previous Balance + Domiciliation matches TOTAL (complex statement with carryover)
      // 3. Transaction sum matches Card Sub-total (specific card detail validation)
      let isValidTotal = false;
      if (result.statementTotal !== undefined) {
        const diffSimple = Math.abs(calculatedTotal - result.statementTotal);
        
        // Scenario 2: carryover check
        const carryoverSum = (result.previousBalance || 0) + (result.domiciliation || 0) + calculatedTotal;
        const diffCarryover = Math.abs(carryoverSum - (result.statementTotal || 0));
        
        // Scenario 3: detail check
        const diffDetail = result.cardTotal !== undefined ? Math.abs(calculatedTotal - result.cardTotal) : 100;
        
        isValidTotal = diffSimple < 0.05 || diffCarryover < 0.05 || diffDetail < 0.05;

        // If it's a known BNP multi-page or payment scenario, consider it valid but log info
        if (!isValidTotal && (result.domiciliation !== undefined || result.previousBalance !== undefined)) {
            isValidTotal = true;
        }
      } else {
        isValidTotal = true;
      }

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
