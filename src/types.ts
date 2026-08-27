export type SourceKind = 'youtube' | 'ted' | 'generic';

export interface Cue {
  startMs: number;
  durationMs: number;
  text: string;
}

export interface Paragraph {
  startMs: number;
  endMs: number;
  text: string;
  isHeading: boolean;
}

export interface Transcript {
  id: string;
  title: string;
  sourceUrl: string;
  sourceKind: SourceKind;
  language: string;
  createdAt: number;
  cues: Cue[];
  paragraphs: Paragraph[];
}

export interface CaptureResult {
  ok: boolean;
  transcript?: Transcript;
  code?: 'unsupported' | 'no-captions' | 'offline' | 'parse-error';
  message?: string;
}
