// Local browser verification using Chrome's DevTools protocol; no npm dependencies.
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const child=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',[
  '--headless=new','--disable-gpu','--no-sandbox','--disable-gpu-sandbox','--no-first-run','--no-default-browser-check',
  '--remote-debugging-port=9237',`--user-data-dir=${path.join(process.cwd(),'.preview-profile')}`,'about:blank'
],{windowsHide:true,stdio:'ignore'});
const delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 let tabs;
 for(let i=0;i<40;i++){try{tabs=await(await fetch('http://127.0.0.1:9237/json')).json();break;}catch{await delay(250);}}
 if(!tabs)throw new Error('Chrome did not start');
 const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
 let sequence=0;const pending=new Map(),errors=[];
 ws.onmessage=({data})=>{const m=JSON.parse(data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p.reject(m.error);else p.resolve(m.result);}};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 const evaluate=async expression=>{const out=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(out.exceptionDetails)throw new Error(JSON.stringify(out.exceptionDetails));return out.result.value;};
 const until=async expression=>{for(let i=0;i<200;i++){if(await evaluate(expression))return;await delay(50);}throw new Error('Timed out waiting for '+expression);};
 await send('Runtime.enable');await send('Page.enable');
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:require('node:url').pathToFileURL(path.join(process.cwd(),'firefly_ribbons.html')).href});await delay(1200);
 assert.equal(await evaluate('records.length'),19);assert.equal(await evaluate('visible.length'),19);
 await evaluate('finishOpening();setPaused(true);state.harmony="ember";state.hue=0;applyPalette();state.yaw=1.1;draw()');
 const snap=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync('preview-desktop.png',Buffer.from(snap.data,'base64'));
 assert.equal(await evaluate("normalize([{date:'2026-01-01 00:00:00',lat:'30',lon:'70',latDir:'S',lonDir:'W',energy:'2'}])[0].lon"),-70);
 assert.equal(await evaluate("normalize([{date:'2026-01-01 00:00:00',lat:null,lon:'70',latDir:'S',lonDir:'W',energy:'2'}]).length"),0);
 await evaluate("$('energyFilter').value=43; updateFilters()");assert.equal(await evaluate('visible.length'),0);assert.equal(await evaluate("$('empty').hidden"),false);
 await evaluate("$('resetFilters').click()");assert.equal(await evaluate('visible.length'),19);
 await evaluate("$('ageFilter').value=1;updateFilters()");assert.equal(await evaluate('visible.length'),2);
 await evaluate("$('resetFilters').click(); selectEvent(2,true)");assert.equal(await evaluate("$('eventCoords').textContent"),'19.5° S / 176.2° E');assert.equal(await evaluate('state.paused'),true);
 const imported=await evaluate(`(async()=>{const payload={signature:{version:'1.2'},fields:['date','energy','lat','lat-dir','lon','lon-dir','alt','impact-e'],data:[['2020-01-01 00:00:00','8','12','S','90','W',null,null],['2020-01-01 00:00:00','8',null,null,null,null,null,null]]};const dt=new DataTransfer();dt.items.add(new File([JSON.stringify(payload)],'test.json',{type:'application/json'}));$('importFile').files=dt.files;$('importFile').dispatchEvent(new Event('change'));await new Promise(r=>setTimeout(r,100));return {count:records.length,alt:$('eventAltitude').textContent,status:$('importStatus').textContent};})()`);
 assert.equal(imported.count,1);assert.equal(imported.alt,'Unknown');assert.match(imported.status,/1 records skipped/);
 await evaluate(`(async()=>{const dt=new DataTransfer();dt.items.add(new File(['{"wrong":true}'],'invalid.json',{type:'application/json'}));$('importFile').files=dt.files;$('importFile').dispatchEvent(new Event('change'));await new Promise(r=>setTimeout(r,100));})()`);
 assert.equal(await evaluate('records.length'),1);assert.match(await evaluate("$('importStatus').textContent"),/Import failed/);
 await evaluate("$('sampleButton').click();setPaused(true)");assert.equal(await evaluate('records.length'),19);
 // A selected encounter survives a reversible globe -> loom transition.
 const cameraBefore=await evaluate('({yaw:state.yaw,pitch:state.pitch,zoom:state.zoom})');
 await evaluate('selectEvent(5,true)');await until('transitions.size===0');
 assert.equal(await evaluate('state.focused'),5);assert.equal(await evaluate("$('focusPanel').hidden"),false);
 assert.equal(await evaluate('state.focusAmount'),1);
 const focusSnap=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync('preview-encounter.png',Buffer.from(focusSnap.data,'base64'));
 await evaluate("$('loomView').click()");await delay(450);
 assert.equal(await evaluate('state.morph>0 && state.morph<1'),true);
 await until('state.morph===1');assert.equal(await evaluate('state.morph'),1);assert.equal(await evaluate('state.selected'),5);
 assert.equal(await evaluate('Math.abs(loomPoint(records.at(-1),0).x-loomBounds().left)<.001'),true);
 assert.equal(await evaluate('Math.abs(loomPoint(records[0],0).x-loomBounds().right)<.001'),true);
 assert.equal(await evaluate('hitPoints.length'),19);
 await evaluate("$('closeFocus').click()");await until('transitions.size===0');
 assert.equal(await evaluate('state.focused'),null);assert.deepEqual(await evaluate('({yaw:state.yaw,pitch:state.pitch,zoom:state.zoom})'),cameraBefore);
 // Palette shifts never change measurement or geometric data.
 const dataBefore=await evaluate('JSON.stringify(records.map(r=>({id:r.id,energy:r.energy,path:r.path})))');
 const originalColor=await evaluate('records[0].color.join()');
 for(const harmony of ['aurora','iris','solstice','moonstone']){
   await evaluate(`$('harmony').value='${harmony}';$('harmony').dispatchEvent(new Event('change'))`);
   assert.equal(await evaluate('state.harmony'),harmony);
 }
 await evaluate("$('harmony').value='iris';$('harmony').dispatchEvent(new Event('change'));$('hueFilter').value=25;$('hueFilter').dispatchEvent(new Event('input'))");
 assert.equal(await evaluate("$('hueVal').textContent"),'+25°');assert.notEqual(await evaluate('records[0].color.join()'),originalColor);
 assert.equal(await evaluate('JSON.stringify(records.map(r=>({id:r.id,energy:r.energy,path:r.path})))'),dataBefore);
 const loomSnap=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync('preview-loom.png',Buffer.from(loomSnap.data,'base64'));
 await send('Page.reload');await delay(400);
 assert.equal(await evaluate('state.harmony'),'iris');assert.equal(await evaluate('state.hue'),25);assert.equal(await evaluate('openingActive'),false);
 // Repeated view requests settle on the last requested destination.
 await evaluate("setPaused(true);setView('loom');setView('globe');setView('loom')");await until('state.morph===1');assert.equal(await evaluate('state.morph'),1);
 await evaluate("$('openingButton').click()");assert.equal(await evaluate('openingActive'),true);
 await delay(550);assert.equal(await evaluate('state.opening>0 && state.opening<1'),true);
 await evaluate("$('openingButton').click()");assert.equal(await evaluate('state.opening'),1);assert.equal(await evaluate('openingActive'),false);
 await evaluate("startOpening()");await until('!openingActive');assert.equal(await evaluate('openingActive'),false);
 await evaluate("setPaused(true);state.harmony='ember';state.hue=0;applyPalette();setView('globe',true);draw()");
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await delay(300);
 assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'),true);
 assert.equal(await evaluate("document.querySelector('.opening-tools').getBoundingClientRect().bottom < document.querySelector('.controls').getBoundingClientRect().top"),true,'opening controls clear filters');
 const mobile=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync('preview-mobile.png',Buffer.from(mobile.data,'base64'));
 await evaluate("setView('loom')");await until('state.morph===1');
 const mobileLoom=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync('preview-mobile-loom.png',Buffer.from(mobileLoom.data,'base64'));
 await evaluate('selectEvent(5,true)');await until('transitions.size===0');
 assert.equal(await evaluate("$('focusPanel').getBoundingClientRect().bottom < document.querySelector('.controls').getBoundingClientRect().top"),true,'encounter panel clears filters');
 const mobileFocus=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync('preview-mobile-focus.png',Buffer.from(mobileFocus.data,'base64'));
 await evaluate("document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))");await until('transitions.size===0');assert.equal(await evaluate('state.focused'),null);
 for(const w of [360,768,1024]){await send('Emulation.setDeviceMetricsOverride',{width:w,height:900,deviceScaleFactor:1,mobile:w<721});await delay(120);assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true,`overflow at ${w}`);if(w===768){const tablet=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync('preview-tablet.png',Buffer.from(tablet.data,'base64'));}}
 // Actual pointer input on a loom spark opens the same encounter as archive selection.
 await evaluate("setView('loom',true);setPaused(true);draw()");
 const target=await evaluate("(()=>{const p=hitPoints.find(p=>p.r.id===5),b=canvas.getBoundingClientRect();return {x:p.x+b.left,y:p.y+b.top};})()");
 await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...target});
 await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...target});
 assert.equal(await evaluate('state.focused'),5);
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await send('Page.reload');await delay(600);assert.equal(await evaluate('state.paused'),true);
 assert.equal(await evaluate('openingActive'),false);
 await evaluate("setView('loom');selectEvent(0,true)");assert.equal(await evaluate('state.morph'),1);assert.equal(await evaluate('state.focusAmount'),1);
 await evaluate('closeEncounter();startOpening()');assert.equal(await evaluate('openingActive'),false);assert.equal(await evaluate('transitions.size'),0);
 assert.deepEqual(errors,[]);
 console.log('PASS: prior data/filter/import checks; encounter focus and camera restoration; reversible date-proportional loom; rapid view changes; five palettes and hue persistence; opening replay/skip/completion; 360/390/768/1024 mobile layouts; reduced motion; no browser exceptions.');
 await send('Browser.close');ws.close();
})().catch(error=>{console.error(error);child.kill();process.exitCode=1;});
