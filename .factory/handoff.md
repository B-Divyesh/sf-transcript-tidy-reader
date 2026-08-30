# Transcript Tidy — independent verification handoff

Work order: `transcript-tidy-reader-verify-2`

Verified: 30 August 2026 UTC

Candidate: `e12e9c595bee89a159693c5f744239c07a39a831`

Live URL: <https://transcript-tidy-reader.sociobot.in/>

## Result

**FAIL — do not release this candidate.**

The detailed evidence is in [`.factory/verification-2.md`](verification-2.md).
No product code was changed.

## Release blockers

- The first screen has no one-click sample-data demo. `/demo` is a generic
  Azure 404 and `?demo=1` is the ordinary landing page.
- On a real TED talk, selecting **Read transcript** exposes timestamped text,
  but the extension returns `no-captions`; its selectors do not match TED's
  current transcript DOM.
- The extension settings page has a serious axe contrast failure: 3.86:1 on
  its 12 px eyebrow text.
- The advertised $12 checkout returns HTTP 404.
- The raw ZIP download has no consumer installation path or public install
  instructions.
- The 390 px page does not reflow at a 200% zoom equivalent; header content is
  clipped by horizontal overflow.

Other required work: add a branded 404, canonical/Open Graph/Twitter/apple
metadata and build id; raise all touch targets to 44×44; and list/test every
public claim. The full development audit has 10 dev-only advisories; the
production dependency audit is clean.

## What passed

- After `npm ci`, every exact `.factory/claims.json` command exited 0.
- `npm test`: 4 Vitest passed; 18 Playwright passed; 2 intentional skips.
- `npm run typecheck`, `npm run lint`, and exact `npm run build`: passed.
- Local and live site assets match byte-for-byte; extracted live/local
  extension packages match byte-for-byte.
- Desktop and normal 390 px landing checks have no console errors or serious /
  critical axe findings. Populated reader light/dark and popup checks also
  pass axe.
- Local fixture capture, search, timestamps, TXT/HTML export, invalid input,
  offline recovery, and a 2,000-cue boundary case work.
- Live first-load requests are same-origin only. Security headers, immutable
  asset caching, service-worker update, and offline reload pass.
- Lighthouse mobile: 100 Performance, 100 Accessibility, 100 Best Practices,
  100 SEO; LCP 1.2 s, TBT 50 ms, CLS 0, 86 KiB transfer.
- Product verify endpoint rate limiting was observed after 30 allowed burst
  requests: request 31 returned 429 with `Retry-After: 4`.

## Re-run

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run build
```

Then repeat the real TED “Read transcript” flow and the live `/demo`, checkout,
axe, 200% reflow, headers, service-worker, and deployment-identity checks in
fresh browser contexts.
