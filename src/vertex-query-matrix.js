(()=>{
'use strict';
const data=JSON.parse(document.getElementById('atlas-data').textContent).focus['vertex-query_matrix'];
const instances=new Set(),allRows=[...data.verifiedRecords,...data.relatedResults];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const records=(o={})=>allRows.map(r=>({...data.sources[r.sourceId],...r})).filter(r=>o.publication!=='published'||r.publicationStatus!=='preprint');
const num=n=>String(Math.round(n*100)/100);
const text=(x,y,s,cls='vqm-label',anchor='start',extra='')=>'<text x="'+num(x)+'" y="'+num(y)+'" class="'+cls+'" text-anchor="'+anchor+'" '+extra+'>'+esc(s)+'</text>';
const resourceFor=o=>o.resource==='time'?'time':'queries';
function levelFor(w,h,o){if(o.focus)return'focus';const levels=['overview','compact','detail'],a=w<290||h<245?0:w<700||h<540?1:2,r=levels.indexOf(o.level);return levels[Math.min(a,r<0?a:r)]}
function marker(r,x,y,mode,o,span){
 const tiny=o.tiny,focus=o.focus,rich=o.rich,rad=tiny?Math.max(2,Math.min(4,o.w/40)):rich?6:4,lower=r.kind==='lower',selected=o.selected===r.id&&(lower||o.mode===mode);
 let s='<g class="vqm-point" data-vqm-result="'+esc(r.id)+'" data-vqm-mode="'+mode+'" data-kind="'+r.kind+'" data-center-x="'+num(x)+'" data-center-y="'+num(y)+'"'+(focus?' role="button" tabindex="0" aria-pressed="'+selected+'" aria-label="'+esc(lower?'Inspect zero-error lower bound, Omega nk, through k at most n to one third':'Inspect '+mode+' algorithm, '+r.variants[mode].displayBound+', through k at most n to one thirty-seventh')+'"':'')+'>';
 if(span)s+='<path class="'+(lower?'vqm-lower-line':'vqm-upper-line')+'" d="M'+num(span[0])+' '+num(y)+'H'+num(span[1])+'"/>';
 if(focus)s+='<circle class="vqm-selection" cx="'+num(x)+'" cy="'+num(y)+'" r="13"/>';
 s+='<circle class="vqm-hit" cx="'+num(x)+'" cy="'+num(y)+'" r="'+(focus?19:rad)+'"/>';
 if(lower)s+='<path class="vqm-lower" d="M'+num(x)+' '+num(y-rad)+'l'+rad+' '+rad+' -'+rad+' '+rad+' -'+rad+' -'+rad+'Z"/>';
 else if(mode==='deterministic')s+='<rect class="vqm-upper vqm-det-shape" x="'+num(x-rad)+'" y="'+num(y-rad)+'" width="'+2*rad+'" height="'+2*rad+'" rx="1"/>';
 else s+='<circle class="vqm-upper vqm-rand-shape" cx="'+num(x)+'" cy="'+num(y)+'" r="'+rad+'"/>';
 return s+'</g>';
}
function figure(w,h,o={}){
 const resource=resourceFor(o),level=levelFor(w,h,o),tiny=level==='overview',rich=level==='detail'||level==='focus',focus=level==='focus';
 const left=tiny?Math.max(5,w*.11):rich?104:58,right=w-(tiny?8:rich?28:13),stop=left+(right-left)*.58;
 const top=tiny?h*.19:rich?180:72,bottom=tiny?h*.79:rich?361:160,detY=tiny?top:rich?205:82,baseY=tiny?bottom-3:rich?330:145,off=tiny?2:rich?5:3;
 const x=left+(stop-left)*.49,rs=records(o),upper=rs.find(r=>r.kind==='algorithm'),lower=rs.find(r=>r.kind==='lower'),mo={...o,w,tiny,rich,focus};
 let s='<svg xmlns="http://www.w3.org/2000/svg" class="vqm-map" data-detail-level="'+level+'" data-resource="'+resource+'" data-axes="symbolic" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="xMidYMid meet" role="'+(focus?'group':'img')+'" aria-label="Full vertex k-coloring with matrix access: zero error, average '+(resource==='time'?'total time':'pair queries')+'; upper range k at most n to one thirty-seventh and lower range k at most n to one third."><title>Average cost of full k-coloring</title><desc>Green circles and squares are randomized and deterministic algorithm upper bounds. Red diamonds are zero-error lower bounds. The vertical order is cost divided by nk, not numerical runtime. The horizontal axis marks validity endpoints, not numeric k spacing. Upper bounds average over uniform labeled k-colorable graphs; the lower bound holds on every input and random string.</desc>';
 if(!tiny){
  s+=text(rich?27:13,rich?30:19,rich?'Full k-coloring · average cost, zero error':'k-coloring · '+(resource==='time'?'average total time':'average pair queries'),'vqm-heading');
  if(rich){
   s+=text(27,59,'Uniform labeled k-colorable inputs · correct on every promised graph','vqm-muted');
   s+='<circle class="vqm-upper" cx="32" cy="84" r="4"/>'+text(43,88,'Algorithm upper bound','vqm-legend');
   s+='<path class="vqm-lower" d="M245 80l4 4 -4 4 -4 -4Z"/>'+text(255,88,'Zero-error lower bound','vqm-legend');
   s+=text(27,114,'○ Randomized','vqm-rand-label')+text(172,114,'□ Deterministic','vqm-det-label');
   s+=text(left,153,data.resourceViews[resource].normalizedAxis+' · symbolic order','vqm-axis-title','start','data-axis="y"');
  }else{
   s+='<circle class="vqm-upper" cx="16" cy="35" r="3"/>'+text(24,39,'Rand. upper','vqm-legend');
   s+='<rect class="vqm-upper" x="109" y="32" width="6" height="6"/>'+text(122,39,'Det. upper','vqm-legend');
   s+='<path class="vqm-lower" d="M216 32l3 3 -3 3 -3 -3Z"/>'+text(224,39,'Lower','vqm-legend');
   s+=text(5,57,'Cost / nk','vqm-axis-title','start','data-axis="y"');
  }
 }
 s+='<g data-panel="average"><rect class="vqm-extension" x="'+num(stop)+'" y="'+top+'" width="'+num(right-stop)+'" height="'+(bottom-top)+'"/><path class="vqm-axis" d="M'+left+' '+top+'V'+bottom+'H'+right+'"/>';
 [detY,baseY].forEach((yy,i)=>{s+='<path class="vqm-grid" d="M'+left+' '+yy+'H'+right+'"/>';if(!tiny)s+=text(left-9,yy+4,i?'1':'polylog n','vqm-tick','end')});
 s+='<path class="vqm-cut" d="M'+num(stop)+' '+top+'V'+bottom+'"/>';
 const inset=tiny?4:rich?17:8;
 if(upper){
  s+=marker(upper,x,detY,'deterministic',mo,[left+inset,stop]);
  s+=marker(upper,x,baseY-off,'randomized',mo,[left+inset,stop]);
 }
 if(lower)s+=marker(lower,rich?(stop+right)/2:(stop+right)/2,baseY+off,'both',mo,[left+inset,right-inset]);
 if(!tiny){
  if(upper){s+=text(x,detY-(rich?20:14),'Õ(nk)','vqm-bound','middle');s+=text(x,baseY-(rich?29:18),'O(nk)','vqm-bound','middle');}
  if(lower)s+=text((stop+right)/2,baseY-(rich?20:14),'Ω(nk)','vqm-low-label','middle');
  if(rich&&lower){s+=text((stop+right)/2,215,'Lower bound only','vqm-side-label','middle');s+=text((stop+right)/2,239,'in the reviewed sources','vqm-muted','middle');}
  else if(lower)s+=text((stop+right)/2,94,'Lower only','vqm-side-label','middle');
  if(!rs.length)s+=text((left+right)/2,(top+bottom)/2,'No sources under this filter','vqm-muted','middle');
  s+=text(left,bottom+(rich?24:19),'2','vqm-tick','middle');
  s+=text(stop,bottom+(rich?24:19),'n^(1/37)','vqm-tick','middle');
  s+=text(right,bottom+(rich?24:19),'n^(1/3)','vqm-tick','end');
  s+=text((left+right)/2,bottom+(rich?56:36),'k · symbolic range','vqm-axis-title','middle','data-axis="x"');
 }
 s+='</g>';
 if(rich){
  s+=text(27,h-100,'Fixed k ≥ 2: randomized Θ(n); deterministic upper Õ(n).','vqm-callout');
  s+=text(27,h-72,'Upper bounds average over inputs; the lower bound holds on every input.','vqm-note');
  s+=text(27,h-47,'Every promised graph and every random string must yield a correct full coloring.','vqm-note');
  s+=text(27,h-22,resource==='queries'?'Query uppers follow from unit-cost runtime; the lower proof directly counts queries.':'Theorems 1–2 bound total time. Rare inputs can require exhaustive fallback.','vqm-note');
 }else if(!tiny){
  s+=text(13,218,'Fixed k ≥ 2: randomized Θ(n)','vqm-callout');
  s+=text(13,237,'Zero error on every promised input','vqm-note');
 }
 return s+'</svg>';
}
function summarySVG(key,w,h,o={}){return figure(Math.max(40,Number(w)||738),Math.max(40,Number(h)||548),{...o,focus:false})}
function diagramSVG(key='vertex-query_matrix',o={}){if(typeof key==='object'){o=key;key=o.key||'vertex-query_matrix'}return figure(1000,548,{...o,focus:true})}
function mount(root,key='vertex-query_matrix',options={}){
 for(const i of instances)if(!i.root.isConnected||i.root===root)i.destroy();
 let resource=resourceFor(options),publication=options.publication||'all',selected=data.defaultSelected,mode=data.defaultMode;
 const controller=new AbortController();
 root.classList.add('focus-view','vqm-view');root.classList.toggle('f-embedded',!!options.embedded);
 root.innerHTML='<p class="f-kicker">VERTEX COLORING × ADJACENCY MATRIX</p><header class="f-hero"><div><h1>Average cost of full k-coloring</h1><p class="vqm-subtitle"></p></div></header><div class="f-scope"><span><b>Input</b> uniform labeled k-colorable graphs</span><span><b>Access</b> one adjacency bit per query</span><span><b>Output</b> all n vertex colors from [k]</span><span><b>Correctness</b> zero error on every promised input</span></div><div class="vqm-toolbar"><div class="vqm-tabs" role="group" aria-label="Matrix coloring cost measure"><button type="button" data-vqm-resource="queries">Pair queries</button><button type="button" data-vqm-resource="time">Total time</button></div><label>Sources <select class="vqm-publication" aria-label="Matrix vertex-coloring source publication filter"><option value="all">All verified sources</option><option value="published">Published only</option></select></label></div><div class="vqm-scroll" tabindex="0" aria-label="Average k-coloring figure; scroll horizontally on narrow screens"><div class="vqm-plot"></div></div><p class="vqm-read"><b>Read the axes.</b> Horizontal positions mark theorem ranges for k; they are not numerically spaced. The vertical tiers show cost after dividing by nk. The upper tier denotes an unspecified polylog(n) upper factor, not a proven gap. Green circles are randomized upper bounds, green squares deterministic upper bounds, and red diamonds lower bounds. k=1 is excluded.</p><section class="vqm-theorem" aria-label="Selected theorem and primary source" aria-live="polite"></section><details class="vqm-source-list"><summary>Inspect all theorem statements</summary><div class="vqm-records"></div></details><p class="vqm-coverage">'+esc(data.coverageNote)+' Reviewed '+esc(data.reviewedOn)+'.</p>';
 const opts=()=>({resource,publication,selected,mode});
 function inspect(){
  const rs=records(opts());let r=rs.find(r=>r.id===selected);if(!r){r=rs[0];selected=r?.id;mode=r?.kind==='algorithm'?'randomized':'both'}
  const el=root.querySelector('.vqm-theorem');if(!r){el.innerHTML='<p>No theorem is available under this publication filter.</p>';return}
  const v=r.variants?.[mode]||r.variants?.randomized,lower=r.kind==='lower',formula=lower?'Ω(nk)':v.displayBound,expectation=lower?'For every promised G and every random string r: Q(G,r) = Ω(nk), hence T(G,r) = Ω(nk).':resource==='queries'?v.queryBound:v.expectation;
  el.innerHTML='<div class="vqm-detail-head"><span class="'+(lower?'vqm-red':'vqm-green')+'">'+(lower?'Zero-error lower bound':mode+' algorithm')+'</span><strong>'+esc(r.shortLabel)+'</strong><span>'+esc(r.venue)+'</span></div><div class="vqm-detail-grid"><div><small>'+esc(data.resourceViews[resource].label)+'</small><strong>'+esc(formula)+'</strong></div><div><small>Valid k-range</small><strong>'+esc(r.kRange)+'</strong></div><div><small>Output</small><strong>All n colors from [k]</strong></div></div><p class="vqm-formula">'+esc(expectation)+'</p><p><b>Correctness.</b> '+esc(v?v.probability:r.probability)+'</p><p><b>Resource provenance.</b> '+esc(data.resourceViews[resource][lower?'lowerProvenance':'upperProvenance'])+'</p><p>'+esc(r.notes)+'</p><details open><summary>Exact theorem, assumptions and primary source</summary><h3>'+esc(r.title)+'</h3><p>'+esc(r.authors.join(', '))+'</p><p><b>'+esc(v?v.theorem:r.theorem)+'</b></p><p><b>Distribution.</b> '+esc(r.distribution)+'</p><ul>'+r.assumptions.map(a=>'<li>'+esc(a)+'</li>').join('')+'</ul><p>'+esc(r.output)+'</p><p><a href="'+esc(r.verificationUrl)+'" target="_blank" rel="noopener noreferrer">Inspect the primary theorem and proof ↗</a> · <a href="'+esc(r.url)+'" target="_blank" rel="noopener noreferrer">Paper record ↗</a></p></details>';
 }
 function list(){root.querySelector('.vqm-records').innerHTML=records(opts()).flatMap(r=>r.variants?Object.keys(r.variants).map(m=>({r,m})): [{r,m:'both'}]).map(({r,m})=>'<button type="button" class="vqm-record '+(r.kind==='lower'?'vqm-red':'vqm-green')+'" data-vqm-result="'+esc(r.id)+'" data-vqm-mode="'+m+'" aria-pressed="'+(r.id===selected&&(r.kind==='lower'||mode===m))+'"><strong>'+esc(r.kind==='lower'?'Zero-error lower bound':m+' upper bound')+'</strong><span>'+esc(r.variants?.[m].displayBound||r.displayBound)+'</span><small>'+esc(r.kRange)+' · '+esc(r.variants?.[m].theorem||r.theorem)+'</small></button>').join('')}
 function render(){
  const available=records(opts());if(!available.some(r=>r.id===selected)){selected=available[0]?.id;mode=available[0]?.kind==='algorithm'?'randomized':'both'}
  if(available.find(r=>r.id===selected)?.variants&&!['randomized','deterministic'].includes(mode))mode='randomized';
  root.setAttribute('aria-label','Vertex k-coloring with matrix access: '+data.resourceViews[resource].label);
  root.querySelector('.vqm-subtitle').textContent=data.resourceViews[resource].label+' over uniform k-colorable inputs; always a correct full coloring.';
  root.querySelector('.vqm-publication').value=publication;
  root.querySelectorAll?.('[data-vqm-resource]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.vqmResource===resource)));
  root.querySelector('.vqm-plot').innerHTML=diagramSVG(key,opts());inspect();list();
 }
 function select(n){selected=n.dataset.vqmResult;mode=n.dataset.vqmMode||'randomized';inspect();list();root.querySelectorAll?.('.vqm-point').forEach(p=>p.setAttribute('aria-pressed',String(p.dataset.vqmResult===selected&&(mode==='both'||p.dataset.vqmMode===mode))))}
 root.addEventListener('click',e=>{const tab=e.target.closest('[data-vqm-resource]');if(tab){resource=tab.dataset.vqmResource;render();return}const n=e.target.closest('[data-vqm-result]');if(n)select(n)},{signal:controller.signal});
 root.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const n=e.target.closest('.vqm-point');if(n){e.preventDefault();select(n)}},{signal:controller.signal});
 root.addEventListener('change',e=>{if(e.target.classList.contains('vqm-publication')){publication=e.target.value;render();options.onPublicationChange?.(publication)}},{signal:controller.signal});
 render();const i={root,settingKey:key,redraw:render,destroy(){controller.abort();root.classList.remove('vqm-view');instances.delete(i)}};instances.add(i);return i;
}
window.AtlasPairRenderers=window.AtlasPairRenderers||{};
window.AtlasPairRenderers['vertex-query_matrix']={mount,summarySVG,diagramSVG,records,release(root){for(const i of instances)if(!i.root.isConnected||i.root===root)i.destroy()}};
})();
