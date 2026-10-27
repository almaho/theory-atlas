(()=>{
'use strict';
const ID='mis-query_list',data=JSON.parse(document.getElementById('atlas-data').textContent).focus[ID];
if(!data)return;
const instances=new Set();let serial=0;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=(x,y,s,cls='',anchor='start',extra='')=>'<text x="'+x+'" y="'+y+'" class="'+cls+'" text-anchor="'+anchor+'" '+extra+'>'+esc(s)+'</text>';
const records=(o={})=>data.verifiedRecords.map(r=>({...data.sources[r.sourceId],...r})).filter(r=>o.publication!=='published'||r.publicationStatus!=='preprint');
function chart(w,h,o={},focus=false){
 const levels=['overview','compact','detail'],available=w<220||h<140?0:w<420||h<240?1:2,requested=levels.indexOf(o.level),level=focus?'detail':levels[Math.min(available,requested<0?available:requested)],tiny=level==='overview',detail=level==='detail';
 const z={l:tiny?9:detail?Math.min(116,w*.17):28,r:w-(tiny?9:detail?40:20),t:tiny?9:detail?Math.min(126,h*.24):33,b:h-(tiny?9:detail?Math.min(103,h*.25):27)};
 const px=a=>z.l+a*(z.r-z.l),py=a=>z.b-a*(z.b-z.t),rows=records(o);
 let s='<svg class="'+(focus?'miql-map':'miql-summary')+'" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="xMidYMid meet" data-detail-level="'+level+'" role="img" aria-label="Explicit maximal independent set: matching green upper and red lower bounds on total adjacency-array time Theta n beta."><title>Explicit MIS in adjacency arrays</title><desc>Beta is neighborhood independence. Both bounds follow the same n beta curve. The axes show asymptotic powers of n; positions follow the known formula, not measured runtimes. The lower bound is a worst-case statement for graph classes, not every graph.</desc>';
 if(!rows.length)return s+(tiny?'':text(w/2,h/2,'No sources match this filter.','miql-muted','middle'))+'</svg>';
 if(!tiny){s+=text(detail?24:12,detail?29:17,'Tight total time · Θ(nβ)','miql-heading');if(detail)s+=text(24,51,'Explicit MIS · degree + indexed-neighbor access','miql-muted')+text(24,73,'1 ≤ β ≤ Δ < n · deterministic comparison','miql-setup')+text(z.l,z.t-17,'Y · total time (asymptotic scale)','miql-axis-title','start','data-axis="y"');}
 for(const a of [0,.5,1]){const x=px(a),y=py(a);s+='<path d="M'+z.l+' '+y+'H'+z.r+'M'+x+' '+z.t+'V'+z.b+'" class="miql-grid"/>';if(detail){s+=text(z.l-13,y+4,['n','n³ᐟ²','n²'][a*2],'miql-tick','end')+text(x,z.b+25,['Θ(1)','Θ(√n)','Θ(n)'][a*2],'miql-tick','middle');}}
 s+='<path d="M'+z.l+' '+z.t+'V'+z.b+'H'+z.r+'" class="miql-axis"/>';
 const path='M'+px(0)+' '+py(0)+'L'+px(1)+' '+py(1);
 // The two paths share exact coordinates: their difference is an asymptotic bound direction.
 for(const r of [...rows].sort((a,b)=>(a.kind==='lower')-(b.kind==='lower'))){
  const lower=r.kind==='lower',color=lower?'var(--red)':'var(--green)',aria=focus?' tabindex="0" role="button" aria-pressed="'+(r.id===o.selected)+'"':'';
  s+='<g class="miql-result miql-'+r.kind+'" data-miql-result="'+esc(r.id)+'" data-kind="'+r.kind+'"'+aria+' aria-label="Inspect '+esc(r.displayBound)+' '+(lower?'lower bound':'algorithm')+'"><path data-boundary="n-beta" d="'+path+'" fill="none" stroke="'+color+'" stroke-width="'+(lower?1.7:3)+'"'+(lower?' stroke-dasharray="6 5"':'')+'/>';
  for(const a of [0,.5,1]){const x=px(a),y=py(a),radius=tiny?3:detail?5:3.5;
   if(lower){const d=radius+3;s+='<path data-marker="lower" data-center-x="'+x+'" data-center-y="'+y+'" d="M'+x+' '+(y-d)+'L'+(x+d)+' '+y+'L'+x+' '+(y+d)+'L'+(x-d)+' '+y+'Z" fill="none" stroke="'+color+'" stroke-width="1.7"/>'}
   else s+='<circle data-marker="algorithm" data-center-x="'+x+'" data-center-y="'+y+'" cx="'+x+'" cy="'+y+'" r="'+radius+'" fill="'+color+'"/>';
  }
  if(detail)s+=text(px(.5)+(lower?14:-14),py(.5)+(lower?31:-18),r.displayBound+(lower?' · lower bound':' · algorithm'),'miql-bound-label',lower?'start':'end');
  s+='</g>';
 }
 if(detail)s+=text((z.l+z.r)/2,z.b+50,'X · neighborhood independence β','miql-axis-title','middle','data-axis="x"')+text((z.l+z.r)/2,z.b+72,'β = nᵃ ⇒ time order n¹⁺ᵃ; endpoints show asymptotic regimes.','miql-muted','middle');
 else if(!tiny)s+=text(z.l-10,(z.t+z.b)/2,'T','miql-muted','end')+text(z.r,z.b+20,'β','miql-muted','end');
 return s+'</svg>';
}
function diagramSVG(a={},b={}){return chart(1000,540,typeof a==='string'?b:a,true)}
function summarySVG(key,w,h,options={}){return chart(w,h,options,false)}
function release(root){for(const i of instances)if(!i.root.isConnected||i.root===root)i.destroy()}
function mount(root,key=ID,options={}){
 release(root);for(const name of ['StreamingMatching','DynamicMatching','LCAMatching','LocalMatching','MPCMatching','ListQueryMatching'])window[name]?.release(root);
 for(const [id,r] of Object.entries(window.AtlasPairRenderers||{}))if(id!==ID)r.release?.(root);
 const controller=new AbortController(),uid='miql-'+(++serial);let publication=options.publication||'all',selected=records({publication})[0]?.id;
 const opts=()=>({publication,selected});
 root.classList.add('focus-view','miql-view');root.classList.toggle('f-embedded',!!options.embedded);root.setAttribute('aria-label','MIS adjacency-array algorithms and lower bounds');
 root.innerHTML='<p class="f-kicker">MAXIMAL INDEPENDENT SET × ADJACENCY-LIST QUERIES</p><header class="f-hero"><div><h1>Neighborhood independence determines the cost</h1><p>One shared time curve for an algorithm and its matching lower bound.</p></div></header><div class="miql-toolbar"><div class="miql-legend" id="'+uid+'"><span><i class="miql-key-alg"></i>Algorithm upper bound</span><span><i class="miql-key-lower"></i>Lower bound</span><span class="miql-setup"><i class="miql-key-setup"></i>Explicit MIS · adjacency array</span></div><label>Sources <select class="miql-publication" aria-label="MIS adjacency-list publication filter"><option value="all">All verified sources</option><option value="published">Published only</option></select></label></div><div class="miql-scroll" tabindex="0" aria-label="Shared MIS cost figure; scroll horizontally on narrow screens"><div class="miql-plot"></div></div><div class="miql-notes"><p><b>β is neighborhood independence:</b> the largest independent set among the neighbors of a vertex. For a nonempty simple graph, 1 ≤ β ≤ Δ &lt; n.</p><p><b>Both bounds have order nβ.</b> Circle and diamond share each coordinate. The lower bound is worst-case over a graph class, not a cost required on every individual graph. Degree and indexed-neighbor access each cost O(1).</p><p><b>Edge cases.</b> Edgeless graphs have β = 0; listing all vertices takes O(n) time. The complete upper bound from the proof is O(n(1+β)). The plotted regime has β ≥ 1.</p></div><section class="miql-theorem" aria-live="polite" aria-label="Selected MIS adjacency-list theorem"></section><div class="miql-records" aria-label="Inspect both bound statements"></div><p class="miql-coverage">'+esc(data.coverage)+'</p>';
 function inspect(){
  const r=records(opts()).find(r=>r.id===selected),el=root.querySelector('.miql-theorem');if(!r){el.innerHTML='<p>No results match this filter.</p>';return}
  el.innerHTML='<div class="miql-detail-top"><strong class="miql-'+r.kind+'">'+(r.kind==='lower'?'Lower-bound statement':'Algorithm guarantee')+'</strong><span>'+esc(r.shortLabel)+'</span></div><div class="miql-detail-grid"><div><small>Total time</small><strong>'+esc(r.displayBound)+'</strong></div><div><small>Output</small><strong>'+esc(r.output)+'</strong></div></div><p><b>Graph and access.</b> '+esc(r.graph)+' · '+esc(r.oracle)+'</p><p><b>Correctness.</b> '+esc(r.probability)+'</p><p>'+esc(r.notes)+'</p><details><summary>Theorem, assumptions and primary source</summary><h3>'+esc(r.title)+'</h3><p>'+esc((r.authors||[]).join(', '))+'</p><p><b>'+esc(r.theorem)+'</b></p><p>'+esc(r.assumptions.join('; '))+'</p><p><a href="'+esc(r.sourceUrl||r.fullTextUrl||r.url)+'" target="_blank" rel="noopener noreferrer">Read primary statement ↗</a> · <a href="'+esc(r.publicationUrl||r.url)+'" target="_blank" rel="noopener noreferrer">Publication ↗</a></p></details>';
 }
 function render(){const rr=records(opts());if(!rr.some(r=>r.id===selected))selected=rr[0]?.id;root.querySelector('.miql-publication').value=publication;root.querySelector('.miql-plot').innerHTML=diagramSVG(opts());root.querySelector('.miql-records').innerHTML=rr.map(r=>'<button class="miql-record miql-'+r.kind+'" type="button" data-miql-result="'+esc(r.id)+'" aria-pressed="'+(r.id===selected)+'"><span>'+esc(r.kind==='lower'?'Lower bound':'Algorithm')+'</span><strong>'+esc(r.displayBound)+'</strong><small>'+esc(r.shortLabel)+'</small></button>').join('');inspect()}
 root.addEventListener('click',e=>{const b=e.target.closest('[data-miql-result]');if(b){selected=b.dataset.miqlResult;render()}},{signal:controller.signal});
 root.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const b=e.target.closest('.miql-result');if(b){e.preventDefault();selected=b.dataset.miqlResult;render()}},{signal:controller.signal});
 root.addEventListener('change',e=>{if(e.target.classList.contains('miql-publication')){publication=e.target.value;render();options.onPublicationChange?.(publication)}},{signal:controller.signal});
 render();const instance={root,settingKey:ID,redraw:render,destroy(){controller.abort();root.classList.remove('miql-view');instances.delete(instance)}};instances.add(instance);return instance;
}
window.AtlasPairRenderers=window.AtlasPairRenderers||{};window.AtlasPairRenderers[ID]={mount,diagramSVG,summarySVG,records,release};
})();