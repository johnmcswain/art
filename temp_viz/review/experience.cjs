module.exports = function addExperience(html){
  function rep(a,b){if(!html.includes(a))throw Error('Experience anchor missing: '+a.slice(0,90));html=html.replace(a,b);}
  rep('</style>',`
/* Personal places and two-month comparison. */
#placeStatus{font:10px/1.5 var(--sans);color:var(--accent);max-width:240px;margin-top:9px}
#places{padding:22px;font:13px/1.6 var(--sans);color:var(--ink-dim)}
#places h3{font-size:24px;font-weight:400;color:var(--ink);margin:0 0 8px}
#places label{display:block;color:var(--ink);margin:22px 0 8px}
#placeQuery{width:100%;border:1px solid var(--accent-dim);border-radius:4px;background:var(--void);color:var(--ink);padding:12px;font:14px var(--sans)}
#placeResults{list-style:none;padding:0;margin:12px 0}
#placeResults button{display:flex;justify-content:space-between;align-items:center;gap:15px;width:100%;text-align:left;padding:13px 10px;background:none;border:0;border-bottom:1px solid var(--line);color:var(--ink);cursor:pointer;font:13px var(--sans)}
#placeResults button:hover,#placeResults button:focus-visible{background:#4ec9e80d}
#placeResults small{color:var(--accent);font-size:10px;white-space:nowrap}
#placeCount{font-size:11px;min-height:18px;margin-top:9px}
#compareBar{display:none;grid-column:2;grid-row:3;align-self:end;justify-self:center;width:min(510px,44vw);gap:8px;align-items:end;padding:10px;background:var(--panel-solid);border:1px solid var(--line);border-radius:4px}
body.comparing #compareBar{display:flex}body.comparing #rail{display:none}
#compareBar label{min-width:0;flex:1;display:block;font:9px/1.5 var(--mono);letter-spacing:.08em;color:var(--ink-dim)}
#compareBar select{width:100%;display:block;margin-top:5px;padding:7px 5px;background:var(--void);color:var(--ink);border:1px solid var(--line);font:11px var(--sans)}
#compareBar .compare-actions{display:flex;gap:4px;padding-bottom:1px}#compareBar button{padding:0 7px}
#comparison{display:none;position:fixed;inset:0;pointer-events:none;z-index:4;overflow:hidden}
body.comparing #comparison{display:block}
#divider{position:absolute;left:50%;top:28%;height:40%;width:44px;transform:translateX(-50%);cursor:ew-resize;touch-action:none;pointer-events:auto;outline-offset:-3px}
#divider:before{content:'';position:absolute;left:21px;top:-100vh;height:300vh;width:1px;background:#d4edf3aa;box-shadow:0 0 8px #80d8e840}
#divider span{position:absolute;top:50%;left:3px;width:38px;height:38px;display:grid;place-items:center;border:1px solid var(--accent);border-radius:50%;background:#0a131ded;color:var(--ink);font:12px var(--mono);box-shadow:0 3px 18px #0008}
#compareValues{display:none;border-top:1px solid var(--line);padding:10px}
body.comparing #compareValues{display:block}body.comparing #pins{display:none}
#compareValues .label{font:9px/1.6 var(--mono);letter-spacing:.08em;color:var(--accent)}
#compareValues p{font:11px/1.6 var(--sans);color:var(--ink-dim)}
#compareValues table{font-size:10px;margin:7px 0}#compareValues td,#compareValues th{padding:5px 2px;font-size:10px;white-space:normal;text-align:right}
#compareValues td:first-child{padding-left:0;text-align:left;max-width:85px;overflow-wrap:anywhere;font-size:10px}
#compareValues th:first-child{text-align:left;padding-left:0}
#compareValues .compare-place{color:var(--ink);font:inherit;border:0;background:none;padding:0;text-align:left;cursor:pointer}
#compareValues .compare-remove{font:10px var(--sans);color:var(--ink-dim);border:0;background:none;cursor:pointer}
#tools{max-width:420px}
@media(min-width:901px) and (max-width:1350px){#plate h1{font-size:16px;letter-spacing:.32em;white-space:nowrap}#hud{gap:10px;grid-template-columns:240px minmax(0,1fr) 310px}#scale{width:240px}#rail{width:100%;gap:7px}#compareBar{width:100%;padding:8px}#compareBar .compare-actions{flex-direction:column}#compareBar button{height:24px}#tools{max-width:310px;justify-content:flex-end}}
@media(max-width:900px){#compareBar{grid-column:1;grid-row:4;width:100%;padding:8px}#compareBar label{font-size:8px}#compareValues{padding:8px}#compareValues table{font-size:9px}#compareValues td,#compareValues th{font-size:9px}#tools{max-width:100%;flex-wrap:wrap;justify-content:center}#placeStatus{max-width:145px;font-size:9px}#divider{top:35%;height:22%}#placeResults button{min-height:48px}}
</style>`);
  rep('<button class="tb" id="btnLook">Look</button>', '<button class="tb" id="btnPlaces">My places</button><button class="tb" id="btnCompare" aria-pressed="false">Compare</button><button class="tb" id="btnLook">Look</button>');
  rep('  <div id="tools">', `  <section id="compareBar" aria-label="Season comparison controls">
    <label for="monthA">A · LEFT<select id="monthA" aria-label="Left comparison month"></select></label>
    <label for="monthB">B · RIGHT<select id="monthB" aria-label="Right comparison month"></select></label>
    <div class="compare-actions"><button class="tb" id="centerCompare" title="Center divider">50 / 50</button><button class="tb" id="closeCompare">Done</button></div>
  </section>
  <div id="tools">`);
  rep('<aside id="panel"', '<div id="comparison"><div id="divider" tabindex="0" role="slider" aria-label="Season comparison divider: left month A, right month B" aria-orientation="horizontal" aria-valuemin="5" aria-valuemax="95" aria-valuenow="50"><span aria-hidden="true">A ↔ B</span></div></div>\n<aside id="panel"');
  rep('<div id="readout">','<div id="readout">');
  rep('  </div>\n\n  <div id="scale">', '    <section id="compareValues" aria-label="Pinned place temperature comparisons"></section>\n  </div>\n\n  <div id="scale">');
  rep('<span class="edition">Luminous edition / 01</span>','<span class="edition">Luminous edition / 02</span><div id="placeStatus" role="status"></div>');
  rep('const look = {radiance:0.65, atmosphere:0.65, flow:0.8, motion:!RM};','const look = {radiance:0.65, atmosphere:0.65, flow:0.8, motion:!RM};\nconst cmp={active:false,a:"",b:"",split:0.5,left:null,right:null,stamp:"",hoverKey:""};');
  rep('  const t = e.target;\n  if (t &&', '  const t = e.target;\n  if(t && t.closest && t.closest("#panel")){if(e.key==="Escape"){closePanel();e.preventDefault();}return;}\n  if(cmp.active && [" ",",","."].includes(e.key)){e.preventDefault();return;}\n  if (t &&');
  rep('function togglePlay(){','function togglePlay(){\n  if(cmp.active)return;');
  rep('$("btnLook").onclick = ()=>openPanel("look");','$("btnLook").onclick = ()=>openPanel("look");\n$("btnPlaces").onclick=()=>openPanel("places");\n$("btnCompare").onclick=()=>setComparison(!cmp.active);');
  rep('else if(mode==="look"){ $("ptitle").textContent="Light & atmosphere";paintLook(); } else paintHelp();','else if(mode==="look"){ $("ptitle").textContent="Light & atmosphere";paintLook(); } else if(mode==="places"){$("ptitle").textContent="My places";paintPlaces();} else paintHelp();');
  rep('  $("panel").setAttribute("aria-hidden","true");\n}', '  $("panel").setAttribute("aria-hidden","true");\n  if($("panel").contains(document.activeElement))$("gl").focus({preventScroll:true});\n}');
  rep('  return best;\n}', '  return best;\n}');
  rep('function nearestStation(px, py, maxPx){','function nearestStation(px, py, maxPx){\n  if(cmp.active && cmp.left && cmp.right)field.set(px<innerWidth*cmp.split?cmp.left.values:cmp.right.values);');
  rep('  if (playing){\n    month +=', '  if (playing && !cmp.active){\n    month +=');
  rep('  camUpdate(dt);\n  sunFor(month);', `  if(cmp.active)prepareComparison();
  camUpdate(dt);
  sunFor(month);
  if(cmp.active){
    const side=cursor && cursor[0]>=innerWidth*cmp.split?cmp.right:cmp.left;
    field.set(side.values);month=AXIS.indexOf(side.key);
    if(cmp.hoverKey!==side.key){hoverStation=-1;cmp.hoverKey=side.key;}
    $("rdmon").textContent=(side===cmp.left?"A · ":"B · ")+monthText(side.key);
  }`);
  // Pull the existing complete rendering pass out of the state update. Each month uses
  // the identical camera and viewport; only the final composite is clipped.
  const begin=html.indexOf('  /* ---- scene ---- */');
  const end=html.indexOf('  syncHash(now);',begin);
  if(begin<0||end<begin)throw Error('Render extraction failed');
  let render=html.slice(begin,end);
  render=render.replace('  /* ---- scene ---- */','  gl.disable(gl.SCISSOR_TEST);\n  /* ---- scene ---- */');
  render=render.replace('  bindFBO(null);\n  gl.useProgram(pComp);','  bindFBO(null);\n  if(clip){gl.enable(gl.SCISSOR_TEST);gl.scissor(clip.x,0,clip.width,H);}\n  gl.useProgram(pComp);');
  render+='  gl.disable(gl.SCISSOR_TEST);\n';
  html=html.slice(0,begin)+`  if(cmp.active){
    const mainTexture=texField, cut=Math.round(W*cmp.split);
    texField=cmp.left.texture;field.set(cmp.left.values);sunFor(AXIS.indexOf(cmp.a));renderScene({x:0,width:cut});
    texField=cmp.right.texture;field.set(cmp.right.values);sunFor(AXIS.indexOf(cmp.b));renderScene({x:cut,width:W-cut});
    texField=mainTexture;field.set(cmp.left.values);month=AXIS.indexOf(cmp.a);sunFor(month);
    paintComparisonValues();
  }else renderScene();
`+html.slice(end);
  rep('window.__dbg = {', 'function renderScene(clip){\n'+render+'}\n\n'+experienceCode+'\nwindow.__dbg = {\n  comparison(){return {active:cmp.active,a:cmp.a,b:cmp.b,split:cmp.split,rows:comparisonRows()};},\n  focusPlace(name){const s=ST.find(s=>s.name===name);if(s)choosePlace(s.i);},');
  rep('  if (pins.length) p.push("p=" + pins.join(","));', '  if (pins.length) p.push("p=" + pins.join(","));\n  if(cmp.active)p.push("ca="+cmp.a,"cb="+cmp.b,"split="+cmp.split.toFixed(3));');
  rep('  touched = true;      // a shared link opens where it was aimed, not on the intro run','  if(AXIS.includes(q.ca)&&AXIS.includes(q.cb)){cmp.a=q.ca;cmp.b=q.cb;const split=Number(q.split);cmp.split=Number.isFinite(split)?Math.max(0.05,Math.min(0.95,split)):0.5;setComparison(true);}\n  touched = true;      // a shared link opens where it was aimed, not on the intro run');
  rep('  buildRail(); syncMonth();\n  dirtyField = true;', '  buildRail(); syncMonth();\n  if(cmp.active){fillComparisonMonths();cmp.stamp="";}\n  dirtyField = true;');
  rep('    <h3>Luminous edition</h3>', '    <h3>Personal discoveries</h3><p>My places searches the existing sampling locations by city or state. Selecting a result pins it and brings it into view. Compare reveals two chosen months through one synchronized camera. Drag the A/B divider or focus it and use arrow keys, Home, or End. Pinned comparisons report B minus A in the current units; an asterisk marks partial months. Done returns to month A.</p>\n    <h3>Luminous edition</h3>');
  return html;
};

