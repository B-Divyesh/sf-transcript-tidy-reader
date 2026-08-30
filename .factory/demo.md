# Verification sandbox

The automated demo uses a temporary Chromium extension profile and a recorded
YouTube `json3` caption response. It opens a realistic talk named “A patient
idea”, captures three caption fragments, and renders them in the packaged
reader. Search, timestamp links, local exports, and accessibility checks all
run against this sample.

Run the sandbox with:

```sh
npm test -- --grep @claim:reader-workflow
```

Each run starts with an empty temporary profile. Playwright removes that
profile after the test, so no browser data is read from or written to a real
user profile. Network routes are fulfilled by the test fixture and no live
video, account, license, or transcript is used.
