(()=>{
'use strict';
const ID='mis-query_matrix',data=JSON.parse(document.getElementById('atlas-data').textContent).focus[ID];
if(!data)return;
const instances=new Set();let serial=0;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=(x,y,s,cls='',anchor='start',extra='')=>'<text x="'+x+'" y="'+y+'" class="'+cls+'" text-anchor="'+anchor+'" '+extra+'>'+esc(s)+'</text>';
const records=(o={})=>data.verifiedRecords.map(r=>({...data.sources[r.sourceId],...r})).filter(r=>o.publication!=='published'||r.publicationStatus!=='preprint');
function chart(w,h,o={},focus=false){
 const levels=['overview','compact','detail'],available=w<250||h<150?0:w<640||h<350?1:2,requested=levels.indexOf(o.level),level=focus?'detail':levels[Math.min(available,requested<0?available:requested)],tiny=level==='overview',detail=level==='detail';
 const l=tiny?9:detail?Math.min(92,w*.13):26,r=w-(tiny?9:detail?28:14),gap=tiny?18:detail?Math.min(86,w*.10):28,pw=(r-l-gap)/2,t=tiny?14:detail?116:45,b=h-(tiny?10:detail?100:32);
 const px=(panel,a)=>l+(panel==='explicit'?pw+gap:0)+a/.5*pw,py=p=>b-(p-1.4)/.72*(b-t),rows=records(o),setColor=p=>p==='explicit'?'var(--miqm-explicit)':'var(--blue)';
 let s='<svg class="'+(focus?'miqm-map':'miqm-summary')+'" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="xMidYMid meet" data-detail-level="'+level+'" role="img" aria-label="Two aligned MIS adjacency-matrix panels: scalar estimation precision versus query cost, and tight quadratic explicit construction."><title>MIS: precision and output contract</title><desc>The size panel shows an upper bound only: min of the theorem Õ(n^(3/2)/epsilon²) and a full scan O(n²). The separate explicit-output panel has matching O(n²) and Omega(n²) bounds. Precision epsilon equals one quarter times n to the minus a. This is an exponent scale, suppressing constants and logarithms.</desc>';
 if(!rows.length)return s+(tiny?'':text(w/2,h/2,'No sources match this filter.','miqm-muted','middle'))+'</svg>';
 if(!tiny){s+=text(detail?24:12,detail?29:17,'Precision × output contract','miqm-heading');if(detail)s+=text(24,52,'One oracle and one query-cost scale; two different outputs.','miqm-muted')+text(l,t-20,'Y · pair queries','miqm-axis-title','start','data-axis="y"');}
 for(const panel of ['estimate','explicit']){
  const x0=px(panel,0),x1=px(panel,.5);
  s+='<g data-panel="'+panel+'" data-axis-x-min="0" data-axis-x-max="0.5" data-axis-y-min="1.4" data-axis-y-max="2.12">';
  if(!tiny)s+=text(x0,detail?81:35,detail?(panel==='estimate'?'Estimate |RGMIS(π)|':'Output the MIS vertices'):(panel==='estimate'?'Size estimate':'Explicit vertices'),'miqm-panel-title miqm-setup-'+panel);
  for(const p of [1.5,1.75,2]){
   const y=py(p);s+='<path d="M'+x0+' '+y+'H'+x1+'" class="miqm-grid"/>';
   if(detail&&panel==='estimate')s+=text(x0-12,y+4,{'1.5':'n³ᐟ²','1.75':'n⁷ᐟ⁴','2':'n²'}[p],'miqm-tick','end');
  }
  for(const a of [0,.25,.5]){
   const x=px(panel,a);s+='<path d="M'+x+' '+t+'V'+b+'" class="miqm-grid"/>';
   if(detail)s+=text(x,b+25,{'0':'¼','0.25':'¼n⁻¹ᐟ⁴','0.5':'¼n⁻¹ᐟ²'}[a],'miqm-tick','middle');
  }
  s+='<path d="M'+x0+' '+t+'V'+b+'H'+x1+'" class="miqm-axis"/>';
  for(const row of rows.filter(r=>r.panel===panel)){
   const lower=row.kind==='lower',color=lower?'var(--red)':'var(--green)',domain=row.curve.domain,coords=domain.map(a=>[px(panel,a),py(row.curve.queryExponent==='3/2+2a'?1.5+2*a:2)]),path='M'+coords.map(p=>p.join(' ')).join('L'),aria=focus?' tabindex="0" role="button" aria-pressed="'+(row.id===o.selected)+'"':'';
   s+='<g class="miqm-result miqm-'+row.kind+'" data-miqm-result="'+esc(row.id)+'" data-kind="'+row.kind+'" data-setup="'+panel+'"'+aria+' aria-label="Inspect '+esc(row.displayBound)+' for '+(panel==='estimate'?'scalar size estimation':'explicit MIS construction')+'">';
   if(!lower)s+='<path d="'+path+'" fill="none" stroke="'+setColor(panel)+'" stroke-width="7" opacity=".23"/>';
   s+='<path data-boundary="'+esc(row.id)+'" d="'+path+'" fill="none" stroke="'+color+'" stroke-width="'+(lower?1.8:2.8)+'"'+(lower?' stroke-dasharray="5 4"':row.derived?' stroke-dasharray="3 3"':'')+'/>';
   const aa=panel==='explicit'?[0,.25,.5]:row.derived?[.375,.5]:[0,.125,.25];
   for(const a of aa){
    const x=px(panel,a),p=row.curve.queryExponent==='3/2+2a'?1.5+2*a:2,y=py(p),radius=tiny?2.8:detail?5:3.3;
    if(lower){const d=radius+3;s+='<path data-marker="lower" data-a="'+a+'" data-p="'+p+'" data-center-x="'+x+'" data-center-y="'+y+'" d="M'+x+' '+(y-d)+'L'+(x+d)+' '+y+'L'+x+' '+(y+d)+'L'+(x-d)+' '+y+'Z" fill="none" stroke="'+color+'" stroke-width="1.8"/>'}
    else s+='<circle data-marker="algorithm" data-a="'+a+'" data-p="'+p+'" data-center-x="'+x+'" data-center-y="'+y+'" cx="'+x+'" cy="'+y+'" r="'+radius+'" fill="'+color+'"/>';
   }
   s+='</g>';
  }
  if(detail){
   if(panel==='estimate'){
    s+=text(px(panel,.10),py(1.75)-16,'Õ(n³ᐟ²/ε²)','miqm-bound-label miqm-algorithm','middle')+text(x1,py(2)-17,'O(n²) scan cap','miqm-bound-label miqm-algorithm','end')+text(x0+12,py(1.5)+26,'ε = ¼ reference','miqm-muted')+text((x0+x1)/2,b+53,'X · ε decreases → tighter estimate','miqm-axis-title','middle','data-axis="x"')+text((x0+x1)/2,b+75,'No estimation lower bound in this source.','miqm-muted','middle');
   }else{
    s+=text((x0+x1)/2,py(2)-17,'O(n²) full scan','miqm-bound-label miqm-algorithm','middle')+text((x0+x1)/2,py(2)+29,'Ω(n²) · explicit output only','miqm-bound-label miqm-lower','middle')+text((x0+x1)/2,b+53,'Same ε reference · output stays exact','miqm-axis-title','middle','data-axis="x"')+text((x0+x1)/2,b+75,'Both bounds are independent of ε.','miqm-muted','middle');
   }
  }else if(!tiny){
   s+=text(x1,b+20,'ε ↓','miqm-muted','end');
   if(w>=380)s+=text((x0+x1)/2,panel==='estimate'?py(1.5)-14:py(2)+22,panel==='estimate'?'min{Õ(n³ᐟ²/ε²), n²}':'Θ(n²) explicit','miqm-compact-formula','middle');
  }
  s+='</g>';
 }
 if(detail)s+=text(w/2,h-7,'Exponent scale · logarithms and constants suppressed','miqm-muted','middle');
 return s+'</svg>';
}
function diagramSVG(a={},b={}){return chart(1000,600,typeof a==='string'?b:a,true)}
function summarySVG(key,w,h,options={}){return chart(w,h,options,false)}
function release(root){for(const i of instances)if(!i.root.isConnected||i.root===root)i.destroy()}
function mount(root,key=ID,options={}){
 release(root);for(const name of ['StreamingMatching','DynamicMatching','LCAMatching','LocalMatching','MPCMatching','ListQueryMatching'])window[name]?.release(root);
 for(const [id,r] of Object.entries(window.AtlasPairRenderers||{}))if(id!==ID)r.release?.(root);
 const controller=new AbortController(),uid='miqm-'+(++serial);let publication=options.publication||'all',selected=records({publication})[0]?.id;
 const opts=()=>({publication,selected});
 root.classList.add('focus-view','miqm-view');root.classList.toggle('f-embedded',!!options.embedded);root.setAttribute('aria-label','MIS adjacency-matrix algorithms and lower bounds');
 root.innerHTML='<p class="f-kicker">MAXIMAL INDEPENDENT SET × ADJACENCY-MATRIX QUERIES</p><header class="f-hero"><div><h1>Precision and output change the query cost</h1><p>Compare scalar size estimates with exact explicit construction on aligned query-cost axes.</p></div></header><div class="miqm-toolbar"><div class="miqm-legend" id="'+uid+'"><span><i class="miqm-key-alg"></i>Algorithm upper bound</span><span><i class="miqm-key-lower"></i>Lower bound</span><span class="miqm-setup-estimate"><i class="miqm-key-estimate"></i>Size estimate</span><span class="miqm-setup-explicit"><i class="miqm-key-explicit"></i>Explicit vertices</span></div><label>Sources <select class="miqm-publication" aria-label="MIS adjacency-matrix publication filter"><option value="all">All verified sources</option><option value="published">Published only</option></select></label></div><div class="miqm-scroll" tabindex="0" aria-label="Shared MIS cost figure; scroll horizontally on narrow screens"><div class="miqm-plot"></div></div><div class="miqm-notes"><p><b>Precision.</b> Set ε = (1/4)n<sup>−a</sup>. The leftmost point is the labelled fixed ε = 1/4 reference; moving right asks for more accuracy. The theorem gives exponent 3/2 + 2a.</p><p><b>Scan cap.</b> An elementary full scan computes a greedy MIS for its own generated π and counts exactly. The size upper bound is min{Õ(n³ᐟ²/ε²), O(n²)}. Logs and constants are suppressed; the breakpoint is an exponent comparison.</p><p><b>Output matters.</b> Only the explicit-vertices panel has the Ω(n²) lower bound. RGMIS means a random greedy <em>maximal</em> independent set. Its scalar estimate is neither a maximum-independent-set estimate nor an expectation over π.</p></div><section class="miqm-theorem" aria-live="polite" aria-label="Selected MIS adjacency-matrix theorem"></section><div class="miqm-records" aria-label="Inspect primary statements and elementary baselines"></div><p class="miqm-coverage">'+esc(data.coverage)+'</p>';
 function inspect(){
  const r=records(opts()).find(r=>r.id===selected),el=root.querySelector('.miqm-theorem');if(!r){el.innerHTML='<p>No results match this filter.</p>';return}
  el.innerHTML='<div class="miqm-detail-top"><strong class="miqm-'+r.kind+'">'+(r.kind==='lower'?'Lower-bound statement':'Algorithm guarantee')+'</strong><span>'+esc(r.derived?'Elementary baseline':r.shortLabel)+'</span></div><div class="miqm-detail-grid"><div><small>Pair-query cost</small><strong>'+esc(r.displayBound)+'</strong></div><div><small>Output</small><strong>'+esc(r.output)+'</strong></div></div><p><b>Graph and access.</b> '+esc(r.graph)+' · '+esc(r.oracle)+'</p><p><b>Guarantee.</b> '+esc(r.quality)+'</p><p><b>Correctness.</b> '+esc(r.probability)+'</p><p>'+esc(r.notes)+'</p><details><summary>Theorem, assumptions and primary source</summary><h3>'+esc(r.title)+'</h3><p>'+esc((r.authors||[]).join(', '))+'</p><p><b>'+esc(r.theorem)+'</b></p><p>'+esc(r.assumptions.join('; '))+'</p><p><a href="'+esc(r.sourceUrl||r.fullTextUrl||r.url)+'" target="_blank" rel="noopener noreferrer">Read primary statement ↗</a> · <a href="'+esc(r.publicationUrl||r.url)+'" target="_blank" rel="noopener noreferrer">Publication ↗</a></p></details>';
 }
 function render(){const rr=records(opts());if(!rr.some(r=>r.id===selected))selected=rr[0]?.id;root.querySelector('.miqm-publication').value=publication;root.querySelector('.miqm-plot').innerHTML=diagramSVG(opts());root.querySelector('.miqm-records').innerHTML=rr.map(r=>'<button class="miqm-record miqm-'+r.kind+'" type="button" data-miqm-result="'+esc(r.id)+'" aria-pressed="'+(r.id===selected)+'"><span>'+esc(r.kind==='lower'?'Lower bound':'Algorithm')+'</span><strong>'+esc(r.displayBound)+'</strong><small>'+esc((r.setup==='estimate'?'Size estimate':'Explicit vertices')+' · '+(r.derived?'Derived baseline':r.shortLabel))+'</small></button>').join('');inspect()}
 root.addEventListener('click',e=>{const b=e.target.closest('[data-miqm-result]');if(b){selected=b.dataset.miqmResult;render()}},{signal:controller.signal});
 root.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const b=e.target.closest('.miqm-result');if(b){e.preventDefault();selected=b.dataset.miqmResult;render()}},{signal:controller.signal});
 root.addEventListener('change',e=>{if(e.target.classList.contains('miqm-publication')){publication=e.target.value;render();options.onPublicationChange?.(publication)}},{signal:controller.signal});
 render();const instance={root,settingKey:ID,redraw:render,destroy(){controller.abort();root.classList.remove('miqm-view');instances.delete(instance)}};instances.add(instance);return instance;
}
window.AtlasPairRenderers=window.AtlasPairRenderers||{};window.AtlasPairRenderers[ID]={mount,diagramSVG,summarySVG,records,release};
})();
