'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const data=JSON.parse(fs.readFileSync(__dirname+'/../../../data/focus/cc-query-matrix.json','utf8')),patch=JSON.parse(fs.readFileSync(__dirname+'/research-patch.json','utf8')),input=JSON.parse(fs.readFileSync(__dirname+'/input-research.json','utf8')),src=fs.readFileSync(__dirname+'/../../../src/cc-query-matrix.js','utf8'),css=fs.readFileSync(__dirname+'/../../../src/cc-query-matrix.css','utf8');
function load(d=data){const ctx={window:{},AbortController,document:{getElementById:()=>({textContent:JSON.stringify({focus:{'cc-query_matrix':d}})})}};vm.runInNewContext(src,ctx);return ctx.window.AtlasPairRenderers['cc-query_matrix'];}
const api=load();for(const k of ['mount','summarySVG','diagramSVG','records','release'])assert.equal(typeof api[k],'function');
assert.equal(api.records().length,11);assert.equal(api.records({publication:'published'}).length,8);
const ids=new Set(patch.upsertSlices.flatMap(s=>s.results.map(r=>r.id)));for(const r of input.slices.flatMap(s=>s.results))assert(ids.has(r.id),'Original record must survive: '+r.id);
assert.deepEqual(data.figureAxes.pure.x,data.figureAxes.mixed.x);assert.deepEqual(data.figureAxes.pure.y,data.figureAxes.mixed.y);
assert.equal(data.sharedAxes.x.fixedAccuracyReference.epsilon,1/32768);
const announced=data.verifiedRecords.find(r=>r.id==='cc-query-partition-lb');assert.equal(announced.display,'announcement');assert.equal(announced.curve,undefined);assert.equal(announced.evidenceStatus,'informal_primary_statement');assert(announced.assumptions.some(a=>a.includes('omitted')));
const lower=data.verifiedRecords.find(r=>r.id==='cc-query-garciasoriano-2020-global-lb');assert(lower.assumptions.includes('8/n < ε ≤ 1/(2048c²)'));assert(lower.curve.openEnd);assert.equal(lower.setup,'expected');
const upper=data.verifiedRecords.find(r=>r.id==='cc-query-garciasoriano-2020-three');assert.equal(upper.setup,lower.setup);assert.equal(upper.curve.queryExponent,lower.curve.queryExponent);assert(upper.notes.includes('n³/(2Q)'));assert(upper.theorem.includes('3.4'));
const pure=data.verifiedRecords.find(r=>r.id==='cc-query-bressan-2019-pure-additive');assert.equal(pure.curve.queryExponent,'1+2a');assert(pure.assumptions.includes('Exponential search over partitions'));
assert(data.verifiedRecords.find(r=>r.id==='cc-query-bonchi-pure-additive').display==='related');assert(data.verifiedRecords.find(r=>r.id==='cc-query-bonchi-four-lb').notes.includes('restriction'));
assert(data.verifiedRecords.filter(r=>r.derived).every(r=>r.kind==='upper'));assert(!patch.upsertSlices.some(s=>s.results.some(r=>r.plot)));assert(css.includes('light-dark('));
function check(svg,w,h,tiny=false){
 assert(!/NaN|Infinity|undefined/.test(svg));assert(svg.includes('preserveAspectRatio="xMidYMid meet"'));assert(svg.includes('var(--green)')&&svg.includes('var(--red)'));assert(!/<rect/.test(svg));
 assert.equal((svg.match(/data-panel="/g)||[]).length,2);assert.equal((svg.match(/data-axis-x-min="0" data-axis-x-max="1" data-axis-y-min=".9" data-axis-y-max="2.1"/g)||[]).length,2);
 const boundaries=[...svg.matchAll(/data-boundary="([^"]+)" d="([^"]+)"/g)];assert.equal(boundaries.length,5);
 assert(!boundaries.some(m=>m[1]===announced.id),'No guessed epsilon domain for informal lower');
 assert.equal(boundaries.find(m=>m[1]===lower.id)[2],boundaries.find(m=>m[1]===upper.id)[2],'Matched mixed-error bounds coincide');
 const markers=[...svg.matchAll(/data-marker="([^"]+)" data-a="([^"]+)" data-p="([^"]+)"(?: data-excluded="([^"]+)")? data-center-x="([^"]+)" data-center-y="([^"]+)"/g)];
 assert.equal(markers.length,13);for(const m of markers){assert(+m[5]>=6&&+m[5]<=w-6);assert(+m[6]>=6&&+m[6]<=h-6);assert(+m[3]<=2,'Query cap holds');}
 assert(markers.some(m=>m[1]==='lower'&&m[2]==='1'&&m[4]==='true'),'Excluded lower endpoint explicitly encoded');
 if(tiny)assert(!/<text/.test(svg));
}
check(api.diagramSVG(),1000,620);
for(const [w,h] of [[180,110],[180,548],[500,110],[250,150],[330,245],[500,260],[640,350],[738,548],[1000,800]])check(api.summarySVG('cc-query_matrix',w,h),w,h,w<250||h<150);
check(api.summarySVG('cc-query_matrix',738,548,{level:'overview'}),738,548,true);
const large=api.summarySVG('cc-query_matrix',738,548);assert(large.includes('Formal ε range and probability omitted.'));assert(large.includes('exponential computation'));assert(large.includes('ε₀ = 1/32768'));assert(large.includes('data-axis="x"'));assert(large.includes('data-axis="y"'));
const filtered=JSON.parse(JSON.stringify(data));Object.values(filtered.sources).forEach(s=>s.publicationStatus='preprint');assert.equal(load(filtered).records({publication:'published'}).length,0);assert(load(filtered).diagramSVG({publication:'published'}).includes('No sources'));
function host(){const nodes=new Map(),events=[],classes=new Set();return{isConnected:true,events,classes,innerHTML:'',classList:{add(...s){s.forEach(x=>classes.add(x))},remove(...s){s.forEach(x=>classes.delete(x))},toggle(s,on){on?classes.add(s):classes.delete(s)}},setAttribute(){},querySelector(s){if(!nodes.has(s))nodes.set(s,{innerHTML:'',value:''});return nodes.get(s)},addEventListener(type,fn,o){events.push({type,fn,signal:o.signal})}}}
const root=host();let changed=null;api.mount(root,'cc-query_matrix',{onPublicationChange:x=>changed=x});
for(const r of data.verifiedRecords){root.events.find(e=>e.type==='click').fn({target:{closest:()=>({dataset:{ccqmResult:r.id}})}});const detail=root.querySelector('.ccqm-theorem').innerHTML;assert(detail.includes(r.theorem));assert(detail.includes(r.sourceUrl.replaceAll('&','&amp;')));assert(detail.includes(r.quality.replaceAll('<','&lt;')));}
let prevented=false;root.events.find(e=>e.type==='keydown').fn({key:'Enter',preventDefault(){prevented=true},target:{closest:()=>({dataset:{ccqmResult:announced.id}})}});assert(prevented);assert(root.querySelector('.ccqm-theorem').innerHTML.includes('Informal lower-bound announcement'));
root.events.find(e=>e.type==='change').fn({target:{value:'published',classList:{contains:()=>true}}});assert.equal(changed,'published');
api.release(root);assert(root.events.every(e=>e.signal.aborted));assert(!root.classes.has('ccqm-view'));
console.log('PASS: all original IDs, source scope, no invented pure lower curve, matched expected-error boundaries, epsilon regime, n² cap, 9 zoom geometries, source inspection, filtering, keyboard and lifecycle.');
