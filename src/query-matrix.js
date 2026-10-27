(()=>{
  'use strict';
  const ID='matching-query_matrix',prefix='mqm';
  const data=JSON.parse(document.getElementById('atlas-data').textContent).focus[ID];
  const instances=new Set();let serial=0;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function math(v){return esc(v).replace(/\^\{([^{}]*)\}/g,'<sup>$1</sup>').replace(/_ε/g,'<sub>ε</sub>')}
  function svgMath(v){return esc(v).replace(/\^\{([^{}]*)\}/g,'<tspan baseline-shift="super" font-size="70%">$1</tspan>').replace(/_ε/g,'<tspan baseline-shift="sub" font-size="70%">ε</tspan>')}
  const text=(x,y,t,cls='',anchor='start',attrs='')=>`<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}" ${attrs}>${esc(t)}</text>`;
  const formula=(x,y,t,cls='',anchor='start',attrs='')=>`<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}" ${attrs}>${svgMath(t)}</text>`;
  const merged=r=>({...data.sources[r.sourceId],...r});
  const allowed=(r,o)=>o.publication!=='published'||r.publicationStatus!=='preprint';
  const records=(options={})=>(data.verifiedRecords||[]).map(merged).filter(r=>allowed(r,options));
  const related=(options={})=>(data.relatedResults||[]).map(merged).filter(r=>allowed(r,options));
  const all=options=>[...records(options),...related(options)];
  const short=r=>r.plotLabel||r.shortLabel||r.id;
  function scopes(options={}){
    const rows=records(options);
    return Object.entries(data.figureAxes).map(([id,axes])=>({id,...axes,rows:rows.filter(r=>r.panel===id)})).filter(p=>p.rows.length);
  }
  function position(p,r,box){
    const col=p.x.categories.findIndex(c=>c.id===r.qualityFamily),row=p.y.categories.findIndex(c=>c.id===r.resourceLane);
    return {x:box.l+(box.r-box.l)*(col+.5)/p.x.categories.length,y:box.b-(box.b-box.t)*(row+.5)/p.y.categories.length};
  }
  function marker(r,x,y,tiny=false,selected=false){
    const lower=r.kind==='lower',color=`var(--${lower?'red':'green'})`,radius=tiny?3:5;
    let body=selected?`<circle cx="${x}" cy="${y}" r="12" fill="${color}" opacity=".12"/>`:'';
    if(lower)body+=`<path data-marker="lower" data-center-x="${x}" data-center-y="${y}" d="M${x} ${y-radius-1}l${radius+1} ${radius+1}l-${radius+1} ${radius+1}l-${radius+1}-${radius+1}Z" fill="${r.conditional?'var(--surface)':color}" stroke="${color}"${r.conditional?' stroke-dasharray="2 2"':''}/>`;
    else body+=`<circle data-marker="algorithm" data-center-x="${x}" data-center-y="${y}" cx="${x}" cy="${y}" r="${radius}" fill="${color}"/>`;
    return body;
  }
  function quantifier(r){return r.id==='matrix-abrr25'?'∀δ > 0 ∃ε(δ) > 0':r.id==='matrix-bks23-additive'?'Every fixed ε > 0':''}
  function axes(p,box,o={}){
    let s=`<path d="M${box.l} ${box.t-5}V${box.b}H${box.r}" class="mqm-axis"/>`;
    p.y.categories.forEach((v,i)=>{
      const y=box.b-(box.b-box.t)*(i+.5)/p.y.categories.length;
      s+=`<path d="M${box.l} ${y}H${box.r}" class="mqm-grid"/>`;
      if(o.formulas)s+=formula(box.l-12,y+4,v.label,o.summary?'mqm-summary-formula':'mqm-y-label','end');
    });
    p.x.categories.forEach((v,i)=>{
      const x=box.l+(box.r-box.l)*(i+.5)/p.x.categories.length;
      s+=`<path d="M${x} ${box.t}V${box.b}" class="mqm-guide"/>`;
      if(o.labels){
        s+=formula(x,box.b+(o.summary?17:26),v.label,o.summary?'mqm-summary-note':'mqm-x-label','middle');
        if(!o.summary)s+=text(x,box.b+45,v.note,'mqm-muted','middle');
      }
    });
    return s;
  }
  function diagramSVG(keyOrOptions={},otherOptions={}){
    const options=typeof keyOrOptions==='string'?otherOptions:keyOrOptions;
    const panels=scopes(options),height=650;
    let s=`<svg class="mqm-map" viewBox="0 0 1100 ${height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Adjacency-matrix matching size: green algorithm points and red lower bounds. Guarantee categories on X and exact symbolic query formulas on Y."><title>How much of the matrix reveals the matching size?</title><desc>Mixed multiplicative-additive guarantees are separated from pure additive error. Both axes use categories, not guessed numerical exponents. Every point can be selected to inspect the exact theorem.</desc>`;
    panels.forEach((p,i)=>{
      const top=i?370:20,box={l:220,r:1060,t:top+92,b:top+(i?175:224)};
      s+=`<g data-panel="${esc(p.id)}">`+text(24,top+6,String(i+1).padStart(2,'0'),'mqm-section-number')+text(57,top+6,p.title,'mqm-section-title')+text(57,top+30,p.subtitle,'mqm-muted');
      s+=text(24,top+63,'Y · QUERY / TIME BOUND','mqm-axis-title','start','data-axis="y"')+text(24,top+79,'Symbolic formula rows','mqm-axis-note');
      s+=axes(p,box,{formulas:true,labels:true});
      p.rows.forEach(r=>{
        const {x,y}=position(p,r,box),note=quantifier(r),lower=r.kind==='lower';
        s+=`<g class="mqm-plot-result" data-mqm-result="${esc(r.id)}" data-kind="${lower?'lower':'algorithm'}" data-guarantee-family="${esc(r.qualityFamily)}" data-resource-lane="${esc(r.resourceLane)}" tabindex="0" role="button" aria-pressed="${r.id===options.selected}" aria-label="Inspect ${esc(short(r))}: ${esc(r.queryComplexity)}; ${esc(r.quality)}" style="--mqm-marker:var(--${lower?'red':'green'})">`+marker(r,x,y,false,r.id===options.selected)+text(x+13,y+4,short(r),'mqm-paper-label');
        if(note)s+=text(x-13,y+4,note,'mqm-quantifiers','end');s+='</g>';
      });
      s+=text(box.l,box.b+68,`X · ${p.id==='mixed'?'GUARANTEE FAMILY':'ABSOLUTE ERROR CONTRACT'}`,'mqm-axis-title','start','data-axis="x"')+'</g>';
    });
    s+='<path d="M24 335H1076" class="mqm-divider"/>';
    return s+text(24,height-10,'n = vertices · OPT = maximum matching size · ŝ = estimate · select a point for exact success guarantees and accuracy quantifiers.','mqm-muted')+'</svg>';
  }
  function summarySVG(key,w,h,options={}){
    const levels=['overview','compact','detail'],available=w<220||h<140?0:w<420||h<240?1:2,requested=levels.indexOf(options.level),level=levels[Math.min(available,requested<0?available:requested)],tiny=level==='overview',detail=level==='detail',rich=detail&&w>=650&&h>=420;
    const panels=scopes(options),rowH=h/Math.max(1,panels.length);
    let s=`<svg class="mqm-summary${rich?' mqm-summary-rich':''}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" data-detail-level="${level}" role="img" aria-label="Matrix matching size: algorithms in green, lower bounds in red; mixed and additive errors separated, X guarantee family, Y symbolic query bound.">`;
    panels.forEach((p,i)=>{
      const top=i*rowH,box={l:rich?170:detail?28:tiny?7:14,r:w-(tiny?8:detail?24:14),t:top+(tiny?7:rich?45:23),b:top+rowH-(tiny?8:rich?43:detail?38:15)};
      s+=`<g data-panel="${esc(p.id)}">`+axes(p,box,{formulas:rich,labels:detail,summary:true});
      if(!tiny){s+=text(14,top+14,p.id==='mixed'?'Mixed error · global size':'Additive error · global size','mqm-summary-title');if(detail)s+=text(box.r,box.b+31,'X · '+(p.id==='mixed'?'guarantee family':'absolute εn error'),'mqm-summary-axis','end','data-axis="x"');
        if(rich)s+=text(box.l,top+31,'Y · SYMBOLIC QUERY / TIME BOUNDS','mqm-summary-axis','start','data-axis="y"');
        else if(detail)s+=`<text data-axis="y" class="mqm-summary-axis" text-anchor="middle" transform="translate(10 ${(box.t+box.b)/2}) rotate(-90)">Y · query bounds</text>`;
      }
      p.rows.forEach(r=>{
        const {x,y}=position(p,r,box),lower=r.kind==='lower';
        s+=`<g data-mqm-result="${esc(r.id)}" data-kind="${lower?'lower':'algorithm'}" data-guarantee-family="${esc(r.qualityFamily)}" data-resource-lane="${esc(r.resourceLane)}">`+marker(r,x,y,true);
        if(detail){const q=quantifier(r);s+=text(x,y-8,short(r),lower?'mqm-summary-lower':'mqm-summary-upper','middle');if(rich&&q)s+=text(x+10,y+4,q,'mqm-summary-quantifiers');}
        s+='</g>';
      });s+='</g>';
    });return s+'</svg>';
  }
  function release(root){for(const instance of instances)if(!instance.root.isConnected||instance.root===root)instance.destroy()}
  function mount(root,key=ID,options={}){
    release(root);
    for(const legacy of ['StreamingMatching','DynamicMatching','LCAMatching','LocalMatching','MPCMatching','ListQueryMatching'])window[legacy]?.release(root);
    for(const [id,renderer] of Object.entries(window.AtlasPairRenderers||{}))if(id!==ID)renderer.release?.(root);
    const controller=new AbortController(),uid='mqm-'+(++serial);let publication=options.publication||'all';
    const initialPanel=key.includes('additive')?'additive':'mixed';let selected=records({publication}).find(r=>r.panel===initialPanel&&r.kind==='lower')?.id||records({publication})[0]?.id;
    const opts=()=>({publication,selected});
    root.classList.remove('dynamic-view','streaming-view','lca-view','local-view','mpc-view','query-list-view');root.classList.add('focus-view','matching-query-matrix-view');root.classList.toggle('f-embedded',!!options.embedded);root.setAttribute('aria-label','Matching size through adjacency-matrix queries');
    root.innerHTML=`<p class="f-kicker">MATCHING × ADJACENCY-MATRIX ACCESS</p><header class="f-hero"><div><h1>How much of the matrix reveals the matching size?</h1><p>Algorithms and lower bounds for one global value estimate.</p></div><div class="f-seal"><strong>Algorithms &amp; lower bounds</strong>Primary sources · ${esc(data.reviewedOn)}</div></header><div class="f-scope"><span><b>Access</b> pair queries only</span><span><b>Output</b> matching size estimate</span><span><b>Graphs</b> simple, unweighted</span></div><section class="mqm-landscape" aria-labelledby="${uid}-legend"><div class="mqm-toolbar"><div class="mqm-legend" id="${uid}-legend"><span><i class="mqm-key-algorithm"></i>Algorithm upper bound</span><span><i class="mqm-key-lower"></i>Impossibility lower bound</span></div><label class="mqm-publication-control">Sources <select class="mqm-publication-select" aria-label="Matrix matching publication filter"><option value="all">All verified sources</option><option value="published">Published only</option></select></label></div><div class="mqm-plot-scroll" tabindex="0" aria-label="Matrix matching figure; scroll horizontally on narrow screens"><div class="mqm-plot-host"></div></div><div class="mqm-chart-notes"><p><b>Read the axes.</b> X names the guarantee; Y gives exact symbolic formulas. Row positions do not assign unknown numerical exponents. Algorithm time bounds also bound pair queries. Lower bounds count pair queries.</p><p><b>Read the accuracy.</b> Mixed error keeps its multiplicative loss and additive slack. The near-exact lower bound says ∀δ &gt; 0 ∃ε(δ) &gt; 0. It does not claim quadratic queries for every fixed ε.</p></div></section><section class="mqm-theorem" aria-label="Selected matrix matching theorem" aria-live="polite"></section><section class="mqm-related-section"><div class="mqm-section-head"><h2>Other output contracts</h2><p>Inspect the boundaries before comparing size, edges, or a preprocessed oracle.</p></div><div class="mqm-related-results"></div></section><details class="mqm-evidence"><summary>All plotted results &amp; primary statements</summary><div class="mqm-evidence-list"></div></details><p class="mqm-coverage">${esc(data.coverage)}</p>`;
    function button(r){return `<button type="button" class="mqm-record${r.kind==='lower'?' mqm-record-lower':''}" data-mqm-result="${esc(r.id)}" aria-pressed="${r.id===selected}"><span>${esc(r.scope||short(r))}</span><strong>${math(r.displayBound)}</strong><small>${esc(r.quality)}</small></button>`}
    function detail(){
      const r=all(opts()).find(r=>r.id===selected),el=root.querySelector('.mqm-theorem');if(!r){el.innerHTML='<p>No results match this source filter.</p>';return}
      const authors=Array.isArray(r.authors)?r.authors.join(', '):r.authors;
      el.innerHTML=`<div class="mqm-theorem-top"><span class="mqm-type${r.kind==='lower'?' mqm-lower-type':''}">${r.kind==='lower'?'Lower-bound theorem':'Algorithm guarantee'}</span><strong>${esc(short(r))}</strong><span>${esc(r.venue||'')}</span></div><div class="mqm-detail-grid"><div><span>Resource bound</span><strong>${math(r.queryComplexity)}</strong></div><div><span>Guarantee</span><strong>${esc(r.quality)}</strong></div></div><p><b>Scope.</b> ${esc(r.graph)} · ${esc(r.output)}</p><p><b>Access.</b> ${esc(r.oracle)} · ${esc(r.adaptivity)}</p><p><b>Probability.</b> ${esc(r.probability)}</p>${r.quantifiers?`<p><b>Quantifiers.</b> ${esc(r.quantifiers)}</p>`:''}<details class="mqm-theorem-more"><summary>Exact theorem, assumptions &amp; primary source</summary><h3>${esc(r.title)}</h3><p>${esc(authors)}</p><p><b>${esc(r.theorem)}</b></p>${r.notes?`<p>${esc(r.notes)}</p>`:''}${r.assumptions?.length?`<p>${esc(r.assumptions.join('; '))}</p>`:''}${r.conditional?`<p><b>Conditional.</b> ${esc(r.conditionalAssumption||r.condition)}</p>`:''}<p><a href="${esc(r.fullTextUrl||r.url)}" target="_blank" rel="noopener noreferrer">Read primary source ↗</a>${r.publicationUrl?` · <a href="${esc(r.publicationUrl)}" target="_blank" rel="noopener noreferrer">Publication ↗</a>`:''}</p></details>`;
    }
    function render(){
      const rows=records(opts()),extra=related(opts());if(!all(opts()).some(r=>r.id===selected))selected=rows[0]?.id;
      root.querySelector('.mqm-publication-select').value=publication;root.querySelector('.mqm-plot-host').innerHTML=diagramSVG(opts());root.querySelector('.mqm-evidence-list').innerHTML=rows.map(button).join('');root.querySelector('.mqm-related-results').innerHTML=extra.map(button).join('');root.querySelector('.mqm-related-section').hidden=!extra.length;detail();
    }
    root.addEventListener('click',event=>{const t=event.target.closest('[data-mqm-result]');if(t){selected=t.dataset.mqmResult;render()}},{signal:controller.signal});
    root.addEventListener('keydown',event=>{if(!['Enter',' '].includes(event.key))return;const t=event.target.closest('.mqm-plot-result');if(t){event.preventDefault();selected=t.dataset.mqmResult;render()}},{signal:controller.signal});
    root.addEventListener('change',event=>{if(event.target.classList.contains('mqm-publication-select')){publication=event.target.value;render();options.onPublicationChange?.(publication)}},{signal:controller.signal});
    render();const instance={root,settingKey:ID,redraw:render,destroy(){controller.abort();root.classList.remove('matching-query-matrix-view');instances.delete(instance)}};instances.add(instance);return instance;
  }
  window.AtlasPairRenderers=window.AtlasPairRenderers||{};
  window.AtlasPairRenderers[ID]={mount,summarySVG,diagramSVG,records,release};
})();
