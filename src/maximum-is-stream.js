/* Maximum independent-set streaming: a logarithmic-exponent comparison. */
(()=>{
'use strict';
const ID='maximum_is-stream';
window.AtlasPairRenderers=window.AtlasPairRenderers||{};
if(window.AtlasPairRenderers[ID])return;
const data=JSON.parse(document.getElementById('atlas-data').textContent).focus[ID];
if(!data)return;
const instances=new Set();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tx=(x,y,s,c='label',a='start')=>'<text x="'+x+'" y="'+y+'" class="mxs-'+c+'" text-anchor="'+a+'">'+esc(s)+'</text>';
const line=(x,y,X,Y,c='grid')=>'<line x1="'+x+'" y1="'+y+'" x2="'+X+'" y2="'+Y+'" class="mxs-'+c+'"/>';
function opts(a={},b={}){return typeof a==='string'?b:a;}
function records(a={},b={}){const o=opts(a,b);return data.verifiedRecords.map(r=>({...data.sources[r.sourceId],...r})).filter(r=>o.publication!=='published'||r.publicationStatus!=='preprint');}
function layoutGeometry(w=900,h=510,o={}){
 w=Math.max(1,Number(w)||900);h=Math.max(1,Number(h)||510);
 const capacity=w<280||h<190?0:w<650||h<430?1:2,levels=['overview','compact','detail'],wanted=levels.indexOf(o.level),level=levels[Math.min(capacity,wanted<0?capacity:wanted)];
 const tiny=level==='overview',detail=level==='detail';
 const left=w*(tiny?.10:.11),right=w*.94,top=h*(tiny?.14:detail?.20:.23),bottom=h*(tiny?.86:detail?.68:.78);
 const x=t=>left+(right-left)*t,y=s=>bottom-(bottom-top)*(s-1),offset=Math.min(3,h*.014);
 return {w,h,level,left,right,top,bottom,points:records(o).map(r=>{const shift=r.kind==='lower'?offset:-offset,mid=r.tMax*.57;return{id:r.id,start:{x:x(0),y:y(2)+shift},end:{x:x(r.tMax),y:y(2-r.tMax)+shift},marker:{x:x(mid),y:y(2-mid)+shift},tMax:r.tMax};})};
}
function draw(w,h,o={},interactive=false){
 const g=layoutGeometry(w,h,o),detail=g.level==='detail',tiny=g.level==='overview',rows=records(o),x=t=>g.left+(g.right-g.left)*t,y=s=>g.bottom-(g.bottom-g.top)*(s-1);
 let s='<svg class="'+(interactive?'mxs-map':'mxs-summary')+'" viewBox="0 0 '+g.w+' '+g.h+'" preserveAspectRatio="xMidYMid meet" data-detail-level="'+g.level+'" role="img" aria-label="'+esc(data.title)+'"><desc>'+esc(data.axisNote)+'</desc><rect class="mxs-background" width="'+g.w+'" height="'+g.h+'" rx="8"/>';
 for(const t of [0,.25,.5,.75,1])s+=line(x(t),g.top,x(t),g.bottom);
 for(const p of [1,1.5,2])s+=line(g.left,y(p),g.right,y(p));
 s+=line(g.left,g.top,g.left,g.bottom,'axis')+line(g.left,g.bottom,g.right,g.bottom,'axis');
 if(!tiny){
  s+=tx(g.left,detail?h*.06:h*.08,'Leading space exponent · logarithmic factors suppressed',detail?'title':'mini-label');
  for(const t of [0,.25,.5,.75,1])s+=tx(x(t),g.bottom+(detail?20:13),String(t),detail?'tick':'mini-tick','middle');
  for(const p of [1,1.5,2])s+=tx(g.left-(detail?14:7),y(p)+4,String(p),detail?'tick':'mini-tick','end');
  s+=tx((g.left+g.right)/2,g.bottom+(detail?43:29),'t: approximation β = n^t',detail?'label':'mini-label','middle');
  s+=tx(g.left,g.top-(detail?15:9),'s: space = n^s, up to logarithmic factors',detail?'label':'mini-label');
 }
 for(const r of rows){
  const p=g.points.find(z=>z.id===r.id),lower=r.kind==='lower',radius=tiny?Math.max(.2,Math.min(2,h*.03)):detail?6:3;
  s+='<g class="mxs-result mxs-'+(lower?'lower':'upper')+(o.selected===r.id?' mxs-selected':'')+'" data-mxs-result="'+esc(r.id)+'" data-kind="'+(lower?'lower':'upper')+'" data-point-x="'+p.marker.x+'" data-point-y="'+p.marker.y+'"'+(interactive?' role="button" tabindex="0" aria-pressed="'+(o.selected===r.id)+'"':'')+' aria-label="'+esc(r.shortName+'; '+r.displayBound+'; '+r.range)+'"><title>'+esc(r.displayBound+'; '+r.range+'; leading exponent 2−t')+'</title>';
  s+=line(p.start.x,p.start.y,p.end.x,p.end.y,'curve');
  s+='<circle class="mxs-end" cx="'+p.start.x+'" cy="'+p.start.y+'" r="'+radius+'"/><circle class="mxs-end mxs-end-open" cx="'+p.end.x+'" cy="'+p.end.y+'" r="'+radius+'"/>';
  s+=window.AtlasSymbols.mark(p.marker.x,p.marker.y,radius,'circle',r.kind);s+='</g>';
 }
 if(!tiny&&!rows.length)s+=tx((g.left+g.right)/2,(g.top+g.bottom)/2,'No published source in this reviewed panel.',detail?'label':'mini-label','middle');
 if(detail){
  if(rows.some(r=>r.kind!=='lower'))s+=tx(g.left,h*.82,'● Algorithm  O(n²/β) bits · 1 ≤ β ≤ n/log₂ n','bound-upper');
  if(rows.some(r=>r.kind==='lower'))s+=tx(g.left,h*.875,'● Lower bound  Ω(n²/(β log₂ n)) bits · 1 ≤ β ≤ √n/(36 log₂ n)','bound-lower');
  s+=tx(g.left,h*.93,'Open ends: fixed t<1 and t<1/2. Screen offset separates the marks; it is not a space gap.','note');
  s+=tx(g.left,h*.975,'Deterministic · one pass · insertion–deletion · explicit output · unrestricted computation','note');
 }
 return s+'</svg>';
}
function summarySVG(key,w=738,h=548,o={}){return draw(w,h,o,false);}
function diagramSVG(a={},b={}){const o=opts(a,b);return draw(o.width||900,o.height||510,{...o,level:'detail'},true);}
function release(root){for(const i of [...instances])if(i.root===root||!i.root.isConnected)i.destroy();}
function mount(root,key=ID,options={}){
 release(root);
 for(const name of ['StreamingMatching','DynamicMatching','LCAMatching','LocalMatching','MPCMatching','ListQueryMatching'])window[name]?.release(root);
 for(const [id,r]of Object.entries(window.AtlasPairRenderers))if(id!==ID)r.release?.(root);
 const controller=new AbortController();let publication=options.publication||'all',selected=data.verifiedRecords[0].id;
 root.classList.add('focus-view','mxs-view');root.classList.toggle('f-embedded',!!options.embedded);
 root.innerHTML='<p class="f-kicker">MAXIMUM INDEPENDENT SET × STREAMING</p><header class="f-hero"><div><h1>'+esc(data.title)+'</h1><p>'+esc(data.subtitle)+'</p></div></header><div class="mxs-toolbar"><span><b class="mxs-green">● Algorithm</b> · <b class="mxs-red">● Lower bound</b> · circles: deterministic insertion–deletion · both have leading exponent 2−t</span><label>Sources <select class="mxs-publication" aria-label="Maximum independent-set streaming publication filter"><option value="all">All reviewed sources</option><option value="published">Published only</option></select></label></div><div class="mxs-scroll" tabindex="0" aria-label="Streaming approximation figure; scroll horizontally on narrow screens"><div class="mxs-plot"></div></div><p class="mxs-reading">'+esc(data.axisNote)+'</p><section class="mxs-theorem" aria-live="polite" aria-label="Selected streaming theorem"></section><p class="mxs-coverage">'+esc(data.coverageNote)+'</p>';
 function inspect(){
  const r=records({publication}).find(z=>z.id===selected),box=root.querySelector('.mxs-theorem');
  if(!r){box.innerHTML='<p>Both reviewed records are documented in a preprint. Select all reviewed sources to inspect them.</p>';return;}
  const p=(k,v)=>'<p><b>'+esc(k)+'.</b> '+esc(v)+'</p>';
  box.innerHTML='<b class="'+(r.kind==='lower'?'mxs-red':'mxs-green')+'">'+esc(r.shortName)+' · PREPRINT</b><h2>'+esc(r.displayBound)+'</h2>'+p('Approximation',r.quality)+p('Theorem range',r.range)+p('Graph',r.graph)+p('Stream',r.oracle)+p('Output',r.output)+p('Randomness',r.probability)+p('Computation',r.computation)+p('Theorem',r.theorem)+p('Scope',r.notes)+'<div class="mxs-source-links"><a href="'+esc(r.url)+'" target="_blank" rel="noopener noreferrer">arXiv ↗</a><a href="'+esc(r.sourceUrl)+'" target="_blank" rel="noopener noreferrer">Primary theorem ↗</a></div>';
 }
 function render(){const rr=records({publication});if(!rr.some(r=>r.id===selected))selected=rr[0]?.id;root.querySelector('.mxs-publication').value=publication;root.querySelector('.mxs-plot').innerHTML=diagramSVG({publication,selected});inspect();}
 function select(e){const hit=e.target.closest('[data-mxs-result]');if(hit&&records({publication}).some(r=>r.id===hit.dataset.mxsResult)){selected=hit.dataset.mxsResult;render();}}
 root.addEventListener('click',select,{signal:controller.signal});
 root.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.closest('[data-mxs-result]')){e.preventDefault();select(e);root.querySelector('[data-mxs-result="'+selected+'"]')?.focus?.();}},{signal:controller.signal});
 root.addEventListener('change',e=>{if(e.target.classList.contains('mxs-publication')){publication=e.target.value;render();options.onPublicationChange?.(publication);}},{signal:controller.signal});
 const instance={root,settingKey:ID,redraw:render,destroy(){controller.abort();root.classList.remove('mxs-view');instances.delete(instance);}};instances.add(instance);render();return instance;
}
window.AtlasPairRenderers[ID]={mount,release,records,summarySVG,diagramSVG,layoutGeometry};
})();

