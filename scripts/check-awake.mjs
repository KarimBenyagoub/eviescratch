import { chromium } from 'playwright-core';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const browser = await chromium.launch({
  executablePath: resolve(root, '.local-qa/browsers/chromium-1255/chrome-win64/chrome.exe'),
  headless: true
});

const page = await browser.newPage();
await page.goto('http://127.0.0.1:5173/');
await page.waitForTimeout(500);

await page.getByRole('button', { name: 'Skip for now' }).click();
await page.waitForTimeout(1000);

await page.getByRole('button', { name: /^Untitled note/ }).first().click();
await page.waitForTimeout(1000);

const p = page.locator('.companion-cat .evie-portrait');

console.log('Starting 12s monitoring loop...');
const events = [];
for (let t = 0; t < 60; t++) {
  const blink = await p.getAttribute('data-blink');
  const yawn = await p.getAttribute('data-yawning');
  const tail = await p.getAttribute('data-tail');
  const inner = await p.evaluate(el => el.innerHTML);
  const stateStr = `blink=${blink}, yawn=${yawn}, tail=${tail}, hasImg=${inner.includes('<img')}`;
  if (events.length === 0 || events[events.length - 1].state !== stateStr) {
    console.log(`t=${(t * 0.2).toFixed(1)}s: ${stateStr}`);
    events.push({ t: (t * 0.2).toFixed(1), state: stateStr });
    await p.screenshot({ path: resolve(root, `assets/mascot/live_t${t}.png`) });
  }
  await page.waitForTimeout(200);
}

console.log('Finished monitoring.');
await browser.close();
