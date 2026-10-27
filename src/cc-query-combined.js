(function(){
'use strict';
const ID='cc-query_combined',el=document.getElementById('atlas-data');
if(!el)return;const data=JSON.parse(el.textContent).focus[ID];if(!data)return;
const instances=new Set(),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const txt=(x,y,s,c='',a='start',more='')=>'<text x="'+x+'" y="'+y+'" class="'+c+'" text-anchor="'+a+'" '+more+'>'+esc(s)+'</text>';
const merged=r=>({...data.sources[r.sourceId],...r}),eligible=(r,o)=>o.publication!=='published'||r.publicationStatus!=='preprint';
const records=(o={})=>data.verifiedRecords.map(merged).filter(r=>eligible(r,o));
const related=(o={})=>data.relatedResults.map(merged).filter(r=>eligible(r,o));
const all=(o={})=>[...records(o),...related(o)];
const modeFor=k=>String(k||'').includes('memory')?'memory':String(k||'').includes('oracle')?'oracle':'graph';
const inMode=(r,m)=>m==='memory'?r.panel==='memory':m==='oracle'?r.panel.startsWith('oracle'):['multiplicative','additive'].includes(r.panel);
const memoryExponent=(a,b)=>Math.min(b<0?1+2*a-b/2:1+2*a-2*b,1.5-b);
const line=(x1,y1,x2,y2,c='ccqc-grid')=>'<path d="M'+x1+' '+y1+'L'+x2+' '+y2+'" class="'+c+'"/>';
function marker(r,x,y,o,focused,tiny){
const c=r.kind==='algorithm'?'var(--green)':'var(--red)',radius=tiny?3.5:6;
let s='<g class="ccqc-point '+(r.conditional?'ccqc-conditional':'')+'" data-ccqc-result="'+esc(r.id)+'" data-kind="'+r.kind+'" data-panel="'+r.panel+'"'+(focused?' tabindex="0" role="button" aria-pressed="'+(o.selected===r.id)+'"':'')+' aria-label="'+esc(r.algorithmLabel+'; '+r.displayBound+'; '+r.quality)+'"><title>'+esc(r.algorithmLabel+' · '+r.displayBound+' · '+r.quality)+'</title>';
if(r.kind==='algorithm')s+='<circle data-marker="algorithm" data-center-x="'+x+'" data-center-y="'+y+'" cx="'+x+'" cy="'+y+'" r="'+radius+'" fill="'+c+'"/>';
else s+='<path data-marker="'+(r.conditional?'conditional-lower':r.evidenceStatus==='announced-proof-deferred'?'announced-lower':'lower')+'" data-center-x="'+x+'" data-center-y="'+y+'" d="M'+x+' '+(y-radius)+'L'+(x+radius)+' '+y+'L'+x+' '+(y+radius)+'L'+(x-radius)+' '+y+'Z" fill="'+(r.conditional||r.evidenceStatus==='announced-proof-deferred'?'var(--surface)':'var(--red)')+'" stroke="var(--red)" stroke-width="2"'+(r.conditional?' stroke-dasharray="3 2"':'')+'/>';
return s+'</g>';
}
function graphChart(w,h,o,focused,level){
const tiny=level==='overview',detail=level==='detail',compact=!tiny&&!detail;
const top=tiny?8:detail?146:54,bottom=h-(tiny?10:detail?90:52),gap=tiny?8:20,split=w*.65;
const x0=tiny?8:detail?86:34,x1=split-gap,x2=split+gap,x3=w-(tiny?8:24),y=bottom-(bottom-top)*.18,hi=top+(bottom-top)*.1;
const rows=records(o),px=c=>x0+(c-1.35)/.18*(x1-x0),m=rows.filter(r=>r.panel==='multiplicative'),add=rows.find(r=>r.panel==='additive');
let s='<g data-scope="ordinary-graph-access">';
if(!tiny){
s+=txt(18,detail?29:19,'Degree + positive neighbors + pair labels','ccqc-heading');
if(detail)s+=txt(18,52,'Complete signed graph · explicit partition · each query costs O(1)','ccqc-muted')+txt(18,80,'● Algorithms','ccqc-alg')+txt(142,80,'◇ Announced lower bound','ccqc-low');
s+=txt(x0,top-17,'Multiplicative approximation','ccqc-panel-title')+txt(x2,top-17,'Additive error','ccqc-panel-title');
}
s+=line(x0,hi,x1,hi)+line(x0,y,x1,y)+line(x0,top,x0,bottom,'ccqc-axis')+line(x0,bottom,x1,bottom,'ccqc-axis');
for(const c of[1.35,1.4,1.45,1.5,1.53]){s+=line(px(c),top,px(c),bottom);if(detail||compact&&w>=520)s+=txt(px(c),bottom+22,String(c),'ccqc-tick','middle');}
if(detail)s+=txt(x0-10,hi+4,'n²','ccqc-tick','end')+txt(x0-10,y+4,'Õ(n)','ccqc-tick','end')+txt(x0,top-40,'Total time · small fixed ε','ccqc-axis-title','start','data-axis="y"')+txt((x0+x1)/2,bottom+44,'Base c in ratio c+ε · lower is better','ccqc-axis-title','middle','data-axis="x"');
else if(compact)s+=txt((x0+x1)/2,bottom+35,'Base c in c+ε','ccqc-muted','middle')+txt(x0,y-47,'Õ(2^{poly(1/ε)} n) time','ccqc-bound');
for(const r of m){const x=px(r.approximationBase);s+=marker(r,x,y,o,focused,tiny);
if(!tiny){s+=txt(x,y-15,r.qualityLabel,'ccqc-bound','middle');if(detail)s+=txt(x,y+28,r.id.endsWith('1485')?'Cao et al. 2025':'García-Soriano–Schohn 2026','ccqc-name','middle')+txt(x,y+46,r.publicationStatus==='preprint'?'Preprint · fast composition':'Expected time & cost · v5','ccqc-fine','middle');}}
if(detail)s+=txt((x0+x1)/2,top+35,'Õ(2^{poly(1/ε)} n)','ccqc-bound','middle')+txt((x0+x1)/2,top+56,'Both algorithms · ε stays symbolic','ccqc-muted','middle');
const ax=(x2+x3)/2;
s+=line(x2,top,x2,bottom,'ccqc-axis')+line(x2,bottom,x3,bottom,'ccqc-axis')+line(x2,y,x3,y);
if(add){s+=marker(add,ax,y,o,focused,tiny);if(!tiny){s+=txt(ax,y-18,'Ω(n/ε)','ccqc-bound ccqc-low','middle')+txt(ax,bottom+22,'OPT+εn²','ccqc-tick','middle');if(detail)s+=txt(ax,top+38,'Graph queries','ccqc-axis-title','middle','data-axis="y"')+txt(ax,top+61,'Different accuracy contract','ccqc-fine','middle')+txt(ax,y+28,'Informal Theorem 3','ccqc-name','middle')+txt(ax,y+47,'Full proof deferred','ccqc-low ccqc-fine','middle')+txt(ax,bottom+44,'Allowed partition cost','ccqc-axis-title','middle','data-axis="x"');else s+=txt(ax,y+20,'Proof deferred','ccqc-fine ccqc-low','middle');}}
s+='</g>';
return s;
}
function oracleChart(w,h,o,focused,level){
const tiny=level==='overview',detail=level==='detail',top=tiny?10:detail?154:54,bottom=h-(tiny?10:detail?103:51),split=w*.64;
const x0=tiny?8:detail?86:38,x1=split-22,x2=split+22,x3=w-(tiny?8:25),range=bottom-top;
const linear=top+range*.27,sublinear=top+range*.76,positions={exact:x0+(x1-x0)*.1,near:x0+(x1-x0)*.51,two:x0+(x1-x0)*.91};
let s='<g data-scope="optimal-partition-oracle">';
if(!tiny){s+=txt(18,detail?29:19,'Oracle knows one unknown optimal partition','ccqc-heading');if(detail)s+=txt(18,53,'Count same-cluster oracle calls; signed labels are separately available','ccqc-muted')+txt(18,80,'● Algorithms','ccqc-alg')+txt(142,80,'◇ Dashed diamond · conditional lower bound','ccqc-low');
s+=txt(x0,top-19,'Unrestricted clusters · OPT budget','ccqc-panel-title')+txt(x2,top-19,'At most k clusters','ccqc-panel-title');}
s+=line(x0,top,x0,bottom,'ccqc-axis')+line(x0,bottom,x1,bottom,'ccqc-axis')+line(x0,linear,x1,linear)+line(x0,sublinear,x1,sublinear);
for(const x of Object.values(positions))s+=line(x,top,x,bottom);
if(detail)s+=txt(x0-10,linear+4,'O(OPT)','ccqc-tick','end')+txt(x0-10,sublinear+4,'o(OPT)','ccqc-tick','end')+txt(x0,top-44,'Query order · symbolic','ccqc-axis-title','start','data-axis="y"');
for(const r of records(o).filter(r=>r.panel==='oracle-opt')){
const x=positions[r.guaranteeCategory],y=r.kind==='lower'?sublinear:linear;s+=marker(r,x,y,o,focused,tiny);
if(!tiny){
s+=txt(x,y-15,r.displayBound,'ccqc-bound '+(r.kind==='lower'?'ccqc-low':''),'middle');
if(detail)s+=txt(x,y+28,r.id.endsWith('optimal')?'Deterministic':r.kind==='lower'?'Gap-ETH':'Expected quality','ccqc-fine','middle');else if(r.kind==='lower')s+=txt(x,y+18,'Gap-ETH','ccqc-fine ccqc-low','middle');
s+=txt(x,bottom+23,r.guaranteeCategory==='exact'?'Exact':r.guaranteeCategory==='near'?'1+γ/10':'Expected 2','ccqc-tick','middle');
}}
if(detail)s+=txt((x0+x1)/2,bottom+48,'Approximation target · categorical spacing','ccqc-axis-title','middle','data-axis="x"')+txt((x0+x1)/2,h-19,'No hidden lower-bound constant is placed at “1 OPT”.','ccqc-fine','middle');
const kx=(x2+x3)/2,kyHi=top+range*.2,kyLo=top+range*.69;
s+=line(x2,top,x2,bottom,'ccqc-axis')+line(x2,bottom,x3,bottom,'ccqc-axis')+line(x2,kyHi,x3,kyHi)+line(x2,kyLo,x3,kyLo)+line(kx,kyHi,kx,kyLo,'ccqc-gap');
if(detail)s+=txt(kx,(kyHi+kyLo)/2+4,'Open query gap','ccqc-muted','middle')+txt(x2,top-44,'Query complexity · symbolic','ccqc-axis-title','start','data-axis="y"');
for(const r of records(o).filter(r=>r.panel==='oracle-k')){
const y=r.kind==='algorithm'?kyHi:kyLo;s+=marker(r,kx,y,o,focused,tiny);
if(!tiny){
s+=txt(kx,y-16,r.kind==='algorithm'?(detail||w>=650?'O(k¹⁴ log k log n / ε⁶)':'O(k¹⁴ L/ε⁶)'):'Ω(k / polylog k)','ccqc-bound '+(r.kind==='lower'?'ccqc-low':''),'middle');
if(detail)s+=txt(kx,y+27,r.kind==='algorithm'?'Algorithm · w.h.p.':'Conditional · ETH','ccqc-fine','middle');else if(r.kind==='lower')s+=txt(kx,y+18,'ETH','ccqc-fine ccqc-low','middle');
}}
if(!tiny)s+=txt(kx,bottom+23,'0<ε≤δ','ccqc-tick','middle');
if(!tiny&&!detail&&w<650)s+=txt(kx,bottom+40,'L=log k log n','ccqc-fine','middle');
if(detail)s+=txt(kx,bottom+48,'Factor 1+ε · some constant δ>0','ccqc-axis-title','middle','data-axis="x"')+txt(kx,h-19,'k and OPT remain separate parameters.','ccqc-fine','middle');
return s+'</g>';
}
function memoryChart(w,h,o,focused,level){
const tiny=level==='overview',detail=level==='detail',left=tiny?8:detail?77:45,right=w-(tiny?8:26),top=tiny?8:detail?120:52,bottom=h-(tiny?10:detail?95:48),b=Number.isFinite(+o.memoryB)?Math.max(-.45,Math.min(.45,+o.memoryB)):0;
const px=a=>left+(a/.5)*(right-left),py=p=>bottom-p/2*(bottom-top),r=related(o)[0];
let s='<g data-scope="random-pair-memory" data-memory-b="'+b+'">';
if(!tiny){s+=txt(18,detail?29:19,'Random-pair queries · memory–accuracy tradeoff','ccqc-heading');if(detail)s+=txt(18,53,'Value estimate within ±εn² · success ≥99% · worst-case query count','ccqc-muted')+txt(18,80,'◆ Lower bound · no corresponding algorithm in this source set','ccqc-low');}
for(const p of[0,.5,1,1.5,2]){s+=line(left,py(p),right,py(p));if(!tiny)s+=txt(left-9,py(p)+4,p===0?'1':p===1?'n':p===2?'n²':'n^'+p,'ccqc-tick','end');}
for(const a of[0,.125,.25,.375,.5]){s+=line(px(a),top,px(a),bottom);if(!tiny&&(detail||a===0||a===.25||a===.5))s+=txt(px(a),bottom+23,String(a),'ccqc-tick','middle');}
s+=line(left,top,left,bottom,'ccqc-axis')+line(left,bottom,right,bottom,'ccqc-axis');
let d='';for(let i=0;i<=100;i++){const a=i/200;d+=(i?'L':'M')+px(a)+' '+py(memoryExponent(a,b));}
if(r){s+='<g data-ccqc-result="'+r.id+'" class="ccqc-point"'+(focused?' tabindex="0" role="button"':'')+' aria-label="Inspect formal random-query memory lower bound"><path data-curve="derived-memory-lower" d="'+d+'" fill="none" stroke="var(--red)" stroke-width="'+(tiny?2:3)+'"/>';
for(const a of[0,.5])s+='<circle data-open-endpoint="'+a+'" cx="'+px(a)+'" cy="'+py(memoryExponent(a,b))+'" r="'+(tiny?2.5:4)+'" fill="var(--surface)" stroke="var(--red)" stroke-width="2"/>';
s+='</g>';}
if(!tiny)s+=txt((left+right)/2,bottom+44,'Accuracy a in ε=n^(−a) · 0<a<1/2','ccqc-axis-title','middle','data-axis="x"');
if(detail)s+=txt(left,top-18,'Query lower bound Ω(n^p) · derived exponent','ccqc-axis-title','start','data-axis="y"')+txt((left+right)/2,top+30,'Memory = n^'+(Math.round((.5+b)*100)/100)+' bits (b='+b+')','ccqc-bound','middle')+txt((left+right)/2,h-18,'p=min{'+(b<0?'1+2a−b/2':'1+2a−2b')+', 3/2−b}; constants hidden by Ω are not plotted.','ccqc-fine','middle');
return s+'</g>';
}
function chart(key,w,h,o={},focused=false){
const levels=['overview','compact','detail'],available=w<420||h<220?0:w<700||h<430?1:2,requested=levels.indexOf(o.level),level=focused?'detail':levels[Math.min(available,requested<0?available:requested)],mode=modeFor(key);
return '<svg class="ccqc-map" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="xMidYMid meet" data-detail-level="'+level+'" data-view="'+mode+'" role="img" aria-label="'+esc(mode==='graph'?'Combined graph queries: multiplicative algorithms and a separate additive lower bound':mode==='oracle'?'Same-cluster oracle: unrestricted and fixed-k algorithm/lower-bound comparisons':'Random-pair memory-query lower bound')+'"><title>'+esc(data.title)+'</title><desc>Green circles are algorithm upper bounds. Red diamonds are lower bounds; dashed hollow diamonds require ETH or Gap-ETH. Different output and access models use separate panels. Symbolic axes do not assign unstated numeric exponents or constants.</desc>'+(mode==='graph'?graphChart(w,h,o,focused,level):mode==='oracle'?oracleChart(w,h,o,focused,level):memoryChart(w,h,o,focused,level))+'</svg>';
}
function diagramSVG(key=ID,o={}){if(typeof key==='object'){o=key;key=ID;}return chart(key,1000,620,o,true);}
function summarySVG(key,w,h,o={}){return chart(key,w,h,o,false);}
function release(root){for(const i of[...instances])if(!i.root.isConnected||i.root===root)i.destroy();}
function mount(root,key=ID,options={}){
release(root);
for(const name of['StreamingMatching','DynamicMatching','LCAMatching','LocalMatching','MPCMatching','ListQueryMatching'])window[name]?.release(root);
for(const[id,r]of Object.entries(window.AtlasPairRenderers||{}))if(id!==ID)r.release?.(root);
const controller=new AbortController();let currentKey=key,publication=options.publication||'all',memoryB=0,selected;
const opts=()=>({publication,memoryB,selected}),current=()=>all(opts()).filter(r=>inMode(r,modeFor(currentKey)));
root.classList.add('focus-view','ccqc-view');root.classList.toggle('f-embedded',!!options.embedded);root.setAttribute('aria-label',data.title);
root.innerHTML='<p class="f-kicker">CORRELATION CLUSTERING × COMBINED QUERIES</p><header class="f-hero"><div><h1>Graph access and optimum-cluster oracles</h1><p>'+esc(data.description)+'</p></div></header><nav class="ccqc-tabs" aria-label="Access model"><button type="button" data-ccqc-view="graph">Graph access</button><button type="button" data-ccqc-view="oracle">Optimal-cluster oracle</button></nav><div class="ccqc-toolbar"><div class="ccqc-legend"><span class="ccqc-alg">● Algorithm</span><span class="ccqc-low">◆ Lower bound</span><span class="ccqc-low">◇ Conditional / announced · inspect</span><span class="ccqc-setup-graph">Graph access</span><span class="ccqc-setup-oracle">Optimum oracle</span></div><label>Sources <select class="ccqc-publication" aria-label="Publication filter"><option value="all">All verified sources</option><option value="published">Published only</option></select></label></div><div class="ccqc-memory-controls" hidden><label>Memory exponent b <input class="ccqc-memory-b" type="range" min="-0.45" max="0.45" step="0.05" value="0" aria-label="Memory parameter b"></label><output class="ccqc-memory-label"></output><p>ε=n^(−a), γ=n^b. These substitutions satisfy the formal asymptotic ranges for 0&lt;a&lt;1/2 and −1/2&lt;b&lt;1/2.</p></div><div class="ccqc-scroll" tabindex="0" aria-label="Shared atlas figure; horizontally scrollable on narrow screens"><div class="ccqc-plot"></div></div><div class="ccqc-scope-notes"></div><div class="ccqc-records" aria-label="Choose a theorem"></div><section class="ccqc-theorem" aria-live="polite" aria-label="Theorem and source inspector"></section><p class="ccqc-coverage">'+esc(data.coverage)+'</p>';
function inspect(){
const r=all(opts()).find(x=>x.id===selected),host=root.querySelector('.ccqc-theorem');
if(!r){host.innerHTML='<p>No sources match this filter.</p>';return;}
host.innerHTML='<div class="ccqc-detail-head"><strong class="'+(r.kind==='algorithm'?'ccqc-alg':'ccqc-low')+'">'+(r.kind==='algorithm'?'Algorithm upper bound':r.conditional?'Conditional lower bound':r.evidenceStatus==='announced-proof-deferred'?'Announced lower bound · proof deferred':'Lower bound')+'</strong><span>'+esc(r.shortLabel)+'</span></div><div class="ccqc-detail-grid"><div><small>'+esc(r.resource)+'</small><strong>'+esc(r.displayBound)+'</strong></div><div><small>Guarantee</small><strong>'+esc(r.quality)+'</strong></div><div><small>Time</small><strong>'+esc(r.timeComplexity)+'</strong></div></div><p><b>Output.</b> '+esc(r.output)+'</p><p><b>Access.</b> '+esc(r.oracle)+'</p><p><b>Probability.</b> '+esc(r.probability)+'</p><p>'+esc(r.notes)+'</p><details open><summary>Theorem, assumptions and primary source</summary><p><b>'+esc(r.theorem)+'</b></p><ul>'+r.assumptions.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ul><p><a href="'+esc(r.sourceUrl)+'" target="_blank" rel="noopener noreferrer">'+esc(r.title)+' ↗</a></p><p class="ccqc-fine">'+esc(r.authors.join(', '))+' · '+esc(r.venue)+'</p></details>';
}
function render(){
const mode=modeFor(currentKey),rows=current();if(!rows.some(r=>r.id===selected))selected=rows[0]?.id;
root.querySelector('.ccqc-publication').value=publication;
root.querySelector('.ccqc-plot').innerHTML=diagramSVG(currentKey,opts());
root.querySelector('.ccqc-memory-controls').hidden=mode!=='memory';
root.querySelector('.ccqc-memory-label').innerHTML='b='+memoryB+' · memory n^'+(Math.round((.5+memoryB)*100)/100)+' bits';
root.querySelector('.ccqc-scope-notes').innerHTML=mode==='graph'?'<p><b>Separate contracts.</b> The left panel measures time for multiplicative approximation. The right gives a graph-query lower bound for additive error. They do not form a shared tight frontier.</p><p><b>Source status.</b> The 2025 ratio is corrected to 1.485+ε. The 1.3865+ε composition is a 2026 preprint. The additive lower statement is informal and its proof is deferred.</p>':mode==='oracle'?'<p><b>Query order, not hidden constants.</b> Exact recovery uses at most 2OPT calls; expected factor 2 uses at most OPT calls in expectation. The red Gap-ETH marker excludes o(OPT) at one unspecified near-optimal target. It does not lower-bound the expected factor-2 point.</p><p><b>Fixed-k panel.</b> Compare the algorithm for 0&lt;ε≤min{δ,1/2} with the ETH lower bound for some δ&gt;0. The spacing is symbolic; k is not equated with OPT.</p>':'<p><b>Different access and output.</b> This is a value-only lower bound for independent random-pair queries with ≤γ√n memory bits. The curve does not apply to adaptive pair queries or partition output.</p><p><b>Derived axis.</b> Substitute ε=n^(−a), γ=n^b into the formal minimum of two bounds. The open endpoints a=0 and a=1/2 are excluded. The plotted Ω exponent does not specify the hidden constant.</p>';
root.querySelector('.ccqc-records').innerHTML=rows.map(r=>'<button type="button" class="ccqc-record '+(r.kind==='algorithm'?'ccqc-alg':'ccqc-low')+'" data-ccqc-result="'+r.id+'" aria-pressed="'+(selected===r.id)+'"><small>'+esc(r.algorithmLabel)+'</small><strong>'+esc(r.displayBound)+'</strong><span>'+esc(r.qualityLabel)+'</span><small>'+esc(r.conditional?'Conditional: '+(r.panel==='oracle-k'?'ETH':'Gap-ETH'):r.evidenceStatus==='announced-proof-deferred'?'Announced; full proof deferred':r.publicationStatus==='preprint'?'Preprint':'Published source')+'</small></button>').join('');
if(root.querySelectorAll)for(const b of root.querySelectorAll('.ccqc-tabs button'))b.setAttribute('aria-pressed',b.dataset.ccqcView===mode);
inspect();
}
function choose(target){
const v=target.closest('[data-ccqc-view]');if(v){const mode=v.dataset.ccqcView;currentKey=mode==='graph'?ID:ID+'-'+mode;selected=undefined;render();return true;}
const p=target.closest('[data-ccqc-result]');if(p){selected=p.dataset.ccqcResult;render();return true;}return false;
}
root.addEventListener('click',e=>choose(e.target),{signal:controller.signal});
root.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.closest('.ccqc-point,.ccqc-related-link')){e.preventDefault();choose(e.target);}},{signal:controller.signal});
root.addEventListener('change',e=>{if(e.target.classList.contains('ccqc-publication')){publication=e.target.value;render();options.onPublicationChange?.(publication);}},{signal:controller.signal});
root.addEventListener('input',e=>{if(e.target.classList.contains('ccqc-memory-b')){memoryB=Math.max(-.45,Math.min(.45,+e.target.value));render();}},{signal:controller.signal});
render();const instance={root,settingKey:key,redraw:render,destroy(){controller.abort();root.classList.remove('ccqc-view');instances.delete(instance);}};instances.add(instance);return instance;
}
window.AtlasPairRenderers=window.AtlasPairRenderers||{};
window.AtlasPairRenderers[ID]={mount,summarySVG,diagramSVG,records,release,memoryExponent};
})();