import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('landing page explains and downloads the product', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.goto('/');
  await expect(page).toHaveTitle(/Transcript Tidy/);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1')).toContainText('Give captions room to breathe');
  await expect(page.getByRole('link', { name: 'Download for Chrome' })).toHaveAttribute('href', '/downloads/transcript-tidy-chrome.zip');
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('.hero-art img')).toHaveAttribute('alt', /surreal garden/);
  expect(consoleErrors).toEqual([]);
});

test('landing page has no serious accessibility violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
});

test('license return is saved and stripped from the URL', async ({ page }) => {
  await page.route('https://api.sociobot.in/**', (route) => route.fulfill({ json: { valid: true, reason: 'ok', expires_at: null } }));
  await page.goto('/?license=test-token');
  await expect(page).toHaveURL('http://127.0.0.1:4173/');
  await expect(page.locator('#license-status')).toContainText('License verified');
  expect(await page.evaluate(() => localStorage.getItem('sb_license:transcript-tidy-reader'))).toBe('test-token');
});

test('legal pages are complete', async ({ page }) => {
  await page.goto('/privacy/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy');
  await expect(page.getByText('Where transcript text goes')).toBeVisible();
  await page.goto('/terms/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Terms');
  await expect(page.getByText('Plus purchase')).toBeVisible();
});
