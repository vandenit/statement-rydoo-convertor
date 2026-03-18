import { ServerClient } from 'postmark';
import { EmailConfig } from './fetcher.js';
import fs from 'fs';
import path from 'path';

export interface FileSummary {
    filename: string;
    transactionCount: number;
    calculatedTotal: string;
}

export interface StatementSummary {
    transactionCount: number;
    grandTotal: number;
    cards: string;
    files: FileSummary[];
}

export class EmailSender {
    private client: ServerClient;
    private fromEmail: string;

    constructor(config: EmailConfig) {
        this.fromEmail = config.user; // Fastmail/Sender email must match Postmark Sender Signature
        
        const token = process.env.POSTMARK_API_TOKEN || process.env.POSTMARK_API_KEY;
        if (!token) {
            console.error('[EmailSender] POSTMARK_API_KEY environment variable is not set');
        }
        
        this.client = new ServerClient(token || 'dummy');
    }

    async sendExcel(toAddress: string, excelFilePath: string, summary: StatementSummary, templateAlias: string): Promise<boolean> {
        if (!fs.existsSync(excelFilePath)) {
            console.error(`[EmailSender] File not found: ${excelFilePath}`);
            return false;
        }

        const filename = path.basename(excelFilePath);
        const fileContent = fs.readFileSync(excelFilePath).toString('base64');
        
        console.log(`[EmailSender] Sending ${filename} via Postmark template '${templateAlias}' to ${toAddress}...`);

        try {
            const response = await this.client.sendEmailWithTemplate({
                From: this.fromEmail,
                To: toAddress,
                TemplateAlias: templateAlias,
                TemplateModel: {
                    date: new Date().toLocaleDateString('nl-BE'),
                    transactionCount: summary.transactionCount,
                    grandTotal: summary.grandTotal.toFixed(2),
                    cards: summary.cards,
                    files: summary.files
                },
                Attachments: [
                    {
                        Name: filename,
                        Content: fileContent,
                        ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        ContentID: `cid:${filename}`
                    }
                ]
            });
            console.log(`[EmailSender] Template sent successfully to ${toAddress} (MessageID: ${response.MessageID})`);
            return true;
        } catch (error: any) {
            console.error(`[EmailSender] Failed to send email via Postmark:`, error.message);
            return false;
        }
    }
}
