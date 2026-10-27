(()=>{
'use strict';
const ID='matching-stochastic',data=JSON.parse(document.getElementById('atlas-data').textContent).focus[ID];if(!data)return;
const instances=new Set();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const math=s=>esc(s).replace(/\^\{([^{}]*)\}/g,'<tspan baseline-shift="super" font-size=".7em">$1</tspan>');
const text=(x,y,s,c='',a='start')=>'<text x="'+x+'" y="'+y+'" class="mst-'+c+'" text-anchor="'+a+'">'+math(s)+'</text>';
const line=(x,y,X,Y,c='axis')=>'<path d="M'+x+' '+y+'L'+X+' '+Y+'" class="mst-'+c+'"/>';
const records=(o={})=>data.verifiedRecords.map(r=>({...data.sources[r.sourceId],...r})).filter(r=>o.publication!=='published'||r.publicationStatus!=='preprint');
function geometry(w,h,o={},focus=false){
 const levels=['overview','compact','detail'],cap=w<300||h<230?0:w<650||h<480?1:2,requested=levels.indexOf(o.level),level=focus?'detail':levels[Math.min(cap,requested<0?cap:requested)];
 const size=level==='detail'?[1000,680]:level==='compact'?[420,300]:[260,150],W=size[0],H=size[1];
 const positions=level==='detail'?[[390,164],[780,238],[680,448],[680,506]]:level==='compact'?[[125,83],[310,119],[250,231],[250,266]]:[[70,38],[200,65],[175,105],[175,128]];
 const order=['stochastic-abgr25-degree-necessity','stochastic-abgr25-near-optimal','stochastic-abgr25-out','stochastic-abgr25-in'];
 return{w:W,h:H,level,points:order.map((id,i)=>({id,x:positions[i][0],y:positions[i][1]}))};
}
function marker(r,p,o,interactive,size){
 const selected=o.selected===r.id;
 const dot=r.kind==='lower'?'<path class="mst-dot mst-lower" data-marker="lower" d="M'+p.x+' '+(p.y-size)+'l'+size+' '+size+'l-'+size+' '+size+'l-'+size+' -'+size+'Z"/>':'<circle cx="'+p.x+'" cy="'+p.y+'" r="'+size+'" class="mst-dot mst-upper"/>';
 return '<g class="mst-point" data-mst-result="'+esc(r.id)+'" data-kind="'+r.kind+'" data-panel="'+r.panel+'"'+(interactive?' role="button" tabindex="0" aria-pressed="'+selected+'"':'')+' aria-label="'+esc(r.quality+'; '+r.bound)+'"><title>'+esc(r.quality+' · '+r.bound)+'</title><circle cx="'+p.x+'" cy="'+p.y+'" r="'+(size+5)+'" class="mst-halo mst-'+r.kind+'" opacity="'+(selected?.28:.10)+'"/>'+dot+'</g>';
}
function chart(w,h,o={},interactive=false){
 const g=geometry(w,h,o,interactive),rr=records(o),tiny=g.level==='overview',compact=g.level==='compact';
 let s='<svg class="mst-'+(interactive?'map':'summary')+'" viewBox="0 0 '+g.w+' '+g.h+'" preserveAspectRatio="xMidYMid meet" data-detail-level="'+g.level+'" role="img" aria-label="Stochastic matching: nonadaptive edge tests and a separate specialized in/out oracle"><title>Matching · stochastic edge realizations</title><desc>Green algorithms and red necessary budget. Symbolic positions do not assign numerical exponents or establish tightness. Average-degree lower bound differs from maximum-degree upper bound.</desc>';
 if(!rr.length)return s+(tiny?'':text(g.w/2,g.h/2,'No sources match this filter.','muted','middle'))+'</svg>';
 if(tiny){s+=line(30,78,230,78)+line(30,93,230,93,'divider');}
 else if(compact){
  s+=text(15,22,'Known graph · independent edge survival','heading');
  s+=text(15,43,'Fixed ε · incident-edge test budget','muted');
  s+=text(15,70,'Constant ratio','label')+text(310,104,'1−ε retained','label','middle');
  s+=text(125,102,'Ω(1/p)','formula','middle')+text(310,141,'(1/p)^{Oε(1)}','formula','middle');
  s+=line(55,154,380,154);
  s+=text(125,170,'average necessary','lower-label','middle')+text(310,170,'maximum sufficient','upper-label','middle');
  s+=text(210,189,'Symbolic budget; no tight exponent','foot','middle');
  s+=line(15,201,405,201,'divider');
  s+=text(15,219,'Specialized oracle · adaptive allowed','heading');
  s+=text(15,240,'Out · deterministic','label')+text(15,275,'In · expectation','label');
  s+=text(402,240,'Δ^{poly(1/ε)}','formula','end')+text(402,275,'Δ^{poly(1/ε)}','formula','end');
  s+=text(15,295,'Base graph + realizations + reference probabilities','foot');
 }else{
  s+=text(24,31,'Keep nearly all the expected matching','heading');
  s+=text(24,56,'Known unweighted G · independent edge survival pₑ ≥ p · fixed ε ∈ (0,1)','muted');
  s+='<rect x="20" y="78" width="960" height="285" rx="10" class="mst-panel"/>';
  s+=text(42,110,'1. Choose the edge tests before observing outcomes','panel-title');
  s+=text(42,166,'Any fixed constant ratio','label')+text(42,189,'Worst-case necessity','muted');
  s+=text(390,194,'Ω(1/p)','formula','middle')+text(390,216,'average degree','lower-label','middle');
  s+=text(42,241,'1−ε of expected optimum','label')+text(42,264,'E μ(H ∩ Gₚ) / E μ(Gₚ)','muted');
  s+=text(780,269,'(1/p)^{Oε(1)}','formula','middle')+text(780,291,'maximum degree','upper-label','middle');
  s+=line(310,308,920,308);
  s+=text(615,334,'Incident-edge test budget · symbolic dependence on 1/p','axis-title','middle');
  s+=text(615,352,'Unknown exponent; average and maximum degree remain distinct.','foot','middle');
  s+='<rect x="20" y="380" width="960" height="215" rx="10" class="mst-panel"/>';
  s+=text(42,413,'2. The specialized in-n-out matching oracle','panel-title');
  s+=text(42,449,'Out-queries q⁺(e)','label')+text(300,449,'Deterministic bound','upper-label');
  s+=text(930,456,'Δ^{poly(1/ε)}','formula','end');
  s+=text(42,507,'In-queries E q⁻(e)','label')+text(300,507,'Expectation over randomness','upper-label');
  s+=text(930,514,'Δ^{poly(1/ε)}','formula','end');
  s+=text(42,550,'Known base structure + realized subset + reference matching probabilities qₑ','muted');
  s+=text(42,574,'Adaptive probes allowed · Δ is the base-graph maximum degree','muted');
  s+=text(24,625,'The stochastic test budget and the LCA query counts measure different resources.','muted');
  s+=text(24,649,'Select any marker for its theorem and assumptions. No in/out lower bound reviewed.','foot');
 }
 for(const p of g.points){const r=rr.find(r=>r.id===p.id);if(r)s+=marker(r,p,o,interactive,tiny?4:compact?5:7);}
 return s+'</svg>';
}
function diagramSVG(a={},b={}){return chart(1000,680,typeof a==='string'?b:(a||{}),true);}
function summarySVG(key,w,h,o={}){return chart(w,h,o);}
function release(root){for(const i of instances)if(!i.root.isConnected||i.root===root)i.destroy();}
function mount(root,key=ID,options={}){
 release(root);
 for(const name of ['StreamingMatching','DynamicMatching','LCAMatching','LocalMatching','MPCMatching','ListQueryMatching'])window[name]?.release(root);
 for(const[id,renderer]of Object.entries(window.AtlasPairRenderers||{}))if(id!==ID)renderer.release?.(root);
 const controller=new AbortController();let publication=options.publication||'all',selected=data.verifiedRecords[0]?.id;
 root.classList.add('focus-view','mst-view');root.classList.toggle('f-embedded',!!options.embedded);root.setAttribute('aria-label','Stochastic matching and specialized in/out oracle');
 root.innerHTML='<p class="f-kicker">MATCHING × STOCHASTIC</p><header class="f-hero"><div><h1>Test fewer edges, retain nearly all the matching</h1><p>Alma Ghafari and coauthors’ STOC 2025 result, with its in-n-out LCA connection.</p></div></header><div class="mst-toolbar"><div class="mst-legend"><span><i class="mst-key-upper"></i>Algorithm</span><span><i class="mst-key-lower"></i>Necessary budget</span></div><label>Sources <select class="mst-publication" aria-label="Stochastic matching publication filter"><option value="all">All reviewed sources</option><option value="published">Published only</option></select></label></div><div class="mst-scroll" tabindex="0" aria-label="Stochastic matching figure; horizontal scrolling on narrow screens"><div class="mst-plot"></div></div><div class="mst-notes"><p><b>Stochastic tests.</b> The graph is known; an edge-existence test reveals whether an edge survives. All tested edges are selected before seeing outcomes. Once revealed, their maximum matching can be computed.</p><p><b>Specialized local oracle.</b> In/out counts concern a separate adaptive analysis tool with reference matching probabilities supplied. They are not an ordinary adjacency-list oracle bound or a nonadaptive LCA claim.</p></div><section class="mst-theorem" aria-live="polite" aria-label="Selected stochastic theorem"></section><div class="mst-records" aria-label="Inspect stochastic matching results"></div><p class="mst-coverage">'+esc(data.coverageNote)+'</p>';
 const opts=()=>({publication,selected});
 function render(){
  const rr=records(opts());if(!rr.some(r=>r.id===selected))selected=rr[0]?.id;
  root.querySelector('.mst-publication').value=publication;root.querySelector('.mst-plot').innerHTML=diagramSVG(opts());
  root.querySelector('.mst-records').innerHTML=rr.map(r=>'<button type="button" data-mst-result="'+esc(r.id)+'" class="mst-record" aria-pressed="'+(selected===r.id)+'"><span class="mst-'+r.kind+'-label">'+(r.kind==='lower'?'Necessary budget':'Algorithm')+'</span><strong>'+esc(r.quality)+'</strong><small>'+esc(r.bound)+'</small></button>').join('');
  const r=rr.find(r=>r.id===selected),el=root.querySelector('.mst-theorem');
  if(!r){el.innerHTML='<p>No sources match this filter.</p>';return;}
  el.innerHTML='<div class="mst-detail-head"><strong class="mst-'+r.kind+'-label">'+(r.kind==='lower'?'Lower bound · necessary budget':'Algorithm upper bound')+'</strong><span>'+esc(r.shortLabel)+'</span></div><h2>'+esc(r.bound)+'</h2><p><b>Guarantee.</b> '+esc(r.guarantee)+'</p><p><b>Access.</b> '+esc(r.oracle)+'</p><p><b>Probability.</b> '+esc(r.probability)+'</p><p>'+esc(r.notes)+'</p><details><summary>Theorem, assumptions and primary paper</summary><h3>'+esc(r.title)+'</h3><p>'+esc(r.authors.join(', '))+' · '+esc(r.venue)+'</p><p><b>'+esc(r.theorem)+'</b> — '+esc(r.sourceLocation)+'</p><p><b>Graph.</b> '+esc(r.graph)+'</p><p><b>Output.</b> '+esc(r.output)+'</p><p><a href="'+esc(r.sourceUrl)+'" target="_blank" rel="noopener noreferrer">Read primary theorem ↗</a> · <a href="'+esc(r.url)+'" target="_blank" rel="noopener noreferrer">Paper record ↗</a> · <a href="https://doi.org/'+esc(r.doi)+'" target="_blank" rel="noopener noreferrer">Published paper ↗</a></p></details>';
 }
 function select(e){const b=e.target.closest('[data-mst-result]');if(b&&records(opts()).some(r=>r.id===b.dataset.mstResult)){selected=b.dataset.mstResult;render();}}
 root.addEventListener('click',select,{signal:controller.signal});
 root.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const b=e.target.closest('.mst-point');if(b){e.preventDefault();select(e);}}},{signal:controller.signal});
 root.addEventListener('change',e=>{if(e.target.classList.contains('mst-publication')){publication=e.target.value;render();options.onPublicationChange?.(publication);}},{signal:controller.signal});
 render();const instance={root,settingKey:key,redraw:render,destroy(){controller.abort();root.classList.remove('mst-view');instances.delete(instance);}};instances.add(instance);return instance;
}
window.AtlasPairRenderers=window.AtlasPairRenderers||{};window.AtlasPairRenderers[ID]={mount,diagramSVG,summarySVG,records,release,layoutGeometry:geometry};
})();
