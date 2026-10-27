(()=>{
'use strict';
const data=JSON.parse(document.getElementById('atlas-data').textContent).focus['cc-local'];
const instances=new Set();let serial=0;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const merged=r=>({...data.sources[r.sourceId],...r});
const records=(options={})=>data.verifiedRecords.map(merged).filter(r=>options.publication!=='published'||r.publicationStatus!=='preprint');
const num=n=>String(Math.round(n*1000)/1000);
function pointForR(r){
 if(!Number.isSafeInteger(r)||r<1)throw new RangeError('r must be a positive integer');
 return {r,rounds:2*r+1,leadingFactor:3+8/(2*r-1),denominator:2*r-1,correction:'n^{−Ω(1)}'};
}
function spans(s){let out='';s=String(s??'');for(let i=0;i<s.length;i++){if(s[i]==='^'&&s[i+1]==='{'){let depth=1,j=i+2;for(;j<s.length&&depth;j++){if(s[j]==='{')depth++;if(s[j]==='}')depth--}if(!depth){out+='<tspan baseline-shift="super" font-size="75%">'+spans(s.slice(i+2,j-1))+'</tspan>';i=j-1;continue}}out+=esc(s[i])}return out}
const text=(x,y,value,cls='',anchor='start',attrs='')=>'<text x="'+num(x)+'" y="'+num(y)+'" class="'+cls+'" text-anchor="'+anchor+'" '+attrs+'>'+spans(value)+'</text>';
const math=s=>esc(s).replace(/\^\{([^{}]+)\}/g,'<sup>$1</sup>');
function levelFor(w,h,requested,focus){
 if(focus)return 'focus';
 const names=['overview','compact','detail'],available=w<240||h<160?0:w<700||h<420?1:2,index=names.indexOf(requested);
 return names[Math.min(available,index<0?available:index)];
}
function layoutGeometry(w,h,options={}){
 const level=levelFor(w,h,options.level,options.focus),tiny=level==='overview',rich=level==='focus'||level==='detail';
 const left=tiny?8:rich?86:38,right=w-(tiny?8:rich?28:16),top=tiny?8:rich?46:27,bottom=h-(tiny?8:rich?94:62);
 const xa=data.figureAxes.tradeoff.x,ya=data.figureAxes.tradeoff.y;
 const px=a=>left+(right-left)*Math.log((a-xa.offset)/(xa.min-xa.offset))/Math.log((xa.max-xa.offset)/(xa.min-xa.offset));
 const py=t=>bottom-(bottom-top)*Math.log(t/ya.min)/Math.log(ya.max/ya.min);
 const values=[...data.sampleR];
 if(Number.isSafeInteger(options.selectedR)&&options.selectedR>=data.displayRRange[0]&&options.selectedR<=data.displayRRange[1]&&!values.includes(options.selectedR))values.push(options.selectedR);
 const points=values.sort((a,b)=>a-b).map(r=>{const p=pointForR(r);return{...p,x:px(p.leadingFactor),y:py(p.rounds)}});
 return{level,tiny,rich,left,right,top,bottom,px,py,points};
}
function renderSVG(w,h,options={}){
 const g=layoutGeometry(w,h,options),{level,tiny,rich,left,right,top,bottom,px,py}=g,focus=level==='focus',rows=records(options),row=rows[0];
 let s='<svg class="'+(focus?'cc-local-map':'cc-local-summary')+'" data-detail-level="'+level+'" data-cost="elapsed-rounds" data-x-scale="log-excess-over-3" data-y-scale="log-rounds" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="xMidYMid meet" role="'+(focus?'group':'img')+'" aria-label="Correlation clustering LOCAL: expected approximation versus elapsed communication rounds. Plotted leading factors have an additional vanishing rank correction."><title>Correlation clustering: approximation–round tradeoff</title><desc>Green points are integer-r instances of one algorithm theorem. Actual expected factor is a plus delta_n, where delta_n is n to a negative unspecified constant. The dashed line is a guide. There is no general lower-bound theorem in the supplied source.</desc>';
 s+='<g data-panel="tradeoff"><path class="cc-local-axis" d="M'+num(left)+' '+num(top)+'V'+num(bottom)+'H'+num(right)+'"/>';
 for(const tick of data.figureAxes.tradeoff.y.ticks){const y=py(tick);s+='<path class="cc-local-grid" d="M'+num(left)+' '+num(y)+'H'+num(right)+'"/>';if(!tiny)s+=text(left-8,y+4,tick,'cc-local-tick','end')}
 for(let i=0;i<data.figureAxes.tradeoff.x.ticks.length;i++){const tick=data.figureAxes.tradeoff.x.ticks[i],x=px(tick);s+='<path class="cc-local-grid" d="M'+num(x)+' '+num(top)+'V'+num(bottom)+'"/>';if(!tiny&&(w>=320||i%2===0))s+=text(x,bottom+19,data.figureAxes.tradeoff.x.tickLabels[i],'cc-local-tick',i===0?'start':i===data.figureAxes.tradeoff.x.ticks.length-1?'end':'middle')}
 if(row){
  s+='<path class="cc-local-guide" data-visual-guide="true" fill="none" d="'+g.points.map((p,i)=>(i?'L':'M')+num(p.x)+' '+num(p.y)).join(' ')+'"/>';
  for(const p of g.points){
   const selected=p.r===options.selectedR,radius=tiny?2.4:focus?5:3.6;
   s+='<g class="cc-local-point" data-cc-local-result="'+esc(row.id)+'" data-cc-local-r="'+p.r+'" data-kind="upper" data-center-x="'+num(p.x)+'" data-center-y="'+num(p.y)+'"'+(focus?' role="button" tabindex="0" aria-pressed="'+selected+'" aria-label="Inspect r '+p.r+': '+p.rounds+' rounds; expected factor at most 3 plus 8 over '+p.denominator+' plus the vanishing rank correction"':'')+'>';
   if(selected&&!tiny)s+='<circle class="cc-local-selection" cx="'+num(p.x)+'" cy="'+num(p.y)+'" r="'+(focus?11:8)+'"/>';
   s+='<circle class="cc-local-algorithm" cx="'+num(p.x)+'" cy="'+num(p.y)+'" r="'+radius+'"/>';
   if(rich&&(focus||[1,4,16,128].includes(p.r)||selected)){const end=p.r===1; s+=text(p.x+(end?-11:11),p.y-11,'r = '+p.r,'cc-local-point-label',end?'end':'start')}
   s+='</g>';
  }
 }else if(!tiny)s+=text((left+right)/2,(top+bottom)/2,'No source in this filter','cc-local-note','middle');
 if(!tiny){
  s+=text(left,rich?24:14,rich?'Elapsed communication rounds · log scale':'Rounds · log','cc-local-axis-title','start','data-axis="y"');
  s+=text((left+right)/2,bottom+(rich?45:38),rich?'Leading approximation a · log spacing in a − 3':'a · log(a − 3) spacing','cc-local-axis-title','middle','data-axis="x"');
  s+=text(left,h-(rich?23:7),rich?'Actual expected factor ≤ a + δₙ, where δₙ = n^{−Ω(1)}':'Expected factor ≤ a + δₙ; δₙ = n^{−Ω(1)}','cc-local-correction','start','data-rank-correction="true"');
 }
 if(rich&&row){
  s+=text(right-18,top+30,'(3 + ε) expected approximation','cc-local-callout','end');
  s+=text(right-18,top+55,'O(1/ε) communication rounds','cc-local-callout-sub','end');
  s+=text(right-18,top+82,'3: limiting main term · off the log axis','cc-local-reference','end','data-reference="3"');
  s+=text(right-18,top+100,'Reference only; not a lower bound','cc-local-reference','end');
  s+=text(left,h-5,'Dots: integer r · dashed line: visual guide · displayed r ≤ 128, theorem r ≥ 1','cc-local-note');
 }
 return s+'</g></svg>';
}
const diagramSVG=(options={})=>renderSVG(1000,590,{...options,focus:true});
const summarySVG=(key,w,h,options={})=>renderSVG(w,h,{...options,focus:false});
function mount(root,key='cc-local',options={}){
 for(const instance of instances)if(!instance.root.isConnected||instance.root===root)instance.destroy();
 let publication=options.publication||'all',selectedR=data.defaultR;
 const controller=new AbortController(),prefix='cc-local-'+(++serial);
 root.classList.add('focus-view','cc-local-view');root.classList.toggle('f-embedded',!!options.embedded);root.setAttribute('aria-label','Correlation clustering LOCAL approximation and round tradeoff');
 root.innerHTML='<p class="f-kicker">CORRELATION CLUSTERING × LOCAL</p><header class="f-hero"><div><h1>Closer to 3, in how many rounds?</h1><p>A tradeoff between expected approximation and communication rounds.</p></div><div class="f-seal"><strong>Randomized algorithm</strong>Primary theorem · '+esc(data.reviewedOn)+'</div></header><div class="f-scope"><span><b>Input</b> unweighted complete signed graph</span><span><b>Network</b> positive edges only</span><span><b>Output</b> cluster ID at every vertex</span><span><b>Messages</b> O(log n) bits</span></div><section class="cc-local-landscape" aria-labelledby="'+prefix+'-legend"><div class="cc-local-toolbar"><div class="cc-local-legend" id="'+prefix+'-legend"><span><i class="cc-local-key-upper"></i>Algorithm theorem</span><span><i class="cc-local-key-guide"></i>Visual guide</span><span class="cc-local-legend-note">No general lower bound in supplied source</span></div><label>Sources <select class="cc-local-publication" aria-label="Correlation clustering LOCAL publication filter"><option value="all">All verified sources</option><option value="published">Published only</option></select></label></div><div class="cc-local-scroll" tabindex="0" aria-label="Approximation–round tradeoff; scroll horizontally on narrow screens"><div class="cc-local-plot"></div></div><div class="cc-local-controls"><label for="'+prefix+'-r">Inspect integer r <input class="cc-local-r-input" id="'+prefix+'-r" type="number" min="1" max="128" step="1" value="'+selectedR+'"></label><span>Shown: 1–128 phases. The theorem holds for every integer r ≥ 1.</span></div><div class="cc-local-notes"><p><b>Read the axes.</b> X shows the leading factor a = 3 + 8/(2r − 1), with logarithmic spacing of a − 3. Y shows elapsed communication rounds, also logarithmically. A smaller factor means a stronger guarantee.</p><p><b>Read the guarantee.</b> Expected cost is at most (a + δₙ) OPT, with δₙ = n<sup>−Ω(1)</sup> from finite random ranks. This correction is symbolic, not a chosen numerical value. The dashed line connects samples; r is an integer.</p></div></section><section class="cc-local-theorem" aria-live="polite" aria-label="Selected correlation clustering theorem"></section><details class="cc-local-audit"><summary>Lower-bound scope and source coverage</summary><p>'+esc(data.lowerBoundStatus)+'</p><p>The paper’s bad-permutation example concerns r-Pivot itself. A cited greedy-MIS depth lower bound does not constrain all correlation-clustering algorithms. Neither is a universal lower-bound curve here. Approximation 3 is a reference, not a hardness claim.</p></details><div class="f-bottom"><span>'+esc(data.coverageNote)+'</span><span>Choose a point to inspect its exact guarantee.</span></div>';
 const opts=()=>({publication,selectedR});
 function inspect(){
  const row=records(opts())[0],target=root.querySelector('.cc-local-theorem');
  if(!row){target.innerHTML='<p>No source is available under this publication filter.</p>';return}
  const p=pointForR(selectedR);
  target.innerHTML='<div class="cc-local-theorem-top"><span class="cc-local-upper">Algorithm · expected guarantee</span><strong>'+esc(row.shortLabel)+'</strong><span>'+esc(row.venue)+'</span></div><div class="cc-local-selected"><div><b>'+p.rounds+'</b><span>communication rounds</span></div><div><b>3 + 8/'+p.denominator+' + δₙ</b><span>expected approximation upper bound</span></div></div><p><b>Exact instance.</b> r = '+selectedR+', T = 2r + 1 = '+p.rounds+'. E[cost] ≤ (3 + 8/'+p.denominator+' + δₙ) OPT, where δₙ = n<sup>−Ω(1)</sup>.</p><p><b>General tradeoff.</b> For any ε &gt; 0, choose r = O(1/ε) with 8/(2r − 1) + δₙ &lt; ε to obtain an expected (3 + ε)-approximation. The displayed range is a viewing choice.</p><details><summary>Exact theorem, assumptions &amp; primary source</summary><h3>'+esc(row.title)+'</h3><p>'+esc(row.authors.join(', '))+'</p><p><b>'+esc(row.theorem)+'</b></p><p><b>Graph and output.</b> '+esc(row.graph)+'. '+esc(row.output)+'.</p><p><b>Communication.</b> '+esc(row.resourceModel)+'.</p><p><b>Probability.</b> '+esc(row.probability)+'.</p><p>'+esc(row.notes)+'</p><p><a href="'+esc(row.verificationUrl)+'" target="_blank" rel="noopener noreferrer">Read the LOCAL implementation ↗</a> · <a href="'+esc(row.url)+'" target="_blank" rel="noopener noreferrer">Primary paper ↗</a></p></details>';
 }
 function render(){root.querySelector('.cc-local-publication').value=publication;root.querySelector('.cc-local-r-input').value=selectedR;root.querySelector('.cc-local-plot').innerHTML=diagramSVG(opts());inspect()}
 function select(value){const r=Number(value);if(Number.isSafeInteger(r)&&r>=data.displayRRange[0]&&r<=data.displayRRange[1]){selectedR=r;render();return true}return false}
 root.addEventListener('click',event=>{const node=event.target.closest('[data-cc-local-r]');if(node)select(node.dataset.ccLocalR)},{signal:controller.signal});
 root.addEventListener('keydown',event=>{if(event.key!=='Enter'&&event.key!==' ')return;const node=event.target.closest('.cc-local-point');if(node){event.preventDefault();select(node.dataset.ccLocalR)}},{signal:controller.signal});
 root.addEventListener('change',event=>{if(event.target.classList.contains('cc-local-publication')){publication=event.target.value;render();options.onPublicationChange?.(publication)}else if(event.target.classList.contains('cc-local-r-input')){if(!select(event.target.value))event.target.value=selectedR}},{signal:controller.signal});
 render();const instance={root,settingKey:'cc-local',redraw:render,destroy(){controller.abort();root.classList.remove('cc-local-view');instances.delete(instance)}};instances.add(instance);return instance;
}
window.AtlasPairRenderers=window.AtlasPairRenderers||{};window.AtlasPairRenderers['cc-local']={mount,summarySVG,diagramSVG,records,pointForR,layoutGeometry,release(root){for(const instance of instances)if(!instance.root.isConnected||instance.root===root)instance.destroy()}};
})();
