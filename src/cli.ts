#!/usr/bin/env node

import { Command } from 'commander';
import { convertStatement } from './index.js';

const program = new Command();

program
  .name('statement-convertor')
  .description('Convert bank statement PDFs to Excel format')
  .version('0.1.0');

program
  .option('-i, --input <path>', 'PDF input file or directory')
  .option('-o, --output <path>', 'Output Excel file', 'output/converted.xlsx')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('-b, --bank <bank>', 'Bank type (bnp, etc.)', 'bnp')
  .action(async (options) => {
    if (options.verbose) {
      console.log('Options:', options);
    }
    
    if (!options.input) {
      console.error('Error: Input path is required');
      process.exit(1);
    }

    await convertStatement(options.input, options.output);
  });

program.parse();
