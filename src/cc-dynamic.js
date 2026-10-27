(()=>{
'use strict';
const ID='cc-dynamic',data=JSON.parse(document.getElementById('atlas-data').textContent).focus[ID];if(!data)return;
const instances=new Set();let serial=0;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tx=(x,y,s,cls='',anchor='start',extra='')=>'<text x="'+x+'" y="'+y+'" class="'+cls+'" text-anchor="'+anchor+'" '+extra+'>'+esc(s)+'</text>';
const merge=r=>({...data.sources[r.sourceId],...r});
const records=(o={})=>data.verifiedRecords.map(merge).filter(r=>o.publication!=='published'||r.publicationStatus!=='preprint');
const related=(o={})=>(data.relatedResults||[]).map(merge).filter(r=>o.publication!=='published'||r.publicationStatus!=='preprint');
const factor=r=>r.factorExpression==='3+ε'?3+data.sharedAxes.epsilonReference:r.factor;
const titles={'adaptive-fixed':'Adaptive · fixed-time success','oblivious-expected':'Oblivious · expected cost'};
const color=k=>k==='adaptive-fixed'?'var(--blue)':k==='oblivious-expected'?'var(--ccd-oblivious)':'var(--ccd-sequence)';
function target(r,body,o,focus){return '<g class="ccd-result ccd-algorithm" data-ccd-result="'+esc(r.id)+'" data-setup="'+r.setup+'"'+(focus?' role="button" tabindex="0" aria-pressed="'+(o.selected===r.id)+'"':'')+' aria-label="'+esc(r.displayFactor+' approximation; '+r.bound+'; '+r.probability)+'"><title>'+esc(r.displayFactor+' · '+r.bound)+'</title>'+body+'</g>';}
function marker(r,x,y,size,o,focus){return target(r,'<circle data-marker="algorithm" data-factor="'+factor(r)+'" data-center-x="'+x+'" data-center-y="'+y+'" cx="'+x+'" cy="'+y+'" r="'+(size+3)+'" fill="'+color(r.setup)+'" opacity=".20"/><circle cx="'+x+'" cy="'+y+'" r="'+size+'" fill="var(--green)"/>',o,focus);}
function chart(w,h,o={},focus=false){
 const levels=['overview','compact','detail'],available=w<300||h<210?0:w<650||h<500?1:2,requested=levels.indexOf(o.level),level=focus?'detail':levels[Math.min(available,requested<0?available:requested)],tiny=level==='overview',detail=level==='detail';
 const rows=records(o),robust=rows.find(r=>r.setup==='adaptive-sequence');
 let s='<svg class="'+(focus?'ccd-map':'ccd-summary')+'" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="xMidYMid meet" data-detail-level="'+level+'" role="img" aria-label="Dynamic correlation clustering: approximation factors on shared horizontal axes, update formulas in separate adversary and probability scopes."><title>Dynamic correlation clustering</title><desc>Green denotes algorithm upper bounds. No dynamic lower bound is verified in this bounded source set. Adaptive fixed-time success and oblivious expected cost use aligned factor scales. Update-time formulas are categorical, not a total runtime ranking. The whole-sequence robust algorithm has an unspecified constant factor and is shown separately.</desc>';
 if(!rows.length)return s+(tiny?'':tx(w/2,h/2,'No sources match this filter.','ccd-muted','middle'))+'</svg>';
 if(tiny){
  const l=8,r=w-8,t=12,b=h-12,ys=[t+(b-t)*.13,t+(b-t)*.5,t+(b-t)*.87],x=a=>l+(a-1)/3*(r-l);
  for(const [i,setup] of ['adaptive-fixed','oblivious-expected'].entries()){
   s+='<path d="M'+l+' '+ys[i]+'H'+r+'" stroke="'+color(setup)+'" opacity=".35" stroke-width="3"/>';
   for(const row of rows.filter(a=>a.setup===setup&&(a.row===0||a.row===2)))s+=marker(row,x(factor(row)),ys[i],2.5,o,false);
  }
  if(robust)s+=target(robust,'<path data-symbolic-factor="true" d="M'+l+' '+ys[2]+'H'+r+'" stroke="'+color('adaptive-sequence')+'" stroke-dasharray="4 3" stroke-width="3"/><circle cx="'+(l+(r-l)*.5)+'" cy="'+ys[2]+'" r="3" fill="var(--green)"/>',o,false);
  return s+'</svg>';
 }
 if(!detail){
  const l=Math.max(100,w*.34),r=w-24,x=a=>l+(a-1)/3*(r-l),top=26,band=(h-75)/2;
  s+=tx(10,15,'Approximation × guarantee','ccd-heading');
  for(const [i,setup] of ['adaptive-fixed','oblivious-expected'].entries()){
   const y0=top+i*band;
   s+=tx(10,y0+8,setup==='adaptive-fixed'?'Adaptive · fixed time':'Oblivious · expected','ccd-setup '+setup);
   const rr=rows.filter(a=>a.setup===setup&&(a.row===0||(setup==='oblivious-expected'&&a.row===2)));
   for(const [j,row] of rr.entries()){
    const y=y0+29+j*Math.max(22,(band-37)/2),xx=x(factor(row));
    s+=tx(10,y+3,row.setup==='adaptive-fixed'?(row.row===0?'log(1/δ) · WC':'(log log n+log(1/δ))/ε'):(row.row===0?'polylog n · E':'1/ε · E*'),'ccd-cost-short')+'<path d="M'+l+' '+y+'H'+r+'" class="ccd-grid"/>'+marker(row,xx,y,3.3,o,false)+tx(xx,y-8,row.displayFactor,'ccd-factor','middle');
   }
  }
  const yy=h-28;
  if(robust)s+=target(robust,'<path d="M10 '+(yy-8)+'H'+(w-10)+'" stroke="'+color('adaptive-sequence')+'" stroke-width="2" opacity=".4"/>'+tx(10,yy+8,'Sequence: O(1) factor · log²n amort.','ccd-setup adaptive-sequence'),o,false);
  s+=tx(w-12,h-5,'α →   ε=¼ reference · rows differ','ccd-muted','end');
  return s+'</svg>';
 }
 const pad=24,gap=30,pw=(w-pad*2-gap)/2,top=111,bottom=h*.69,rowTop=top+42,rowGap=(bottom-rowTop-32)/2;
 s+=tx(pad,29,'Approximation and update guarantees','ccd-heading')+tx(pad,51,'Complete signed graphs · edge-label flips · ε = ¼ is a labelled plotting reference','ccd-muted');
 for(const [i,setup] of ['adaptive-fixed','oblivious-expected'].entries()){
  const x0=pad+i*(pw+gap),x1=x0+pw,l=x0+pw*.42,r=x1-15,xx=a=>l+(a-1)/3*(r-l);
  s+='<g data-panel="'+setup+'" data-axis-x-min="1" data-axis-x-max="4"><path d="M'+x0+' 72H'+x1+'" stroke="'+color(setup)+'" stroke-width="3"/>';
  s+=tx(x0,94,titles[setup],'ccd-panel-title '+setup)+tx(x0,113,setup==='adaptive-fixed'?'Success ≥1−δ at a preselected update':'Quality and update time in expectation','ccd-muted');
  s+=tx(x0,135,'Update-time bound','ccd-axis-title','start','data-axis="y"');
  for(const a of [1,2,3,4])s+='<path d="M'+xx(a)+' '+(top+32)+'V'+bottom+'" class="ccd-grid"/>'+tx(xx(a),bottom+20,a,'ccd-tick','middle');
  s+='<path d="M'+l+' '+bottom+'H'+r+'" class="ccd-axis"/>';
  for(const row of rows.filter(a=>a.setup===setup)){
   const y=rowTop+row.row*rowGap,x=xx(factor(row));
   row.costLines.forEach((line,j)=>s+=tx(x0,y+2+j*16,line,j?'ccd-muted':'ccd-cost'));
   s+='<path d="M'+l+' '+y+'H'+r+'" class="ccd-row-line"/>'+marker(row,x,y,5,o,focus);
   s+=target(row,tx(x,y-15,row.displayFactor,'ccd-factor','middle')+tx(x,y+25,row.row===0&&setup==='oblivious-expected'?'Modified-Pivot':row.row===1&&setup==='oblivious-expected'?'Pivot / MIS':row.row===2&&setup==='oblivious-expected'?'Pruned Pivot':row.row===0?'Thm. 1':row.row===1?'Cor. 10':'Cor. 7','ccd-source-label','middle'),o,focus);
  }
  s+=tx((l+r)/2,bottom+45,'α · smaller is better','ccd-axis-title','middle','data-axis="x"')+'</g>';
 }
 if(robust){
  const y=h*.84;
  s+='<g data-panel="adaptive-sequence" data-symbolic-factor="true"><path d="M'+pad+' '+(y-22)+'H'+(w-pad)+'" stroke="'+color('adaptive-sequence')+'" opacity=".6" stroke-width="2"/>';
  s+=tx(pad,y,'Adaptive · whole sequence','ccd-panel-title adaptive-sequence');
  s+=target(robust,tx(pad,y+30,'O(1) approximation','ccd-factor')+tx(w*.38,y+2,'O(log² n) amortized','ccd-cost')+tx(w*.38,y+25,'Implicit clustering representation','ccd-muted')+tx(w*.72,y+2,'High probability throughout','ccd-cost')+tx(w*.72,y+25,'a polynomial update sequence','ccd-muted'),o,focus);
  s+=tx(pad,y+51,'Unspecified constant: no numerical α coordinate.','ccd-muted')+'</g>';
 }
 s+=tx(w-pad,h-10,'Rows are categorical. *Pruned Pivot: §7.2 allocation assumption. No verified dynamic lower bound here.','ccd-muted','end');
 return s+'</svg>';
}
function diagramSVG(a={},b={}){return chart(1000,650,typeof a==='string'?b:a,true)}
function summarySVG(key,w,h,options={}){return chart(w,h,options,false)}
function release(root){for(const i of instances)if(!i.root.isConnected||i.root===root)i.destroy()}
function mount(root,key=ID,options={}){
 release(root);for(const name of ['StreamingMatching','DynamicMatching','LCAMatching','LocalMatching','MPCMatching','ListQueryMatching'])window[name]?.release(root);
 for(const [id,r] of Object.entries(window.AtlasPairRenderers||{}))if(id!==ID)r.release?.(root);
 const controller=new AbortController(),uid='ccd-'+(++serial);let publication=options.publication||'all',selected=records({publication})[0]?.id;
 const opts=()=>({publication,selected}),all=()=>[...records(opts()),...related(opts())];
 root.classList.add('focus-view','ccd-view');root.classList.toggle('f-embedded',!!options.embedded);root.setAttribute('aria-label','Dynamic correlation clustering results and assumptions');
 root.innerHTML='<p class="f-kicker">CORRELATION CLUSTERING × DYNAMIC</p><header class="f-hero"><div><h1>Dynamic clustering: cost and guarantee together</h1><p>Compare approximation factors while keeping the adversary, probability contract and output representation visible.</p></div></header><div class="ccd-toolbar"><div class="ccd-legend" id="'+uid+'"><span><i class="ccd-key-alg"></i>Algorithm upper bound</span><span class="adaptive-fixed"><i class="ccd-key-fixed"></i>Adaptive · fixed time</span><span class="oblivious-expected"><i class="ccd-key-oblivious"></i>Oblivious · expectation</span><span class="adaptive-sequence"><i class="ccd-key-sequence"></i>Adaptive · sequence</span></div><label>Sources <select class="ccd-publication" aria-label="Dynamic clustering publication filter"><option value="all">All reviewed sources</option><option value="published">Published only</option></select></label></div><div class="ccd-scroll" tabindex="0" aria-label="Dynamic clustering figure; scroll horizontally on narrow screens"><div class="ccd-plot"></div></div><div class="ccd-notes"><p><b>How to read.</b> Horizontal positions share the approximation-factor scale. For the 3+ε algorithms, the displayed point is ε=1/4; formulas retain free ε. Cost rows are categorical, with no invented polylog exponent.</p><p><b>Probability matters.</b> A guarantee at a time chosen before the updates differs from success throughout a sequence and from expected cost. No curve joins these scopes.</p><p><b>Lower bounds.</b> No dynamic lower bound was verified in this bounded source set. Red remains reserved for verified lower bounds; no red marker is inferred from a gap between algorithms.</p></div><section class="ccd-theorem" aria-live="polite" aria-label="Selected dynamic clustering theorem"></section><div class="ccd-records" aria-label="Inspect edge-update primary statements"></div><section class="ccd-related"><h2>Related update models and scope checks</h2><p>Node database updates have a different input cost. The older dynamic 5-approximation remains visible pending its full-text scope check.</p><div class="ccd-related-records"></div></section><p class="ccd-coverage">'+esc(data.coverage)+'</p>';
 function inspect(){
  const r=all().find(r=>r.id===selected),el=root.querySelector('.ccd-theorem');if(!r){el.innerHTML='<p>No results match this filter.</p>';return}
  el.innerHTML='<div class="ccd-detail-top"><strong class="'+(r.unresolved?'ccd-pending':'ccd-algorithm')+'">'+(r.unresolved?'Scope not fully verified':'Algorithm guarantee')+'</strong><span>'+esc(r.shortLabel)+'</span></div><div class="ccd-detail-grid"><div><small>Approximation</small><strong>'+esc(r.displayFactor)+'</strong></div><div><small>Update resource</small><strong>'+esc(r.bound)+'</strong></div></div><p><b>Quality.</b> '+esc(r.quality)+'</p><p><b>Adversary and probability.</b> '+esc(r.adversary)+' · '+esc(r.probability)+'</p><p><b>Output.</b> '+esc(r.output)+'</p><p><b>Access.</b> '+esc(r.oracle)+'</p><p>'+esc(r.notes)+'</p><details><summary>Theorem, assumptions and primary source</summary><h3>'+esc(r.title)+'</h3><p>'+esc((r.authors||[]).join(', '))+'</p><p><b>'+esc(r.theorem)+'</b></p><p>'+esc(r.assumptions.join('; '))+'</p><p><a href="'+esc(r.sourceUrl||r.fullTextUrl||r.url)+'" target="_blank" rel="noopener noreferrer">Read primary source ↗</a> · <a href="'+esc(r.publicationUrl||r.url)+'" target="_blank" rel="noopener noreferrer">Publication ↗</a></p></details>';
 }
 function card(r){return '<button class="ccd-record '+(r.unresolved?'ccd-pending':'ccd-algorithm')+'" type="button" data-ccd-result="'+esc(r.id)+'" aria-pressed="'+(r.id===selected)+'"><span>'+esc(r.unresolved?'Full-text scope pending':r.related?r.adversary:titles[r.setup]||'Adaptive · whole sequence')+'</span><strong>'+esc(r.displayFactor+' approximation · '+r.displayBound)+'</strong><small>'+esc(r.updateGuarantee+' · '+r.output)+'</small></button>'}
 function render(){const rr=all();if(!rr.some(r=>r.id===selected))selected=rr[0]?.id;root.querySelector('.ccd-publication').value=publication;root.querySelector('.ccd-plot').innerHTML=diagramSVG(opts());root.querySelector('.ccd-records').innerHTML=records(opts()).map(card).join('');root.querySelector('.ccd-related-records').innerHTML=related(opts()).map(card).join('');inspect()}
 root.addEventListener('click',e=>{const b=e.target.closest('[data-ccd-result]');if(b){selected=b.dataset.ccdResult;render()}},{signal:controller.signal});
 root.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const b=e.target.closest('.ccd-result');if(b){e.preventDefault();selected=b.dataset.ccdResult;render()}},{signal:controller.signal});
 root.addEventListener('change',e=>{if(e.target.classList.contains('ccd-publication')){publication=e.target.value;render();options.onPublicationChange?.(publication)}},{signal:controller.signal});
 render();const instance={root,settingKey:ID,redraw:render,destroy(){controller.abort();root.classList.remove('ccd-view');instances.delete(instance)}};instances.add(instance);return instance;
}
window.AtlasPairRenderers=window.AtlasPairRenderers||{};window.AtlasPairRenderers[ID]={mount,diagramSVG,summarySVG,records,related,release};
})();