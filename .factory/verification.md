# Verification report — FAIL

Verified: 2026-08-28 (UTC)  
Candidate commit: `b95d1aaeada0884fe1cc38b6dfedafc822957dbb` (`main`)  
Live URL: <https://transcript-tidy-reader.sociobot.in/>  
Scope: independent, read-only product QA. No product code was changed.

## Decision

**FAIL — do not release this candidate.** The live site cannot deliver the extension, clean-checkout quality gates do not run in the documented order, and the mobile reader has an axe serious accessibility failure.

## Blocking and high-severity defects

1. **BLOCKER — live extension download is missing.**
   - Local `npm run build` creates `dist/site/downloads/transcript-tidy-chrome.zip` (23,266 bytes).
   - On the live URL every download CTA points to `/downloads/transcript-tidy-chrome.zip`; a fresh GET returned **404** with a 2,400-byte HTML body, at desktop and 390px.
   - The core job-to-be-done cannot begin for a visitor who follows the live install path. This is a deployment artifact omission, even though the rest of the static deployment matches the candidate.

2. **HIGH — clean-checkout typecheck and tests fail before the build.**
   - From the clean candidate after `npm ci`, `npm run typecheck` fails with `TS5083: Cannot read file '/work/repo/.wxt/tsconfig.json'`, followed by unresolved WXT/browser globals.
   - `npm test` also fails before collecting tests: `TSConfckParseError: failed to resolve "extends":"./.wxt/tsconfig.json"`.
   - The documented order is `npm install`, `npm test`, `npm run build`; it is therefore not reproducible from a clean checkout. `npm run build` generates `.wxt`; only *after* that did typecheck and the full suite pass.

3. **HIGH — mobile reader has a serious axe violation.**
   - A 390×844 extension-reader scan with a representative stored transcript reported axe **serious `link-name`** on `.brand`.
   - At the reader mobile breakpoint the visible `Transcript Tidy` span is `display:none` while the folded-page mark is `aria-hidden`, leaving the focusable header link without a discernible accessible name.
   - Desktop reader and both landing-page viewports had no serious/critical axe findings; this one mobile finding fails the accessibility baseline.

## Other findings

- **LOW — landing-page footer legal links are under the specified touch size.** Fresh desktop and 390px measurements found Terms at 35×14 CSS px and Privacy at 43×14 CSS px. The baseline requires 44×44 targets.
- **LOW — AVIF is served as `application/octet-stream`.** `/assets/reading-garden-1440.avif` is byte-identical to the build and cached correctly, but should use `image/avif`.
- `npm audit --omit=dev` reports zero production vulnerabilities. `npm ci` reports 10 advisories in the development dependency tree. There is no lint script in `package.json`.

## Evidence collected

### Build and automated checks

| Command/check | Fresh result |
| --- | --- |
| `npm ci` | Completed; 400 packages installed. |
| `npm run typecheck` immediately after clean install | **Failed**: missing generated `.wxt/tsconfig.json`. |
| `npm test` immediately after clean install | **Failed** before test collection for the same missing file. |
| Exact release command: `npm run build` | Passed. Produced `.output/chrome-mv3/`, 23.27 KB WXT ZIP, and `dist/site/`. |
| `npm run typecheck` after build | Passed. |
| `npm test` after build | Passed: 4 Vitest tests; 9 Playwright passed; 1 intentional mobile extension skip. |
| `npm run lint` | Not available (no script). |

The extension's built total is 42.85 KB. Landing initial JavaScript is 1,597 bytes plus a 711-byte module-preload helper; CSS is 9,541 bytes; no web fonts ship; the mobile WebP is 62,064 bytes. These are within the stated bundle budgets.

### Independent functional exercise

- Loaded the packaged MV3 extension in Chromium and exercised a supplied YouTube `json3` caption track end-to-end: capture, local storage, reader, search, timestamp link, settings, theme, TXT export, and HTML export. Exported HTML escaped a hostile title; search input `<script>` rendered as text and recovered to a normal match.
- Loaded a TED page with a supplied visible VTT caption track. Capture returned a local, reflowed TED transcript.
- Exercised recovery states through the installed content script: no captions returned `no-captions`, a 500 caption response returned `parse-error`, and an offline browser context returned `offline`, each with the expected recovery copy.
- Checked reader at desktop and 390px. Keyboard Tab reached a visible 3px coral skip-link focus ring; Enter operated settings/theme. No console or page errors were emitted. The mobile axe failure above remains.
- Landing page at desktop and 390px had one `<h1>`, `<main>`, title/lang, meaningful hero alt text, no console/page errors, and no serious/critical axe violations. Reduced-motion computed transitions were `0.00001s` and scroll behavior was `auto`.
- The static marketing service worker activated and a previously loaded live landing page reloaded offline with its title, h1, and main content intact. The artifact class is a browser extension, not a PWA.

### Privacy, network, and deployment checks

- A first live-page load made no outbound requests. Static inspection found no analytics, remote fonts, or third-party scripts. The only product-owned remote endpoint is the explicit Sociobot license verification request; transcript capture requests are only to the user-opened YouTube/TED caption source and use the extension's limited source host permissions.
- The manifest requests `activeTab`, `storage`, and `tabs`; host access is limited to YouTube, TED, `*.googlevideo.com`, and `api.sociobot.in`.
- Live response headers include a self-only CSP (with `connect-src` limited to the Sociobot API), `nosniff`, HSTS, strict-origin referrer policy, frame blocking via CSP, and camera/microphone/geolocation denial. Hashed CSS/JS and image assets have `public, max-age=31536000, immutable`; HTML and SW have 30-second revalidation.
- `index.html`, both legal pages, service worker, all referenced JS/CSS, and all four hero-image assets have byte-for-byte equal SHA-256 hashes locally and live. The missing ZIP is the sole checked deployment mismatch.

Lighthouse 13 generated mobile scores of Performance 100, Accessibility 100, Best Practices 100, SEO 100 with FCP 0.9 s, LCP 1.3 s, TBT 50 ms, CLS 0; however its browser tab crashed while collecting the full-page screenshot after collecting artifacts (`TARGET_CRASHED`). Those scores are supplemental, not used to override the explicit mobile axe failure.

## Required next steps

1. Deploy the generated `dist/site/downloads/transcript-tidy-chrome.zip` and verify the CTA returns HTTP 200 with a ZIP content type.
2. Make WXT preparation part of install/test/typecheck (or remove the generated-tsconfig dependency) so the documented clean sequence passes.
3. Give the mobile reader brand link a persistent accessible name, then rerun axe at 390px.
4. Increase the legal-link hit areas to at least 44×44 and configure the AVIF MIME type. Re-run the full clean verification after the fixes.

