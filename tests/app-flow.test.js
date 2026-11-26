const {test}=require('node:test');
const {strict:assert}=require('node:assert');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
function fixture({key='',online=true,fetch=()=>{throw Error('Unexpected network request')}}={}){
 class Element {
  value='';hidden=false;checked=false;children=[];attrs={};listeners={};
  classList={contains:()=>false,toggle:()=>{}};
  querySelector(name){return this.children.find(n=>n.tag===name)}
  append(n){this.children.push(n)}
  replaceChildren(){this.children=[]}
  setAttribute(a,v){this.attrs[a]=v}
  hasAttribute(a){return a in this.attrs}
  removeAttribute(a){delete this.attrs[a]}
  addEventListener(a,fn){this.listeners[a]=fn}
  focus(){} load(){} pause(){} async play(){}
 }
 const e={};
 const get=id=>e[id]??(e[id]=new Element());
 const stage=get('stage');
 let words='one small step';
 const window={MM_CONFIG:{giphyClientKey:key},addEventListener(){},
  SpeechRecognition:class{start(){this.onstart();this.onresult({results:[[{transcript:words}]]});this.onend();}}};
 const context=vm.createContext({window,navigator:{onLine:online},URL,URLSearchParams,AbortController,fetch,setTimeout,clearTimeout,matchMedia:()=>({matches:false}),document:{body:new Element(),getElementById:get,createElement:tag=>Object.assign(new Element(),{tag}),addEventListener(){}}});
 for(const file of ['catalog.js','matcher.js','app.js'])vm.runInContext(readFileSync(join(__dirname,'..','static',file),'utf8'),context);
 const search=(text,mode='video')=>{get('q').value=text;get('mode').value=mode;get('ask').listeners.submit({preventDefault(){}})};
 const settle=()=>new Promise(resolve=>setImmediate(resolve));
 return {get,search,settle,media:()=>stage.children[0],status:()=>get('status').textContent};
}
test('exact video and GIF prompts map to distinct media; mock voice runs the search without another tap',()=>{
 const f=fixture();
 for(const [q,mode,media] of [['one small step','video','one-small-step.mp4'],['we finally got it working','video','eagle-has-landed.mp4'],['let’s go','video','liftoff.mp4'],['we did it','gif','landing.gif']]){
  f.search(q,mode);assert.ok(f.media().src.endsWith(media),q);
 }
 f.get('mode').value='video';f.get('mic').onclick();assert.ok(f.media().src.endsWith('one-small-step.mp4'));
});
test('unmatched requests cycle distinct files, and Next retains the fallback label',()=>{
 const f=fixture(), urls=new Set();
 for(let i=0;i<3;i++){f.search('that was awkward');urls.add(f.media().src);assert.match(f.status(),/no close match/)}
 assert.equal(urls.size,3);f.get('next').onclick();assert.match(f.status(),/no close match/);
});
test('unmatched GIF goes directly to GIPHY in order, with badge and unmodified media URL',async()=>{
 const requested=[];
 const response=['a','b'].map(id=>({id,url:'https://giphy.com/gifs/'+id,images:{fixed_width:{url:'https://media.giphy.com/'+id+'.gif?cid=original'}}}));
 const f=fixture({key:'fakeBrowserKey123',fetch:async u=>{requested.push(u);return {ok:true,json:async()=>({data:response})}}});
 f.search('cheeseburgers & fries','gif');await f.settle();
 assert.equal(requested.length,1);assert.equal(requested[0].origin,'https://api.giphy.com');
 assert.equal(requested[0].searchParams.get('q'),'cheeseburgers & fries');
 assert.equal(f.media().src,'https://media.giphy.com/a.gif?cid=original');
 assert.equal(f.get('stage').children[1].alt,'Powered by GIPHY');
 f.get('next').onclick();assert.equal(f.media().src,'https://media.giphy.com/b.gif?cid=original');
 f.search('one small step','video');await f.settle();assert.equal(requested.length,1);
});
test('provider failure and offline mode preserve honest starter fallback',async()=>{
 const f=fixture({key:'fakeBrowserKey123',fetch:async()=>{throw Error('network test')}});
 f.search('that was awkward','gif');await f.settle();assert.match(f.status(),/live GIF search unavailable/);
 let network=0;const o=fixture({key:'fakeBrowserKey123',online:false,fetch:()=>{network++;throw Error('offline')}});
 o.search('that was awkward','gif');await o.settle();assert.equal(network,0);assert.match(o.status(),/no close match/);
});
