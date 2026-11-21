import { expect, test, type Page } from '@playwright/test';
const body = (page: Page) => page.getByRole('textbox', { name: 'Note body', exact: true });
async function enterDemo(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Skip for now', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Quick note' })).toBeFocused();
}
async function settings(page: Page) { await page.getByRole('button', { name: 'Open app menu', exact: true }).click();
  await page.getByRole('dialog', { name: 'Your library', exact: true }).getByRole('button', { name: 'Settings', exact: true }).click(); return page.getByRole('dialog', { name: 'Settings', exact: true }); }
async function capture(page: Page, text: string) {
  await page.getByRole('textbox', { name: 'Quick note', exact: true }).fill(text);
  await page.getByRole('button', { name: 'Save & open note', exact: true }).click();
  await expect(body(page)).toContainText(text);
  await expect(page.locator('.save-status')).toHaveText('Saved on this device');
}

test('full first-run flow starts at the logo and reaches Home with the upfront offer', async ({ page }) => {
  await page.goto('/');
  const intro = page.locator('.intro-splash');
  await expect(intro).toBeVisible();
  await expect(intro).toHaveText('');
  await expect(intro.getByRole('button')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Skip intro', exact: true })).toHaveCount(0);
  await expect(intro).toBeHidden({ timeout: 3000 });
  await expect(page.getByRole('heading', { name: 'Welcome to EvieScratch.', exact: true })).toBeVisible();
  await expect(page.getByText('Take notes: Ideas, plans, everyday little things. Give them a quiet place to land, with Evie beside you.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Let’s begin', exact: true }).click();
  const name = page.getByRole('textbox', { name: 'Name your first Journal', exact: true });
  await expect(name).toBeFocused();
  await name.fill('Little ideas');
  await page.getByRole('button', { name: 'Clear Journal name', exact: true }).click();
  await expect(name).toHaveValue('');
  await expect(name).toBeFocused();
  await name.fill('Little ideas');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByText('$7.99', { exact: true })).toBeVisible();
  await expect(page.getByText('$299.88', { exact: true })).toBeVisible();
  await page.getByRole('radio', { name: /^Weekly/ }).check();
  await expect(page.locator('.renewal-terms')).toContainText('$7.99 USD per week');
  await expect(page.getByRole('button', { name: 'Buy Now', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Start Free Trial', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A thought can start anywhere.' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'A thought can start anywhere.', exact: true }).getByRole('button', { name: 'Little ideas', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Evie — companion options' })).toBeVisible();
  await expect(page.locator('.trial-link')).toContainText('(3 days remaining)');
  await page.reload();
  await expect(page.locator('.trial-link')).toContainText('(3 days remaining)');
});

test('Buy Now simulates the chosen plan without starting a free trial', async ({ page }) => {
  await enterDemo(page);
  await expect(page.locator('.trial-link')).toContainText('(Trial not started)');
  await page.locator('.trial-link').click();
  const dialog = page.getByRole('dialog', { name: 'Choose your plan', exact: true });
  await dialog.getByRole('radio', { name: /^Annual/ }).check();
  await expect(dialog.locator('.purchase-terms')).toContainText('$299.88 USD immediately');
  await dialog.getByRole('button', { name: 'Buy Now', exact: true }).click();
  await expect(page.locator('.trial-link')).toContainText('(Annual plan active)');
  await page.reload();
  await expect(page.locator('.trial-link')).toContainText('(Annual plan active)');
});

test('Evie sleeps on Home and wakes beside an open note', async ({ page }) => {
  await enterDemo(page);
  await expect(page.getByRole('img', { name: 'Evie sleeping peacefully', exact: true })).toBeVisible();
  await page.getByRole('button', { name: /^Untitled note A fresh page/ }).first().click();
  await expect(page.getByRole('img', { name: 'Evie awake beside your note', exact: true })).toBeVisible();
  await expect(page.locator('.guide-offer')).toContainText('(Trial not started)');
});

test('quick capture, focus, clear and Undo preserve the note; both note menus expose filing actions', async ({ page }) => {
  await enterDemo(page);
  await capture(page, 'A thought with a little cat company.');
  await expect(body(page)).toBeFocused();
  await page.getByRole('button', { name: 'Clear note text', exact: true }).click();
  await expect(body(page)).toBeEmpty();
  await page.getByRole('group', { name: 'Text formatting', exact: true }).getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(body(page)).toContainText('A thought with a little cat company.');
  for (const label of ['Note options', 'More note actions']) {
    await page.getByRole('button', { name: label, exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Note options', exact: true });
    await expect(dialog.getByRole('button', { name: /^Move to Shelf/ })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Move to Journal', exact: true })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /^Move to litter box/ })).toBeVisible();
    await dialog.getByRole('button', { name: 'Close dialog' }).click();
  }
});

test('holding a Home note opens its contextual options', async ({ page }) => {
  await enterDemo(page);
  const note = page.getByRole('button', { name: /^Untitled note A fresh page/ }).first();
  await note.scrollIntoViewIfNeeded();
  const box = await note.boundingBox();
  await page.mouse.move(box!.x + 20, box!.y + 20);
  await page.mouse.down();
  await page.getByRole('dialog', { name: 'Note options', exact: true }).waitFor({ state: 'visible' });
  await page.mouse.up();
  await expect(page.getByRole('dialog', { name: 'Note options', exact: true })).toBeVisible();
});

test('Evie can be hidden by tapping her and restored in Settings', async ({ page }) => {
  await enterDemo(page);
  await page.getByRole('button', { name: 'Evie — companion options', exact: true }).click();
  await page.getByRole('button', { name: 'Hide Evie', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Evie — companion options', exact: true })).toHaveCount(0);
  const dialog = await settings(page);
  await dialog.getByRole('checkbox', { name: /A little Evie company/ }).check();
  await dialog.getByRole('button', { name: 'Close dialog' }).click();
  await expect(page.getByRole('button', { name: 'Evie — companion options', exact: true })).toBeVisible();
});

test('demo reset restarts onboarding and keeps the separate normal library', async ({ page }) => {
  test.setTimeout(45_000);
  await enterDemo(page);
  await capture(page, 'Disposable demo words.');
  let dialog = await settings(page);
  await dialog.getByRole('button', { name: 'Normal mode', exact: true }).click();
  await page.getByRole('button', { name: 'Skip for now', exact: true }).click();
  await capture(page, 'Keep my normal notes.');
  dialog = await settings(page);
  await expect(dialog.getByRole('button', { name: 'Hard reset demo' })).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Test mode', exact: true }).click();
  await page.getByRole('button', { name: 'Hard reset demo', exact: true }).click();
  await page.getByRole('dialog', { name: 'Hard reset demo?' }).getByRole('button', { name: 'Reset demo from scratch', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Welcome to EvieScratch.', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Skip for now', exact: true }).click();
  await expect(page.getByText('Disposable demo words.', { exact: true })).toHaveCount(0);
  dialog = await settings(page);
  await dialog.getByRole('button', { name: 'Normal mode', exact: true }).click();
  await expect(page.getByRole('button', { name: /Untitled note Keep my normal notes/ })).toBeVisible();
});
