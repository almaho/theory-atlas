(()=>{
'use strict';
const ID='edge-mpc',data=JSON.parse(document.getElementById('atlas-data').textContent).focus[ID];if(!data)return;
const instances=new Set();let serial=0;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const math=s=>esc(s).replace(/\^\{([^{}]*)\}/g,'<tspan baseline-shift="super" font-size=".72em">$1</tspan>').replace(/\^φ/g,'<tspan baseline-shift="super" font-size=".72em">φ</tspan>').replace(/_Δ/g,'<tspan baseline-shift="sub" font-size=".72em">Δ</tspan>');
const tx=(x,y,t,cls='',anchor='start',extra='')=>'<text x="'+x+'" y="'+y+'" class="empc-'+cls+'" text-anchor="'+anchor+'" '+extra+'>'+math(t)+'</text>';
const line=(x1,y1,x2,y2,cls='grid',extra='')=>'<path d="M'+x1+' '+y1+'L'+x2+' '+y2+'" class="empc-'+cls+'" '+extra+'/>';
const records=(o={})=>data.verifiedRecords.map(r=>({...data.sources[r.sourceId],...r})).filter(r=>(o.publication!=='published'||r.publicationStatus!=='preprint')&&(!o.memory||o.memory==='all'||r.panel===o.memory));
const setupColor=r=>r.setup==='linear-randomized'?'var(--empc-linear)':r.setup==='low-unstable'?'var(--empc-unstable)':'var(--empc-stable)';
function geometry(w,h,o={},focus=false){
 const levels=['overview','compact','detail'],available=w<300||h<210?0:w<650||h<480?1:2,request=levels.indexOf(o.level),level=focus?'detail':levels[Math.min(available,request<0?available:request)];
 const rows=records(o),points=[];
 if(level==='overview'){
  for(const r of rows)points.push({id:r.id,x:w*(r.panel==='linear'?.40:r.kind==='lower'?.78:.44),y:h*(r.panel==='linear'?.25:r.kind==='lower'?.80:.59)});
 }else if(level==='compact'){
  for(const r of rows)points.push({id:r.id,x:w*(r.panel==='linear'?.70:r.kind==='lower'?.82:.64),y:h*(r.panel==='linear'?.225:r.kind==='lower'?.77:.565)});
 }else{
  for(const r of rows)points.push({id:r.id,x:w*(r.panel==='linear'?.58:r.kind==='lower'?.85:.59),y:h*(r.panel==='linear'?.265:r.kind==='lower'?.747:.595)});
 }
 return{w,h,level,points,plotLeft:w*(level==='detail'?.35:.46),plotRight:w-(level==='detail'?27:12)};
}
function marker(r,p,o,focus,size){
 const selected=o.selected===r.id,lower=r.kind==='lower',x=p.x,y=p.y;
 let body='<circle cx="'+x+'" cy="'+y+'" r="'+(size+5)+'" fill="'+setupColor(r)+'" opacity="'+(selected?.30:.16)+'"/>';
 body+=lower?'<path d="M'+x+' '+(y-size-1)+'L'+(x+size+1)+' '+(y+size)+'L'+(x-size-1)+' '+(y+size)+'Z" class="empc-lower-marker"/><circle cx="'+x+'" cy="'+y+'" r="'+(size+7)+'" class="empc-condition-ring"/>':'<circle cx="'+x+'" cy="'+y+'" r="'+size+'" class="empc-upper-marker"/>';
 return'<g class="empc-point" data-empc-result="'+esc(r.id)+'" data-kind="'+r.kind+'" data-panel="'+r.panel+'" data-setup="'+r.setup+'" data-conditional="'+!!r.conditional+'" data-point-x="'+x+'" data-point-y="'+y+'"'+(focus?' role="button" tabindex="0" aria-pressed="'+selected+'"':'')+' aria-label="'+esc(r.palette+' colors; '+r.displayBound+'; '+r.stability)+'"><title>'+esc(r.shortLabel+' · '+r.palette+' · '+r.displayBound+(lower?' · connectivity conjecture; deterministic component-stable only':''))+'</title>'+body+'</g>';
}
function chart(w,h,o={},focus=false){
 const g=geometry(w,h,o,focus),rows=records(o),tiny=g.level==='overview',compact=g.level==='compact',pBy=Object.fromEntries(g.points.map(p=>[p.id,p]));
 let s='<svg class="empc-'+(focus?'map':'summary')+'" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="xMidYMid meet" data-detail-level="'+g.level+'" role="img" aria-label="MPC edge coloring: separate local-memory models, symbolic palette and round bounds. The red lower bound is conditional and component-stable only."><title>MPC edge coloring · memory and stability</title><desc>Green denotes algorithm upper bounds. Dashed red denotes a connectivity-conjecture lower bound only for deterministic component-stable low-space MPC. All positions are categorical; no curve connects these settings.</desc>';
 if(!rows.length)return s+(tiny?'':tx(w/2,h/2,'No sources match this filter.','muted','middle'))+'</svg>';
 const linear=rows.find(r=>r.panel==='linear'),low=rows.filter(r=>r.panel==='lowspace');
 if(tiny){
  if(linear)s+=line(w*.12,h*.25,w*.89,h*.25,'mini-linear');
  if(low.length){s+=line(w*.12,h*.48,w*.89,h*.48,'divider');s+=line(w*.12,h*.59,w*.89,h*.59)+line(w*.12,h*.8,w*.89,h*.8);}
  for(const r of rows)s+=marker(r,pBy[r.id],o,false,Math.max(1.5,Math.min(w,h)*.022));
  return s+'</svg>';
 }
 if(compact){
  if(linear){
   s+=tx(9,17,'Linear local memory','panel-title')+tx(9,32,'O(n) local · O(m) total','muted');
   const p=pBy[linear.id];
   s+=line(g.plotLeft,p.y,g.plotRight,p.y)+line(g.plotLeft,h*.32,g.plotRight,h*.32,'axis')+marker(linear,p,o,false,4);
   s+=tx(9,p.y+2,'Δ + Õ(Δ³ᐟ⁴)','palette')+tx(p.x,p.y-12,'O(1)','upper-label','middle')+tx(9,h*.34,'Randomized · w.h.p.','muted');
  }
  if(low.length){
   s+=line(9,h*.39,w-9,h*.39,'divider')+tx(9,h*.455,'Low space · n^φ local','panel-title');
   for(const r of low){
    const p=pBy[r.id],lower=r.kind==='lower';
    s+=line(g.plotLeft,p.y,g.plotRight,p.y)+marker(r,p,o,false,4);
    s+=tx(9,p.y-6,lower?'Stable · conditional':'Unstable · deterministic',lower?'stable-small':'unstable-small')+tx(9,p.y+10,lower?'2Δ − 2':'Δ + √Δ · log³Δ','palette');
    if(lower)s+=tx(w-10,p.y-14,'Ω(log(log_Δ n))','lower-label','end');
    else{s+=tx(w-10,p.y-22,'O(poly(Δ) +','upper-label','end')+tx(w-10,p.y-10,'logΔ · logloglog n)','upper-label','end');}
   }
   s+=line(g.plotLeft,h*.86,g.plotRight,h*.86,'axis')+tx(w-10,h*.92,'Rounds · symbolic categories','muted','end','data-axis="x"');
   s+=tx(9,h*.985,'Local work n^{poly(Δ)} · lower assumes connectivity','foot');
  }
  return s+'</svg>';
 }
 const m=24;
 s+=tx(m,29,'Memory changes the comparison','heading')+tx(m,50,'Exact palettes · green algorithms · dashed red conditional lower','muted');
 if(linear){
  const p=pBy[linear.id],base=h*.333;
  s+=line(m,h*.119,w-m,h*.119,'linear-rule')+tx(m,h*.158,'Linear memory per machine','panel-title')+tx(m,h*.193,'O(n) local · O(m) total words','muted');
  s+=tx(m,p.y-8,'Δ + Õ(Δ³ᐟ⁴)','palette')+tx(m,p.y+14,'Randomized · high probability','linear-small');
  s+=line(g.plotLeft,p.y,g.plotRight,p.y)+line(p.x,h*.21,p.x,base,'grid')+line(g.plotLeft,base,g.plotRight,base,'axis')+marker(linear,p,o,focus,6);
  s+=tx(p.x,p.y-19,'O(1) rounds','upper-label','middle')+tx(p.x,base+22,'Constant rounds','tick','middle','data-axis="x"');
  s+=tx(m,h*.411,'Hidden logs depend on n; bounded Δ need not give Δ+o(Δ) colors.','muted');
 }
 if(low.length){
  s+=line(m,h*.446,w-m,h*.446,'divider')+tx(m,h*.487,'Low space: n^φ per machine, 0<φ<1','panel-title')+tx(m,h*.523,'Upper assumes Δ=(log log n)^{o(1)} · local work n^{poly(Δ)}','muted');
  const base=h*.833;
  for(const r of low){
   const p=pBy[r.id],lower=r.kind==='lower';
   s+=line(g.plotLeft,p.y,g.plotRight,p.y)+line(p.x,h*.557,p.x,base,'grid')+marker(r,p,o,focus,6);
   s+=tx(m,p.y-7,lower?'2Δ − 2':'Δ + √Δ · log³Δ','palette')+tx(m,p.y+16,lower?'Stable · deterministic':'Unstable · deterministic',lower?'stable-small':'unstable-small');
   s+=tx(p.x,p.y-21,lower?'Conditional lower':'Algorithm',lower?'lower-label':'upper-label','middle');
   if(lower)s+=tx(p.x,base+24,'Ω(log(log_Δ n))','lower-label','middle');
   else{s+=tx(p.x,base+20,'O(poly(Δ) +','upper-label','middle')+tx(p.x,base+36,'logΔ · logloglog n)','upper-label','middle');}
  }
  s+=line(g.plotLeft,base,g.plotRight,base,'axis')+tx(m,base+26,'MPC rounds →','axis-title','start','data-axis="x"');
  s+=tx(m,h*.946,'Lower: connectivity conjecture; even forests; polynomial total space allowed.','muted');
 }
 s+=tx(m,h-9,'Symbolic categories, not a numerical scale. No common frontier is implied.','foot','start','data-axis="y"');
 return s+'</svg>';
}
function diagramSVG(a={},b={}){return chart(1000,660,typeof a==='string'?b:a,true);}
function summarySVG(key,w,h,options={}){return chart(w,h,options,false);}
function release(root){for(const i of instances)if(!i.root.isConnected||i.root===root)i.destroy();}
function mount(root,key=ID,options={}){
 release(root);
 for(const name of ['StreamingMatching','DynamicMatching','LCAMatching','LocalMatching','MPCMatching','ListQueryMatching'])window[name]?.release(root);
 for(const [id,r]of Object.entries(window.AtlasPairRenderers||{}))if(id!==ID)r.release?.(root);
 const controller=new AbortController(),uid='empc-'+(++serial);let publication=options.publication||'all',selected=key==='edge-mpc-lowspace'?'edge-mpc-cdp24-upper':'mpc-near-delta-constant-round-2019';
 const opts=()=>({publication,selected});
 root.classList.add('focus-view','empc-view');root.classList.toggle('f-embedded',!!options.embedded);root.setAttribute('aria-label','MPC edge coloring results and theorem scope');
 root.innerHTML='<p class="f-kicker">EDGE COLORING × MPC</p><header class="f-hero"><div><h1>Memory, colors, and communication rounds</h1><p>Read the algorithm and lower bounds together, with the memory allowance and component-stability restriction visible.</p></div></header><div class="empc-toolbar"><div class="empc-legend" id="'+uid+'"><span><i class="empc-key-upper"></i>Algorithm</span><span><i class="empc-key-lower"></i>Conditional lower</span><span><i class="empc-key-linear"></i>Linear memory</span><span><i class="empc-key-unstable"></i>Low space · unstable</span><span><i class="empc-key-stable"></i>Low space · stable</span></div><label>Sources <select class="empc-publication" aria-label="MPC source publication filter"><option value="all">All reviewed sources</option><option value="published">Published only</option></select></label></div><div class="empc-scroll" tabindex="0" aria-label="MPC edge-coloring figure; horizontal scrolling available on narrow screens"><div class="empc-plot"></div></div><div class="empc-notes"><p><b>Read the axes.</b> Palette rows and round formulas are symbolic categories. The horizontal spacing does not assign a numerical exponent to poly(Δ), and the two memory panels do not form one frontier.</p><p><b>The restriction matters.</b> The red theorem assumes the connectivity conjecture and deterministic component stability. The green low-space algorithm permits component-dependent output and uses n^{poly(Δ)} local computation.</p></div><section class="empc-theorem" aria-live="polite" aria-label="Selected MPC theorem"></section><div class="empc-records" aria-label="Inspect all MPC edge-coloring results"></div><details class="empc-specialization"><summary>What changes at sufficiently large fixed degree?</summary><p>For sufficiently large fixed Δ, Δ+√Δ·log³Δ≤2Δ−2. The component-unstable algorithm then takes O(log log log n) rounds with polynomial local computation, while the conditional component-stable lower is Ω(log log n). This does not assert the palette inequality for every small degree.</p></details><p class="empc-coverage">'+esc(data.coverageNote)+'</p>';
 function inspect(){
  const r=records(opts()).find(r=>r.id===selected),el=root.querySelector('.empc-theorem');
  if(!r){el.innerHTML='<p>No sources match this filter.</p>';return;}
  el.innerHTML='<div class="empc-detail-head"><strong class="'+(r.kind==='lower'?'empc-red':'empc-green')+'">'+(r.kind==='lower'?'Conditional lower bound':'Algorithm upper bound')+'</strong><span>'+esc(r.shortLabel)+'</span></div><div class="empc-detail-values"><div><small>Palette allowance</small><strong>'+esc(r.palette)+'</strong></div><div><small>MPC communication rounds</small><strong>'+esc(r.displayBound)+'</strong></div></div><p><b>Memory.</b> '+esc(r.localSpace)+'; '+esc(r.totalSpace)+'.</p><p><b>Local computation.</b> '+esc(r.localComputation)+'.</p><p><b>Algorithm restriction.</b> '+esc(r.stability)+'.</p><p><b>Probability.</b> '+esc(r.probability)+'.</p>'+(r.hypothesis?'<p class="empc-hypothesis"><b>Required hypothesis.</b> '+esc(r.hypothesis)+'.</p>':'')+'<p>'+esc(r.notes)+'</p><details><summary>Theorem, assumptions and primary source</summary><h3>'+esc(r.title)+'</h3><p>'+esc((r.authors||[]).join(', '))+' · '+esc(r.venue)+'</p><p><b>'+esc(r.theorem)+'</b></p><p><b>Graph and output.</b> '+esc(r.graph)+'; '+esc(r.output)+'.</p><p>'+esc(r.assumptions.join('; '))+'.</p><p><a href="'+esc(r.sourceUrl||r.fullTextUrl||r.url)+'" target="_blank" rel="noopener noreferrer">Read primary theorem ↗</a> · <a href="'+esc(r.url)+'" target="_blank" rel="noopener noreferrer">Publication ↗</a></p></details>';
 }
 function card(r){return'<button type="button" class="empc-record '+(r.kind==='lower'?'empc-record-lower':'')+'" data-empc-result="'+esc(r.id)+'" aria-pressed="'+(r.id===selected)+'"><span>'+esc(r.shortLabel)+'</span><strong>'+esc(r.palette+' colors · '+r.displayBound)+'</strong><small>'+esc(r.kind==='lower'?'Conditional · deterministic component-stable only':r.panel==='linear'?'O(n) local · randomized':'n^φ local · component-unstable · n^{poly(Δ)} local work')+'</small></button>';}
 function render(){const rr=records(opts());if(!rr.some(r=>r.id===selected))selected=rr[0]?.id;root.querySelector('.empc-publication').value=publication;root.querySelector('.empc-plot').innerHTML=diagramSVG(opts());root.querySelector('.empc-records').innerHTML=rr.map(card).join('');inspect();}
 function select(e){const b=e.target.closest('[data-empc-result]');if(b&&records(opts()).some(r=>r.id===b.dataset.empcResult)){selected=b.dataset.empcResult;render();}}
 root.addEventListener('click',select,{signal:controller.signal});
 root.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const b=e.target.closest('.empc-point');if(b){e.preventDefault();select(e);}}},{signal:controller.signal});
 root.addEventListener('change',e=>{if(e.target.classList.contains('empc-publication')){publication=e.target.value;render();options.onPublicationChange?.(publication);}},{signal:controller.signal});
 render();const instance={root,settingKey:ID,redraw:render,destroy(){controller.abort();root.classList.remove('empc-view');instances.delete(instance);}};instances.add(instance);return instance;
}
window.AtlasPairRenderers=window.AtlasPairRenderers||{};window.AtlasPairRenderers[ID]={mount,diagramSVG,summarySVG,records,release,layoutGeometry:geometry};
})();