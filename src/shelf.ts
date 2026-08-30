import type { Transcript } from './types';

export const MAX_SHELF_ITEMS = 50;

export function addToShelf(transcript: Transcript, shelf: Transcript[]): Transcript[] {
  return [transcript, ...shelf.filter((item) => item.id !== transcript.id)].slice(0, MAX_SHELF_ITEMS);
}
