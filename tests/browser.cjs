/* Local app integration tests. No requests are made to real external services. */
const { chromium }=require('playwright');
const { strict: assert }=require('node:assert');
const { pathToFileURL }=require('node:url');
const path=require('node:path');
const base=process.env.MM_TEST_URL||'http://127.0.0.1:8765';
const mobile={viewport:{width:412,height:915},deviceScaleFactor:1,isMobile:true,hasTouch:true};
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  try{
    const ctx=await browser.newContext(mobile);
    const page=await ctx.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    const expected=async(sel,txt)=>page.waitForFunction(([s,t])=>document.querySelector(s)?.textContent.includes(t),[sel,txt]);
    await page.addInitScript(()=>{
      window.SpeechRecognition=class {
        start(){this.onstart();setTimeout(()=>{this.onresult({resultIndex:0,results:[[{transcript:'big first step'}]]});this.onend();},30);}
        abort(){this.onerror({error:'aborted'});}
      };
    });
    await page.goto(base);
    await page.locator('#q').fill('We finally got it working');
    await page.getByRole('button',{name:'MEME ME'}).click();
    await expected('#status','13.0s');
    assert.equal(await page.locator('video').evaluate(v=>v.muted),false);
    await page.waitForFunction(()=>document.querySelector('video')?.currentTime>.15);
    assert.ok(await page.locator('#screen.expanded').count());
    await page.locator('video').evaluate(v=>{v.currentTime=v.duration-.25;});
    await expected('#status','Replay or Next');
    assert.equal(await page.locator('video').evaluate(v=>v.ended),true);
    await page.locator('#replay').click();
    await page.waitForFunction(()=>document.querySelector('video')?.currentTime<2);
    await page.locator('#player-next').click();
    await expected('#status','The Eagle lands');
    await page.waitForFunction(()=>document.querySelector('#stage img')?.naturalWidth>0);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#screen.expanded').count(),0);
    await page.locator('#full').uncheck();
    await page.locator('#mode').selectOption('gif');
    await expected('#status','The Eagle lands');
    let prior=await page.locator('#stage img').getAttribute('src');
    await page.locator('#random').click();
    assert.notEqual(await page.locator('#stage img').getAttribute('src'),prior);
    await page.locator('#mode').selectOption('video');
    await page.locator('#mic').click();
    await expected('#status','One small step');
    assert.equal(await page.locator('#q').inputValue(),'big first step');
    const manifest=await (await ctx.request.get(base+'/manifest.webmanifest')).json();
    assert.equal(manifest.display,'standalone');
    const session=await ctx.newCDPSession(page);
    const install=await session.send('Page.getInstallabilityErrors');
    assert.deepEqual(install.installabilityErrors,[]);
    await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(r=>navigator.serviceWorker.addEventListener('controllerchange',r,{once:true}));});
    await ctx.setOffline(true);
    await page.reload();
    await page.locator('#q').fill('let’s go');
    await page.locator('#fire').click();
    await expected('#status','10.0s');
    await page.waitForFunction(()=>document.querySelector('video')?.currentTime>.15);
    const rd=await page.evaluate(async()=>{const res=await fetch('/static/media/liftoff.mp4',{headers:{Range:'bytes=10-19'}});return [res.status,(await res.arrayBuffer()).byteLength];});
    assert.deepEqual(rd,[206,10]);
    await ctx.setOffline(false);
    await page.locator('#file').setInputFiles('static/media/one-small-step.mp4');
    await expected('#status','12.0s');
    assert.equal(await page.locator('#share').isDisabled(),true);
    assert.equal(await page.locator('video').evaluate(v=>v.src.startsWith('blob:')),true);
    if(process.env.MM_TOO_SHORT){
      await page.locator('#file').setInputFiles(process.env.MM_TOO_SHORT);
      await expected('#status','outside 5–20 seconds');
      assert.equal(await page.locator('#stage video').count(),0);
    }
    await ctx.close();
    const ext=await browser.newContext({...mobile,serviceWorkers:'block'});
    const mock=await ext.newPage();
    mock.on('pageerror',e=>errors.push(String(e)));
    const urls=[];
    let providerAvailable=true;
    await mock.route('**/static/config.js',route=>route.fulfill({status:200,contentType:'application/javascript',body:"window.MM_CONFIG={giphyClientKey:'mock-client-key'};"}));
    await mock.route('https://api.giphy.com/v1/gifs/search?**',route=>{
      urls.push(new URL(route.request().url()));
      return route.fulfill({status:providerAvailable?200:503,json:{data:[{id:'demo',title:'Mock provider reaction',url:'https://giphy.com/gifs/demo',images:{fixed_width:{url:'https://media.giphy.com/media/demo/giphy.gif'}}}]}});
    });
    await mock.route('https://media.giphy.com/**',route=>route.fulfill({path:'static/media/liftoff.gif',contentType:'image/gif'}));
    await mock.goto(base);await mock.locator('#full').uncheck();
    await mock.locator('#mode').selectOption('gif');
    await mock.locator('#q').fill('awkward reaction');
    await mock.locator('#fire').click();
    await mock.waitForFunction(()=>document.querySelector('#status').textContent.includes('Mock provider reaction'));
    assert.equal(urls.length,1);
    assert.equal(urls[0].searchParams.get('q'),'awkward reaction');
    await mock.waitForFunction(()=>document.querySelector('#stage img')?.naturalWidth>0 && document.querySelector('.giphy-mark')?.naturalWidth>0);
    providerAvailable=false;
    await mock.locator('#q').fill('different awkward reaction');
    await mock.locator('#fire').click();
    await mock.waitForFunction(()=>document.querySelector('#status').textContent.includes('live GIF search unavailable'));
    assert.equal(urls.length,2);
    assert.deepEqual(errors,[]);
    await ext.close();
    if(process.env.MM_OFFLINE_PREVIEW){
      const standalone=await browser.newPage(mobile);
      await standalone.goto(pathToFileURL(path.resolve(process.env.MM_OFFLINE_PREVIEW)).href);
      await standalone.locator('#fire').click();
      await standalone.waitForFunction(()=>document.querySelector('video')?.currentTime>.15);
      assert.equal(await standalone.locator('#mic').isDisabled(),true);
      await standalone.close();
    }
    if(process.env.MM_SCREENSHOT){
      const listing=await browser.newPage({...mobile,viewport:{width:450,height:900}});
      await listing.goto(base);
      await listing.locator('#full').uncheck();
      await listing.locator('#q').fill('Big first step');
      await listing.locator('#fire').click();
      await listing.waitForFunction(()=>document.querySelector('video')?.currentTime>.7);
      await listing.locator('video').evaluate(v=>v.pause());
      await listing.screenshot({path:process.env.MM_SCREENSHOT});
      await listing.reload();
      await listing.locator('#full').check();
      await listing.locator('#q').fill('let’s go');
      await listing.locator('#fire').click();
      await listing.waitForFunction(()=>document.querySelector('video')?.currentTime>2);
      await listing.locator('video').evaluate(v=>v.pause());
      await listing.screenshot({path:path.join(path.dirname(process.env.MM_SCREENSHOT),'02-fullscreen.png')});
    }
    console.log('PASS: mobile viewport, playback, format, fullscreen, replay, next, random, simulated voice, installability, offline media/range, file picker, direct provider mock and fallback.');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
