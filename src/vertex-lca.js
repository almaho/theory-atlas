(()=>{
'use strict';
const ID='vertex-lca',data=JSON.parse(document.getElementById('atlas-data').textContent).focus[ID];if(!data)return;
const instances=new Set();let serial=0;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const math=s=>esc(s).replace(/log\^\{5\/2\}Δ/g,'log²·⁵Δ').replace(/\^\{([^{}]*)\}/g,'<tspan baseline-shift="super" font-size=".68em">$1</tspan>');
const tx=(x,y,t,cls='',anchor='start',extra='')=>'<text x="'+x+'" y="'+y+'" class="vlca-'+cls+'" text-anchor="'+anchor+'" '+extra+'>'+math(t)+'</text>';
const line=(x1,y1,x2,y2,cls='grid')=>'<path d="M'+x1+' '+y1+'L'+x2+' '+y2+'" class="vlca-'+cls+'"/>';
const records=(o={})=>[...data.verifiedRecords,...data.relatedResults].map(r=>({...data.sources[r.sourceId],...r})).filter(r=>(o.publication!=='published'||r.publicationStatus!=='preprint')&&(!o.scope||o.scope==='all'||(o.scope==='main'?r.panel==='main':r.panel!=='main')));
const color=t=>'var(--vlca-'+(t==='expected'?'expected':t==='deterministic'?'deterministic':'whp')+')';
const rowIndex=id=>data.verifiedRecords.findIndex(r=>r.id===id);
function geometry(w,h,o={},focus=false){
 const levels=['overview','compact','detail'],available=w<300||h<230?0:w<650||h<480?1:2,request=levels.indexOf(o.level),level=focus?'detail':levels[Math.min(available,request<0?available:request)];
 const tiny=level==='overview',compact=level==='compact',left=w*(tiny?.13:compact?.27:.29),right=w-(tiny?w*.08:compact?12:30),top=h*(tiny?.14:compact?.25:.19),bottom=h*(tiny?.73:compact?.66:.63);
 const points=[];for(const r of records(o).filter(r=>r.panel==='main')){const i=rowIndex(r.id),y=h*(tiny?[.25,.45,.65][i]:compact?[.30,.44,.59][i]:[.27,.40,.53][i]);for(const g of r.guarantees)points.push({id:r.id,guaranteeId:g.id,type:g.type,costKey:g.costKey,x:w*(g.costKey==='poly'?.43:g.costKey==='poly-log'?.65:.85),y});}
 return{w,h,level,left,right,top,bottom,points,related:{x:w*.035,y:h*(tiny?.81:compact?.85:.815),w:w*.93,h:h*(tiny?.15:compact?.13:.15)}};
}
function marker(r,g,p,o,interactive,size){
 const selected=o.selected===r.id&&(!o.guarantee||o.guarantee===g.id);
 return'<g class="vlca-point" data-vlca-result="'+esc(r.id)+'" data-vlca-guarantee="'+g.id+'" data-kind="upper" data-point-x="'+p.x+'" data-point-y="'+p.y+'"'+(interactive?' role="button" tabindex="0" aria-pressed="'+selected+'"':'')+' aria-label="'+esc(r.shortLabel+'; '+g.label+'; '+g.formula+' probes; '+r.palette)+'"><title>'+esc(r.shortLabel+' · '+g.label+' · '+g.formula+' · '+r.palette)+'</title><circle cx="'+p.x+'" cy="'+p.y+'" r="'+(size+6)+'" fill="'+color(g.type)+'" opacity="'+(selected?.42:.25)+'"/><circle cx="'+p.x+'" cy="'+p.y+'" r="'+size+'" class="vlca-upper-marker"/><circle cx="'+p.x+'" cy="'+p.y+'" r="'+(size+3)+'" fill="none" stroke="'+color(g.type)+'" stroke-width="1.3"/></g>';
}
function relatedCard(r,g,o,interactive,tiny,compact){
 const b=g.related,selected=o.selected===r.id,attrs=' class="vlca-related-point" data-vlca-result="'+esc(r.id)+'" data-kind="upper" data-related="true"'+(interactive?' role="button" tabindex="0" aria-pressed="'+selected+'"':'')+' aria-label="'+esc(r.shortLabel+'; '+r.displayBound+'; zero-error average-case k-coloring; separate related result')+'"';
 let s='<g'+attrs+'><title>'+esc(r.shortLabel+' · '+r.displayBound+' · '+r.queryQuantifier)+'</title><rect x="'+b.x+'" y="'+b.y+'" width="'+b.w+'" height="'+b.h+'" rx="5" class="vlca-related-box"/><rect x="'+(b.x+6)+'" y="'+(b.y+b.h/2-3)+'" width="6" height="6" class="vlca-upper-marker"/>';
 if(tiny)return s+'</g>';
 if(compact){s+=tx(b.x+17,b.y+11,'Related: average-case exact k-coloring','related-title')+tx(b.x+17,b.y+25,'Reported O(k⁹ log k) · probe unit unresolved','foot');}
 else{s+=tx(b.x+20,b.y+20,'Related · average-case exact k-coloring','related-title')+tx(b.x+b.w-13,b.y+20,'MPRST26 · Theorem 10','muted','end');s+=tx(b.x+20,b.y+42,'Reported O(k⁹ log k) probes · 2 ≤ k ≤ n^{1/37}','related-bound')+tx(b.x+20,b.y+63,'Uniform k-colorable graphs · proper partial answers or FAIL · probe unit unresolved','foot');}
 return s+'</g>';
}
function chart(w,h,o={},interactive=false){
 const g=geometry(w,h,o,interactive),rr=records(o),main=rr.filter(r=>r.panel==='main'),related=rr.find(r=>r.panel!=='main'),tiny=g.level==='overview',compact=g.level==='compact';
 let s='<svg class="vlca-'+(interactive?'map':'summary')+'" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="xMidYMid meet" data-detail-level="'+g.level+'" role="img" aria-label="Vertex-coloring LCA results: three list-coloring algorithms with different probability and expectation guarantees, and one qualified average-case related result"><title>Vertex coloring · local query guarantees</title><desc>All result markers are green algorithm upper bounds. Blue halos denote high-probability all-query guarantees, amber a fixed-query expectation, and violet a deterministic bound. Formula columns are symbolic categories, not a total order. No comparable lower bound is verified. The related average-case theorem uses an unresolved probe convention.</desc>';
 if(!rr.length)return s+(tiny?'':tx(w/2,h/2,'No sources match this filter.','muted','middle'))+'</svg>';
 if(main.length){
  s+=line(g.left,g.top,g.left,g.bottom,'axis')+line(g.left,g.bottom,g.right,g.bottom,'axis');
  for(const x of [.43,.65,.85])s+=line(w*x,g.top,w*x,g.bottom);
  for(const r of main){const p=g.points.find(p=>p.id===r.id);s+=line(g.left,p.y,g.right,p.y);}
 }
 if(tiny){for(const p of g.points){const r=main.find(r=>r.id===p.id),q=r.guarantees.find(q=>q.id===p.guaranteeId);s+=marker(r,q,p,o,false,Math.max(1.8,Math.min(w,h)*.022));}if(related)s+=relatedCard(related,g,o,false,true,false);return s+'</svg>';}
 if(compact){
  s+=tx(10,17,'List coloring · consistent queries','heading')+tx(10,33,'Green algorithms · no reviewed lower','muted');
  if(main.length){
   s+=tx(10,50,'Lists / source','axis-title','start','data-axis="y"');
   for(const r of main){const i=rowIndex(r.id),p0=g.points.find(p=>p.id===r.id);s+=tx(10,p0.y+3,['2019 · Δ+1','2022 · deg+1','2016 · Δ+1'][i],'row-small');}
   for(const p of g.points){const r=main.find(r=>r.id===p.id),q=r.guarantees.find(q=>q.id===p.guaranteeId);s+=marker(r,q,p,o,false,4)+tx(p.x,p.y-13,q.type==='expected'?'E[Q(v)]':q.type==='whp'?'w.h.p.':'det.',q.type,'middle');}
   s+=tx(10,g.bottom+17,'Probes','axis-title','start','data-axis="x"')+tx(w*.43,g.bottom+17,'P(Δ)','tick','middle')+tx(w*.65,g.bottom+17,'P·log n','tick','middle')+tx(w*.85,g.bottom+17,'F·log* n','tick','middle');
   s+=tx(10,g.bottom+33,'P = poly(Δ) · F from FHK16 · no numeric ranking','foot');
  }
  if(related)s+=relatedCard(related,g,o,false,false,true);
  return s+'</svg>';
 }
 const m=24;
 s+=tx(m,29,'One coloring, different query guarantees','heading')+tx(m,52,'General graphs · readable lists and adjacency access','muted');
 const legend=[['whp','All queries · w.h.p.',m],['expected','Expected · fixed v',w*.30],['deterministic','Deterministic',w*.57]];
 for(const [type,label,x]of legend)s+='<circle cx="'+(x+4)+'" cy="75" r="4" fill="'+color(type)+'"/>'+tx(x+15,79,label,type);
 if(main.length){
  s+=tx(m,g.top+3,'Lists / source','axis-title','start','data-axis="y"');
  for(const r of main){const i=rowIndex(r.id),p0=g.points.find(p=>p.id===r.id);s+=tx(m,p0.y-5,['CFGUZ19','Ghaffari22','FHK16'][i],'row-title')+tx(m,p0.y+17,r.palette,'list-size');}
  for(const p of g.points){const r=main.find(r=>r.id===p.id),q=r.guarantees.find(q=>q.id===p.guaranteeId);s+=marker(r,q,p,o,interactive,6)+tx(p.x,p.y-19,q.type==='expected'?'Fixed v · expectation':q.type==='whp'?'All vertices':'Deterministic',q.type,'middle');}
  s+=tx(w*.43,g.bottom+25,'P(Δ)','formula','middle')+tx(w*.65,g.bottom+25,'P(Δ) · log n','formula','middle')+tx(w*.85,g.bottom+25,'F(Δ) · log* n','formula','middle');
  s+=tx((g.left+g.right)/2,g.bottom+49,'Per-vertex probes · symbolic formula classes','axis-title','middle','data-axis="x"');
  s+=tx(m,h*.765,'P(Δ) = unspecified polynomial; F(Δ) = Δ^{O(√Δ log^{5/2}Δ)}','definition');
 }
 if(related)s+=relatedCard(related,g,o,interactive,false,false);
 s+=tx(m,h-8,'Different probability contracts; no numerical ordering or matching lower bound is claimed.','foot');
 return s+'</svg>';
}
function diagramSVG(a={},b={}){return chart(1000,660,typeof a==='string'?b:(a||{}),true);}
function summarySVG(key,w,h,options={}){return chart(w,h,options,false);}
function release(root){for(const i of instances)if(!i.root.isConnected||i.root===root)i.destroy();}
function mount(root,key=ID,options={}){
 release(root);for(const name of ['StreamingMatching','DynamicMatching','LCAMatching','LocalMatching','MPCMatching','ListQueryMatching'])window[name]?.release(root);for(const [id,r]of Object.entries(window.AtlasPairRenderers||{}))if(id!==ID)r.release?.(root);
 const controller=new AbortController(),uid='vlca-'+(++serial);let publication=options.publication||'all',selected=key==='vertex-lca-average'?data.relatedResults[0]?.id:data.verifiedRecords[0]?.id,guarantee='whp';
 const opts=()=>({publication,selected,guarantee});
 root.classList.add('focus-view','vlca-view');root.classList.toggle('f-embedded',!!options.embedded);root.setAttribute('aria-label','Vertex-coloring LCA theorem comparison');
 root.innerHTML='<p class="f-kicker">VERTEX COLORING × LCA</p><header class="f-hero"><div><h1>One coloring, different query guarantees</h1><p>Compare consistent list-color queries on general graphs. The average-case exact-coloring theorem stays in a separate related card.</p></div></header><div class="vlca-toolbar"><div class="vlca-legend" id="'+uid+'"><span><i class="vlca-key-upper"></i>Algorithm</span><span><i class="vlca-key-whp"></i>All queries · w.h.p.</span><span><i class="vlca-key-expected"></i>Expected · fixed v</span><span><i class="vlca-key-deterministic"></i>Deterministic</span></div><label>Sources <select class="vlca-publication" aria-label="Vertex LCA source publication filter"><option value="all">All reviewed sources</option><option value="published">Published only</option></select></label></div><div class="vlca-scroll" tabindex="0" aria-label="Vertex LCA figure; horizontal scrolling available on narrow screens"><div class="vlca-plot"></div></div><div class="vlca-notes"><p><b>Read the cost axis.</b> P(Δ) denotes an unspecified polynomial, which can differ between papers. F(Δ) is the exact symbolic factor stated for FHK16. The columns do not impose a numerical ranking when n and Δ vary.</p><p><b>Keep the quantifiers.</b> Ghaffari22 has two guarantees for one algorithm. Expected poly(Δ) applies to a vertex fixed before the random tape is chosen. The poly(Δ)·log n guarantee holds for all vertices on a high-probability event.</p></div><section class="vlca-theorem" aria-live="polite" aria-label="Selected vertex LCA theorem"></section><div class="vlca-records" aria-label="Inspect all vertex LCA sources"></div><p class="vlca-coverage">'+esc(data.coverageNote)+'</p>';
 function inspect(){
  const r=records(opts()).find(r=>r.id===selected),el=root.querySelector('.vlca-theorem');
  if(!r){el.innerHTML='<p>No sources match this filter.</p>';return;}
  const q=r.guarantees?.find(q=>q.id===guarantee)||r.guarantees?.[0],related=r.panel!=='main';
  el.innerHTML='<div class="vlca-detail-head"><strong class="vlca-green">'+(related?'Related algorithm · source-reported probe convention':'Algorithm upper bound')+'</strong><span>'+esc(r.shortLabel)+'</span></div><div class="vlca-detail-values"><div><small>List or palette contract</small><strong>'+esc(r.palette)+'</strong></div><div><small>'+esc(q?.label||'Reported average-case probes')+'</small><strong>'+esc(q?.formula||r.displayBound)+'</strong></div></div>'+(related?'<p class="vlca-caveat"><b>Access-model qualification.</b> '+esc(r.scopeCaveat)+'. '+esc(r.oracle)+'</p><p><b>Expectation order.</b> '+esc(r.queryQuantifier)+'.</p><p><b>Separate time bound.</b> '+esc(r.timeBound)+'.</p>':'<p><b>Oracle.</b> '+esc(r.oracle)+'.</p>')+'<p><b>Output.</b> '+esc(r.output)+'.</p><p><b>Probability and cost.</b> '+esc(r.probability)+'</p><p><b>State.</b> '+esc(r.state)+'.</p><p><b>Query selection.</b> '+esc(r.adaptivity)+'</p><p>'+esc(r.notes)+'</p><details><summary>Theorem, assumptions and primary source</summary><h3>'+esc(r.title)+'</h3><p>'+esc((r.authors||[]).join(', '))+' · '+esc(r.venue)+'</p><p><b>'+esc(r.theorem)+'</b></p><p><b>Graph.</b> '+esc(r.graph)+'.</p><p><b>Parameters.</b> '+esc(r.parameters)+'.</p>'+(r.reduction?'<h4>Coloring-to-MIS reduction</h4><ol>'+r.reduction.map(v=>'<li>'+esc(v)+'</li>').join('')+'</ol>':'')+'<ul>'+r.assumptions.map(v=>'<li>'+esc(v)+'</li>').join('')+'</ul><p><a href="'+esc(r.sourceUrl||r.fullTextUrl||r.url)+'" target="_blank" rel="noopener noreferrer">Read primary theorem ↗</a> · <a href="'+esc(r.url)+'" target="_blank" rel="noopener noreferrer">Paper record ↗</a></p></details>';
 }
 function render(){
  const rr=records(opts());if(!rr.some(r=>r.id===selected))selected=rr[0]?.id;
  root.querySelector('.vlca-publication').value=publication;root.querySelector('.vlca-plot').innerHTML=diagramSVG(opts());
  root.querySelector('.vlca-records').innerHTML=rr.map(r=>'<button type="button" class="vlca-record" data-vlca-result="'+esc(r.id)+'" aria-pressed="'+(r.id===selected)+'"><span>'+esc(r.shortLabel)+(r.panel==='main'?'':' · RELATED')+'</span><strong>'+esc(r.quality)+'</strong><small>'+esc(r.displayBound)+'</small></button>').join('');inspect();
 }
 function select(e){const b=e.target.closest('[data-vlca-result]');if(b&&records(opts()).some(r=>r.id===b.dataset.vlcaResult)){selected=b.dataset.vlcaResult;guarantee=b.dataset.vlcaGuarantee||'whp';render();}}
 root.addEventListener('click',select,{signal:controller.signal});
 root.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const b=e.target.closest('.vlca-point,.vlca-related-point');if(b){e.preventDefault();select(e);}}},{signal:controller.signal});
 root.addEventListener('change',e=>{if(e.target.classList.contains('vlca-publication')){publication=e.target.value;render();options.onPublicationChange?.(publication);}},{signal:controller.signal});
 render();const instance={root,settingKey:ID,redraw:render,destroy(){controller.abort();root.classList.remove('vlca-view');instances.delete(instance);}};instances.add(instance);return instance;
}
window.AtlasPairRenderers=window.AtlasPairRenderers||{};window.AtlasPairRenderers[ID]={mount,diagramSVG,summarySVG,records,release,layoutGeometry:geometry};
})();