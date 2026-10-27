(()=>{
'use strict';
const ID='edge-lca',data=JSON.parse(document.getElementById('atlas-data').textContent).focus[ID];if(!data)return;
const instances=new Set();let serial=0;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const math=s=>esc(s).replace(/log\^\{5\/2\}D/g,'log²·⁵D').replace(/\^\{([^{}]*)\}/g,'<tspan baseline-shift="super" font-size=".68em">$1</tspan>');
const tx=(x,y,t,cls='',anchor='start',extra='')=>'<text x="'+x+'" y="'+y+'" class="elca-'+cls+'" text-anchor="'+anchor+'" '+extra+'>'+math(t)+'</text>';
const line=(x1,y1,x2,y2,cls='grid')=>'<path d="M'+x1+' '+y1+'L'+x2+' '+y2+'" class="elca-'+cls+'"/>';
const records=(o={})=>data.verifiedRecords.map(r=>({...data.sources[r.sourceId],...r})).filter(r=>o.publication!=='published'||r.publicationStatus!=='preprint');
function geometry(w,h,o={},focus=false){
 const levels=['overview','compact','detail'],available=w<300||h<230?0:w<650||h<480?1:2,request=levels.indexOf(o.level),level=focus?'detail':levels[Math.min(available,request<0?available:request)];
 const compact=level==='compact',tiny=level==='overview',left=w*(tiny?.16:compact?.16:.40),right=w-(tiny?w*.10:compact?14:32),top=h*(tiny?.20:compact?.39:.235),bottom=h*(tiny?.81:compact?.72:.69);
 const points=records(o).map(r=>({id:r.id,x:w*(tiny?.62:compact?.68:.68),y:h*(tiny?.45:compact?.49:.42)}));
 return{w,h,level,left,right,top,bottom,points};
}
function marker(r,p,o,interactive,size){
 const selected=o.selected===r.id;
 return'<g class="elca-point" data-elca-result="'+esc(r.id)+'" data-kind="upper" data-panel="main" data-point-x="'+p.x+'" data-point-y="'+p.y+'"'+(interactive?' role="button" tabindex="0" aria-pressed="'+selected+'"':'')+' aria-label="'+esc(r.shortLabel+'; '+r.quality+'; '+r.bound+'; direct line-graph oracle')+'"><title>'+esc(r.shortLabel+' · '+r.quality+' · '+r.bound)+'</title><circle cx="'+p.x+'" cy="'+p.y+'" r="'+(size+6)+'" class="elca-halo" opacity="'+(selected?.32:.16)+'"/><circle cx="'+p.x+'" cy="'+p.y+'" r="'+size+'" class="elca-upper-marker"/></g>';
}
function chart(w,h,o={},interactive=false){
 const g=geometry(w,h,o,interactive),r=records(o)[0],p=g.points[0],tiny=g.level==='overview',compact=g.level==='compact';
 let s='<svg class="elca-'+(interactive?'map':'summary')+'" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="xMidYMid meet" data-detail-level="'+g.level+'" role="img" aria-label="Edge-coloring LCA baseline: direct line-graph oracle, deterministic stateless queries, D+1 colors and D to the O(sqrt D log to the 5/2 D) times log-star m probes per query"><title>Edge coloring · direct line-graph LCA</title><desc>One green point is a derived algorithm upper bound. Axes show exact symbolic palette and probe cost, with no numerical distance or frontier. The reviewed source supplies no matching lower bound for this oracle.</desc>';
 if(!r)return s+(tiny?'':tx(w/2,h/2,'No sources match this filter.','muted','middle'))+'</svg>';
 s+=line(g.left,g.top,g.left,g.bottom,'axis')+line(g.left,g.bottom,g.right,g.bottom,'axis');
 s+=line(g.left,p.y,g.right,p.y)+line(p.x,g.top,p.x,g.bottom);
 if(tiny)return s+marker(r,p,o,false,Math.max(2,Math.min(w,h)*.032))+'</svg>';
 if(compact){
  s+=tx(10,17,'Direct line-graph oracle','oracle')+tx(10,33,'Deterministic · stateless','muted');
  s+=tx(10,54,'Probes per edge query','axis-title','start','data-axis="y"');
  s+=tx(10,82,'F(D) · log* m','formula')+tx(w-14,82,'F(D): theorem factor','foot','end');
  s+=tx(w-14,p.y-17,'FHK16 · Theorem 5.1','upper-label','end')+marker(r,p,o,false,5);
  s+=tx(10,g.bottom+23,'Colors','axis-title','start','data-axis="x"')+tx(p.x,g.bottom+23,'D + 1 ≤ 2Δ − 1','palette','middle');
  s+=tx(10,h-27,'D ≤ 2Δ−2 · m edges in G','muted')+tx(10,h-9,'No lower bound in reviewed source','foot');
  return s+'</svg>';
 }
 const m=24;
 s+=tx(m,29,'One edge query, one consistent color','heading')+tx(m,54,'Direct line-graph oracle','oracle')+tx(m,77,'Deterministic · stateless · proper edge coloring','muted');
 s+=tx(m,g.top+3,'Probes per edge query','axis-title','start','data-axis="y"');
 s+=tx(m,p.y+3,r.displayBound,'formula');
 s+=tx(m,p.y+27,'Theorem’s probe convention on L(G)','muted');
 s+=tx(p.x,p.y-25,'FHK16 · Theorem 5.1','upper-label','middle')+marker(r,p,o,interactive,7);
 s+=tx(p.x,g.bottom+28,'D + 1 ≤ 2Δ − 1','palette','middle');
 s+=tx((g.left+g.right)/2,g.bottom+53,'Palette allowance · symbolic category','axis-title','middle','data-axis="x"');
 s+=tx(m,h*.855,'m = |E(G)| · D = maximum degree of L(G) ≤ 2Δ−2','muted');
 s+=tx(m,h*.901,'Fixed D: O(log* m) probes per query — specialization of this same bound.','muted');
 s+=tx(m,h*.947,'No matching lower bound verified in the reviewed source.','foot');
 s+=tx(m,h-9,'Symbolic axes; point position does not specify a numerical exponent.','foot');
 return s+'</svg>';
}
function diagramSVG(a={},b={}){return chart(1000,640,typeof a==='string'?b:(a||{}),true);}
function summarySVG(key,w,h,options={}){return chart(w,h,options,false);}
function release(root){for(const i of instances)if(!i.root.isConnected||i.root===root)i.destroy();}
function mount(root,key=ID,options={}){
 release(root);
 for(const name of ['StreamingMatching','DynamicMatching','LCAMatching','LocalMatching','MPCMatching','ListQueryMatching'])window[name]?.release(root);
 for(const [id,r]of Object.entries(window.AtlasPairRenderers||{}))if(id!==ID)r.release?.(root);
 const controller=new AbortController(),uid='elca-'+(++serial);let publication=options.publication||'all',selected=data.verifiedRecords[0]?.id;
 const opts=()=>({publication,selected});
 root.classList.add('focus-view','elca-view');root.classList.toggle('f-embedded',!!options.embedded);root.setAttribute('aria-label','Edge-coloring LCA baseline with direct line-graph oracle');
 root.innerHTML='<p class="f-kicker">EDGE COLORING × LCA</p><header class="f-hero"><div><h1>Answer an edge color consistently</h1><p>A deterministic baseline from conflict coloring, measured in direct line-graph oracle probes per query.</p></div></header><div class="elca-toolbar"><div class="elca-legend" id="'+uid+'"><span><i class="elca-key-upper"></i>Algorithm</span><span><i class="elca-key-oracle"></i>Direct L(G) oracle</span><span class="elca-muted-note">No reviewed lower bound</span></div><label>Sources <select class="elca-publication" aria-label="LCA source publication filter"><option value="all">All reviewed sources</option><option value="published">Published only</option></select></label></div><div class="elca-scroll" tabindex="0" aria-label="LCA edge-coloring figure; horizontal scrolling available on narrow screens"><div class="elca-plot"></div></div><div class="elca-notes"><p><b>What the point means.</b> The palette and probe formula are exact symbolic categories. The unknown constant in the exponent remains symbolic; this single baseline does not establish a tradeoff curve or tightness.</p><p><b>What one probe means.</b> The input supplies direct access to L(G), whose vertices are the edges of G. The figure retains the source theorem’s probe convention; an ordinary G-neighbor or matrix oracle needs a separately accounted simulation.</p></div><section class="elca-theorem" aria-live="polite" aria-label="Selected LCA theorem"></section><div class="elca-records" aria-label="Inspect LCA edge-coloring result"></div><p class="elca-coverage">'+esc(data.coverageNote)+'</p>';
 function inspect(){
  const r=records(opts()).find(r=>r.id===selected),el=root.querySelector('.elca-theorem');
  if(!r){el.innerHTML='<p>No sources match this filter.</p>';return;}
  el.innerHTML='<div class="elca-detail-head"><strong class="elca-green">Algorithm upper bound · derived baseline</strong><span>'+esc(r.shortLabel)+'</span></div><div class="elca-detail-values"><div><small>Palette allowance</small><strong>'+esc(r.palette)+'</strong></div><div><small>Probes per edge-color query</small><strong>'+esc(r.displayBound)+'</strong></div></div><p><b>Oracle.</b> '+esc(r.oracle)+'.</p><p><b>Output.</b> '+esc(r.output)+'.</p><p><b>State and consistency.</b> '+esc(r.state)+'. '+esc(r.adaptivity)+'.</p><p><b>Probability.</b> '+esc(r.probability)+'.</p><p>'+esc(r.fixedDegree)+'</p><p>'+esc(r.notes)+'</p><details><summary>Theorem, derivation, assumptions and primary source</summary><h3>'+esc(r.title)+'</h3><p>'+esc((r.authors||[]).join(', '))+' · '+esc(r.venue)+'</p><p><b>'+esc(r.theorem)+'</b></p><p><b>Graph.</b> '+esc(r.graph)+'.</p><p><b>Supplied parameters.</b> '+esc(r.parameters)+'.</p><ol>'+r.derivation.map(v=>'<li>'+esc(v)+'</li>').join('')+'</ol><ul>'+r.assumptions.map(v=>'<li>'+esc(v)+'</li>').join('')+'</ul><p><a href="'+esc(r.sourceUrl||r.fullTextUrl||r.url)+'" target="_blank" rel="noopener noreferrer">Read primary theorem ↗</a> · <a href="'+esc(r.url)+'" target="_blank" rel="noopener noreferrer">Paper record ↗</a></p></details>';
 }
 function render(){
  const rr=records(opts());if(!rr.some(r=>r.id===selected))selected=rr[0]?.id;
  root.querySelector('.elca-publication').value=publication;
  root.querySelector('.elca-plot').innerHTML=diagramSVG(opts());
  root.querySelector('.elca-records').innerHTML=rr.map(r=>'<button type="button" class="elca-record" data-elca-result="'+esc(r.id)+'" aria-pressed="'+(r.id===selected)+'"><span>'+esc(r.shortLabel)+'</span><strong>'+esc(r.quality)+'</strong><small>Direct line-graph oracle · '+esc(r.bound)+'</small></button>').join('');
  inspect();
 }
 function select(e){const b=e.target.closest('[data-elca-result]');if(b&&records(opts()).some(r=>r.id===b.dataset.elcaResult)){selected=b.dataset.elcaResult;render();}}
 root.addEventListener('click',select,{signal:controller.signal});
 root.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const b=e.target.closest('.elca-point');if(b){e.preventDefault();select(e);}}},{signal:controller.signal});
 root.addEventListener('change',e=>{if(e.target.classList.contains('elca-publication')){publication=e.target.value;render();options.onPublicationChange?.(publication);}},{signal:controller.signal});
 render();const instance={root,settingKey:ID,redraw:render,destroy(){controller.abort();root.classList.remove('elca-view');instances.delete(instance);}};instances.add(instance);return instance;
}
window.AtlasPairRenderers=window.AtlasPairRenderers||{};window.AtlasPairRenderers[ID]={mount,diagramSVG,summarySVG,records,release,layoutGeometry:geometry};
})();