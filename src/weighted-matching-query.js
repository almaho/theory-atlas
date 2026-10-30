/* Weighted query access: separate explicit-output and additive-estimation panels. */
(()=>{
'use strict';
if(window.AtlasWeightedMatchingQueries)return;
const payload=JSON.parse(document.getElementById('atlas-data').textContent);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const math=s=>esc(s).replace(/\^\{([^{}]*)\}/g,'<tspan baseline-shift="super" font-size=".75em">$1</tspan>');
const tx=(x,y,s,cls='',anchor='start')=>'<text x="'+x+'" y="'+y+'" class="wmq-'+cls+'" text-anchor="'+anchor+'">'+math(s)+'</text>';
const ln=(x,y,X,Y,cls='grid')=>'<line x1="'+x+'" y1="'+y+'" x2="'+X+'" y2="'+Y+'" class="wmq-'+cls+'"/>';
const colors=['#9bb8e8','#c4a6dd','#e1bb79','#8fc4bd'];
const instances=new Set();
function wrap(s,max=56){const a=String(s).split(' '),out=[];let line='';for(const w of a){if(line.length+w.length+1>max&&line){out.push(line);line=w;}else line+=(line?' ':'')+w;}if(line)out.push(line);return out;}
function panelX(p,at,left,right){if(p.categories){const i=p.categories.findIndex(c=>c.id===at);return left+(right-left)*(i+.5)/p.categories.length;}return left+(right-left)*(at-p.min)/(p.max-p.min);}
function mark(r,x,y,size,interactive,selected){const lower=r.kind==='lower';return '<g class="wmq-marker '+(lower?'wmq-lower':'wmq-upper')+(r.limit?' wmq-limit':'')+'" data-wmq-result="'+esc(r.id)+'" data-row-ids="'+esc(r.supportingPaper?.id||'')+'" data-kind="'+(lower?'lower':'upper')+'" data-point-x="'+x+'" data-point-y="'+y+'"'+(interactive?' role="button" tabindex="0" aria-pressed="'+(selected===r.id)+'"':'')+' aria-label="'+esc(r.setup+'; '+r.displayBound+'; '+r.shortLabel)+'"><title>'+esc(r.displayBound+' · '+r.quality+' · '+r.probability)+'</title>'+(lower?'<path d="M'+x+' '+(y-size)+'l'+size+' '+size+' -'+size+' '+size+' -'+size+' -'+size+'Z"/>':'<circle cx="'+x+'" cy="'+y+'" r="'+size+'"/>')+'</g>';}
function release(root){for(const i of instances)if(!i.root.isConnected||i.root===root)i.destroy();}
for(const [ID,data] of Object.entries(payload.focus).filter(([,d])=>d.renderer==='weighted-query-landscape')){
 const records=(o={})=>[...data.verifiedRecords,...(data.derivedBounds||[])].map(r=>({...data.sources[r.sourceId],...r})).filter(r=>o.publication!=='published'||r.publicationStatus!=='preprint');
 const allRecords=(o={})=>[...data.verifiedRecords,...(data.derivedBounds||[]),...(data.relatedResults||[])].map(r=>({...data.sources[r.sourceId],...r})).filter(r=>o.publication!=='published'||r.publicationStatus!=='preprint');
 function panelRows(p,o){return records(o).filter(r=>r.panel===p.id);}
 function full(o={}){
  const rows=records(o),heights=data.panels.map(p=>120+Math.max(1,panelRows(p,o).length)*46),H=54+heights.reduce((a,b)=>a+b,0);
  let s='<svg class="wmq-map" viewBox="0 0 1100 '+H+'" data-detail-level="detail" role="img" aria-label="'+esc(data.title+'; algorithms green and scoped lower bounds red')+'">';
  s+=tx(24,25,'● Algorithm    ◇ Lower bound (atlas proof)    Panel colors distinguish output contracts','legend');
  let top=44;
  data.panels.forEach((p,i)=>{
   const rr=panelRows(p,o),h=heights[i],left=280,right=690,bottom=top+h-46;
   s+='<rect class="wmq-panel" x="8" y="'+top+'" width="1084" height="'+(h-12)+'" rx="9"/><rect x="8" y="'+top+'" width="4" height="'+(h-12)+'" fill="'+colors[i%4]+'"/>';
   s+=tx(26,top+26,p.title,'heading');
   s+=tx(26,top+48,p.note,'note');
   if(!rr.length)s+=tx(280,top+83,'No sources match this filter.','note');
   const ticks=p.categories?p.categories.map(c=>({at:c.id,label:c.label})):p.ticks.map(t=>typeof t==='object'?t:{at:t,label:String(t)});
   ticks.forEach(t=>{const x=panelX(p,t.at,left,right);s+=ln(x,top+60,x,bottom)+tx(x,bottom+17,t.label,'tick','middle');});
   s+=ln(left,bottom,right,bottom,'axis')+tx((left+right)/2,bottom+35,p.xLabel,'axis-label','middle');
   rr.forEach((r,j)=>{const y=top+77+j*46,x=panelX(p,r.at,left,right);
    s+=ln(left,y,right,y,'row');
    wrap(r.setup,31).slice(0,2).forEach((v,k)=>s+=tx(26,y-3+k*15,v,'setup'));
    s+=mark(r,x,y,6,true,o.selected);
    wrap(r.plotLabel||r.displayBound,45).slice(0,2).forEach((v,k)=>s+=tx(720,y-3+k*14,v,r.kind==='lower'?'lower-label':'upper-label'));
    s+=tx(720,y+25,r.shortLabel+(r.publicationStatus==='preprint'?' · PREPRINT':''),'credit');
   });
   top+=h;
  });
  return s+'</svg>';
 }
 function geometry(w,h,o={}){
  const levels=['overview','compact','detail'],capacity=w<300||h<220?0:w<650||h<450?1:2,requested=levels.indexOf(o.level),level=levels[Math.min(capacity,requested<0?capacity:requested)];
  const panels=data.panels.map((p,i)=>{const ph=h/data.panels.length,top=i*ph+4,bottom=(i+1)*ph-8,left=level==='overview'?w*.10:w*.10,right=w*.94,rr=panelRows(p,o);
   return {panel:p,top,bottom,left,right,rows:rr,points:rr.map((r,j)=>({id:r.id,x:panelX(p,r.at,left,right),y:top+(level==='overview'?2:22)+(bottom-top-(level==='overview'?4:36))*(j+.5)/Math.max(rr.length,1)}))};
  });
  return {level,panels,points:panels.flatMap(p=>p.points)};
 }
 function summarySVG(key,w,h,o={}){
  const g=geometry(w,h,o),tiny=g.level==='overview',detail=g.level==='detail';
  let s='<svg class="wmq-summary" viewBox="0 0 '+w+' '+h+'" data-detail-level="'+g.level+'" role="img" aria-label="'+esc(data.title)+'"><desc>'+esc(data.axisNote)+'</desc>';
  g.panels.forEach((z,i)=>{
   const p=z.panel,axisY=z.bottom-4;
   s+='<rect class="wmq-panel" x="3" y="'+z.top+'" width="'+(w-6)+'" height="'+(z.bottom-z.top)+'" rx="4"/>';
   s+='<rect x="3" y="'+z.top+'" width="3" height="'+(z.bottom-z.top)+'" fill="'+colors[i%4]+'"/>';
   s+=ln(z.left,axisY,z.right,axisY,'axis');
   if(!tiny)s+=tx(9,z.top+14,p.shortTitle||p.title,'mini-title');
   z.rows.forEach((r,j)=>{const point=z.points[j];s+=ln(z.left,point.y,z.right,point.y,'row')+mark(r,point.x,point.y,tiny?2.2:3,false,o.selected);});
   if(!tiny){const ticks=p.categories?p.categories.map(c=>({at:c.id,label:c.short||c.label})):p.ticks.map(t=>typeof t==='object'?t:{at:t,label:String(t)});ticks.forEach(t=>s+=tx(panelX(p,t.at,z.left,z.right),z.bottom+6,t.label,'mini-tick','middle'));}
   if(detail&&z.rows.length<=3)z.rows.forEach((r,j)=>{const point=z.points[j],x=point.x>(z.left+z.right)/2?point.x-10:point.x+10;s+=tx(x,point.y+3,r.plotLabel||r.displayBound,'mini-result',point.x>(z.left+z.right)/2?'end':'start');});
  });
  return s+'</svg>';
 }
 function mount(root,key=ID,options={}){
  release(root);
  for(const name of ['StreamingMatching','DynamicMatching','LCAMatching','LocalMatching','MPCMatching','ListQueryMatching'])window[name]?.release(root);
  for(const [id,renderer]of Object.entries(window.AtlasPairRenderers||{}))if(id!==ID)renderer.release?.(root);
  const controller=new AbortController();let publication=options.publication||'all',selected=data.verifiedRecords[0]?.id;
  root.classList.add('focus-view','wmq-view');root.classList.toggle('f-embedded',!!options.embedded);
  root.innerHTML='<p class="f-kicker">'+esc(data.problemLabel+' × '+data.modelLabel)+'</p><header class="f-hero"><div><h1>'+esc(data.title)+'</h1><p>'+esc(data.subtitle)+'</p></div></header><div class="wmq-toolbar"><span><b class="wmq-green">● Algorithms</b> · <b class="wmq-red">◇ Lower bounds</b> · colors on panel edges distinguish setups</span><label>Sources <select class="wmq-publication" aria-label="Sources for '+esc(data.title)+'"><option value="all">All reviewed sources</option><option value="published">Published papers + atlas proofs</option></select></label></div><div class="wmq-scroll" tabindex="0" aria-label="Figure; scroll horizontally on narrow screens"><div class="wmq-plot"></div></div><p class="wmq-axis-note">'+esc(data.axisNote)+'</p><section class="wmq-inspector" aria-live="polite" aria-label="Selected theorem"></section><div class="wmq-related"></div><p class="wmq-coverage">'+esc(data.coverageNote)+'</p>';
  function inspect(){
   const r=allRecords({publication}).find(r=>r.id===selected),box=root.querySelector('.wmq-inspector');
   if(!r){box.innerHTML='<p>No result matches the source filter.</p>';return;}
   const detail=(label,value)=>value?'<p><b>'+esc(label)+'.</b> '+esc(value)+'</p>':'';
   box.innerHTML='<div class="wmq-detail-head"><b class="'+(r.kind==='lower'?'wmq-red':'wmq-green')+'">'+(r.kind==='lower'?'Lower bound · elementary atlas proof':'Algorithm')+'</b><span>'+esc(r.shortLabel)+'</span></div><h2>'+esc(r.displayBound)+'</h2>'+detail('Guarantee',r.quality)+detail('Input',r.graph)+detail('Oracle',r.oracle)+detail('Output',r.output)+detail('Probability',r.probability)+detail('Theorem',r.theorem)+detail(r.proof?'Proof':'Derivation and scope',r.proof||r.notes)+detail('Computation',r.computation)+detail('Verification status',r.proofStatus)+(r.sourceUrl||r.url?'<p><a href="'+esc(r.sourceUrl||r.url)+'" target="_blank" rel="noopener noreferrer">'+esc(r.title)+' ↗</a></p>':'<p>Elementary derivation; no separate paper is attributed.</p>');
  }
  function render(){
   const rr=allRecords({publication});if(!rr.some(r=>r.id===selected))selected=rr[0]?.id;
   root.querySelector('.wmq-publication').value=publication;
   root.querySelector('.wmq-plot').innerHTML=full({publication,selected});
   root.querySelector('.wmq-related').innerHTML=(data.relatedResults||[]).filter(r=>publication!=='published'||r.publicationStatus!=='preprint').map(r=>'<button type="button" data-wmq-result="'+esc(r.id)+'"><small>Related setup</small><strong>'+esc(r.setup)+'</strong><span>'+esc(r.displayBound)+'</span></button>').join('');
   inspect();
  }
  function select(e){const b=e.target.closest('[data-wmq-result]');if(b&&allRecords({publication}).some(r=>r.id===b.dataset.wmqResult)){selected=b.dataset.wmqResult;render();}}
  root.addEventListener('click',select,{signal:controller.signal});
  root.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.closest('[data-wmq-result]')){e.preventDefault();select(e);}},{signal:controller.signal});
  root.addEventListener('change',e=>{if(e.target.classList.contains('wmq-publication')){publication=e.target.value;render();options.onPublicationChange?.(publication);}},{signal:controller.signal});
  render();const instance={root,settingKey:ID,redraw:render,destroy(){controller.abort();root.classList.remove('wmq-view');instances.delete(instance);}};instances.add(instance);return instance;
 }
 window.AtlasPairRenderers=window.AtlasPairRenderers||{};
 window.AtlasPairRenderers[ID]={mount,diagramSVG:(a={},b={})=>full(typeof a==='string'?b:a),summarySVG,records,release,layoutGeometry:geometry};
}
window.AtlasWeightedMatchingQueries={release};
})();