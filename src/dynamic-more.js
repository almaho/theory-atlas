(()=>{
  'use strict';
  const KEY='matching-dynamic',P='pair-matching-dynamic',data=JSON.parse(document.getElementById('atlas-data').textContent).focus[KEY];
  const instances=new Set();let serial=0;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const merged=r=>({...data.sources[r.sourceId],...r});
  const records=(o={})=>data.verifiedRecords.map(merged).filter(r=>(o.publication!=='published'||r.publicationStatus!=='preprint')&&(!o.yearCutoff||r.year<=o.yearCutoff));
  const text=(x,y,s,c='',a='start')=>`<text x="${x}" y="${y}" class="${P}-${c}" text-anchor="${a}">${esc(s)}</text>`;
  const formula=(x,y,s,c='formula',a='end')=>text(x,y,s,c,a).replace(/\^\{([^{}]*)\}/g,'<tspan baseline-shift="super" font-size="70%">$1</tspan>');
  const htmlMath=s=>esc(s).replace(/\^\{([^{}]*)\}/g,'<sup>$1</sup>');
  function marker(x,y,r,small,selected){const red=r.kind==='lower',color=red?'var(--red,#bd4444)':'var(--green,#27805d)',size=small?2.8:5;return `${selected?`<circle cx="${x}" cy="${y}" r="11" fill="${color}" opacity=".15"/>`:''}${red?`<path data-marker="lower" data-center-x="${x}" data-center-y="${y}" d="M${x} ${y-size-1}l${size+1} ${size+1}l-${size+1} ${size+1}l-${size+1}-${size+1}Z" fill="${r.conditional?'none':color}" stroke="${color}" ${r.conditional?'stroke-dasharray="2 1"':''}/>`:`<circle data-marker="algorithm" data-center-x="${x}" data-center-y="${y}" cx="${x}" cy="${y}" r="${size}" fill="${color}"/>`}`;}
  function draw(w,h,o={},interactive=false){
    const levels=['overview','compact','detail'],available=w<220||h<140?0:w<420||h<240?1:2,requested=levels.indexOf(o.level),level=interactive?'detail':levels[Math.min(available,requested<0?available:requested)],tiny=level==='overview',rich=interactive||(level==='detail'&&w>=620&&h>=430),rows=records(o),panels=data.panels.map(p=>({...p,rows:rows.filter(r=>r.panel===p.id)})).filter(p=>p.rows.length).map(p=>tiny?{...p,rows:[p.rows.slice().sort((a,b)=>b.year-a.year)[0]]}:level==='compact'?{...p,rows:p.rows.slice().sort((a,b)=>b.year-a.year).slice(0,2)}:p),gap=tiny?2:rich?12:9,margin=tiny?3:rich?18:12,top=tiny?3:rich?24:18,usable=h-top-margin-gap*Math.max(0,panels.length-1),total=panels.reduce((n,p)=>n+p.rows.length+(tiny?.5:rich?2.4:1.7),0);
    let y=top,s=`<svg class="${P}-${interactive?'map':'summary'}" data-detail-level="${level}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Dynamic matching algorithms in five separate update regimes; symbolic time formulas and categorical randomization axes"><title>Dynamic matching: five distinct update regimes</title><desc>All verified points here are algorithms. The bounded source set contains no lower-bound theorem for these exact scopes. Symbolic formula rows do not rank m-sensitive or ORS-dependent bounds numerically. Maximality, approximation, adaptive and oblivious adversaries, and worst-case versus amortized time remain explicit.</desc>`;
    if(rich)s+=text(margin,13,'Y · SYMBOLIC UPDATE TIME','axis-title');
    if(!panels.length)return s+text(margin,32,'No sources match this filter.','empty')+'</svg>';
    for(const p of panels){
      const ph=usable*(p.rows.length+(tiny?.5:rich?2.4:1.7))/total,l=rich?w*.43:tiny?margin:w*.15,r=w-margin-3,titleY=y+(tiny?0:rich?9:4),gridTop=y+(tiny?2:rich?28:16),gridBottom=y+ph-(tiny?3:rich?22:13),lanes=[...new Set(p.rows.map(r=>r.displayBound))],rowY=i=>lanes.length===1?(gridTop+gridBottom)/2:gridTop+(gridBottom-gridTop)*i/(lanes.length-1),colX=c=>l+(r-l)*(p.columns.length===1?.34:p.columns.indexOf(c)===0?.22:.66);
      s+=`<g data-panel="${p.id}">`;
      if(!tiny)s+=text(margin,titleY,rich?p.title:p.shortTitle,'panel-title');
      if(interactive)s+=text(w-18,titleY,p.subtitle,'scope','end');
      s+=`<path d="M${l} ${gridTop-5}V${gridBottom+6}H${r}" class="${P}-axis"/>`;
      if(!tiny)for(const c of p.columns)s+=`<path d="M${colX(c)} ${gridTop-5}V${gridBottom+6}" class="${P}-guide"/>`;
      for(let i=0;i<lanes.length;i++){const yy=rowY(i);if(!tiny)s+=`<path d="M${l} ${yy}H${r}" class="${P}-grid"/>`;if(rich)s+=formula(l-13,yy+4,lanes[i]);}
      for(const rec of p.rows){const x=colX(rec.column),yy=rowY(lanes.indexOf(rec.displayBound)),kind=rec.kind==='lower'?'lower':'algorithm';s+=`<g class="${P}-point" data-matching-dynamic-result="${esc(rec.id)}" data-kind="${kind}" data-clock="${esc(rec.clock)}" data-adversary="${esc(rec.adversary)}" data-time-formula="${esc(rec.displayBound)}" ${interactive?`role="button" tabindex="0" aria-pressed="${o.selected===rec.id}"`:''} aria-label="${esc(rec.shortLabel)}: ${esc(rec.bound)}; ${esc(rec.quality)}; ${esc(rec.adversary)} adversary; ${esc(rec.clock)}"><title>${esc(rec.shortLabel)}: ${esc(rec.bound)}; ${esc(rec.quality)}; ${esc(rec.adversary)}; ${esc(rec.clock)}</title>${marker(x,yy,rec,!interactive,interactive&&o.selected===rec.id)}`;
        if(rich)s+=text(x+(interactive?13:7),yy+4,rec.shortLabel,'paper');
        s+='</g>';
      }
      if(!tiny)for(const c of p.columns){const label=rich?p.columnLabels[c]:(c==='randomized'?'Rand.':'Det.');s+=text(colX(c),gridBottom+(rich?20:13),label,'x-label','middle');}
      s+='</g>';y+=ph+gap;
    }
    return s+'</svg>';
  }
  const diagramSVG=(o={})=>draw(1100,850,o,true);
  const summarySVG=(key,w,h,o={})=>draw(w,h,o,false);
  function release(root){for(const i of [...instances])if(!i.root.isConnected||i.root===root)i.destroy();}
  function mount(root,key=KEY,o={}){
    release(root);for(const name of ['DynamicMatching','StreamingMatching','LCAMatching','LocalMatching','MPCMatching','ListQueryMatching'])window[name]?.release(root);
    for(const [name,renderer] of Object.entries(window.AtlasPairRenderers||{}))if(name!==KEY)renderer.release?.(root);
    const controller=new AbortController(),prefix=P+'-'+(++serial);let publication=o.publication||'all',selected=records(o).find(r=>r.sliceId===o.sliceId)?.id||records(o)[0]?.id;
    const opts=()=>({...o,publication,selected});root.classList.add('focus-view',P+'-view');root.classList.toggle('f-embedded',!!o.embedded);root.setAttribute('aria-label','Dynamic matching update regimes');
    root.innerHTML=`<p class="f-kicker">MATCHING × DYNAMIC / EXPLICIT EDGES</p><header class="f-hero"><div><h1>Which updates can matching handle?</h1><p>Five regimes, with each theorem’s exact time and adversary.</p></div></header><div class="f-scope"><span><b>Graph</b> general, unweighted</span><span><b>Updates</b> edge insertions &amp; deletions</span><span><b>Output</b> matching edges</span></div><section class="${P}-landscape"><div class="${P}-toolbar"><div class="${P}-legend"><span><i class="${P}-algorithm"></i>Algorithm</span><span><i class="${P}-lower"></i>Lower bound, when verified</span></div><label>Sources <select class="${P}-publication" aria-label="Dynamic regime publication filter"><option value="all">All verified sources</option><option value="published">Published only</option></select></label></div><div class="${P}-scroll" tabindex="0" aria-label="Dynamic matching figure; scroll horizontally on narrow screens"><div class="${P}-plot"></div></div><div class="${P}-notes"><p><b>Read the axes.</b> X identifies each algorithm’s randomization and update regime. Y gives symbolic formulas, not a numerical ranking. ORS parameters and the current edge count m stay in the bounds.</p><p><b>Scope of the evidence.</b> ${esc(data.lowerBoundStatus)} Exact maximality and approximate maximum cardinality remain separate tasks.</p></div></section><section class="${P}-theorem" id="${prefix}-theorem" aria-live="polite"></section><details class="${P}-evidence"><summary>Every verified result &amp; its source</summary><div class="${P}-records"></div></details>`;
    function detail(){const rec=records(opts()).find(r=>r.id===selected),host=root.querySelector('.'+P+'-theorem');if(!rec){host.innerHTML='<p>No sources match this filter.</p>';return;}
      host.innerHTML=`<div class="${P}-theorem-head"><b>${esc(rec.shortLabel)}</b><span>${esc(rec.venue)}</span><span>${rec.kind==='lower'?'Lower-bound theorem':'Algorithm guarantee'}</span></div><div class="${P}-detail-grid"><div><small>Update time · ${esc(rec.clock)}</small><strong>${htmlMath(rec.bound)}</strong></div><div><small>Matching guarantee</small><strong>${esc(rec.quality)}</strong></div><div><small>Randomness &amp; adversary</small><strong>${esc(rec.randomization)} · ${esc(rec.adversary)}</strong></div></div><p><b>Probability.</b> ${esc(rec.probability)}</p><p><b>Recourse.</b> ${esc(rec.recourse)}</p><details><summary>Exact assumptions &amp; primary source</summary><h3>${esc(rec.title)}</h3><p>${esc(Array.isArray(rec.authors)?rec.authors.join(', '):rec.authors)}</p><p><b>${esc(rec.theorem)}.</b> ${esc(rec.graph)}. ${esc(rec.initialization)}.</p><p>${esc(rec.notes)}</p><p><a href="${esc(rec.fullTextUrl||rec.url)}" target="_blank" rel="noopener noreferrer">Read primary source ↗</a></p></details>`;
    }
    function render(){const rows=records(opts());if(!rows.some(r=>r.id===selected))selected=rows[0]?.id;root.querySelector('.'+P+'-publication').value=publication;root.querySelector('.'+P+'-plot').innerHTML=diagramSVG(opts());root.querySelector('.'+P+'-records').innerHTML=rows.map(r=>`<button type="button" data-matching-dynamic-result="${esc(r.id)}" aria-pressed="${r.id===selected}"><b>${esc(r.shortLabel)}</b><strong>${htmlMath(r.displayBound)}</strong><small>${esc(r.quality)} · ${esc(r.adversary)} · ${esc(r.clock)}</small></button>`).join('');detail();}
    root.addEventListener('click',e=>{const t=e.target.closest('[data-matching-dynamic-result]');if(t){selected=t.dataset.matchingDynamicResult;render();}},{signal:controller.signal});
    root.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const t=e.target.closest('.'+P+'-point');if(t){e.preventDefault();selected=t.dataset.matchingDynamicResult;render();}},{signal:controller.signal});
    root.addEventListener('change',e=>{if(e.target.classList.contains(P+'-publication')){publication=e.target.value;render();o.onPublicationChange?.(publication);}},{signal:controller.signal});
    const instance={root,settingKey:KEY,redraw:render,destroy(){controller.abort();instances.delete(instance);root.classList.remove(P+'-view');}};instances.add(instance);render();return instance;
  }
  window.AtlasPairRenderers=window.AtlasPairRenderers||{};window.AtlasPairRenderers[KEY]={mount,summarySVG,diagramSVG,records,release};
})();
