import { expect, test } from '@playwright/test';

test('storage management and attachment location indicators work in browser', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Skip for now', exact: true }).click();

  // Open settings via header menu
  await page.getByRole('button', { name: 'Open app menu', exact: true }).click();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();

  const settings = page.getByRole('dialog', { name: 'Settings', exact: true });
  await expect(settings).toBeVisible();

  // Open Storage & file management
  await settings.getByRole('button', { name: 'Manage files & storage' }).click();
  const storageDialog = page.getByRole('dialog', { name: 'Storage & file management', exact: true });
  await expect(storageDialog).toBeVisible();

  // Verify location indicators
  await expect(storageDialog.getByText('Location: On this device')).toBeVisible();
  await expect(storageDialog.getByText('Cloud sync: Not connected')).toBeVisible();

  // Verify backup export buttons exist
  await expect(storageDialog.getByRole('button', { name: 'Export full backup (.zip)' })).toBeVisible();
  await expect(storageDialog.getByRole('button', { name: 'Export readable Markdown (.zip)' })).toBeVisible();

  // Close storage dialog
  await storageDialog.getByRole('button', { name: 'Close dialog' }).click();

  // Navigate to notes
  await page.getByRole('button', { name: 'Open app menu', exact: true }).click();
  await page.getByRole('dialog', { name: 'Your library' }).getByRole('button', { name: 'All notes', exact: true }).click();

  // If on mobile note list, click the first note card to open the editor
  const noteCard = page.locator('.note-card').first();
  if (await noteCard.isVisible()) {
    await noteCard.click();
  }

  // In editor, verify attachment controls
  const attachBtn = page.locator('.note-attach-button');
  await expect(attachBtn).toBeVisible();
  await attachBtn.click();

  // Verify attachment storage indicators on the note
  const attachmentsSection = page.getByRole('region', { name: 'Attachments' });
  await expect(attachmentsSection).toBeVisible();
  await expect(attachmentsSection.getByText('Location: On this device')).toBeVisible();
  await expect(attachmentsSection.getByText('Cloud: Not connected')).toBeVisible();
  await expect(attachmentsSection.getByText(/Available:/)).toBeVisible();
});
