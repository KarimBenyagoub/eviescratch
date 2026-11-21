import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const excluded = new Set(['node_modules', 'dist', '.git', '.npm-cache', '.local-qa', 'test-results', 'playwright-report', 'coverage']);

async function markdownFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (excluded.has(entry.name)) continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await markdownFiles(path));
    else if (/\.md$/i.test(entry.name)) files.push(path);
  }
  return files;
}

let links = 0;
const files = await markdownFiles(root);
for (const path of files) {
  const text = await readFile(path, 'utf8');
  for (const match of text.matchAll(/\]\(([^\s)]+)\)/g)) {
    const target = match[1];
    if (/^(?:https?:|mailto:|#)/i.test(target)) continue;
    const local = decodeURIComponent(target.split('#')[0]);
    if (!local) continue;
    await access(resolve(dirname(path), local)).catch(() => {
      throw new Error(`Broken local link in ${path}: ${target}`);
    });
    links++;
  }
}

function luminance(hex) {
  const rgb = hex.replace('#', '').match(/../g).map(value => parseInt(value, 16) / 255);
  const linear = rgb.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function contrast(a, b) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

const css = await readFile(resolve(root, 'src/styles/tokens.css'), 'utf8');
const pairs = [
  ['text', 'surface', 4.5], ['text', 'canvas', 4.5],
  ['muted', 'surface', 4.5], ['muted', 'canvas', 4.5],
  ['accent', 'surface', 4.5], ['on-accent', 'accent', 4.5],
  ['ginger', 'surface', 4.5], ['ginger', 'canvas', 4.5],
  ['control-border', 'surface', 3], ['focus', 'canvas', 3],
  ['focus', 'surface', 3],
];
for (const mode of ['normal', 'pixel']) {
  const block = css.match(new RegExp(`:root\\[data-theme="${mode}"\\]\\s*\\{([^}]+)\\}`));
  assert.ok(block, `Missing theme ${mode}`);
  const tokens = Object.fromEntries([...block[1].matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)].map(match => [match[1], match[2]]));
  let minimum = Infinity;
  for (const [foreground, background, required] of pairs) {
    assert.ok(tokens[foreground] && tokens[background], `Missing ${mode} token: ${foreground}/${background}`);
    const ratio = contrast(tokens[foreground], tokens[background]);
    assert.ok(ratio >= required, `${mode} ${foreground}/${background}: ${ratio.toFixed(2)} < ${required}`);
    minimum = Math.min(minimum, ratio);
  }
  console.log(`${mode}: ${pairs.length} essential contrast pairs passed (lowest ${minimum.toFixed(2)}:1).`);
}
console.log(`${files.length} Markdown files checked; ${links} local links resolved. External links and full accessibility require separate review.`);
