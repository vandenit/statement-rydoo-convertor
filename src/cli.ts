#!/usr/bin/env node

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
    const inputDir = path.resolve(options.input);
    const outputDir = path.resolve(options.output);
    const processedDir = path.resolve(options.processed);

    // Ensure directories exist
    [inputDir, outputDir, processedDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    const files = fs.readdirSync(inputDir).filter(f => f.toLowerCase().endsWith('.pdf'));

    if (files.length === 0) {
      console.log('No PDF files found in input directory.');
      return;
    }

    console.log(`Found ${files.length} files to process.`);
    const converter = new StatementConverter();
    const allTransactions = [];
    let successCount = 0;

    for (const file of files) {
      const pdfPath = path.join(inputDir, file);
      console.log(`Processing: ${file}...`);
      
      const result = await converter.convert(pdfPath, outputDir);

      if (result.success) {
        console.log(`  ✓ Extracted ${result.transactionCount} transactions.`);
        allTransactions.push(...result.transactions);
        successCount++;
        // Move to processed
        const targetPath = path.join(processedDir, file);
        fs.renameSync(pdfPath, targetPath);
      } else {
        console.error(`  ✗ Error: ${result.error}`);
      }
    }

    if (allTransactions.length > 0) {
      // Sort by date (ascending)
      allTransactions.sort((a, b) => a.date.getTime() - b.date.getTime());

      // Generate single output filename with run date
      const today = new Date().toISOString().split('T')[0];
      const outputFilename = `statements-${today}.xlsx`;
      const outputPath = path.join(outputDir, outputFilename);

      console.log(`\nGenerating aggregated Excel: ${outputFilename}...`);
      const generator = new ExcelGenerator();
      // Use the first transaction's card number as fallback if needed
      const fallbackCard = allTransactions[0].cardNumber || 'unknown';
      generator.generate(allTransactions, fallbackCard, outputPath);
      console.log(`  ✓ Created ${outputFilename} with ${allTransactions.length} total transactions.`);
    }

    // Summary
    console.log('\n--- Summary ---');
    console.log(`Total PDF files: ${files.length}`);
    console.log(`Successfully processed: ${successCount}`);
    console.log(`Failed:                 ${files.length - successCount}`);
    console.log('----------------\n');
  });

program.parse();
