# Transcript Tidy — verification 5 handoff

Date: 6 September 2026 UTC
Implementation reviewed: `3594788032957fa7aabe340d9c2f375ff8fa54e0`
Documentation reviewed: `8d8237ae0e40d0c67c0ca223e7780810527545d4`

## Done

Independent QA of the live static site and clean checkout is complete with a
**PASS**: zero findings and zero untested public claims. Product code was not
changed.

The extension remains a local caption reader for accessible YouTube and TED
caption tracks. The live site offers a one-click isolated sample reader at
`/demo/`, plus consumer installation instructions and a valid extension ZIP.
The demo has a persistent sample-data label, reset behavior, and no browser
storage writes.

Plus remains honestly pending factory billing registration: it describes the
$12 one-time local 50-read shelf but exposes no checkout, token, license
restore, or external billing request. Legacy `?license=` tokens are removed
without storage or network use.

## Run and verify

```sh
npm ci
npm run typecheck
npm run lint
npm run build
npm test
npm audit --omit=dev --audit-level=high
npm audit --audit-level=high
```

All commands passed in this verification. All nine exact commands declared in
`.factory/claims.json` also passed independently. `npm run build` creates
`dist/site/` and the downloadable ZIP under
`dist/site/downloads/transcript-tidy-chrome.zip`.

Live checks passed for desktop and 390 px phone flows, accessibility, keyboard
focus, 200% reflow, privacy, offline reload, legal pages, expected designed
404 recovery, and build hashes. The full report is
`.factory/verification-5.md`; the factory evidence copies are
`/work/.evidence/qa-report.md` and `/work/.evidence/qa-result.json`.

## Remaining external dependency

Factory billing registration is the only remaining external operation. It is
not a release defect because the unavailable flow is not advertised as
available and makes no request. Once the factory registers the offer, restore
the approved checkout/license flow and independently verify the actual
allowance and `429`/`Retry-After` behavior before advertising it.
