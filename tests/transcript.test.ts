import { describe, expect, it } from 'vitest';
import { formatTimestamp, parseVtt, parseYouTubeJson3, reflowCues, timestampUrl } from '../src/transcript';

describe('transcript parsing', () => {
  it('parses WebVTT and strips cue markup', () => {
    const cues = parseVtt(`WEBVTT\n\n00:00:01.000 --> 00:00:03.500\n<c.green>Hello</c> &amp; welcome.\n\n00:00:04.000 --> 00:00:05.000\nNext thought.`);
    expect(cues).toEqual([
      { startMs: 1000, durationMs: 2500, text: 'Hello & welcome.' },
      { startMs: 4000, durationMs: 1000, text: 'Next thought.' }
    ]);
  });

  it('parses YouTube json3 segments', () => {
    expect(parseYouTubeJson3({ events: [{ tStartMs: 20, dDurationMs: 1000, segs: [{ utf8: 'A ' }, { utf8: 'line.' }] }] })).toEqual([
      { startMs: 20, durationMs: 1000, text: 'A line.' }
    ]);
  });

  it('reflows fragments into readable paragraphs', () => {
    const paragraphs = reflowCues([
      { startMs: 0, durationMs: 1000, text: 'This begins' },
      { startMs: 1000, durationMs: 1000, text: 'mid sentence and now ends.' },
      { startMs: 5000, durationMs: 1000, text: 'A separate idea follows.' }
    ]);
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0]?.text).toBe('This begins mid sentence and now ends.');
  });

  it('formats and links timestamps', () => {
    expect(formatTimestamp(3_723_000)).toBe('1:02:03');
    expect(timestampUrl({ sourceUrl: 'https://www.youtube.com/watch?v=abc', sourceKind: 'youtube' }, 62_000)).toContain('t=62s');
  });
});
