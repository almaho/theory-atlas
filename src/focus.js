(()=>{
  'use strict';
  const pairManifest=JSON.parse(document.getElementById('atlas-data').textContent).focusPairs||[];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const legacySettings=[
    {key:'one',sliceId:'matching-stream-singlepass-insertion-explicit',label:'Streaming · 1 + 2 passes',note:'01',type:'streaming',graph:'unweighted, general'},
    {key:'two',sliceId:'matching-stream-twopass-general',label:'Streaming · 1 + 2 passes',hidden:true,type:'streaming',graph:'unweighted, general'},
    {key:'bipartite',sliceId:'matching-stream-twopass-bipartite-lower',label:'Streaming · bipartite',note:'02',type:'streaming',graph:'unweighted, bipartite'},
    {key:'dynamic-edges',sliceId:'matching-dynamic-frontier',label:'Dynamic · edges',note:'03',type:'dynamic',graph:'unweighted, general'},
    {key:'dynamic-size',sliceId:'matching-dynamic-value-polylog',label:'Dynamic · size',note:'04',type:'dynamic',graph:'unweighted, general'},
    {key:'lca',sliceId:'matching-lca-bounded-degree-nearopt',label:'LCA · matching',note:'05',type:'lca',graph:'unweighted, general'},
    {key:'lca-nonadaptive',sliceId:'matching-lca-nonadaptive-constant',label:'LCA · matching',hidden:true,type:'lca',graph:'unweighted, general'},
    {key:'lca-adaptive',sliceId:'matching-lca-adaptive-constant',label:'LCA · matching',hidden:true,type:'lca',graph:'unweighted, general'},
    {key:'lca-maximal',sliceId:'matching-lca-bounded-degree-maximal',label:'LCA · matching',hidden:true,type:'lca',graph:'unweighted, general'},
    {key:'local',sliceId:'matching-local-maximal',label:'LOCAL · matching',note:'06',type:'local',graph:'general'},
    {key:'local-weighted',sliceId:'matching-local-weighted-approx',label:'LOCAL · matching',hidden:true,type:'local',graph:'weighted, general'},
    {key:'local-congest',sliceId:'matching-local-congest-weighted',label:'LOCAL · matching',hidden:true,type:'local',graph:'weighted, CONGEST'},
    {key:'mpc',sliceId:'matching-mpc-nearlinear-memory',label:'MPC · matching',note:'07',type:'mpc',graph:'general'},
    {key:'mpc-weighted',sliceId:'matching-mpc-bmatching',label:'MPC · matching',hidden:true,type:'mpc',graph:'weighted, general'},
    {key:'mpc-sublinear',sliceId:'matching-mpc-sublinear-maximal',label:'MPC · matching',hidden:true,type:'mpc',graph:'general and restricted graph classes'},
    {key:'mpc-mild',sliceId:'matching-mpc-mildly-sublinear-maximal',label:'MPC · matching',hidden:true,type:'mpc',graph:'general, mildly sublinear memory'},
    {key:'query-list',sliceId:'matching-query-list-value-multiplicative',label:'Adjacency list · matching size',note:'08',type:'query_list',graph:'general, global size estimate'},
    {key:'query-list-additive',sliceId:'matching-query-list-additive-lb',label:'Adjacency list · matching size',hidden:true,type:'query_list',graph:'general, additive error'},
    {key:'query-list-nonadaptive',sliceId:'matching-query-list-nonadaptive',label:'Adjacency list · matching size',hidden:true,type:'query_list',graph:'simple-graph upper and multigraph lower'},
    {key:'query-list-bipartite',sliceId:'matching-query-list-bipartite-superlinear',label:'Adjacency list · matching size',hidden:true,type:'query_list',graph:'bipartite'},
    {key:'query-list-mixed',sliceId:'matching-query-list-mixed-value',label:'Adjacency list · matching size',hidden:true,type:'query_list',graph:'general, mixed additive error'}
  ];
  const settings=legacySettings.map(s=>({...s,problem:'matching',model:s.type==='streaming'?'stream':s.type})).concat(pairManifest.flatMap(pair=>pair.routes.map(route=>({...route,pairId:pair.id,hidden:!route.visible}))));
  const pairAliases=Object.assign({},...pairManifest.map(p=>p.canonicalAliases||{}));
  const pairFor=key=>pairManifest.find(p=>p.id===settingFor(key).pairId);
  const settingFor=key=>settings.find(s=>s.key===key)||settings[0];
  const canonicalKey=key=>settings.some(s=>s.key===key&&s.pairId)?pairAliases[key]||key:(key==='two'?'one':key?.startsWith('lca')?'lca':key?.startsWith('local')?'local':key?.startsWith('mpc')?'mpc':key?.startsWith('query-list')?'query-list':key);
  const rendererFor=key=>settingFor(key).pairId?window.AtlasPairRenderers?.[settingFor(key).pairId]:({dynamic:window.DynamicMatching,streaming:window.StreamingMatching,lca:window.LCAMatching,local:window.LocalMatching,mpc:window.MPCMatching,query_list:window.ListQueryMatching})[settingFor(key).type];
  const visibleSettings=()=>settings.filter(s=>!s.hidden);
  function mount(root,key='one',options={}){
    window.DynamicMatching?.release(root);window.StreamingMatching?.release(root);window.LCAMatching?.release(root);window.LocalMatching?.release(root);window.MPCMatching?.release(root);window.ListQueryMatching?.release(root);
    Object.values(window.AtlasPairRenderers||{}).forEach(renderer=>renderer.release?.(root));
    root.classList.remove('query-list-view','dynamic-view','streaming-view','lca-view','local-view','mpc-view');
    return rendererFor(key).mount(root,key,options);
  }
  function summarySVG(key,w,h,options={}){
    return rendererFor(key).summarySVG(key,w,h,options);
  }
  window.AtlasFocus={mount,summarySVG,canonicalKey,keyForSlice:id=>settings.find(s=>s.sliceId===id)?.key||null,settings:()=>visibleSettings().map(s=>({...s})),labelForKey:key=>settings.find(s=>s.key===canonicalKey(key))?.label||null,axisSummary:key=>{const s=settingFor(key),pair=pairFor(key);if(pair)return `X: ${pair.axisSummary.x}; Y: ${pair.axisSummary.y}${pair.axisSummary.note?'. '+pair.axisSummary.note:''}`;return s.type==='query_list'?'X: matching-size guarantee family (categorical); Y: total time upper bounds / query lower bounds (symbolic formulas). Adaptive general, bipartite and additive scopes remain distinct; non-adaptive simple-graph upper and multigraph lower bounds are explicitly separated.':s.type==='mpc'?'X: memory per machine (categorical regimes); Y: parallel communication rounds (symbolic formulas). Maximality, approximation and restricted graph classes are scoped separately; red lower bounds are conditional and component-stable.':s.type==='lca'?'X: matching guarantee (categorical); Y: probes per local output query (symbolic bound formulas). The lower panel fixes Δ and ε and shows n-dependence.':s.type==='local'?'X: deterministic or randomized LOCAL model (categorical); Y: communication rounds (symbolic bound formulas). Maximal matching and approximation have separate panels; CONGEST is separately scoped.':s.type==='dynamic'?`Shared two-dimensional landscape: guaranteed fraction β versus schematic n-based update time; ${key==='dynamic-size'?'size estimate':'matching edges'} on general unweighted graphs`:`Shared one-pass and two-pass landscape: guaranteed fraction β = |M| / OPT versus pass budget; ${s.graph}; arbitrary-order insertion-only streams and O(n polylog n) bits`}};
  const featured=document.getElementById('featured-settings');if(featured){featured.innerHTML='<details class="figure-picker"><summary>Jump to a focused figure</summary><div class="figure-picker-menu">'+visibleSettings().map(s=>`<button type="button" data-search-cell="${esc(s.problem)}:${esc(s.model)}" data-search-slice="${esc(s.sliceId)}">${esc(s.label)}</button>`).join('')+'</div></details>';featured.addEventListener?.('click',e=>{if(e.target.closest('button'))e.target.closest('details')?.removeAttribute('open')})}
  const root=document.getElementById('focus-view');let key=settings.find(s=>location.hash==='#focus-'+s.key)?.key||'query-list',instance;
  const picker=document.createElement('div');picker.className='f-settings';picker.setAttribute('aria-label','Explore problem and model settings');picker.innerHTML='<details class="figure-picker"><summary>Choose another figure</summary><div class="figure-picker-menu">'+visibleSettings().map(s=>`<button type="button" data-focus-setting="${esc(s.key)}">${esc(s.label)}</button>`).join('')+'</div></details><button type="button" data-open-atlas="true" class="f-atlas-jump">This setting in full atlas ↗</button>';root.before(picker);
  function syncKey(k){key=k;picker.querySelectorAll('[data-focus-setting]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.focusSetting===canonicalKey(key))));window.history.replaceState(null,'','#focus-'+key)}
  function setKey(k){syncKey(k);instance=mount(root,key,{onGraphChange:graph=>syncKey(graph==='bipartite'?'bipartite':'one'),onWeightingChange:weight=>syncKey(weight==='weighted'?'matching-online-weighted':'matching-online')})}
  picker.addEventListener('click',e=>{const b=e.target.closest('button');if(b?.dataset.focusSetting){setKey(b.dataset.focusSetting);b.closest('details')?.removeAttribute('open')}if(b?.dataset.openAtlas){switchView(true);window.dispatchEvent(new CustomEvent('atlas:open-setting',{detail:{sliceId:settingFor(key).sliceId}}))}});
  function switchView(atlas){document.getElementById('atlas').hidden=!atlas;root.hidden=atlas;picker.hidden=atlas;document.getElementById('show-atlas').setAttribute('aria-pressed',String(atlas));document.getElementById('show-focus').setAttribute('aria-pressed',String(!atlas));window.history.replaceState(null,'',atlas?'#atlas':'#focus-'+key);if(!atlas)instance.redraw();window.dispatchEvent(new Event('resize'))}
  window.addEventListener('hashchange',()=>{const hash=location.hash;if(hash==='#atlas'){switchView(true);return}const target=settings.find(s=>hash==='#focus-'+s.key);if(target){setKey(target.key);switchView(false)}});
  document.getElementById('show-focus').addEventListener('click',()=>switchView(false));document.querySelector('.atlas-brand').addEventListener('click',e=>{e.preventDefault();switchView(false)});document.getElementById('show-atlas').addEventListener('click',()=>switchView(true));const atlas=location.hash==='#atlas';setKey(key);switchView(atlas);
})();
