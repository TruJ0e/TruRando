import { cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const dist = join(root, 'dist');
const vendor = join(dist, 'vendor', 'tesseract');
const coreTarget = join(vendor, 'core');
const langTarget = join(vendor, 'lang');

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const path of ['index.html', 'css', 'js', 'PRIVACY.md']) {
  await cp(join(root, path), join(dist, path), { recursive: true });
}

await writeFile(join(dist, '.nojekyll'), '');

await mkdir(coreTarget, { recursive: true });
await mkdir(langTarget, { recursive: true });

await cp(
  join(root, 'node_modules', 'tesseract.js', 'dist', 'tesseract.min.js'),
  join(vendor, 'tesseract.min.js')
);
await cp(
  join(root, 'node_modules', 'tesseract.js', 'dist', 'worker.min.js'),
  join(vendor, 'worker.min.js')
);

const coreSource = join(root, 'node_modules', 'tesseract.js-core');
const coreFiles = await readdir(coreSource);
for (const file of coreFiles) {
  if (/^tesseract-core.*\.(?:js|wasm)$/.test(file)) {
    await cp(join(coreSource, file), join(coreTarget, file));
  }
}

await cp(
  join(root, 'node_modules', '@tesseract.js-data', 'eng', '4.0.0_best_int', 'eng.traineddata.gz'),
  join(langTarget, 'eng.traineddata.gz')
);

await cp(join(root, 'node_modules', 'tesseract.js', 'LICENSE.md'), join(vendor, 'tesseract-js-LICENSE.md'));
await cp(join(root, 'node_modules', 'tesseract.js-core', 'LICENSE'), join(vendor, 'tesseract-js-core-LICENSE'));

console.log('Built dist/ with self-hosted OCR assets.');
