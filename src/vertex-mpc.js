(()=>{
'use strict';
const data=JSON.parse(document.getElementById('atlas-data').textContent).focus['vertex-mpc'];
const instances=new Set(),allRows=[...data.verifiedRecords,...data.relatedResults];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=n=>String(Math.round(n*100)/100);
const txt=(x,y,s,cl='vmpc-label',anchor='start')=>'<text x="'+num(x)+'" y="'+num(y)+'" class="'+cl+'" text-anchor="'+anchor+'">'+esc(s)+'</text>';
const records=(o={})=>allRows.map(r=>({...data.sources[r.sourceId],...r})).filter(r=>(o.publication!=='published'||r.publicationStatus!=='preprint')&&(!o.contract||o.contract==='all'||r.contract===o.contract));
function levelFor(w,h,o){if(o.focus)return'focus';const levels=['overview','compact','detail'],a=w<300||h<245?0:w<730||h<548?1:2,r=levels.indexOf(o.level);return levels[Math.min(a,r<0?a:r)]}
function marker(r,x,y,o){
 const radius=o.tiny?Math.max(2,Math.min(3.5,o.w/90)):o.rich?6:4,selected=o.selected===r.id;
 let s='<g class="vmpc-point vmpc-'+r.contract+'" data-vmpc-result="'+esc(r.id)+'" data-kind="'+r.kind+'" data-contract="'+r.contract+'" data-center-x="'+num(x)+'" data-center-y="'+num(y)+'"'+(o.focus?' role="button" tabindex="0" aria-pressed="'+selected+'" aria-label="'+esc('Inspect '+r.shortLabel+', '+r.quality+', '+r.displayBound)+'"':'')+'>';
 if(o.focus)s+='<circle class="vmpc-selection" cx="'+num(x)+'" cy="'+num(y)+'" r="16"/>';
 s+='<circle class="vmpc-hit" cx="'+num(x)+'" cy="'+num(y)+'" r="'+(o.focus?21:radius)+'"/><circle class="vmpc-contract-ring" cx="'+num(x)+'" cy="'+num(y)+'" r="'+(radius+3)+'"/>';
 if(r.mode==='deterministic')s+='<rect class="vmpc-upper" x="'+num(x-radius)+'" y="'+num(y-radius)+'" width="'+radius*2+'" height="'+radius*2+'" rx="1"/>';
 else s+='<circle class="vmpc-upper" cx="'+num(x)+'" cy="'+num(y)+'" r="'+radius+'"/>';
 return s+'</g>';
}
function figure(w,h,o={}){
 const level=levelFor(w,h,o),tiny=level==='overview',rich=level==='detail'||level==='focus',focus=level==='focus',rs=records(o);
 const left=tiny?w*.12:rich?157:84,right=w-(tiny?7:rich?28:12),plotTop=tiny?h*.12:rich?137:61,plotBottom=tiny?h*.65:rich?335:149;
 const xs={sublinear:left+(right-left)*.16,linear:left+(right-left)*.55,'near-linear':left+(right-left)*.86};
 const ys={'logdelta-loglog':plotTop+(plotBottom-plotTop)*.07,'sqrt-loglog':plotTop+(plotBottom-plotTop)*.38,logloglog:plotTop+(plotBottom-plotTop)*.69,constant:plotBottom-6};
 const mo={...o,tiny,rich,focus,w};
 let s='<svg xmlns="http://www.w3.org/2000/svg" class="vmpc-map" data-detail-level="'+level+'" data-axes="symbolic" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="xMidYMid meet" role="'+(focus?'group':'img')+'" aria-label="MPC vertex coloring: per-machine memory versus communication rounds, distinct palette scopes and a separate degeneracy row."><title>MPC coloring: memory and communication rounds</title><desc>Green circles are randomized algorithms and green squares deterministic algorithms. Colored outlines distinguish uniform Delta plus one, Delta plus one lists, and degree plus one lists. Axes are symbolic asymptotic categories, not numerical spacing. The degeneracy result has its own row measured in bits. No applicable lower bound was verified in the supplied sources.</desc>';
 if(!tiny){
  s+=txt(rich?27:12,rich?30:19,rich?'Vertex coloring · memory and rounds':'Vertex coloring · MPC','vmpc-heading');
  if(rich){
   s+=txt(27,58,'Communication rounds · full coloring of a general graph','vmpc-muted');
   const legends=[['uniform','Uniform Δ+1',27],['delta-list','Δ+1 lists',218],['degree-list','d(v)+1 lists',393]];
   legends.forEach(([cl,label,x])=>{s+='<circle class="vmpc-legend-ring vmpc-'+cl+'" cx="'+(x+5)+'" cy="83" r="4"/>'+txt(x+18,87,label,'vmpc-legend');});
   s+=txt(right,87,'○ randomized   □ deterministic','vmpc-legend','end');
   s+=txt(left,117,'Rounds · O(·) classes','vmpc-axis-title');
  }else{
   [['uniform','Δ+1',12],['delta-list','Δ+1 lists',88],['degree-list','d+1 lists',204]].forEach(([cl,label,x])=>{s+='<circle class="vmpc-legend-ring vmpc-'+cl+'" cx="'+(x+4)+'" cy="36" r="3"/>'+txt(x+13,40,label,'vmpc-legend');});s+=txt(12,54,'Rounds · O(·)','vmpc-axis-title');
  }
 }
 s+='<g data-panel="memory-rounds"><path class="vmpc-axis" d="M'+num(left)+' '+num(plotTop)+'V'+num(plotBottom)+'H'+num(right)+'"/>';
 Object.values(ys).forEach(yy=>{s+='<path class="vmpc-grid" d="M'+num(left)+' '+num(yy)+'H'+num(right)+'"/>'});
 Object.values(xs).forEach(xx=>{s+='<path class="vmpc-grid" d="M'+num(xx)+' '+num(plotTop)+'V'+num(plotBottom)+'"/>'});
 if(!tiny){
  if(rich){s+=txt(left-12,ys['logdelta-loglog']-3,'logΔ +','vmpc-tick','end')+txt(left-12,ys['logdelta-loglog']+14,'loglog n','vmpc-tick','end');}
  else{s+=txt(left-7,ys['logdelta-loglog']-2,'logΔ +','vmpc-tick','end')+txt(left-7,ys['logdelta-loglog']+10,'loglog n','vmpc-tick','end');}
  s+=txt(left-(rich?12:7),ys['sqrt-loglog']+4,'√loglog n','vmpc-tick','end')+txt(left-(rich?12:7),ys.logloglog+4,'logloglog n','vmpc-tick','end')+txt(left-(rich?12:7),ys.constant+4,'1','vmpc-tick','end');
  [['sublinear','O(n^φ)'],['linear','O(n)'],['near-linear','Õ(n)']].forEach(([k,label])=>s+=txt(xs[k],plotBottom+(rich?27:20),label,'vmpc-tick','middle'));
  if(rich)s+=txt((left+right)/2,390,'Per-machine memory · fixed 0 < φ < 1','vmpc-axis-title','middle');
 }
 const main=rs.filter(r=>r.panel==='memory-rounds');
 main.forEach(r=>{
  const offset=r.memoryClass==='near-linear'?(r.contract==='uniform'?-1:1)*(tiny?3:rich?31:13):0;
  const x=xs[r.memoryClass]+offset,y=ys[r.roundClass];
  s+=marker(r,x,y,mo);
  if(rich){
   let label=r.shortLabel,yy=y-17,anchor='middle',xx=x;
   if(r.contract==='uniform'){label='ACK 2019';yy=y-39;xx=x-4;anchor='end'}
   if(r.contract==='degree-list'&&r.memoryClass==='near-linear'){label='HKNT 2022';yy=y-17;xx=x+3;anchor='middle'}
   s+=txt(xx,yy,label,'vmpc-source-label vmpc-'+r.contract,anchor);
  }
 });
 if(!main.length&&!tiny)s+=txt((left+right)/2,(plotTop+plotBottom)/2,'No sources under this filter','vmpc-muted','middle');
 s+='</g>';
 const deg=rs.find(r=>r.panel==='degeneracy'),rowY=tiny?h*.83:rich?438:200;
 if(deg){
  const cx=tiny?w*.72:rich?right-25:w-26;
  s+='<g data-panel="degeneracy"><rect class="vmpc-separate" x="'+(tiny?left:rich?27:10)+'" y="'+(tiny?rowY-6:rich?411:181)+'" width="'+(tiny?right-left:rich?w-55:w-20)+'" height="'+(tiny?13:rich?65:41)+'" rx="8"/>';
  s+=marker(deg,cx,rowY,mo);
  if(!tiny){
   s+=txt(rich?42:20,rich?435:195,'κ+o(κ) colors · O(1) rounds','vmpc-degeneracy-title');
   s+=txt(rich?42:20,rich?458:211,rich?'n processors × O(n log²n) bits each · BCG 2020':'n × O(n log²n) bits','vmpc-note');
  }
  s+='</g>';
 }
 if(rich){
  s+=txt(27,499,'† CDP 2021 permits exp(n^φ) local work. Other points retain their own work model.','vmpc-note');
  s+=txt(27,521,'Units differ by source; inspect total memory and list-input accounting.','vmpc-note');
  s+=txt(27,543,'No verified MPC lower bound in these sources. κ+1 handles the small-input branch.','vmpc-note');
 }else if(!tiny)s+=txt(12,239,'† O(logloglog n): exp(n^φ) local work','vmpc-note');
 return s+'</svg>';
}
function summarySVG(key,w,h,o={}){return figure(Math.max(40,Number(w)||738),Math.max(40,Number(h)||548),{...o,focus:false})}
function diagramSVG(key='vertex-mpc',o={}){if(typeof key==='object'){o=key;key=o.key||'vertex-mpc'}return figure(1000,548,{...o,focus:true})}
function mount(root,key='vertex-mpc',options={}){
 for(const i of instances)if(!i.root.isConnected||i.root===root)i.destroy();
 let publication=options.publication||'all',contract=options.contract||'all',selected=allRows.find(r=>r.sliceId===key)?.id||data.defaultSelected;
 const controller=new AbortController();
 root.classList.add('focus-view','vmpc-view');root.classList.toggle('f-embedded',!!options.embedded);
 root.innerHTML='<p class="f-kicker">VERTEX COLORING × MPC</p><header class="f-hero"><div><h1>Memory and communication rounds</h1><p class="vmpc-subtitle">Distinct palette promises; a proper color for every vertex.</p></div></header><div class="f-scope"><span><b>Input</b> general simple graphs</span><span><b>Cost</b> communication rounds</span><span><b>Memory</b> per machine; total inspected separately</span><span><b>Local work</b> arbitrary where explicitly allowed</span></div><div class="vmpc-toolbar"><label>Palette <select class="vmpc-contract" aria-label="Coloring palette contract"><option value="all">All palette contracts</option>'+data.contracts.map(c=>'<option value="'+esc(c.id)+'">'+esc(c.label)+'</option>').join('')+'</select></label><label>Sources <select class="vmpc-publication" aria-label="MPC vertex-coloring source publication filter"><option value="all">All verified sources</option><option value="published">Published only</option></select></label></div><div class="vmpc-scroll" tabindex="0" aria-label="MPC coloring figure; scroll horizontally on narrow screens"><div class="vmpc-plot"></div></div><p class="vmpc-read"><b>Read the figure.</b> Green means an algorithm. Circles are randomized; squares are deterministic. Outline colors distinguish palette contracts. Round labels show O(·) classes, not numerical spacings. Near-linear points share a memory category and are nudged to avoid overlap. φ is any fixed constant in (0,1). The inspector retains each source’s bits or words; this categorical plot does not assert identical bit budgets. The separate κ row uses bits and n processors; κ is degeneracy, not Δ. For small inputs its centralized branch uses κ+1 colors.</p><section class="vmpc-theorem" aria-label="Selected theorem and primary source" aria-live="polite"></section><details class="vmpc-source-list"><summary>Inspect all theorem statements</summary><div class="vmpc-records"></div></details><p class="vmpc-coverage">'+esc(data.coverageNote)+' Reviewed '+esc(data.reviewedOn)+'.</p>';
 const opts=()=>({publication,contract,selected});
 function inspect(){
  const rs=records(opts());let r=rs.find(x=>x.id===selected);if(!r){r=rs[0];selected=r?.id}
  const el=root.querySelector('.vmpc-theorem');if(!r){el.innerHTML='<p>No theorem is available under these filters.</p>';return}
  el.innerHTML='<div class="vmpc-detail-head"><span class="vmpc-green">'+esc(r.mode)+' algorithm</span><strong>'+esc(r.shortLabel)+'</strong><span>'+esc(r.venue)+'</span></div><div class="vmpc-detail-grid"><div><small>Palette</small><strong>'+esc(r.quality)+'</strong></div><div><small>Communication rounds</small><strong>'+esc(r.rounds)+'</strong></div><div><small>Local memory</small><strong>'+esc(r.localMemory)+'</strong></div></div><p><b>Total memory.</b> '+esc(r.totalMemory)+'.</p><p><b>Units.</b> '+esc(r.memoryUnit)+'.</p><p class="'+(r.expensiveLocalWork?'vmpc-work-warning':'')+'"><b>Local computation.</b> '+esc(r.localWork)+'</p><p><b>Correctness.</b> '+esc(r.probability)+'</p><p>'+esc(r.notes)+'</p>'+(r.qualification?'<p class="vmpc-accounting"><b>Input accounting.</b> '+esc(r.qualification)+'</p>':'')+(r.variants?'<div class="vmpc-variant"><h3>Uniform-palette variant · same source</h3><p>'+esc(r.variants.uniform.theorem)+': '+esc(r.variants.uniform.quality)+', '+esc(r.variants.uniform.rounds)+' rounds, '+esc(r.variants.uniform.localMemory)+' local and '+esc(r.variants.uniform.totalMemory)+' total memory. '+esc(r.variants.uniform.probability)+'</p><p>This reduced total is not claimed for arbitrary explicit lists.</p></div>':'')+'<details open><summary>Exact theorem, assumptions and primary source</summary><h3>'+esc(r.title)+'</h3><p>'+esc(r.authors.join(', '))+'</p><p><b>'+esc(r.theorem)+'</b></p><ul>'+r.assumptions.map(a=>'<li>'+esc(a)+'</li>').join('')+'</ul><p>'+esc(r.graph)+' '+esc(r.output)+'</p><p><a href="'+esc(r.verificationUrl)+'" target="_blank" rel="noopener noreferrer">Inspect the primary theorem and proof ↗</a> · <a href="'+esc(r.url)+'" target="_blank" rel="noopener noreferrer">Paper record ↗</a></p></details>';
 }
 function list(){root.querySelector('.vmpc-records').innerHTML=records(opts()).map(r=>'<button type="button" class="vmpc-record" data-vmpc-result="'+esc(r.id)+'" aria-pressed="'+(r.id===selected)+'"><strong>'+esc(r.shortLabel)+' · '+esc(r.quality)+'</strong><span>'+esc(r.displayBound)+'</span><small>'+esc(r.theorem)+'</small></button>').join('')}
 function render(){
  const rs=records(opts());if(!rs.some(r=>r.id===selected))selected=rs[0]?.id;
  root.querySelector('.vmpc-publication').value=publication;root.querySelector('.vmpc-contract').value=contract;
  root.querySelector('.vmpc-subtitle').textContent=(contract==='all'?'Distinct palette promises':data.contracts.find(c=>c.id===contract)?.label||'Coloring')+'; a proper color for every vertex.';
  root.querySelector('.vmpc-plot').innerHTML=diagramSVG(key,opts());inspect();list();
 }
 function select(n){selected=n.dataset.vmpcResult;inspect();list();root.querySelectorAll?.('.vmpc-point').forEach(p=>p.setAttribute('aria-pressed',String(p.dataset.vmpcResult===selected)))}
 root.addEventListener('click',e=>{const n=e.target.closest('[data-vmpc-result]');if(n)select(n)},{signal:controller.signal});
 root.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const n=e.target.closest('.vmpc-point');if(n){e.preventDefault();select(n)}},{signal:controller.signal});
 root.addEventListener('change',e=>{if(e.target.classList.contains('vmpc-publication')){publication=e.target.value;render();options.onPublicationChange?.(publication)}else if(e.target.classList.contains('vmpc-contract')){contract=e.target.value;render()}},{signal:controller.signal});
 render();const i={root,settingKey:key,redraw:render,destroy(){controller.abort();root.classList.remove('vmpc-view');instances.delete(i)}};instances.add(i);return i;
}
window.AtlasPairRenderers=window.AtlasPairRenderers||{};
window.AtlasPairRenderers['vertex-mpc']={mount,summarySVG,diagramSVG,records,release(root){for(const i of instances)if(!i.root.isConnected||i.root===root)i.destroy()}};
})();