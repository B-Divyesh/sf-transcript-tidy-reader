# Transcript Tidy review 1 — PASS

**Verdict: PASS.** There are zero findings at every severity and zero untested public claims.

Reviewed: 6 September 2026 UTC  
Implementation candidate: `3594788032957fa7aabe340d9c2f375ff8fa54e0`  
Documentation baseline: `1ce8e19c62ce349c0605b5bfd2700ef9e4a9b5f6`  
Live URL: <https://transcript-tidy-reader.sociobot.in/>

No product code was changed. The supplied verification-5 report and every earlier review report were read before testing. The named external evidence path was not mounted in this worker; the repository copy of verification 5 supplied the same prior verdict and implementation SHA.

## Job, audience, and first action

In fresh 1440 px desktop and 390 px phone browsers, before scrolling, the first screen states:

- Job: **“Turn captions into a readable page.”**
- Audience: people who prefer reading and have accessible YouTube or TED captions.
- First action: **“Try it with sample data”**; the adjacent text says that it opens a working reader.

Transcript Tidy is a Chrome extension for people who absorb text better than video or audio. It reformats an already accessible caption track into local paragraphs with search, timestamp links, printing, and exports. It does not create, download, or publish transcripts.

## Live product review

Fresh desktop and phone browser contexts both passed:

- The one-click action opened `/demo/`. Its persistent label read “Demo — sample data, nothing is saved.” Searching `pause` returned two matches. Reset cleared the query and marks. `localStorage`, `sessionStorage`, and IndexedDB were empty, so sample activity did not touch real data.
- The landing and demo made no off-origin requests and emitted no console errors. Playwright axe scans had no violations in either view.
- `/`, `/demo/`, `/privacy/`, and `/terms/` return 200 with their own titles, one h1, and a main landmark. An unknown route returns the designed recovery page with HTTP 404, one h1, main, and a link home.
- At 390 px and at the 195 px 200%-reflow equivalent, every public route had `scrollWidth === innerWidth`. Keyboard focus reaches the skip link first; its focus outline is 3 px. Reduced motion sets scroll behavior to `auto` and removes visible transition duration.
- A fresh service-worker context reloaded the landing page offline with the heading intact. Response headers include HSTS, `nosniff`, strict-origin referrer policy, denied camera/microphone/geolocation, and a self-only CSP with response-header `frame-ancestors 'none'`.

`/opt/fleet/lib/verify-url.sh` passed against the live home page: HTTP 200, 812 ms measured load, correct title/lang, one h1, main, no missing image alt text, no unlabeled buttons, and no console errors. The standalone `@axe-core/cli` invocation could not start because its Selenium Chrome binary is absent in this worker; this is an environment limitation, not a product failure. The required alternative Playwright axe integration ran successfully against fresh live desktop and phone pages, and the local suite covers all public and extension surfaces.

## Installed artifact and recovery paths

The live download returned HTTP 200. It passed `unzip -t`, then was extracted and loaded as an MV3 extension in a fresh Chromium profile. Its popup loaded with the expected heading and **Tidy this transcript** action.

Using that installed artifact with controlled source pages:

- A 2,000-cue accessible caption track captured successfully and reflowed to 250 paragraphs.
- A 500 caption response returned `parse-error` with refresh-and-retry guidance.
- A page without an accessible track returned `no-captions` with a next step.

The complete extension suite also exercises the normal YouTube json3 and current TED visible-transcript fixtures, offline recovery, local search, timestamps, type and spacing controls, print, TXT/HTML export, mobile reader accessibility, and light/dark extension surfaces.

## Clean checkout, claims, and build

From the clean reviewed checkout, `npm ci` completed successfully. These declared quality commands all passed:

```sh
npm run typecheck
npm run lint
npm run build
npm audit --omit=dev --audit-level=high
npm audit --audit-level=high
npm test
```

`npm test` passed four Vitest tests and the 26-test Playwright run. The intentional duplicate extension-project skips are scoped by project in the tests. The build produced `dist/site/`, a 42.65 KB unpacked MV3 extension, and a 22.96 KB WXT ZIP (23 KB in the static download).

Every exact command in `.factory/claims.json` was run separately and passed:

| Claim ID | Result |
| --- | --- |
| `download-package` | PASS |
| `demo-sandbox` | PASS |
| `reader-workflow` | PASS |
| `source-scope` | PASS |
| `local-private` | PASS |
| `local-export` | PASS |
| `reader-controls` | PASS |
| `runtime-privacy` | PASS |
| `plus-shelf` | PASS |

The landing page and README were cross-checked against the claims list. No public claim is missing a declared, runnable test. The pending Plus wording is accurate: it exposes no checkout, license entry, storage, or request until factory billing registration exists; this static product has no backend or tenant state, so no 429/`Retry-After` claim is made.

## Deployment match

The rebuilt candidate and live deployment have identical SHA-256 values:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `b11e74a7d05ffbd01a62cc37492e016a87d1cf2a4e5d53cae5d9b10242eec9de` |
| `sw.js` | `42db81cc91fe86cc7c0276a848d64e26284b6732537ec4cf126b7c852ea1c121` |
| `downloads/transcript-tidy-chrome.zip` | `50fbaaa53c8a61ff02576083f73f68ca13a13451f71c425617c910649ef80442` |

## Earlier findings disposition

| Earlier finding | Current disposition |
| --- | --- |
| Missing ZIP; clean setup failure; mobile reader name; small legal controls; AVIF MIME | Resolved. The live ZIP is valid and installed successfully; `prepare` runs on clean install; extension/mobile regression tests pass; touch and MIME checks pass. |
| Missing demo; TED selector drift; options contrast; consumer install guidance; reflow; metadata; designed 404; uncovered claims | Resolved. The isolated live demo, current TED fixture, light/dark axe coverage, unzip guidance, 200% reflow, route metadata, recovery page, and nine-claim coverage all pass. |
| Billing verification lacked a permitted observable rate-limit contract | Resolved within product scope. No billing request or restore flow remains while registration is pending, and the product makes no allowance claim. |

No findings remain.
