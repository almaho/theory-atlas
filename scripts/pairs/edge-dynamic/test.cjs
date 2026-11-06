'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),vm=require('../../atlas-test-vm.cjs');
const dir=__dirname,data=JSON.parse(fs.readFileSync(path.join(dir,'../../../data/focus/edge-dynamic.json'),'utf8')),patch=JSON.parse(fs.readFileSync(path.join(dir,'research-patch.json'),'utf8')),registration=JSON.parse(fs.readFileSync(path.join(dir,'registration.json'),'utf8')),src=fs.readFileSync(path.join(dir,'../../../src/edge-dynamic.js'),'utf8'),css=fs.readFileSync(path.join(dir,'../../../src/edge-dynamic.css'),'utf8');
const original=['forest-greedy-recourse-2026','forest-random-fully-2026','general-large-palette-recourse-2026','forest-incremental-random-2026','forest-full-delta-lower-2026','dynamic-arboricity-recourse-2026','edge-dynamic-duan-2019','edge-dynamic-christiansen-2023','edge-dynamic-nibble-2024','edge-dynamic-deterministic-2026','edge-dynamic-bchn-2018','edge-dynamic-arbor-bcps-2024','edge-dynamic-sparse-crv-2024'];
const all=[...data.verifiedRecords,...data.relatedResults],by=id=>all.find(r=>r.id===id);
assert.equal(new Set(all.map(r=>r.id)).size,19);assert.equal(data.verifiedRecords.length,17);assert.equal(data.relatedResults.length,2);assert.equal(Object.keys(data.sources).length,10);
for(const id of original){assert(by(id),'Lost original '+id);assert.equal(patch.upsertSlices.flatMap(s=>s.results).filter(r=>r.id===id).length,1);}
assert(patch.upsertPapers.length===9&&patch.upsertSlices.length===9);assert(!patch.papers&&!patch.slices);assert(!registration.pointFields);
for(const r of all){assert(data.sources[r.sourceId]);for(const k of ['graph','quality','output','probability','theorem','displayBound'])assert(r[k]);assert(r.assumptions.length);assert(!r.plot);assert(r.sourceUrl.startsWith('https://'));}
for(const r of data.verifiedRecords)for(const p of r.placements){assert(data.figureAxes[p.panel].x.categories.some(c=>c.id===p.costClass));assert(data.groups.some(g=>g.id===p.group&&g.slots.includes(p.slot)));assert(p.panel==='time'?r.updateTime:r.recourse);}
assert(data.verifiedRecords.filter(r=>r.kind==='lower').every(r=>r.panel==='recourse'&&r.group.startsWith('forest-')));
assert(data.relatedResults.every(r=>r.relatedOnly&&!r.placements.length));assert.equal(by('edge-general-precoloring-extension-lower-2026').scope,'arbitrary_precoloring_extension');assert.match(by('edge-general-precoloring-extension-lower-2026').displayBound,/Δ−C\)²/);
assert.match(by('general-large-palette-recourse-2026').displayBound,/C\/Δ−1\/φ/);assert.match(by('general-large-palette-recourse-2026').assumptions.join(' '),/0\.724/);
assert.match(by('forest-incremental-random-2026').updateTime,/α/);assert(!by('forest-incremental-random-2026').updateTime.includes('1/Δ'));
assert.match(by('forest-greedy-recourse-2026').updateTime,/Δ⁴n/);assert.match(by('forest-random-fully-2026').updateTime,/1\+/);
assert.match(by('edge-forest-incremental-universal-lower-2026').assumptions.join(' '),/Fixed constant c/);assert.match(by('edge-forest-fully-fixed-slack-lower-2026').displayBound,/Ω\(1\)/);
assert.match(by('edge-dynamic-nibble-2024').probability,/Expected worst-case.*oblivious/);assert.match(by('edge-dynamic-nibble-2024').assumptions.join(' '),/Δ≥Δ\*/);
// The new theorem removes n from its degree threshold, not adversary restrictions or expectation.
const gp=by('edge-dynamic-ghaffari-peng-2026'),gpAssumptions=gp.assumptions.join(' ');
assert.equal(gp.kind,'upper');assert.equal(gp.randomized,true);assert.equal(data.sources[gp.sourceId].publicationStatus,'preprint');
assert.match(gpAssumptions,/0<ε<1/);assert.match(gpAssumptions,/Fixed known upper bound Δ/);assert.match(gpAssumptions,/Δ≥Δε.*Õ\(ε⁻²\)/);assert.match(gpAssumptions,/Simple undirected.*insertions and deletions/);
assert.match(gp.probability,/worst-case expected.*each update.*oblivious/);assert.match(gp.updateTime,/poly\(1\/ε\)/);assert.match(gp.notes,/exponent.*unspecified/);assert.match(gp.notes,/not amortized/);
assert.match(gp.palette,/At most \(1\+ε\)Δ/);assert.equal(gp.recourse,null);assert(gp.placements.every(p=>p.panel==='time'&&p.costClass==='epsilon'),'Do not invent a recourse theorem or a numeric ε exponent');
assert.match(gp.sourceUrl,/2611\.06611v1#Thmtheorem1$/);assert.notEqual(by('edge-dynamic-nibble-2024').frontierStatus,'current_best_verified');
// Version 3 keeps arbitrary-precoloring hardness separate and fixes the all-ε formula.
const sparse=by('dynamic-arboricity-recourse-2026'),extension=by('edge-general-precoloring-extension-lower-2026');
assert.match(sparse.bound,/log_\{1\+ε\}/);assert.match(sparse.recourse,/log_\{1\+ε\}/);assert.match(sparse.notes,/0<ε≤1/);assert.match(sparse.probability,/Deterministic worst-case per-update/);assert.match(sparse.updateTime,/O\(m\)/);
assert.match(extension.assumptions.join(' '),/n≥Δ\+C\+2/);assert(extension.relatedOnly&&!extension.placements.length);assert.match(extension.assumptions.join(' '),/Not an amortized or expected dynamic lower bound/);
for(const q of [sparse,extension,by('general-large-palette-recourse-2026')])assert.match(q.sourceUrl,/2602\.09497v3/);
const research=JSON.parse(fs.readFileSync(path.join(dir,'../../../data/research/edge.json'),'utf8'));
for(const q of [gp,sparse,extension]){const matches=research.slices.flatMap(x=>x.results).filter(x=>x.id===q.id);assert(matches.length>0);for(const other of matches)for(const key of ['bound','recourse','sourceUrl'])assert.equal(other[key],q[key],q.id+' stale research '+key);}

assert.match(by('edge-dynamic-deterministic-2026').assumptions.join(' '),/0\.49/);assert.match(by('edge-dynamic-deterministic-2026').palette,/⌈/);assert.match(by('edge-dynamic-christiansen-2023').notes,/Section 7\.1.*ceiling/);
assert.equal(by('edge-dynamic-deterministic-2026').recourse,null);assert.equal(by('edge-dynamic-nibble-2024').recourse,null);assert.equal(by('edge-dynamic-sparse-crv-2024').recourse,null);
assert.match(by('edge-dynamic-sparse-crv-2024').updateTime,/Insertion.*deletion.*amortized/);assert.match(by('edge-dynamic-arbor-bcps-2024').recourse,/ε⁻⁵|\/ε⁵/);
const context={window:{},document:{getElementById:()=>({textContent:JSON.stringify({focus:{'edge-dynamic':data}})})},AbortController};vm.runInNewContext(src,context);const r=context.window.AtlasPairRenderers['edge-dynamic'];
assert.equal(r.records().length,19);assert.equal(r.records({publication:'published'}).length,7);assert(r.records({publication:'published'}).every(q=>q.publicationStatus!=='preprint'));assert.equal(r.records({family:'forest'}).length,8);assert.equal(r.records({publication:'published',family:'forest'}).length,0);assert.equal(r.records({palette:'near'}).length,5);
const dimensions=[[738,548],[330,245],[180,120],[1,1],[640,420],[900,600],[480,340],[1120,800],[300,100]];
for(const [w,h] of dimensions){
 const svg=r.summarySVG('edge-dynamic',w,h);assert(svg.includes('preserveAspectRatio="xMidYMid meet"'));assert(!svg.includes('NaN'));assert(!svg.includes('undefined'));assert(!svg.includes('arbitrary_precoloring'));
 for(const m of svg.matchAll(/data-center-x="([^"]+)" data-center-y="([^"]+)"/g)){const x=Number(m[1]),y=Number(m[2]);assert(x>=0&&x<=w,'x outside '+w+' '+x);assert(y>=0&&y<=h,'y outside '+h+' '+y);}
 if(w<250||h<150)assert(!svg.includes('<text '),'Overview leaked text');
 if(w===330){assert(!svg.includes('edyn-formula'));assert(!svg.includes('edyn-tag'));}
 if(w>=32&&h>=32){const gpMarker=svg.match(/<g class="edyn-result[^"]*" data-edyn-result="edge-dynamic-ghaffari-peng-2026"[\s\S]*?<\/g>/)?.[0];assert(gpMarker,'GP marker missing through semantic zoom');assert(gpMarker.includes('data-panel="time"'));assert(gpMarker.includes('data-marker="algorithm"'));assert(gpMarker.includes('data-setup-shape="circle"'));assert(gpMarker.includes('fill="var(--green)"'));}

}
const detail=r.summarySVG('',738,548),focus=r.diagramSVG();assert.equal((detail.match(/data-marker=/g)||[]).length,(focus.match(/data-marker=/g)||[]).length);assert(detail.includes('not a universal ranking'));assert(detail.includes('Categorical formula classes'));
const markers=id=>Array.from(detail.matchAll(new RegExp('<g class="edyn-result[^"]*" data-edyn-result="'+id+'"[\\s\\S]*?</g>','g'))).map(m=>({panel:m[0].match(/data-panel="([^"]+)"/)[1],x:m[0].match(/data-center-x="([^"]+)"/)[1],y:m[0].match(/data-center-y="([^"]+)"/)[1]}));
for(const [upper,lower] of [['forest-incremental-random-2026','edge-forest-incremental-universal-lower-2026'],['edge-forest-fully-zero-upper-2026','forest-full-delta-lower-2026']])assert.deepEqual(markers(upper).find(m=>m.panel==='recourse'),markers(lower)[0]);
assert.notEqual(markers('forest-random-fully-2026').find(m=>m.panel==='recourse').x,markers('edge-forest-fully-fixed-slack-lower-2026')[0].x);
assert(!r.summarySVG('',738,548,{publication:'published'}).includes('data-marker="lower"'));assert(!r.summarySVG('',738,548,{publication:'published'}).includes('edge-dynamic-ghaffari-peng-2026'),'Preprint leaked into published-only view');assert(r.summarySVG('',738,548,{family:'forest',publication:'published'}).includes('No results match'));
for(const x of ['.cell svg.edyn-summary text','.cell svg.edyn-summary .edyn-formula','.cell svg.edyn-summary .edyn-upper','.cell svg.edyn-summary .edyn-lower'])assert(css.includes(x),'Missing atlas cascade override '+x);
class El{constructor(){this.innerHTML='';this.value='';this.hidden=false;this.set=new Set();this.classList={add:(...c)=>c.forEach(v=>this.set.add(v)),remove:v=>this.set.delete(v),toggle:(v,on)=>on?this.set.add(v):this.set.delete(v),contains:v=>this.set.has(v)};}focus(){this.focused=true;}setAttribute(k,v){this[k]=v;}}
class Root extends El{constructor(){super();this.isConnected=true;this.els=new Map();this.listeners={};}querySelector(s){if(!this.els.has(s))this.els.set(s,new El());return this.els.get(s);}addEventListener(type,fn,opt){this.listeners[type]={fn,signal:opt.signal};}}
const root=new Root();let notified=null;const inst=r.mount(root,'edge-dynamic',{publication:'all',onPublicationChange:v=>{notified=v;}});assert(root.innerHTML.includes('Related lower bounds'));assert(root.querySelector('.edyn-related-records').innerHTML.includes('edge-general-precoloring'));
const old=root.listeners.click.signal;root.listeners.change.fn({target:{classList:{contains:c=>c==='edyn-publication'},value:'published'}});assert.equal(notified,'published');assert.equal(root.querySelector('.edyn-related').hidden,true);assert(!root.querySelector('.edyn-records').innerHTML.includes('forest-'));
r.mount(root,'edge-dynamic');assert(old.aborted);let prevented=false;root.listeners.keydown.fn({key:'Enter',preventDefault:()=>{prevented=true;},target:{closest:()=>({dataset:{edynResult:'forest-full-delta-lower-2026'}})}});assert(prevented);assert(root.querySelector('.edyn-theorem').innerHTML.includes('Expected amortized lower'));
root.listeners.keydown.fn({key:'Enter',preventDefault(){},target:{closest:()=>({dataset:{edynResult:gp.id}})}});
const inspected=root.querySelector('.edyn-theorem').innerHTML;assert(inspected.includes('2611.06611v1#Thmtheorem1'));assert(inspected.includes('oblivious'));assert(inspected.includes('Δε'));assert(inspected.includes('No separate recourse bound recorded'));
const sig=root.listeners.click.signal;r.release(root);assert(sig.aborted);assert(!root.classList.contains('edyn-view'));assert.equal(inst.settingKey,'edge-dynamic');
console.log('edge-dynamic: 13 original IDs; 17 main + 2 scoped records; GP26 and SK26v3 contracts; two resources; regimes, filters, nine sizes, semantic zoom, inspector, keyboard and lifecycle checks passed.');
