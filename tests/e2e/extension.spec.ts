import AxeBuilder from '@axe-core/playwright';
import { chromium, expect, test } from '@playwright/test';
import { resolve } from 'node:path';

test('@claim:reader-workflow @claim:source-scope @claim:local-private @claim:local-export @claim:reader-controls @claim:runtime-privacy extension runs its complete local reader workflow', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Extension smoke test runs once.');
  const extensionPath = resolve('.output/chrome-mv3');
  const context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    headless: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
  });
  const remoteRequests: string[] = [];
  context.on('request', (request) => {
    if (/^https?:/.test(request.url())) remoteRequests.push(request.url());
  });

  try {
    const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker', { timeout: 5_000 });
    const extensionId = new URL(worker.url()).host;
    await context.route('https://www.youtube.com/watch?*', (route) => route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html><html lang="en"><head><title>A patient idea — YouTube</title></head><body><main><h1>A patient idea</h1></main><script>{"captions":{"playerCaptionsTracklistRenderer":{"captionTracks":[{"baseUrl":"https://www.youtube.com/api/timedtext?v=test","languageCode":"en"}]}}}</script></body></html>`
    }));
    await context.route('https://www.youtube.com/api/timedtext?*', (route) => route.fulfill({
      contentType: 'application/json',
      json: { events: [
        { tStartMs: 1000, dDurationMs: 1800, segs: [{ utf8: 'Reading lets an idea ' }] },
        { tStartMs: 2800, dDurationMs: 2200, segs: [{ utf8: 'arrive at your own pace.' }] },
        { tStartMs: 8000, dDurationMs: 1800, segs: [{ utf8: 'A second thought follows.' }] }
      ] }
    }));

    const videoPage = await context.newPage();
    await videoPage.goto('https://www.youtube.com/watch?v=test');
    await expect(videoPage.getByRole('heading', { level: 1 })).toHaveText('A patient idea');
    expect(remoteRequests.some((url) => url.includes('/api/timedtext'))).toBe(false);

    const result = await worker.evaluate(async () => {
      const api = (globalThis as unknown as { chrome: typeof browser }).chrome;
      const [tab] = await api.tabs.query({ url: 'https://www.youtube.com/watch*' });
      if (!tab?.id) throw new Error('Mock video tab not found');
      const capture = await api.tabs.sendMessage(tab.id, { type: 'capture-transcript' });
      await api.storage.local.set({ activeTranscript: capture.transcript });
      return capture;
    });
    expect(result.ok).toBe(true);
    await context.setOffline(true);
    const offlineResult = await worker.evaluate(async () => {
      const api = (globalThis as unknown as { chrome: typeof browser }).chrome;
      const [tab] = await api.tabs.query({ url: 'https://www.youtube.com/watch*' });
      if (!tab?.id) throw new Error('Mock video tab not found');
      return api.tabs.sendMessage(tab.id, { type: 'capture-transcript' });
    });
    expect(offlineResult).toMatchObject({ ok: false, code: 'offline' });
    await context.setOffline(false);

    await context.route('https://www.ted.com/talks/patient_idea', (route) => route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html><html lang="en"><head><title>Patient ideas | TED</title></head><body><main><h1>Patient ideas</h1>
        <section aria-label="Read transcript">
          <div class="mb-6 w-full"><button type="button">00:04</button><div role="button" tabindex="0">A TED caption</div><div role="button" tabindex="0">becomes readable.</div></div>
          <div class="mb-6 w-full"><button type="button">01:12</button><div role="button" tabindex="0">A second visible passage follows.</div></div>
        </section></main></body></html>`
    }));
    const tedPage = await context.newPage();
    await tedPage.goto('https://www.ted.com/talks/patient_idea');
    const tedResult = await worker.evaluate(async () => {
      const api = (globalThis as unknown as { chrome: typeof browser }).chrome;
      const [tab] = await api.tabs.query({ url: 'https://www.ted.com/talks/*' });
      if (!tab?.id) throw new Error('Mock TED tab not found');
      return api.tabs.sendMessage(tab.id, { type: 'capture-transcript' });
    });
    expect(tedResult).toMatchObject({
      ok: true,
      transcript: { sourceKind: 'ted', cues: [
        { startMs: 4_000, text: 'A TED caption becomes readable.' },
        { startMs: 72_000, text: 'A second visible passage follows.' }
      ] }
    });

    await context.route('https://www.ted.com/talks/no_captions', (route) => route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><html lang="en"><head><title>No captions | TED</title></head><body><main><h1>No captions here</h1></main></body></html>'
    }));
    const emptyTedPage = await context.newPage();
    await emptyTedPage.goto('https://www.ted.com/talks/no_captions');
    const noCaptionsResult = await worker.evaluate(async () => {
      const api = (globalThis as unknown as { chrome: typeof browser }).chrome;
      const [tab] = await api.tabs.query({ url: 'https://www.ted.com/talks/no_captions' });
      if (!tab?.id) throw new Error('Mock empty TED tab not found');
      return api.tabs.sendMessage(tab.id, { type: 'capture-transcript' });
    });
    expect(noCaptionsResult).toMatchObject({ ok: false, code: 'no-captions' });

    const reader = await context.newPage();
    await reader.goto(`chrome-extension://${extensionId}/reader.html`);
    await expect(reader.getByRole('heading', { level: 1 })).toHaveText('A patient idea');
    await reader.getByRole('searchbox', { name: 'Find in transcript' }).fill('pace');
    await expect(reader.locator('#match-count')).toHaveText('1 match');
    await expect(reader.locator('mark')).toHaveText('pace');
    await expect(reader.locator('.timestamp').first()).toHaveAttribute('href', /t=1s/);
    await reader.getByRole('button', { name: 'Reading settings' }).click();
    await expect(reader.getByRole('button', { name: 'Serif' })).toBeFocused();
    await reader.getByRole('button', { name: 'Sans' }).click();
    await expect(reader.locator('html')).toHaveAttribute('data-font', 'sans');
    await reader.locator('#line-height').evaluate((element) => {
      const input = element as HTMLInputElement;
      input.value = '200';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect(reader.locator('#line-output')).toHaveText('2.00');
    await reader.evaluate(() => {
      (window as typeof window & { __printed?: boolean }).__printed = false;
      window.print = () => { (window as typeof window & { __printed?: boolean }).__printed = true; };
    });
    await reader.getByRole('button', { name: 'Print' }).click();
    expect(await reader.evaluate(() => (window as typeof window & { __printed?: boolean }).__printed)).toBe(true);
    await reader.evaluate(() => {
      type DownloadRecord = { blob: Blob; filename: string };
      const state = window as typeof window & { __testDownloads: DownloadRecord[] };
      state.__testDownloads = [];
      URL.createObjectURL = (blob) => {
        const index = state.__testDownloads.push({ blob: blob as Blob, filename: '' }) - 1;
        return `blob:test-${index}`;
      };
      URL.revokeObjectURL = () => undefined;
      HTMLAnchorElement.prototype.click = function click() {
        const index = Number(this.href.replace('blob:test-', ''));
        state.__testDownloads[index]!.filename = this.download;
      };
    });
    await reader.getByRole('button', { name: 'Export text' }).click();
    await reader.getByRole('button', { name: 'Export HTML' }).click();
    const downloads = await reader.evaluate(async () => {
      const state = window as typeof window & { __testDownloads: Array<{ blob: Blob; filename: string }> };
      return Promise.all(state.__testDownloads.map(async ({ blob, filename }) => ({ filename, content: await blob.text() })));
    });
    expect(downloads[0]).toEqual(expect.objectContaining({
      filename: 'a-patient-idea.txt',
      content: expect.stringContaining('[0:01] Reading lets an idea arrive at your own pace.')
    }));
    expect(downloads[1]).toEqual(expect.objectContaining({
      filename: 'a-patient-idea.html',
      content: expect.stringContaining('<h1>A patient idea</h1>')
    }));
    const productPage = await context.newPage();
    await productPage.goto('http://127.0.0.1:4173/');
    const runtimeResources = await productPage.evaluate(() => performance.getEntriesByType('resource').map((entry) => entry.name));
    const productOrigin = new URL(productPage.url()).origin;
    expect(runtimeResources.every((url) => new URL(url).origin === productOrigin)).toBe(true);
    const runtimeSources = await productPage.locator('script[src],link[rel="stylesheet"],link[rel="preload"]').evaluateAll((nodes) => nodes.map((node) => (node as HTMLScriptElement | HTMLLinkElement).getAttribute('src') ?? (node as HTMLLinkElement).getAttribute('href')));
    expect(runtimeSources.every((url) => !url || new URL(url, productPage.url()).origin === new URL(productPage.url()).origin)).toBe(true);
    expect([...new Set(remoteRequests.filter((url) => /^https:/.test(url)).map((url) => new URL(url).hostname))].sort()).toEqual(['www.ted.com', 'www.youtube.com']);
    expect(remoteRequests.some((url) => /googlevideo|videoplayback/i.test(url))).toBe(false);
    const axe = await new AxeBuilder({ page: reader }).analyze();
    expect(axe.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
    await reader.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
    const darkReaderAxe = await new AxeBuilder({ page: reader }).analyze();
    expect(darkReaderAxe.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);

    for (const surface of ['options.html', 'popup.html']) {
      const extensionPage = await context.newPage();
      await extensionPage.setViewportSize({ width: 390, height: 844 });
      await extensionPage.emulateMedia({ colorScheme: 'light' });
      await extensionPage.goto(`chrome-extension://${extensionId}/${surface}`);
      const lightAxe = await new AxeBuilder({ page: extensionPage }).analyze();
      expect(lightAxe.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? '')), `${surface} light`).toEqual([]);
      await extensionPage.emulateMedia({ colorScheme: 'dark' });
      const darkAxe = await new AxeBuilder({ page: extensionPage }).analyze();
      expect(darkAxe.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? '')), `${surface} dark`).toEqual([]);
      await extensionPage.close();
    }
  } finally {
    await context.close();
  }
});

