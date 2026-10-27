'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const at=n=>path.join(__dirname,n),data=JSON.parse(fs.readFileSync(at('../../../data/focus/vertex-local.json'),'utf8')),source=fs.readFileSync(at('../../../src/vertex-local.js'),'utf8'),input=JSON.parse(fs.readFileSync(at('input-research.json'),'utf8')),patch=JSON.parse(fs.readFileSync(at('research-patch.json'),'utf8')),reg=JSON.parse(fs.readFileSync(at('registration.json'),'utf8'));
function load(d=data){const c={window:{},document:{getElementById(){return{textContent:JSON.stringify({focus:{'vertex-local':d}})}}},AbortController,Set};vm.runInNewContext(source,c);return c.window.AtlasPairRenderers['vertex-local'];}
const api=load(),rows=api.records(),ids=input.slices.flatMap(s=>s.results.map(r=>r.id));
const sparseStrict=data.verifiedRecords.find(r=>r.id==='vertex-result-54');
assert.equal(sparseStrict.displayBound,'O(log²Δ)');
assert(sparseStrict.graph.includes('Δ≥C log⁴n'));
assert.equal(sparseStrict.allDegreeVariant.displayBound,'O(log²Δ + log³log n)');
assert(sparseStrict.allDegreeVariant.communication.includes('original edges'));
assert(api.summarySVG('vertex-local',738,548).includes('Δ≥C log⁴n'));
assert(api.diagramSVG('vertex-local-sparse').includes('C sufficiently large'));
assert.equal(rows.length,15);assert.deepEqual(Array.from(rows,r=>r.id).sort(),ids.sort());assert.equal(new Set(rows.map(r=>r.id)).size,15);
assert.deepEqual(patch.upsertSlices.map(s=>s.id).sort(),input.slices.map(s=>s.id).sort());
assert.equal(patch.upsertSlices.flatMap(s=>s.results).length,15);
for(const s of patch.upsertSlices){assert(!('min' in s.xAxis));assert(!('min' in s.yAxis));assert(s.results.every(r=>r.plot===null));}
for(const r of rows){for(const k of ['sourceId','quality','output','graph','theorem','probability','displayBound','mode','panel'])assert(r[k],r.id+' '+k);for(const [d,f]of Object.entries(reg.pointFields))assert(data.figureAxes[r.panel][d].categories.some(c=>c.id===r[f]),r.id+'/'+f);}
assert.equal(rows.filter(r=>r.kind==='lower').length,2);assert(rows.filter(r=>r.kind==='lower').every(r=>['cycle','sparse'].includes(r.panel)));
const get=id=>rows.find(r=>r.id===id);
assert.equal(get('vertex-local-deterministic-ghaffari-grunau-2024').contractKey,'degree-list');
assert.equal(get('vertex-local-deterministic-conflict-2016').contractKey,'degree-list');
assert(get('vertex-local-deterministic-conflict-2016').displayBound.includes('log^{5/2}Δ'));
assert(get('vertex-extended-vertex-local-deterministic-delta-plus-one-30').theorem.includes('4.1'));
assert(get('vertex-extended-vertex-local-randomized-delta-plus-one-25').displayBound.includes('Det_d'));
assert(get('vertex-extended-vertex-local-high-degree-degree-one-51').output.includes('partial'));
assert(get('vertex-extended-vertex-local-high-degree-degree-one-51').graph.includes('degree(v)≥log⁷n'));
assert(get('vertex-result-50').graph.includes('maximum degree'));
assert(get('vertex-result-52').graph.includes('sufficiently large'));
assert(get('vertex-result-52').output.includes('certificate'));
assert(get('vertex-result-53').quality.includes('q=3'));
assert(get('vertex-result-53').probability.includes('Deterministic'));
assert(get('vertex-extended-vertex-local-sparsified-input-55').probability.includes('2/3'));
assert(get('vertex-extended-vertex-local-sparsified-input-55').notes.includes('f(n)/n'));
assert(get('vertex-result-54').notes.includes('Δ=O(log⁴n)'));
assert(data.representationNote.includes('not a universal ordering'));
for(const[w,h]of [[120,90],[110,280],[450,90],[240,160],[330,220],[330,245],[500,260],[738,548],[1000,660]]){
 for(const view of ['variable','cycle','high','brooks','sparse']){
  const s=api.summarySVG('vertex-local',w,h,{view}),g=api.layoutGeometry(w,h,{view});
  assert(!/NaN|Infinity|undefined/.test(s));assert.equal((s.match(/data-vloc-result=/g)||[]).length,g.points.length);
  for(const p of g.points){const b=g.boxes[p.panel];assert(p.x>b.left&&p.x<b.right&&p.y>b.top&&p.y<b.bottom);}
  if(w<300||h<230)assert(!/<text/.test(s));
 }
}
const full=api.summarySVG('vertex-local',738,548);assert(full.includes('not a numerical ranking'));assert.equal((full.match(/data-vloc-result=/g)||[]).length,17);assert.equal((full.match(/data-kind="lower"/g)||[]).length,2);
assert(full.includes('coloring or certificate'));assert(full.includes('Δ≥C log⁴n'));assert(full.includes('Ω(logΔ/loglog n)'));
assert(!/<text/.test(api.summarySVG('vertex-local',738,548,{level:'overview'})));
assert(api.summarySVG('vertex-local',330,245,{level:'detail'}).includes('data-detail-level="compact"'));
assert.equal(api.diagramSVG({view:'high'}),api.diagramSVG('vertex-local',{view:'high'}));
assert.equal((api.diagramSVG().match(/role="button"/g)||[]).length,17);
assert.equal(api.records({publication:'published'}).length,14);assert.equal(api.records({panel:'main'}).length,9);
assert.equal((api.summarySVG('vertex-local',738,548,{publication:'published'}).match(/data-vloc-result=/g)||[]).length,16);
const empty=JSON.parse(JSON.stringify(data));for(const s of Object.values(empty.sources))s.publicationStatus='preprint';assert.equal(load(empty).records({publication:'published'}).length,0);
assert(load(empty).diagramSVG({publication:'published'}).includes('No sources match'));assert(!/<text/.test(load(empty).summarySVG('vertex-local',200,140,{publication:'published'})));
function host(){const classes=new Set(),children=new Map(),listeners={};return{isConnected:true,innerHTML:'',classList:{add(...s){s.forEach(v=>classes.add(v));},remove(...s){s.forEach(v=>classes.delete(v));},toggle(v,on){on?classes.add(v):classes.delete(v);}},setAttribute(){},querySelector(s){if(!children.has(s))children.set(s,{innerHTML:'',value:'',textContent:''});return children.get(s);},addEventListener(t,f,o){listeners[t]={fn:f,signal:o.signal};},classes,listeners};}
const root=host();let selectedPub=null;api.mount(root,'vertex-local',{onPublicationChange:v=>selectedPub=v});
function clickResult(id,context='list'){const node={dataset:{vlocResult:id,vlocContext:context}};root.listeners.click.fn({target:{closest:s=>s==='[data-vloc-result]'?node:null}});}
for(const r of rows){clickResult(r.id);const detail=root.querySelector('.vloc-theorem').innerHTML;assert(detail.includes(r.shortLabel));assert(detail.includes('Read primary theorem'));assert(detail.includes(r.theorem));}
clickResult('vertex-result-48','cycle-upper');assert(root.querySelector('.vloc-theorem').innerHTML.includes('specialize BEK14 to Δ=2'));
clickResult('vertex-result-52','brooks-high');assert(root.querySelector('.vloc-theorem').innerHTML.includes('High-degree specialization'));
let prevented=false;root.listeners.keydown.fn({key:' ',preventDefault(){prevented=true;},target:{closest(){return{dataset:{vlocResult:'vertex-result-53',vlocContext:'cycle-lower'}};}}});assert(prevented);assert(root.querySelector('.vloc-theorem').innerHTML.includes('Three-coloring')||root.querySelector('.vloc-theorem').innerHTML.includes('three-coloring')||root.querySelector('.vloc-theorem').innerHTML.includes('q=3'));
root.listeners.change.fn({target:{value:'published',classList:{contains:c=>c==='vloc-publication'}}});assert.equal(selectedPub,'published');
const old=root.listeners.click.signal;api.mount(root,'vertex-local-high');assert(old.aborted);assert(root.querySelector('.vloc-plot').innerHTML.includes('data-view="high"'));
const fresh=root.listeners.click.signal;api.release(root);assert(fresh.aborted);assert(!root.classes.has('vloc-view'));
const bad=JSON.parse(JSON.stringify(data));bad.verifiedRecords[5].notes='<script>alert(1)</script>';const ba=load(bad),br=host();ba.mount(br);assert(!br.querySelector('.vloc-theorem').innerHTML.includes('<script>'));assert(br.querySelector('.vloc-theorem').innerHTML.includes('&lt;script&gt;'));
console.log('Vertex LOCAL regression PASS: all 15 original records/six slices; contract corrections and scoped lower bounds; 45 size/view geometries; no-text overview; all publication/source routes, object signature, keyboard, lifecycle and escaping.');
