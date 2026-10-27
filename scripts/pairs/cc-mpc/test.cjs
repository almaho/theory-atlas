const fs=require('fs'),vm=require('vm'),assert=require('assert');
const data=JSON.parse(fs.readFileSync(__dirname+'/../../../data/focus/cc-mpc.json','utf8')),input=JSON.parse(fs.readFileSync(__dirname+'/input-research.json','utf8')),patch=JSON.parse(fs.readFileSync(__dirname+'/research-patch.json','utf8'));
const code=fs.readFileSync(__dirname+'/../../../src/cc-mpc.js','utf8');
function runtime(d){const c={window:{},document:{getElementById:()=>({textContent:JSON.stringify({focus:{'cc-mpc':d}})})},AbortController};vm.runInNewContext(code,c);return c.window.AtlasPairRenderers['cc-mpc'];}
const R=runtime(data);assert(R&&['mount','summarySVG','diagramSVG','records','release'].every(k=>typeof R[k]==='function'));
assert.equal(R.records().length,10);assert.equal(R.records({publication:'published'}).length,10);
const all=[...data.verifiedRecords,...data.relatedResults],by=id=>all.find(r=>r.id===id);
assert.equal(patch.upsertSlices.length,6);
let original=0;for(const s of input.slices)for(const r of s.results){original++;assert(all.some(x=>x.id===r.id));assert(patch.upsertSlices.some(t=>t.results.some(x=>x.id===r.id)));}
assert.equal(original,10);assert(data.verifiedRecords.every(r=>r.kind==='algorithm'&&r.panel==='rounds'&&r.scope==='main'));
assert(data.verifiedRecords.every(r=>data.figureAxes[r.panel]&&r.theorem&&r.probability&&r.localMemory&&r.totalMemory));
assert.equal(data.lowerBoundStatus,'No general lower bound verified in the reviewed sources.');
assert(by('cc-mpc-combinatorial-1876').quality.includes('2−1/8+ε'));
assert(!patch.upsertSlices.flatMap(s=>s.results).find(r=>r.id==='cc-mpc-combinatorial-1876').guarantee.includes('2−2/13'));
assert(by('cc-mpc-alphabest').scope==='related'&&by('cc-mpc-alphabest').localMemory.includes('Not bounded'));
assert(by('cc-mpc-pruned-3plus').totalMemory.includes('k^(k+1)'));
assert(by('cc-mpc-cao-24').quality.includes('Expected')&&by('cc-mpc-cao-24').totalMemory.includes('ε^(−3)')&&by('cc-mpc-cao-24').work.includes('ε^(−7)'));
assert(by('cc-mpc-cambus-arboricity').assumptions.some(a=>a.includes('λ≥2')));
assert.equal(by('cc-mpc-cambus-forest').roundClass,'polylog');assert.equal(by('cc-mpc-cambus-forest-approx-det').roundClass,'loglogstar');
assert.equal(by('cc-mpc-cambus-forest-approx-rand').roundClass,'constant');
assert(data.relatedResults.filter(r=>r.kind==='lower').every(r=>r.scope==='related'&&r.roundClass===null&&r.rounds==='Not an MPC-round lower bound'));
assert(data.relatedResults.filter(r=>r.setup==='allnorms').length===2);
assert(data.verifiedRecords.every(r=>r.qualityCoordinate===null));
assert.equal(new Set(data.verifiedRecords.map(r=>r.setup)).size,3);
for(const s of Object.values(data.sources))assert(['conference','journal','preprint'].includes(s.publicationStatus));
const sizes=[[180,110],[330,245],[500,300],[738,548],[180,548],[738,110]],counts=[];
for(const [w,h]of sizes){const svg=R.summarySVG('cc-mpc',w,h);assert(!/NaN|undefined/.test(svg));assert(!svg.includes('data-kind="lower"'));assert.equal((svg.match(/data-marker="algorithm"/g)||[]).length,10);
 for(const m of svg.matchAll(/data-center-x="([^"]+)" data-center-y="([^"]+)"/g)){assert(+m[1]>0&&+m[1]<w);assert(+m[2]>0&&+m[2]<h);}
 for(const m of svg.matchAll(/<text x="([^"]+)" y="([^"]+)"/g)){assert(+m[1]>=0&&+m[1]<=w);assert(+m[2]>=0&&+m[2]<=h);}
 const n=(svg.match(/<text /g)||[]).length;counts.push(n);if(w<250||h<160)assert.equal(n,0);
 if(w===738&&h===548){assert(svg.includes('fixed ε, δ; fixed λ≥2 in arboric rows'));assert(svg.includes('No general lower bound verified'));assert(svg.includes('k^(k+1)'));assert(svg.includes('O(ε⁻¹(log ε⁻¹+log log* n))'));assert(svg.includes('data-axis="x"')&&svg.includes('data-axis="y"'));}}
