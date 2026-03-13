import { parseDocument } from './src/parsers/bnp-parser.js';
import { ExcelGenerator } from './src/generators/excel-generator.js';
import * as path from 'path';

async function testPhase4() {
  const examplePdf = path.resolve('example_docs/VAN DEN BROECK CHARLOTTE-5480 28XX XXXX 8204-20260205.pdf');
  const outputExcel = path.resolve('example_docs/test_output.xlsx');
  
  console.log('Parsing PDF...');
  const parsed = await parseDocument(examplePdf);
  
  console.log(`Found ${parsed.transactions.length} transactions. Card number: ${parsed.metadata.cardNumber}`);
  
  console.log('Generating Excel...');
  const generator = new ExcelGenerator();
  generator.generate(parsed.transactions, parsed.metadata.cardNumber || '0000', outputExcel);
  
  console.log(`Excel generated at ${outputExcel}`);
}

testPhase4().catch(console.error);
