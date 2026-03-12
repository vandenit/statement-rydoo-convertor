/**
 * BNP Parser Integration Tests
 *
 * Tests for transaction extraction including:
 * - Date, description, and amount parsing
 * - Foreign currency transactions
 * - Multi-line transactions (exchange rates)
 * - Positive amounts (refunds)
 * - Edge cases and error handling
 */

import { describe, it, expect } from 'vitest';
import { BnpParser } from './bnp-parser.js';
import { PdfContent } from '../types/pdf.js';
import { Transaction } from '../types/transaction.js';

describe('BnpParser', () => {
  const parser = new BnpParser();

  describe('canParse', () => {
    it('should recognize BNP Paribas Fortis PDFs', () => {
      const content: PdfContent = {
        text: 'BNP Paribas Fortis\nNuméro de carte 5480 28XX XXXX 8204',
        pages: [],
        numPages: 1,
      };
      expect(parser.canParse(content)).toBe(true);
    });

    it('should recognize bpost bank variants', () => {
      const content: PdfContent = {
        text: 'bpost bank\nNuméro de carte 5480 28XX XXXX 8204',
        pages: [],
        numPages: 1,
      };
      expect(parser.canParse(content)).toBe(true);
    });

    it('should reject non-BNP PDFs', () => {
      const content: PdfContent = {
        text: 'Some other bank\nCard number: 1234 5678 9012 3456',
        pages: [],
        numPages: 1,
      };
      expect(parser.canParse(content)).toBe(false);
    });
  });

  describe('parse', () => {
    it('should extract card number from BNP PDF', async () => {
      const pdfText = `
BNP Paribas Fortis
Numéro de carte 5480 28XX XXXX 8204

Date de transaction | Description | Montant en euros
12 mars 2024 | AMAZON EU SARL | -19,00

SOLDE ACTUEL
`;
      const content: PdfContent = {
        text: pdfText,
        pages: [],
        numPages: 1,
      };

      const result = await parser.parse(content);
      expect(result.cardNumber).toBe('8204');
    });

    it('should extract transactions with dates, descriptions, amounts', async () => {
      const pdfText = `
BNP Paribas Fortis
Numéro de carte 5480 28XX XXXX 8204

Date de transaction | Description | Montant en euros
12 mars 2024 | AMAZON EU SARL | -19,00
15 mars 2024 | Carrefour Market | -45,30
20 mars 2024 | Uber *TRIP HELP.uber.com | -12,50

SOLDE ACTUEL
`;
      const content: PdfContent = {
        text: pdfText,
        numPages: 1,
        pages: [],
      };

      const result = await parser.parse(content);

      expect(result.rawTransactions).toHaveLength(3);

      // First transaction
      expect(result.rawTransactions[0]).toMatchObject({
        date: new Date(2024, 2, 12), // March 12, 2024
        description: 'AMAZON EU SARL',
        amount: -19.0,
      });

      // Second transaction
      expect(result.rawTransactions[1]).toMatchObject({
        date: new Date(2024, 2, 15), // March 15, 2024
        description: 'Carrefour Market',
        amount: -45.3,
      });

      // Third transaction
      expect(result.rawTransactions[2]).toMatchObject({
        date: new Date(2024, 2, 20), // March 20, 2024
        description: 'Uber *TRIP HELP.uber.com',
        amount: -12.5,
      });
    });

    it('should handle foreign currency transactions', async () => {
      const pdfText = `
BNP Paribas Fortis
Numéro de carte 5480 28XX XXXX 8204

Date de transaction | Description | Montant en euros
12 mars 2024 | LOCAL STORE | -19,00
15 mars 2024 | FOREIGN STORE | -45,00 USD
20 mars 2024 | NORMAL PURCHASE | -12,50

SOLDE ACTUEL
`;
      const content: PdfContent = {
        text: pdfText,
        numPages: 1,
        pages: [],
      };

      const result = await parser.parse(content);

      expect(result.rawTransactions).toHaveLength(3);

      // Foreign currency transaction
      expect(result.rawTransactions[1]).toMatchObject({
        date: new Date(2024, 2, 15),
        description: 'FOREIGN STORE',
        amount: -45.0,
        originalCurrency: 'USD',
      });
    });

    it('should skip exchange rate lines', async () => {
      const pdfText = `
BNP Paribas Fortis
Numéro de carte 5480 28XX XXXX 8204

Date de transaction | Description | Montant en euros
15 mars 2024 | FOREIGN STORE | -45,00 USD
Taux: 1.08
20 mars 2024 | NORMAL PURCHASE | -12,50

SOLDE ACTUEL
`;
      const content: PdfContent = {
        text: pdfText,
        numPages: 1,
        pages: [],
      };

      const result = await parser.parse(content);

      // Should have 2 transactions, not 3
      expect(result.rawTransactions).toHaveLength(2);

      // Foreign transaction should still have currency
      expect(result.rawTransactions[0]).toMatchObject({
        description: 'FOREIGN STORE',
        amount: -45.0,
        originalCurrency: 'USD',
      });

      // Normal transaction
      expect(result.rawTransactions[1]).toMatchObject({
        description: 'NORMAL PURCHASE',
        amount: -12.5,
      });
    });

    it('should handle multi-line descriptions', async () => {
      const pdfText = `
BNP Paribas Fortis
Numéro de carte 5480 28XX XXXX 8204

Date de transaction | Description | Montant en euros
12 mars 2024 | SUPERMARKET CHAIN STORE LOC 12345 | -89,50
15 mars 2024 | Online Payment - Merchant ID: 123456789 | -25,00

SOLDE ACTUEL
`;
      const content: PdfContent = {
        text: pdfText,
        numPages: 1,
        pages: [],
      };

      const result = await parser.parse(content);

      expect(result.rawTransactions).toHaveLength(2);
      expect(result.rawTransactions[0].description).toBe('SUPERMARKET CHAIN STORE LOC 12345');
      expect(result.rawTransactions[1].description).toBe('Online Payment - Merchant ID: 123456789');
    });

    it('should handle positive amounts (refunds)', async () => {
      const pdfText = `
BNP Paribas Fortis
Numéro de carte 5480 28XX XXXX 8204

Date de transaction | Description | Montant en euros
12 mars 2024 | PURCHASE | -50,00
15 mars 2024 | REFUND | 25,00

SOLDE ACTUEL
`;
      const content: PdfContent = {
        text: pdfText,
        numPages: 1,
        pages: [],
      };

      const result = await parser.parse(content);

      expect(result.rawTransactions).toHaveLength(2);
      expect(result.rawTransactions[0].amount).toBe(-50.0);
      expect(result.rawTransactions[1].amount).toBe(25.0);
    });

    it('should handle amounts with space thousand separators', async () => {
      const pdfText = `
BNP Paribas Fortis
Numéro de carte 5480 28XX XXXX 8204

Date de transaction | Description | Montant en euros
12 mars 2024 | LARGE PURCHASE | -1 234,56
15 mars 2024 | HUGE PURCHASE | -12 345,67

SOLDE ACTUEL
`;
      const content: PdfContent = {
        text: pdfText,
        numPages: 1,
        pages: [],
      };

      const result = await parser.parse(content);

      expect(result.rawTransactions).toHaveLength(2);
      expect(result.rawTransactions[0].amount).toBe(-1234.56);
      expect(result.rawTransactions[1].amount).toBe(-12345.67);
    });

    it('should handle various currency codes', async () => {
      const pdfText = `
BNP Paribas Fortis
Numéro de carte 5480 28XX XXXX 8204

Date de transaction | Description | Montant en euros
12 mars 2024 | USD PURCHASE | -45,00 USD
13 mars 2024 | GBP PURCHASE | -30,00 GBP
14 mars 2024 | CHF PURCHASE | -55,00 CHF
15 mars 2024 | EUR PURCHASE | -20,00 EUR

SOLDE ACTUEL
`;
      const content: PdfContent = {
        text: pdfText,
        numPages: 1,
        pages: [],
      };

      const result = await parser.parse(content);

      expect(result.rawTransactions).toHaveLength(4);
      expect(result.rawTransactions[0].originalCurrency).toBe('USD');
      expect(result.rawTransactions[1].originalCurrency).toBe('GBP');
      expect(result.rawTransactions[2].originalCurrency).toBe('CHF');
      expect(result.rawTransactions[3].originalCurrency).toBe('EUR');
    });

    it('should stop at footer markers', async () => {
      const pdfText = `
BNP Paribas Fortis
Numéro de carte 5480 28XX XXXX 8204

Date de transaction | Description | Montant en euros
12 mars 2024 | PURCHASE 1 | -10,00
15 mars 2024 | PURCHASE 2 | -20,00

TOTAL DES DEPENSES
Some other text that should be ignored
`;
      const content: PdfContent = {
        text: pdfText,
        numPages: 1,
        pages: [],
      };

      const result = await parser.parse(content);

      expect(result.rawTransactions).toHaveLength(2);
    });

    it('should handle empty transaction tables', async () => {
      const pdfText = `
BNP Paribas Fortis
Numéro de carte 5480 28XX XXXX 8204

Date de transaction | Description | Montant en euros

SOLDE ACTUEL
`;
      const content: PdfContent = {
        text: pdfText,
        numPages: 1,
        pages: [],
      };

      const result = await parser.parse(content);

      expect(result.rawTransactions).toHaveLength(0);
    });

    it('should throw error if card number not found', async () => {
      const content: PdfContent = {
        text: 'Some random text without card number',
        numPages: 1,
        pages: [],
      };

      await expect(parser.parse(content)).rejects.toThrow('Failed to extract card number');
    });

    it('should throw error if transaction table not found', async () => {
      const content: PdfContent = {
        text: 'BNP Paribas Fortis\nNuméro de carte 5480 28XX XXXX 8204\nNo transaction table here',
        numPages: 1,
        pages: [],
      };

      await expect(parser.parse(content)).rejects.toThrow('Failed to identify transaction table');
    });
  });

  describe('getDebugInfo', () => {
    it('should return debug information', () => {
      const content: PdfContent = {
        text: `
BNP Paribas Fortis
Numéro de carte 5480 28XX XXXX 8204
Date de transaction | Description | Montant en euros
12 mars 2024 | TEST | -10,00
SOLDE ACTUEL
`,
        numPages: 1,
        pages: [],
      };

      const debugInfo = parser.getDebugInfo(content);

      expect(debugInfo.canParse).toBe(true);
      expect(debugInfo.cardNumber?.lastFour).toBe('8204');
      expect(debugInfo.tableBounds).not.toBeNull();
      expect(debugInfo.textLength).toBeGreaterThan(0);
    });
  });
});

