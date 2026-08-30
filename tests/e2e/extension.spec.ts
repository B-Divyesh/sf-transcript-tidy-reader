import AxeBuilder from '@axe-core/playwright';
import { chromium, expect, test } from '@playwright/test';
import { resolve } from 'node:path';

test('@claim:reader-workflow @claim:source-scope @claim:local-private @claim:local-export extension captures supplied caption tracks and opens a searchable reader', async ({}, testInfo) => {
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

    const result = await worker.evaluate(async () => {
      const api = (globalThis as unknown as { chrome: typeof browser }).chrome;
      const [tab] = await api.tabs.query({ url: 'https://www.youtube.com/watch*' });
      if (!tab?.id) throw new Error('Mock video tab not found');
      const capture = await api.tabs.sendMessage(tab.id, { type: 'capture-transcript' });
      await api.storage.local.set({ activeTranscript: capture.transcript });
      return capture;
    });
    expect(result.ok).toBe(true);

    await context.route('https://www.ted.com/talks/patient_idea', (route) => route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><html lang="en"><head><title>Patient ideas | TED</title></head><body><main><h1>Patient ideas</h1><video><track kind="captions" src="https://www.ted.com/captions/patient.vtt"></video></main></body></html>'
    }));
    await context.route('https://www.ted.com/captions/patient.vtt', (route) => route.fulfill({
      contentType: 'text/vtt',
      body: 'WEBVTT\n\n00:00:01.000 --> 00:00:03.000\nA TED caption becomes readable.\n'
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
      transcript: { sourceKind: 'ted', paragraphs: [{ text: 'A TED caption becomes readable.' }] }
    });

    const reader = await context.newPage();
    await reader.goto(`chrome-extension://${extensionId}/reader.html`);
    await expect(reader.getByRole('heading', { level: 1 })).toHaveText('A patient idea');
    await reader.getByRole('searchbox', { name: 'Find in transcript' }).fill('pace');
    await expect(reader.locator('#match-count')).toHaveText('1 match');
    await expect(reader.locator('mark')).toHaveText('pace');
    await expect(reader.locator('.timestamp').first()).toHaveAttribute('href', /t=1s/);
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
    expect([...new Set(remoteRequests.map((url) => new URL(url).hostname))].sort()).toEqual(['www.ted.com', 'www.youtube.com']);
    const axe = await new AxeBuilder({ page: reader }).analyze();
    expect(axe.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
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
    const reader = await context.newPage();
    await reader.goto(`chrome-extension://${extensionId}/reader.html`);
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
  } finally {
    await context.close();
  }
});
