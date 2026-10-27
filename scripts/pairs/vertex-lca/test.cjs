'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const at=name=>path.join(__dirname,name),local=fs.existsSync(at('focus.json'));
const data=JSON.parse(fs.readFileSync(local?at('focus.json'):at('../../../data/focus/vertex-lca.json'),'utf8'));
const source=fs.readFileSync(local?at('renderer.js'):at('../../../src/vertex-lca.js'),'utf8');
const patch=JSON.parse(fs.readFileSync(at('research-patch.json'),'utf8')),reg=JSON.parse(fs.readFileSync(at('registration.json'),'utf8')),input=JSON.parse(fs.readFileSync(at('input-research.json'),'utf8'));
function load(d=data){const c={window:{},document:{getElementById(){return{textContent:JSON.stringify({focus:{'vertex-lca':d}})}}},AbortController,Set};vm.runInNewContext(source,c);return c.window.AtlasPairRenderers['vertex-lca'];}
const api=load(),rr=api.records(),mis=rr.find(r=>r.id==='vertex-lca-mis-reduction-2022'),avg=rr.find(r=>r.panel!=='main');
assert.equal(rr.length,4);assert.equal(api.records({scope:'main'}).length,3);assert.equal(api.records({scope:'related'}).length,1);assert.equal(data.relatedResults.length,1);
assert.deepEqual(rr.map(r=>r.id).sort(),input.slices.flatMap(s=>s.results.map(r=>r.id)).sort());
for(const original of input.slices){const next=patch.upsertSlices.find(s=>s.id===original.id);assert(next);assert.deepEqual(next.results.map(r=>r.id),original.results.map(r=>r.id));assert(next.results.every(r=>r.plot===null));assert(!('min' in next.yAxis));}
for(const r of data.verifiedRecords){assert(data.figureAxes[r.panel]);for(const [dim,f]of Object.entries(reg.pointFields))assert(data.figureAxes[r.panel][dim].categories.some(c=>c.id===r[f]));for(const q of r.guarantees)assert(data.figureAxes.main.x.categories.some(c=>c.id===q.costKey));}
for(const r of rr){assert.equal(r.kind,'upper');for(const field of ['quality','graph','output','probability','oracle','state','theorem','parameters'])assert(r[field],field);assert(r.sourceUrl.startsWith('https://'));}
assert.equal(mis.guarantees.length,2);assert(mis.adaptivity.includes('does not automatically'));assert(mis.reduction.some(s=>s.includes('maximum degree at most 2Δ')));assert(mis.reduction.some(s=>s.includes('log N=O(log n)')));
assert(data.verifiedRecords[2].bound.includes('Δ^{O(√Δ log^{5/2}Δ)} · log* n'));
assert(avg.queryQuantifier.includes('E_G[max_v E_r'));assert(avg.assumptions.some(s=>s.includes('2≤k≤n^{1/37}')));assert(avg.evidenceStatus.includes('unresolved'));assert(avg.notes.includes('not placed on the main'));assert(avg.probability.includes('Zero-error'));assert(avg.output.includes('FAIL'));assert(data.lowerBoundStatus.includes('do not transfer'));
// Check that the stated list-coloring MIS gadget, including same-vertex cliques,
// forces one color per vertex on a small nonregular input.
const graph=[[0,1],[1,2]],lists=[[0,1],[0,1,2],[1,2]],V=lists.flatMap((L,v)=>L.map(c=>({v,c})));
const adj=(a,b)=>a.v===b.v||a.c===b.c&&graph.some(([u,v])=>u===a.v&&v===b.v||u===b.v&&v===a.v);
let maximal=0;for(let mask=0;mask<(1<<V.length);mask++){const chosen=V.filter((_,i)=>mask&(1<<i));if(chosen.some((a,i)=>chosen.slice(i+1).some(b=>adj(a,b))))continue;if(V.some((a,i)=>!(mask&(1<<i))&&!chosen.some(b=>adj(a,b))))continue;maximal++;for(let v=0;v<3;v++)assert.equal(chosen.filter(a=>a.v===v).length,1);for(const [u,v]of graph)assert.notEqual(chosen.find(a=>a.v===u).c,chosen.find(a=>a.v===v).c);}assert(maximal>0);
for(const [w,h]of [[120,90],[110,280],[450,90],[240,160],[330,220],[330,245],[500,260],[738,548],[1000,660]]){
 const s=api.summarySVG('vertex-lca',w,h),g=api.layoutGeometry(w,h);
 assert(!/NaN|Infinity|undefined/.test(s));assert.equal((s.match(/data-vlca-guarantee=/g)||[]).length,4);assert.equal((s.match(/data-related="true"/g)||[]).length,1);assert(!s.includes('data-kind="lower"'));assert(!s.includes('data-frontier'));
 for(const p of g.points)assert(p.x>g.left&&p.x<g.right&&p.y>g.top&&p.y<g.bottom);
 if(w<300||h<230)assert(!/<text/.test(s));else{assert(s.includes('data-axis="x"'));assert(s.includes('data-axis="y"'));assert(s.includes('probe unit unresolved'));assert(s.includes('log* n'));if(w>=650&&h>=480)assert(s.includes('baseline-shift="super"'));}
}
assert(!/<text/.test(api.summarySVG('vertex-lca',738,548,{level:'overview'})));assert(api.summarySVG('vertex-lca',330,245,{level:'detail'}).includes('data-detail-level="compact"'));
assert.equal(api.diagramSVG({publication:'all'}),api.diagramSVG('vertex-lca',{publication:'all'}));assert.equal((api.diagramSVG().match(/role="button"/g)||[]).length,5);
assert.equal((api.summarySVG('vertex-lca',160,90,{scope:'related'}).match(/data-vlca-guarantee=/g)||[]).length,0);
const changed=JSON.parse(JSON.stringify(data));changed.sources[avg.sourceId].publicationStatus='preprint';let filtered=load(changed);assert.equal(filtered.records({publication:'published'}).length,3);assert(!filtered.diagramSVG({publication:'published'}).includes('data-related="true"'));
for(const p of Object.values(changed.sources))p.publicationStatus='preprint';filtered=load(changed);assert.equal(filtered.records({publication:'published'}).length,0);assert(filtered.diagramSVG({publication:'published'}).includes('No sources'));assert(!/<text/.test(filtered.summarySVG('vertex-lca',160,90,{publication:'published'})));
function host(){const classes=new Set(),children=new Map(),listeners={};return{isConnected:true,innerHTML:'',classList:{add(...s){s.forEach(v=>classes.add(v))},remove(...s){s.forEach(v=>classes.delete(v))},toggle(v,on){on?classes.add(v):classes.delete(v)}},setAttribute(){},querySelector(s){if(!children.has(s))children.set(s,{innerHTML:'',value:''});return children.get(s)},addEventListener(t,f,o){listeners[t]={fn:f,signal:o.signal}},classes,listeners};}
const root=host();let chosen=null;api.mount(root,'vertex-lca',{onPublicationChange:v=>chosen=v});const detail=()=>root.querySelector('.vlca-theorem').innerHTML;
assert(detail().includes('Theorem 1.3'));
root.listeners.click.fn({target:{closest(){return{dataset:{vlcaResult:mis.id,vlcaGuarantee:'expected'}}}}});assert(detail().includes('Expected · fixed v'));assert(detail().includes('Coloring-to-MIS reduction'));assert(detail().includes('does not automatically'));
let prevented=false;root.listeners.keydown.fn({key:'Enter',preventDefault(){prevented=true},target:{closest(){return{dataset:{vlcaResult:avg.id}}}}});assert(prevented);assert(detail().includes('Access-model qualification'));assert(detail().includes('E_G[max_v E_r'));assert(detail().includes('Read primary theorem'));
root.listeners.change.fn({target:{value:'published',classList:{contains:c=>c==='vlca-publication'}}});assert.equal(chosen,'published');
const signal=root.listeners.click.signal;api.mount(root,'vertex-lca-average');assert(signal.aborted);assert(detail().includes('Theorem 10'));const fresh=root.listeners.click.signal;api.release(root);assert(fresh.aborted);assert(!root.classes.has('vlca-view'));
const escaped=JSON.parse(JSON.stringify(data));escaped.verifiedRecords[0].notes='<script>alert(1)</script>';const eapi=load(escaped),eroot=host();eapi.mount(eroot);assert(!eroot.querySelector('.vlca-theorem').innerHTML.includes('<script>'));assert(eroot.querySelector('.vlca-theorem').innerHTML.includes('&lt;script&gt;'));
console.log('Vertex LCA regression PASS: 4 original records; 3 main records/4 guarantee markers; MIS gadget; exact source and expectation scopes; related oracle caveat; 9 thumbnail sizes/no-text overview; filters/signatures/inspection/keyboard/lifecycle/escaping.');
