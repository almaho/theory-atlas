(function ccRenderer(){
'use strict';
const ID='cc-query_list',element=document.getElementById('atlas-data');
if(!element)return;
const data=JSON.parse(element.textContent).focus[ID];if(!data)return;
const instances=new Set();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=(x,y,s,cls='',anchor='start',extra='')=>'<text x="'+x+'" y="'+y+'" class="'+cls+'" text-anchor="'+anchor+'" '+extra+'>'+esc(s)+'</text>';
const merge=r=>({...data.sources[r.sourceId],...r});
const eligible=(r,o)=>o.publication!=='published'||r.publicationStatus!=='preprint';
const records=(o={})=>data.verifiedRecords.map(merge).filter(r=>eligible(r,o));
const related=(o={})=>data.relatedResults.map(merge).filter(r=>eligible(r,o));
function chart(w,h,o={},focused=false){
 const levels=['overview','compact','detail'],available=w<220||h<140?0:w<620||h<360?1:2,requested=levels.indexOf(o.level),level=focused?'detail':levels[Math.min(available,requested<0?available:requested)];
 const tiny=level==='overview',detail=level==='detail',medium=!tiny&&!detail;
 const left=tiny?10:detail?Math.round(w*.27):Math.round(w*.28),right=w-(tiny?10:detail?38:20);
 const top=tiny?10:detail?111:41,bottom=h-(tiny?12:detail?150:58);
 const py=i=>top+(i?.74:.24)*(bottom-top),px=k=>left+({linear:0,'near-linear':.43,quadratic:1}[k])*(right-left);
 const rows=records(o),rr=related(o);
 const canRelated=detail&&rr.length;
 let s='<svg class="'+(focused?'ccql-map':'ccql-summary')+'" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="xMidYMid meet" data-detail-level="'+level+'" role="img" aria-label="Correlation clustering with positive-neighbor lists: two algorithms on a shared query-cost axis. Different-oracle lower bounds are related results only."><title>Positive-list correlation clustering: query complexity</title><desc>Assadi and Wang use O(n log n) queries for an unspecified constant approximation with high probability. Pivot has a derived O(n plus m positive) query upper bound and expected approximation factor three. The Pivot band ranges over positive-edge densities. Related quadratic lower bounds concern full signed or negative lists, never positive lists. Symbolic axis spacing is schematic.</desc>';
 if(!rows.length)return s+(tiny?'':text(w/2,h/2,'No sources match this filter.','ccql-muted','middle'))+'</svg>';
 if(detail){
  s+=text(24,30,'Positive lists · query complexity','ccql-heading')+text(24,53,'Explicit partition · unweighted complete signed graph','ccql-muted')+text(24,78,'● Algorithm upper bound','ccql-alg-key')+text(left,top-13,'Total queries · symbolic growth order','ccql-axis-title','start','data-axis="x"');
 }else if(medium){s+=text(12,18,'Positive lists · queries','ccql-heading');}
 s+='<g data-scope="main-positive-lists">';
 for(const k of ['linear','near-linear','quadratic'])s+='<path d="M'+px(k)+' '+top+'V'+bottom+'" class="ccql-grid"/>';
 for(let i=0;i<2;i++)s+='<path d="M'+left+' '+py(i)+'H'+right+'" class="ccql-grid"/>';
 s+='<path d="M'+left+' '+top+'V'+bottom+'H'+right+'" class="ccql-axis"/>';
 if(detail)s+=text(24,top+3,'Algorithm / guarantee','ccql-axis-title','start','data-axis="y"');
 if(!tiny){
  for(const [k,label]of[['linear','n'],['near-linear','n log n'],['quadratic','n²']])s+=text(px(k),bottom+24,label,'ccql-tick','middle');
  if(detail)s+=text((left+right)/2,bottom+46,'Schematic spacing · no invented exponent','ccql-muted','middle');
  else s+=text((left+right)/2,bottom+44,'Symbolic query cost','ccql-muted','middle','data-axis="x"');
 }
 for(const r of rows){
  const i=r.implementationDerived?1:0,y=py(i),x=px(r.costTo),from=px(r.costFrom),click=focused?' tabindex="0" role="button" aria-pressed="'+(o.selected===r.id)+'"':'';
  s+='<g class="ccql-result ccql-algorithm" data-ccql-result="'+esc(r.id)+'" data-kind="algorithm"'+click+' aria-label="Inspect '+esc(r.algorithmLabel+'; '+r.displayBound+' queries; '+r.qualityLabel)+'">';
  if(i){
   s+='<rect x="'+from+'" y="'+(y-(tiny?3:6))+'" width="'+(x-from)+'" height="'+(tiny?6:12)+'" rx="3" class="ccql-range-fill"/><path data-range="density-upper-bound" d="M'+from+' '+y+'H'+x+'M'+from+' '+(y-8)+'V'+(y+8)+'M'+x+' '+(y-8)+'V'+(y+8)+'" class="ccql-range"/>';
   s+='<circle data-marker="algorithm" data-center-x="'+from+'" data-center-y="'+y+'" cx="'+from+'" cy="'+y+'" r="'+(tiny?2.5:4)+'" fill="var(--green)"/><circle data-marker="algorithm" data-center-x="'+x+'" data-center-y="'+y+'" cx="'+x+'" cy="'+y+'" r="'+(tiny?2.5:4)+'" fill="var(--green)"/>';
  }else{s+='<circle data-marker="algorithm" data-center-x="'+x+'" data-center-y="'+y+'" cx="'+x+'" cy="'+y+'" r="'+(tiny?4:detail?7:5)+'" fill="var(--green)"/>';}
  if(detail){
   s+=text(24,y-7,r.algorithmLabel,'ccql-name')+text(24,y+13,i?'Factor 3 · expected':'Factor C=O(1)','ccql-guarantee')+text(24,y+31,i?'ACN 2008':'w.h.p. · AW 2022','ccql-muted');
   s+=text(i?(from+x)/2:x,y-19,r.displayBound,'ccql-bound','middle');
   s+=text(i?(from+x)/2:x,y+29,i?'0 ≤ m⁺ ≤ n(n−1)/2':'O(n log² n) total time','ccql-muted','middle');
   if(i)s+=text((from+x)/2,y+47,'Density-dependent upper bound · implementation-derived','ccql-fine','middle');
  }else if(medium){
   s+=text(12,y-2,i?'Pivot':'AW 2022','ccql-name')+text(i?(from+x)/2:x,y-12,r.displayBound,'ccql-bound','middle');
   if(w>=400&&h>=240)s+=text(12,y+14,i?'Expected 3':'C · w.h.p.','ccql-guarantee');
  }
  s+='</g>';
 }
 s+='</g>';
 if(canRelated){
  const y=h-77,gap=14,pad=24,cw=(w-2*pad-gap)/2;
  s+='<g data-scope="related-oracles">'+text(pad,y-13,'RELATED · DIFFERENT ACCESS MODELS','ccql-related-title');
  rr.forEach((r,i)=>{
   const x=pad+i*(cw+gap),cy=y+24,color=i?'var(--amber, #9a6226)':'var(--purple, #8064a8)',click=focused?' tabindex="0" role="button" aria-pressed="'+(o.selected===r.id)+'"':'';
   s+='<g class="ccql-related-result" data-ccql-result="'+esc(r.id)+'" data-kind="lower"'+click+' aria-label="Related lower bound: '+esc(r.shortLabel+'; '+r.displayBound+' queries; any finite factor at success at least 99 percent')+'"><rect x="'+x+'" y="'+y+'" width="'+cw+'" height="56" rx="5" class="ccql-related-box"/><path d="M'+(x+1)+' '+(y+7)+'V'+(y+49)+'" stroke="'+color+'" stroke-width="3"/><path data-marker="related-lower" data-center-x="'+(x+16)+'" data-center-y="'+cy+'" d="M'+(x+16)+' '+(cy-5)+'L'+(x+21)+' '+cy+'L'+(x+16)+' '+(cy+5)+'L'+(x+11)+' '+cy+'Z" fill="none" stroke="var(--red)" stroke-width="1.8"/>'+text(x+30,y+24,r.shortLabel+' · '+r.displayBound+' queries','ccql-related-bound')+text(x+30,y+43,'Any finite factor · success ≥99%','ccql-fine')+'</g>';
  });s+='</g>';
 }
 return s+'</svg>';
}
function diagramSVG(a={},b={}){return chart(1000,580,typeof a==='string'?b:a,true);}
function summarySVG(key,w,h,options={}){return chart(w,h,options,false);}
function release(root){for(const i of [...instances])if(!i.root.isConnected||i.root===root)i.destroy();}
function mount(root,key=ID,options={}){
 release(root);
 for(const name of ['StreamingMatching','DynamicMatching','LCAMatching','LocalMatching','MPCMatching','ListQueryMatching'])window[name]?.release(root);
 for(const [id,r]of Object.entries(window.AtlasPairRenderers||{}))if(id!==ID)r.release?.(root);
 const controller=new AbortController();let publication=options.publication||'all',selected=records({publication})[0]?.id;
 const opts=()=>({publication,selected});
 root.classList.add('focus-view','ccql-view');root.classList.toggle('f-embedded',!!options.embedded);root.setAttribute('aria-label','Correlation clustering with positive-neighbor access');
 root.innerHTML='<p class="f-kicker">CORRELATION CLUSTERING × ADJACENCY-LIST QUERIES</p><header class="f-hero"><div><h1>'+esc(data.title)+'</h1><p>Compare the query costs for two explicit-partition algorithms, while keeping their approximation guarantees visible.</p></div></header><div class="ccql-toolbar"><div class="ccql-legend"><span><i class="ccql-key-alg"></i>Algorithm</span><span><i class="ccql-key-setup"></i>Positive-list setup</span><span><i class="ccql-key-lower"></i>Related lower bound · other oracle</span></div><label>Sources <select class="ccql-publication" aria-label="Correlation clustering publication filter"><option value="all">All verified sources</option><option value="published">Published only</option></select></label></div><div class="ccql-scroll" tabindex="0" aria-label="Shared query-cost figure; horizontally scrollable on narrow screens"><div class="ccql-plot"></div></div><div class="ccql-notes"><p><b>What is counted.</b> Each positive-degree or indexed-positive-neighbor query costs O(1). Both algorithms return the complete partition. Total running time appears separately in the theorem inspector.</p><p><b>How to read the band.</b> m⁺ counts positive edges. As 0 ≤ m⁺ ≤ n(n−1)/2, the O(n+m⁺) upper-bound family ranges from linear to quadratic. This is not an exact runtime or a confidence interval.</p><p><b>Guarantees stay distinct.</b> Pivot has expected cost ≤3·OPT. Assadi–Wang gives an unspecified constant approximation with high probability. Its query and time bounds also hold with high probability.</p></div><div class="ccql-records" aria-label="Inspect algorithms"></div><section class="ccql-theorem" aria-live="polite" aria-label="Selected theorem and source"></section><section class="ccql-related"><h2>Related results · other access models</h2><p class="ccql-related-intro">These lower bounds do not apply to positive-neighbor access. They keep their own input assumptions.</p><div class="ccql-related-cards"></div></section><p class="ccql-coverage">'+esc(data.coverage)+'</p>';
 function inspect(){
  const r=[...records(opts()),...related(opts())].find(r=>r.id===selected),host=root.querySelector('.ccql-theorem');
  if(!r){host.innerHTML='<p>No results match this filter.</p>';return;}
  const lower=r.kind==='lower';
  host.innerHTML='<div class="ccql-detail-top"><strong class="'+(lower?'ccql-lower':'ccql-algorithm')+'">'+(lower?'Related lower bound · other oracle':'Algorithm upper bound')+'</strong><span>'+esc(r.shortLabel)+'</span></div><div class="ccql-detail-grid"><div><small>Total queries</small><strong>'+esc(r.queryComplexity)+'</strong></div><div><small>'+(lower?'Required success':'Approximation')+'</small><strong>'+esc(lower?r.probability:r.quality)+'</strong></div><div><small>'+(lower?'Oracle':'Total running time')+'</small><strong>'+esc(lower?r.oracle:r.timeComplexity)+'</strong></div></div>'+(lower?'<p class="ccql-scope-warning">'+esc(r.scopeWarning)+'</p>':'')+'<p><b>Output and graph.</b> '+esc(r.output)+' · '+esc(r.graph)+'</p><p><b>Access.</b> '+esc(r.oracle)+'</p><p><b>Probability.</b> '+esc(r.probability)+' '+esc(r.resourceProbability||'')+'</p>'+(r.implementationDerived?'<p class="ccql-derived"><b>Derived implementation bound.</b> The source theorem proves the expected factor 3. The list-access resource bound follows from the implementation argument below.</p>':'')+'<p>'+esc(r.notes)+'</p><details><summary>Theorem, assumptions and primary source</summary><h3>'+esc(r.title)+'</h3><p>'+esc((r.authors||[]).join(', '))+'</p><p><b>'+esc(r.theorem)+'</b></p><ul>'+r.assumptions.map(a=>'<li>'+esc(a)+'</li>').join('')+'</ul>'+(r.sourceLimit?'<p>'+esc(r.sourceLimit)+'</p>':'')+(r.proofCaution?'<p>'+esc(r.proofCaution)+'</p>':'')+'<p><a href="'+esc(r.sourceUrl)+'" target="_blank" rel="noopener noreferrer">Read primary statement ↗</a> · <a href="'+esc(r.publicationUrl||r.url)+'" target="_blank" rel="noopener noreferrer">Publication ↗</a></p></details>';
 }
 function render(){
  const main=records(opts()),extra=related(opts()),all=[...main,...extra];if(!all.some(r=>r.id===selected))selected=main[0]?.id;
  root.querySelector('.ccql-publication').value=publication;
  root.querySelector('.ccql-plot').innerHTML=diagramSVG(opts());
  root.querySelector('.ccql-records').innerHTML=main.map(r=>'<button type="button" class="ccql-record ccql-algorithm" data-ccql-result="'+esc(r.id)+'" aria-pressed="'+(r.id===selected)+'"><small>'+esc(r.shortLabel)+'</small><strong>'+esc(r.displayBound)+' queries</strong><span>'+esc(r.qualityLabel)+'</span><small>'+esc(r.implementationDerived?'Resource bound: implementation-derived':'Query/time bounds: w.h.p.')+'</small></button>').join('');
  root.querySelector('.ccql-related-cards').innerHTML=extra.map(r=>'<button type="button" class="ccql-record ccql-lower" data-ccql-result="'+esc(r.id)+'" aria-pressed="'+(r.id===selected)+'"><small>Different oracle · '+esc(r.shortLabel)+'</small><strong>'+esc(r.displayBound)+' queries</strong><span>'+esc(r.qualityLabel)+'</span><small>Inspect statement and access assumptions</small></button>').join('');
  inspect();
 }
 function choose(target){const b=target.closest('[data-ccql-result]');if(b){selected=b.dataset.ccqlResult;render();return true;}return false;}
 root.addEventListener('click',e=>choose(e.target),{signal:controller.signal});
 root.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.closest('.ccql-result,.ccql-related-result')){e.preventDefault();choose(e.target);}},{signal:controller.signal});
 root.addEventListener('change',e=>{if(e.target.classList.contains('ccql-publication')){publication=e.target.value;render();options.onPublicationChange?.(publication);}},{signal:controller.signal});
 render();const instance={root,settingKey:ID,redraw:render,destroy(){controller.abort();root.classList.remove('ccql-view');instances.delete(instance);}};instances.add(instance);return instance;
}
window.AtlasPairRenderers=window.AtlasPairRenderers||{};
window.AtlasPairRenderers[ID]={mount,summarySVG,diagramSVG,records,release};
})();
