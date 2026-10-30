(()=>{
'use strict';
const ID='weighted-matching-dynamic',data=JSON.parse(document.getElementById('atlas-data').textContent).focus[ID];if(!data)return;
const instances=new Set(),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const merge=r=>({...data.sources[r.sourceId],...r}),allow=(r,o)=>o.publication!=='published'||r.publicationStatus!=='preprint';
const records=(o={})=>data.verifiedRecords.map(merge).filter(r=>allow(r,o));
const related=(o={})=>data.relatedResults.map(merge).filter(r=>allow(r,o));
const epsilon=o=>Math.min(.15,Math.max(.01,Number(o.epsilon)||data.defaultEpsilon));
const beta=(r,o={})=>r.betaBase-r.betaError*epsilon(o);
const txt=(x,y,s,c='',extra='')=>'<text x="'+x+'" y="'+y+'" class="wmd-'+c+'" '+extra+'>'+esc(s)+'</text>';
function layoutGeometry(w,h,o={},focus=false){
 const levels=['overview','compact','detail'],capacity=w<300||h<230?0:w<900||h<760?1:2,requested=levels.indexOf(o.level),level=focus?'detail':levels[Math.min(capacity,requested<0?capacity:requested)],tiny=level==='overview',compact=level==='compact';
 const left=tiny?w*.07:compact?66:90,right=w-(tiny?w*.06:compact?18:45),top=tiny?h*.06:compact?36:86,bottom=tiny?h*.57:compact?h*.53:335;
 const approx=data.verifiedRecords.filter(r=>r.panel==='approximate'),slot=(right-left)/approx.length,px=r=>left+slot*(approx.findIndex(v=>v.id===r.id)+.5),py=b=>bottom-(b-.35)/.65*(bottom-top);
 const exactTop=tiny?h*.72:compact?h*.73:510,exactBottom=tiny?h*.9:compact?h*.9:620,exactX=e=>left+e/3*(right-left),points=records(o).map(r=>r.panel==='approximate'?{id:r.id,panel:r.panel,x:px(r),y:py(beta(r,o)),limitY:py(r.betaBase)}:{id:r.id,panel:r.panel,x:exactX(r.costKey==='cubic'?3:r.costKey==='linear-barrier'?1:0),y:r.plotY==='fast'?exactTop:exactBottom});
 return{w,h,level,left,right,top,bottom,slot,points,exactTop,exactBottom,exactX,py};
}
function chart(w,h,o={},interactive=false){
 const g=layoutGeometry(w,h,o,interactive),rr=records(o),tiny=g.level==='overview',compact=g.level==='compact',eps=epsilon(o),rsize=tiny?Math.max(1.7,Math.min(w,h)*.025):compact?3.3:6;
 let s='<svg class="wmd-'+(interactive?'map':'summary')+'" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="xMidYMid meet" data-detail-level="'+g.level+'" role="img" aria-label="Fully dynamic weighted matching: retained weight versus update-time formulas; exact weight-query algorithms and OMv barrier in a separate panel"><title>Weighted matching · fully dynamic</title><desc>Green algorithms. Circles deterministic; triangles randomized. Red diamond: an exact-only conditional barrier with fast queries. Approximate update formulas use categorical spacing; exact panel uses dense-graph polynomial exponents. No approximation lower bound is asserted.</desc>';
 if(!rr.length)return s+(tiny?'':txt(20,40,'No results match these filters.','muted'))+'</svg>';
 const path=(d,c)=>'<path d="'+d+'" class="wmd-'+c+'"/>';
 if(!tiny){s+=txt(16,compact?17:29,'Approximate matching · maintained edges','heading');if(!compact)s+=txt(16,53,'Retained weight β = w(M) / OPTw   ·   ε = '+eps.toFixed(2)+'   ·   higher is better','subheading');}
 const ticks=tiny?[.5,2/3,1]:[.5,2/3,.9,1];
 for(const v of ticks){const y=g.py(v);s+=path('M'+g.left+' '+y+'H'+g.right,'grid');if(!tiny)s+=txt(g.left-9,y+3,v===2/3?'⅔':v===1?'1':String(v),'tick','text-anchor="end"');}
 s+=path('M'+g.left+' '+g.top+'V'+g.bottom+'H'+g.right,'axis-line');
 const approx=data.verifiedRecords.filter(r=>r.panel==='approximate');
 approx.forEach((r,i)=>{const x=g.left+g.slot*(i+.5);if(!tiny){s+=txt(x,g.bottom+(compact?14:27),(compact?["log n","m¼","n /…","√m","√m","√m"][i]:r.compactCost),'cost','text-anchor="middle"');if(!compact){r.formulaLines.forEach((line,j)=>s+=txt(x,g.bottom+49+j*16,line,'formula','text-anchor="middle"'));}}});
 if(!tiny&&!compact)s+=txt(16,410,'Update-time formulas are separate categories; spacing does not rank hidden constants or ε costs.','foot','data-axis="x"');
 const divider=tiny?h*.66:compact?h*.66:435;s+=path('M'+(tiny?g.left:16)+' '+divider+'H'+g.right,'divider');
 if(!tiny){s+=txt(16,compact?divider+17:464,'Exact optimum weight · query cost matters','heading');if(!compact)s+=txt(16,487,'Dense reference m = Θ(n²). Red applies only to exact answers with fast queries.','subheading');}
 for(const y of [g.exactTop,g.exactBottom])s+=path('M'+g.left+' '+y+'H'+g.right,'grid');
 if(!tiny){s+=txt(g.left-9,g.exactTop+4,'q = O(1)','tick','text-anchor="end"')+txt(g.left-9,g.exactBottom+4,'q = O(n³)','tick','text-anchor="end"');}
 const axisY=tiny?h*.96:compact?h-18:660;
 s+=path('M'+g.left+' '+axisY+'H'+g.right,'axis-line');
 for(const [exp,label]of [[0,'O(1)'],[1,'n'],[3,'O(n³)']]){const x=g.exactX(exp);s+=path('M'+x+' '+axisY+'v'+(tiny?2:5),'axis-line');if(!tiny)s+=txt(x,axisY+(compact?11:21),label,'tick','text-anchor="middle"');}
 rr.forEach(r=>{
  const p=g.points.find(v=>v.id===r.id),lower=r.kind==='lower',random=/randomized|Las Vegas/.test(r.probability),selected=o.selected===r.id;
  s+='<g class="wmd-point '+(lower?'wmd-lower':'wmd-upper')+(selected?' wmd-selected':'')+'" data-wmd-result="'+esc(r.id)+'" data-kind="'+r.kind+'"'+(interactive?' role="button" tabindex="0" aria-pressed="'+selected+'"':'')+' aria-label="'+esc(r.shortLabel+'; '+r.quality+'; update '+r.bound+'; '+r.timeType)+'"><title>'+esc(r.shortLabel+' · '+r.quality+' · '+r.displayBound+' · '+r.timeType+(r.publicationStatus==='preprint'?' · preprint':''))+'</title><circle class="wmd-hit" cx="'+p.x+'" cy="'+p.y+'" r="'+(rsize+5)+'"/>';
  if(r.panel==='approximate'){s+=path('M'+p.x+' '+p.y+'V'+p.limitY,'epsilon-gap');}
  if(lower){s+=path('M'+g.left+' '+p.y+'H'+(p.x-rsize-3),'excluded');s+=path('M'+p.x+' '+(p.y-rsize)+'l'+rsize+' '+rsize+'l-'+rsize+' '+rsize+'l-'+rsize+' -'+rsize+'Z','marker');}
  else if(random)s+=path('M'+p.x+' '+(p.y-rsize)+'l'+rsize+' '+(2*rsize)+'h-'+(2*rsize)+'Z','marker');
  else s+='<circle class="wmd-marker" cx="'+p.x+'" cy="'+p.y+'" r="'+rsize+'"/>';
  if(!tiny&&!compact){
   if(r.panel==='approximate'){const name=r.id.includes('bc25-near')?'Bernstein–Chen ’25':r.shortLabel;s+=txt(p.x,p.y+(beta(r,o)<.5?-28:25),name,'point-label','text-anchor="middle"');s+=txt(p.x,p.y+(beta(r,o)<.5?-10:43),(r.timeType.startsWith('worst')?'worst-case':'amortized')+(r.publicationStatus==='preprint'?' · preprint':''),'point-note','text-anchor="middle"');}
   else if(lower)s+=txt(p.x+12,p.y-13,'OMv: no n^{1−c} update','lower-label')+txt(p.x+12,p.y+25,'fixed c > 0 · conditional','point-note');
   else s+=txt(p.x+(r.costKey==='cubic'?-10:10),p.y-15,r.shortLabel,'point-label','text-anchor="'+(r.costKey==='cubic'?'end':'start')+'"');
  }
  s+='</g>';
 });
 if(!tiny&&!compact)s+=txt(16,714,'Exact barrier: polynomial preprocessing and q = O(m^{1−δ}); unit weights transfer cardinality hardness.','foot')+txt(16,738,'Exact green points are recomputation baselines. The red statement does not constrain approximate matching.','foot');
 return s+'</svg>';
}
const diagramSVG=(a={},b={})=>chart(1000,760,typeof a==='string'?b:(a||{}),true),summarySVG=(key,w,h,o={})=>chart(w,h,o,false);
function release(root){for(const i of instances)if(i.root===root||!i.root.isConnected)i.destroy();}
function mount(root,key=ID,options={}){
 release(root);for(const n of ['StreamingMatching','DynamicMatching','LCAMatching','LocalMatching','MPCMatching','ListQueryMatching'])window[n]?.release(root);for(const [id,r]of Object.entries(window.AtlasPairRenderers||{}))if(id!==ID)r.release?.(root);
 const controller=new AbortController();let publication=options.publication||'all',eps=data.defaultEpsilon,selected=data.verifiedRecords[0].id;const opts=()=>({publication,epsilon:eps,selected}),all=()=>[...records(opts()),...related(opts())];
 root.classList.add('focus-view','wmd-view');root.classList.toggle('f-embedded',!!options.embedded);root.setAttribute('aria-label','Fully dynamic weighted matching');
 root.innerHTML='<p class="f-kicker">WEIGHTED MATCHING × DYNAMIC</p><header class="f-hero"><div><h1>More weight, with less work per update.</h1><p>Maintain the matching edges approximately, or answer its optimum weight exactly. These are different tasks, shown in aligned panels.</p></div></header><div class="wmd-toolbar"><div class="wmd-legend"><span class="wmd-upper-text">● Deterministic algorithm</span><span class="wmd-upper-text">▲ Randomized algorithm</span><span class="wmd-lower-text">◆ Conditional lower bound</span></div><label>Accuracy ε <input class="wmd-epsilon" type="range" min="0.01" max="0.15" step="0.01" value="0.05" aria-label="Weighted matching approximation error"><output class="wmd-epsilon-value">0.05</output></label><label>Sources <select class="wmd-publication" aria-label="Weighted dynamic publication filter"><option value="all">All reviewed sources</option><option value="published">Published only</option></select></label></div><div class="wmd-scroll" tabindex="0" aria-label="Weighted dynamic matching bounds figure; horizontal scrolling available"><div class="wmd-plot"></div></div><p class="wmd-explainer"><b>How to read.</b> A higher point retains more optimum weight. The short vertical stroke shows the ε loss below its limiting guarantee. Update-time formulas are symbolic categories; exact-query costs use the separate dense-graph reference below. Click any point for its assumptions and paper.</p><section class="wmd-theorem" aria-live="polite" aria-label="Selected weighted dynamic theorem"></section><div class="wmd-records" aria-label="Inspect all main results"></div><section class="wmd-related"><h2>Other output contracts and graph parameters</h2><div class="wmd-related-records"></div></section><p class="wmd-coverage">'+esc(data.coverageNote)+'</p>';
 function inspect(){const r=all().find(v=>v.id===selected),el=root.querySelector('.wmd-theorem');if(!r){el.innerHTML='<p>No results match these filters.</p>';return;}el.innerHTML='<div class="wmd-detail-head"><strong class="wmd-'+(r.kind==='lower'?'lower':'upper')+'-text">'+(r.kind==='lower'?'Conditional lower bound · exact only':r.sourceId==='gabow16'?'Algorithm · derived recomputation baseline':'Algorithm upper bound')+'</strong><span>'+esc(r.shortLabel)+(r.publicationStatus==='preprint'?' · PREPRINT':'')+'</span></div><h2>'+esc(r.displayBound)+'</h2><p><b>Guarantee.</b> '+esc(r.quality)+'</p><p><b>Update contract.</b> '+esc(r.timeType)+' · '+esc(r.probability)+' · '+esc(r.adversary)+'</p><p><b>Queries.</b> '+esc(r.queryTime)+'</p><p>'+esc(r.notes)+'</p><details><summary>Theorem, setup and paper</summary><h3>'+esc(r.title)+'</h3><p>'+esc(r.authors.join(', '))+' · '+esc(r.venue)+'</p><p><b>'+esc(r.theorem)+'</b></p><p><b>Graph.</b> '+esc(r.graph)+'</p><p><b>Output.</b> '+esc(r.output)+'</p><p><a href="'+esc(r.sourceUrl)+'" target="_blank" rel="noopener noreferrer">Primary full text ↗</a> · <a href="'+esc(r.url)+'" target="_blank" rel="noopener noreferrer">'+(r.url.includes('arxiv.org')?'arXiv':'Author’s paper')+' ↗</a>'+(r.publicationUrl?' · <a href="'+esc(r.publicationUrl)+'" target="_blank" rel="noopener noreferrer">Published version ↗</a>':'')+'</p></details>';}
 const button=r=>'<button type="button" class="wmd-record '+(r.kind==='lower'?'wmd-lower-card':'')+'" data-wmd-result="'+esc(r.id)+'" aria-pressed="'+(r.id===selected)+'"><span>'+esc(r.shortLabel)+(r.publicationStatus==='preprint'?' · preprint':'')+'</span><strong>'+esc(r.bound)+'</strong><small>'+esc(r.quality)+'</small></button>';
 function render(){if(!all().some(r=>r.id===selected))selected=all()[0]?.id;root.querySelector('.wmd-publication').value=publication;root.querySelector('.wmd-epsilon-value').textContent=eps.toFixed(2);root.querySelector('.wmd-plot').innerHTML=diagramSVG(opts());root.querySelector('.wmd-records').innerHTML=records(opts()).map(button).join('');root.querySelector('.wmd-related-records').innerHTML=related(opts()).map(button).join('')||'<p>No related results match these filters.</p>';inspect();}
 function select(e){const b=e.target.closest('[data-wmd-result]');if(b&&all().some(r=>r.id===b.dataset.wmdResult)){selected=b.dataset.wmdResult;render();}}
 root.addEventListener('click',select,{signal:controller.signal});root.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.closest('.wmd-point')){e.preventDefault();select(e);}},{signal:controller.signal});root.addEventListener('change',e=>{if(e.target.classList.contains('wmd-publication')){publication=e.target.value;render();options.onPublicationChange?.(publication);}},{signal:controller.signal});root.addEventListener('input',e=>{if(e.target.classList.contains('wmd-epsilon')){eps=epsilon({epsilon:e.target.value});render();}},{signal:controller.signal});
 render();const instance={root,settingKey:ID,redraw:render,destroy(){controller.abort();root.classList.remove('wmd-view');instances.delete(instance);}};instances.add(instance);return instance;
}
window.AtlasPairRenderers=window.AtlasPairRenderers||{};window.AtlasPairRenderers[ID]={mount,diagramSVG,summarySVG,records,related,release,layoutGeometry,beta};
})();
