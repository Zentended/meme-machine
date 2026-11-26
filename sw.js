'use strict';
const CACHE='meme-machine-v06-2';
const shell=['/','/manifest.webmanifest','/privacy.html','/static/app.css','/static/catalog.js','/static/matcher.js','/static/app.js','/static/icons/icon-192.png','/static/icons/icon-512.png','/static/icons/mask-512.png'];
// Only owned/attributed bundled media. Never cache external provider requests, speech, or user files.
const clips=['eagle-has-landed','one-small-step','liftoff'];
const assets=new Set([...shell,...clips.flatMap(x=>['.mp4','.jpg'].map(s=>'/static/media/'+x+s)),'/static/media/landing.gif','/static/media/liftoff.gif']);
const bundled=[...assets].filter(path=>path.startsWith('/static/media/'));
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const c=await caches.open(CACHE);
 await c.addAll(shell);
 // Download first-party fixtures quietly for standalone/offline use. A single
 // missing fixture should never block installation of the shell.
 await Promise.allSettled(bundled.map(path=>c.add(path)));
 await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const keys=await caches.keys();
 await Promise.all(keys.filter(k=>k.startsWith('meme-machine-')&&k!==CACHE).map(k=>caches.delete(k)));
 await self.clients.claim();
})()));
async function rangeResponse(req,cached){
 if(!cached)return fetch(req);
 const m=/^bytes=(\d*)-(\d*)$/.exec(req.headers.get('range')||'');
 const bytes=await cached.arrayBuffer(), len=bytes.byteLength;
 const suffix=m&&!m[1]?Number(m[2]):0;
 const start=m&&m[1]?Number(m[1]):Math.max(0,len-suffix);
 const end=m&&m[1]&&m[2]?Math.min(len-1,Number(m[2])):len-1;
 if(!m||(!m[1]&&!suffix)||start>=len||start>end){
  return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+len}});
 }
 return new Response(bytes.slice(start,end+1),{status:206,headers:{
  'Content-Type':cached.headers.get('content-type')||'video/mp4',
  'Content-Length':String(end-start+1),'Content-Range':'bytes '+start+'-'+end+'/'+len,
  'Accept-Ranges':'bytes'
 }});
}
self.addEventListener('fetch',event=>{
 const req=event.request,u=new URL(req.url);
 if(req.method!=='GET'||u.origin!==location.origin)return;
 if(u.pathname==='/static/config.js'){
  event.respondWith((async()=>{
   try{const res=await fetch(req,{cache:'no-store'});if(res.ok)return res;}catch{}
   return new Response("window.MM_CONFIG = Object.freeze({giphyClientKey:''});",
     {headers:{'Content-Type':'application/javascript','Cache-Control':'no-store'}});
  })());return;
 }
 if(!assets.has(u.pathname))return;
 event.respondWith((async()=>{
  const c=await caches.open(CACHE);
  // A connected launch must see the live homepage, including a server rollback.
  // Keep the versioned offline homepage from install; do not overwrite it with
  // a potentially different server release that needs a different asset set.
  if(u.pathname==='/'&&req.mode==='navigate'){
   let live, offline;
   try{live=await fetch(req,{cache:'no-store'});}catch{}
   if(live&&live.status<500)return live;
   offline=await c.match('/');
   if(offline)return offline;
   return live||Response.error();
  }
  if(req.headers.has('range'))return rangeResponse(req,await c.match(u.pathname));
  const hit=await c.match(u.pathname);
  if(hit)return hit;
  const res=await fetch(req);
  if(res.ok&&res.status===200)await c.put(u.pathname,res.clone());
  return res;
 })());
});
