import imaps, { ImapSimpleOptions } from 'imap-simple';
import { simpleParser } from 'mailparser';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { ReceiptSource, ReceiptItem } from '../interfaces';
import { Period } from '../config';

export interface EmailTarget {
    fromPattern?: string; // Regex string
    subjectPattern?: string; // Regex string
    toPattern?: string; // Regex string for TO address matching
    category: string;
    splitPdf?: boolean;
    mailToPdf?: boolean; // Convert email body to PDF if no PDF attachment
    allowImages?: boolean; // Process image attachments (JPG/PNG)
}

export interface EmailConfig {
    user: string;
    password?: string; // If not provided, try env
    host?: string; // Default imap.fastmail.com
    port?: number;
    mailbox?: string; // e.g. "INBOX" or "invoices to enter"
    targets: EmailTarget[];
    receiptsDir: string;
    toAddresses?: string[]; // Filter: only process emails addressed to these
    period: Period;
}

export class EmailSource implements ReceiptSource {
    name = 'Email (IMAP)';
    private config: EmailConfig;

    constructor(config: EmailConfig) {
        this.config = config;
    }

    async fetchReceipts(): Promise<ReceiptItem[]> {
        const results: ReceiptItem[] = [];
        const config: ImapSimpleOptions = {
            imap: {
                user: this.config.user,
                password: this.config.password || process.env.EMAIL_PASSWORD || '',
                host: this.config.host || 'imap.fastmail.com',
                port: this.config.port || 993,
                tls: true,
                authTimeout: 10000
            }
        };

        if (!config.imap.password) {
            console.warn('[Email] No password provided for email source. Skipping.');
            return [];
        }

        console.log(`[Email] Connecting to ${config.imap.host} as ${config.imap.user}...`);

        try {
            const connection = await imaps.connect(config);
            const boxName = this.config.mailbox || 'INBOX';
            console.log(`[Email] Opening mailbox: "${boxName}"...`);
            await connection.openBox(boxName);

            // Calculate dates based on period
            const year = this.config.period.year;
            const quarter = this.config.period.quarter;
            
            const startMonth = (quarter - 1) * 3; // 0-based
            const startDate = new Date(year, startMonth, 1);
            
            const endMonth = startMonth + 3;
            // Date constructor handles rollover to next year if month > 11
            const endDate = new Date(year, endMonth, 1);
            
            const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
            
            const sinceStr = `${months[startDate.getMonth()]} ${String(startDate.getDate()).padStart(2, '0')} ${startDate.getFullYear()}`;
            const beforeStr = `${months[endDate.getMonth()]} ${String(endDate.getDate()).padStart(2, '0')} ${endDate.getFullYear()}`;

            console.log(`[Email] Seaching emails from ${sinceStr} to ${beforeStr}`);

            const searchCriteria = [
                ['SINCE', sinceStr],
                ['BEFORE', beforeStr]
            ];

            const fetchOptions = {
                bodies: ['HEADER', 'TEXT', ''],
                struct: true
            };

            const messages = await connection.search(searchCriteria, fetchOptions);
            console.log(`[Email] Found ${messages.length} messages in ${this.config.period.year} Q${this.config.period.quarter}.`);

            for (const message of messages) {
                const headerPart = message.parts.find((p: any) => p.which === 'HEADER');
                if (!headerPart) continue;

                const headers = headerPart.body;
                const from = Array.isArray(headers.from) ? headers.from[0] : headers.from; 
                const subject = headers.subject ? headers.subject[0] : '(No Subject)';
                const date = headers.date ? new Date(headers.date[0]) : new Date();
                const to = Array.isArray(headers.to) ? headers.to[0] : headers.to;

                // Filter by toAddresses if configured
                if (this.config.toAddresses && this.config.toAddresses.length > 0) {
                    const toMatches = this.config.toAddresses.some(addr => 
                        to && to.toLowerCase().includes(addr.toLowerCase())
                    );
                    if (!toMatches) {
                        continue; // Skip this email, not addressed to us
                    }
                }

                let matchedTarget: EmailTarget | null = null;
                
                for (const target of this.config.targets) {
                    let fromMatch = true;
                    let subjectMatch = true;
                    let toMatch = true;

                    if (target.fromPattern) {
                         const regex = new RegExp(target.fromPattern, 'i');
                         fromMatch = regex.test(from);
                    }
                    if (target.subjectPattern) {
                         const regex = new RegExp(target.subjectPattern, 'i');
                         subjectMatch = regex.test(subject);
                    }
                    if (target.toPattern) {
                         const regex = new RegExp(target.toPattern, 'i');
                         toMatch = to ? regex.test(to) : false;
                    }

                    if (fromMatch && subjectMatch && toMatch) {
                        matchedTarget = target;
                        break; 
                    }
                }

                if (matchedTarget) {
                    console.log(`[Email] MATCH CONFIRMED: "${subject}" -> Category: ${matchedTarget.category || '(Auto)'}`);
                    
                    const messageUid = String(message.attributes.uid);
                    const messageSubject = subject;

                    // Create a shared move function for this message
                    const moveEmailToProcessed = async () => {
                        try {
                            // Reconnect to move the email (connection may have closed)
                            const moveConn = await imaps.connect(config);
                            await moveConn.openBox(boxName);
                            console.log(`[Email] Moving message "${messageSubject}" to "invoices_auto_processed"...`);
                            await moveConn.moveMessage(messageUid, 'invoices_auto_processed');
                            console.log(`[Email] Message moved successfully.`);
                            moveConn.end();
                        } catch (e: any) {
                            console.error(`[Email] Failed to move message: ${e.message}`);
                        }
                    };

                    const struct = message.attributes.struct || [];
                    const parts = imaps.getParts(struct);
                    const attachmentParts = parts.filter(part => 
                        part.disposition && 
                        (part.disposition.type.toUpperCase() === 'ATTACHMENT' || part.disposition.type.toUpperCase() === 'INLINE') &&
                        part.disposition.params && 
                        part.disposition.params.filename &&
                        (
                            part.disposition.params.filename.toLowerCase().endsWith('.pdf') ||
                            (matchedTarget.allowImages && /\.(jpg|jpeg|png)$/i.test(part.disposition.params.filename))
                        )
                    );

                    // --- NEW: Check for Links in Body ---
                    let linkPdfs: { buffer: Buffer, filename: string }[] = [];
                    
                    // define helper to extract links
                    const extractLinks = (text: string): string[] => {
                        const linkRegex = /(https?:\/\/[^\s<>"']+)/g;
                        const links: string[] = [];
                        let match;
                        while ((match = linkRegex.exec(text)) !== null) {
                            links.push(match[1]);
                        }
                        return links;
                    };

                    try {
                        const fullBodyPart = message.parts.find((p: any) => p.which === '');
                        const fullBody = fullBodyPart ? fullBodyPart.body : '';
                        
                        if (fullBody) {
                             const parsed = await simpleParser(fullBody);
                             const textContent = parsed.text || (typeof parsed.html === 'string' ? parsed.html : '') || '';
                             const links = extractLinks(textContent);
                             
                             if (links.length > 0) {
                                 console.log(`[Email] Found ${links.length} links in "${subject}". Checking for PDFs...`);
                                 
                                 for (const link of links) {
                                     try {
                                         // 1. HEAD request to check content-type
                                         try {
                                            const headRes = await axios.head(link, { timeout: 5000 });
                                            const contentType = headRes.headers['content-type'] || '';
                                            
                                            if (contentType.toLowerCase().includes('application/pdf')) {
                                                console.log(`[Email] Found PDF link: ${link}`);
                                                // 2. GET request to download
                                                const getRes = await axios.get(link, { responseType: 'arraybuffer', timeout: 10000 });
                                                const buffer = Buffer.from(getRes.data);
                                                const filename = `link_${Date.now()}_${path.basename(link).substring(0, 30)}.pdf`.replace(/[^a-z0-9_\-\.]/gi, '_');
                                                linkPdfs.push({ buffer, filename });
                                            }
                                         } catch (err: any) { 
                                            // ignore errors for specific links (timeouts, 404s, etc)
                                            // console.warn(`[Email] Failed to check link ${link}: ${err.message}`);
                                         }
                                     } catch (e) {
                                         // general error
                                     }
                                 }
                             }
                        }
                    } catch (e: any) {
                        console.warn(`[Email] Error extraction links from body: ${e.message}`);
                    }
                    
                    if (linkPdfs.length > 0) {
                        console.log(`[Email] Downloaded ${linkPdfs.length} PDFs from links.`);
                    }
                    // --- END NEW ---

                    if (attachmentParts.length === 0 && linkPdfs.length === 0) {
                         console.log(`[Debug] No attachments or PDF links found for "${subject}". Available parts:`);
                         parts.forEach(p => {
                             console.log(` - Part: ${p.partID} type=${p.type} subtype=${p.subtype} disposition=${JSON.stringify(p.disposition)} id=${p.id}`);
                         });
                    }

                    if (attachmentParts.length > 0 || linkPdfs.length > 0) {
                        console.log(`[Email] Processing ${attachmentParts.length} attachments and ${linkPdfs.length} link-pdfs for "${subject}"`);
                        
                        for (const part of attachmentParts) {
                            const partData = await connection.getPartData(message, part);
                            let baseFilename = part.disposition!.params!.filename;
                            baseFilename = baseFilename.replace(/[^a-z0-9_\-\.]/gi, '_');

                            if (matchedTarget!.splitPdf && baseFilename.toLowerCase().endsWith('.pdf')) {
                                console.log(`[Email] Splitting PDF: ${baseFilename}`);
                                try {
                                    const pdfDoc = await PDFDocument.load(partData);
                                    for (let i = 0; i < pdfDoc.getPageCount(); i++) {
                                        const newPdf = await PDFDocument.create();
                                        const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
                                        newPdf.addPage(copiedPage);
                                        const pdfBytes = await newPdf.save();

                                        const splitFilename = baseFilename.replace(/\.pdf$/i, `_p${i + 1}.pdf`);
                                        // Skip saving to disk
                                        
                                        results.push({
                                            content: Buffer.from(pdfBytes), // pdf-lib returns Uint8Array, convert to Buffer
                                            filename: splitFilename,
                                            mimeType: 'application/pdf',
                                            metadata: { 
                                                category: matchedTarget!.category || undefined, 
                                                date: date, 
                                                description: `Email: ${subject} (Page ${i+1})`,
                                                emailUid: messageUid
                                            },
                                            onSuccess: moveEmailToProcessed
                                        });
                                    }
                                } catch (e: any) {
                                    console.error(`[Email] Failed to split PDF ${baseFilename}:`, e.message);
                                }
                            } else {
                                // imap-simple can return a string (base64-encoded) for binary parts
                                // depending on the Content-Transfer-Encoding. Always ensure we have a Buffer.
                                let contentBuffer: Buffer;
                                if (Buffer.isBuffer(partData)) {
                                    contentBuffer = partData;
                                } else if (typeof partData === 'string') {
                                    // If the encoding is base64, decode it; otherwise treat as binary string
                                    const encoding = (part.encoding || '').toLowerCase();
                                    if (encoding === 'base64') {
                                        contentBuffer = Buffer.from(partData, 'base64');
                                    } else {
                                        contentBuffer = Buffer.from(partData, 'binary');
                                    }
                                } else {
                                    contentBuffer = Buffer.from(partData as any);
                                }

                                const lowerFilename = baseFilename.toLowerCase();
                                let detectedMimeType: string | undefined;
                                if (lowerFilename.endsWith('.jpg') || lowerFilename.endsWith('.jpeg')) {
                                    detectedMimeType = 'image/jpeg';
                                } else if (lowerFilename.endsWith('.png')) {
                                    detectedMimeType = 'image/png';
                                } else if (lowerFilename.endsWith('.pdf')) {
                                    detectedMimeType = 'application/pdf';
                                }

                                console.log(`[Email] Attachment "${baseFilename}" - ${contentBuffer.length} bytes, mimeType: ${detectedMimeType || 'unknown'}`);

                                results.push({
                                    content: contentBuffer,
                                    filename: baseFilename,
                                    mimeType: detectedMimeType,
                                    metadata: {
                                        category: matchedTarget!.category || undefined,
                                        date: date,
                                        description: `Email: ${subject}`,
                                        emailUid: messageUid
                                    },
                                    onSuccess: moveEmailToProcessed
                                });
                            }
                        }

                        // Process Linked PDFs
                        // Process Linked PDFs
                        for (const pdfItem of linkPdfs) {
                             results.push({
                                 content: pdfItem.buffer,
                                 filename: pdfItem.filename,
                                 mimeType: 'application/pdf',
                                 metadata: {
                                     category: matchedTarget!.category || undefined,
                                     date: date,
                                     description: `Email Link: ${subject}`,
                                     emailUid: messageUid
                                 },
                                 onSuccess: moveEmailToProcessed
                             });
                        }
                    } else {
                        // Match but no PDF attachment and mailToPdf not enabled - move to mismatch folder
                        const messageUid = String(message.attributes.uid);
                        try {
                            console.log(`[Email] MATCH but NO PDF: "${subject}" - moving to mismatch_invoices`);
                            await connection.moveMessage(messageUid, 'mismatch_invoices');
                        } catch (e: any) {
                            console.error(`[Email] Failed to move email without PDF: ${e.message}`);
                        }
                    }
                } else {
                    // No match - move to mismatch folder so it doesn't keep appearing
                    const messageUid = String(message.attributes.uid);
                    try {
                        console.log(`[Email] NO MATCH: "${subject}" - moving to mismatch_invoices`);
                        await connection.moveMessage(messageUid, 'mismatch_invoices');
                    } catch (e: any) {
                        console.error(`[Email] Failed to move mismatched email: ${e.message}`);
                    }
                }
            }

            connection.end();
        } catch (error: any) {
            console.error('[Email] Error:', error.message);
        }

        return results;
    }
}


