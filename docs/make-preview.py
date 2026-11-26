"""Export a portable preview of the exact local app shell; no worker or microphone."""
from pathlib import Path
import base64, mimetypes, re, sys
root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text()
html=re.sub(r'<link[^>]+(?:manifest|icon|apple-touch-icon)[^>]*>\n','',html)
html=html.replace('<link rel="stylesheet" href="/static/app.css">','<style>'+(root/'static/app.css').read_text()+'</style>')
html=html.replace('<footer><button id="install" type="button">Install / add to home screen</button><a href="/privacy.html">Privacy</a></footer>',
  '<footer hidden><button id="install" type="button">Install</button></footer><p class="fine">Offline preview. Voice search and install are available only in a supported browser on the hosted app.</p>')
html=html.replace('aria-pressed="false">🎙','aria-pressed="false" disabled title="Voice needs the hosted app">🎙')
def inline(match):
    filename=match.group(1)
    src=(root/'static'/filename).read_text()
    if filename=='catalog.js':
        def url(m):
            p=root/m.group(1).lstrip('/')
            return 'data:'+mimetypes.guess_type(p.name)[0]+';base64,'+base64.b64encode(p.read_bytes()).decode()
        src=re.sub("(/static/media/[^']+)",url,src)
    if filename=='config.js':
        src="window.MM_CONFIG=Object.freeze({giphyClientKey:''});"
    if filename=='app.js':
        src=src.replace("if('serviceWorker' in navigator&&isSecureContext){","if(false){")
    return '<script>'+src.replace('</script>','<\\/script>')+'</script>'
html=re.sub(r'<script src="/static/([^"]+)" defer></script>\n','',html)
scripts='\n'.join(inline(re.match(r'(.*)',n)) for n in ['config.js','catalog.js','matcher.js','app.js'])
html=html.replace('</body>',scripts+'\n</body>')
Path(sys.argv[1]).write_text(html)
