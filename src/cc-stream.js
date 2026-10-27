(()=>{
'use strict';
const data=JSON.parse(document.getElementById('atlas-data').textContent).focus['cc-stream'];
const instances=new Set();let serial=0;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=n=>String(Math.round(n*1000)/1000),all=()=>[...data.verifiedRecords,...data.relatedResults];
const records=(options={})=>all().map(r=>({...data.sources[r.sourceId],...r})).filter(r=>options.publication!=='published'||r.publicationStatus!=='preprint');
const isValue=key=>String(key).includes('value')||String(key).includes('node-arrival');
function spans(value){let s=String(value??''),out='';for(let i=0;i<s.length;i++){if(s[i]==='^'&&s[i+1]==='{'){let depth=1,j=i+2;for(;j<s.length&&depth;j++){if(s[j]==='{')depth++;if(s[j]==='}')depth--}if(!depth){out+='<tspan baseline-shift="super" font-size="75%">'+spans(s.slice(i+2,j-1))+'</tspan>';i=j-1;continue}}out+=esc(s[i])}return out}
const tx=(x,y,s,cls='',anchor='start',attrs='')=>'<text x="'+num(x)+'" y="'+num(y)+'" class="'+cls+'" text-anchor="'+anchor+'" '+attrs+'>'+spans(s)+'</text>';
function levelFor(w,h,requested,focus){if(focus)return'focus';const names=['overview','compact','detail'],available=w<240||h<170?0:w<720||h<430?1:2,index=names.indexOf(requested);return names[Math.min(available,index<0?available:index)]}
function familyPoint(r){if(!Number.isSafeInteger(r)||r<1)throw new RangeError('r must be a positive integer');return{r,factor:3+8/(2*r-1),passes:2*r+1}}
function epsilonFor(options){const e=Number(options.epsilon??data.defaultEpsilon);if(!(e>0&&e<.25))throw new RangeError('ε must satisfy 0<ε<1/4');return e}
function geometry(key,w,h,options={}){
 const level=levelFor(w,h,options.level,options.focus),tiny=level==='overview',rich=level==='focus'||level==='detail',value=isValue(key);
 const left=tiny?8:value?(rich?310:Math.min(125,w*.38)):(rich?64:34),right=w-(tiny?8:rich?32:16),top=tiny?8:rich?62:31,bottom=h-(tiny?8:rich?86:53);
 const px=v=>value?left+(right-left)*(v+.025)/1.065:left+(right-left)*(v-1.5)/4.5;
 const py=v=>bottom-(bottom-top)*Math.log(v)/Math.log(128);
 const rowY=i=>top+(bottom-top)*(i+.5)/7;
 const rows=records(options).filter(r=>r.panel===(value?'value':'partition')),epsilon=epsilonFor(options);
 let points=[];
 for(const row of rows){if(value)points.push({id:row.id,kind:row.kind,x:px(row.exponent),y:rowY(row.valueRow),row,exponent:row.exponent});else if(row.plotRole==='multipass'){for(const r of data.sampleR){const p=familyPoint(r);points.push({...p,id:row.id,kind:'upper',x:px(p.factor),y:py(p.passes),row})}}else{const factor=row.id==='cc-stream-combinatorial-1847'?24/13+epsilon:3+epsilon;points.push({id:row.id,kind:'upper',factor,passes:1,x:px(factor),y:py(1),row})}}
 return{level,tiny,rich,value,left,right,top,bottom,px,py,rowY,rows,points,epsilon,w,h};
}
function pointMarkup(p,g,options={}){
 const focus=g.level==='focus',selected=p.id===options.selectedId;
 let s='<g class="cc-stream-point" data-cc-stream-result="'+esc(p.id)+'" data-kind="'+p.kind+'" data-center-x="'+num(p.x)+'" data-center-y="'+num(p.y)+'"'+(p.r?' data-cc-stream-r="'+p.r+'"':'')+(focus?' role="button" tabindex="0" aria-label="Inspect '+esc(p.row.shortLabel)+'; '+esc(p.row.quality)+'; '+esc(p.row.displayBound)+'"':'')+'>';
 const radius=g.tiny?2.8:focus?5.5:4;
 if(selected&&!g.tiny)s+='<circle class="cc-stream-selection" cx="'+num(p.x)+'" cy="'+num(p.y)+'" r="11"/>';
 const scope=p.row.resourceModel.includes('Node arrival')?'node':p.row.plotRole==='single-turnstile'?'turnstile':'edge';
 if(p.kind==='lower'){
  s+='<path class="cc-stream-lower" d="M'+num(p.x)+' '+num(p.y-radius-1)+'L'+num(p.x-radius-1)+' '+num(p.y+radius)+'L'+num(p.x+radius+1)+' '+num(p.y+radius)+'Z"/>';
  if(!g.tiny)s+='<path class="cc-stream-bound-arrow" d="M'+num(p.x+radius+3)+' '+num(p.y)+'h7l-3 -3m3 3l-3 3"/>';
 }else if(p.row.plotRole==='single-turnstile'){
  const r=radius+4;s+='<path class="cc-stream-turnstile-marker" d="M'+num(p.x)+' '+num(p.y-r)+'L'+num(p.x-r)+' '+num(p.y)+'L'+num(p.x)+' '+num(p.y+r)+'L'+num(p.x+r)+' '+num(p.y)+'Z"/>';
 }else s+='<circle class="cc-stream-upper cc-stream-scope-'+scope+'" cx="'+num(p.x)+'" cy="'+num(p.y)+'" r="'+radius+'"/>';
 return s+'</g>';
}
function renderSVG(key,w,h,options={}){
 const g=geometry(key,w,h,options),{tiny,rich,value,left,right,top,bottom,px,py,rowY}=g;
 let s='<svg class="'+(options.focus?'cc-stream-map':'cc-stream-summary')+'" data-detail-level="'+g.level+'" data-panel="'+(value?'value':'partition')+'" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="xMidYMid meet" role="'+(options.focus?'group':'img')+'" aria-label="'+(value?'Correlation clustering cost estimates: algorithms and lower bounds by memory and explicit error contract':'Correlation clustering partitions: approximation versus pass count with individual memory contracts')+'"><title>'+ (value?'Cost estimation · algorithms and lower bounds':'Partition · approximation and pass count')+'</title><desc>'+esc(data.figureAxes[value?'value':'partition'].note)+'</desc>';
 if(value){
  for(let i=0;i<7;i++){const y=top+(bottom-top)*i/7,rh=(bottom-top)/7;s+='<rect class="cc-stream-row '+(i>=5?'cc-stream-node-row':'cc-stream-edge-row')+'" x="'+num(left)+'" y="'+num(y)+'" width="'+num(right-left)+'" height="'+num(rh)+'" opacity="'+(i%2?'.10':'.04')+'"/>'}
  for(let i=0;i<5;i++){const p=data.figureAxes.value.x.ticks[i],x=px(p);s+='<path class="cc-stream-grid" d="M'+num(x)+' '+num(top)+'V'+num(bottom)+'"/>';if(!tiny&&(rich||w>=400||i%2===0))s+=tx(x,bottom+19,data.figureAxes.value.x.tickLabels[i],'cc-stream-tick',i===0?'start':i===4?'end':'middle')}
  const labels=rich?['Edge · (3, δn²) · expected','Edge · (O(1), δn²) · high probability','Edge · (c, 0) · pure multiplicative','Edge · (1, Cn^{7/4}) · pure additive','Edge · (1.19, 0.005n)','Node · (10, √n) · constant passes','Node · (c, 0) · constant passes']:['Edge: (3, δn²) · E','Edge: (O(1), δn²) hp','Edge: (c, 0)','Edge: (1, Cn^{7/4})','Edge: (1.19,.005n)','Node: (10, √n)','Node: (c, 0)'];
  if(!tiny)for(let i=0;i<7;i++)s+=tx(left-12,rowY(i)+4,labels[i],i>=5?'cc-stream-row-label cc-stream-node-text':'cc-stream-row-label','end');
  if(!tiny)s+=tx(left,rich?28:14,rich?'Memory by explicit value guarantee · (factor, additive error)':'Value guarantee → memory','cc-stream-title');
  for(const p of g.points){s+=pointMarkup(p,g,options);if(rich){const rightSide=p.exponent<=.5;s+=tx(p.x+(rightSide?15:-15),p.y-7,p.row.displayBound,'cc-stream-bound '+(p.kind==='lower'?'cc-stream-red':'cc-stream-green'),rightSide?'start':'end');s+=tx(p.x+(rightSide?15:-15),p.y+13,p.row.shortLabel+(p.kind==='lower'?' · lower bound':''),'cc-stream-source',rightSide?'start':'end')}}
  if(!tiny){
   s+=tx((left+right)/2,bottom+(rich?42:33),rich?'Memory n^p · logarithmic factors suppressed':'Memory n^p · logs suppressed','cc-stream-axis-title','middle','data-axis="x"');
   s+=tx(left-12,top-13,rich?'Error / access contract':'Contract','cc-stream-axis-title','end','data-axis="y"');
   s+=tx(rich?12:left,rich?h-12:h-4,rich?'Fixed δ=1/8, ε=1/4, α=1/2. Green: upper bounds in words. Red: lower bounds in bits. Different rows are distinct tasks.':'Fixed δ; E = expectation · nodes ≠ edges','cc-stream-note',rich?'start':'middle');
  }
 }else{
  for(const t of data.figureAxes.partition.y.ticks){const y=py(t);s+='<path class="cc-stream-grid" d="M'+num(left)+' '+num(y)+'H'+num(right)+'"/>';if(!tiny&&(rich||[1,4,16,64].includes(t)))s+=tx(left-8,y+4,t,'cc-stream-tick','end')}
  for(const t of data.figureAxes.partition.x.ticks){const x=px(t);s+='<path class="cc-stream-grid" d="M'+num(x)+' '+num(top)+'V'+num(bottom)+'"/>';if(!tiny)s+=tx(x,bottom+23,t,'cc-stream-tick','middle')}
  const family=g.points.filter(p=>p.r);
  if(family.length)s+='<path class="cc-stream-guide" data-visual-guide="true" d="'+family.map((p,i)=>(i?'L':'M')+num(p.x)+' '+num(p.y)).join(' ')+'"/>';
  for(const p of g.points.filter(p=>p.row.plotRole==='single-turnstile'))s+=pointMarkup(p,g,options);
  for(const p of g.points.filter(p=>p.row.plotRole!=='single-turnstile'))s+=pointMarkup(p,g,options);
  if(!tiny&&!rich){for(const p of g.points.filter(p=>p.row.id==='cc-stream-combinatorial-1847'||p.row.id==='cc-stream-pivot-3plus'||p.r===32))s+=tx(p.x+6,p.y-9,p.row.id==='cc-stream-combinatorial-1847'?'hp':'E','cc-stream-source')}
  if(!tiny){
   s+=tx(left,rich?25:14,rich?'Passes · logarithmic scale':'Passes · log','cc-stream-axis-title','start','data-axis="y"');
   s+=tx((left+right)/2,bottom+(rich?47:33),rich?'Approximation factor · smaller is better':'Approximation factor','cc-stream-axis-title','middle','data-axis="x"');
   s+=tx(left,rich?h-12:h-4,rich?'Single-pass ε='+g.epsilon+'. Each point keeps its own memory and success guarantee; dashed line is an integer-r guide.':'E: expected · hp: high probability · ε='+g.epsilon,'cc-stream-note');
  }
  if(rich){
   for(const p of family.filter(p=>[2,4,16,32].includes(p.r)))s+=tx(p.x+10,p.y-10,'r='+p.r,'cc-stream-point-label');
   const cm=g.points.find(p=>p.row.id==='cc-stream-pivot-3plus'),ca=g.points.find(p=>p.row.id==='cc-stream-combinatorial-1847');
   if(cm){s+=tx(cm.x+23,cm.y-48,'CM23 · expected','cc-stream-green cc-stream-point-label');s+=tx(cm.x+23,cm.y-30,'CKLPU25 · turnstile · expected','cc-stream-purple cc-stream-point-label');s+='<path class="cc-stream-leader" d="M'+num(cm.x+17)+' '+num(cm.y-26)+'L'+num(cm.x+2)+' '+num(cm.y-8)+'"/>'}
   if(ca){s+=tx(ca.x-12,ca.y-31,'CLPTYZ24 · high probability','cc-stream-green cc-stream-point-label','start');s+=tx(ca.x-12,ca.y-13,'24/13+ε','cc-stream-source')}
   s+=tx(right-10,top+22,'BCMT22: expected 3+8/(2r−1)','cc-stream-callout','end');
   s+=tx(right-10,top+45,'2r+1 passes · O(n log n) bits','cc-stream-source','end');
   s+=tx(right-10,top+70,'No universal red barrier verified for this panel','cc-stream-note','end');
  }
 }
 s+='<path class="cc-stream-axis" d="M'+num(left)+' '+num(top)+'V'+num(bottom)+'H'+num(right)+'"/>';
 if(!g.points.length&&!tiny)s+=tx((left+right)/2,(top+bottom)/2,'No source in this filter','cc-stream-note','middle');
 return s+'</svg>';
}
const diagramSVG=(options={})=>renderSVG(options.key||'cc-stream-partition',1100,650,{...options,focus:true});
const summarySVG=(key,w,h,options={})=>renderSVG(key,w,h,{...options,focus:false});
function mount(root,key='cc-stream-partition',options={}){
 for(const instance of instances)if(!instance.root.isConnected||instance.root===root)instance.destroy();
 let publication=options.publication||'all',panel=isValue(key)?'value':'partition',epsilon=data.defaultEpsilon,selectedId=null,selectedR=null;
 const controller=new AbortController(),prefix='cc-stream-'+(++serial);
 root.classList.add('focus-view','cc-stream-view');root.classList.toggle('f-embedded',!!options.embedded);root.setAttribute('aria-label','Correlation clustering streaming atlas');
 root.innerHTML='<div class="f-hero"><div class="f-eyebrow">Correlation clustering / streaming</div><h1>Partitions and cost estimates</h1><p>Compare algorithms and lower bounds under their stated output, memory and arrival contracts.</p></div><div class="cc-stream-toolbar"><div class="cc-stream-tabs" role="tablist" aria-label="Figure output"><button type="button" data-cc-stream-panel="partition">Partition</button><button type="button" data-cc-stream-panel="value">Cost estimate</button></div><label>Sources <select class="cc-stream-publication" aria-label="Publication filter"><option value="all">All supplied sources</option><option value="published">Published only</option></select></label></div><div class="cc-stream-legend"><span><i class="cc-stream-key-upper"></i>Algorithm</span><span><i class="cc-stream-key-lower"></i>Lower bound</span><span><i class="cc-stream-key-turnstile"></i>Turnstile algorithm</span><span class="cc-stream-scope-note">Edge and node access have separate rows</span></div><div class="cc-stream-controls"><label for="'+prefix+'-epsilon">One-pass ε <select id="'+prefix+'-epsilon" class="cc-stream-epsilon">'+data.epsilonChoices.map(e=>'<option value="'+e+'">'+e+'</option>').join('')+'</select></label><span>Only ε in (0,1/4) is shown; all full formulas remain inspectable.</span></div><div class="cc-stream-scroll"><div class="cc-stream-plot"></div></div><div class="cc-stream-context"></div><div class="cc-stream-theorem" aria-live="polite"></div><div class="cc-stream-records"></div><details class="cc-stream-related"><summary>Related contracts and evidence</summary><div class="cc-stream-related-content"></div></details>';
 const opts=()=>({publication,epsilon,selectedId,key:'cc-stream-'+panel});
 function select(id,r){if(!records(opts()).some(x=>x.id===id))return;selectedId=id;selectedR=Number.isSafeInteger(Number(r))?Number(r):null;render();}
 function inspect(){
  const row=records(opts()).find(r=>r.id===selectedId),host=root.querySelector('.cc-stream-theorem');
  if(!row){host.innerHTML='<p>Select a point or theorem card to inspect its exact assumptions and source.</p>';return}
  const sample=selectedR&&row.plotRole==='multipass'?familyPoint(selectedR):null;
  host.innerHTML='<div class="cc-stream-theorem-top"><b class="'+(row.kind==='lower'?'cc-stream-red':'cc-stream-green')+'">'+(row.kind==='lower'?'Lower bound':'Algorithm')+' · '+esc(row.shortLabel)+'</b><span>'+esc(row.evidenceStatus.replaceAll('_',' '))+'</span></div><h3>'+esc(row.quality)+'</h3>'+(sample?'<p><b>Selected r='+sample.r+': '+sample.passes+' passes; expected factor 3+8/'+(2*sample.r-1)+' ≈ '+num(sample.factor)+'.</b></p>':'')+'<p><b>'+esc(row.exactBound||row.bound)+'</b></p><dl><dt>Output</dt><dd>'+esc(row.output)+'</dd><dt>Graph and access</dt><dd>'+esc(row.graph)+'. '+esc(row.resourceModel)+'</dd><dt>Probability</dt><dd>'+esc(row.probability)+'</dd><dt>Parameters</dt><dd>'+esc(row.parameterDomain||'As stated in the source theorem')+'</dd><dt>Theorem</dt><dd>'+esc(row.theorem)+'</dd></dl><p>'+esc(row.notes)+'</p><p><a href="'+esc(row.verificationUrl)+'" target="_blank" rel="noopener noreferrer">Inspect primary evidence ↗</a> · <a href="'+esc(row.url)+'" target="_blank" rel="noopener noreferrer">'+esc(row.title)+'</a></p>';
 }
 function cards(rows){return rows.map(r=>'<button type="button" class="cc-stream-card '+(r.kind==='lower'?'cc-stream-lower-card':'')+'" data-cc-stream-result="'+esc(r.id)+'" aria-pressed="'+(r.id===selectedId)+'"><b>'+esc(r.shortLabel)+'</b><span>'+esc(r.quality)+'</span><small>'+esc(r.displayBound)+'</small></button>').join('')}
 function render(){
  const available=records(opts());if(!available.some(r=>r.id===selectedId))selectedId=available.find(r=>r.panel===panel)?.id||null;
  root.querySelector('.cc-stream-publication').value=publication;root.querySelector('.cc-stream-epsilon').value=epsilon;
  for(const button of root.querySelectorAll?.('[data-cc-stream-panel]')||[])button.setAttribute('aria-selected',button.dataset.ccStreamPanel===panel);
  root.querySelector('.cc-stream-plot').innerHTML=diagramSVG(opts());
  root.querySelector('.cc-stream-controls').hidden=panel!=='partition';
  root.querySelector('.cc-stream-context').innerHTML=panel==='partition'?'<p><b>Memory belongs to each theorem.</b> CM23: O(n/ε) words. CKLPU25: O(n log²n/ε) words. CLPTYZ24: O(2^{ε^{−O(1)}} n log n) source space. BCMT22: O(n log n) bits. These points do not assert a common memory frontier.</p><p>The unknown O(1) factor and α_best remain symbolic in related cards. AKP25 bounds streaming synopsis memory; recovery may use polynomially more space. No general partition lower bound is verified here.</p>':'<p><b>(a,b) denotes a multiplicative factor a and additive error b.</b> Each row is a different contract. Green word bounds and red bit bounds share only the exponent-of-n scale. Exact formulas, passes and success probabilities remain attached.</p><p>Displayed values: δ=1/8; purely additive ε=1/4; mixed c=1.19 and η=0.005; node α=1/2. For the mixed lower bound, η must be smaller than 6/5−c. Node access compares only retained items.</p>';
  root.querySelector('.cc-stream-records').innerHTML=cards(available.filter(r=>r.panel===panel));
  const related=available.filter(r=>r.panel==='related'),groups=[...new Set(related.map(r=>r.relatedGroup))];
  root.querySelector('.cc-stream-related-content').innerHTML=groups.map(group=>'<section><h3>'+esc(group)+'</h3><div class="cc-stream-card-grid">'+cards(related.filter(r=>r.relatedGroup===group))+'</div></section>').join('');
  inspect();
 }
 root.addEventListener('click',event=>{const tab=event.target.closest('[data-cc-stream-panel]');if(tab){panel=tab.dataset.ccStreamPanel;selectedId=null;selectedR=null;render();return}const target=event.target.closest('[data-cc-stream-result]');if(target)select(target.dataset.ccStreamResult,target.dataset.ccStreamR)},{signal:controller.signal});
 root.addEventListener('keydown',event=>{if(event.key!=='Enter'&&event.key!==' ')return;const target=event.target.closest('.cc-stream-point');if(target){event.preventDefault();select(target.dataset.ccStreamResult,target.dataset.ccStreamR)}},{signal:controller.signal});
 root.addEventListener('change',event=>{if(event.target.classList.contains('cc-stream-publication')){publication=event.target.value;selectedId=null;render();options.onPublicationChange?.(publication)}else if(event.target.classList.contains('cc-stream-epsilon')){const e=Number(event.target.value);if(data.epsilonChoices.includes(e)){epsilon=e;render()}}},{signal:controller.signal});
 render();const instance={root,settingKey:key,redraw:render,destroy(){controller.abort();root.classList.remove('cc-stream-view');instances.delete(instance)}};instances.add(instance);return instance;
}
window.AtlasPairRenderers=window.AtlasPairRenderers||{};
window.AtlasPairRenderers['cc-stream']={mount,summarySVG,diagramSVG,records,familyPoint,geometry,epsilonFor,release(root){for(const instance of instances)if(!instance.root.isConnected||instance.root===root)instance.destroy()}};
})();