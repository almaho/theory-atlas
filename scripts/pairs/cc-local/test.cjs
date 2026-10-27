'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const data=JSON.parse(fs.readFileSync(__dirname+'/../../../data/focus/cc-local.json','utf8'));
const original=JSON.parse(fs.readFileSync(__dirname+'/input-research.json','utf8'));
const patch=JSON.parse(fs.readFileSync(__dirname+'/research-patch.json','utf8'));
const registration=JSON.parse(fs.readFileSync(__dirname+'/registration.json','utf8'));
const source=fs.readFileSync(__dirname+'/../../../src/cc-local.js','utf8');
function load(focus=data){const context={window:{},document:{getElementById(){return{textContent:JSON.stringify({focus:{'cc-local':focus}})}}},AbortController,Set};vm.runInNewContext(source,context);return context.window.AtlasPairRenderers['cc-local']}
const api=load(),row=data.verifiedRecords[0];
assert.equal(api.records().length,1,'One parameterized theorem must not become eight independent research results');
assert.equal(data.relatedResults.length,0);
for(const slice of original.slices){const next=patch.upsertSlices.find(s=>s.id===slice.id);assert(next);for(const result of slice.results){assert(next.results.some(r=>r.id===result.id),'Original result lost');assert(data.verifiedRecords.some(r=>r.id===result.id),'Inspection record lost')}}
assert.equal(row.id,'cc-local-3plus-rounds');assert.equal(row.kind,'upper');assert.equal(row.evidenceStatus,'theorem_verified');assert.equal(row.panel,'tradeoff');
for(const field of ['graph','output','quality','probability','theorem','resourceModel','exactBound'])assert(row[field]);
assert(row.probability.includes('Expected'));assert(row.graph.includes('Unweighted complete signed'));assert(row.resourceModel.includes('positive-edge'));assert(row.resourceModel.includes('O(log n)-bit'));
assert(row.exactBound.includes('2r+1'));assert(row.exactBound.includes('2r−1'));assert(row.exactBound.includes('n^{−Ω(1)}'));assert(!row.exactBound.includes('2^r'));
assert(data.lowerBoundStatus.includes('No general'));assert(!data.verifiedRecords.some(r=>r.kind==='lower'));
assert.equal(data.lowerBoundAudit.generalLocalRoundLowerBoundInSuppliedSource,false);
assert.equal(registration.routes[0].sliceId,'cc-local-3plus');assert(registration.axisSummary.note.includes('n^{−Ω(1)}'));
assert.equal(data.figureAxes.tradeoff.x.kind,'log-excess');assert.equal(data.figureAxes.tradeoff.x.offset,3);assert.equal(data.figureAxes.tradeoff.y.kind,'log');
assert(data.figureAxes.tradeoff.x.min>3);assert.equal(data.figureAxes.tradeoff.y.min,2);
const anchors=[[1,3,11],[2,5,17/3],[4,9,29/7],[16,33,101/31],[128,257,773/255]];
for(const [r,rounds,factor]of anchors){const p=api.pointForR(r);assert.equal(p.rounds,rounds);assert(Math.abs(p.leadingFactor-factor)<1e-12);assert.equal(p.correction,'n^{−Ω(1)}')}
for(const r of [0,-1,1.5,NaN,Infinity])assert.throws(()=>api.pointForR(r));
for(let r=1;r<128;r++){assert(api.pointForR(r).leadingFactor>api.pointForR(r+1).leadingFactor);assert(api.pointForR(r).rounds<api.pointForR(r+1).rounds)}
assert.equal(api.pointForR(256).rounds,513,'The theorem parameter extends beyond the selected viewing range');
const focus=api.diagramSVG({selectedR:16});
assert.equal((focus.match(/data-cc-local-r=/g)||[]).length,8);assert(focus.includes('data-axis="x"'));assert(focus.includes('data-axis="y"'));assert(focus.includes('data-rank-correction="true"'));assert(focus.includes('data-reference="3"'));assert(focus.includes('Reference only; not a lower bound'));
assert(focus.includes('role="group"'));assert.equal((focus.match(/role="button"/g)||[]).length,8);assert(focus.includes('data-visual-guide="true"'));assert(!focus.includes('data-kind="lower"'));
assert(!/NaN|Infinity|undefined/.test(focus));assert(!focus.includes('var(--red)'));
const g=api.layoutGeometry(1000,590,{focus:true});
assert(Math.abs((g.px(3.125)-g.px(3.03125))-(g.px(3.5)-g.px(3.125)))<1e-9,'Equal excess multipliers must have equal x spacing');
assert(Math.abs((g.py(8)-g.py(32))-(g.py(32)-g.py(128)))<1e-9,'Equal round multipliers must have equal y spacing');
for(const [w,h]of [[160,90],[110,280],[450,90],[240,160],[330,245],[500,260],[738,548],[1000,800]]){
 const svg=api.summarySVG('cc-local',w,h),geom=api.layoutGeometry(w,h);
 assert(!/NaN|Infinity|undefined/.test(svg));assert(geom.top<geom.bottom);assert(geom.left<geom.right);
 assert.equal((svg.match(/data-cc-local-r=/g)||[]).length,8);
 for(const p of geom.points){assert(p.x>=0&&p.x<=w&&p.y>=0&&p.y<=h,'Outside '+w+'×'+h)}
 for(let i=1;i<geom.points.length;i++){assert(geom.points[i].x<geom.points[i-1].x);assert(geom.points[i].y<geom.points[i-1].y)}
 if(w<240||h<160)assert(!/<text/.test(svg),'Overview should remove all visible annotations');
 else{assert(svg.includes('data-axis="x"'));assert(svg.includes('data-axis="y"'));assert(svg.includes('data-rank-correction="true"'))}
 if(w>=700&&h>=420)assert(svg.includes('data-reference="3"'));
 const first=geom.points[0],last=geom.points.at(-1);
 assert(first.x>last.x&&first.y>last.y,'Approximation–round tradeoff orientation reversed');
}
assert(!/<text/.test(api.summarySVG('cc-local',738,548,{level:'overview'})));
assert.equal((api.diagramSVG({selectedR:5}).match(/data-cc-local-r=/g)||[]).length,9,'Unsampled selected integer must be added accurately');
const changed=JSON.parse(JSON.stringify(data));changed.sources[row.sourceId].publicationStatus='preprint';
const filtered=load(changed);assert.equal(filtered.records({publication:'published'}).length,0);assert(!filtered.diagramSVG({publication:'published'}).includes('data-cc-local-r='));assert(filtered.diagramSVG({publication:'published'}).includes('No source in this filter'));assert.equal(api.records({publication:'published'}).length,1);
function host(){const classes=new Set(),children=new Map(),listeners={};return{isConnected:true,innerHTML:'',classList:{add(...names){names.forEach(n=>classes.add(n))},remove(...names){names.forEach(n=>classes.delete(n))},toggle(n,on){on?classes.add(n):classes.delete(n)}},setAttribute(){},querySelector(sel){if(!children.has(sel))children.set(sel,{innerHTML:'',value:''});return children.get(sel)},addEventListener(name,fn,options){listeners[name]={fn,signal:options.signal}},classes,listeners}}
const root=host();let publication=null;
api.mount(root,'cc-local',{onPublicationChange:value=>publication=value});
assert(root.querySelector('.cc-local-theorem').innerHTML.includes('8/31'));assert(root.querySelector('.cc-local-theorem').innerHTML.includes('−Ω(1)'));
root.listeners.click.fn({target:{closest(){return{dataset:{ccLocalR:'4'}}}}});
assert(root.querySelector('.cc-local-theorem').innerHTML.includes('8/7'));assert(root.querySelector('.cc-local-theorem').innerHTML.includes('= 9'));
let prevented=false;root.listeners.keydown.fn({key:'Enter',preventDefault(){prevented=true},target:{closest(){return{dataset:{ccLocalR:'128'}}}}});
assert(prevented);assert(root.querySelector('.cc-local-theorem').innerHTML.includes('8/255'));assert(root.querySelector('.cc-local-theorem').innerHTML.includes('257'));
root.listeners.change.fn({target:{value:'5',classList:{contains:c=>c==='cc-local-r-input'}}});assert(root.querySelector('.cc-local-theorem').innerHTML.includes('8/9'));assert.equal(root.querySelector('.cc-local-r-input').value,5);
const invalid={value:'0',classList:{contains:c=>c==='cc-local-r-input'}};root.listeners.change.fn({target:invalid});assert.equal(invalid.value,5);
root.listeners.change.fn({target:{value:'published',classList:{contains:c=>c==='cc-local-publication'}}});assert.equal(publication,'published');
const oldSignal=root.listeners.click.signal;api.mount(root);assert(oldSignal.aborted,'Remount should remove old listeners');const currentSignal=root.listeners.click.signal;api.release(root);assert(currentSignal.aborted);assert(!root.classes.has('cc-local-view'));
console.log('CC LOCAL tests passed: original ID preserved; one exact parameterized expected theorem; finite-rank correction; no fabricated lower bound; discrete samples and log axes; publication filtering; click/keyboard/custom integer inspection; lifecycle; eight thumbnail geometries.');
