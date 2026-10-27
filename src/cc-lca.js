(function ccLcaRenderer(){
'use strict';
const ID='cc-lca',element=document.getElementById('atlas-data');if(!element)return;
const data=JSON.parse(element.textContent).focus[ID];if(!data)return;
const instances=new Set();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tx=(x,y,s,cls='',anchor='start',extra='')=>'<text x="'+x+'" y="'+y+'" class="'+cls+'" text-anchor="'+anchor+'" '+extra+'>'+esc(s)+'</text>';
const records=(o={})=>[...data.verifiedRecords,...data.relatedResults].map(r=>({...data.sources[r.sourceId],...r})).filter(r=>o.publication!=='published'||r.publicationStatus!=='preprint');
function geometry(w,h,o={}){
 w=Number(w);h=Number(h);if(!Number.isFinite(w)||!Number.isFinite(h)||w<=0||h<=0)throw new Error('Positive figure dimensions required');
 const levels=['overview','compact','detail'],available=w<260||h<220?0:w<700||h<500?1:2,requested=levels.indexOf(o.level);
 const level=o.focus?'detail':levels[Math.min(available,requested<0?available:requested)],tiny=level==='overview',detail=level==='detail';
 const left=tiny?w*.09:w*.30,right=w-(tiny?w*.08:detail?42:22),top=tiny?h*.08:detail?112:38,bottom=tiny?h*.69:detail?h-210:h-88;
 const px=cost=>left+({'inverse':0,'inverse-square':.5,'n-inverse':1}[cost])*(right-left);
 const py=row=>top+([.13,.43,.62,.84][row])*(bottom-top),ry=tiny?h*.83:detail?h-124:h-47,rh=tiny?h*.1:detail?102:32;
 const rows=records(o),points=[];
 if(rows.some(r=>r.plotRole==='degree-band'))points.push({id:'cc-lca-pruned-3plus',kind:'upper',x:px('inverse'),x2:px('n-inverse'),y:py(0),role:'band',row:0});
 if(rows.some(r=>r.plotRole==='matrix-two-policies'))points.push({id:'cc-lca-bonchi-four',mode:'prepared',kind:'upper',x:px('inverse'),y:py(1),row:1},{id:'cc-lca-bonchi-four',mode:'no-preprocessing',kind:'upper',x:px('inverse-square'),y:py(3),row:3});
 if(rows.some(r=>r.plotRole==='constant-lower'))points.push({id:'cc-lca-bonchi-constant-lb',kind:'lower',x:px('inverse'),y:py(2),row:2});
 const insetIds=['cc-lca-bonchi-one-additive','cc-lca-bonchi-lb'],pad=tiny?w*.09:18,gap=tiny?w*.07:14,cw=(w-2*pad-gap)/2;
 const insets=insetIds.flatMap((id,i)=>rows.some(r=>r.id===id)?[{id,x:pad+i*(cw+gap),y:ry,w:cw,h:rh,kind:i?'lower':'upper'}]:[]);
 return{w,h,level,tiny,detail,left,right,top,bottom,px,py,rows,points,insets};
}
function chart(w,h,o={},focused=false){
 const g=geometry(w,h,{...o,focus:focused}),{left,right,top,bottom,px,py,tiny,detail,level,rows}=g;
 const by=id=>rows.find(r=>r.id===id),matrix=rows.some(r=>r.panel==='matrix'),list=rows.some(r=>r.panel==='positive-list');
 const interactive=(id,mode)=>focused?' tabindex="0" role="button" aria-pressed="'+(o.selected===id&&(id!=='cc-lca-bonchi-four'||o.mode===mode))+'"':'';
 let s='<svg class="'+(focused?'cclca-map':'cclca-summary')+'" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="xMidYMid meet" data-detail-level="'+level+'" role="'+(focused?'group':'img')+'" aria-label="Correlation clustering local labels: positive-list and matrix access on a symbolic per-label probe axis"><title>Correlation clustering · LCA</title><desc>Green circles and a degree-dependent band are algorithm upper bounds. Red diamonds are historical non-adaptive matrix lower bounds. Blue identifies positive-list access; purple identifies matrix access. Preprocessing is separate. The axis orders one over epsilon, one over epsilon squared, and n over epsilon when one over n is less than epsilon and epsilon is less than one. Polynomial exponents and general c dependence are unpositioned insets.</desc>';
 if(!rows.length)return s+(tiny?'':tx(w/2,h/2,'No results match the source filter.','cclca-muted','middle'))+'</svg>';
 if(detail){
  s+=tx(24,30,'Consistent labels · local query cost','cclca-heading')+tx(24,54,'One implicit partition; common randomness across vertex requests','cclca-muted');
  s+=tx(24,78,'● Algorithm','cclca-alg-key')+tx(148,78,'◇ Lower bound · scoped','cclca-lower-key');
  s+=tx(left,top-17,'Per-label probes · symbolic growth order','cclca-axis-title','start','data-axis="x"')+tx(24,top-17,'Access / policy','cclca-axis-title','start','data-axis="y"');
 }else if(!tiny){s+=tx(12,18,'Local labels · per-query probes','cclca-heading','start','data-axis="x"')+tx(12,33,'Access / policy','cclca-muted','start','data-axis="y"');}
 if(list)s+='<rect x="'+(tiny?3:12)+'" y="'+(py(0)-(tiny?5:detail?31:17))+'" width="'+(w-(tiny?6:24))+'" height="'+(tiny?10:detail?69:34)+'" rx="4" class="cclca-setup cclca-positive"/>';
 if(matrix)s+='<rect x="'+(tiny?3:12)+'" y="'+(py(1)-(tiny?6:detail?32:14))+'" width="'+(w-(tiny?6:24))+'" height="'+(py(3)-py(1)+(tiny?12:detail?66:28))+'" rx="4" class="cclca-setup cclca-matrix"/>';
 for(const k of ['inverse','inverse-square','n-inverse'])s+='<path d="M'+px(k)+' '+top+'V'+bottom+'" class="cclca-grid"/>';
 for(let row=0;row<4;row++)s+='<path d="M'+left+' '+py(row)+'H'+right+'" class="cclca-grid"/>';
 s+='<path d="M'+left+' '+top+'V'+bottom+'H'+right+'" class="cclca-axis"/>';
 if(!tiny){
  for(const [key,label]of[['inverse','1/ε'],['inverse-square','1/ε²'],['n-inverse','n/ε']])s+=tx(px(key),bottom+(detail?24:19),label,'cclca-tick','middle');
  if(detail)s+=tx((left+right)/2,bottom+46,'1/n < ε < 1 · schematic spacing · lower-bound domains are narrower','cclca-fine','middle');
 }
 for(const p of g.points){
  const r=by(p.id),radius=tiny?2.8:detail?6:4,mark=' data-center-x="'+p.x+'" data-center-y="'+p.y+'"';
  s+='<g class="cclca-result '+(p.kind==='lower'?'cclca-lower':'cclca-algorithm')+'" data-cclca-result="'+p.id+'"'+(p.mode?' data-cclca-mode="'+p.mode+'"':'')+' data-kind="'+p.kind+'"'+interactive(p.id,p.mode)+' aria-label="Inspect '+esc(r.shortLabel+'; '+r.displayBound+(p.mode?'; '+p.mode:''))+'">';
  if(p.role==='band'){
   s+='<rect x="'+p.x+'" y="'+(p.y-radius)+'" width="'+(p.x2-p.x)+'" height="'+(2*radius)+'" rx="2" class="cclca-band-fill"/><path d="M'+p.x+' '+p.y+'H'+p.x2+'M'+p.x+' '+(p.y-radius-2)+'V'+(p.y+radius+2)+'M'+p.x2+' '+(p.y-radius-2)+'V'+(p.y+radius+2)+'" class="cclca-band"/><circle cx="'+p.x+'" cy="'+p.y+'" r="'+radius+'" fill="var(--green)"'+mark+' data-marker="algorithm"/>';
  }else if(p.kind==='lower'){
   s+='<path d="M'+p.x+' '+(p.y-radius-1)+'L'+(p.x+radius+1)+' '+p.y+'L'+p.x+' '+(p.y+radius+1)+'L'+(p.x-radius-1)+' '+p.y+'Z" fill="none" stroke="var(--red)" stroke-width="1.8"'+mark+' data-marker="lower"/>';
  }else{s+='<circle cx="'+p.x+'" cy="'+p.y+'" r="'+radius+'" fill="var(--green)"'+mark+' data-marker="algorithm"/>';}
  if(detail){
   const lx=24;
   if(p.row===0)s+=tx(lx,p.y-3,'Positive lists','cclca-setup-label cclca-positive-label')+tx(lx,p.y+17,'Expected (3+ε) · no additive term','cclca-fine')+tx((p.x+p.x2)/2,p.y-16,'O(Δ/ε)','cclca-bound','middle')+tx((p.x+p.x2)/2,p.y+27,'Degree-dependent family · 1 ≤ Δ < n','cclca-muted','middle');
   if(p.row===1)s+=tx(lx,p.y-3,'Matrix · prepared','cclca-setup-label cclca-matrix-label')+tx(lx,p.y+17,'4OPT + εn² · success ≥2/3','cclca-fine')+tx(p.x+17,p.y+5,'O(1/ε)','cclca-bound')+tx(p.x+17,p.y+25,'After preprocessing','cclca-preprocessing');
   if(p.row===2)s+=tx(lx,p.y-3,'Matrix · lower bound','cclca-setup-label cclca-matrix-label')+tx(lx,p.y+17,'Constant c · sufficiently large n','cclca-fine')+tx(p.x+17,p.y+5,'Ω(1/ε) · non-adaptive','cclca-lower-bound');
   if(p.row===3)s+=tx(lx,p.y-3,'Matrix · no prep','cclca-setup-label cclca-matrix-label')+tx(lx,p.y+17,'4OPT + εn² · success ≥2/3','cclca-fine')+tx(p.x,p.y-15,'O(1/ε²)','cclca-bound','middle')+tx(p.x,p.y+24,'Recompute with the same seed','cclca-preprocessing','middle');
  }else if(!tiny){
   const name=['Positive lists','Matrix · prep','Matrix · lower','Matrix · no prep'][p.row];
   s+=tx(12,p.y+3,name,'cclca-name '+(p.row?'cclca-matrix-label':'cclca-positive-label'));
   if(p.row===0)s+=tx((p.x+p.x2)/2,p.y-10,'O(Δ/ε)','cclca-bound','middle');
   else if(p.row===1)s+=tx(p.x+10,p.y+3,'O(1/ε)','cclca-bound');
   else if(p.row===2)s+=tx(p.x+10,p.y+3,'Ω(1/ε) · non-adaptive','cclca-lower-bound');
   else s+=tx(p.x+10,p.y+3,'O(1/ε²)','cclca-bound');
  }
  s+='</g>';
 }
 if(detail&&g.insets.length)s+=tx(24,g.insets[0].y-15,'MATRIX ACCESS · SYMBOLIC STATEMENTS','cclca-inset-heading');
 for(const b of g.insets){
  const r=by(b.id),lower=b.kind==='lower',cx=b.x+13,cy=b.y+(tiny?b.h/2:detail?24:16),rad=tiny?2:detail?4.5:3;
  s+='<g class="cclca-result cclca-inset '+(lower?'cclca-lower':'cclca-algorithm')+'" data-cclca-result="'+b.id+'" data-kind="'+b.kind+'" data-position="unranked"'+interactive(b.id)+' aria-label="Inspect '+esc(r.shortLabel+'; '+r.displayBound)+'"><rect x="'+b.x+'" y="'+b.y+'" width="'+b.w+'" height="'+b.h+'" rx="4" class="cclca-inset-box"/>';
  if(lower)s+='<path d="M'+cx+' '+(cy-rad)+'L'+(cx+rad)+' '+cy+'L'+cx+' '+(cy+rad)+'L'+(cx-rad)+' '+cy+'Z" fill="none" stroke="var(--red)" stroke-width="1.6" data-marker="unranked-lower"/>';
  else s+='<circle cx="'+cx+'" cy="'+cy+'" r="'+rad+'" fill="var(--green)" data-marker="unranked-algorithm"/>';
  if(detail){
   if(lower)s+=tx(b.x+27,b.y+28,'Ω(1/(εc²)) · general c ≥ 1','cclca-inset-bound cclca-lower-bound')+tx(b.x+16,b.y+52,'Non-adaptive · 1/n < ε < 1/(100c)','cclca-fine')+tx(b.x+16,b.y+73,'ε-only preprocessing; n sufficiently large','cclca-fine')+tx(b.x+16,b.y+92,'Same lower-bound family as the constant-c marker','cclca-fine');
   else s+=tx(b.x+27,b.y+28,'poly(1/ε) · OPT + εn²','cclca-inset-bound cclca-bound')+tx(b.x+16,b.y+52,'After preprocessing · see theorem details','cclca-preprocessing')+tx(b.x+16,b.y+73,'Success ≥2/3 · polynomial exponent unspecified','cclca-fine')+tx(b.x+16,b.y+92,'Unranked on the cost axis','cclca-fine');
  }else if(!tiny){s+=tx(b.x+24,b.y+20,lower?'Ω(1/(εc²))':'poly(1/ε) · +εn²',lower?'cclca-lower-bound':'cclca-bound');}
  s+='</g>';
 }
 if(!matrix&&!tiny)s+=tx((left+right)/2,py(2),'Matrix results are preprint sources.','cclca-muted','middle');
 return s+'</svg>';
}
function diagramSVG(a={},b={}){return chart(1000,680,typeof a==='string'?b:a,true);}
function summarySVG(key,w,h,options={}){return chart(w,h,options,false);}
function release(root){for(const i of [...instances])if(!i.root.isConnected||i.root===root)i.destroy();}
function mount(root,key=ID,options={}){
 release(root);
 for(const name of ['StreamingMatching','DynamicMatching','LCAMatching','LocalMatching','MPCMatching','ListQueryMatching'])window[name]?.release(root);
 for(const [id,r]of Object.entries(window.AtlasPairRenderers||{}))if(id!==ID)r.release?.(root);
 const controller=new AbortController();let publication=options.publication||'all',selected=records({publication})[0]?.id,mode='prepared';
 const opts=()=>({publication,selected,mode});
 root.classList.add('focus-view','cclca-view');root.classList.toggle('f-embedded',!!options.embedded);root.setAttribute('aria-label','Correlation clustering local computation');
 root.innerHTML='<p class="f-kicker">CORRELATION CLUSTERING × LOCAL COMPUTATION</p><header class="f-hero"><div><h1>'+esc(data.title)+'</h1><p>Compare consistent label queries, with the access model and quality guarantee visible together.</p></div></header><div class="cclca-toolbar"><div class="cclca-legend"><span><i class="cclca-key-alg"></i>Algorithm</span><span><i class="cclca-key-lower"></i>Non-adaptive lower bound</span><span><i class="cclca-key-positive"></i>Positive lists</span><span><i class="cclca-key-matrix"></i>Matrix access</span></div><label>Sources <select class="cclca-publication" aria-label="LCA source publication filter"><option value="all">All verified sources</option><option value="published">Published only</option></select></label></div><div class="cclca-scroll" tabindex="0" aria-label="Shared per-label probe figure; horizontally scrollable on narrow screens"><div class="cclca-plot"></div></div><div class="cclca-notes"><p><b>One label, one partition.</b> Queries reuse common randomness and preprocessing. A fresh seed for each vertex would change the output contract.</p><p><b>Separate resource costs.</b> Matrix query upper bounds follow from the stated unit-cost local times. Preprocessing is paid once; Pruned Pivot’s local seed space is a different resource.</p><p><b>Scoped lower bound.</b> The red bounds apply to non-adaptive matrix queries. They do not constrain positive-neighbor access or establish an adaptive LCA frontier.</p></div><div class="cclca-records" aria-label="Inspect all LCA theorem records"></div><section class="cclca-theorem" aria-live="polite" aria-label="Selected theorem and source"></section><p class="cclca-coverage">'+esc(data.coverage)+'</p>';
 function inspect(){
  const r=records(opts()).find(r=>r.id===selected),host=root.querySelector('.cclca-theorem');if(!r){host.innerHTML='<p>No results match the source filter.</p>';return;}
  const lower=r.kind==='lower',chosen=r.id==='cc-lca-bonchi-four'?r.modes.find(m=>m.id===mode):null;
  host.innerHTML='<div class="cclca-detail-top"><strong class="'+(lower?'cclca-lower':'cclca-algorithm')+'">'+(lower?'Lower bound · corrected scope':'Algorithm upper bound')+'</strong><span>'+esc(r.shortLabel)+'</span></div>'+(chosen?'<p class="cclca-mode"><b>Selected policy:</b> '+esc(chosen.id==='prepared'?'Prepare once: '+chosen.preprocessing+' queries/time; '+chosen.displayBound+' per label':'No shared graph preprocessing: '+chosen.displayBound+' per label')+'</p>':'')+'<div class="cclca-detail-grid"><div><small>Per-label probes</small><strong>'+esc(r.probeComplexity)+'</strong></div><div><small>Global quality guarantee</small><strong>'+esc(r.quality)+'</strong></div><div><small>One-time preprocessing</small><strong>'+esc(r.preprocessing)+'</strong></div></div>'+(r.scopeWarning?'<p class="cclca-scope-warning">'+esc(r.scopeWarning)+'</p>':'')+'<p><b>Statement.</b> '+esc(r.exactBound)+'</p><p><b>Access and output.</b> '+esc(r.oracle)+'. '+esc(r.output)+'.</p><p><b>Probability.</b> '+esc(r.probability)+'</p><p><b>Parameters.</b> '+esc(r.parameterDomain)+'</p><p><b>Randomness and storage.</b> '+esc(r.seedSpace)+'</p><p>'+esc(r.notes)+'</p><details><summary>Theorem, assumptions and primary source</summary><h3>'+esc(r.title)+'</h3><p>'+esc((r.authors||[]).join(', '))+'</p><p><b>'+esc(r.theorem)+'</b></p><ul>'+r.assumptions.map(a=>'<li>'+esc(a)+'</li>').join('')+'</ul><p><a href="'+esc(r.sourceUrl)+'" target="_blank" rel="noopener noreferrer">Read primary statement ↗</a>'+(r.correctionSource?' · <a href="'+esc(r.correctionSource)+'" target="_blank" rel="noopener noreferrer">Read 2020 scope correction ↗</a>':'')+'</p></details>';
 }
 function render(){
  const all=records(opts());if(!all.some(r=>r.id===selected)){selected=all[0]?.id;mode='prepared';}
  root.querySelector('.cclca-publication').value=publication;
  root.querySelector('.cclca-plot').innerHTML=diagramSVG(opts());
  root.querySelector('.cclca-records').innerHTML=all.map(r=>'<button type="button" class="cclca-record '+(r.kind==='lower'?'cclca-lower':'cclca-algorithm')+'" data-cclca-result="'+esc(r.id)+'" aria-pressed="'+(selected===r.id)+'"><small>'+esc(r.shortLabel)+'</small><strong>'+esc(r.displayBound)+'</strong><span>'+esc(r.qualityLabel)+'</span><small>'+esc(r.panel==='positive-list'?'Positive-list access':'Matrix access')+'</small></button>').join('');
  inspect();
 }
 function choose(target){const b=target.closest('[data-cclca-result]');if(b){selected=b.dataset.cclcaResult;mode=b.dataset.cclcaMode||'prepared';render();return true;}return false;}
 root.addEventListener('click',e=>choose(e.target),{signal:controller.signal});
 root.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.closest('.cclca-result')){e.preventDefault();choose(e.target);}},{signal:controller.signal});
 root.addEventListener('change',e=>{if(e.target.classList.contains('cclca-publication')){publication=e.target.value;render();options.onPublicationChange?.(publication);}},{signal:controller.signal});
 render();const instance={root,settingKey:ID,redraw:render,destroy(){controller.abort();root.classList.remove('cclca-view');instances.delete(instance);}};instances.add(instance);return instance;
}
window.AtlasPairRenderers=window.AtlasPairRenderers||{};window.AtlasPairRenderers[ID]={mount,summarySVG,diagramSVG,records,release,geometry};
})();