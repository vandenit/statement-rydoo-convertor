// @ts-ignore - pdf-parse v1 has limited ESM type support but the functional API is stable
import pdf from 'pdf-parse';
import { PdfContent, PdfPage } from '../types/pdf.js';

/**
 * PDF Parser Module
 *
 * Provides text extraction from PDF buffers.
 * Uses stable pdf-parse v1.1.1 which is compatible with pkg and Node 18.
 */

/**
 * Parse a PDF buffer and extract text content
 *
 * @param buffer - PDF file buffer
 * @returns Promise<PdfContent> - Structured PDF content
 * @throws Error if PDF parsing fails
 */
export async function parsePdf(buffer: Buffer): Promise<PdfContent> {
  try {
    // pdf-parse v1 API is a simple function
    const data = await (pdf as any)(buffer);

    const pages: PdfPage[] = [
      {
        pageNumber: 1,
        text: data.text,
      },
    ];

    const content: PdfContent = {
      text: data.text,
      pages,
      numPages: data.numpages,
      info: {
        Title: data.info?.Title,
        Author: data.info?.Author,
        Subject: data.info?.Subject,
        Creator: data.info?.Creator,
        Producer: data.info?.Producer,
        CreationDate: data.info?.CreationDate,
        ModDate: data.info?.ModDate,
      },
    };

    return content;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to parse PDF: ${message}`);
  }
}

// Re-export types for convenience
export { PdfContent, PdfPage } from '../types/pdf.js';
