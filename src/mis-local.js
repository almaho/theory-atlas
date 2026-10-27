(()=>{
'use strict';
const data=JSON.parse(document.getElementById('atlas-data').textContent).focus['mis-local'];
const instances=new Set();let serial=0;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const merge=r=>({...data.sources[r.sourceId],...r});
const allowed=(r,o)=>o.publication!=='published'||r.publicationStatus!=='preprint';
const records=(o={})=>data.verifiedRecords.map(merge).filter(r=>allowed(r,o));
const related=(o={})=>data.relatedResults.map(merge).filter(r=>allowed(r,o));
const all=o=>[...records(o),...related(o)];
function spans(s){let out='';s=String(s??'');for(let i=0;i<s.length;i++){if(s[i]==='^'&&s[i+1]==='{'){let d=1,j=i+2;for(;j<s.length&&d;j++){if(s[j]==='{')d++;if(s[j]==='}')d--}if(!d){out+='<tspan baseline-shift="super" font-size="75%">'+spans(s.slice(i+2,j-1))+'</tspan>';i=j-1;continue}}if(s[i]==='^'&&/[0-9]/.test(s[i+1]||'')){out+='<tspan baseline-shift="super" font-size="75%">'+esc(s[++i])+'</tspan>';continue}out+=esc(s[i])}return out}
const text=(x,y,s,c='',anchor='start',attr='')=>'<text x="'+x+'" y="'+y+'" class="'+c+'" text-anchor="'+anchor+'" '+attr+'>'+spans(s)+'</text>';
const math=s=>esc(s).replace(/\^\{([^{}]+)\}/g,'<sup>$1</sup>').replace(/\^(\d+)/g,'<sup>$1</sup>');
const shortY={one:'1',loglogratio:'ℓ / log ℓ',sqrt:'√(L / ℓ)',logoverlog:'L / ℓ',log:'L',logllstar:'L · ℓ · log* n',log53:'Õ(L^{5/3})',log2:'L^2 / Õ(L^2)',log3llstar:'L^3 · ℓ · log* n',log7:'L^7',log7ll:'L^7 · ℓ'};
const energyX={logllstar:'L · ℓ · log* n',log2:'L^2',log3llstar:'L^3 · ℓ · log* n',log7ll:'L^7 · ℓ'};
const energyY={ll:'ℓ',llstar:'ℓ · log* n',ll2:'ℓ^2'};
function mark(x,y,r,small=false,selected=false){
 const color='var(--'+(r.kind==='lower'?'red':'green')+')',a=small?3.3:5;
 let s=selected?'<circle cx="'+x+'" cy="'+y+'" r="11" fill="'+color+'" opacity=".14"/>':'';
 s+=r.kind==='lower'?'<path d="M'+x+' '+(y-a-1)+'l'+(a+1)+' '+(a+1)+'l-'+(a+1)+' '+(a+1)+'l-'+(a+1)+'-'+(a+1)+'Z" fill="'+color+'"/>':'<circle cx="'+x+'" cy="'+y+'" r="'+a+'" fill="'+(r.historical?'var(--surface)':color)+'" stroke="'+color+'" stroke-width="1.6"/>';
 return '<g data-marker="'+r.kind+'" data-center-x="'+x+'" data-center-y="'+y+'">'+s+'</g>';
}
function panel(id,box,o={}){
 const p=data.figureAxes[id],{x,y,w,h}=box,full=o.focus||o.rich,tiny=o.tiny||h<70;
 const left=x+(full?(id==='elapsed'?125:85):10),right=x+w-15,top=y+(full?52:tiny||h<70?8:27),bottom=y+h-(full?52:tiny||h<70?8:22),xc=p.x.categories,yc=p.y.categories;
 const px=c=>left+(right-left)*(xc.findIndex(q=>q.id===c)+.5)/xc.length;
 const py=c=>bottom-(bottom-top)*(yc.findIndex(q=>q.id===c)+.5)/yc.length;
 let s='<g data-panel="'+id+'"><path class="mis-local-axis" d="M'+left+' '+top+'V'+bottom+'H'+right+'"/>';
 if(!tiny){s+=text(x+12,y+18,id==='elapsed'?'Elapsed rounds':full?'Awake / elapsed · no lower bound verified':'Awake / elapsed','mis-local-panel-title');if(full)s+=text(x+12,y+36,id==='elapsed'?'Y · rounds; ordered growth classes':'Y · maximum awake rounds per node','mis-local-axis-title','start','data-axis="y"')}
 for(const c of yc){const yy=py(c.id);s+='<path class="mis-local-grid" d="M'+left+' '+yy+'H'+right+'"/>';if(full)s+=text(left-10,yy+4,(id==='elapsed'?shortY:energyY)[c.id],'mis-local-axis-label','end')}
 for(const c of xc){const xx=px(c.id);s+='<path class="mis-local-guide" d="M'+xx+' '+top+'V'+bottom+'"/>';if(!tiny)s+=text(xx,bottom+(full?22:14),(full?{det:'Deterministic',rand:'Randomized · general',degree:'Randomized · Δ',sleep:'Sleeping CONGEST'}:{det:'Det.',rand:'Randomized',degree:'Δ-sensitive',sleep:'Sleeping'})[c.id],'mis-local-x-label mis-local-setup-'+c.id,'middle')}
 if(full)s+=text(right,bottom+42,id==='elapsed'?'X · algorithm / success contract':'X · elapsed rounds','mis-local-axis-title','end','data-axis="x"');
 for(const r of records(o).filter(r=>r.panel===id)){
  const xx=px(r.xCategory)+(r.xCategory==='degree'?(r.kind==='lower'?-7:7):0),yy=py(r.yCategory),color='var(--'+(r.kind==='lower'?'red':'green')+')';
  s+='<g class="mis-local-point" data-mis-local-result="'+esc(r.id)+'" data-kind="'+r.kind+'" data-contract="'+esc(r.xCategory)+'"'+(o.focus?' role="button" tabindex="0" aria-pressed="'+(r.id===o.selected)+'" aria-label="Inspect '+esc(r.shortLabel)+': '+esc(r.bound)+'"':'')+'>';
  if(r.rangeFrom){const ya=py(r.rangeFrom),yb=py(r.rangeTo);s+='<path data-range-from="'+r.rangeFrom+'" data-range-to="'+r.rangeTo+'" stroke="'+color+'" stroke-width="'+(full?2:1.5)+'" stroke-dasharray="3 3" fill="none" d="M'+xx+' '+ya+'V'+yb+'M'+(xx-4)+' '+ya+'H'+(xx+4)+'"/>'}
  s+=mark(xx,yy,r,!o.focus,r.id===o.selected);
  if(full){let lab=r.shortLabel;if(r.id==='mis-local-balliu-2021-det-lower')lab+=' · min{Δ,L/ℓ}';if(r.id==='mis-local-balliu-2021-degree-lower')lab+=' · min{Δ,ℓ/log ℓ}';if(r.id==='mis-local-rozhon-2020-randomized')lab+=' · log Δ + poly(ℓ)';if(r.xCategory==='sleep')lab=r.plotLabel;if(r.id==='mis-local-ghaffari-grunau-2023-det')lab+=' · Õ(L^2)';if(r.id==='mis-local-ghaffari-portmann-awake')lab+=' · O(L^2)';s+=text(xx,yy-12,lab,'mis-local-paper mis-local-'+r.kind,'middle');if(r.id==='mis-local-kmw-general-lower')s+=text(xx,yy+17,'expected-time lower','mis-local-small','middle');if(o.focus&&r.id==='mis-local-luby-general')s+=text(xx,yy+17,'global high-probability upper','mis-local-small','middle')}
  s+='</g>';
 }
 return s+'</g>';
}
function diagramSVG(options={}){
 let s='<svg class="mis-local-map" viewBox="0 0 1100 690" role="img" aria-label="MIS LOCAL elapsed-round complexity across deterministic, randomized, degree-sensitive and sleeping CONGEST contracts."><title>Maximal independent set: elapsed rounds</title><desc>Green circles are algorithms; red diamonds lower bounds. Open circles are historical upper bounds. Dotted enclosures vary with maximum degree. Awake costs are not plotted.</desc>';
 s+=panel('elapsed',{x:10,y:10,w:1080,h:620},{...options,focus:true});
 s+=text(22,654,'L = log n · ℓ = log log n · ordered growth families, not numerical distances','mis-local-small');
 return s+text(22,675,'Sleeping results use total elapsed rounds · L² and Õ(L²) share a family; exact factors remain labeled','mis-local-small')+'</svg>';
}
function summarySVG(key,w,h,options={}){
 const levels=['overview','compact','detail'],available=w<220||h<140?0:w<650||h<420?1:2,requested=levels.indexOf(options.level),level=levels[Math.min(available,requested<0?available:requested)],tiny=level==='overview',rich=level==='detail';
 let s='<svg class="mis-local-summary" data-detail-level="'+level+'" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="xMidYMid meet" role="img" aria-label="MIS LOCAL elapsed-round bounds: green algorithms and red lower bounds.">';
 s+=panel('elapsed',{x:0,y:0,w,h:h-(rich?35:0)},{...options,tiny,rich});
 if(rich){s+=text(12,h-19,'L = log n · ℓ = log log n · dotted enclosures vary with Δ','mis-local-small');s+=text(12,h-6,'Sleeping costs are elapsed rounds · L² / Õ(L²) is a shared growth family','mis-local-small');}
 return s+'</svg>';
}
function mount(root,key='mis-local',options={}){
 for(const instance of instances)if(!instance.root.isConnected||instance.root===root)instance.destroy();
 const controller=new AbortController();let publication=options.publication||'all',selected=key.includes('awake')?'mis-local-ghaffari-portmann-awake':key.includes('degree')?'mis-local-rozhon-2020-randomized':key.includes('general-lower')?'mis-local-kmw-general-lower':'mis-local-ghaffari-grunau-2024';
 const opts=()=>({publication,selected}),prefix='mis-local-'+(++serial);
 root.classList.add('focus-view','mis-local-view');root.classList.toggle('f-embedded',!!options.embedded);root.setAttribute('aria-label','Maximal independent set LOCAL complexity landscape');
 root.innerHTML='<p class="f-kicker">MAXIMAL INDEPENDENT SET × LOCAL</p><header class="f-hero"><div><h1>How many rounds does an MIS need?</h1><p>Elapsed-round bounds across deterministic, randomized and sleeping setups.</p></div><div class="f-seal"><strong>Algorithms &amp; lower bounds</strong>Primary sources · '+esc(data.reviewedOn)+'</div></header><div class="f-scope"><span><b>Output</b> exact maximal independent set</span><span><b>Graph</b> n vertices, maximum degree Δ &lt; n</span><span><b>Ordinary LOCAL</b> unbounded messages</span></div><section class="mis-local-landscape" aria-labelledby="'+prefix+'-legend"><div class="mis-local-toolbar"><div class="mis-local-legend" id="'+prefix+'-legend"><span><i class="mis-local-key-upper"></i>Algorithm</span><span><i class="mis-local-key-lower"></i>Lower bound</span><span><i class="mis-local-key-history"></i>Historical algorithm</span><span class="mis-local-setup-det">Deterministic</span><span class="mis-local-setup-rand">Randomized</span><span class="mis-local-setup-degree">Degree-sensitive</span><span class="mis-local-setup-sleep">Sleeping CONGEST</span></div><label>Sources <select class="mis-local-publication" aria-label="MIS LOCAL publication filter"><option value="all">All verified sources</option><option value="published">Published only</option></select></label></div><div class="mis-local-scroll" tabindex="0" aria-label="MIS LOCAL figure; scroll horizontally on narrow screens"><div class="mis-local-plot"></div></div><div class="mis-local-notes"><p><b>Read the cost axis.</b> L = log n and ℓ = log log n. Distances are symbolic growth classes. A dotted segment encloses the degree-dependent expression as 1 ≤ Δ &lt; n varies; it does not claim every endpoint for a fixed degree. poly(ℓ) has no invented exponent.</p><p><b>Read the contract.</b> Randomized algorithms succeed globally with high probability; KMW16 is an expected-time lower bound. Every plotted cost is total elapsed rounds. Sleeping algorithms retain their CONGEST message restriction. The L² family contains both O(L²) and Õ(L²) bounds; exact factors stay labeled.</p></div></section><section class="mis-local-theorem" aria-live="polite" aria-label="Selected MIS LOCAL result"></section><details class="mis-local-evidence"><summary>All results, historical bounds &amp; source records</summary><div class="mis-local-list"></div></details><div class="f-bottom"><span>'+esc(data.coverageNote)+'</span><span>Select a point to inspect its exact formula and assumptions.</span></div>';
 function inspect(){const r=all(opts()).find(q=>q.id===selected);if(!r)return;root.querySelector('.mis-local-theorem').innerHTML='<div class="mis-local-theorem-top"><span class="mis-local-'+r.kind+'">'+(r.kind==='lower'?'Lower-bound theorem':'Algorithm guarantee')+'</span><strong>'+esc(r.shortLabel)+'</strong><span>'+esc(r.venue||'')+'</span></div><div class="mis-local-bound">'+math(r.exactBound||r.bound)+(r.panel==='elapsed'?' rounds':'')+'</div>'+(r.awake?'<p><b>Secondary theorem detail.</b> '+math(r.awake)+' awake rounds per node; not a plotted cost.</p>':'')+'<p><b>Contract.</b> '+esc(r.probability)+'. '+esc(r.resourceModel)+'.</p><p><b>Output.</b> '+esc(r.output)+'.</p><details><summary>Exact theorem, assumptions &amp; primary source</summary><h3>'+esc(r.title)+'</h3><p>'+esc((r.authors||[]).join(', '))+'</p><p><b>'+esc(r.theorem)+'</b></p><p>'+esc(r.notes)+'</p><p><a href="'+esc(r.fullTextUrl||r.url)+'" target="_blank" rel="noopener noreferrer">Read primary source ↗</a>'+(r.publicationUrl?' · <a href="'+esc(r.publicationUrl)+'" target="_blank" rel="noopener noreferrer">Publication ↗</a>':'')+'</p></details>'}
 function render(){const rows=all(opts());if(!rows.some(r=>r.id===selected))selected=rows[0]?.id;root.querySelector('.mis-local-publication').value=publication;root.querySelector('.mis-local-plot').innerHTML=diagramSVG(opts());root.querySelector('.mis-local-list').innerHTML=rows.map(r=>'<button type="button" class="mis-local-record" data-mis-local-result="'+esc(r.id)+'" aria-pressed="'+(r.id===selected)+'"><span class="mis-local-'+r.kind+'">'+esc(r.shortLabel)+(r.historical?' · historical':r.duplicateOf?' · source alias':'')+'</span><strong>'+math(r.bound)+'</strong><small>'+esc(r.probability)+'</small></button>').join('');inspect()}
 root.addEventListener('click',e=>{const el=e.target.closest('[data-mis-local-result]');if(el){selected=el.dataset.misLocalResult;render()}},{signal:controller.signal});
 root.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const el=e.target.closest('.mis-local-point');if(el){e.preventDefault();selected=el.dataset.misLocalResult;render()}},{signal:controller.signal});
 root.addEventListener('change',e=>{if(e.target.classList.contains('mis-local-publication')){publication=e.target.value;render();options.onPublicationChange?.(publication)}},{signal:controller.signal});
 render();const instance={root,settingKey:'mis-local',redraw:render,destroy(){controller.abort();root.classList.remove('mis-local-view');instances.delete(instance)}};instances.add(instance);return instance;
}
window.AtlasPairRenderers=window.AtlasPairRenderers||{};window.AtlasPairRenderers['mis-local']={mount,summarySVG,diagramSVG,records,release(root){for(const i of instances)if(!i.root.isConnected||i.root===root)i.destroy()}};
})();
