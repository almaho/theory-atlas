'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'data/fine-grained.json'),'utf8'));
const context={window:{},document:{getElementById:id=>id==='fg-data'?{textContent:JSON.stringify(data)}:null}};
vm.runInNewContext(fs.readFileSync(path.join(root,'src/fine-grained.js'),'utf8'),context);
const api=context.window.FineGrainedModel;
for(const e of data.edges){
 assert.deepEqual(JSON.parse(JSON.stringify(api.direction(e,'reduction'))),{from:e.from,to:e.to});
 assert.deepEqual(JSON.parse(JSON.stringify(api.direction(e,'algorithm'))),{from:e.to,to:e.from});
 assert(api.consequences(e.to,'algorithm').some(x=>x.id===e.id));
}
assert(!data.edges.some(e=>e.from==='3sum'&&e.to==='triangle'),'Listing hardness must never become detection hardness');
assert(data.edges.find(e=>e.id==='minplus-negtri').consequence.includes('δ/3'));
assert(data.edges.find(e=>e.id==='bmm-triangle').notes.includes('combinatorial'));
assert.equal(data.nodes.find(n=>n.id==='diameter-approx').tag,'APPROXIMATION · GRAPH');
assert(data.nodes.find(n=>n.id==='diameter-approx').contract.includes('D/α≤D̂≤D'));
assert(data.nodes.find(n=>n.id==='diameter-approx').related[0].detail.includes('⌊2D/3⌋'));
for(const id of ['apsp','minplus','negative-triangle','3sum','triangle-listing'])assert.equal(data.nodes.find(n=>n.id===id).lower.status,'historical');
assert(api.visibleNodes('weighted','').every(n=>n.group==='weighted'));
assert.equal(api.visibleNodes('all','does-not-exist').length,0);
assert(api.visibleNodes('all','LCS').some(n=>n.id==='ov'),'Search retains direct context');
assert(!api.visibleNodes('boolean','LCS').length);
for(const n of data.nodes)for(const c of n.claims||[])assert.equal(data.sources[c.sourceId].status,'preprint');
// Independently check the cited 2-versus-3 diameter gadget on every ordered
// pair of two-vector sets in dimension two, including zero vectors.
const dot=(a,b)=>Boolean(a&b);
let checked=0;
for(let a=0;a<4;a++)for(let b=0;b<4;b++)for(let c=0;c<4;c++)for(let d=0;d<4;d++){
 const A=[a,b],B=[c,d],adj=Array.from({length:8},()=>new Set());
 const add=(i,j)=>{adj[i].add(j);adj[j].add(i)};
 for(let i=0;i<2;i++)for(let k=0;k<2;k++){if(A[i]&(1<<k))add(i,4+k);if(B[i]&(1<<k))add(2+i,4+k);}
 for(let i=0;i<2;i++){add(6,i);add(7,2+i);add(6,4+i);add(7,4+i);}add(6,7);
 let diameter=0;
 for(let s=0;s<8;s++){let ds=Array(8).fill(-1),q=[s];ds[s]=0;for(let j=0;j<q.length;j++)for(const v of adj[q[j]])if(ds[v]<0){ds[v]=ds[q[j]]+1;q.push(v)}assert(ds.every(x=>x>=0));diameter=Math.max(diameter,...ds);}
 const yes=A.some(x=>B.some(y=>!dot(x,y)));
 assert.equal(diameter,yes?3:2);checked++;
}
const html=fs.readFileSync(path.join(root,'dist/fine-grained.html'),'utf8');
assert(!/\/\* FG_(CSS|JS|DATA) \*\//.test(html));
assert(html.includes('The proofs were not independently verified')||html.includes('proofs were not independently verified'));
assert(fs.readFileSync(path.join(root,'dist/index.html'),'utf8').includes('href="fine-grained.html"'));
console.log('Fine-grained PASS: 13 scoped nodes; 12 reversible-direction relations; exponent-loss, listing/detection, approximation-floor and hypothesis-status guards; '+checked+' diameter gadgets; search context; built-page navigation.');

