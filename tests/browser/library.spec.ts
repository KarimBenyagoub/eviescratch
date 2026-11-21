import { test, expect, type Page } from '@playwright/test';
const body = (page: Page) => page.getByRole('textbox', { name: 'Note body', exact: true });
const saved = (page: Page) => expect(page.locator('.save-status')).toHaveText('Saved on this device');
async function list(page: Page) {
  await expect(page.locator('.editor-pane')).toHaveAttribute('aria-busy', 'false');
  const back = page.getByRole('button', { name: 'Notes', exact: true });
  if (await back.isVisible()) await back.click();
}
async function journals(page: Page) {
  const desktop = page.getByRole('navigation', { name: 'Library navigation' }).getByRole('button', { name: 'Journals & Shelves', exact: true });
  if (await desktop.isVisible()) await desktop.click();
  else { await list(page); await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'Journals', exact: true }).click(); }
  await expect(page.getByRole('heading', { name: 'Your Journals', exact: true })).toBeVisible();
}
async function view(page: Page, name: string) {
  const desktop = page.getByRole('navigation', { name: 'Library navigation' }).getByRole('button', { name, exact: true });
  if (await desktop.isVisible()) await desktop.click();
  else {
    await list(page);
    await page.getByRole('button', { name: 'Open app menu', exact: true }).click();
    await page.getByRole('dialog', { name: 'Your library' }).getByRole('button', { name, exact: true }).click();
  }
}
async function settings(page: Page) {
  await page.getByRole('button', { name: 'Open app menu', exact: true }).click();
  await page.getByRole('dialog', { name: 'Your library', exact: true }).getByRole('button', { name: 'Settings', exact: true }).click();
  return page.getByRole('dialog', { name: 'Settings', exact: true });
}
async function newJournal(page: Page, name: string, shelf?: string) {
  await journals(page);
  await page.getByRole('button', { name: 'New Journal', exact: true }).last().click();
  const dialog = page.getByRole('dialog', { name: 'New Journal', exact: true });
  await dialog.getByLabel('Journal name', { exact: true }).fill(name);
  if (shelf) await dialog.getByLabel('Shelf', { exact: true }).selectOption({ label: shelf });
  await dialog.getByRole('button', { name: 'Create Journal', exact: true }).click();
  await expect(dialog).not.toBeVisible();
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

test('onboarding teaches real capture, filing and retrieval, then stays dismissed', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Welcome to EvieScratch.' })).toBeVisible();
  await page.getByRole('button', { name: 'Start writing', exact: true }).click();
  await expect(body(page)).toBeFocused();
  await body(page).fill('A memorable orange kite.');
  await saved(page);
  await page.getByRole('button', { name: 'Choose a Journal', exact: true }).click();
  const move = page.getByRole('dialog', { name: 'Move note', exact: true });
  await move.getByRole('textbox', { name: 'Find destination Journal' }).fill('Little memories');
  await move.getByRole('button', { name: 'Create “Little memories” and move' }).click();
  await expect(page.getByRole('button', { name: 'Note options', exact: true })).toContainText('Little memories');
  await page.getByRole('button', { name: 'Try search', exact: true }).click();
  await page.getByRole('button', { name: 'Find anything', exact: true }).click();
  await page.getByRole('textbox', { name: 'Find anything', exact: true }).fill('orange kite');
  await page.getByRole('button', { name: /Untitled note A memorable orange kite/ }).click();
  await expect(page.getByRole('region', { name: 'Getting started', exact: true })).toHaveCount(0);
  await page.reload();
  await expect(body(page)).toContainText('orange kite');
  await expect(page.getByRole('heading', { name: 'Welcome to EvieScratch.', exact: true })).toHaveCount(0);
});

