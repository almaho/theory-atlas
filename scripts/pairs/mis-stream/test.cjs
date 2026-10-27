'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const data=JSON.parse(fs.readFileSync(__dirname+'/../../../data/focus/mis-stream.json','utf8'));
const original=JSON.parse(fs.readFileSync(__dirname+'/input-research.json','utf8'));
const patch=JSON.parse(fs.readFileSync(__dirname+'/research-patch.json','utf8'));
function load(focus=data){const ctx={window:{},document:{getElementById(){return {textContent:JSON.stringify({focus:{'mis-stream':focus}})}}},AbortController,Set};vm.runInNewContext(fs.readFileSync(__dirname+'/../../../src/mis-stream.js','utf8'),ctx);return ctx.window.AtlasPairRenderers['mis-stream'];}
const api=load();assert.strictEqual(api.records().length,9);
for(const s of original.slices)for(const r of s.results){assert(patch.upsertSlices.find(t=>t.id===s.id).results.some(t=>t.id===r.id),'Input result lost: '+r.id);assert([...data.verifiedRecords,...data.relatedResults].some(t=>t.id===r.id),'Input result missing from inspection');}
for(const r of data.verifiedRecords){for(const key of ['quality','graph','output','probability','theorem','space','passes','arrival'])assert(r[key],r.id+' missing '+key);const panel=data.figureAxes[r.panel];assert(panel.x.categories.some(c=>c.id===r.xCategory));assert(panel.y.categories.some(c=>c.id===r.yCategory));}
const semi=data.verifiedRecords.filter(r=>r.panel==='semi');assert(semi.some(r=>r.kind==='upper'));assert(semi.some(r=>r.kind==='lower'));assert(semi.every(r=>r.yCategory==='loglog'));
const edge=data.verifiedRecords.filter(r=>r.panel==='one'&&r.xCategory==='edge');assert(edge.some(r=>r.kind==='upper'));assert(edge.some(r=>r.kind==='lower'));assert(edge.every(r=>r.yCategory==='quadratic'));
assert(!data.verifiedRecords.some(r=>r.xCategory==='vertex'&&r.kind==='lower'),'Invented vertex lower bound');
assert(data.verifiedRecords.filter(r=>r.panel==='lex').every(r=>/Lexicographically/.test(r.output)));
assert(/2\^p−1/.test(data.verifiedRecords.find(r=>r.panel==='tradeoff'&&r.kind==='lower').exactBound));
const focused=api.diagramSVG();assert.strictEqual((focused.match(/data-mis-stream-result=/g)||[]).length,9);assert(!/NaN|Infinity|undefined/.test(focused));assert(focused.includes('data-axis="x"'));assert(focused.includes('data-axis="y"'));assert(!/<rect/.test(focused));
for(const [w,h] of [[180,110],[110,280],[450,90],[220,140],[330,245],[500,260],[738,548],[1000,800]]){const svg=api.summarySVG('mis-stream',w,h);assert(!/NaN|Infinity|undefined/.test(svg));assert(!/<rect/.test(svg));for(const m of svg.matchAll(/data-center-x="([\d.]+)" data-center-y="([\d.]+)"/g)){const x=+m[1],y=+m[2];assert(x>=0&&x<=w&&y>=0&&y<=h,`Outside ${w}×${h}: ${x},${y}`)}if(w<220||h<140)assert(!/<text/.test(svg),'Overview text must vanish');if(w>=650&&h>=420){assert(svg.includes('data-axis="x"'));assert(svg.includes('data-axis="y"'));assert(svg.includes('baseline-shift="super"'));}}
assert(!/<text/.test(api.summarySVG('mis-stream',738,548,{level:'overview'})),'Explicit semantic downgrade');
const privateData=JSON.parse(JSON.stringify(data));privateData.sources['assadi-et-al-2024-stream-mis'].publicationStatus='preprint';const filtered=load(privateData);assert.strictEqual(filtered.records({publication:'published'}).length,7);assert(!filtered.diagramSVG({publication:'published'}).includes('mis-stream-assadi-et-al-lower'));assert(filtered.diagramSVG({publication:'published'}).includes('mis-stream-cormode-2019-onepass'));
function host(){const classes=new Set(),children=new Map(),listeners={};return {isConnected:true,innerHTML:'',classList:{add(...xs){xs.forEach(x=>classes.add(x))},remove(...xs){xs.forEach(x=>classes.delete(x))},toggle(x,on){on?classes.add(x):classes.delete(x)}},setAttribute(){},querySelector(sel){if(!children.has(sel))children.set(sel,{innerHTML:'',value:''});return children.get(sel)},addEventListener(name,fn,opts){listeners[name]={fn,signal:opts.signal}},children,listeners,classes};}
const root=host();let publicationChanged=null;const instance=api.mount(root,'mis-stream-lexicographic-first',{onPublicationChange:x=>publicationChanged=x});assert(root.querySelector('.mis-stream-theorem').innerHTML.includes('Lexicographically first'));assert(root.querySelector('.mis-stream-evidence-list').innerHTML.includes('historical'));
root.listeners.click.fn({target:{closest(){return {dataset:{misStreamResult:'mis-stream-cormode-vertex-greedy'}}}}});assert(root.querySelector('.mis-stream-theorem').innerHTML.includes('Explicit vertex arrival'));
root.listeners.change.fn({target:{value:'published',classList:{contains:c=>c==='mis-stream-publication'}}});assert.strictEqual(publicationChanged,'published');
const signal=root.listeners.click.signal;api.release(root);assert(signal.aborted);assert(!root.classes.has('mis-stream-view'));
console.log('MIS streaming tests passed: all 7 inputs preserved; 9 core / 1 historical, scope, publication, inspection, lifecycle, and 8 zoom geometries.');

// Regression: the simplified o(1) exponent is shown only for fixed p.
assert.strictEqual(data.figureAxes.tradeoff.x.categories[0].label,'fixed p ≥ 1');
assert.strictEqual(data.figureAxes.lex.x.categories[0].label,'p ≥ 1');
assert(api.diagramSVG().includes('fixed p ≥ 1'));
assert(api.summarySVG('mis-stream',738,548).includes('fixed p ≥ 1'));
const auditedTradeoff=patch.upsertSlices.find(s=>s.id==='mis-stream-p-pass-tradeoff');
assert.strictEqual(auditedTradeoff.figureAxes.x.categories[0].label,'fixed p ≥ 1');
assert.strictEqual(auditedTradeoff.xAxis.categories[0].label,'fixed p ≥ 1');
