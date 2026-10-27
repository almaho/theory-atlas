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
function geometry(w,h,o={},focus=false){
 const available=w<420||h<360?0:w<650||h<440?1:2,levels=['overview','compact','detail'],requested=levels.indexOf(o.level),level=focus?'focus':levels[Math.min(available,requested<0?available:requested)];
 const tiny=level==='overview',compact=level==='compact',rr=records(o),pp=panels(o),W=Math.max(40,w),H=Math.max(40,h);
 const gap=tiny?Math.min(3,H*.02):focus?15:7,head=tiny?Math.min(3,H*.02):focus?62:compact?17:27,foot=tiny?Math.min(2,H*.01):focus?26:compact?8:13;
 const totalRows=pp.reduce((n,p)=>n+rr.filter(r=>r.panel===p.id).length,0),unit=Math.max(.05,(H-gap*(pp.length-1)-pp.length*(head+foot))/Math.max(1,totalRows));
 const left=tiny?W*.12:compact?W*.60:W*.73,right=W-(tiny?5:focus?30:12),budgetX=focus?270:W*.36;
 let y=0;const blocks=pp.map(p=>{
   const rows=rr.filter(r=>r.panel===p.id),top=y,height=head+foot+rows.length*unit,plotTop=top+head;
   const points=rows.map((r,i)=>({id:r.id,row:r,x:r.annotation?(tiny?left:left+4):p.type==='oracle'?(left+right)/2:left+(right-left)*Math.max(0,Math.min(1,((r.beta??.5)-.45)/.55)),y:plotTop+(i+.5)*unit}));
   y+=height+gap;return{panel:p,top,height,plotTop,axisY:top+height-foot+1,points};
 });
 return{w:W,h:H,level,focus,tiny,compact,unit,left,right,budgetX,blocks,points:blocks.flatMap(b=>b.points)};
}
function marker(p,g,o,interactive){
 const r=p.row,size=g.tiny?Math.max(1.2,Math.min(4,g.unit*.22)):g.compact?2.4:g.focus?5:3.3,x=p.x,y=p.y,lower=r.kind==='lower';
 let s=`<g class="mst-point" data-mst-result="${esc(r.id)}" data-kind="${r.kind}" data-panel="${r.panel}" data-annotation="${!!r.annotation}"${interactive?` role="button" tabindex="0" aria-pressed="${r.id===o.selected}"`:''} aria-label="${esc(r.shortLabel+'; '+r.ratioLabel+'; '+r.displayBound)}"><title>${esc(r.shortLabel+' · '+r.quality+' · '+r.displayBound)}</title>`;
 if(interactive)s+=`<circle class="mst-hit" cx="${x}" cy="${y}" r="16"/>`;
 if(interactive&&r.id===o.selected)s+=`<circle class="mst-halo" cx="${x}" cy="${y}" r="12"/>`;
 s+=lower?`<path class="mst-dot mst-lower" data-marker="lower" d="M${x} ${y-size}l${size} ${size}l-${size} ${size}l-${size} -${size}Z"/>`:`<circle class="mst-dot mst-upper${r.symbolic?' mst-symbolic':''}" cx="${x}" cy="${y}" r="${size}"/>`;
 if(r.symbolic){const dir=r.symbolic==='plus'?1:-1,len=g.tiny?3:g.compact?5:10;s+=`<path class="mst-symbolic-arrow" d="M${x+dir*(size+1)} ${y}h${dir*len}m${-dir*3} -2l${dir*3} 2l${-dir*3} 2"/>`;}
 return s+'</g>';
}
function chart(w,h,o={},interactive=false){
 const g=geometry(w,h,o,interactive),rr=records(o);let s=`<svg class="mst-${interactive?'map':'summary'}" viewBox="0 0 ${g.w} ${g.h}" data-detail-level="${g.level}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Stochastic ${weight(o.key||ID,o)==='weighted'?'weighted ':''}matching: approximation, exact query budgets and necessary budgets"><title>Stochastic matching algorithms and lower bounds</title><desc>Theorem rows are categorical. Green circles are algorithms; red diamonds state necessary resource budgets, not approximation ceilings. Open circles mark ε or δ reference positions, not numeric evaluations.</desc>`;
 if(!rr.length)return s+(g.tiny?'':text(g.w/2,g.h/2,'No sources match this filter.','muted','middle'))+'</svg>';
 for(const b of g.blocks){
  if(!b.points.length)continue;
  const oracle=b.panel.type==='oracle';
  s+=`<g data-stochastic-panel="${b.panel.id}">`;
  if(g.tiny)s+=`<rect x="1" y="${b.top+.3}" width="${g.w-2}" height="${Math.max(.1,b.height-.6)}" rx="2" class="mst-panel"/>`;
  if(!g.tiny){
   s+=`<rect x="1" y="${b.top+1}" width="${g.w-2}" height="${b.height-2}" rx="5" class="mst-panel"/>`;
   s+=text(g.focus?18:9,b.top+(g.focus?25:g.compact?12:15),b.panel.title,'heading');
   if(g.focus)s+=text(18,b.top+45,b.panel.note,'muted');
   if(!g.compact&&!oracle)s+=text(g.right,b.top+(g.focus?44:16),'Retained β →','axis-title','end');
  }
  for(const p of b.points){const r=p.row;
   if(r.annotation){
    if(g.tiny)s+=`<rect x="2" y="${p.y-g.unit*.34}" width="${g.w-4}" height="${g.unit*.68}" rx="1" class="mst-lower-band"/>`;
    if(!g.tiny){s+=`<rect x="${g.focus?12:5}" y="${p.y-g.unit*.38}" width="${g.w-(g.focus?24:10)}" height="${g.unit*.76}" rx="3" class="mst-lower-band"/>`;
     const caption=g.compact?r.budgetLabel:(r.ratioLabel+' '+r.budgetLabel);
     s+=text(g.focus?28:12,p.y+(g.focus?5:3),caption,'lower-note');
     if(g.focus)s+=text(g.right,p.y+5,r.shortLabel,'lower-label','end');
    }
   }else{
    if(g.tiny&&!oracle)s+=line(g.left,p.y,g.right,p.y,'grid');
    if(!g.tiny){
     const label=g.compact?(r.sourceId.startsWith('azarmehr')?'ABGR ’25':r.sourceId.toUpperCase()):r.shortLabel;
     if(g.focus&&r.sourceId.startsWith('azarmehr')&&label.length>38)s+=text(18,p.y-4,'Azarmehr–Behnezhad','paper')+text(18,p.y+12,'Ghafari–Rubinfeld ’25','paper');
     else s+=text(g.focus?18:9,p.y+(g.focus?5:3),label,'paper');
     if(!g.compact)s+=text(g.budgetX,p.y+(g.focus?5:3),r.budgetLabel,'budget');
     if(!oracle)s+=line(g.left,p.y,g.right,p.y,'grid');
     const anchor=p.x>g.right-60?'end':'start',labelX=p.x+(anchor==='end'?-13:13);
     if(oracle)s+=text(g.right,p.y+(g.focus?5:3),r.ratioLabel,'ratio','end');
     else if(!g.compact||g.unit>16)s+=text(labelX,p.y+(g.focus?5:3),r.ratioLabel,'ratio',anchor);
    }
   }
   // Resource lower bounds are attached to the row, never placed on the β axis.
   s+=marker(p,g,o,interactive);
  }
  if(!oracle){
   s+=line(g.left,b.axisY,g.right,b.axisY);
   if(!g.tiny&&!g.compact)for(const beta of [.5,.75,1]){const x=g.left+(g.right-g.left)*(beta-.45)/.55;s+=text(x,b.axisY+(g.focus?17:10),beta===1?'1':String(beta),'tick','middle');}
  }
  s+='</g>';
 }
 return s+'</svg>';
}
function diagramSVG(a={},b={}){const o=typeof a==='string'?{...b,key:a}:a||{},pp=panels(o),n=records(o).length;return chart(1100,pp.length*103+n*40,o,true);}
function summarySVG(key,w,h,o={}){return chart(w,h,{...o,key});}
function release(root){for(const i of instances)if(!i.root.isConnected||i.root===root)i.destroy();}
function mount(root,key=ID,options={}){
 release(root);for(const name of ['StreamingMatching','DynamicMatching','LCAMatching','LocalMatching','MPCMatching','ListQueryMatching'])window[name]?.release(root);
 for(const[id,renderer]of Object.entries(window.AtlasPairRenderers||{}))if(id!==ID)renderer.release?.(root);
 const controller=new AbortController(),weighting=weight(key,options);let publication=options.publication||'all',selected=weighting==='weighted'?'stochastic-ds25-weighted-general':'stochastic-abgr25-near-optimal';
 root.classList.add('focus-view','mst-view');root.classList.toggle('f-embedded',!!options.embedded);root.setAttribute('aria-label','Stochastic matching guarantees and query budgets');
 root.innerHTML=`<p class="f-kicker">${weighting==='weighted'?'WEIGHTED MATCHING':'MATCHING'} × STOCHASTIC</p><header class="f-hero"><div><h1>More matching from fewer tests.</h1><p>${weighting==='weighted'?'Edge-weighted':'Unweighted'} graphs · independent edge realizations · adaptive and non-adaptive tests.</p></div></header><div class="mst-toolbar"><div class="mst-legend"><span><i class="mst-key-upper"></i>Algorithm</span><span><i class="mst-key-lower"></i>Necessary budget</span><span><i class="mst-key-symbolic"></i>Symbolic ε / δ anchor</span></div><label>Sources <select class="mst-publication" aria-label="Stochastic matching publication filter"><option value="all">All reviewed sources</option><option value="published">Published only</option></select></label></div><div class="mst-setup-legend"><span>General graphs</span><span>Bipartite graphs</span><span>Adaptive tests</span><span>Separate resource model</span></div><div class="mst-scroll" tabindex="0" aria-label="Stochastic matching figure; horizontal scrolling on narrow screens"><div class="mst-plot"></div></div><div class="mst-notes"><p><b>Read each row as a theorem.</b> The left formula is its query budget; the green marker is its retained fraction. Open markers indicate ½±δ, 1−ε or another symbolic limit. Their position does not evaluate ε.</p><p><b>Red rows bound resources.</b> Necessary degree for a target approximation is shown beside the algorithms. It is not a ceiling on their approximation. Every source keeps its graph and probability assumptions.</p></div><section class="mst-theorem" aria-live="polite" aria-label="Selected stochastic theorem"></section><details class="mst-evidence"><summary>Every result and its paper</summary><div class="mst-records"></div></details><p class="mst-coverage">${esc(data.coverageNote)}</p>`;
 const opts=()=>({key,weighting,publication,selected});
 function render(){const rr=records(opts());if(!rr.some(r=>r.id===selected))selected=rr[0]?.id;
  root.querySelector('.mst-publication').value=publication;root.querySelector('.mst-plot').innerHTML=diagramSVG(opts());
  root.querySelector('.mst-records').innerHTML=rr.map(r=>`<button type="button" data-mst-result="${esc(r.id)}" class="mst-record" aria-pressed="${selected===r.id}"><span class="mst-${r.kind}-label">${esc(r.shortLabel)} · ${r.kind==='lower'?'Necessary budget':'Algorithm'}</span><strong>${esc(r.quality)}</strong><small>${esc(r.bound)}</small></button>`).join('');
  const r=rr.find(r=>r.id===selected),el=root.querySelector('.mst-theorem');if(!r){el.innerHTML='<p>No sources match this filter.</p>';return;}
  el.innerHTML=`<div class="mst-detail-head"><strong class="mst-${r.kind}-label">${r.kind==='lower'?'Lower bound · necessary budget':'Algorithm upper bound'}</strong><span>${esc(r.shortLabel)}</span></div><h2>${esc(r.bound)}</h2><p><b>Guarantee.</b> ${esc(r.guarantee)}</p><p><b>Access.</b> ${esc(r.oracle)}</p><p><b>Probability.</b> ${esc(r.probability)}</p><p>${esc(r.notes)}</p><p><a href="${esc(r.sourceUrl)}" target="_blank" rel="noopener noreferrer">Read primary paper ↗</a>${r.doi?` · <a href="https://doi.org/${esc(r.doi)}" target="_blank" rel="noopener noreferrer">Published paper ↗</a>`:''}</p><details><summary>Theorem and assumptions</summary><h3>${esc(r.title)}</h3><p>${esc(r.authors.join(', '))} · ${esc(r.venue)}</p><p><b>${esc(r.theorem)}</b></p><p><b>Graph.</b> ${esc(r.graph)}</p><p><b>Output.</b> ${esc(r.output)}</p></details>`;
 }
 function select(e){const b=e.target.closest('[data-mst-result]');if(b&&records(opts()).some(r=>r.id===b.dataset.mstResult)){selected=b.dataset.mstResult;render();}}
 root.addEventListener('click',select,{signal:controller.signal});root.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const b=e.target.closest('.mst-point');if(b){e.preventDefault();select(e);}}},{signal:controller.signal});
 root.addEventListener('change',e=>{if(e.target.classList.contains('mst-publication')){publication=e.target.value;render();options.onPublicationChange?.(publication);}},{signal:controller.signal});
 render();const instance={root,settingKey:key,redraw:render,destroy(){controller.abort();root.classList.remove('mst-view');instances.delete(instance);}};instances.add(instance);return instance;
}
window.AtlasPairRenderers=window.AtlasPairRenderers||{};window.AtlasPairRenderers[ID]={mount,diagramSVG,summarySVG,records,release,layoutGeometry:geometry};
})();
