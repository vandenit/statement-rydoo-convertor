import imaps, { ImapSimpleOptions, Message } from 'imap-simple';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

export interface EmailConfig {
    user: string;
    password?: string;
    host?: string;
    port?: number;
    mailbox?: string;
    targetEmail?: string;
    processedMailbox?: string;
}

export class EmailFetcher {
    private config: EmailConfig;

    constructor(config: EmailConfig) {
        this.config = config;
    }

    async fetchEmails(inputDir: string): Promise<string[]> {
        const senders: Set<string> = new Set();
        const connectionConfig: ImapSimpleOptions = {
            imap: {
                user: this.config.user,
                password: this.config.password || process.env.EMAIL_PASSWORD || '',
                host: this.config.host || 'imap.fastmail.com',
                port: this.config.port || 993,
                tls: true,
                authTimeout: 10000
            }
        };

        if (!connectionConfig.imap.password) {
            console.warn('[EmailFetcher] No password provided. Skipping email check.');
            return [];
        }

        try {
            console.log(`[EmailFetcher] Connecting to ${connectionConfig.imap.host}...`);
            const connection = await imaps.connect(connectionConfig);
            const boxName = this.config.mailbox || 'INBOX';
            console.log(`[EmailFetcher] Opening mailbox: ${boxName}`);
            await connection.openBox(boxName);

            // If targetEmail is set, search for TO targetEmail. 
            // We search ALL messages in the folder, regardless of read status.
            const searchCriteria: any[] = ['ALL'];
            if (this.config.targetEmail) {
                // IMAP TO search criteria
                searchCriteria.push(['HEADER', 'TO', this.config.targetEmail]);
            }
            
            console.log(`[EmailFetcher] Searching with criteria:`, searchCriteria);
            
            // markSeen: true will mark the email as read after fetching
            const fetchOptions = { bodies: ['HEADER'], struct: true, markSeen: true };
            const messages = await connection.search(searchCriteria, fetchOptions);

            if (messages.length === 0) {
                console.log(`[EmailFetcher] No messages matching criteria.`);
                connection.end();
                return [];
            }

            console.log(`[EmailFetcher] Found ${messages.length} matching messages.`);

            for (const message of messages) {
                const parts = imaps.getParts(message.attributes.struct || []);
                const headerPart = message.parts.find((p: any) => p.which === 'HEADER');
                
                if (headerPart && headerPart.body && headerPart.body.from) {
                    const fromAddr = headerPart.body.from[0];
                    const emailMatch = fromAddr.match(/<([^>]+)>/) || [null, fromAddr];
                    senders.add(emailMatch[1]);
                }

                // Filter for PDF and ZIP attachments
                const attachments = parts.filter((part: any) => 
                    part.disposition && 
                    part.disposition.type.toUpperCase() === 'ATTACHMENT' &&
                    part.disposition.params &&
                    part.disposition.params.filename &&
                    (part.disposition.params.filename.toLowerCase().endsWith('.pdf') || 
                     part.disposition.params.filename.toLowerCase().endsWith('.zip'))
                );

                if (attachments.length === 0) {
                    continue;
                }

                let processedAttachments = 0;

                for (const part of attachments) {
                    const partData = await connection.getPartData(message, part);
                    const filename = part.disposition.params.filename;
                    const cleanFilename = filename.replace(/[^a-z0-9_\-\.]/gi, '_');

                    let contentBuffer: Buffer;
                    if (Buffer.isBuffer(partData)) {
                        contentBuffer = partData;
                    } else if (typeof partData === 'string') {
                        const encoding = (part.encoding || '').toLowerCase();
                        contentBuffer = Buffer.from(partData, encoding === 'base64' ? 'base64' : 'binary');
                    } else {
                        contentBuffer = Buffer.from(partData as any);
                    }

                    if (cleanFilename.toLowerCase().endsWith('.pdf')) {
                        const filePath = path.join(inputDir, `email_${Date.now()}_${cleanFilename}`);
                        fs.writeFileSync(filePath, contentBuffer);
                        console.log(`[EmailFetcher] Saved PDF: ${filePath}`);
                        processedAttachments++;
                    } else if (cleanFilename.toLowerCase().endsWith('.zip')) {
                        console.log(`[EmailFetcher] Extracting ZIP: ${cleanFilename}`);
                        try {
                            const zip = new AdmZip(contentBuffer);
                            const zipEntries = zip.getEntries();
                            for (const zipEntry of zipEntries) {
                                if (!zipEntry.isDirectory && zipEntry.entryName.toLowerCase().endsWith('.pdf')) {
                                    const entryFilename = zipEntry.name.replace(/[^a-z0-9_\-\.]/gi, '_');
                                    const extractedPath = path.join(inputDir, `extracted_${Date.now()}_${entryFilename}`);
                                    fs.writeFileSync(extractedPath, zipEntry.getData());
                                    console.log(`[EmailFetcher] Extracted PDF: ${extractedPath}`);
                                    processedAttachments++;
                                }
                            }
                        } catch (e: any) {
                            console.error(`[EmailFetcher] Failed to extract ZIP ${cleanFilename}: ${e.message}`);
                        }
                    }
                }

                if (processedAttachments > 0 && this.config.processedMailbox) {
                    try {
                        console.log(`[EmailFetcher] Moving message ${message.attributes.uid} to ${this.config.processedMailbox}...`);
                        await connection.moveMessage(message.attributes.uid.toString(), this.config.processedMailbox);
                    } catch (e: any) {
                        console.error(`[EmailFetcher] Failed to move message: ${e.message}`);
                    }
                }
            }
            connection.end();
            console.log(`[EmailFetcher] Finished email check.`);
        } catch (error: any) {
            console.error(`[EmailFetcher] Error: ${error.message}`);
        }

        return Array.from(senders);
    }
}
