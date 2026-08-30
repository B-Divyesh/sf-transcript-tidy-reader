# Visitor demo sandbox

Open <https://transcript-tidy-reader.sociobot.in/demo/>. The first-screen
“Try it with sample data” action opens the same route in one click. The legacy
`/?demo=1` entry also redirects there.

The demo contains three original passages from a fictional talk, “The quiet
power of a useful pause.” A visitor can search them, change type and line
spacing, select timestamps, print, and export sample text.

The banner stays visible and says “Demo — sample data, nothing is saved.”
**Reset demo** restores the original view. **Start for real** opens the public
installation guide.

Demo state exists only in page memory. It does not use localStorage,
sessionStorage, IndexedDB, extension storage, a user profile, or a backend.
Reloading or leaving `/demo/` discards every change. The automated sandbox
opens a fresh browser context, exercises search and reset, and checks every
browser storage area.

Run it with:

```sh
npm test -- --grep @claim:demo-sandbox
```
