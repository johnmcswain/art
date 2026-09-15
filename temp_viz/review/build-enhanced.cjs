const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const original = fs.readFileSync(path.join(root, 'archive/temp_viz.2026-09-13.baseline.html'));
if (crypto.createHash('sha256').update(original).digest('hex') !== 'c14b8853810473fa39b5055143167b78b57dacdbe1031f2b95da6d3aae34bcc1') throw Error('Baseline changed');
let html = original.toString('utf8').replace(/\r\n/g, '\n');
function replace(from, to) { if (!html.includes(from)) throw Error('Missing anchor: '+from.slice(0,90)); html = html.replace(from,to); }
function shader(name, transform) {
  const start = html.indexOf('const '+name+' = `');
  const end = html.indexOf('`;', start)+2;
  if (start<0 || end<start) throw Error('Shader missing '+name);
  html = html.slice(0,start)+transform(html.slice(start,end))+html.slice(end);
}

replace('<title>Thermal Atlas</title>', '<!doctype html>\n<meta charset="UTF-8">\n<title>Thermal Atlas — Luminous edition</title>');
replace('</style>', `
/* Luminous edition: the rendering controls leave the data controls intact. */
#plate .edition{display:block;margin-top:10px;color:#80aeba;font-size:8px;letter-spacing:.22em;text-transform:uppercase}
#tools{flex-wrap:wrap;max-width:360px}
#look{padding:24px;font-family:var(--sans);color:var(--ink-dim);font-size:13px;line-height:1.7}
#look h3{font:normal 24px var(--sans);color:var(--ink);margin:0 0 10px}
#look .control{border-top:1px solid var(--line);padding:20px 0 6px;margin-top:18px}
#look label{display:flex;justify-content:space-between;color:var(--ink);font:11px var(--mono);letter-spacing:.08em}
#look input{width:100%;accent-color:var(--accent);margin:15px 0 5px}
#look small{display:block;color:var(--ink-dim)}
#look .look-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:25px}
#look a{color:var(--accent);text-underline-offset:4px}
#panel:not(.on){visibility:hidden}
@media(max-width:900px){#plate .edition{font-size:7px;margin-top:8px}#tools{max-width:100%}#scale{padding:8px 11px}#ramps{margin-top:7px}#readout{max-height:36vh}}
@media(max-width:460px){#plate h1{font-size:10px;letter-spacing:.17em}#readout{width:154px}.tb{padding:0 8px}#hud{gap:7px}}
</style>`);
replace('<canvas id="gl"></canvas>', '<canvas id="gl" tabindex="0" aria-label="Thermal atlas. Drag to orbit, scroll to zoom, click stations to pin. Keyboard: arrows orbit, Q and E zoom, Space plays the record."></canvas>');
replace('<h1>Thermal Atlas</h1>', '<h1>Thermal Atlas</h1><span class="edition">Luminous edition / 01</span>');
replace('<button class="tb" id="btnHelp">?</button>', '<button class="tb" id="btnLook">Look</button><button class="tb" id="btnHelp" aria-label="About and controls">?</button>');
replace('const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;', `const motionQuery = matchMedia("(prefers-reduced-motion: reduce)");
let RM = motionQuery.matches;
const look = {radiance:0.65, atmosphere:0.65, flow:0.8, motion:!RM};
motionQuery.addEventListener("change", e=>{ RM=e.matches; if(RM){look.motion=false;playing=false;syncPlay();if(panelMode==="look")paintLook();} });`);
replace('const NPART = RM ? 0 : 4200;', 'const NPART = 4200; // allocated once; reduced motion and pause control drawing time');

// Decode the palette in hardware before filtering/lighting. Output encoding is in compFS.
replace('texRamp  = tex2d(RN,1, gl.RGBA8,', 'texRamp  = tex2d(RN,1, gl.SRGB8_ALPHA8,');
replace('[1,3,5].map(i => parseInt(h.slice(i,i+2),16)/255)', '[1,3,5].map(i => s2l(parseInt(h.slice(i,i+2),16)/255))');
replace('vFade = abs(aCorner.y);','vFade = aCorner.y;');
replace('smoothstep(0.35, 1.0, vFade)','smoothstep(0.35, 1.0, abs(vFade))');
replace('smoothstep(0.95,0.62,r) - smoothstep(0.56,0.28,r)', '(1.0-smoothstep(0.62,0.95,r)) - (1.0-smoothstep(0.28,0.56,r))');
replace('smoothstep(0.44,0.0,r)', '(1.0-smoothstep(0.0,0.44,r))');
replace('abs(fract(ph) - 0.5)', 'abs(fract(ph + 0.5) - 0.5)');

