import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import { EmailFetcher, EmailConfig } from './email/fetcher.js';
import { EmailSender } from './email/sender.js';
import { StatementConverter } from './orchestrator/converter.js';
import { ExcelGenerator } from './generators/excel-generator.js';

const CONFIG_PATH = path.join(process.cwd(), 'config.yaml');
const INPUT_DIR = path.join(process.cwd(), 'input');
const OUTPUT_DIR = path.join(process.cwd(), 'output');
const PROCESSED_DIR = path.join(process.cwd(), 'processed'); // Added just in case

// Ensure directories exist
[INPUT_DIR, OUTPUT_DIR, PROCESSED_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function loadConfig(): any {
    if (!fs.existsSync(CONFIG_PATH)) {
        console.error(`[Bot] Missing config file: ${CONFIG_PATH}`);
        return null;
    }
    const file = fs.readFileSync(CONFIG_PATH, 'utf8');
    return yaml.parse(file);
}

export async function checkEmails() {
    const config = loadConfig();
    if (!config || !config.email) return;

    const fetcher = new EmailFetcher(config.email);
    const sender = new EmailSender(config.email);
    const templateAlias = config.postmark?.template || 'statements-available';

    console.log(`\n[Bot] Checking for new statements at ${new Date().toISOString()}`);
    
    // 1. Fetch emails and ZIPs
    const senders = await fetcher.fetchEmails(INPUT_DIR);
    
    // Check if any files are in the input directory
    const files = fs.readdirSync(INPUT_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));
    
    if (files.length === 0) {
        console.log('[Bot] No PDFs found to process.');
        return;
    }

    // Default sender if we didn't extract one reliably
    if (senders.length === 0) senders.push(config.email.user);

    // 2. Process all PDFs
    console.log(`[Bot] Found ${files.length} PDFs to process. Starting conversion...`);
    const converter = new StatementConverter();
    const allTransactions = [];
    const cardNumbers = new Set<string>();
    let grandTotal = 0;
    const fileSummaries = [];

    for (const file of files) {
        const filePath = path.join(INPUT_DIR, file);
        const result = await converter.convert(filePath);
        
        if (result.success) {
            allTransactions.push(...result.transactions);
            const fileTotal = result.calculatedTotal || 0;
            grandTotal += fileTotal;

            fileSummaries.push({
                filename: file,
                transactionCount: result.transactions.length,
                calculatedTotal: fileTotal.toFixed(2)
            });

            if (result.transactions.length > 0 && result.transactions[0].cardNumber) {
                cardNumbers.add(result.transactions[0].cardNumber);
            }
            console.log(`✅ [Bot] Processed ${file}: ${result.transactions.length} transactions`);
            fs.unlinkSync(filePath);
        } else {
            console.error(`❌ [Bot] Failed to convert ${file}: ${result.error}`);
        }
    }

    if (allTransactions.length === 0) {
        console.log('[Bot] ⚠️ No transactions extracted from PDFs.');
        return;
    }

    allTransactions.sort((a, b) => a.date.getTime() - b.date.getTime());

    // 3. Generate Excel
    const dateStr = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const excelPath = path.join(OUTPUT_DIR, `rydoo-${dateStr}.xlsx`);
    const generator = new ExcelGenerator();
    const cardSummary = Array.from(cardNumbers).join(', ') || 'Unknown';
    generator.generate(allTransactions, cardSummary, excelPath);

    console.log(`✅ [Bot] Excel generated: ${excelPath}`);

    // 4. Send email back with Postmark Summary
    const summary = {
        transactionCount: allTransactions.length,
        grandTotal: grandTotal,
        cards: cardSummary,
        files: fileSummaries
    };

    for (const toAddress of senders) {
        await sender.sendExcel(toAddress, excelPath, summary, templateAlias);
    }

    // 5. Cleanup
    try {
        fs.unlinkSync(excelPath);
        console.log(`[Bot] Cleaned up Excel file.`);
    } catch (e) {
        console.error(`[Bot] Failed to cleanup Excel file: ${e}`);
    }
}

// Start bot
const INTERVAL_MS = parseInt(process.env.BOT_INTERVAL_MS || '30000', 10); // Default 30s for testing
const PID_FILE = path.join(process.cwd(), 'bot.pid');

async function startBot() {
    // Write PID file
    fs.writeFileSync(PID_FILE, process.pid.toString());
    console.log(`[Bot] Started with PID ${process.pid}`);
    console.log(`[Bot] Checking every ${INTERVAL_MS / 1000} seconds...`);
    console.log(`[Bot] PID file: ${PID_FILE}`);
    console.log(`[Bot] Stop with: npm run bot:stop`);
    
    // Run once immediately
    await checkEmails().catch(e => console.error('[Bot] Startup error:', e));
    
    // Then run on interval
    setInterval(async () => {
        try {
            await checkEmails();
        } catch (e: any) {
            console.error('[Bot] Interval Error:', e.message);
        }
    }, INTERVAL_MS);
}

// Handle graceful shutdown
function shutdown(signal: string) {
    console.log(`[Bot] Received ${signal}, shutting down...`);
    if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
    process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startBot().catch(e => {
    console.error('[Bot] Fatal error:', e.message);
    if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
    process.exit(1);
});
