# Transcript Tidy — repair 4 handoff

Date: 6 September 2026 UTC<br>
Implementation commit: `c2d524f247f65ecb961a00e837f9b4bbb41acb03`<br>
Documentation: this handoff follows the implementation in a later `docs:`
commit.

## Result

The local caption reader is release-ready. The unregistered factory billing
service is now an explicit external dependency, not a runtime dependency of
the extension or site. The product does not call its unverifiable endpoint,
so no user can encounter an undocumented request allowance or rate-limit
response.

Transcript Tidy Plus remains a paid $12 one-time local shelf for up to 50
recent reads. Checkout and license restoration are clearly unavailable until
the separate billing-registration operator registers the offer. The complete
reader, accessibility controls, printing, and exports remain free.

## What changed

- Removed the site and extension paths that sent license tokens to the
  unregistered factory verifier.
- Removed the verifier host permission and the external CSP `connect-src`
  exception.
- Preserved an already active local Plus state on a device without making a
  background verification request.
- Restored transparent Plus terms: $12, one-time, 50 local reads, and no
  checkout or restore field until registration exists.
- Replaced the old recorded-response license test with an outcome test: it
  checks the paid offer, the unavailable state, no outbound billing request,
  and the 50-item shelf boundary.
- Tightened several landing headings and sentences so they name the action
  directly.
- Added the required catalog description and billing-offer handoff metadata.

## Verification

From a clean checkout:

```sh
npm ci
npm run typecheck
npm run lint
npm run build
npm test
npm audit --omit=dev --audit-level=high
npm audit --audit-level=high
```

All commands passed. The suite includes 4 Vitest tests and 26 Playwright
project tests, with the two expected desktop/mobile extension skips. All nine
exact commands in `.factory/claims.json` also passed independently.

The production build contains a 42.65 KB unpacked extension, a 22.96 KB ZIP,
0.26 KB main-site JavaScript (0.21 KB gzip), 13.00 KB shared CSS (3.64 KB
gzip), and a 79.38 KB selected AVIF hero image.

The existing `sf-transcript-tidy-reader` static app was deployed directly
from `dist/site/`. DNS, billing, other services, and persistent-storage
configuration were not changed.

Live verification at <https://transcript-tidy-reader.sociobot.in/> passed:

- `/opt/fleet/lib/verify-url.sh` reported HTTP 200 in 787 ms, correct title,
  `lang=en`, one h1, main landmark, complete alt text, labelled buttons, and
  no browser errors.
- Fresh desktop and 390 px phone contexts showed the job, audience, and
  **Try it with sample data** action before scrolling. Both opened the sample,
  found two “pause” matches, reset to no marks, and kept local/session/Indexed
  DB storage empty.
- Playwright axe found no serious or critical issue on those live desktop and
  phone flows. The standalone axe CLI could not run because its bundled
  ChromeDriver supports Chrome 152 while the supplied Playwright Chromium is
  145; the Playwright axe integration is the applicable successful check.
- A fresh service-worker context reloaded the landing shell offline. The
  designed unknown-route page returned HTTP 404.
- Live SHA-256 values exactly match the build: `index.html`
  `9a6dea844ebcbc617e62a9fe104f516e2245e4f93c15cef63ac893babee0b873`,
  `sw.js` `33d7c101c251340bc93f386ed2045c87f3968211778117200dcd6e92b7d1a808`,
  and the extension ZIP
  `50fbaaa53c8a61ff02576083f73f68ca13a13451f71c425617c910649ef80442`.

## Earlier findings

| Report | Current disposition |
| --- | --- |
| `verification.md` | The package, clean setup, mobile accessible name, touch targets, and AVIF MIME fixes remain covered by the passing build and browser checks. |
| `verification-2.md` | The visitor demo, TED DOM adapter, extension contrast, install instructions, narrow reflow, metadata, 404, and claims coverage remain covered by the passing suites. |
| `verification-4.md` | Resolved in product scope: the unregistered external verifier is no longer called, exposed, permitted, or claimed. A fake client-side 429 response was not added. |

## Remaining external dependency

The controller must register the real Sociobot offer before enabling checkout
or new-device license restoration. The requested handoff data is at
`/work/.evidence/billing-offer.json`. After registration, restore the
Sociobot checkout/verify flow and verify its documented live allowance,
including an over-limit HTTP 429 with `Retry-After`, before advertising that
path. Do not invent a local payment or license verifier.

The public distribution remains an unpacked MV3 ZIP. The public page and ZIP
include the complete Chrome Developer-mode installation path.
