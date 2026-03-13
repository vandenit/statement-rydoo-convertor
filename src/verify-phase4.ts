import { bnpParser } from './parsers/bnp-parser.js';
import { parsePdf } from './parsers/pdf-parser.js';
import { ExcelGenerator } from './generators/excel-generator.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verify() {
  const projectRoot = path.resolve(__dirname, '..');
  const pdfPath = path.join(projectRoot, 'example_docs/VAN DEN BROECK CHARLOTTE-5480 28XX XXXX 8204-20260205.pdf');
  const excelPath = path.join(projectRoot, 'output/verification-output.xlsx');

  console.log('--- Phase 4 Verification ---');
  console.log(`Loading PDF: ${pdfPath}`);
  
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`PDF not found at ${pdfPath}`);
  }

  const buffer = fs.readFileSync(pdfPath);
  console.log('Parsing PDF text...');
  const pdfContent = await parsePdf(buffer);
  
  console.log('--- Extracted Text Preview (First 2000 chars) ---');
  console.log(pdfContent.text.substring(0, 2000));
  console.log('------------------------------------------------');
  
  console.log('Extracting data with BnpParser...');
  const result = await bnpParser.parse(pdfContent);
  
  console.log(`Card Number: ${result.cardNumber}`);
  console.log(`Transactions found: ${result.rawTransactions.length}`);
  
  if (result.rawTransactions.length === 0) {
    console.warn('Warning: No transactions extracted. Check if the PDF format has changed.');
  } else {
    console.log('First Transaction Sample:', result.rawTransactions[0]);
  }

  console.log(`Generating Excel: ${excelPath}`);
  const generator = new ExcelGenerator();
  generator.generate(result.rawTransactions, result.cardNumber, excelPath);
  console.log('Excel generated.');
  
  console.log('Validating Excel content...');
  // Handle ESM vs CJS import differences for xlsx
  const x: any = XLSX;
  const rf = x.readFile || (x.default && x.default.readFile);
  const ut = x.utils || (x.default && x.default.utils);
  
  if (!rf) {
    console.error('Could not find readFile in XLSX module. Module structure:', Object.keys(x));
    throw new Error('XLSX.readFile is not a function');
  }

  console.log('Reading generated file...');
  const workbook = rf(excelPath);
  console.log('SheetNames:', workbook.SheetNames);
  const sheet = workbook.Sheets['Transactions'];
  const data = ut.sheet_to_json(sheet) as any[];
  
  console.log(`Excel contains ${data.length} rows.`);
  if (data.length > 0) {
    console.log('First Excel Row:', data[0]);
    
    // Check required columns
    const columns = Object.keys(data[0]);
    const requiredColumns = [
      'TransactionDate',
      'Amount',
      'Merchant',
      'CurrencyCode',
      'CardNumber',
      'AccountCurrency',
      'AccountAmount'
    ];
    
    const missing = requiredColumns.filter(c => !columns.includes(c));
    if (missing.length > 0) {
      console.error('Missing columns:', missing);
    } else {
      console.log('All required columns are present.');
    }
  }

  console.log('Success! Verification output created and validated.');
  console.log('---------------------------');
}

verify().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
