(()=>{
'use strict';
const ID='weighted-matching-mpc',data=JSON.parse(document.getElementById('atlas-data').textContent).focus[ID];if(!data)return;
const instances=new Set();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tx=(x,y,s,cls='',anchor='start',extra='')=>'<text x="'+x+'" y="'+y+'" class="wmpc-'+cls+'" text-anchor="'+anchor+'" '+extra+'>'+esc(s)+'</text>';
const line=(x1,y1,x2,y2,cls='grid')=>'<path d="M'+x1+' '+y1+'L'+x2+' '+y2+'" class="wmpc-'+cls+'"/>';
const records=(o={})=>data.verifiedRecords.map(r=>({...data.sources[r.sourceId],...r})).filter(r=>o.publication!=='published'||r.publicationStatus!=='preprint');
function geometry(w,h,o={},focus=false){
 const levels=['overview','compact','detail'],available=w<300||h<230?0:w<650||h<480?1:2,requested=levels.indexOf(o.level),level=focus?'detail':levels[Math.min(available,requested<0?available:requested)];
 const tiny=level==='overview',compact=level==='compact';
 const left=w*(tiny?.16:compact?.16:.46),right=w*.94,top=h*(tiny?.20:compact?.36:.29),bottom=h*(tiny?.81:compact?.72:.69);
 return{w,h,level,left,right,top,bottom,points:records(o).map(r=>({id:r.id,x:w*.71,y:h*(tiny?.47:compact?.48:.49)}))};
}
function marker(r,p,interactive,o,size){
 return'<g class="wmpc-point" data-wmpc-result="'+esc(r.id)+'" data-kind="upper" data-panel="nearlinear" data-point-x="'+p.x+'" data-point-y="'+p.y+'"'+(interactive?' role="button" tabindex="0" aria-pressed="'+(o.selected===r.id)+'"':'')+' aria-label="'+esc(r.shortLabel+'; '+r.quality+'; '+r.roundComplexity+'; local memory '+r.localMemory)+'"><title>'+esc(r.shortLabel+' · '+r.roundComplexity+' · '+r.quality)+'</title><circle class="wmpc-halo" cx="'+p.x+'" cy="'+p.y+'" r="'+(size+7)+'"/><circle class="wmpc-upper-marker" cx="'+p.x+'" cy="'+p.y+'" r="'+size+'"/></g>';
}
function chart(w,h,o={},interactive=false){
 const g=geometry(w,h,o,interactive),r=records(o)[0],p=g.points[0],tiny=g.level==='overview',compact=g.level==='compact';
 let s='<svg class="wmpc-'+(interactive?'map':'summary')+'" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="xMidYMid meet" data-detail-level="'+g.level+'" role="img" aria-label="Weighted matching in MPC: near-optimal weight in O(log log average degree) rounds, near-linear local memory, fixed epsilon"><title>Weighted matching · near-linear-memory MPC</title><desc>A green algorithm point specializes b-matching to unit vertex capacities. Memory and rounds are symbolic resource categories. No comparable lower bound has been verified for this memory contract.</desc>';
 if(!r)return s+(tiny?'':tx(w/2,h/2,'No sources match this filter.','muted','middle'))+'</svg>';
 s+=line(g.left,g.top,g.left,g.bottom,'axis')+line(g.left,g.bottom,g.right,g.bottom,'axis')+line(g.left,p.y,g.right,p.y)+line(p.x,g.top,p.x,g.bottom);
 if(tiny)return s+marker(r,p,false,o,Math.max(2,Math.min(w,h)*.032))+'</svg>';
 if(compact){
  s+=tx(10,19,'General weighted graphs','setup')+tx(10,39,'w(M) ≥ OPT_w / (1+ε)','quality');
  s+=tx(10,62,'Fixed ε · near-linear local memory','muted');
  s+=tx(10,88,'O(log log d̄) rounds','formula','start','data-axis="y"');
  s+=tx(p.x,p.y+24,'GGM 2022','upper-label','middle')+marker(r,p,false,o,5);
  s+=tx(p.x,g.bottom+23,'Õ(n) per machine','memory','middle','data-axis="x"');
  s+=tx(10,h-27,'d̄ = average degree · total Õ(m+n)','muted');
  s+=tx(10,h-9,'No comparable lower bound reviewed','foot');
  return s+'</svg>';
 }
 s+=tx(24,32,'Near-optimal weight with near-linear memory','heading');
 s+=tx(24,65,'w(M) ≥ OPT_w / (1+ε)','quality');
 s+=tx(24,91,'General weighted graphs · explicit matching edges · fixed ε > 0','setup');
 s+=tx(24,g.top+5,'Communication rounds','axis-title','start','data-axis="y"');
 s+=tx(24,p.y+5,r.displayBound,'formula');
 s+=tx(24,p.y+30,'d̄ = average degree','muted');
 s+=tx(p.x,p.y-26,'GGM 2022','upper-label','middle')+marker(r,p,interactive,o,8);
 s+=tx(p.x,g.bottom+29,'Õ(n) per machine','memory','middle');
 s+=tx((g.left+g.right)/2,g.bottom+54,'Local memory · symbolic category','axis-title','middle','data-axis="x"');
 s+=tx(24,h*.87,'Total memory Õ(m+n) · randomized · success ≥ 1−1/n^c for any constant c','muted');
 s+=tx(24,h*.92,'No comparable lower bound reviewed for this near-linear-memory contract.','foot');
 s+=tx(24,h-13,'Full ε dependence and the b_v=1 specialization appear in the theorem details.','foot');
 return s+'</svg>';
}
function diagramSVG(a={},b={}){return chart(1000,580,typeof a==='string'?b:(a||{}),true);}
function summarySVG(key,w,h,options={}){return chart(w,h,options,false);}
function release(root){for(const i of instances)if(!i.root.isConnected||i.root===root)i.destroy();}
function mount(root,key=ID,options={}){
 release(root);
 for(const name of ['StreamingMatching','DynamicMatching','LCAMatching','LocalMatching','MPCMatching','ListQueryMatching'])window[name]?.release(root);
 for(const [id,r]of Object.entries(window.AtlasPairRenderers||{}))if(id!==ID)r.release?.(root);
 const controller=new AbortController();let publication=options.publication||'all',selected=data.verifiedRecords[0]?.id;
 const opts=()=>({publication,selected});
 root.classList.add('focus-view','wmpc-view');root.classList.toggle('f-embedded',!!options.embedded);root.setAttribute('aria-label','Weighted matching in near-linear-memory MPC');
 root.innerHTML='<p class="f-kicker">WEIGHTED MATCHING × MPC</p><header class="f-hero"><div><h1>Near-optimal weight across machines</h1><p>One verified theorem, with its memory contract and full approximation dependence kept visible.</p></div></header><div class="wmpc-toolbar"><div class="wmpc-legend"><span><i class="wmpc-key-upper"></i>Algorithm</span><span><i class="wmpc-key-setup"></i>Near-linear memory</span><span class="wmpc-muted-note">No comparable lower bound reviewed</span></div><label>Sources <select class="wmpc-publication" aria-label="Weighted MPC publication filter"><option value="all">All reviewed sources</option><option value="published">Published only</option></select></label></div><div class="wmpc-scroll" tabindex="0" aria-label="Weighted MPC figure; horizontal scrolling available"><div class="wmpc-plot"></div></div><div class="wmpc-notes"><p><b>Reading the figure.</b> The point pairs a round bound with the theorem’s local memory. Both axes show exact symbolic categories; the point does not establish a numerical tradeoff curve.</p><p><b>Lower-bound coverage.</b> '+esc(data.lowerBoundStatus)+'</p></div><section class="wmpc-theorem" aria-live="polite" aria-label="Selected weighted MPC theorem"></section><div class="wmpc-records" aria-label="Inspect weighted MPC result"></div><p class="wmpc-coverage">'+esc(data.coverageNote)+'</p>';
 function inspect(){
  const r=records(opts()).find(r=>r.id===selected),el=root.querySelector('.wmpc-theorem');
  if(!r){el.innerHTML='<p>No sources match this filter.</p>';return;}
  el.innerHTML='<div class="wmpc-detail-head"><strong class="wmpc-green">Algorithm upper bound</strong><span>'+esc(r.shortLabel)+'</span></div><div class="wmpc-detail-values"><div><small>Matching weight</small><strong>'+esc(r.quality)+'</strong></div><div><small>Rounds · fixed ε</small><strong>'+esc(r.displayBound)+'</strong></div></div><p><b>Graph and output.</b> '+esc(r.graph)+'. '+esc(r.output)+'.</p><p><b>Memory.</b> Local '+esc(r.localMemory)+'; total '+esc(r.totalMemory)+'.</p><p><b>Success.</b> '+esc(r.probability)+'.</p><p><b>Full accuracy dependence.</b> '+esc(r.exactRoundComplexity)+'; local memory '+esc(r.exactLocalMemory)+'.</p><p>'+esc(r.parameters)+'.</p><details><summary>Theorem, assumptions and primary source</summary><h3>'+esc(r.title)+'</h3><p>'+esc((r.authors||[]).join(', '))+' · '+esc(r.venue)+'</p><p><b>'+esc(r.theorem)+'</b></p><p>'+esc(r.notes)+'</p><ul>'+r.assumptions.map(a=>'<li>'+esc(a)+'</li>').join('')+'</ul><p><b>Verification.</b> Existing full-text review '+esc(r.verifiedOn)+'; migrated from '+esc(r.originRecordId)+'.</p><p><a href="'+esc(r.fullTextUrl||r.url)+'" target="_blank" rel="noopener noreferrer">Read primary theorem ↗</a> · <a href="'+esc(r.publicationUrl||r.url)+'" target="_blank" rel="noopener noreferrer">Published paper ↗</a></p></details>';
 }
 function render(){
  const rr=records(opts());if(!rr.some(r=>r.id===selected))selected=rr[0]?.id;
  root.querySelector('.wmpc-publication').value=publication;
  root.querySelector('.wmpc-plot').innerHTML=diagramSVG(opts());
  root.querySelector('.wmpc-records').innerHTML=rr.map(r=>'<button type="button" class="wmpc-record" data-wmpc-result="'+esc(r.id)+'" aria-pressed="'+(r.id===selected)+'"><span>'+esc(r.shortLabel)+'</span><strong>'+esc(r.quality)+'</strong><small>'+esc(r.roundComplexity)+' · local '+esc(r.localMemory)+'</small></button>').join('');
  inspect();
 }
 function select(e){const b=e.target.closest('[data-wmpc-result]');if(b&&records(opts()).some(r=>r.id===b.dataset.wmpcResult)){selected=b.dataset.wmpcResult;render();}}
 root.addEventListener('click',select,{signal:controller.signal});
 root.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const b=e.target.closest('.wmpc-point');if(b){e.preventDefault();select(e);}}},{signal:controller.signal});
 root.addEventListener('change',e=>{if(e.target.classList.contains('wmpc-publication')){publication=e.target.value;render();options.onPublicationChange?.(publication);}},{signal:controller.signal});
 render();const instance={root,settingKey:ID,redraw:render,destroy(){controller.abort();root.classList.remove('wmpc-view');instances.delete(instance);}};instances.add(instance);return instance;
}
window.AtlasPairRenderers=window.AtlasPairRenderers||{};window.AtlasPairRenderers[ID]={mount,diagramSVG,summarySVG,records,release,layoutGeometry:geometry};
})();
