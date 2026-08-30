import { CHECKOUT_URL, getLicenseState, saveAndVerifyLicense } from '../../src/license';
import { addToShelf } from '../../src/shelf';
import type { CaptureResult, Transcript } from '../../src/types';
import './style.css';

const button = document.querySelector<HTMLButtonElement>('#tidy')!;
const status = document.querySelector<HTMLElement>('#status')!;
const buy = document.querySelector<HTMLAnchorElement>('#buy')!;
const restore = document.querySelector<HTMLFormElement>('#restore')!;
const licenseInput = document.querySelector<HTMLInputElement>('#license')!;
const licenseStatus = document.querySelector<HTMLElement>('#license-status')!;

buy.href = CHECKOUT_URL;

void getLicenseState().then((state) => {
  if (state.unlocked) licenseStatus.textContent = 'Plus is active on this device.';
  else if (state.reason) licenseStatus.textContent = 'Your license is no longer active.';
});

button.addEventListener('click', async () => {
  button.disabled = true;
  button.innerHTML = '<span class="spinner" aria-hidden="true"></span> Gathering captions…';
  status.className = 'status';
  status.textContent = '';
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.url || !/^https:\/\/(?:www\.)?(?:youtube\.com|youtu\.be|ted\.com)\//.test(tab.url)) {
      showError('Open a captioned YouTube or TED video, then try again.');
      return;
    }
    const result = (await browser.tabs.sendMessage(tab.id, { type: 'capture-transcript' })) as CaptureResult;
    if (!result.ok || !result.transcript) {
      showError(result.message ?? 'No transcript was found on this page.');
      return;
    }
    await browser.storage.local.set({ activeTranscript: result.transcript });
    await saveToShelfWhenUnlocked(result.transcript);
    await browser.tabs.create({ url: browser.runtime.getURL('/reader.html') });
    window.close();
  } catch {
    showError('Transcript Tidy could not reach this tab. Refresh the video page and try again.');
  } finally {
    button.disabled = false;
    button.innerHTML = '<span aria-hidden="true">↗</span> Tidy this transcript';
  }
});

restore.addEventListener('submit', async (event) => {
  event.preventDefault();
  licenseStatus.textContent = 'Checking license…';
  const result = await saveAndVerifyLicense(licenseInput.value);
  licenseStatus.textContent = result.valid ? 'Plus is active on this device.' : result.reason;
  if (result.valid) licenseInput.value = '';
});

function showError(message: string) {
  status.className = 'status error';
  status.textContent = message;
}

async function saveToShelfWhenUnlocked(transcript: Transcript) {
  const { unlocked } = await getLicenseState();
  if (!unlocked) return;
  const { transcriptShelf = [] } = await browser.storage.local.get('transcriptShelf') as { transcriptShelf?: Transcript[] };
  const next = addToShelf(transcript, transcriptShelf);
  await browser.storage.local.set({ transcriptShelf: next });
}
