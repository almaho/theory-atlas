'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const data=JSON.parse(fs.readFileSync(__dirname+'/../../../data/focus/matching-query-matrix.json','utf8'));
const patch=JSON.parse(fs.readFileSync(__dirname+'/research-patch.json','utf8'));
const input=JSON.parse(fs.readFileSync(__dirname+'/input-research.json','utf8'));
const moduleText=fs.readFileSync(__dirname+'/../../../src/query-matrix.js','utf8');
function load(focus=data){const context={window:{},document:{getElementById(id){assert.equal(id,'atlas-data');return {textContent:JSON.stringify({focus:{'matching-query_matrix':focus}})}}},AbortController};vm.createContext(context);vm.runInContext(moduleText,context);return context.window.AtlasPairRenderers['matching-query_matrix']}
const api=load();
for(const method of ['mount','records','diagramSVG','summarySVG','release'])assert.equal(typeof api[method],'function');
const all=[...data.verifiedRecords,...data.relatedResults];
assert.equal(data.verifiedRecords.length,6);assert.equal(api.records().length,6);assert.equal(api.records({publication:'published'}).length,6,'FOCS 2025 lower bound is published');
for(const r of all){assert.ok(data.sources[r.sourceId],r.id);for(const key of ['quality','queryComplexity','graph','output','oracle','adaptivity','probability','theorem','evidenceStatus'])assert.ok(r[key],r.id+' lacks '+key);assert.equal(r.evidenceStatus,'full_text_verified')}
for(const r of data.verifiedRecords){const axes=data.figureAxes[r.panel];assert.ok(axes.x.categories.some(x=>x.id===r.qualityFamily));assert.ok(axes.y.categories.some(x=>x.id===r.resourceLane));assert.equal(axes.x.kind,'categorical');assert.equal(axes.y.kind,'symbolic');assert.ok(!r.plot,'No invented numerical coordinate')}
const lower=data.verifiedRecords.find(r=>r.id==='matrix-abrr25');assert.match(lower.quantifiers,/For every fixed δ.*there exists fixed ε/);assert.match(lower.probability,/2\/3/);assert.ok(!lower.conditional);
const bks=data.verifiedRecords.find(r=>r.id==='matrix-bks23-mixed');assert.equal(bks.quality,'ŝ ≤ OPT ≤ 1.5 ŝ + εn');assert.match(bks.theorem,/4\.1/);
assert.match(data.verifiedRecords.find(r=>r.id==='matrix-mrt25').quality,/o\(n\)/);
assert.ok(data.relatedResults.find(r=>r.id==='matrix-bks23-oracle').queryComplexity.includes('preprocessing'));
for(const original of input.slices.flatMap(s=>s.results)){assert.ok(patch.upsertSlices.flatMap(s=>s.results).find(r=>r.id===original.id),'Lost existing result '+original.id)}
assert.deepEqual(patch.upsertSlices.map(s=>s.id).sort(),input.slices.map(s=>s.id).sort(),'No other pair modified');
function checkSVG(svg,w,h,expectText){
 assert.doesNotMatch(svg,/NaN|undefined|Infinity/);assert.ok(svg.includes('preserveAspectRatio="xMidYMid meet"'));
 assert.ok(svg.includes('var(--green)'));assert.ok(svg.includes('var(--red)'));
 assert.equal((svg.match(/data-mqm-result=/g)||[]).length,6);
 assert.ok(!svg.includes('<rect'),'The primary diagram uses points, not colored theorem strips');
 for(const m of svg.matchAll(/data-center-x="([\d.]+)" data-center-y="([\d.]+)"/g)){assert.ok(+m[1]>=4&&+m[1]<=w-4,m[0]);assert.ok(+m[2]>=4&&+m[2]<=h-4,m[0])}
 if(!expectText)assert.equal((svg.match(/<text\b/g)||[]).length,0,'Tiny thumbnails must hide annotations');
}
checkSVG(api.diagramSVG(),1100,650,true);
assert.equal(api.diagramSVG({publication:'published'}),api.diagramSVG('matching-query_matrix',{publication:'published'}));
for(const [w,h] of [[180,110],[330,245],[500,260],[738,548],[1100,820],[500,110],[180,548]]){
 const svg=api.summarySVG('matching-query_matrix',w,h);checkSVG(svg,w,h,w>=220&&h>=140);
 if(w>=420&&h>=240){assert.match(svg,/data-axis="x"/);assert.match(svg,/data-axis="y"/)}
 if(w>=650&&h>=420){assert.match(svg,/mqm-summary-formula/);assert.match(svg,/∀δ &gt; 0 ∃ε\(δ\) &gt; 0/)}
}
checkSVG(api.summarySVG('matching-query_matrix',738,548,{level:'overview'}),738,548,false);
// A synthetic publication status change proves filtering works, even though all current records are published.
const fixture=JSON.parse(JSON.stringify(data));fixture.sources.abrr25.publicationStatus='preprint';const filtered=load(fixture);assert.equal(filtered.records({publication:'published'}).length,5);assert.ok(!filtered.summarySVG('matching-query_matrix',738,548,{publication:'published'}).includes('data-mqm-result="matrix-abrr25"'));
function root(){const selectors=new Map(),classes=new Set(),events=[];return {isConnected:true,innerHTML:'',selectors,events,classList:{add(...names){names.forEach(x=>classes.add(x))},remove(...names){names.forEach(x=>classes.delete(x))},toggle(n,v){v?classes.add(n):classes.delete(n)},contains(n){return classes.has(n)}},setAttribute(){},querySelector(s){if(!selectors.has(s))selectors.set(s,{innerHTML:'',value:'',hidden:false});return selectors.get(s)},addEventListener(type,fn,options){events.push({type,fn,signal:options.signal})}}}
let changed=null;const host=root(),instance=api.mount(host,'matching-query_matrix-additive',{embedded:true,onPublicationChange:v=>changed=v});
assert.ok(host.classList.contains('matching-query-matrix-view'));assert.match(host.querySelector('.mqm-theorem').innerHTML,/ABRR/);
for(const r of all){host.events.find(e=>e.type==='click').fn({target:{closest(){return {dataset:{mqmResult:r.id}}}}});const html=host.querySelector('.mqm-theorem').innerHTML;assert.ok(html.includes(r.theorem.replace(/&/g,'&amp;')),r.id+' theorem missing');assert.ok(html.includes('Read primary source'));assert.ok(html.includes(r.output.replace(/&/g,'&amp;')))}
let prevented=false;host.events.find(e=>e.type==='keydown').fn({key:'Enter',preventDefault(){prevented=true},target:{closest(){return {dataset:{mqmResult:'matrix-abrr25'}}}}});assert.ok(prevented);assert.match(host.querySelector('.mqm-theorem').innerHTML,/ABRR/);
host.events.find(e=>e.type==='change').fn({target:{value:'published',classList:{contains:n=>n==='mqm-publication-select'}}});assert.equal(changed,'published');
api.release(host);assert.ok(host.events.every(e=>e.signal.aborted));assert.ok(!host.classList.contains('matching-query-matrix-view'));
api.mount(host);const old=host.events.slice(-3);api.mount(host);assert.ok(old.every(e=>e.signal.aborted),'Remount aborts stale listeners');api.release(host);
console.log('PASS: theorem contracts, record preservation, publications, 8 zoom geometries, point inspection, keyboard selection, callbacks, lifecycle.');