// An independent emission attachment keeps warm surface color out of the bloom mask.
replace('function mkFBO(w,h,float,depth){','function mkFBO(w,h,float,depth,emission=false){');
replace('  let rb = null;', `  let emissionT = null;
  if(emission){
    emissionT = float && HAS_FLOAT_RT
      ? tex2d(w,h,gl.RGBA16F,gl.RGBA,gl.HALF_FLOAT,null)
      : tex2d(w,h,gl.RGBA8,gl.RGBA,gl.UNSIGNED_BYTE,null);
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT1,gl.TEXTURE_2D,emissionT,0);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0,gl.COLOR_ATTACHMENT1]);
  }
  let rb = null;`);
replace('  return { fb, t, rb, w, h };', '  return { fb, t, emissionT, rb, w, h };');
replace('  gl.bindFramebuffer(gl.FRAMEBUFFER, null);\n  return { fb, t, emissionT, rb, w, h };', `  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  if(status!==gl.FRAMEBUFFER_COMPLETE) throw new Error("Framebuffer incomplete: "+status);
  return { fb, t, emissionT, rb, w, h };`);
replace('gl.deleteFramebuffer(f.fb); gl.deleteTexture(f.t); if (f.rb)', 'gl.deleteFramebuffer(f.fb); gl.deleteTexture(f.t); if(f.emissionT)gl.deleteTexture(f.emissionT); if (f.rb)');
replace('fboScene = mkFBO(w,h,true,true);','fboScene = mkFBO(w,h,true,true,true);');
for(const name of ['terrainFS','skirtFS','lineFS','stationFS','partFS']) {
  shader(name, source=>source.replace('out vec4 o;', 'layout(location=0) out vec4 o;\nlayout(location=1) out vec4 emission;').replace('void main(){','void main(){\n  emission=vec4(0.0);'));
}
shader('lineFS', s=>s.replace('o = vec4(uColor.rgb*a, a);','o = vec4(uColor.rgb*a, a);\n  emission = vec4(uColor.rgb*a*1.6,a);'));
shader('stationFS', s=>s.replace('o = vec4(col*a, a);','o = vec4(col*a, a);\n  emission = vec4(col*a*(0.35 + pinned*1.3 + vHot*0.7),a);'));
shader('partFS', s=>s.replace('o = vec4(c*a, a);','o = vec4(c*a, a);\n  emission = vec4(c*a*1.5,a);'));
replace('  gl.clearColor(0.008,0.012,0.018,1);', '  gl.clearColor(0.0035,0.006,0.012,1);');
replace('gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);', 'gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);\n  gl.clearBufferfv(gl.COLOR,1,emissionClear);');
replace('const bloomTmp = new Float32Array(2);','const bloomTmp = new Float32Array(2);\nconst emissionClear = new Float32Array([0,0,0,0]);');
replace('gl.bindTexture(gl.TEXTURE_2D, fboScene.t);\n  gl.uniform1i(pBright', 'gl.bindTexture(gl.TEXTURE_2D, fboScene.emissionT);\n  gl.uniform1i(pBright');
replace('gl.uniform1f(pBright.u.uThresh, 0.80)', 'gl.uniform1f(pBright.u.uThresh, 0.10)');
shader('brightFS',s=>s.replace('float k = max(l-uThresh, 0.0)/max(l,1e-4);', `float knee = 0.08;
  float soft = clamp(l-uThresh+knee,0.0,2.0*knee);
  soft = soft*soft/(4.0*knee+1e-5);
  float k = max(l-uThresh,soft)/max(l,1e-4);`));

