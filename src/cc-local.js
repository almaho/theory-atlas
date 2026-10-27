(() => {
  'use strict';
  const data = JSON.parse(document.getElementById('atlas-data').textContent).focus['cc-local'];
  const instances = new Set();
  let serial = 0;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num = value => String(Math.round(value * 1000) / 1000);
  const records = (options = {}) => data.verifiedRecords
    .map(row => ({...data.sources[row.sourceId], ...row}))
    .filter(row => options.publication !== 'published' || row.publicationStatus !== 'preprint');

  function pointForR(r) {
    if (!Number.isSafeInteger(r) || r < 1) throw new RangeError('r must be a positive integer');
    return {r, rounds: 2*r+1, leadingFactor: 3+8/(2*r-1),
      denominator: 2*r-1, correction: 'n^{−Ω(1)}'};
  }

  function text(x, y, value, cls = '', anchor = 'start', attrs = '') {
    return '<text x="'+num(x)+'" y="'+num(y)+'" class="'+cls+'" text-anchor="'+anchor+'" '+attrs+'>'+esc(value)+'</text>';
  }

  function levelFor(w, h, options) {
    if (options.focus) return 'focus';
    const names = ['overview', 'compact', 'detail'];
    const available = w < 300 || h < 220 ? 0 : w < 700 || h < 420 ? 1 : 2;
    const requested = names.indexOf(options.level);
    return names[Math.min(available, requested < 0 ? available : requested)];
  }

  function layoutGeometry(w, h, options = {}) {
    const level = levelFor(w, h, options);
    const tiny = level === 'overview';
    const rich = level === 'detail' || level === 'focus';
    const focus = level === 'focus';
    const minEnd = h * (tiny ? .54 : rich ? .57 : .55);
    const left = tiny ? 6 : rich ? 58 : 24;
    const right = w * (tiny ? .59 : rich ? .59 : .53);
    const top = tiny ? 7 : focus ? 77 : rich ? 58 : 30;
    const bottom = minEnd - (tiny ? 7 : rich ? 66 : 33);
    const xa = data.figureAxes.tradeoff.x;
    const ya = data.figureAxes.tradeoff.y;
    const px = a => left+(right-left)*Math.log((a-xa.offset)/(xa.min-xa.offset))/Math.log((xa.max-xa.offset)/(xa.min-xa.offset));
    const py = rounds => bottom-(bottom-top)*Math.log(rounds/ya.min)/Math.log(ya.max/ya.min);
    const values = [...data.sampleR];
    if (Number.isSafeInteger(options.selectedR) && options.selectedR >= 1 &&
        options.selectedR <= 128 && !values.includes(options.selectedR)) values.push(options.selectedR);
    const points = values.sort((a,b) => a-b).map(r => {
      const point = pointForR(r);
      return {...point, x:px(point.leadingFactor), y:py(point.rounds)};
    });
    const cardX = w * (tiny ? .67 : rich ? .65 : .59);
    const cardW = w-cardX-(tiny ? 5 : rich ? 20 : 8);
    const cardH = (bottom-top)*.43;
    const cards = [{id:'cc-local-fn18-pivot',x:cardX,y:top,w:cardW,h:cardH},
      {id:'cc-local-calm21-deterministic',x:cardX,y:bottom-cardH,w:cardW,h:cardH}];
    const maxTop = minEnd+(tiny ? 3 : focus ? 62 : rich ? 44 : 27);
    const maxBottom = h-(tiny ? 5 : rich ? 40 : 20);
    const costLeft = w*(tiny ? .55 : rich ? .58 : .66);
    const costRight = w-(tiny ? 9 : rich ? 31 : 10);
    const costX = tier => costLeft+(costRight-costLeft)*tier/2;
    const agreement = data.verifiedRecords.filter(row => row.panel === 'max-agreement')
      .map((row,i) => ({id:row.id,x:costX(row.costTier),
        y:maxTop+(maxBottom-maxTop)*(i+.5)/3,row}));
    return {level,tiny,rich,focus,left,right,top,bottom,minEnd,px,py,points,
      cards,maxTop,maxBottom,costLeft,costRight,costX,agreement};
  }

  function marker(row, x, y, options, tiny, extra = '') {
    const selected = row.id === options.selectedId;
    const radius = tiny ? 2.4 : options.focus ? 5 : 3.8;
    const accessible = options.focus ? ' role="button" tabindex="0" aria-pressed="'+selected+
      '" aria-label="Inspect '+esc(row.shortLabel)+'"' : '';
    return '<g class="cc-local-point" data-cc-local-result="'+esc(row.id)+
      '" data-result-id="'+esc(row.id)+'" data-kind="'+esc(row.kind)+
      '" data-setup="'+esc(row.setup)+'" '+extra+accessible+'><title>'+
      esc(row.shortLabel+': '+row.quality+'; '+row.displayBound)+'</title>'+
      (selected && !tiny ? '<circle class="cc-local-selection" cx="'+num(x)+'" cy="'+num(y)+'" r="10"/>' : '')+
      '<circle class="cc-local-algorithm" cx="'+num(x)+'" cy="'+num(y)+'" r="'+radius+'"/></g>';
  }

  function renderSVG(w, h, options = {}) {
    const g = layoutGeometry(w,h,options);
    const {tiny,rich,focus,left,right,top,bottom,px,py} = g;
    const available = new Map(records(options).map(row => [row.id,row]));
    const curve = available.get('cc-local-3plus-rounds');
    const css = focus ? 'cc-local-map' : 'cc-local-summary';
    let svg = '<svg class="'+css+'" data-detail-level="'+g.level+
      '" data-cost="elapsed-rounds" viewBox="0 0 '+w+' '+h+
      '" preserveAspectRatio="xMidYMid meet" role="'+(focus?'group':'img')+
      '" aria-label="Correlation clustering in LOCAL. Separate minimum-disagreement and maximum-agreement panels. Green marks algorithms.">'+
      '<title>Correlation clustering: separate objectives and communication setups</title>'+
      '<desc>Minimum disagreements: randomized tradeoff, factor-three Pivot, and a derived deterministic constant-round algorithm. Maximum agreements: weighted general and unweighted minor-free signed networks. Symbolic cost categories are not numerical round counts. No universal lower bound was verified.</desc>';
    svg += '<g data-panel="min-disagreement" data-objective="min-disagreement">';
    if (!tiny) {
      svg += text(12,focus?27:rich?22:14,rich?'MINIMIZE DISAGREEMENTS · smaller factor is better':'MIN DISAGREEMENTS','cc-local-section');
      if (rich) svg += text(12,focus?49:40,'Complete signed instance · communication on positive edges','cc-local-subtitle');
    }
    svg += '<g data-panel="tradeoff" data-x-scale="log-excess-over-3" data-y-scale="log-rounds">'+
      '<path class="cc-local-axis" d="M'+num(left)+' '+num(top)+'V'+num(bottom)+'H'+num(right)+'"/>';
    for (const tick of data.figureAxes.tradeoff.y.ticks) {
      const y = py(tick);
      svg += '<path class="cc-local-grid" d="M'+num(left)+' '+num(y)+'H'+num(right)+'"/>';
      if (rich) svg += text(left-8,y+4,tick,'cc-local-tick','end');
    }
    const ticks = data.figureAxes.tradeoff.x.ticks;
    for (let i=0;i<ticks.length;i++) {
      const x = px(ticks[i]);
      svg += '<path class="cc-local-grid" d="M'+num(x)+' '+num(top)+'V'+num(bottom)+'"/>';
      if (rich && (focus || i%2===0)) svg += text(x,bottom+17,
        data.figureAxes.tradeoff.x.tickLabels[i],'cc-local-tick',
        i===0?'start':i===ticks.length-1?'end':'middle');
    }
    if (curve) {
      svg += '<path class="cc-local-guide" data-visual-guide="true" d="'+
        g.points.map((p,i) => (i?'L':'M')+num(p.x)+' '+num(p.y)).join(' ')+'"/>';
      for (const point of g.points) {
        svg += marker(curve,point.x,point.y,{...options,selectedId:
          point.r===options.selectedR && (!options.selectedId || options.selectedId===curve.id)?curve.id:null},tiny,'data-cc-local-r="'+point.r+
          '" data-center-x="'+num(point.x)+'" data-center-y="'+num(point.y)+'"');
        if (rich && [1,4,16,128].includes(point.r)) svg += text(
          point.x+(point.r===1?-8:8),point.y-10,'r='+point.r,
          'cc-local-point-label',point.r===1?'end':'start');
      }
    } else if (!tiny) svg += text(left,top+18,'No source in this filter','cc-local-note');
    if (!tiny) {
      svg += text(left,top-7,rich?'Rounds · log':'Rounds','cc-local-axis-title','start','data-axis="y"');
      svg += text((left+right)/2,bottom+(rich?37:17),
        rich?'Leading factor a · log(a−3)':'a · log(a−3)','cc-local-axis-title','middle','data-axis="x"');
      svg += text(left,g.minEnd-(rich?8:4),rich?'BCMT22: expected factor a + δₙ; δₙ = n^{−Ω(1)}':'3+ε · O(1/ε) rounds','cc-local-correction','start','data-rank-correction="true"');
    }
    svg += '</g>';
    for (const card of g.cards) {
      const row = available.get(card.id);
      svg += '<g data-panel="min-baseline" data-objective="min-disagreement">'+
        '<rect class="cc-local-card" x="'+num(card.x)+'" y="'+num(card.y)+
        '" width="'+num(card.w)+'" height="'+num(card.h)+'" rx="5"/>'+
        '<path class="cc-local-setup-complete" d="M'+num(card.x)+' '+num(card.y)+'V'+num(card.y+card.h)+'"/>';
      if (row) {
        const mx=card.x+(tiny?card.w*.5:12), my=card.y+(tiny?card.h*.5:rich?25:9);
        svg += marker(row,mx,my,options,tiny);
        if (!tiny) {
          const fn=row.id==='cc-local-fn18-pivot';
          svg += text(card.x+22,my+3,fn?'Factor 3':'Factor 1442','cc-local-card-factor');
          svg += text(card.x+12,card.y+(rich?card.h*.5:card.h-6),
            fn?'O(log n) · w.h.p.':rich?'O(1) rounds · derived':'O(1) · derived','cc-local-card-cost');
          if (rich) {
            svg += text(card.x+12,card.y+card.h*.72,fn?'Expected quality · Fischer–Noever':'Deterministic · Cohen-Addad et al.','cc-local-note');
            svg += text(card.x+12,card.y+card.h*.90,fn?'Factor 3 is outside log(a−3)':'Exact agreement; LOCAL messages','cc-local-note','start',fn?'data-reference="3"':'');
          }
        }
      }
      svg += '</g>';
    }
    svg += '</g><path class="cc-local-divider" d="M8 '+num(g.minEnd)+'H'+num(w-8)+'"/>'+
      '<g data-panel="max-agreement" data-objective="max-agreement" data-x-scale="symbolic-cost">';
    if (!tiny) {
      svg += text(12,g.minEnd+(focus?27:rich?22:15),
        rich?'MAXIMIZE AGREEMENTS · larger fraction is better':'MAX AGREEMENTS','cc-local-section');
      if (rich) svg += text(12,g.minEnd+(focus?47:39),'Signed network edges only · missing pairs have no objective term','cc-local-subtitle');
    }
    const costTicks=rich?['O(log* n)','polylog n','subpolynomial']:['log*','polylog','subpoly'];
    for(let tier=0;tier<3;tier++) {
      const x=g.costX(tier);
      svg += '<path class="cc-local-grid" d="M'+num(x)+' '+num(g.maxTop)+'V'+num(g.maxBottom)+'"/>';
      if (!tiny) svg += text(x,h-(rich?12:5),costTicks[tier],
        'cc-local-tick',tier===0?'start':tier===2?'end':'middle');
    }
    for (const point of g.agreement) {
      const row=available.get(point.id);
      if (!row) continue;
      const colorClass='cc-local-setup-'+row.setup;
      svg += '<path class="'+colorClass+'" d="M10 '+num(point.y-9)+'V'+num(point.y+9)+'"/>';
      svg += '<path class="cc-local-row-guide" d="M'+num(g.costLeft)+' '+num(point.y)+'H'+num(g.costRight)+'"/>';
      svg += marker(row,point.x,point.y,options,tiny);
      if (!tiny) {
        const ks=row.setup==='weighted',det=row.id.endsWith('deterministic');
        const label=rich?(ks?'General weighted · ½−ε':'H-minor-free · 1−ε'):(ks?'Weighted · ½−ε':'Minor-free · 1−ε');
        svg += text(18,point.y-(rich?5:1),label,'cc-local-row-title');
        if (rich) svg += text(18,point.y+13,ks?'KS18 · deterministic · CONGEST':
          'CS22 · '+(det?'deterministic':'high probability')+' · CONGEST','cc-local-note');
        else svg += text(18,point.y+10,ks?'deterministic':det?'deterministic':'randomized','cc-local-note');
      }
    }
    if (rich) svg += text(g.costRight,g.maxTop-8,'Round categories · fixed ε','cc-local-axis-title','end');
    return svg+'</g></svg>';
  }

  function diagramSVG(keyOrOptions = {}, otherOptions = {}) {
    const options = typeof keyOrOptions === 'string' ? otherOptions : keyOrOptions;
    return renderSVG(1000,850,{...options,focus:true});
  }
  const summarySVG = (key,w,h,options={}) => renderSVG(w,h,{...options,focus:false});

  function mount(root,key='cc-local',options={}) {
    for (const instance of instances) if (!instance.root.isConnected || instance.root===root) instance.destroy();
    let publication=options.publication||'all', selectedR=data.defaultR;
    let selectedId='cc-local-3plus-rounds';
    const controller=new AbortController(), prefix='cc-local-'+(++serial);
    root.classList.add('focus-view','cc-local-view');
    root.classList.toggle('f-embedded',!!options.embedded);
    root.setAttribute('aria-label','Correlation clustering LOCAL: separate objectives and setups');
    root.innerHTML='<p class="f-kicker">CORRELATION CLUSTERING × LOCAL</p>'+
      '<header class="f-hero"><div><h1>Which guarantee, in how many rounds?</h1>'+
      '<p>Compare results within each objective and communication setup.</p></div>'+
      '<div class="f-seal"><strong>Five source families</strong>Reviewed '+esc(data.reviewedOn)+'</div></header>'+
      '<div class="f-scope"><span><b>Cost</b> elapsed rounds</span><span><b>Output</b> a cluster ID at every vertex</span>'+
      '<span><b>CONGEST</b> also applies in LOCAL</span></div>'+
      '<section class="cc-local-landscape"><div class="cc-local-toolbar"><div class="cc-local-legend">'+
      '<span><i class="cc-local-key-upper"></i>Algorithm</span><span><i class="cc-local-key-lower"></i>Lower bound · none verified</span>'+
      '<span><i class="cc-local-key-guide"></i>Parameter guide</span></div>'+
      '<label>Sources <select class="cc-local-publication" aria-label="Correlation clustering LOCAL publication filter">'+
      '<option value="all">All verified sources</option><option value="published">Published only</option></select></label></div>'+
      '<div class="cc-local-setup-legend"><span><i class="cc-local-complete"></i>Complete signed · min disagreements</span>'+
      '<span><i class="cc-local-weighted"></i>General weighted signed · max agreements</span>'+
      '<span><i class="cc-local-minorfree"></i>H-minor-free signed · max agreements</span></div>'+
      '<div class="cc-local-scroll" tabindex="0" aria-label="LOCAL figure; scroll horizontally on narrow screens"><div class="cc-local-plot"></div></div>'+
      '<div class="cc-local-controls"><label for="'+prefix+'-r">Inspect BCMT22 phase r <input id="'+prefix+'-r" class="cc-local-r-input" type="number" min="1" max="128" step="1"></label>'+
      '<span>Shown r=1–128; the theorem holds for every integer r≥1.</span></div>'+
      '<div class="cc-local-notes"><p><b>Two objectives.</b> The top panel bounds cost/OPT for disagreements. The bottom panel bounds ALG/OPT for agreements. Their factors cannot be ranked against each other.</p>'+
      '<p><b>Two kinds of axis.</b> The BCMT22 curve uses numeric log axes and retains +δₙ. Factor 3 and 1442 are separate cards. The bottom panel uses symbolic round categories for fixed ε, with exact expressions in inspection.</p>'+
      '<p><b>Setup colors.</b> Colored row edges identify graph and objective contracts. Every algorithm marker stays green. Minor-free algorithms permit expensive local computation; absent pairs in a signed network have no cost.</p></div></section>'+
      '<section class="cc-local-theorem" aria-live="polite" aria-label="Selected theorem"></section>'+
      '<details class="cc-local-audit"><summary>Lower-bound scope and source coverage</summary><p>'+esc(data.lowerBoundStatus)+'</p>'+
      '<p>The Ω(log n) bound for full parallel greedy Pivot is procedure-specific. Neither approximation 3 nor the absence of a red marker is a general hardness claim.</p></details>'+
      '<div class="f-bottom"><span>'+esc(data.coverageNote)+'</span><span>Select a green marker for its theorem and paper.</span></div>';

    function opts() { return {publication,selectedR,selectedId}; }
    function inspect() {
      const available=records(opts()), target=root.querySelector('.cc-local-theorem');
      let row=available.find(r=>r.id===selectedId);
      if(!row){row=available[0];if(row)selectedId=row.id;}
      if(!row){target.innerHTML='<p>No source is available under this publication filter.</p>';return;}
      const isCurve=row.id==='cc-local-3plus-rounds', point=pointForR(selectedR);
      const instance=isCurve?'<p><b>Exact instance.</b> r = '+selectedR+', T = 2r + 1 = '+point.rounds+
        '. E[cost] ≤ (3 + 8/'+point.denominator+' + δₙ) OPT; δₙ = n<sup>−Ω(1)</sup>.</p>':'';
      target.innerHTML='<div class="cc-local-theorem-top"><span class="cc-local-upper">Algorithm · '+
        esc(row.objective==='max-agreement'?'maximize agreements':'minimize disagreements')+'</span>'+
        '<strong>'+esc(row.shortLabel)+'</strong><span>'+esc(row.venue)+'</span></div>'+
        '<div class="cc-local-selected"><b>'+esc(row.quality)+'</b><span>'+esc(row.displayBound)+'</span></div>'+
        instance+'<p><b>Exact guarantee.</b> '+esc(row.exactBound)+'</p>'+
        '<p><b>Graph and communication.</b> '+esc(row.graph)+'. '+esc(row.resourceModel)+'.</p>'+
        '<p><b>Probability.</b> '+esc(row.probability)+'</p>'+
        '<p><b>Scope.</b> '+esc(row.notes)+'</p>'+
        '<p class="cc-local-paper-links"><a href="'+esc(row.verificationUrl)+'" target="_blank" rel="noopener noreferrer">Inspect theorem ↗</a> · '+
        '<a href="'+esc(row.url)+'" target="_blank" rel="noopener noreferrer">Paper ↗</a></p>'+
        '<details><summary>Authors, theorem and assumptions</summary><h3>'+esc(row.title)+'</h3><p>'+
        esc(row.authors.join(', '))+'</p><p>'+esc(row.theorem)+'</p><ul>'+
        row.assumptions.map(a=>'<li>'+esc(a)+'</li>').join('')+'</ul><p><b>Evidence.</b> '+esc(row.evidenceStatus)+'</p>'+
        (row.supportingUrl?'<p><a href="'+esc(row.supportingUrl)+'" target="_blank" rel="noopener noreferrer">LOCAL reduction and comparison table ↗</a></p>':'')+'</details>';
    }
    function render() {
      root.querySelector('.cc-local-publication').value=publication;
      root.querySelector('.cc-local-r-input').value=selectedR;
      inspect();
      root.querySelector('.cc-local-plot').innerHTML=diagramSVG(opts());
    }
    function select(node) {
      if(!node)return false;
      const value=node.dataset.ccLocalR;
      if(value!==undefined){
        const r=Number(value);
        if(!Number.isSafeInteger(r)||r<1||r>128)return false;
        selectedR=r;selectedId='cc-local-3plus-rounds';
      } else if(records(opts()).some(r=>r.id===node.dataset.ccLocalResult)){
        selectedId=node.dataset.ccLocalResult;
      } else return false;
      render();return true;
    }
    root.addEventListener('click',event=>select(event.target.closest('[data-cc-local-result]')),{signal:controller.signal});
    root.addEventListener('keydown',event=>{
      if(event.key!=='Enter'&&event.key!==' ')return;
      const node=event.target.closest('[data-cc-local-result]');
      if(node){event.preventDefault();select(node);}
    },{signal:controller.signal});
    root.addEventListener('change',event=>{
      if(event.target.classList.contains('cc-local-publication')){
        publication=event.target.value;render();options.onPublicationChange?.(publication);
      } else if(event.target.classList.contains('cc-local-r-input')){
        if(!select({dataset:{ccLocalR:event.target.value}}))event.target.value=selectedR;
      }
    },{signal:controller.signal});
    render();
    const instance={root,settingKey:'cc-local',redraw:render,destroy(){
      controller.abort();root.classList.remove('cc-local-view');instances.delete(instance);
    }};
    instances.add(instance);return instance;
  }
  window.AtlasPairRenderers=window.AtlasPairRenderers||{};
  window.AtlasPairRenderers['cc-local']={mount,summarySVG,diagramSVG,records,pointForR,layoutGeometry,
    release(root){for(const instance of instances)if(!instance.root.isConnected||instance.root===root)instance.destroy();}};
})();
