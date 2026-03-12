/**
 * PDF Content Type Definitions
 *
 * Types for PDF text extraction with page-level information.
 * Supports PARSE-03: Handle multi-page PDFs
 */

/**
 * Represents a single page of PDF content
 */
export interface PdfPage {
  /** 1-based page number */
  pageNumber: number;
  /** Text content of this page */
  text: string;
}

/**
 * Represents the complete content extracted from a PDF
 */
export interface PdfContent {
  /** Full concatenated text from all pages */
  text: string;
  /** Per-page text array for multi-page support */
  pages: PdfPage[];
  /** Total number of pages */
  numPages: number;
  /** PDF metadata (optional) */
  info?: {
    Title?: string;
    Author?: string;
    Subject?: string;
    Creator?: string;
    Producer?: string;
    CreationDate?: string;
    ModDate?: string;
  };
}
