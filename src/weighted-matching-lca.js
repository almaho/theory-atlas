(()=>{
'use strict';
const ID='weighted-matching-lca',data=JSON.parse(document.getElementById('atlas-data').textContent).focus[ID];if(!data)return;
const instances=new Set();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const merge=r=>({...data.sources[r.sourceId],...r,publicationStatus:data.sources[r.sourceId].publicationStatus||r.publicationStatus});
function allowed(r,o){return(o.publication!=='published'||r.publicationStatus!=='preprint')&&(!o.randomness||o.randomness==='all'||(r.appliesTo||[r.randomization]).includes(o.randomness));}
const records=(o={})=>data.verifiedRecords.map(merge).filter(r=>allowed(r,o));
const related=(o={})=>data.relatedResults.map(merge).filter(r=>allowed(r,o));
function math(value){
 const valueText=String(value??'');let out='';
 for(let i=0;i<valueText.length;i++){
  if(valueText[i]==='^'&&valueText[i+1]==='{'){
   let depth=1,j=i+2;for(;j<valueText.length&&depth;j++){if(valueText[j]==='{')depth++;else if(valueText[j]==='}')depth--;}
   if(!depth){out+='<tspan baseline-shift="super" font-size=".75em">'+math(valueText.slice(i+2,j-1))+'</tspan>';i=j-1;continue;}
  }
  out+=esc(valueText[i]);
 }
 return out;
}
const text=(x,y,s,c='',extra='')=>'<text x="'+x+'" y="'+y+'" class="wlc-'+c+'" '+extra+'>'+math(s)+'</text>';
function geometry(w,h,o={},focus=false){
 const levels=['overview','compact','detail'],available=w<300||h<245?0:w<900||h<560?1:2,request=levels.indexOf(o.level),level=focus?'detail':levels[Math.min(available,request<0?available:request)];
 const rr=records(o),tiny=level==='overview',compact=level==='compact',left=tiny?w*.06:16,right=tiny?w*.94:w-16,top=tiny?h*.1:compact?48:112,bottom=tiny?h*.9:h-(compact?18:52),gap=tiny?Math.min(8,h*.04):compact?7:12;
 const height=rr.length?(bottom-top-gap*(rr.length-1))/rr.length:0;
 return{w,h,level,left,right,top,bottom,rows:rr.map((r,i)=>({id:r.id,x:left,y:top+i*(height+gap),w:right-left,h:height})),points:rr.map((r,i)=>({id:r.id,x:left+12,y:top+i*(height+gap)+height/2}))};
}
function chart(w,h,o={},interactive=false){
 const g=geometry(w,h,o,interactive),rr=records(o),tiny=g.level==='overview',compact=g.level==='compact';
 let s='<svg class="wlc-'+(interactive?'map':'summary')+'" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="xMidYMid meet" data-detail-level="'+g.level+'" role="img" aria-label="Weighted matching in LCA: weighted and unit-weight algorithms beside a necessary-probes bound"><title>Weighted matching · LCA probes</title><desc>Green algorithms and a red necessary-probes row. All rows use ordinary indexed-neighbor probes per mate query. Mixed weights and unit weights remain labeled. Symbolic formulas, not a numerical ranking.</desc>';
 if(!rr.length)return s+(tiny?'':text(16,40,'No results match these filters.','muted'))+'</svg>';
 if(!tiny){
  if(!compact)s+=text(20,32,'One matching, queried one vertex at a time','heading')+text(20,59,'Weighted LCA · (1−ε) of optimum · probes per mate query','muted');
  s+=text(20,compact?18:92,'Setup and guarantee','axis','data-axis="y"')+text(compact?153:355,compact?35:92,'LCA probes · symbolic','axis','data-axis="x"');
 }
 rr.forEach((r,i)=>{
  const p=g.rows[i],color=r.kind==='lower'?'lower':'upper',selected=o.selected===r.id,mid=p.y+p.h/2;
  s+='<g class="wlc-row wlc-'+color+'" data-wlc-result="'+esc(r.id)+'" data-kind="'+r.kind+'"'+(interactive?' role="button" tabindex="0" aria-pressed="'+selected+'"':'')+' aria-label="'+esc(r.displaySetup+'; '+r.quality+'; '+r.bound)+'"><title>'+esc(r.shortLabel+' · '+r.bound+' · '+r.quality)+'</title><rect class="wlc-row-bg'+(selected?' wlc-selected':'')+'" x="'+p.x+'" y="'+p.y+'" width="'+p.w+'" height="'+p.h+'" rx="'+(tiny?3:7)+'"/>';
  const mx=p.x+(tiny?p.w*.1:12),my=tiny?mid:compact?p.y+16:p.y+31,sz=tiny?Math.max(2,Math.min(w,h)*.022):compact?3.5:5;
  s+=r.kind==='lower'?'<path class="wlc-marker" d="M'+mx+' '+(my-sz)+'l'+sz+' '+sz+'l-'+sz+' '+sz+'l-'+sz+' -'+sz+'Z"/>':'<circle class="wlc-marker" cx="'+mx+'" cy="'+my+'" r="'+sz+'"/>';
  if(tiny){s+='<path class="wlc-glyph" d="M'+(p.x+p.w*.23)+' '+(mid-p.h*.11)+'H'+(p.x+p.w*.84)+'M'+(p.x+p.w*.23)+' '+(mid+p.h*.14)+'H'+(p.x+p.w*.63)+'"/>';}
  else if(compact){
   s+=text(p.x+24,p.y+19,r.compactSetup,'setup');
   r.compactLines.forEach((v,j)=>{s+=text(p.x+24,p.y+37+j*13,v,'formula compact-formula');});
  }else{
   s+=text(p.x+30,p.y+36,r.displaySetup,'setup')+text(p.x+30,p.y+64,r.displayQuality,'quality')+text(p.x+30,p.y+88,r.referenceLabel,'muted');
   r.displayLines.forEach((v,j)=>{s+=text(355,p.y+40+j*29,v,'formula');});
   s+=text(355,p.y+p.h-14,r.rowFoot,'row-foot');
  }
  s+='</g>';
 });
 if(!tiny)s+=text(20,h-(compact?3:20),compact?'Theorem rows; no numerical ranking.':'Symbolic categories: row order and spacing do not order formulas in n, Δ, ε and the weight floor.','foot');
 return s+'</svg>';
}
const diagramSVG=(a={},b={})=>chart(1000,560,typeof a==='string'?b:(a||{}),true);
const summarySVG=(key,w,h,o={})=>chart(w,h,o,false);
function release(root){for(const i of instances)if(i.root===root||!i.root.isConnected)i.destroy();}
function mount(root,key=ID,options={}){
 release(root);
 for(const n of ['StreamingMatching','DynamicMatching','LCAMatching','LocalMatching','MPCMatching','ListQueryMatching'])window[n]?.release(root);
 for(const [id,r]of Object.entries(window.AtlasPairRenderers||{}))if(id!==ID)r.release?.(root);
 const controller=new AbortController();let publication=options.publication||'all',selected=data.verifiedRecords[0]?.id;
 const opts=()=>({publication,selected});
 root.classList.add('focus-view','wlc-view');root.classList.toggle('f-embedded',!!options.embedded);
 root.setAttribute('aria-label','Weighted matching through local probes');
 root.innerHTML='<p class="f-kicker">WEIGHTED MATCHING × LCA</p><header class="f-hero"><div><h1>How many probes reveal one matched partner?</h1><p>Answers must describe one matching with at least 1−ε of optimum weight. Each theorem keeps its weight assumptions visible.</p></div></header><div class="wlc-toolbar"><div class="wlc-legend"><span class="wlc-upper-text">● Algorithm</span><span class="wlc-lower-text">◆ Lower bound</span></div><label>Sources <select class="wlc-publication" aria-label="Weighted LCA publication filter"><option value="all">All reviewed sources</option><option value="published">Published only</option></select></label></div><div class="wlc-scroll" tabindex="0" aria-label="Weighted LCA symbolic figure; horizontal scrolling available"><div class="wlc-plot"></div></div><div class="wlc-notes"><p><b>Same output, counted carefully.</b> Return the queried vertex’s mate or unmatched. The green bounds include both reverse-port recovery and edge-to-mate conversion: at most two factors Δ beyond the published edge-oracle cost.</p><p><b>Weight setups.</b> The first row keeps the minimum-weight dependence. The lower two rows compare the unit-weight case. The red bound applies only when 0&lt;ε≤.01 and log⁴ n≤Δ≤n^ε; it is not a fixed-degree lower bound.</p></div><section class="wlc-theorem" aria-live="polite" aria-label="Selected weighted LCA theorem"></section><div class="wlc-records" aria-label="Inspect weighted LCA results"></div><p class="wlc-coverage">'+esc(data.coverageNote)+'</p>';
 function inspect(){
  const r=records(opts()).find(v=>v.id===selected),el=root.querySelector('.wlc-theorem');
  if(!r){el.innerHTML='<p>No results match these filters.</p>';return;}
  el.innerHTML='<div class="wlc-detail-head"><strong class="wlc-'+(r.kind==='lower'?'lower':'upper')+'-text">'+(r.kind==='lower'?'Lower bound · unit-weight transfer':'Algorithm · explicit oracle conversion')+'</strong><span>'+esc(r.shortLabel)+'</span></div><h2>'+esc(r.displayBound)+'</h2><p><b>Guarantee.</b> '+esc(r.quality)+'</p><p><b>Probability.</b> '+esc(r.probability)+'</p><p>'+esc(r.notes)+'</p><details><summary>Theorem, assumptions and paper links</summary><h3>'+esc(r.title)+'</h3><p>'+esc(r.authors.join(', '))+' · '+esc(r.venue)+'</p><p><b>'+esc(r.theorem)+'</b></p><p><b>Graph.</b> '+esc(r.graph)+'</p><p><b>Output.</b> '+esc(r.output)+'</p><p><b>Evidence.</b> '+esc(r.evidenceStatus)+'</p><p><a href="'+esc(r.url)+'" target="_blank" rel="noopener noreferrer">arXiv ↗</a> · <a href="'+esc(r.sourceUrl||r.fullTextUrl)+'" target="_blank" rel="noopener noreferrer">Primary theorem ↗</a> · <a href="'+esc(r.publicationUrl)+'" target="_blank" rel="noopener noreferrer">Published paper ↗</a></p></details>';
 }
 function render(){
  const rr=records(opts());if(!rr.some(r=>r.id===selected))selected=rr[0]?.id;
  root.querySelector('.wlc-publication').value=publication;
  root.querySelector('.wlc-plot').innerHTML=diagramSVG(opts());
  root.querySelector('.wlc-records').innerHTML=rr.map(r=>'<button type="button" class="wlc-record '+(r.kind==='lower'?'wlc-lower-card':'')+'" data-wlc-result="'+esc(r.id)+'" aria-pressed="'+(r.id===selected)+'"><span>'+esc(r.shortLabel)+'</span><strong>'+esc(r.displaySetup)+'</strong><small>'+esc(r.quality)+'</small></button>').join('');inspect();
 }
 function select(e){const b=e.target.closest('[data-wlc-result]');if(b&&records(opts()).some(r=>r.id===b.dataset.wlcResult)){selected=b.dataset.wlcResult;render();}}
 root.addEventListener('click',select,{signal:controller.signal});
 root.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.closest('.wlc-row')){e.preventDefault();select(e);}},{signal:controller.signal});
 root.addEventListener('change',e=>{if(e.target.classList.contains('wlc-publication')){publication=e.target.value;render();options.onPublicationChange?.(publication);}},{signal:controller.signal});
 render();const instance={root,settingKey:ID,redraw:render,destroy(){controller.abort();root.classList.remove('wlc-view');instances.delete(instance);}};instances.add(instance);return instance;
}
window.AtlasPairRenderers=window.AtlasPairRenderers||{};window.AtlasPairRenderers[ID]={mount,diagramSVG,summarySVG,records,related,release,layoutGeometry:geometry};
})();
