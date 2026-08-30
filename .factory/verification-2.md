# Independent verification 2 — FAIL

Verified: 30 August 2026 UTC

Candidate: `e12e9c595bee89a159693c5f744239c07a39a831`

Live URL: <https://transcript-tidy-reader.sociobot.in/>

Work order: `transcript-tidy-reader-verify-2`

## Decision

**FAIL — do not release this candidate.** The first-screen demo gate fails, a
real TED transcript that is visibly available cannot be captured, an
extension surface has a serious axe failure, and the advertised paid checkout
returns 404. Product code was not changed during verification.

## Release-blocking findings

### BLOCKER — there is no one-click sample-data demo

The cold first screen does explain the job, audience, and real first action:

- What: “Turn captions into a readable page.”
- For whom: “For people who prefer reading…”
- First action: “Download for Chrome.”

It does not offer “Try it with sample data” or any equivalent one-click
sandbox. A fresh DOM search found no visible action containing “sample” or
“demo.” `/demo` returns the generic Azure HTTP 404, while `/?demo=1` returns
the ordinary landing page with no demo banner or sample state. `.factory/demo.md`
documents an automated test fixture, not a visitor-accessible demo. This
fails the work order's explicit first-read gate regardless of other results.

### BLOCKER — the advertised TED capture does not work on a real accessible transcript

The extension's fixture-based `@claim:source-scope` test passes, but a fresh
real-site exercise contradicts the claim:

1. Opened
   `https://www.ted.com/talks/tim_urban_inside_the_mind_of_a_master_procrastinator`
   and received HTTP 200 with the correct talk title.
2. Selected TED's visible **Read transcript** button. The page then displayed
   timestamped transcript text from `00:04` through `13:46`.
3. Asked the installed candidate extension to capture it. It returned
   `{ ok: false, code: "no-captions" }`.

The current TED DOM groups each passage in `div.mb-6.w-full`, with its time in
a button and transcript segments in `div[role="button"]`. The candidate only
falls back to list items under selectors containing `transcript` in a class or
test id. No such elements exist on this real page. The test fixture instead
supplies a `<video><track>` element and therefore does not protect the claimed
real TED workflow from source-site drift.

An attempted real YouTube talk was stopped by YouTube's “Sign in to confirm
you're not a bot” interstitial, so that source was inconclusive rather than
counted as a product defect.

### HIGH — extension settings has a serious WCAG contrast failure

A fresh 390×844 axe scan of the built `options.html` reports serious
`color-contrast` on “Your local reading room.” The foreground is `#c74f3d` on
`#f3ecdd`, ratio **3.86:1** for 12 px bold text; the required ratio is 4.5:1.
The popup, empty reader, populated reader in light and dark themes, and the
live landing page had no serious or critical axe findings.

### HIGH — the paid product advertised on the live page cannot be bought

The “Buy Transcript Tidy Plus” link targets the required product-specific
Sociobot endpoint, but a fresh GET returned HTTP **404**,
`application/json`, with:

```json
{"error":"enabled factory product","status":404}
```

This makes the advertised one-time $12 shelf unavailable. The passing
`@claim:plus-shelf` test checks the price text, checkout URL string, and a local
50-item array cap; it does not exercise a successful checkout or unlock. It
therefore does not prove the purchase outcome stated in the claim.

### HIGH — the public download is not a complete consumer install path

The download is now present and valid, but it is an unpacked-extension ZIP,
not a Chrome Web Store or CRX install. Chrome does not install this ZIP from
the download link. The landing page only says “Install it,” offers no unzip /
Developer mode / Load unpacked instructions, and the ZIP contains no README.
The repository README has developer instructions, but the normal visitor flow
does not. A non-developer cannot complete the product's first step from the
public UI.

### HIGH — 200% text-resize equivalent loses horizontal content

At the 390 px mobile layout, a 195 CSS-pixel viewport (the reflow width
equivalent of 200% browser zoom) produces `scrollWidth=272` with
`innerWidth=195`. The header's product name and “Get the extension” action
overflow horizontally; the action is visibly clipped. The normal 390 px
layout has no overflow. This fails the supplied 200% text-resize baseline.

## Other findings

### MEDIUM — required site routes and metadata are incomplete

- `/404.html` and an unknown path both return the generic Azure Static Web
  Apps 404, not a product-designed recovery page.
- The landing and legal pages have no canonical link, Open Graph metadata,
  Twitter card metadata, or Apple touch icon. No 1200×630 social image ships.
- The footer has no version/build identity.

These are explicit requirements of the attached site-structure contract.

### MEDIUM — public/README claims exceed `.factory/claims.json`

The copy makes independently testable promises that are not listed as claims,
including printing, type and spacing controls, no tracking, no remote fonts or
third-party scripts, no background reading, and no paywall on accessibility
controls. Some were manually supported during this review, but the claims
contract requires each promise to have its own tagged sandbox test or be
removed. The existing privacy claim only states that transcript text is not
sent to Transcript Tidy; it does not cover all of those promises.

### LOW — several mobile touch targets are smaller than 44×44 px

At 390 px, the landing pricing-note links measured Terms 35.3×14 px and
Privacy 43.5×14 px. The skip link measured 149.5×39 px. On the legal pages,
the mail links measured 192.8×20 px and 197.5×20 px. Footer legal targets do
meet 44×44 px. These measurements fail the supplied touch-target baseline.

### LOW — development dependencies have known advisories

`npm audit --omit=dev` reports zero production vulnerabilities. Full
`npm audit` reports 10 development-tree advisories (1 low, 2 moderate, 4 high,
3 critical), inherited mainly through WXT/web-ext-run. They do not ship in the
static site or extension runtime.

