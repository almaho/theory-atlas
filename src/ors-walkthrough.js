/* UI for the sourced, replayable ORS paper walkthrough. */
(()=>{
  'use strict';
  const api=window.ORSWalkthrough,el=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pos=v=>[48+(v%8)*72,v<8?80:250];
  const edgeEnds=e=>String(e).split('-').map(Number);
  function edgePath(e){const [a,b]=edgeEnds(e),[x,y]=pos(a),[xx,yy]=pos(b);return y===yy?`M${x} ${y}Q${(x+xx)/2} ${y+(y<150?-1:1)*(26+Math.abs(a-b)*8)} ${xx} ${yy}`:`M${x} ${y}L${xx} ${yy}`;}
  function mini(edges=[],vertices=[],matching=[]){
    const selected=new Set(vertices),highlight=new Set(matching);
    return `<svg viewBox="0 0 600 330" role="img" aria-label="${edges.length} edges; ${vertices.length} highlighted vertices">${edges.map(e=>`<path d="${edgePath(e)}" stroke="${highlight.has(e)?'var(--green)':'var(--ink)'}" stroke-width="${highlight.has(e)?8:5}" fill="none"/>`).join('')}${Array.from({length:16},(_,v)=>{const [x,y]=pos(v);return `<circle cx="${x}" cy="${y}" r="${selected.has(v)?12:7}" fill="${selected.has(v)?'var(--green)':'var(--muted)'}" opacity="${vertices.length&&!selected.has(v)?.25:1}"/>`;}).join('')}${!edges.length&&!vertices.length?'<text x="300" y="175" text-anchor="middle" font-size="74" fill="var(--muted)">∅</text>':''}</svg>`;
  }
  let chapter='dynamic',seed=api.DEFAULT_SEED??19,frames=[],index=0,timer=null,layer='graph';
  const hash=location.hash.slice(1).split('/');
  if(hash[0]==='sampling')chapter='sampling';
  if(hash[1]&&Number.isFinite(+hash[1]))seed=(+hash[1])>>>0;
  const initialStep=Number.isInteger(+hash[2])?Math.max(0,+hash[2]):0;
  const graph=el('walk-graph');
  graph.innerHTML='<svg viewBox="0 0 600 330" role="img" aria-label="Input graph"><g class="walk-edges">'+Array.from({length:16},(_,a)=>Array.from({length:15-a},(_,i)=>{const b=a+i+1;return `<path class="walk-edge" data-edge="${a}-${b}" d="${edgePath(`${a}-${b}`)}" fill="none" opacity="0"/>`;}).join('')).join('')+'</g><g class="walk-nodes">'+Array.from({length:16},(_,v)=>{const [x,y]=pos(v);return `<g data-vertex="${v}" class="walk-node"><rect class="sampled" x="${x-22}" y="${y-22}" width="44" height="44" rx="4" fill="none" stroke="var(--ink)" stroke-width="1.6" opacity="0"/><circle class="active" cx="${x}" cy="${y}" r="26" fill="none" stroke="var(--ink)" stroke-width="2" opacity="0"/><circle class="vertex" cx="${x}" cy="${y}" r="19" fill="var(--surface)" stroke="var(--ink)" stroke-width="1.4"/><text x="${x}" y="${y+7}" text-anchor="middle">${v}</text></g>`;}).join('')+'</g></svg>';
  const edgeElements=[...graph.querySelectorAll('[data-edge]')],nodeElements=[...graph.querySelectorAll('[data-vertex]')];
  function stop(){clearTimeout(timer);timer=null;el('walk-play').textContent='▶ Play';el('walk-play').setAttribute('aria-pressed','false');}
  function schedule(){timer=setTimeout(()=>{if(index>=frames.length-1){stop();return;}index++;render();schedule();},+el('walk-speed').value);}
  function play(){if(timer){stop();return;}if(index>=frames.length-1)index=0;el('walk-play').textContent='Ⅱ Pause';el('walk-play').setAttribute('aria-pressed','true');render();schedule();}
  function load(step=0){
    stop();layer='graph';frames=chapter==='dynamic'?api.dynamicTrace():api.samplingTrace(seed);index=Math.min(step,frames.length-1);
    document.querySelectorAll('[data-chapter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.chapter===chapter)));
    el('walk-scope').textContent=chapter==='dynamic'?'Undirected graph · Exact update bookkeeping. MatchAndCertify is a contract demonstration with toy solver outputs; open Sampling to run the sampling procedure.':'RandomSampling · Watch uniform draws, adjacency queries, and the shrinking available set. Replay keeps the seed; a new run changes the draws.';
    el('walk-new-sample').hidden=chapter!=='sampling';
    el('walk-pair-legend').textContent=chapter==='sampling'?'Queried pair (dashed if absent)':'Deleted edge';
    el('walk-scrub').max=frames.length-1;
    el('walk-jump').innerHTML=frames.map((f,i)=>`<option value="${i}">${i+1}. ${esc(f.title)}</option>`).join('');render();
  }
  function setCards(f){
    const dynamic=[['matching','M_G',f.matching,[],'The maintained output matching.'],['add','G_add',f.add,[],'Edges inserted in this phase.'],['deleted','G_del',f.deleted,[],'Deletion records; filter stale edges.'],['cert','H_cert',f.cert,[],'Stored certificates, including stale edges.']];
    const sampling=[['available','U′',[],f.available,'Vertices still available to match.'],['samples','S',[],f.samples,'Uniformly sampled candidates.'],['matching','M_i',f.matching,[],'Matching in the current round.'],['pastMatching','Earlier rounds',f.pastMatching||[],[],'Kept visible; not the returned M_i.']];
    el('walk-sets').innerHTML=(chapter==='dynamic'?dynamic:sampling).map(([key,name,edges,vs,description])=>`<button type="button" class="walk-set" data-layer="${key}" aria-pressed="${layer===key}"><span class="walk-set-top"><span>${esc(name)}</span><span>${edges.length||vs.length} ${key==='available'||key==='samples'?'vertices':'edges'}</span></span>${mini(edges,vs,key==='matching'?edges:[])}<small>${description}</small></button>`).join('');
  }
  function renderBox(f){
    const box=f.box;
    if(chapter==='sampling'){
      const isResult=f.kind==='result', noResult=f.kind==='no-return';
      el('walk-blackbox').innerHTML=`<p class="walk-eyebrow">RETURN TO THE CALLER</p><div class="walk-box-flow"><div><p class="walk-port">INPUT · G[U], δ = ¼</p>${mini(f.edges,[],[])}</div><span class="walk-flow-arrow" aria-hidden="true">→</span><div class="walk-box ${isResult?'active':''}"><h3>RandomSampling</h3><a href="https://arxiv.org/html/2404.06069v4#S4.SS1.pic1.tab1" target="_blank" rel="noopener noreferrer">Behnezhad–Ghafari · Algorithm 1 ↗</a><span>This procedure is executed above.</span></div><span class="walk-flow-arrow" aria-hidden="true">→</span><div><p class="walk-port">${isResult?'OUTPUT':noResult?'NO OUTPUT':'IN PROGRESS'} · M_i</p>${mini(f.matching,[],f.matching)}</div></div><p>The caller can retain a sampled matching as a certificate after choosing the smallest-density call and removing edges already in the sparse input. That selection is part of MatchAndCertify.</p>`;return;
    }
    const dense=f.dense||f.edges.filter(e=>!f.add.includes(e));
    const sparse=f.sparse||[...new Set([...f.add,...f.cert])].filter(e=>!f.deleted.includes(e));
    const out=f.outputMatching||box?.outputEdges||[],cert=f.outputCertificate||box?.certificateEdges||[];
    el('walk-blackbox').innerHTML=`<p class="walk-eyebrow">${box?'SUBROUTINE CONTRACT':'AT THE NEXT REFRESH'}</p><div class="walk-box-flow"><div><p class="walk-port">INPUT · Dense + sparse access</p>${mini([...new Set([...dense,...sparse])])}<p class="walk-port-value">E_dense = G ∖ G_add (${dense.length} edges)<br>E_sparse = (G_add ∪ H_cert) ∖ G_del (${sparse.length} edges)</p></div><span class="walk-flow-arrow" aria-hidden="true">→</span><div class="walk-box ${box?'active':''}"><h3>MatchAndCertify</h3><a href="https://arxiv.org/html/2404.06069v4#Thmlemma6" target="_blank" rel="noopener noreferrer">Behnezhad–Ghafari · Lemma 6 ↗</a><span>Illustrated contract · toy exact solver</span></div><span class="walk-flow-arrow" aria-hidden="true">→</span><div><p class="walk-port">OUTPUT · M and certificate M_C</p><div class="walk-output-pair"><div><span>M</span>${mini(out,[],out)}</div><div><span>M_C</span>${mini(cert,[],cert)}</div></div><p class="walk-port-value">${box?`${out.length} matching edges · ${cert.length} certificate edges`:'Waiting for a refresh.'}<br>M replaces M_G; M_C joins H_cert.</p></div></div><p>${box?esc(box.output||box.input||'The two outputs have different jobs: answer the matching query and remember useful edges.'):'The stored sets determine the next call. The same graph can be exposed through two access interfaces.'}</p>`;
  }
  function render(){
    const f=frames[index],E=new Set(f.edges),M=new Set(f.matching),P=new Set(f.pastMatching||[]),A=new Set(f.available||[]),S=new Set(f.samples||[]),D=new Set(f.deleted||[]),Q=new Set(f.queryEdges||[]);
    let selectedEdges=null,selectedVertices=null;
    if(layer==='available'||layer==='samples')selectedVertices=new Set(f[layer]||[]);else if(layer!=='graph')selectedEdges=new Set(f[layer]||[]);
    edgeElements.forEach(p=>{const edge=p.dataset.edge,active=edge===f.activeEdge,shown=E.has(edge)||active||Q.has(edge)||(layer==='deleted'&&D.has(edge))||(layer==='cert'&&(f.cert||[]).includes(edge));
      const [a,b]=edgeEnds(edge);let opacity=shown?1:0;
      if(shown&&selectedEdges&&!selectedEdges.has(edge))opacity=.08;
      if(shown&&selectedVertices&&(!selectedVertices.has(a)||!selectedVertices.has(b)))opacity=.08;
      p.style.opacity=opacity;p.style.stroke=M.has(edge)?'var(--green)':(active||Q.has(edge))?'var(--ink)':'var(--muted)';p.style.strokeWidth=M.has(edge)?5:(active||Q.has(edge))?2.4:1.5;
      p.style.strokeDasharray=!E.has(edge)||P.has(edge)?'6 5':'';p.classList.toggle('walk-query',chapter==='sampling'&&Q.has(edge)&&!E.has(edge));
    });
    nodeElements.forEach(g=>{const v=+g.dataset.vertex,matched=[...M].some(e=>edgeEnds(e).includes(v));g.style.opacity=selectedVertices?(selectedVertices.has(v)?1:.22):(chapter==='sampling'&&!A.has(v)&&!matched?.35:1);g.querySelector('.sampled').style.opacity=S.has(v)?1:0;g.querySelector('.active').style.opacity=f.activeVertex===v?1:0;g.querySelector('.vertex').style.stroke=matched?'var(--green)':'var(--ink)';g.querySelector('.vertex').style.fill=matched?'var(--green-fill)':'var(--surface)';});
    graph.querySelector('svg').setAttribute('aria-label',`${f.title}. Graph has ${f.edges.length} edges. Matching has ${f.matching.length} edges.`);
    const names={graph:'Input graph G',matching:chapter==='dynamic'?'Output matching M_G':'Current round M_i',add:'Inserted edges G_add',deleted:'Deletion records G_del',cert:'Stored certificates H_cert',available:'Available vertices U′',samples:'Sampled candidates S',pastMatching:'Matchings from earlier rounds'};
    el('walk-graph-title').textContent=names[layer];el('walk-show-all').hidden=layer==='graph';
    el('walk-count').textContent=`Step ${index+1} / ${frames.length}`;el('walk-scrub').value=index;el('walk-jump').value=index;
    el('walk-back').disabled=index===0;el('walk-next').disabled=index===frames.length-1;
    el('walk-step-kind').textContent=chapter==='dynamic'?'DYNAMIC UPDATE':'RANDOM SAMPLING';
    el('walk-step-title').textContent=f.title;el('walk-step-description').textContent=f.description;
    el('walk-step-source').textContent=f.source.label+' ↗';el('walk-step-source').href=f.source.url;
    el('walk-counters').innerHTML=Object.entries(f.counters||{}).filter(([k])=>k!=='seed').map(([k,v])=>`<span>${esc(k.replace(/([a-z])([A-Z])/g,'$1 $2').replaceAll('_',' '))}: <b>${esc(v)}</b></span>`).join('')+(chapter==='sampling'?`<span>seed: <b>${seed}</b></span>`:'');
    el('walk-samples').innerHTML=chapter==='sampling'?`<p class="walk-sample-label">${f.activeVertex!=null?`Querying vertex ${f.activeVertex} · `:''}S = {${(f.samples||[]).map(v=>v).join(', ')}}</p><div class="walk-chips">${(f.samples||[]).map(v=>`<span>${v}</span>`).join('')}</div>`:'';
    setCards(f);renderBox(f);el('walk-live').textContent=`Step ${index+1}. ${f.title}. ${f.description}`;
    document.querySelector('.walk-player').dataset.step=index;document.querySelector('.walk-player').dataset.chapter=chapter;
    history.replaceState(null,'',`#${chapter}/${seed}/${index}`);
  }
  el('walk-play').addEventListener('click',play);
  el('walk-next').addEventListener('click',()=>{stop();index=Math.min(index+1,frames.length-1);render();});
  el('walk-back').addEventListener('click',()=>{stop();index=Math.max(index-1,0);render();});
  el('walk-replay').addEventListener('click',()=>{stop();index=0;render();play();});
  el('walk-speed').addEventListener('change',()=>{if(timer){stop();play();}});
  el('walk-scrub').addEventListener('input',e=>{stop();index=+e.target.value;render();});
  el('walk-jump').addEventListener('change',e=>{stop();index=+e.target.value;render();});
  el('walk-new-sample').addEventListener('click',()=>{seed=(seed+1)>>>0;load();});
  el('walk-sets').addEventListener('click',e=>{const b=e.target.closest('[data-layer]');if(b){layer=layer===b.dataset.layer?'graph':b.dataset.layer;render();}});
  el('walk-show-all').addEventListener('click',()=>{layer='graph';render();});
  document.querySelectorAll('[data-chapter]').forEach(b=>b.addEventListener('click',()=>{chapter=b.dataset.chapter;load();}));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  load(initialStep);
})();
