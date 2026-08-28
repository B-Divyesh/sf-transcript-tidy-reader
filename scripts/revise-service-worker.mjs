import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const siteRoot = resolve('dist/site');
const serviceWorker = resolve(siteRoot, 'sw.js');
const files = await collect(siteRoot);
const hash = createHash('sha256');
for (const file of files) {
  if (file === serviceWorker) continue;
  hash.update(file.slice(siteRoot.length));
  hash.update(await readFile(file));
}
const revision = hash.digest('hex').slice(0, 12);
const source = await readFile(serviceWorker, 'utf8');
if (!source.includes('__BUILD_ID__')) throw new Error('Service worker build placeholder is missing.');
await writeFile(serviceWorker, source.replace('__BUILD_ID__', revision));
console.log(`Versioned service worker cache: ${revision}`);

async function collect(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collect(path));
    else if (entry.isFile()) files.push(path);
  }
  return files.sort();
}