## Mandatory claim tests

The seven exact commands in `.factory/claims.json` were invoked first. Before
dependencies were installed each stopped at `wxt: not found`. After the clean
`npm ci`, every exact command exited 0:

| Claim | Exact filter result | Independent verdict |
| --- | --- | --- |
| `download-package` | 2 passed | Live ZIP is HTTP 200, ZIP MIME/signature valid. |
| `reader-workflow` | 1 passed, 1 intentional project skip | Fixture workflow also passed manual capture/search/export exercise. |
| `source-scope` | 1 passed, 1 intentional project skip | **Claim false on current real TED page.** |
| `local-private` | 1 passed, 1 intentional project skip | Fixture request hosts were only YouTube/TED; live landing was same-origin only. |
| `local-export` | 1 passed, 1 intentional project skip | TXT and HTML contents were inspected by the test. |
| `plus-shelf` | 2 passed | Cap logic passes, but live checkout is 404 and the test does not purchase. |
| `license-restore` | 2 passed | Recorded valid response stores the token and strips it from the URL. |

Each claim id occurs in exactly one test definition. The skip is the same
extension test intentionally running only in the desktop project while the
other project variant is skipped.

## Clean-clone quality gates

| Command | Result |
| --- | --- |
| `npm ci` | Passed; 493 packages installed. |
| `npm test` | Passed: 4 Vitest tests, 18 Playwright tests; 2 intentional project skips. |
| `npm run typecheck` | Passed. |
| `npm run lint` | Passed. |
| `npm run build` | Passed; produced `dist/site/` and the extension package. |
| `npm audit --omit=dev` | Passed; 0 production vulnerabilities. |

The production build reports 42.92 KB for the unpacked extension and 23.29 KB
for the ZIP.

## Functional and recovery exercise

Using a fresh temporary Chromium extension profile:

- Recorded YouTube json3: 2 cues became 1 paragraph; search was
  case-insensitive, produced one `pace` match, and the timestamp link was
  present.
- Recorded TED WebVTT: the repository claim test captured and reflowed the
  supplied track.
- No captions: returned `no-captions` with a specific next step.
- Caption HTTP 500: returned `parse-error` with refresh/retry guidance.
- Malformed caption payload: returned `no-captions` without crashing.
- Offline source page: returned `offline`; restoring connectivity immediately
  recovered to a successful capture.
- Boundary load: 2,000 cues produced 249 paragraphs in 333 ms in the test
  environment.
- Hostile search `<script>` created no script element and zero matches;
  changing to `PACE` recovered to one highlighted match.
- Keyboard order began with the visible skip link, brand, reading settings,
  and Print. Focus rings were 3 px. Enter opened settings, set
  `aria-expanded=true`, and moved focus to Serif.
- The unsupported-page popup error told the user to open a captioned YouTube
  or TED video.

The real TED failure above remains decisive because the representative fixture
does not match the present source DOM.

## Live site, privacy, deployment, and performance evidence

- Desktop 1440 px and mobile 390×844: one h1, `lang=en`, main landmark,
  meaningful hero alt, no horizontal overflow at normal zoom, no console/page
  errors, and no serious/critical landing-page axe findings.
- `/opt/fleet/lib/verify-url.sh` passed live: HTTP 200, 930 ms observed load,
  no console errors, title/lang/h1/main/alt/button-label basics present.
- A cold page load made six same-origin requests and no third-party request.
  No analytics, CDN scripts, or remote fonts were observed.
- Response headers include HSTS, `nosniff`, strict-origin referrer policy,
  camera/microphone/geolocation denial, and a CSP with `frame-ancestors
  'none'`. Hashed JS/CSS/images are cached for one year as immutable; HTML and
  `sw.js` revalidate after 30 seconds.
- Service worker `transcript-tidy-site-245781ad67ad` activated, completed
  `registration.update()`, and reloaded the full shell offline without errors.
- Live `index.html`, main JS, CSS, and `sw.js` are byte-identical to the local
  candidate build. The live and local ZIP byte hashes differ because ZIP
  metadata/order is nondeterministic, but both archives validate and their
  extracted file trees are byte-for-byte identical.
- Initial raw JS is 1,597 + 711 bytes, CSS is 9,614 bytes, the mobile hero WebP
  is 62,064 bytes, and the selected AVIF is 79,377 bytes. All stated static
  budgets pass.
- Lighthouse 13 mobile, with full-page screenshot capture disabled after an
  initial runner tab crash: Performance 100, Accessibility 100, Best
  Practices 100, SEO 100; FCP 1.1 s, LCP 1.2 s, TBT 50 ms, CLS 0, total
  transfer 86 KiB. This page-level score does not cover the extension options
  contrast failure.
- The product-specific verification endpoint allowed 30 successful invalid
  token checks in a fresh burst; request 31 returned HTTP 429 with
  `Retry-After: 4`. The observed burst allowance is therefore 30 requests per
  client/window. No shared service settings were accessed.

## Required next steps

1. Add the mandatory one-click sample demo, persistent demo banner, reset,
   start-for-real action, and documented isolated demo storage.
2. Update TED capture against the current real transcript DOM and make the
   source-scope claim test use a representative recorded DOM fixture.
3. Fix the options-page contrast and 200% reflow, then axe-test every extension
   surface in both themes and at 390 px.
4. Register/enable the product checkout or remove the paid offer until it
   works; make the claim test prove an observable purchase/unlock flow.
5. Provide a consumer-installable distribution or clear unzip/Developer mode
   instructions in the public flow and package.
6. Add the required 404 route, metadata/social asset/build identity, 44 px
   targets, and tagged coverage for every retained public claim.
