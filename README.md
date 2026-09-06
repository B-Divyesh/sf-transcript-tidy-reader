# Transcript Tidy

Transcript Tidy is a Chrome extension for people who prefer reading. It turns
accessible YouTube and TED captions into readable paragraphs with search and
timestamp links. Processing stays in the browser.

Try the isolated sample reader at
<https://transcript-tidy-reader.sociobot.in/demo/>. It needs no account and
does not save demo data.

## Install the extension

The public release is an unpacked Chrome extension, not a Web Store listing.

1. Download `transcript-tidy-chrome.zip` from the product page.
2. Extract the ZIP to a folder you can keep.
3. Open `chrome://extensions` and turn on Developer mode.
4. Select **Load unpacked** and choose the folder containing `manifest.json`.

The ZIP includes `INSTALL.txt` with the same steps.

## Reader and source scope

On a captioned YouTube or TED page, select the extension and choose **Tidy
this transcript**. It makes paragraphs, search, timestamp links, type and
spacing controls, printing, and TXT/HTML exports available without Plus.

Transcript Tidy reads only captions the open page makes available. It does
not download video, create missing captions, bypass access controls, summarise
content, or publish a transcript library.

## Privacy

Capture, paragraph reflow, search, storage, and export stay in the browser.
Transcript text is not sent to Transcript Tidy. Caption requests start only
after the visitor selects the extension.

The site has no analytics, remote fonts, or third-party runtime scripts.

Transcript Tidy Plus is a $12 one-time local shelf for up to 50 recent reads.
Factory billing registration is pending, so checkout and license restoration
are unavailable. The site and extension make no license-check request while
that dependency is unavailable.

See [`site/privacy/index.html`](site/privacy/index.html) and
[`site/terms/index.html`](site/terms/index.html).

## Develop and verify

Requirements: Node.js 20+ and npm.

```sh
npm ci
npm run dev          # WXT extension development
npm run dev:site     # static site at http://localhost:5173
npm test
npm run typecheck
npm run lint
npm run build
```

`npm test` runs parser tests plus Playwright at desktop and 390 px. It covers
the sample sandbox, 200% reflow, accessibility, local exports, source errors,
license restoration, and an installed-extension workflow.

## Build outputs

`npm run build` creates:

- `.output/chrome-mv3/` — unpacked Manifest V3 extension
- `.output/transcript-tidy-reader-1.0.1-chrome.zip` — WXT package
- `dist/site/` — complete static deployment, including the download ZIP

## Architecture and deployment

- WXT + TypeScript, Manifest V3 extension
- Vite + plain TypeScript and CSS static site
- Browser extension storage; no server database
- YouTube `json3`, WebVTT, and current visible-transcript adapters
- Plus billing is a pending Sociobot registration, not a substitute checkout

Deploy `dist/site/` as the static root for
`sf-transcript-tidy-reader`. The factory owns DNS, hosting, billing
registration, and release channels.

The original reading-garden art and its provenance are documented in
[`.factory/design.md`](.factory/design.md). Code and original assets use the
MIT license.
