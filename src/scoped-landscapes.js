(()=>{
'use strict';
if(window.AtlasScopedLandscapes)return;
const payload=JSON.parse(document.getElementById('atlas-data').textContent);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const math=s=>esc(s).replace(/\^\{([^{}]*)\}/g,'<tspan baseline-shift="super" font-size=".75em">$1</tspan>');
const tx=(x,y,s,cls='',anchor='start')=>'<text x="'+x+'" y="'+y+'" class="sl-'+cls+'" text-anchor="'+anchor+'">'+math(s)+'</text>';
const ln=(x,y,X,Y,cls='grid')=>'<line x1="'+x+'" y1="'+y+'" x2="'+X+'" y2="'+Y+'" class="sl-'+cls+'"/>';
const colors=['#9bb8e8','#c4a6dd','#e1bb79','#8fc4bd'];
const instances=new Set();
function wrap(s,max=56){const a=String(s).split(' '),out=[];let line='';for(const w of a){if(line.length+w.length+1>max&&line){out.push(line);line=w;}else line+=(line?' ':'')+w;}if(line)out.push(line);return out;}
function panelX(p,at,left,right){if(p.categories){const i=p.categories.findIndex(c=>c.id===at);return left+(right-left)*(i+.5)/p.categories.length;}return left+(right-left)*(at-p.min)/(p.max-p.min);}
function mark(r,x,y,size,interactive,selected){const lower=r.kind==='lower';return '<g class="sl-marker '+(lower?'sl-lower':'sl-upper')+(r.limit?' sl-limit':'')+'" data-scope-result="'+esc(r.id)+'" data-row-ids="'+esc(r.supportingPaper?.id||'')+'" data-kind="'+(lower?'lower':'upper')+'" data-point-x="'+x+'" data-point-y="'+y+'"'+(interactive?' role="button" tabindex="0" aria-pressed="'+(selected===r.id)+'"':'')+' aria-label="'+esc(r.setup+'; '+r.displayBound+'; '+r.shortLabel)+'"><title>'+esc(r.displayBound+' · '+r.quality+' · '+r.probability)+'</title>'+(lower?'<path d="M'+x+' '+(y-size)+'l'+size+' '+size+' -'+size+' '+size+' -'+size+' -'+size+'Z"/>':'<circle cx="'+x+'" cy="'+y+'" r="'+size+'"/>')+'</g>';}
function release(root){for(const i of instances)if(!i.root.isConnected||i.root===root)i.destroy();}
for(const [ID,data] of Object.entries(payload.focus).filter(([,d])=>d.renderer==='scoped-landscape')){
 const records=(o={})=>data.verifiedRecords.map(r=>({...data.sources[r.sourceId],...r})).filter(r=>o.publication!=='published'||r.publicationStatus!=='preprint');
 const allRecords=(o={})=>[...data.verifiedRecords,...(data.relatedResults||[])].map(r=>({...data.sources[r.sourceId],...r})).filter(r=>o.publication!=='published'||r.publicationStatus!=='preprint');
 function panelRows(p,o){return records(o).filter(r=>r.panel===p.id);}
 function full(o={}){
  const rows=records(o),heights=data.panels.map(p=>120+Math.max(1,panelRows(p,o).length)*46),H=54+heights.reduce((a,b)=>a+b,0);
  let s='<svg class="sl-map" viewBox="0 0 1100 '+H+'" data-detail-level="detail" role="img" aria-label="'+esc(data.title+'; algorithms green and scoped lower bounds red')+'">';
  s+=tx(24,25,'● Algorithm    ◇ Lower bound / obstruction    ○ Asymptotic reference; exact formula beside marker','legend');
  let top=44;
  data.panels.forEach((p,i)=>{
   const rr=panelRows(p,o),h=heights[i],left=280,right=690,bottom=top+h-46;
   s+='<rect class="sl-panel" x="8" y="'+top+'" width="1084" height="'+(h-12)+'" rx="9"/><rect x="8" y="'+top+'" width="4" height="'+(h-12)+'" fill="'+colors[i%4]+'"/>';
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
   return {panel:p,top,bottom,left,right,rows:rr,points:rr.map((r,j)=>({id:r.id,x:panelX(p,r.at,left,right),y:top+(level==='overview'?5:22)+(bottom-top-(level==='overview'?12:36))*(j+.5)/Math.max(rr.length,1)}))};
  });
  return {level,panels,points:panels.flatMap(p=>p.points)};
 }
 function summarySVG(key,w,h,o={}){
  const g=geometry(w,h,o),tiny=g.level==='overview',detail=g.level==='detail';
  let s='<svg class="sl-summary" viewBox="0 0 '+w+' '+h+'" data-detail-level="'+g.level+'" role="img" aria-label="'+esc(data.title)+'"><desc>'+esc(data.axisNote)+'</desc>';
  g.panels.forEach((z,i)=>{
   const p=z.panel,axisY=z.bottom-4;
   s+='<rect class="sl-panel" x="3" y="'+z.top+'" width="'+(w-6)+'" height="'+(z.bottom-z.top)+'" rx="4"/>';
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
  root.classList.add('focus-view','sl-view');root.classList.toggle('f-embedded',!!options.embedded);
  root.innerHTML='<p class="f-kicker">'+esc(data.problemLabel+' × '+data.modelLabel)+'</p><header class="f-hero"><div><h1>'+esc(data.title)+'</h1><p>'+esc(data.subtitle)+'</p></div></header><div class="sl-toolbar"><span><b class="sl-green">● Algorithms</b> · <b class="sl-red">◇ Lower bounds</b> · colors on panel edges distinguish setups</span><label>Sources <select class="sl-publication" aria-label="Sources for '+esc(data.title)+'"><option value="all">All reviewed sources</option><option value="published">Published only</option></select></label></div><div class="sl-scroll" tabindex="0" aria-label="Figure; scroll horizontally on narrow screens"><div class="sl-plot"></div></div><p class="sl-axis-note">'+esc(data.axisNote)+'</p><section class="sl-inspector" aria-live="polite" aria-label="Selected theorem"></section><div class="sl-related"></div><p class="sl-coverage">'+esc(data.coverageNote)+'</p>';
  function inspect(){
   const r=allRecords({publication}).find(r=>r.id===selected),box=root.querySelector('.sl-inspector');
   if(!r){box.innerHTML='<p>No result matches the source filter.</p>';return;}
   box.innerHTML='<div class="sl-detail-head"><b class="'+(r.kind==='lower'?'sl-red':'sl-green')+'">'+(r.kind==='lower'?'Lower bound / obstruction':'Algorithm')+'</b><span>'+esc(r.shortLabel)+(r.publicationStatus==='preprint'?' · PREPRINT':'')+'</span></div><h2>'+esc(r.displayBound)+'</h2><p><b>Guarantee.</b> '+esc(r.quality)+'</p><p><b>Input.</b> '+esc(r.graph)+'</p><p><b>Output.</b> '+esc(r.output)+'</p><p><b>Probability / adversary.</b> '+esc(r.probability)+'</p><p>'+esc(r.notes||'')+'</p><p><b>Theorem.</b> '+esc(r.theorem)+'</p><p><a href="'+esc(r.sourceUrl||r.url)+'" target="_blank" rel="noopener noreferrer">'+esc(r.title)+' ↗</a></p>'+(r.verificationUrl?'<p><a href="'+esc(r.verificationUrl)+'" target="_blank" rel="noopener noreferrer">Exact bound verification in the later paper ↗</a></p>':'')+(r.computation?'<p><b>Computation.</b> '+esc(r.computation)+'</p>':'')+'<p class="sl-verification">Primary statement checked '+esc(data.reviewedOn)+'. '+(r.publicationStatus==='preprint'?'Preprint theorem statement inspected; proof not independently validated.':'')+'</p>';
  }
  function render(){
   const rr=allRecords({publication});if(!rr.some(r=>r.id===selected))selected=rr[0]?.id;
   root.querySelector('.sl-publication').value=publication;
   root.querySelector('.sl-plot').innerHTML=full({publication,selected});
   root.querySelector('.sl-related').innerHTML=(data.relatedResults||[]).filter(r=>publication!=='published'||r.publicationStatus!=='preprint').map(r=>'<button type="button" data-scope-result="'+esc(r.id)+'"><small>Related setup</small><strong>'+esc(r.setup)+'</strong><span>'+esc(r.displayBound)+'</span></button>').join('');
   inspect();
  }
  function select(e){const b=e.target.closest('[data-scope-result]');if(b&&allRecords({publication}).some(r=>r.id===b.dataset.scopeResult)){selected=b.dataset.scopeResult;render();}}
  root.addEventListener('click',select,{signal:controller.signal});
  root.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.closest('[data-scope-result]')){e.preventDefault();select(e);}},{signal:controller.signal});
  root.addEventListener('change',e=>{if(e.target.classList.contains('sl-publication')){publication=e.target.value;render();options.onPublicationChange?.(publication);}},{signal:controller.signal});
  render();const instance={root,settingKey:ID,redraw:render,destroy(){controller.abort();root.classList.remove('sl-view');instances.delete(instance);}};instances.add(instance);return instance;
 }
 window.AtlasPairRenderers=window.AtlasPairRenderers||{};
 window.AtlasPairRenderers[ID]={mount,diagramSVG:(a={},b={})=>full(typeof a==='string'?b:a),summarySVG,records,release,layoutGeometry:geometry};
}
window.AtlasScopedLandscapes={release};
})();