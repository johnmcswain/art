const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const assert = require('node:assert/strict');
const directory = process.env.ORGANISM_SOURCE || (fs.existsSync(path.join(__dirname, 'src', 'index.html')) ? path.join(__dirname, 'src') : __dirname);
const keepAlive = setInterval(() => {}, 1000);
const timeout = setTimeout(() => { console.error('Browser verification timed out'); child.kill(); process.exit(1); }, 90000);
const child = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--disable-gpu-sandbox', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=9241', `--user-data-dir=${path.join(__dirname, '.test-browser')}`, 'about:blank'
], { windowsHide: true, stdio: 'ignore' });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let ws;
(async () => {
  let tabs;
  for (let i = 0; i < 50; i++) {
    try { tabs = await (await fetch('http://127.0.0.1:9241/json')).json(); break; } catch { await delay(200); }
  }
  assert.ok(tabs, 'Browser started');
  console.log('Browser connected');
  ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let id = 0;
  const pending = new Map(), errors = [];
  ws.onmessage = ({ data }) => {
    const m = JSON.parse(data);
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails);
    if (m.id) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(m.error) : p.resolve(m.result); }
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => { pending.set(++id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
  const evaluate = async expression => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
    return r.result.value;
  };
  const screenshot = async name => {
    const result = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(__dirname, name), Buffer.from(result.data, 'base64'));
  };
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: pathToFileURL(path.join(directory, 'index.html')).href });
  await delay(1600);
  console.log('Page loaded');
  assert.equal(await evaluate('organism.particles.length'), 6200);
  await screenshot('preview-desktop.png');
  await evaluate('organism.paused = true; organism.reset();');
  await evaluate('for(let i=0;i<600;i++) organism.step(1/60); organism.render()');
  assert.equal(await evaluate('organism.statusLabel'), 'Paused');
  const rest = await evaluate('({x:organism.body.x,y:organism.body.y,breath:organism.breath})');
  assert.ok(Math.abs(rest.breath) > 0.01);
  await evaluate('Object.assign(organism.pointer,{active:true,x:organism.body.x+80,y:organism.body.y,lastX:organism.body.x+80,lastY:organism.body.y}); for(let i=0;i<360;i++)organism.step(1/60)');
  assert.ok(await evaluate('organism.trust > 0.65'), 'Still presence builds trust');
  await evaluate('organism.pointer.down = true; for(let i=0;i<180;i++)organism.step(1/60);organism.render()');
  assert.ok(await evaluate('organism.contact > 0.8 && organism.waves.length > 0'), 'Hold connects and sends waves');
  await screenshot('preview-connected.png');
  await evaluate('organism.pointer.down=false;for(let i=0;i<60;i++){organism.pointer.x=organism.body.x+(i%2?60:-60);organism.step(1/60)}');
  assert.ok(await evaluate('organism.alarm > 0.8'), 'Rapid nearby movement startles');
  await screenshot('preview-guarded.png');
  await evaluate('organism.pointer.active=false;for(let i=0;i<720;i++)organism.step(1/60)');
  assert.ok(await evaluate('organism.alarm < 0.01 && organism.contact < 0.01'), 'Recovers after departure');
  assert.ok(await evaluate('organism.particles.every(p=>[p.x,p.y,p.vx,p.vy].every(Number.isFinite))'), 'Physics remains finite');

  // Exercise actual DOM input paths as well as the behavioral model.
  await evaluate('organism.reset();organism.paused=false;organism.syncPause()');
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 780, y: 450, button: 'left', clickCount: 1 });
  assert.equal(await evaluate('organism.pointer.down'), true);
  await evaluate("organism.canvas.dispatchEvent(new PointerEvent('pointercancel',{pointerId:organism.pointer.id,pointerType:'mouse'}))");
  assert.equal(await evaluate('organism.pointer.down || organism.pointer.active'), false);
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 780, y: 450, button: 'left' });
  await evaluate("organism.canvas.focus();organism.canvas.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight'}));organism.canvas.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter'}))");
  assert.equal(await evaluate('organism.pointer.down && organism.pointer.active'), true);
  await evaluate("organism.canvas.dispatchEvent(new KeyboardEvent('keyup',{key:'Enter'}))");
  assert.equal(await evaluate('organism.pointer.down'), false);
  await evaluate("document.getElementById('pause').click()");
  const frozen = await evaluate('organism.time'); await delay(180);
  assert.equal(await evaluate('organism.time'), frozen, 'Pause freezes simulation');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await delay(200);
  await evaluate("document.getElementById('reset').click();organism.render()");
  assert.equal(await evaluate('organism.canvas.width'), 780);
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
  await screenshot('preview-mobile.png');
  await evaluate('organism.paused=false;organism.syncPause()');
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 200, y: 480 }] });
  assert.equal(await evaluate('organism.pointer.down'), true);
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  assert.equal(await evaluate('organism.pointer.down || organism.pointer.active'), false);
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await send('Page.reload'); await delay(300);
  assert.equal(await evaluate('organism.paused'), true, 'Reduced motion starts paused');
  await send('Emulation.setDeviceMetricsOverride', { width: 800, height: 700, deviceScaleFactor: 1, mobile: false });
  await delay(200); await evaluate('organism.reset();organism.render()');
  await screenshot('preview-tauri-size.png');
  assert.deepEqual(errors, []);
  console.log('PASS: rest, trust, touch pulses, startle, recovery, finite physics, pointer cancellation, keyboard, pause, resize, mobile touch, reduced motion; no browser exceptions.');
  await send('Browser.close');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { clearInterval(keepAlive); clearTimeout(timeout); if (ws) ws.close(); child.kill(); });
