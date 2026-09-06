# Independent verification 5 — PASS

**Verdict: PASS.** There are zero findings at every severity and zero
untested public claims.

Verified: 6 September 2026 UTC
Implementation candidate: `3594788032957fa7aabe340d9c2f375ff8fa54e0`
Documentation commit: `8d8237ae0e40d0c67c0ca223e7780810527545d4`
Live URL: <https://transcript-tidy-reader.sociobot.in/>

## Job, audience, and first action

Transcript Tidy is a Chrome extension for people who prefer reading to video
or audio. It turns caption tracks the visitor can already access on YouTube
or TED into a stable, searchable reading page with timestamp links and local
exports.

On fresh 1440 px desktop and 390 px phone browsers, before scrolling, the
landing page showed:

- Job: **“Turn captions into a readable page.”**
- Audience: “For people who prefer reading…”
- First action: **“Try it with sample data”**, with adjacent explanation that
  it opens a working reader.

## Result

The deployed site is the reviewed implementation, and the release passes the
product path and quality gates. The expected unknown-route response is a
designed HTTP 404 page, not a defect.

## Clean checkout and claims

After `npm ci` from this checkout, all declared quality commands passed:

```sh
npm run typecheck
npm run lint
npm run build
npm test
npm audit --omit=dev --audit-level=high
npm audit --audit-level=high
```

`npm test` passed its four Vitest tests and all runnable Playwright tests;
the two extension-project skips are intentional duplicate-project skips. The
build produced `dist/site/`, a 42.65 KB unpacked MV3 extension, and a 22.96 KB
WXT ZIP (23 KB packaged into the static site). Both audits reported zero
vulnerabilities.

All nine exact claim commands in `.factory/claims.json` passed independently:

| Claim | Result | Observable proof |
| --- | --- | --- |
| `download-package` | PASS | Consumer guide, HTTP 200 ZIP, ZIP signature, manifest, and `INSTALL.txt`. |
| `demo-sandbox` | PASS | One-click sample, search, reset, and empty storage. |
| `reader-workflow` | PASS | Installed extension captures, reflows, searches, and links timestamps. |
| `source-scope` | PASS | Installed extension handles YouTube captions and the current TED visible-transcript DOM fixture. |
| `local-private` | PASS | Workflow request log permits only the open source and its caption track. |
| `local-export` | PASS | TXT and accessible HTML download contents are inspected. |
| `reader-controls` | PASS | Search, type, spacing, timestamps, print, and both exports work without Plus. |
| `runtime-privacy` | PASS | No remote site resources; captions begin only after explicit capture. |
| `plus-shelf` | PASS | $12 one-time, pending state, no checkout/token field or billing request, and a 50-item shelf boundary. |

There are no unlisted public claims found in the landing page or README that
are not covered by these claims.

## Live browser evidence

The required `verify-url.sh` check passed: HTTP 200 in 700 ms, title
`Transcript Tidy — Turn captions into a readable page`, `lang=en`, one h1,
main landmark, no missing image alt text, no unlabeled buttons, and no console
errors.

Fresh desktop and phone contexts both entered `/demo/` from the sample action.
The persistent banner said “Demo — sample data, nothing is saved.” Searching
for `pause` produced two marks. Reset cleared the query and all marks; local
storage, session storage, and IndexedDB each remained empty. The desktop
timestamp control announced its sample-only behavior. The phone skip link
received focus first and had a 3 px focus outline.

Playwright axe scans found no violations on the desktop landing or phone demo.
The complete local suite also scanned every public route and all extension
surfaces in the relevant light/dark and mobile states with no serious or
critical violations. At a 195 px viewport (the 200% reflow equivalent), `/`,
`/demo/`, `/privacy/`, `/terms/`, and `/404.html` each had `scrollWidth ===
innerWidth`.

Privacy, recovery, and deployment checks passed:

- The live first-screen/demo flow made only same-origin requests. A legacy
  `?license=` parameter was removed from the address bar without storage or
  off-origin requests.
- The current CSP is self-only (`connect-src 'self'`); the extension manifest
  contains no Sociobot API host permission. It uses only the limited source
  hosts required for user-selected caption capture.
- A fresh service-worker context reloaded the landing shell offline.
- `/privacy/` and `/terms/` each returned HTTP 200 with their own required
  titles and one h1. The designed unknown route returned HTTP 404 with a
  recovery link, one h1, and a main landmark. Required public assets,
  sitemap, robots file, ZIP, and the source link all returned HTTP 200.
- The live security headers include HSTS, `nosniff`, strict-origin referrer
  policy, camera/microphone/geolocation denial, and a self-only CSP with
  response-header `frame-ancestors 'none'`.

The live artifact matches the reviewed implementation exactly:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `b11e74a7d05ffbd01a62cc37492e016a87d1cf2a4e5d53cae5d9b10242eec9de` |
| `sw.js` | `42db81cc91fe86cc7c0276a848d64e26284b6732537ec4cf126b7c852ea1c121` |
| `downloads/transcript-tidy-chrome.zip` | `50fbaaa53c8a61ff02576083f73f68ca13a13451f71c425617c910649ef80442` |

The live ZIP passed `unzip -t`.

## Earlier findings and current disposition

| Earlier finding | Current disposition |
| --- | --- |
| Missing public ZIP, clean setup preparation, mobile reader name, small legal targets, and AVIF MIME (`verification.md`) | Resolved: ZIP is live and valid; `prepare` is part of test/typecheck; the extension mobile regression and touch/MIME tests pass. |
| Missing one-click demo, outdated TED selector, extension contrast, install guidance, narrow reflow, metadata/404, and uncovered claims (`verification-2.md`) | Resolved: sample sandbox is live and isolated; the installed-extension test uses the current TED DOM shape; all tested extension surfaces pass axe; consumer guidance, metadata, designed 404, 200% reflow, and claim coverage pass. |
| External billing verifier had no permitted observable rate-limit contract (`verification-4.md`) | Resolved in product scope: no site/extension verification or checkout request remains while billing registration is pending. This static product has no backend, tenant state, or live allowance to test; no fake 429 is claimed. |

No code was modified during this verification. Evidence is also copied to
`/work/.evidence/qa-report.md`.