const experienceCode=String.raw`
function monthText(key){const i=AXIS.indexOf(key);return i<0?key:MON3[+key.slice(5,7)-1]+" "+key.slice(0,4)+(isPartial(i)?" *":"");}
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const searchable=s=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
function paintPlaces(){
  $("pbody").innerHTML='<div id="places"><h3>Start somewhere meaningful.</h3><p>Find a hometown, a place you lived, or somewhere you want to go.</p><label for="placeQuery">City or state</label><input id="placeQuery" type="search" placeholder="Try Seattle, Miami, or California" autocomplete="off" aria-controls="placeResults" aria-describedby="placeCount"><div id="placeCount" role="status"></div><ul id="placeResults"></ul><p>Search covers the '+NS+' sampling locations in this atlas. Each result is the actual data location; there is no automatic geolocation or nearest-city substitution.</p></div>';
  $("placeQuery").oninput=paintPlaceResults;
  $("placeQuery").onkeydown=e=>{if(e.key==="ArrowDown"){e.preventDefault();$("placeResults").querySelector("button")?.focus();}else if(e.key==="Enter"){e.preventDefault();$("placeResults").querySelector("button")?.click();}};
  paintPlaceResults();requestAnimationFrame(()=>$("placeQuery")?.focus());
}
function paintPlaceResults(){
  const tokens=searchable($("placeQuery").value).split(" ").filter(Boolean);
  const matches=ST.filter(s=>{const state=STATES[stateAt(s.x,s.z)]||"";const hay=searchable(s.name+" "+s.st+" "+state);return tokens.every(t=>hay.includes(t));});
  const visible=matches.slice(0,tokens.length?40:12);
  $("placeCount").textContent=matches.length?(tokens.length?matches.length+" matching locations":"Explore "+NS+" locations")+(matches.length>visible.length?" · showing "+visible.length:""):"No matching sampling location. Try another city or a state name.";
  $("placeResults").innerHTML=visible.map(s=>'<li><button type="button" data-place="'+s.i+'"><span>'+escapeHTML(s.name)+', '+escapeHTML(s.st)+'</span><small>'+(pins.includes(s.i)?"Pinned · revisit":"Pin & explore")+'</small></button></li>').join("");
  const buttons=[...$("placeResults").querySelectorAll("button")];
  buttons.forEach((b,i)=>{b.onclick=()=>choosePlace(+b.dataset.place);b.onkeydown=e=>{let target;if(e.key==="ArrowDown")target=buttons[Math.min(i+1,buttons.length-1)];if(e.key==="ArrowUp")target=i?buttons[i-1]:$("placeQuery");if(e.key==="Home")target=buttons[0];if(e.key==="End")target=buttons.at(-1);if(target){e.preventDefault();target.focus();}};});
}
function choosePlace(i){
  const s=ST[i];if(!s)return;
  if(!pins.includes(i))togglePin(i);
  touched=true;playing=false;syncPlay();
  cam.vaz=cam.vel=0;cam.taz=AZ0;cam.tel=flat?1.5:1.05;cam.ttx=s.x;cam.ttz=s.z;zoomK=0.62;
  if(RM){cam.az=cam.taz;cam.el=cam.tel;cam.tx=cam.ttx;cam.tz=cam.ttz;cam.di=cam.tdi=fitDist(cam.tel)*zoomK;}
  closePanel();$("gl").focus({preventScroll:true});
  $("placeStatus").textContent=s.name+", "+s.st+" pinned. "+(pins.length>1?"Compare the seasons across your places.":"Add another place, or reveal the seasons with Compare.");
  cmp.stamp="";
}
function fillComparisonMonths(){
  const options=AXIS.map(key=>'<option value="'+key+'">'+monthText(key)+'</option>').join("");
  $("monthA").innerHTML=options;$("monthB").innerHTML=options;
  $("monthA").value=cmp.a;$("monthB").value=cmp.b;
}
function setComparison(active){
  cmp.active=active;playing=false;touched=true;syncPlay();
  if(active){
    const year=AXIS[Math.round(month)]?.slice(0,4)||AXIS[0].slice(0,4);
    if(!AXIS.includes(cmp.a))cmp.a=AXIS.includes(year+"-01")?year+"-01":AXIS[0];
    if(!AXIS.includes(cmp.b))cmp.b=AXIS.includes(year+"-07")?year+"-07":AXIS.at(-1);
    month=AXIS.indexOf(cmp.a);fillComparisonMonths();
  }
  document.body.classList.toggle("comparing",active);$("btnCompare").setAttribute("aria-pressed",String(active));
  $("comparison").setAttribute("aria-hidden",String(!active));$("divider").tabIndex=active?0:-1;
  dirtyField=true;cmp.stamp="";cmp.hoverKey="";hoverStation=-1;cursor=null;syncMonth();updateDivider(cmp.split);paintComparisonValues();
  if(!active){for(const key of ["left","right"]){if(cmp[key])gl.deleteTexture(cmp[key].texture);cmp[key]=null;}$("btnCompare").focus({preventScroll:true});}
}
function updateDivider(split){
  cmp.split=Math.max(0.05,Math.min(0.95,split));const percent=Math.round(cmp.split*100);
  $("divider").style.left=(cmp.split*100)+"%";$("divider").setAttribute("aria-valuenow",String(percent));
  $("divider").setAttribute("aria-valuetext",percent+"% month A, "+(100-percent)+"% month B");
}
function comparisonField(key,old){
  if(old && old.key===key && old.source===MV)return old;
  if(old)gl.deleteTexture(old.texture);
  computeField(AXIS.indexOf(key));const values=field.slice();
  const texture=tex2d(GW,GH,gl.R16F,gl.RED,gl.FLOAT,values,gl.LINEAR);
  return {key,source:MV,values,texture};
}
function prepareComparison(){
  cmp.left=comparisonField(cmp.a,cmp.left);cmp.right=comparisonField(cmp.b,cmp.right);
}
function comparisonRows(){
  if(!AXIS.includes(cmp.a)||!AXIS.includes(cmp.b))return [];
  const a=AXIS.indexOf(cmp.a),b=AXIS.indexOf(cmp.b);
  return pins.map(i=>({i,name:ST[i].name,a:fmt(MV[i*NM+a]),b:fmt(MV[i*NM+b]),delta:fmt(MV[i*NM+b])-fmt(MV[i*NM+a])}));
}
function paintComparisonValues(){
  if(!cmp.active)return;
  const stamp=[cmp.a,cmp.b,pins.join(),unitC,NM,DAYS.join()].join("|");if(stamp===cmp.stamp && cmp.valueSource===MV)return;cmp.stamp=stamp;cmp.valueSource=MV;
  const rows=comparisonRows(),unit=unitC?"°C":"°F";
  $("compareValues").innerHTML='<div class="label">SEASON CHANGE · B − A · '+unit+'</div><p>A: '+monthText(cmp.a)+'<br>B: '+monthText(cmp.b)+'</p>'+(rows.length?'<table><thead><tr><th scope="col">Place</th><th scope="col">A</th><th scope="col">B</th><th scope="col">Δ</th></tr></thead><tbody>'+rows.map(r=>'<tr><td><button class="compare-place" data-go="'+r.i+'">'+escapeHTML(r.name)+'</button> <button class="compare-remove" data-remove="'+r.i+'" aria-label="Unpin '+escapeHTML(r.name)+'">×</button></td><td>'+r.a.toFixed(1)+'</td><td>'+r.b.toFixed(1)+'</td><td>'+(r.delta>=0?"+":"−")+Math.abs(r.delta).toFixed(1)+'</td></tr>').join("")+'</tbody></table>':'<p>Pin a meaningful place to see its exact change.</p>')+'<button class="tb" id="compareAddPlace">'+(rows.length?"Add a place":"Choose places")+'</button><p>Same scale and camera. '+((isPartial(AXIS.indexOf(cmp.a))||isPartial(AXIS.indexOf(cmp.b)))?"* Partial month; averages cover available days.":"Monthly sample values.")+'</p>';
  $("compareAddPlace").onclick=()=>openPanel("places");
  $("compareValues").querySelectorAll('[data-go]').forEach(b=>{b.onclick=()=>choosePlace(+b.dataset.go);});
  $("compareValues").querySelectorAll('[data-remove]').forEach(b=>{b.onclick=()=>{togglePin(+b.dataset.remove);cmp.stamp="";};});
}
$("monthA").onchange=e=>{cmp.a=e.target.value;month=AXIS.indexOf(cmp.a);dirtyField=true;cmp.stamp="";syncMonth();};
$("monthB").onchange=e=>{cmp.b=e.target.value;cmp.stamp="";};
$("centerCompare").onclick=()=>updateDivider(0.5);
$("closeCompare").onclick=()=>setComparison(false);
const divider=$("divider");let dividing=null;
divider.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();e.stopPropagation();dividing=e.pointerId;divider.setPointerCapture(e.pointerId);divider.focus({preventScroll:true});updateDivider(e.clientX/innerWidth);};
divider.onpointermove=e=>{if(dividing===e.pointerId){e.preventDefault();updateDivider(e.clientX/innerWidth);}};
for(const event of ["pointerup","pointercancel","lostpointercapture"])divider.addEventListener(event,e=>{if(dividing===e.pointerId)dividing=null;});
divider.onkeydown=e=>{let next=cmp.split;if(e.key==="ArrowLeft"||e.key==="ArrowDown")next-=e.shiftKey?0.1:0.02;else if(e.key==="ArrowRight"||e.key==="ArrowUp")next+=e.shiftKey?0.1:0.02;else if(e.key==="Home")next=0.05;else if(e.key==="End")next=0.95;else return;e.preventDefault();e.stopPropagation();updateDivider(next);};
`;
