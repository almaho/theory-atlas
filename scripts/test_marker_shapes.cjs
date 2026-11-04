/* A setup keeps its symbol across bound kinds, filters, and semantic zoom. */
const fs=require('node:fs'),path=require('node:path'),vm=require('./atlas-test-vm.cjs'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
const data=JSON.parse(html.match(/<script id="atlas-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const c={window:{},document:{getElementById:id=>id==='atlas-data'?{textContent:JSON.stringify(data)}:null},AbortController,Set};
vm.createContext(c);
for(const name of ['dynamic.js','streaming.js','lca.js','local.js','mpc.js','query-list.js',...new Set(data.focusPairs.map(p=>p.javascript)),'cc-comparison.js'])vm.runInContext(fs.readFileSync(path.join(root,'src',name),'utf8'),c);
vm.runInContext(fs.readFileSync(path.join(root,'src/focus.js'),'utf8').split('  const featured=')[0]+'})();',c);
const symbols=c.window.AtlasSymbols,api=c.window.AtlasFocus;
const attributes=s=>Object.fromEntries([...s.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
const symbolTags=svg=>[...svg.matchAll(/<path\b[^>]*class="atlas-bound-symbol"[^>]*>/g)].map(m=>attributes(m[0]));
assert.equal(new Set(symbols.shapes.map(s=>symbols.path(10,10,4,s))).size,7,'Every setup shape has a distinct outline');
for(const shape of symbols.shapes)for(const kind of ['upper','lower','barrier','conditional_barrier']){
 const a=attributes(symbols.mark(10/3,20/7,4,shape,kind,'',{conditional:kind==='conditional_barrier'}));
 const color=kind==='upper'?'var(--green)':'var(--red)';
 assert.equal(a.stroke,color);assert.equal(a.fill,kind==='conditional_barrier'?'none':color);
 assert.equal(+a['data-center-x'],10/3,'Coordinate metadata retains exact precision');
 assert.equal(a['data-setup-shape'],shape);
}
const visibleRoutes=api.settings(),nativeShapeRoutes=new Set(['edge-lca','edge-query_matrix','edge-query_list','vertex-query_matrix','vertex-query_list']);
assert.equal(visibleRoutes.length,61,'The current visible atlas has 61 figure routes after hiding Online');
assert(!visibleRoutes.some(route=>route.model==='online'||route.model==='query_combined'),'Archived models have no visible shape routes');
let checked=0,shapeRoutes=0;const nativeRoutesSeen=[];
for(const route of visibleRoutes){
 const sizes=[[180,110],[330,245],[738,548]],seen=sizes.map(([w,h])=>symbolTags(api.summarySVG(route.key,w,h)));
 if(seen.some(a=>a.length))shapeRoutes++;else nativeRoutesSeen.push(route.key);
 for(const rows of seen)for(const a of rows){
  assert(symbols.shapes.includes(a['data-setup-shape']),route.key);
  assert.equal(a.stroke,a['data-marker']==='lower'?'var(--red)':'var(--green)',route.key+': bound paint must not come from setup accents');
  assert.equal(a.fill,a['data-open-marker']?'none':a.stroke);checked++;
 }
}
assert.deepEqual(nativeRoutesSeen.sort(),[...nativeShapeRoutes].sort(),'Only the five reviewed native-symbol routes omit the shared marker primitive');
assert.equal(shapeRoutes,56,'All 56 remaining visible figure routes use the shared shape encoding');
const archivedOnlineRenderer=c.window.AtlasPairRenderers['maximum_is-online'];
assert(archivedOnlineRenderer&&typeof archivedOnlineRenderer.summarySVG==='function','Archived Online renderer remains available for regression checks');
function shapesFor(key,id){
 return [180,330,738].map(w=>{
  // Exercise archived evidence directly; hidden keys must not fall through the
  // public coordinator to an unrelated visible setting.
  const renderer=key==='maximum_is-online'?archivedOnlineRenderer:api;
  const svg=renderer.summarySVG(key,w,w===180?110:w===330?245:548);
  const groups=[...svg.matchAll(/<g\b[^>]*data-[\w-]*result="[^"]+"[^>]*>[\s\S]*?<\/g>/g)].map(m=>m[0]).filter(s=>s.includes('result="'+id+'"'));
  return new Set(groups.flatMap(symbolTags).map(a=>a['data-setup-shape']));
 });
}
for(const [key,id,shape]of [
 ['lca','lca-abgs25-nonadaptive-lower','square'],
 ['mis-lca','mis-lca-ghaffari-polydeg','circle'],
 ['maximum_is-local','maximum-is-local-path-lower','triangle'],
 ['maximum_is-local','maximum-is-local-chordal-upper','square'],
 ['maximum_is-online','mis-online-zeta-upper','circle'],
 ['maximum_is-online','mis-online-zeta-det-lower','circle'],
 ['vertex-stochastic','vertex-stochastic-hardness','circle']
]){
 const found=shapesFor(key,id);assert(found.some(s=>s.size),id+': marker remains present');
 for(const seen of found)for(const actual of seen)assert.equal(actual,shape,id+': stable setup identity across zoom');
}
assert(fs.readFileSync(path.join(root,'src/figure-first.js'),'utf8').includes('svg:not([aria-hidden="true"])'),'Legend icons cannot replace the first bounds figure');
assert(!data.focus['vertex-stochastic'].verifiedRecords.some(r=>r.markerLabel.includes('Uniformly random')));
assert(!data.focus['cc-stochastic'].verifiedRecords.some(r=>r.markerLabel.includes('faulty')));
console.log('Setup shapes PASS: '+shapeRoutes+' routes, '+checked+' semantic marks, exact metadata, distinct outlines, stable setup identity, and legend/figure separation.');
