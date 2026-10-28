(()=>{
'use strict';
const ID='mis-query_matrix',data=JSON.parse(document.getElementById('atlas-data').textContent).focus[ID];
if(!data)return;
const instances=new Set();let serial=0;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=(x,y,s,cls='',anchor='start',extra='')=>'<text x="'+x+'" y="'+y+'" class="'+cls+'" text-anchor="'+anchor+'" '+extra+'>'+esc(s)+'</text>';
const records=(o={})=>data.verifiedRecords.map(r=>({...data.sources[r.sourceId],...r})).filter(r=>o.publication!=='published'||r.publicationStatus!=='preprint');
function chart(w,h,o={},focus=false){
 const levels=['overview','compact','detail'],available=w<250||h<150?0:w<640||h<350?1:2,requested=levels.indexOf(o.level),level=focus?'detail':levels[Math.min(available,requested<0?available:requested)],tiny=level==='overview',detail=level==='detail',rows=records(o),recent=rows.some(r=>r.curve.queryExponent==='4/3+2a');
 const l=tiny?9:detail?Math.min(92,w*.13):26,r=w-(tiny?9:detail?28:14),gap=tiny?18:detail?Math.min(86,w*.10):28,pw=(r-l-gap)/2,t=tiny?14:detail?116:45,b=h-(tiny?10:detail?140:32);
 const px=(panel,a)=>l+(panel==='explicit'?pw+gap:0)+a/.5*pw,py=p=>b-(p-1.23)/.89*(b-t),power=(row,a)=>row.curve.queryExponent==='4/3+2a'?4/3+2*a:row.curve.queryExponent==='3/2+2a'?1.5+2*a:2,setColor=p=>p==='explicit'?'var(--miqm-explicit)':'var(--blue)';
 let s='<svg class="'+(focus?'miqm-map':'miqm-summary')+'" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="xMidYMid meet" data-detail-level="'+level+'" role="img" aria-label="Aligned MIS size-estimation and explicit-output query bounds"><title>MIS: precision and output contract</title><desc>Two concurrent preprints improve scalar estimation from n to the three halves to n to the four thirds, divided by epsilon squared. Both new bounds share a curve; triangles identify expected cost, circles capped cost. Historical results are dashed. Only explicit construction has a quadratic lower bound.</desc>';
 if(!rows.length)return s+(tiny?'':text(w/2,h/2,'No sources match this filter.','miqm-muted','middle'))+'</svg>';
 if(!tiny){s+=text(detail?24:12,detail?29:17,'Precision × output contract','miqm-heading');if(detail)s+=text(24,52,recent?'Concurrent preprints share one curve; inspect their different guarantees.':'Published sources: scalar estimates and exact explicit construction.','miqm-muted')+text(l,t-20,'Y · pair queries','miqm-axis-title','start','data-axis="y"');}
 for(const panel of ['estimate','explicit']){
  const x0=px(panel,0),x1=px(panel,.5);
  s+='<g data-panel="'+panel+'" data-axis-x-min="0" data-axis-x-max="0.5" data-axis-y-min="1.23" data-axis-y-max="2.12">';
  if(!tiny)s+=text(x0,detail?81:35,detail?(panel==='estimate'?'Estimate |RGMIS(π)|':'Output the MIS vertices'):(panel==='estimate'?'Size estimate':'Explicit vertices'),'miqm-panel-title miqm-setup-'+panel);
  for(const [p,label] of [[4/3,'n⁴ᐟ³'],[1.5,'n³ᐟ²'],[1.75,'n⁷ᐟ⁴'],[2,'n²']]){
   const y=py(p);s+='<path d="M'+x0+' '+y+'H'+x1+'" class="miqm-grid"/>';if(detail&&panel==='estimate')s+=text(x0-12,y+4,label,'miqm-tick','end');
  }
  for(const [a,label] of [[0,'¼'],[1/3,'¼n⁻¹ᐟ³'],[.5,'¼n⁻¹ᐟ²']]){
   const x=px(panel,a);s+='<path d="M'+x+' '+t+'V'+b+'" class="miqm-grid"/>';if(detail)s+=text(x,b+25,label,'miqm-tick','middle');
  }
  s+='<path d="M'+x0+' '+t+'V'+b+'H'+x1+'" class="miqm-axis"/>';
  for(const row of rows.filter(r=>r.panel===panel)){
   const lower=row.kind==='lower',color=lower?'var(--red)':'var(--green)',isCap=row.id==='mis-query-matrix-size-full-scan-baseline',domain=isCap&&!recent?row.curve.publishedDomain:row.curve.domain,coords=domain.map(a=>[px(panel,a),py(power(row,a))]),path='M'+coords.map(p=>p.join(' ')).join('L'),aria=focus?' tabindex="0" role="button" aria-pressed="'+(row.id===o.selected)+'"':'';
   s+='<g class="miqm-result miqm-'+row.kind+'" data-miqm-result="'+esc(row.id)+'" data-kind="'+row.kind+'" data-setup="'+panel+'"'+aria+' aria-label="Inspect '+esc(row.shortLabel+' '+row.displayBound)+'">';
   if(!lower&&!row.historical)s+='<path d="'+path+'" fill="none" stroke="'+setColor(panel)+'" stroke-width="7" opacity=".23"/>';
   s+='<path data-boundary="'+esc(row.id)+'" d="'+path+'" fill="none" stroke="'+color+'" stroke-width="'+(lower||row.historical?1.8:2.8)+'"'+(lower||row.historical?' stroke-dasharray="5 4"':row.derived?' stroke-dasharray="3 3"':'')+'/>';
   const aa=row.markerParameters||(panel==='explicit'?[0,.25,.5]:[(domain[0]+domain[1])/2,domain[1]]);
   for(const a of aa){
    const x=px(panel,a),p=power(row,a),y=py(p),radius=tiny?2.8:detail?5:3.3,attrs=' data-marker="'+(lower?'lower':'algorithm')+'" data-a="'+a+'" data-p="'+p+'" data-center-x="'+x+'" data-center-y="'+y+'"';
    if(lower){const d=radius+3;s+='<path'+attrs+' d="M'+x+' '+(y-d)+'L'+(x+d)+' '+y+'L'+x+' '+(y+d)+'L'+(x-d)+' '+y+'Z" fill="none" stroke="'+color+'" stroke-width="1.8"/>';}
    else if(row.markerShape==='triangle'){const d=radius+2;s+='<path'+attrs+' data-symbol="triangle" d="M'+x+' '+(y-d)+'L'+(x+d)+' '+(y+d)+'L'+(x-d)+' '+(y+d)+'Z" fill="var(--surface)" stroke="'+color+'" stroke-width="1.8"/>';}
    else s+='<circle'+attrs+' data-symbol="circle" cx="'+x+'" cy="'+y+'" r="'+radius+'" fill="'+color+'"/>';
   }
   s+='</g>';
  }
  if(detail){
   if(panel==='estimate'){
    s+=text(x0+12,py(1.75)-18,'SODA 2026 · Õ(n³ᐟ²/ε²)','miqm-historical-label')+text(x1,py(2)-17,'O(n²) scan cap','miqm-bound-label miqm-algorithm','end')+text((x0+x1)/2,b+49,'X · ε decreases → tighter estimate','miqm-axis-title','middle','data-axis="x"');
    if(recent)s+=text(px(panel,.20),py(1.53)+16,'Õ(n⁴ᐟ³/ε²)','miqm-bound-label miqm-algorithm')+text(x0,b+70,'△ Kiss–Kooroshnezhad · expected','miqm-source-key miqm-result','start','data-miqm-result="mis-query-kiss-kooroshnezhad-2026-matrix-estimator"'+(focus?' tabindex="0" role="button"':''))+text(x0,b+88,'● Mahabadi–Tarnawski · capped','miqm-source-key miqm-result','start','data-miqm-result="mis-query-mahabadi-tarnawski-2026-matrix-estimator"'+(focus?' tabindex="0" role="button"':''))+text(x0,b+106,'Both October 2026 preprints · same curve','miqm-muted');
    else s+=text(x0,b+76,'Published source only · scan crossover a = ¼','miqm-muted');
    s+=text(x0+12,py(recent?4/3:1.5)+25,'ε = ¼ reference','miqm-muted');
   }else{
    s+=text((x0+x1)/2,py(2)-17,'O(n²) full scan','miqm-bound-label miqm-algorithm','middle')+text((x0+x1)/2,py(2)+29,'Ω(n²) · explicit output only','miqm-bound-label miqm-lower','middle')+text((x0+x1)/2,b+49,'Same ε reference · output stays exact','miqm-axis-title','middle','data-axis="x"')+text((x0+x1)/2,b+76,'Both bounds are independent of ε.','miqm-muted','middle')+text((x0+x1)/2,b+96,'No estimation lower bound inferred.','miqm-muted','middle');
   }
  }else if(!tiny){
   s+=text(x1,b+20,'ε ↓','miqm-muted','end');
   if(w>=300)s+=text((x0+x1)/2,panel==='estimate'?py(recent?4/3:1.5)-14:py(2)+22,panel==='estimate'?(recent?(w>=480?'Õ(n⁴ᐟ³/ε²) · 2 preprints':'Õ(n⁴ᐟ³/ε²)'):'Õ(n³ᐟ²/ε²)'):'Θ(n²) explicit','miqm-compact-formula','middle');
  }
  s+='</g>';
 }
 if(detail)s+=text(w/2,h-7,'Exponent scale · logarithms and constants suppressed','miqm-muted','middle');
 return s+'</svg>';
}
function diagramSVG(a={},b={}){return chart(1000,600,typeof a==='string'?b:a,true)}
function summarySVG(key,w,h,options={}){return chart(w,h,options,false)}
function release(root){for(const i of instances)if(!i.root.isConnected||i.root===root)i.destroy()}
function mount(root,key=ID,options={}){
 release(root);for(const name of ['StreamingMatching','DynamicMatching','LCAMatching','LocalMatching','MPCMatching','ListQueryMatching'])window[name]?.release(root);
 for(const [id,r] of Object.entries(window.AtlasPairRenderers||{}))if(id!==ID)r.release?.(root);
 const controller=new AbortController(),uid='miqm-'+(++serial);let publication=options.publication||'all',selected=records({publication})[0]?.id;
 const opts=()=>({publication,selected});
 root.classList.add('focus-view','miqm-view');root.classList.toggle('f-embedded',!!options.embedded);root.setAttribute('aria-label','MIS adjacency-matrix algorithms and lower bounds');
 root.innerHTML='<p class="f-kicker">MAXIMAL INDEPENDENT SET × ADJACENCY-MATRIX QUERIES</p><header class="f-hero"><div><h1>Precision and output change the query cost</h1><p>Compare scalar size estimates with exact explicit construction on aligned query-cost axes.</p></div></header><div class="miqm-toolbar"><div class="miqm-legend" id="'+uid+'"><span><i class="miqm-key-alg"></i>Algorithm upper bound</span><span><i class="miqm-key-lower"></i>Lower bound</span><span class="miqm-setup-estimate"><i class="miqm-key-estimate"></i>Size estimate</span><span class="miqm-setup-explicit"><i class="miqm-key-explicit"></i>Explicit vertices</span></div><label>Sources <select class="miqm-publication" aria-label="MIS adjacency-matrix publication filter"><option value="all">All verified sources</option><option value="published">Published only</option></select></label></div><div class="miqm-scroll" tabindex="0" aria-label="Shared MIS cost figure; scroll horizontally on narrow screens"><div class="miqm-plot"></div></div><div class="miqm-notes"><p><b>Precision.</b> Set ε = (1/4)n<sup>−a</sup>. The leftmost point is the labelled fixed ε = 1/4 reference; moving right asks for more accuracy. The new preprints give exponent 4/3 + 2a; the dashed SODA 2026 curve is 3/2 + 2a.</p><p><b>Scan cap.</b> An elementary full scan computes a greedy MIS for its own generated π and counts exactly. With all sources, the size upper bound is min{Õ(n⁴ᐟ³/ε²), O(n²)}. Triangles show Kiss–Kooroshnezhad (expected cost); circles show Mahabadi–Tarnawski (capped cost). Logs and constants are suppressed; the breakpoint is an exponent comparison.</p><p><b>Output matters.</b> Only the explicit-vertices panel has the Ω(n²) lower bound. RGMIS means a random greedy <em>maximal</em> independent set. Its scalar estimate is neither a maximum-independent-set estimate nor an expectation over π.</p></div><section class="miqm-theorem" aria-live="polite" aria-label="Selected MIS adjacency-matrix theorem"></section><div class="miqm-records" aria-label="Inspect primary statements and elementary baselines"></div><p class="miqm-coverage">'+esc(data.coverage)+'</p>';
 function inspect(){
  const r=records(opts()).find(r=>r.id===selected),el=root.querySelector('.miqm-theorem');if(!r){el.innerHTML='<p>No results match this filter.</p>';return}
  el.innerHTML='<div class="miqm-detail-top"><strong class="miqm-'+r.kind+'">'+(r.kind==='lower'?'Lower-bound statement':'Algorithm guarantee')+'</strong><span>'+esc(r.derived?'Elementary baseline':r.shortLabel+(r.publicationStatus==='preprint'?' · preprint':''))+'</span></div><div class="miqm-detail-grid"><div><small>Pair-query cost</small><strong>'+esc(r.displayBound)+'</strong></div><div><small>Output</small><strong>'+esc(r.output)+'</strong></div></div><p><b>Graph and access.</b> '+esc(r.graph)+' · '+esc(r.oracle)+'</p><p><b>Guarantee.</b> '+esc(r.quality)+'</p><p><b>Probability and runtime.</b> '+esc(r.probability)+'</p><p>'+esc(r.notes)+'</p><details><summary>Theorem, assumptions and primary source</summary><h3>'+esc(r.title)+'</h3><p>'+esc((r.authors||[]).join(', '))+'</p><p><b>'+esc(r.theorem)+'</b></p><p>'+esc(r.assumptions.join('; '))+'</p><p><a href="'+esc(r.sourceUrl||r.fullTextUrl||r.url)+'" target="_blank" rel="noopener noreferrer">Read primary statement ↗</a> · <a href="'+esc(r.publicationUrl||r.url)+'" target="_blank" rel="noopener noreferrer">'+(r.publicationStatus==='preprint'?'arXiv preprint':'Publication')+' ↗</a></p></details>';
 }
 function render(){const rr=records(opts());if(!rr.some(r=>r.id===selected))selected=rr[0]?.id;root.querySelector('.miqm-publication').value=publication;root.querySelector('.miqm-plot').innerHTML=diagramSVG(opts());root.querySelector('.miqm-records').innerHTML=rr.map(r=>'<button class="miqm-record miqm-'+r.kind+'" type="button" data-miqm-result="'+esc(r.id)+'" aria-pressed="'+(r.id===selected)+'"><span>'+esc(r.kind==='lower'?'Lower bound':'Algorithm')+'</span><strong>'+esc(r.displayBound)+'</strong><small>'+esc((r.setup==='estimate'?'Size estimate':'Explicit vertices')+' · '+(r.derived?'Derived baseline':r.shortLabel+(r.publicationStatus==='preprint'?' · preprint':'')+(r.runtimeType==='expected'?' · expected cost':r.runtimeType==='worst_case_capped'?' · capped cost':'')))+'</small></button>').join('');inspect()}
 root.addEventListener('click',e=>{const b=e.target.closest('[data-miqm-result]');if(b){selected=b.dataset.miqmResult;render()}},{signal:controller.signal});
 root.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const b=e.target.closest('.miqm-result');if(b){e.preventDefault();selected=b.dataset.miqmResult;render()}},{signal:controller.signal});
 root.addEventListener('change',e=>{if(e.target.classList.contains('miqm-publication')){publication=e.target.value;render();options.onPublicationChange?.(publication)}},{signal:controller.signal});
 render();const instance={root,settingKey:ID,redraw:render,destroy(){controller.abort();root.classList.remove('miqm-view');instances.delete(instance)}};instances.add(instance);return instance;
}
window.AtlasPairRenderers=window.AtlasPairRenderers||{};window.AtlasPairRenderers[ID]={mount,diagramSVG,summarySVG,records,release};
})();
