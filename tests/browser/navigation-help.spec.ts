import { expect, test, type Page } from '@playwright/test';

async function menu(page: Page) {
  await page.getByRole('button', { name: 'Open app menu', exact: true }).click();
  return page.getByRole('dialog', { name: 'Your library', exact: true });
}

test('shared top-right menu follows views, dialogs and appearance; onboarding excludes it', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Open app menu' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Skip for now', exact: true }).click();
  const headerMenu = page.locator('.app-header').getByRole('button', { name: 'Open app menu' });
  await expect(headerMenu).toBeVisible();
  const homePosition = await headerMenu.boundingBox();
  for (const view of ['All notes', 'Journals & Shelves', 'Archive', 'Litter box', 'Home']) {
    await (await menu(page)).getByRole('button', { name: view, exact: true }).click();
    await expect(headerMenu).toBeVisible();
    const position = await headerMenu.boundingBox();
    expect(position?.x).toBe(homePosition?.x);
    expect(position?.y).toBe(homePosition?.y);
  }
  await (await menu(page)).getByRole('button', { name: 'Settings', exact: true }).click();
  const settings = page.getByRole('dialog', { name: 'Settings', exact: true });
  await settings.getByRole('button', { name: 'Pixel Art', exact: true }).click();
  await settings.getByRole('button', { name: 'Help: App mode', exact: true }).click();
  await expect(settings.getByRole('tooltip')).toContainText('separate libraries');
  await page.keyboard.press('Escape');
  await expect(settings).toBeVisible();
  await settings.getByRole('button', { name: 'Open app menu' }).click();
  await (page.getByRole('dialog', { name: 'Your library' })).getByRole('button', { name: 'Trial & plans' }).click();
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Open app menu' })).toBeVisible();
});

test('help works by touch and keyboard without submitting capture or changing note text', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Skip for now', exact: true }).click();
  const capture = page.getByRole('textbox', { name: 'Quick note' });
  await capture.fill('Keep this thought');
  const help = page.getByRole('button', { name: 'Help: Quick capture' });
  await help.focus();
  await page.keyboard.press('Enter');
  const tip = page.getByRole('tooltip');
  await expect(tip).toContainText('default Journal');
  const bounds = await tip.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.keyboard.press('Escape');
  await expect(tip).toBeHidden();
  await expect(capture).toHaveValue('Keep this thought');
  await page.getByRole('button', { name: 'Save & open note' }).click();
  await expect(page.getByRole('textbox', { name: 'Note body' })).toContainText('Keep this thought');
  await page.getByRole('button', { name: 'Help: Tags' }).click();
  await expect(page.getByRole('tooltip')).toContainText('Enter or comma');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('textbox', { name: 'Note body' })).toContainText('Keep this thought');
  await page.screenshot({ path: `.local-qa/screenshots/navigation-help-${test.info().project.name}.png`, fullPage: true });
});
