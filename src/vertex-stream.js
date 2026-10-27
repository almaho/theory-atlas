(()=>{
'use strict';
const ID='vertex-stream',data=JSON.parse(document.getElementById('atlas-data').textContent).focus[ID],instances=new Set();
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const math=v=>esc(v).replace(/\^\{([^}]+)\}/g,'<tspan class="vst-exp">$1</tspan>');
const txt=(x,y,v,cl='',anchor='start')=>'<text x="'+x+'" y="'+y+'" class="'+cl+'" text-anchor="'+anchor+'">'+math(v)+'</text>';
const norm=(a,b={})=>typeof a==='string'?{...b,key:a}:{...(a||{})};
const modeFor=o=>o.mode||(o.key==='vertex-stream-decision'||o.key==='vertex-stream-3'?'decision':'construction');
const panelMode=p=>['random_gap','dynamic_gap'].includes(p)?'decision':'construction';
function records(a={},b={}){const o=norm(a,b),group=o.mode||(o.key?modeFor(o):null);return data.verifiedRecords.filter(r=>(o.publication!=='published'||r.publicationStatus!=='preprint')&&(!group||panelMode(r.panel)===group)&&(!o.panel||o.panel==='overview'||r.panel===o.panel)&&(!o.kind||o.kind==='all'||r.kind===o.kind));}
function marker(r,m,x,y,o,focus,level){
 const tiny=level==='overview',detail=level==='detail',radius=tiny?2.4:detail?(focus?5:4):2.6,color=r.kind==='lower'?'var(--red)':'var(--green)',attrs=' data-vst-result="'+esc(r.id)+'" data-record-panel="'+r.panel+'"'+(focus?' role="button" tabindex="0" aria-pressed="'+(o.selected===r.id)+'"':'')+' aria-label="Inspect '+esc(r.shortName+'; '+r.palette+'; '+r.displayBound)+'"';
 let s='<g class="vst-result"'+attrs+'><title>'+esc(r.shortName+'; '+r.palette+'; '+r.displayBound+'; '+r.stream+'; '+r.accounting)+'</title>';
 s+='<circle cx="'+x+'" cy="'+y+'" r="'+(radius+4)+'" fill="'+(r.setup==='free'?'none':'var(--vst-'+r.setup+')')+'" stroke="var(--vst-'+r.setup+')" opacity="'+(r.setup==='free'?'.85':'.2')+'" stroke-width="1"/>';
 if(o.selected===r.id)s+='<circle cx="'+x+'" cy="'+y+'" r="'+(radius+8)+'" fill="none" stroke="var(--ink)" opacity=".4"/>';
 const meta=' data-marker="'+r.kind+'" data-center-x="'+x+'" data-center-y="'+y+'"';
 s+=r.kind==='lower'?'<path'+meta+' d="M'+x+' '+(y-radius)+'L'+(x+radius)+' '+y+'L'+x+' '+(y+radius)+'L'+(x-radius)+' '+y+'Z" fill="none" stroke="'+color+'" stroke-width="1.6"/>':'<circle'+meta+' cx="'+x+'" cy="'+y+'" r="'+radius+'" fill="'+color+'"/>';
 if(detail)s+=txt(x,y-10,r.shortName,'vst-source-label vst-'+r.kind,'middle');
 return s+'</g>';
}
function panel(p,rr,x0,y0,w,h,o,focus,level){
 const tiny=level==='overview',detail=level==='detail',single=!!o.panel&&o.panel!=='overview',large=focus&&detail;
 const left=tiny?8:detail?(p.id==='random_gap'?152:p.id==='degeneracy'?116:p.id==='passes'?103:79)*(large?1.22:1):14,right=w-(tiny?6:detail?14:9),top=tiny?8:detail?(large?79:59):24,bottom=h-(tiny?6:detail?(large?83:64):18);
 const px=id=>left+(p.x.findIndex(c=>c.id===id)+.5)*(right-left)/p.x.length,py=id=>top+(p.y.findIndex(c=>c.id===id)+.5)*(bottom-top)/p.y.length;
 let s='<g transform="translate('+x0+' '+y0+')" data-panel="'+p.id+'" data-axis-type="categorical"><rect width="'+w+'" height="'+h+'" rx="'+(tiny?3:6)+'" class="vst-panel-bg"/>';
 if(!tiny){s+=txt(12,detail?(large?26:20):13,p.label,'vst-panel-title vst-scope-'+p.color);if(detail)s+=txt(12,large?47:36,p.subtitle,'vst-subtitle');}
 if(detail)s+=txt(left-7,top-8,p.id==='passes'?'Passes':'Space','vst-axis-label','end')+txt(right,top-8,p.id==='random_gap'?'High χ threshold →':p.id==='dynamic_gap'?'Gap →':'Palette →','vst-axis-label','end');
 if(rr.length){
  for(const c of p.y){const yy=py(c.id);s+='<path d="M'+left+' '+yy+'H'+right+'" class="vst-grid"/>';if(detail)s+=txt(left-7,yy+3,c.short,'vst-tick','end');}
  for(const c of p.x){const xx=px(c.id);s+='<path d="M'+xx+' '+top+'V'+bottom+'" class="vst-grid"/>';if(!tiny&&(detail||c===p.x[0]||c===p.x.at(-1)))s+=txt(xx,bottom+(large?22:14),c.short,'vst-tick','middle');}
  s+='<path d="M'+left+' '+top+'V'+bottom+'H'+right+'" class="vst-axis"/>';
  for(const r of rr)for(const m of r.marks){
   if(m.formula){const yy=detail?bottom+(large?45:36):bottom+(tiny?2:4),xx=(left+right)/2;s+='<g class="vst-result" data-vst-result="'+r.id+'"'+(focus?' tabindex="0" role="button" aria-pressed="'+(o.selected===r.id)+'"':'')+' aria-label="'+esc(r.displayBound+'; '+r.palette)+'"><title>'+esc(r.displayBound+'; '+r.palette+'; '+r.accounting)+'</title><path data-marker="lower" d="M'+left+' '+yy+'H'+right+'" class="vst-lower-rule"/>';
    if(detail)s+=txt(xx,yy-5,'Ω(nΔ²/K) · Δ+1≤K≤n/2','vst-formula vst-lower','middle');s+='</g>';continue;}
   if(m.bar){const yy=py(m.y);s+='<g class="vst-result" data-vst-result="'+r.id+'"'+(focus?' tabindex="0" role="button" aria-pressed="'+(o.selected===r.id)+'"':'')+' aria-label="'+esc(r.displayBound)+'"><title>'+esc(r.notes)+'</title><path data-marker="lower" d="M'+(left+5)+' '+yy+'H'+(right-5)+'" class="vst-lower-rule"/>';
    if(detail)s+=txt((left+right)/2,yy-5,'One-pass barrier*','vst-source-label vst-lower','middle');s+='</g>';continue;}
   const offset=m.dx?(m.dx/350)*Math.min(w,700):0,xx=px(m.x)+offset,yy=py(m.y);
   s+=marker(r,m,xx,yy,o,focus,level);
   if(detail&&p.id==='dynamic_gap')s+=txt(xx,yy+(large?28:21),r.kind==='lower'?'Ω̃(n²/t²)':'Õ(n²/t²)','vst-formula vst-'+r.kind,'middle');
  }
 }else if(!tiny)s+=txt(w/2,h/2,'No results in this filter','vst-subtitle','middle');
 if(detail){const ny=h-(large?40:30);if(p.id==='robust'){s+=txt(12,h-(large?16:10),'Hollow halo = external tape excluded · lower allows free randomness','vst-note');}else{p.notes.forEach((v,i)=>s+=txt(12,ny+i*(large?19:13),v,'vst-note'));}}
 return s+'</g>';
}
function chart(w,h,o={},focus=false){
 const names=['overview','compact','detail'],cap=w<250||h<150?0:w<640||h<410?1:2,asked=names.indexOf(o.level),level=names[Math.min(cap,asked<0?cap:asked)],tiny=level==='overview',detail=level==='detail',mode=modeFor(o),selectedPanel=o.panel&&o.panel!=='overview'?o.panel:null;
 const pp=data.panels.filter(p=>panelMode(p.id)===mode&&(!selectedPanel||p.id===selectedPanel)),rr=records({...o,mode}),gap=tiny?6:detail?16:9,top=tiny?5:detail?(focus?100:80):33,bottom=tiny?5:detail?30:8,columns=pp.length>2?2:1,rows=Math.ceil(pp.length/columns),pw=(w-gap*(columns+1))/columns,ph=(h-top-bottom-gap*(rows-1))/rows;
 let s='<svg class="'+(focus?'vst-map':'vst-summary')+'" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="xMidYMid meet" data-detail-level="'+level+'" data-mode="'+mode+'" role="img" aria-label="Streaming vertex coloring: '+mode+'; palette, passes and space contracts"><title>Streaming vertex coloring — '+mode+'</title><desc>Green circles are algorithms, red diamonds or rules are lower bounds. Panels separate incompatible output, stream and memory contracts. All axes are categorical symbolic formula classes. External random tape is identified by a hollow halo. Details and exact primary sources are available in the focused view.</desc>';
 if(w<32||h<32)return s+'</svg>';
 if(!tiny){s+=txt(gap,detail?(focus?30:25):16,mode==='construction'?'Colorings: palette, passes, space':'Decisions: two different stream contracts','vst-heading');if(detail){const ly=focus?54:44; s+='<circle cx="'+(gap+4)+'" cy="'+(ly-3)+'" r="3.5" fill="var(--green)"/>'+txt(gap+13,ly,'Algorithm','vst-legend vst-algorithm')+'<path d="M'+(gap+87)+' '+(ly-7)+'l4 4 -4 4 -4 -4Z" fill="none" stroke="var(--red)" stroke-width="1.4"/>'+txt(gap+97,ly,'Lower bound','vst-legend vst-lower')+txt(gap+192,ly,'Halos: blue = turnstile · ochre = insertion · purple = random order / external tape','vst-legend');s+=txt(gap,focus?77:63,mode==='construction'?'Final output and adaptive-output guarantees stay separate. Space formulas suppress only stated logarithms.':'Decision output only. Random-order gaps differ; the turnstile upper and lower share a multigraph contract.','vst-subtitle');}}
 pp.forEach((p,i)=>{s+=panel(p,rr.filter(r=>r.panel===p.id),gap+(i%columns)*(pw+gap),top+Math.floor(i/columns)*(ph+gap),pw,ph,o,focus,level);});
 if(detail)s+=txt(gap,h-9,'Symbolic categories, not a universal numerical ranking. Select a result in focus for its exact assumptions.','vst-footer');
 return s+'</svg>';
}
function diagramSVG(a={},b={}){const o=norm(a,b);return chart(o.width||1060,o.height||(o.panel&&o.panel!=='overview'?620:770),o,true);}
function summarySVG(key,w,h,options={}){return chart(w,h,{...options,key},false);}
function release(root){for(const i of instances)if(!i.root.isConnected||i.root===root)i.destroy();}
function mount(root,key=ID,options={}){
 release(root);for(const name of ['StreamingMatching','DynamicMatching','LCAMatching','LocalMatching','MPCMatching','ListQueryMatching'])window[name]?.release(root);for(const [id,r] of Object.entries(window.AtlasPairRenderers||{}))if(id!==ID)r.release?.(root);
 const controller=new AbortController();let mode=modeFor({key}),panelId='overview',publication=options.publication||'all',kind='all',selected;
 const opts=()=>({key,mode,panel:panelId,publication,kind,selected});
 root.classList.add('focus-view','vst-view');root.classList.toggle('f-embedded',!!options.embedded);root.setAttribute('aria-label','Streaming vertex coloring');
 root.innerHTML='<p class="f-kicker">VERTEX COLORING × STREAMING</p><header class="f-hero"><div><h1>What must the stream reveal?</h1><p>Compare colors, passes and memory within the same output and stream contract.</p></div></header><div class="vst-toolbar"><div class="vst-modes" role="group" aria-label="Output contract"><button type="button" data-vst-mode="construction">Construct colors</button><button type="button" data-vst-mode="decision">Decide a chromatic gap</button></div><div class="vst-filters"><label>Sources <select class="vst-publication" aria-label="Streaming vertex publication filter"><option value="all">All sources</option><option value="published">Published only</option></select></label><label>Results <select class="vst-kind-filter" aria-label="Streaming vertex result filter"><option value="all">Algorithms and lowers</option><option value="algorithm">Algorithms</option><option value="lower">Lower bounds</option></select></label></div></div><div class="vst-tabs" role="group" aria-label="Streaming setup"></div><div class="vst-scroll" tabindex="0" aria-label="Streaming figure; scroll horizontally on narrow screens"><div class="vst-plot"></div></div><div class="vst-context"></div><section class="vst-theorem" aria-live="polite" aria-label="Selected streaming theorem"></section><h2 class="vst-section-title">Inspect the results</h2><div class="vst-records"></div><p class="vst-coverage">'+esc(data.coverage)+'</p>';
 function inspect(){const r=records(opts()).find(r=>r.id===selected),el=root.querySelector('.vst-theorem');if(!r){el.innerHTML='<p>No result matches these filters.</p>';return;}
  el.innerHTML='<div class="vst-detail-top"><strong class="vst-'+r.kind+'">'+esc(r.shortName)+' · '+(r.kind==='lower'?'Lower bound':'Algorithm')+'</strong><span>'+esc(r.venue)+'</span></div><div class="vst-detail-grid"><div><small>Space / passes</small><strong>'+esc(r.displayBound)+'</strong></div><div><small>Palette / promise</small><strong>'+esc(r.palette)+'</strong></div></div><p><b>Stream.</b> '+esc(r.stream)+'</p><p><b>Memory accounting.</b> '+esc(r.accounting)+'</p><p><b>Probability.</b> '+esc(r.probability)+'</p><p>'+esc(r.notes)+'</p><details><summary>Theorem, assumptions and primary source</summary><h3>'+esc(r.title)+'</h3><p>'+esc(r.authors.join(', '))+'</p><p><b>'+esc(r.theorem)+'</b></p><p><b>Output.</b> '+esc(r.output)+'</p><p><b>Graph.</b> '+esc(r.graph)+'</p><p><b>Resource.</b> '+esc(r.oracle)+'</p><p><b>Passes.</b> '+esc(r.passes)+'</p><p><a href="'+esc(r.sourceUrl)+'" target="_blank" rel="noopener noreferrer">Read primary theorem ↗</a> · <a href="'+esc(r.url)+'" target="_blank" rel="noopener noreferrer">Source record ↗</a></p><p class="vst-record-id">Preserved record: '+esc(r.id)+'</p></details>';
 }
 function render(){const rr=records(opts());if(!rr.some(r=>r.id===selected))selected=rr[0]?.id;root.querySelector('.vst-publication').value=publication;root.querySelector('.vst-kind-filter').value=kind;
  root.querySelector('.vst-modes').innerHTML=['construction','decision'].map(m=>'<button type="button" data-vst-mode="'+m+'" aria-pressed="'+(m===mode)+'">'+(m==='construction'?'Construct colors':'Decide a chromatic gap')+'</button>').join('');
  root.querySelector('.vst-tabs').innerHTML=[{id:'overview',label:'Overview'},...data.panels.filter(p=>panelMode(p.id)===mode)].map(p=>'<button type="button" data-vst-panel="'+p.id+'" aria-pressed="'+(p.id===panelId)+'">'+p.label+'</button>').join('');
  root.querySelector('.vst-plot').innerHTML=diagramSVG(opts());
  root.querySelector('.vst-context').innerHTML=mode==='construction'?'<p><b>Algorithms in green, lower bounds in red.</b> Blue halos mean turnstile access; ochre means insertion only. In the robust panel, hollow purple halos mean an external random tape is excluded; the filled blue halo counts randomness. A lower bound applies only to its stated output and accuracy.</p><p><b>Palette conventions.</b> Near-Δ results keep fixed slack and degree qualifications. The degeneracy upper retains the unavoidable +1 in the small-κ regime. The deterministic one-pass barrier is asymptotic, not a numerical palette frontier.</p>':'<p><b>Random order.</b> q^t and q²/4 are different gaps, with different success requirements. No tight frontier is claimed between them.</p><p><b>General turnstile.</b> The shared upper/lower comparison uses multigraphs and 3≤q≤polylog n. The lower allows unbounded stream length and intermediate frequencies. These space results may use exponential postprocessing.</p>';
  root.querySelector('.vst-records').innerHTML=rr.map(r=>'<button type="button" class="vst-record vst-'+r.kind+'" data-vst-result="'+esc(r.id)+'" aria-pressed="'+(r.id===selected)+'"><span>'+esc(r.shortName)+' · '+esc(data.panels.find(p=>p.id===r.panel).label)+'</span><strong>'+esc(r.displayBound)+'</strong><small>'+esc(r.palette)+'</small></button>').join('');inspect();
 }
 root.addEventListener('click',e=>{let el=e.target.closest('[data-vst-mode]');if(el){mode=el.dataset.vstMode;panelId='overview';render();return;}el=e.target.closest('[data-vst-panel]');if(el){panelId=el.dataset.vstPanel;render();return;}el=e.target.closest('[data-vst-result]');if(el){selected=el.dataset.vstResult;render();}},{signal:controller.signal});
 root.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const el=e.target.closest('.vst-result');if(el){e.preventDefault();selected=el.dataset.vstResult;render();root.querySelector('.vst-result[data-vst-result="'+selected+'"]')?.focus();}},{signal:controller.signal});
 root.addEventListener('change',e=>{if(e.target.classList.contains('vst-publication')){publication=e.target.value;render();options.onPublicationChange?.(publication);}else if(e.target.classList.contains('vst-kind-filter')){kind=e.target.value;render();}},{signal:controller.signal});
 render();const instance={root,settingKey:key,redraw:render,destroy(){controller.abort();root.classList.remove('vst-view');instances.delete(instance);}};instances.add(instance);return instance;
}
window.AtlasPairRenderers=window.AtlasPairRenderers||{};window.AtlasPairRenderers[ID]={mount,summarySVG,diagramSVG,records,release};
})();