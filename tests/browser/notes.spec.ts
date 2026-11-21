import { test, expect, type Page } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';

const body = (page: Page) => page.getByRole('textbox', { name: 'Note body', exact: true });
const saved = (page: Page) => expect(page.locator('.save-status')).toHaveText('Saved on this device');
async function changeTheme(page: Page, name: string) {
  const inline = page.getByRole('group', { name: 'Appearance', exact: true }).getByRole('button', { name, exact: true });
  if (await inline.isVisible()) { await inline.click(); return; }
  await page.getByRole('button', { name: 'Open app menu', exact: true }).click();
  await page.getByRole('dialog', { name: 'Your library', exact: true }).getByRole('button', { name: 'Settings', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Settings', exact: true });
  await dialog.getByRole('button', { name, exact: true }).click();
  await dialog.getByRole('button', { name: 'Close dialog' }).click();
}
async function selectBodyText(page: Page) {
  await body(page).click();
  // Desktop WebKit's mobile emulation has no iOS selection handles or Select All menu.
  // Set a real DOM selection, then test that toolbar/theme interactions preserve it.
  await body(page).evaluate(element => {
    const range = document.createRange();
    // Text endpoints avoid WebKit including the paragraph's trailing block breaks.
    const text = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const first = text.nextNode()!;
    let last = first;
    for (let next = text.nextNode(); next; next = text.nextNode()) last = next;
    range.setStart(first, 0);
    range.setEnd(last, last.textContent!.length);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  });
  expect(await page.evaluate(() => getSelection()?.toString())).toBe(await body(page).textContent());
}
async function showList(page: Page) {
  const back = page.getByRole('button', { name: 'Notes', exact: true });
  if (await back.isVisible()) await back.click();
}
async function storedNotes(page: Page) {
  return page.evaluate(async () => new Promise<{ title: string; revision: number; document: unknown }[]>((resolve, reject) => {
    const request = indexedDB.open('eviescratch');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction('notes', 'readonly');
      const read = transaction.objectStore('notes').getAll();
      read.onsuccess = () => { resolve(read.result); db.close(); };
      read.onerror = () => { reject(read.error); db.close(); };
    };
  }));
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('eviescratch.app-mode', 'normal');
    if (!localStorage.getItem('eviescratch.preferences')) localStorage.setItem('eviescratch.preferences', JSON.stringify({ onboarded: true, guide: 0 }));
  });
  await page.goto('/#home');
  await page.getByRole('button', { name: /^Untitled note A fresh page/ }).first().click();
  await expect(body(page)).toBeVisible();
});

test('commits Unicode text and formatting, then recovers it after reload', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Note title', exact: true }).fill('Little things · 思い出 🐈');
  await body(page).fill('Remember the café and the little ginger cat.');
  await selectBodyText(page);
  expect(await page.evaluate(() => getSelection()?.toString())).toBe('Remember the café and the little ginger cat.');
  await page.getByRole('button', { name: 'Bold', exact: true }).click();
  await expect(body(page).locator('strong')).toContainText('Remember the café');
  await saved(page);
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Note title', exact: true })).toHaveValue('Little things · 思い出 🐈');
  await expect(body(page).locator('strong')).toContainText('Remember the café');
  await saved(page);
});

test('creates and edits while offline after load, then reopens committed notes', async ({ page, context }) => {
  await context.setOffline(true);
  await body(page).fill('A thought captured without a connection.');
  await saved(page);
  await showList(page);
  await page.getByRole('button', { name: 'New note', exact: true }).click();
  await page.getByRole('textbox', { name: 'Note title', exact: true }).fill('Offline second note');
  await body(page).fill('Still writing offline.');
  await saved(page);
  await context.setOffline(false);
  await page.reload();
  await expect(body(page)).toContainText('Still writing offline.');
  expect(await storedNotes(page)).toHaveLength(2);
});

test('preserves selection, focus, and undo when appearance changes', async ({ page }) => {
  await body(page).fill('A small thought worth keeping.');
  await selectBodyText(page);
  await page.getByRole('button', { name: 'Bold', exact: true }).click();
  await expect(body(page).locator('strong')).toContainText('A small thought worth keeping.');
  const selected = await page.evaluate(() => window.getSelection()?.toString());
  expect(selected).toBe('A small thought worth keeping.');
  await changeTheme(page, 'Pixel Art');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'pixel');
  await expect(body(page)).toBeFocused();
  expect(await page.evaluate(() => window.getSelection()?.toString())).toBe(selected);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(body(page).locator('strong')).toHaveCount(0);
  await changeTheme(page, 'Normal');
  await expect(body(page)).toBeFocused();
  await saved(page);
});

