'use strict';
const fs=require('fs'),path=require('path'),vm=require('../../atlas-test-vm.cjs'),assert=require('assert');
const at=n=>path.join(__dirname,n),data=JSON.parse(fs.readFileSync(at('../../../data/focus/vertex-local.json'),'utf8')),source=fs.readFileSync(at('../../../src/vertex-local.js'),'utf8'),input=JSON.parse(fs.readFileSync(at('input-research.json'),'utf8')),patch=JSON.parse(fs.readFileSync(at('research-patch.json'),'utf8')),reg=JSON.parse(fs.readFileSync(at('registration.json'),'utf8'));
function load(d=data){const c={window:{},document:{getElementById(){return{textContent:JSON.stringify({focus:{'vertex-local':d}})}}},AbortController,Set};vm.runInNewContext(source,c);return c.window.AtlasPairRenderers['vertex-local'];}
const api=load(),rows=api.records(),ids=input.slices.flatMap(s=>s.results.map(r=>r.id));
const twoSweepId='vertex-local-deterministic-fuchs-kuhn-2026-two-sweep',sqrtDegreeId='vertex-local-deterministic-fuchs-kuhn-2026-sqrt-degree',newIds=[twoSweepId,sqrtDegreeId];
const sparseStrict=data.verifiedRecords.find(r=>r.id==='vertex-result-54');
assert.equal(sparseStrict.displayBound,'O(log²Δ)');
assert(sparseStrict.graph.includes('Δ≥C log⁴n'));
assert.equal(sparseStrict.allDegreeVariant.displayBound,'O(log²Δ + log³log n)');
assert(sparseStrict.allDegreeVariant.communication.includes('original edges'));
assert(api.summarySVG('vertex-local',738,548).includes('Δ≥C log⁴n'));
assert(api.diagramSVG('vertex-local-sparse').includes('C sufficiently large'));
// The input and patch are the original 15-record review, not a live frontier.
assert.equal(ids.length,15);assert.equal(new Set(ids).size,15);
assert(ids.every(id=>rows.some(r=>r.id===id)),'Retain every record in the original review');
assert.equal(rows.length,17);assert.equal(new Set(rows.map(r=>r.id)).size,17);
assert.deepEqual(Array.from(rows.filter(r=>!ids.includes(r.id)),r=>r.id).sort(),newIds.slice().sort(),'Only the two verified proper-coloring consequences extend the historical input');
assert.deepEqual(patch.upsertSlices.map(s=>s.id).sort(),input.slices.map(s=>s.id).sort());
assert.equal(patch.upsertSlices.flatMap(s=>s.results).length,15);
for(const s of patch.upsertSlices){assert(!('min' in s.xAxis));assert(!('min' in s.yAxis));assert(s.results.every(r=>r.plot===null));}
for(const r of rows){for(const k of ['sourceId','quality','output','graph','theorem','probability','displayBound','mode','panel'])assert(r[k],r.id+' '+k);for(const [d,f]of Object.entries(reg.pointFields))assert(data.figureAxes[r.panel][d].categories.some(c=>c.id===r[f]),r.id+'/'+f);}
assert.deepEqual(Array.from(rows.filter(r=>r.kind==='lower'),r=>r.id).sort(),['vertex-extended-vertex-local-sparsified-input-55','vertex-result-53']);
assert(rows.filter(r=>r.kind==='lower').every(r=>['cycle','sparse'].includes(r.panel)),'Defective-coloring hardness is not a universal proper-coloring lower bound');
const get=id=>rows.find(r=>r.id===id);
const twoSweep=get(twoSweepId),sqrtDegree=get(sqrtDegreeId);
assert.equal(twoSweep.displayBound,'O(√Δ log⁴Δ + log* n)');
assert.equal(sqrtDegree.displayBound,'O(√Δ + log* n)');
assert.equal(twoSweep.rowKey,'d-root-log4');assert.equal(sqrtDegree.rowKey,'d-root-exact');
assert.equal(twoSweep.frontierStatus,'historical');assert.equal(sqrtDegree.frontierStatus,'candidate');
for(const r of [twoSweep,sqrtDegree]){
 assert.equal(r.kind,'upper');assert.equal(r.mode,'deterministic');assert.equal(r.panel,'main');
 assert.equal(r.contractKey,'ordinary','The displayed CONGEST consequence uses a common Δ+1 palette, not arbitrary degree+1 lists');
 assert.equal(r.publicationStatus,'preprint');assert(/CONGEST/.test(r.quality));
 assert(/proper/i.test(r.output));assert(/Δ\+1/.test(r.quality));
 assert.equal(r.evidenceStatus,'theorem_verified');assert.equal(r.bound,r.displayBound);
 assert(r.probability.includes('correctness probability 1'));
 assert(r.assumptions.some(a=>a.includes('O(log n)-bit')));
 assert(r.assumptions.some(a=>a.includes('O(log* n)')),'Initial coloring is charged to the displayed round bound');
 const verification=data.sourceVerification.find(v=>v.sourceId===r.sourceId);assert(verification);assert(verification.url.includes(r.verificationUrl.split('#')[0]));
 assert(!api.records({publication:'published'}).some(v=>v.id===r.id));
}
assert.equal(twoSweep.sourceId,'fuchs-kuhn-2026-two-sweep');assert.equal(sqrtDegree.sourceId,'fuchs-kuhn-2026-sqrt-degree');
assert(twoSweep.theorem.includes('2.3'));assert(sqrtDegree.theorem.includes('1.1'));
assert(twoSweep.verificationUrl.includes('2608.02386v3'));assert(sqrtDegree.verificationUrl.includes('2610.16575v1'));
assert(twoSweep.url.includes('arxiv.org/abs/2608.02386'));assert(sqrtDegree.url.includes('arxiv.org/abs/2610.16575'));
assert(twoSweep.notes.includes('C=O(Δ)'));assert(twoSweep.assumptions.some(a=>a.includes('|L(v)|≥degree(v)+1')));
assert(twoSweep.notes.includes('not a faster LOCAL bound than FHK16'));
assert(twoSweep.notes.includes('not a general proper-coloring lower bound'));
assert(sqrtDegree.notes.includes('O(√Δ log(1+C/Δ)+log* n)'));
assert(sqrtDegree.notes.includes('CONGEST when C≤poly(n)'));
assert(sqrtDegree.notes.includes('not asserted for an unrestricted color universe'));
assert(sqrtDegree.assumptions.some(a=>a.includes('knows Δ')&&a.includes('C=Δ+1')));
assert(sqrtDegree.assumptions.some(a=>a.includes('unrestricted local computation')&&a.includes('exhaustive search')));
assert(sqrtDegree.notes.includes('Theorem A.1')&&sqrtDegree.notes.includes('explicit hash functions'));
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
const geometrySizes=[[120,90],[110,280],[450,90],[240,160],[330,220],[330,245],[500,260],[738,548],[1000,660]];
for(const[w,h]of geometrySizes){
 for(const view of ['variable','cycle','high','brooks','sparse']){
  const s=api.summarySVG('vertex-local',w,h,{view}),g=api.layoutGeometry(w,h,{view});
  assert(!/NaN|Infinity|undefined/.test(s));assert.equal((s.match(/data-vloc-result=/g)||[]).length,g.points.length);
  for(const p of g.points){const b=g.boxes[p.panel];assert(p.x>b.left&&p.x<b.right&&p.y>b.top&&p.y<b.bottom);}
  if(w<300||h<230)assert(!/<text/.test(s));
 }
}
const full=api.summarySVG('vertex-local',738,548);assert(full.includes('not a numerical ranking'));assert.equal((full.match(/data-vloc-result=/g)||[]).length,19);assert.equal((full.match(/data-kind="lower"/g)||[]).length,2);
for(const id of newIds){
 const point=full.match(new RegExp('<g[^>]*data-vloc-result="'+id+'"[\\s\\S]*?</g>'));assert(point,id+' has a visible marker');
 assert(point[0].includes('data-kind="upper"'));assert(point[0].includes('data-setup-shape="square"'));
 assert(point[0].includes('fill="var(--green)"'));assert(!point[0].includes('var(--red)'));
}
assert(full.includes('coloring or certificate'));assert(full.includes('Δ≥C log⁴n'));assert(full.includes('Ω(logΔ/loglog n)'));
assert(!/<text/.test(api.summarySVG('vertex-local',738,548,{level:'overview'})));
assert(api.summarySVG('vertex-local',330,245,{level:'detail'}).includes('data-detail-level="compact"'));
assert.equal(api.diagramSVG({view:'high'}),api.diagramSVG('vertex-local',{view:'high'}));
assert.equal((api.diagramSVG().match(/role="button"/g)||[]).length,19);
assert.equal(api.records({publication:'published'}).length,14);assert.equal(api.records({panel:'main'}).length,11);
assert.equal((api.summarySVG('vertex-local',738,548,{publication:'published'}).match(/data-vloc-result=/g)||[]).length,16);
// Every symbolic row has its own vertical lane at each zoom. Filtering must
// remove empty preprint lanes and keep the deterministic/randomized split.
for(const publication of ['all','published'])for(const[w,h]of geometrySizes){
 const options={publication,view:'variable'},g=api.layoutGeometry(w,h,options),s=api.summarySVG('vertex-local',w,h,options),main=g.points.filter(p=>p.panel==='main'),active=api.records({publication,panel:'main'});
 assert.equal(g.mainRows.length,publication==='all'?10:8);
 assert.deepEqual(Array.from(main,p=>p.id).sort(),Array.from(active,r=>r.id).sort());
 const lanes=g.mainRows.map(row=>({row,points:main.filter(p=>get(p.id).rowKey===row.id)}));
 assert(lanes.every(l=>l.points.length),'No empty rows survive the publication filter');
 const firstRandom=lanes.findIndex(l=>l.row.mode==='Rand.');assert.equal(firstRandom,publication==='all'?6:4);
 assert(lanes.slice(0,firstRandom).every(l=>l.points.every(p=>get(p.id).mode==='deterministic')));
 assert(lanes.slice(firstRandom).every(l=>l.points.every(p=>get(p.id).mode==='randomized')));
 const radius=g.level==='overview'?Math.max(2,Math.min(w,h)*.014):g.level==='compact'?3.6:5;
 for(let i=0;i<lanes.length;i++){
  const lane=lanes[i];assert(lane.points.every(p=>p.y===lane.points[0].y));
  if(i)assert(lane.points[0].y-lanes[i-1].points[0].y>2*radius,'Adjacent runtime rows must have separated markers');
  for(let j=1;j<lane.points.length;j++)assert(Math.abs(lane.points[j].x-lane.points[j-1].x)>2*radius,'Different contracts must remain separate');
 }
 const divider=s.match(/class="vloc-divider" d="M7 ([\d.]+)L/);assert(divider,'Deterministic and randomized rows retain a divider');
 assert(+divider[1]>lanes[firstRandom-1].points[0].y+radius&&+divider[1]<lanes[firstRandom].points[0].y-radius,'The divider must follow the active deterministic rows');
 if(publication==='all'){
  const a=main.find(p=>p.id===twoSweepId),b=main.find(p=>p.id===sqrtDegreeId);assert.equal(a.x,b.x);assert.notEqual(a.y,b.y);
  for(const id of newIds){const point=s.match(new RegExp('<g[^>]*data-vloc-result="'+id+'"[\\s\\S]*?</g>'));assert(point[0].includes('data-setup-shape="square"'));assert(point[0].includes('fill="var(--green)"'));}
 }else for(const id of newIds)assert(!s.includes('data-vloc-result="'+id+'"'),'Published-only excludes new preprint markers');
}
const empty=JSON.parse(JSON.stringify(data));for(const s of Object.values(empty.sources))s.publicationStatus='preprint';assert.equal(load(empty).records({publication:'published'}).length,0);
assert(load(empty).diagramSVG({publication:'published'}).includes('No sources match'));assert(!/<text/.test(load(empty).summarySVG('vertex-local',200,140,{publication:'published'})));
function host(){const classes=new Set(),children=new Map(),listeners={};return{isConnected:true,innerHTML:'',classList:{add(...s){s.forEach(v=>classes.add(v));},remove(...s){s.forEach(v=>classes.delete(v));},toggle(v,on){on?classes.add(v):classes.delete(v);}},setAttribute(){},querySelector(s){if(!children.has(s))children.set(s,{innerHTML:'',value:'',textContent:''});return children.get(s);},addEventListener(t,f,o){listeners[t]={fn:f,signal:o.signal};},classes,listeners};}
const root=host();let selectedPub=null;api.mount(root,'vertex-local',{onPublicationChange:v=>selectedPub=v});
function clickResult(id,context='list'){const node={dataset:{vlocResult:id,vlocContext:context}};root.listeners.click.fn({target:{closest:s=>s==='[data-vloc-result]'?node:null}});}
for(const r of rows){clickResult(r.id);const detail=root.querySelector('.vloc-theorem').innerHTML;assert(detail.includes(r.shortLabel));assert(detail.includes('Read primary theorem'));assert(detail.includes(r.theorem));assert(detail.includes('href="'+r.verificationUrl+'"'));assert(detail.includes('href="'+r.url+'"'));}
for(const [i,id]of newIds.entries()){
 clickResult(id);
 let handled=false;root.listeners.keydown.fn({key:i?' ':'Enter',preventDefault(){handled=true;},target:{closest(){return{dataset:{vlocResult:id,vlocContext:'main'}};}}});
 assert(handled);assert(root.querySelector('.vloc-theorem').innerHTML.includes(get(id).verificationUrl));
 assert(root.querySelector('.vloc-plot').innerHTML.includes('data-vloc-result="'+id+'" data-vloc-context="main" data-panel="main" data-kind="upper"'));
 assert(root.querySelector('.vloc-theorem').innerHTML.includes('preprint'));
}
clickResult('vertex-result-48','cycle-upper');assert(root.querySelector('.vloc-theorem').innerHTML.includes('specialize BEK14 to Δ=2'));
clickResult('vertex-result-52','brooks-high');assert(root.querySelector('.vloc-theorem').innerHTML.includes('High-degree specialization'));
let prevented=false;root.listeners.keydown.fn({key:' ',preventDefault(){prevented=true;},target:{closest(){return{dataset:{vlocResult:'vertex-result-53',vlocContext:'cycle-lower'}};}}});assert(prevented);assert(root.querySelector('.vloc-theorem').innerHTML.includes('Three-coloring')||root.querySelector('.vloc-theorem').innerHTML.includes('three-coloring')||root.querySelector('.vloc-theorem').innerHTML.includes('q=3'));
root.listeners.change.fn({target:{value:'published',classList:{contains:c=>c==='vloc-publication'}}});assert.equal(selectedPub,'published');
for(const id of newIds){assert(!root.querySelector('.vloc-plot').innerHTML.includes(id));assert(!root.querySelector('.vloc-records').innerHTML.includes(id));}
root.listeners.change.fn({target:{value:'all',classList:{contains:c=>c==='vloc-publication'}}});assert.equal(selectedPub,'all');
for(const id of newIds)assert(root.querySelector('.vloc-records').innerHTML.includes(id));
const old=root.listeners.click.signal;api.mount(root,'vertex-local-high');assert(old.aborted);assert(root.querySelector('.vloc-plot').innerHTML.includes('data-view="high"'));
const fresh=root.listeners.click.signal;api.release(root);assert(fresh.aborted);assert(!root.classes.has('vloc-view'));
const bad=JSON.parse(JSON.stringify(data));bad.verifiedRecords[5].notes='<script>alert(1)</script>';const ba=load(bad),br=host();ba.mount(br);assert(!br.querySelector('.vloc-theorem').innerHTML.includes('<script>'));assert(br.querySelector('.vloc-theorem').innerHTML.includes('&lt;script&gt;'));
console.log('Vertex LOCAL regression PASS: 15 historical records plus two verified preprint algorithms; proper-coloring contracts and scoped lower bounds; 45 size/view geometries and 18 filtered row layouts; green deterministic squares, no-text overview, theorem links, keyboard, lifecycle and escaping.');