assert(counts[0]<counts[1]&&counts[1]<counts[3]);assert.equal((R.summarySVG('cc-mpc',738,548,{level:'overview'}).match(/<text /g)||[]).length,0);
const focus=R.diagramSVG();for(const r of data.verifiedRecords)assert(focus.includes('data-ccmp-result="'+r.id+'"'));for(const r of data.relatedResults)assert(!focus.includes('data-ccmp-result="'+r.id+'"'));
assert(focus.includes('polylog n')&&!focus.includes('≥ log n'));assert(code.includes('fill="var(--green)"'));
const nodes={},events={},signals=[];const root={isConnected:true,classList:{add(){},remove(){},toggle(){}},setAttribute(){},querySelector:s=>nodes[s]||(nodes[s]={innerHTML:'',value:'',hidden:false}),addEventListener(n,f,o){events[n]=f;signals.push(o.signal)}};let changed;
R.mount(root,'cc-mpc',{onPublicationChange:p=>changed=p});
assert(nodes['.ccmp-theorem'].innerHTML.includes('C=O(1)'));
function click(id){events.click({target:{closest:()=>({dataset:{ccmpResult:id}})}});}
click('cc-mpc-alphabest');assert(nodes['.ccmp-theorem'].innerHTML.includes('Not bounded by the corollary'));assert(nodes['.ccmp-theorem'].innerHTML.includes('Remark 1.5'));
click('cc-mpc-allnorms-63');assert(nodes['.ccmp-theorem'].innerHTML.includes('simultaneously'));assert(nodes['.ccmp-theorem'].innerHTML.includes('Õ(m/ε⁶)'));
click('cc-mpc-cao-triangle-work-barrier');assert(nodes['.ccmp-theorem'].innerHTML.includes('Conditional on:'));assert(nodes['.ccmp-theorem'].innerHTML.includes('Not an MPC-round lower bound')===false);assert(nodes['.ccmp-theorem'].innerHTML.includes('Sequential combinatorial work'));
click('cc-mpc-cambus-arboricity-extra-memory');assert(nodes['.ccmp-theorem'].innerHTML.includes('at least n machines'));
let prevented=false;events.keydown({key:'Enter',preventDefault(){prevented=true;},target:{closest:()=>({dataset:{ccmpResult:'cc-mpc-pruned-3plus'}})}});assert(prevented);assert(nodes['.ccmp-theorem'].innerHTML.includes('k^(k+1)'));
events.change({target:{classList:{contains:()=>true},value:'published'}});assert.equal(changed,'published');
R.release(root);assert(signals.every(s=>s.aborted));
const temp=JSON.parse(JSON.stringify(data));temp.sources['cohenaddad-2021-mpc'].publicationStatus='preprint';assert.equal(runtime(temp).records({publication:'published'}).length,9);
const empty=JSON.parse(JSON.stringify(data));Object.values(empty.sources).forEach(s=>s.publicationStatus='preprint');assert(runtime(empty).summarySVG('cc-mpc',738,548,{publication:'published'}).includes('No results match this filter.'));
console.log(JSON.stringify({status:'pass',originalResultsPreserved:original,mainAlgorithms:10,relatedAlgorithms:4,relatedRestrictedLowerBounds:2,mainLowerPoints:0,textCounts:counts,viewports:sizes.length,sourceFilter:true,inspectionAndCleanup:true,parameterScopes:true,browserQA:'pending parent tools'}));
