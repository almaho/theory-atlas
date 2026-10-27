'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const data=JSON.parse(fs.readFileSync(__dirname+'/../../../data/focus/mis-local.json','utf8'));
const original=JSON.parse(fs.readFileSync(__dirname+'/input-research.json','utf8'));
const patch=JSON.parse(fs.readFileSync(__dirname+'/research-patch.json','utf8'));
function load(focus=data){const ctx={window:{},document:{getElementById(){return{textContent:JSON.stringify({focus:{'mis-local':focus}})}}},AbortController,Set};vm.runInNewContext(fs.readFileSync(__dirname+'/../../../src/mis-local.js','utf8'),ctx);return ctx.window.AtlasPairRenderers['mis-local']}
const api=load(),all=[...data.verifiedRecords,...data.relatedResults];
assert.strictEqual(api.records().length,12);assert.strictEqual(all.length,14);
for(const s of original.slices)for(const r of s.results){assert(patch.upsertSlices.find(t=>t.id===s.id).results.some(t=>t.id===r.id),'Lost supplied result '+r.id);assert(all.some(t=>t.id===r.id),'No inspection for '+r.id)}
for(const r of data.verifiedRecords){const p=data.figureAxes[r.panel];assert(p);for(const [dim,field] of [['x','xCategory'],['y','yCategory']])assert(p[dim].categories.some(c=>c.id===r[field]));for(const k of ['graph','output','quality','probability','theorem','resourceModel','exactBound'])assert(r[k],r.id+': '+k);if(r.rangeFrom){const names=p.y.categories.map(c=>c.id);assert(names.indexOf(r.rangeFrom)<names.indexOf(r.rangeTo));assert.equal(r.yCategory,r.rangeTo)}}
const det=data.verifiedRecords.filter(r=>r.xCategory==='det'),rand=data.verifiedRecords.filter(r=>r.xCategory==='rand'),degree=data.verifiedRecords.filter(r=>r.xCategory==='degree');
for(const group of [det,rand,degree]){assert(group.some(r=>r.kind==='upper'));assert(group.some(r=>r.kind==='lower'))}
assert.deepStrictEqual(Object.keys(data.figureAxes),['elapsed']);
const sleeping=data.verifiedRecords.filter(r=>r.xCategory==='sleep');assert.equal(sleeping.length,4);assert(sleeping.every(r=>r.panel==='elapsed'&&r.kind==='upper'&&r.awake&&r.elapsed&&r.bound===r.elapsed&&r.resourceModel.includes('CONGEST')));
assert(!data.verifiedRecords.some(r=>r.panel==='energy'));assert.equal(data.figureAxes.elapsed.y.categories.filter(c=>c.id==='log2').length,1);
assert(all.find(r=>r.id==='mis-local-ghaffari-2016-global').historical);
assert(all.find(r=>r.id==='mis-local-dufoulon-awake').elapsed.includes('log^7'));
assert.equal(data.sources['ghaffari-portmann-2023-awake'].publicationStatus,'conference');
assert.equal(data.sources['dufoulon-moses-pandurangan-2023-awake'].publicationStatus,'journal');
const source=fs.readFileSync(__dirname+'/../../../src/mis-local.js','utf8'),focused=api.diagramSVG();
assert.equal((focused.match(/data-mis-local-result=/g)||[]).length,12);
assert.equal((focused.match(/data-range-from=/g)||[]).length,3);
assert(focused.includes('expected-time lower'));assert(focused.includes('data-axis="x"'));assert(focused.includes('data-axis="y"'));
assert(!focused.includes('data-panel="energy"'));assert(!focused.includes('Y · maximum awake'));assert(focused.includes('Sleeping CONGEST'));assert(focused.includes('Õ(L'));assert(!/<rect/.test(focused));assert(!/NaN|Infinity|undefined/.test(focused));
for(const [w,h] of [[180,110],[110,280],[450,90],[220,140],[330,245],[500,260],[738,548],[1000,800]]){
 const svg=api.summarySVG('mis-local',w,h);
 assert(!/NaN|Infinity|undefined/.test(svg));
 for(const m of svg.matchAll(/class="mis-local-axis" d="M[\d.]+ ([\d.]+)V([\d.]+)/g))assert(+m[1]<=+m[2],'Axis direction inverted');
 for(const m of svg.matchAll(/data-center-x="([\d.]+)" data-center-y="([\d.]+)"/g)){const x=+m[1],y=+m[2];assert(x>=0&&x<=w&&y>=0&&y<=h,'Outside '+w+'×'+h+': '+x+','+y)}
 if(w<220||h<140)assert(!/<text/.test(svg),'Overview should hide annotations');
 if(w>=650&&h>=420){assert(svg.includes('data-axis="x"'));assert(svg.includes('data-axis="y"'));assert(svg.includes('poly(ℓ)'))}
}
assert(!/<text/.test(api.summarySVG('mis-local',738,548,{level:'overview'})));
const d=JSON.parse(JSON.stringify(data));d.sources['ghaffari-portmann-2023-awake'].publicationStatus='preprint';const filtered=load(d);
assert.equal(filtered.records({publication:'published'}).length,10);assert(!filtered.diagramSVG({publication:'published'}).includes('mis-local-ghaffari-portmann-awake'));assert(filtered.diagramSVG({publication:'published'}).includes('mis-local-dufoulon-awake'));
function host(){const classes=new Set(),children=new Map(),listeners={};return{isConnected:true,innerHTML:'',classList:{add(...xs){xs.forEach(x=>classes.add(x))},remove(...xs){xs.forEach(x=>classes.delete(x))},toggle(x,on){on?classes.add(x):classes.delete(x)}},setAttribute(){},querySelector(sel){if(!children.has(sel))children.set(sel,{innerHTML:'',value:''});return children.get(sel)},addEventListener(name,fn,o){listeners[name]={fn,signal:o.signal}},classes,listeners}}
const root=host();let pub=null;api.mount(root,'mis-local-awake',{onPublicationChange:x=>pub=x});
assert(root.querySelector('.mis-local-theorem').innerHTML.includes('PODC 2023'));assert(root.querySelector('.mis-local-theorem').innerHTML.includes('Secondary theorem detail'));assert(root.querySelector('.mis-local-theorem').innerHTML.includes('not a plotted cost'));
root.listeners.click.fn({target:{closest(){return{dataset:{misLocalResult:'mis-local-kmw-general-lower'}}}}});assert(root.querySelector('.mis-local-theorem').innerHTML.includes('Expected-time'));
let prevented=false;root.listeners.keydown.fn({key:'Enter',preventDefault(){prevented=true},target:{closest(){return{dataset:{misLocalResult:'mis-local-ghaffari-grunau-2024'}}}}});assert(prevented);assert(root.querySelector('.mis-local-theorem').innerHTML.includes('Theorem 1.3'));
root.listeners.change.fn({target:{value:'published',classList:{contains:c=>c==='mis-local-publication'}}});assert.equal(pub,'published');
const signal=root.listeners.click.signal;api.release(root);assert(signal.aborted);assert(!root.classes.has('mis-local-view'));
console.log('MIS LOCAL tests passed: 11 supplied records preserved, 12 plotted / 2 related, three scoped upper/lower comparisons, degree ranges, single elapsed-round axis, sleeping contracts, publication filtering, inspection, keyboard, lifecycle, 8 zoom sizes.');
