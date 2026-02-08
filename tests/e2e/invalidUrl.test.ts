import { expect, test } from '@playwright/test';

test('invalid url states', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Analyze' }).click();
  await expect(page.getByText('Please enter a Chrome Web Store URL.')).toBeVisible();

  await page.getByLabel('Chrome Web Store URL').fill('https://example.com');
  await page.getByRole('button', { name: 'Analyze' }).click();
  await expect(page.getByText('Please use a valid Chrome Web Store URL.')).toBeVisible();

  await page.getByLabel('Chrome Web Store URL').fill('not-a-url');
  await page.getByRole('button', { name: 'Analyze' }).click();
  await expect(page.getByText('Please use a valid Chrome Web Store URL.')).toBeVisible();

  await page.getByRole('button', { name: 'Dismiss' }).click();
  await expect(page.getByText('Please use a valid Chrome Web Store URL.')).not.toBeVisible();
});
