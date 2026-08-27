import { createTranscript, parseTimestamp, parseVtt, parseYouTubeJson3, sourceKindFromUrl } from './transcript';
import type { CaptureResult, Cue, Transcript } from './types';

type CaptionTrack = { baseUrl?: string; languageCode?: string; name?: { simpleText?: string }; kind?: string };

function extractJsonArrayAfter(source: string, marker: string): unknown[] | undefined {
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) return undefined;
  const start = source.indexOf('[', markerIndex + marker.length);
  if (start < 0) return undefined;
  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const character = source[index]!;
    if (quoted) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') quoted = false;
      continue;
    }
    if (character === '"') quoted = true;
    else if (character === '[') depth += 1;
    else if (character === ']' && --depth === 0) {
      try {
        return JSON.parse(source.slice(start, index + 1)) as unknown[];
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}

function pageTitle(): string {
  const heading = document.querySelector<HTMLElement>('main h1, h1');
  const meta = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
  return (heading?.innerText || meta?.content || document.title).replace(/\s*[|—-]\s*(YouTube|TED)\s*$/i, '').trim();
}

function transcriptFromCues(cues: Cue[], language: string): Transcript {
  return createTranscript({
    title: pageTitle() || 'Untitled transcript',
    sourceUrl: location.href,
    sourceKind: sourceKindFromUrl(location.href),
    language,
    cues
  });
}

function captureVisibleYouTubePanel(): Cue[] {
  return [...document.querySelectorAll<HTMLElement>('ytd-transcript-segment-renderer')].flatMap((segment) => {
    const time = segment.querySelector<HTMLElement>('.segment-timestamp, [class*="timestamp"]')?.innerText.trim();
    const text = segment.querySelector<HTMLElement>('.segment-text, [class*="segment-text"]')?.innerText.trim();
    if (!time || !text) return [];
    const startMs = parseTimestamp(time);
    return Number.isFinite(startMs) ? [{ startMs, durationMs: 0, text }] : [];
  });
}

async function captureYouTube(): Promise<Transcript | undefined> {
  const scripts = [...document.scripts].map((script) => script.textContent ?? '');
  let tracks: CaptionTrack[] = [];
  for (const source of scripts) {
    if (!source.includes('captionTracks')) continue;
    const result = extractJsonArrayAfter(source, '"captionTracks":');
    if (result) {
      tracks = result as CaptionTrack[];
      break;
    }
  }

  const track = tracks.find((item) => item.baseUrl && item.kind !== 'asr') ?? tracks.find((item) => item.baseUrl);
  if (track?.baseUrl) {
    const captionUrl = new URL(track.baseUrl.replace(/\\u0026/g, '&'));
    captionUrl.searchParams.set('fmt', 'json3');
    const response = await fetch(captionUrl, { credentials: 'include' });
    if (!response.ok) throw new Error(`Caption request returned ${response.status}`);
    const cues = parseYouTubeJson3(await response.json());
    if (cues.length) return transcriptFromCues(cues, track.languageCode ?? track.name?.simpleText ?? 'Unknown');
  }

  const visible = captureVisibleYouTubePanel();
  return visible.length ? transcriptFromCues(visible, document.documentElement.lang || 'Unknown') : undefined;
}

function findTedVttUrl(): string | undefined {
  const track = document.querySelector<HTMLTrackElement>('video track[kind="captions"], video track[kind="subtitles"]');
  if (track?.src) return track.src;
  for (const script of [...document.scripts]) {
    const source = script.textContent?.replace(/\\u002F/g, '/').replace(/\\\//g, '/') ?? '';
    const match = source.match(/https?:[^"'\s]+\.vtt(?:\?[^"'\s]*)?/i);
    if (match?.[0]) return match[0].replace(/\\u0026/g, '&');
  }
  return undefined;
}

function captureVisibleTedTranscript(): Cue[] {
  const candidates = document.querySelectorAll<HTMLElement>('[data-testid*="transcript"] li, [class*="transcript"] li, [class*="Transcript"] li');
  return [...candidates].flatMap((item, index) => {
    const time = item.querySelector<HTMLElement>('time, button, [class*="time"]')?.innerText.trim() ?? '';
    const text = item.innerText.replace(time, '').trim();
    const startMs = parseTimestamp(time);
    return text ? [{ startMs: Number.isFinite(startMs) ? startMs : index * 5_000, durationMs: 0, text }] : [];
  });
}

async function captureTed(): Promise<Transcript | undefined> {
  const url = findTedVttUrl();
  if (url) {
    const response = await fetch(url, { credentials: 'include' });
    if (!response.ok) throw new Error(`Caption request returned ${response.status}`);
    const cues = parseVtt(await response.text());
    if (cues.length) return transcriptFromCues(cues, document.documentElement.lang || 'Unknown');
  }
  const visible = captureVisibleTedTranscript();
  return visible.length ? transcriptFromCues(visible, document.documentElement.lang || 'Unknown') : undefined;
}

export async function capturePageTranscript(): Promise<CaptureResult> {
  const kind = sourceKindFromUrl(location.href);
  if (kind === 'generic') {
    return { ok: false, code: 'unsupported', message: 'Transcript Tidy currently supports YouTube and TED pages.' };
  }
  if (!navigator.onLine) {
    return { ok: false, code: 'offline', message: 'You appear to be offline. Reconnect so this page can provide its caption track.' };
  }
  try {
    const transcript = kind === 'youtube' ? await captureYouTube() : await captureTed();
    if (!transcript) {
      return {
        ok: false,
        code: 'no-captions',
        message: 'No accessible captions were found. Choose a video with captions, or open its transcript panel and try again.'
      };
    }
    return { ok: true, transcript };
  } catch {
    return {
      ok: false,
      code: 'parse-error',
      message: 'The page exposed captions, but they could not be read. Refresh the video page and try once more.'
    };
  }
}
