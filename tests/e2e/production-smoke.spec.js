import { expect, test } from '@playwright/test';
import path from 'node:path';

const fixturePath = path.resolve('tests/fixtures/valid-1x1.jpg');

test('production image compressor uploads, compresses, and downloads a JPEG', async ({ page }) => {
  const response = await page.goto('/');

  expect(response).not.toBeNull();
  expect(response.ok()).toBe(true);

  const compressor = page.locator('[data-compressor-root]');
  await expect(compressor).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Image compressor' })).toBeVisible();

  await page.locator('[data-file-input]').setInputFiles(fixturePath);
  await expect(compressor).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('[data-file-name]')).toHaveText('valid-1x1.jpg');

  const compressButton = page.locator('[data-compress]');
  await expect(compressButton).toBeEnabled();
  await compressButton.click();

  await expect(compressor).toHaveAttribute('data-state', 'success');
  await expect(page.locator('[data-result-heading]')).toBeVisible();
  await expect(page.locator('[data-result-name]')).toHaveText('valid-1x1-compressed.jpg');

  const downloadLink = page.locator('[data-download]');
  await expect(downloadLink).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await downloadLink.click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/\.jpe?g$/i);
  expect(await download.failure()).toBeNull();

  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  const bytes = Buffer.concat(chunks);

  expect(bytes.length).toBeGreaterThan(0);
  expect(bytes.subarray(0, 3)).toEqual(Buffer.from([0xff, 0xd8, 0xff]));
});
