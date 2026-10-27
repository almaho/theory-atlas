(()=>{
  'use strict';
  const data=JSON.parse(document.getElementById('atlas-data').textContent).focus['query-list'];
  const instances=new Set();let serial=0;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const readable=s=>String(s??'').replace(/\bDelta\b/g,'Δ').replace(/\bepsilon\b/g,'ε').replace(/\bOmega\b/g,'Ω').replace(/\bTheta\b/g,'Θ').replace(/\bdelta\b/g,'δ').replace(/\bbeta\b/g,'β').replace(/\balpha\b/g,'α').replace(/\bgamma\b/g,'γ').replace(/\beta\b/g,'η').replace(/\bOtilde\b/g,'Õ').replace(/>=/g,'≥').replace(/<=/g,'≤');
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
    return html.replace(/\^(-?\d+)/g,'<sup>$1</sup>').replace(/\^\(([^()]*)\)/g,'<sup>$1</sup>').replace(/_([εδγ])/g,'<sub>$1</sub>');
  }
  const merge=r=>({...data.sources[r.sourceId],...r});
  const allowed=(r,o={})=>o.publication!=='published'||r.publicationStatus!=='preprint';
  const records=(o={})=>(data.verifiedRecords||[]).map(merge).filter(r=>allowed(r,o));
  const related=(o={})=>(data.relatedResults||[]).map(merge).filter(r=>allowed(r,o));
  const allRecords=o=>[...records(o),...related(o)].filter((r,i,a)=>a.findIndex(x=>x.id===r.id)===i);
  const label=r=>r.plotLabel||r.summaryLabel||r.shortLabel||r.label||r.sourceId||r.id;
  const title=r=>r.shortLabel||r.label||label(r);
  const lane=r=>r.resourceLane||r.plotLane||r.displayBound||r.queryComplexity;
  const formula=r=>r.displayBound||r.queryComplexity||r.bound;
  const text=(x,y,t,cls='',anchor='start',attrs='')=>`<text ${attrs} x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${esc(t)}</text>`;
  function svgFormula(x,y,s,cls='',anchor='start',attrs=''){
    return `<text ${attrs} x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${esc(readable(s)).replace(/\^\{([^{}]*)\}/g,'<tspan baseline-shift="super" font-size="70%">$1</tspan>').replace(/\^(-?\d+)/g,'<tspan baseline-shift="super" font-size="70%">$1</tspan>').replace(/\^\(([^()]*)\)/g,'<tspan baseline-shift="super" font-size="70%">$1</tspan>').replace(/_([εδγ])/g,'<tspan baseline-shift="sub" font-size="70%">$1</tspan>')}</text>`;
  }
  const panels={
    adaptive:{title:'Adaptive · general graphs',shortTitle:'Adaptive · general graphs',subtitle:'Multiplicative estimate of the global matching size.',columns:['constant','half','point5109','twothirds'],lanes:['linear','n15','subquadratic']},
    bipartite:{title:'Adaptive · bipartite graphs',shortTitle:'Adaptive · bipartite',subtitle:'Beyond two thirds; the lower bound has OPT = Θ(n).',columns:['above-twothirds'],lanes:['n12','subquadratic']},
    additive:{title:'Adaptive · additive error',shortTitle:'Adaptive · additive error',subtitle:'Mixed and pure additive guarantees are different.',columns:['half-additive','pure-additive'],lanes:['average-degree','nearquadratic']},
    nonadaptive:{title:'Non-adaptive · graph scopes',shortTitle:'Non-adaptive · graph scopes',subtitle:'Upper: simple graphs · lower: multigraphs.',columns:['sqrt-factor','cuberoot-factor'],lanes:['linear','superlinear']}
  };
  const qualities={constant:['Fixed β > 0','any constant'],half:['1 / (2 + ε)','fraction of OPT'],point5109:['0.5109','fraction of OPT'],twothirds:['Near 2/3','from below'],'above-twothirds':['2/3 + constant','fraction of OPT'],'half-additive':['½ OPT − εn','mixed error'],'pure-additive':['± εn','absolute error'],'sqrt-factor':['α = √n','simple graphs'],'cuberoot-factor':['α = n^{1/3−γ}','multigraphs · γ > 0']};
  const pointNote=r=>r.id==='list-brr24-additive-lower'?'∀δ > 0 ∃ε(δ) > 0':r.id==='list-shah26-lower'?'η = η(γ) > 0':'';
  const qualityShort={constant:'Fixed β > 0',half:'1/(2+ε)',point5109:'0.5109',twothirds:'Near 2/3','above-twothirds':'2/3 + constant','half-additive':'½ OPT − εn','pure-additive':'± εn','sqrt-factor':'α = √n','cuberoot-factor':'α = n^{1/3−γ}'};
  function scopePanels(options={}){
    const rows=records(options);
    return Object.entries(panels).map(([name,info])=>{
      const visible=rows.filter(r=>r.panel===name);if(!visible.length)return null;
      const columns=(data.axes?.[name]?.x?.categories||[]).map(c=>c.id),ordered=(data.axes?.[name]?.y?.categories||[]).map(c=>c.id),lanes=ordered.length?ordered:info.lanes;
      return {name,...info,columns:columns.length?columns:info.columns,rows:visible,lanes:[...lanes.filter(l=>visible.some(r=>lane(r)===l)),...new Set(visible.map(lane).filter(l=>!lanes.includes(l)))]};
    }).filter(Boolean);
  }
  function laneCaptions(p,l){
    const unique=[...new Set(p.rows.filter(r=>lane(r)===l).map(formula))];
    return unique.map(readable);
  }
  function marker(x,y,kind,selected=false,mini=false){
    const lower=kind==='lower',color=`var(--${lower?'red':'green'})`,r=mini?3:5.3;
    return `${selected&&!mini?`<circle cx="${x}" cy="${y}" r="12" fill="${color}" opacity=".12"/>`:''}${lower?`<path data-marker="lower" data-center-x="${x}" data-center-y="${y}" d="M${x} ${y-r-1}l${r+1} ${r+1}l-${r+1} ${r+1}l-${r+1}-${r+1}Z" fill="${color}"/>`:`<circle data-marker="algorithm" data-center-x="${x}" data-center-y="${y}" cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`}`;
  }
  function points(p,region){
    const dx=(region.r-region.l)/p.columns.length;
    return p.rows.map(r=>{
      const peers=p.rows.filter(t=>t.qualityFamily===r.qualityFamily&&lane(t)===lane(r)),index=peers.indexOf(r),paired=peers.length>1;
      return {r,x:region.l+dx*(p.columns.indexOf(r.qualityFamily)+.5),y:region.t+(region.b-region.t)*(p.lanes.indexOf(lane(r))+.5)/p.lanes.length,paired,index};
    });
  }
  function plotPoint(p,options={}){
    const {r,x,y,paired,index}=p,kind=r.kind==='lower'?'lower':'algorithm',dy=paired?(index===0?-9:9):0;
    return `<g class="ql-plot-result" data-query-list-result="${esc(r.id)}" data-kind="${kind}" data-guarantee-family="${esc(r.qualityFamily)}" data-resource-lane="${esc(lane(r))}" role="button" tabindex="0" aria-pressed="${r.id===options.selected}" aria-label="Inspect ${esc(title(r))}: ${esc(readable(formula(r)))}; ${esc(readable(r.quality))}" style="--ql-marker:var(--${kind==='lower'?'red':'green'})">${marker(x,y+dy,kind,r.id===options.selected)}${text(x,y+(paired?(index===0?-20:28):-13),label(r),'ql-paper-label','middle')}${pointNote(r)?text(x,y+23,pointNote(r),'ql-point-note','middle'):''}</g>`;
  }
  function diagramSVG(options={}){
    const visible=scopePanels(options);let s='<svg class="ql-map" viewBox="0 0 1100 796" role="img" aria-label="Adjacency-list matching size estimation: four scoped point plots, with guarantee family on x and symbolic total query budget on y."><title>How many probes reveal the matching size?</title><desc>Green circles are algorithms and red diamonds are lower bounds. This figure estimates one global matching size, not an edge membership or partner query. Adaptive general graphs, bipartite graphs, additive error, and non-adaptive graph scopes have separate axes. Both axes use named categories: symbolic formula rows do not imply a uniform numerical ranking.</desc>';
    visible.forEach((p,i)=>{
      const col=i%2,row=Math.floor(i/2),left=col?572:20,top=row?416:19,region={l:left+145,r:left+505,t:top+94,b:top+268};
      s+=`<g data-panel="${p.name}">`+text(left,top+6,String(i+1).padStart(2,'0'),'ql-section-number')+text(left+32,top+6,p.title,'ql-section-title')+text(left+32,top+28,p.subtitle,'ql-muted');
      s+=text(left,top+60,'Y · TOTAL QUERY BUDGET','ql-axis-title','start','data-axis="y"')+text(left,top+77,'Symbolic bounds · categorical rows','ql-axis-note');
      p.lanes.forEach((l,j)=>{
        const y=region.t+(region.b-region.t)*(j+.5)/p.lanes.length,captions=laneCaptions(p,l);
        s+=`<path d="M${region.l} ${y}H${region.r}" class="ql-grid"/>`;
        captions.forEach((caption,k)=>s+=svgFormula(region.l-10,y+4+(k-(captions.length-1)/2)*17,caption,'ql-y-label','end'));
      });
      p.columns.forEach((q,j)=>{const x=region.l+(region.r-region.l)*(j+.5)/p.columns.length;s+=`<path d="M${x} ${region.t-8}V${region.b}" class="ql-guide"/>`;const labels=qualities[q]||[q];labels.forEach((t,k)=>s+=svgFormula(x,region.b+24+k*17,t,k?'ql-x-note':'ql-x-label','middle'))});
      s+=`<path d="M${region.l} ${region.t-8}V${region.b}H${region.r}" class="ql-axis"/>`+points(p,region).map(point=>plotPoint(point,options)).join('');
      s+=text(region.l,region.b+68,'X · GUARANTEE FAMILY','ql-axis-title','start','data-axis="x"')+'</g>';
    });
    s+='<path d="M550 15V765M20 388H1080" class="ql-divider"/>';
    return s+text(20,787,'n = vertices · d̄ = average degree · ε = accuracy · α = OPT / estimate · select a point for exact quantifiers and primary source.','ql-muted')+'</svg>';
  }
  function summarySVG(key,w,h,options={}){
    const levels=['overview','compact','detail'],available=w<220||h<140?0:w<420||h<240?1:2,requested=levels.indexOf(options.level),level=levels[Math.min(available,requested<0?available:requested)],tiny=level==='overview',full=level==='detail',rich=full&&w>=650&&h>=420,visible=scopePanels(options);
    let s=`<svg class="ql-summary${rich?' ql-summary-rich':''}" data-detail-level="${level}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Adjacency-list matching size: green algorithms and red lower bounds, separated by adaptivity, graph type, and error contract. X is guarantee family; Y is symbolic total query budget.">`;
    const cols=rich?1:2,rows=Math.ceil(visible.length/cols),cellW=w/cols,cellH=h/rows;
    visible.forEach((p,i)=>{
      const left=(i%cols)*cellW,top=Math.floor(i/cols)*cellH,region={l:left+(rich?Math.min(230,w*.30):tiny?7:full?24:15),r:left+cellW-(tiny?7:12),t:top+(tiny?8:rich?29:24),b:top+cellH-(tiny?9:rich?31:full?30:20)};
      s+=`<g data-panel="${p.name}"><path d="M${region.l} ${region.t}V${region.b}H${region.r}" class="ql-axis"/>`;
      if(!tiny){
        s+=text(left+(rich?12:15),top+13,p.shortTitle,'ql-summary-title');
        p.columns.forEach((q,j)=>{const x=region.l+(region.r-region.l)*(j+.5)/p.columns.length;s+=`<path d="M${x} ${region.t}V${region.b}" class="ql-guide"/>`;if(full)s+=svgFormula(x,region.b+15,qualityShort[q]||q,'ql-summary-note','middle')});
        if(full)s+=text(region.r,region.b+28,p.name==='nonadaptive'?'X · guarantee family · upper: simple / lower: multi':'X · guarantee family','ql-summary-axis','end','data-axis="x"');
        p.lanes.forEach((l,j)=>{
          const y=region.t+(region.b-region.t)*(j+.5)/p.lanes.length;
          s+=`<path d="M${region.l} ${y}H${region.r}" class="ql-grid"/>`;
          if(rich){const captions=laneCaptions(p,l);captions.forEach((caption,k)=>s+=svgFormula(region.l-10,y+3+(k-(captions.length-1)/2)*12,caption,'ql-summary-formula','end'))}
        });
        if(rich)s+=text(region.l,top+13,'Y · TOTAL QUERY BOUNDS','ql-summary-axis','start','data-axis="y"');
        else if(full)s+='<text data-axis="y" class="ql-summary-axis" text-anchor="middle" transform="translate('+(left+8)+' '+((region.t+region.b)/2)+') rotate(-90)">Y · query bounds</text>';
      }
      for(const point of points(p,region).filter(p=>!tiny||p.r.kind==='lower'||['list-brr23-multiplicative','list-brr23-bipartite-upper','list-beh21-mixed','list-shah26-upper'].includes(p.r.id))){
        const {r,x,y,paired,index}=point,kind=r.kind==='lower'?'lower':'algorithm',dy=paired?(index===0?-4:4):0;
        s+=`<g data-query-list-result="${esc(r.id)}" data-kind="${kind}" data-guarantee-family="${esc(r.qualityFamily)}" data-resource-lane="${esc(lane(r))}">${marker(x,y+dy,kind,false,true)}`;
        if(rich)s+=text(x+(paired?(index===0?-7:7):7),y+(paired?(index===0?-3:7):3),label(r),kind==='lower'?'ql-summary-lower':'ql-summary-upper',paired&&index===0?'end':'start');
        else if(full&&!paired)s+=text(x,y-7,label(r),kind==='lower'?'ql-summary-lower':'ql-summary-upper','middle');
        if(rich&&pointNote(r))s+=text(x+7,y+15,pointNote(r),'ql-summary-quantifiers');
        s+='</g>';
      }
      s+='</g>';
    });
    return s+'</svg>';
  }
  function mount(root,key='query-list',options={}){
    for(const instance of instances)if(!instance.root.isConnected||instance.root===root)instance.destroy();
    window.StreamingMatching?.release(root);window.DynamicMatching?.release(root);window.LCAMatching?.release(root);window.LocalMatching?.release(root);window.MPCMatching?.release(root);
    const controller=new AbortController(),prefix='query-list-'+(++serial);let publication=options.publication||'all';
    const panel=key.includes('nonadaptive')?'nonadaptive':key.includes('bipartite')?'bipartite':key.includes('additive')||key.includes('mixed')?'additive':'adaptive';
    let selected=records({publication}).find(r=>r.panel===panel&&r.kind==='lower')?.id||records({publication})[0]?.id;
    const opts=()=>({publication,selected});
    root.classList.remove('dynamic-view','streaming-view','lca-view','local-view','mpc-view');root.classList.add('focus-view','query-list-view');root.classList.toggle('f-embedded',!!options.embedded);root.setAttribute('aria-label','Adjacency-list matching size algorithms and lower bounds');
    root.innerHTML=`<p class="f-kicker">MATCHING × ADJACENCY-LIST ACCESS / THE QUERY LANDSCAPE</p><header class="f-hero"><div><h1>How many probes reveal the matching size?</h1><p>Algorithms and lower bounds for estimating one global matching value.</p></div><div class="f-seal"><strong>Algorithms &amp; lower bounds</strong>Primary sources · ${esc(data.reviewedOn)}</div></header><div class="f-scope"><span><b>Access</b> degree + indexed neighbor queries</span><span><b>Output</b> a global size estimate</span><span><b>Resource</b> total probes / query time</span></div><section class="ql-landscape" aria-labelledby="${prefix}-legend"><div class="ql-toolbar"><div class="ql-legend" id="${prefix}-legend"><span><i class="ql-key-algorithm"></i>Algorithm upper bound</span><span><i class="ql-key-lower"></i>Impossibility lower bound</span></div><label class="ql-publication-control">Sources <select class="ql-publication-select" aria-label="Adjacency-list publication filter"><option value="all">All verified sources</option><option value="published">Published only</option></select></label></div><div class="ql-plot-scroll" tabindex="0" aria-label="Adjacency-list matching figure; scroll horizontally on narrow screens"><div class="ql-plot-host"></div></div><div class="ql-chart-notes"><p><b>Read the axes.</b> X names a guarantee family. Y records total time upper bounds and query lower bounds; a time upper bound also bounds the number of probes. Categories do not impose a numerical ranking across n, degree and accuracy; shared rows may show different upper and lower formulas. Near 2/3 collects two distinct guarantees from below.</p><p><b>Keep the output contract.</b> These algorithms estimate the global maximum matching size. LCA answers one edge-membership or partner query consistently with an implicit matching; its cost is per local query. Additive error retains its own scope. The non-adaptive upper bound is shown for simple graphs; the lower bound permits multigraphs.</p></div></section><section class="ql-theorem" id="${prefix}-theorem" aria-label="Selected adjacency-list theorem" aria-live="polite"></section><section class="ql-related-section"><div class="ql-section-head"><h2>Further tradeoffs in their own scope</h2><p>Exact restrictions and quantifiers remain attached to each statement.</p></div><div class="ql-related-results"></div></section><details class="ql-evidence"><summary>All displayed results &amp; exact statements</summary><div class="ql-evidence-list"></div></details><div class="f-bottom"><span>n, degree, accuracy, graph class and adaptivity remain explicit.</span><span>Select a point to inspect its guarantee, probability, quantifiers and source.</span></div>`;
    function button(r){return `<button type="button" data-query-list-result="${esc(r.id)}" class="ql-record ${r.kind==='lower'?'ql-record-lower':''}" aria-pressed="${r.id===selected}"><span>${esc(title(r))}</span><strong>${math(formula(r))}</strong><small>${human(r.quality)}</small><small>${human(r.adaptivity||r.graph||'See exact scope')}</small></button>`}
    function detail(){
      const r=allRecords(opts()).find(r=>r.id===selected);if(!r)return;
      const authors=Array.isArray(r.authors)?r.authors.join(', '):r.authors,assumptions=Array.isArray(r.assumptions)?r.assumptions.join('; '):r.assumptions;
      root.querySelector('.ql-theorem').innerHTML=`<div class="ql-theorem-top"><span class="ql-type ${r.kind==='lower'?'ql-lower-type':''}">${r.kind==='lower'?'Lower-bound theorem':'Algorithm guarantee'}</span><strong>${esc(title(r))}</strong><span>${esc(r.venue||r.publicationStatus||'')}</span></div><div class="ql-detail-grid"><div><span>Total queries / time</span><strong>${math(r.queryComplexity||formula(r))}</strong></div><div><span>Matching-size guarantee</span><strong>${human(r.quality)}</strong></div><div><span>Oracle &amp; adaptivity</span><strong>${human(r.oracle||'Degree / neighbor queries')} · ${human(r.adaptivity||'See theorem')}</strong></div></div><p><b>Scope.</b> ${human(r.graph||'See source statement')}${r.output?` · ${human(r.output)}`:''}</p>${r.probability?`<p><b>Probability.</b> ${human(r.probability)}</p>`:''}${r.quantifiers?`<p><b>Quantifiers.</b> ${human(r.quantifiers)}</p>`:''}<details class="ql-theorem-more"><summary>Exact theorem, assumptions &amp; primary source</summary><h3>${esc(r.title||title(r))}</h3><p>${esc(authors||'')}</p><p><b>${esc(r.theorem||'Source theorem')}</b>${assumptions?` · ${human(assumptions)}`:''}</p>${r.notes?`<p>${human(r.notes)}</p>`:''}${r.verification?`<p>${human(r.verification)}</p>`:''}${r.url||r.fullTextUrl?`<p><a href="${esc(r.fullTextUrl||r.url)}" target="_blank" rel="noopener noreferrer">Read primary source ↗</a>${r.publicationUrl?` · <a href="${esc(r.publicationUrl)}" target="_blank" rel="noopener noreferrer">Publication ↗</a>`:''}</p>`:''}</details>`;
    }
    function render(){
      const rows=records(opts()),extra=related(opts()),all=allRecords(opts());if(!all.some(r=>r.id===selected))selected=rows.find(r=>r.kind==='lower')?.id||rows[0]?.id;
      root.querySelector('.ql-publication-select').value=publication;root.querySelector('.ql-plot-host').innerHTML=diagramSVG(opts());root.querySelector('.ql-evidence-list').innerHTML=rows.map(button).join('');root.querySelector('.ql-related-section').hidden=!extra.length;root.querySelector('.ql-related-results').innerHTML=extra.map(button).join('');detail();
    }
    root.addEventListener('click',event=>{const result=event.target.closest('[data-query-list-result]');if(result){selected=result.dataset.queryListResult;render()}},{signal:controller.signal});
    root.addEventListener('keydown',event=>{if(event.key!=='Enter'&&event.key!==' ')return;const result=event.target.closest('.ql-plot-result');if(result){event.preventDefault();selected=result.dataset.queryListResult;render()}},{signal:controller.signal});
    root.addEventListener('change',event=>{if(event.target.classList.contains('ql-publication-select')){publication=event.target.value;render();options.onPublicationChange?.(publication)}},{signal:controller.signal});
    render();const instance={root,settingKey:'query-list',redraw:render,destroy(){controller.abort();instances.delete(instance)}};instances.add(instance);return instance;
  }
  window.ListQueryMatching={mount,summarySVG,diagramSVG,records,release(root){for(const instance of instances)if(!instance.root.isConnected||instance.root===root)instance.destroy()}};
})();