// Broad dielectric highlights reveal the thermal surface without changing its height.
shader('terrainFS',s=>s.replace('  vec3 H = normalize(L1+V);\n  col += vec3(0.55,0.68,0.80) * uSunCol * pow(max(dot(n,H),0.0), 34.0) * 0.09;', `  vec3 H = normalize(L1+V);
  float NoH=max(dot(n,H),0.0), NoV=max(dot(n,V),0.001), NoL=max(dot(n,L1),0.001);
  float roughness=0.40, a2=pow(roughness,4.0);
  float denom=NoH*NoH*(a2-1.0)+1.0;
  float distribution=a2/(3.14159*denom*denom);
  float k=pow(roughness+1.0,2.0)/8.0;
  float geometry=(NoV/(NoV*(1.0-k)+k))*(NoL/(NoL*(1.0-k)+k));
  vec3 fresnel=vec3(0.035)+(1.0-vec3(0.035))*pow(1.0-max(dot(H,V),0.0),5.0);
  col += fresnel*distribution*geometry/(4.0*NoV*NoL)*NoL*uSunCol*0.70;
  col += vec3(0.055,0.085,0.11)*rim*0.32;`));
replace('airDens = AIR_D * (0.50 + 0.50*relief/RELIEF);','airDens = AIR_D * look.atmosphere * (0.20 + 0.80*relief/RELIEF);');
replace('[0.048,0.066,0.094][i]', '[0.012,0.020,0.033][i]');
replace('[0.135,0.170,0.220][i]', '[0.045,0.070,0.105][i]');

// Correlated drift and small projected streaks provide a more coherent convection layer.
shader('partVS',s=>s.replace('uniform float uTime, uRelief, uScale, uCeil;', 'uniform float uTime, uRelief, uScale, uCeil, uFlow;\nout vec2 vFlow;')
 .replace('home += vec2(sin(a)*0.055 + sin(a*0.37+1.7)*0.035,\n               cos(a*0.83)*0.045 + cos(a*0.29+0.6)*0.03);', `vec2 drift=vec2(sin(home.y*13.0+uTime*0.16),cos(home.x*11.0-uTime*0.13));
  home += drift*0.032 + vec2(sin(a),cos(a*0.83))*0.018;`)
 .replace('  gl_Position = c;\n  vT = t;', `  gl_Position = c;
  vec4 ahead = uVP*vec4(w+vec3(drift.x*0.01,0.025,drift.y*0.01),1.0);
  vec2 direction=(ahead.xy/max(ahead.w,0.001)-c.xy/max(c.w,0.001))*vec2(uScale, uScale);
  vFlow=length(direction)>1e-6?normalize(direction):vec2(0.0,1.0);
  vT = t;`)
 .replace('vA = edge *', 'vA = uFlow * edge *')
 .replace('(0.0035 + ph*0.0060)', '(0.0060 + ph*0.0090)'));
shader('partFS',s=>s.replace('in float vT; in float vA; in float vK;','in float vT; in float vA; in float vK;\nin vec2 vFlow;')
 .replace('float r = length(d)*2.0;', `vec2 flow=vec2(vFlow.x,-vFlow.y);
  vec2 q=vec2(dot(d,flow),dot(d,vec2(-flow.y,flow.x))*2.8);
  float r = length(q)*2.0;`));
replace('gl.uniform1f(pPart.u.uTime, tAcc);','gl.uniform1f(pPart.u.uTime, tAcc);\n    gl.uniform1f(pPart.u.uFlow, look.flow);');
replace('  if (nPart){\n    gl.blendFunc', '  if (nPart && look.flow>0){\n    gl.blendFunc');

