'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const data=JSON.parse(fs.readFileSync(__dirname+'/../../../data/focus/mis-query-list.json','utf8')),patch=JSON.parse(fs.readFileSync(__dirname+'/research-patch.json','utf8')),input=JSON.parse(fs.readFileSync(__dirname+'/input-research.json','utf8')),src=fs.readFileSync(__dirname+'/../../../src/mis-query-list.js','utf8');
function load(d=data){const ctx={window:{},AbortController,document:{getElementById:()=>({textContent:JSON.stringify({focus:{'mis-query_list':d}})})}};vm.runInNewContext(src,ctx);return ctx.window.AtlasPairRenderers['mis-query_list'];}
const api=load();for(const k of ['mount','summarySVG','diagramSVG','records','release'])assert.equal(typeof api[k],'function');
assert.equal(api.records().length,2);assert.equal(api.records({publication:'published'}).length,2);
assert.deepEqual(patch.upsertSlices.flatMap(s=>s.results.map(r=>r.id)).sort(),input.slices.flatMap(s=>s.results.map(r=>r.id)).sort());
assert.equal(data.verifiedRecords.filter(r=>r.kind==='lower').length,1);
for(const r of data.verifiedRecords){assert.equal(r.resource,'Total computation time, including input access and explicit output');assert(r.assumptions.some(a=>a.includes('1 ≤ β ≤ Δ < n')));assert.equal(r.curve.timeExponent,'1+a');assert.equal(r.conditional,false);assert(r.sourceUrl.includes('#page='));}
assert(data.verifiedRecords.find(r=>r.kind==='algorithm').notes.includes('O(n(1+β))'));
assert(data.verifiedRecords.find(r=>r.kind==='lower').probability.includes('does not give a numerical'));
assert.equal(data.figureAxes.neighborhood.x.parameter,'β = Θ(n^a)');
assert.equal(data.figureAxes.neighborhood.y.relation,'nβ = Θ(n^(1+a))');
function check(svg,w,h,tiny=false){
 assert(!/NaN|Infinity|undefined/.test(svg));assert(svg.includes('preserveAspectRatio="xMidYMid meet"'));assert(svg.includes('var(--green)')&&svg.includes('var(--red)'));assert(!/<rect/.test(svg));
 const lines=[...svg.matchAll(/data-boundary="n-beta" d="([^"]+)"/g)].map(x=>x[1]);assert.equal(lines.length,2);assert.equal(lines[0],lines[1],'Bounds must occupy the same exact curve');
 const markers=[...svg.matchAll(/data-marker="([^"]+)" data-center-x="([^"]+)" data-center-y="([^"]+)"/g)];assert.equal(markers.length,6);
 for(const m of markers){assert(+m[2]>=0&&+m[2]<=w);assert(+m[3]>=0&&+m[3]<=h)}
 for(let i=0;i<3;i++){assert.equal(markers[i][2],markers[i+3][2]);assert.equal(markers[i][3],markers[i+3][3])}
 if(tiny)assert(!/<text/.test(svg));
}
check(api.diagramSVG(),1000,540);
for(const [w,h] of [[180,110],[180,548],[500,110],[220,140],[330,245],[500,260],[738,548],[1000,800]])check(api.summarySVG('mis-query_list',w,h),w,h,w<220||h<140);
check(api.summarySVG('mis-query_list',738,548,{level:'overview'}),738,548,true);
assert(api.summarySVG('mis-query_list',738,548).includes('data-axis="x"'));assert(api.summarySVG('mis-query_list',738,548).includes('data-axis="y"'));
const filtered=JSON.parse(JSON.stringify(data));Object.values(filtered.sources).forEach(s=>s.publicationStatus='preprint');assert.equal(load(filtered).records({publication:'published'}).length,0);assert(load(filtered).diagramSVG({publication:'published'}).includes('No sources'));
function host(){const nodes=new Map(),events=[],classes=new Set();return{isConnected:true,events,classes,innerHTML:'',classList:{add(...s){s.forEach(x=>classes.add(x))},remove(...s){s.forEach(x=>classes.delete(x))},toggle(s,on){on?classes.add(s):classes.delete(s)}},setAttribute(){},querySelector(s){if(!nodes.has(s))nodes.set(s,{innerHTML:'',value:''});return nodes.get(s)},addEventListener(type,fn,o){events.push({type,fn,signal:o.signal})}}}
const root=host();let changed=null;api.mount(root,'mis-query_list',{onPublicationChange:x=>changed=x});
for(const r of data.verifiedRecords){root.events.find(e=>e.type==='click').fn({target:{closest:()=>({dataset:{miqlResult:r.id}})}});assert(root.querySelector('.miql-theorem').innerHTML.includes(r.theorem));assert(root.querySelector('.miql-theorem').innerHTML.includes(r.sourceUrl));}
let prevented=false;root.events.find(e=>e.type==='keydown').fn({key:'Enter',preventDefault(){prevented=true},target:{closest:()=>({dataset:{miqlResult:data.verifiedRecords[0].id}})}});assert(prevented);
root.events.find(e=>e.type==='change').fn({target:{value:'published',classList:{contains:()=>true}}});assert.equal(changed,'published');api.release(root);assert(root.events.every(e=>e.signal.aborted));assert(!root.classes.has('miql-view'));
console.log('PASS: two original bounds, exact shared curve, beta range/empty graph scope, source inspection, publication filter, keyboard/callback/release, eight zoom geometries.');
