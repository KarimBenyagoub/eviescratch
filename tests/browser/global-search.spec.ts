import { expect, test } from '@playwright/test';

test('Find anything expands consistently and searches from each main screen', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Find anything' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Skip for now', exact: true }).click();
  await expect(page.getByText('Find a thought', { exact: true })).toHaveCount(0);

  for (const destination of ['Home', 'Journals & Shelves', 'All notes']) {
    await page.getByRole('button', { name: 'Open app menu', exact: true }).click();
    await page.getByRole('dialog', { name: 'Your library' }).getByRole('button', { name: destination, exact: true }).click();
    const open = page.getByRole('button', { name: 'Find anything', exact: true });
    await expect(open).toBeVisible();
    await open.click();
    const input = page.getByRole('textbox', { name: 'Find anything', exact: true });
    await expect(input).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(open).toBeVisible();
  }

  await page.getByRole('button', { name: 'Find anything', exact: true }).click();
  await page.getByRole('textbox', { name: 'Find anything', exact: true }).fill('fresh page');
  await expect(page.locator('.notes-pane')).toBeVisible();
  await expect(page.locator('.search-scope')).toContainText('Finding anything');
  await page.getByRole('button', { name: 'Close search', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Find anything', exact: true })).toBeVisible();
});
