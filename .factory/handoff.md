# Transcript Tidy — repair handoff

Work order: `transcript-tidy-reader-repair-2`

Completed: 30 August 2026 UTC

Implementation commit: `bb951464cffc790f8d324985ba988830f38f2eec`

Live URL: <https://transcript-tidy-reader.sociobot.in/>

## Result

All findings in verifier report commit
`41816a75b44c6f9e3715280bf07a5c40ed5e0e3c` are repaired and deployed. The
extension remains a WXT + TypeScript Manifest V3 browser extension with a
static landing site.

## Failures reproduced first

The original candidate `b95d1aaeada0884fe1cc38b6dfedafc822957dbb`
was checked in an isolated clean worktree on the current worker image.

- `npm ci` succeeded, then `npm run typecheck` exited 2 with `TS5083` because
  `.wxt/tsconfig.json` did not exist.
- `npm test` exited 1 before collecting tests with `TSConfckParseError` for the
  same missing WXT config.
- The live download returned HTTP 404, `text/html`, and 2,400 bytes.
- At 390×844, the reader brand text computed to `display:none`; the link had
  no accessible name and axe reported serious `link-name` on `.brand`.
- The live AVIF returned `application/octet-stream`.
- The verifier's footer measurement was covered with an explicit 44×44 test.
- The previous repair's hidden deployment regression was also reproduced:
  the work-order command ends with `npm run build:site`, and that command
  removed `dist/site/downloads/transcript-tidy-chrome.zip` after tests had
  produced it.

## Repairs

- `prepare`, `test`, `typecheck`, and `lint` now generate WXT types before
  consuming the generated TypeScript config.
- `build:site` now rebuilds and packages the extension after Vite clears the
  site output. It is safe as the final command in the work-order deployment.
- The 390px reader brand has a persistent `aria-label="Transcript Tidy"`.
- Footer legal targets enforce both dimensions at 44px or greater.
- Static Web Apps maps `.avif` to `image/avif`.
- The service-worker cache has a content-derived version, activates
  immediately, deletes old caches, and never caches unsuccessful responses.
- Regression coverage checks the ZIP status, MIME type, signature, mobile
  accessible name, compact breakpoint, light/dark axe results, touch targets,
  keyboard focus, cache version, and isolated offline reload.
- Claim tests now cover YouTube json3 and TED WebVTT capture, search,
  timestamps, local TXT/HTML exports, request boundaries, license restore,
  and the 50-item shelf cap. See `.factory/claims.json`.
- Landing copy was tightened to direct language; the audited sentence counts
  and terminology are in `.factory/copy-audit.md`.

## Verification evidence

The final clean release sequence passed:

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run build:site
```

- Vitest: 4 passed.
- Playwright 1.58.2: 18 passed across desktop and 390px; 2 intentional
  cross-project skips.
- TypeScript and ESLint: passed with no findings.
- All claim-tagged browser tests passed as part of the full run.
- ZIP integrity: passed; deployed package is 23,288 bytes.
- Unpacked extension: about 42.92 KB.
- Landing initial JS: 1,597 bytes; shared JS: 711 bytes; CSS: 9,614 bytes.
- `npm audit --omit=dev`: 0 production vulnerabilities.
- Local `verify-url.sh`: HTTP 200, no console errors, title and `lang=en`
  present, one `h1`, one `main`, no missing alt text, no unlabeled buttons.
- Local Lighthouse 13 mobile: Performance 100, Accessibility 100, Best
  Practices 100, SEO 100; FCP 1.0 s, LCP 1.5 s, TBT 0 ms, CLS 0.
- Fresh live desktop and 390px contexts: no console errors, no third-party
  page requests, no serious/critical axe findings, 44px footer targets, and a
  visible 3px keyboard focus outline.
- Fresh live context: the installed service worker reloaded the landing page
  offline with the correct title and heading.
- Live `verify-url.sh`: HTTP 200, 643 ms load, no console errors, title,
  language, heading, main landmark, alt text, and button labels all passed.

## Deployment and identity

The built `dist/site` was uploaded only to the existing
`sf-transcript-tidy-reader` Static Web App. No shared DNS, billing, database,
key-vault, or other application resource was read or changed.

- `/downloads/transcript-tidy-chrome.zip`: HTTP 200,
  `Content-Type: application/zip`, valid archive.
- Local/live ZIP SHA-256:
  `912ee319ac5d4da11cdc4cf6054203b2d762749f53aa3c74dad90c7b3a4a45d6`.
- `/assets/reading-garden-1440.avif`: HTTP 200,
  `Content-Type: image/avif`.
- Local/live AVIF SHA-256:
  `bb327845e87d445f54944af48d01d5cb7a2c84ed3eddb106d7a4124cb13c058b`.
- Local and live SHA-256 also match for `index.html`, both legal pages, and
  `sw.js`.
- Live security policy includes self-only defaults, the explicit Sociobot API
  connection, `nosniff`, strict-origin referrer policy, frame blocking, and
  denied camera, microphone, and geolocation.

## Known external gap

The product-specific Sociobot checkout endpoint currently returns 404
`enabled factory product`. Billing registration is owned by the factory and
is explicitly outside this repository's authority. The free extension,
downloads, and license-restore path are unaffected. The full dependency audit
also reports 10 development-only advisories inherited through WXT tooling;
the shipped product has no production dependencies or production advisories.