shader('compFS',()=>`const compFS = \`#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uScene, uB1, uB2;
uniform vec2 uResolution;
uniform float uBloom, uTime, uGrain, uVig, uExp;
out vec4 o;
vec3 aces(vec3 x){return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0);}
vec3 encodeSRGB(vec3 c){return mix(c*12.92,1.055*pow(max(c,vec3(0.0)),vec3(1.0/2.4))-0.055,step(vec3(0.0031308),c));}
float luma(vec3 c){return dot(c,vec3(0.299,0.587,0.114));}
// FXAA acts on the offscreen scene, where the geometry is actually rendered.
vec3 antialias(vec2 uv){
  vec2 px=1.0/uResolution;
  vec3 center=texture(uScene,uv).rgb;
  float nw=luma(texture(uScene,uv+vec2(-1,-1)*px).rgb);
  float ne=luma(texture(uScene,uv+vec2(1,-1)*px).rgb);
  float sw=luma(texture(uScene,uv+vec2(-1,1)*px).rgb);
  float se=luma(texture(uScene,uv+vec2(1,1)*px).rgb), mid=luma(center);
  float lo=min(mid,min(min(nw,ne),min(sw,se))),hi=max(mid,max(max(nw,ne),max(sw,se)));
  if(hi-lo<max(0.015,hi*0.10))return center;
  vec2 dir=vec2(-((nw+ne)-(sw+se)),(nw+sw)-(ne+se));
  float reduce=max((nw+ne+sw+se)*0.03125,0.0078125);
  dir=clamp(dir/(min(abs(dir.x),abs(dir.y))+reduce),vec2(-6.0),vec2(6.0))*px;
  vec3 a=0.5*(texture(uScene,uv+dir*(1.0/3.0-0.5)).rgb+texture(uScene,uv+dir*(2.0/3.0-0.5)).rgb);
  vec3 b=a*0.5+0.25*(texture(uScene,uv-dir*0.5).rgb+texture(uScene,uv+dir*0.5).rgb);
  float lb=luma(b);return lb<lo||lb>hi?a:b;
}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){
  vec3 c=antialias(vUv);
  c+=(texture(uB1,vUv).rgb*0.60+texture(uB2,vUv).rgb*0.40)*uBloom;
  c=aces(c*uExp);
  vec2 d=vUv-0.5;
  c*=1.0-uVig*smoothstep(0.18,0.9,dot(d,d)*1.35);
  c=encodeSRGB(c);
  c+=(hash(gl_FragCoord.xy+fract(uTime)*97.0)-0.5)*uGrain;
  o=vec4(clamp(c,0.0,1.0),1.0);
}\`;
`);
replace('gl.uniform1f(pComp.u.uBloom, 0.34);','gl.uniform1f(pComp.u.uBloom, look.radiance);\n  gl.uniform2f(pComp.u.uResolution,W,H);');
replace('gl.uniform1f(pComp.u.uExp, 0.95);','gl.uniform1f(pComp.u.uExp, 1.02);');
replace('gl.uniform1f(pComp.u.uGrain, 0.020);','gl.uniform1f(pComp.u.uGrain, RM ? 0 : 0.0025);');
replace('gl.uniform1f(pComp.u.uVig, 0.62);','gl.uniform1f(pComp.u.uVig, 0.25);');
replace('  tAcc += dt;', '  if(look.motion && !RM)tAcc += dt;');
replace('  cam.taz += cam.vaz; cam.tel += cam.vel;\n  cam.vaz *= 0.90; cam.vel *= 0.90;', `  const damping=Math.pow(0.90,dt*60);
  const travel=(1-damping)/0.10;
  cam.taz += cam.vaz*travel; cam.tel += cam.vel*travel;
  cam.vaz *= damping; cam.vel *= damping;`);

replace('$("btnHelp").onclick = ()=>openPanel("help");', '$("btnHelp").onclick = ()=>openPanel("help");\n$("btnLook").onclick = ()=>openPanel("look");');
replace('  if (mode==="table") paintTable(); else paintHelp();', '  if (mode==="table") paintTable(); else if(mode==="look"){ $("ptitle").textContent="Light & atmosphere";paintLook(); } else paintHelp();');
replace('function paintTable(){', `function paintLook(){
  $("pbody").innerHTML='<div id="look"><h3>Shape the atmosphere.</h3><p>Fine light, a sculpted surface, and slow thermal drift. The temperature record stays the same.</p>'+
    [["radiance","Radiance","Glow around coastlines, pins, and airborne traces."],["atmosphere","Atmosphere","The depth of haze above the thermal surface."],["flow","Flow","The presence of drifting thermal traces."]].map(([key,label,hint])=>
      '<div class="control"><label for="look-'+key+'">'+label+'<output id="value-'+key+'">'+Math.round(look[key]*100)+'%</output></label><input id="look-'+key+'" type="range" min="0" max="150" step="5" value="'+Math.round(look[key]*100)+'"><small>'+hint+'</small></div>').join('')+
    '<div class="look-actions"><button class="tb" id="motionLook" aria-pressed="'+(!look.motion)+'">'+(look.motion?'Pause ambience':'Resume ambience')+'</button><button class="tb" id="resetLook">Reset look</button></div><p><small>Trails are an artistic interpretation of convection, not measured wind. Timeline playback is controlled separately.</small></p><p><a href="temp_viz.html" target="_blank" rel="noopener">Open the preserved original ↗</a></p></div>';
  for(const key of ["radiance","atmosphere","flow"]){$("look-"+key).oninput=e=>{look[key]=Number(e.target.value)/100;$("value-"+key).textContent=e.target.value+"%";};}
  $("motionLook").onclick=()=>{look.motion=!look.motion;if(look.motion)RM=false;paintLook();};
  $("resetLook").onclick=()=>{Object.assign(look,{radiance:0.65,atmosphere:0.65,flow:0.8,motion:!motionQuery.matches});RM=motionQuery.matches;paintLook();};
}
function paintTable(){`);
replace('  if (pins.length) p.push("p=" + pins.join(","));', '  if (pins.length) p.push("p=" + pins.join(","));\n  p.push("look="+[look.radiance,look.atmosphere,look.flow].map(v=>v.toFixed(2)).join(","));\n  if(!look.motion)p.push("ambient=0");');
replace('  if ("u" in q) setUnit', `  if(q.look){const values=q.look.split(",").map(Number);if(values.length===3 && values.every(Number.isFinite)){["radiance","atmosphere","flow"].forEach((key,i)=>{look[key]=Math.max(0,Math.min(1.5,values[i]));});}}
  if(q.ambient==="0")look.motion=false;
  if ("u" in q) setUnit`);
