const fs=require('fs'),vm=require('vm'),assert=require('assert');
const data=JSON.parse(fs.readFileSync(__dirname+'/../../../data/focus/cc-query-combined.json','utf8')),input=JSON.parse(fs.readFileSync(__dirname+'/input-research.json','utf8')),patch=JSON.parse(fs.readFileSync(__dirname+'/research-patch.json','utf8')),registration=JSON.parse(fs.readFileSync(__dirname+'/registration.json','utf8'));
const context={window:{},document:{getElementById:()=>({textContent:JSON.stringify({focus:{'cc-query_combined':data}})})},AbortController};
vm.runInNewContext(fs.readFileSync(__dirname+'/../../../src/cc-query-combined.js','utf8'),context);
const R=context.window.AtlasPairRenderers['cc-query_combined'],all=[...data.verifiedRecords,...data.relatedResults];
assert(R&&['mount','summarySVG','diagramSVG','records','release'].every(k=>typeof R[k]==='function'));
assert.equal(R.records().length,8);assert.equal(R.records({publication:'published'}).length,7);
for(const s of input.slices)for(const r of s.results){assert(all.some(x=>x.id===r.id));assert(patch.upsertSlices.find(x=>x.id===s.id).results.some(x=>x.id===r.id));}
assert.equal(patch.upsertSlices.length,4);assert.equal(all.length,9);assert.equal(Object.keys(data.sources).length,5);
for(const r of all){assert(r.assumptions.length&&r.theorem&&r.output&&r.oracle&&r.probability);assert(data.figureAxes[r.panel]);}
assert.equal(data.relatedResults.length,1);assert.equal(data.relatedResults[0].setup,'random-pair-memory');
const byId=Object.fromEntries(all.map(r=>[r.id,r]));
assert(byId['cc-query-saha-two'].queryComplexity.includes('in expectation'));assert(byId['cc-query-saha-two'].quality.includes('Expected'));
assert(byId['cc-query-saha-conditional-lb'].assumptions.includes('Gap-ETH.'));assert(byId['cc-query-saha-conditional-lb'].quality.includes('γ/10'));
assert(byId['cc-query-ailon-2018-eth-lower'].conditional);assert(byId['cc-query-ailon-2018-eth-lower'].assumptions.includes('ETH.'));
assert.equal(byId['cc-query-general-garg-lb'].evidenceStatus,'announced-proof-deferred');
assert(byId['cc-query-garg-memory-lb'].assumptions.some(x=>x.includes('0.05')));
assert.equal(byId['cc-query-combined-1485'].approximationBase,1.485);assert.equal(byId['cc-query-combined-13865'].approximationBase,1.3865);
assert(patch.upsertSlices.every(s=>s.results.every(r=>r.plot===null)));
const sizes=[[180,110],[330,245],[500,260],[600,400],[738,548],[1000,620],[180,548],[738,110]];
let checked=0;
for(const route of registration.routes)for(const[w,h]of sizes){
const svg=R.summarySVG(route.key,w,h,{});assert(!/NaN|undefined/.test(svg));
for(const m of svg.matchAll(/data-center-x="([^"]+)" data-center-y="([^"]+)"/g)){assert(+m[1]>=0&&+m[1]<=w);assert(+m[2]>=0&&+m[2]<=h);}
for(const m of svg.matchAll(/<text x="([^"]+)" y="([^"]+)"/g)){assert(+m[1]>=0&&+m[1]<=w,'text x '+m[1]+' '+w);assert(+m[2]>=0&&+m[2]<=h,'text y '+m[2]+' '+h);}
if(w<420||h<220)assert.equal((svg.match(/<text /g)||[]).length,0);
if(route.key.includes('oracle')){assert(svg.includes('data-panel="oracle-opt"'));assert(svg.includes('data-panel="oracle-k"'));assert(!svg.includes('data-panel="multiplicative"'));}
if(route.key==='cc-query_combined'){assert(svg.includes('data-panel="multiplicative"'));assert(svg.includes('data-panel="additive"'));assert(!svg.includes('data-panel="oracle-opt"'));}
checked++;
}
for(const key of registration.routes.map(r=>r.key)){const svg=R.summarySVG(key,1000,620,{level:'overview'});assert(!svg.includes('<text '));}
const graph=R.diagramSVG(),oracle=R.diagramSVG('cc-query_combined-oracle'),memory=R.diagramSVG('cc-query_combined-memory');
assert(graph.includes('data-axis="x"')&&graph.includes('data-axis="y"'));assert(oracle.includes('data-axis="x"')&&oracle.includes('data-axis="y"'));
assert.equal((graph.match(/data-marker="algorithm"/g)||[]).length,2);assert.equal((graph.match(/data-marker="announced-lower"/g)||[]).length,1);
assert.equal((oracle.match(/data-marker="conditional-lower"/g)||[]).length,2);
assert(!R.summarySVG('cc-query_combined',738,548,{publication:'published'}).includes('data-ccqc-result="cc-query-combined-13865"'));
for(const b of[-.45,-.25,0,.25,.45])for(const a of[.001,.125,.25,.499]){
const direct=Math.min(b<0?1+2*a-b/2:1+2*a-2*b,1.5-b);
assert(Math.abs(R.memoryExponent(a,b)-direct)<1e-12);
const svg=R.summarySVG('cc-query_combined-memory',738,548,{memoryB:b});assert(!/NaN|undefined/.test(svg));assert(svg.includes('data-open-endpoint="0"')&&svg.includes('data-open-endpoint="0.5"'));
}
assert.equal(R.memoryExponent(.25,0),1.5);assert.equal(R.memoryExponent(.4,0),1.5);
const nodes={},events={},signals=[],root={isConnected:true,classList:{add(){},remove(){},toggle(){}},setAttribute(){},querySelector:s=>nodes[s]||(nodes[s]={innerHTML:'',value:'',hidden:false}),addEventListener(n,f,o){events[n]=f;signals.push(o.signal)}};
let changed;R.mount(root,'cc-query_combined',{onPublicationChange:p=>changed=p});
assert(nodes['.ccqc-theorem'].innerHTML.includes('Corollary 3'));
function target(kind,id){return{closest:s=>s==='[data-ccqc-view]'?(kind==='view'?{dataset:{ccqcView:id}}:null):s==='[data-ccqc-result]'?(kind==='result'?{dataset:{ccqcResult:id}}:null):s==='.ccqc-point,.ccqc-related-link'?{}:null};}
events.click({target:target('view','oracle')});assert(nodes['.ccqc-plot'].innerHTML.includes('data-view="oracle"'));assert(nodes['.ccqc-memory-controls'].hidden);
for(const r of all.filter(r=>r.panel.startsWith('oracle'))){events.click({target:target('result',r.id)});assert(nodes['.ccqc-theorem'].innerHTML.includes(r.theorem));assert(nodes['.ccqc-theorem'].innerHTML.includes('https://'));}
let prevented=false;events.keydown({key:'Enter',preventDefault(){prevented=true;},target:target('result','cc-query-saha-two')});assert(prevented);assert(nodes['.ccqc-theorem'].innerHTML.includes('in expectation'));
events.click({target:target('view','memory')});assert.equal(nodes['.ccqc-memory-controls'].hidden,false);
events.input({target:{classList:{contains:s=>s==='ccqc-memory-b'},value:'-0.25'}});assert(nodes['.ccqc-plot'].innerHTML.includes('data-memory-b="-0.25"'));
events.change({target:{classList:{contains:s=>s==='ccqc-publication'},value:'published'}});assert.equal(changed,'published');
R.release(root);assert(signals.every(s=>s.aborted));
console.log(JSON.stringify({status:'pass',originalRecordsPreserved:8,extraExistingSourceLower:1,viewports:checked,sourceFilter:true,inspection:true,keyboard:true,cleanup:true,memoryExponentVerified:true}));
