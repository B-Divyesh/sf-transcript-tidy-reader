import { copyFile, mkdir, readdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const output = resolve('.output');
const downloads = resolve('dist/site/downloads');
await mkdir(downloads, { recursive: true });

const files = await readdir(output);
const zip = files.find((name) => name.endsWith('.zip') && name.includes('chrome'));
if (!zip) throw new Error('WXT did not produce a Chrome extension zip.');

const source = resolve(output, zip);
const target = resolve(downloads, 'transcript-tidy-chrome.zip');
await copyFile(source, target);
const { size } = await stat(target);
console.log(`Packaged extension: ${target} (${Math.ceil(size / 1024)} KB)`);
