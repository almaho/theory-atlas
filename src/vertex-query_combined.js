(()=>{
'use strict';
const ID='vertex-query_combined',data=JSON.parse(document.getElementById('atlas-data').textContent).focus[ID];if(!data)return;
const instances=new Set(),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tx=(x,y,t,c='label',a='start',attr='')=>'<text x="'+x+'" y="'+y+'" class="vqc-'+c+'" text-anchor="'+a+'" '+attr+'>'+esc(t)+'</text>';
const ln=(a,b,c,d,cls='grid')=>'<path class="vqc-'+cls+'" d="M'+a+' '+b+'L'+c+' '+d+'"/>';
const views={all:'All setups',global:'Δ+1 queries',pair:'Degree tradeoff',degeneracy:'Degeneracy',communication:'Communication',lists:'List input'};
const routeView={'vertex-query-pairs':'pair','vertex-query-degeneracy':'degeneracy','vertex-query-lists':'lists','vertex-query-communication':'communication'};
function records(o={}){return data.verifiedRecords.concat(data.relatedResults||[]).map(r=>({...data.sources[r.sourceId],...r})).filter(r=>(o.publication!=='published'||r.publicationStatus!=='preprint')&&(!o.panel||r.panel===o.panel));}
function viewFor(key,o){return views[o.view]?o.view:routeView[key]||'all';}
function level(w,h,o){const fit=w<300||h<230?0:w<650||h<480?1:2,want=['overview','compact','detail'].indexOf(o.level);return['overview','compact','detail'][Math.min(fit,want<0?fit:want)];}
function geometry(w,h,o={}){
 const detail=level(w,h,o),tiny=detail==='overview',compact=detail==='compact',view=views[o.view]?o.view:'all',boxes={},points=[],rows=records(o);
 function box(panel,x,y,bw,bh,mini){
  const left=x+bw*(panel==='communication'?.32:.17),right=x+bw*.94,top=y+bh*(tiny?.14:mini?.31:.24),bottom=y+bh*(mini?.69:.77);
  const b=boxes[panel]={panel,x,y,w:bw,h:bh,left,right,top,bottom,mini};
  const add=(r,fx,fy,metric='queries')=>{if(r)points.push({id:r.id,panel,metric,x:left+(right-left)*fx,y:top+(bottom-top)*fy});};
  const get=slot=>rows.find(r=>r.panel===panel&&r.slot===slot);
  if(panel==='global'){add(get('ack'),.16,.5);add(get('ferber'),.51,.5);add(get('lower'),.86,.5);}
  if(panel==='pair')add(get('pair'),.53,.53);
  if(panel==='degeneracy'){add(get('relative'),.25,.5);add(get('additive'),.78,0);}
  if(panel==='communication'){
   [['fm',.12],['cmns',.52],['comm-lower',.92]].forEach(([s,fy])=>{add(get(s),.08,fy,'bits');if(s!=='comm-lower')add(get(s),.57,fy,'rounds');});
  }
  if(panel==='lists')add(get('list'),.12,.5,'reported');
  return b;
 }
 if(view==='all'){
  const pad=tiny?4:compact?7:12,gap=tiny?4:compact?7:14,top=tiny?4:compact?42:76,bw=(w-2*pad-gap)/2,bh=(h-top-(tiny?8:compact?25:52)-gap)/2;
  box('global',pad,top,bw,bh,true);box('pair',pad+bw+gap,top,bw,bh,true);
  box('degeneracy',pad,top+bh+gap,bw,bh,true);box('communication',pad+bw+gap,top+bh+gap,bw,bh,true);
  const y=h-(tiny?5:compact?18:34),r=rows.find(r=>r.panel==='lists');if(r)points.push({id:r.id,panel:'lists',metric:'reported',x:pad+7,y:tiny?y:y+2});
  boxes.lists={panel:'lists',x:pad,y:y-9,w:w-2*pad,h:tiny?5:compact?18:30,left:pad,right:w-pad,top:y-5,bottom:y+8,mini:true};
 }else box(view,12,tiny?6:compact?43:78,w-24,h-(tiny?14:compact?64:106),false);
 return{w,h,level:detail,view,boxes,points};
}
function mark(r,p,o,interactive,g){
 const sz=g.level==='overview'?2.4:g.level==='compact'?3:5,chosen=o.selected===r.id;
 return'<g class="vqc-point vqc-setup-'+r.setup+'" data-vqc-result="'+esc(r.id)+'" data-vqc-metric="'+p.metric+'" data-panel="'+p.panel+'" data-kind="'+r.kind+'" data-point-x="'+p.x+'" data-point-y="'+p.y+'"'+(interactive?' role="button" tabindex="0" aria-pressed="'+chosen+'"':'')+' aria-label="'+esc((r.kind==='lower'?'Lower bound: ':'Algorithm: ')+r.shortLabel+'; '+r.displayBound+'; '+r.probability)+'"><title>'+esc(r.shortLabel+' · '+r.displayBound)+'</title><circle class="vqc-halo" cx="'+p.x+'" cy="'+p.y+'" r="'+(sz+4)+'" opacity="'+(chosen?.5:.22)+'"/>'+(r.kind==='lower'?'<path class="vqc-lower" d="M'+p.x+' '+(p.y-sz)+'l'+sz+' '+sz+' -'+sz+' '+sz+' -'+sz+' -'+sz+'Z"/>':'<circle class="vqc-upper" cx="'+p.x+'" cy="'+p.y+'" r="'+sz+'"/>')+'</g>';
}
function panel(b,g,rows,o,interactive){
 const tiny=g.level==='overview',compact=g.level==='compact',rich=!tiny&&!compact,mini=b.mini,p=b.panel,pts=g.points.filter(q=>q.panel===p),byId=new Map(rows.map(r=>[r.id,r])),cx=b.x+b.w/2;
 let s='<g data-setup="'+p+'"><rect class="vqc-card" x="'+b.x+'" y="'+b.y+'" width="'+b.w+'" height="'+b.h+'" rx="9"/>';
 if(p==='lists'){
  pts.forEach(q=>s+=mark(byId.get(q.id),q,o,interactive,g));
  if(!tiny){s+=tx(b.x+(mini?21:24),mini?b.y+(compact?12:17):b.top-20,mini?(compact?'List input · reported Õ(n³ᐟ²); oracle note':'HKNT22 · degree+1 lists · reported Õ(n³ᐟ²) queries · inherited-oracle qualification'):'Degree+1 list coloring · related result',mini?'list-note':'subhead');
   if(!mini){s+=tx(b.left+50,(b.top+b.bottom)/2,'Õ(n³ᐟ²) source-reported query-model cost','formula')+tx(b.left+50,(b.top+b.bottom)/2+32,'Indexed-neighbor + indexed-palette operations are explicit.','label')+tx(b.left+50,(b.top+b.bottom)/2+58,'Inherited pair-access convention remains qualified; no common oracle coordinate.','note');}}
  return s+'</g>';
 }
 if(!tiny)s+=tx(b.x+(compact?8:13),b.y+(compact?14:23),({global:compact?'Δ+1 · global':'Δ+1 coloring · global worst case',pair:compact?'Pair + degree':'Pair queries + degree preprocessing',degeneracy:compact?'Degeneracy κ':'Degeneracy · different palettes',communication:compact?'Two parties':'Communication · known Δ'})[p],'subhead');
 s+=ln(b.left,b.top,b.left,b.bottom,'axis')+ln(b.left,b.bottom,b.right,b.bottom,'axis');
 if(p==='global'||p==='degeneracy'||p==='pair'){
  [1,1.5,2].forEach(v=>{const yy=b.bottom-(v-1)*(b.bottom-b.top);s+=ln(b.left,yy,b.right,yy);if(!tiny)s+=tx(b.left-(compact?4:8),yy+3,v===1?'n':v===1.5?'n³ᐟ²':'n²','tick','end');});
  if(rich)s+=tx(b.left,b.top-(mini?9:17),'Queries · leading n-power','axis-note','start','data-axis="y"');
 }
 if(p==='global'){
  const labels={ack:compact?'ACK':'ACK · w.h.p.',ferber:compact?'FHC':'FHC · expected',lower:compact?'lower':'ACK19 lower'};
  for(const q of pts){const r=byId.get(q.id);s+=mark(r,q,o,interactive,g);if(!tiny){
    s+=tx(q.x,b.bottom+(compact?12:20),labels[r.slot],r.kind==='lower'?'red-tick':'tick','middle');
    if(rich)s+=tx(q.x,q.y-(r.slot==='ferber'?25:13),r.slot==='ack'?'Õ(n³ᐟ²)':r.slot==='ferber'?'O(n³ᐟ²√log n)':'Ω(n³ᐟ²)',r.kind==='lower'?'red-cost':'cost','middle');
   }}
  if(rich){s+=tx(b.x+13,b.y+b.h-16,'Lower: hard degree Θ(√n), not every Δ.','note');if(!mini)s+=tx(cx,b.bottom+58,'ACK19: high probability · FHC25/26: expected, zero error','note','middle');}
  else if(compact)s+=tx(b.x+7,b.y+b.h-7,'Logs in bounds; lower at Δ≈√n','micro');
 }
 if(p==='pair'){
  if(pts.length)s+=ln(b.left,b.top,b.right,b.bottom,'curve');
  const ticks=[[0,'1'],[.5,'√n'],[1,'≈n']];
  ticks.forEach(([a,t])=>{const x=b.left+a*(b.right-b.left);s+=ln(x,b.top,x,b.bottom);if(!tiny)s+=tx(x,b.bottom+(compact?12:20),t,'tick','middle');});
  pts.forEach(q=>s+=mark(byId.get(q.id),q,o,interactive,g));
  if(!tiny){s+=tx(b.right,b.bottom+(compact?25:39),'Maximum degree Δ','axis-note','end','data-axis="x"');
   s+=tx(b.left+(b.right-b.left)*.52,b.top+(b.bottom-b.top)*.18,compact?'n² log n / Δ':'O(n² log n / Δ)',compact?'compact-formula':'cost','middle');}
  if(rich){s+=tx(b.x+13,b.y+b.h-16,'Expected; +O(n) degree queries if Δ unknown.','note');if(!mini)s+=tx(cx,b.bottom+71,'Line: Δ=n^α ⇒ n-power 2−α. The logarithmic factor is not drawn.','note','middle');}
 }
 if(p==='degeneracy'){
  for(const q of pts){const r=byId.get(q.id);s+=mark(r,q,o,interactive,g);if(!tiny){
    const upper=r.kind!=='lower';s+=tx(q.x,b.bottom+(compact?12:20),upper?'κ+o(κ)':'κ+λ','tick','middle');
    s+=tx(q.x+(mini?0:20),q.y+(upper?-13:compact?14:22),upper?'Õ(n³ᐟ²)':compact?'Ω(n²)':'Ω(n²/λ²)',upper?'cost':'red-cost',mini?'middle':'start');
   }}
  if(rich){s+=tx(b.x+13,b.y+b.h-16,'Red coordinate: fixed integer λ>1.','note');if(!mini)s+=tx(cx,b.bottom+60,'Different palettes: this is not a matching upper/lower pair.','note','middle');}
  else if(compact)s+=tx(b.x+7,b.y+b.h-7,'Red: fixed λ>1 · distinct palettes','micro');
 }
 if(p==='communication'){
  const xs=[b.left+(b.right-b.left)*.08,b.left+(b.right-b.left)*.57],names={fm:'FM25',cmns:'CMNS25','comm-lower':'Lower'};
  [['fm',.12],['cmns',.52],['comm-lower',.92]].forEach(([slot,t])=>{const y=b.top+(b.bottom-b.top)*t;s+=ln(b.left,y,b.right,y);if(!tiny)s+=tx(b.left-(compact?8:15),y+3,names[slot],slot==='comm-lower'?'red-tick':'tick','end');});
  if(!tiny){s+=tx(xs[0]+(compact?9:20),b.top-(compact?5:10),'Bits','axis-note','middle','data-axis="x"')+tx(xs[1]+(compact?18:43),b.top-(compact?5:10),'Rounds','axis-note','middle');}
  for(const q of pts){const r=byId.get(q.id);s+=mark(r,q,o,interactive,g);if(!tiny){const value=q.metric==='bits'?(r.kind==='lower'?'Ω(n)':'O(n) exp.'):(r.slot==='fm'?'O(n) exp.':compact?'loglog n·logΔ':'O(loglog n·logΔ)');
    s+=tx(q.x+(compact?7:12),q.y+4,value,r.kind==='lower'?'red-cost':q.metric==='rounds'?'comm-round':'comm-cost');
   }}
  if(rich){s+=tx(b.x+13,b.y+b.h-16,'CMNS25 rounds: worst case · bits: expected.','note');if(!mini)s+=tx(cx,b.bottom+60,'Zero error · public coins · disjoint edges · both learn every color','note','middle');}
 }
 return s+'</g>';
}
function chart(w,h,o={},interactive=false){
 const g=geometry(w,h,o),tiny=g.level==='overview',compact=g.level==='compact',rows=records(o);
 let s='<svg class="vqc-'+(interactive?'map':'summary')+'" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="xMidYMid meet" role="img" data-detail-level="'+g.level+'" data-view="'+g.view+'" aria-label="Vertex coloring: classical graph-query bounds and separate two-party communication"><title>Vertex coloring · '+esc(views[g.view])+'</title><desc>Algorithm bounds are green and lower bounds red. Query axes show leading powers of n, with logarithms in labels. A global n to the three halves lower bound uses hard degree about square root n. Communication bits and rounds are separate metrics. The list-input record carries an oracle qualification.</desc>';
 if(!tiny){s+=tx(12,compact?17:27,compact?'Vertex coloring · access models':g.view==='all'?'Coloring costs depend on the access model':views[g.view],'heading');
  if(!compact)s+='<circle class="vqc-upper" cx="18" cy="50" r="4"/>'+tx(29,54,'Algorithm','legend')+'<path class="vqc-lower" d="M119 46l4 4 -4 4 -4 -4Z"/>'+tx(130,54,'Lower bound','legend')+tx(245,54,'● Queries','query-key')+tx(352,54,'● Communication','comm-key')+tx(w-15,54,'Classical · exact factors in labels','note','end');
  else s+='<circle class="vqc-upper" cx="14" cy="29" r="3"/>'+tx(21,32,'algorithm','micro')+'<path class="vqc-lower" d="M86 26l3 3 -3 3 -3 -3Z"/>'+tx(94,32,'lower','micro')+tx(w-8,32,'queries ≠ bits','micro','end');}
 Object.values(g.boxes).forEach(b=>s+=panel(b,g,rows,o,interactive));
 if(!rows.length&&!tiny)s+=tx(w/2,h/2,'No sources match this filter.','note','middle');
 return s+'</svg>';
}
function summarySVG(key,w,h,o={}){return chart(Math.max(40,+w||738),Math.max(40,+h||548),{...o,view:viewFor(key,o)},false);}
function diagramSVG(key=ID,o={}){if(typeof key==='object'){o=key;key=o.key||ID;}return chart(1000,660,{...o,view:viewFor(key,o)},true);}
function mount(root,key=ID,options={}){
 for(const i of instances)if(!i.root.isConnected||i.root===root)i.destroy();
 let view=viewFor(key,options),publication=options.publication||'all',selected=options.selected||data.defaultSelected;const ctrl=new AbortController();
 root.classList.add('focus-view','vqc-view');root.classList.toggle('f-embedded',!!options.embedded);
 root.innerHTML='<p class="f-kicker">VERTEX COLORING × GRAPH ACCESS</p><header class="f-hero"><div><h1>Queries, palettes and communication</h1><p>Classical access costs, with the output contract and lower-bound scope attached.</p></div></header><div class="vqc-toolbar"><div class="vqc-tabs" role="group" aria-label="Vertex coloring access model">'+Object.entries(views).map(([v,l])=>'<button type="button" data-vqc-view="'+v+'">'+esc(l)+'</button>').join('')+'</div><label>Sources <select class="vqc-publication" aria-label="Source publication filter"><option value="all">All reviewed sources</option><option value="published">Published only</option></select></label></div><div class="vqc-scroll" tabindex="0" aria-label="Vertex coloring figure; scroll horizontally if needed"><div class="vqc-plot"></div></div><p class="vqc-reading"></p><section class="vqc-theorem" aria-live="polite" aria-label="Selected theorem and primary source"></section><details class="vqc-source-list"><summary>Inspect every supplied result</summary><div class="vqc-records"></div></details><p class="vqc-coverage">'+esc(data.coverageNote)+' Reviewed '+esc(data.reviewedOn)+'.</p>';
 const scoped=()=>records({publication}).filter(r=>view==='all'||r.panel===view);
 function inspect(){
  const rr=records({publication});let r=rr.find(v=>v.id===selected);if(!r){r=scoped()[0];selected=r?.id;}
  const el=root.querySelector('.vqc-theorem');if(!r){el.innerHTML='<p>No theorem matches this filter.</p>';return;}
  el.innerHTML='<div class="vqc-detail-head"><b class="'+(r.kind==='lower'?'vqc-red':'vqc-green')+'">'+(r.kind==='lower'?'Lower bound':'Algorithm upper bound')+'</b><strong>'+esc(r.shortLabel)+'</strong><span>'+esc(r.venue)+'</span></div><div class="vqc-detail-grid"><div><small>Cost</small><strong>'+esc(r.displayBound)+'</strong></div><div><small>Palette</small><strong>'+esc(r.quality)+'</strong></div><div><small>Budget</small><strong>'+esc(r.costMode)+'</strong></div></div><p><b>Access.</b> '+esc(r.access)+'.</p><p><b>Graph and output.</b> '+esc(r.graph)+'. '+esc(r.output)+'.</p><p><b>Guarantee.</b> '+esc(r.probability)+'.</p><p class="'+(r.panel==='lists'?'vqc-qualification':'')+'">'+esc(r.notes)+'</p><details><summary>Computation details</summary><p>'+esc(r.timeDetails)+'</p></details><details open><summary>Theorem, assumptions and source</summary><h3>'+esc(r.title)+'</h3><p>'+esc(r.authors.join(', '))+'</p><p><b>'+esc(r.theorem)+'</b> · '+esc(r.evidenceStatus==='theorem_verified'?'primary theorem checked':'statement checked; oracle qualification retained')+'</p><ul>'+r.assumptions.map(a=>'<li>'+esc(a)+'</li>').join('')+'</ul><p><a href="'+esc(r.verificationUrl)+'" target="_blank" rel="noopener noreferrer">Read primary theorem ↗</a> · <a href="'+esc(r.url)+'" target="_blank" rel="noopener noreferrer">Paper record ↗</a></p></details>';
 }
 function render(){
  if(!records({publication}).some(r=>r.id===selected))selected=scoped()[0]?.id;
  root.querySelector('.vqc-publication').value=publication;root.querySelectorAll?.('[data-vqc-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.vqcView===view)));
  root.querySelector('.vqc-plot').innerHTML=diagramSVG(key,{publication,view,selected});
  root.querySelector('.vqc-reading').textContent=view==='all'?data.representationNote:view==='global'?'The n³ᐟ² lower bound is a worst case over graphs and degrees. Its hard degree is Θ(√n); no red lower bound is asserted uniformly across Δ.':view==='pair'?'Expected pair queries are O(n² log n/Δ). Degree discovery uses O(n) additional queries unless Δ is supplied. The line omits logarithms and displays only the n exponent.':view==='degeneracy'?'The upper bound permits relative slack o(κ); the lower bound asks for additive slack λ. The red point specializes to fixed integer λ>1.':view==='communication'?'Both players know Δ and the vertex set, hold disjoint edge sets, and learn the full coloring. Bits and interaction rounds use separate columns.':'This result requires query access to input palettes. Its declared operations and the inherited pair-access qualification are retained in the theorem details.';
  root.querySelector('.vqc-records').innerHTML=records({publication}).map(r=>'<button type="button" class="vqc-record" data-vqc-result="'+esc(r.id)+'" data-vqc-list="yes" aria-pressed="'+(selected===r.id)+'"><small>'+esc(r.shortLabel+' · '+r.panel)+'</small><strong class="'+(r.kind==='lower'?'vqc-red':'vqc-green')+'">'+esc(r.displayBound)+'</strong><span>'+esc(r.quality)+'</span></button>').join('');inspect();
 }
 function select(node){selected=node.dataset.vqcResult;const r=records({publication}).find(a=>a.id===selected);if(node.dataset.vqcList&&r)view=r.panel;render();}
 root.addEventListener('click',e=>{const tab=e.target.closest('[data-vqc-view]');if(tab){view=tab.dataset.vqcView;selected=scoped()[0]?.id;render();return;}const n=e.target.closest('[data-vqc-result]');if(n)select(n);},{signal:ctrl.signal});
 root.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const n=e.target.closest('.vqc-point');if(n){e.preventDefault();select(n);}},{signal:ctrl.signal});
 root.addEventListener('change',e=>{if(e.target.classList.contains('vqc-publication')){publication=e.target.value;render();options.onPublicationChange?.(publication);}},{signal:ctrl.signal});
 if(view!=='all')selected=scoped()[0]?.id;
 render();const inst={root,settingKey:key,redraw:render,destroy(){ctrl.abort();root.classList.remove('vqc-view');instances.delete(inst);}};instances.add(inst);return inst;
}
window.AtlasPairRenderers=window.AtlasPairRenderers||{};
window.AtlasPairRenderers[ID]={mount,summarySVG,diagramSVG,records,layoutGeometry:geometry,release(root){for(const i of instances)if(!i.root.isConnected||i.root===root)i.destroy();}};
})();
