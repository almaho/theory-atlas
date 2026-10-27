(()=>{
'use strict';
const ID='vertex-local',data=JSON.parse(document.getElementById('atlas-data').textContent).focus[ID];if(!data)return;
const instances=new Set();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const math=s=>esc(s).replace(/\^\{([^{}]*)\}/g,'<tspan baseline-shift="super" font-size=".72em">$1</tspan>');
const tx=(x,y,t,c='label',a='start',extra='')=>'<text x="'+x+'" y="'+y+'" class="vloc-'+c+'" text-anchor="'+a+'" '+extra+'>'+math(t)+'</text>';
const ln=(x1,y1,x2,y2,c='grid')=>'<path class="vloc-'+c+'" d="M'+x1+' '+y1+'L'+x2+' '+y2+'"/>';
const all=data.verifiedRecords.concat(data.relatedResults||[]);
function records(o={}){return all.map(r=>({...data.sources[r.sourceId],...r})).filter(r=>(o.publication!=='published'||r.publicationStatus!=='preprint')&&(!o.panel||r.panel===o.panel));}
const views={variable:'All setups',cycle:'Cycles · Δ=2',high:'High degree',brooks:'Fewer colors',sparse:'Sampled network'};
const routeViews={'vertex-local-cycle':'cycle','vertex-local-high':'high','vertex-local-brooks':'brooks','vertex-local-sparse':'sparse'};
function viewFor(key,o){return o.view&&views[o.view]?o.view:(routeViews[key]||'variable');}
function levelFor(w,h,o){const fit=w<300||h<230?0:w<650||h<480?1:2,wanted=['overview','compact','detail'].indexOf(o.level);return['overview','compact','detail'][Math.min(fit,wanted<0?fit:wanted)];}
function geometry(w,h,o={}){
 const level=levelFor(w,h,o),tiny=level==='overview',compact=level==='compact',view=o.view||'variable',points=[],boxes={};
 const rows=records(o),get=id=>rows.find(r=>r.id===id);
 function box(panel,x,y,bw,bh,mini){
  const left=x+bw*.13,right=x+bw*.93,top=y+bh*.28,bottom=y+bh*.82;
  boxes[panel]={panel,x,y,w:bw,h:bh,left,right,top,bottom,mini};
  const add=(r,fx,fy,context='')=>{if(r)points.push({id:r.id,panel,x:left+(right-left)*fx,y:top+(bottom-top)*fy,context});};
  if(panel==='cycle'){add(get('vertex-result-48'),.5-.055,.5,'cycle-upper');add(get('vertex-result-53'),.5+.055,.5,'cycle-lower');}
  if(panel==='high'){add(rows.find(r=>r.panel==='high'&&r.contractKey==='full'),.28,.5);add(rows.find(r=>r.panel==='high'&&r.contractKey==='partial'),.75,.5);}
  if(panel==='brooks'){const r=rows.find(r=>r.panel==='brooks');add(r,mini?.88:.52,.25,'brooks-general');add(r,mini?.88:.52,.78,'brooks-high');}
  if(panel==='sparse'){add(rows.find(r=>r.panel==='sparse'&&r.kind!=='lower'),mini?.88:.52,.22);add(rows.find(r=>r.panel==='sparse'&&r.kind==='lower'),mini?.88:.52,.78);}
 }
 if(view==='variable'){
  const left=w*(tiny?.40:compact?.44:.43),right=w-(tiny?6:compact?10:24),top=tiny?h*.08:compact?47:98,bottom=tiny?h*.64:compact?h*.59:h*.62;
  boxes.main={panel:'main',x:0,y:0,w,h,left,right,top,bottom};
  rows.filter(r=>r.panel==='main').forEach(r=>{const i=data.mainRows.findIndex(a=>a.id===r.rowKey),j=['ordinary','delta-list','degree-list'].indexOf(r.contractKey);points.push({id:r.id,panel:'main',x:left+(right-left)*(j+.5)/3,y:top+(bottom-top)*(i+.5)/8,context:'main'});});
  const y=tiny?h*.72:compact?h*.75:h*.75,bh=h-y-(tiny?4:compact?6:14),pad=tiny?4:compact?8:12,gap=tiny?3:compact?4:8,bw=(w-2*pad-3*gap)/4;
  ['cycle','high','brooks','sparse'].forEach((p,i)=>box(p,pad+i*(bw+gap),y,bw,bh,true));
 }else box(view,12,tiny?5:compact?45:88,w-24,h-(tiny?12:compact?72:125),false);
 return{w,h,level,view,points,boxes};
}
function mark(r,p,o,interactive,g){
 const sz=g.level==='overview'?Math.max(2,Math.min(g.w,g.h)*.014):g.level==='compact'?3.6:5;
 const mode=r.mode==='randomized'?'rand':'det',selected=o.selected===r.id;
 return'<g class="vloc-point vloc-'+mode+'" data-vloc-result="'+esc(r.id)+'" data-vloc-context="'+esc(p.context||p.panel)+'" data-panel="'+p.panel+'" data-kind="'+r.kind+'" data-point-x="'+p.x+'" data-point-y="'+p.y+'"'+(interactive?' role="button" tabindex="0" aria-pressed="'+selected+'"':'')+' aria-label="'+esc((r.kind==='lower'?'Lower bound: ':'Algorithm: ')+r.shortLabel+'; '+r.quality+'; '+r.displayBound+'; '+r.probability)+'"><title>'+esc(r.shortLabel+' · '+r.quality+' · '+r.displayBound)+'</title><circle class="vloc-halo" cx="'+p.x+'" cy="'+p.y+'" r="'+(sz+4)+'" opacity="'+(selected?.5:.23)+'"/>'+(r.kind==='lower'?'<path class="vloc-lower" d="M'+p.x+' '+(p.y-sz)+'l'+sz+' '+sz+' -'+sz+' '+sz+' -'+sz+' -'+sz+'Z"/>':'<circle class="vloc-upper" cx="'+p.x+'" cy="'+p.y+'" r="'+sz+'"/>')+'</g>';
}
function smallPanel(b,g,rows,o,interactive){
 const tiny=g.level==='overview',compact=g.level==='compact',rich=!tiny&&!compact,mini=b.mini,p=b.panel,points=g.points.filter(q=>q.panel===p);
 let s='<g class="vloc-subpanel" data-setup="'+p+'"><rect class="vloc-card" x="'+b.x+'" y="'+b.y+'" width="'+b.w+'" height="'+b.h+'" rx="9"/>';
 s+=ln(b.left,b.top,b.left,b.bottom,'axis')+ln(b.left,b.bottom,b.right,b.bottom,'axis');
 for(const q of points){s+=ln(b.left,q.y,b.right,q.y);const r=rows.find(r=>r.id===q.id);s+=mark(r,q,o,interactive,g);}
 if(tiny)return s+'</g>';
 const cx=b.x+b.w/2,title={cycle:mini?'Cycles · 3 colors':'Three-coloring cycles · deterministic',high:mini?'High degree':'High degree: different list and output contracts',brooks:mini?'q = Δ−k':'Fewer colors, if a coloring exists',sparse:mini?'Sampled network':'Palette-sparsified communication only'}[p];
 s+=tx(mini?cx:b.x+15,b.y+(compact?12:19),compact?{cycle:'Cycles',high:'High Δ',brooks:'Deficit',sparse:'Sampled'}[p]:title,'subhead',mini?'middle':'start');
 if(mini){
  if(compact)return s+'</g>';
  if(p==='cycle'){
   s+=tx(cx,b.y+39,'Δ=2 · deterministic','mini','middle')+tx(cx,b.bottom+15,'Θ(log* n)','mini-bound','middle');
  }else if(p==='high'){
   s+=tx(cx,b.y+39,'O(log* n)','mini-bound','middle')+tx(cx,b.y+54,'Δ≥log²⁺δ n / d(v)≥log⁷n','micro','middle')+tx(cx,b.bottom+13,'full / high-degree partial','mini','middle');
  }else if(p==='brooks'){
   s+=tx(cx,b.y+35,'Δ sufficiently large','mini','middle')+tx(b.x+8,b.top+(b.bottom-b.top)*.25+4,'Õ(log⁴log n)','mini')+tx(b.x+8,b.top+(b.bottom-b.top)*.78+4,'O(log* n) · Δ≥log⁵⁰n','micro')+tx(cx,b.bottom+13,'coloring or certificate','mini','middle');
  }else{
   s+=tx(b.x+8,b.top+(b.bottom-b.top)*.22+4,'O(log²Δ)','micro')+tx(b.x+8,b.top+(b.bottom-b.top)*.22+16,'Δ≥C log⁴n','micro')+tx(b.x+8,b.top+(b.bottom-b.top)*.78+4,'Ω(logΔ/loglog n)','micro-lower')+tx(cx,b.bottom+13,'G̃ only · q=Δ+1','mini','middle');
  }
  return s+'</g>';
 }
 const axisY=b.bottom+(compact?17:27);
 if(p==='cycle'){
  s+=tx(cx,axisY,'q=3 · Δ=2','axis-title','middle','data-axis="x"');
  if(rich){s+=tx(b.left+20,b.top-10,'Rounds','axis-title','start','data-axis="y"')+tx(b.left+25,(b.top+b.bottom)/2-25,'Θ(log* n)','formula');
   s+=tx(cx,b.bottom+55,'Green: BEK14 at Δ=2. Red: Linial92, Theorem 2.1.','note','middle');
  }else s+=tx(cx,b.top-8,'Θ(log* n) rounds','formula','middle');
 }else if(p==='high'){
  const xp=[b.left+(b.right-b.left)*.28,b.left+(b.right-b.left)*.75],y=(b.top+b.bottom)/2;
  s+=tx(b.left+10,b.top-10,'O(log* n) rounds','formula','start','data-axis="y"');
  s+=tx(xp[0],axisY,'Full graph','axis-title','middle','data-axis="x"')+tx(xp[1],axisY,compact?'Targets':'High-degree vertices','axis-title','middle');
  if(rich){s+=tx(xp[0],y+36,'|L(v)|≥Δ+1','formula','middle')+tx(xp[0],y+61,'Δ≥log^{2+δ}n; fixed δ>0','label','middle');
   s+=tx(xp[1],y+36,'|L(v)|≥degree(v)+1','formula','middle')+tx(xp[1],y+61,'degree(v)≥log⁷n','label','middle');
   s+=tx(cx,b.bottom+55,'The right result may leave low-degree vertices uncolored.','note','middle');}
 }else if(p==='brooks'){
  s+=tx(cx,axisY,'q=Δ−k · 0≤k<k_Δ','axis-title','middle','data-axis="x"');
  if(rich){s+=tx(b.left+10,b.top-10,'Rounds · two degree regimes','axis-title','start','data-axis="y"');
   s+=tx(b.left+20,b.top+(b.bottom-b.top)*.25-20,'Õ(log⁴log n)','formula')+tx(b.left+20,b.top+(b.bottom-b.top)*.25+21,'Δ sufficiently large','label');
   s+=tx(b.left+20,b.top+(b.bottom-b.top)*.78-20,'O(log* n)','formula')+tx(b.left+20,b.top+(b.bottom-b.top)*.78+21,'Δ≥(log n)^{50}','label');
   s+=tx(cx,b.bottom+55,'k_Δ is maximal with (k_Δ+1)(k_Δ+2)≤Δ; coloring or certificate.','note','middle');}
 }else{
  s+=tx(cx,axisY,'Communicate only on sampled-color network G̃','axis-title','middle','data-axis="x"');
  if(rich){s+=tx(b.left+10,b.top-10,'Rounds · distinct symbolic bounds','axis-title','start','data-axis="y"');
   s+=tx(b.left+20,b.top+(b.bottom-b.top)*.22-20,'O(log²Δ)','formula')+tx(b.left+20,b.top+(b.bottom-b.top)*.22+27,'Δ≥C log⁴n; C sufficiently large','note');
   s+=tx(b.left+20,b.top+(b.bottom-b.top)*.78-20,'Ω(log Δ / loglog n)','low-formula');
   s+=tx(cx,b.bottom+55,'Lower: sampled cliques, success 2/3; no transfer to unrestricted LOCAL.','note','middle');}
 }
 if(rich)for(const q of points){const r=rows.find(r=>r.id===q.id);s+=tx(q.x+15,q.y+5,r.shortLabel,r.kind==='lower'?'lower-label':'upper-label');}
 return s+'</g>';
}
function chart(w,h,o={},interactive=false){
 const g=geometry(w,h,o),tiny=g.level==='overview',compact=g.level==='compact',rows=records(o),byId=new Map(rows.map(r=>[r.id,r]));
 let s='<svg class="vloc-'+(interactive?'map':'summary')+'" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="xMidYMid meet" role="img" data-detail-level="'+g.level+'" data-view="'+g.view+'" aria-label="Vertex coloring in LOCAL: exact symbolic round costs and separate coloring contracts"><title>Vertex coloring · '+esc(views[g.view])+'</title><desc>Green circles are algorithm bounds. Red diamonds apply only to three-coloring cycles or palette-sparsified communication. Violet halos identify deterministic results and blue halos randomized results. Symbolic formula rows are not a runtime ranking.</desc>';
 if(!tiny){s+=tx(12,compact?17:28,compact?'Vertex coloring · LOCAL':g.view==='variable'?'Round complexity depends on the coloring contract':views[g.view],'heading');
  if(!compact){s+='<circle class="vloc-upper" cx="17" cy="52" r="4"/>'+tx(27,56,'Algorithm','legend')+'<path class="vloc-lower" d="M119 48l4 4 -4 4 -4 -4Z"/>'+tx(130,56,'Lower bound','legend')+tx(248,56,'● Deterministic','det-label')+tx(397,56,'● Randomized','rand-label')+tx(w-15,56,'Rounds only','note','end');}
  else s+='<circle class="vloc-upper" cx="14" cy="29" r="3"/>'+tx(21,32,'upper','mini')+'<path class="vloc-lower" d="M64 26l3 3 -3 3 -3 -3Z"/>'+tx(71,32,'lower','mini')+tx(w-85,32,'● det','det-label')+tx(w-40,32,'● rand','rand-label');
 }
 if(g.view==='variable'){
  const b=g.boxes.main;
  s+=ln(b.left,b.top,b.left,b.bottom,'axis')+ln(b.left,b.bottom,b.right,b.bottom,'axis');
  data.mainRows.forEach((r,i)=>{const y=b.top+(b.bottom-b.top)*(i+.5)/8;s+=ln(b.left,y,b.right,y);if(!tiny)s+=tx(compact?9:12,y+4,compact?['Δ + log* n','√Δ·polylogΔ + log* n','log²Δ · log n','Õ(log^{5/3}n)','HSS18 · symbolic','Det_d(polylog n)','log³log n','Õ((loglog n)^{5/3})'][i]:r.label,compact?'compact-cost':'cost');});
  const split=b.top+(b.bottom-b.top)/2;s+=ln(7,split,b.right,split,'divider');
  ['ordinary','delta-list','degree-list'].forEach((c,i)=>{const x=b.left+(b.right-b.left)*(i+.5)/3;s+=ln(x,b.top,x,b.bottom);if(!tiny)s+=tx(x,b.bottom+(compact?15:22),compact?['Δ+1','Δ+1 list','deg+1 list'][i]:['Common Δ+1','Δ+1 lists','degree+1 lists'][i],'tick','middle');});
  for(const p of g.points.filter(q=>q.panel==='main')){const r=byId.get(p.id);s+=mark(r,p,o,interactive,g);if(!tiny&&!compact)s+=tx(p.x+12,p.y+4,r.shortLabel,r.mode==='randomized'?'rand-label':'det-label');}
  if(!tiny){s+=tx(12,compact?44:83,compact?'Rounds · symbolic':'Rounds · exact formulas, not a numerical ranking','axis-title','start','data-axis="y"');
   if(!compact)s+=tx((b.left+b.right)/2,b.bottom+43,'Coloring contract','axis-title','middle','data-axis="x"');
   else s+=tx(w-10,b.bottom+30,'Coloring contract','mini','end','data-axis="x"');}
 }
 for(const [p,b]of Object.entries(g.boxes))if(p!=='main')s+=smallPanel(b,g,rows,o,interactive);
 if(!rows.length&&!tiny)s+=tx(w/2,h/2,'No sources match this filter.','note','middle');
 return s+'</svg>';
}
function summarySVG(key,w,h,o={}){return chart(Math.max(40,+w||738),Math.max(40,+h||548),{...o,view:viewFor(key,o)},false);}
function diagramSVG(key=ID,o={}){if(typeof key==='object'){o=key;key=o.key||ID;}return chart(1000,660,{...o,view:viewFor(key,o)},true);}
function mount(root,key=ID,options={}){
 for(const i of instances)if(!i.root.isConnected||i.root===root)i.destroy();
 let view=viewFor(key,options),publication=options.publication||'all',selected=options.selected||data.defaultSelected,context='main';const ctrl=new AbortController();
 root.classList.add('focus-view','vloc-view');root.classList.toggle('f-embedded',!!options.embedded);
 root.innerHTML='<p class="f-kicker">VERTEX COLORING × LOCAL</p><header class="f-hero"><div><h1>How many communication rounds?</h1><p>Keep the exact n and Δ dependence, the coloring contract, and the communication graph visible.</p></div></header><div class="vloc-toolbar"><div class="vloc-tabs" role="group" aria-label="LOCAL coloring setup">'+Object.entries(views).map(([v,l])=>'<button type="button" data-vloc-view="'+v+'">'+esc(l)+'</button>').join('')+'</div><label>Sources <select class="vloc-publication" aria-label="Source publication filter"><option value="all">All reviewed sources</option><option value="published">Published only</option></select></label></div><div class="vloc-key"><span>Green ● algorithm</span><span class="vloc-red">Red ◆ lower bound</span><span class="vloc-det-label">Violet: deterministic</span><span class="vloc-rand-label">Blue: randomized</span></div><div class="vloc-scroll" tabindex="0" aria-label="LOCAL coloring figure; scroll horizontally if needed"><div class="vloc-plot"></div></div><p class="vloc-reading"></p><section class="vloc-theorem" aria-live="polite" aria-label="Selected theorem and primary source"></section><details class="vloc-source-list"><summary>Inspect all supplied results and exact formulas</summary><div class="vloc-records"></div></details><p class="vloc-coverage">'+esc(data.coverageNote)+' Reviewed '+esc(data.reviewedOn)+'.</p>';
 const opts=()=>({publication,view,selected});
 const scoped=()=>records({publication}).filter(r=>view==='variable'||r.panel===view||(view==='cycle'&&r.id==='vertex-result-48'));
 function inspect(){
  const rr=records({publication});let r=rr.find(v=>v.id===selected);if(!r){r=scoped()[0];selected=r?.id;}
  const el=root.querySelector('.vloc-theorem');if(!r){el.innerHTML='<p>No theorem matches this filter.</p>';return;}
  const projection=context==='cycle-upper'?'Cycle reference: specialize BEK14 to Δ=2 and q=3, obtaining O(log* n).':context==='brooks-high'?'High-degree specialization: Δ≥(log n)^{50}, giving O(log* n) rounds.':'';
  el.innerHTML='<div class="vloc-detail-head"><b class="'+(r.kind==='lower'?'vloc-red':'vloc-green')+'">'+(r.kind==='lower'?'Lower bound':'Algorithm upper bound')+'</b><strong>'+esc(r.shortLabel)+'</strong><span>'+esc(r.venue)+'</span></div><div class="vloc-detail-grid"><div><small>Rounds</small><strong>'+esc(r.displayBound)+'</strong></div><div><small>Palette or lists</small><strong>'+esc(r.quality)+'</strong></div><div><small>Guarantee</small><strong>'+esc(r.mode)+'</strong></div></div>'+(projection?'<p class="vloc-projection">'+esc(projection)+'</p>':'')+'<p><b>Graph and input.</b> '+esc(r.graph)+'.</p><p><b>Output.</b> '+esc(r.output)+'.</p><p><b>Probability.</b> '+esc(r.probability)+'.</p><p>'+esc(r.notes)+'</p>'+(r.allDegreeVariant?'<div class="vloc-projection"><b>All-degree variant · different communication scope</b><p>'+esc(r.allDegreeVariant.displayBound)+' rounds. '+esc(r.allDegreeVariant.communication)+'. '+esc(r.allDegreeVariant.notes)+'</p></div>':'')+'<details open><summary>Theorem, assumptions and source</summary><h3>'+esc(r.title)+'</h3><p>'+esc(r.authors.join(', '))+'</p><p><b>'+esc(r.theorem)+'</b> · primary source checked</p><ul>'+r.assumptions.map(a=>'<li>'+esc(a)+'</li>').join('')+'</ul><p><a href="'+esc(r.verificationUrl)+'" target="_blank" rel="noopener noreferrer">Read primary theorem ↗</a> · <a href="'+esc(r.url)+'" target="_blank" rel="noopener noreferrer">Paper record ↗</a></p></details>';
 }
 function render(){
  if(!records({publication}).some(r=>r.id===selected))selected=scoped()[0]?.id;
  root.querySelector('.vloc-publication').value=publication;
  root.querySelectorAll?.('[data-vloc-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.vlocView===view)));
  root.querySelector('.vloc-plot').innerHTML=diagramSVG(key,opts());
  root.querySelector('.vloc-reading').textContent=view==='variable'?data.representationNote+' Small panels below retain different output or network assumptions; choose a setup to expand it.':view==='cycle'?'The matching upper/lower order is Θ(log* n) only for deterministic three-coloring cycles here.':view==='high'?'Both algorithms take O(log* n), but only the Δ+1-list theorem colors the whole graph under a maximum-degree threshold. The degree+1-list theorem may leave low-degree vertices uncolored.':view==='brooks'?'The palette deficit requires sufficiently large Δ and colorability, or the algorithm returns a non-colorability certificate.': 'The plotted upper uses only sampled edges for Δ≥C log⁴n (C sufficiently large). Its all-degree mixed-network variant remains in the inspector. The red lower bound does not apply to unrestricted communication on the original graph.';
  root.querySelector('.vloc-records').innerHTML=records({publication}).map(r=>'<button type="button" class="vloc-record" data-vloc-result="'+esc(r.id)+'" data-vloc-context="list" aria-pressed="'+(selected===r.id)+'"><small>'+esc(r.shortLabel+' · '+r.mode+' · '+r.panel)+'</small><strong class="'+(r.kind==='lower'?'vloc-red':'vloc-green')+'">'+esc(r.displayBound)+'</strong><span>'+esc(r.quality)+'</span></button>').join('');
  inspect();
 }
 function select(node){selected=node.dataset.vlocResult;context=node.dataset.vlocContext||'';const r=records({publication}).find(a=>a.id===selected);if(context==='list'&&r)view=r.panel==='main'?'variable':r.panel;render();}
 root.addEventListener('click',e=>{const tab=e.target.closest('[data-vloc-view]');if(tab){view=tab.dataset.vlocView;selected=scoped()[0]?.id;context=view==='cycle'&&selected==='vertex-result-48'?'cycle-upper':view;render();return;}const n=e.target.closest('[data-vloc-result]');if(n)select(n);},{signal:ctrl.signal});
 root.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const n=e.target.closest('.vloc-point');if(n){e.preventDefault();select(n);}},{signal:ctrl.signal});
 root.addEventListener('change',e=>{if(e.target.classList.contains('vloc-publication')){publication=e.target.value;render();options.onPublicationChange?.(publication);}},{signal:ctrl.signal});
 if(view!=='variable'){selected=scoped()[0]?.id;context=view==='cycle'&&selected==='vertex-result-48'?'cycle-upper':view;}
 render();const instance={root,settingKey:key,redraw:render,destroy(){ctrl.abort();root.classList.remove('vloc-view');instances.delete(instance);}};instances.add(instance);return instance;
}
window.AtlasPairRenderers=window.AtlasPairRenderers||{};
window.AtlasPairRenderers[ID]={mount,summarySVG,diagramSVG,records,layoutGeometry:geometry,release(root){for(const i of instances)if(!i.root.isConnected||i.root===root)i.destroy();}};
})();
