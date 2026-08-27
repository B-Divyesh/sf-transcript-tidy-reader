import { capturePageTranscript } from '../src/capture';

export default defineContentScript({
  matches: ['https://www.youtube.com/*', 'https://youtube.com/*', 'https://youtu.be/*', 'https://www.ted.com/*', 'https://ted.com/*'],
  main() {
    browser.runtime.onMessage.addListener((message: unknown) => {
      if (typeof message === 'object' && message !== null && 'type' in message && message.type === 'capture-transcript') {
        return capturePageTranscript();
      }
      return undefined;
    });
  }
});
