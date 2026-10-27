'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const at=n=>path.join(__dirname,n),data=JSON.parse(fs.readFileSync(at('../../../data/focus/vertex-query_combined.json'),'utf8')),source=fs.readFileSync(at('../../../src/vertex-query_combined.js'),'utf8'),input=JSON.parse(fs.readFileSync(at('input-research.json'),'utf8')),patch=JSON.parse(fs.readFileSync(at('research-patch.json'),'utf8')),reg=JSON.parse(fs.readFileSync(at('registration.json'),'utf8')),css=fs.readFileSync(at('../../../src/vertex-query_combined.css'),'utf8');
function load(d=data){const c={window:{},document:{getElementById(){return{textContent:JSON.stringify({focus:{'vertex-query_combined':d}})}}},AbortController};vm.runInNewContext(source,c);return c.window.AtlasPairRenderers['vertex-query_combined'];}
const api=load(),rows=api.records(),ids=input.slices.flatMap(s=>s.results.map(r=>r.id)),get=id=>rows.find(r=>r.id===id);
assert.equal(rows.length,10);assert.deepEqual(Array.from(rows,r=>r.id).sort(),ids.sort());assert.equal(new Set(rows.map(r=>r.id)).size,10);
assert.deepEqual(patch.upsertSlices.map(s=>s.id).sort(),input.slices.map(s=>s.id).sort());assert.equal(patch.upsertSlices.flatMap(s=>s.results).length,10);
assert(patch.upsertSlices.every(s=>s.results.every(r=>r.plot===null)));assert(!css.includes(':is('));
for(const r of rows){for(const k of ['sourceId','quality','output','graph','theorem','probability','displayBound','access','panel'])assert(r[k],r.id+' '+k);for(const [d,f]of Object.entries(reg.pointFields))assert(data.figureAxes[r.panel][d].categories.some(c=>c.id===r[f]),r.id+'/'+f);}
assert.equal(rows.filter(r=>r.kind==='lower').length,3);
assert(get('vertex-query-combined-ack-lower-2019').notes.includes('Θ(√N)'));assert(get('vertex-query-combined-ack-lower-2019').notes.includes('not establish'));assert(get('vertex-query-combined-ack-lower-2019').access.includes('degrees supplied'));
assert(get('vertex-query-matrix-ferber-2025').access.includes('degree'));assert(get('vertex-query-matrix-ferber-2025').notes.includes('not a pure'));assert(get('vertex-query-matrix-ferber-2025').probability.includes('Zero error'));
assert(get('vertex-query-combined-ferber-2025').displayBound.includes('expected'));assert(get('vertex-query-combined-ferber-2025').notes.includes('min{nΔ,n² log n/Δ}'));
for(const n of [16,256,65536]){const t=Math.sqrt(n*Math.log(n));const envelope=d=>Math.min(n*d,n*n*Math.log(n)/d);assert(Math.abs(envelope(t)-n**1.5*Math.sqrt(Math.log(n)))<1e-5*n);assert(envelope(1)<=envelope(t));assert(envelope(n)<=envelope(t));}
assert(get('vertex-extra-59').notes.includes('κ+1'));assert(get('vertex-result-38').notes.includes('fixed integer λ>1'));assert(get('vertex-result-38').theorem.includes('23'));
assert.equal(data.relatedResults.length,1);assert.equal(data.relatedResults[0].id,'vertex-result-40');assert(get('vertex-result-40').access.includes('indexed-palette'));assert(get('vertex-result-40').evidenceStatus.includes('qualification'));assert(get('vertex-result-40').notes.includes('not explicit'));assert(data.unresolvedIssues.length===1);
assert(get('vertex-result-56').displayBound.includes('expected bits'));assert(get('vertex-result-56').probability.includes('Zero-error'));
assert(get('vertex-extended-vertex-query-two-party-communication-57').quality.includes('Δ=2'));assert(get('vertex-extended-vertex-query-two-party-communication-57').notes.includes('no interaction-round lower'));assert(get('vertex-extended-vertex-query-two-party-communication-57').notes.includes('inference'));
assert(get('vertex-extended-vertex-query-two-party-communication-58').displayBound.includes('worst-case rounds'));assert(get('vertex-extended-vertex-query-two-party-communication-58').notes.includes('full graph'));
for(const[w,h]of [[120,90],[110,280],[450,90],[240,160],[330,220],[330,245],[500,260],[738,548],[1000,660]]){
 for(const view of ['all','global','pair','degeneracy','communication','lists']){
  const s=api.summarySVG('vertex-query_combined',w,h,{view}),g=api.layoutGeometry(w,h,{view});
  assert(!/NaN|Infinity|undefined/.test(s));assert.equal((s.match(/data-vqc-result=/g)||[]).length,g.points.length);
  for(const p of g.points){assert(p.x>=0&&p.x<=w&&p.y>=0&&p.y<=h);const b=g.boxes[p.panel];assert(p.x>=b.left&&p.x<=b.right&&p.y>=b.top&&p.y<=b.bottom);}
  if(w<300||h<230)assert(!/<text/.test(s));
 }
}
const full=api.summarySVG('vertex-query_combined',738,548);assert.equal((full.match(/data-vqc-result=/g)||[]).length,12);assert.equal((full.match(/data-kind="lower"/g)||[]).length,3);assert(full.includes('leading n-power'));assert(full.includes('not every Δ'));assert(full.includes('fixed integer λ&gt;1'));assert(full.includes('inherited-oracle qualification'));assert(!full.includes('runtime'));assert(!full.includes('time complexity'));
assert(!/<text/.test(api.summarySVG('vertex-query_combined',738,548,{level:'overview'})));assert(api.summarySVG('vertex-query_combined',330,245,{level:'detail'}).includes('data-detail-level="compact"'));
assert.equal(api.diagramSVG({view:'communication'}),api.diagramSVG('vertex-query_combined',{view:'communication'}));assert.equal((api.diagramSVG().match(/role="button"/g)||[]).length,12);
assert.equal(api.records({publication:'published'}).length,8);assert.equal((api.summarySVG('vertex-query_combined',738,548,{publication:'published'}).match(/data-vqc-result=/g)||[]).length,10);
assert(!api.summarySVG('vertex-query_combined',738,548,{publication:'published',view:'pair'}).includes('class="vqc-curve"'));
const empty=JSON.parse(JSON.stringify(data));for(const s of Object.values(empty.sources))s.publicationStatus='preprint';assert.equal(load(empty).records({publication:'published'}).length,0);assert(load(empty).diagramSVG({publication:'published'}).includes('No sources match'));
function host(){const classes=new Set(),children=new Map(),listeners={};return{isConnected:true,innerHTML:'',classList:{add(...s){s.forEach(v=>classes.add(v));},remove(...s){s.forEach(v=>classes.delete(v));},toggle(v,on){on?classes.add(v):classes.delete(v);}},setAttribute(){},querySelector(s){if(!children.has(s))children.set(s,{innerHTML:'',value:'',textContent:''});return children.get(s);},addEventListener(t,f,o){listeners[t]={fn:f,signal:o.signal};},classes,listeners};}
const root=host();let pub=null;api.mount(root,'vertex-query_combined',{onPublicationChange:v=>pub=v});
function click(id){const node={dataset:{vqcResult:id,vqcList:'yes'}};root.listeners.click.fn({target:{closest:s=>s==='[data-vqc-result]'?node:null}});}
for(const r of rows){click(r.id);const detail=root.querySelector('.vqc-theorem').innerHTML;assert(detail.includes(r.shortLabel));assert(detail.includes('Read primary theorem'));assert(detail.includes('Computation details'));assert(detail.includes(r.theorem));}
click('vertex-result-40');assert(root.querySelector('.vqc-theorem').innerHTML.includes('oracle qualification retained'));
let prevented=false;root.listeners.keydown.fn({key:' ',preventDefault(){prevented=true;},target:{closest(){return{dataset:{vqcResult:'vertex-query-combined-ack-lower-2019'}};}}});assert(prevented);assert(root.querySelector('.vqc-theorem').innerHTML.includes('hard degree')||root.querySelector('.vqc-theorem').innerHTML.includes('hard-family')||root.querySelector('.vqc-theorem').innerHTML.includes('Hard-family'));
root.listeners.change.fn({target:{value:'published',classList:{contains:c=>c==='vqc-publication'}}});assert.equal(pub,'published');
const old=root.listeners.click.signal;api.mount(root,'vertex-query-communication');assert(old.aborted);assert(root.querySelector('.vqc-plot').innerHTML.includes('data-view="communication"'));const fresh=root.listeners.click.signal;api.release(root);assert(fresh.aborted);assert(!root.classes.has('vqc-view'));
const bad=JSON.parse(JSON.stringify(data));bad.verifiedRecords.find(r=>r.id===data.defaultSelected).notes='<script>alert(1)</script>';const ba=load(bad),br=host();ba.mount(br);assert(!br.querySelector('.vqc-theorem').innerHTML.includes('<script>'));assert(br.querySelector('.vqc-theorem').innerHTML.includes('&lt;script&gt;'));
console.log('Vertex combined-query regression PASS: ten original IDs/five slices; scoped degree and degeneracy lower bounds; separate communication units and list-oracle caveat; 54 size/view geometries; publication filters, keyboard inspection, lifecycle and escaping.');
