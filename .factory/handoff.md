# Transcript Tidy — repair handoff

Work order: `transcript-tidy-reader-repair-3`

Date: 30 August 2026 UTC

Base candidate: `e12e9c595bee89a159693c5f744239c07a39a831`

Verifier report commit: `ec3f2a4adde435eb9e26c4916f8de197b4f55f5b`

Release: 1.0.1

## Result

All release-blocking findings in `.factory/verification-2.md` are repaired.
The extension and static site pass the complete local release gate. Live
deployment evidence is recorded below after the production upload.

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

Pending production upload and live identity checks.

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
