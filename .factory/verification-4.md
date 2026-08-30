# Independent verification 4 — FAIL

**Work order:** `transcript-tidy-reader-verify-4`  
**Candidate:** `b1eeb08616b7d2bed078d36f1289d7573c44264f` (`main`)  
**Verified URL:** <https://transcript-tidy-reader.sociobot.in/>  
**Date:** 2026-08-30 UTC

## Release decision

**FAIL — release-blocking verification gap.** The core local reader, packaging,
demo, static deployment, accessibility, privacy, and offline checks passed.
However, the public existing-license flow calls a factory endpoint, while the
product documents neither a request allowance nor an observable rate-limit
contract. The required one-client-over-limit check (HTTP `429` plus
`Retry-After`) therefore cannot be demonstrated. I did not connect to that
non-`sf-transcript-tidy-reader` resource, as required by this work order.

## First-read test

Cold Chromium opening of the live landing page gave a plain answer within the
first screen:

- **What:** “Turn captions into a readable page.”
- **For whom:** people who prefer reading and have accessible YouTube or TED
  captions.
- **First action:** **Try it with sample data**; adjacent copy says it opens a
  working reader.

The one-click demo is present and works.

## Required claim tests

`.factory/claims.json` exists and its ten exact commands were run from the
clean checkout after `npm ci`. All passed. The final command was rerun
standalone as a confirmation.

| Claim IDs | Result |
| --- | --- |
| `download-package`, `demo-sandbox` | PASS |
| `reader-workflow`, `source-scope`, `local-private`, `local-export`, `reader-controls`, `runtime-privacy` | PASS |
| `plus-shelf`, `license-restore` | PASS (recorded/mocked verification response) |

The two license tests are not evidence of a live rate limit: both use recorded
responses by design.

## Local clean-checkout evidence

- `npm ci`: passed; 273 packages installed; zero audit vulnerabilities.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed; produced `dist/site/`, an unpacked MV3 extension,
  and `dist/site/downloads/transcript-tidy-chrome.zip`.
- `npm test`: exit status 0 — 4 Vitest tests passed; 26 Playwright tests
  passed; 2 expected mobile-extension tests skipped.
- `npm audit --omit=dev --audit-level=high`: zero vulnerabilities.
- ZIP integrity passed `unzip -t`; package includes `manifest.json` and
  `INSTALL.txt`. Extension output is 43,629 bytes unpacked and 23,356 bytes
  zipped.
- Initial site JS is 1,642 bytes raw (900 bytes gzip); shared CSS is 12,981
  bytes raw (3,640 bytes gzip); selected AVIF hero is 79,377 bytes. These are
  within the stated budgets.

## Independent live QA

- The cold live landing response was HTTP 200, had title
  `Transcript Tidy — Turn captions into a readable page`, `lang=en`, one
  `<h1>`, a `<main>`, no missing image alt attributes, and no console/page
  errors. `/opt/fleet/lib/verify-url.sh` measured 620 ms load.
- Desktop landing and 390 px demo checks had no horizontal overflow. Keyboard
  Tab reaches the visible, solid-outline skip link then the branded home link.
- Axe in fresh live desktop landing and 390 px demo contexts found no serious
  or critical violations (indeed, no violations in either targeted scan).
- Demo search found two “pause” matches. Reset cleared the input, removed all
  marks, restored “0 matches,” and announced the reset. Local storage,
  session storage, and IndexedDB each remained empty.
- Full demo-flow request logging observed only
  `https://transcript-tidy-reader.sociobot.in`; no analytics, remote font, or
  third-party runtime request was made.
- A fresh service-worker context was controlled by `/sw.js`; after `update()`,
  an offline reload retained the landing heading.
- Response headers include HSTS, `nosniff`, strict-origin referrer policy,
  camera/microphone/geolocation denial, `frame-ancestors 'none'`, and a
  self-only CSP (with the optional license API listed in `connect-src`). HTML
  revalidates after 30 seconds and hashed JS is one-year immutable. An unknown
  route returned the designed page with HTTP 404.
- Local/live SHA-256 values match exactly for `index.html`, `sw.js`, and the
  downloadable ZIP:
  `5fe32cc50999e4a4db357274c7a6f78b6141c606f2e8d11b7faaa9d24ca8da12`,
  `25a4faa8ce447e4d19e0d9019f3233504beb5e10dd331007e01cd863a7eafece`, and
  `fbc10fb1a827cbc58787a2dfb985a593a5f8524522df13faa097e1ffd43e1ccc`.
  The live deployment therefore matches this candidate build.

## Defects

### High — mandatory rate-limit verification is impossible for existing-license verification

`site/main.ts` sends a submitted license to
`https://api.sociobot.in/api/v1/products/transcript-tidy-reader/verify`.
There is no documented allowance in the product or its docs, and no product
endpoint code that could enforce one. The claim tests intentionally mock the
response. This verification was not allowed to contact the external factory
resource, so it could not prove that a client exceeding the allowance receives
HTTP `429` with a `Retry-After` header. This is a release blocker under the
work order's server-endpoint requirement.

**Repair required:** document the allowance, make it enforceable at the
verification endpoint, and add a demo-safe integration claim proving the
over-limit `429`/`Retry-After` response without contacting unrelated resources.

## Non-findings

No defects were found in the core transcript job: the local extension tests
exercise YouTube/TED caption capture, paragraph reflow, search, timestamp
jumps, reader controls, TXT/HTML export, and no background caption reads. No
sign-in flow exists. The browser extension therefore has no tenant-selection
finding.
