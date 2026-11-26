# Render release and rollback

This release uses the existing Python web service, with Gunicorn starting `app:app`. No configuration or provider key is needed for the local starter catalog. The release branch keeps the full project, including the app shell, service worker and original-audio media.

Before promotion, record the existing live deploy and check that `backup/pre-north-dot-deploy` still points to v0.4 (`638f8b9be2d161541eeebc8b6de3ec22dfcfe362`). Do not force-push either branch.

After promotion, verify `/health` reports version 0.5, `/` loads the player, and a bundled MP4 supports byte-range requests. If needed, use the Render service's Deploys page to roll back to the last successful v0.4 deploy. If the retained build is no longer available, the backup branch retains the original source for a rebuild. Render's dashboard rollback can disable automatic deploys; review that setting before the next release. When connected, the 0.5 worker fetches the live homepage before falling back to its cached shell, so it does not keep showing a stale homepage after rollback.
