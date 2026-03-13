#!/usr/bin/env node

import './polyfills.js';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { StatementConverter } from './orchestrator/converter.js';
import { ExcelGenerator } from './generators/excel-generator.js';

const program = new Command();

program
  .name('statement-convertor')
  .description('Convert bank statement PDFs to Excel format')
  .version('0.1.0');

program
  .option('-i, --input <path>', 'Input folder (default: input/)', 'input')
  .option('-o, --output <path>', 'Output folder (default: output/)', 'output')
  .option('-p, --processed <path>', 'Processed folder (default: processed/)', 'processed')
  .option('-b, --bank <bank>', 'Bank type (bnp, etc.)', 'bnp')
  .action(async (options) => {
    try {
      const inputPath = path.resolve(options.input);
      const outputPath = path.resolve(options.output);
      const processedPath = path.resolve(options.processed);

      // Create folders if they don't exist
      for (const p of [inputPath, outputPath, processedPath]) {
        if (!fs.existsSync(p)) {
          fs.mkdirSync(p, { recursive: true });
        }
      }

      console.log(`🔍 Scanning ${inputPath} for PDF files...`);

      const files = fs.readdirSync(inputPath).filter(f => f.toLowerCase().endsWith('.pdf'));

      if (files.length === 0) {
        console.log('❌ No PDF files found in input folder.');
        return;
      }

      console.log(`📄 Found ${files.length} files. Starting conversion...`);

      const converter = new StatementConverter();
      const allTransactions = [];
      const cardNumbers = new Set<string>();

      for (const file of files) {
        const filePath = path.join(inputPath, file);
        const result = await converter.convert(filePath);
        
        if (result.success) {
          allTransactions.push(...result.transactions);
          if (result.transactions.length > 0 && result.transactions[0].cardNumber) {
            cardNumbers.add(result.transactions[0].cardNumber);
          }
          
          // Move processed file
          fs.renameSync(filePath, path.join(processedPath, file));
        } else {
          console.error(`❌ Failed to convert ${file}: ${result.error}`);
        }
      }

      if (allTransactions.length === 0) {
        console.log('⚠️ No transactions found in any of the files.');
        return;
      }

      // Sort transactions by date (ascending)
      allTransactions.sort((a, b) => a.date.getTime() - b.date.getTime());

      // Generate single Excel file with run date in name
      const dateStr = new Date().toISOString().split('T')[0];
      const excelPath = path.join(outputPath, `statements-${dateStr}.xlsx`);
      
      const generator = new ExcelGenerator();
      generator.generate(allTransactions, excelPath);

      console.log('\n--- Summary ---');
      console.log(`✅ Success! Generated: ${excelPath}`);
      console.log(`📊 Total transactions: ${allTransactions.length}`);
      console.log(`💳 Cards found: ${Array.from(cardNumbers).join(', ') || 'Unknown'}`);
      console.log('----------------\n');

    } catch (error) {
      console.error(`💥 Fatal error: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

program.parse(process.argv);
