'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const data=JSON.parse(fs.readFileSync(__dirname+'/../../../data/focus/mis-query-matrix.json','utf8')),patch=JSON.parse(fs.readFileSync(__dirname+'/research-patch.json','utf8')),input=JSON.parse(fs.readFileSync(__dirname+'/input-research.json','utf8')),src=fs.readFileSync(__dirname+'/../../../src/mis-query-matrix.js','utf8'),css=fs.readFileSync(__dirname+'/../../../src/mis-query-matrix.css','utf8');
function load(d=data){const ctx={window:{},AbortController,document:{getElementById:()=>({textContent:JSON.stringify({focus:{'mis-query_matrix':d}})})}};vm.runInNewContext(src,ctx);return ctx.window.AtlasPairRenderers['mis-query_matrix'];}
const api=load();for(const k of ['mount','summarySVG','diagramSVG','records','release'])assert.equal(typeof api[k],'function');
assert.equal(api.records().length,4);assert.equal(api.records({publication:'published'}).length,4);
const ids=new Set(patch.upsertSlices.flatMap(s=>s.results.map(r=>r.id)));for(const r of input.slices.flatMap(s=>s.results))assert(ids.has(r.id),'Original records must survive');
assert.equal(data.verifiedRecords.filter(r=>r.kind==='lower').length,1);
assert(data.verifiedRecords.filter(r=>r.kind==='lower').every(r=>r.panel==='explicit'));
assert.equal(data.verifiedRecords.filter(r=>r.derived).length,2);
assert.equal(data.sharedAxes.exponentFrontier,'min{3/2+2a,2}');
assert.deepEqual(data.figureAxes.estimate.x,data.figureAxes.explicit.x);
assert.deepEqual(data.figureAxes.estimate.y,data.figureAxes.explicit.y);
assert.equal(data.figureAxes.estimate.x.fixedAccuracyReference.epsilon,.25);
assert(!patch.upsertSlices.some(s=>s.results.some(r=>r.plot)),'No old x=1.25 or invented point coordinates');
for(const r of data.verifiedRecords){assert.equal(r.resource,'Adjacency-matrix pair queries');assert.equal(r.conditional,false);assert(r.sourceUrl.includes('#page='));assert(r.assumptions.some(a=>a.includes('not maximum')));}
const estimator=data.verifiedRecords.find(r=>r.id.endsWith('estimator'));assert.equal(estimator.curve.queryExponent,'3/2+2a');assert(estimator.assumptions.includes('0 < ε < 1'));
const cap=data.verifiedRecords.find(r=>r.id==='mis-query-matrix-size-full-scan-baseline');assert(cap.notes.includes('own π'));assert(cap.assumptions.some(a=>a.includes('No claim to reproduce')));
assert(data.verifiedRecords.find(r=>r.kind==='lower').notes.includes('always n−1'));
assert(css.includes('--miqm-explicit:light-dark('));assert(!css.includes('var(--purple)'));
function check(svg,w,h,tiny=false){
 assert(!/NaN|Infinity|undefined/.test(svg));assert(svg.includes('preserveAspectRatio="xMidYMid meet"'));assert(svg.includes('var(--green)')&&svg.includes('var(--red)'));assert(!/<rect/.test(svg));
 assert.equal((svg.match(/data-panel="/g)||[]).length,2);assert.equal((svg.match(/data-axis-x-min="0" data-axis-x-max="0.5" data-axis-y-min="1.4" data-axis-y-max="2.12"/g)||[]).length,2);
 const lower=svg.match(/<g class="miqm-result miqm-lower"[^>]+/)[0];assert(lower.includes('data-setup="explicit"'));
 const boundaries=[...svg.matchAll(/data-boundary="([^"]+)" d="([^"]+)"/g)];assert.equal(boundaries.length,4);
 assert.equal(boundaries[2][2],boundaries[3][2],'Explicit O/Ω bounds must coincide exactly');
 const markers=[...svg.matchAll(/data-marker="([^"]+)" data-a="([^"]+)" data-p="([^"]+)" data-center-x="([^"]+)" data-center-y="([^"]+)"/g)];assert.equal(markers.length,11);
 for(const m of markers){assert(+m[4]>=6&&+m[4]<=w-6);assert(+m[5]>=6&&+m[5]<=h-6);assert(+m[3]<=2,'Scan cap must bound all drawn costs');}
 for(let i=0;i<3;i++)assert.equal(+markers[i][3],1.5+2*+markers[i][2],'Estimator points follow exact epsilon exponent conversion');
 for(let i=5;i<8;i++){assert.equal(markers[i][4],markers[i+3][4]);assert.equal(markers[i][5],markers[i+3][5]);}
 assert(+markers[4][4]<+markers[5][4],'Output-contract panels must be spatially separate');
 if(tiny)assert(!/<text/.test(svg));
}
check(api.diagramSVG(),1000,600);
for(const [w,h] of [[180,110],[180,548],[500,110],[250,150],[330,245],[500,260],[640,350],[738,548],[1000,800]])check(api.summarySVG('mis-query_matrix',w,h),w,h,w<250||h<150);
check(api.summarySVG('mis-query_matrix',738,548,{level:'overview'}),738,548,true);
const large=api.summarySVG('mis-query_matrix',738,548);assert(large.includes('data-axis="x"'));assert(large.includes('data-axis="y"'));assert(large.includes('explicit output only'));assert(large.includes('No estimation lower bound'));assert(large.includes('ε = ¼ reference'));
const filtered=JSON.parse(JSON.stringify(data));Object.values(filtered.sources).forEach(s=>s.publicationStatus='preprint');assert.equal(load(filtered).records({publication:'published'}).length,0);assert(load(filtered).diagramSVG({publication:'published'}).includes('No sources'));
function host(){const nodes=new Map(),events=[],classes=new Set();return{isConnected:true,events,classes,innerHTML:'',classList:{add(...s){s.forEach(x=>classes.add(x))},remove(...s){s.forEach(x=>classes.delete(x))},toggle(s,on){on?classes.add(s):classes.delete(s)}},setAttribute(){},querySelector(s){if(!nodes.has(s))nodes.set(s,{innerHTML:'',value:''});return nodes.get(s)},addEventListener(type,fn,o){events.push({type,fn,signal:o.signal})}}}
const root=host();let changed=null;api.mount(root,'mis-query_matrix',{onPublicationChange:x=>changed=x});
assert(root.innerHTML.includes('Size estimate'));assert(root.innerHTML.includes('Explicit vertices'));
for(const r of data.verifiedRecords){root.events.find(e=>e.type==='click').fn({target:{closest:()=>({dataset:{miqmResult:r.id}})}});const detail=root.querySelector('.miqm-theorem').innerHTML;assert(detail.includes(r.theorem));assert(detail.includes(r.sourceUrl));assert(detail.includes(r.quality));if(r.derived)assert(detail.includes('Elementary baseline'));}
let prevented=false;root.events.find(e=>e.type==='keydown').fn({key:'Enter',preventDefault(){prevented=true},target:{closest:()=>({dataset:{miqmResult:data.verifiedRecords[0].id}})}});assert(prevented);
root.events.find(e=>e.type==='change').fn({target:{value:'published',classList:{contains:()=>true}}});assert.equal(changed,'published');api.release(root);assert(root.events.every(e=>e.signal.aborted));assert(!root.classes.has('miqm-view'));
console.log('PASS: original IDs, primary/derived distinction, shared precision axes, estimator cap, explicit-only lower, exact bound overlap, nine zoom geometries, source inspection, filtering and lifecycle.');
