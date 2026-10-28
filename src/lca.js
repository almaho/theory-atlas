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
  const plotSpecs=[
    {id:'lca-bcgs17-nonadaptive',panel:'nonadaptive',family:'constant-approximation',lane:'Delta^{O(log Delta/loglog Delta)}',x:540,y:385,label:'BCGS’17 · derived LCA',sub:'1/(2+ε) approximation · fixed ε',lx:562,ly:380},
    {id:'lca-abgs25-nonadaptive-lower',panel:'nonadaptive',family:'constant-approximation',lane:'Delta^{Omega(log Delta/loglog Delta)}',x:350,y:455,label:'ABGS’25 · Non-adaptive',sub:'any fixed positive approximation',lx:372,ly:450},
    {id:'lca-kmnft19-constant',panel:'adaptive',family:'constant-unspecified',lane:'O(Delta log n)',x:350,y:315,label:'KMNFT’19',sub:'constant factor in expectation',lx:371,ly:310},
    {id:'lca-gha22-maximal',panel:'adaptive',family:'maximal',lane:'poly(Delta) log n',x:540,y:245,label:'Ghaffari’22',sub:'maximal · degree exponent unspecified',lx:561,ly:240},
    {id:'lca-lry15-nearoptimal',panel:'adaptive',family:'multiplicative-nearoptimal',lane:'(Delta/epsilon)^{O(1/epsilon^2)} polylog n',x:760,y:105,label:'LRY’15',sub:'edge membership',lx:740,ly:100,anchor:'end'},
    {id:'lca-brr23-nearoptimal-lower',panel:'adaptive',family:'additive-nearoptimal',lane:'Delta^{Omega(1/epsilon)}',x:1000,y:175,label:'BRR’23',sub:'partner query · even bipartite',lx:980,ly:169,anchor:'end'},
    {id:'lca-mrvx12-maximal',panel:'history',family:'maximal',lane:'O(log^3 n)',x:450,y:712,label:'MRVX’12',sub:'time per edge query',lx:470,ly:706},
    {id:'lca-mv13-nearoptimal',panel:'history',family:'multiplicative-nearoptimal',lane:'O(log^4 n)',x:850,y:672,label:'MV’13',sub:'time per edge query',lx:830,ly:666,anchor:'end'},
    {id:'lca-emr14-maximal',panel:'history',family:'maximal',lane:'log* n',x:450,y:792,label:'EMR’14',sub:'deterministic probes',lx:470,ly:786},
    {id:'lca-emr14-nearoptimal',panel:'history',family:'multiplicative-nearoptimal',lane:'poly(log* n)',x:850,y:752,label:'EMR’14',sub:'deterministic probes',lx:830,ly:746,anchor:'end'}
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
    body+=spec.panel==='nonadaptive'?square(spec.x,spec.y,r.kind):marker(spec.x,spec.y,r.kind,spec.id===options.selected);
    body+=text(spec.lx,spec.ly,spec.label,'l-paper-label',spec.anchor||'start')+text(spec.lx,spec.ly+17,spec.sub,'l-point-note',spec.anchor||'start');
    if(spec.id==='lca-lry15-nearoptimal')body+=`<path d="M771 105H989" class="l-conversion"/>`+marker(1000,105,'algorithm',false,false,true)+text(1000,75,'derived partner bound','l-point-note','middle')+text(880,128,'Edge membership → partner','l-point-note','middle');
    return clickable(spec,r.kind,options.selected,body);
  }

  function square(x,y,kind,mini=false){
    const r=mini?3:6,c='var(--'+(kind==='lower'?'red':'green')+')';
    return '<rect data-marker="'+(kind==='lower'?'lower':'algorithm')+'" data-adaptivity="nonadaptive" data-center-x="'+x+'" data-center-y="'+y+'" x="'+(x-r)+'" y="'+(y-r)+'" width="'+2*r+'" height="'+2*r+'" fill="'+(kind==='lower'?'var(--surface)':c)+'" stroke="'+c+'" stroke-width="2"/>';
  }
  function diagramSVG(options={}){
    let s='<svg class="l-map" viewBox="0 0 1100 950" role="img" aria-label="LCA matching: adaptive and non-adaptive results on shared guarantee and probe-cost axes. Squares are non-adaptive only."><title>The local matching landscape</title><desc>Formula rows are categorical, not a numerical cost ranking. Fixed-degree history remains separate.</desc>';
    s+=text(20,29,'01','l-section-number')+text(57,29,'One probe landscape · adaptive and non-adaptive','l-section-title')+text(57,51,'Circles / diamonds: adaptive allowed · squares: non-adaptive only · green: algorithms · red: lower bounds','l-muted');
    s+='<g data-panel="shared-probes">'+text(20,79,'Y · PROBES PER QUERY · SYMBOLIC FORMULA CATEGORIES','l-axis-title','start','data-axis="y"');
    for(const [y,t] of [[105,'(Δ/ε)^{O(1/ε²)} polylog n'],[175,'Δ^{Ω(1/ε)}'],[245,'poly(Δ) log n'],[315,'O(Δ log n)'],[385,'Δ^{O(log Δ / log log Δ)}'],[455,'Δ^{Ω(log Δ / log log Δ)}']])s+='<path d="M250 '+y+'H1060" class="l-grid"/>'+svgFormula(230,y+5,t,'l-y-label','end');
    for(const x of [350,540,760,1000])s+='<path d="M'+x+' 83V490" class="l-guide"/>';
    s+='<path d="M250 83V490H1060" class="l-axis"/>';
    for(const [x,t,u] of [[350,'fixed positive β','unspecified'],[540,'½ / near ½','maximal / approximate'],[760,'(1−ε) OPT','multiplicative'],[1000,'OPT − εn','additive']])s+=text(x,510,t,'l-x-label','middle')+text(x,527,u,'l-small','middle');
    s+=text(250,549,'X · MATCHING GUARANTEE FAMILY','l-axis-title','start','data-axis="x"');
    s+='<g data-panel="adaptive"><g data-panel="nearoptimal">'+plotSpecs.filter(p=>p.panel==='adaptive').map(p=>plotted(p,options)).join('')+'</g></g>';
    s+='<g data-panel="nonadaptive" data-scope="fixed-probe-schedule">'+plotSpecs.filter(p=>p.panel==='nonadaptive').map(p=>plotted(p,options)).join('')+'</g></g>';
    s+=text(980,204,'ε ≤ 0.01 · log⁴ n ≤ Δ ≤ n^ε','l-range','end')+text(57,575,'The red non-adaptive square is not a barrier for adaptive algorithms. Same axes preserve each theorem scope.','l-muted');
    s+='<path d="M20 593H1080" class="l-panel-divider"/>'+text(20,622,'02','l-section-number')+text(57,622,'Fixed-degree foundations','l-section-title')+text(57,644,'Fix Δ and ε · compare n-dependence only','l-muted');
    s+='<g data-panel="history" data-scope="fixed-Delta-epsilon">';
    for(const [y,t] of [[672,'O(log⁴ n)'],[712,'O(log³ n)'],[752,'poly(log* n)'],[792,'O(log* n)']])s+='<path d="M250 '+y+'H1060" class="l-grid"/>'+text(230,y+5,t,'l-y-label','end');
    s+='<path d="M250 657V827H1060" class="l-axis"/>'+plotSpecs.filter(p=>p.panel==='history').map(p=>plotted(p,options)).join('');
    s+=text(450,849,'½ · maximal','l-x-label','middle')+text(850,849,'1−ε · near-optimal','l-x-label','middle')+text(250,877,'X · GUARANTEE · Y · COST IN n','l-axis-title')+'</g>';
    s+=text(20,912,'ABGS: Azarmehr · Behnezhad · Ghafari · Sudan, FOCS 2025. Non-adaptive does not mean tree input.','l-muted')+text(20,934,'Select a point for exact output, probability, graph class, probe schedule and source.','l-muted');
    return s+'</svg>';
  }
  function svgFormula(x,y,s,cls='',anchor='start'){
    return `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${esc(s).replace(/\^\{([^{}]*)\}/g,'<tspan baseline-shift="super" font-size="70%">$1</tspan>')}</text>`;
  }

  function summarySVG(key,w,h,options={}){
    const levels=['overview','compact','detail'],capacity=w<220||h<140?0:w<420||h<240?1:2,requested=levels.indexOf(options.level),level=levels[Math.min(capacity,requested<0?capacity:requested)],tiny=level==='overview',full=level==='detail',rich=full&&w>=650&&h>=420,visible=records(options);
    let s='<svg class="l-summary" data-detail-level="'+level+'" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="Shared LCA matching plot; square markers are non-adaptive only. Fixed-degree history below.">';
    for(const panel of ['adaptive','history']){
      const upper=panel==='adaptive',left=tiny?8:rich?190:full?52:22,right=w-12,top=(upper?0:h*.67)+(tiny?7:26),bottom=(upper?h*.64:h)-(tiny?8:full?35:23),a=upper?{t:83,b:490}:{t:657,b:827};
      const px=x=>left+(x-250)/810*(right-left),py=y=>top+(y-a.t)/(a.b-a.t)*(bottom-top);
      s+='<g data-panel="'+panel+'"><path d="M'+left+' '+top+'V'+bottom+'H'+right+'" class="l-axis"/>';
      if(rich){
        const lanes=upper?[[105,'(Δ/ε)^{O(1/ε²)} polylog n'],[175,'Δ^{Ω(1/ε)}'],[245,'poly(Δ) log n'],[315,'O(Δ log n)'],[385,'Δ^{O(log Δ / log log Δ)}'],[455,'Δ^{Ω(log Δ / log log Δ)}']]:[[672,'O(log⁴ n)'],[712,'O(log³ n)'],[792,'log* n']];
        for(const [y,t] of lanes)s+='<path d="M'+left+' '+py(y)+'H'+right+'" class="l-grid"/>'+svgFormula(left-10,py(y)+3,t,'l-summary-y-label','end');
        for(const [x,t] of (upper?[[350,'fixed β > 0'],[540,'½ / near ½'],[760,'(1−ε) OPT'],[1000,'OPT − εn']]:[[450,'maximal'],[850,'(1−ε) OPT']]))s+=text(px(x),bottom+14,t,'l-summary-y-label','middle');
      }
      if(upper)s+='<g data-panel="nearoptimal">';
      for(const spec of plotSpecs.filter(p=>upper?p.panel!=='history':p.panel==='history')){
        const r=visible.find(r=>r.id===spec.id);if(!r)continue;const non=spec.panel==='nonadaptive';
        s+='<g '+(non?'data-panel="nonadaptive" ':'')+'data-lca-result="'+spec.id+'" data-guarantee-family="'+spec.family+'" data-resource-lane="'+esc(spec.lane)+'">'+(non?square(px(spec.x),py(spec.y),r.kind,true):marker(px(spec.x),py(spec.y),r.kind,false,true));
        if(rich&&spec.id==='lca-lry15-nearoptimal')s+='<path d="M'+px(775)+' '+py(105)+'H'+px(989)+'" class="l-conversion"/>'+marker(px(1000),py(105),'algorithm',false,true,true);
        if(!tiny&&non)s+=text(px(spec.x)+8,py(spec.y)+3,r.kind==='lower'?'ABGS’25':'BCGS’17','l-summary-'+(r.kind==='lower'?'lower':'upper'));
        if(full&&!non)s+=text(px(spec.x)-6,py(spec.y)-6,spec.label,'l-summary-'+(r.kind==='lower'?'lower':'upper'),'end');
        s+='</g>';
      }
      if(upper)s+='</g>';
      if(!tiny){
        s+=text(12,top-10,upper?'Adaptive + non-adaptive (squares)':'Fixed Δ, ε · foundations','l-summary-title')+text(right,bottom+(rich?29:18),'X · guarantee →','l-summary-axis','end','data-axis="x"');
        if(full)s+='<text data-axis="y" class="l-summary-axis" text-anchor="middle" transform="translate(12 '+((top+bottom)/2)+') rotate(-90)">Y · '+(upper?'probe formulas':'cost in n')+'</text>';
        else s+=text(left,bottom+18,'Y · cost','l-summary-axis');
      }
      s+='</g>';
    }
    return s+'</svg>';
  }
  function mount(root,key='lca',options={}){
    for(const instance of instances)if(!instance.root.isConnected||instance.root===root)instance.destroy();
    window.StreamingMatching?.release(root);window.DynamicMatching?.release(root);window.LocalMatching?.release(root);window.MPCMatching?.release(root);window.ListQueryMatching?.release(root);
    const controller=new AbortController(),prefix='lca-'+(++serial);let publication=options.publication||'all',selected=key==='lca-nonadaptive'?'lca-abgs25-nonadaptive-lower':key==='lca-maximal'?'lca-gha22-maximal':key==='lca-adaptive'?'lca-kmnft19-constant':'lca-brr23-nearoptimal-lower';
    const opts=()=>({publication,selected});
    root.classList.remove('query-list-view','mpc-view','dynamic-view','streaming-view','local-view');root.classList.add('focus-view','lca-view');root.classList.toggle('f-embedded',!!options.embedded);root.setAttribute('aria-label','LCA matching algorithms and lower bounds');
    root.innerHTML=`<p class="f-kicker">MATCHING × LOCAL COMPUTATION / THE PROBE LANDSCAPE</p><header class="f-hero"><div><h1>Matching through local probes.</h1><p>How much of a graph must one explore to answer one matching query?</p></div><div class="f-seal"><strong>Algorithms &amp; lower bounds</strong>Primary sources · ${esc(data.reviewedOn)}</div></header><div class="f-scope"><span><b>Graph</b> general, unweighted, simple</span><span><b>Access</b> indexed adjacency lists</span><span><b>Resource</b> probes per local query</span><span><b>Δ</b> maximum degree</span></div><section class="l-landscape" aria-labelledby="${prefix}-legend"><div class="l-toolbar"><div class="l-legend" id="${prefix}-legend"><span><i class="l-key-algorithm"></i>Algorithm upper bound</span><span><i class="l-key-lower"></i>Impossibility lower bound</span><span><i class="l-key-derived"></i>Derived partner guarantee</span><span><i class="l-key-nonadaptive"></i>Square · non-adaptive only</span></div><label class="l-publication-control">Sources <select class="l-publication-select" aria-label="LCA publication filter"><option value="all">All verified sources</option><option value="published">Published only</option></select></label></div><div class="l-plot-scroll" tabindex="0" aria-label="LCA matching figure; scroll horizontally on narrow screens"><div class="l-plot-host"></div></div><div class="l-chart-notes"><p><b>Edge membership → partner.</b> The outlined LRY point is the additive partner-query guarantee derived from its stronger multiplicative algorithm. Finding a vertex’s partner from edge membership multiplies the probe cost by at most O(Δ); the simplified bound absorbs this factor.</p><p><b>Local means one consistent matching.</b> Edge membership, matched status and partner lookup are different interfaces. Their distinctions remain visible in the theorem inspector.</p></div></section><section class="l-theorem" id="${prefix}-theorem" aria-label="Selected LCA theorem" aria-live="polite"></section><section class="l-size-section"><div class="l-section-head"><h2>Global size is a different output</h2><p>Total probes for one estimate, rather than probes per local matching query.</p></div><div class="l-size-results"></div></section><details class="l-evidence"><summary>All displayed local results &amp; exact statements</summary><div class="l-evidence-list"></div></details><div class="f-bottom"><span>Formula lanes are symbolic; only the historical panel orders costs after fixing Δ and ε.</span><span>Click a result to inspect its output, probability, parameter range and primary theorem.</span></div>`;
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
