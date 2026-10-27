(()=>{
'use strict';
const ID='weighted-matching-local',data=JSON.parse(document.getElementById('atlas-data').textContent).focus[ID];if(!data)return;
const instances=new Set();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const merge=r=>({...data.sources[r.sourceId],...r,publicationStatus:data.sources[r.sourceId].publicationStatus||r.publicationStatus});
function allowed(r,o){return(o.publication!=='published'||r.publicationStatus!=='preprint')&&(!o.randomness||o.randomness==='all'||(r.appliesTo||[r.randomization]).includes(o.randomness));}
const records=(o={})=>data.verifiedRecords.map(merge).filter(r=>allowed(r,o));
const related=(o={})=>data.relatedResults.map(merge).filter(r=>allowed(r,o));
const text=(x,y,s,c='',extra='')=>'<text x="'+x+'" y="'+y+'" class="wml-'+c+'" '+extra+'>'+esc(s)+'</text>';
function geometry(w,h,o={},focus=false){
 const levels=['overview','compact','detail'],available=w<300||h<245?0:w<700||h<460?1:2,request=levels.indexOf(o.level),level=focus?'detail':levels[Math.min(available,request<0?available:request)];
 const rr=records(o),tiny=level==='overview',compact=level==='compact',left=tiny?w*.06:16,right=tiny?w*.94:w-16,top=tiny?h*.1:compact?48:112,bottom=tiny?h*.9:h-(compact?18:52),gap=tiny?Math.min(8,h*.04):compact?7:12;
 const height=rr.length?(bottom-top-gap*(rr.length-1))/rr.length:0;
 return{w,h,level,left,right,top,bottom,rows:rr.map((r,i)=>({id:r.id,x:left,y:top+i*(height+gap),w:right-left,h:height})),points:rr.map((r,i)=>({id:r.id,x:left+12,y:top+i*(height+gap)+height/2}))};
}
function chart(w,h,o={},interactive=false){
 const g=geometry(w,h,o,interactive),rr=records(o),tiny=g.level==='overview',compact=g.level==='compact';
 let s='<svg class="wml-'+(interactive?'map':'summary')+'" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="xMidYMid meet" data-detail-level="'+g.level+'" role="img" aria-label="Weighted matching in LOCAL: two algorithm upper bounds and a lower bound transferred from unit weights"><title>Weighted matching · LOCAL rounds</title><desc>Green algorithm rows and a red necessary-rounds row. Each row gives an exact symbolic bound; distances do not represent numerical complexity. KMW constrains both randomness regimes through unit-weight hard instances.</desc>';
 if(!rr.length)return s+(tiny?'':text(16,40,'No results match these filters.','muted'))+'</svg>';
 if(!tiny){
  if(!compact)s+=text(20,32,'Approximate maximum weight, in communication rounds','heading')+text(20,59,'General graphs · nonnegative weights · variable Δ and ε','muted');
  s+=text(20,compact?18:92,'Setup and guarantee','axis','data-axis="y"')+text(compact?153:355,compact?35:92,'LOCAL rounds · symbolic','axis','data-axis="x"');
 }
 rr.forEach((r,i)=>{
  const p=g.rows[i],color=r.kind==='lower'?'lower':'upper',selected=o.selected===r.id,mid=p.y+p.h/2;
  s+='<g class="wml-row wml-'+color+'" data-wml-result="'+esc(r.id)+'" data-kind="'+r.kind+'"'+(interactive?' role="button" tabindex="0" aria-pressed="'+selected+'"':'')+' aria-label="'+esc(r.displaySetup+'; '+r.quality+'; '+r.bound)+'"><title>'+esc(r.shortLabel+' · '+r.bound+' · '+r.quality)+'</title><rect class="wml-row-bg'+(selected?' wml-selected':'')+'" x="'+p.x+'" y="'+p.y+'" width="'+p.w+'" height="'+p.h+'" rx="'+(tiny?3:7)+'"/>';
  const mx=p.x+(tiny?p.w*.1:12),my=tiny?mid:compact?p.y+16:p.y+31,sz=tiny?Math.max(2,Math.min(w,h)*.022):compact?3.5:5;
  s+=r.kind==='lower'?'<path class="wml-marker" d="M'+mx+' '+(my-sz)+'l'+sz+' '+sz+'l-'+sz+' '+sz+'l-'+sz+' -'+sz+'Z"/>':'<circle class="wml-marker" cx="'+mx+'" cy="'+my+'" r="'+sz+'"/>';
  if(tiny){s+='<path class="wml-glyph" d="M'+(p.x+p.w*.23)+' '+(mid-p.h*.11)+'H'+(p.x+p.w*.84)+'M'+(p.x+p.w*.23)+' '+(mid+p.h*.14)+'H'+(p.x+p.w*.63)+'"/>';}
  else if(compact){
   s+=text(p.x+24,p.y+19,r.compactSetup,'setup');
   r.compactLines.forEach((v,j)=>{s+=text(p.x+24,p.y+37+j*13,v,'formula compact-formula');});
  }else{
   s+=text(p.x+30,p.y+36,r.displaySetup,'setup')+text(p.x+30,p.y+64,r.displayQuality,'quality')+text(p.x+30,p.y+88,r.kind==='lower'?'Unit-weight transfer':'Harris 2020 · algorithm','muted');
   r.displayLines.forEach((v,j)=>{s+=text(355,p.y+40+j*29,v,'formula');});
   s+=text(355,p.y+p.h-14,r.kind==='lower'?'KMW 2016 · necessary rounds; not an ε lower bound':r.randomization==='randomized'?'Success ≥ 1−n⁻ᶜ, fixed c>0':'Deterministic guarantee','row-foot');
  }
  s+='</g>';
 });
 if(!tiny)s+=text(20,h-(compact?3:20),compact?'Theorem rows; no numerical ranking.':'Symbolic categories: row order and spacing do not order formulas in n, Δ and ε.','foot');
 return s+'</svg>';
}
const diagramSVG=(a={},b={})=>chart(1000,560,typeof a==='string'?b:(a||{}),true);
const summarySVG=(key,w,h,o={})=>chart(w,h,o,false);
function release(root){for(const i of instances)if(i.root===root||!i.root.isConnected)i.destroy();}
function mount(root,key=ID,options={}){
 release(root);
 for(const n of ['StreamingMatching','DynamicMatching','LCAMatching','LocalMatching','MPCMatching','ListQueryMatching'])window[n]?.release(root);
 for(const [id,r]of Object.entries(window.AtlasPairRenderers||{}))if(id!==ID)r.release?.(root);
 const controller=new AbortController();let publication=options.publication||'all',randomness='all',selected=data.verifiedRecords[0]?.id;
 const opts=()=>({publication,randomness,selected}),all=()=>[...records(opts()),...related(opts())];
 root.classList.add('focus-view','wml-view');root.classList.toggle('f-embedded',!!options.embedded);
 root.setAttribute('aria-label','Weighted matching in distributed LOCAL');
 root.innerHTML='<p class="f-kicker">WEIGHTED MATCHING × LOCAL</p><header class="f-hero"><div><h1>How many rounds to retain almost all the weight?</h1><p>Algorithms and necessary rounds for a consistent distributed matching. The degree Δ and accuracy ε remain explicit.</p></div></header><div class="wml-toolbar"><div class="wml-legend"><span class="wml-upper-text">● Algorithm</span><span class="wml-lower-text">◆ Lower bound</span></div><label>Randomness <select class="wml-randomness" aria-label="Weighted LOCAL randomness filter"><option value="all">Both regimes</option><option value="deterministic">Deterministic</option><option value="randomized">Randomized</option></select></label><label>Sources <select class="wml-publication" aria-label="Weighted LOCAL publication filter"><option value="all">All reviewed sources</option><option value="published">Published only</option></select></label></div><div class="wml-scroll" tabindex="0" aria-label="Weighted LOCAL symbolic figure; horizontal scrolling available"><div class="wml-plot"></div></div><div class="wml-notes"><p><b>Round cost.</b> Each vertex communicates with neighbors in synchronous rounds; messages have unbounded size. These are communication rounds, not LCA probes.</p><p><b>Lower-bound scope.</b> Set every edge weight to 1 in a KMW hard instance. Weighted approximation then solves cardinality approximation with the same rounds. The red row constrains both randomness regimes; it does not establish tight ε dependence.</p></div><section class="wml-theorem" aria-live="polite" aria-label="Selected weighted LOCAL theorem"></section><div class="wml-records" aria-label="Inspect weighted LOCAL results"></div><section class="wml-related" aria-label="Related result under CONGEST"></section><p class="wml-coverage">'+esc(data.coverageNote)+'</p>';
 function inspect(){
  const r=all().find(v=>v.id===selected),el=root.querySelector('.wml-theorem');
  if(!r){el.innerHTML='<p>No results match these filters.</p>';return;}
  el.innerHTML='<div class="wml-detail-head"><strong class="wml-'+(r.kind==='lower'?'lower':'upper')+'-text">'+(r.kind==='lower'?'Lower bound · unit-weight transfer':r.model==='CONGEST'?'Related algorithm · CONGEST':'Algorithm upper bound')+'</strong><span>'+esc(r.shortLabel||r.label)+'</span></div><h2>'+esc(r.displayBound)+'</h2><p><b>Guarantee.</b> '+esc(r.quality)+'</p><p><b>Probability.</b> '+esc(r.probability)+'</p><p>'+esc(r.notes)+'</p><details><summary>Theorem, assumptions and paper links</summary><h3>'+esc(r.title)+'</h3><p>'+esc(r.authors.join(', '))+' · '+esc(r.venue)+'</p><p><b>'+esc(r.theorem)+'</b></p><p><b>Graph.</b> '+esc(r.graph)+'</p><p><b>Output.</b> '+esc(r.output)+'</p><p><b>Source verification.</b> '+esc(r.evidenceStatus)+'</p><p><a href="'+esc(r.sourceUrl||r.fullTextUrl||r.url)+'" target="_blank" rel="noopener noreferrer">Read primary result ↗</a> · <a href="'+esc(r.publicationUrl||r.url)+'" target="_blank" rel="noopener noreferrer">Paper record ↗</a>'+(r.supportingSourceUrl?' · <a href="'+esc(r.supportingSourceUrl)+'" target="_blank" rel="noopener noreferrer">Simultaneous bound in Harris §7 ↗</a>':'')+'</p></details>';
 }
 const button=r=>'<button type="button" class="wml-record '+(r.kind==='lower'?'wml-lower-card':'')+'" data-wml-result="'+esc(r.id)+'" aria-pressed="'+(r.id===selected)+'"><span>'+esc(r.shortLabel||r.label)+'</span><strong>'+esc(r.displaySetup||r.model)+'</strong><small>'+esc(r.quality)+'</small></button>';
 function render(){
  const rr=records(opts()),rel=related(opts());if(!all().some(r=>r.id===selected))selected=rr[0]?.id||rel[0]?.id;
  root.querySelector('.wml-publication').value=publication;root.querySelector('.wml-randomness').value=randomness;
  root.querySelector('.wml-plot').innerHTML=diagramSVG(opts());
  root.querySelector('.wml-records').innerHTML=rr.map(button).join('');
  root.querySelector('.wml-related').innerHTML=rel.length?'<h2>Related: bounded messages in CONGEST</h2><p>Deterministic (1−ε) of maximum weight in poly(1/ε, log n) rounds, with O(log n)-bit messages.</p>'+rel.map(button).join(''):'';
  inspect();
 }
 function select(e){const b=e.target.closest('[data-wml-result]');if(b&&all().some(r=>r.id===b.dataset.wmlResult)){selected=b.dataset.wmlResult;render();}}
 root.addEventListener('click',select,{signal:controller.signal});
 root.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.closest('.wml-row')){e.preventDefault();select(e);}},{signal:controller.signal});
 root.addEventListener('change',e=>{if(e.target.classList.contains('wml-publication')){publication=e.target.value;render();options.onPublicationChange?.(publication);}else if(e.target.classList.contains('wml-randomness')){randomness=e.target.value;render();}},{signal:controller.signal});
 render();const instance={root,settingKey:ID,redraw:render,destroy(){controller.abort();root.classList.remove('wml-view');instances.delete(instance);}};instances.add(instance);return instance;
}
window.AtlasPairRenderers=window.AtlasPairRenderers||{};window.AtlasPairRenderers[ID]={mount,diagramSVG,summarySVG,records,related,release,layoutGeometry:geometry};
})();
