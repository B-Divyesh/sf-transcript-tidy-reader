# Transcript Tidy

Transcript Tidy is a local-first Chrome extension for people who would rather read than watch or listen. On a captioned YouTube or TED page, it turns the caption track the visitor can already access into a stable document with readable paragraphs, search, timestamp links, type controls, printing, and TXT/HTML export.

The free reader contains the complete core workflow. A one-time $12 Plus license adds an on-device shelf for up to 50 recent transcripts; no accessibility control or export is paywalled.

Live product page: <https://transcript-tidy-reader.sociobot.in>

## Privacy and scope

Caption parsing, paragraph reflow, search, storage, and exports happen in the browser. Transcript text is not uploaded, analyzed, or published. The extension does not download video, generate missing transcripts, bypass access controls, summarize content, or create a hosted transcript library. It currently supports YouTube and TED pages that expose captions to the visitor.

The only remote request made by the product itself is optional license verification through the Sociobot billing API. See [`site/privacy/index.html`](site/privacy/index.html) and [`site/terms/index.html`](site/terms/index.html).

## Develop

Requirements: Node.js 20+ and npm.

```sh
npm install
npm run dev          # WXT extension development
npm run dev:site     # landing page at http://localhost:5173
npm run typecheck
npm test
npm run build
```

`npm test` runs parser unit tests plus Playwright checks at desktop and 390 px, an axe accessibility scan, the license-return flow, and an installed-extension smoke test that captures a mocked caption track and exercises the reader.

## Build outputs

`npm run build` is the reproducible production command. It creates:

- `.output/chrome-mv3/` — unpacked Manifest V3 extension
- `.output/transcript-tidy-reader-1.0.0-chrome.zip` — WXT package
- `dist/site/index.html` — deployable static landing root
- `dist/site/downloads/transcript-tidy-chrome.zip` — landing-page download

To try the unpacked extension locally, open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select `.output/chrome-mv3`.

## Architecture

- WXT + TypeScript, Manifest V3
- Plain TypeScript and CSS for the static marketing/legal site
- No framework, CDN, remote font, analytics SDK, or server database
- YouTube `json3` and WebVTT parsing with a visible-transcript fallback
- Browser extension storage for the active transcript and optional Plus shelf

The generated reading-garden illustration and its exact prompt/provenance are documented in [`.factory/design.md`](.factory/design.md). The code and original project assets are MIT licensed.

## Deployment

Deploy `dist/site/` as the static root. The factory owns DNS, hosting, billing registration, and release-channel changes. The production billing links use the product slug rather than a hard-coded billing product ID.

## Known source limitations

Source sites can change their caption markup and formats. Videos with no caption track accessible to the current visitor are intentionally unsupported. Auto-generated captions work when YouTube exposes their track, but Transcript Tidy does not make accuracy claims about source captions.
