(()=>{
'use strict';
const data=JSON.parse(document.getElementById('atlas-data').textContent).focus['edge-local'];
const instances=new Set();let serial=0;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const allRows=[...data.verifiedRecords,...data.relatedResults];
const records=(options={})=>allRows.map(r=>({...data.sources[r.sourceId],...r})).filter(r=>options.publication!=='published'||r.publicationStatus!=='preprint');
const mainIds={greedy:'edge-local-bbko22',det:'local-two-delta-minus-two-upper-2025',rand:'edge-local-jakob25-random',lower:'local-two-delta-minus-two-lower-2020'};
const num=n=>String(Math.round(n*100)/100);
function text(x,y,s,cls='',anchor='start',extra=''){return '<text x="'+num(x)+'" y="'+num(y)+'" class="'+cls+'" text-anchor="'+anchor+'" '+extra+'>'+esc(s)+'</text>'}
function svgLevel(w,h,options){if(options.focus)return 'focus';const levels=['overview','compact','detail'];let available=w<290||h<210?0:w<650||h<430?1:2;const requested=levels.indexOf(options.level);return levels[Math.min(available,requested<0?available:requested)]}
function viewFor(key,options={}){return options.view||((key||'').includes('multigraph')?'multigraph':key&&key!=='edge-local'?'variable':'bounded')}
function startSVG(w,h,level,view){return '<svg xmlns="http://www.w3.org/2000/svg" class="edge-local-map" data-detail-level="'+level+'" data-view="'+view+'" data-axes="symbolic" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="xMidYMid meet" role="'+(level==='focus'?'group':'img')+'" aria-label="'+(view==='bounded'?'Edge coloring in LOCAL at fixed degree at least 3: compare 2 Delta minus 1 and 2 Delta minus 2 colors in deterministic and randomized models.':view==='multigraph'?'Loopless multigraph edge coloring, fixed degree at least 3, floor 3 Delta over 2 colors.':'Variable-degree edge coloring formulas, grouped by exact palette family and algorithm model.')+'"><title>Edge coloring · '+(view==='bounded'?'fixed degree Δ ≥ 3':view==='multigraph'?'loopless multigraphs':'variable-degree formulas')+'</title><desc>Green circles are algorithm upper bounds; red diamonds are lower bounds. Purple identifies deterministic LOCAL and blue randomized LOCAL. Symbolic axis spacing does not encode constants or numeric runtimes.</desc>'}
function marker(r,x,y,mode,kind,options,context=''){
 const focus=options.focus,rad=options.tiny?3:options.rich?6:4,selected=options.selected===r.id;
 let s='<g class="edge-local-point" data-edge-local-result="'+esc(r.id)+'" data-edge-local-mode="'+mode+'" data-edge-local-context="'+context+'" data-kind="'+kind+'" data-center-x="'+num(x)+'" data-center-y="'+num(y)+'"'+(focus?' role="button" tabindex="0" aria-pressed="'+selected+'" aria-label="'+esc((kind==='lower'?'Lower bound: ':'Algorithm: ')+r.shortLabel+'; '+mode+'; '+r.quality+'; '+r.displayBound)+'"':'')+'>';
 if(selected&&focus)s+='<circle class="edge-local-selection" cx="'+num(x)+'" cy="'+num(y)+'" r="'+(rad+5)+'"/>';
 s+='<circle class="edge-local-hit" cx="'+num(x)+'" cy="'+num(y)+'" r="'+(focus?15:rad)+'"/>';
 if(kind==='lower')s+='<path class="edge-local-lower" d="M'+num(x)+' '+num(y-rad)+'L'+num(x+rad)+' '+num(y)+'L'+num(x)+' '+num(y+rad)+'L'+num(x-rad)+' '+num(y)+'Z"/>';
 else s+='<circle class="edge-local-upper" cx="'+num(x)+'" cy="'+num(y)+'" r="'+rad+'"/>';
 return s+'</g>';
}
function legend(w,h,rich){const y=rich?67:39,x=rich?32:14;return '<circle class="edge-local-upper" cx="'+x+'" cy="'+(y-4)+'" r="4"/>'+text(x+10,y,rich?'Algorithm upper bound':'Algorithm','edge-local-legend-text')+'<path class="edge-local-lower" d="M'+(rich?232:119)+' '+(y-8)+'l4 4 -4 4 -4 -4Z"/>'+text(rich?243:129,y,'Lower bound','edge-local-legend-text')}
function mainSVG(w,h,options={}){
 const level=svgLevel(w,h,options),tiny=level==='overview',rich=level==='detail'||level==='focus',focus=level==='focus';
 const left=tiny?8:rich?88:48,right=w-(tiny?8:rich?26:10),top=tiny?14:rich?144:84,bottom=h-(tiny?10:rich?105:52),gap=tiny?8:rich?34:18;
 const panelWidth=(right-left-gap)/2,ys=[bottom,(top+bottom)/2,top],rows=records(options),find=id=>rows.find(r=>r.id===id),r=rich?6:4,markOptions={...options,focus,tiny,rich};
 let s=startSVG(w,h,level,'bounded');
 if(!tiny){s+=text(rich?27:13,rich?29:19,rich?'One fewer color changes the round complexity':'Fixed Δ ≥ 3 · simple graphs','edge-local-heading');s+=legend(w,h,rich);if(rich)s+=text(right,67,'Δ is fixed independently of n','edge-local-muted','end');}
 for(let k=0;k<2;k++){
  const mode=k?'randomized':'deterministic',pl=left+k*(panelWidth+gap),pr=pl+panelWidth,x1=pl+panelWidth*.23,x2=pl+panelWidth*.77;
  s+='<g data-panel="'+mode+'" class="edge-local-'+mode+'">';
  s+='<path class="edge-local-setup-line" d="M'+num(pl)+' '+num(tiny?top-6:top-29)+'H'+num(pr)+'"/>';
  if(!tiny)s+=text((pl+pr)/2,top-13,k?'Randomized':'Deterministic','edge-local-panel-title','middle');
  s+='<path class="edge-local-axis" d="M'+num(pl)+' '+num(top)+'V'+num(bottom)+'H'+num(pr)+'"/>';
  ys.forEach((y,i)=>{s+='<path class="edge-local-grid" d="M'+num(pl)+' '+num(y)+'H'+num(pr)+'"/>';if(!tiny&&k===0)s+=text(pl-8,y+4,['log* n','log log n','log n'][i],'edge-local-tick','end')});
  for(const x of[x1,x2])s+='<path class="edge-local-grid edge-local-vgrid" d="M'+num(x)+' '+num(top)+'V'+num(bottom)+'"/>';
  const fast=find(mainIds.greedy),upper=find(k?mainIds.rand:mainIds.det),lower=find(mainIds.lower),slowY=k?ys[1]:ys[2],offset=tiny?4:rich?10:6;
  if(fast){s+=marker(fast,x1,ys[0],mode,'algorithm',markOptions,k?'deterministic-reuse':'fixed-degree');if(rich)s+=text(x1,ys[0]-20,'O(log* n)','edge-local-bound','middle')}
  if(upper&&lower){s+='<path class="edge-local-equality" d="M'+num(x2-offset)+' '+num(slowY)+'H'+num(x2+offset)+'"/>';}
  if(upper)s+=marker(upper,x2-offset,slowY,mode,'algorithm',markOptions,'fixed-degree');
  if(lower)s+=marker(lower,x2+offset,slowY,mode,'lower',markOptions,'fixed-degree');
  if(rich&&(upper||lower))s+=text(x2,slowY+(k?-23:27),upper&&lower?(k?'Θ(log log n)':'Θ(log n)'):upper?(k?'O(log log n)':'O(log n)'):(k?'Ω(log log n)':'Ω(log n)'),'edge-local-bound','middle');
  if(!tiny){s+=text(x1,bottom+21,'2Δ−1','edge-local-palette','middle');s+=text(x2,bottom+21,'2Δ−2','edge-local-palette','middle');if(rich)s+=text(x2,bottom+40,'one fewer color','edge-local-muted','middle');}
  s+='</g>';
 }
 if(!tiny){
  s+=text((left+right)/2,h-(rich?38:15),'Exact palette q','edge-local-axis-title','middle','data-axis="x"');
  if(rich){s+=text(left,top-54,'Rounds · symbolic asymptotic order','edge-local-axis-title','start','data-axis="y"');s+=text(27,h-12,'2Δ−2: matching upper/lower orders. 2Δ−1: no lower bound claimed from this source set.','edge-local-note');}
  else{s+=text(4,top-13,'Rounds','edge-local-axis-title','start','data-axis="y"');}
 }
 return s+'</svg>';
}
function multiSVG(w,h,options={}){
 const level=svgLevel(w,h,options),tiny=level==='overview',rich=level==='detail'||level==='focus',focus=level==='focus';
 const left=tiny?8:rich?112:62,right=w-(tiny?8:rich?35:16),top=tiny?12:rich?153:90,bottom=h-(tiny?10:rich?116:48),rows=records(options),find=id=>rows.find(r=>r.id===id),ys=[bottom,bottom-(bottom-top)/3,bottom-2*(bottom-top)/3,top],xs=[left+(right-left)*.27,left+(right-left)*.76],markOptions={...options,focus,tiny,rich};
 let s=startSVG(w,h,level,'multigraph');
 if(!tiny){s+=text(rich?27:13,rich?29:19,rich?'A separate palette for loopless multigraphs':'Multigraphs · fixed Δ ≥ 3','edge-local-heading');s+=legend(w,h,rich);s+=text(rich?27:13,rich?97:59,'q = ⌊3Δ/2⌋','edge-local-palette');}
 s+='<g data-panel="multigraph"><path class="edge-local-axis" d="M'+left+' '+top+'V'+bottom+'H'+right+'"/>';
 ys.forEach((y,i)=>{s+='<path class="edge-local-grid" d="M'+left+' '+num(y)+'H'+right+'"/>';if(!tiny)s+=text(left-9,y+4,['log log n','log n','log²n','Õ(log⁵n)'][i],'edge-local-tick','end')});
 for(let k=0;k<2;k++){const mode=k?'randomized':'deterministic',x=xs[k],u=find(k?'edge-local-dhawan24-random':'edge-local-dhawan24-deterministic'),l=find(mainIds.lower),uy=k?ys[2]:ys[3],ly=k?ys[0]:ys[1];
 s+='<g class="edge-local-'+mode+'"><path class="edge-local-setup-line" d="M'+num(x-35)+' '+num(top-17)+'H'+num(x+35)+'"/>';
 if(u&&l)s+='<path class="edge-local-gap" d="M'+num(x)+' '+num(uy+10)+'V'+num(ly-10)+'"/>';
 if(u)s+=marker(u,x,uy,mode,'algorithm',markOptions,'multigraph');
 if(l)s+=marker(l,x,ly,mode,'lower',markOptions,'multigraph-transfer');
 if(rich){if(u)s+=text(x+16,uy+4,k?'O(log²n)':'Õ(log⁵n)','edge-local-bound');if(l)s+=text(x+16,ly+4,k?'Ω(log log n)':'Ω(log n)','edge-local-low-label');}
 if(!tiny)s+=text(x,bottom+23,k?'Randomized':'Deterministic','edge-local-panel-title','middle');
 s+='</g>';}
 if(!tiny){s+=text((left+right)/2,h-(rich?52:8),'LOCAL model','edge-local-axis-title','middle','data-axis="x"');if(rich){s+=text(left,top-37,'Rounds · symbolic order','edge-local-axis-title','start','data-axis="y"');s+=text(27,h-26,'Red bounds transfer from simple trees because ⌊3Δ/2⌋ ≤ 2Δ−2 for Δ ≥ 3.','edge-local-note');s+=text(27,h-8,'Dashed spans show unresolved gaps within the reviewed sources.','edge-local-note');}}
 return s+'</g></svg>';
}
const families=['greedy','greedy-minus','vizing','near','shannon'],familyLabels=['2Δ−1','2Δ−2','Δ+1','Near Δ','3Δ/2 family'];
function variableSVG(w,h,options={}){
 const level=svgLevel(w,h,options),tiny=level==='overview',rich=level==='detail'||level==='focus',focus=level==='focus',left=tiny?8:rich?114:50,right=w-(tiny?8:rich?30:12),top=tiny?8:rich?130:72,bottom=h-(tiny?8:rich?132:64),ys=[top+(bottom-top)*.23,top+(bottom-top)*.77],cw=(right-left)/5,rows=records(options).filter(r=>r.panel!=='multigraph'),markOptions={...options,focus,tiny,rich};
 let s=startSVG(w,h,level,'variable');
 if(!tiny){s+=text(rich?27:13,rich?30:19,rich?'Degree dependence stays in the formula':'Variable-degree formulas','edge-local-heading');s+=legend(w,h,rich);if(rich)s+=text(27,96,'Categories only: positions do not rank incomparable runtimes.','edge-local-muted');}
 s+='<g data-panel="variable"><path class="edge-local-axis" d="M'+left+' '+top+'V'+bottom+'H'+right+'"/>';
 for(let k=0;k<2;k++){s+='<path class="edge-local-grid" d="M'+left+' '+num(ys[k])+'H'+right+'"/>';if(!tiny)s+=text(left-10,ys[k]+4,rich?(k?'Randomized':'Deterministic'):(k?'Rand.':'Det.'),'edge-local-tick','end');}
 for(let i=0;i<5;i++){const x=left+cw*(i+.5);s+='<path class="edge-local-grid edge-local-vgrid" d="M'+num(x)+' '+top+'V'+bottom+'"/>';if(!tiny)s+=text(x,bottom+23,rich?familyLabels[i]:['2Δ−1','2Δ−2','Δ+1','Near Δ','3Δ/2'][i],'edge-local-tick','middle');
 for(let k=0;k<2;k++){const mode=k?'randomized':'deterministic',group=rows.filter(r=>r.family===families[i]&&(r.mode===mode||r.mode==='both'));
 group.forEach((r,j)=>{const dx=(j-(group.length-1)/2)*Math.min(rich?23:12,cw/(group.length+1)),dy=group.length>1?(j%2?12:-12):0;
 s+=marker(r,x+dx,ys[k]+dy,mode,r.kind,markOptions,'variable');if(rich)s+=text(x+dx,ys[k]+dy+24,data.sources[r.sourceId].year,'edge-local-year','middle');
 });}}
 if(!tiny){s+=text(rich?left:10,top-15,rich?'LOCAL model · categories':'LOCAL model','edge-local-axis-title','start','data-axis="y"');s+=text((left+right)/2,h-(rich?73:25),'Palette family · categories','edge-local-axis-title','middle','data-axis="x"');if(rich){s+=text(27,h-43,'Select a theorem for the full Δ, n and ε formula. Unknown polynomial powers remain symbolic.','edge-local-note');s+=text(27,h-20,'Near-Δ degree restrictions are retained. Categories can coincide at specific degrees.','edge-local-note');}}
 return s+'</g></svg>';
}
function summarySVG(key,w,h,options={}){w=Math.max(40,Number(w)||738);h=Math.max(40,Number(h)||548);const v=viewFor(key,options);return(v==='multigraph'?multiSVG:v==='variable'?variableSVG:mainSVG)(w,h,{...options,focus:false})}
function diagramSVG(key='edge-local',options={}){if(typeof key==='object'){options=key;key=options.key||'edge-local'}const v=viewFor(key,options);return(v==='multigraph'?multiSVG:v==='variable'?variableSVG:mainSVG)(1000,570,{...options,focus:true})}
function mount(root,key='edge-local',options={}){
 for(const i of instances)if(!i.root.isConnected||i.root===root)i.destroy();
 let view=viewFor(key,options),publication=options.publication||'all',selected=options.selected||data.defaultSelected,selectedMode='deterministic',context='fixed-degree';
 const controller=new AbortController(),prefix='edge-local-'+(++serial);
 root.classList.add('focus-view','edge-local-view');root.classList.toggle('f-embedded',!!options.embedded);root.setAttribute('aria-label','Edge coloring in the LOCAL model');
 root.innerHTML='<p class="f-kicker">EDGE COLORING × LOCAL</p><header class="f-hero"><div><h1 class="edge-local-title"></h1><p class="edge-local-subtitle"></p></div></header><div class="f-scope edge-local-scope"></div><div class="edge-local-toolbar"><div class="edge-local-tabs" role="group" aria-label="Edge coloring setup"><button type="button" data-edge-local-view="bounded">Bounded degree</button><button type="button" data-edge-local-view="variable">Variable-degree formulas</button><button type="button" data-edge-local-view="multigraph">Multigraphs</button></div><label>Sources <select class="edge-local-publication" aria-label="Edge coloring source publication filter"><option value="all">All verified sources</option><option value="published">Published only</option></select></label></div><div class="edge-local-setup-key"><span class="edge-local-key-det">Deterministic LOCAL</span><span class="edge-local-key-rand">Randomized LOCAL</span><span>Green ● algorithm · red ◆ lower bound</span></div><div class="edge-local-scroll" tabindex="0" aria-label="Edge coloring landscape; scroll horizontally on narrow screens"><div class="edge-local-plot"></div></div><p class="edge-local-view-note"></p><section class="edge-local-theorem" aria-label="Selected theorem and primary source" aria-live="polite"></section><details class="edge-local-source-list"><summary>Inspect every supplied result and exact formula</summary><div class="edge-local-records"></div></details><p class="edge-local-coverage">'+esc(data.coverageNote)+' Reviewed '+esc(data.reviewedOn)+'.</p>';
 const opts=()=>({publication,view,selected});
 function scoped(){const rs=records(opts());return view==='bounded'?rs.filter(r=>r.panel==='bounded'):view==='multigraph'?rs.filter(r=>r.panel==='multigraph'||r.id===mainIds.lower).sort((a,b)=>Number(a.kind==='lower')-Number(b.kind==='lower')):rs.filter(r=>r.panel!=='multigraph')}
 function inspect(){
  const rs=records(opts());let r=rs.find(x=>x.id===selected);if(!r){r=scoped()[0];selected=r?.id}
  const el=root.querySelector('.edge-local-theorem');if(!r){el.innerHTML='<p>No theorem is available under this publication filter.</p>';return}
  let projection='',bound=r.displayBound;
  if(view==='bounded'&&r.panel==='bounded'){
   bound=r.id===mainIds.lower?(selectedMode==='randomized'?'Ω(log log n)':'Ω(log n)'):r.boundedBound;
   projection='At fixed Δ ≥ 3, '+bound+' rounds.';
   if(r.id===mainIds.greedy&&selectedMode==='randomized')projection+=' This deterministic algorithm is also valid in randomized LOCAL, with correctness probability 1.';
  }
  if(context==='multigraph-transfer'&&r.id===mainIds.lower)projection=data.multigraphLowerDerivation;
  el.innerHTML='<div class="edge-local-detail-head"><span class="'+(r.kind==='lower'?'edge-local-red':'edge-local-green')+'">'+(r.kind==='lower'?'Lower bound':'Algorithm upper bound')+'</span><strong>'+esc(r.shortLabel)+'</strong><span>'+esc(r.venue)+'</span></div><div class="edge-local-detail-grid"><div><small>Palette</small><strong>'+esc(r.quality)+'</strong></div><div><small>Rounds · original theorem</small><strong>'+esc(r.displayBound)+'</strong></div><div><small>Model</small><strong>'+esc(r.mode==='both'?'Deterministic and randomized LOCAL':r.mode+' LOCAL')+'</strong></div></div>'+(projection?'<p class="edge-local-projection"><b>In this view.</b> '+esc(projection)+'</p>':'')+'<p><b>Scope.</b> '+esc(r.graph)+'. '+esc(r.probability)+'</p><p>'+esc(r.notes)+'</p><details open><summary>Exact theorem, assumptions and source</summary><h3>'+esc(r.title)+'</h3><p>'+esc(r.authors.join(', '))+'</p><p><b>'+esc(r.theorem)+'</b> · '+(r.evidenceStatus==='abstract_verified'?'Abstract statement checked':'Primary theorem/proof checked')+'</p><ul>'+r.assumptions.map(a=>'<li>'+esc(a)+'</li>').join('')+'</ul><p>'+esc(r.output)+'</p><p><a href="'+esc(r.verificationUrl)+'" target="_blank" rel="noopener noreferrer">Inspect primary theorem ↗</a> · <a href="'+esc(r.url)+'" target="_blank" rel="noopener noreferrer">Paper record ↗</a></p></details>';
 }
 function list(){root.querySelector('.edge-local-records').innerHTML=records(opts()).map(r=>'<button type="button" class="edge-local-record '+(r.kind==='lower'?'edge-local-red':'edge-local-green')+'" data-edge-local-result="'+esc(r.id)+'" data-edge-local-mode="'+esc(r.mode==='both'?'deterministic':r.mode)+'" data-edge-local-context="source-list" aria-pressed="'+(r.id===selected)+'"><small>'+esc(r.shortLabel)+' · '+esc(r.mode)+'</small><strong>'+esc(r.quality)+'</strong><span>'+esc(r.displayBound)+'</span><small>'+esc(r.graph)+'</small></button>').join('')}
 function render(){
  const scope={bounded:{title:'What does one fewer color cost?',subtitle:'Fix the maximum degree Δ ≥ 3. Compare exact palettes in communication rounds.',input:'simple graphs',degree:'fixed Δ ≥ 3, independently of n',palette:'2Δ−1 versus 2Δ−2'},variable:{title:'How does degree change the bound?',subtitle:'Compare the stated Δ, n and ε formulas; degree restrictions stay attached to each theorem.',input:'simple graphs',degree:'variable; restrictions per theorem',palette:'stated per theorem'},multigraph:{title:'Edge coloring with parallel edges',subtitle:'Fix Δ ≥ 3 and compare bounds for q = ⌊3Δ/2⌋ on loopless multigraphs.',input:'loopless multigraphs',degree:'fixed Δ ≥ 3, independently of n',palette:'⌊3Δ/2⌋'}}[view];
  root.querySelector('.edge-local-title').textContent=scope.title;
  root.querySelector('.edge-local-subtitle').textContent=scope.subtitle;
  root.querySelector('.edge-local-scope').innerHTML=[['Input',scope.input],['Degree',scope.degree],['Palette',scope.palette],['Output','proper edge coloring'],['Model','synchronous LOCAL']].map(([label,value])=>'<span><b>'+esc(label)+'</b> '+esc(value)+'</span>').join('');
  root.setAttribute('aria-label','Edge coloring in LOCAL: '+scope.input+'; '+scope.degree);
  root.querySelector('.edge-local-publication').value=publication;
  root.querySelectorAll?.('[data-edge-local-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.edgeLocalView===view)));
  root.querySelector('.edge-local-plot').innerHTML=diagramSVG(key,opts());
  root.querySelector('.edge-local-view-note').innerHTML=view==='bounded'?'<b>Read the plot.</b> Vertical tiers show asymptotic order for fixed Δ ≥ 3, with no numeric spacing. Touching green/red markers establish Θ(log n) or Θ(log log n). The source set supplies no lower-bound marker at 2Δ−1. The deterministic O(log* n) algorithm also works in the randomized model.':view==='multigraph'?'<b>Separate graph class.</b> Loopless multigraphs, fixed Δ ≥ 3, palette ⌊3Δ/2⌋. Green bounds are Dhawan’s theorems. Red bounds are a deduction from the simple-tree lower bound; inspect a red marker for the reduction. Gaps are not claimed tight.':'<b>Read the categories.</b> Position groups palette families and algorithm models; it does not rank runtimes. Select points or use the complete formula list. Near-Δ results keep their degree restrictions, and polynomial factors remain symbolic.';
  inspect();list();
 }
 function select(node){selected=node.dataset.edgeLocalResult;selectedMode=node.dataset.edgeLocalMode||'deterministic';context=node.dataset.edgeLocalContext||'';const r=allRows.find(x=>x.id===selected);if(context==='source-list'&&r)view=r.panel==='multigraph'?'multigraph':r.panel==='bounded'?'bounded':'variable';render()}
 root.addEventListener('click',e=>{const tab=e.target.closest('[data-edge-local-view]');if(tab){view=tab.dataset.edgeLocalView;const r=scoped()[0];selected=r?.id;selectedMode=r?.mode==='randomized'?'randomized':'deterministic';context=view==='multigraph'?'multigraph':'';render();return}const point=e.target.closest('[data-edge-local-result]');if(point)select(point)},{signal:controller.signal});
 root.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const node=e.target.closest('.edge-local-point');if(node){e.preventDefault();select(node)}},{signal:controller.signal});
 root.addEventListener('change',e=>{if(e.target.classList.contains('edge-local-publication')){publication=e.target.value;if(!records(opts()).some(r=>r.id===selected))selected=scoped()[0]?.id;render();options.onPublicationChange?.(publication)}},{signal:controller.signal});
 if(!scoped().some(r=>r.id===selected))selected=scoped()[0]?.id;
 render();const instance={root,settingKey:key,redraw:render,destroy(){controller.abort();root.classList.remove('edge-local-view');instances.delete(instance)}};instances.add(instance);return instance;
}
window.AtlasPairRenderers=window.AtlasPairRenderers||{};
window.AtlasPairRenderers['edge-local']={mount,summarySVG,diagramSVG,records,release(root){for(const i of instances)if(!i.root.isConnected||i.root===root)i.destroy()}};
})();