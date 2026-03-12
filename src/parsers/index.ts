/**
 * Parsers Module Index
 *
 * Central export point for all parser functionality.
 *
 * Usage:
 *   import { parsePdf, PdfContent, BnpParser, BaseParser } from './parsers';
 *
 * Or specific imports:
 *   import { parsePdf } from './parsers/pdf-parser';
 *   import { BnpParser, bnpParser } from './parsers/bnp-parser';
 *   import { PdfContent, PdfPage } from './types/pdf';
 */

// Export PDF parser functionality
export { parsePdf, PdfContent, PdfPage } from './pdf-parser.js';

// Export base parser and types
export {
  BaseParser,
  ParserResult,
  RawTransaction,
  TransactionTableBounds,
  CardNumberInfo,
} from './base-parser.js';

// Export BNP parser
export { BnpParser, bnpParser } from './bnp-parser.js';

// Re-export types for convenience
export { PdfContent as PdfContentType, PdfPage as PdfPageType } from '../types/pdf.js';
export {
  RawTransaction as RawTransactionType,
  ParserResult as ParserResultType,
  CardNumberInfo as CardNumberInfoType,
  TransactionTableBounds as TransactionTableBoundsType,
} from '../types/transaction.js';