describe('BnpParser - Real-world scenarios', () => {
  const parser = new BnpParser();

  it('should handle typical BNP statement format', async () => {
    const realisticPdfText = `
BNP PARIBAS FORTIS

Numéro de carte 5480 28XX XXXX 8204

Date de transaction | Description | Montant en euros
05 mars 2024 | DELHAIZE BRUSSELS STORE 001 | -67,43
08 mars 2024 | SHELL SERVICE STATION BRUSSELS | -55,00
10 mars 2024 | AMAZON EU SARL | -19,99
12 mars 2024 | COLRUYT BRUSSELS | -123,45
15 mars 2024 | HOTEL BOOKING.COM | -189,00 USD
Taux: 1.0823
18 mars 2024 | CARREFOUR MARKET | -45,67
20 mars 2024 | STIB/MIVB | -2,50

SOLDE ACTUEL
Prochain relevé
`;

    const content: PdfContent = {
      text: realisticPdfText,
      numPages: 1,
      pages: [],
    };

    const result = await parser.parse(content);

    expect(result.cardNumber).toBe('8204');
    expect(result.rawTransactions).toHaveLength(7);

    // Check foreign currency transaction
    const foreignTx = result.rawTransactions.find((tx) => tx.description.includes('HOTEL'));
    expect(foreignTx).toBeDefined();
    expect(foreignTx?.amount).toBe(-189.0);
    expect(foreignTx?.originalCurrency).toBe('USD');

    // Check regular transactions
    const amazonTx = result.rawTransactions.find((tx) => tx.description.includes('AMAZON'));
    expect(amazonTx?.amount).toBe(-19.99);
  });

  it('should handle statement with refunds and foreign transactions', async () => {
    const pdfText = `
BNP Paribas Fortis
Numéro de carte 5480 28XX XXXX 8204

Date de transaction | Description | Montant en euros
01 mars 2024 | INITIAL PURCHASE | -100,00
05 mars 2024 | FOREIGN SHOP NYC | -250,00 USD
Taux : 1.0850
10 mars 2024 | REFUND FOR RETURN | 50,00
15 mars 2024 | ANOTHER FOREIGN | -75,50 GBP
Taux : 1.1650

TOTAL DES DEPENSES
`;

    const content: PdfContent = {
      text: pdfText,
      numPages: 1,
      pages: [],
    };

    const result = await parser.parse(content);

    expect(result.rawTransactions).toHaveLength(4);

    // Check refund
    const refundTx = result.rawTransactions.find((tx) => tx.amount > 0);
    expect(refundTx?.description).toBe('REFUND FOR RETURN');
    expect(refundTx?.amount).toBe(50.0);

    // Check foreign currencies
    const usdTx = result.rawTransactions.find((tx) => tx.originalCurrency === 'USD');
    expect(usdTx?.amount).toBe(-250.0);

    const gbpTx = result.rawTransactions.find((tx) => tx.originalCurrency === 'GBP');
    expect(gbpTx?.amount).toBe(-75.5);
  });
});