test('Journals can be created on Shelves, renamed, opened and filed without losing a note', async ({ page }) => {
  await journals(page);
  await page.getByRole('button', { name: 'New Shelf', exact: true }).click();
  await page.getByLabel('Shelf name', { exact: true }).fill('Everyday life');
  await page.getByRole('button', { name: 'Create Shelf', exact: true }).click();
  await newJournal(page, '思い出 · café 🐈', 'Everyday life');
  await page.getByRole('button', { name: 'Manage Journal 思い出 · café 🐈', exact: true }).click();
  await page.getByLabel('Journal name', { exact: true }).fill('Small discoveries');
  await page.getByRole('button', { name: 'Save Journal', exact: true }).click();
  await page.getByRole('button', { name: /Small discoveries 0 notes/ }).click();
  await page.getByRole('button', { name: 'New note', exact: true }).click();
  await page.getByRole('textbox', { name: 'Note title', exact: true }).fill('A lovely place');
  await body(page).fill('Keep the same words when filing this.');
  await saved(page);
  await page.getByRole('button', { name: 'Note options', exact: true }).click();
  await page.getByRole('dialog', { name: 'Note options', exact: true }).getByRole('button', { name: 'Move to Journal', exact: true }).click();
  await page.getByRole('dialog', { name: 'Move note', exact: true }).getByRole('button', { name: 'Inbox No Shelf' }).click();
  await expect(page.getByRole('button', { name: 'Note options', exact: true })).toContainText('Inbox');
  await page.reload();
  await expect(body(page)).toContainText('Keep the same words when filing this.');
  await expect(page.getByRole('textbox', { name: 'Note title', exact: true })).toHaveValue('A lovely place');
});

