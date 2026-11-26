import os
from pathlib import Path
import requests
from flask import Flask, request, jsonify, send_file
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
app=Flask(__name__, static_folder=None)
limiter=Limiter(get_remote_address, app=app, default_limits=['120 per minute'], storage_uri='memory://')
@app.get('/')
def home(): return send_file(Path(__file__).with_name('app.html'))
@app.get('/health')
def health(): return {'ok':True}
@app.get('/api/memes')
@limiter.limit('15 per minute')
def memes():
    if request.args.get('mode')=='video': return jsonify(items=[],message='Original-audio video provider not configured yet.')
    key=os.getenv('GIPHY_API_KEY')
    if not key: return jsonify(message='Developer must configure GIPHY_API_KEY.'),503
    try:
        r=requests.get('https://api.giphy.com/v1/gifs/search',params={'api_key':key,'q':request.args.get('q','reaction meme')[:200],'limit':25,'rating':'pg-13'},timeout=12)
        r.raise_for_status()
        return jsonify(items=[dict(title=x.get('title','Reaction GIF'),url=x['images']['original']['url'],type='gif',source=x['url']) for x in r.json()['data'] if x.get('images',{}).get('original',{}).get('url')])
    except (requests.RequestException,ValueError,KeyError): return jsonify(message='Media provider unavailable.'),502
