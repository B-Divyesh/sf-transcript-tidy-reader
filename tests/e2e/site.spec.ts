import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { addToShelf, MAX_SHELF_ITEMS } from '../../src/shelf';
import type { Transcript } from '../../src/types';

test('@claim:download-package landing page explains and downloads the product', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.goto('/');
  await expect(page).toHaveTitle(/Transcript Tidy/);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1')).toContainText('Turn captions into a readable page');
  await expect(page.getByRole('link', { name: 'Download for Chrome' })).toHaveAttribute('href', '/downloads/transcript-tidy-chrome.zip');
  const download = await page.request.get('/downloads/transcript-tidy-chrome.zip');
  expect(download.status()).toBe(200);
  expect(download.headers()['content-type']).toMatch(/application\/(zip|x-zip-compressed)/);
  expect((await download.body()).subarray(0, 4)).toEqual(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('.hero-art img')).toHaveAttribute('alt', /surreal garden/);
  expect(consoleErrors).toEqual([]);
});

test('footer legal links meet the touch-target baseline and AVIF has a deploy MIME type', async ({ page }) => {
  await page.goto('/');
  const legalLinks = page.getByRole('navigation', { name: 'Legal' }).getByRole('link');
  for (const link of await legalLinks.all()) {
    const box = await link.boundingBox();
    expect(box, `${await link.textContent()} has a box`).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
  const staticConfig = JSON.parse(await readFile('site/public/staticwebapp.config.json', 'utf8')) as {
    mimeTypes?: Record<string, string>;
  };
  expect(staticConfig.mimeTypes?.['.avif']).toBe('image/avif');
  const serviceWorker = await readFile('dist/site/sw.js', 'utf8');
  expect(serviceWorker).toMatch(/const CACHE = 'transcript-tidy-site-[a-f0-9]{12}';/);
  expect(serviceWorker).not.toContain('__BUILD_ID__');
  expect(serviceWorker).toContain('if (response.ok)');
});

test('landing page has no serious accessibility violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
});

test('keyboard users reach the skip link and download action with visible focus', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  expect(await skip.evaluate((element) => getComputedStyle(element).outlineWidth)).toBe('3px');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);
  await page.getByRole('link', { name: 'Download for Chrome' }).focus();
  expect(await page.getByRole('link', { name: 'Download for Chrome' }).evaluate((element) => getComputedStyle(element).outlineWidth)).toBe('3px');
});

test('versioned service worker reloads the shell offline in its own browser context', async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto(baseURL!);
    await page.evaluate(async () => navigator.serviceWorker.register('/sw.js'));
    await page.evaluate(async () => navigator.serviceWorker.ready);
    await page.reload();
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    const cacheNames = await page.evaluate(async () => caches.keys());
    expect(cacheNames).toHaveLength(1);
    expect(cacheNames[0]).toMatch(/^transcript-tidy-site-[a-f0-9]{12}$/);
    await context.setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Turn captions into a readable page.');
  } finally {
    await context.setOffline(false);
    await context.close();
  }
});

test('@claim:license-restore license return is saved and stripped from the URL', async ({ page }) => {
  await page.route('https://api.sociobot.in/**', (route) => route.fulfill({ json: { valid: true, reason: 'ok', expires_at: null } }));
  await page.goto('/?license=test-token');
  await expect(page).toHaveURL('http://127.0.0.1:4173/');
  await expect(page.locator('#license-status')).toContainText('License verified');
  expect(await page.evaluate(() => localStorage.getItem('sb_license:transcript-tidy-reader'))).toBe('test-token');
});

test('@claim:plus-shelf Plus is a one-time $12 purchase and keeps at most 50 reads', async ({ page }) => {
  await page.goto('/#pricing');
  await expect(page.getByRole('heading', { name: 'Read free. Save a shelf for $12.' })).toBeVisible();
  await expect(page.getByText('One-time purchase. No subscription.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Buy Transcript Tidy Plus' })).toHaveAttribute(
    'href',
    'https://api.sociobot.in/api/v1/products/transcript-tidy-reader/checkout'
  );
  const transcript = (id: string): Transcript => ({
    id,
    title: `Talk ${id}`,
    sourceUrl: `https://www.youtube.com/watch?v=${id}`,
    sourceKind: 'youtube',
    language: 'en',
    createdAt: 1_788_048_000_000,
    cues: [{ startMs: 0, durationMs: 1_000, text: `Transcript ${id}` }],
    paragraphs: [{ startMs: 0, endMs: 1_000, text: `Transcript ${id}`, isHeading: false }]
  });
  const shelf = Array.from({ length: MAX_SHELF_ITEMS }, (_, index) => transcript(String(index)));
  const next = addToShelf(transcript('new'), shelf);
  expect(next).toHaveLength(50);
  expect(next[0]?.id).toBe('new');
  expect(next.some(({ id }) => id === '49')).toBe(false);
});

test('legal pages are complete', async ({ page }) => {
  await page.goto('/privacy/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy');
  await expect(page.getByText('Where transcript text goes')).toBeVisible();
  await page.goto('/terms/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Terms');
  await expect(page.getByText('Plus purchase')).toBeVisible();
});
