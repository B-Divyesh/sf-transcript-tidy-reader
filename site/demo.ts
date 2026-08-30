import './style.css';
import './demo.css';
import './route-fixes.css';

const sampleRoot = document.querySelector<HTMLElement>('#sample-transcript')!;
const originalParagraphs = [...sampleRoot.querySelectorAll<HTMLParagraphElement>('p')].map((paragraph) => paragraph.textContent ?? '');
const query = document.querySelector<HTMLInputElement>('#demo-query')!;
const count = document.querySelector<HTMLElement>('#demo-match-count')!;
const spacing = document.querySelector<HTMLInputElement>('#demo-spacing')!;
const spacingOutput = document.querySelector<HTMLOutputElement>('#spacing-output')!;
const status = document.querySelector<HTMLElement>('#demo-status')!;

function renderSearch() {
  const needle = query.value.trim().toLocaleLowerCase();
  let matches = 0;
  sampleRoot.querySelectorAll<HTMLParagraphElement>('p').forEach((paragraph, index) => {
    const source = originalParagraphs[index] ?? '';
    paragraph.replaceChildren();
    if (!needle) {
      paragraph.textContent = source;
      return;
    }
    const lower = source.toLocaleLowerCase();
    let start = 0;
    while (true) {
      const found = lower.indexOf(needle, start);
      if (found < 0) break;
      paragraph.append(document.createTextNode(source.slice(start, found)));
      const mark = document.createElement('mark');
      mark.textContent = source.slice(found, found + needle.length);
      paragraph.append(mark);
      start = found + needle.length;
      matches += 1;
    }
    paragraph.append(document.createTextNode(source.slice(start)));
  });
  count.textContent = `${matches} ${matches === 1 ? 'match' : 'matches'}`;
}

query.addEventListener('input', renderSearch);

document.querySelectorAll<HTMLButtonElement>('[data-demo-font]').forEach((button) => {
  button.addEventListener('click', () => {
    sampleRoot.dataset.font = button.dataset.demoFont;
    document.querySelectorAll<HTMLButtonElement>('[data-demo-font]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
  });
});

spacing.addEventListener('input', () => {
  const value = Number(spacing.value) / 100;
  sampleRoot.style.setProperty('--demo-leading', String(value));
  spacingOutput.value = value < 1.6 ? 'Compact' : value > 1.85 ? 'Wide' : 'Relaxed';
});

document.querySelectorAll<HTMLButtonElement>('.sample-time').forEach((button) => {
  button.addEventListener('click', () => { status.textContent = `Sample timestamp ${button.dataset.time} selected. The extension would open the source at this moment.`; });
});

document.querySelector<HTMLButtonElement>('#print-demo')!.addEventListener('click', () => window.print());
document.querySelector<HTMLButtonElement>('#export-demo')!.addEventListener('click', () => {
  const transcript = originalParagraphs.map((paragraph, index) => `[${['0:14', '1:08', '2:31'][index]}] ${paragraph}`).join('\n\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([`The quiet power of a useful pause\n\n${transcript}\n`], { type: 'text/plain;charset=utf-8' }));
  link.download = 'transcript-tidy-sample.txt';
  link.click();
  URL.revokeObjectURL(link.href);
  status.textContent = 'Sample text exported. No demo data was saved.';
});

document.querySelector<HTMLButtonElement>('#reset-demo')!.addEventListener('click', () => {
  query.value = '';
  spacing.value = '172';
  spacing.dispatchEvent(new Event('input'));
  sampleRoot.dataset.font = 'serif';
  document.querySelectorAll<HTMLButtonElement>('[data-demo-font]').forEach((item) => item.setAttribute('aria-pressed', String(item.dataset.demoFont === 'serif')));
  renderSearch();
  status.textContent = 'Demo reset to its original sample.';
  document.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
});

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => void navigator.serviceWorker.register('/sw.js'));
}
