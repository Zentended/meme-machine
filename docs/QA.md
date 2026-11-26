# Release candidate QA

Local tests only. No changes to Render, the GitHub repository, live keys/accounts, or Play Console.

- Node matcher suite: case/punctuation, success versus failure language, format-specific ranking, fallback and no-repeat Random.
- Flask route suite: shell, manifest MIME and icons, worker cache header, privacy copy, no API relay and byte-range media responses.
- Media: all three H.264/AAC MP4s inspected and fully decoded with FFmpeg; measured lengths approximately 13.013, 12.000 and 10.000 seconds. Each contains a non-silent original audio track. Two GIF adaptations with multiple frames.
- Chromium 141 mobile-viewport integration: playback reached progressing time unmuted at the player, ended normally, replayed, and switched formats; fullscreen/escape, Next, non-repeat Random, replay, simulated one-step speech, provider mock and fallback (with mark), local file input, rejection of a 2-second file, and the portable offline HTML all passed. Browser reported no installability errors at localhost; worker takeover, offline reload, media playback and a 206 byte range passed. PNG screenshots are from the emulated layout. Local testing does not measure network latency on Render or real Android audio output.

Unverified on actual Android with 0.5: microphone recognition, permission behavior, phone speaker playback, install prompt and standalone icon. No live provider credentials or production API calls tested. Google Play assets are drafts, not a signed AAB or store submission.