test('Shelf deletion keeps its Journals and Undo restores the grouping', async ({ page }) => {
  await journals(page);
  await page.getByRole('button', { name: 'New Shelf', exact: true }).click();
  await page.getByLabel('Shelf name', { exact: true }).fill('Work');
  await page.getByRole('button', { name: 'Create Shelf', exact: true }).click();
  await newJournal(page, 'Ideas', 'Work');
  await page.getByRole('button', { name: 'Manage Shelf Work', exact: true }).click();
  await page.getByRole('button', { name: 'Delete Shelf', exact: true }).click();
  await page.getByRole('dialog', { name: 'Delete “Work”?' }).getByRole('button', { name: 'Delete Shelf', exact: true }).click();
  await expect(page.getByRole('button', { name: /Ideas 0 notes/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Manage Shelf Work', exact: true })).toHaveCount(0);
  await page.locator('.toast').getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Manage Shelf Work', exact: true })).toBeVisible();
  await expect(page.locator('.shelf-group').filter({ has: page.getByRole('button', { name: 'Manage Shelf Work', exact: true }) }).getByRole('button', { name: /Ideas 0 notes/ })).toBeVisible();
});

test('Journal deletion explicitly moves its notes and Undo brings the Journal back', async ({ page }) => {
  await newJournal(page, 'Projects');
  await page.getByRole('button', { name: /Projects 0 notes/ }).click();
  await page.getByRole('button', { name: 'New note', exact: true }).click();
  await page.getByRole('textbox', { name: 'Note title', exact: true }).fill('Project thought');
  await body(page).fill('Never orphan this note.');
  await saved(page);
  await journals(page);
  await page.getByRole('button', { name: 'Manage Journal Projects', exact: true }).click();
  await page.getByRole('button', { name: 'Delete Journal', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Delete “Projects”?' });
  await dialog.getByLabel('Destination Journal', { exact: true }).selectOption({ label: 'Inbox' });
  await dialog.getByRole('button', { name: 'Delete Journal', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Manage Journal Projects', exact: true })).toHaveCount(0);
  await page.locator('.toast').getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Manage Journal Projects', exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Projects 1 note/ }).click();
  await page.getByRole('button', { name: /Project thought Never orphan/ }).click();
  await expect(body(page)).toContainText('Never orphan this note.');
});

test('tags, pinning, archive search scope, Trash and restore are functional', async ({ page }) => {
  await page.getByRole('button', { name: 'Skip tips', exact: true }).click();
  await page.getByRole('textbox', { name: 'Note title', exact: true }).fill('A useful thought');
  await body(page).fill('A line worth remembering.');
  await page.getByRole('textbox', { name: 'Add a tag', exact: true }).fill('travel');
  await page.getByRole('textbox', { name: 'Add a tag', exact: true }).press('Enter');
  await saved(page);
  await page.getByRole('button', { name: 'Pin note', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Unpin note', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'More note actions', exact: true }).click();
  await page.getByRole('dialog', { name: 'Note options', exact: true }).getByRole('button', { name: 'Archive note', exact: true }).click();
  await view(page, 'All notes');
  await page.getByRole('button', { name: 'Find anything', exact: true }).click();
  await page.getByRole('textbox', { name: 'Find anything', exact: true }).fill('travel');
  await expect(page.getByText('No matching notes', { exact: true })).toBeVisible();
  await page.getByRole('checkbox', { name: 'Include archived notes', exact: true }).check();
  await page.getByRole('button', { name: /A useful thought A line worth remembering/ }).click();
  await page.getByRole('button', { name: 'More note actions', exact: true }).click();
  await page.getByRole('dialog', { name: 'Note options', exact: true }).getByRole('button', { name: /^Move to litter box/ }).click();
  await expect(page.getByRole('button', { name: 'Restore note', exact: true })).toBeVisible();
  await expect(body(page)).toHaveAttribute('contenteditable', 'false');
  await page.getByRole('button', { name: 'Restore note', exact: true }).click();
  await expect(body(page)).toHaveAttribute('contenteditable', 'true');
  await expect(body(page)).toContainText('A line worth remembering.');
  await expect(page.getByText('#travel', { exact: true }).last()).toBeVisible();
});

test('Settings persist appearance, reading size, mascot visibility, and replayable onboarding', async ({ page }) => {
  let dialog = await settings(page);
  await dialog.getByRole('button', { name: 'Pixel Art', exact: true }).click();
  await dialog.getByLabel('Writing size', { exact: true }).selectOption('large');
  await dialog.getByRole('checkbox', { name: /A little Evie company/ }).uncheck();
  await dialog.getByRole('button', { name: 'Replay welcome & onboarding', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Welcome to EvieScratch.', level: 1, exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Skip for now', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A thought can start anywhere.', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'pixel');
  await expect(page.locator('.app-shell')).toHaveAttribute('data-text-size', 'large');
  dialog = await settings(page);
  await expect(dialog.getByRole('checkbox', { name: /A little Evie company/ })).not.toBeChecked();
  await dialog.getByRole('button', { name: 'Close dialog' }).click();
  await expect(page.getByRole('heading', { name: 'Welcome to EvieScratch.', level: 1, exact: true })).toHaveCount(0);
});

test('Normal checkout shows the upfront offer and never activates simulated access', async ({ page }) => {
  await page.locator('.trial-link').click();
  const dialog = page.getByRole('dialog', { name: 'Choose your plan', exact: true });
  await expect(dialog.getByText('$7.99', { exact: true })).toBeVisible();
  await expect(dialog.getByText('$299.88', { exact: true })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Start Free Trial', exact: true })).toBeDisabled();
  await expect(dialog.getByRole('button', { name: 'Buy Now', exact: true })).toBeDisabled();
  await dialog.getByRole('radio', { name: /Weekly/ }).check();
  await expect(dialog.locator('.renewal-terms')).toContainText('3 days free, then $7.99 USD per week');
  await dialog.getByRole('radio', { name: /Annual/ }).check();
  await expect(dialog.locator('.renewal-terms')).toContainText('3 days free, then $299.88 USD per year');
  await expect(dialog.locator('.local-billing-notice')).toContainText('No trial or payment will start without secure checkout.');
  for (const action of ['Start Free Trial', 'Buy Now']) {
    await dialog.getByRole('button', { name: action, exact: true }).click();
    await expect(dialog.getByRole('alert')).toContainText('No trial, subscription or payment has started.');
  }
  await dialog.getByRole('button', { name: 'Keep exploring', exact: true }).click();
  await page.reload();
  await expect(page.locator('.trial-link')).toContainText('(Trial not started)');
});
