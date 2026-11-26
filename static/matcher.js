(function(root){
  'use strict';
  const clean=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/['’]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  const negative=/\b(not working|didnt work|doesnt work|wont work|never worked|not fixed|failed|failure|broke|broken|awkward|disappointing|facepalm|sad|angry|awful|hate)\b/;
  function rank(input,mode,catalog){
    const raw=String(input||'').trim(), q=clean(raw);
    const pool=catalog.filter(item=>mode==='auto'||item.type===mode);
    if(!q) return {items:pool,matched:false,defaulted:!raw};
    const parts=q.split(' ');
    const rows=pool.map(item=>{
      let best=0,hits=0;
      for(const phrase of item.phrases){
        const key=clean(phrase), words=key.split(' ');
        if((' '+q+' ').includes(' '+key+' ')){
          const i=parts.findIndex((_,index)=>parts.slice(index,index+words.length).join(' ')===key);
          const preceding=parts.slice(Math.max(0,i-2),Math.max(0,i));
          if(preceding.some(w=>/^(not|never|no|didnt|wont|doesnt)$/.test(w))) continue;
          hits++;best=Math.max(best,q===key?35:words.length*8);
        }
      }
      return {item,score:best+Math.min(hits,3)+(best>0&&item.type==='video'?.5:0)};
    }).filter(x=>x.score>0);
    if(!rows.length || (negative.test(q) && !/\b(finally (?:fixed|got|works)|now (?:fixed|works)|then it worked)\b/.test(q))) return {items:pool,matched:false,defaulted:false};
    rows.sort((a,b)=>b.score-a.score);
    return {items:[...rows.map(x=>x.item),...pool.filter(item=>!rows.some(x=>x.item===item))],matched:true,defaulted:false};
  }
  function pick(pool,previous,random=Math.random){
    const candidates=pool.length>1?pool.filter(item=>item.id!==previous):pool;
    return candidates[Math.floor(random()*candidates.length)];
  }
  const api={clean,rank,pick};
  if(typeof module==='object'&&module.exports)module.exports=api; else root.MM_MATCH=api;
})(typeof window==='object'?window:globalThis);
