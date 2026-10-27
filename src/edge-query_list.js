(()=>{
'use strict';
const ID='edge-query_list',data=JSON.parse(document.getElementById('atlas-data').textContent).focus[ID];if(!data)return;
const instances=new Set();let serial=0;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const txt=(x,y,s,cls='',anchor='start')=>'<text x="'+x+'" y="'+y+'" class="'+cls+'" text-anchor="'+anchor+'">'+esc(s).replace(/\^\{([^}]+)\}/g,'<tspan class="eql-exp">$1</tspan>')+'</text>';
const norm=(a={},b={})=>typeof a==='string'?{...b,key:a}:a||{};
function records(o={}){return [...data.verifiedRecords.map(r=>({...data.sources[r.sourceId],...r})),...data.derivedBounds].filter(r=>r.derived||((o.publication!=='published'||r.publicationStatus!=='preprint')&&(!o.palette||o.palette==='all'||r.paletteCategory===o.palette)&&(!o.randomness||o.randomness==='all'||(o.randomness==='deterministic'?!r.randomized:r.randomized))));}
function chart(w,h,o={},focus=false){
 const levels=['overview','compact','detail'],max=w<250||h<150?0:w<640||h<410?1:2,req=levels.indexOf(o.level),level=focus?'detail':levels[Math.min(max,req<0?max:req)],tiny=level==='overview',detail=level==='detail';
 const rows=records(o).filter(r=>!r.derived),palettes=data.palettes.filter(p=>!o.palette||o.palette==='all'||p.id===o.palette),l=tiny?12:detail?(focus?205:155):64,r=w-(tiny?8:detail?24:12),t=tiny?h*.23:detail?h*.21:70,b=tiny?h*.80:detail?h*.59:h-77,qy=tiny?h*.46:detail?h*.36:110;
 const step=(r-l)/palettes.length,x=id=>l+(palettes.findIndex(p=>p.id===id)+.5)*step;
 let s='<svg class="'+(focus?'eql-map':'eql-summary')+'" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="xMidYMid meet" data-detail-level="'+level+'" data-resource="oracle_queries" role="img" aria-label="Adjacency-list edge coloring: exact n plus 2m graph queries for every displayed palette; computation is in theorem details"><title>One scan, several palettes</title><desc>All seven supplied implementations make n degree calls and 2m indexed neighbor calls. Green markers share one query-cost row. Markers within a palette category are separated horizontally only to select their source. No oracle-query lower bound is verified. Computation and output-time bounds are inspectable details, not this axis.</desc>';
 if(w<32||h<32)return s+'</svg>';
 if(!rows.length)return s+(tiny?'':txt(w/2,h/2,'No algorithms match these filters.','eql-muted','middle'))+'</svg>';
 if(!tiny){s+=txt(detail?18:9,detail?28:18,'One scan, several palettes','eql-heading');if(detail)s+=txt(18,50,'Explicit edge coloring · degree + indexed-neighbor access','eql-muted');}
 s+='<g data-panel="queries" data-axis-type="symbolic"><path d="M'+l+' '+t+'V'+b+'H'+r+'" class="eql-axis"/><path d="M'+l+' '+qy+'H'+r+'" stroke="var(--green)" stroke-width="1.5" opacity=".45"/>';
 if(!tiny){s+=txt(detail?20:8,detail?t-12:52,'Oracle queries','eql-axis-title');s+=txt(l-12,qy+5,'n + 2m','eql-query-axis','end');if(detail)s+=txt(l-12,qy+26,'exact scan','eql-muted','end');}
 for(const p of palettes){
  const xx=x(p.id),members=rows.filter(row=>row.paletteCategory===p.id);
  s+='<path d="M'+xx+' '+t+'V'+b+'" class="eql-grid"/>';
  if(!tiny){s+=txt(xx,b+(detail?26:20),p.label,'eql-palette eql-setup-'+p.id,'middle');if(detail)s+=txt(xx,b+46,p.description,'eql-palette-sub','middle');}
  members.forEach((row,i)=>{
   const gap=tiny?Math.min(4,step/6):detail?Math.min(20,step/5):Math.min(8,step/5),px=xx+(i-(members.length-1)/2)*gap,rad=tiny?2:detail?5:3;
   const interactive=focus?' tabindex="0" role="button" aria-pressed="'+(row.id===o.selected)+'"':'';
   s+='<g class="eql-result" data-eql-result="'+esc(row.id)+'" data-palette="'+p.id+'" data-query-cost="n-plus-2m"'+interactive+' aria-label="Inspect '+esc(row.shortName+'; exactly n+2m graph queries; '+row.palette+' colors')+'"><title>'+esc(row.shortName+' · '+row.palette+' colors · Exactly n+2m graph queries')+'</title>';
   s+='<circle cx="'+px+'" cy="'+qy+'" r="'+(rad+4)+'" fill="var(--eql-'+p.id+')" opacity=".18"/>';
   if(row.id===o.selected)s+='<circle cx="'+px+'" cy="'+qy+'" r="'+(rad+7)+'" fill="none" stroke="var(--ink)" opacity=".5"/>';
   if(row.randomized)s+='<circle data-marker="algorithm" data-center-x="'+px+'" data-center-y="'+qy+'" cx="'+px+'" cy="'+qy+'" r="'+rad+'" fill="var(--green)"/>';
   else s+='<rect data-marker="algorithm" data-center-x="'+px+'" data-center-y="'+qy+'" x="'+(px-rad)+'" y="'+(qy-rad)+'" width="'+2*rad+'" height="'+2*rad+'" rx=".5" fill="var(--green)"/>';
   if(detail&&members.length>1)s+=txt(px,qy-16,String(i+1),'eql-query-index','middle');
   s+='</g>';
   if(detail){const label=({'edge-query-vizing-2025-enumerated':'STOC 2025','edge-query-density-2024-enumerated':'ESA 2024','edge-query-vizing2024-mnthird':'FOCS 2024','edge-query-vizing2025-mnfourth':'SODA 2025','edge-query-near-vizing-2025-enumerated':'Near Vizing · 2025','edge-query-nearlinear-2026-enumerated':'Bernshteyn–Dhawan','query-adjacency-list-greedy-baseline':'Greedy'})[row.id]||row.shortName;s+=txt(xx,b+69+i*17,(members.length>1?(i+1)+' · ':'')+label,'eql-query-source','middle');}
  });
 }
 s+='</g>';
 if(detail){
  s+=txt(18,h-66,'Green: algorithm · circles: randomized coloring · square: deterministic coloring','eql-legend');
  s+=txt(18,h-45,'Every scan asks n degrees and reads 2m neighbor entries. Palette positions are categorical.','eql-muted');
  s+=txt(18,h-24,'No oracle-query lower bound verified. Computation and output costs are in theorem details.','eql-muted');
 }else if(!tiny){
  s+=txt(w/2,h-30,'Same scan: n degrees + 2m neighbors','eql-muted','middle');
  s+=txt(w/2,h-10,'No reviewed query lower bound','eql-legend','middle');
 }
 return s+'</svg>';
}
function diagramSVG(a={},b={}){const o=norm(a,b);return chart(o.width||1060,o.height||620,o,true);}
function summarySVG(key,w,h,options={}){return chart(w,h,{...options,key},false);}
function release(root){for(const i of instances)if(!i.root.isConnected||i.root===root)i.destroy();}
function mount(root,key=ID,options={}){
 release(root);for(const name of ['StreamingMatching','DynamicMatching','LCAMatching','LocalMatching','MPCMatching','ListQueryMatching'])window[name]?.release(root);for(const [id,r] of Object.entries(window.AtlasPairRenderers||{}))if(id!==ID)r.release?.(root);
 const controller=new AbortController(),uid='eql-'+(++serial);let publication=options.publication||'all',palette='all',randomness='all',selected='edge-query-vizing-2025-enumerated';
 const opts=()=>({key,publication,palette,randomness,selected});root.classList.add('focus-view','eql-view');root.classList.toggle('f-embedded',!!options.embedded);root.setAttribute('aria-label','Adjacency-list edge coloring query guarantees');
 root.innerHTML='<p class="f-kicker">EDGE COLORING × ADJACENCY-LIST QUERIES</p><header class="f-hero"><div><h1>Read the graph once</h1><p>Compare palette guarantees at the same exact graph-query cost. Inspect a source for its computation time.</p></div></header><div class="eql-toolbar"><div class="eql-legend" id="'+uid+'"><span><i class="eql-key-alg"></i>Algorithm</span><span>No reviewed query lower bound</span><span>Setup colors identify palette categories</span></div><div class="eql-filters"><label>Sources <select class="eql-publication" aria-label="Edge list publication filter"><option value="all">All sources</option><option value="published">Published only</option></select></label><label>Palette <select class="eql-palette-filter" aria-label="Edge list palette filter"><option value="all">All palettes</option>'+data.palettes.map(p=>'<option value="'+p.id+'">'+esc(p.label)+'</option>').join('')+'</select></label><label>Algorithms <select class="eql-randomness" aria-label="Edge list randomness filter"><option value="all">All algorithms</option><option value="randomized">Randomized</option><option value="deterministic">Deterministic</option></select></label></div></div><div class="eql-scroll" tabindex="0" aria-label="Palette and query-cost figure; scroll horizontally on narrow screens"><div class="eql-plot"></div></div><div class="eql-notes"><p><b>Oracle accounting.</b> Ask n degrees, then read each of the 2m adjacency entries. All seven implementations retain the graph before coloring. This query upper bound is not an optimality claim.</p><p><b>Reading the figure.</b> Every marker has the same query cost. Within a palette category, horizontal offsets only separate sources. The palette formulas do not have a universal numerical ordering.</p><p><b>Further costs.</b> Select a result for its computation time, total time and probability guarantee. The separate output-cost proof is available below.</p></div><section class="eql-theorem" aria-live="polite" aria-label="Selected adjacency-list coloring guarantee"></section><h2 class="eql-section-title">Inspect each guarantee</h2><div class="eql-records" aria-label="Source statements and elementary output proof"></div><p class="eql-coverage">'+esc(data.coverage)+'</p>';
 function inspect(){
  const row=records(opts()).find(r=>r.id===selected),el=root.querySelector('.eql-theorem');if(!row){el.innerHTML='<p>No result selected.</p>';return;}
  if(row.derived){el.innerHTML='<div class="eql-detail-top"><strong class="eql-lower">Output cost: Ω(m)</strong><span>Elementary atlas derivation · time only</span></div><p>'+esc(row.proof)+'</p><p><b>Scope.</b> '+esc(row.notes)+'</p><ul>'+row.assumptions.map(a=>'<li>'+esc(a)+'</li>').join('')+'</ul>';return;}
  el.innerHTML='<div class="eql-detail-top"><strong class="eql-upper">'+esc(row.shortName)+'</strong><span>'+esc(row.venue)+'</span></div><div class="eql-detail-grid"><div><small>External graph queries</small><strong>'+esc(row.queryComplexity)+'</strong></div><div><small>Post-scan computation</small><strong>'+esc(row.computation)+'</strong></div><div><small>Palette guarantee</small><strong>'+esc(row.palette)+'</strong></div></div><p><b>Total time.</b> '+esc(row.totalTime)+'</p><p><b>Output.</b> '+esc(row.output)+'</p><p><b>Probability.</b> '+esc(row.probability)+'</p><p>'+esc(row.notes)+'</p><details><summary>Theorem, assumptions, derivation and primary source</summary><h3>'+esc(row.title)+'</h3><p>'+esc((row.authors||[]).join(', '))+'</p><p><b>'+esc(row.theorem)+'</b></p>'+(row.exactComputation?'<p>'+esc(row.exactComputation)+'</p>':'')+'<ul>'+row.assumptions.map(a=>'<li>'+esc(a)+'</li>').join('')+'</ul><p><b>Access.</b> '+esc(row.oracle)+'</p><p><b>Scan derivation.</b> '+esc(row.queryDerivation)+'</p><p>'+esc(row.memory)+'</p><p><a href="'+esc(row.sourceUrl)+'" target="_blank" rel="noopener noreferrer">Read primary statement ↗</a> · <a href="'+esc(row.publicationUrl||row.url)+'" target="_blank" rel="noopener noreferrer">Publication ↗</a></p></details>';
 }
 function render(){
  const rr=records(opts());if(!rr.some(r=>r.id===selected))selected=rr.find(r=>!r.derived)?.id||rr[0]?.id;
  root.querySelector('.eql-publication').value=publication;root.querySelector('.eql-palette-filter').value=palette;root.querySelector('.eql-randomness').value=randomness;root.querySelector('.eql-plot').innerHTML=diagramSVG(opts());
  root.querySelector('.eql-records').innerHTML=rr.map(r=>'<button type="button" class="eql-record eql-'+(r.derived?'lower':'upper')+'" data-eql-result="'+esc(r.id)+'" aria-pressed="'+(r.id===selected)+'"><span>'+esc(r.derived?'Elementary output-time derivation':r.shortName)+'</span><strong>'+esc(r.derived?r.displayBound:r.queryComplexity)+'</strong><small>'+esc(r.derived?'No oracle-query lower bound claimed':r.palette+' colors · '+r.shortTag)+'</small></button>').join('');inspect();
 }
 root.addEventListener('click',e=>{const el=e.target.closest('[data-eql-result]');if(el){selected=el.dataset.eqlResult;render();}},{signal:controller.signal});
 root.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const el=e.target.closest('.eql-result');if(el){e.preventDefault();selected=el.dataset.eqlResult;render();root.querySelector('.eql-result[data-eql-result="'+selected+'"]')?.focus();}},{signal:controller.signal});
 root.addEventListener('change',e=>{if(e.target.classList.contains('eql-publication')){publication=e.target.value;render();options.onPublicationChange?.(publication);}else if(e.target.classList.contains('eql-palette-filter')){palette=e.target.value;render();}else if(e.target.classList.contains('eql-randomness')){randomness=e.target.value;render();}},{signal:controller.signal});
 render();const instance={root,settingKey:ID,redraw:render,destroy(){controller.abort();root.classList.remove('eql-view');instances.delete(instance);}};instances.add(instance);return instance;
}
window.AtlasPairRenderers=window.AtlasPairRenderers||{};window.AtlasPairRenderers[ID]={mount,summarySVG,diagramSVG,records,release};
})();
