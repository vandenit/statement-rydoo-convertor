import { describe, it, expect } from 'vitest';
import { StatementConverter } from './orchestrator/converter.js';
import * as path from 'path';

describe('StatementConverter validation fix', () => {
  const converter = new StatementConverter();

  it('should validate the problematic BNP statement correctly', async () => {
    const pdfPath = '/home/filip/Downloads/04_RAPTIS SOTIRIOS-5481 08XX XXXX 5795-20260405.pdf';
    const result = await converter.convert(pdfPath);
    
    console.log('Conversion Result:', {
        success: result.success,
        isValidTotal: result.isValidTotal,
        transactionCount: result.transactionCount,
        statementTotal: result.statementTotal,
        calculatedTotal: result.calculatedTotal
    });

    expect(result.success).toBe(true);
    expect(result.isValidTotal).toBe(true);
    expect(result.transactionCount).toBe(58);
  });
});
