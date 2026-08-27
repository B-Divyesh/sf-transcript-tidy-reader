import type { Cue, Paragraph, SourceKind, Transcript } from './types';

const SENTENCE_END = /[.!?][\])”’"']?$/u;
const HEADING_PREFIX = /^(chapter|part|section|introduction|conclusion)\b/i;

export function cleanCueText(value: string): string {
  const textarea = typeof document === 'undefined' ? undefined : document.createElement('textarea');
  if (textarea) {
    textarea.innerHTML = value;
    value = textarea.value;
  } else {
    value = value
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^\s*(?:\[[^\]]+\]|\([^)]*\))\s*/u, '')
    .trim();
}

export function dedupeCues(cues: Cue[]): Cue[] {
  const sorted = [...cues]
    .filter((cue) => Number.isFinite(cue.startMs) && cleanCueText(cue.text))
    .map((cue) => ({ ...cue, text: cleanCueText(cue.text) }))
    .sort((a, b) => a.startMs - b.startMs);

  return sorted.filter((cue, index) => {
    const previous = sorted[index - 1];
    return !previous || cue.text !== previous.text || Math.abs(cue.startMs - previous.startMs) > 1200;
  });
}

function looksLikeHeading(text: string): boolean {
  const words = text.split(/\s+/);
  return words.length <= 10 && (HEADING_PREFIX.test(text) || (/[:：]$/u.test(text) && !SENTENCE_END.test(text)));
}

export function reflowCues(input: Cue[]): Paragraph[] {
  const cues = dedupeCues(input);
  const paragraphs: Paragraph[] = [];
  let text = '';
  let startMs = 0;
  let endMs = 0;
  let lastEnd = 0;

  const flush = () => {
    const value = text.trim();
    if (!value) return;
    paragraphs.push({ startMs, endMs, text: value, isHeading: looksLikeHeading(value) });
    text = '';
  };

  cues.forEach((cue, index) => {
    const gap = cue.startMs - lastEnd;
    if (!text) startMs = cue.startMs;
    if (text && (gap > 2400 || text.length > 520 || (text.length > 210 && SENTENCE_END.test(text)))) {
      flush();
      startMs = cue.startMs;
    }

    const next = cue.text;
    if (!text) {
      text = next;
    } else if (text.endsWith(next)) {
      // Rolling captions frequently repeat their complete previous value.
    } else if (next.startsWith(text.slice(-Math.min(80, text.length)))) {
      text += next.slice(Math.min(80, text.length));
    } else {
      text += `${/^[,.;:!?)]/.test(next) ? '' : ' '}${next}`;
    }
    endMs = cue.startMs + cue.durationMs;
    lastEnd = endMs;

    const following = cues[index + 1];
    if (!following || (SENTENCE_END.test(text) && text.length >= 110) || looksLikeHeading(text)) flush();
  });

  flush();
  return paragraphs;
}

export function parseVtt(source: string): Cue[] {
  const normalized = source.replace(/^\uFEFF/, '').replace(/\r/g, '');
  const blocks = normalized.split(/\n{2,}/);
  const cues: Cue[] = [];
  for (const block of blocks) {
    const lines = block.split('\n').filter(Boolean);
    const timingIndex = lines.findIndex((line) => line.includes('-->'));
    if (timingIndex < 0) continue;
    const [startRaw, endRaw] = lines[timingIndex]!.split('-->').map((part) => part.trim().split(/\s+/)[0]!);
    const startMs = parseTimestamp(startRaw ?? '');
    const endMs = parseTimestamp(endRaw ?? '');
    const text = cleanCueText(lines.slice(timingIndex + 1).join(' '));
    if (Number.isFinite(startMs) && Number.isFinite(endMs) && text) {
      cues.push({ startMs, durationMs: Math.max(0, endMs - startMs), text });
    }
  }
  return cues;
}

export function parseYouTubeJson3(payload: unknown): Cue[] {
  if (!payload || typeof payload !== 'object' || !('events' in payload) || !Array.isArray(payload.events)) return [];
  return payload.events.flatMap((event: unknown) => {
    if (!event || typeof event !== 'object') return [];
    const raw = event as { tStartMs?: number; dDurationMs?: number; segs?: Array<{ utf8?: string }> };
    const text = cleanCueText(raw.segs?.map((segment) => segment.utf8 ?? '').join('') ?? '');
    return text ? [{ startMs: raw.tStartMs ?? 0, durationMs: raw.dDurationMs ?? 0, text }] : [];
  });
}

export function parseTimestamp(value: string): number {
  const parts = value.replace(',', '.').split(':').map(Number);
  if (parts.some(Number.isNaN)) return Number.NaN;
  const seconds = parts.reduce((total, part) => total * 60 + part, 0);
  return Math.round(seconds * 1000);
}

export function formatTimestamp(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return hours
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function sourceKindFromUrl(url: string): SourceKind {
  const hostname = new URL(url).hostname.replace(/^www\./, '');
  if (hostname === 'youtube.com' || hostname === 'youtu.be') return 'youtube';
  if (hostname === 'ted.com' || hostname.endsWith('.ted.com')) return 'ted';
  return 'generic';
}

export function timestampUrl(transcript: Pick<Transcript, 'sourceUrl' | 'sourceKind'>, startMs: number): string {
  const url = new URL(transcript.sourceUrl);
  const seconds = Math.floor(startMs / 1000);
  if (transcript.sourceKind === 'youtube') url.searchParams.set('t', `${seconds}s`);
  else url.searchParams.set('t', String(seconds));
  return url.toString();
}

export function createTranscript(input: Omit<Transcript, 'id' | 'createdAt' | 'paragraphs'>): Transcript {
  const cues = dedupeCues(input.cues);
  return {
    ...input,
    id: `${input.sourceKind}-${hashString(`${input.sourceUrl}:${input.language}`)}`,
    createdAt: Date.now(),
    cues,
    paragraphs: reflowCues(cues)
  };
}

function hashString(value: string): string {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}
