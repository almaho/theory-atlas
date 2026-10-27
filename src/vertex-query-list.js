(()=>{
'use strict';
const data=JSON.parse(document.getElementById('atlas-data').textContent).focus['vertex-query_list'],instances=new Set();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rows=[...data.verifiedRecords,...data.relatedResults],records=(o={})=>rows.map(r=>({...data.sources[r.sourceId],...r})).filter(r=>o.publication!=='published'||r.publicationStatus!=='preprint');
const num=n=>String(Math.round(n*100)/100),txt=(x,y,s,cl='vql-label',a='start')=>'<text x="'+num(x)+'" y="'+num(y)+'" class="'+cl+'" text-anchor="'+a+'">'+esc(s)+'</text>';
function levelFor(w,h,o){if(o.focus)return'focus';const lv=['overview','compact','detail'],a=w<300||h<245?0:w<730||h<548?1:2,r=lv.indexOf(o.level);return lv[Math.min(a,r<0?a:r)]}
function figure(w,h,o={}){
 const level=levelFor(w,h,o),tiny=level==='overview',rich=level==='detail'||level==='focus',focus=level==='focus',r=records(o)[0];
 const left=tiny?w*.12:rich?92:75,right=tiny?w-8:rich?w*.54:w-17,top=tiny?h*.25:rich?158:90,bottom=tiny?h*.70:rich?268:135,x=(left+right)/2,rad=tiny?Math.max(2,Math.min(4,w/40)):rich?7:5;
 let s='<svg xmlns="http://www.w3.org/2000/svg" class="vql-map" data-detail-level="'+level+'" data-axes="symbolic" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="xMidYMid meet" role="'+(focus?'group':'img')+'" aria-label="Vertex coloring with neighbor-only access: exactly n plus 2m calls for greedy coloring using Delta plus one colors."><title>Greedy coloring · exact neighbor-query accounting</title><desc>A green square denotes a deterministic algorithm. Query cost is n plus 2m: two incidences per edge and one list-end test per known vertex. The point pairs this exact scan cost with the Delta plus one palette. It is an upper-bound implementation, not an optimality claim. No verified neighbor-only lower bound is imported.</desc>';
 if(!tiny){
  s+=txt(rich?27:12,rich?30:19,rich?'Greedy coloring · query every neighbor':'Greedy coloring · neighbor queries','vql-heading');
  s+='<rect class="vql-upper" x="'+(rich?28:13)+'" y="'+(rich?51:31)+'" width="8" height="8" rx="1"/>'+txt(rich?46:27,rich?60:39,'Deterministic algorithm','vql-legend');
  if(rich)s+=txt(w-27,60,'Known vertices · simple graph','vql-muted','end');
  s+=txt(rich?left:12,rich?108:61,rich?'Neighbor calls Q · exact scan cost':'Neighbor calls Q','vql-axis-title');
 }
 s+='<g data-panel="greedy"><path class="vql-axis" d="M'+num(left)+' '+num(top-13)+'V'+num(bottom)+'H'+num(right)+'"/><path class="vql-grid" d="M'+num(left)+' '+num(top)+'H'+num(right)+'M'+num(x)+' '+num(top)+'V'+num(bottom)+'"/>';
 if(!tiny)s+=txt(left-10,top+5,'n+2m','vql-tick','end');
 if(r){
  s+='<g class="vql-point" data-vql-result="'+esc(r.id)+'" data-kind="algorithm" data-center-x="'+num(x)+'" data-center-y="'+num(top)+'"'+(focus?' role="button" tabindex="0" aria-pressed="true" aria-label="Inspect greedy coloring: exactly n plus 2m neighbor calls, Delta plus one colors"':'')+'>';
  if(focus)s+='<circle class="vql-selection" cx="'+num(x)+'" cy="'+num(top)+'" r="15"/>';
  s+='<circle class="vql-hit" cx="'+num(x)+'" cy="'+num(top)+'" r="'+(focus?21:rad)+'"/><rect class="vql-upper" x="'+num(x-rad)+'" y="'+num(top-rad)+'" width="'+rad*2+'" height="'+rad*2+'" rx="1"/></g>';
  if(!tiny){s+=txt(x,top-(rich?23:17),rich?'Exact full scan':'Full scan','vql-bound','middle');if(rich)s+=txt(x,top+33,'No degree or pair calls','vql-muted','middle');}
 }else if(!tiny)s+=txt(x,top+32,'No source under this filter','vql-empty','middle');
 if(!tiny){s+=txt(x,bottom+23,'Δ+1','vql-palette','middle');s+=txt(x,bottom+(rich?47:42),'Palette q','vql-axis-title','middle');}
 s+='</g>';
 if(rich&&r){
  const sx=w*.62;s+='<path class="vql-rule" d="M'+(sx-16)+' 115V264"/>';
  s+=txt(sx,135,'Count the oracle calls','vql-side-heading');
  s+=txt(sx,173,'2m','vql-decomp-bound')+txt(sx+49,173,'neighbor answers','vql-label');
  s+=txt(sx,204,'+ n','vql-decomp-bound')+txt(sx+49,204,'list-end tests (⊥)','vql-label');
  s+=txt(sx,243,'= n+2m','vql-bound')+txt(sx+115,243,'exactly','vql-muted');
  const y=354,gap=12,cw=(w-54-2*gap)/3;
  s+=txt(27,y-18,'The same scan adapts to graph density','vql-axis-title');
  [['No edges','n calls','m=0'],['Sparse input','Θ(n) calls','m=O(n)'],['Dense input','Θ(n²) calls','m=Θ(n²)']].forEach((c,i)=>{const cx=27+i*(cw+gap);s+='<rect class="vql-cost-bg" x="'+num(cx)+'" y="'+y+'" width="'+num(cw)+'" height="88" rx="9"/>'+txt(cx+14,y+22,c[0],'vql-cost-title')+txt(cx+14,y+49,c[1],'vql-cost-bound')+txt(cx+14,y+72,c[2],'vql-note');});
  s+=txt(27,473,'n+2m ≤ n(Δ+1) ≤ n²; the scan retains the actual edge count.','vql-callout');
  s+=txt(27,502,'The source’s O(nΔ) baseline applies for Δ≥1; isolates still need end tests.','vql-note');
  s+=txt(27,531,'No verified neighbor-only query lower bound in this bounded source set.','vql-note');
 }else if(!tiny&&r){
  s+='<path class="vql-rule" d="M12 184H'+(w-12)+'"/>';
  s+=txt(12,200,'2m neighbor answers + n end tests','vql-note');
  s+=txt(12,219,'No degree or pair calls · n output colors','vql-note');
  s+=txt(12,238,'No query optimality claim','vql-note');
 }else if(rich&&!r)s+=txt(27,417,'The supplied baseline is indexed through a preprint.','vql-muted');
 return s+'</svg>';
}
function summarySVG(key,w,h,o={}){return figure(Math.max(40,Number(w)||738),Math.max(40,Number(h)||548),{...o,focus:false})}
function diagramSVG(key='vertex-query_list',o={}){if(typeof key==='object'){o=key;key=o.key||'vertex-query_list'}return figure(1000,548,{...o,focus:true})}
function mount(root,key='vertex-query_list',options={}){
 for(const i of instances)if(!i.root.isConnected||i.root===root)i.destroy();
 let publication=options.publication||'all';const controller=new AbortController();
 root.classList.add('focus-view','vql-view');root.classList.toggle('f-embedded',!!options.embedded);
 root.setAttribute('aria-label','Greedy full vertex coloring using neighbor-only queries');
 root.innerHTML='<p class="f-kicker">VERTEX COLORING × ADJACENCY LISTS</p><header class="f-hero"><div><h1>Query every neighbor, color every vertex</h1><p>Exactly n+2m neighbor calls for the greedy scan; no degree or adjacency-pair oracle is needed.</p></div></header><div class="f-scope"><span><b>Input</b> known vertices of a simple graph</span><span><b>Access</b> Neighbor(v,j), with ⊥ at list end</span><span><b>Output</b> all n vertex colors</span><span><b>Palette</b> at most Δ+1</span></div><div class="vql-toolbar"><span class="vql-green">■ Deterministic algorithm</span><label>Sources <select class="vql-publication" aria-label="Neighbor-query vertex-coloring source publication filter"><option value="all">All verified sources</option><option value="published">Published only</option></select></label></div><div class="vql-scroll" tabindex="0" aria-label="Neighbor-query coloring figure; scroll horizontally on narrow screens"><div class="vql-plot"></div></div><p class="vql-read"><b>Read the point.</b> The axes pair the palette with the exact query cost of this implementation. They are symbolic, with no implied feasibility region. Each edge occurs in two lists, and each list is checked once past its end. Green is an algorithm; the reviewed source set supplies no applicable neighbor-only lower bound. Computation is accounted for below.</p><section class="vql-theorem" aria-label="Selected theorem and primary source" aria-live="polite"></section><details class="vql-source-list"><summary>Inspect the supplied baseline</summary><div class="vql-records"></div></details><p class="vql-coverage">'+esc(data.coverageNote)+' Reviewed '+esc(data.reviewedOn)+'.</p>';
 function inspect(){
  const r=records({publication})[0],el=root.querySelector('.vql-theorem');if(!r){el.innerHTML='<p>No theorem is available under this publication filter. The supplied source is a preprint.</p>';return}
  el.innerHTML='<div class="vql-detail-head"><span class="vql-green">Deterministic algorithm</span><strong>'+esc(r.shortLabel)+'</strong><span>'+esc(r.venue)+'</span></div><div class="vql-detail-grid"><div><small>Neighbor calls · exact</small><strong>n+2m</strong></div><div><small>Explicit output</small><strong>'+esc(r.outputCount)+'</strong></div><div><small>RAM time</small><strong>O(n+m)</strong></div></div><p><b>Guarantee.</b> '+esc(r.quality)+'. '+esc(r.probability)+'</p><p><b>Source baseline.</b> '+esc(r.sourceBound)+'</p><p><b>Memory.</b> '+esc(r.space)+'.</p><p>'+esc(r.notes)+'</p><details open><summary>Exact derivation, assumptions and primary source</summary><h3>'+esc(r.title)+'</h3><p>'+esc(r.authors.join(', '))+'</p><p><b>'+esc(r.theorem)+'</b></p><ol>'+r.derivation.map(a=>'<li>'+esc(a)+'</li>').join('')+'</ol><h4>Scope and edge cases</h4><ul>'+r.assumptions.map(a=>'<li>'+esc(a)+'</li>').join('')+'</ul><p><b>Total computation.</b> '+esc(r.totalTime)+'.</p><p><b>Version evidence.</b> '+esc(r.versionNote)+'</p><p><a href="'+esc(r.verificationUrl)+'" target="_blank" rel="noopener noreferrer">Inspect the access model and greedy baseline ↗</a> · <a href="'+esc(r.url)+'" target="_blank" rel="noopener noreferrer">Paper record ↗</a></p></details>';
 }
 function render(){root.querySelector('.vql-publication').value=publication;root.querySelector('.vql-plot').innerHTML=diagramSVG(key,{publication});root.querySelector('.vql-records').innerHTML=records({publication}).map(r=>'<button type="button" class="vql-record" data-vql-result="'+esc(r.id)+'" aria-pressed="true"><strong>'+esc(r.quality)+'</strong><span>'+esc(r.displayBound)+'</span><small>'+esc(r.theorem)+'</small></button>').join('');inspect()}
 function select(n){if(records({publication}).some(r=>r.id===n.dataset.vqlResult))inspect()}
 root.addEventListener('click',e=>{const n=e.target.closest('[data-vql-result]');if(n)select(n)},{signal:controller.signal});
 root.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const n=e.target.closest('.vql-point');if(n){e.preventDefault();select(n)}},{signal:controller.signal});
 root.addEventListener('change',e=>{if(e.target.classList.contains('vql-publication')){publication=e.target.value;render();options.onPublicationChange?.(publication)}},{signal:controller.signal});
 render();const i={root,settingKey:key,redraw:render,destroy(){controller.abort();root.classList.remove('vql-view');instances.delete(i)}};instances.add(i);return i;
}
window.AtlasPairRenderers=window.AtlasPairRenderers||{};
window.AtlasPairRenderers['vertex-query_list']={mount,summarySVG,diagramSVG,records,release(root){for(const i of instances)if(!i.root.isConnected||i.root===root)i.destroy()}};
})();