import { PDFParse } from 'pdf-parse';
import { PdfContent, PdfPage } from '../types/pdf.js';

/**
 * PDF Parser Module
 *
 * Provides text extraction from PDF buffers with page-level support.
 * Uses pdf-parse library v2.x with class-based API.
 */

/**
 * Parse a PDF buffer and extract text content
 *
 * @param buffer - PDF file buffer
 * @returns Promise<PdfContent> - Structured PDF content with page information
 * @throws Error if PDF parsing fails
 */
export async function parsePdf(buffer: Buffer): Promise<PdfContent> {
  let parser: PDFParse | undefined;

  try {
    // Create parser instance with the PDF buffer
    parser = new PDFParse({ data: buffer });

    // Extract text from all pages
    const textResult = await parser.getText({
      // Get all pages (partial: undefined means all pages)
    });

    // Build page array from text result
    const pages: PdfPage[] = [];

    if (textResult.pages && textResult.pages.length > 0) {
      // Use per-page text if available
      for (const pageResult of textResult.pages) {
        pages.push({
          pageNumber: pageResult.num,
          text: pageResult.text,
        });
      }
    } else {
      // Fallback: single page with full text
      pages.push({
        pageNumber: 1,
        text: textResult.text,
      });
    }

    // Get document info
    const infoResult = await parser.getInfo();

    const content: PdfContent = {
      text: textResult.text,
      pages,
      numPages: pages.length,
      info: {
        Title: infoResult.info?.Title,
        Author: infoResult.info?.Author,
        Subject: infoResult.info?.Subject,
        Creator: infoResult.info?.Creator,
        Producer: infoResult.info?.Producer,
        CreationDate: infoResult.info?.CreationDate,
        ModDate: infoResult.info?.ModDate,
      },
    };

    return content;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to parse PDF: ${message}`);
  } finally {
    // Clean up parser resources
    if (parser) {
      await parser.destroy();
    }
  }
}

// Re-export types for convenience
export { PdfContent, PdfPage } from '../types/pdf.js';
