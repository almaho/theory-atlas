(()=>{
  'use strict';
  const collection=JSON.parse(document.getElementById('atlas-data').textContent).focus;
  const instances=new Set();let serial=0;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const source=(r,label='Primary source')=>`<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`;
  const allowed=(r,o={})=>o.publication!=='published'||r.publicationStatus!=='preprint';
  const graphKey=o=>o.graph==='bipartite'?'bipartite':'two';
  const records=(o={})=>['one',graphKey(o)].flatMap((key,i)=>collection[key].results.filter(r=>allowed(r,o)).map(r=>({...r,passes:i+1,graph:o.graph==='bipartite'?'bipartite':'general',settingKey:key})));
  const related=o=>collection[graphKey(o)].relatedResults.filter(r=>allowed(r,o));
  const endpoints=(rows,passes)=>{const lane=rows.filter(r=>r.passes===passes);return {a:lane.filter(r=>r.kind==='algorithm').reduce((a,b)=>a.ratio>b.ratio?a:b),b:lane.filter(r=>r.kind==='barrier').reduce((a,b)=>a.ratio<b.ratio?a:b)}};
  const labels={greedy:'Greedy',gkk2012:'GKK’12',kapralov2013:'Kapralov’13',kapralov2021:'Kapralov’21',ajx2026a:'AJX’26 I',ajx2026b:'AJX’26 II','greedy-two-pass-baseline':'Greedy',kmm2014:'KMM’14',kt2017:'KT’17',fs2022:'FS’22',abr2024:'ABR’24',kn2024:'KN’24','greedy-bipartite-baseline':'Greedy', 'kmm2012-bipartite':'KMM’12','ehm2016-bipartite':'EHM’16','kt2017-bipartite':'KT’17','konrad2018-bipartite':'Konrad’18','bksw2023-bipartite':'BKSW’23','abr2024-bipartite':'ABR’24','kn2024-bipartite':'KN’24'};
  const label=r=>labels[r.id]||r.rowName||r.shortTitle;
  const fraction=r=>r.ratio===.5?'½':Math.abs(r.ratio-8/9)<1e-8?'8/9':'≈'+r.ratio.toFixed(4)+(r.ratioIsLimit?' limit':'');
  const ceiling=r=>r.ratio===.5?'½':r.formula;
  function groupRows(rows){
    const groups=[];
    for(const row of rows){let group=groups.find(g=>g.kind===row.kind&&Math.abs(g.beta-row.ratio)<1e-9);if(!group){group={kind:row.kind,beta:row.ratio,rows:[]};groups.push(group)}group.rows.push(row)}
    return groups.sort((a,b)=>a.beta-b.beta);
  }
  // The left section enlarges the crowded algorithm range; the omitted interval is labeled.
  const plot={left:120,right:1040,top:52,bottom:545,breakStart:805,breakEnd:850,ys:{1:430,2:190}};
  const betaX=v=>v<=.70?120+(v-.48)/.22*685:850+(v-.82)/.18*190;
  const splitLine=(from,to,y,cls)=>{
    const segments=from<plot.breakStart?[[from,Math.min(to,plot.breakStart)]]:[];
    if(to>plot.breakEnd)segments.push([Math.max(from,plot.breakEnd),to]);
    return segments.filter(([a,b])=>b>a).map(([a,b])=>`<path d="M${a} ${y}H${b}" class="${cls}"/>`).join('');
  };
  function marker(px,py,g,selected=false,r=5){
    const color=g.kind==='algorithm'?'var(--green)':'var(--red)',limit=g.kind==='algorithm'&&g.rows.every(row=>row.ratioIsLimit),common=`data-center-x="${px}" data-center-y="${py}"`;
    return `${selected?`<circle cx="${px}" cy="${py}" r="12" fill="${color}" opacity=".12"/>`:''}${g.kind==='algorithm'?`${limit&&!g.crowded&&r>=4?`<path d="M${px-17} ${py}h9" stroke="${color}" stroke-width="1.7"/>`:''}<circle ${common} cx="${px}" cy="${py}" r="${r}" fill="${limit?'var(--surface)':color}" stroke="${color}" stroke-width="1.8"/>`:`<path ${common} d="M${px} ${py-r-2}l${r+2} ${r+2}l-${r+2} ${r+2}l-${r+2}-${r+2}Z" fill="${g.coincident?'none':'var(--surface)'}" stroke="${color}" stroke-width="1.8"/>`}`;
  }
  function annotation(g,pass,graph){
    const px=betaX(g.beta),cy=plot.ys[pass],id=g.rows[0].id;
    if(pass===1){
      if(g.kind==='algorithm')return {x:px-17,y:cy-19,anchor:'end'};
      const lower={ajx2026b:{x:px+19,y:cy+39},ajx2026a:{x:px-16,y:cy-52,anchor:'end'},kapralov2021:{x:px+18,y:cy+39},kapralov2013:{x:px-17,y:cy-52,anchor:'end'},gkk2012:{x:px+18,y:cy-35}};
      return lower[id]||{x:px+15,y:cy+35};
    }
    if(g.kind==='barrier')return {x:px,y:cy-39,anchor:'middle'};
    if(g.beta===.5)return {x:px-17,y:cy+30,anchor:'end'};
    if(g.rows.some(row=>row.ratioIsLimit))return {x:px+22,y:graph==='bipartite'?cy+7:cy-8};
    const algorithm={kmm2014:{x:px+5,y:cy-53,anchor:'middle'},kt2017:{x:px-16,y:cy+53,anchor:'end'},fs2022:{x:px+24,y:cy-36},'kmm2012-bipartite':{x:px-8,y:cy-53,anchor:'middle'},'kt2017-bipartite':{x:px-12,y:cy+53,anchor:'end'},'ehm2016-bipartite':{x:px-13,y:cy-53,anchor:'end'}};
    return algorithm[id]||{x:px+16,y:cy+25};
  }
  function diagramSVG(options={}){
    const rows=records(options),text=(px,py,t,cls='',anchor='start')=>`<text x="${px}" y="${py}" class="${cls}" text-anchor="${anchor}">${esc(t)}</text>`;
    let svg=`<svg class="s-map" viewBox="0 0 1100 600" role="img" aria-label="Streaming maximum matching: guaranteed fraction beta versus one or at most two passes. Fixed O(n polylog n) bits, insertion-only arbitrary-order streams, ${options.graph==='bipartite'?'bipartite':'general'} unweighted graphs. Green algorithms and red lower bounds share the same axes."><title>Streaming matching — the approximation / pass landscape</title><desc>Green circles are algorithm guarantees; hollow circles are limits approached from below. Red diamonds rule out every fixed ratio strictly above their threshold. Two passes are the upper resource lane and one pass is the lower lane. The beta axis is broken: 0.48–0.70 is enlarged and 0.70–0.82 is omitted. Both segments are linear; every marker remains at its exact beta and pass budget.</desc>`;
    svg+=text(12,22,'PASS BUDGET','s-axis-title')+text(1040,22,'Better approximation → · fewer passes ↓','s-muted','end');
    for(const tick of [.5,.55,.6,2/3,8/9,1])svg+=`<path d="M${betaX(tick)} ${plot.top}V${plot.bottom}" class="s-guide"/>`;
    svg+=`<path d="M${plot.left} ${plot.top}V${plot.bottom}H${plot.breakStart} M${plot.breakEnd} ${plot.bottom}H${plot.right}" class="s-axis"/><path d="M813 550l10-10m4 10l10-10" class="s-axis"/>`;
    for(const pass of [2,1]){
      const cy=plot.ys[pass],{a,b}=endpoints(rows,pass),ax=betaX(a.ratio),bx=betaX(b.ratio),laneRows=rows.filter(r=>r.passes===pass),groups=groupRows(laneRows);
      svg+=`<g class="s-pass-lane" data-pass="${pass}" data-center-y="${cy}">${splitLine(plot.left,plot.right,cy,'s-grid')}${splitLine(bx+10,plot.right,cy,'s-exclusion-ray')}<path d="M${plot.right-6} ${cy-3}l6 3-6 3" class="s-exclusion-arrow"/>`;
      svg+=text(100,cy+4,pass===1?'1 pass':'≤2 passes','s-y-label','end');
      // Exclusion rays begin at the strongest lower bound. Older lower bounds retain their own diamonds.
      if(pass===2)svg+=text((ax+bx)/2+12,cy+38,'Unresolved','s-region','middle')+text(plot.right-8,cy+26,'excluded','s-excluded-label','end');
      else svg+=text(plot.right-8,cy+26,'fixed β above the red ceiling is excluded','s-excluded-label','end');
      for(const g of groups){
        const px=betaX(g.beta),isAlgorithm=g.kind==='algorithm',selected=g.rows.some(r=>r.id===options.selected),n=annotation(g,pass,options.graph),color=isAlgorithm?'var(--green)':'var(--red)',names=g.rows.map(label),coincident=!isAlgorithm&&groups.some(a=>a.kind==='algorithm'&&Math.abs(a.beta-g.beta)<1e-9);
        g.coincident=coincident;g.crowded=isAlgorithm&&groups.some(other=>other!==g&&other.kind==='algorithm'&&Math.abs(betaX(other.beta)-px)<12);
        const lineNames=names.length>2?[names[0],names.slice(1).join(' · ')]:[names.join(' · ')],formula=isAlgorithm?fraction(g.rows[0]):'fixed β > '+ceiling(g.rows[0]),labelBottom=n.y+(lineNames.length-1)*17+17,leaderEnd=n.y<cy?labelBottom+5:n.y-9,leaderX=n.x+(n.anchor==='end'?-6:n.anchor==='middle'?0:6);
        svg+=`<g class="s-plot-result" role="button" tabindex="0" data-streaming-result="${esc(g.rows[0].id)}" data-row-ids="${esc(g.rows.map(r=>r.id).join(','))}" data-pass="${pass}" data-beta="${g.beta}" data-kind="${g.kind}" data-center-x="${px}" data-center-y="${cy}" aria-pressed="${selected}" aria-label="${esc(g.rows.map(r=>label(r)+': '+r.formula).join('; ')+'. '+(pass===1?'One pass':'At most two passes')+'. Inspect theorem.')}" style="--s-marker:${color}"><title>${esc(g.rows.map(r=>r.authors+' · '+r.dateLabel+' · '+r.formula).join('\n'))}</title>`;
        if(Math.abs(n.y-cy)>26)svg+=`<path d="M${px} ${cy+(n.y<cy?-9:9)}L${leaderX} ${leaderEnd}" class="s-leader"/>`;
        svg+=marker(px,cy,g,selected,coincident?6:g.crowded?3.5:5);
        lineNames.forEach((name,i)=>{svg+=text(n.x,n.y+i*17,name,'s-paper-label',n.anchor||'start')});
        svg+=text(n.x,labelBottom,formula,'s-point-formula',n.anchor||'start')+'</g>';
      }
      svg+='</g>';
    }
    for(const [tick,t] of [[.5,'½'],[.55,'.55'],[.6,'.60'],[2/3,'⅔'],[8/9,'8/9'],[1,'1']])svg+=text(betaX(tick),566,t,'s-x-label','middle');
    svg+=text(plot.left,591,'GUARANTEED FRACTION β = |M| / OPT','s-axis-title')+text(plot.right,591,'β-axis break: 0.70–0.82','s-muted','end');
    return svg+'</svg>';
  }
  function summarySVG(key,w,h,options={}){
    const o={...options,graph:key==='bipartite'?'bipartite':options.graph||'general'},rows=records(o),levels=['overview','compact','detail'],available=w<220||h<140?0:w<420||h<240?1:2,requested=levels.indexOf(options.level),level=levels[Math.min(available,requested<0?available:requested)],tiny=level==='overview',full=level==='detail';
    const left=tiny?10:full?64:39,right=w-(tiny?10:18),top=tiny?8:full?33:13,bottom=h-(tiny?10:full?42:28),px=v=>left+(betaX(v)-plot.left)/(plot.right-plot.left)*(right-left),py=v=>top+(v-plot.top)/(plot.bottom-plot.top)*(bottom-top),breakStart=px(.70),breakEnd=px(.82);
    const text=(x,y,t,color='var(--muted)',anchor='start',size=11)=>`<text x="${x}" y="${y}" text-anchor="${anchor}" style="font-size:${size}px;fill:${color}">${esc(t)}</text>`;
    const split=(from,to,y,cls)=>[[from,Math.min(to,breakStart)],[Math.max(from,breakEnd),to]].filter(([a,b])=>b>a).map(([a,b])=>`<path d="M${a} ${y}H${b}" class="${cls}"/>`).join('');
    let svg=`<svg class="s-summary" data-detail-level="${level}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Streaming matching: approximation versus pass budget. Two passes above, one below. Green algorithms, red lower bounds. Beta axis is enlarged from .48 to .70 with a break omitting .70–.82."><path d="M${left} ${top}V${bottom}H${breakStart} M${breakEnd} ${bottom}H${right}" class="s-axis"/><path d="M${(breakStart+breakEnd)/2-4} ${bottom+3}l4-6m2 6l4-6" class="s-axis"/>`;
    if(!tiny)for(const beta of [.5,.6,8/9])svg+=`<path d="M${px(beta)} ${top}V${bottom}" class="s-guide"/>`;
    for(const pass of [2,1]){
      const cy=py(plot.ys[pass]),{a,b}=endpoints(rows,pass),bx=px(b.ratio);
      let groups=groupRows(rows.filter(r=>r.passes===pass));
      if(tiny)groups=groups.filter(g=>g.rows.some(r=>r.id===a.id||r.id===b.id));
      svg+=`<g data-pass="${pass}" data-center-y="${cy}" class="s-summary-lane">${split(left,right,cy,'s-grid')}${split(bx+4,right,cy,'s-exclusion-ray')}`;
      for(const g of groups){
        const cx=px(g.beta),coincident=g.kind==='barrier'&&groups.some(a=>a.kind==='algorithm'&&Math.abs(a.beta-g.beta)<1e-9);g.coincident=coincident;
        svg+=`<g data-pass="${pass}" data-beta="${g.beta}" data-kind="${g.kind}" data-center-x="${cx}" data-center-y="${cy}" data-row-ids="${esc(g.rows.map(r=>r.id).join(','))}">${marker(cx,cy,g,false,tiny?2:2.7)}</g>`;
      }
      if(!tiny)svg+=text(left-8,cy+4,pass===1?'1':'≤2','var(--ink)','end',full?12:10);
      if(full){
        svg+=text(px(a.ratio)+8,cy-13,label(a)+' · '+fraction(a),'var(--green)','start',10);
        svg+=text(pass===1?right:px(b.ratio),cy+22,label(b)+' · >'+ceiling(b),'var(--red)',pass===1?'end':'middle',10);
      }
      svg+='</g>';
    }
    if(!tiny)svg+=text(px(.5),bottom+17,'½','var(--ink)','middle',10)+text(px(1),bottom+17,'1','var(--ink)','middle',10);
    if(full)svg+=text(left,17,'Passes','var(--muted)','start',10)+text(right,17,'Streaming · '+o.graph,'var(--ink)','end',11)+text((left+right)/2,h-5,'β → · fewer passes ↓ · break .70–.82','var(--muted)','middle',10);
    return svg+'</svg>';
  }
  function mount(root,key='one',options={}){
    for(const instance of instances)if(!instance.root.isConnected||instance.root===root)instance.destroy();
    window.DynamicMatching?.release(root);window.LCAMatching?.release(root);window.LocalMatching?.release(root);window.MPCMatching?.release(root);window.ListQueryMatching?.release(root);
    const signal=new AbortController(),prefix='streaming-'+(++serial);let graph=key==='bipartite'?'bipartite':'general',publication=options.publication||'all';
    const opts=()=>({graph,publication,selected});
    let selected=endpoints(records({graph,publication}),key==='one'?1:2)[key==='one'?'b':'a'].id;
    root.classList.remove('query-list-view','mpc-view','dynamic-view','lca-view','local-view');root.classList.add('focus-view','streaming-view');root.classList.toggle('f-embedded',!!options.embedded);root.setAttribute('aria-label','Shared one-pass and two-pass streaming matching landscape');
    root.innerHTML=`<p class="f-kicker">MATCHING × STREAMING / ONE SHARED FIGURE</p><header class="f-hero"><div><h1>One stream. One or two passes.</h1><p>Compare every recorded algorithm and lower bound on the same approximation scale.</p></div><div class="f-seal"><strong>Fixed semi-streaming memory</strong>Primary sources · ${esc(collection.one.reviewedOn)}</div></header><div class="f-scope"><span><b>Graph</b> <span class="s-graph-description">general, unweighted</span></span><span><b>Stream</b> insertion-only, arbitrary order</span><span><b>Memory</b> O(n polylog n) bits</span><span><b>Output</b> matching edges</span></div>
      <section class="s-landscape" aria-labelledby="${prefix}-map"><div class="s-toolbar"><div class="s-graph-control" aria-label="Graph class"><button type="button" data-streaming-graph="general">General graphs</button><button type="button" data-streaming-graph="bipartite">Bipartite graphs</button></div><label class="s-publication-control">Sources <select class="s-publication-select" aria-label="Streaming publication filter"><option value="all">All verified sources</option><option value="published">Published only</option></select></label></div><div class="s-legend" id="${prefix}-map"><span><i class="s-key-algorithm"></i>Algorithm guarantee</span><span><i class="s-key-barrier"></i>Lower-bound ceiling</span><span><i class="s-key-open"></i>Limiting guarantee</span><span class="s-direction">Better → &nbsp; Fewer passes ↓</span></div><div class="s-plot-scroll" tabindex="0" aria-label="Shared streaming figure; scroll horizontally on narrow screens"><div class="s-plot-host"></div></div><div class="s-chart-notes"><span><b>Discrete pass budgets.</b> Two passes are above; one pass is below. Every theorem marker lies on its exact pass-budget lane.</span><span><b>Hollow circles are limits.</b> Red diamonds exclude every fixed β strictly above the threshold. No equality impossibility is claimed.</span><span>The β-axis enlarges 0.48–0.70 and omits 0.70–0.82. Each ε is fixed independently of n. One-pass lower bounds also hold for bipartite graphs. Click a paper for its exact assumptions.</span></div><div class="s-comparison"></div><div class="s-specials"></div></section><section class="s-theorem" id="${prefix}-theorem" aria-label="Selected streaming theorem" aria-live="polite"></section><details class="s-evidence"><summary>All recorded results &amp; exact statements</summary><div class="s-evidence-list"></div></details><div class="f-bottom"><span>β = |M| / OPT · a larger retained fraction is better.</span><span>Algorithm scopes, publication dates and randomized guarantees remain in the source details.</span></div>`;
    function detail(){
      const all=[...records(opts()),...related(opts())],r=all.find(r=>r.id===selected);if(!r)return;
      const siblings=r.passes?all.filter(v=>v.passes===r.passes&&v.kind===r.kind&&Math.abs(v.ratio-r.ratio)<1e-9):[r],algorithm=r.kind==='algorithm';
      root.querySelector('.s-theorem').innerHTML=`<div class="s-theorem-top"><span class="s-type ${algorithm?'':'s-lower-type'}">${algorithm?'Algorithm guarantee':r.kind==='restricted_barrier'?'Restricted-class lower bound':'Lower-bound theorem'}</span><strong>${esc(r.rowName||r.authors)}</strong><span>${esc(r.dateLabel||r.year)}</span></div>${siblings.length>1?`<div class="s-coincident"><span>Same pass budget and approximation:</span>${siblings.map(s=>`<button type="button" data-streaming-result="${esc(s.id)}" aria-pressed="${s.id===selected}">${esc(label(s))}</button>`).join('')}</div>`:''}<div class="s-detail-grid"><div><span>Guarantee / threshold</span><strong>${esc(r.formula||'See theorem')}</strong></div><div><span>Setting</span><strong>${r.passes?(r.passes===1?'1 pass':'At most 2 passes')+' · '+(graph==='bipartite'?'bipartite':'general')+' graphs':'Separate theorem scope; see assumptions'}</strong></div><div><span>Source status</span><strong>${r.publicationStatus==='preprint'?'Preprint':'Published'}${r.ratioIsLimit?' · limiting ratio':''}</strong></div></div><p>${esc(r.statement)}</p><details class="s-theorem-more"><summary>Read assumptions &amp; source</summary><h3>${esc(r.title)}</h3><p>${esc(r.authors)}</p><p>${esc(r.notes)}</p><p>${source(r)} · ${esc(r.sourceLocation)}</p></details>`;
    }
    function render(){
      const rows=records(opts()),others=related(opts()),all=[...rows,...others];if(!all.some(r=>r.id===selected))selected=endpoints(rows,2).a.id;
      root.querySelector('.s-plot-host').innerHTML=diagramSVG(opts());
      root.querySelector('.s-graph-description').textContent=graph+', unweighted';
      root.querySelector('.s-publication-select').value=publication;
      root.querySelectorAll('[data-streaming-graph]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.streamingGraph===graph)));
      const one=endpoints(rows,1),two=endpoints(rows,2),tight=Math.abs(one.a.ratio-one.b.ratio)<1e-9;
      root.querySelector('.s-comparison').innerHTML=`<div><span>ONE PASS</span><strong>${tight?'½ is optimal for constant factors.':'½ is attained; the published ceiling is ≈0.5585.'}</strong><p>${tight?'The July 2026 preprint excludes every fixed improvement.':'The publication filter leaves an unresolved interval above ½.'}</p></div><div><span>TWO PASSES</span><strong>2 − √2 − ε is achievable; above 8/9 is impossible.</strong><p>The interval from the limiting 0.5858 guarantee to the 8/9 ceiling remains open.</p></div>`;
      const restricted=others.find(r=>r.kind==='restricted_barrier'),symbolic=others.filter(r=>r.id!==restricted?.id);
      root.querySelector('.s-specials').innerHTML=`${restricted?`<div class="s-special s-restricted"><span>GREEDY-FIRST CLASS ONLY</span><strong>A separate 2/3 ceiling</strong><p>Applies when pass one retains only a maximal matching. It is not a ceiling for arbitrary two-pass algorithms.</p><button type="button" data-streaming-result="${esc(restricted.id)}">Inspect restricted theorem ↗</button></div>`:''}${symbolic.length?`<details class="s-related"><summary>Additional bounds with different assumptions</summary><div>${symbolic.map(r=>`<button type="button" data-streaming-result="${esc(r.id)}" class="${r.kind==='algorithm'?'s-related-algorithm':''}"><strong>${esc(r.title)}</strong><span>${esc(r.formula||r.statement)}</span></button>`).join('')}</div></details>`:''}`;
      root.querySelector('.s-evidence-list').innerHTML=rows.map(r=>`<button type="button" data-streaming-result="${esc(r.id)}" class="${r.kind==='barrier'?'s-lower-evidence':''}"><span>${r.passes===1?'1 pass':'≤2 passes'} · ${esc(label(r))} · ${r.publicationStatus==='preprint'?'preprint':'published'}</span><strong>${esc(r.formula)}</strong><small>${esc(r.rowName||r.authors)}</small></button>`).join('');detail();
    }
    const select=id=>{selected=id;render()};
    root.addEventListener('click',e=>{const result=e.target.closest('[data-streaming-result]');if(result){select(result.dataset.streamingResult);return}const tab=e.target.closest('[data-streaming-graph]');if(tab){graph=tab.dataset.streamingGraph;render();options.onGraphChange?.(graph)}},{signal:signal.signal});
    root.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const result=e.target.closest('.s-plot-result');if(result){e.preventDefault();select(result.dataset.streamingResult)}},{signal:signal.signal});
    root.addEventListener('change',e=>{if(e.target.classList.contains('s-publication-select')){publication=e.target.value;render();options.onPublicationChange?.(publication)}},{signal:signal.signal});
    render();const instance={root,get settingKey(){return graph==='bipartite'?'bipartite':'one'},redraw:render,destroy(){signal.abort();instances.delete(instance)}};instances.add(instance);return instance;
  }
  window.StreamingMatching={mount,summarySVG,diagramSVG,records,release(root){for(const instance of instances)if(!instance.root.isConnected||instance.root===root)instance.destroy()}};
})();
