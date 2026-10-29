'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');
const dir=__dirname,read=n=>fs.readFileSync(path.join(dir,n),'utf8'),d=JSON.parse(read('../../../data/focus/vertex-dynamic.json')),patch=JSON.parse(read('research-patch.json')),registration=JSON.parse(read('registration.json')),src=read('../../../src/vertex-dynamic.js'),css=read('../../../src/vertex-dynamic.css');
const ids=['vertex-dynamic-adaptive-flin-2025','vertex-dynamic-adaptive-brw-2025','vertex-dynamic-oblivious-constant-2022','vertex-result-19','vertex-extended-vertex-dynamic-oblivious-delta-plus-one-12','vertex-extended-vertex-dynamic-oblivious-delta-plus-one-13','vertex-result-22'],by=id=>d.verifiedRecords.find(r=>r.id===id);
assert.equal(d.verifiedRecords.length,8);assert.equal(Object.keys(d.sources).length,7);assert.equal(d.relatedResults.length,1);
assert.equal(patch.upsertPapers.length,7);assert.equal(patch.upsertSlices.length,3);assert(!patch.papers&&!patch.slices);assert(!registration.pointFields);
for(const id of ids){assert(by(id));assert.equal(patch.upsertSlices.flatMap(s=>s.results).filter(r=>r.id===id).length,1);}
for(const r of d.verifiedRecords){assert.equal(r.panel,'time');assert.equal(r.kind,'algorithm');assert.equal(r.originalIds.length,1);assert(!r.plot);assert(r.sourceUrl.startsWith('https://'));for(const k of ['quality','output','graph','theorem','probability','amortization','adversary','initialization'])assert(r[k]);assert(d.figureAxes.time.x.categories.some(c=>c.id===r.setup));assert(d.figureAxes.time.y.categories.some(c=>c.id===r.costClass));}
for(const s of patch.upsertSlices){assert.equal(s.xAxis.kind,'categorical');assert.equal(s.yAxis.kind,'categorical');assert(s.results.every(r=>r.plot===null));assert(!s.yAxis.min&&!s.yAxis.max);}
assert.match(d.figureAxes.time.y.label,/not a universal/);assert.match(d.lowerBoundStatus,/No matching/);
assert.match(by(ids[0]).notes,/not a proved.*lower/);assert.match(by(ids[1]).amortization,/Amortized/);assert.match(by(ids[1]).theorem,/Theorem 1/);
assert.equal(by(ids[2]).sequenceTime,'O(n log n+nΔ+t)');assert.equal(by(ids[2]).minUpdates,'t=Ω(n log n+nΔ)');assert.notEqual(by(ids[2]).setup,by(ids[4]).setup);assert.notEqual(by(ids[2]).setup,by(ids[5]).setup);
// The long-sequence qualification is substantive: nΔ dominates a one-update sequence.
const n=1000,delta=999,t=1;assert((n*Math.log2(n)+n*delta+t)/t>100000);
assert.match(by(ids[4]).probability,/Las Vegas/);assert.match(by(ids[5]).amortization,/per-update.*not amortized/);assert.match(by(ids[5]).notes,/conditional expectation/);assert.match(by(ids[5]).theorem,/15 October 2026/);assert.match(by(ids[5]).initialization,/O\(n\)/);
assert.equal(by(ids[6]).randomized,false);assert.equal(by(ids[6]).palette,'(1+o(1))Δ');assert.match(by(ids[6]).exactComputation,/λ²L²T/);assert.match(by(ids[6]).notes,/as Δ grows/);
const gh=by('vertex-dynamic-adaptive-gil-2026');
assert.equal(gh.publicationStatus,'preprint');assert.equal(gh.version,'2610.26182v2');assert.equal(gh.recourse,3);
assert.equal(gh.costClass,'sqrt');assert.equal(gh.setup,'adaptive_worstcase');assert.notEqual(gh.setup,by(ids[0]).setup);
assert.match(gh.amortization,/Worst-case.*high probability/);assert.match(gh.adversary,/previous random bits/);assert.match(gh.initialization,/Initially empty/);
assert.match(gh.sourceUrl,/#S1.Thmtheorem1$/);assert.match(gh.notes,/maximum degree observed so far/);
const lower=d.relatedResults[0];assert.equal(lower.kind,'lower');assert.equal(lower.panel,'related_decision');assert.match(lower.output,/yes\/no.*not/);assert.match(lower.amortization,/updates and decision queries/);assert.match(lower.oracle,/O\(log n\)-bit/);assert.match(lower.notes,/updates alone/);assert(!d.verifiedRecords.some(r=>r.kind==='lower'));assert(!patch.upsertSlices.flatMap(s=>s.results).some(r=>r.id===lower.id));
const ctx={window:{},document:{getElementById:()=>({textContent:JSON.stringify({focus:{'vertex-dynamic':d}})})},AbortController};vm.runInNewContext(src,ctx);const api=ctx.window.AtlasPairRenderers['vertex-dynamic'];
assert.equal(api.records().length,9);assert.equal(api.records({publication:'published',includeRelated:false}).length,6);assert.equal(api.records({setup:'adaptive'}).length,2);assert.equal(api.records({setup:'oblivious_expected'}).length,2);assert.equal(api.records({randomness:'deterministic',includeRelated:false}).length,1);assert.equal(api.records('vertex-dynamic',{publication:'published'}).length,7);
const sizes=[[738,548],[330,245],[180,120],[1,1],[640,410],[900,600],[480,340],[1060,740],[300,100]];
for(const [w,h] of sizes){for(const s of [api.summarySVG('vertex-dynamic',w,h),api.diagramSVG({key:'vertex-dynamic',width:w,height:h})]){assert(s.includes('preserveAspectRatio="xMidYMid meet"'));assert(!s.includes('NaN')&&!s.includes('undefined'));for(const m of s.matchAll(/data-center-x="([^"]+)" data-center-y="([^"]+)"/g)){assert(+m[1]>=0&&+m[1]<=w);assert(+m[2]>=0&&+m[2]<=h);}if(w<250||h<150)assert(!s.includes('<text '));if(w===330)assert(!s.includes('vdy-paper-label'));}}
const summary=api.summarySVG('',738,548),compact=api.summarySVG('',330,245),focus=api.diagramSVG({key:'vertex-dynamic'});
assert.equal((summary.match(/data-marker="algorithm"/g)||[]).length,8);assert.equal((summary.match(/data-marker="related-lower"/g)||[]).length,1);assert.equal((focus.match(/role="button"/g)||[]).length,9);
assert(summary.includes('t=Ω(n log n+nΔ)'));assert(summary.includes('updates AND decision queries'));assert(summary.includes('does not lower-bound maintaining'));assert(compact.includes('Different output'));assert(!/<text\b[^>]*>[^<]*BGKLS/.test(compact));
assert(!api.diagramSVG({key:'vertex-dynamic',publication:'published'}).includes('data-vdy-result="'+ids[5]+'"'));
assert(!api.summarySVG('',738,548,{setup:'adaptive'}).includes('data-marker="related-lower"'));
assert(api.summarySVG('',738,548,{setup:'adaptive',randomness:'deterministic'}).includes('No maintenance results'));
for(const selector of ['.cell svg.vdy-summary text','.cell svg.vdy-summary .vdy-cost','.cell svg.vdy-summary .vdy-paper-label','.cell svg.vdy-summary .vdy-lower-title'])assert(css.includes(selector));
// Unscoped summary axes need fill:none; otherwise SVG closes its L-path into a filled triangle.
assert.match(css,/(?:^|})\s*\.vdy-axis\{[^}]*fill:none/);
class El{constructor(){this.innerHTML='';this.value='';this.set=new Set();this.classList={add:(...c)=>c.forEach(v=>this.set.add(v)),remove:v=>this.set.delete(v),toggle:(v,on)=>on?this.set.add(v):this.set.delete(v),contains:v=>this.set.has(v)};}focus(){this.focused=true;}setAttribute(k,v){this[k]=v;}}
class Root extends El{constructor(){super();this.isConnected=true;this.els=new Map();this.listeners={};}querySelector(s){if(!this.els.has(s))this.els.set(s,new El());return this.els.get(s);}addEventListener(k,fn,o){this.listeners[k]={fn,signal:o.signal};}}
const root=new Root();let notified;api.mount(root,'vertex-dynamic',{onPublicationChange:v=>notified=v});assert(root.querySelector('.vdy-theorem').innerHTML.includes('GH 2026'));const old=root.listeners.click.signal;
root.listeners.change.fn({target:{classList:{contains:k=>k==='vdy-publication'},value:'published'}});assert.equal(notified,'published');assert(!root.querySelector('.vdy-records').innerHTML.includes(ids[5]));
api.mount(root,'vertex-dynamic');assert(old.aborted);let prevented=false;root.listeners.keydown.fn({key:'Enter',preventDefault:()=>prevented=true,target:{closest:()=>({dataset:{vdyResult:lower.id}})}});assert(prevented);assert(root.querySelector('.vdy-theorem').innerHTML.includes('Theorem A.1'));assert(root.querySelector('.vdy-theorem').innerHTML.includes('decision queries'));assert(root.querySelector('.vdy-result[data-vdy-result="'+lower.id+'"]').focused);
const sig=root.listeners.click.signal;api.release(root);assert(sig.aborted);assert(!root.classList.contains('vdy-view'));
console.log('vertex-dynamic: eight maintenance records; seven sources; exact contracts and sequence overhead; related decision lower; publication/setup filters; nine sizes; keyboard, inspector and lifecycle PASS.');
