import AxeBuilder from '@axe-core/playwright';
import { chromium, expect, test } from '@playwright/test';
import { resolve } from 'node:path';

test('extension captures a supplied caption track and opens a searchable reader', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Extension smoke test runs once.');
  const extensionPath = resolve('.output/chrome-mv3');
  const context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    headless: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
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

    const reader = await context.newPage();
    await reader.goto(`chrome-extension://${extensionId}/reader.html`);
    await expect(reader.getByRole('heading', { level: 1 })).toHaveText('A patient idea');
    await reader.getByRole('searchbox', { name: 'Find in transcript' }).fill('pace');
    await expect(reader.locator('#match-count')).toHaveText('1 match');
    await expect(reader.locator('mark')).toHaveText('pace');
    await expect(reader.locator('.timestamp').first()).toHaveAttribute('href', /t=1s/);
    const axe = await new AxeBuilder({ page: reader }).analyze();
    expect(axe.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
  } finally {
    await context.close();
  }
});
