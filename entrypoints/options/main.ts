import type { Transcript } from '../../src/types';
import './style.css';

void browser.storage.local.get('transcriptShelf').then(({ transcriptShelf }) => {
  if (!Array.isArray(transcriptShelf) || !transcriptShelf.length) return;
  const shelf = document.querySelector<HTMLElement>('#shelf')!;
  const list = document.createElement('ul');
  (transcriptShelf as Transcript[]).forEach((transcript) => {
    const item = document.createElement('li');
    const open = document.createElement('button');
    open.type = 'button';
    open.textContent = transcript.title;
    open.addEventListener('click', async () => {
      await browser.storage.local.set({ activeTranscript: transcript });
      await browser.tabs.create({ url: browser.runtime.getURL('/reader.html') });
    });
    item.append(open);
    list.append(item);
  });
  shelf.replaceChildren(list);
});
