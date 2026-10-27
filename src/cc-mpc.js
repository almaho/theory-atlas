(function ccMpcRenderer(){
'use strict';
const ID='cc-mpc',el=document.getElementById('atlas-data');if(!el)return;
const data=JSON.parse(el.textContent).focus[ID];if(!data)return;
const instances=new Set(),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const txt=(x,y,s,c='',a='start',extra='')=>'<text x="'+x+'" y="'+y+'" class="'+c+'" text-anchor="'+a+'" '+extra+'>'+esc(s)+'</text>';
const merge=r=>({...data.sources[r.sourceId],...r});
const filter=(r,o)=>o.publication!=='published'||r.publicationStatus!=='preprint';
const records=(o={})=>data.verifiedRecords.map(merge).filter(r=>filter(r,o));
const related=(o={})=>data.relatedResults.map(merge).filter(r=>filter(r,o));
const colors={general:'var(--blue)',arboricity:'var(--purple, #8064a8)',forest:'var(--amber, #a66b2e)'};
const categories=['constant','loglogstar','loglogcube','polylog'];
function chart(w,h,o={},focus=false){
 const levels=['overview','compact','detail'],available=w<250||h<160?0:w<680||h<500?1:2,requested=levels.indexOf(o.level),level=focus?'detail':levels[Math.min(available,requested<0?available:requested)];
 const tiny=level==='overview',detail=level==='detail',rows=records(o),extras=related(o);
 const left=tiny?12:detail?w*.40:w*.30,right=w-(tiny?12:detail?27:22);
 const top=tiny?14:detail?106:62,bottom=h-(tiny?15:detail?118:62),x=k=>left+categories.indexOf(k)*(right-left)/3;
 let s='<svg class="'+(focus?'ccmp-map':'ccmp-summary')+'" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="xMidYMid meet" data-detail-level="'+level+'" role="img" aria-label="Correlation clustering MPC: symbolic round growth at fixed epsilon, delta and positive arboricity; general, arboric and forest algorithms. No general lower bound verified."><title>Correlation clustering · MPC rounds</title><desc>Green circles are algorithm upper bounds; setup colors identify general graphs, bounded positive arboricity and positive forests. The horizontal symbolic axis fixes epsilon, delta, and lambda at least two. Detailed rows retain exact parameter dependence. Related results have separate objective or memory assumptions. No general lower bound verified in the reviewed sources.</desc>';
 if(!rows.length)return s+(tiny?'':txt(w/2,h/2,'No results match this filter.','ccmp-muted','middle'))+'</svg>';
 if(detail){
  s+=txt(22,28,'MPC · total disagreements','ccmp-title')+txt(22,51,'Green: algorithms   ·   No general lower bound verified in the reviewed sources.','ccmp-muted');
  s+=txt(left,76,'ROUND GROWTH IN n · fixed ε, δ; fixed λ≥2 in arboric rows','ccmp-axis-label','start','data-axis="x"');
  s+=txt(22,93,'Setup / approximation','ccmp-axis-label','start','data-axis="y"');
 }else if(!tiny){
  s+=txt(12,18,'MPC · total disagreements','ccmp-title')+txt(12,37,'Fixed ε, δ; arboric λ≥2 fixed · round growth','ccmp-muted','start','data-axis="x"');
 }
 for(const k of categories)s+='<path d="M'+x(k)+' '+top+'V'+bottom+'" class="ccmp-grid"/>';
 s+='<path d="M'+left+' '+bottom+'H'+right+'" class="ccmp-axis"/>';
 if(detail){
  const gap=(bottom-top)/rows.length;
  rows.forEach((r,i)=>{
   const y=top+(i+.5)*gap,c=colors[r.setup],cx=x(r.roundClass),click=focus?' tabindex="0" role="button" aria-pressed="'+(r.id===o.selected)+'"':'';
   s+='<g class="ccmp-result" data-ccmp-result="'+esc(r.id)+'" data-kind="algorithm" data-setup="'+r.setup+'"'+click+' aria-label="Inspect '+esc(r.shortLabel+'; '+r.qualityLabel+'; '+r.rounds+' rounds')+'">';
   s+='<path d="M18 '+(y-12)+'V'+(y+10)+'" stroke="'+c+'" stroke-width="3"/>';
   s+=txt(27,y-3,r.shortLabel,'ccmp-name')+txt(27,y+11,r.qualityLabel,'ccmp-quality');
   s+='<path d="M'+left+' '+(y-6)+'H'+right+'" class="ccmp-rowline"/><circle data-marker="algorithm" data-center-x="'+cx+'" data-center-y="'+(y-6)+'" cx="'+cx+'" cy="'+(y-6)+'" r="4.5" fill="var(--green)"/>';
   s+=txt(left+3,y+11,r.displayBound+' rounds','ccmp-formula');s+='</g>';
  });
 }else{
  const groups=['general','arboricity','forest'],gy=i=>top+(i+.5)*(bottom-top)/3;
  groups.forEach((g,i)=>{
   const group=rows.filter(r=>r.setup===g),y=gy(i),c=colors[g];
   s+='<path d="M'+left+' '+y+'H'+right+'" stroke="'+c+'" stroke-width="'+(tiny?1.6:2.3)+'" opacity=".45"/>';
   if(!tiny)s+=txt(12,y+3,({general:'General',arboricity:'λ-arboric',forest:'Forests'})[g],'ccmp-name');
   for(const k of categories){const same=group.filter(r=>r.roundClass===k);same.forEach((r,j)=>{
    const yy=y+(j-(same.length-1)/2)*(tiny?4:6),cx=x(k);
    s+='<circle data-marker="algorithm" data-kind="algorithm" data-setup="'+g+'" data-ccmp-result="'+esc(r.id)+'" data-center-x="'+cx+'" data-center-y="'+yy+'" cx="'+cx+'" cy="'+yy+'" r="'+(tiny?2:3)+'" fill="var(--green)"/>';
   });}
  });
 }
 if(!tiny){
  const labels=detail?['constant','log log* n','(log log n)³','polylog n']:['constant','log log* n','(log log n)³','polylog'];
  categories.forEach((k,i)=>s+=txt(x(k),bottom+23,labels[i],'ccmp-tick',i===0?'start':i===3?'end':'middle'));
  if(detail){
   s+=txt(22,bottom+48,'General','ccmp-key-general')+txt(130,bottom+48,'λ-arboric · λ≥2','ccmp-key-arboricity')+txt(295,bottom+48,'Forests / trees','ccmp-key-forest');
   s+=txt(22,bottom+68,'Per-row local / total memory differ. Pruned Pivot: O(m+n·k^(k+1)) total, k=O(1/ε).','ccmp-fine');
   if(extras.length)s+=txt(22,bottom+89,'Related, separately scoped: Õ(n) messages · extra machines · all norms · restricted barriers','ccmp-fine');
  }else{
   s+=txt(12,h-18,'Green algorithms · bounds / memory on inspection','ccmp-muted');
  }
 }
 return s+'</svg>';
}
function diagramSVG(a={},b={}){return chart(1000,680,typeof a==='string'?b:a,true);}
function summarySVG(key,w,h,options={}){return chart(w,h,options,false);}
function release(root){for(const instance of [...instances])if(!instance.root.isConnected||instance.root===root)instance.destroy();}
function mount(root,key=ID,options={}){
 release(root);
 for(const name of ['StreamingMatching','DynamicMatching','LCAMatching','LocalMatching','MPCMatching','ListQueryMatching'])window[name]?.release(root);
 for(const [id,r]of Object.entries(window.AtlasPairRenderers||{}))if(id!==ID)r.release?.(root);
 const controller=new AbortController();let publication=options.publication||'all',selected=records({publication})[0]?.id;
 const opts=()=>({publication,selected});
 root.classList.add('focus-view','ccmp-view');root.classList.toggle('f-embedded',!!options.embedded);root.setAttribute('aria-label','Correlation clustering in MPC');
 root.innerHTML='<p class="f-kicker">CORRELATION CLUSTERING × MPC</p><header class="f-hero"><div><h1>'+esc(data.title)+'</h1><p>One round-growth figure for total disagreements, with the graph family, quality guarantee and memory scope kept visible.</p></div></header><div class="ccmp-toolbar"><div class="ccmp-legend"><span><i class="ccmp-key-alg"></i>Algorithm</span><span class="ccmp-key-general">General</span><span class="ccmp-key-arboricity">λ-arboric</span><span class="ccmp-key-forest">Forests / trees</span><span><i class="ccmp-key-lower"></i>Restricted related barrier</span></div><label>Sources <select class="ccmp-publication" aria-label="MPC publication filter"><option value="all">All verified sources</option><option value="published">Published only</option></select></label></div><div class="ccmp-scroll" tabindex="0" aria-label="MPC round comparison; horizontally scrollable"><div class="ccmp-plot"></div></div><div class="ccmp-notes"><p><b>Fixed parameters.</b> The horizontal axis compares growth in n at fixed ε, δ and λ≥2. Its spacing is symbolic. The full formula stays on each row; unknown exponents are never turned into numerical coordinates.</p><p><b>Memory matters.</b> General algorithms use O(n^δ) local space; Cambus et al. use Model 1 with Õ(n^δ). Their total-memory guarantees differ. Pruned Pivot uses O(m+n·k^(k+1)), k=O(1/ε).</p><p><b>Scope.</b> m counts positive edges. Forests include trees. No general lower bound verified in the reviewed sources. Red related cards concern a rounding certificate and a triangle subroutine only.</p></div><div class="ccmp-records" aria-label="Inspect MPC algorithms"></div><section class="ccmp-theorem" aria-live="polite" aria-label="Selected theorem and primary source"></section><section class="ccmp-related"><h2>Related results · different contracts or resources</h2><p class="ccmp-related-intro">Communication-only recovery, extra machines, simultaneous norms and restricted barriers have their own assumptions.</p><div class="ccmp-related-cards"></div></section><p class="ccmp-coverage">'+esc(data.coverage)+'</p>';
 function card(r){return '<button type="button" class="ccmp-record '+(r.kind==='lower'?'ccmp-lower':'ccmp-algorithm')+'" data-ccmp-result="'+esc(r.id)+'" aria-pressed="'+(r.id===selected)+'"><small>'+esc(r.shortLabel)+'</small><strong>'+esc(r.displayBound)+(r.resource==='MPC rounds'?' rounds':'')+'</strong><span>'+esc(r.qualityLabel)+'</span><small>'+esc(r.scope==='main'?'Local: '+r.localMemory:r.scopeWarning)+'</small></button>';}
 function inspect(){
  const r=[...records(opts()),...related(opts())].find(r=>r.id===selected),host=root.querySelector('.ccmp-theorem');
  if(!r){host.innerHTML='<p>No result matches this filter.</p>';return;}
  host.innerHTML='<div class="ccmp-detail-top"><strong class="'+(r.kind==='lower'?'ccmp-lower':'ccmp-algorithm')+'">'+(r.kind==='lower'?'Restricted related lower bound':'Algorithm upper bound')+'</strong><span>'+esc(r.shortLabel)+'</span></div>'+(r.scopeWarning?'<p class="ccmp-scope-warning">'+esc(r.scopeWarning)+'</p>':'')+'<div class="ccmp-detail-grid"><div><small>'+esc(r.resource)+'</small><strong>'+esc(r.resource==='MPC rounds'?r.rounds:r.displayBound)+'</strong></div><div><small>Approximation / statement</small><strong>'+esc(r.quality)+'</strong></div><div><small>Local memory</small><strong>'+esc(r.localMemory)+'</strong></div><div><small>Total memory</small><strong>'+esc(r.totalMemory)+'</strong></div></div>'+(r.communication?'<p><b>Communication.</b> '+esc(r.communication)+'</p>':'')+(r.work?'<p><b>Total work.</b> '+esc(r.work)+'</p>':'')+'<p><b>Output and graph.</b> '+esc(r.output)+' · '+esc(r.graph)+'</p><p><b>Probability.</b> '+esc(r.probability)+'</p>'+(r.condition?'<p class="ccmp-scope-warning"><b>Conditional on:</b> '+esc(r.condition)+'</p>':'')+'<p>'+esc(r.notes)+'</p><details><summary>Theorem, assumptions and primary source</summary><h3>'+esc(r.title)+'</h3><p>'+esc((r.authors||[]).join(', '))+'</p><p><b>'+esc(r.theorem)+'</b></p><ul>'+r.assumptions.map(a=>'<li>'+esc(a)+'</li>').join('')+'</ul><p><a href="'+esc(r.sourceUrl)+'" target="_blank" rel="noopener noreferrer">Primary full text ↗</a> · <a href="'+esc(r.publicationUrl||r.url)+'" target="_blank" rel="noopener noreferrer">Publication ↗</a></p></details>';
 }
 function render(){
  const main=records(opts()),extra=related(opts());if(![...main,...extra].some(r=>r.id===selected))selected=main[0]?.id;
  root.querySelector('.ccmp-publication').value=publication;root.querySelector('.ccmp-plot').innerHTML=diagramSVG(opts());root.querySelector('.ccmp-records').innerHTML=main.map(card).join('');root.querySelector('.ccmp-related-cards').innerHTML=extra.map(card).join('');root.querySelector('.ccmp-related').hidden=!extra.length;inspect();
 }
 function choose(target){const b=target.closest('[data-ccmp-result]');if(b){selected=b.dataset.ccmpResult;render();return true;}return false;}
 root.addEventListener('click',e=>choose(e.target),{signal:controller.signal});
 root.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.closest('.ccmp-result')){e.preventDefault();choose(e.target);}},{signal:controller.signal});
 root.addEventListener('change',e=>{if(e.target.classList.contains('ccmp-publication')){publication=e.target.value;render();options.onPublicationChange?.(publication);}},{signal:controller.signal});
 render();const instance={root,settingKey:ID,redraw:render,destroy(){controller.abort();root.classList.remove('ccmp-view');instances.delete(instance);}};instances.add(instance);return instance;
}
window.AtlasPairRenderers=window.AtlasPairRenderers||{};window.AtlasPairRenderers[ID]={mount,summarySVG,diagramSVG,records,release};
})();
