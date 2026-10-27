(()=>{
  'use strict';
  const data=JSON.parse(document.getElementById('atlas-data').textContent).focus.lca;
  const instances=new Set();let serial=0;
  const axes=data.figureAxes;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const readable=s=>String(s??'').replace(/\bDelta\b/g,'Δ').replace(/\bepsilon\b/g,'ε').replace(/\bOmega\b/g,'Ω').replace(/\bTheta\b/g,'Θ').replace(/\bdelta\b/g,'δ').replace(/\bbeta\b/g,'β').replace(/\balpha\b/g,'α').replace(/\beta\b/g,'η').replace(/\bOtilde\b/g,'Õ').replace(/>=/g,'≥').replace(/<=/g,'≤').replace(/loglog/g,'log log').replace(/ceil\(1\/ε\)/g,'⌈1/ε⌉');
  const human=s=>esc(readable(s));
  function math(s){
    const value=readable(s);let html='';
    for(let i=0;i<value.length;i++){
      if(value[i]==='^'&&value[i+1]==='{'){
        let depth=1,j=i+2;for(;j<value.length&&depth;j++){if(value[j]==='{')depth++;if(value[j]==='}')depth--}
        if(!depth){html+='<sup>'+math(value.slice(i+2,j-1))+'</sup>';i=j-1;continue}
      }
      html+=esc(value[i]);
    }
    return html.replace(/\^(-?\d+)/g,'<sup>$1</sup>').replace(/\^([εδ])/g,'<sup>$1</sup>');
  }
  const labels={mrvx12:'MRVX · 2012',mv13:'MV · 2013',emr14:'EMR · 2014 / 2018',lry15:'LRY · 2015 / 2017',bcgs17:'BCGS · 2017',kmnft19:'KMNFT · 2019 / 2020',gha22:'Ghaffari · 2022',brr23:'BRR · 2023',abgs25:'ABGS · 2025',beh21:'Behnezhad · 2021',shah26:'Shah · 2026',yyi09:'YYI · 2009 / 2012'};
  const merge=r=>({...data.sources[r.sourceId],...r});
  const allowed=(r,o={})=>o.publication!=='published'||r.publicationStatus!=='preprint';
  const records=(o={})=>(data.verifiedRecords||[]).map(merge).filter(r=>allowed(r,o));
  const related=(o={})=>(data.relatedResults||[]).map(merge).filter(r=>allowed(r,o));
  const label=r=>labels[r.sourceId]||r.sourceId||r.id;
  const allRecords=o=>[...records(o),...related(o)].filter((r,i,a)=>a.findIndex(x=>x.id===r.id)===i);
  const text=(x,y,t,cls='',anchor='start',attrs='')=>`<text ${attrs} x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${esc(t)}</text>`;
  const formula=(x,y,base,exponent,suffix='',cls='')=>`<text x="${x}" y="${y}" class="l-formula ${cls}">${esc(base)}<tspan baseline-shift="super" font-size="65%">${esc(exponent)}</tspan><tspan baseline-shift="baseline">${esc(suffix)}</tspan></text>`;
  // Guarantee columns and resource rows are named categories, not fitted numerical values.
  // Historical rows alone compare n-dependence after fixing both Delta and epsilon.
  const panels={
    adaptive:{l:250,r:1060,t:83,b:347},
    history:{l:250,r:1060,t:515,b:685}
  };
  const plotSpecs=[
    {id:'lca-bcgs17-nonadaptive',panel:'nonadaptive',family:'constant-approximation',lane:'Delta^{O(log Delta/loglog Delta)}',x:520,y:900,label:'BCGS’17 · derived LCA',sub:'1/(2+ε) approximation · fixed ε',lx:540,ly:895},
    {id:'lca-abgs25-nonadaptive-lower',panel:'nonadaptive',family:'constant-approximation',lane:'Delta^{Omega(log Delta/loglog Delta)}',x:800,y:966,label:'ABGS’25 · Non-adaptive',sub:'any fixed positive approximation',lx:820,ly:960},
    {id:'lca-kmnft19-constant',panel:'adaptive',family:'constant-unspecified',lane:'O(Delta log n)',x:350,y:315,label:'KMNFT’19',sub:'constant factor in expectation',lx:371,ly:310},
    {id:'lca-gha22-maximal',panel:'adaptive',family:'maximal',lane:'poly(Delta) log n',x:540,y:245,label:'Ghaffari’22',sub:'maximal · degree exponent unspecified',lx:561,ly:240},
    {id:'lca-lry15-nearoptimal',panel:'adaptive',family:'multiplicative-nearoptimal',lane:'(Delta/epsilon)^{O(1/epsilon^2)} polylog n',x:760,y:105,label:'LRY’15',sub:'edge membership',lx:740,ly:100,anchor:'end'},
    {id:'lca-brr23-nearoptimal-lower',panel:'adaptive',family:'additive-nearoptimal',lane:'Delta^{Omega(1/epsilon)}',x:1000,y:175,label:'BRR’23',sub:'partner query · even bipartite',lx:980,ly:169,anchor:'end'},
    {id:'lca-mrvx12-maximal',panel:'history',family:'maximal',lane:'O(log^3 n)',x:450,y:570,label:'MRVX’12',sub:'time per edge query',lx:470,ly:564},
    {id:'lca-mv13-nearoptimal',panel:'history',family:'multiplicative-nearoptimal',lane:'O(log^4 n)',x:850,y:530,label:'MV’13',sub:'time per edge query',lx:830,ly:524,anchor:'end'},
    {id:'lca-emr14-maximal',panel:'history',family:'maximal',lane:'log* n',x:450,y:650,label:'EMR’14',sub:'deterministic probes',lx:470,ly:644},
    {id:'lca-emr14-nearoptimal',panel:'history',family:'multiplicative-nearoptimal',lane:'poly(log* n)',x:850,y:610,label:'EMR’14',sub:'deterministic probes',lx:830,ly:604,anchor:'end'}
  ];
  function clickable(spec,kind,selected,body){return `<g class="l-plot-result" data-lca-result="${spec.id}" data-kind="${kind}" data-guarantee-family="${spec.family}" data-resource-lane="${esc(spec.lane)}" role="button" tabindex="0" aria-pressed="${spec.id===selected}" aria-label="Inspect ${esc(label(allRecords({}).find(r=>r.id===spec.id)||{id:spec.id}))}" style="--l-marker:var(--${kind==='algorithm'?'green':'red'})">${body}</g>`}
  function marker(x,y,kind,selected=false,mini=false,derived=false){
    const color=`var(--${kind==='lower'?'red':'green'})`,r=mini?2.8:5;
    return `${selected&&!mini?`<circle cx="${x}" cy="${y}" r="12" fill="${color}" opacity=".12"/>`:''}${kind==='lower'?`<path data-marker="lower" data-center-x="${x}" data-center-y="${y}" d="M${x} ${y-r-1}l${r+1} ${r+1}l-${r+1} ${r+1}l-${r+1}-${r+1}Z" fill="${color}"/>`:`<circle data-marker="algorithm" ${derived?'data-derived="partner" data-guarantee-family="additive-nearoptimal"':''} data-center-x="${x}" data-center-y="${y}" cx="${x}" cy="${y}" r="${r}" fill="${derived?'var(--surface)':color}" stroke="${color}" stroke-width="${mini?1.2:1.8}"/>`}`;
  }
  function plotted(spec,options){
    const r=records(options).find(r=>r.id===spec.id);if(!r)return '';
    let body='';
    if(spec.leader)body+=`<path d="M${spec.x} ${spec.y}L${spec.lx+(spec.anchor==='end'?-10:10)} ${spec.ly+(spec.ly<spec.y?18:-10)}" class="l-leader"/>`;
    body+=marker(spec.x,spec.y,r.kind,spec.id===options.selected);
    body+=text(spec.lx,spec.ly,spec.label,'l-paper-label',spec.anchor||'start')+text(spec.lx,spec.ly+17,spec.sub,'l-point-note',spec.anchor||'start');
    if(spec.id==='lca-lry15-nearoptimal')body+=`<path d="M771 105H989" class="l-conversion"/>`+marker(1000,105,'algorithm',false,false,true)+text(1000,75,'derived partner bound','l-point-note','middle')+text(880,128,'Edge membership → partner','l-point-note','middle');
    return clickable(spec,r.kind,options.selected,body);
  }
  function diagramSVG(options={}){
    const has=id=>records(options).some(r=>r.id===id);
    let s=`<svg class="l-map" viewBox="0 0 1100 1095" role="img" aria-label="LCA matching landscape: algorithms and lower bounds plotted by guarantee family and symbolic probe bound. Separate panels distinguish adaptive probes, fixed-degree history and Non-adaptive probes."><title>The local matching landscape</title><desc>Axes are categorical formula lanes, not a universal numerical cost ranking in n and Delta. Green circles are algorithms and red diamonds are lower bounds. Near-optimal additive partner queries compare the derived LRY algorithm with BRR's lower bound in its stated parameter window. Historical results fix degree and accuracy. The Non-adaptive panel restores ABGS 2025 together with its algorithmic comparison.</desc>`;
    s+=text(20,29,'01','l-section-number')+text(57,29,'Adaptive local queries','l-section-title')+text(57,51,'General Δ · one consistent local matching · formula lanes are not a universal ordering in n and Δ','l-muted');
    s+='<g data-panel="adaptive">';
    s+=text(20,79,'Y · '+axes.adaptive.y.label.toUpperCase(),'l-axis-title','start','data-axis="y"');
    const lanes=[{y:105,label:'(Δ/ε)^{O(1/ε²)} polylog n'},{y:175,label:'Δ^{Ω(1/ε)}'},{y:245,label:'poly(Δ) log n'},{y:315,label:'O(Δ log n)'}];
    for(const lane of lanes)s+=`<path d="M250 ${lane.y}H1060" class="l-grid"/>`+svgFormula(230,lane.y+5,lane.label,'l-y-label','end');
    for(const x of [350,540,760,1000])s+=`<path d="M${x} 83V347" class="l-guide"/>`;
    s+=`<path d="M250 83V347H1060" class="l-axis"/>`;
    for(const [x,line,sub] of [[350,'fixed positive β','unspecified'],[540,'½','maximal'],[760,'(1−ε) OPT','multiplicative'],[1000,'OPT − εn','additive']])s+=text(x,367,line,'l-x-label','middle')+text(x,384,sub,'l-small','middle');
    s+=text(250,406,'X · '+axes.adaptive.x.label.toUpperCase(),'l-axis-title','start','data-axis="x"')+text(490,406,'Categorical columns · formula rows have no universal numeric order','l-muted');
    s+='<g data-panel="nearoptimal">'+plotSpecs.filter(spec=>spec.id==='lca-lry15-nearoptimal'||spec.id==='lca-brr23-nearoptimal-lower').map(spec=>plotted(spec,options)).join('');
    if(has('lca-lry15-nearoptimal')&&has('lca-brr23-nearoptimal-lower'))s+=`<path d="M1048 116V165M1043 116h10M1043 165h10" class="l-gap-bracket"/>`+text(1036,146,'gap','l-gap-label','end');
    if(has('lca-brr23-nearoptimal-lower'))s+=text(980,204,'ε ≤ 0.01 · log⁴ n ≤ Δ ≤ n^ε','l-range','end');
    s+='</g>'+plotSpecs.filter(spec=>spec.panel==='adaptive'&&!['lca-lry15-nearoptimal','lca-brr23-nearoptimal-lower'].includes(spec.id)).map(spec=>plotted(spec,options)).join('')+'</g>';
    s+=`<path d="M20 428H1080" class="l-panel-divider"/>`;
    s+=text(20,458,'02','l-section-number')+text(57,458,'Fixed-degree foundations','l-section-title')+text(57,480,'Fix Δ and ε · compare n-dependence only','l-muted');
    s+='<g data-panel="history" data-scope="fixed-Delta-epsilon">';
    s+=text(20,506,'Y · '+axes.history.y.label.toUpperCase().replace(/ N$/,' n'),'l-axis-title','start','data-axis="y"');
    for(const [y,t] of [[530,'O(log⁴ n)'],[570,'O(log³ n)'],[610,'poly(log* n)'],[650,'O(log* n)']])s+=`<path d="M250 ${y}H1060" class="l-grid"/>`+text(230,y+5,t,'l-y-label','end');
    for(const x of [450,850])s+=`<path d="M${x} 515V685" class="l-guide"/>`;
    s+=`<path d="M250 515V685H1060" class="l-axis"/>`+plotSpecs.filter(spec=>spec.panel==='history').map(spec=>plotted(spec,options)).join('');
    s+=text(450,707,'½ · maximal','l-x-label','middle')+text(850,707,'1−ε · near-optimal','l-x-label','middle');
    s+=text(250,735,'X · '+axes.history.x.label.toUpperCase(),'l-axis-title','start','data-axis="x"')+text(490,735,'Time bounds also bound probes · full Δ / ε factors in the inspector','l-muted');
    s+='</g>'+text(20,773,'Δ = maximum degree · n = vertices · click a paper for its exact output, success probability and parameter range.','l-muted');
    s+=`<path d="M20 790H1080" class="l-panel-divider"/>`;
    s+='<g data-panel="nonadaptive">'+text(20,822,'03','l-section-number')+text(57,822,'Non-adaptive local queries','l-section-title')+text(57,846,'General graphs · fixed probe schedule · randomized algorithms included','l-muted');
    s+=text(20,875,'Y · PROBES PER QUERY','l-axis-title','start','data-axis="y"');
    for(const [y,t] of [[900,'Δ^{O(log Δ / log log Δ)}'],[966,'Δ^{Ω(log Δ / log log Δ)}']])s+=`<path d="M250 ${y}H1060" class="l-grid"/>`+svgFormula(230,y+5,t,'l-y-label','end');
    s+=`<path d="M250 888V995H1060" class="l-axis"/>`+plotSpecs.filter(spec=>spec.panel==='nonadaptive').map(spec=>plotted(spec,options)).join('');
    s+=text(250,1020,'X · CONSTANT-FACTOR GUARANTEE','l-axis-title','start','data-axis="x"')+text(250,1044,'Matching upper and lower bounds up to constants in the exponent.','l-muted');
    s+=text(57,1077,'ABGS: Azarmehr · Behnezhad · Ghafari · Sudan, FOCS 2025. Input graphs need not be trees.','l-muted')+'</g>';
    return s+'</svg>';
  }
  function svgFormula(x,y,s,cls='',anchor='start'){
    return `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${esc(s).replace(/\^\{([^{}]*)\}/g,'<tspan baseline-shift="super" font-size="70%">$1</tspan>')}</text>`;
  }
  function summarySVG(key,w,h,options={}){
    const levels=['overview','compact','detail'],available=w<300||h<230?0:w<420||h<240?1:2,requested=levels.indexOf(options.level),level=levels[Math.min(available,requested<0?available:requested)],tiny=level==='overview',full=level==='detail',rich=full&&w>=600&&h>=360;
    const left=tiny?8:rich?130:full?46:22,right=w-(tiny?8:18),top=tiny?6:rich?40:26,bottom=h*.69-(tiny?7:full?34:23),gap=tiny?10:rich?69:full?54:38,split=top+(bottom-top)*.60;
    const regions={adaptive:{l:left,r:right,t:top,b:split-gap*.5},history:{l:left,r:right,t:split+gap*.5,b:bottom}};
    const visible=records(options),has=id=>visible.some(r=>r.id===id);
    const xy=(spec)=>{const a=panels[spec.panel],b=regions[spec.panel];return {x:b.l+(spec.x-a.l)/(a.r-a.l)*(b.r-b.l),y:b.t+(spec.y-a.t)/(a.b-a.t)*(b.b-b.t)}};
    let s=`<svg class="l-summary" data-detail-level="${level}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="LCA matching: three plots with matching guarantee on the x-axis and query cost on the y-axis. Adaptive probe costs use symbolic formula categories; the history panel fixes degree and accuracy to compare n-dependence.">`;
    for(const panel of ['adaptive','history']){
      const region=regions[panel],original=panels[panel];
      s+=`<g data-panel="${panel}"><path d="M${region.l} ${region.t}V${region.b}H${region.r}" class="l-axis"/>`;
      if(!tiny){
        const rows=panel==='adaptive'?[[105,'(Δ/ε)^{O(1/ε²)} polylog n'],[175,'Δ^{Ω(1/ε)}'],[245,'poly(Δ) log n'],[315,'O(Δ log n)']]:[[530,'O(log⁴ n)'],[570,'O(log³ n)'],[610,'poly(log* n)'],[650,'O(log* n)']];
        for(const [originalY,caption] of rows){const y=region.t+(originalY-original.t)/(original.b-original.t)*(region.b-region.t);s+=`<path d="M${region.l} ${y}H${region.r}" class="l-grid"/>`;if(rich)s+=svgFormula(region.l-9,y+3,caption,'l-summary-y-label','end')}
      }
      if(panel==='adaptive')s+='<g data-panel="nearoptimal">';
      for(const spec of plotSpecs.filter(spec=>spec.panel===panel&&has(spec.id))){
        const p=xy(spec),r=visible.find(r=>r.id===spec.id);
        s+=`<g data-lca-result="${spec.id}" data-guarantee-family="${spec.family}" data-resource-lane="${esc(spec.lane)}">${marker(p.x,p.y,r.kind,false,true)}`;
        if(spec.id==='lca-lry15-nearoptimal'){
          const partner=xy({...spec,x:1000});s+=`<path d="M${p.x+4} ${p.y}H${partner.x-4}" class="l-conversion"/>`+marker(partner.x,partner.y,'algorithm',false,true,true);
        }
        if(full&&['lca-lry15-nearoptimal','lca-brr23-nearoptimal-lower','lca-kmnft19-constant'].includes(spec.id))s+=text(p.x-6,p.y-6,spec.label,r.kind==='lower'?'l-summary-lower':'l-summary-upper','end');
        if(rich&&panel==='history')s+=text(p.x+7,p.y-5,spec.label,'l-summary-upper');
        s+='</g>';
      }
      if(panel==='adaptive')s+='</g>';
      if(!tiny){
        s+=text(region.l,region.t-10,panel==='adaptive'?'Adaptive queries · formula categories':'Fixed Δ, ε · n-dependence','l-summary-title');
        if(full){
          const ticks=panel==='adaptive'?[[350,'β > 0'],[540,'½'],[760,'(1−ε) OPT'],[1000,'OPT−εn']]:[[450,'½ · maximal'],[850,'1−ε · near-optimal']];
          for(const [originalX,caption] of ticks){const x=region.l+(originalX-original.l)/(original.r-original.l)*(region.r-region.l);s+=text(x,region.b+14,caption,'l-summary-note','middle')}
          s+=text(region.r,region.b+29,'X · matching guarantee','l-summary-axis','end','data-axis="x"');
          if(rich)s+=text(10,region.t-10,panel==='adaptive'?'Y · probes / query':'Y · cost in n','l-summary-axis','start','data-axis="y"');
          else s+=`<text data-axis="y" class="l-summary-axis" text-anchor="middle" transform="translate(11 ${(region.t+region.b)/2}) rotate(-90)">${panel==='adaptive'?'Y · probes/query':'Y · cost in n'}</text>`;
        }else s+=text(region.l,region.b+15,panel==='adaptive'?'Y: probes / query · X: guarantee':'Y: cost in n · X: guarantee','l-summary-note');
      }
      s+='</g>';
    }
    const stripTop=h*.74,stripY=tiny?h*.87:h*.88,x1=tiny?w*.3:w*.36,x2=tiny?w*.76:w*.77;
    s+='<g data-panel="nonadaptive">'+`<path d="M${tiny?8:18} ${stripTop-8}H${w-(tiny?8:18)}" class="l-panel-divider"/>`;
    if(!tiny)s+=text(18,stripTop+7,'Non-adaptive · general graphs','l-summary-title');
    for(const [id,x] of [['lca-bcgs17-nonadaptive',x1],['lca-abgs25-nonadaptive-lower',x2]]){
      const r=visible.find(r=>r.id===id),spec=plotSpecs.find(s=>s.id===id);if(!r)continue;
      const color=r.kind==='lower'?'l-summary-lower':'l-summary-upper';
      s+=`<g data-lca-result="${id}" data-guarantee-family="${spec.family}" data-resource-lane="${esc(spec.lane)}">`+marker(x,stripY,r.kind,false,true);
      if(!tiny){s+=svgFormula(x,stripY-9,r.kind==='lower'?'Δ^{Ω(log Δ/log log Δ)}':'Δ^{O(log Δ/log log Δ)}','l-summary-nonadaptive-bound '+color,'middle');s+=text(x,stripY+18,r.kind==='lower'?'ABGS’25 · lower':'BCGS’17 · derived',color,'middle');}
      s+='</g>';
    }
    if(rich)s+=text(18,h-4,'Fixed probe schedule · constants in exponent match','l-summary-note');
    return s+'</g></svg>';
  }
  function mount(root,key='lca',options={}){
    for(const instance of instances)if(!instance.root.isConnected||instance.root===root)instance.destroy();
    window.StreamingMatching?.release(root);window.DynamicMatching?.release(root);window.LocalMatching?.release(root);window.MPCMatching?.release(root);window.ListQueryMatching?.release(root);
    const controller=new AbortController(),prefix='lca-'+(++serial);let publication=options.publication||'all',selected=key==='lca-nonadaptive'?'lca-abgs25-nonadaptive-lower':key==='lca-maximal'?'lca-gha22-maximal':key==='lca-adaptive'?'lca-kmnft19-constant':'lca-brr23-nearoptimal-lower';
    const opts=()=>({publication,selected});
    root.classList.remove('query-list-view','mpc-view','dynamic-view','streaming-view','local-view');root.classList.add('focus-view','lca-view');root.classList.toggle('f-embedded',!!options.embedded);root.setAttribute('aria-label','LCA matching algorithms and lower bounds');
    root.innerHTML=`<p class="f-kicker">MATCHING × LOCAL COMPUTATION / THE PROBE LANDSCAPE</p><header class="f-hero"><div><h1>Matching through local probes.</h1><p>How much of a graph must one explore to answer one matching query?</p></div><div class="f-seal"><strong>Algorithms &amp; lower bounds</strong>Primary sources · ${esc(data.reviewedOn)}</div></header><div class="f-scope"><span><b>Graph</b> general, unweighted, simple</span><span><b>Access</b> indexed adjacency lists</span><span><b>Resource</b> probes per local query</span><span><b>Δ</b> maximum degree</span></div><section class="l-landscape" aria-labelledby="${prefix}-legend"><div class="l-toolbar"><div class="l-legend" id="${prefix}-legend"><span><i class="l-key-algorithm"></i>Algorithm upper bound</span><span><i class="l-key-lower"></i>Impossibility lower bound</span><span><i class="l-key-derived"></i>Derived partner guarantee</span></div><label class="l-publication-control">Sources <select class="l-publication-select" aria-label="LCA publication filter"><option value="all">All verified sources</option><option value="published">Published only</option></select></label></div><div class="l-plot-scroll" tabindex="0" aria-label="LCA matching figure; scroll horizontally on narrow screens"><div class="l-plot-host"></div></div><div class="l-chart-notes"><p><b>Edge membership → partner.</b> The outlined LRY point is the additive partner-query guarantee derived from its stronger multiplicative algorithm. Finding a vertex’s partner from edge membership multiplies the probe cost by at most O(Δ); the simplified bound absorbs this factor.</p><p><b>Local means one consistent matching.</b> Edge membership, matched status and partner lookup are different interfaces. Their distinctions remain visible in the theorem inspector.</p></div></section><section class="l-theorem" id="${prefix}-theorem" aria-label="Selected LCA theorem" aria-live="polite"></section><section class="l-size-section"><div class="l-section-head"><h2>Global size is a different output</h2><p>Total probes for one estimate, rather than probes per local matching query.</p></div><div class="l-size-results"></div></section><details class="l-evidence"><summary>All displayed local results &amp; exact statements</summary><div class="l-evidence-list"></div></details><div class="f-bottom"><span>Formula lanes are symbolic; only the historical panel orders costs after fixing Δ and ε.</span><span>Click a result to inspect its output, probability, parameter range and primary theorem.</span></div>`;
    function button(r,extra=''){return `<button type="button" data-lca-result="${esc(r.id)}" class="l-record ${r.kind==='lower'?'l-record-lower':''} ${extra}" aria-pressed="${r.id===selected}"><span>${esc(label(r))}${r.setupTag?' · '+esc(r.setupTag):''}${r.randomization==='deterministic'?' · deterministic':''}</span><strong>${math(r.displayBound||r.simplifiedBound||r.queryComplexity)}</strong><small>${human(r.quality)}</small>${r.id.startsWith('size-')?`<small class="l-card-scope">${human(r.graph||r.oracle||'')}</small>`:''}</button>`}
    function detail(){
      const r=allRecords(opts()).find(r=>r.id===selected);if(!r)return;
      const authors=Array.isArray(r.authors)?r.authors.join(', '):r.authors;
      root.querySelector('.l-theorem').innerHTML=`<div class="l-theorem-top"><span class="l-type ${r.kind==='lower'?'l-lower-type':''}">${r.kind==='lower'?'Lower-bound theorem':'Algorithm guarantee'}</span><strong>${esc(label(r))}${r.setupTag?' · '+esc(r.setupTag):''}</strong><span>${esc(r.venue||r.publicationStatus||'')}</span></div><div class="l-detail-grid"><div><span>Probe / time bound</span><strong>${math(r.queryComplexity)}</strong></div><div><span>Quality</span><strong>${human(r.quality)}</strong></div><div><span>Output contract</span><strong>${esc(r.output)}</strong></div></div><p><b>Scope.</b> ${human(r.graph||'See source statement')} · ${esc(r.adaptivity||r.oracle||'')}</p>${r.probability?`<p><b>Probability.</b> ${human(r.probability)}</p>`:''}<details class="l-theorem-more"><summary>Exact theorem, assumptions &amp; source</summary><h3>${esc(r.title||label(r))}</h3><p>${esc(authors)}</p><p><b>${esc(r.theorem||'Source cross-reference')}</b> · ${human(r.oracle)}</p>${r.notes?`<p>${human(r.notes)}</p>`:''}${r.verification?`<p>${human(r.verification)}</p>`:''}${r.url?`<p><a href="${esc(r.fullTextUrl||r.url)}" target="_blank" rel="noopener noreferrer">Read primary source ↗</a>${r.publicationUrl?` · <a href="${esc(r.publicationUrl)}" target="_blank" rel="noopener noreferrer">Publication ↗</a>`:''}</p>`:''}</details>`;
    }
    function render(){
      const rows=records(opts()),all=allRecords(opts());if(!all.some(r=>r.id===selected))selected=rows[0]?.id;
      root.querySelector('.l-publication-select').value=publication;
      root.querySelector('.l-plot-host').innerHTML=diagramSVG(opts());
      const size=all.filter(r=>r.id.startsWith('size-')&&r.evidenceStatus!=='cross_reference_verified'&&r.evidenceStatus!=='needs_conversion_check');
      root.querySelector('.l-size-results').innerHTML=`<div class="l-size-bridge"><span>LOCAL → GLOBAL</span><strong>Sample vertices and query matched status.</strong><p>O(ε⁻² log(1/δ)) vertex samples estimate the chosen matching’s size to additive O(εn). Multiply by each local-query cost; edge membership also needs the Δ conversion. This is an additive estimator.</p></div>${size.map(r=>button(r)).join('')}`;
      root.querySelector('.l-evidence-list').innerHTML=rows.filter(r=>!r.id.startsWith('size-')).map(r=>button(r)).join('');detail();
    }
    const select=id=>{selected=id;render()};
    root.addEventListener('click',event=>{const result=event.target.closest('[data-lca-result]');if(result)select(result.dataset.lcaResult)},{signal:controller.signal});
    root.addEventListener('keydown',event=>{if(event.key!=='Enter'&&event.key!==' ')return;const result=event.target.closest('.l-plot-result');if(result){event.preventDefault();select(result.dataset.lcaResult)}},{signal:controller.signal});
    root.addEventListener('change',event=>{if(event.target.classList.contains('l-publication-select')){publication=event.target.value;render();options.onPublicationChange?.(publication)}},{signal:controller.signal});
    render();const instance={root,settingKey:'lca',redraw:render,destroy(){controller.abort();instances.delete(instance)}};instances.add(instance);return instance;
  }
  window.LCAMatching={mount,summarySVG,diagramSVG,records,release(root){for(const instance of instances)if(!instance.root.isConnected||instance.root===root)instance.destroy()}};
})();
