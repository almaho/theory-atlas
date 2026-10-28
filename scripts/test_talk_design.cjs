'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),c={window:{},document:{addEventListener(){}}};
vm.runInNewContext(fs.readFileSync(path.join(root,'src/visual-guides.js'),'utf8'),c);
const example=c.window.AtlasVisualGuides.example;
// Independently enumerate the weighted-path choices used by the explanatory drawing.
const weights=[1,9,1,9,1],matchings=[];
for(let mask=0;mask<32;mask++)if(!(mask&(mask<<1))){
 const edges=weights.filter((_,i)=>mask>>i&1);matchings.push({size:edges.length,weight:edges.reduce((a,b)=>a+b,0)});
}
assert.equal(Math.max(...matchings.map(m=>m.size)),3);
assert.equal(Math.max(...matchings.map(m=>m.weight)),18);
assert.equal(matchings.find(m=>m.size===3).weight,3);
for(const problem of ['matching','weighted_matching','mis','cc','edge','vertex'])for(const model of ['dynamic','stream','online','stochastic','lca','local','mpc','query_list','query_matrix']){
 const initial=example(problem,model,0);
 for(let step=0;step<initial.buttons.length;step++){
  const r=example(problem,model,step);assert(!/NaN|undefined/.test(r.svg));assert(r.caption&&r.svg.includes('aria-label='));
 }
}
assert(example('weighted_matching','dynamic',1).caption.includes('18'));
assert(example('mis','local',0).caption.includes('maximal'));
assert(example('mis','local',1).caption.includes('maximum'));
assert(example('mis','lca',2).caption.includes('v₄ is in, v₃ is out, v₂ is in, v₁ is out'));
assert(example('cc','local',2).caption.includes('2 disagreements'));
assert(example('cc','stochastic',1).caption.includes('Recovery asks for the hidden groups'));
console.log('Talk design PASS: illustrative objectives checked independently; all problem/model examples finite; stochastic recovery and ordinary disagreement objectives distinguished.');
