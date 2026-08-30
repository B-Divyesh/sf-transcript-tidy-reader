import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { addToShelf, MAX_SHELF_ITEMS } from '../../src/shelf';
import type { Transcript } from '../../src/types';

test('@claim:download-package landing page explains and packages the consumer install path', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.goto('/');
  await expect(page).toHaveTitle(/Transcript Tidy/);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1')).toContainText('Turn captions into a readable page');
  await expect(page.getByRole('link', { name: 'Try it with sample data' }).first()).toHaveAttribute('href', '/demo/');
  await expect(page.getByRole('heading', { name: 'Install the Chrome extension from its ZIP.' })).toBeVisible();
  await expect(page.getByText('Turn on Developer mode.')).toBeVisible();
  await expect(page.getByText(/choose the extracted folder containing/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Download extension ZIP' })).toHaveAttribute('href', '/downloads/transcript-tidy-chrome.zip');
  const download = await page.request.get('/downloads/transcript-tidy-chrome.zip');
  expect(download.status()).toBe(200);
  expect(download.headers()['content-type']).toMatch(/application\/(zip|x-zip-compressed)/);
  expect((await download.body()).subarray(0, 4)).toEqual(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
  const packageBody = await download.body();
  expect(packageBody.includes(Buffer.from('manifest.json'))).toBe(true);
  expect(packageBody.includes(Buffer.from('INSTALL.txt'))).toBe(true);
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('.hero-art img')).toHaveAttribute('alt', /surreal garden/);
  expect(consoleErrors).toEqual([]);
});

test('@claim:demo-sandbox first-screen demo is interactive, isolated, and resettable', async ({ page }) => {
  const externalRequests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== 'http://127.0.0.1:4173') externalRequests.push(request.url());
  });
  await page.goto('/');
  await page.getByRole('link', { name: 'Try it with sample data' }).first().click();
  await expect(page).toHaveURL(/\/demo\/$/);
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await expect(page.locator('.sample-transcript > section')).toHaveCount(3);
  await page.getByRole('searchbox', { name: 'Search transcript' }).fill('pause');
  await expect(page.locator('#demo-match-count')).toHaveText('2 matches');
  await expect(page.locator('.sample-transcript mark')).toHaveCount(2);
  await page.getByRole('button', { name: 'Sans' }).click();
  await expect(page.locator('#sample-transcript')).toHaveAttribute('data-font', 'sans');
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByRole('searchbox', { name: 'Search transcript' })).toHaveValue('');
  await expect(page.locator('#sample-transcript')).toHaveAttribute('data-font', 'serif');
  const storage = await page.evaluate(async () => ({
    local: Object.keys(localStorage),
    session: Object.keys(sessionStorage),
    indexed: typeof indexedDB.databases === 'function' ? (await indexedDB.databases()).map(({ name }) => name) : []
  }));
  expect(storage).toEqual({ local: [], session: [], indexed: [] });
  await expect(page.getByRole('link', { name: 'Start for real' })).toHaveAttribute('href', '/#install');
  expect(externalRequests).toEqual([]);
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
  expect(staticConfig.mimeTypes?.['.zip']).toBe('application/zip');
  const serviceWorker = await readFile('dist/site/sw.js', 'utf8');
  expect(serviceWorker).toMatch(/const CACHE = 'transcript-tidy-site-[a-f0-9]{12}';/);
  expect(serviceWorker).not.toContain('__BUILD_ID__');
  expect(serviceWorker).toContain('if (response.ok)');
});

test('mobile skip, policy, license, and contact links meet the 44 pixel target baseline', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ['/', '/privacy/', '/terms/']) {
    await page.goto(route);
    const targets = page.locator('.skip, .legal-note a, main a[href^="mailto:"]');
    for (const target of await targets.all()) {
      const box = await target.boundingBox();
      expect(box, `${route} ${await target.textContent()} has a box`).not.toBeNull();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  }
});

test('all required routes have metadata, recovery, and build identity', async ({ page }) => {
  for (const route of ['/', '/demo/', '/privacy/', '/terms/']) {
    await page.goto(route);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /transcript-tidy-social\.jpg$/);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', '/apple-touch-icon.png');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.getByText('Version 1.0.1.')).toBeVisible();
  }
  const config = JSON.parse(await readFile('site/public/staticwebapp.config.json', 'utf8')) as {
    responseOverrides?: { '404'?: { rewrite?: string } };
  };
  expect(config.responseOverrides?.['404']?.rewrite).toBe('/404.html');
  await page.goto('/404.html');
  await expect(page).toHaveTitle('Page not found — Transcript Tidy');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found.');
  await expect(page.getByRole('link', { name: 'Return home' })).toHaveAttribute('href', '/');
});

test('every public route has no serious accessibility violations', async ({ page }) => {
  for (const route of ['/', '/demo/', '/privacy/', '/terms/', '/404.html']) {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? '')), route).toEqual([]);
  }
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
  await page.getByRole('link', { name: 'Try it with sample data' }).first().focus();
  expect(await page.getByRole('link', { name: 'Try it with sample data' }).first().evaluate((element) => getComputedStyle(element).outlineWidth)).toBe('3px');
});

test('landing and legal pages reflow at the 200 percent zoom equivalent', async ({ page }) => {
  await page.setViewportSize({ width: 195, height: 844 });
  for (const route of ['/', '/demo/', '/privacy/', '/terms/', '/404.html']) {
    await page.goto(route);
    const sizes = await page.evaluate(() => ({ inner: window.innerWidth, scroll: document.documentElement.scrollWidth }));
    expect(sizes.scroll, route).toBeLessThanOrEqual(sizes.inner);
  }
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
  await page.unroute('https://api.sociobot.in/**');
  await page.route('https://api.sociobot.in/**', (route) => route.fulfill({ json: { valid: false, reason: 'revoked', expires_at: null } }));
  await page.getByLabel('Paste your existing license').fill('revoked-token');
  await page.getByRole('button', { name: 'Restore license' }).click();
  await expect(page.locator('#license-status')).toContainText('no longer active');
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem('sb_license:transcript-tidy-reader:verdict')) ?? '{}')).toMatchObject({ valid: false, reason: 'revoked' });
});

test('@claim:plus-shelf an existing valid Plus license keeps at most 50 reads', async ({ page }) => {
  await page.route('https://api.sociobot.in/**', (route) => route.fulfill({ json: { valid: true, reason: 'ok', expires_at: null } }));
  await page.goto('/#license-restore');
  await expect(page.getByRole('heading', { name: 'Restore a shelf you already bought.' })).toBeVisible();
  await expect(page.getByText(/Existing licenses still add a private shelf of up to 50/)).toBeVisible();
  await expect(page.getByText('New Plus sales are paused.')).toBeVisible();
  await expect(page.getByRole('link', { name: /Buy Transcript Tidy Plus/ })).toHaveCount(0);
  await page.getByLabel('Paste your existing license').fill('existing-valid-token');
  await page.getByRole('button', { name: 'Restore license' }).click();
  await expect(page.locator('#license-status')).toContainText('License verified');
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
  await expect(page.getByRole('heading', { name: 'Existing Plus licenses' })).toBeVisible();
});
