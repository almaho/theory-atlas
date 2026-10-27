(()=>{
  'use strict';
  const data=JSON.parse(document.getElementById('atlas-data').textContent).focus.mpc;
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
  const merge=r=>({...data.sources[r.sourceId],...r});
  const allowed=(r,o={})=>o.publication!=='published'||r.publicationStatus!=='preprint';
  const records=(o={})=>(data.verifiedRecords||[]).map(merge).filter(r=>allowed(r,o));
  const related=(o={})=>(data.relatedResults||[]).map(merge).filter(r=>allowed(r,o));
  const allRecords=o=>[...records(o),...related(o)].filter((r,i,a)=>a.findIndex(x=>x.id===r.id)===i);
  const label=r=>r.shortLabel||r.label||r.sourceId||r.id;
  const summaryLabel=r=>r.summaryLabel||label(r);
  const laneFor=r=>r.plotLane||r.displayBound||r.roundComplexity;
  const laneLabel=r=>readable(r.displayBound||r.roundComplexity||r.bound||'See theorem');
  const laneCaption=(p,lane)=>[...new Set(p.rows.filter(r=>laneFor(r)===lane).map(laneLabel))].join(' / ');
  const isConditional=r=>r.kind==='lower'&&(r.conditional!==false);
  const text=(x,y,t,cls='',anchor='start',attrs='')=>`<text ${attrs} x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${esc(t)}</text>`;
  function svgFormula(x,y,s,cls='',anchor='start'){
    return `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${esc(readable(s)).replace(/\^\{([^{}]*)\}/g,'<tspan baseline-shift="super" font-size="70%">$1</tspan>').replace(/\^(-?\d+)/g,'<tspan baseline-shift="super" font-size="70%">$1</tspan>').replace(/\^\(([^()]*)\)/g,'<tspan baseline-shift="super" font-size="70%">$1</tspan>').replace(/\^([εδ])/g,'<tspan baseline-shift="super" font-size="70%">$1</tspan>')}</text>`;
  }
  const panelInfo={
    'maximal-general':{title:'Maximal matching · general graphs',shortTitle:'General graphs · maximal',subtitle:'Exact maximality implies a ½-approximation; each point retains its local and total space assumptions.'},
    'maximal-sparse':{title:'Maximal matching · sparse graphs',shortTitle:'Bounded arboricity · maximal',subtitle:'Restricted graph families have their own results; α denotes arboricity.'},
    approximate:{title:'Approximation · weighted and unweighted',shortTitle:'Approximation · distinct weight scopes',subtitle:'Fix ε > 0 for near-optimal algorithms; each point states whether weights are supported.'}
  };
  const columns=[{key:'sublinear',x:550,label:'Strongly sublinear',formula:'O(n^δ), fixed 0 < δ < 1'},{key:'nearlinear',x:880,label:'Near-linear',formula:'O(n) or Õ(n) · see each theorem'}];
  function layout(options={}){
    const visible=records(options),panels=[];let cursor=20;
    for(const name of ['maximal-general','maximal-sparse','approximate']){
      const rows=visible.filter(r=>r.panel===name);if(!rows.length)continue;
      const lanes=[...new Set(rows.map(laneFor))],step=43,top=cursor+82,bottom=top+Math.max(0,lanes.length-1)*step+24;
      const panel={name,...panelInfo[name],rows,lanes,step,l:390,r:1070,top,bottom,titleY:cursor+12,subtitleY:cursor+34,axisY:cursor+61,xTitleY:bottom+62};
      panel.points=rows.map(r=>{const peers=rows.filter(t=>t.memoryRegime===r.memoryRegime&&laneFor(t)===laneFor(r)),paired=peers.length>1,offset=paired?(r.kind==='lower'?9:-9):0;return {r,x:(columns.find(c=>c.key===r.memoryRegime)?.x||550)+offset,y:top+lanes.indexOf(laneFor(r))*step,lane:laneFor(r),paired,anchor:paired&&r.kind!=='lower'?'end':'start'}});
      panels.push(panel);cursor=bottom+89;
    }
    return {panels,height:cursor+5};
  }
  function marker(x,y,kind,selected=false,mini=false,conditional=false){
    const lower=kind==='lower',color=`var(--${lower?'red':'green'})`,r=mini?3.1:5.5;
    return `${selected&&!mini?`<circle cx="${x}" cy="${y}" r="13" fill="${color}" opacity=".12"/>`:''}${lower?`<path data-marker="lower" data-conditional="${conditional}" data-center-x="${x}" data-center-y="${y}" d="M${x} ${y-r-1}l${r+1} ${r+1}l-${r+1} ${r+1}l-${r+1}-${r+1}Z" fill="${conditional?'var(--surface)':color}" stroke="${color}" stroke-width="${mini?1.3:1.8}"${conditional?' stroke-dasharray="2 1.4"':''}/>`:`<circle data-marker="algorithm" data-center-x="${x}" data-center-y="${y}" cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`}`;
  }
  function point(p,options){
    const {r,x,y,lane}=p,kind=r.kind==='lower'?'lower':'algorithm',conditional=isConditional(r),anchor=p.anchor||'start',labelX=x+(anchor==='end'?-17:17),note=conditional?(r.plotNote?.includes('conditional')?r.plotNote:'conditional · '+(r.plotNote||'component-stable')):(anchor==='end'?r.plotNote?.replace(' · randomized',''):r.plotNote)||r.randomization||'';
    return `<g class="mpc-plot-result" data-mpc-result="${esc(r.id)}" data-kind="${kind}" data-conditional="${conditional}" data-memory-regime="${esc(r.memoryRegime)}" data-round-lane="${esc(lane)}" role="button" tabindex="0" aria-pressed="${r.id===options.selected}" aria-label="Inspect ${esc(label(r))}: ${esc(laneLabel(r))}; ${esc(r.quality)}${conditional?'; conditional lower bound under the connectivity conjecture for component-stable algorithms':''}" style="--mpc-marker:var(--${kind==='lower'?'red':'green'})">${marker(x,y,kind,r.id===options.selected,false,conditional)}${text(labelX,y-4,label(r),'mpc-paper-label',anchor)}${note?text(labelX,y+13,readable(note),'mpc-point-note',anchor):''}</g>`;
  }
  function diagramSVG(options={}){
    const graph=layout(options);let s=`<svg class="mpc-map" viewBox="0 0 1100 ${graph.height}" role="img" aria-label="MPC matching algorithms and conditional lower bounds, separated by graph and output scope. Horizontal axes show per-machine memory regimes; vertical axes show symbolic communication-round formulas."><title>Matching across machines</title><desc>Green circles are algorithm upper bounds. Hollow dashed red diamonds are conditional lower bounds, under the connectivity conjecture and a component-stability restriction. Strongly sublinear local memory n to delta and near-linear local memory are separate columns. Formula rows are categorical, not a universal ranking in n, degree, arboricity and accuracy. Exact maximality on general graphs, sparse graphs, and weighted approximation have separate panels.</desc>`;
    graph.panels.forEach((p,i)=>{
      if(i)s+=`<path d="M20 ${p.titleY-27}H1080" class="mpc-divider"/>`;
      s+=`<g data-panel="${p.name}">`+text(20,p.titleY,String(i+1).padStart(2,'0'),'mpc-section-number')+text(56,p.titleY,p.title,'mpc-section-title')+text(56,p.subtitleY,p.subtitle,'mpc-muted');
      s+=text(20,p.axisY,'Y · COMMUNICATION ROUNDS','mpc-axis-title','start','data-axis="y"')+text(p.l,p.axisY,'Symbolic formula rows · not a numerical ranking','mpc-axis-note');
      p.lanes.forEach((lane,index)=>{const y=p.top+index*p.step,r=p.rows.find(r=>laneFor(r)===lane);s+=`<path d="M${p.l} ${y}H${p.r}" class="mpc-grid"/>`+svgFormula(p.l-19,y+5,laneCaption(p,lane),'mpc-y-label','end')});
      for(const c of columns)s+=`<path d="M${c.x} ${p.top-19}V${p.bottom}" class="mpc-guide"/>`;
      s+=`<path d="M${p.l} ${p.top-19}V${p.bottom}H${p.r}" class="mpc-axis"/>`+p.points.map(r=>point(r,options)).join('');
      for(const c of columns)s+=text(c.x,p.bottom+23,c.label,'mpc-x-label','middle')+svgFormula(c.x,p.bottom+40,c.formula,'mpc-small','middle');
      s+=text(p.l,p.xTitleY,'X · PER-MACHINE MEMORY REGIME','mpc-axis-title','start','data-axis="x"')+'</g>';
    });
    return s+text(20,graph.height-7,'n = vertices · Δ = maximum degree · d̄ = average degree · α = arboricity · ε = accuracy · select a point for exact space and theorem.','mpc-muted')+'</svg>';
  }
  function summarySVG(key,w,h,options={}){
    const levels=['overview','compact','detail'],available=w<220||h<140?0:w<420||h<240?1:2,requested=levels.indexOf(options.level),level=levels[Math.min(available,requested<0?available:requested)],tiny=level==='overview',full=level==='detail',rich=full&&w>=620&&h>=410;
    const graph=layout(options),left=tiny?8:rich?Math.min(295,w*.36):full?38:22,right=w-(tiny?8:18),top=tiny?7:rich?35:25,bottom=h-(tiny?7:full?34:21),gap=tiny?10:rich?61:full?49:30,rows=graph.panels.reduce((sum,p)=>sum+Math.max(2,p.lanes.length),0),room=bottom-top-gap*Math.max(0,graph.panels.length-1),font=Math.max(9,Math.min(11,w/78));
    let cursor=top,s=`<svg class="mpc-summary${rich?' mpc-summary-rich':''}" style="--mpc-summary-font:${font}px" data-detail-level="${level}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="MPC matching: per-machine memory on x, symbolic round bounds on y. Green algorithms and hollow red conditional lower bounds; the latter assume the connectivity conjecture and component-stable algorithms.">`;
    for(const p of graph.panels){
      const height=room*Math.max(2,p.lanes.length)/rows,region={l:left,r:right,t:cursor,b:cursor+height},xx=x=>region.l+(x-p.l)/(p.r-p.l)*(region.r-region.l),yy=y=>region.t+(y-(p.top-19))/(p.bottom-(p.top-19))*(region.b-region.t);
      s+=`<g data-panel="${p.name}"><path d="M${region.l} ${region.t}V${region.b}H${region.r}" class="mpc-axis"/>`;
      if(!tiny){
        for(const c of columns)s+=`<path d="M${xx(c.x)} ${region.t}V${region.b}" class="mpc-guide"/>`;
        s+=text(region.l,region.t-10,p.shortTitle,'mpc-summary-title');
        p.lanes.forEach((lane,index)=>{const y=yy(p.top+index*p.step),r=p.rows.find(r=>laneFor(r)===lane);s+=`<path d="M${region.l} ${y}H${region.r}" class="mpc-grid"/>`;if(rich)s+=svgFormula(region.l-10,y+3,laneCaption(p,lane),'mpc-summary-formula','end')});
        if(rich)s+=text(10,region.t-10,'Y · ROUND BOUNDS','mpc-summary-axis','start','data-axis="y"');
      }
      for(const point of p.points.filter(p=>!tiny||p.r.id!=='mpc-cdp20-maximal')){
        const {r}=point,kind=r.kind==='lower'?'lower':'algorithm',x=point.paired?xx(columns.find(c=>c.key===r.memoryRegime)?.x||550)+(kind==='lower'?1:-1)*Math.max(5,9*(region.r-region.l)/(p.r-p.l)):xx(point.x),y=yy(point.y),conditional=isConditional(r);
        s+=`<g data-mpc-result="${esc(r.id)}" data-kind="${kind}" data-conditional="${conditional}" data-memory-regime="${esc(r.memoryRegime)}" data-round-lane="${esc(point.lane)}">${marker(x,y,kind,false,true,conditional)}`;
        if(full)s+=text(x+(point.anchor==='end'?-7:7),y+3,summaryLabel(r),kind==='lower'?'mpc-summary-lower':'mpc-summary-upper',point.anchor||'start');
        if(rich&&conditional)s+=text(x+7,y+15,'conditional · component-stable','mpc-summary-conditional');
        if(rich&&p.name==='approximate'&&!conditional)s+=text(x+7,y+15,r.graph?.includes('unweighted')?'unweighted · 1+ε':'weighted · 1+ε','mpc-summary-scope');
        if(rich&&r.id==='mpc-cdp24-maximal')s+=text(x+7,y+15,'component-unstable','mpc-summary-scope');
        s+='</g>';
      }
      if(!tiny){
        s+=svgFormula(xx(550),region.b+16,full?'n^δ · strongly sublinear':'n^δ','mpc-summary-note','middle')+text(xx(880),region.b+16,full?'Near-linear':'≈ n','mpc-summary-note','middle');
        if(full)s+=text(region.r,region.b+31,'X · per-machine memory','mpc-summary-axis','end','data-axis="x"');
        if(full&&!rich)s+=`<text data-axis="y" class="mpc-summary-axis" text-anchor="middle" transform="translate(11 ${(region.t+region.b)/2}) rotate(-90)">Y · round bounds</text>`;
      }
      s+='</g>';cursor=region.b+gap;
    }
    return s+'</svg>';
  }
  function mount(root,key='mpc',options={}){
    for(const instance of instances)if(!instance.root.isConnected||instance.root===root)instance.destroy();
    window.StreamingMatching?.release(root);window.DynamicMatching?.release(root);window.LCAMatching?.release(root);window.LocalMatching?.release(root);window.ListQueryMatching?.release(root);
    const controller=new AbortController(),prefix='mpc-'+(++serial);let publication=options.publication||'all';
    let selected=(key==='mpc-mild'?related({publication}).find(r=>r.id.includes('mild')):records({publication}).find(r=>key==='mpc-weighted'?r.memoryRegime==='nearlinear'&&r.panel==='approximate':key==='mpc-sublinear'?r.memoryRegime==='sublinear':r.kind==='lower'))?.id||records({publication})[0]?.id;
    const opts=()=>({publication,selected});
    root.classList.remove('query-list-view','dynamic-view','streaming-view','lca-view','local-view');root.classList.add('focus-view','mpc-view');root.classList.toggle('f-embedded',!!options.embedded);root.setAttribute('aria-label','MPC matching algorithms and conditional lower bounds');
    root.innerHTML=`<p class="f-kicker">MATCHING × MASSIVELY PARALLEL COMPUTATION / THE MEMORY LANDSCAPE</p><header class="f-hero"><div><h1>Matching across machines.</h1><p>How do local memory and graph structure change the number of rounds?</p></div><div class="f-seal"><strong>Algorithms &amp; conditional barriers</strong>Primary sources · ${esc(data.reviewedOn)}</div></header><div class="f-scope"><span><b>Input</b> graph distributed across machines</span><span><b>Resource</b> communication rounds</span><span><b>Memory</b> per machine, plus total space</span></div><section class="mpc-landscape" aria-labelledby="${prefix}-legend"><div class="mpc-toolbar"><div class="mpc-legend" id="${prefix}-legend"><span><i class="mpc-key-algorithm"></i>Algorithm upper bound</span><span><i class="mpc-key-lower"></i>Conditional lower bound</span></div><label class="mpc-publication-control">Sources <select class="mpc-publication-select" aria-label="MPC publication filter"><option value="all">All verified sources</option><option value="published">Published only</option></select></label></div><div class="mpc-plot-scroll" tabindex="0" aria-label="MPC matching figure; scroll horizontally on narrow screens"><div class="mpc-plot-host"></div></div><div class="mpc-chart-notes"><p><b>Read the axes.</b> X separates strongly sublinear local memory from near-linear local memory. Y records each theorem’s round formula. Rows are named formula categories, not a numerical ranking for every n, Δ, α and ε. Exact local and total space are recorded in the inspector.</p><p><b>Red is conditional here.</b> Hollow, dashed red diamonds require the connectivity conjecture and the stated restriction to component-stable algorithms. These are not unconditional lower bounds for all MPC algorithms. Mildly sublinear memory is kept separate from fixed n<sup>δ</sup> memory.</p></div></section><section class="mpc-theorem" id="${prefix}-theorem" aria-label="Selected MPC theorem" aria-live="polite"></section><section class="mpc-related-section"><div class="mpc-section-head"><h2>Other memory and graph scopes</h2><p>These statements retain their own assumptions and do not fill an unrelated column in the figure.</p></div><div class="mpc-related-results"></div></section><details class="mpc-evidence"><summary>All displayed MPC results &amp; exact statements</summary><div class="mpc-evidence-list"></div></details><div class="f-bottom"><span>Maximality, weighted approximation, and sparse graph classes remain separate.</span><span>Select a paper for its theorem, probability, memory and primary source.</span></div>`;
    function button(r){return `<button type="button" data-mpc-result="${esc(r.id)}" class="mpc-record ${r.kind==='lower'?'mpc-record-lower':''}" aria-pressed="${r.id===selected}"><span>${esc(label(r))}${isConditional(r)?' · conditional':''}</span><strong>${math(r.displayBound||r.roundComplexity)}</strong><small>${human(r.quality)}</small><small>${human(r.memory||r.localMemory||r.memoryRegime||'See memory scope')}</small></button>`}
    function detail(){
      const r=allRecords(opts()).find(r=>r.id===selected);if(!r)return;
      const authors=Array.isArray(r.authors)?r.authors.join(', '):r.authors,conditional=isConditional(r),assumptions=Array.isArray(r.assumptions)?r.assumptions.join('; '):r.assumptions;
      root.querySelector('.mpc-theorem').innerHTML=`<div class="mpc-theorem-top"><span class="mpc-type ${r.kind==='lower'?'mpc-lower-type':''}">${conditional?'Conditional lower-bound theorem':r.kind==='lower'?'Lower-bound theorem':'Algorithm guarantee'}</span><strong>${esc(label(r))}</strong><span>${esc(r.venue||r.publicationStatus||'')}</span></div>${conditional?`<p class="mpc-conditional-alert"><b>Conditional.</b> ${human(r.condition||r.conditionalAssumption||'Assumes the connectivity conjecture and applies to the stated component-stable class of MPC algorithms.')}</p>`:''}<div class="mpc-detail-grid"><div><span>Communication rounds</span><strong>${math(r.roundComplexity||r.bound)}</strong></div><div><span>Matching guarantee</span><strong>${human(r.quality)}</strong></div><div><span>Per-machine memory</span><strong>${math(r.memory||r.localMemory||'See theorem')}</strong></div></div>${r.totalMemory||r.totalSpace?`<p><b>Total space.</b> ${math(r.totalMemory||r.totalSpace)}</p>`:''}<p><b>Scope.</b> ${human(r.graph||'See source statement')}${r.output?` · ${human(r.output)}`:''}${r.randomization?` · ${human(r.randomization)}`:''}</p>${r.probability?`<p><b>Probability.</b> ${human(r.probability)}</p>`:''}<details class="mpc-theorem-more"><summary>Exact theorem, assumptions &amp; source</summary><h3>${esc(r.title||label(r))}</h3><p>${esc(authors||'')}</p><p><b>${esc(r.theorem||'Source theorem')}</b>${assumptions?` · ${human(assumptions)}`:''}</p>${r.notes?`<p>${human(r.notes)}</p>`:''}${r.verification?`<p>${human(r.verification)}</p>`:''}${r.url||r.fullTextUrl?`<p><a href="${esc(r.fullTextUrl||r.url)}" target="_blank" rel="noopener noreferrer">Read primary source ↗</a>${r.publicationUrl?` · <a href="${esc(r.publicationUrl)}" target="_blank" rel="noopener noreferrer">Publication ↗</a>`:''}</p>`:''}</details>`;
    }
    function render(){
      const rows=records(opts()),extra=related(opts()),all=allRecords(opts());if(!all.some(r=>r.id===selected))selected=rows.find(r=>r.kind==='lower')?.id||rows[0]?.id;
      root.querySelector('.mpc-publication-select').value=publication;root.querySelector('.mpc-plot-host').innerHTML=diagramSVG(opts());root.querySelector('.mpc-evidence-list').innerHTML=rows.map(button).join('');root.querySelector('.mpc-related-section').hidden=!extra.length;root.querySelector('.mpc-related-results').innerHTML=extra.map(button).join('');detail();
    }
    root.addEventListener('click',event=>{const result=event.target.closest('[data-mpc-result]');if(result){selected=result.dataset.mpcResult;render()}},{signal:controller.signal});
    root.addEventListener('keydown',event=>{if(event.key!=='Enter'&&event.key!==' ')return;const result=event.target.closest('.mpc-plot-result');if(result){event.preventDefault();selected=result.dataset.mpcResult;render()}},{signal:controller.signal});
    root.addEventListener('change',event=>{if(event.target.classList.contains('mpc-publication-select')){publication=event.target.value;render();options.onPublicationChange?.(publication)}},{signal:controller.signal});
    render();const instance={root,settingKey:'mpc',redraw:render,destroy(){controller.abort();instances.delete(instance)}};instances.add(instance);return instance;
  }
  window.MPCMatching={mount,summarySVG,diagramSVG,records,release(root){for(const instance of instances)if(!instance.root.isConnected||instance.root===root)instance.destroy()}};
})();
