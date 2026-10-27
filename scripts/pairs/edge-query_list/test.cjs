'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');
const dir=__dirname,read=n=>fs.readFileSync(path.join(dir,n),'utf8'),d=JSON.parse(read('../../../data/focus/edge-query_list.json')),patch=JSON.parse(read('research-patch.json')),registration=JSON.parse(read('registration.json')),src=read('../../../src/edge-query_list.js'),css=read('../../../src/edge-query_list.css');
const ids=['query-adjacency-list-greedy-baseline','edge-query-vizing-2025-enumerated','edge-query-near-vizing-2025-enumerated','edge-query-density-2024-enumerated','edge-query-nearlinear-2026-enumerated','edge-query-vizing2024-mnthird','edge-query-vizing2025-mnfourth'],by=id=>d.verifiedRecords.find(r=>r.id===id);
assert.equal(d.verifiedRecords.length,7);assert.equal(Object.keys(d.sources).length,7);assert.equal(d.derivedBounds.length,1);assert.equal(d.relatedResults.length,0);assert.equal(new Set(d.verifiedRecords.map(r=>r.id)).size,7);
assert.equal(patch.upsertPapers.length,7);assert.equal(patch.upsertSlices.length,2);assert(!patch.papers&&!patch.slices);assert(!registration.pointFields);
for(const id of ids){assert(by(id));assert.equal(patch.upsertSlices.flatMap(s=>s.results).filter(r=>r.id===id).length,1);}
for(const r of d.verifiedRecords){
 assert.equal(r.kind,'upper');assert.equal(r.panel,'queries');assert(!r.plot);assert(r.sourceUrl.startsWith('https://'));assert.equal(r.queryComplexity,'Exactly n+2m oracle calls for this scan');
 assert(d.figureAxes.queries.x.categories.some(c=>c.id===r.paletteCategory));assert(d.figureAxes.queries.y.categories.some(c=>c.id===r.queryCost));
 for(const k of ['quality','output','graph','theorem','probability','computation'])assert(r[k]);assert(r.assumptions.length);
}
assert.match(d.figureAxes.queries.y.label,/Oracle queries/);assert.match(d.figureAxes.queries.x.label,/not numeric/);
const lower=d.derivedBounds[0];assert.equal(lower.kind,'lower');assert.equal(lower.resource,'output_time');assert.equal(lower.queryComplexity,null);assert(!lower.paperId&&!lower.sourceId);assert.match(lower.theorem,/atlas; not a paper theorem/);assert.match(lower.proof,/m records/);assert(!patch.upsertSlices.flatMap(s=>s.results).some(r=>r.id===lower.id));assert.match(d.lowerBoundStatus,/No oracle-query lower/);
assert.match(by(ids[0]).computation,/mΔ/);assert.match(by(ids[0]).displayBound,/straightforward/);assert.match(by(ids[0]).notes,/not an optimal|O\(Δ\)/);
assert.match(by(ids[1]).theorem,/Corollary C\.1.*Corollary B\.1/);assert.match(by(ids[1]).notes,/Theorem 1\.1 itself states O\(m log n\)/);assert.match(by(ids[1]).assumptions.join(' '),/Δ≤1/);
assert.match(by(ids[2]).probability,/Always.*expected/);assert.match(by(ids[2]).theorem,/§4\.3/);
assert.match(by(ids[3]).computation,/Õ\(m \+/);assert.match(by(ids[3]).exactComputation,/\+ m log²n/);
assert.match(by(ids[4]).assumptions.join(' '),/0<ε<1 and Δ≥1\/ε/);assert.match(by(ids[4]).probability,/1−ε\^\{Ω\(m\)\}/);assert.match(by(ids[4]).assumptions.join(' '),/floor\(q\)/);assert.match(by(ids[4]).sourceComputation,/log\(1\/ε\)\/ε⁴/);
assert.match(by(ids[5]).computation,/1\/3/);assert.match(by(ids[6]).computation,/1\/4/);
// Accounting check includes isolated vertices and counts both list directions exactly once.
function scan(n,edges){const adj=Array.from({length:n},()=>[]);for(const [u,v] of edges){adj[u].push(v);adj[v].push(u);}let q=0,retained=0;for(let v=0;v<n;v++){q++;for(const u of adj[v]){q++;if(v<u)retained++;}}return {q,retained};}
for(const [n,e] of [[5,[]],[4,[[0,1],[1,2],[2,0]]],[20,[[0,1],[0,2],[0,3]]]])assert.deepEqual(scan(n,e),{q:n+2*e.length,retained:e.length});
// A star exposed the missing additive m term in the supplied density formula.
const n=10000,m=n-1,Delta=n-1,alpha=1,density=m*alpha*Math.min(1,Math.sqrt(n)/Delta);assert(density<m);assert(m+density>=m);
const ctx={window:{},document:{getElementById:()=>({textContent:JSON.stringify({focus:{'edge-query_list':d}})})},AbortController};vm.runInNewContext(src,ctx);const api=ctx.window.AtlasPairRenderers['edge-query_list'];
assert.equal(api.records().length,8);assert.equal(api.records({publication:'published'}).filter(r=>!r.derived).length,6);assert.equal(api.records({palette:'vizing'}).filter(r=>!r.derived).length,4);assert.equal(api.records({randomness:'deterministic'}).filter(r=>!r.derived).length,1);
assert.equal(api.records({publication:'published',randomness:'deterministic'}).filter(r=>!r.derived).length,0);assert(api.records({publication:'published'}).some(r=>r.derived),'Elementary proof is source-independent');
const sizes=[[738,548],[330,245],[180,120],[1,1],[640,410],[900,600],[480,340],[1060,740],[300,100]];
for(const [w,h] of sizes){const s=api.summarySVG('edge-query_list',w,h);assert(s.includes('preserveAspectRatio="xMidYMid meet"'));assert(!s.includes('NaN')&&!s.includes('undefined'));for(const mark of s.matchAll(/data-center-x="([^"]+)" data-center-y="([^"]+)"/g)){const x=+mark[1],y=+mark[2];assert(x>=0&&x<=w);assert(y>=0&&y<=h);}if(w<250||h<150)assert(!s.includes('<text '));if(w===330)assert(!s.includes('eql-paper-label'));}
const s=api.summarySVG('',738,548),focus=api.diagramSVG({key:'edge-query_list'});assert.equal((s.match(/data-marker="algorithm"/g)||[]).length,7);assert.equal((focus.match(/data-marker="algorithm"/g)||[]).length,7);assert.equal((s.match(/data-marker="output-lower"/g)||[]).length,0);assert(s.includes('n + 2m'));assert(s.includes('data-resource="oracle_queries"'));assert(!s.includes('data-resource="output_time"'));assert(!s.includes('Post-scan time'));assert.equal(new Set([...s.matchAll(/data-center-y="([^"]+)"/g)].map(x=>x[1])).size,1,'Every algorithm shares the exact query-cost row');assert(!s.includes('query-optimal'));
assert.equal(api.diagramSVG({key:'edge-query_list',publication:'published'}).includes('data-eql-result="'+ids[0]+'"'),false);assert(api.summarySVG('',738,548,{publication:'published',randomness:'deterministic'}).includes('No algorithms match'));
for(const selector of ['.cell svg.eql-summary text','.cell svg.eql-summary .eql-cost','.cell svg.eql-summary .eql-paper-label','.cell svg.eql-summary .eql-lower'])assert(css.includes(selector));
class El{constructor(){this.innerHTML='';this.value='';this.hidden=false;this.set=new Set();this.classList={add:(...c)=>c.forEach(v=>this.set.add(v)),remove:v=>this.set.delete(v),toggle:(v,on)=>on?this.set.add(v):this.set.delete(v),contains:v=>this.set.has(v)};}focus(){this.focused=true;}setAttribute(k,v){this[k]=v;}}
class Root extends El{constructor(){super();this.isConnected=true;this.els=new Map();this.listeners={};}querySelector(s){if(!this.els.has(s))this.els.set(s,new El());return this.els.get(s);}addEventListener(k,fn,o){this.listeners[k]={fn,signal:o.signal};}}
const root=new Root();let notified;api.mount(root,'edge-query_list',{onPublicationChange:v=>notified=v});assert(root.querySelector('.eql-theorem').innerHTML.includes('Exact Vizing'));const old=root.listeners.click.signal;
root.listeners.change.fn({target:{classList:{contains:k=>k==='eql-publication'},value:'published'}});assert.equal(notified,'published');assert(!root.querySelector('.eql-records').innerHTML.includes(ids[0]));
api.mount(root,'edge-query_list');assert(old.aborted);let prevented=false;root.listeners.keydown.fn({key:' ',preventDefault:()=>prevented=true,target:{closest:()=>({dataset:{eqlResult:lower.id}})}});assert(prevented);assert(root.querySelector('.eql-theorem').innerHTML.includes('Elementary atlas derivation'));assert(!root.querySelector('.eql-theorem').innerHTML.includes('<a '),'Derived proof must not masquerade as paper theorem');
const sig=root.listeners.click.signal;api.release(root);assert(sig.aborted);assert(!root.classList.contains('eql-view'));
console.log('edge-query_list: 7 IDs; main query axis and detail-only output/time accounting; density +m correction; source regimes; filters; nine sizes; semantic zoom; keyboard, inspector and lifecycle PASS.');
