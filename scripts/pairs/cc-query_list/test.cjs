const fs=require('fs'),vm=require('vm'),assert=require('assert');
const data=JSON.parse(fs.readFileSync(__dirname+'/../../../data/focus/cc-query-list.json','utf8')),input=JSON.parse(fs.readFileSync(__dirname+'/input-research.json','utf8')),patch=JSON.parse(fs.readFileSync(__dirname+'/research-patch.json','utf8'));
const context={window:{},document:{getElementById:()=>({textContent:JSON.stringify({focus:{'cc-query_list':data}})})},AbortController};vm.runInNewContext(fs.readFileSync(__dirname+'/../../../src/cc-query-list.js','utf8'),context);const R=context.window.AtlasPairRenderers['cc-query_list'];
assert(R&&['mount','summarySVG','diagramSVG','records','release'].every(k=>typeof R[k]==='function'));
assert.equal(R.records().length,2);assert.equal(R.records({publication:'published'}).length,2);
assert(data.verifiedRecords.every(r=>r.kind==='algorithm'&&r.setup==='positive-lists'));
assert.equal(data.relatedResults.length,2);assert(data.relatedResults.every(r=>r.kind==='lower'&&r.setup!=='positive-lists'&&r.scope==='related'));
assert(data.lowerBoundStatus.includes('No same-oracle'));
assert.equal(patch.upsertSlices.length,1);assert(patch.upsertSlices[0].results.every(r=>r.kind==='upper'));
for(const s of input.slices)for(const r of s.results){assert(data.verifiedRecords.some(x=>x.id===r.id));assert(patch.upsertSlices.some(t=>t.results.some(x=>x.id===r.id)));}
const aw=data.verifiedRecords.find(r=>r.id==='cc-query-assadi-wang-2022'),pivot=data.verifiedRecords.find(r=>r.id==='cc-query-pivot-original');
assert.equal(aw.queryComplexity,'O(n log n)');assert.equal(aw.timeComplexity,'O(n log² n)');assert.equal(aw.numericApproximation,null);assert(aw.resourceProbability.includes('high probability'));
assert(pivot.implementationDerived&&pivot.quality.includes('Expected')&&pivot.resourceProbability.includes('every random permutation'));assert.equal(pivot.numericApproximation,3);
for(const r of data.verifiedRecords){assert(data.figureAxes[r.panel]);assert(r.output&&r.graph&&r.theorem&&r.probability&&r.assumptions.length);}
for(const s of Object.values(data.sources))assert(['conference','journal','preprint'].includes(s.publicationStatus));
const sizes=[[180,110],[330,245],[500,260],[738,548],[180,548],[738,110]],counts=[];
for(const [w,h]of sizes){const svg=R.summarySVG('cc-query_list',w,h,{});assert(!/NaN|undefined/.test(svg));assert(svg.includes('data-scope="main-positive-lists"'));
 const main=svg.split('data-scope="main-positive-lists"')[1].split('data-scope="related-oracles"')[0];assert(!main.includes('data-kind="lower"'));
 for(const m of svg.matchAll(/data-center-x="([^"]+)" data-center-y="([^"]+)"/g)){assert(+m[1]>0&&+m[1]<w);assert(+m[2]>0&&+m[2]<h);}
 for(const m of svg.matchAll(/<text x="([^"]+)" y="([^"]+)"/g)){assert(+m[1]>=0&&+m[1]<=w);assert(+m[2]>=0&&+m[2]<=h);}
 const n=(svg.match(/<text /g)||[]).length;counts.push(n);if(w<220||h<140){assert.equal(n,0);assert(!svg.includes('data-marker="related-lower"'));}if(w===738&&h===548){assert(svg.includes('RELATED · DIFFERENT ACCESS MODELS'));assert.equal((svg.match(/data-marker="related-lower"/g)||[]).length,2);assert(svg.includes('Full signed lists')&&svg.includes('Negative lists'));}}
assert(counts[0]<counts[1]&&counts[1]<counts[2]&&counts[2]<counts[3]);
const over=R.summarySVG('cc-query_list',738,548,{level:'overview'});assert.equal((over.match(/<text /g)||[]).length,0);
const plot=R.diagramSVG();assert(plot.includes('data-axis="x"')&&plot.includes('data-axis="y"'));assert(plot.includes('data-range="density-upper-bound"'));assert(plot.includes('implementation-derived'));assert(plot.includes('C=O(1)'));
for(const r of [...data.verifiedRecords,...data.relatedResults])assert(plot.includes('data-ccql-result="'+r.id+'"'));
const nodes={},events={},signals=[];const root={isConnected:true,classList:{add(){},remove(){},toggle(){}},setAttribute(){},querySelector:s=>nodes[s]||(nodes[s]={innerHTML:'',value:'',hidden:false}),addEventListener(n,f,o){events[n]=f;signals.push(o.signal)}};let changed;
R.mount(root,'cc-query_list',{onPublicationChange:p=>changed=p});assert(nodes['.ccql-theorem'].innerHTML.includes('O(n log² n)'));
events.click({target:{closest:()=>({dataset:{ccqlResult:pivot.id}})}});assert(nodes['.ccql-theorem'].innerHTML.includes('Derived implementation bound'));
events.click({target:{closest:()=>({dataset:{ccqlResult:'cc-query-aw-negative-list-lower'}})}});assert(nodes['.ccql-theorem'].innerHTML.includes('Not a positive-list lower bound'));assert(nodes['.ccql-theorem'].innerHTML.includes('G⁻'));
events.change({target:{classList:{contains:()=>true},value:'published'}});assert.equal(changed,'published');
let prevented=false;events.keydown({key:'Enter',preventDefault(){prevented=true;},target:{closest:()=>({dataset:{ccqlResult:aw.id}})}});assert(prevented);assert(nodes['.ccql-theorem'].innerHTML.includes('Theorem 12'));
R.release(root);assert(signals.every(s=>s.aborted));
const temporary=JSON.parse(JSON.stringify(data));temporary.sources[aw.sourceId].publicationStatus='preprint';const c2={window:{},document:{getElementById:()=>({textContent:JSON.stringify({focus:{'cc-query_list':temporary}})})},AbortController};vm.runInNewContext(fs.readFileSync(__dirname+'/../../../src/cc-query-list.js','utf8'),c2);assert.equal(c2.window.AtlasPairRenderers['cc-query_list'].records({publication:'published'}).length,1);
console.log(JSON.stringify({status:'pass',originalPreserved:2,mainAlgorithms:2,relatedLowerBounds:2,positiveListLowerPoints:0,textCounts:counts,viewports:sizes.length,sourceFilter:true,inspectionAndCleanup:true}));
