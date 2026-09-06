# Independent verification 5 — repair evidence

Date: 6 September 2026 UTC<br>
Implementation candidate: `3594788032957fa7aabe340d9c2f375ff8fa54e0`<br>
URL: <https://transcript-tidy-reader.sociobot.in/>

## Result

The product-owned repair is **PASS**. The rate-limit gap in
`verification-4.md` came from an unregistered external billing verifier. A
static product cannot document or enforce another service's allowance. The
repair removes that unusable client path rather than faking a 429 response.

The paid deliverable is retained honestly: Transcript Tidy Plus is a $12
one-time local shelf for 50 reads. Checkout and license restoration are not
advertised as working while factory registration is absent. The free reader
continues to work end to end.

## Evidence

- Clean `npm ci`, typecheck, lint, build, tests, and both audits passed.
- The full suite passed: 4 Vitest tests and 26 Playwright project tests, with
  two intentional extension-project skips.
- Each of the nine exact commands listed in `.factory/claims.json` passed
  independently from the clean setup.
- `@claim:plus-shelf` now proves the $12 one-time offer, pending state, no
  checkout/token field, no external billing request, and the observable
  50-item local shelf boundary.
- The live `verify-url.sh` check passed in 787 ms with no console error and
  correct title, language, h1, main, alt text, and button labels.
- Fresh desktop and 390 px phone browser contexts both showed the job,
  audience, and sample action before scroll. They entered the sample, found
  two realistic “pause” matches, reset cleanly, and wrote no demo storage.
- Live Playwright axe scans found no serious or critical violations. The
  standalone axe CLI was attempted but cannot use the supplied Chromium due
  to a ChromeDriver version mismatch; this is a verifier-tool mismatch, not a
  product finding.
- A separate fresh service-worker context reloaded the landing page offline.
  `/not-a-real-route` returned the designed page with HTTP 404.
- A legacy `?license=` return URL is removed without local storage or an
  external request.
- The local and live index, service worker, and ZIP SHA-256 values match.

## Billing dependency

`/work/.evidence/billing-offer.json` gives the registration operator the
actual prior $12 offer metadata and the product origin. No billing endpoint,
credential, checkout, fake purchase, or shared factory resource was accessed
or changed in this repair.
