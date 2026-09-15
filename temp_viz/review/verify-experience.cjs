const {spawn}=require('node:child_process');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname, '..');
const keep=setInterval(()=>{},1000);
const child=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',[
  '--headless=new','--no-sandbox','--disable-gpu-sandbox','--no-first-run','--use-angle=swiftshader','--enable-unsafe-swiftshader',
  '--remote-debugging-port=9255',`--user-data-dir=${path.join(__dirname,'.thermal-experience-browser')}`,'about:blank'
],{windowsHide:true,stdio:'ignore'});
let ws;const timer=setTimeout(()=>{console.error('Verification timed out');child.kill();process.exit(1);},180000);
const delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  let tabs;for(let i=0;i<60;i++){try{tabs=await(await fetch('http://127.0.0.1:9255/json')).json();break;}catch{await delay(200);}}
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
  const domain=await ev('__dbg.domain()');
  const query=async text=>{await ev(`document.getElementById('placeQuery').value=${JSON.stringify(text)};document.getElementById('placeQuery').dispatchEvent(new Event('input'))`);};
  await ev("document.getElementById('btnPlaces').click()");await delay(350);
  await query('Atlantis');assert.equal(await ev("document.querySelectorAll('#placeResults button').length"),0);
  await query('California');assert.ok(await ev("document.querySelectorAll('#placeResults button').length>5"));
  await query('Seattle');assert.equal(await ev("document.querySelectorAll('#placeResults button').length"),1);
  await delay(800);await snap('thermal-places-search.png');
  await ev("document.getElementById('placeQuery').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}))");
  assert.deepEqual(await ev('__dbg.pins()'),['Seattle']);
  await ev("document.getElementById('btnPlaces').click()");await query('Seattle');await ev("document.querySelector('#placeResults button').click()");
  assert.equal((await ev('__dbg.pins()')).length,1,'Revisit does not unpin');
  await ev("document.getElementById('btnPlaces').click()");await query('Miami');await ev("document.querySelector('#placeResults button').click()");
  assert.deepEqual(await ev('__dbg.pins()'),['Seattle','Miami']);
  await ev("document.dispatchEvent(new KeyboardEvent('keydown',{key:'r',bubbles:true}));__dbg.settle();document.getElementById('btnCompare').click()");
  await delay(900);
  let state=await ev('__dbg.comparison()');assert.equal(state.active,true);assert.equal(state.a,'2024-01');assert.equal(state.b,'2024-07');
  assert.deepEqual(await ev('__dbg.domain()'),domain);assert.equal(await ev('__dbg.graphics().error'),0);
  const expected=await ev("(()=>{const d=JSON.parse(document.getElementById('mapdata').textContent);const bytes=Uint8Array.from(atob(d.tm),c=>c.charCodeAt(0));const values=new Int16Array(bytes.buffer);return ['Seattle','Miami'].map(name=>{const i=d.meta.findIndex(m=>m[0]===name);const a=values[i*d.months.length]/10,b=values[i*d.months.length+6]/10;return{name,a,b,delta:b-a};});})()");
  for(let i=0;i<2;i++){assert.ok(Math.abs(state.rows[i].a-expected[i].a)<0.001);assert.ok(Math.abs(state.rows[i].b-expected[i].b)<0.001);assert.ok(Math.abs(state.rows[i].delta-expected[i].delta)<0.001);}
  await snap('thermal-comparison-desktop.png');
  const box=await ev("(()=>{const r=document.getElementById('divider').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()");
  await send('Input.dispatchMouseEvent',{type:'mousePressed',x:box.x,y:box.y,button:'left',clickCount:1});
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:850,y:box.y,button:'left',buttons:1});
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:850,y:box.y,button:'left'});
  assert.ok(Math.abs((await ev('__dbg.comparison().split'))-850/1280)<0.01);
  await ev("document.getElementById('divider').dispatchEvent(new KeyboardEvent('keydown',{key:'Home',bubbles:true}))");assert.equal(await ev('__dbg.comparison().split'),0.05);
  await ev("document.getElementById('divider').dispatchEvent(new KeyboardEvent('keydown',{key:'End',bubbles:true}))");assert.equal(await ev('__dbg.comparison().split'),0.95);
  await ev("document.getElementById('centerCompare').click();document.getElementById('uC').click()");await delay(400);
  state=await ev('__dbg.comparison()');for(let i=0;i<2;i++)assert.ok(Math.abs(state.rows[i].delta-expected[i].delta*5/9)<0.001);
  await ev("document.getElementById('monthB').value='2024-01';document.getElementById('monthB').dispatchEvent(new Event('change'))");await delay(500);
  assert.ok((await ev('__dbg.comparison().rows')).every(r=>r.delta===0));
  await ev("document.getElementById('monthB').value='2026-08';document.getElementById('monthB').dispatchEvent(new Event('change'))");await delay(500);
  assert.match(await ev("document.getElementById('compareValues').textContent"),/Partial month/);
  await ev("document.getElementById('monthB').value='2024-07';document.getElementById('monthB').dispatchEvent(new Event('change'))");await delay(500);
  const shared=await ev('__dbg.state()');
  await send('Page.navigate',{url:baseURL+'?experience-share=1#'+shared});await loaded();await delay(600);
  state=await ev('__dbg.comparison()');assert.equal(state.active,true);assert.equal(state.b,'2024-07');assert.equal(state.split,0.5);assert.equal(state.rows.length,2);
  console.log('PASS: search, state-name matching, no results, keyboard choice, repeat selection, exact deltas, Celsius differences, same-month equality, partial labels, divider pointer/keyboard, shared comparison.');
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1.5,mobile:true});await delay(450);await ev('__dbg.settle()');await delay(600);
  assert.equal(await ev('document.documentElement.scrollWidth<=innerWidth'),true);
  await snap('thermal-comparison-mobile.png');
  const touch=await ev("(()=>{const r=document.getElementById('divider').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()");
  await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch]});await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:280,y:touch.y}]});await send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
  assert.ok(Math.abs((await ev('__dbg.comparison().split'))-280/390)<0.01);
  await ev("document.getElementById('closeCompare').click()");assert.equal(await ev('__dbg.comparison().active'),false);assert.equal(await ev('__dbg.info().month'),0);
  assert.deepEqual(await ev('__dbg.pins()'),['Seattle','Miami']);
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`const get=WebGL2RenderingContext.prototype.getExtension;WebGL2RenderingContext.prototype.getExtension=function(name){if(name==='EXT_color_buffer_float')return null;return get.call(this,name);};`});
  await send('Page.navigate',{url:baseURL+'?comparison-fallback=1#'+shared});await loaded();await delay(500);
  assert.equal(await ev('__dbg.info().floatRT'),false);assert.equal(await ev('__dbg.graphics().error'),0);assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(__dirname,'thermal-experience-verification.json'),JSON.stringify({passed:true,expected,comparison:state,errors},null,2));
  console.log('PASS: mobile comparison, touch divider cancellation, exit restores month A, pins preserved, non-HDR comparison fallback; no JS or WebGL errors.');

  await send('Browser.close');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>{clearInterval(keep);clearTimeout(timer);if(ws)ws.close();child.kill();});


