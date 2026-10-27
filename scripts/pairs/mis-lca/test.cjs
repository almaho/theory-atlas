'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const installed=fs.existsSync(path.join(__dirname,'../../../data/focus/mis-lca.json'));
const data=JSON.parse(fs.readFileSync(installed?path.join(__dirname,'../../../data/focus/mis-lca.json'):path.join(__dirname,'focus.json'),'utf8'));
const original=JSON.parse(fs.readFileSync(path.join(__dirname,'input-research.json'),'utf8'));
const patch=JSON.parse(fs.readFileSync(path.join(__dirname,'research-patch.json'),'utf8'));
const source=fs.readFileSync(installed?path.join(__dirname,'../../../src/mis-lca.js'):path.join(__dirname,'renderer.js'),'utf8');
const ctx={window:{},document:{getElementById(){return{textContent:JSON.stringify({focus:{'mis-lca':data}})}}},AbortController,Set};vm.runInNewContext(source,ctx);const api=ctx.window.AtlasPairRenderers['mis-lca'];
assert.equal(api.records().length,9);assert.equal(api.records({key:'mis-lca'}).length,9);
for(const s of original.slices)for(const r of s.results){assert(patch.upsertSlices.find(t=>t.id===s.id).results.some(t=>t.id===r.id),'Lost original record '+r.id);assert([...data.verifiedRecords,...data.relatedResults].some(t=>t.id===r.id));}
for(const r of data.verifiedRecords){const p=data.figureAxes[r.panel];assert(p.x.categories.some(c=>c.id===r.costTo));assert(p.y.categories.some(c=>c.id===r.id));for(const k of ['graph','oracle','probability','output','theorem','resource','assumptions'])assert(r[k],r.id+' '+k)}
const lower=data.verifiedRecords.filter(r=>r.kind==='lower');assert.equal(lower.length,1);assert.equal(lower[0].setup,'deterministic');assert(/query-order.oblivious/i.test(lower[0].adaptivity));assert(!data.verifiedRecords.find(r=>r.id==='mis-lca-even-2018-det').assumptions.some(a=>/random tape/.test(a)));
assert(data.verifiedRecords.filter(r=>r.setup==='deterministic').every(r=>r.costTo==='logstar'));
assert(data.verifiedRecords.some(r=>r.id==='mis-lca-ghaffari-polydeg-expected'&&/Expected/.test(r.resource)));
for(const key of ['mis-lca','mis-lca-fixed','mis-lca-generator']){const svg=api.diagramSVG(key);assert(!/NaN|Infinity|undefined/.test(svg));assert(svg.includes('data-axis="x"'));assert(svg.includes('symbolic growth classes'));assert(!/<rect/.test(svg));assert.equal((svg.match(/data-mis-lca-result=/g)||[]).length,9);
 for(const [w,h] of [[180,110],[110,280],[450,90],[220,140],[330,245],[500,260],[738,548],[1000,800]]){const s=api.summarySVG(key,w,h);assert(!/NaN|Infinity|undefined/.test(s));for(const m of s.matchAll(/data-center-x="([\d.]+)" data-center-y="([\d.]+)"/g))assert(+m[1]>=0&&+m[1]<=w&&+m[2]>=0&&+m[2]<=h,`${key} outside ${w},${h}`);if(w<220||h<140)assert(!/<text/.test(s));if(w>=650&&h>=420)assert(s.includes('data-axis="x"'))}
 assert(!/<text/.test(api.summarySVG(key,738,548,{level:'overview'})));
}
assert(!api.diagramSVG('mis-lca').includes('data-panel="generator"'));assert(!api.diagramSVG().includes('data-mis-lca-result="mis-lca-biswas-2025-generator"'));
assert.equal(api.records({publication:'published'}).length,9);assert(data.relatedResults.some(r=>r.panel==='generator'));assert.equal((api.diagramSVG().match(/data-cost-range=/g)||[]).length,5);
function host(){const classes=new Set(),children=new Map(),listeners={};return{isConnected:true,innerHTML:'',classList:{add(...xs){xs.forEach(x=>classes.add(x))},remove(...xs){xs.forEach(x=>classes.delete(x))},toggle(x,on){on?classes.add(x):classes.delete(x)}},setAttribute(){},querySelector(s){if(!children.has(s))children.set(s,{innerHTML:'',value:''});return children.get(s)},addEventListener(n,fn,o){listeners[n]={fn,signal:o.signal}},children,listeners,classes}}
const root=host();let changed;api.mount(root,'mis-lca',{onPublicationChange:v=>changed=v});assert(root.querySelector('.mlca-theorem').innerHTML.includes('Ghaffari 2022'));
for(const r of [...data.verifiedRecords.filter(r=>r.panel!=='generator'),...data.relatedResults]){root.listeners.click.fn({target:{closest:()=>({dataset:{misLcaResult:r.id}})}});assert(root.querySelector('.mlca-theorem').innerHTML.includes(r.theorem))}
root.listeners.keydown.fn({key:'Enter',preventDefault(){},target:{closest:()=>({dataset:{misLcaResult:lower[0].id}})}});assert(root.querySelector('.mlca-theorem').innerHTML.includes('Lower-bound theorem'));
const signal=root.listeners.click.signal;api.release(root);assert(signal.aborted);assert(!root.classes.has('mis-lca-view'));
api.mount(root,'mis-lca-generator',{onPublicationChange:v=>changed=v});root.listeners.change.fn({target:{value:'published',classList:{contains:c=>c==='mlca-publication'}}});assert.equal(changed,'published');assert(!root.querySelector('.mlca-related').innerHTML.includes('jointly generate'));assert(root.querySelector('.mlca-theorem').innerHTML.includes('Ghaffari'));api.release(root);
console.log('MIS LCA passed: 8 original results + scoped lower bound; one cost axis; setup colors/degree ranges; related generator card; exact scope, expectation, filters, inspection, keyboard, lifecycle and 8 zoom geometries.');

assert(api.diagramSVG().includes('Expected probes'));assert(api.diagramSVG().includes('Variable Δ'));assert(api.diagramSVG().includes('data-cost-range="mis-lca-ghaffari-polydeg"'));assert(!api.diagramSVG().includes('Graph edges + MIS membership'));
