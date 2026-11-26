# Google Play preparation (not submitted)

**Draft listing name:** North’s Big Red Button

**Short description:** Say what happened. Hit the big red button. Get a reaction.

**Description:** Turn a moment into a reaction. Describe what happened, then hit MEME ME. Get a short reaction clip with original sound or an animated GIF. Use Next to keep browsing or Random to surprise yourself. Go fullscreen for the punchline. You can also play compatible media from your device without uploading it. Where your browser supports voice input, tap the microphone to search hands-free. The starter edition includes a curated archive pack and can play its cached starter media offline.

## Prepared
- Web manifest, standalone home-screen mode, install prompt with browser-menu fallback, 192/512 icons and a maskable icon.
- 512-pixel draft Play listing icon and 1024 × 500 feature graphic in play-assets.
- Privacy preview at /privacy.html and source attribution in MEDIA.md.
- Do not present a viewport screenshot as real phone validation. Use the included screenshots, if present, as drafts to replace or confirm after real device QA.

## Release gates, not performed
1. Authorize hosting the specific build and choose the durable HTTPS origin. A versioned static host can deliver this app without waking a Flask worker; preserving the old origin is a separate release decision.
2. On Android Chrome, install from the browser, launch standalone, test permission granted/denied, try voice-to-result, original-audio playback, fullscreen/replay, and offline relaunch. Measure cold/warm timing on the actual host.
3. Choose package ID, final app name and publisher, Play account type, current target SDK, content rating, and privacy-policy owner/support contact. Complete Data safety from actual hosting, speech and search behavior; do not infer “no data collected” from the absence of app analytics.
4. If choosing a Trusted Web Activity, build a signed AAB using the approved final origin, publish matching Digital Asset Links using the Play app-signing certificate, and verify the origin on-device. No placeholder certificate or static assetlinks file is shipped. Native packaging is an alternative, not silently chosen.
5. Replace drafts with approved app screenshots, confirm current Play requirements, and handle internal/closed testing as applicable. For eligible new personal developer accounts, Google documents a closed test with at least 12 opted-in testers for 14 continuous days before requesting production access.
6. Do not ship a broad searchable media catalog without confirming provider terms, age/rating handling and current attribution, and testing with the approved production integration.

Sources: [Chrome TWA and signing](https://developer.chrome.com/docs/android/trusted-web-activity/android-for-web-devs), [Play assets](https://support.google.com/googleplay/android-developer/answer/9866151), [Play testing](https://support.google.com/googleplay/android-developer/answer/14151465), [User Data / Data safety](https://support.google.com/googleplay/android-developer/answer/10144311).
