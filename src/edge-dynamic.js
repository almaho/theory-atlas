(()=>{
'use strict';
const ID='edge-dynamic',data=JSON.parse(document.getElementById('atlas-data').textContent).focus[ID];if(!data)return;
const instances=new Set();let serial=0;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const txt=(x,y,s,cls='',anchor='start')=>'<text x="'+x+'" y="'+y+'" class="'+cls+'" text-anchor="'+anchor+'">'+esc(s)+'</text>';
const allRows=()=>[...data.verifiedRecords,...data.relatedResults].map(r=>({...data.sources[r.sourceId],...r}));
function records(o={}){return allRows().filter(r=>(o.publication!=='published'||r.publicationStatus!=='preprint')&&(!o.family||o.family==='all'||data.groups.find(g=>g.id===r.group)?.family===o.family)&&(!o.palette||o.palette==='all'||r.paletteFamily===o.palette));}
function chart(w,h,o={},focus=false){
 const levels=['overview','compact','detail'],available=w<250||h<150?0:w<640||h<420?1:2,requested=levels.indexOf(o.level),level=focus?'detail':levels[Math.min(available,requested<0?available:requested)],tiny=level==='overview',detail=level==='detail';
 const rows=records(o).filter(r=>!r.relatedOnly),rowsWithPoints=rows.filter(r=>r.placements?.length);
 const groups=data.groups.map(g=>({...g,slots:g.slots.filter(slot=>rowsWithPoints.some(r=>r.placements.some(p=>p.group===g.id&&p.slot===slot)))})).filter(g=>g.slots.length);
 const left=tiny?14:detail?(focus?226:166):85,right=w-(tiny?8:detail?20:10),gap=tiny?10:detail?30:14,pw=(right-left-gap)/2;
 const top=tiny?9:detail?(focus?104:76):43,bottom=h-(tiny?9:detail?(focus?143:126):34),slotCount=groups.reduce((n,g)=>n+g.slots.length,0),pitch=(bottom-top)/Math.max(1,slotCount),slotY={},band={};
 let index=0;for(const g of groups){const y0=top+index*pitch;for(const s of g.slots){slotY[s]=top+(index+.5)*pitch;index++;}band[g.id]={top:y0,bottom:top+index*pitch};}
 const x0=panel=>left+(panel==='recourse'?pw+gap:0);
 const cx=(panel,costClass)=>x0(panel)+(data.figureAxes[panel].x.categories.findIndex(c=>c.id===costClass)+.5)*pw/data.figureAxes[panel].x.categories.length;
 const cls=focus?'edyn-map':'edyn-summary';
 let svg='<svg class="'+cls+'" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="xMidYMid meet" data-detail-level="'+level+'" role="img" aria-label="Dynamic edge coloring: update time and recolorings by graph, palette and update contract"><title>Dynamic edge coloring: two resource views</title><desc>Green circles and squares are algorithms; red diamonds are lower bounds. Cost columns are categorical formula classes, not a universal asymptotic ordering. Shared setup rows keep graph families, palettes and update models separate. Lower bounds are shown together with forest algorithms only when their contracts agree. Empty space means no separate bound recorded.</desc>';
 if(w<32||h<32)return svg+'</svg>';
 if(!groups.length)return svg+(tiny?'':txt(w/2,h/2,'No results match these filters.','edyn-muted','middle'))+'</svg>';
 if(!tiny){svg+=txt(detail?17:9,detail?25:18,'Dynamic edge coloring','edyn-heading');if(detail)svg+=txt(17,45,'One coloring, two costs · common setup rows','edyn-muted');}
 for(const panel of ['time','recourse']){
  const a=x0(panel),b=a+pw,cat=data.figureAxes[panel].x.categories;
  svg+='<g data-panel="'+panel+'" data-axis-type="categorical">';
  if(!tiny)svg+=txt(a,detail?(focus?82:64):35,panel==='time'?'Update time':'Recolored edges','edyn-panel-title');
  for(let i=0;i<cat.length;i++){
   const x=a+(i+.5)*pw/cat.length;
   svg+='<path d="M'+x+' '+top+'V'+bottom+'" class="edyn-grid"/>';
   if(detail){const short=cat[i].label,yy=bottom+16+(panel==='time'&&i%2?12:0);svg+=txt(x,yy,short,'edyn-tick','middle');}
  }
  svg+='<path d="M'+a+' '+top+'V'+bottom+'H'+b+'" class="edyn-axis"/>';
  if(detail)svg+=txt((a+b)/2,bottom+45,'Categorical formula classes','edyn-axis-title','middle');
  else if(!tiny)svg+=txt((a+b)/2,bottom+19,'formula classes','edyn-axis-title','middle');
  svg+='</g>';
 }
 for(const g of groups){
  const bandY=band[g.id],mid=(bandY.top+bandY.bottom)/2,color='var(--edyn-'+g.family+')';
  svg+='<path d="M'+(left-7)+' '+(bandY.top+2)+'V'+(bandY.bottom-2)+'" stroke="'+color+'" stroke-width="'+(tiny?2:3)+'" opacity=".7"/>';
  svg+='<path d="M'+left+' '+bandY.top+'H'+right+'" class="edyn-row-line"/>';
  if(detail){svg+=txt(left-15,mid-3,g.label,'edyn-setup edyn-'+g.family,'end')+txt(left-15,mid+11,g.palette,'edyn-palette','end');}
  else if(!tiny)svg+=txt(left-13,mid+3,g.short,'edyn-short edyn-'+g.family,'end');
 }
 const sorted=[...rowsWithPoints].sort((a,b)=>(a.kind==='lower')-(b.kind==='lower'));
 for(const row of sorted)for(const p of row.placements){
  const lower=row.kind==='lower',x=cx(p.panel,p.costClass),y=slotY[p.slot],r=tiny?2.2:detail?(focus?4.6:3.8):2.6,stroke=lower?'var(--red)':'var(--green)',interactive=focus?' tabindex="0" role="button" aria-pressed="'+(row.id===o.selected)+'"':'';
  svg+='<g class="edyn-result edyn-'+(lower?'lower':'upper')+'" data-edyn-result="'+esc(row.id)+'" data-panel="'+p.panel+'" data-group="'+p.group+'" data-slot="'+p.slot+'" data-cost-class="'+p.costClass+'"'+interactive+' aria-label="Inspect '+esc(row.displayBound)+'"><title>'+esc(row.displayBound+'; '+row.graph+'; '+row.probability)+'</title>';
  if(row.id===o.selected)svg+='<circle cx="'+x+'" cy="'+y+'" r="'+(r+5)+'" fill="none" stroke="var(--ink)" opacity=".4"/>';
  if(lower){const z=r+3;svg+='<path data-marker="lower" data-center-x="'+x+'" data-center-y="'+y+'" d="M'+x+' '+(y-z)+'L'+(x+z)+' '+y+'L'+x+' '+(y+z)+'L'+(x-z)+' '+y+'Z" fill="none" stroke="'+stroke+'" stroke-width="1.6"/>';}
  else if(row.randomized)svg+='<circle data-marker="algorithm" data-center-x="'+x+'" data-center-y="'+y+'" cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+stroke+'"/>';
  else svg+='<rect data-marker="algorithm" data-center-x="'+x+'" data-center-y="'+y+'" x="'+(x-r)+'" y="'+(y-r)+'" width="'+(2*r)+'" height="'+(2*r)+'" rx=".6" fill="'+stroke+'"/>';
  if(detail&&!p.hideLabel){
   const rightward=p.labelSide?p.labelSide==='right':x<x0(p.panel)+pw*.5,fx=x+(rightward?9:-9),anchor=rightward?'start':'end';
   svg+=txt(fx,y+3,p.label,'edyn-formula edyn-'+(lower?'lower':'upper'),anchor);
   const tagX=Math.max(x0(p.panel)+3,Math.min(x0(p.panel)+pw-3,x)),tagAnchor=tagX<x0(p.panel)+pw*.3?'start':tagX>x0(p.panel)+pw*.7?'end':'middle';
   svg+=txt(tagX,y+(focus?18:13),p.tag,'edyn-tag',tagAnchor);
  }
  svg+='</g>';
 }
 if(detail){
  const ly=bottom+65;
  svg+='<circle cx="20" cy="'+(ly-3)+'" r="3.7" fill="var(--green)"/>'+txt(29,ly,'O upper bound','edyn-legend');
  svg+='<path d="M145 '+(ly-9)+'L151 '+(ly-3)+'L145 '+(ly+3)+'L139 '+(ly-3)+'Z" fill="none" stroke="var(--red)" stroke-width="1.5"/>'+txt(156,ly,'Ω lower bound','edyn-legend');
  svg+=txt(278,ly,'□ deterministic   ● randomized','edyn-legend');
  svg+=txt(17,ly+19,'2019 and Nibble 2024 need high Δ.  Blank = no separate resource bound recorded.','edyn-muted');
  svg+=txt(17,ly+36,'M=min{Δ/c, log_(Δ+c−1)n};  B=C/Δ−1/φ;  Λ=log((Δ+C)/(Δ−C)).','edyn-muted');
  svg+=txt(17,ly+52,'Classes are not a universal ranking as Δ and ε vary. Select a result for its full regime.','edyn-muted');
 }
 return svg+'</svg>';
}
function diagramSVG(a={},b={}){return chart(1120,800,typeof a==='string'?b:a,true);}
function summarySVG(key,w,h,options={}){return chart(w,h,options,false);}
function release(root){for(const i of instances)if(!i.root.isConnected||i.root===root)i.destroy();}
function mount(root,key=ID,options={}){
 release(root);for(const name of ['StreamingMatching','DynamicMatching','LCAMatching','LocalMatching','MPCMatching','ListQueryMatching'])window[name]?.release(root);
 for(const [id,r] of Object.entries(window.AtlasPairRenderers||{}))if(id!==ID)r.release?.(root);
 const controller=new AbortController(),uid='edyn-'+(++serial);let publication=options.publication||'all',family='all',palette='all',selected=records({publication})[0]?.id;
 const opts=()=>({publication,family,palette,selected});root.classList.add('focus-view','edyn-view');root.classList.toggle('f-embedded',!!options.embedded);root.setAttribute('aria-label','Dynamic edge coloring algorithms and lower bounds');
 root.innerHTML='<p class="f-kicker">EDGE COLORING × DYNAMIC</p><header class="f-hero"><div><h1>The cost of changing an edge</h1><p>Update time and recolorings share the same graph, palette and update-contract rows.</p></div></header><div class="edyn-toolbar"><div class="edyn-legend" id="'+uid+'"><span><i class="edyn-key-alg"></i>Algorithm</span><span><i class="edyn-key-lower"></i>Lower bound</span><span class="edyn-general">General graphs</span><span class="edyn-sparse">Bounded arboricity</span><span class="edyn-forest">Forests</span></div><div class="edyn-filters"><label>Sources <select class="edyn-publication" aria-label="Dynamic edge coloring publication filter"><option value="all">All sources</option><option value="published">Published only</option></select></label><label>Graphs <select class="edyn-family" aria-label="Dynamic edge coloring graph filter"><option value="all">All setups</option><option value="general">General</option><option value="sparse">Bounded arboricity</option><option value="forest">Forests</option></select></label><label>Palette <select class="edyn-palette-filter" aria-label="Dynamic edge coloring palette filter"><option value="all">All palettes</option><option value="near">Near Δ</option><option value="large">Large slack</option><option value="sparse">Δ + O(α)</option><option value="forest">Forest Δ+c</option></select></label></div></div><div class="edyn-scroll" tabindex="0" aria-label="Aligned resource panels; scroll horizontally on narrow screens"><div class="edyn-plot"></div></div><div class="edyn-notes"><p><b>Read the columns as formula classes.</b> They are categorical, not one universal asymptotic order: n, Δ and ε can vary independently. Green formulas suppress O(·); red diamonds denote Ω(·). Paired symbols show comparable bounds, with expectation and amortization stated below each point.</p><p><b>Recolorings can be less than one.</b> Recourse counts changes to existing edges, excluding the first color of a new edge. An amortized 1/Δ recoloring bound does not give subconstant update time. Unrecorded time or recourse bounds remain blank.</p><p><b>Forest lower bounds.</b> Incremental Ω(1/Δ) is universal for fixed c. At c=0, fully dynamic log-base-(Δ−1) n amortized recourse is tight. For fixed c&gt;0, the universal lower is only Ω(1); DistMaint’s parameter-dependent cost is not asserted optimal.</p></div><div class="edyn-notation"><b>Notation.</b> L=log⁺n, A=log⁺α, D=log⁺Δ, with max subscripts denoting maxima over the update sequence; log⁺x=max{1,log x}. α_UF is inverse Ackermann, unrelated to arboricity α. Õε means Õ with log(1/ε) dependence. Small-degree near-Δ palettes use the ceiling convention.</div><section class="edyn-theorem" aria-live="polite" aria-label="Selected dynamic edge coloring theorem"></section><h2 class="edyn-section-title">Inspect the guarantees</h2><div class="edyn-records" aria-label="Dynamic edge coloring results"></div><section class="edyn-related"><h2 class="edyn-section-title">Related lower bounds with narrower scope</h2><p>These do not restrict every dynamic algorithm in the main figure.</p><div class="edyn-related-records"></div></section><p class="edyn-coverage">'+esc(data.coverage)+'</p>';
 function inspect(){
  const r=records(opts()).find(q=>q.id===selected),el=root.querySelector('.edyn-theorem');if(!r){el.innerHTML='<p>No results match these filters.</p>';return;}
  el.innerHTML='<div class="edyn-detail-top"><strong class="edyn-'+(r.kind==='lower'?'lower':'upper')+'">'+(r.relatedOnly?'Related scoped lower bound':r.kind==='lower'?'Universal lower bound':'Algorithm guarantee')+'</strong><span>'+esc(r.venue)+'</span></div><div class="edyn-detail-grid"><div><small>Update time</small><strong>'+esc(r.updateTime||'No separate time bound recorded')+'</strong></div><div><small>Recolored existing edges</small><strong>'+esc(r.recourse||'No separate recourse bound recorded')+'</strong></div></div><p><b>Palette.</b> '+esc(r.palette||r.quality)+'</p><p><b>Graph / updates.</b> '+esc(r.graph)+'</p><p><b>Output.</b> '+esc(r.output)+'</p><p><b>Probability / cost quantifier.</b> '+esc(r.probability)+'</p><p>'+esc(r.notes)+'</p><details><summary>Theorem, exact regime and primary source</summary><h3>'+esc(r.title)+'</h3><p>'+esc((r.authors||[]).join(', '))+'</p><p><b>'+esc(r.theorem)+'</b></p><ul>'+r.assumptions.map(a=>'<li>'+esc(a)+'</li>').join('')+'</ul><p><a href="'+esc(r.sourceUrl||r.fullTextUrl||r.url)+'" target="_blank" rel="noopener noreferrer">Read primary statement ↗</a> · <a href="'+esc(r.url)+'" target="_blank" rel="noopener noreferrer">Publication ↗</a></p></details>';
 }
 const card=r=>'<button class="edyn-record edyn-'+(r.kind==='lower'?'lower':'upper')+'" type="button" data-edyn-result="'+esc(r.id)+'" aria-pressed="'+(r.id===selected)+'"><span>'+esc(r.relatedOnly?'Related · '+r.scope:r.kind==='lower'?'Lower bound':'Algorithm')+'</span><strong>'+esc(r.displayBound)+'</strong><small>'+esc(r.graph+' · '+r.venue)+'</small></button>';
 function render(){
  const rr=records(opts());if(!rr.some(r=>r.id===selected))selected=rr[0]?.id;
  root.querySelector('.edyn-publication').value=publication;root.querySelector('.edyn-family').value=family;root.querySelector('.edyn-palette-filter').value=palette;
  root.querySelector('.edyn-plot').innerHTML=diagramSVG(opts());root.querySelector('.edyn-records').innerHTML=rr.filter(r=>!r.relatedOnly).map(card).join('');
  const related=rr.filter(r=>r.relatedOnly);root.querySelector('.edyn-related').hidden=!related.length;root.querySelector('.edyn-related-records').innerHTML=related.map(card).join('');inspect();
 }
 root.addEventListener('click',e=>{const el=e.target.closest('[data-edyn-result]');if(el){selected=el.dataset.edynResult;render();}},{signal:controller.signal});
 root.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const el=e.target.closest('.edyn-result');if(el){e.preventDefault();selected=el.dataset.edynResult;render();root.querySelector('.edyn-result[data-edyn-result="'+selected+'"]')?.focus();}},{signal:controller.signal});
 root.addEventListener('change',e=>{if(e.target.classList.contains('edyn-publication')){publication=e.target.value;render();options.onPublicationChange?.(publication);}else if(e.target.classList.contains('edyn-family')){family=e.target.value;render();}else if(e.target.classList.contains('edyn-palette-filter')){palette=e.target.value;render();}},{signal:controller.signal});
 render();const instance={root,settingKey:ID,redraw:render,destroy(){controller.abort();root.classList.remove('edyn-view');instances.delete(instance);}};instances.add(instance);return instance;
}
window.AtlasPairRenderers=window.AtlasPairRenderers||{};window.AtlasPairRenderers[ID]={mount,summarySVG,diagramSVG,records,release};
})();
