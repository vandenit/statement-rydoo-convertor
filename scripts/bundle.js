import * as esbuild from 'esbuild';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function bundle() {
  console.log('Bundling application...');
  
  await esbuild.build({
    entryPoints: [path.resolve(__dirname, '../src/cli.ts')],
    bundle: true,
    platform: 'node',
    target: 'node20',
    outfile: path.resolve(__dirname, '../dist/bundle.cjs'),
    format: 'cjs',
    minify: false,
    sourcemap: true,
    mainFields: ['module', 'main'],
    external: ['pdf-parse', 'xlsx', 'commander'],
    // We bundle everything except large/problematic libraries
  });
  
  console.log('Bundle created at dist/bundle.cjs');
}

bundle().catch(err => {
  console.error(err);
  process.exit(1);
});
