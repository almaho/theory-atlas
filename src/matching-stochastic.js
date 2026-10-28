(()=>{
'use strict';
const ID='matching-stochastic',data=JSON.parse(document.getElementById('atlas-data').textContent).focus[ID];if(!data)return;
const instances=new Set(),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const math=s=>esc(s).replace(/\^\{([^{}]*)\}/g,'<tspan baseline-shift="super" font-size=".7em">$1</tspan>');
const text=(x,y,s,c='',a='start')=>`<text x="${x}" y="${y}" class="mst-${c}" text-anchor="${a}">${math(s)}</text>`;
const line=(x,y,X,Y,c='axis')=>`<path d="M${x} ${y}L${X} ${Y}" class="mst-${c}"/>`;
const weight=(key=ID,o={})=>o.weighting||(key.startsWith('weighted-')?'weighted':'unweighted');
const panels=o=>data.panels.filter(p=>p.weighting===weight(o.key||ID,o));
const records=(o={})=>data.verifiedRecords.map(r=>({...data.sources[r.sourceId],...r})).filter(r=>r.weighting===weight(o.key||ID,o)&&(o.publication!=='published'||r.publicationStatus!=='preprint'));

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),eps=o=>clamp(Number(o.epsilon)||.05,.01,.25),prob=o=>clamp(Number(o.p)||.1,.001,.9);
const adaptive=r=>r.panel.endsWith('-adaptive')||r.panel.endsWith('-oracle');
const short=r=>r.sourceId.startsWith('azarmehr')?'ABGR ’25':r.shortLabel.replace('Derakhshan–Saneian','DS').replace('Assadi–Bernstein','AB').replace('Behnezhad–Reyhani','BR').replace('Behnezhad–Derakhshan','BD').replace('Dughmi–Kalayci–Patel','DKP').replace(' · necessary degree','').replace(' · rank-one witness','');
function quality(r,e){
 if(r.kind==='lower'||r.panel.endsWith('-oracle'))return null;
 if(r.id==='stochastic-blum15-half')return(1-e)/2;
 if(r.id==='stochastic-akl16-half'||r.id==='stochastic-br18-half')return .5-e;
 if(r.id==='stochastic-bfhr19-unweighted')return 4*Math.SQRT2-5-e;
 if(r.id==='stochastic-ab19-two-thirds')return 1/(1.5+e);
 if(r.id.includes('near')||adaptive(r))return 1-e;
 return r.beta;
}
function costFamily(r){
 if(r.panel.endsWith('-oracle'))return 'oracle';
 if(r.panel.endsWith('-expected'))return 'expected';
 if(r.sourceId==='bdhpss15')return 'explicit';
 if(r.sourceId==='br18')return 'eps-power';
 if(r.sourceId==='akl16')return 'eps-log';
 if(r.sourceId==='akl17'||r.sourceId==='bbd22')return 'log';
 if(r.sourceId==='bfhr19')return r.weighting==='weighted'?'log':'eps-log-fixed';
 if(r.sourceId==='ab19')return 'eps-square';
 if(r.sourceId==='ds25')return 'linear';
 if(r.sourceId==='bdh20')return 'quasi';
 if(r.sourceId==='bd20')return 'unspecified';
 return 'poly';
}
const familyLabels={
 linear:'O(1/p)',log:'O(log(1/p) / p)','eps-log-fixed':'Oε(log(1/p) / p)',
 'eps-log':'O(log(1/(εp)) / (εp))','eps-square':'O(log(1/(εp)) / (ε²p))',
 explicit:'⌈log(2/ε) / p^{2/ε}⌉','eps-power':'O(1/(ε p^{4/ε}))',
 poly:'(1/p)^{Oε(1)}',quasi:'quasi-poly(1/p), fixed ε',
 unspecified:'Oε,p(1), unspecified',oracle:'Δ^{poly(1/ε)}',expected:'E|Q| / r = O(1/p)'
};
const familyOrder=['quasi','unspecified','poly','explicit','eps-power','eps-square','eps-log','eps-log-fixed','log','linear','oracle','expected'];
function geometry(w,h,o={},focus=false){
 const W=Math.max(40,+w||40),H=Math.max(40,+h||40),levels=['overview','compact','detail'],available=W<300||H<230?0:W<600||H<380?1:2,requested=levels.indexOf(o.level),level=focus?'focus':levels[Math.min(available,requested<0?available:requested)];
 const tiny=level==='overview',compact=level==='compact',rr=records(o),e=eps(o),left=tiny?W*.12:compact?W*.24:W*.27,right=W-(tiny?W*.05:W*.04),gap=tiny?H*.025:focus?20:10,head=tiny?H*.015:focus?64:compact?25:35,foot=tiny?H*.01:focus?35:compact?18:25;
 const groups=[
  {id:'general',title:'General graphs · adaptive and non-adaptive',note:'Query budgets share formula bands; vertical spacing is categorical.',rows:rr.filter(r=>!/-bipartite$|-oracle$|-expected$/.test(r.panel))},
  {id:'bipartite',title:'Bipartite graphs',note:'Stronger guarantees on this restricted graph class.',rows:rr.filter(r=>r.panel.endsWith('-bipartite'))},
  {id:weight(o.key||ID,o)==='weighted'?'expected':'oracle',title:weight(o.key||ID,o)==='weighted'?'Expected total queries · separate resource':'In-n-out LCA · separate supplied-information oracle',note:weight(o.key||ID,o)==='weighted'?'r is the base graph’s maximum matching cardinality.':'Out-query and in-query guarantees have different probability contracts.',rows:rr.filter(r=>/-oracle$|-expected$/.test(r.panel))}
 ].filter(g=>g.rows.length);
 for(const b of groups){b.families=familyOrder.filter(f=>b.rows.some(r=>r.kind!=='lower'&&costFamily(r)===f));b.lower=b.rows.filter(r=>r.kind==='lower');b.units=b.families.length+b.lower.length*.75;}
 const total=groups.reduce((n,b)=>n+b.units,0),unit=Math.max(.01,(H-groups.length*(head+foot)-gap*(groups.length-1))/Math.max(1,total));
 let top=0;
 const blocks=groups.map(b=>{
  const height=head+foot+b.units*unit,plotTop=top+head,axisY=plotTop+b.families.length*unit;
  const points=b.rows.map(r=>{
   const annotation=r.kind==='lower',family=costFamily(r),same=b.rows.filter(q=>q.kind!=='lower'&&costFamily(q)===family),i=same.findIndex(q=>q.id===r.id),offset=(i-(same.length-1)/2)*Math.min(unit*.19,focus?12:5);
   const beta=quality(r,e),y=annotation?axisY+(b.lower.findIndex(q=>q.id===r.id)+.5)*unit*.75:plotTop+(b.families.indexOf(family)+.5)*unit+offset;
   const x=annotation?left+Math.min(4,W*.02):b.id==='oracle'?left+(right-left)*(r.id.endsWith('-out')?.28:.76):left+(right-left)*(beta??.5);
   return{id:r.id,row:r,x,y,beta,family,annotation};
  });
  const block={...b,panel:{id:b.id,title:b.title},top,height,plotTop,axisY,points};top+=height+gap;return block;
 });
 return{w:W,h:H,level,focus,tiny,compact,left,right,unit,blocks,points:blocks.flatMap(b=>b.points),epsilon:e,p:prob(o)};
}
function marker(p,g,o,interactive){
 const r=p.row,x=p.x,y=p.y,size=g.tiny?clamp(g.unit*.22,.7,3):g.compact?2.8:g.focus?5:3.5,lower=r.kind==='lower',ad=adaptive(r),unknown=r.id==='stochastic-akl17-half-plus';
 let s=`<g class="mst-point" data-mst-result="${esc(r.id)}" data-kind="${r.kind}" data-adaptivity="${ad?'adaptive':'nonadaptive'}" data-source-url="${esc(r.sourceUrl)}"${interactive?' role="button" tabindex="0"':''} aria-label="${esc(short(r)+'; '+r.quality+'; '+r.bound)}"><title>${esc(short(r)+' · '+r.quality+' · '+r.bound+' · '+r.sourceUrl)}</title>`;
 if(interactive)s+=`<circle class="mst-hit" cx="${x}" cy="${y}" r="16"/>`;
 if(interactive&&r.id===o.selected)s+=`<circle class="mst-halo" cx="${x}" cy="${y}" r="12"/>`;
 s+=lower?`<path data-marker="lower" class="mst-dot mst-lower" d="M${x} ${y-size}l${size} ${size}l-${size} ${size}l-${size} -${size}Z"/>`:ad?`<path data-marker="adaptive" class="mst-dot mst-upper" d="M${x} ${y-size-1}L${x+size+1} ${y+size}H${x-size-1}Z"/>`:`<circle data-marker="nonadaptive" class="mst-dot mst-upper${unknown?' mst-symbolic':''}" cx="${x}" cy="${y}" r="${size}"/>`;
 if(unknown)s+=`<path class="mst-symbolic-arrow" d="M${x+size+2} ${y}h8m-3 -2l3 2l-3 2"/>`;
 return s+'</g>';
}
function chart(w,h,o={},interactive=false){
 const g=geometry(w,h,o,interactive),rr=records(o);
 let s=`<svg class="mst-${interactive?'map':'summary'}" viewBox="0 0 ${g.w} ${g.h}" data-detail-level="${g.level}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Approximation versus stochastic matching query-budget families"><title>Stochastic matching: approximation and query budgets</title><desc>Horizontal positions evaluate the stated guarantee at epsilon ${g.epsilon}. Vertical bands are symbolic query-budget families, not numerical costs or a universal ordering. Circles are non-adaptive algorithms, triangles adaptive algorithms. Red diamonds are necessary budgets and do not lie on the approximation axis. Separate panels preserve bipartite, oracle and expected-total-query scopes.</desc>`;
 if(!rr.length)return s+(g.tiny?'':text(g.w/2,g.h/2,'No sources match this filter.','muted','middle'))+'</svg>';
 for(const b of g.blocks){
  const oracle=b.id==='oracle';
  s+=`<g data-stochastic-panel="${b.id}"><rect x="1" y="${b.top+.5}" width="${g.w-2}" height="${Math.max(.1,b.height-1)}" rx="5" class="mst-panel"/>`;
  if(!g.tiny){
   s+=text(g.focus?18:8,b.top+(g.focus?25:g.compact?15:18),b.title,'heading');
   if(!g.focus&&!g.compact&&!oracle)s+=text(g.right,b.top+18,'ε = '+g.epsilon.toFixed(2),'tick','end');
   if(g.focus)s+=text(18,b.top+46,b.note,'muted')+text(g.right,b.top+46,oracle?'':'Retained fraction β →','axis-title','end');
   if(!g.compact)s+=text(g.left-12,b.plotTop-7,oracle?'SUPPLIED ORACLE':'QUERY-BUDGET FAMILY','axis-title','end');
  }
  b.families.forEach((f,i)=>{
   const y=b.plotTop+(i+.5)*g.unit;
   s+=line(g.left,y,g.right,y,'grid');
   if(!g.tiny&&!g.compact)s+=text(g.left-12,y+4,familyLabels[f],'budget','end');
  });
  if(!oracle){
   for(const beta of [0,.25,.5,.75,1]){
    const x=g.left+(g.right-g.left)*beta;
    s+=line(x,b.plotTop,x,b.axisY,'guide');
    if(!g.tiny)s+=text(x,b.top+b.height-(g.focus?12:5),beta===1?'1':String(beta),'tick','middle');
   }
   s+=line(g.left,b.plotTop,g.left,b.axisY)+line(g.left,b.axisY,g.right,b.axisY);
  }
  for(const p of b.points){
   const r=p.row;
   if(p.annotation){
    s+=`<rect x="${g.left-8}" y="${p.y-g.unit*.27}" width="${g.right-g.left+16}" height="${g.unit*.54}" rx="3" class="mst-lower-band"/>`;
    if(!g.tiny)s+=text(g.left+14,p.y+(g.focus?4:3),g.compact?r.budgetLabel:r.ratioLabel+' '+r.budgetLabel+(r.sourceId==='bbd22'?' · small p, ε only':'')+(g.focus?' · '+short(r):''),'lower-note');
   }else if(!g.tiny){
    const side=r.id==='stochastic-akl17-half-plus'||p.x>g.right-90?'end':'start',dx=side==='end'?-12:12;
    if(!g.compact){
     const label=oracle?r.ratioLabel:short(r)+(r.id==='stochastic-akl17-half-plus'?' · ½+δ₀':r.id==='stochastic-akl17-small-p'?'':'');
     s+=g.focus?'<a href="'+esc(r.sourceUrl)+'" target="_blank" rel="noopener noreferrer" aria-label="Open '+esc(short(r))+' paper">'+text(p.x+dx,p.y-8,label+' ↗','paper',side)+'</a>':text(p.x+dx,p.y-8,label,'paper',side);
     if(g.focus&&!oracle)s+=text(p.x+dx,p.y+14,r.id==='stochastic-akl17-half-plus'?'δ₀ > 0; unspecified':r.ratioLabel+' = '+(p.beta===null?'symbolic':p.beta.toFixed(3)),'ratio',side);
    }
   }
   s+=marker(p,g,o,interactive);
  }
  s+='</g>';
 }
 return s+'</svg>';
}
function diagramSVG(a={},b={}){const o=typeof a==='string'?{...b,key:a}:a||{};return chart(1100,weight(o.key||ID,o)==='weighted'?780:930,o,true);}
function summarySVG(key,w,h,o={}){return chart(w,h,{...o,key});}
// The only numerical query curve is the explicit R of Blum et al., Algorithms 1–2.
// Work in logarithms to avoid overflow; the displayed continuous formula omits integer rounding.
function explicitBudgetLog(e,p){return Math.log10(Math.log(2/e))+(2/e)*Math.log10(1/p);}
function parameterSVG(o={}){
 const e=eps(o),p=prob(o),mode=o.parameter==='p'?'p':'epsilon',L=80,R=1010,T=58,B=230,C=300,D=470,N=100,vals=Array.from({length:N+1},(_,i)=>mode==='p'?Math.pow(10,-3+3*i/N):.01+.24*i/N);
 const xn=v=>L+(R-L)*(mode==='p'?(Math.log10(v)+3)/3:(v-.01)/.24),x=mode==='p'?xn(p):xn(e),elog=v=>explicitBudgetLog(mode==='p'?e:v,mode==='p'?v:p),yMax=Math.ceil(Math.max(...vals.map(elog))/10)*10;
 const beta=(v,ad)=>{const ep=mode==='p'?e:v;return ad?1-ep:(1-ep)/2;},path=fn=>vals.map((v,i)=>(i?'L':'M')+xn(v).toFixed(2)+' '+fn(v).toFixed(2)).join('');
 let s=`<svg class="mst-parameter-map" viewBox="0 0 1100 550" role="img" aria-label="Explicit Blum et al. 2015 guarantee and query-budget curves as ${mode} varies"><title>Explicit epsilon and p dependence</title><desc>General unweighted graphs; ratio of expectations. Natural logarithm convention. R=log(2/epsilon)/p^(2/epsilon), before ceiling; this is a historical sufficient budget, not the current frontier.</desc>`;
 s+=text(20,24,'EXPLICIT THEOREM CURVES · Blum et al. 2015','heading')+text(20,45,mode==='p'?'Fixed ε = '+e.toFixed(2)+' · vary independent edge survival p':'Fixed p = '+p.toFixed(3)+' · vary accuracy parameter ε','muted');
 for(const y of [0,.25,.5,.75,1]){const yy=B-y*(B-T);s+=line(L,yy,R,yy,'grid')+text(L-10,yy+4,String(y),'tick','end');}
 for(let i=0;i<=4;i++){const k=yMax*i/4,yy=D-(D-C)*i/4;s+=line(L,yy,R,yy,'grid')+text(L-10,yy+4,k.toFixed(0),'tick','end');}
 s+=text(20,75,'β','axis-title')+text(20,317,'log₁₀ R','axis-title')+line(L,T,L,B)+line(L,B,R,B)+line(L,C,L,D)+line(L,D,R,D);
 s+=`<path class="mst-curve mst-adaptive-curve" d="${path(v=>B-beta(v,true)*(B-T))}"/><path class="mst-curve" d="${path(v=>B-beta(v,false)*(B-T))}"/><path class="mst-curve mst-budget-curve" d="${path(v=>D-elog(v)/yMax*(D-C))}"/>`;
 s+=line(x,T,x,D,'cursor')+text(R,B-beta(vals[N],true)*(B-T)-10,'▲ adaptive: 1−ε','ratio','end')+text(R,B-beta(vals[N],false)*(B-T)+20,'● non-adaptive: (1−ε)/2','ratio','end');
 const ticks=mode==='p'?[.001,.01,.1,1]:[.01,.05,.1,.15,.2,.25];
 for(const v of ticks){const xx=xn(v);s+=text(xx,D+22,String(v),'tick','middle');}
 s+=text((L+R)/2,D+45,mode==='p'?'Survival probability p · logarithmic scale':'Accuracy parameter ε','axis-title','middle');
 s+=text(L,270,'Same sufficient query budget R for both testing rules','muted')+text(R,270,'Current log₁₀ R = '+explicitBudgetLog(e,p).toFixed(2),'muted','end');
 s+=text(L,536,'R = log(2/ε) / p^{2/ε} before rounding · source: Theorems 4.1 and 5.1','muted');
 return s+'</svg>';
}

function release(root){for(const i of instances)if(!i.root.isConnected||i.root===root)i.destroy();}
function mount(root,key=ID,options={}){
 release(root);for(const name of ['StreamingMatching','DynamicMatching','LCAMatching','LocalMatching','MPCMatching','ListQueryMatching'])window[name]?.release(root);
 for(const[id,renderer]of Object.entries(window.AtlasPairRenderers||{}))if(id!==ID)renderer.release?.(root);
 const controller=new AbortController(),weighting=weight(key,options);let publication=options.publication||'all',selected=weighting==='weighted'?'stochastic-ds25-weighted-general':'stochastic-abgr25-near-optimal';
 root.classList.add('focus-view','mst-view');root.classList.toggle('f-embedded',!!options.embedded);root.setAttribute('aria-label','Stochastic matching guarantees and query budgets');
 root.innerHTML=`<p class="f-kicker">${weighting==='weighted'?'WEIGHTED MATCHING':'MATCHING'} × STOCHASTIC</p><header class="f-hero"><div><h1>More matching from fewer tests.</h1><p>${weighting==='weighted'?'Edge-weighted':'Unweighted'} graphs · independent edge realizations · adaptive and non-adaptive tests.</p></div></header><div class="mst-toolbar"><div class="mst-legend"><span><i class="mst-key-upper"></i>Non-adaptive algorithm</span><span><i class="mst-key-adaptive"></i>Adaptive algorithm</span><span><i class="mst-key-lower"></i>Necessary budget</span></div><label>Sources <select class="mst-publication" aria-label="Stochastic matching publication filter"><option value="all">All reviewed sources</option><option value="published">Published only</option></select></label></div><div class="mst-setup-legend"><span>General graphs</span><span>Bipartite graphs</span><span>Separate resource model</span></div><div class="mst-parameters"><label>Accuracy parameter ε <input class="mst-epsilon" type="range" min=".01" max=".25" step=".01" value=".05"><output class="mst-epsilon-value">0.05</output></label><span>Markers evaluate approximation guarantees; cost bands retain their formulas.</span></div><div class="mst-scroll" tabindex="0" aria-label="Stochastic matching figure; horizontal scrolling on narrow screens"><div class="mst-plot"></div></div><div class="mst-notes"><p><b>Approximation × query budget.</b> Adaptive triangles and non-adaptive circles share the same axes when their graph and resource contracts agree. Vertical bands name formulas; spacing does not encode a numerical comparison of hidden constants.</p><p><b>Lower bounds constrain tests.</b> Red strips state necessary resources, not approximation ceilings. Their non-adaptive scope does not transfer to adaptive testing. AKL ’16 has a growing-optimum success condition; “small p” retains its source restriction.</p></div>${weighting==='unweighted'?`<section class="mst-explorer"><h2>How do p and ε change the bound?</h2><p>The explicit Blum et al. 2015 theorem is a historical comparison, not today’s frontier. Modern Oε exponents stay symbolic above.</p><div class="mst-parameters"><label>Vary <select class="mst-parameter"><option value="epsilon">ε at fixed p</option><option value="p">p at fixed ε</option></select></label><label>Survival probability p <input class="mst-probability" type="range" min="-3" max="-.046" step=".01" value="-1"><output class="mst-p-value">0.100</output></label></div><div class="mst-parameter-plot"></div><p>Natural-log convention; plot log₁₀ R before integer rounding. The algorithm uses ⌈R⌉ tests per vertex. <a href="https://arxiv.org/pdf/1407.4094" target="_blank" rel="noopener noreferrer">Theorems 4.1 and 5.1 ↗</a></p></section>`:'' }<section class="mst-theorem" aria-live="polite" aria-label="Selected stochastic theorem"></section><details class="mst-evidence"><summary>Every result and its paper</summary><div class="mst-records"></div></details><p class="mst-coverage">${esc(data.coverageNote)}</p>`;
 let epsilon=.05,p=.1,parameter='epsilon';
 const opts=()=>({key,weighting,publication,selected,epsilon,p,parameter});
 function render(){const rr=records(opts());if(!rr.some(r=>r.id===selected))selected=rr[0]?.id;
  root.querySelector('.mst-publication').value=publication;root.querySelector('.mst-plot').innerHTML=diagramSVG(opts());root.querySelector('.mst-epsilon-value').textContent=epsilon.toFixed(2);if(weighting==='unweighted'){root.querySelector('.mst-parameter-plot').innerHTML=parameterSVG(opts());root.querySelector('.mst-p-value').textContent=p.toFixed(3);}
  root.querySelector('.mst-records').innerHTML=rr.map(r=>`<button type="button" data-mst-result="${esc(r.id)}" class="mst-record" aria-pressed="${selected===r.id}"><span class="mst-${r.kind}-label">${esc(r.shortLabel)} · ${r.kind==='lower'?'Necessary budget':'Algorithm'}</span><strong>${esc(r.quality)}</strong><small>${esc(r.bound)}</small></button>`).join('');
  const r=rr.find(r=>r.id===selected),el=root.querySelector('.mst-theorem');if(!r){el.innerHTML='<p>No sources match this filter.</p>';return;}
  el.innerHTML=`<div class="mst-detail-head"><strong class="mst-${r.kind}-label">${r.kind==='lower'?'Lower bound · necessary budget':'Algorithm upper bound'}</strong><span>${esc(r.shortLabel)}</span></div><h2>${esc(r.bound)}</h2><p><b>Guarantee.</b> ${esc(r.guarantee)}</p><p><b>Access.</b> ${esc(r.oracle)}</p><p><b>Probability.</b> ${esc(r.probability)}</p><p>${esc(r.notes)}</p><p><a href="${esc(r.sourceUrl)}" target="_blank" rel="noopener noreferrer">Read primary paper ↗</a>${r.doi?` · <a href="https://doi.org/${esc(r.doi)}" target="_blank" rel="noopener noreferrer">Published paper ↗</a>`:''}</p><details><summary>Theorem and assumptions</summary><h3>${esc(r.title)}</h3><p>${esc(r.authors.join(', '))} · ${esc(r.venue)}</p><p><b>${esc(r.theorem)}</b></p><p><b>Graph.</b> ${esc(r.graph)}</p><p><b>Output.</b> ${esc(r.output)}</p></details>`;
 }
 function select(e){const b=e.target.closest('[data-mst-result]');if(b&&records(opts()).some(r=>r.id===b.dataset.mstResult)){selected=b.dataset.mstResult;render();}}
 root.addEventListener('click',select,{signal:controller.signal});root.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const b=e.target.closest('.mst-point');if(b){e.preventDefault();select(e);}}},{signal:controller.signal});
 root.addEventListener('input',e=>{if(e.target.classList.contains('mst-epsilon')){epsilon=eps({epsilon:e.target.value});render();}if(e.target.classList.contains('mst-probability')){p=prob({p:Math.pow(10,Number(e.target.value))});render();}},{signal:controller.signal});
 root.addEventListener('change',e=>{if(e.target.classList.contains('mst-parameter')){parameter=e.target.value;render();}if(e.target.classList.contains('mst-publication')){publication=e.target.value;render();options.onPublicationChange?.(publication);}},{signal:controller.signal});
 render();const instance={root,settingKey:key,redraw:render,destroy(){controller.abort();root.classList.remove('mst-view');instances.delete(instance);}};instances.add(instance);return instance;
}
window.AtlasPairRenderers=window.AtlasPairRenderers||{};window.AtlasPairRenderers[ID]={mount,diagramSVG,summarySVG,records,release,layoutGeometry:geometry,qualityAt:quality,explicitBudgetLog,parameterSVG};
})();
