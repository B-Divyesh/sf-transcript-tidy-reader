# Transcript Tidy — repair handoff

Work order: `transcript-tidy-reader-repair-3`

Date: 30 August 2026 UTC

Base candidate: `e12e9c595bee89a159693c5f744239c07a39a831`

Verifier report commit: `ec3f2a4adde435eb9e26c4916f8de197b4f55f5b`

Release: 1.0.1

## Result

All release-blocking findings in `.factory/verification-2.md` are repaired.
The extension and static site pass the complete local and live release gates.
Product commit `41810e1` was pushed to `origin/main` and deployed.

## Repairs

- Added a real one-click visitor sandbox at `/demo/`. It contains an original
  three-passage sample, search, type and spacing controls, timestamp feedback,
  print, text export, a persistent demo banner, reset, and start-for-real.
  Demo state exists only in page memory.
- Updated TED capture for its current visible transcript structure:
  `div.mb-6.w-full`, timestamp buttons, and `div[role="button"]` segments. The
  source claim now uses that representative DOM instead of a `<track>` escape.
- Changed the light options-page coral to `#A23D31`. Axe now passes options,
  popup, and populated reader surfaces in light and dark at 390 px.
- Fixed a reader settings selector that could put `aria-pressed` on `<html>`
  after changing typeface.
- Removed the unavailable purchase offer and all buy links. New Plus sales are
  stated as paused. Existing valid licenses and the 50-item local shelf remain
  restorable, preserving the behavior that already worked.
- Added complete public installation steps and packaged `INSTALL.txt`. The ZIP
  path now explains unzip, Developer mode, Load unpacked, and `manifest.json`.
- Reworked narrow header, controls, demo, legal links, and footer layout. Every
  public route has no horizontal overflow at 195 CSS px.
- Added a designed 404, `/demo/`, canonical and social metadata, a 1200×630
  social image, Apple touch icon, sitemap entry, version/build text, ZIP MIME,
  HSTS configuration, and a branded Azure 404 response override.
- Raised skip, legal-note, footer, and mail-link targets to at least 44 px.
- Listed and tested every retained public claim. The copy audit was regenerated
  and has no sentence over 22 words or banned marketing term.
- Upgraded WXT from 0.20 to 0.21.4. Both production and full dependency audits
  now report zero vulnerabilities.

## Local verification evidence

Run from `/work/repo`:

```sh
npm ci
npm run typecheck
npm run lint
npm run build
npm test
npm audit --omit=dev
npm audit --audit-level=high
```

Results:

- Clean install: 273 packages; zero audit vulnerabilities.
- Unit: 4 Vitest tests passed.
- Browser/integration: 26 Playwright tests passed; 2 intentional project skips.
- TypeScript and ESLint: passed.
- Production build: passed; `dist/site/`, unpacked MV3 extension, and ZIP all
  produced.
- Extension output: 43.63 KB unpacked; 23.36 KB ZIP.
- Static initial assets: 1.64 KB main JS, 12.98 KB shared CSS, 79 KB selected
  hero AVIF, all raw sizes and below budget.
- Every exact command in `.factory/claims.json` passed independently. Site
  claims ran in desktop and mobile projects; extension claims passed in the
  desktop project with the expected mobile project skip.
- Current TED DOM regression: two visible passages captured at 00:04 and 01:12
  without a caption track. A page with no captions returned `no-captions`.
- Offline capture returned `offline`, then the same context recovered after
  connectivity returned.
- Service worker install, versioned cache update, and offline shell reload
  passed in a dedicated browser context.
- Browser checks covered 1440 px desktop, 390×844 mobile, 195 px reflow,
  keyboard focus, touch targets, no console errors, and every public route.
- Playwright axe found no serious or critical issues on landing, demo, privacy,
  terms, 404, popup, options, or populated reader surfaces. Extension light and
  dark themes were both checked.
- Runtime request logging found same-origin site resources only. Caption-track
  traffic began only after explicit capture; no video request was made.
- Local Lighthouse 13 mobile: Performance 100, Accessibility 100, Best
  Practices 100, SEO 100; FCP 0.9 s, LCP 1.5 s, TBT 0 ms, CLS 0, 88 KiB.

## Live deployment evidence

- Uploaded only `dist/site/` to the existing Azure Static Web App
  `sf-transcript-tidy-reader`. No DNS, shared app, database, key vault, or
  unrelated resource was read or changed.
- Production URL: <https://transcript-tidy-reader.sociobot.in/>.
- `/`, `/demo/`, `/privacy/`, `/terms/`, `/404.html`, and the ZIP return 200.
  An unknown path returns the designed page with HTTP 404.
- The live ZIP returns `application/zip`, is 23,356 bytes, passes `unzip -t`,
  and contains `manifest.json` plus `INSTALL.txt`.
- `/opt/fleet/lib/verify-url.sh` passed: 576 ms observed load, correct title,
  `lang=en`, one h1, main landmark, complete alt text, labelled buttons, and no
  console errors.
- Fresh live Chromium checks passed at 1440×1000 and 390×844 for all routes:
  zero unexpected console errors, zero serious/critical axe findings, one h1,
  and no horizontal overflow. Every route also has `scrollWidth=195` at the
  195 px reflow width.
- The live demo produced two “pause” matches, reset to its initial state, and
  left localStorage, sessionStorage, and IndexedDB empty.
- A fresh service-worker context updated, took control, went offline, and
  reloaded the full landing shell with the correct heading.
- A complete live browsing pass made no cross-origin request.
- Live response headers include the self CSP, `frame-ancestors 'none'`, HSTS,
  `nosniff`, strict-origin referrer policy, and denied camera, microphone, and
  geolocation permissions. AVIF is served as `image/avif`; hashed assets use
  one-year immutable caching; HTML and the service worker revalidate after 30
  seconds.
- Live Lighthouse 13 mobile: Performance 100, Accessibility 100, Best
  Practices 100, SEO 100; FCP 1.0 s, LCP 1.2 s, TBT 30 ms, CLS 0, 87 KiB.
- Live/local SHA-256 identities match exactly:
  - `index.html`: `5fe32cc50999e4a4db357274c7a6f78b6141c606f2e8d11b7faaa9d24ca8da12`
  - `sw.js`: `25a4faa8ce447e4d19e0d9019f3233504beb5e10dd331007e01cd863a7eafece`
  - extension ZIP: `fbc10fb1a827cbc58787a2dfb985a593a5f8524522df13faa097e1ffd43e1ccc`
- Active service-worker cache: `transcript-tidy-site-6fb6c47b141b`.

## Known limits and next step

- The factory billing endpoint still returns 404 for this slug. The repair did
  not access or modify the forbidden shared billing service. New sales are
  therefore paused and no broken checkout is advertised. When the factory
  registers the product, restore the buy link and add a successful live
  checkout claim test before advertising the $12 offer again.
- Distribution remains an unpacked MV3 ZIP rather than a Chrome Web Store
  listing. The public page and package now give the complete consumer path and
  state this before download.
- Source sites can change public transcript markup. The recorded current TED
  structure is now an exact release regression fixture.
