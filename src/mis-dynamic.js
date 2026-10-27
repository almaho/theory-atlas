(()=>{
  'use strict';
  const data=JSON.parse(document.getElementById('atlas-data').textContent).focus['mis-dynamic'];
  if(!data)return;
  const instances=new Set();let serial=0;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const merge=r=>({...data.sources[r.sourceId],...r});
  const allowed=(r,o)=>o.publication!=='published'||r.publicationStatus!=='preprint';
  const records=(o={})=>data.verifiedRecords.map(merge).filter(r=>allowed(r,o));
  const related=(o={})=>(data.relatedResults||[]).map(merge).filter(r=>allowed(r,o));
  const all=o=>[...records(o),...related(o)];
  const math=s=>esc(s).replace(/\^\{([^{}]*)\}/g,'<sup>$1</sup>');
  const tx=(x,y,s,c='',a='start',extra='')=>`<text x="${x}" y="${y}" class="${c}" text-anchor="${a}" ${extra}>${esc(s).replace(/\^\{([^{}]*)\}/g,'<tspan baseline-shift="super" font-size="72%">$1</tspan>')}</text>`;
  function panels(o={}){
    const rows=records(o);return data.panels.map(p=>({...p,rows:rows.filter(r=>r.panel===p.id)})).filter(p=>p.rows.length).map(p=>({...p,lanes:p.lanes.filter(l=>p.rows.some(r=>r.displayBound===l))}));
  }
  function marker(x,y,r,mini=false,selected=false){
    const size=mini?2.8:5,color=`var(--${r.kind==='lower'?'red':'green'})`,h=selected&&!mini?`<circle cx="${x}" cy="${y}" r="11" fill="${color}" opacity=".12"/>`:'';
    return h+(r.kind==='lower'?`<path data-marker="lower" data-center-x="${x}" data-center-y="${y}" d="M${x} ${y-size-1}l${size+1} ${size+1}l-${size+1} ${size+1}l-${size+1}-${size+1}Z" fill="${r.conditional?'var(--surface)':'var(--red)'}" stroke="var(--red)" stroke-width="1.4" ${r.conditional?'stroke-dasharray="2 1"':''}/>`:`<circle data-marker="algorithm" data-center-x="${x}" data-center-y="${y}" cx="${x}" cy="${y}" r="${size}" fill="var(--green)"/>`);
  }
  function coordinates(p,z){
    return p.rows.map(r=>({r,x:z.l+(p.categories.findIndex(c=>c.id===r.contract)+.5)*(z.r-z.l)/p.categories.length,y:z.t+(p.lanes.indexOf(r.displayBound)+.5)*(z.b-z.t)/p.lanes.length}));
  }
  function drawPanel(p,z,o={},mode='focus'){
    const tiny=mode==='overview',rich=mode==='rich',focus=mode==='focus',mid=mode==='detail',full=focus||rich;
    let s=`<g data-panel="${p.id}">`;
    if(!tiny){
      s+=tx(z.x+12,z.y+17,p.title,'mdy-panel-title');
      if(focus)s+=tx(z.x+12,z.y+38,p.subtitle,'mdy-muted');
      if(full)s+=tx(z.l,z.y+(focus?60:17),'Y · '+p.yLabel,'mdy-axis-title','start','data-axis="y"');
      p.lanes.forEach((l,j)=>{const y=z.t+(j+.5)*(z.b-z.t)/p.lanes.length;s+=`<path d="M${z.l} ${y}H${z.r}" class="mdy-grid"/>`;if(full)s+=tx(z.l-10,y+3,l,'mdy-y-label','end')});
      p.categories.forEach((c,j)=>{const x=z.l+(j+.5)*(z.r-z.l)/p.categories.length;s+=`<path d="M${x} ${z.t}V${z.b}" class="mdy-guide"/>`;if(full||mid)s+=tx(x,z.b+(focus?22:13),c.label,'mdy-x-label','middle')});
      if(focus)s+=tx(z.l,z.b+43,'X · '+p.xLabel+' · categories','mdy-axis-title','start','data-axis="x"');
    }
    s+=`<path d="M${z.l} ${z.t}V${z.b}H${z.r}" class="mdy-axis"/>`;
    const pts=coordinates(p,z).filter(({r})=>!tiny||r.kind==='lower'||r.id==='mis-dyn-gupta-surendra-2026-inc'||r.id==='mis-dyn-gupta-khan-2021'||r.id==='mis-dyn-aoss-2019-m13'||r.id==='mis-dyn-blelloch-2026-single'||r.id==='mis-dynamic-behnezhad-et-al-whp'||r.panel==='batch');
    pts.forEach(({r,x,y})=>{
      const interactive=focus?`role="button" tabindex="0" aria-pressed="${r.id===o.selected}"`:'';
      s+=`<g class="mdy-result" data-mis-dynamic-result="${esc(r.id)}" data-kind="${r.kind==='lower'?'lower':'algorithm'}" data-conditional="${!!r.conditional}" data-contract="${r.contract}" ${interactive} aria-label="Inspect ${esc(r.shortLabel)}: ${esc(r.displayBound)}; ${esc(r.adversary)}; ${esc(r.output)}">${marker(x,y,r,!focus,r.id===o.selected)}`;
      if(full)s+=tx(x+9,y+3,r.shortLabel+(r.conditional?' · conditional':''),r.kind==='lower'?'mdy-paper-label mdy-lower':'mdy-paper-label mdy-upper');
      s+='</g>';
    });
    return s+'</g>';
  }
  function diagramSVG(options={}){
    if(typeof options==='string')options=arguments[1]||{};
    const visible=panels(options),ob=visible.find(p=>p.id==='oblivious'),others=visible.filter(p=>p.id!=='oblivious');
    let s='<svg class="mdy-map" viewBox="0 0 1100 930" role="img" aria-label="Dynamic maximal independent set algorithms and lower bounds in separate adversary, update guarantee, and parallel-resource scopes"><title>How expensive is maintaining an MIS?</title><desc>Green circles are algorithm upper bounds. Hollow red diamonds denote conditional lower bounds. X names a resource or update guarantee; Y records exact symbolic formulas on categorical rows. The adaptive lower bound does not apply to oblivious updates.</desc>';
    if(ob)s+=drawPanel(ob,{x:14,y:8,l:246,r:1067,t:83,b:242},options);
    others.forEach((p,i)=>{const x=i%2?565:14,y=318+Math.floor(i/2)*295;s+=drawPanel(p,{x,y,l:x+201,r:x+510,t:y+80,b:y+225},options)});
    s+='<path d="M22 299H1080M22 603H1080M550 324V890" class="mdy-divider"/>';
    return s+tx(24,919,'n = vertices · m = edges · Δ = maximum degree · b = batch size · symbolic formula rows are not a numerical ranking.','mdy-muted')+'</svg>';
  }
  function summarySVG(key,w,h,options={}){
    const names=['overview','compact','detail'],available=w<220||h<140?0:w<420||h<240?1:2,asked=names.indexOf(options.level),level=names[Math.min(available,asked<0?available:asked)],tiny=level==='overview',rich=level==='detail'&&w>=650&&h>=420;
    const pp=panels(options),cols=rich?1:2,rows=Math.ceil(pp.length/cols),cw=w/cols,ch=h/rows;
    let s=`<svg class="mdy-summary${rich?' mdy-rich':''}" data-detail-level="${level}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="MIS dynamic landscape: green algorithms, conditional red lower bound; separated scopes and symbolic formula axes">`;
    pp.forEach((p,i)=>{const x=(i%cols)*cw,y=Math.floor(i/cols)*ch,z={x,y,l:x+(rich?Math.min(220,w*.30):tiny?6:12),r:x+cw-(rich?115:tiny?6:12),t:y+(tiny?5:rich?23:26),b:y+ch-(tiny?5:rich?18:level==='detail'?20:10)};s+=drawPanel(p,z,options,tiny?'overview':rich?'rich':level==='detail'?'detail':'compact')});
    return s+'</svg>';
  }
  function mount(root,key='mis-dynamic',options={}){
    release(root);
    for(const name of ['StreamingMatching','DynamicMatching','LCAMatching','LocalMatching','MPCMatching','ListQueryMatching'])window[name]?.release(root);
    for(const [id,renderer] of Object.entries(window.AtlasPairRenderers||{}))if(id!=='mis-dynamic')renderer.release?.(root);
    const controller=new AbortController(),prefix='mis-dynamic-'+(++serial);let publication=options.publication||'all';
    const preferred=key.includes('adaptive')?'adaptive':key.includes('deterministic')?'deterministic':key.includes('amortized')?'history':key.includes('batch')?'batch':'adaptive';
    let selected=records({publication}).find(r=>r.panel===preferred&&r.kind==='lower')?.id||records({publication}).find(r=>r.panel===preferred)?.id||records({publication})[0]?.id;
    const opts=()=>({publication,selected});
    root.classList.remove('dynamic-view','streaming-view','lca-view','local-view','mpc-view','query-list-view');root.classList.add('focus-view','mis-dynamic-view');root.classList.toggle('f-embedded',!!options.embedded);root.setAttribute('aria-label','Dynamic MIS algorithms and lower bounds');
    root.innerHTML=`<p class="f-kicker">MAXIMAL INDEPENDENT SET × DYNAMIC</p><header class="f-hero"><div><h1>How expensive is maintaining an MIS?</h1><p>Explicit sets, membership access, and batch resources—with their assumptions attached.</p></div><div class="f-seal"><strong>Algorithms &amp; lower bounds</strong>Primary sources · ${esc(data.reviewedOn)}</div></header><div class="f-scope"><span><b>Updates</b> edge insertions / deletions</span><span><b>Adversary</b> adaptive and oblivious separated</span><span><b>Bounds</b> exact symbolic formulas</span></div><section class="mdy-landscape"><div class="mdy-toolbar"><div class="mdy-legend"><span><i class="mdy-key-algorithm"></i>Algorithm</span><span><i class="mdy-key-lower"></i>Conditional lower bound</span></div><label class="mdy-publication-control">Sources <select class="mdy-publication-select" aria-label="Dynamic MIS publication filter"><option value="all">All verified sources</option><option value="published">Published only</option></select></label></div><div class="mdy-plot-scroll" tabindex="0" aria-label="Dynamic MIS figure; scroll horizontally on narrow screens"><div class="mdy-plot-host"></div></div><div class="mdy-chart-notes"><p><b>Read the axes.</b> X separates update or resource contracts. Y keeps exact formulas as categories: distances do not compare n, m, Δ, or hidden exponents. The incremental upper and conditional lower bound meet polynomially when m = Θ(n²).</p><p><b>Keep the assumptions.</b> The red incremental bound assumes combinatorial BMM and an adaptive adversary. High-probability membership access does not promise bounded explicit recourse. Batch work and depth are distinct resources. No compatible lower bound was verified in the bounded source set for the other main panels.</p></div></section><section class="mdy-theorem" id="${prefix}-theorem" aria-label="Selected dynamic MIS theorem" aria-live="polite"></section><section class="mdy-related-section"><div class="mdy-section-head"><h2>Additional bounds with different contracts</h2><p>Recourse, general BMM, and the alternate work/depth tradeoff.</p></div><div class="mdy-related-results"></div></section><details class="mdy-evidence"><summary>Every displayed result &amp; source</summary><div class="mdy-evidence-list"></div></details><div class="f-bottom"><span>${esc(data.coverage)}</span><span>Select any point for exact assumptions and its primary theorem.</span></div>`;
    function button(r){return `<button type="button" class="mdy-record ${r.kind==='lower'?'mdy-record-lower':''}" data-mis-dynamic-result="${esc(r.id)}" aria-pressed="${r.id===selected}"><span>${esc(r.shortLabel)}</span><strong>${math(r.displayBound)}</strong><small>${esc(r.output)}</small></button>`}
    function detail(){const r=all(opts()).find(r=>r.id===selected);if(!r)return;root.querySelector('.mdy-theorem').innerHTML=`<div class="mdy-theorem-top"><span class="mdy-type ${r.kind==='lower'?'mdy-lower':''}">${r.kind==='lower'?(r.conditional?'Conditional lower bound':'Unconditional lower bound'):'Algorithm guarantee'}</span><strong>${esc(r.shortLabel)}</strong><span>${esc(r.venue)}</span></div><div class="mdy-detail-grid"><div><span>${esc(r.resource)}</span><strong>${math(r.displayBound)}</strong></div><div><span>Output contract</span><strong>${esc(r.output)}</strong></div><div><span>Adversary / probability</span><strong>${esc(r.adversary)} · ${esc(r.probability)}</strong></div></div><p><b>Scope.</b> ${esc(r.graph)}.</p><p><b>Exact statement.</b> ${esc(r.notes)}</p><details class="mdy-theorem-more"><summary>Theorem, assumptions &amp; primary source</summary><h3>${esc(r.title)}</h3><p>${esc((r.authors||[]).join(', '))}</p><p><b>${esc(r.theorem)}</b> · ${esc((r.assumptions||[]).join('; '))}</p><p><a href="${esc(r.fullTextUrl||r.url)}" target="_blank" rel="noopener noreferrer">Read primary source ↗</a></p></details>`}
    function render(){const rr=records(opts()),extra=related(opts());if(!all(opts()).some(r=>r.id===selected))selected=rr.find(r=>r.kind==='lower')?.id||rr[0]?.id;root.querySelector('.mdy-publication-select').value=publication;root.querySelector('.mdy-plot-host').innerHTML=diagramSVG(opts());root.querySelector('.mdy-related-results').innerHTML=extra.map(button).join('');root.querySelector('.mdy-evidence-list').innerHTML=rr.map(button).join('');root.querySelector('.mdy-related-section').hidden=!extra.length;detail()}
    root.addEventListener('click',e=>{const r=e.target.closest('[data-mis-dynamic-result]');if(r){selected=r.dataset.misDynamicResult;render()}},{signal:controller.signal});
    root.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const r=e.target.closest('.mdy-result');if(r){e.preventDefault();selected=r.dataset.misDynamicResult;render()}},{signal:controller.signal});
    root.addEventListener('change',e=>{if(e.target.classList.contains('mdy-publication-select')){publication=e.target.value;render();options.onPublicationChange?.(publication)}},{signal:controller.signal});
    render();const instance={root,settingKey:'mis-dynamic',redraw:render,destroy(){controller.abort();root.classList.remove('mis-dynamic-view');instances.delete(instance)}};instances.add(instance);return instance;
  }
  function release(root){for(const instance of instances)if(!instance.root.isConnected||instance.root===root)instance.destroy()}
  window.AtlasPairRenderers=window.AtlasPairRenderers||{};window.AtlasPairRenderers['mis-dynamic']={mount,summarySVG,diagramSVG,records,release};
})();
