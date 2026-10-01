import { readFile } from 'node:fs/promises';

const sourceFiles = ['index.html', 'js/app.js', 'js/randomizer.js', 'js/ocr.js', 'js/export.js'];
// Privacy intent: no trackers, analytics, or data exfiltration. Truman's own
// domains are allowlisted so the site can link out to his own properties
// (footer brand link, ad-contact links, house-ad creatives) without tripping the gate.
const allowedExternalDomains = ['https://trujoedigital.com', 'https://trss.trujoedigital.com'];
const forbidden = [
  ['localStorage', /\blocalStorage\b/],
  ['sessionStorage', /\bsessionStorage\b/],
  ['IndexedDB direct use', /\bindexedDB\b/],
  ['XMLHttpRequest', /\bXMLHttpRequest\b/],
  ['WebSocket', /\bWebSocket\b/],
  ['Beacon API', /\bsendBeacon\b/]
];

function findUnapprovedUrls(text) {
  const urls = [...text.matchAll(/https?:\/\/[^\s"'<>()`]+/g)].map((m) => m[0]);
  return urls.filter(
    (u) => !allowedExternalDomains.some((a) => u === a || u.startsWith(a + '/'))
  );
}

let failed = false;

for (const file of sourceFiles) {
  const text = await readFile(file, 'utf8');
  for (const [label, pattern] of forbidden) {
    if (pattern.test(text)) {
      console.error(`Privacy audit failed: ${label} found in ${file}`);
      failed = true;
    }
  }
  const bad = findUnapprovedUrls(text);
  if (bad.length) {
    console.error(`Privacy audit failed: unapproved external URL(s) in ${file}: ${bad.join(', ')}`);
    failed = true;
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
