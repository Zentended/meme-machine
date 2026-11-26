const {test}=require('node:test');
const {strict:assert}=require('node:assert');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const worker=fs.readFileSync(path.join(__dirname,'..','sw.js'),'utf8');
function go(fetch,cached=new Response('cached 0.5')){
 const handlers={};
 const origin='https://example.test';
 const scope={self:{addEventListener:(event,fn)=>handlers[event]=fn},URL,Response,
  location:{origin},caches:{open:async()=>({match:async()=>cached})},fetch};
 vm.runInNewContext(worker,scope);
 let response;
 handlers.fetch({request:{url:origin+'/',method:'GET',mode:'navigate'},respondWith:r=>response=r});
 return response;
}
test('a connected visit shows the server release, even with 0.5 cached', async()=>{
 let cache;
 const result=await go((_,opts)=>{cache=opts.cache;return new Response('rolled back 0.4')});
 assert.equal(cache,'no-store');
 assert.equal(await result.text(),'rolled back 0.4');
});
test('a disconnected visit still shows the cached release',async()=>{
 assert.equal(await (await go(()=>{throw new TypeError('offline')})).text(),'cached 0.5');
});
test('a transient server failure can use cache but an actual server response does not hide behind it',async()=>{
 assert.equal(await (await go(()=>new Response('unavailable',{status:503}))).text(),'cached 0.5');
 assert.equal((await go(()=>new Response('not found',{status:404}))).status,404);
});
