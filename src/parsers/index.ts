/**
 * Parsers Module Index
 *
 * Central export point for all parser functionality.
 *
 * Usage:
 *   import { parsePdf, PdfContent } from './parsers';
 *
 * Or specific imports:
 *   import { parsePdf } from './parsers/pdf-parser';
 *   import { PdfContent, PdfPage } from './types/pdf';
 */

// Export PDF parser functionality
export { parsePdf, PdfContent, PdfPage } from './pdf-parser.js';

// Re-export types for convenience
export { PdfContent as PdfContentType, PdfPage as PdfPageType } from '../types/pdf.js';
