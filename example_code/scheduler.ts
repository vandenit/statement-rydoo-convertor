import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { AccountableDestination } from './destinations/accountable';
import { ReceiptSource, ReceiptItem } from './interfaces';
import { loadConfig, Period } from './config';
import { EmailSource, EmailTarget } from './sources/email';
import { loginToAccountable } from './auth';

// Default interval: 2 minutes
const INTERVAL_MS = parseInt(process.env.SCHEDULER_INTERVAL_MS || '120000', 10);
const PID_FILE = path.join(__dirname, '..', 'scheduler.pid');

async function runOnce(): Promise<number> {
    console.log(`[Scheduler] Running at ${new Date().toISOString()}`);
    
    // Load Config
    const config = loadConfig();
    
    let period: Period = { year: 2025, quarter: 4 };
    if (typeof config.period === 'string') {
        console.log(`[Config] Period is string "${config.period}", using default 2025 Q4.`);
    } else {
        period = config.period;
    }

    const targetDir = path.join(
        process.env.RECEIPTS_DIR || './receipts',
        `${period.year}-Q${period.quarter}`
    );
    
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    // Initialize Sources
    const sources: ReceiptSource[] = [];
    const emailTargets: EmailTarget[] = [];
    
    for (const sourceConfig of config.sources) {
        if (!sourceConfig.enabled) continue;
        if (sourceConfig.type === 'email' && sourceConfig.match) {
            emailTargets.push({
                fromPattern: sourceConfig.match.from,
                subjectPattern: sourceConfig.match.subject,
                toPattern: sourceConfig.match.to,
                category: sourceConfig.category || '',
                splitPdf: sourceConfig.splitPdf,
                mailToPdf: sourceConfig.mailToPdf,
                allowImages: sourceConfig.allowImages
            });
        }
    }

    if (emailTargets.length > 0 && config.email?.user) {
        sources.push(new EmailSource({
            ...config.email,
            targets: emailTargets,
            receiptsDir: targetDir,
            mailbox: (config.email as any).mailbox,
            toAddresses: config.toAddresses,
            period: period
        }));
    }

    // Login to Accountable
    const accConfig = config.accountable;
    let authToken = accConfig.authToken;
    
    if (process.env.ACCOUNTABLE_EMAIL && process.env.ACCOUNTABLE_PASSWORD) {
        try {
            const loginResult = await loginToAccountable();
            authToken = loginResult.accessToken;
        } catch (e: any) {
            console.warn('[Auth] Auto-login failed:', e.message);
        }
    }
    
    const destination = new AccountableDestination(
        accConfig.sessionId, 
        accConfig.client, 
        accConfig.context, 
        authToken
    );

    // Fetch and Upload
    let totalItems = 0;
    for (const source of sources) {
        const items = await source.fetchReceipts();
        totalItems += items.length;
        for (const item of items) {
            await destination.uploadReceipt(item);
        }
    }
    
    console.log(`[Scheduler] Processed ${totalItems} items.`);
    return totalItems;
}

async function startScheduler() {
    // Write PID file
    fs.writeFileSync(PID_FILE, process.pid.toString());
    console.log(`[Scheduler] Started with PID ${process.pid}`);
    console.log(`[Scheduler] Interval: ${INTERVAL_MS / 1000} seconds`);
    console.log(`[Scheduler] PID file: ${PID_FILE}`);
    console.log(`[Scheduler] Stop with: npm run scheduler:stop`);
    
    // Run immediately
    await runOnce();
    
    // Then run on interval
    setInterval(async () => {
        try {
            await runOnce();
        } catch (e: any) {
            console.error('[Scheduler] Error:', e.message);
        }
    }, INTERVAL_MS);
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('[Scheduler] Received SIGTERM, shutting down...');
    if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('[Scheduler] Received SIGINT, shutting down...');
    if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
    process.exit(0);
});

startScheduler().catch(e => {
    console.error('[Scheduler] Fatal error:', e.message);
    if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
    process.exit(1);
});
