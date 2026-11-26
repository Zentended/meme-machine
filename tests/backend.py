"""Local Flask routes and range semantics; no network, secret or live host required."""
import json
import os
from unittest.mock import patch
import unittest
from app import app

class Routes(unittest.TestCase):
    def setUp(self):
        self.c = app.test_client()

    def test_shell_and_no_relay(self):
        with self.c.get("/") as r:
            self.assertIn(b"MEME ME", r.data)
        self.assertEqual(self.c.get("/health").json, {"ok": True, "version": "0.6"})
        self.assertEqual(self.c.get("/api/memes?mode=gif&q=test").status_code, 404)
        with self.c.get("/privacy.html") as r:
            self.assertIn(b"not uploaded", r.data)
    def test_only_explicit_public_web_key_is_served(self):
        with patch.dict(os.environ, {"GIPHY_API_KEY": "legacy_server_only"}, clear=True):
            with self.c.get("/static/config.js") as r:
                self.assertIn(b'"giphyClientKey": ""', r.data)
                self.assertNotIn(b"legacy_server_only", r.data)
                self.assertEqual(r.headers["Cache-Control"], "no-store")
        with patch.dict(os.environ, {"GIPHY_WEB_CLIENT_KEY": "fakeBrowserKey123"}, clear=True):
            self.assertIn(b"fakeBrowserKey123", self.c.get("/static/config.js").data)
        with patch.dict(os.environ, {"GIPHY_WEB_CLIENT_KEY": 'not a key";throw 1'}, clear=True):
            self.assertIn(b'"giphyClientKey": ""', self.c.get("/static/config.js").data)

    def test_manifest_and_worker(self):
        with self.c.get("/manifest.webmanifest") as manifest:
            self.assertEqual(manifest.mimetype, "application/manifest+json")
            data = json.loads(manifest.data)
        self.assertEqual(data["display"], "standalone")
        for icon in data["icons"]:
            with self.c.get(icon["src"]) as r:
                self.assertEqual(r.mimetype, "image/png")
        with self.c.get("/sw.js") as r:
            self.assertIn("max-age=0", r.headers.get("Cache-Control"))

    def test_media_range(self):
        url = "/static/media/eagle-has-landed.mp4"
        with self.c.get(url, headers={"Range": "bytes=0-19"}) as r:
            self.assertEqual(r.status_code, 206)
            self.assertEqual(r.mimetype, "video/mp4")
            self.assertEqual(len(r.data), 20)
            self.assertRegex(r.headers["Content-Range"], r"^bytes 0-19/[0-9]+$")

if __name__ == "__main__":
    unittest.main()
