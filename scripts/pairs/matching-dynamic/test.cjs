'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path'),dir=__dirname;
const data=JSON.parse(fs.readFileSync(path.join(dir,'../../../data/focus/matching-dynamic-more.json'),'utf8')),input=JSON.parse(fs.readFileSync(path.join(dir,'input-research.json'),'utf8')),patch=JSON.parse(fs.readFileSync(path.join(dir,'research-patch.json'),'utf8'));
const window={},context={window,document:{getElementById:()=>({textContent:JSON.stringify({focus:{'matching-dynamic':data}})})},AbortController,Set};
vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(dir,'../../../src/dynamic-more.js'),'utf8'),context);const R=window.AtlasPairRenderers['matching-dynamic'];
assert.equal(R.records().length,11);assert.equal(patch.upsertSlices.length,5);assert.equal(data.panels.length,5);
for(const r of input.slices.flatMap(s=>s.results))assert(patch.upsertSlices.some(s=>s.results.some(v=>v.id===r.id)),'Every original record must be preserved');
for(const r of R.records())for(const k of ['bound','quality','output','graph','adversary','clock','probability','recourse','theorem','fullTextUrl'])assert(r[k],`${r.id}: missing ${k}`);
assert.equal(R.records().find(r=>r.id==='matching-dynamic-charikar-solomon18').adversary,'Oblivious');
assert.equal(R.records().find(r=>r.id==='matching-dynamic-bhn16').clock,'Amortized');
assert(R.records().find(r=>r.id==='matching-dynamic-gupta-peng-13').displayBound.includes('√m'));
assert(R.records().find(r=>r.id==='matching-dynamic-maximal-cks26').displayBound.includes('o(1)'));
assert.equal(R.records().find(r=>r.id==='matching-dynamic-maximal-cks26-randomized').displayBound,'Õ(√n)');
assert(patch.upsertSlices.every(s=>s.results.every(r=>r.plot===null)));
assert.equal(R.records().filter(r=>r.kind==='lower').length,0,'Never invent a lower bound');
assert(data.lowerBoundStatus.includes('No lower-bound theorem'));
const whole=R.diagramSVG();assert.equal((whole.match(/data-marker="algorithm"/g)||[]).length,11);assert.equal((whole.match(/data-panel=/g)||[]).length,5);assert(!/NaN|undefined/.test(whole));
for(const [w,h] of [[90,55],[180,110],[330,245],[500,260],[738,548],[1100,850]]){
 const svg=R.summarySVG('matching-dynamic',w,h);assert(!/NaN|undefined/.test(svg));assert.equal((svg.match(/data-panel=/g)||[]).length,5);
 const centers=[...svg.matchAll(/data-center-x="([\d.]+)" data-center-y="([\d.]+)"/g)].map(m=>[+m[1],+m[2]]);
 for(const [x,y] of centers)assert(x>=2.8&&x<=w-2.8&&y>=2.8&&y<=h-2.8,`Marker clipped at ${w}×${h}: ${x},${y}`);
 for(let i=0;i<centers.length;i++)for(let j=i+1;j<centers.length;j++)assert(Math.hypot(centers[i][0]-centers[j][0],centers[i][1]-centers[j][1])>5.6,`Markers collide at ${w}×${h}`);
 if(w<220||h<140){assert(!/<text\b/.test(svg),'Overview hides annotations');assert.equal(centers.length,5,'Overview simplifies to one representative per regime');}
 if(w>=620&&h>=430){assert(svg.includes('ORS'));assert(svg.includes('√m'));assert(svg.includes('Oblivious')||svg.includes('oblivious'));}
}
assert.equal(R.records({yearCutoff:2018}).length,5);assert(!R.diagramSVG({yearCutoff:2018}).includes('CKS'));assert.equal(R.records({publication:'published'}).length,11);
const filteredData=JSON.parse(JSON.stringify(data));filteredData.sources['chuzhoy-khanna-song-2026-maximal'].publicationStatus='preprint';
const filterContext={window:{},document:{getElementById:()=>({textContent:JSON.stringify({focus:{'matching-dynamic':filteredData}})})},AbortController,Set};vm.createContext(filterContext);vm.runInContext(fs.readFileSync(path.join(dir,'../../../src/dynamic-more.js'),'utf8'),filterContext);assert.equal(filterContext.window.AtlasPairRenderers['matching-dynamic'].records({publication:'published'}).length,9,'Publication filter excludes both records of an unpublished source');
let releaseCalls=0;window.DynamicMatching={release:()=>releaseCalls++};const hosts={},listeners={},classes=new Set();
const root={isConnected:true,innerHTML:'',classList:{add(...xs){xs.forEach(x=>classes.add(x));},remove(...xs){xs.forEach(x=>classes.delete(x));},toggle(x,v){v?classes.add(x):classes.delete(x);}},setAttribute(){},querySelector(q){return hosts[q]||(hosts[q]={innerHTML:'',value:''});},addEventListener(type,fn,o){listeners[type]={fn,signal:o.signal};}};
let changed;const instance=R.mount(root,'matching-dynamic',{onPublicationChange:v=>changed=v});assert.equal(releaseCalls,1);assert(root.innerHTML.includes('Scope of the evidence'));assert(hosts['.pair-matching-dynamic-theorem'].innerHTML.includes('AKK'));
for(const r of R.records()){listeners.click.fn({target:{closest:()=>({dataset:{matchingDynamicResult:r.id}})}});assert(hosts['.pair-matching-dynamic-theorem'].innerHTML.includes(r.shortLabel));}
listeners.change.fn({target:{classList:{contains:()=>true},value:'published'}});assert.equal(changed,'published');const signal=listeners.click.signal;instance.destroy();assert(signal.aborted);assert(!classes.has('pair-matching-dynamic-view'));
console.log('PASS: 11 theorem records; 5 scoped facets; preserved inputs; exact m/ORS/clock/adversary metadata; 6 geometry sizes; semantic zoom; filters; inspection; cleanup.');
