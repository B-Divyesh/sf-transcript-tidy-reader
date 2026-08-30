import './style.css';

const SLUG = 'transcript-tidy-reader';
const LICENSE_KEY = `sb_license:${SLUG}`;
const VERDICT_KEY = `${LICENSE_KEY}:verdict`;
const status = document.querySelector<HTMLElement>('#license-status');
const form = document.querySelector<HTMLFormElement>('#restore-form');
const input = document.querySelector<HTMLInputElement>('#license');
const query = new URLSearchParams(location.search);
const returnedLicense = query.get('license');

if (query.get('demo') === '1') location.replace('/demo/');

if (returnedLicense) {
  localStorage.setItem(LICENSE_KEY, returnedLicense);
  history.replaceState({}, '', `${location.pathname}${location.hash}`);
  void verify(returnedLicense);
} else {
  const token = localStorage.getItem(LICENSE_KEY);
  const verdict = parseVerdict(localStorage.getItem(VERDICT_KEY));
  if (token && verdict?.valid) setStatus('Plus is active. Paste this license into the extension to unlock your local shelf.', 'success');
  if (token && (!verdict || Date.now() - verdict.checkedAt > 86_400_000) && navigator.onLine) void verify(token);
}

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  const token = input?.value.trim();
  if (!token) return;
  localStorage.setItem(LICENSE_KEY, token);
  setStatus('Checking your license…');
  void verify(token);
});

async function verify(token: string) {
  try {
    const response = await fetch(`https://api.sociobot.in/api/v1/products/${SLUG}/verify?license=${encodeURIComponent(token)}`);
    if (!response.ok) throw new Error('unavailable');
    const verdict = await response.json() as { valid: boolean; reason: string };
    localStorage.setItem(VERDICT_KEY, JSON.stringify({ ...verdict, checkedAt: Date.now() }));
    if (verdict.valid) {
      setStatus('License verified. Paste the same license into the extension to unlock your local shelf.', 'success');
      if (input) input.value = '';
    } else {
      setStatus('This license is no longer active. Check the token from your receipt.', 'error');
    }
  } catch {
    setStatus('Verification is unavailable while offline. Your free reader still works.', 'notice');
  }
}

function parseVerdict(value: string | null): { valid: boolean; checkedAt: number } | undefined {
  if (!value) return undefined;
  try { return JSON.parse(value) as { valid: boolean; checkedAt: number }; } catch { return undefined; }
}

function setStatus(message: string, tone = 'notice') {
  if (!status) return;
  status.textContent = message;
  status.dataset.tone = tone;
}

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => void navigator.serviceWorker.register('/sw.js'));
}
