const {spawn}=require('node:child_process');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname, '..');
const keep=setInterval(()=>{},1000);
const child=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',[
  '--headless=new','--no-sandbox','--disable-gpu-sandbox','--no-first-run','--use-angle=swiftshader','--enable-unsafe-swiftshader',
  '--remote-debugging-port=9253',`--user-data-dir=${path.join(__dirname,'.thermal-enhanced-browser')}`,'about:blank'
],{windowsHide:true,stdio:'ignore'});
let ws;const timer=setTimeout(()=>{console.error('Verification timed out');child.kill();process.exit(1);},180000);
const delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  let tabs;for(let i=0;i<60;i++){try{tabs=await(await fetch('http://127.0.0.1:9253/json')).json();break;}catch{await delay(200);}}
  assert.ok(tabs);ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
  await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
  let seq=0;const pending=new Map(),errors=[];
  ws.onmessage=({data})=>{const m=JSON.parse(data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.j(m.error):p.r(m.result);}};
  const send=(method,params={})=>new Promise((r,j)=>{const id=++seq;pending.set(id,{r,j});ws.send(JSON.stringify({id,method,params}));});
  const ev=async expression=>{const x=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(x.exceptionDetails)throw Error(JSON.stringify(x.exceptionDetails));return x.result.value;};
  const snap=async name=>{const x=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(__dirname,name),Buffer.from(x.data,'base64'));};
  await send('Runtime.enable');await send('Page.enable');
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`Object.defineProperty(navigator,'onLine',{get:()=>false});let seed=12345;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};`});
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
  const baseURL=pathToFileURL(path.join(root,'temp_viz.enhanced.html')).href;
  async function loaded(){for(let i=0;i<120;i++){if(await ev('Boolean(window.__dbg)'))break;await delay(100);}await delay(300);assert.equal(await ev("document.getElementById('fail').textContent"),'');await ev('__dbg.settle()');await delay(500);}
  await send('Page.navigate',{url:baseURL+'#m=0'});await loaded();
  const info=await ev('({info:__dbg.info(),graphics:__dbg.graphics(),domain:__dbg.domain(),axis:__dbg.axis(),field:__dbg.fieldStats(),look:__dbg.look()})');
  assert.equal(info.graphics.error,0);assert.equal(info.graphics.emission,true);assert.equal(info.axis.length,32);
  assert.equal(info.look.motion,false);
  const frozen=await ev('__dbg.look().time');await delay(250);assert.equal(await ev('__dbg.look().time'),frozen);
  await snap('thermal-enhanced-january.png');
  console.log('Shaders, MRT glow, initial rendering, and reduced motion passed.');
  await ev('__dbg.setMonth(6)');await delay(400);await snap('thermal-enhanced-july.png');
  const july=await ev('JSON.stringify(__dbg.fieldStats())');
  for(const palette of [1,2,3,4,0]){
    await ev(`document.querySelectorAll('#ramps button')[${palette}].click()`);await delay(250);
    assert.equal(await ev('JSON.stringify(__dbg.fieldStats())'),july);
    assert.equal(await ev('__dbg.graphics().error'),0);
  }
  await ev("document.getElementById('btnLook').click();for(const [key,value]of [['radiance',120],['atmosphere',100],['flow',130]]){const input=document.getElementById('look-'+key);input.value=value;input.dispatchEvent(new Event('input'));}");
  assert.equal(await ev('__dbg.look().radiance'),1.2);assert.equal(await ev('JSON.stringify(__dbg.fieldStats())'),july);
  await delay(700);await snap('thermal-enhanced-controls.png');
  await ev("document.getElementById('motionLook').click()");await delay(400);
  assert.ok(await ev('__dbg.look().time>0'));
  await ev("document.getElementById('motionLook').click()");
  const stopped=await ev('__dbg.look().time');await delay(200);assert.equal(await ev('__dbg.look().time'),stopped);
  await ev("document.getElementById('resetLook').click();document.getElementById('pclose').click()");
  const names=await ev("JSON.parse(document.getElementById('mapdata').textContent).meta.slice(0,5).map(m=>m[0])");
  // Name position is verified from the actual payload rather than assuming an index.
  const firstName=await ev("(()=>{const d=JSON.parse(document.getElementById('mapdata').textContent);return d.meta[0].find(v=>typeof v==='string'&&__dbg.stn(v));})()");
  assert.ok(firstName);
  await ev(`__dbg.pin(${JSON.stringify(firstName)})`);assert.equal((await ev('__dbg.pins()')).length,1);
  await ev("document.getElementById('uC').click();document.getElementById('btnFlat').click();__dbg.settle()");await delay(300);
  assert.equal(await ev("document.getElementById('uC').getAttribute('aria-pressed')"),'true');
  assert.equal((await ev('__dbg.pins()')).length,1);assert.deepEqual(await ev('__dbg.domain()'),info.domain);
  await ev("document.getElementById('btnTable').click()");assert.ok(await ev("document.querySelectorAll('#pbody tbody tr').length>100"));
  await ev("document.getElementById('pclose').click();document.getElementById('btnFlat').click();__dbg.settle();document.getElementById('uF').click()");
  await delay(600);const shared=await ev('__dbg.state()');
  await send('Page.navigate',{url:baseURL+'?shared=1#'+shared});await loaded();
  assert.equal((await ev('__dbg.pins()')).length,1);assert.deepEqual(await ev('__dbg.domain()'),info.domain);
  console.log('Palettes, look controls, motion pause, pins, units, flat view, table, and shared state passed.');
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1.5,mobile:true});await delay(350);await ev('__dbg.settle()');await delay(300);
  assert.equal(await ev('document.documentElement.scrollWidth<=innerWidth'),true);
  await snap('thermal-enhanced-mobile.png');
  await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:180,y:370}]});
  await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:220,y:380}]});
  await send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
  assert.equal(await ev("document.getElementById('gl').classList.contains('drag')"),false);
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`const get=WebGL2RenderingContext.prototype.getExtension;WebGL2RenderingContext.prototype.getExtension=function(name){if(name==='EXT_color_buffer_float')return null;return get.call(this,name);};`});
  await send('Emulation.setDeviceMetricsOverride',{width:900,height:700,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:baseURL+'?fallback=1#m=0'});await loaded();
  assert.equal(await ev('__dbg.info().floatRT'),false);assert.equal(await ev('__dbg.graphics().error'),0);
  await snap('thermal-enhanced-fallback.png');assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(__dirname,'thermal-enhanced-verification.json'),JSON.stringify({passed:true,info,errors},null,2));
  console.log('PASS: mobile layout, touch cancellation, RGBA8 fallback; no JavaScript exceptions or WebGL errors.');
  await send('Browser.close');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>{clearInterval(keep);clearTimeout(timer);if(ws)ws.close();child.kill();});