replace('window.__dbg = {','window.__dbg = {\n  look(){return {...look,time:tAcc};},\n  settle(){introT=1;relief=targetRelief=flat?RELIEF_FLAT:RELIEF;cam.az=cam.taz;cam.el=cam.tel;cam.tx=cam.ttx;cam.tz=cam.ttz;cam.di=cam.tdi=fitDist(cam.tel)*zoomK;},\n  graphics(){return {error:gl.getError(),emission:Boolean(fboScene.emissionT),floatRT:HAS_FLOAT_RT};},');

// Releasing a cancelled input must not leave the rail dragging or the camera stuck.
replace('track.addEventListener("pointerup", e=>{ trackDrag=false; });','track.addEventListener("pointerup", e=>{ trackDrag=false; });\ntrack.addEventListener("pointercancel",()=>{trackDrag=false;});\ntrack.addEventListener("lostpointercapture",()=>{trackDrag=false;});');
replace('canvas.addEventListener("pointercancel", endPointer);','canvas.addEventListener("pointercancel", e=>endPointer(e,false));\ncanvas.addEventListener("lostpointercapture", e=>endPointer(e,false));\naddEventListener("blur",()=>{pointers.clear();drag=null;pinch=0;cursor=null;canvas.classList.remove("drag");});');
replace('    <h3>Light and air</h3>', '    <h3>Luminous edition</h3><p>Use Look to adjust radiance, atmosphere, and flow, or pause decorative motion. Thermal trails are stylized, not measured wind. The preserved original is available from the Look panel.</p>\n    <h3>Light and air</h3>');

// Calibration after the first rendered comparison: keep fine borders below the lighted surface.
replace('gl.uniform1f(pLine.u.uWidth, 0.90);','gl.uniform1f(pLine.u.uWidth, 0.80);');
replace('gl.uniform4f(pLine.u.uColor, 0.62,0.74,0.86, 0.26);','gl.uniform4f(pLine.u.uColor, 0.24,0.37,0.45, 0.20);');
replace('gl.uniform1f(pLine.u.uWidth, 1.40);','gl.uniform1f(pLine.u.uWidth, 1.20);');
replace('gl.uniform4f(pLine.u.uColor, 0.80,0.90,1.0, 0.60);','gl.uniform4f(pLine.u.uColor, 0.35,0.55,0.65, 0.48);');
replace('emission = vec4(uColor.rgb*a*1.6,a);','emission = vec4(uColor.rgb*a*(uColor.a>0.3?1.0:0.20),a);');
replace('float a = f*vA*0.30;','float a = f*vA*0.16;');
replace('#readout{width:154px}', '#readout{width:172px}');
replace('  $("motionLook").onclick=', '  document.querySelector("#look a").onclick=e=>{e.currentTarget.href="temp_viz.html#"+encodeState();};\n  $("motionLook").onclick=');

html = require('./experience.cjs')(html);

const data = text=>text.match(/<script[^>]*id="mapdata"[^>]*>([\s\S]*?)<\/script>/)[1];
if(data(html)!==data(original.toString('utf8').replace(/\r\n/g,'\n')))throw Error('Embedded data changed');
fs.writeFileSync(path.join(root,'temp_viz.enhanced.html'),html);
console.log('Enhanced edition generated; embedded dataset preserved exactly.');


