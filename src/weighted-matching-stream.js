(()=>{
'use strict';
const ID='weighted-matching-stream',data=JSON.parse(document.getElementById('atlas-data').textContent).focus[ID];if(!data)return;
const instances=new Set();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tx=(x,y,s,cls='',anchor='start',extra='')=>'<text x="'+x+'" y="'+y+'" class="wstr-'+cls+'" text-anchor="'+anchor+'" '+extra+'>'+esc(s)+'</text>';
const line=(x1,y1,x2,y2,cls='grid')=>'<path d="M'+x1+' '+y1+'L'+x2+' '+y2+'" class="wstr-'+cls+'"/>';
const records=(o={})=>data.verifiedRecords.map(r=>({...data.sources[r.sourceId],...r})).filter(r=>o.publication!=='published'||r.publicationStatus!=='preprint');
function geometry(w,h,o={},focus=false){
 const levels=['overview','compact','detail'],available=w<300||h<230?0:w<650||h<480?1:2,requested=levels.indexOf(o.level),level=focus?'detail':levels[Math.min(available,requested<0?available:requested)];
 const tiny=level==='overview',compact=level==='compact';
 const left=w*(tiny?.16:compact?.16:.46),right=w*.94,top=h*(tiny?.20:compact?.36:.29),bottom=h*(tiny?.81:compact?.72:.69);
 return{w,h,level,left,right,top,bottom,points:records(o).map(r=>({id:r.id,x:w*.71,y:h*(tiny?.47:compact?.48:.49)}))};
}
function marker(r,p,interactive,o,size){
 return'<g class="wstr-point" data-wstr-result="'+esc(r.id)+'" data-kind="upper" data-panel="insertion" data-point-x="'+p.x+'" data-point-y="'+p.y+'"'+(interactive?' role="button" tabindex="0" aria-pressed="'+(o.selected===r.id)+'"':'')+' aria-label="'+esc(r.shortLabel+'; '+r.quality+'; '+r.displayBound+'; memory '+r.space)+'"><title>'+esc(r.shortLabel+' · '+r.displayBound+' · '+r.quality)+'</title><circle class="wstr-halo" cx="'+p.x+'" cy="'+p.y+'" r="'+(size+7)+'"/><circle class="wstr-upper-marker" cx="'+p.x+'" cy="'+p.y+'" r="'+size+'"/></g>';
}
function chart(w,h,o={},interactive=false){
 const g=geometry(w,h,o,interactive),r=records(o)[0],p=g.points[0],tiny=g.level==='overview',compact=g.level==='compact';
 let s='<svg class="wstr-'+(interactive?'map':'summary')+'" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="xMidYMid meet" data-detail-level="'+g.level+'" role="img" aria-label="Weighted matching in insertion-only streams: near-optimal weight in O(log n/epsilon) passes, O(n log squared n/epsilon) bits"><title>Weighted matching · insertion-only streaming</title><desc>A green algorithm point gives an explicit approximate maximum-weight matching. Passes and bit-space are symbolic resource categories. No comparable insertion-only multipass lower bound is verified in this source set.</desc>';
 if(!r)return s+(tiny?'':tx(w/2,h/2,'No sources match this filter.','muted','middle'))+'</svg>';
 s+=line(g.left,g.top,g.left,g.bottom,'axis')+line(g.left,g.bottom,g.right,g.bottom,'axis')+line(g.left,p.y,g.right,p.y)+line(p.x,g.top,p.x,g.bottom);
 if(tiny)return s+marker(r,p,false,o,Math.max(2,Math.min(w,h)*.032))+'</svg>';
 if(compact){
  s+=tx(10,19,'Positive integer weights','setup')+tx(10,39,'w(M) ≥ (1−ε) OPTweight','quality');
  s+=tx(10,62,'Arbitrary-order · insertion-only','muted');
  s+=tx(10,88,'O(log n/ε) passes','formula','start','data-axis="y"');
  s+=tx(p.x,p.y+24,'Assadi ’25','upper-label','middle')+marker(r,p,false,o,5);
  s+=tx(p.x,g.bottom+23,'O(n log² n/ε) bits','memory','middle','data-axis="x"');
  s+=tx(10,h-27,'Randomized · multiple passes','muted');
  s+=tx(10,h-9,'No comparable lower bound reviewed','foot');
  return s+'</svg>';
 }
 s+=tx(24,32,'Near-optimal weight in multiple passes','heading');
 s+=tx(24,65,'w(M) ≥ (1−ε) OPTweight','quality');
 s+=tx(24,91,'General graphs · positive integer weights · arbitrary-order insertions','setup');
 s+=tx(24,g.top+5,'Passes over the stream','axis-title','start','data-axis="y"');
 s+=tx(24,p.y+5,r.displayBound,'formula');
 s+=tx(24,p.y+30,'ε controls weight accuracy','muted');
 s+=tx(p.x,p.y-26,'Assadi ’25','upper-label','middle')+marker(r,p,interactive,o,8);
 s+=tx(p.x,g.bottom+29,'O(n log² n/ε) bits','memory','middle');
 s+=tx((g.left+g.right)/2,g.bottom+54,'Working memory in bits · symbolic category','axis-title','middle','data-axis="x"');
 s+=tx(24,h*.87,'Randomized · success ≥ 1−exp(−Θ(n)) · output matching edges','muted');
 s+=tx(24,h*.92,'No comparable lower bound reviewed for this insertion-only contract.','foot');
 s+=tx(24,h-13,'Positive integer weights; approximation, passes and space share the same ε.','foot');
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
 root.classList.add('focus-view','wstr-view');root.classList.toggle('f-embedded',!!options.embedded);root.setAttribute('aria-label','Weighted matching in insertion-only streams');
 root.innerHTML='<p class="f-kicker">WEIGHTED MATCHING × STREAMING</p><header class="f-hero"><div><h1>Near-optimal weight in multiple passes</h1><p>One verified insertion-only theorem, with approximation, passes and working memory shown together.</p></div></header><div class="wstr-toolbar"><div class="wstr-legend"><span><i class="wstr-key-upper"></i>Algorithm</span><span><i class="wstr-key-setup"></i>Insertion-only</span><span class="wstr-muted-note">No comparable lower bound reviewed</span></div><label>Sources <select class="wstr-publication" aria-label="Weighted streaming publication filter"><option value="all">All reviewed sources</option><option value="published">Published only</option></select></label></div><div class="wstr-scroll" tabindex="0" aria-label="Weighted streaming figure; horizontal scrolling available"><div class="wstr-plot"></div></div><div class="wstr-notes"><p><b>Reading the figure.</b> The point pairs passes with bit-space. The same ε controls approximation, passes and memory. Axes show exact symbolic categories; positions do not establish a numerical tradeoff curve.</p><p><b>Lower-bound coverage.</b> '+esc(data.lowerBoundStatus)+'</p></div><section class="wstr-theorem" aria-live="polite" aria-label="Selected weighted streaming theorem"></section><div class="wstr-records" aria-label="Inspect weighted streaming result"></div><p class="wstr-coverage">'+esc(data.coverageNote)+'</p>';
 function inspect(){
  const r=records(opts()).find(r=>r.id===selected),el=root.querySelector('.wstr-theorem');
  if(!r){el.innerHTML='<p>No sources match this filter.</p>';return;}
  el.innerHTML='<div class="wstr-detail-head"><strong class="wstr-green">Algorithm upper bound</strong><span>'+esc(r.shortLabel)+'</span></div><div class="wstr-detail-values"><div><small>Matching weight</small><strong>'+esc(r.quality)+'</strong></div><div><small>Passes</small><strong>'+esc(r.displayBound)+'</strong></div></div><p><b>Graph and output.</b> '+esc(r.graph)+'. '+esc(r.output)+'.</p><p><b>Stream.</b> '+esc(r.stream)+'.</p><p><b>Working memory.</b> '+esc(r.space)+'.</p><p><b>Success probability.</b> '+esc(r.probability)+'.</p><p>'+esc(r.parameters)+'.</p><details><summary>Theorem, assumptions and primary source</summary><h3>'+esc(r.title)+'</h3><p>'+esc((r.authors||[]).join(', '))+' · '+esc(r.venue)+'</p><p><b>'+esc(r.theorem)+'</b></p><p>'+esc(r.notes)+'</p><ul>'+r.assumptions.map(a=>'<li>'+esc(a)+'</li>').join('')+'</ul><p><b>Verification.</b> Existing full-text review '+esc(r.verifiedOn)+'; migrated from '+esc(r.originRecordId)+'.</p><p><a href="'+esc(r.sourceUrl||r.fullTextUrl||r.url)+'" target="_blank" rel="noopener noreferrer">Read primary theorem ↗</a> · <a href="'+esc(r.publicationUrl||r.url)+'" target="_blank" rel="noopener noreferrer">Paper record ↗</a></p></details>';
 }
 function render(){
  const rr=records(opts());if(!rr.some(r=>r.id===selected))selected=rr[0]?.id;
  root.querySelector('.wstr-publication').value=publication;
  root.querySelector('.wstr-plot').innerHTML=diagramSVG(opts());
  root.querySelector('.wstr-records').innerHTML=rr.map(r=>'<button type="button" class="wstr-record" data-wstr-result="'+esc(r.id)+'" aria-pressed="'+(r.id===selected)+'"><span>'+esc(r.shortLabel)+'</span><strong>'+esc(r.quality)+'</strong><small>'+esc(r.displayBound)+' · '+esc(r.space)+'</small></button>').join('');
  inspect();
 }
 function select(e){const b=e.target.closest('[data-wstr-result]');if(b&&records(opts()).some(r=>r.id===b.dataset.wstrResult)){selected=b.dataset.wstrResult;render();}}
 root.addEventListener('click',select,{signal:controller.signal});
 root.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const b=e.target.closest('.wstr-point');if(b){e.preventDefault();select(e);}}},{signal:controller.signal});
 root.addEventListener('change',e=>{if(e.target.classList.contains('wstr-publication')){publication=e.target.value;render();options.onPublicationChange?.(publication);}},{signal:controller.signal});
 render();const instance={root,settingKey:ID,redraw:render,destroy(){controller.abort();root.classList.remove('wstr-view');instances.delete(instance);}};instances.add(instance);return instance;
}
window.AtlasPairRenderers=window.AtlasPairRenderers||{};window.AtlasPairRenderers[ID]={mount,diagramSVG,summarySVG,records,release,layoutGeometry:geometry};
})();
