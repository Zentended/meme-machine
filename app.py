"""Optional Flask host; no media relay, no provider secrets, no network calls."""
from pathlib import Path
from flask import Flask, send_from_directory

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


@app.get("/health")
def health():
    return {"ok": True, "version": "0.5"}
