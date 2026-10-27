(()=>{
  'use strict';
  const data=JSON.parse(document.getElementById('atlas-data').textContent).focus.local;
  const instances=new Set();let serial=0;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const readable=s=>String(s??'').replace(/\bDelta\b/g,'Δ').replace(/\bepsilon\b/g,'ε').replace(/\bOmega\b/g,'Ω').replace(/\bTheta\b/g,'Θ').replace(/\bdelta\b/g,'δ').replace(/\bbeta\b/g,'β').replace(/\balpha\b/g,'α').replace(/\bOtilde\b/g,'Õ').replace(/>=/g,'≥').replace(/<=/g,'≤').replace(/loglog/g,'log log');
  const human=s=>esc(readable(s));
  function math(value){
    value=readable(value);let html='';
    for(let i=0;i<value.length;i++){
      if(value[i]==='^'&&value[i+1]==='{'){
        let depth=1,j=i+2;for(;j<value.length&&depth;j++){if(value[j]==='{')depth++;if(value[j]==='}')depth--}
        if(!depth){html+='<sup>'+math(value.slice(i+2,j-1))+'</sup>';i=j-1;continue}
      }
      html+=esc(value[i]);
    }
    return html.replace(/\^(-?\d+)/g,'<sup>$1</sup>').replace(/\^\(([^()]*)\)/g,'<sup>$1</sup>').replace(/\^([εδ])/g,'<sup>$1</sup>');
  }
  const labels={beps12:'BEPS · 2012',fischer17:'Fischer · 2017',balliu21:'BBHORS · 2019 / 2021',ks25:'Khoury–Schild · 2025',harris20:'Harris · 2020',kmw16:'KMW · 2016',huangsu23:'Huang–Su · 2023'};
  const merge=r=>({...data.sources[r.sourceId],...r});
  const allowed=(r,o={})=>o.publication!=='published'||r.publicationStatus!=='preprint';
  const records=(o={})=>(data.verifiedRecords||[]).map(merge).filter(r=>allowed(r,o));
  const related=(o={})=>(data.relatedResults||[]).map(merge).filter(r=>allowed(r,o));
  const allRecords=o=>[...records(o),...related(o)].filter((r,i,a)=>a.findIndex(x=>x.id===r.id)===i);
  const label=r=>r.shortLabel||r.label||labels[r.sourceId]||r.sourceId||r.id;
  const panelFor=r=>r.panel||(r.id.includes('nearoptimal')||r.id.includes('approx')||r.id.includes('kmw')?'approximation':'maximal');
  const isRandom=r=>String(r.randomization||r.randomness||'').startsWith('random');
  const laneFor=r=>r.plotLane||r.displayBound||r.roundComplexity;
  const laneLabel=r=>readable(r.displayBound||r.roundComplexity||r.bound||'See theorem');
  const text=(x,y,t,cls='',anchor='start')=>`<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${esc(t)}</text>`;
  function svgFormula(x,y,s,cls='',anchor='start'){
    return `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${esc(readable(s)).replace(/\^\{([^{}]*)\}/g,'<tspan baseline-shift="super" font-size="70%">$1</tspan>').replace(/\^(-?\d+)/g,'<tspan baseline-shift="super" font-size="70%">$1</tspan>').replace(/\^\(([^()]*)\)/g,'<tspan baseline-shift="super" font-size="70%">$1</tspan>')}</text>`;
  }
  // Every row is a named theorem-bound category. Rows do not rank multivariate functions.
  const panelInfo={maximal:{title:'Exact maximal matching',subtitle:'A maximal matching gives ≥ ½ OPT; these lower bounds require exact maximality.'},approximation:{title:'Approximation without maximality',subtitle:'Approximation guarantees and weighted / unweighted scopes are stated per theorem.'}};
  function layout(options={}){
    const visible=records(options),panels=[],rowStep=visible.length>12?36:visible.length>10?38:45;let cursor=20;
    for(const name of ['maximal','approximation']){
      const rows=visible.filter(r=>panelFor(r)===name);if(!rows.length)continue;
      const lanes=[...new Set(rows.map(laneFor))],step=rowStep,top=cursor+82,bottom=top+(lanes.length-1)*step+28;
      const panel={name,...panelInfo[name],rows,lanes,step,l:405,r:1065,top,bottom,titleY:cursor+12,subtitleY:cursor+34,axisY:cursor+59,xTitleY:bottom+47};
      panel.points=rows.flatMap(r=>(r.appliesTo?.includes('deterministic')&&r.appliesTo?.includes('randomized')?['deterministic','randomized']:[isRandom(r)?'randomized':'deterministic']).map(regime=>({r,regime,x:regime==='randomized'?880:565,y:top+lanes.indexOf(laneFor(r))*step,lane:laneFor(r)})));
      panels.push(panel);cursor=bottom+86;
    }
    return {panels,height:cursor+4};
  }
  function marker(x,y,kind,selected=false,mini=false){
    const lower=kind==='lower',color=`var(--${lower?'red':'green'})`,r=mini?2.8:5;
    return `${selected&&!mini?`<circle cx="${x}" cy="${y}" r="12" fill="${color}" opacity=".12"/>`:''}${lower?`<path data-marker="lower" data-center-x="${x}" data-center-y="${y}" d="M${x} ${y-r-1}l${r+1} ${r+1}l-${r+1} ${r+1}l-${r+1}-${r+1}Z" fill="${color}"/>`:`<circle data-marker="algorithm" data-center-x="${x}" data-center-y="${y}" cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`}`;
  }
  function point(p,options){
    const {r,x,y,lane,regime}=p,kind=r.kind==='lower'?'lower':'algorithm',extra=panelFor(r)==='maximal'?'':r.plotNote||'';
    return `<g class="loc-plot-result" data-local-result="${esc(r.id)}" data-kind="${kind}" data-randomization="${regime}" data-round-lane="${esc(lane)}" role="button" tabindex="0" aria-pressed="${r.id===options.selected}" aria-label="Inspect ${esc(label(r))}: ${esc(laneLabel(r))}; ${esc(r.quality)}; ${esc(r.probability||'')}" style="--loc-marker:var(--${kind==='lower'?'red':'green'})">${marker(x,y,kind,r.id===options.selected)}${text(x+17,y+(extra?-3:5),label(r),'loc-paper-label')}${extra?text(x+17,y+15,extra,'loc-point-note'):''}</g>`;
  }
  function diagramSVG(options={}){
    const graph=layout(options);let s=`<svg class="loc-map" viewBox="0 0 1100 ${graph.height}" role="img" aria-label="Distributed LOCAL matching: deterministic and randomized algorithms and lower bounds on shared symbolic round-bound axes."><title>Distributed matching in the LOCAL model</title><desc>Two separate point plots distinguish exact maximal matching from approximation. The horizontal axis is the deterministic or randomized regime. The vertical axis records each theorem's round-bound formula as a named category, not a numeric ranking across n, Delta and epsilon. Green circles are algorithms; red diamonds are lower bounds.</desc>`;
    graph.panels.forEach((p,i)=>{
      if(i)s+=`<path d="M20 ${p.titleY-27}H1080" class="loc-divider"/>`;
      s+=`<g data-panel="${p.name}">`+text(20,p.titleY,String(i+1).padStart(2,'0'),'loc-section-number')+text(56,p.titleY,p.title,'loc-section-title')+text(56,p.subtitleY,p.subtitle,'loc-muted');
      s+=text(20,p.axisY,'Y · COMMUNICATION ROUNDS','loc-axis-title').replace('<text ','<text data-axis="y" ')+text(p.l,p.axisY,'Symbolic formula rows · not a numerical ranking','loc-axis-note');
      p.lanes.forEach((lane,index)=>{
        const y=p.top+index*p.step,r=p.rows.find(r=>laneFor(r)===lane);
        s+=`<path d="M${p.l} ${y}H${p.r}" class="loc-grid"/>`+svgFormula(p.l-18,y+5,laneLabel(r),'loc-y-label','end');
      });
      for(const x of [565,880])s+=`<path d="M${x} ${p.top-17}V${p.bottom}" class="loc-guide"/>`;
      for(const r of p.rows.filter(r=>r.appliesTo?.includes('deterministic')&&r.appliesTo?.includes('randomized'))){const y=p.top+p.lanes.indexOf(laneFor(r))*p.step;s+=`<path d="M577 ${y}H868" class="loc-shared-bound"/>`}
      s+=`<path d="M${p.l} ${p.top-17}V${p.bottom}H${p.r}" class="loc-axis"/>`+p.points.map(r=>point(r,options)).join('');
      s+=text(565,p.bottom+22,'Deterministic','loc-x-label','middle')+text(880,p.bottom+22,'Randomized','loc-x-label','middle')+text(p.l,p.xTitleY,'X · RANDOMIZATION REGIME','loc-axis-title').replace('<text ','<text data-axis="x" ');
      s+='</g>';
    });
    s+=text(20,graph.height-6,'n = vertices · Δ = maximum degree · ε = accuracy · select a result for its exact guarantee, probability and source.','loc-muted');
    return s+'</svg>';
  }
  function summarySVG(key,w,h,options={}){
    const levels=['overview','compact','detail'],available=w<220||h<140?0:w<420||h<240?1:2,requested=levels.indexOf(options.level),level=levels[Math.min(available,requested<0?available:requested)],tiny=level==='overview',full=level==='detail',rich=full&&w>=650&&h>=420;
    const graph=layout(options),margin=rich?Math.min(340,w*.35):tiny?8:full?31:17,rightMargin=rich?22:margin,formulaSize=Math.max(10,Math.min(12,w/84)),top=tiny?7:full?28:20,bottom=h-(tiny?7:full?28:21),gap=tiny?9:full?43:27,totalRows=graph.panels.reduce((sum,p)=>sum+Math.max(2,p.lanes.length),0),room=bottom-top-gap*(graph.panels.length-1);
    let cursor=top,s=`<svg class="loc-summary${rich?' loc-summary-rich':''}" style="--loc-summary-font:${formulaSize}px" data-detail-level="${level}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="LOCAL matching algorithms and lower bounds: maximality and approximation, with deterministic and randomized columns and symbolic round-bound rows.">`;
    for(const p of graph.panels){
      const height=room*Math.max(2,p.lanes.length)/totalRows,region={l:margin,r:w-rightMargin,t:cursor,b:cursor+height};
      const xx=x=>region.l+(x-p.l)/(p.r-p.l)*(region.r-region.l),yy=y=>region.t+(y-(p.top-17))/(p.bottom-(p.top-17))*(region.b-region.t);
      s+=`<g data-panel="${p.name}"><path d="M${region.l} ${region.t}V${region.b}H${region.r}" class="loc-axis"/>`;
      if(!tiny){
        for(const x of [565,880])s+=`<path d="M${xx(x)} ${region.t}V${region.b}" class="loc-guide"/>`;
        s+=text(region.l,region.t-8,rich?(p.name==='maximal'?'Exact maximal matching':'Approximation without maximality'):p.name==='maximal'?(full?'Maximal · Y: symbolic rounds':'Maximal · round bounds'):(full?'Approximation · Y: symbolic rounds':'Approximation · round bounds'),'loc-summary-title');
      }
      if(rich){
        s+=text(20,region.t-8,'Y · SYMBOLIC ROUND BOUNDS','loc-summary-title').replace('<text ','<text data-axis="y" ');
        p.lanes.forEach((lane,index)=>{
          const y=yy(p.top+index*p.step),r=p.rows.find(r=>laneFor(r)===lane);
          s+=`<path d="M${region.l} ${y}H${region.r}" class="loc-grid"/>`+svgFormula(region.l-13,y+4,laneLabel(r),'loc-summary-formula','end');
        });
      }
      const overviewIds=new Set(['local-gg23-maximal','local-fischer17-rand-maximal','local-ks25-maximal-lower','local-harris20-det-nearoptimal','local-harris20-rand-nearoptimal','local-kmw16-approx-lower']);
      for(const point of p.points.filter(p=>!tiny||overviewIds.has(p.r.id))){
        const {r,regime}=point,x=xx(point.x),y=yy(point.y),kind=r.kind==='lower'?'lower':'algorithm';
        s+=`<g data-local-result="${esc(r.id)}" data-kind="${kind}" data-randomization="${regime}" data-round-lane="${esc(point.lane)}">${marker(x,y,kind,false,true)}`;
        const labelFits=!p.points.some(other=>other!==point&&Math.abs(yy(other.y)-y)<13&&other.x===point.x);
        if(full&&labelFits)s+=text(x+6,y+3,label(r),kind==='lower'?'loc-summary-lower':'loc-summary-upper');
        const rowSpace=p.step/(p.bottom-(p.top-17))*(region.b-region.t);
        if(rich&&labelFits&&rowSpace>=23&&r.summaryNote)s+=text(x+6,y+14,r.summaryNote,'loc-summary-scope');
        s+='</g>';
      }
      if(!tiny)s+=text(xx(565),region.b+15,full?'X: deterministic':'Det.','loc-summary-note','middle')+text(xx(880),region.b+15,full?'Randomized':'Rand.','loc-summary-note','middle');
      s+='</g>';cursor=region.b+gap;
    }
    return s+'</svg>';
  }
  function mount(root,key='local',options={}){
    for(const instance of instances)if(!instance.root.isConnected||instance.root===root)instance.destroy();
    window.StreamingMatching?.release(root);window.DynamicMatching?.release(root);window.LCAMatching?.release(root);window.MPCMatching?.release(root);window.ListQueryMatching?.release(root);
    const controller=new AbortController(),prefix='local-'+(++serial);let publication=options.publication||'all';
    let selected=key==='local-weighted'?'local-harris20-rand-nearoptimal':key==='local-congest'?related({publication})[0]?.id:'local-ks25-maximal-lower';
    const opts=()=>({publication,selected});
    root.classList.remove('query-list-view','mpc-view','dynamic-view','streaming-view','lca-view');root.classList.add('focus-view','local-view');root.classList.toggle('f-embedded',!!options.embedded);root.setAttribute('aria-label','Distributed LOCAL matching algorithms and lower bounds');
    root.innerHTML=`<p class="f-kicker">MATCHING × DISTRIBUTED LOCAL / THE ROUND LANDSCAPE</p><header class="f-hero"><div><h1>How far must matching communicate?</h1><p>Algorithms and barriers, measured in synchronous communication rounds.</p></div><div class="f-seal"><strong>Algorithms &amp; lower bounds</strong>Primary sources · ${esc(data.reviewedOn)}</div></header><div class="f-scope"><span><b>Graph</b> general, maximum degree Δ</span><span><b>Access</b> neighboring processors</span><span><b>Resource</b> synchronous rounds</span><span><b>LOCAL</b> unbounded messages</span></div><section class="loc-landscape" aria-labelledby="${prefix}-legend"><div class="loc-toolbar"><div class="loc-legend" id="${prefix}-legend"><span><i class="loc-key-algorithm"></i>Algorithm upper bound</span><span><i class="loc-key-lower"></i>Impossibility lower bound</span></div><label class="loc-publication-control">Sources <select class="loc-publication-select" aria-label="LOCAL publication filter"><option value="all">All verified sources</option><option value="published">Published only</option></select></label></div><div class="loc-plot-scroll" tabindex="0" aria-label="Distributed LOCAL matching figure; scroll horizontally on narrow screens"><div class="loc-plot-host"></div></div><div class="loc-chart-notes"><p><b>Read the axes.</b> X separates deterministic and randomized algorithms. Y records symbolic round bounds. Each row is a formula category: its position does not rank multivariate functions for every n, Δ and ε.</p><p><b>Maximality and approximation are different tasks.</b> Every maximal matching is a ½-approximation, but a maximal-matching lower bound does not rule out other ½-approximation algorithms. Randomized statements retain their source’s success guarantee. Davies-Peck ’26 has weaker success than conventional w.h.p.; its exact probability is recorded below.</p></div></section><section class="loc-theorem" id="${prefix}-theorem" aria-label="Selected LOCAL theorem" aria-live="polite"></section><section class="loc-related-section"><div class="loc-section-head"><h2>Other graph and communication scopes</h2><p>Restricted graph classes and message limits retain their own assumptions.</p></div><div class="loc-related-results"></div></section><details class="loc-evidence"><summary>All LOCAL results &amp; exact statements</summary><div class="loc-evidence-list"></div></details><div class="f-bottom"><span>Both panels retain full n, Δ and ε dependence in the selected theorem.</span><span>Published and preprint sources are distinguished by the source filter.</span></div>`;
    function button(r){return `<button type="button" data-local-result="${esc(r.id)}" class="loc-record ${r.kind==='lower'?'loc-record-lower':''}" aria-pressed="${r.id===selected}"><span>${esc(label(r))} · ${esc(r.randomization||r.randomness||'')}</span><strong>${math(r.displayBound||r.roundComplexity)}</strong><small>${human(r.quality)}</small>${r.model&&r.model!=='LOCAL'?`<small>${esc(r.model)}</small>`:''}${!r.panel&&r.graph?`<small class="loc-record-scope">${human(r.graph)}</small>`:''}</button>`}
    function detail(){
      const r=allRecords(opts()).find(r=>r.id===selected);if(!r)return;
      const authors=Array.isArray(r.authors)?r.authors.join(', '):r.authors;
      root.querySelector('.loc-theorem').innerHTML=`<div class="loc-theorem-top"><span class="loc-type ${r.kind==='lower'?'loc-lower-type':''}">${r.kind==='lower'?'Lower-bound theorem':'Algorithm guarantee'}</span><strong>${esc(label(r))}</strong><span>${esc(r.venue||r.publicationStatus||'')}</span></div><div class="loc-detail-grid"><div><span>Communication rounds</span><strong>${math(r.roundComplexity||r.bound)}</strong></div><div><span>Matching guarantee</span><strong>${human(r.quality)}</strong></div><div><span>Model &amp; randomness</span><strong>${esc(r.model||'LOCAL')} · ${esc(r.randomization||r.randomness||'See theorem')}</strong></div></div><p><b>Scope.</b> ${human(r.graph||'See source statement')}${r.output?` · ${human(r.output)}`:''}</p>${r.probability?`<p><b>Probability.</b> ${human(r.probability)}</p>`:''}<details class="loc-theorem-more"><summary>Exact theorem, assumptions &amp; source</summary><h3>${esc(r.title||label(r))}</h3><p>${esc(authors||'')}</p><p><b>${esc(r.theorem||'Source theorem')}</b>${r.assumptions?` · ${human(Array.isArray(r.assumptions)?r.assumptions.join('; '):r.assumptions)}`:''}</p>${r.notes?`<p>${human(r.notes)}</p>`:''}${r.verification?`<p>${human(r.verification)}</p>`:''}${r.url||r.fullTextUrl?`<p><a href="${esc(r.fullTextUrl||r.url)}" target="_blank" rel="noopener noreferrer">Read primary source ↗</a>${r.publicationUrl?` · <a href="${esc(r.publicationUrl)}" target="_blank" rel="noopener noreferrer">Publication ↗</a>`:''}</p>`:''}</details>`;
    }
    function render(){
      const rows=records(opts()),extra=related(opts()),all=allRecords(opts());if(!all.some(r=>r.id===selected))selected=rows.find(r=>r.kind==='lower')?.id||rows[0]?.id;
      root.querySelector('.loc-publication-select').value=publication;
      root.querySelector('.loc-plot-host').innerHTML=diagramSVG(opts());
      root.querySelector('.loc-evidence-list').innerHTML=rows.map(button).join('');
      root.querySelector('.loc-related-section').hidden=!extra.length;
      root.querySelector('.loc-related-results').innerHTML=extra.map(button).join('');detail();
    }
    root.addEventListener('click',event=>{const result=event.target.closest('[data-local-result]');if(result){selected=result.dataset.localResult;render()}},{signal:controller.signal});
    root.addEventListener('keydown',event=>{if(event.key!=='Enter'&&event.key!==' ')return;const result=event.target.closest('.loc-plot-result');if(result){event.preventDefault();selected=result.dataset.localResult;render()}},{signal:controller.signal});
    root.addEventListener('change',event=>{if(event.target.classList.contains('loc-publication-select')){publication=event.target.value;render();options.onPublicationChange?.(publication)}},{signal:controller.signal});
    render();const instance={root,settingKey:'local',redraw:render,destroy(){controller.abort();instances.delete(instance)}};instances.add(instance);return instance;
  }
  window.LocalMatching={mount,summarySVG,diagramSVG,records,release(root){for(const instance of instances)if(!instance.root.isConnected||instance.root===root)instance.destroy()}};
})();
