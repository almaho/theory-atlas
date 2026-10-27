(()=>{
'use strict';
const data=JSON.parse(document.getElementById('atlas-data').textContent).focus['edge-query_matrix'];
const instances=new Set();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rows=[...data.verifiedRecords,...data.relatedResults];
const records=(options={})=>rows.map(r=>({...data.sources[r.sourceId],...r})).filter(r=>options.publication!=='published'||r.publicationStatus!=='preprint');
const num=n=>String(Math.round(n*100)/100);
const text=(x,y,value,cls='eqm-label',anchor='start',extra='')=>'<text x="'+num(x)+'" y="'+num(y)+'" class="'+cls+'" text-anchor="'+anchor+'" '+extra+'>'+esc(value)+'</text>';
function levelFor(w,h,options){
 if(options.focus)return'focus';
 const levels=['overview','compact','detail'],available=w<290||h<245?0:w<700||h<540?1:2,requested=levels.indexOf(options.level);
 return levels[Math.min(available,requested<0?available:requested)];
}
function figure(w,h,options={}){
 const level=levelFor(w,h,options),tiny=level==='overview',rich=level==='detail'||level==='focus',focus=level==='focus';
 const left=tiny?Math.max(5,w*.12):rich?78:39,right=tiny?w-8:rich?w*.54:w-16;
 const top=tiny?h*.22:rich?143:78,bottom=tiny?h*.72:rich?267:135;
 const x=(left+right)/2,y=top,record=records(options)[0],rad=tiny?Math.max(2,Math.min(4,w/30)):rich?7:5;
 let s='<svg xmlns="http://www.w3.org/2000/svg" class="eqm-map" data-detail-level="'+level+'" data-view="enumeration" data-axes="symbolic" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="xMidYMid meet" role="'+(focus?'group':'img')+'" aria-label="Edge coloring with adjacency-matrix queries: enumerate all n choose 2 pairs, then compute a proper Delta plus 1 coloring."><title>Edge coloring · full matrix scan</title><desc>Green denotes an algorithm. The point has palette Delta plus 1 and quadratic query order, with exact query count n(n−1)/2. Axis spacing is symbolic, not numeric. Computation and output are separate resources. No matrix-query lower bound is claimed.</desc>';
 if(!tiny){
  s+=text(rich?27:13,rich?30:19,rich?'Scan every pair, then color the edges':'Full matrix scan · explicit coloring','eqm-heading');
  s+='<circle class="eqm-upper" cx="'+(rich?32:17)+'" cy="'+(rich?58:35)+'" r="4"/>';
  s+=text(rich?44:27,rich?62:39,'Algorithm baseline','eqm-legend');
  if(rich)s+=text(w-27,62,'Known vertices · simple graph','eqm-muted','end');
  if(rich)s+=text(left,100,'Pair queries · symbolic order','eqm-axis-title','start','data-axis="y"');
  else s+=text(w-14,39,'Same scan at every density','eqm-muted','end');
 }
 s+='<g data-panel="enumeration"><path class="eqm-axis" d="M'+left+' '+top+'V'+bottom+'H'+right+'"/>';
 [top,bottom].forEach((yy,i)=>{s+='<path class="eqm-grid" d="M'+left+' '+yy+'H'+right+'"/>';if(!tiny)s+=text(left-10,yy+4,i?'n':'n²','eqm-tick','end')});
 s+='<path class="eqm-vgrid" d="M'+num(x)+' '+top+'V'+bottom+'"/>';
 if(record){
  s+='<g class="eqm-point" data-eqm-result="'+esc(record.id)+'" data-kind="algorithm" data-center-x="'+num(x)+'" data-center-y="'+num(y)+'"'+(focus?' role="button" tabindex="0" aria-label="Inspect the scan-and-color theorem: exactly n(n−1)/2 pair queries, Delta plus 1 colors" aria-pressed="true"':'')+'>';
  if(focus)s+='<circle class="eqm-selection" cx="'+num(x)+'" cy="'+y+'" r="14"/>';
  s+='<circle class="eqm-hit" cx="'+num(x)+'" cy="'+y+'" r="'+(focus?20:rad)+'"/><circle class="eqm-upper" cx="'+num(x)+'" cy="'+y+'" r="'+rad+'"/></g>';
  if(!tiny){s+=text(x,top-(rich?20:17),'n(n−1)/2','eqm-bound','middle');if(rich)s+=text(x,top+30,'exact pair queries','eqm-muted','middle');}
 }else if(!tiny)s+=text(x,top+30,'No source under this filter','eqm-muted','middle');
 if(!tiny){
  s+=text(x,bottom+22,'Δ+1','eqm-palette','middle');
  s+=text(x,bottom+(rich?44:39),'Palette q','eqm-axis-title','middle','data-axis="x"');
  if(!rich)s+=text(3,59,'Queries','eqm-axis-title','start','data-axis="y"');
 }
 s+='</g>';
 if(rich){
  const rx=w*.62;
  s+='<path class="eqm-note-rule" d="M'+(rx-15)+' 117V257"/>';
  s+=text(rx,133,'Sparse or dense','eqm-side-heading');
  s+=text(rx,160,'Every unordered pair','eqm-label');
  s+=text(rx,181,'is queried once.','eqm-label');
  s+=text(rx,222,'The graph is fully known','eqm-muted');
  s+=text(rx,242,'before coloring starts.','eqm-muted');
  const ledgerY=h-194,gap=12,cw=(w-54-2*gap)/3;
  s+=text(27,ledgerY-17,'Computation and output · separate accounting','eqm-axis-title');
  const cards=[
   ['Enumerate','O(n²)','time to scan every pair'],
   ['Color stored edges','O(m log max{2,Δ})','randomized time · w.h.p.'],
   ['Write the output','m assignments','one color per actual edge']
  ];
  cards.forEach((card,i)=>{const cx=27+i*(cw+gap);s+='<rect class="eqm-cost-bg" x="'+cx+'" y="'+ledgerY+'" width="'+cw+'" height="88" rx="9"/>';s+=text(cx+14,ledgerY+22,card[0],'eqm-cost-title');s+=text(cx+14,ledgerY+48,card[1],'eqm-cost-bound');s+=text(cx+14,ledgerY+71,card[2],'eqm-cost-note');});
  s+=text(27,h-73,'Total time: O(n² + m log max{2,Δ}) w.h.p.','eqm-total');
  s+=text(27,h-47,'Δ ≥ 2: Corollary C.1(1).  Δ ≤ 1: color directly in O(m) time.','eqm-note');
  s+=text(27,h-20,'No verified matrix-query lower bound in this source set.','eqm-note');
 }else if(!tiny){
  s+='<path class="eqm-note-rule" d="M13 184H'+(w-13)+'"/>';
  s+=text(13,200,'Post-scan: O(m log max{2,Δ}) w.h.p.','eqm-cost-note');
  s+=text(13,218,'Output: m edge–color assignments','eqm-cost-note');
  s+=text(13,237,'No verified query lower bound','eqm-note');
 }
 return s+'</svg>';
}
function summarySVG(key,w,h,options={}){return figure(Math.max(40,Number(w)||738),Math.max(40,Number(h)||548),{...options,focus:false})}
function diagramSVG(key='edge-query_matrix',options={}){if(typeof key==='object'){options=key;key=options.key||'edge-query_matrix'}return figure(1000,548,{...options,focus:true})}
function mount(root,key='edge-query_matrix',options={}){
 for(const i of instances)if(!i.root.isConnected||i.root===root)i.destroy();
 let publication=options.publication||'all';
 const controller=new AbortController();
 root.classList.add('focus-view','eqm-view');root.classList.toggle('f-embedded',!!options.embedded);
 root.setAttribute('aria-label','Edge coloring with adjacency-matrix access and explicit full output');
 root.innerHTML='<p class="f-kicker">EDGE COLORING × ADJACENCY MATRIX</p><header class="f-hero"><div><h1>Scan every pair, then color the edges</h1><p>The matrix queries discover the graph. The coloring theorem starts after that scan.</p></div></header><div class="f-scope"><span><b>Input</b> undirected simple graph</span><span><b>Access</b> Pair(u,v) adjacency bit</span><span><b>Output</b> a color for every edge</span><span><b>Palette</b> Δ+1</span></div><div class="eqm-toolbar"><span class="eqm-green">● Algorithm baseline</span><label>Sources <select class="eqm-publication" aria-label="Matrix edge-coloring source publication filter"><option value="all">All verified sources</option><option value="published">Published only</option></select></label></div><div class="eqm-scroll" tabindex="0" aria-label="Matrix edge-coloring figure; scroll horizontally on narrow screens"><div class="eqm-plot"></div></div><p class="eqm-read"><b>Read the figure.</b> The vertical tiers indicate asymptotic query order; the label gives the exact number. The scan is the same on sparse and dense inputs. Green is an algorithm; no red marker is drawn because this source set supplies no matrix-query lower bound.</p><section class="eqm-theorem" aria-label="Selected theorem and primary source" aria-live="polite"></section><details class="eqm-source-list"><summary>Inspect the supplied result</summary><div class="eqm-records"></div></details><p class="eqm-coverage">'+esc(data.coverageNote)+' Reviewed '+esc(data.reviewedOn)+'.</p>';
 function inspect(){
  const r=records({publication})[0],el=root.querySelector('.eqm-theorem');
  if(!r){el.innerHTML='<p>No theorem is available under this publication filter.</p>';return}
  el.innerHTML='<div class="eqm-detail-head"><span class="eqm-green">Algorithm baseline</span><strong>'+esc(r.shortLabel)+'</strong><span>'+esc(r.venue)+'</span></div><div class="eqm-detail-grid"><div><small>Pair queries · exact</small><strong>n(n−1)/2</strong></div><div><small>After enumeration</small><strong>'+esc(r.postScanTime)+'</strong></div><div><small>Output</small><strong>'+esc(r.outputCount)+'</strong></div></div><p><b>Guarantee.</b> '+esc(r.quality)+'; '+esc(r.output)+'</p><p><b>Randomization.</b> '+esc(r.probability)+'</p><p>'+esc(r.notes)+'</p><details open><summary>Exact theorem, derivation and source</summary><h3>'+esc(r.title)+'</h3><p>'+esc(r.authors.join(', '))+'</p><p><b>'+esc(r.theorem)+'</b></p><h4>How the matrix baseline is derived</h4><ol>'+r.derivation.map(a=>'<li>'+esc(a)+'</li>').join('')+'</ol><h4>Scope and edge cases</h4><ul>'+r.assumptions.map(a=>'<li>'+esc(a)+'</li>').join('')+'</ul><p><b>Total time.</b> '+esc(r.totalTime)+'; this includes the scan.</p><p><a href="'+esc(r.verificationUrl)+'" target="_blank" rel="noopener noreferrer">Inspect Corollary C.1 and proof ↗</a> · <a href="'+esc(r.url)+'" target="_blank" rel="noopener noreferrer">Paper record ↗</a></p></details>';
 }
 function render(){
  root.querySelector('.eqm-publication').value=publication;
  root.querySelector('.eqm-plot').innerHTML=diagramSVG(key,{publication});
  root.querySelector('.eqm-records').innerHTML=records({publication}).map(r=>'<button type="button" class="eqm-record" data-eqm-result="'+esc(r.id)+'" aria-pressed="true"><strong>'+esc(r.quality)+'</strong><span>'+esc(r.displayBound)+'</span><small>'+esc(r.shortLabel)+' · '+esc(r.theorem)+'</small></button>').join('');
  inspect();
 }
 function select(node){if(records({publication}).some(r=>r.id===node.dataset.eqmResult))inspect()}
 root.addEventListener('click',e=>{const n=e.target.closest('[data-eqm-result]');if(n)select(n)},{signal:controller.signal});
 root.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const n=e.target.closest('.eqm-point');if(n){e.preventDefault();select(n)}},{signal:controller.signal});
 root.addEventListener('change',e=>{if(e.target.classList.contains('eqm-publication')){publication=e.target.value;render();options.onPublicationChange?.(publication)}},{signal:controller.signal});
 render();
 const instance={root,settingKey:key,redraw:render,destroy(){controller.abort();root.classList.remove('eqm-view');instances.delete(instance)}};instances.add(instance);return instance;
}
window.AtlasPairRenderers=window.AtlasPairRenderers||{};
window.AtlasPairRenderers['edge-query_matrix']={mount,summarySVG,diagramSVG,records,release(root){for(const i of instances)if(!i.root.isConnected||i.root===root)i.destroy()}};
})();
