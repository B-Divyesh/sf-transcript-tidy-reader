import { formatTimestamp, timestampUrl } from '../../src/transcript';
import type { Paragraph, Transcript } from '../../src/types';
import './style.css';

const documentView = document.querySelector<HTMLElement>('#document')!;
const emptyView = document.querySelector<HTMLElement>('#empty')!;
const transcriptRoot = document.querySelector<HTMLElement>('#transcript')!;
const title = document.querySelector<HTMLElement>('#title')!;
const sourceKind = document.querySelector<HTMLElement>('#source-kind')!;
const meta = document.querySelector<HTMLElement>('#meta')!;
const source = document.querySelector<HTMLAnchorElement>('#source')!;
const search = document.querySelector<HTMLInputElement>('#search')!;
const matchCount = document.querySelector<HTMLElement>('#match-count')!;
const toast = document.querySelector<HTMLElement>('#toast')!;
const settingsToggle = document.querySelector<HTMLButtonElement>('#settings-toggle')!;
const settings = document.querySelector<HTMLElement>('#settings')!;
let transcript: Transcript | undefined;

void browser.storage.local.get('activeTranscript').then(({ activeTranscript }) => {
  if (!isTranscript(activeTranscript)) {
    emptyView.hidden = false;
    document.title = 'Start reading — Transcript Tidy';
    return;
  }
  transcript = activeTranscript;
  documentView.hidden = false;
  render(activeTranscript);
});

function isTranscript(value: unknown): value is Transcript {
  return typeof value === 'object' && value !== null && 'paragraphs' in value && Array.isArray(value.paragraphs);
}

function render(value: Transcript, query = '') {
  title.textContent = value.title;
  sourceKind.textContent = `${value.sourceKind === 'youtube' ? 'YouTube' : 'TED'} transcript`;
  meta.textContent = `${value.paragraphs.length} reading sections · ${value.language}`;
  source.href = value.sourceUrl;
  document.title = `${value.title} — Transcript Tidy`;
  transcriptRoot.replaceChildren();

  let matches = 0;
  value.paragraphs.forEach((paragraph) => {
    const section = document.createElement('section');
    section.className = `paragraph${paragraph.isHeading ? ' heading' : ''}`;
    const jump = document.createElement('a');
    jump.className = 'timestamp';
    jump.href = timestampUrl(value, paragraph.startMs);
    jump.target = '_blank';
    jump.rel = 'noreferrer';
    jump.textContent = formatTimestamp(paragraph.startMs);
    jump.setAttribute('aria-label', `Open video at ${formatTimestamp(paragraph.startMs)}`);
    const copy = paragraph.isHeading ? document.createElement('h2') : document.createElement('p');
    matches += appendHighlighted(copy, paragraph, query);
    section.append(jump, copy);
    transcriptRoot.append(section);
  });
  matchCount.textContent = `${matches} ${matches === 1 ? 'match' : 'matches'}`;
}

function appendHighlighted(element: HTMLElement, paragraph: Paragraph, query: string): number {
  if (!query.trim()) {
    element.textContent = paragraph.text;
    return 0;
  }
  const needle = query.trim().toLocaleLowerCase();
  const haystack = paragraph.text.toLocaleLowerCase();
  let start = 0;
  let count = 0;
  while (true) {
    const index = haystack.indexOf(needle, start);
    if (index < 0) break;
    element.append(document.createTextNode(paragraph.text.slice(start, index)));
    const mark = document.createElement('mark');
    mark.textContent = paragraph.text.slice(index, index + needle.length);
    element.append(mark);
    count += 1;
    start = index + needle.length;
  }
  element.append(document.createTextNode(paragraph.text.slice(start)));
  return count;
}

search.addEventListener('input', () => transcript && render(transcript, search.value));

settingsToggle.addEventListener('click', () => {
  const open = settings.hidden;
  settings.hidden = !open;
  settingsToggle.setAttribute('aria-expanded', String(open));
  if (open) settings.querySelector<HTMLElement>('button')?.focus();
});

document.querySelectorAll<HTMLButtonElement>('[data-font]').forEach((button) => {
  button.addEventListener('click', () => {
    document.documentElement.dataset.font = button.dataset.font;
    document.querySelectorAll<HTMLButtonElement>('[data-font]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
  });
});

const size = document.querySelector<HTMLInputElement>('#font-size')!;
const line = document.querySelector<HTMLInputElement>('#line-height')!;
size.addEventListener('input', () => {
  document.documentElement.style.setProperty('--reader-size', `${size.value}px`);
  document.querySelector<HTMLOutputElement>('#size-output')!.value = `${size.value} px`;
});
line.addEventListener('input', () => {
  const value = Number(line.value) / 100;
  document.documentElement.style.setProperty('--reader-leading', String(value));
  document.querySelector<HTMLOutputElement>('#line-output')!.value = value.toFixed(2);
});

document.querySelector<HTMLButtonElement>('#theme')!.addEventListener('click', (event) => {
  const dark = document.documentElement.dataset.theme !== 'dark';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  (event.currentTarget as HTMLButtonElement).textContent = dark ? 'Use light theme' : 'Use dark theme';
});

document.querySelector<HTMLButtonElement>('#print')!.addEventListener('click', () => window.print());
document.querySelector<HTMLButtonElement>('#export-txt')!.addEventListener('click', () => {
  if (!transcript) return;
  const body = transcript.paragraphs.map((paragraph) => `[${formatTimestamp(paragraph.startMs)}] ${paragraph.text}`).join('\n\n');
  download(`${transcript.title}\n${transcript.sourceUrl}\n\n${body}\n`, 'txt', 'text/plain');
});
document.querySelector<HTMLButtonElement>('#export-html')!.addEventListener('click', () => {
  if (!transcript) return;
  const body = transcript.paragraphs.map((paragraph) => `<p><a href="${escapeHtml(timestampUrl(transcript!, paragraph.startMs))}">${formatTimestamp(paragraph.startMs)}</a> ${escapeHtml(paragraph.text)}</p>`).join('');
  download(`<!doctype html><html lang="en"><meta charset="utf-8"><title>${escapeHtml(transcript.title)}</title><main><h1>${escapeHtml(transcript.title)}</h1>${body}</main>`, 'html', 'text/html');
});

function download(content: string, extension: string, type: string) {
  if (!transcript) return;
  const blob = new Blob([content], { type: `${type};charset=utf-8` });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${transcript.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'transcript'}.${extension}`;
  link.click();
  URL.revokeObjectURL(link.href);
  toast.textContent = `Exported ${extension.toUpperCase()} locally.`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);
}
