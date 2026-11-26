'use strict';
(() => {
const $=id=>document.getElementById(id);
const catalog=window.MM_CATALOG, match=window.MM_MATCH;
const screen=$('screen'), stage=$('stage');
let results=[],index=0,current=null,objectUrl=null,request=null,round=0,localQueue=false;
let recognition=null, installEvent=null;
const say=message=>{$('status').textContent=message;};
const mode=()=>$('mode').value;
try{$('full').checked=localStorage.getItem('mm-full')!=='false';}catch{}
function setExpanded(expanded,restore=false){
  const was=screen.classList.contains('expanded');
  screen.classList.toggle('expanded',expanded);
  document.body.classList.toggle('expanded',expanded);
  $('exit').hidden=!expanded;
  if(expanded&&!was) $('exit').focus({preventScroll:true});
  if(!expanded&&was&&restore) $('fire').focus({preventScroll:true});
}
function stopMedia(){
  const old=stage.querySelector('video');
  if(old){old.pause();old.removeAttribute('src');old.load();}
  stage.replaceChildren();
  $('player-actions').hidden=true;
  $('replay').hidden=true;
  $('share').disabled=true;
  $('credit').hidden=true;
  current=null;
}
function show(item, label=''){
  if(!item)return;
  stopMedia(); current=item;
  const video=item.type==='video'; const node=document.createElement(video?'video':'img');
  const prefix=label ? label+' · ' : '';
  const title=prefix+item.title;
  if(video){
    node.controls=true;node.playsInline=true;node.preload='metadata';node.muted=false;
    if(item.poster)node.poster=item.poster;
    node.onloadedmetadata=()=>{
      if(current!==item)return;
      if(!Number.isFinite(node.duration)||node.duration<5||node.duration>20){
        stopMedia();setExpanded(false,true);
        say('That video is outside 5–20 seconds. Choose another clip.');return;
      }
      say(title+' · '+node.duration.toFixed(1)+'s');
    };
    node.onended=()=>{if(current===item)say(title+' · Replay or Next');};
  } else node.alt=item.title;
  node.onerror=()=>{if(current===item){stopMedia();setExpanded(false,true);say('Could not play this media. Try Next or another file.');}};
  node.src=item.url;
  stage.append(node);
  if(item.provider==='giphy'){
    const badge=document.createElement('img');
    badge.className='giphy-mark';badge.alt='Powered by GIPHY';
    badge.src='/static/icons/powered-by-giphy.png';stage.append(badge);
  }
  $('player-actions').hidden=false;
  $('replay').hidden=!video;
  $('share').disabled=!item.source;
  if(item.source){
    $('credit').hidden=false;$('source').href=item.source;
    $('credit-name').textContent=item.credit?' · '+item.credit:'';
  }
  setExpanded($('full').checked);
  say(title);
  if(video)node.play().catch(()=>{if(current===item&&node.paused) say(title+' · Tap play for sound');});
}
function nextRound(){
  round++;if(request)request.abort();request=null;
  $('fire').removeAttribute('aria-busy');
  return round;
}
function releaseFile(){
  if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null;}
}
function queue(items,n=0,label=''){
  results=items;index=n;
  if(items.length)show(items[n],label);
  else{stopMedia();setExpanded(false,true);say('No media found for this format.');}
}
function safeHttps(value,hosts){
  try{const u=new URL(value);return u.protocol==='https:'&&hosts.some(d=>u.hostname===d||u.hostname.endsWith('.'+d))?value:'';}catch{return '';}
}
async function provider(query,ticket){
  const controller=new AbortController(); request=controller;
  const timer=setTimeout(()=>controller.abort(),2800);
  try{
    const url=new URL('https://api.giphy.com/v1/gifs/search');
    url.search=new URLSearchParams({api_key:MM_CONFIG.giphyClientKey,q:query,limit:'12',rating:'pg-13'});
    const res=await fetch(url,{signal:controller.signal,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'});
    if(!res.ok)throw Error('Provider unavailable');
    const body=await res.json();
    if(ticket!==round)return [];
    return (Array.isArray(body.data)?body.data:[]).flatMap(x=>{
      const media=safeHttps(x?.images?.fixed_width?.url||x?.images?.original?.url,['giphy.com']);
      const source=safeHttps(x?.url,['giphy.com']);
      return media&&source?[{id:'giphy-'+x.id,type:'gif',title:x.title||'Reaction GIF',url:media,source,credit:'Powered by GIPHY',provider:'giphy'}]:[];
    });
  } finally {clearTimeout(timer);if(request===controller)request=null;}
}
async function search(){
  const ticket=nextRound(), query=$('q').value.trim(), selected=mode();
  const ranked=match.rank(query,selected,catalog);
  localQueue=false;
  if(ranked.matched||ranked.defaulted||selected==='video'||[...query].length>50||!MM_CONFIG.giphyClientKey||!navigator.onLine){
    queue(ranked.items,0,ranked.matched||ranked.defaulted?'':'Starter catalog · no close match');
    releaseFile(); return;
  }
  stopMedia();releaseFile();setExpanded(false);
  $('fire').setAttribute('aria-busy','true');say('Looking for a reaction…');
  try{
    const items=await provider(query,ticket);
    if(ticket!==round)return;
    if(items.length)queue(items);else queue(ranked.items,0,'Starter catalog · no close match');
  } catch {
    if(ticket===round)queue(ranked.items,0,'Starter catalog · live GIF search unavailable');
  } finally {if(ticket===round)$('fire').removeAttribute('aria-busy');}
}
function next(){
  if($('fire').hasAttribute('aria-busy'))return;
  if(!results.length||localQueue){search();return;}
  if(results.length<2){show(results[0]);return;}
  index=(index+1)%results.length;show(results[index]);
}
function random(){
  nextRound();localQueue=false;
  const pool=match.rank('',mode(),catalog).items;
  const chosen=match.pick(pool,current?.id);
  queue(pool,chosen?pool.indexOf(chosen):0);releaseFile();
}
$('ask').addEventListener('submit',e=>{e.preventDefault();search();});
$('q').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();search();}});
$('mode').onchange=()=>{if(current||$('fire').hasAttribute('aria-busy'))search();};
$('full').onchange=()=>{
  try{localStorage.setItem('mm-full',String($('full').checked));}catch{}
  if(current)setExpanded($('full').checked);
};
$('exit').onclick=()=>setExpanded(false,true);
document.addEventListener('keydown',e=>{if(e.key==='Escape')setExpanded(false,true);});
$('next').onclick=next;$('player-next').onclick=next;$('random').onclick=random;
$('replay').onclick=()=>{const node=stage.querySelector('video');if(node){node.currentTime=0;node.play().catch(()=>say('Use the video’s play control.'));}};
$('file').onchange=()=>{
  const file=$('file').files?.[0];if(!file)return;
  $('file').value='';
  const gif=file.type==='image/gif'||/\.gif$/i.test(file.name);
  if(!gif&&!file.type.startsWith('video/')&&!/\.(mp4|webm|mov|m4v)$/i.test(file.name)){say('Choose a GIF or video file.');return;}
  nextRound(); stopMedia();releaseFile();objectUrl=URL.createObjectURL(file);localQueue=true;
  queue([{id:'local',url:objectUrl,type:gif?'gif':'video',title:file.name}]);
};
$('share').onclick=async()=>{
  if(!current?.source)return;
  try{
    if(navigator.share)await navigator.share({title:current.title,url:current.source});
    else if(navigator.clipboard){await navigator.clipboard.writeText(current.source);say('Original source link copied.');}
    else say('Use the Original source link to share.');
  }catch(e){if(e.name!=='AbortError')say('Use the Original source link to share.');}
};
$('mic').onclick=()=>{
  if(recognition){recognition.abort();return;}
  const Voice=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!Voice){$('q').focus();say('In-app voice isn’t available here. Try your keyboard microphone.');return;}
  const r=new Voice(); recognition=r;r.lang='en-US';r.interimResults=false;r.continuous=false;
  const finish=()=>{if(recognition===r){recognition=null;$('mic').setAttribute('aria-pressed','false');}};
  let terminal=false;
  r.onstart=()=>{$('mic').setAttribute('aria-pressed','true');say('Listening…');};
  r.onresult=e=>{
    terminal=true;const words=e.results?.[e.resultIndex||0]?.[0]?.transcript?.trim();
    if(!words){say('I didn’t catch that. Try again or type it.');return;}
    $('q').value=words.slice(0,160);search();
  };
  r.onerror=e=>{terminal=true;finish();if(e.error!=='aborted')say('Voice unavailable ('+e.error+'). Try your keyboard microphone.');else say('Voice cancelled.');};
  r.onend=()=>{finish();if(!terminal)say('I didn’t catch that. Try again or type it.');};
  try{r.start();}catch{finish();say('Couldn’t start voice. Try your keyboard microphone.');}
};
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvent=e;$('install').textContent='Install Meme Machine';});
window.addEventListener('appinstalled',()=>{installEvent=null;$('install').hidden=true;});
if(matchMedia('(display-mode: standalone)').matches)$('install').hidden=true;
$('install').onclick=async()=>{
  if(!installEvent){say('In Android Chrome, open ⋮ and choose Install app or Add to Home screen.');return;}
  try{const e=installEvent;installEvent=null;await e.prompt();
    if((await e.userChoice).outcome==='accepted')say('Installation requested.');
  }catch{say('Use your browser menu to install.');}
};
if('serviceWorker' in navigator&&isSecureContext){
  window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}),{once:true});
}
})();
