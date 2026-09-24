import { readFile } from 'node:fs/promises';

const sourceFiles = ['index.html', 'js/app.js', 'js/randomizer.js', 'js/ocr.js', 'js/export.js'];
const forbidden = [
  ['localStorage', /\blocalStorage\b/],
  ['sessionStorage', /\bsessionStorage\b/],
  ['IndexedDB direct use', /\bindexedDB\b/],
  ['XMLHttpRequest', /\bXMLHttpRequest\b/],
  ['WebSocket', /\bWebSocket\b/],
  ['Beacon API', /\bsendBeacon\b/],
  ['external URL', /https?:\/\//]
];

let failed = false;

for (const file of sourceFiles) {
  const text = await readFile(file, 'utf8');
  for (const [label, pattern] of forbidden) {
    if (pattern.test(text)) {
      console.error(`Privacy audit failed: ${label} found in ${file}`);
      failed = true;
    }
  }
}

const ocr = await readFile('js/ocr.js', 'utf8');
if (!/cacheMethod:\s*['"]none['"]/.test(ocr)) {
  console.error('Privacy audit failed: OCR persistent cache is not explicitly disabled.');
  failed = true;
}

const html = await readFile('index.html', 'utf8');
if (!/connect-src 'self'/.test(html)) {
  console.error("Privacy audit failed: CSP does not restrict connect-src to 'self'.");
  failed = true;
}

if (failed) process.exit(1);
console.log('Privacy audit passed.');