test('reader header brand remains named when its text is visually compacted on mobile', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390', 'Mobile reader accessibility regression runs at 390px.');
  const extensionPath = resolve('.output/chrome-mv3');
  const context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    headless: true,
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
  });

  try {
    const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker', { timeout: 5_000 });
    const extensionId = new URL(worker.url()).host;
    await worker.evaluate(async () => {
      const api = (globalThis as unknown as { chrome: typeof browser }).chrome;
      await api.storage.local.set({ activeTranscript: {
        id: 'mobile-sample',
        title: 'A readable mobile sample',
        sourceUrl: 'https://www.youtube.com/watch?v=mobile',
        sourceKind: 'youtube',
        language: 'en',
        createdAt: 1_788_048_000_000,
        cues: [{ startMs: 0, durationMs: 1_000, text: 'A useful sentence remains readable at a narrow width.' }],
        paragraphs: [{ startMs: 0, endMs: 1_000, text: 'A useful sentence remains readable at a narrow width.', isHeading: false }]
      } });
    });
    const reader = await context.newPage();
    await reader.goto(`chrome-extension://${extensionId}/reader.html`);
    await expect(reader.getByRole('heading', { level: 1 })).toHaveText('A readable mobile sample');
    await expect(reader.locator('.brand span').last()).toBeHidden();
    const brand = reader.getByRole('link', { name: 'Transcript Tidy' });
    await expect(brand).toBeVisible();
    await brand.focus();
    expect(await brand.evaluate((element) => getComputedStyle(element).outlineWidth)).toBe('3px');
    const axe = await new AxeBuilder({ page: reader }).analyze();
    expect(axe.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
    await reader.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
    const darkAxe = await new AxeBuilder({ page: reader }).analyze();
    expect(darkAxe.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
    const dimensions = await reader.evaluate(() => ({ inner: window.innerWidth, scroll: document.documentElement.scrollWidth }));
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.inner);
  } finally {
    await context.close();
  }
});
