(()=>{
  'use strict';
  const collection=JSON.parse(document.getElementById('atlas-data').textContent).focus;
  const instances=new Set();let serial=0;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const math=s=>esc(s).replace(/\^\{([^{}]*)\}/g,'<sup>$1</sup>').replace(/_([εδ])/g,'<sub>$1</sub>');
  const source=(r,label='Primary source')=>`<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`;
  const E='var(--green)',S='var(--green)';
  const svgMath=s=>esc(s).replace(/\^\{([^{}]*)\}/g,'<tspan baseline-shift="super" font-size="9">$1</tspan>').replace(/_\{([^{}]*)\}/g,'<tspan baseline-shift="sub" font-size="9">$1</tspan>').replace(/_([εδ])/g,'<tspan baseline-shift="sub" font-size="9">$1</tspan>');
  // A broken approximation axis reserves a symbolic column for near-optimal families.
  // Runtime lanes are named asymptotic classes, never inferred numeric exponents.
  const x=v=>v>=.95?970:220+(v-.5)*3000;
  const specs=[
    {ids:['dynamic-edges-ns13'],beta:2/3,y:58,label:'NS’13',sub:'⅔ attained',lx:720,ly:39,anchor:'middle'},
    {ids:['dynamic-edges-gp13','gp2013-size'],beta:1,y:58,label:'GP’13',sub:'1/(1+ε)',lx:946,ly:38,anchor:'end'},
    {ids:['dynamic-edges-abkl23'],beta:1,y:111,label:'ABKL’23',sub:'1−o(1)',lx:946,ly:107,anchor:'end'},
    {ids:['dynamic-edges-ms25'],beta:1,y:159,label:'MS’25',sub:'1/(1+ε)',lx:946,ly:155,anchor:'end'},
    {ids:['bks2023-size'],beta:1,y:220,label:'BKS’23',sub:'1/(1+ε)',lx:946,ly:215,anchor:'end'},
    {ids:['dynamic-edges-cks26-det'],beta:.5,y:284,label:'CKS’26 · deterministic',sub:'maximal matching',lx:241,ly:278},
    {ids:['dynamic-edges-cks26-rand'],beta:.5,y:337,label:'CKS’26 · randomized',sub:'maximal matching',lx:241,ly:332},
    {ids:['dynamic-edges-gssu22','dynamic-edges-bs16','gssu2022-size'],beta:2/3,y:337,label:'BS’16 · GSSU’22',sub:'1/(3/2+ε)',lx:700,ly:314,anchor:'end'},
    {ids:['dynamic-edges-bk22-k2'],beta:.609,y:393,label:'BK’22 · k=2',sub:'0.609−ε',lx:568,ly:388},
    {ids:['dynamic-edges-bk22-k3'],beta:.532,y:447,label:'BK’22 · k=3',sub:'0.532−ε',lx:337,ly:441},
    {ids:['dynamic-edges-bgs11','dynamic-edges-solomon16','dynamic-edges-kiss22','dynamic-edges-bhn16','kiss2022-size'],beta:.5,y:559,label:'BGS’11 · S’16',sub:'BHN’16 · Kiss’22',lx:174,ly:580,anchor:'end',leader:true},
    {ids:['beh2023-size'],beta:.501,y:559,label:'B’22',sub:'0.501',lx:275,ly:535,leader:true},
    {ids:['bksw2023-size'],beta:1/1.973,y:559,label:'BKSW’22',sub:'≈0.5068−O(ε)',lx:336,ly:577,leader:true},
    {ids:['abr2024-size'],beta:2-Math.SQRT2,y:559,label:'ABR’23',sub:'2−√2−ε ≈ 0.5858−ε',lx:498,ly:543}
  ];
  const allRecords=()=>['dynamic-edges','dynamic-size'].flatMap(key=>[...collection[key].results,...collection[key].relatedResults].map(r=>({...r,outputKey:key})));
  const allowed=(r,o={})=>(o.publication!=='published'||r.publicationStatus!=='preprint')&&(r.kind==='conditional_barrier'||o.scope!=='adaptive'||r.adversary!=='oblivious')&&(r.kind==='conditional_barrier'||o.scope!=='deterministic'||r.randomization==='deterministic')&&(!o.output||o.output==='both'||r.outputKey===o.output);
  const records=o=>allRecords().filter(r=>allowed(r,o));
  const find=(id,o)=>records(o).find(r=>r.id===id);
  const groupRows=(spec,o)=>spec.ids.map(id=>find(id,o)).filter(Boolean);
  const orsIds=['dynamic-edges-bg24','dynamic-edges-akk25','dynamic-edges-ms25-ors'];
  const orsLabels={
    'dynamic-edges-bg24':'Behnezhad–Ghafari · FOCS 2024',
    'dynamic-edges-akk25':'Assadi–Khanna–Kiss · SODA 2025',
    'dynamic-edges-ms25-ors':'Mitrović–Sheu · SPAA 2025'
  };
  const orsRows=o=>orsIds.map(id=>find(id,o)).filter(Boolean);
  // These are algorithm bounds in an unresolved extremal parameter, not fixed
  // coordinates on the n-only runtime axis. Keep them in the main figure.
  function orsPanel(px,py,w,h,options={},interactive=false,level='detail'){
    const rows=orsRows(options);if(!rows.length)return '';
    const tiny=level==='overview',compact=level==='compact',large=interactive;
    const text=(x,y,t,size=11,color='var(--ink)',bold=false)=>`<text x="${x}" y="${y}" style="font:${size}px ui-sans-serif,system-ui,sans-serif;fill:${color};font-weight:${bold?600:400}">${svgMath(t)}</text>`;
    let s=`<g data-panel="ors" data-axis-type="parameterized" transform="translate(${px} ${py})"><path d="M0 0H${w}" stroke="var(--line)"/>`;
    if(tiny){rows.forEach((r,i)=>s+=`<circle data-ors-result="${r.id}" cx="${w*(i+1)/(rows.length+1)}" cy="${h/2}" r="2" fill="var(--green)"/>`);return s+'</g>';}
    s+=text(8,compact?15:21,compact?'ORS · near-optimal edges':'Near-optimal edges · Ordered Ruzsa–Szemerédi graphs',compact?10:large?16:12,'var(--ink)',true);
    if(!compact)s+=text(8,large?43:39,'Randomized · adaptive adversary · amortized update time',large?12:10,'var(--muted)');
    const start=compact?32:large?74:62,step=compact?19:large?43:27;
    rows.forEach((r,i)=>{
      const y=start+i*step,label=compact?orsLabels[r.id].replace(' · FOCS ',' ’').replace(' · SODA ',' ’').replace(' · SPAA ',' ’').replace('202','2'):orsLabels[r.id];
      s+=`<g class="d-plot-result" data-dynamic-result="${r.id}" data-ors-result="${r.id}"${interactive?' role="button" tabindex="0"':''} aria-label="${esc(orsLabels[r.id]+': '+r.formula+'; '+r.updateTime+'. Inspect theorem.')}" aria-pressed="${options.selected===r.id}"><title>${esc(r.title+' · '+r.authors+' · '+r.updateTime)}</title><circle cx="12" cy="${y-4}" r="${large?5:3.5}" fill="var(--green)"/>`;
      s+=text(24,y,label,compact?9:large?14:11,'var(--green)',true);
      if(!compact){s+=text(w*.47,y,r.updateTime,large?13:11,'var(--green)');if(large)s+=text(24,y+17,'β = '+r.formula,11,'var(--muted)');}
      s+='</g>';
    });
    if(!compact){s+=text(8,h-23,'ORSₙ(r): maximum number of ordered induced matchings of size r.',large?11:9,'var(--muted)');s+=text(8,h-8,'The linear-size parameter differs by theorem; exact dependence is in the paper links.',large?11:9,'var(--muted)');}
    return s+'</g>';
  }
  function marker(px,py,rows,selected,mini=false){
    const edge=rows.some(r=>r.outputKey==='dynamic-edges'),size=rows.some(r=>r.outputKey==='dynamic-size'),limit=rows.every(r=>r.ratioIsLimit),mixed=rows.some(r=>r.ratioIsLimit)&&!limit,oblivious=rows.every(r=>r.adversary==='oblivious'),r=mini?3:5;
    const common=`data-center-x="${px}" data-center-y="${py}" fill="${limit?'var(--surface)':E}" stroke="${E}" stroke-width="${mini?1.4:2}" ${oblivious?'stroke-dasharray="2 1"':''}`;
    return `${selected&&!mini?`<circle cx="${px}" cy="${py}" r="13" fill="${E}" opacity=".12"/>`:''}${limit&&!mini?`<path d="M${px-18},${py}h11" stroke="${E}" stroke-width="2"/>`:''}${edge?`<circle data-output="edges" cx="${px}" cy="${py}" r="${r}" ${common}/>`:`<rect data-output="size" x="${px-r}" y="${py-r}" width="${r*2}" height="${r*2}" ${common}/>`}${mixed&&!mini?`<circle cx="${px}" cy="${py}" r="8" fill="none" stroke="${E}" stroke-width="1.4"/>`:''}${edge&&size&&!mini?`<rect data-output="inherited-size" x="${px-9}" y="${py-9}" width="18" height="18" fill="none" stroke="${S}" stroke-width="1" opacity=".7"/>`:''}`;
  }
  function diagramSVG(options={}){
    const groups=specs.map(spec=>({spec,rows:groupRows(spec,options)})).filter(g=>g.rows.length);
    const text=(px,py,t,cls='',anchor='start')=>`<text x="${px}" y="${py}" class="${cls}" text-anchor="${anchor}">${svgMath(t)}</text>`;
    const lanes=[{y:58,t:'O_ε(n)'},{y:111,t:'n / (log* n)^{Ω(1)}'},{y:159,t:'n / 2^{Ω(√log n)}'},{y:220,t:'n^{1−Ω_ε(1)}',note:'exponent unspecified'},{y:284,t:'n^{1/2+o(1)}'},{y:337,t:'Õ(√n)'},{y:393,t:'Õ(n^{1/3})'},{y:447,t:'Õ(n^{1/4})'},{y:500,t:'Õ(n^{δ})',note:'any small fixed δ > 0'},{y:559,t:'polylog n / O(1)'}];
    const hasOrs=orsRows(options).length>0;
    let svg=`<svg class="d-map" viewBox="0 0 1100 ${hasOrs?920:666}" role="img" aria-label="Fully dynamic matching: approximation versus update time, with a main panel for ORS-dependent algorithms. Green circles maintain edges and squares estimate size. Red is reserved for separately scoped lower bounds."><title>Fully dynamic matching — approximation, update time and ORS-dependent algorithms</title><desc>General unweighted graphs, edge insertions and deletions. Runtime lanes are schematic asymptotic bounds. Open points show limiting approximation ratios. The near-optimal column approaches one. The ORS panel includes Behnezhad–Ghafari 2024 and subsequent algorithms without assigning an unsupported n exponent.</desc>`;
    svg+=`<rect x="185" y="193" width="845" height="52" rx="5" fill="${S}" opacity=".045"/><rect x="185" y="86" width="845" height="96" rx="5" fill="var(--ink)" opacity=".025"/>`;
    svg+=text(12,18,'UPDATE TIME','d-axis-title')+text(1024,18,'Better approximation →','d-muted','end');
    for(const l of lanes){
      svg+=`<path d="M185 ${l.y}H1030" class="d-grid"/>`+text(169,l.y+4,l.correct||l.t,'d-y-label','end');
      if(l.note)svg+=text(169,l.y+20,l.note,'d-micro','end');
    }
    // Dashed vertical guides do not assert a feasible frontier or impossibility boundary.
    for(const b of [.5,.532,2-Math.SQRT2,.609,2/3,1])svg+=`<path d="M${x(b)} 44V617" class="d-guide"/>`;
    svg+=`<path d="M185 32V617H799 M830 617H1030" class="d-axis"/><path d="M802 622l10-10m2 10l10-10" class="d-axis"/>`;
    for(const [b,t] of [[.5,'½'],[.532,'.532'],[2-Math.SQRT2,'.5858'],[.609,'.609'],[2/3,'⅔'],[1,'→ 1']])svg+=text(x(b),637,t,'d-x-label','middle');
    svg+=text(185,660,'GUARANTEED FRACTION β','d-axis-title')+text(970,660,'near-optimal families','d-micro','middle');
    for(const {spec:original,rows} of groups){
      const s={...original},has=id=>rows.some(r=>r.id===id);
      if(s.ids.includes('dynamic-edges-bgs11')){
        const old=[has('dynamic-edges-bgs11')?'BGS’11':'',has('dynamic-edges-solomon16')?'S’16':''].filter(Boolean),later=[has('dynamic-edges-bhn16')?'BHN’16':'',has('dynamic-edges-kiss22')||has('kiss2022-size')?'Kiss’22':''].filter(Boolean);
        s.label=(old.length?old:later).join(' · ');s.sub=old.length&&later.length?later.join(' · '):old.length?'½ · maximal':'1/(2+ε)';
      }
      if(s.ids.includes('dynamic-edges-bs16'))s.label=[has('dynamic-edges-bs16')?'BS’16':'',has('dynamic-edges-gssu22')||has('gssu2022-size')?'GSSU’22':''].filter(Boolean).join(' · ');
      const px=x(s.beta),c=rows.some(r=>r.outputKey==='dynamic-edges')?E:S,selected=rows.some(r=>r.id===options.selected),id=rows[0].id;
      svg+=`<g class="d-plot-result" role="button" tabindex="0" data-dynamic-result="${esc(id)}" data-group="${esc(s.ids[0])}" data-beta="${s.beta}" aria-pressed="${selected}" aria-label="${esc(s.label+': '+rows.map(r=>r.formula+', '+r.updateTime).join('; ')+'. Inspect theorem.')}" style="--d-marker:${c}"><title>${esc(rows.map(r=>`${r.rowName} · ${r.formula} · ${r.updateTime} · ${r.timeType} · ${r.adversary}`).join('\n'))}</title>`;
      if(s.leader)svg+=`<path d="M${px} ${s.y}L${s.lx+(s.anchor==='end'?-8:8)} ${s.ly+(s.ly<s.y?17:-9)}" stroke="${c}" stroke-width="1" fill="none" opacity=".65"/>`;
      svg+=marker(px,s.y,rows,selected)+`<text x="${s.lx}" y="${s.ly}" text-anchor="${s.anchor||'start'}" class="d-paper-label" fill="${c}">${esc(s.label)}<tspan x="${s.lx}" dy="17" class="d-point-formula">${esc(s.sub+' · '+[...new Set(rows.map(r=>(r.timeType||'').includes('amortized')?'A':'W'))].sort().join('/'))}</tspan></text></g>`;
    }
    const blm=find('dynamic-edges-blm20',options);
    if(blm)svg+=`<g class="d-plot-result" role="button" tabindex="0" data-dynamic-result="${blm.id}" aria-label="BLM 2020: symbolic improvement above one half in n to delta update time" style="--d-marker:${E}"><path d="M225 500h45m-6-4l6 4-6 4" fill="none" stroke="${E}" stroke-width="1.7" stroke-dasharray="3 2"/><text x="289" y="497" class="d-paper-label" fill="${E}">BLM’20<tspan x="289" dy="17" class="d-point-formula">½ + Ωδ(1) · symbolic family, oblivious</tspan></text></g>`;
    svg+=text(590,109,'Slightly sublinear','d-region')+text(590,126,'subpolynomial savings','d-micro');
    svg+=text(590,215,'Polynomial savings','d-region')+text(590,232,'ε-dependent exponent; lane is schematic','d-micro');
    if(hasOrs)svg+=orsPanel(18,688,1064,224,options,true);
    svg+=`</svg>`;return svg;
  }
  function summarySVG(key,w,h,options={}){
    const level=options.level||(w<220||h<140?'overview':w<420||h<240?'compact':'detail'),tiny=level==='overview',full=level==='detail';
    const orsHeight=orsRows(options).length?(tiny?16:full?182:96):0;
    const l=tiny?10:full?65:22,r=Math.max(l+8,w-(tiny?10:20)),top=tiny?10:full?39:15,bottom=Math.max(top+8,h-orsHeight-(tiny?12:full?48:31));
    const px=v=>l+(x(v)-185)/845*(r-l),py=v=>top+(v-32)/585*(bottom-top);
    let groups=specs.map(spec=>({spec,rows:groupRows(spec,{...options,output:'both'})})).filter(g=>g.rows.length);
    if(tiny){const keep=['dynamic-edges-gp13','bks2023-size','dynamic-edges-gssu22','dynamic-edges-bk22-k2','dynamic-edges-bk22-k3','dynamic-edges-bgs11','abr2024-size'];groups=groups.filter(g=>keep.includes(g.spec.ids[0]));}
    let svg=`<svg data-detail-level="${level}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Dynamic matching: ${tiny?'overview of selected algorithm guarantees':'approximation versus schematic update time'}. Green means algorithm; circles maintain edges, squares estimate size. Exact conditional lower bounds are separate."><path d="M${l} ${top}V${bottom}H${r}" fill="none" stroke="var(--muted)" stroke-width=".8"/>`;
    if(!tiny)svg+=[58,337,559].map(y=>`<path d="M${l} ${py(y)}H${r}" stroke="var(--line)" stroke-dasharray="2 3"/>`).join('');
    for(const g of groups){const cx=px(g.spec.beta),cy=py(g.spec.y);svg+=tiny?`<circle cx="${cx}" cy="${cy}" r="2.2" fill="var(--green)"/>`:marker(cx,cy,g.rows,false,true);}
    if(!tiny)svg+=`<text x="${px(.5)}" y="${bottom+19}" text-anchor="middle">½</text><text x="${px(1)}" y="${bottom+19}" text-anchor="middle">→1</text>`;
    if(full){
      svg+=`<text x="${l}" y="20">Dynamic matching</text><text x="${l-8}" y="${py(58)+4}" text-anchor="end">n</text><text x="${l-8}" y="${py(337)+4}" text-anchor="end">√n</text><text x="${l-8}" y="${py(559)+4}" text-anchor="end">polylog</text><text x="${px(2/3)}" y="${bottom+19}" text-anchor="middle">⅔</text><text x="${(l+r)/2}" y="${h-orsHeight-7}" text-anchor="middle">Approximation β → · faster ↓</text>`;
      const names={'dynamic-edges-gp13':'GP’13','dynamic-edges-abkl23':'Assadi et al. · STOC’23','bks2023-size':'BKS’23','dynamic-edges-gssu22':'GSSU’22','dynamic-edges-bk22-k2':'BK’22','dynamic-edges-bk22-k3':'BK’22','abr2024-size':'ABR’23'};
      for(const g of groups){const label=names[g.spec.ids[0]];if(label)svg+=`<text class="summary-paper" x="${px(g.spec.beta)-8}" y="${py(g.spec.y)-8}" text-anchor="end" style="fill:var(--green)">${label}</text>`;}
    }
    if(orsHeight)svg+=orsPanel(tiny?6:12,h-orsHeight,w-(tiny?12:24),orsHeight-4,options,false,level);
    return svg+'</svg>';
  }
  function mount(root,key,options={}){
    window.StreamingMatching?.release(root);window.LCAMatching?.release(root);window.LocalMatching?.release(root);window.MPCMatching?.release(root);window.ListQueryMatching?.release(root);
    for(const instance of instances)if(!instance.root.isConnected||instance.root===root)instance.destroy();
    const prefix='dynamic-'+(++serial),signal=new AbortController();let selected=collection[key].summaryResultId,scope='all',output='both',lastWidth=-1;
    const opts=()=>({...options,scope,output,selected});
    root.classList.remove('query-list-view','mpc-view','streaming-view','lca-view','local-view');root.classList.add('focus-view','dynamic-view');root.classList.toggle('f-embedded',!!options.embedded);root.setAttribute('aria-label','Fully dynamic matching approximation and update-time landscape');
    root.innerHTML=`<p class="f-kicker">MATCHING × FULLY DYNAMIC / EDGES + SIZE</p><header class="f-hero"><div><h1>The dynamic matching landscape</h1><p>How much of the optimum can we retain, and how quickly can we update it?</p></div><div class="f-seal"><strong>One graph. Two outputs.</strong>Source review · ${esc(collection[key].reviewedOn)}</div></header>
      <div class="f-scope"><span><b>Graph</b> general, unweighted</span><span><b>Updates</b> edge insertions + deletions</span><span><b>Accuracy</b> fixed ε &gt; 0</span></div>
      <section class="d-landscape" aria-labelledby="${prefix}-map"><div class="d-toolbar"><div class="d-output-control" aria-label="Output shown"><button type="button" data-dynamic-output="both" aria-pressed="true">Both outputs</button><button type="button" data-dynamic-output="dynamic-edges" aria-pressed="false">Edges</button><button type="button" data-dynamic-output="dynamic-size" aria-pressed="false">Size</button></div><label class="d-scope-control">Updates <select class="d-scope-select" aria-label="Dynamic result scope"><option value="all">All verified scopes</option><option value="adaptive">Adaptive-safe only</option><option value="deterministic">Deterministic only</option></select></label></div>
      <div class="d-legend" id="${prefix}-map"><span class="d-algorithm-key"><b>Green · algorithms</b></span><span><i class="d-key-edge"></i><b>Edges</b> · actual matching M</span><span><i class="d-key-size"></i><b>Size</b> · a number ν</span><span><i class="d-key-lower"></i><b>Red · lower bounds</b></span><span class="d-legend-direction">Better → &nbsp; Faster ↓</span></div><div class="d-plot-scroll" tabindex="0" aria-label="Matching landscape; scroll horizontally on narrow screens"><div class="d-plot-host"></div></div>
      <div class="d-chart-notes"><span><i class="d-open-key"></i>Open = limiting β; a tail approaches from below. Dotted = oblivious only. Circle inside square = size inherited from edges.</span><span><b>Schematic runtime lanes</b> · fixed ε, with m ≤ n² and Δ ≤ n. W = worst-case; A = amortized (including expected). Click for the exact theorem.</span><span>β-axis is broken before the near-optimal column. BKS’s exponent is unspecified. No impossibility region is asserted.</span></div>
      <div class="d-specials"></div></section>
      <section class="d-theorem" id="${prefix}-theorem" aria-label="Selected dynamic theorem" aria-live="polite"></section>
      <details class="d-evidence"><summary>All recorded results &amp; exact statements</summary><div class="d-evidence-list"></div></details><div class="f-bottom"><span>Edges: |M| ≥ β·OPT. Size: β·OPT ≤ ν ≤ OPT. All edge guarantees also give size guarantees.</span><span>Short citations use the first public year; publication details are in each source.</span></div>`;
    function detail(){
      const rows=records(opts()),r=rows.find(r=>r.id===selected);if(!r)return;
      const group=specs.find(s=>s.ids.includes(selected)),siblings=group?groupRows(group,opts()):[r];
      root.querySelector('.d-theorem').innerHTML=`<div class="d-theorem-top"><span class="d-type ${r.kind==='conditional_barrier'?'d-lower-type':r.outputKey==='dynamic-size'?'d-size-type':''}">${r.kind==='conditional_barrier'?'Conditional lower bound · exact only':r.outputKey==='dynamic-size'?'Size estimate':'Matching edges'}${r.plotScope==='bipartite'?' · BIPARTITE ONLY':''}</span><strong>${esc(r.rowName||r.title)}</strong>${source(r,'Read paper')}<span>${esc(r.dateLabel||r.year)}</span></div>${siblings.length>1?`<div class="d-coincident"><span>At this location:</span>${siblings.map(s=>`<button type="button" data-dynamic-result="${s.id}" aria-pressed="${s.id===selected}">${esc(s.rowName)}${s.outputKey==='dynamic-size'?' · size':''}</button>`).join('')}</div>`:''}<div class="d-detail-grid"><div><span>Guaranteed fraction</span><strong>${math(r.formula||'See theorem')}</strong></div><div><span>Original update cost</span><strong>${math(r.updateTime||r.bound||'See theorem')}</strong></div><div><span>Conditions</span><strong>${esc(r.timeType||'See theorem')} · ${esc(r.adversary||'See theorem')} · ${esc(r.randomization||'See theorem')}</strong></div></div><p>${esc(r.statement||r.summary)}</p><details class="d-theorem-more"><summary>Read assumptions, reporting cost &amp; source</summary><h3>${esc(r.title)}</h3><p>${esc(r.authors)}</p><p>${esc(r.notes)}</p><p><b>Query / reporting:</b> ${esc(r.queryTime||'See theorem; reporting an entire matching has a separate output cost.')}</p><p>${source(r)} · ${esc(r.sourceLocation)}</p></details>`;
    }
    function render(){
      const rows=records(opts());if(!rows.some(r=>r.id===selected))selected=rows[0]?.id;
      root.querySelector('.d-plot-host').innerHTML=diagramSVG(opts());
      const ors=orsRows(opts()),bip=find('beh2023-size-bipartite',opts()),lower=find('dynamic-exact-omv',opts());
      root.querySelector('.d-specials').innerHTML=`${ors.length?`<div class="d-special d-ors-sources"><span>ORS PAPERS · DIRECT LINKS</span><div class="d-ors-links">${ors.map(r=>source(r,orsLabels[r.id])).join('')}</div></div>`:''}${bip?`<div class="d-special d-bipartite"><span>BIPARTITE ONLY · SIZE</span><strong>B’22: β = ⅔ + δ₀ &nbsp; at &nbsp; O(√n)</strong><small>δ₀ &gt; 10⁻⁶ · adaptive · worst-case. Separate graph class.</small><button type="button" data-dynamic-result="${bip.id}">Inspect theorem ↗</button>${source(bip,'Read paper')}</div>`:''}${lower?`<div class="d-special d-lower-bound"><span>CONDITIONAL LOWER BOUND · EXACT MATCHING ONLY</span><strong>OMv: no simultaneous m<sup>1/2−δ</sup> updates and m<sup>1−δ</sup> queries.</strong><small>Fixed δ &gt; 0, polynomial preprocessing. This does not rule out the approximations in the plot.</small><button type="button" data-dynamic-result="${lower.id}">Inspect lower bound ↗</button>${source(lower,'Read paper')}</div>`:''}`;
      const unique=rows.filter((r,i,a)=>a.findIndex(v=>v.id===r.id)===i);
      root.querySelector('.d-evidence-list').innerHTML=unique.map(r=>`<div class="d-evidence-item"><button type="button" data-dynamic-result="${esc(r.id)}" class="${r.kind==='conditional_barrier'?'d-lower-evidence':r.outputKey==='dynamic-size'?'d-size-evidence':''}"><span>${esc(r.rowName||r.title)}</span><strong>${math(r.formula||r.bound)}</strong><small>${math(r.updateTime||'See statement')}${r.plotScope?' · '+esc(r.plotScope):''}</small></button>${source(r,'Read paper')}</div>`).join('');
      root.querySelectorAll('[data-dynamic-output]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.dynamicOutput===output)));detail();
    }
    function select(id){selected=id;render()}
    root.addEventListener('click',e=>{const b=e.target.closest('[data-dynamic-result]');if(b){select(b.dataset.dynamicResult);return}const tab=e.target.closest('[data-dynamic-output]');if(tab){output=tab.dataset.dynamicOutput;render()}},{signal:signal.signal});
    root.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const b=e.target.closest('.d-plot-result');if(b){e.preventDefault();select(b.dataset.dynamicResult)}},{signal:signal.signal});
    root.addEventListener('change',e=>{if(e.target.classList.contains('d-scope-select')){scope=e.target.value;render()}},{signal:signal.signal});
    const observer=new ResizeObserver(()=>{const width=root.clientWidth;if(width>0&&Math.abs(width-lastWidth)>.5){lastWidth=width}});observer.observe(root);render();
    const instance={root,redraw:render,destroy(){observer.disconnect();signal.abort();instances.delete(instance)}};instances.add(instance);return instance;
  }
  window.DynamicMatching={mount,summarySVG,diagramSVG,release(root){for(const instance of instances)if(!instance.root.isConnected||instance.root===root)instance.destroy()}};
})();
