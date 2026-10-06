import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const allowed = ['https://trujoedigital.com', 'https://trss.trujoedigital.com'];

const adZoneStart = html.indexOf('<section class="ad-zone"');
assert.ok(adZoneStart !== -1, 'ad zone section exists');
const adZoneRaw = html.slice(adZoneStart, html.indexOf('</section>', adZoneStart));
// Strip HTML comments so swap-point docs (which name the .house-ad block) don't count as markup.
const adZone = adZoneRaw.replace(/<!--[\s\S]*?-->/g, '');

test('ad zone has two labeled slots', () => {
  assert.equal([...adZone.matchAll(/class="ad-slot"/g)].length, 2);
  assert.equal([...adZone.matchAll(/<p class="ad-label">Advertisement<\/p>/g)].length, 2);
});

test('house ad links point only at allowlisted domains', () => {
  const hrefs = [...adZone.matchAll(/class="house-ad"[^>]*href="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(hrefs.length, 2);
  for (const href of hrefs) {
    assert.ok(
      allowed.some((a) => href === a || href.startsWith(a + '/')),
      `unapproved ad href: ${href}`
    );
  }
});

test('ad zone loads no third-party code', () => {
  assert.ok(!/<script/i.test(adZone), 'no scripts in ad zone');
  assert.ok(!/<iframe/i.test(adZone), 'no iframes in ad zone');
  assert.ok(!/<img/i.test(adZone), 'no images in ad zone');
});

test('house ads open safely in a new tab', () => {
  const anchors = [...adZone.matchAll(/<a class="house-ad"[^>]*>/g)].map((m) => m[0]);
  assert.equal(anchors.length, 2);
  for (const a of anchors) {
    assert.ok(a.includes('target="_blank"'), 'house ad opens in new tab');
    assert.ok(a.includes('rel="noopener"'), 'house ad uses rel=noopener');
  }
});

test('ads.txt carries the real publisher ID', async () => {
  const ads = await readFile(new URL('../ads.txt', import.meta.url), 'utf8');
  assert.ok(
    ads.includes('google.com, pub-1942036847459762, DIRECT, f08c47fec0942fa0'),
    'ads.txt has the real DIRECT line'
  );
  assert.ok(!ads.includes('pub-0000000000000000'), 'placeholder publisher ID is gone');
});