test('failed writes never claim Saved and a downloaded draft contains the unsaved text', async ({ page }) => {
  await body(page).fill('Last committed words.');
  await saved(page);
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args: Parameters<IDBObjectStore['put']>) {
      if (this.name === 'notes') throw new DOMException('Injected storage failure', 'QuotaExceededError');
      return original.apply(this, args);
    };
    (window as unknown as { restoreWrites: () => void }).restoreWrites = () => { IDBObjectStore.prototype.put = original; };
  });
  await body(page).fill('Unsaved words must stay available.');
  await expect(page.locator('.save-status')).toHaveText('Save failed');
  expect(JSON.stringify(await storedNotes(page))).toContain('Last committed words.');
  expect(JSON.stringify(await storedNotes(page))).not.toContain('Unsaved words');
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download draft', exact: true }).click();
  const download = await downloading;
  expect(await readFile((await download.path())!, 'utf8')).toContain('Unsaved words must stay available.');
  await page.evaluate(() => { (window as unknown as { restoreWrites: () => void }).restoreWrites(); });
  await page.getByRole('button', { name: 'Retry save', exact: true }).click();
  await saved(page);
  await page.reload();
  await expect(body(page)).toContainText('Unsaved words must stay available.');
});

test('a stale tab preserves its draft and does not overwrite a newer note', async ({ page, context }) => {
  const second = await context.newPage();
  await second.goto(page.url());
  await expect(body(second)).toBeVisible();
  await body(page).fill('First tab committed this.');
  await saved(page);
  await body(second).fill('Second tab needs to keep this draft.');
  await expect(second.locator('.save-status')).toHaveText('Save failed');
  await expect(second.getByText('This note changed in another tab.', { exact: false })).toBeVisible();
  expect(JSON.stringify(await storedNotes(page))).toContain('First tab committed this.');
  expect(JSON.stringify(await storedNotes(page))).not.toContain('Second tab needs');
  await second.close();
});

test('corrupt data shows recovery controls and exports the original record', async ({ page }) => {
  await page.evaluate(async () => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('eviescratch');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction('notes', 'readwrite');
      const store = transaction.objectStore('notes');
      const read = store.getAll();
      read.onsuccess = () => { store.put({ ...read.result[0], document: { schemaVersion: 1, content: { type: 'unknown-node', text: 'Keep original bytes' } } }); };
      transaction.oncomplete = () => { db.close(); resolve(); };
      transaction.onerror = () => { db.close(); reject(transaction.error); };
    };
  }));
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Let’s keep your notes safe.' })).toBeVisible();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download recovery snapshot' }).click();
  const download = await downloading;
  const snapshot = JSON.parse(await readFile((await download.path())!, 'utf8'));
  expect(snapshot.stores.notes[0].document.content.text).toBe('Keep original bytes');
  expect(await storedNotes(page)).toHaveLength(1);
});

test('both appearances fit small phones, tablets, and desktop without page overflow', async ({ page }, testInfo) => {
  await mkdir('.local-qa/screenshots', { recursive: true });
  for (const width of [320, 360, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    for (const theme of ['Pixel Art', 'Normal']) {
      await changeTheme(page, theme);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await expect(body(page)).toBeVisible();
      const box = await page.getByRole('textbox', { name: 'Note title', exact: true }).boundingBox();
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);
      const toolbar = await page.getByRole('group', { name: 'Text formatting' }).boundingBox();
      expect(toolbar!.y + toolbar!.height).toBeLessThanOrEqual(844);
      if (width === 390 || width === 1280) {
        await page.screenshot({ path: `.local-qa/screenshots/${testInfo.project.name}-${theme === 'Normal' ? 'normal' : 'pixel'}-${width}.png` });
      }
    }
  }
});

test('checklists and mobile list navigation preserve each note', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Note title', exact: true }).fill('A small checklist');
  await body(page).fill('Bring a notebook');
  await page.getByRole('button', { name: 'Checklist', exact: true }).click();
  await page.getByRole('checkbox').check();
  await saved(page);
  await showList(page);
  await page.getByRole('button', { name: 'New note', exact: true }).click();
  await body(page).fill('Another little thought');
  await saved(page);
  await showList(page);
  await page.getByRole('button', { name: /^A small checklist/ }).click();
  await expect(page.getByRole('checkbox')).toBeChecked();
  await expect(body(page)).toContainText('Bring a notebook');
});

test('a shorter mobile viewport keeps formatting and save status reachable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 430 });
  await body(page).fill('Writing with less room.');
  await body(page).press('End');
  await body(page).pressSequentially(' Still here.');
  await saved(page);
  await expect(page.getByRole('group', { name: 'Text formatting' })).toBeVisible();
  const toolbar = await page.getByRole('group', { name: 'Text formatting' }).boundingBox();
  expect(toolbar!.y + toolbar!.height).toBeLessThanOrEqual(430);
  await expect(body(page)).toBeFocused();
});
