/* A shared approximation coordinate system for the correlation-clustering row. */
(()=>{
'use strict';
const payload=JSON.parse(document.getElementById('atlas-data').textContent),config=payload.ccComparison;
if(!config)return;
const instances=new Set(),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const titles={pure:'Disagreements · no additive error',additive:'Disagreements · additive error allowed',agreement:'Agreements · separate objective'};
const colors={pure:'#6ca9d2',additive:'#b18acc',agreement:'#d3ae69'};
const tx=(x,y,s,cls='',anchor='start')=>'<text x="'+x+'" y="'+y+'" class="ccx-'+cls+'" text-anchor="'+anchor+'">'+esc(s)+'</text>';
const n=x=>Math.round(x*1000)/1000;
function idFor(key){return Object.keys(config.pairs).find(id=>key===id||key.startsWith(id+'-'));}
function records(key,o={}){
 const id=idFor(key),pair=config.pairs[id];if(!pair)return[];
 const data=payload.focus[id],by=new Map(data.verifiedRecords.map(r=>[r.id,{...data.sources[r.sourceId],...r}]));
 return pair.records.map(meta=>({...by.get(meta.id),comparison:meta})).filter(r=>o.publication!=='published'||r.publicationStatus!=='preprint').filter(r=>id!=='cc-stream'||(key.endsWith('-value')?r.panel==='value':r.panel==='partition'));
}
function factor(meta){if(meta.base==null)return null;const v=meta.base+(meta.epsilonCoefficient||0)*config.epsilon;return meta.reciprocal?1/v:v;}
function geometry(key,w,h,o={}){
 const capacity=w<300||h<200?0:w<650||h<450?1:2,names=['overview','compact','detail'],requested=names.indexOf(o.level);
 const level=o.focus?'detail':names[Math.min(capacity,requested<0?capacity:requested)],tiny=level==='overview',rich=level==='detail';
 const rows=records(key,o),placed=rows.filter(r=>r.comparison.group!=='symbolic'),symbolic=rows.filter(r=>r.comparison.group==='symbolic');
 const groups=['pure','additive','agreement'].filter(group=>placed.some(r=>r.comparison.group===group));
 const left=w*.36,right=w*.94,top=tiny?7:rich?51:29,bottom=h-(tiny?13:rich?44:29),symbolHeight=symbolic.length?(o.focus?38+symbolic.length*36:tiny?17:rich?60:37):0;
 const usable=bottom-top-symbolHeight,gap=tiny?5:rich?31:18,total=placed.length||1;
 let y=top;const panels=[],points=[];
 for(const group of groups){
  const rr=placed.filter(r=>r.comparison.group===group),ph=(usable-gap*(groups.length-1))*rr.length/total;
  const titleSpace=tiny?0:rich?23:14;
  const panel={group,top:y,bottom:y+ph,rows:rr};panels.push(panel);
  rr.forEach((r,i)=>{const a=factor(r.comparison);points.push({id:r.id,row:r,alpha:a,x:left+(a-1)/3*(right-left),y:y+titleSpace+(ph-titleSpace)*(i+.5)/rr.length});});y+=ph+gap;
 }
 return{w,h,level,tiny,rich,rows,panels,points,symbolic,left,right,top,bottom,symbolHeight,symbolTop:bottom-symbolHeight+8,px:a=>left+(a-1)/3*(right-left)};
}
function mark(p,o,size){const r=p.row,lower=r.kind==='lower',meta=r.comparison;
 const attrs=' data-ccx-result="'+esc(r.id)+'" data-kind="'+(lower?'lower':'upper')+'" data-group="'+meta.group+'" data-alpha="'+n(p.alpha)+'" data-center-x="'+n(p.x)+'" data-center-y="'+n(p.y)+'"';
 const shape=lower?'<path d="M'+n(p.x)+' '+n(p.y-size)+'l'+size+' '+size+' -'+size+' '+size+' -'+size+' -'+size+'Z"/>':'<circle cx="'+n(p.x)+'" cy="'+n(p.y)+'" r="'+size+'"/>';
 return '<g class="ccx-point '+(lower?'ccx-lower':'ccx-upper')+'"'+attrs+((o.focus||o.interactive)?' role="button" tabindex="0" aria-label="Inspect '+esc(r.shortLabel||r.id)+'"':'')+'><title>'+esc((r.shortLabel||r.id)+'; '+r.quality+'; '+r.displayBound+'; '+meta.scope+(meta.residual?'; point shows leading term; '+meta.residual:''))+'</title>'+shape+(meta.residual?'<path class="ccx-residual" d="M'+n(p.x+size+2)+' '+n(p.y)+'h8m-3 -3l3 3 -3 3"/>':'')+'</g>';
}
function renderSVG(key,w,h,o={}){
 const g=geometry(key,w,h,o),{tiny,rich,left,right,px}=g,pair=config.pairs[idFor(key)];
 let s='<svg class="ccx-figure" viewBox="0 0 '+w+' '+h+'" data-detail-level="'+g.level+'" data-shared-alpha-min="1" data-shared-alpha-max="4" ' + ((o.focus||o.interactive)?'role="group"':'role="img"') + ' aria-label="'+esc(pair.title+' correlation clustering: shared approximation factor 1 to 4; smaller is better. Rows identify resource and setup, not a numeric cost scale.')+'"><title>Shared approximation scale · '+esc(pair.title)+'</title><desc>Pure disagreements, additive-error disagreements, and maximum agreements are separate panels. Agreement factors are reciprocals of the source retained fractions. Red marks are scoped lower bounds: resource lower bounds at the displayed target, or competitive-factor barriers in Online. Unspecified and off-scale factors have no numerical coordinate. Epsilon reference is 1/8; no common resource budget is claimed.</desc>';
 if(!tiny)s+=tx(12,rich?26:16,'α · smaller is better · same scale across settings','heading');
 const numericBottom=g.bottom-g.symbolHeight-(g.symbolic.length?6:0);
 for(const a of[1,2,3,4]){
  const x=px(a);s+='<path class="ccx-grid" d="M'+n(x)+' '+g.top+'V'+numericBottom+'"/>';
  if(!tiny){s+=tx(x,h-11,String(a)+(rich&&a===1?' · optimal':''),'tick','middle');if(o.focus)s+=tx(x,g.top-8,String(a),'tick','middle');}
 }
 for(const panel of g.panels){
  const color=colors[panel.group];
  s+='<g data-panel="'+panel.group+'"><path d="M7 '+panel.top+'V'+panel.bottom+'" stroke="'+color+'" stroke-width="'+(tiny?3:4)+'"/>';
  if(!tiny)s+=tx(16,panel.top+(rich?12:9),rich?titles[panel.group]:({pure:'Pure',additive:'+ additive error',agreement:'Agreements'})[panel.group],'panel');
  for(const p of g.points.filter(p=>p.row.comparison.group===panel.group)){
   const r=p.row,m=r.comparison;
   s+='<path class="ccx-row-guide" d="M'+left+' '+n(p.y)+'H'+right+'"/>'+mark(p,o,tiny?2.4:rich?5:3.5);
   if(rich){
    const resource=m.resourceLabel||r.displayBound||r.bound;
    const label=resource.length>44?resource.slice(0,42)+'…':resource;
    const showScope=o.focus||(panel.bottom-panel.top-23)/panel.rows.length>=32;
    s+=tx(18,p.y+(showScope?-5:3),label,'cost');if(showScope)s+=tx(18,p.y+11,m.scope||r.setup||'','scope');
    const labelRight=p.x<(left+right)/2,labelX=p.x+(labelRight?12:-12),anchor=labelRight?'start':'end';
    s+=tx(labelX,p.y-7,m.label||String(n(p.alpha)),'factor',anchor);
    if(o.focus)s+=tx(labelX,p.y+12,r.shortLabel||r.algorithmLabel||r.sourceLabel||'Inspect source','credit',anchor);
   }
  }
  s+='</g>';
 }
 if(g.symbolic.length){
  s+='<g data-panel="unpositioned" data-unpositioned="true"><path class="ccx-divider" d="M8 '+g.symbolTop+'H'+(w-8)+'"/>';
  if(!tiny)s+=tx(16,g.symbolTop+14,rich?'Other factors · no numerical placement':'Other factors · unpositioned','scope');
  g.symbolic.forEach((r,i)=>{
   const y=o.focus?g.symbolTop+36+i*36:g.symbolTop+(tiny?8:29),x=o.focus?22:16+i*13,lower=r.kind==='lower';
   s+='<g data-ccx-result="'+esc(r.id)+'" data-unpositioned="true" class="ccx-point '+(lower?'ccx-lower':'ccx-upper')+'"'+((o.focus||o.interactive)?' tabindex="0" role="button"':'')+'><title>'+esc(r.comparison.label+'; '+r.displayBound+'; '+r.comparison.scope)+'</title>'+(lower?'<path d="M'+x+' '+(y-3)+'l3 3 -3 3 -3 -3Z"/>':'<circle cx="'+x+'" cy="'+y+'" r="3"/>');
   if(o.focus)s+=tx(36,y+4,r.comparison.label+' · '+r.displayBound+' · '+r.comparison.scope,'scope');
   s+='</g>';
  });
  s+='</g>';
 }
 if(!tiny)s+='<path class="ccx-axis" d="M'+left+' '+(h-27)+'H'+right+'"/>';
 return s+'</svg>';
}
function diagramSVG(key,o={}){const rr=records(key,o),groups=new Set(rr.map(r=>r.comparison.group));return renderSVG(key,1000,Math.max(370,130+rr.length*55+groups.size*30),{...o,focus:true});}
function release(root){for(const i of[...instances])if(!i.root.isConnected||i.root===root)i.destroy();}
function mount(root,key,options,legacy){
 release(root);const controller=new AbortController(),id=idFor(key),pair=config.pairs[id];let publication=options.publication||'all',selected=records(key,{publication})[0]?.id,oldInstance;
 root.setAttribute('aria-label','Correlation clustering '+pair.title+' approximation comparison');
 root.classList.add('focus-view','ccx-view');root.classList.toggle('f-embedded',!!options.embedded);
 root.innerHTML='<p class="f-kicker">CORRELATION CLUSTERING × '+esc(pair.title.toUpperCase())+'</p><header class="f-hero"><div><h1>One approximation scale</h1><p>Read α in the same position across settings, then inspect the cost and assumptions.</p></div></header><div class="ccx-toolbar"><span><b class="ccx-green">● Algorithm</b> · <b class="ccx-red">◇ Scoped lower bound</b></span><label>Sources <select class="ccx-publication" aria-label="Clustering comparison publication filter"><option value="all">All reviewed sources</option><option value="published">Published only</option></select></label></div><p class="ccx-reading"><b>α=1 is optimal; smaller is better.</b> The 1–4 axis stays fixed as you zoom. ε=⅛ only in plotted multiplicative factors; additive errors and lower-bound parameters keep their theorem ranges. LOCAL and streaming r-Pivot use r=16. Rows identify '+esc(pair.resource.toLowerCase())+' and setup; their vertical spacing does not rank cost.</p><div class="ccx-plot-scroll" tabindex="0" aria-label="Shared approximation figure"><div class="ccx-plot"></div></div><div class="ccx-scope-key"><span class="ccx-pure">Disagreements: α × OPT</span><span class="ccx-additive">Additive: α × OPT + error</span><span class="ccx-agreement">Agreements: 1/α of OPT</span></div><p class="ccx-reading">Compare points within the same objective, graph class, output and probability guarantee. A red resource bound at a target α is not an impossibility threshold for α. Unspecified constants and factors outside 1–4 remain unpositioned. Expected and high-probability guarantees keep their source meaning. No red barrier is inferred where none is verified.</p><section class="ccx-inspector" aria-live="polite" aria-label="Selected clustering theorem"></section><details class="ccx-resource-details"><summary>Detailed resource tradeoffs and all related results</summary><div class="ccx-legacy"></div></details>';
 function inspect(){const r=records(key,{publication}).find(r=>r.id===selected),box=root.querySelector('.ccx-inspector');if(!r){box.innerHTML='<p>No results match this filter.</p>';return;}
  const m=r.comparison,url=r.sourceUrl||r.verificationUrl||r.url||r.fullTextUrl;
  box.innerHTML='<div class="ccx-inspector-head"><b class="'+(r.kind==='lower'?'ccx-red':'ccx-green')+'">'+(r.kind==='lower'?'Scoped lower bound':'Algorithm')+'</b><span>'+esc(r.shortLabel||r.title)+(r.publicationStatus==='preprint'?' · PREPRINT':'')+'</span></div><h2>'+esc(r.quality)+'</h2><p><b>'+esc(pair.resource)+'.</b> '+esc(m.resourceLabel||r.displayBound)+'</p><p><b>Figure coordinate.</b> '+esc(m.label||(factor(m)==null?'Unpositioned':String(n(factor(m)))))+'; '+esc(m.group==='agreement'?'reciprocal of the source guarantee on the retained agreement fraction':m.group==='additive'?'multiplicative coefficient only; the additive error is separate':'multiplicative factor')+'. '+esc(m.note||'')+'</p><p><b>Setup.</b> '+esc(m.scope)+'. '+esc(r.graph||'')+'</p><p><b>Output.</b> '+esc(r.output||'See the theorem statement')+'</p><p><b>Probability.</b> '+esc(r.probability||r.guarantee||'As stated in the source')+'</p>'+(m.residual?'<p><b>Residual term.</b> The point marks the leading factor. The full factor includes '+esc(m.residual)+'.</p>':'')+(r.scopeWarning?'<p><b>Scope.</b> '+esc(r.scopeWarning)+'</p>':'')+'<p><b>Statement.</b> '+esc(r.exactBound||r.bound||r.quality)+'. '+esc(r.notes||'')+'</p><p><b>Parameter range.</b> '+esc(r.parameterDomain||(r.assumptions||[]).join('; ')||'As stated in the source')+'</p><p><b>Theorem.</b> '+esc(r.theorem||r.sourceLocation)+'</p><p><a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(r.title||'Primary source')+' ↗</a></p><div class="ccx-paper-links">'+(window.AtlasPapers?.referenceHTML(r)||'')+'</div>';
 }
 function render(){if(!records(key,{publication}).some(r=>r.id===selected))selected=records(key,{publication})[0]?.id;root.querySelector('.ccx-publication').value=publication;root.querySelector('.ccx-plot').innerHTML='<div class="ccx-desktop">'+diagramSVG(key,{publication})+'</div><div class="ccx-mobile">'+renderSVG(key,330,Math.max(245,records(key,{publication}).length*28),{publication,level:'compact',interactive:true})+'<p>Tap a point for its resource cost, setup and paper.</p></div>';inspect();}
 function select(e){const point=e.target.closest('[data-ccx-result]');if(point){selected=point.dataset.ccxResult;inspect();}}
 root.addEventListener('click',select,{signal:controller.signal});root.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.closest('[data-ccx-result]')){e.preventDefault();select(e);}},{signal:controller.signal});
 root.addEventListener('change',e=>{if(e.target.classList.contains('ccx-publication')){publication=e.target.value;oldInstance?.destroy();oldInstance=null;root.querySelector('.ccx-resource-details').open=false;root.querySelector('.ccx-legacy').innerHTML='';render();options.onPublicationChange?.(publication);}},{signal:controller.signal});
 root.querySelector('.ccx-resource-details').addEventListener('toggle',e=>{if(e.target.open&&!oldInstance)oldInstance=legacy.mount(root.querySelector('.ccx-legacy'),key,{...options,publication});},{signal:controller.signal});
 render();const instance={root,settingKey:key,redraw:render,destroy(){controller.abort();oldInstance?.destroy();root.classList.remove('ccx-view');instances.delete(instance);}};instances.add(instance);return instance;
}
window.AtlasCCComparison={idFor,records,factor,geometry,diagramSVG,summarySVG:renderSVG,mount,release};
})();
