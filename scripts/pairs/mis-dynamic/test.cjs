const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const focus=JSON.parse(fs.readFileSync(__dirname+'/../../../data/focus/mis-dynamic.json','utf8'));
const input=JSON.parse(fs.readFileSync(__dirname+'/input-research.json','utf8'));
const patch=JSON.parse(fs.readFileSync(__dirname+'/research-patch.json','utf8'));
const context={window:{},AbortController,document:{getElementById:()=>({textContent:JSON.stringify({focus:{'mis-dynamic':focus}})})}};vm.createContext(context);vm.runInContext(fs.readFileSync(__dirname+'/../../../src/mis-dynamic.js','utf8'),context);
const renderer=context.window.AtlasPairRenderers['mis-dynamic'];
assert(renderer&&['mount','summarySVG','diagramSVG','records','release'].every(k=>typeof renderer[k]==='function'));
const original=input.slices.flatMap(s=>s.results.map(r=>r.id));
assert(original.every(id=>focus.verifiedRecords.some(r=>r.id===id)),'Every supplied result remains in the main figure');
assert.equal(patch.upsertSlices.length,5);
assert(focus.verifiedRecords.every(r=>r.theorem&&r.probability&&r.output&&r.adversary&&r.graph));
assert(focus.verifiedRecords.every(r=>r.plot===null),'No fabricated numerical coordinates');
const lower=focus.verifiedRecords.find(r=>r.kind==='lower');assert.equal(lower.panel,'adaptive');assert(lower.conditional&&lower.assumptions.some(a=>a.includes('Boolean')));
const batch=focus.verifiedRecords.find(r=>r.id==='mis-dyn-blelloch-2026-batch');assert.equal(batch.displayBound,'O(b log² n · log Δ)');
const b1=focus.verifiedRecords.find(r=>r.id==='mis-dyn-blelloch-2026-single');assert.equal(b1.panel,'oblivious');assert.equal(b1.contract,'expected');
assert(focus.verifiedRecords.filter(r=>r.contract==='whp').every(r=>r.output.includes('data structure')));
assert(focus.relatedResults.find(r=>r.id==='mis-dyn-aoss18-recourse-lower').conditional===false);
const all=renderer.records(),published=renderer.records({publication:'published'});assert(all.length>published.length);assert(!published.some(r=>r.publicationStatus==='preprint'));assert(published.some(r=>r.kind==='lower'));
const tc=s=>(s.match(/<text\b/g)||[]).length;
let counts=[];
for(const [w,h] of [[180,110],[330,245],[500,260],[738,548],[180,245],[500,110]]){
 const s=renderer.summarySVG('mis-dynamic',w,h);assert(!s.includes('NaN'));assert(s.includes('var(--green)')&&s.includes('var(--red)'));assert(!/<rect\b[^>]*fill="var\(--(?:green|red)/.test(s));counts.push(tc(s));
 for(const m of s.matchAll(/data-center-x="([^"]+)" data-center-y="([^"]+)"/g)){assert(+m[1]>=0&&+m[1]<=w);assert(+m[2]>=0&&+m[2]<=h)}
 if(w<220||h<140)assert.equal(tc(s),0);
}
assert(counts[0]===0&&counts[1]>0&&counts[2]>counts[1]&&counts[3]>counts[2]);
assert.equal(tc(renderer.summarySVG('mis-dynamic',738,548,{level:'overview'})),0);
const figure=renderer.diagramSVG();for(const id of original)assert(figure.includes(`data-mis-dynamic-result="${id}"`));assert(figure.includes('data-conditional="true"'));assert(figure.includes('stroke-dasharray="2 1"'));assert(figure.includes('data-axis="x"')&&figure.includes('data-axis="y"'));
const parts=new Map(),listeners=[];const root={isConnected:true,classList:{add(){},remove(){},toggle(){}},setAttribute(){},set innerHTML(v){this.html=v},get innerHTML(){return this.html},querySelector(k){if(!parts.has(k))parts.set(k,{innerHTML:'',hidden:false,value:''});return parts.get(k)},addEventListener(type,fn,opts){listeners.push({type,fn,signal:opts.signal})}};
let changed;const instance=renderer.mount(root,'mis-dynamic',{onPublicationChange:p=>changed=p});assert(parts.get('.mdy-theorem').innerHTML.includes('Conditional lower bound'));assert(root.innerHTML.includes('Bounded review'));
listeners.find(e=>e.type==='change').fn({target:{classList:{contains:c=>c==='mdy-publication-select'},value:'published'}});assert.equal(changed,'published');assert(!parts.get('.mdy-plot-host').innerHTML.includes('mis-dyn-blelloch-2026-batch'));
listeners.find(e=>e.type==='click').fn({target:{closest:()=>({dataset:{misDynamicResult:'mis-dyn-gupta-khan-2021'}})}});assert(parts.get('.mdy-theorem').innerHTML.includes('GK21'));assert(parts.get('.mdy-theorem').innerHTML.includes('Theorem 1.1'));
renderer.release(root);assert(listeners.every(e=>e.signal.aborted));assert(instance.settingKey==='mis-dynamic');
console.log(JSON.stringify({status:'pass',records:all.length,publishedRecords:published.length,related:focus.relatedResults.length,semanticTextCounts:counts,originalResultsPreserved:original.length}));

// Regression: conditional hardness assumptions must not leak to algorithms or recourse.
const auditedIncremental=focus.verifiedRecords.find(r=>r.id==='mis-dyn-gupta-surendra-2026-inc');
assert.equal(auditedIncremental.conditional,false);
assert(!auditedIncremental.assumptions.some(a=>/Boolean|BMM|Combinatorial/.test(a)));
const auditedRecourse=focus.relatedResults.find(r=>r.id==='mis-dyn-aoss18-recourse-lower');
assert(auditedRecourse.assumptions.some(a=>/Worst-case.*membership/.test(a)));
assert(!auditedRecourse.assumptions.some(a=>/amortized/i.test(a)));
const auditedSlice=patch.upsertSlices.find(s=>s.id==='mis-dynamic-incremental-adaptive-conditional');
assert(!auditedSlice.assumptions.some(a=>/Boolean|BMM|Combinatorial/.test(a)));
assert(auditedSlice.results.find(r=>r.kind==='lower').assumptions.some(a=>/Boolean/.test(a)));
assert(!auditedSlice.results.find(r=>r.kind==='upper').assumptions.some(a=>/Boolean|BMM|Combinatorial/.test(a)));
