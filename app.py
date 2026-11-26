"""Flask host. GIPHY Search is browser-only; this server makes no provider calls."""
import json
import os
import re
from pathlib import Path
from flask import Flask, Response, send_from_directory

ROOT = Path(__file__).resolve().parent
app = Flask(__name__, static_folder=str(ROOT / "static"), static_url_path="/static")


@app.get("/")
def home():
    return send_from_directory(ROOT, "index.html")


@app.get("/manifest.webmanifest")
def manifest():
    return send_from_directory(ROOT, "manifest.webmanifest",
                               mimetype="application/manifest+json")


@app.get("/sw.js")
def service_worker():
    return send_from_directory(ROOT, "sw.js", max_age=0)


@app.get("/privacy.html")
def privacy():
    return send_from_directory(ROOT, "privacy.html")


@app.get("/static/config.js")
def public_browser_config():
    # Intentionally never read GIPHY_API_KEY, which was used by the old relay.
    candidate = os.environ.get("GIPHY_WEB_CLIENT_KEY", "")
    key = candidate if re.fullmatch(r"[A-Za-z0-9_-]{8,128}", candidate) else ""
    payload = json.dumps({"giphyClientKey": key})
    return Response(
        f"window.MM_CONFIG = Object.freeze({payload});\n",
        mimetype="application/javascript",
        headers={"Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"},
    )


@app.get("/health")
def health():
    return {"ok": True, "version": "0.6"}
