(()=>{
'use strict';
const ID='cc-query_matrix',data=JSON.parse(document.getElementById('atlas-data').textContent).focus[ID];if(!data)return;
const instances=new Set();let serial=0;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const txt=(x,y,s,cls='',anchor='start',extra='')=>'<text x="'+x+'" y="'+y+'" class="'+cls+'" text-anchor="'+anchor+'" '+extra+'>'+esc(s)+'</text>';
const records=(o={})=>data.verifiedRecords.map(r=>({...data.sources[r.sourceId],...r})).filter(r=>o.publication!=='published'||r.publicationStatus!=='preprint');
const exponent=(r,a)=>r.curve.queryExponent==='1+2a'?1+2*a:r.curve.queryExponent==='1+a'?1+a:2;
function chart(w,h,o={},focus=false){
 const levels=['overview','compact','detail'],available=w<250||h<150?0:w<640||h<350?1:2,requested=levels.indexOf(o.level),level=focus?'detail':levels[Math.min(available,requested<0?available:requested)],tiny=level==='overview',detail=level==='detail';
 const l=tiny?10:detail?68:24,r=w-(tiny?10:detail?22:14),gap=tiny?20:detail?52:26,pw=(r-l-gap)/2,t=tiny?12:detail?104:47,b=h-(tiny?12:detail?110:33);
 const px=(panel,a)=>l+(panel==='mixed'?pw+gap:0)+a*pw,py=p=>b-(p-.9)/1.2*(b-t),rows=records(o);
 let s='<svg class="'+(focus?'ccqm-map':'ccqm-summary')+'" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="xMidYMid meet" data-detail-level="'+level+'" role="img" aria-label="Correlation clustering matrix-query precision tradeoffs, with pure additive and expected mixed-error panels"><title>Matrix queries: accuracy and partition cost</title><desc>Pure additive: O(min(n/epsilon squared,n squared)) query upper bound with exponential computation. Its 2026 Omega(n/epsilon squared) lower is an informal announcement, with no guessed domain curve. Mixed expected factor three: matching O(n/epsilon) and Omega(n/epsilon) curves in the formal epsilon regime. Both panels use epsilon=epsilon-zero times n to the minus a; constants are suppressed.</desc>';
 if(!rows.length)return s+(tiny?'':txt(w/2,h/2,'No sources match this filter.','ccqm-muted','middle'))+'</svg>';
 if(!tiny){s+=txt(detail?20:10,detail?27:18,'Accuracy × pair queries','ccqm-heading');if(detail)s+=txt(20,49,'Same full-partition output. Two accuracy contracts.','ccqm-muted')+txt(15,t+12,'Q','ccqm-axis-title','start','data-axis="y"');}
 for(const panel of ['pure','mixed']){
  const x0=px(panel,0),x1=px(panel,1);
  s+='<g data-panel="'+panel+'" data-axis-x-min="0" data-axis-x-max="1" data-axis-y-min=".9" data-axis-y-max="2.1">';
  if(!tiny){s+=txt(x0,detail?75:36,panel==='pure'?'Pure additive':'Expected mixed error','ccqm-panel-title ccqm-setup-'+panel);if(detail)s+=txt(x0,93,panel==='pure'?'OPT + εn² · exponential computation':'E[cost] ≤ 3 OPT + εn²','ccqm-subtitle');}
  for(const p of [1,1.5,2]){const y=py(p);s+='<path d="M'+x0+' '+y+'H'+x1+'" class="ccqm-grid"/>';if(detail&&panel==='pure')s+=txt(x0-10,y+4,{'1':'n','1.5':'n³ᐟ²','2':'n²'}[p],'ccqm-tick','end');}
  for(const a of [0,.5,1]){const x=px(panel,a);s+='<path d="M'+x+' '+t+'V'+b+'" class="ccqm-grid"/>';if(detail)s+=txt(x,b+22,{'0':'ε₀','0.5':'ε₀/√n','1':'ε₀/n'}[a],'ccqm-tick','middle');}
  s+='<path d="M'+x0+' '+t+'V'+b+'H'+x1+'" class="ccqm-axis"/>';
  for(const row of rows.filter(q=>q.panel===panel&&(q.display==='curve'||q.display==='cap'))){
   const lower=row.kind==='lower',color=lower?'var(--red)':'var(--green)',aa=row.curve.domain,coords=aa.map(a=>[px(panel,a),py(exponent(row,a))]),path='M'+coords.map(p=>p.join(' ')).join('L');
   const aria=focus?' tabindex="0" role="button" aria-pressed="'+(row.id===o.selected)+'"':'';
   s+='<g class="ccqm-result ccqm-'+row.kind+'" data-ccqm-result="'+esc(row.id)+'" data-kind="'+row.kind+'" data-setup="'+panel+'"'+aria+' aria-label="Inspect '+esc(row.displayBound)+'">';
   if(!lower)s+='<path d="'+path+'" fill="none" stroke="'+(panel==='pure'?'var(--blue)':'var(--ccqm-mixed)')+'" stroke-width="8" opacity=".19"/>';
   s+='<path data-boundary="'+esc(row.id)+'" d="'+path+'" fill="none" stroke="'+color+'" stroke-width="'+(lower?1.9:3)+'"'+(lower?' stroke-dasharray="5 5"':row.derived?' stroke-dasharray="3 3"':'')+'/>';
   const marks=row.display==='cap'?[1]:aa[0]===aa[1]?[aa[0]]:[aa[0],(aa[0]+aa[1])/2,aa[1]];
   for(const a of marks){
    const p=exponent(row,a),x=px(panel,a),y=py(p),radius=tiny?2.6:detail?4.7:3.2,excluded=lower&&row.curve.openEnd&&a===aa[1];
    if(lower){const d=radius+3;s+='<path data-marker="lower" data-a="'+a+'" data-p="'+p+'" data-excluded="'+excluded+'" data-center-x="'+x+'" data-center-y="'+y+'" d="M'+x+' '+(y-d)+'L'+(x+d)+' '+y+'L'+x+' '+(y+d)+'L'+(x-d)+' '+y+'Z" fill="none" stroke="'+color+'" stroke-width="1.7"'+(excluded?' stroke-dasharray="2 2"':'')+'/>';}
    else s+='<circle data-marker="algorithm" data-a="'+a+'" data-p="'+p+'" data-center-x="'+x+'" data-center-y="'+y+'" cx="'+x+'" cy="'+y+'" r="'+radius+'" fill="'+color+'"/>';
   }
   s+='</g>';
  }
  if(detail){
   if(panel==='pure'){
    s+=txt(x0+9,py(1.7)-8,'O(n/ε²)','ccqm-bound-label ccqm-algorithm')+txt(x1,py(2)-12,'O(n²) scan cap','ccqm-bound-label ccqm-algorithm','end');
    const ann=rows.find(q=>q.panel==='pure'&&q.display==='announcement');if(ann)s+='<g data-ccqm-result="'+esc(ann.id)+'" data-announcement="true" class="ccqm-result"'+(focus?' tabindex="0" role="button" aria-pressed="'+(ann.id===o.selected)+'"':'')+'>'+txt(x0,b+61,'Ω(n/ε²) announced in ITCS 2026','ccqm-announcement')+txt(x0,b+79,'Formal ε range and probability omitted.','ccqm-muted')+'</g>';
   }else s+=txt(x0+9,py(1.95)+15,'O(n/ε) algorithm','ccqm-bound-label ccqm-algorithm')+txt(x0+9,py(1.95)+34,'Ω(n/ε) lower · c = 3','ccqm-bound-label ccqm-lower')+txt(x0,b+61,'8/n < ε ≤ 1/18432','ccqm-muted')+txt(x0,b+79,'Dashed end: a = 1 is outside the lower regime.','ccqm-muted');
   s+=txt((x0+x1)/2,b+41,'ε decreases → more accuracy','ccqm-axis-title','middle','data-axis="x"');
  }else if(!tiny){s+=txt(x1,b+20,'ε ↓','ccqm-muted','end');if(w>=500)s+=txt(x0+5,py(2)+20,panel==='pure'?'min{n/ε², n²} · upper':'n/ε · upper + lower','ccqm-compact-formula');}
  s+='</g>';
 }
 if(detail)s+=txt(w/2,h-8,'ε₀ = 1/32768 fixed-accuracy reference · exponents suppress constants','ccqm-muted','middle');
 return s+'</svg>';
}
function diagramSVG(a={},b={}){return chart(1000,620,typeof a==='string'?b:a,true)}
function summarySVG(key,w,h,options={}){return chart(w,h,options,false)}
function release(root){for(const i of instances)if(!i.root.isConnected||i.root===root)i.destroy()}
function mount(root,key=ID,options={}){
 release(root);for(const name of ['StreamingMatching','DynamicMatching','LCAMatching','LocalMatching','MPCMatching','ListQueryMatching'])window[name]?.release(root);
 for(const [id,r] of Object.entries(window.AtlasPairRenderers||{}))if(id!==ID)r.release?.(root);
 const controller=new AbortController(),uid='ccqm-'+(++serial);let publication=options.publication||'all',selected=records({publication}).find(r=>r.display==='curve')?.id;
 const opts=()=>({publication,selected});root.classList.add('focus-view','ccqm-view');root.classList.toggle('f-embedded',!!options.embedded);root.setAttribute('aria-label','Correlation clustering matrix-query algorithms and lower bounds');
 root.innerHTML='<p class="f-kicker">CORRELATION CLUSTERING × ADJACENCY-MATRIX QUERIES</p><header class="f-hero"><div><h1>Accuracy changes the price of a partition</h1><p>Two aligned precision tradeoffs for a full clustering of the same signed graph.</p></div></header><div class="ccqm-toolbar"><div class="ccqm-legend" id="'+uid+'"><span><i class="ccqm-key-alg"></i>Algorithm</span><span><i class="ccqm-key-lower"></i>Lower bound</span><span class="ccqm-setup-pure"><i class="ccqm-key-pure"></i>Pure additive</span><span class="ccqm-setup-mixed"><i class="ccqm-key-mixed"></i>Expected mixed error</span></div><label>Sources <select class="ccqm-publication" aria-label="CC matrix publication filter"><option value="all">All sources</option><option value="published">Published only</option></select></label></div><div class="ccqm-scroll" tabindex="0" aria-label="Aligned precision panels; scroll horizontally on narrow screens"><div class="ccqm-plot"></div></div><div class="ccqm-notes"><p><b>Accuracy axis.</b> ε = ε₀n<sup>−a</sup>, with ε₀ = 1/32768 and 0 ≤ a ≤ 1. Moving right requests less additive error. This compares asymptotic query exponents; constants and finite-n crossover points are not represented.</p><p><b>Pure additive.</b> O(n/ε²) random queries suffice with high probability, using exponential postprocessing. Reading all pairs caps queries at O(n²); exact optimization is still exponential. The red 2026 announcement lacks a formal regime in the supplied source.</p><p><b>Mixed error.</b> For expected 3 OPT + εn² cost, adaptive and nonadaptive algorithms use O(n/ε) queries and time. The lower matches for 8/n &lt; ε ≤ 1/18432. Its endpoint at a = 1 is excluded. Historical constant-success bounds remain separate below.</p></div><section class="ccqm-theorem" aria-live="polite" aria-label="Selected CC matrix statement"></section><div class="ccqm-records" aria-label="Inspect all original records and query-cap baselines"></div><p class="ccqm-coverage">'+esc(data.coverage)+'</p>';
 function inspect(){
  const r=records(opts()).find(q=>q.id===selected),el=root.querySelector('.ccqm-theorem');if(!r){el.innerHTML='<p>No results match this filter.</p>';return;}
  el.innerHTML='<div class="ccqm-detail-top"><strong class="ccqm-'+r.kind+'">'+(r.display==='announcement'?'Informal lower-bound announcement':r.kind==='lower'?'Lower-bound statement':'Algorithm guarantee')+'</strong><span>'+esc(r.derived?'Query-cap baseline':r.shortLabel)+'</span></div><div class="ccqm-detail-grid"><div><small>Query or computation cost</small><strong>'+esc(r.displayBound)+'</strong></div><div><small>Accuracy contract</small><strong>'+esc(r.quality)+'</strong></div></div><p><b>Graph and access.</b> '+esc(r.graph)+' · '+esc(r.oracle)+'</p><p><b>Output.</b> '+esc(r.output)+'</p><p><b>Probability / expectation.</b> '+esc(r.probability)+'</p><p>'+esc(r.notes)+'</p><details><summary>Theorem, assumptions and primary source</summary><h3>'+esc(r.title)+'</h3><p>'+esc((r.authors||[]).join(', '))+'</p><p><b>'+esc(r.theorem)+'</b></p><p>'+esc(r.assumptions.join('; '))+'</p><p><a href="'+esc(r.sourceUrl||r.fullTextUrl||r.url)+'" target="_blank" rel="noopener noreferrer">Read primary statement ↗</a> · <a href="'+esc(r.publicationUrl||r.url)+'" target="_blank" rel="noopener noreferrer">Publication ↗</a></p></details>';
 }
 function render(){
  const rr=records(opts());if(!rr.some(r=>r.id===selected))selected=rr[0]?.id;
  root.querySelector('.ccqm-publication').value=publication;root.querySelector('.ccqm-plot').innerHTML=diagramSVG(opts());
  root.querySelector('.ccqm-records').innerHTML=rr.map(r=>'<button class="ccqm-record ccqm-'+r.kind+'" type="button" data-ccqm-result="'+esc(r.id)+'" aria-pressed="'+(r.id===selected)+'"><span>'+esc(r.display==='announcement'?'Informal announcement':r.kind==='lower'?'Lower bound':'Algorithm')+'</span><strong>'+esc(r.displayBound)+'</strong><small>'+esc((r.panel==='pure'?'Pure additive':r.setup==='constant-success'?'Mixed · constant success':'Mixed · expected cost')+' · '+(r.derived?'Derived baseline':r.shortLabel))+'</small></button>').join('');inspect();
 }
 root.addEventListener('click',e=>{const b=e.target.closest('[data-ccqm-result]');if(b){selected=b.dataset.ccqmResult;render()}},{signal:controller.signal});
 root.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const b=e.target.closest('.ccqm-result');if(b){e.preventDefault();selected=b.dataset.ccqmResult;render()}},{signal:controller.signal});
 root.addEventListener('change',e=>{if(e.target.classList.contains('ccqm-publication')){publication=e.target.value;render();options.onPublicationChange?.(publication)}},{signal:controller.signal});
 render();const instance={root,settingKey:ID,redraw:render,destroy(){controller.abort();root.classList.remove('ccqm-view');instances.delete(instance)}};instances.add(instance);return instance;
}
window.AtlasPairRenderers=window.AtlasPairRenderers||{};window.AtlasPairRenderers[ID]={mount,diagramSVG,summarySVG,records,release};
})();
