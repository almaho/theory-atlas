'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const data=JSON.parse(fs.readFileSync(__dirname+'/../../../data/focus/cc-dynamic.json','utf8')),patch=JSON.parse(fs.readFileSync(__dirname+'/research-patch.json','utf8')),input=JSON.parse(fs.readFileSync(__dirname+'/input-research.json','utf8')),src=fs.readFileSync(__dirname+'/../../../src/cc-dynamic.js','utf8'),css=fs.readFileSync(__dirname+'/../../../src/cc-dynamic.css','utf8');
function load(d=data){const ctx={window:{},AbortController,document:{getElementById:()=>({textContent:JSON.stringify({focus:{'cc-dynamic':d}})})}};vm.runInNewContext(src,ctx);return ctx.window.AtlasPairRenderers['cc-dynamic'];}
const api=load();for(const k of ['mount','summarySVG','diagramSVG','records','related','release'])assert.equal(typeof api[k],'function');
assert.equal(api.records().length,7);assert.equal(api.related().length,3);
assert.equal(api.records({publication:'published'}).length,7);
const ids=new Set(patch.upsertSlices.flatMap(s=>s.results.map(r=>r.id)));for(const r of input.slices.flatMap(s=>s.results))assert(ids.has(r.id),'Original IDs must survive');assert.equal(ids.size,10);
assert.equal(data.verifiedRecords.filter(r=>r.kind==='lower').length,0);assert(data.lowerBoundStatus.includes('No dynamic lower'));
assert(data.verifiedRecords.every(r=>r.evidenceStatus==='verified'));assert(data.relatedResults.find(r=>r.id==='cc-dyn-5-constant').unresolved);assert(!data.verifiedRecords.some(r=>r.id==='cc-dyn-5-constant'));
const get=id=>[...data.verifiedRecords,...data.relatedResults].find(r=>r.id===id);
assert(get('cc-dyn-adaptive-1485').probability.includes('chosen before'));assert(get('cc-dyn-adaptive-1485').probability.includes('not simultaneous'));
assert(get('cc-dyn-adaptive-o1').probability.includes('throughout'));assert(get('cc-dyn-adaptive-o1').output.includes('Implicit'));assert.equal(get('cc-dyn-adaptive-o1').factor,null);
assert.equal(get('cc-dyn-modifiedpivot-sub3').factor,2.997);assert.equal(get('cc-dyn-modifiedpivot-sub3').sourceDiscrepancy.headline,2.99);assert(get('cc-dyn-modifiedpivot-sub3').bound.includes('expected'));
assert(get('cc-dyn-pruned-3plus').assumptions.some(s=>s.includes('allocation')));assert(get('cc-dyn-pruned-3plus').updateGuarantee.includes('amortized without'));
assert(get('cc-dyn-node-polylog').bound.includes('expected amortized'));assert(get('cc-dyn-node-polylog').output.includes('Θ(n)'));assert(get('cc-dyn-node-polylog').assumptions.some(s=>s.includes('Random deletion')));
assert(get('cc-dyn-node-20').adversary.includes('fixed in advance'));assert(get('cc-dyn-node-20').probability.includes('Expected approximation'));assert(get('cc-dyn-node-20').bound.includes('high probability'));assert(get('cc-dyn-node-20').notes.includes('not ordinary random deletions'));
assert.deepEqual(data.figureAxes['adaptive-fixed'].x,data.figureAxes['oblivious-expected'].x);assert.equal(data.sharedAxes.y,false);assert.equal(data.sharedAxes.epsilonReference,.25);
for(const [panel,ax] of Object.entries(data.figureAxes))for(const dim of ['x','y']){const a=ax[dim];assert(a.label);if(a.categories)assert(new Set(a.categories.map(c=>c.id||c)).size===a.categories.length);else{assert.equal(a.min,a.ticks[0]);assert.equal(a.max,a.ticks.at(-1));}}
for(const r of data.verifiedRecords){assert(data.figureAxes[r.panel]);for(const k of ['quality','graph','oracle','output','probability','theorem','adversary','updateGuarantee'])assert(r[k],r.id+': '+k);}
assert(patch.upsertSlices.every(s=>s.results.every(r=>r.plot===null)),'Remove original exponent-zero plotting artifacts');
assert(css.includes('--ccd-oblivious:light-dark('));assert(css.includes('--ccd-sequence:light-dark('));assert(!css.includes('var(--purple)'));
function check(svg,w,h,mode){
 assert(!/NaN|Infinity|undefined/.test(svg));assert(svg.includes('preserveAspectRatio="xMidYMid meet"'));assert(svg.includes('var(--green)'));assert(!svg.includes('data-marker="lower"'));
 for(const m of svg.matchAll(/data-marker="algorithm" data-factor="([^"]+)" data-center-x="([^"]+)" data-center-y="([^"]+)"/g)){assert(+m[1]>=1&&+m[1]<=4);assert(+m[2]>=7&&+m[2]<=w-7);assert(+m[3]>=7&&+m[3]<=h-7);}
 if(mode==='overview')assert(!/<text/.test(svg),'Tiny mode must remove text');
 if(mode==='detail'){assert.equal((svg.match(/data-panel="/g)||[]).length,3);assert.equal((svg.match(/data-axis-x-min="1" data-axis-x-max="4"/g)||[]).length,2);assert.equal((svg.match(/data-marker="algorithm"/g)||[]).length,6);assert(svg.includes('data-symbolic-factor="true"'));assert(svg.includes('No verified dynamic lower'));assert(svg.includes('data-axis="x"'));assert(svg.includes('data-axis="y"'));assert(svg.includes('ε = ¼'));assert(svg.includes('preselected'));assert(svg.includes('polynomial update sequence'));}
 if(mode==='compact')assert.equal((svg.match(/data-marker="algorithm"/g)||[]).length,3,'Zoom reduction retains key bounds only');
}
check(api.diagramSVG(),1000,650,'detail');
for(const [w,h] of [[160,90],[250,150],[299,700],[800,150],[330,245],[500,260],[650,500],[738,548],[1000,800]]){const mode=w<300||h<210?'overview':w<650||h<500?'compact':'detail';check(api.summarySVG('cc-dynamic',w,h),w,h,mode);}
check(api.summarySVG('cc-dynamic',738,548,{level:'overview'}),738,548,'overview');
const svg=api.diagramSVG();for(const r of data.verifiedRecords.filter(r=>r.factor!==null)){const start=svg.indexOf('data-ccd-result="'+r.id+'"');assert(start>=0);const group=svg.slice(start,svg.indexOf('</g>',start));const m=group.match(/data-factor="([^"]+)" data-center-x="([^"]+)"/);assert(m);const f=r.factorExpression?3.25:r.factor;assert.equal(+m[1],f);const x0=r.setup==='adaptive-fixed'?24:515,pw=461,l=x0+pw*.42,right=x0+pw-15;assert(Math.abs(+m[2]-(l+(f-1)/3*(right-l)))<1e-8);}
const amended=JSON.parse(JSON.stringify(data));amended.sharedAxes.epsilonReference=.5;assert(load(amended).diagramSVG().includes('data-factor="3.5"'),'Parameterized placement follows reference, not unexplained fixed point');
const filtered=JSON.parse(JSON.stringify(data));Object.values(filtered.sources).forEach(s=>s.publicationStatus='preprint');assert.equal(load(filtered).records({publication:'published'}).length,0);assert(load(filtered).diagramSVG({publication:'published'}).includes('No sources'));
function host(){const nodes=new Map(),events=[],classes=new Set();return{isConnected:true,events,classes,innerHTML:'',classList:{add(...s){s.forEach(x=>classes.add(x))},remove(...s){s.forEach(x=>classes.delete(x))},toggle(s,on){on?classes.add(s):classes.delete(s)}},setAttribute(){},querySelector(s){if(!nodes.has(s))nodes.set(s,{innerHTML:'',value:''});return nodes.get(s)},addEventListener(type,fn,o){events.push({type,fn,signal:o.signal})}}}
const root=host();let changed=null;api.mount(root,'cc-dynamic',{onPublicationChange:x=>changed=x});assert(root.innerHTML.includes('Related update models'));
for(const r of [...data.verifiedRecords,...data.relatedResults]){root.events.find(e=>e.type==='click').fn({target:{closest:()=>({dataset:{ccdResult:r.id}})}});const detail=root.querySelector('.ccd-theorem').innerHTML;assert(detail.includes(r.theorem));assert(detail.includes(r.sourceUrl.replace(/&/g,'&amp;')));assert(detail.includes(r.quality));if(r.unresolved)assert(detail.includes('Scope not fully verified'));}
let prevented=false;root.events.find(e=>e.type==='keydown').fn({key:'Enter',preventDefault(){prevented=true},target:{closest:()=>({dataset:{ccdResult:data.verifiedRecords[0].id}})}});assert(prevented);
root.events.find(e=>e.type==='change').fn({target:{value:'published',classList:{contains:()=>true}}});assert.equal(changed,'published');api.release(root);assert(root.events.every(e=>e.signal.aborted));assert(!root.classes.has('ccd-view'));
console.log('PASS: ten original IDs; seven verified main bounds and three related records; fixed-time/sequence/expectation separation; conservative factor correction; node output/runtime scope; symbolic cost axes; epsilon positions; nine zoom geometries; all source inspection, filters, keyboard and lifecycle.');
