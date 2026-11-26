# North’s Big Red Button · Meme Machine 0.5

**Local release candidate. Nothing deployed.** Based on the working 0.4 design: dark console, red **MEME ME** button, microphone, media-mode selector and fullscreen toggle. 0.5 removes the Flask GIPHY relay without changing the deployed 0.4 app.

## What works without a provider

- Five reactions to start: three real Apollo 11 excerpts with original audio (about 10, 12 and 13 seconds) and two GIF loops. Credit and source travel with each result. Use “we finally got it working,” “big first step,” or “let’s go.”
- Typed or supported browser speech input goes directly to a match, without a second button press after speaking. Matching is local, phrase-based and intentionally narrow. An unmatched request is labeled as a starter-catalog fallback, not a successful context match.
- Format filtering, Next with wraparound, non-repeating Random when possible, fullscreen in-page overlay, source sharing, replay and device-file playback. Videos are restricted to 5–20 seconds; each plays once, and if the browser blocks sound autoplay, tap the player.
- Standalone web-app setup: manifest, icons, install prompt or menu instructions, cache of the app and bundled media after an initial connected visit. No caching of GIPHY media or voice. No user key entry.
- The separate offline HTML preview uses the same starter media and controls, but it disables in-app voice, provider search and install. Browser support for opening downloaded HTML varies; the preview does not require an account or hosting.

## Run locally

From the project root:
```sh
python3 -m http.server 8765 --bind 127.0.0.1
```
Open `http://127.0.0.1:8765`. For an actual Flask-backed local run, install the requirements in a virtual environment and use `flask --app app run --port 8765`. No environment variables or accounts needed.

For static hosting later, serve only index.html, privacy.html, manifest.webmanifest, sw.js and static/ at the root of a versioned HTTPS origin; keep docs and tests out of the public web root. The app assumes the origin root, not a nested URL. The existing Render file is an optional Flask compatibility template, not an instruction to deploy. A static host avoids a Flask cold start; no production timing claim is made.

## Live search and devices

- The optional GIPHY GIF adapter is off. It performs direct browser search for unmatched queries only when an approved browser-visible web key is supplied by the app operator. Do not expose a server-only credential. GIPHY results stay separate from the local pack, use the original rendition URLs, and show the supplied attribution mark. Provider integration was tested with mocked responses only. Verify current restrictions and approval before activating it.
- No broad live original-audio provider is enabled. [GIPHY Clips Search](https://developers.giphy.com/docs/clips/endpoint/search/) requires separate approval. A GIF key does not establish access. No key, vendor account or paid integration is needed for the starter pack.
- Real Android Chrome mic, home-screen install, and audio output on Ash’s device need a smoke test of this exact build on an authorized HTTPS origin. PWA installability checks and simulated browser speech are not substitutes for these.

## Verify

```sh
node --test tests/matcher.test.js
PYTHONPATH=. python3 tests/backend.py
# Requires Playwright and a Chromium binary; use the HTTP URL printed above.
CHROMIUM=/path/to/chromium node tests/browser.cjs
```
`docs/MEDIA.md` gives provenance and cut points. `docs/PLAY-STORE-PREP.md` has the listing draft, assets and remaining release gates. `docs/QA.md` records what actually ran.
