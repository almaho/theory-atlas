'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm'),read=n=>fs.readFileSync(path.join(__dirname,n),'utf8'),d=JSON.parse(read('../../../data/focus/vertex-stream.json')),p=JSON.parse(read('research-patch.json')),reg=JSON.parse(read('registration.json')),src=read('../../../src/vertex-stream.js'),css=read('../../../src/vertex-stream.css');
const ids=["vertex-stream-ack-2019","vertex-stream-deterministic-odelta-2026","vertex-result-23","vertex-extended-vertex-stream-deterministic-multipass-degree-palette-16","vertex-extended-vertex-stream-deterministic-multipass-degree-palette-17","vertex-stream-random-order-chromatic-2026","vertex-extra-62","vertex-stream-turnstile-chromatic-upper-2026","vertex-extra-61","vertex-result-26","vertex-result-27","vertex-extended-vertex-stream-robust-incremental-37","vertex-extended-vertex-stream-robust-incremental-38","vertex-extended-vertex-stream-robust-incremental-39","vertex-extended-vertex-stream-robust-incremental-40","vertex-result-32","vertex-result-33","vertex-extended-vertex-stream-brooks-43","vertex-extended-vertex-stream-brooks-44","vertex-result-36","vertex-extended-vertex-stream-degeneracy-46","vertex-result-39"],by=id=>d.verifiedRecords.find(r=>r.id===id);
assert.equal(d.verifiedRecords.length,22);assert.equal(Object.keys(d.sources).length,11);assert.equal(p.upsertSlices.length,10);assert.equal(p.upsertPapers.length,11);assert.equal(reg.routes.filter(r=>r.visible).length,2);assert(!reg.pointFields);
for(const id of ids){assert(by(id));assert.equal(p.upsertSlices.flatMap(s=>s.results).filter(r=>r.id===id).length,1);}
for(const r of d.verifiedRecords){assert(d.figureAxes[r.panel]);assert(d.sources[r.sourceId]);for(const k of ['quality','graph','output','theorem','probability','stream','accounting'])assert(r[k]);assert(r.sourceUrl.startsWith('https://'));assert.equal(r.originalIds[0],r.id);for(const m of r.marks){if(!m.bar&&!m.formula){assert(d.figureAxes[r.panel].x.categories.some(c=>c.id===m.x));assert(d.figureAxes[r.panel].y.categories.some(c=>c.id===m.y));}}}
assert(p.upsertSlices.every(s=>s.results.every(r=>r.plot===null)));
assert.match(by('vertex-result-32').palette,/Δ=ω\(log n\)/);assert.match(by('vertex-result-32').notes,/Δ\+1/);
assert.match(by('vertex-result-39').stream,/list precedes first incident edge/);
assert.match(by('vertex-result-36').palette,/εκ\+1/);
assert.match(by('vertex-extended-vertex-stream-brooks-44').palette,/\(Δ−1\)\/2/);
assert.match(by('vertex-result-26').notes,/1\/\(4a\)/);assert.match(by('vertex-result-26').notes,/Not an exp/);
for(const suffix of [37,39,40])assert.match(by('vertex-extended-vertex-stream-robust-incremental-'+suffix).accounting,/external|External/);
assert.match(by('vertex-extended-vertex-stream-robust-incremental-38').accounting,/included/);
assert.match(by('vertex-result-27').accounting,/random bits are free/);
assert.match(by('vertex-extra-62').probability,/2\^\{−q⁴\}\/4/);assert.match(by('vertex-extra-62').notes,/q≥5/);assert.match(by('vertex-extra-62').notes,/not a matching/);
assert.match(by('vertex-extra-61').graph,/no restriction on stream length/);assert.match(by('vertex-extra-61').notes,/3≤q≤polylog n/);assert.match(by('vertex-stream-turnstile-chromatic-upper-2026').palette,/χ≥qt/);
const ctx={window:{},document:{getElementById:()=>({textContent:JSON.stringify({focus:{'vertex-stream':d}})})},AbortController};vm.runInNewContext(src,ctx);const a=ctx.window.AtlasPairRenderers['vertex-stream'];
assert.equal(a.records().length,22);assert.equal(a.records('vertex-stream-decision').length,4);assert.equal(a.records('vertex-stream').length,18);assert.equal(a.records({mode:'construction'}).length,18);assert.equal(a.records({mode:'decision'}).length,4);assert.equal(a.records({mode:'decision',kind:'lower'}).length,2);assert.equal(a.records({panel:'robust'}).length,5);assert.equal(a.records({publication:'published'}).length,21);
for(const [w,h] of [[738,548],[330,245],[180,120],[1,1],[640,410],[1060,770],[300,100]])for(const key of ['vertex-stream','vertex-stream-decision']){const s=a.summarySVG(key,w,h);assert(!s.includes('NaN')&&!s.includes('undefined'));assert(s.includes('preserveAspectRatio="xMidYMid meet"'));if(w<250||h<150)assert(!s.includes('<text '));if(w===330)assert(!s.includes('vst-source-label'));for(const m of s.matchAll(/data-center-x="([^"]+)" data-center-y="([^"]+)"/g)){assert(+m[1]>=0&&+m[1]<=w);assert(+m[2]>=0&&+m[2]<=h);}}
const cs=a.summarySVG('vertex-stream',738,548),ds=a.summarySVG('vertex-stream-decision',738,548);
for(const id of ids.filter(id=>!['random_gap','dynamic_gap'].includes(by(id).panel)))assert(cs.includes('data-vst-result="'+id+'"'));
assert(!cs.includes('data-panel="random_gap"'));assert(!ds.includes('data-panel="robust"'));assert(ds.includes('q²/4'));assert(ds.includes('unbounded stream length'));
assert(cs.includes('One-pass barrier'));assert(cs.includes('external tape excluded'));assert(cs.includes('Palette →'));assert(cs.includes('Space'));
assert(!a.summarySVG('vertex-stream',738,548,{publication:'published'}).includes('data-vst-result="vertex-result-32"'));
assert(!a.summarySVG('vertex-stream',738,548,{kind:'lower'}).includes('data-marker="algorithm"'));
assert(!a.summarySVG('vertex-stream',738,548,{kind:'algorithm'}).includes('data-marker="lower"'));
assert(a.diagramSVG({key:'vertex-stream-decision',panel:'dynamic_gap'}).includes('data-mode="decision"'));
assert.match(css,/(?:^|})\s*\.vst-axis\{[^}]*fill:none/);
for(const s of ['.cell svg.vst-summary text','.cell svg.vst-summary .vst-source-label','.cell svg.vst-summary .vst-lower','.cell svg.vst-summary .vst-axis-label'])assert(css.includes(s));
class El{constructor(){this.innerHTML='';this.value='';this.set=new Set();this.classList={add:(...c)=>c.forEach(v=>this.set.add(v)),remove:v=>this.set.delete(v),toggle:(v,on)=>on?this.set.add(v):this.set.delete(v),contains:v=>this.set.has(v)};}setAttribute(k,v){this[k]=v;}focus(){this.focused=true;}}
class Root extends El{constructor(){super();this.isConnected=true;this.els=new Map();this.listeners={};}querySelector(s){if(!this.els.has(s))this.els.set(s,new El());return this.els.get(s);}addEventListener(k,fn,o){this.listeners[k]={fn,signal:o.signal};}}
const root=new Root();let notification;a.mount(root,'vertex-stream',{onPublicationChange:v=>notification=v});assert(root.querySelector('.vst-theorem').innerHTML.includes('ACK19'));
root.listeners.change.fn({target:{classList:{contains:k=>k==='vst-publication'},value:'published'}});assert.equal(notification,'published');assert(!root.querySelector('.vst-records').innerHTML.includes('vertex-result-32'));
root.listeners.click.fn({target:{closest:s=>s==='[data-vst-mode]'?{dataset:{vstMode:'decision'}}:null}});assert(root.querySelector('.vst-plot').innerHTML.includes('data-mode="decision"'));assert(root.querySelector('.vst-records').innerHTML.includes('vertex-extra-61'));
root.listeners.click.fn({target:{closest:s=>s==='[data-vst-panel]'?{dataset:{vstPanel:'dynamic_gap'}}:null}});assert(!root.querySelector('.vst-plot').innerHTML.includes('data-panel="random_gap"'));
let prevented=false;root.listeners.keydown.fn({key:'Enter',preventDefault:()=>prevented=true,target:{closest:()=>({dataset:{vstResult:'vertex-extra-61'}})}});assert(prevented);assert(root.querySelector('.vst-theorem').innerHTML.includes('Theorem 7'));assert(root.querySelector('.vst-theorem').innerHTML.includes('intermediate frequencies'));assert(root.querySelector('.vst-result[data-vst-result="vertex-extra-61"]').focused);
const old=root.listeners.click.signal;a.mount(root,'vertex-stream-decision');assert(old.aborted);const sig=root.listeners.click.signal;a.release(root);assert(sig.aborted);assert(!root.classList.contains('vst-view'));
console.log('vertex-stream PASS: 22 original records, 11 primary sources, exact scope corrections, six panels/two routes, seven geometry sizes, filters, keyboard inspector and lifecycle.');

assert(src.includes("'vst-legend vst-algorithm'"));assert(src.includes("'vst-legend vst-lower'"));
