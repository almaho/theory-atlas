'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'data/fine-grained.json'),'utf8'));
const context={window:{},document:{getElementById:id=>id==='fg-data'?{textContent:JSON.stringify(data)}:null}};
vm.runInNewContext(fs.readFileSync(path.join(root,'src/fine-grained.js'),'utf8'),context);
const api=context.window.FineGrainedModel;
for(const e of data.edges){
 assert.deepEqual(JSON.parse(JSON.stringify(api.direction(e,'reduction'))),{from:e.from,to:e.to});
 assert.deepEqual(JSON.parse(JSON.stringify(api.direction(e,'algorithm'))),e.kind==='structural'?{from:e.from,to:e.to}:{from:e.to,to:e.from});
 assert(api.consequences(e.kind==='structural'?e.from:e.to,'algorithm').some(x=>x.id===e.id));
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
// Verify OuMv reachability and the undirected 3-versus-5 gap by changing
// terminal edges repeatedly, including deletion and re-insertion sequences.
let dynamicChecked=0;
for(let matrix=0;matrix<16;matrix++){
 const directed=Array.from({length:6},()=>new Set()),undirected=Array.from({length:6},()=>new Set());
 for(let i=0;i<2;i++)for(let j=0;j<2;j++)if(matrix&(1<<(2*i+j))){directed[1+i].add(3+j);undirected[1+i].add(3+j);undirected[3+j].add(1+i);}
 const distance=adj=>{const ds=Array(6).fill(Infinity),q=[0];ds[0]=0;for(let k=0;k<q.length;k++)for(const v of adj[q[k]])if(ds[v]===Infinity){ds[v]=ds[q[k]]+1;q.push(v)}return ds[5];};
 for(const pair of [...Array(16).keys(),...Array(16).keys()].map((x,i)=>i<16?x:15-x)){
  const u=pair>>2,v=pair&3;
  for(let i=0;i<2;i++){
   for(const adj of [directed,undirected]){adj[0].delete(1+i);adj[3+i].delete(5);if(u&(1<<i))adj[0].add(1+i);if(v&(1<<i))adj[3+i].add(5);}
   undirected[1+i].delete(0);undirected[5].delete(3+i);if(u&(1<<i))undirected[1+i].add(0);if(v&(1<<i))undirected[5].add(3+i);
  }
  let yes=false;for(let i=0;i<2;i++)for(let j=0;j<2;j++)yes ||= Boolean((u&(1<<i))&&(matrix&(1<<(2*i+j)))&&(v&(1<<j)));
  assert.equal(distance(directed)<Infinity,yes);
  if(yes)assert.equal(distance(undirected),3);else assert(distance(undirected)>=5);
  dynamicChecked++;
 }
}
const dynamic=data.nodes.filter(n=>n.group==='dynamic');
assert.equal(dynamic.length,9);
assert.equal(api.updateRows(dynamic).length,7);
assert.equal(api.updateRows(api.visibleNodes('weighted','')).length,0);
for(const row of data.dynamicView.rows){
 const n=data.nodes.find(n=>n.id===row.nodeId);
 if(row.threshold!=null){assert(row.queryExponent<n.lower.queryCeilingExponent,'Query must be polynomially below the joint exclusion threshold');assert.equal(row.threshold,n.lower.threshold);}
 for(const index of row.algorithmIndices){const a=n.baselines[index];if(a.symbolic)assert.equal(a.updateExponent,undefined,'Do not invent a numerical ORS/epsilon exponent');else if(row.threshold!=null)assert(a.updateExponent>=row.threshold);}
}
assert.equal(data.nodes.find(n=>n.id==='dyn-closure').baselines[0].query,'O(n^{1.407})');
assert(data.nodes.find(n=>n.id==='dyn-diameter').contract.includes('D/α≤D̂≤D'));
assert(data.nodes.find(n=>n.id==='dyn-distance-oracle').baselines[0].bound.includes('+o(1)'));
assert(!data.nodes.find(n=>n.id==='dyn-distance-oracle').baselines[0].bound.includes('Õ'));
assert(data.nodes.find(n=>n.id==='oumv').contract.includes('a×b'));
// Operation counts give the claimed savings only when BOTH costs improve.
for(const [u,q,updateCount,queryCount,total] of [[1,2,2,1,3],[.5,1,1,.5,1.5],[.5,1,2,1.5,2.5],[1,1,2,2,3]]){
 assert(Math.max(updateCount+u-.1,queryCount+q-.1)<total);
 assert.equal(Math.max(updateCount+u-.1,queryCount+q),total);
}
assert(html.includes('id="updates"')&&html.includes('Row-specific query guarantees'));

// Independently check matching and cover optima, terminal updates, and dense padding.
function matchingSize(edges,left){const adj=new Map(left.map(v=>[v,[]]));for(const [u,v] of edges)adj.get(u).push(v);const mate=new Map();function augment(u,seen){for(const v of adj.get(u)){if(seen.has(v))continue;seen.add(v);if(!mate.has(v)||augment(mate.get(v),seen)){mate.set(v,u);return true}}return false}let size=0;for(const u of left)if(augment(u,new Set()))size++;return size;}
function minCoverSize(edges){if(!edges.length)return 0;const [u,v]=edges[0];return 1+Math.min(minCoverSize(edges.filter(e=>!e.includes(u))),minCoverSize(edges.filter(e=>!e.includes(v))));}
let matchingChecked=0;
for(let matrix=0;matrix<16;matrix++){
 const edgeMap=new Map();const change=(u,v,on)=>{const key=u+','+v;if(on)edgeMap.set(key,[u,v]);else edgeMap.delete(key)};
 for(let v=1;v<=4;v++)change(v,v+4,true);
 for(let i=0;i<2;i++)for(let j=0;j<2;j++)if(matrix&(1<<(2*i+j)))change(1+i,7+j,true);
 for(const pair of [...Array(16).keys(),...Array(16).keys()].map((x,i)=>i<16?x:15-x)){
  const u=pair>>2,v=pair&3;
  for(let i=0;i<2;i++){change(0,5+i,Boolean(u&(1<<i)));change(3+i,9,Boolean(v&(1<<i)));}
  let bit=0;for(let i=0;i<2;i++)for(let j=0;j<2;j++)if((u&(1<<i))&&(matrix&(1<<(2*i+j)))&&(v&(1<<j)))bit=1;
  const edges=[...edgeMap.values()],size=matchingSize(edges,[0,1,2,3,4]),cover=minCoverSize(edges);
  assert.equal(size,4+bit);assert.equal(cover,size);assert.equal(size===5,Boolean(bit));
  const padded=edges.concat([[10,12],[10,13],[11,12],[11,13]]),paddedSize=matchingSize(padded,[0,1,2,3,4,10,11]);
  assert.equal(paddedSize,6+bit);assert.equal(minCoverSize(padded),paddedSize);assert.equal(paddedSize===7,Boolean(bit));
  matchingChecked++;
 }
}
assert.equal(minCoverSize([[0,1],[1,2],[0,2]]),2,'Triangle cover size differs from matching size 1');
// On every graph on four vertices, greedily form a maximal matching and
// independently verify that its endpoints cover all edges within factor two.
for(let mask=0;mask<64;mask++){
 const pairs=[[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]],edges=pairs.filter((_,i)=>mask&(1<<i)),endpoints=new Set();
 for(const [u,v] of edges)if(!endpoints.has(u)&&!endpoints.has(v)){endpoints.add(u);endpoints.add(v);}
 assert(edges.every(([u,v])=>endpoints.has(u)||endpoints.has(v)));
 assert(endpoints.size<=2*minCoverSize(edges));
}
// A good but nonmaximal matching can leave an edge uncovered.
const almostMatchingEdges=Array.from({length:10},(_,i)=>[2*i,2*i+1]);
const almostEndpoints=new Set(almostMatchingEdges.slice(0,9).flat());
assert(!almostMatchingEdges.every(([u,v])=>almostEndpoints.has(u)||almostEndpoints.has(v)));

assert((2*100+1)/(2*100)<1.01,'The exact unit gap cannot enforce fixed 1.01 accuracy');
for(const id of ['dyn-matching-approx-size','dyn-matching-approx-edges','ors'])assert.equal(data.nodes.find(n=>n.id===id).lower,null);
assert.equal(data.nodes.find(n=>n.id==='dyn-matching-size').baselines[0].updateExponent,1.405);
assert(data.nodes.find(n=>n.id==='dyn-cover-size').contract.includes('bipartite'));
assert(!data.edges.some(e=>e.from==='dyn-matching-size'&&e.to==='dyn-cover-size'),'Do not imply general matching reduces to bipartite cover');
const structural=data.edges.find(e=>e.id==='ors-matching-edges');
assert.equal(structural.kind,'structural');assert.equal(structural.fixedDirection,true);
for(const mode of ['algorithm','reduction'])assert.deepEqual(JSON.parse(JSON.stringify(api.direction(structural,mode))),{from:'ors',to:'dyn-matching-approx-edges'});
assert(!api.consequences('dyn-matching-approx-edges','algorithm').some(e=>e.id===structural.id));
assert.equal(api.updateRows(api.visibleNodes('matching','')).length,7);
assert(html.includes('no numerical exponent assigned'));
assert(!html.includes('All green updates are worst-case'));
console.log('Fine-grained PASS: '+data.nodes.length+' nodes; '+data.edges.length+' connections; '+data.dynamicView.rows.length+' query-scoped update rows; '+checked+' diameter gadgets; '+dynamicChecked+' fully dynamic OuMv states; '+matchingChecked+' independent matching/cover states with dense padding; structural direction and approximation-scope guards.');

const coverEdge=data.edges.find(e=>e.id==='approx-cover-maximal');
assert.deepEqual(JSON.parse(JSON.stringify(api.direction(coverEdge,'algorithm'))),{from:'dyn-maximal',to:'dyn-cover-approx'});
assert(coverEdge.notes.includes('nonmaximal'));
const maintainedCover=data.nodes.find(n=>n.id==='dyn-cover-approx');
assert.equal(maintainedCover.lower,null);
assert(maintainedCover.baselines[0].guarantee.includes('oblivious'));
assert(maintainedCover.baselines[1].bound.includes('1/ε²'));
assert(maintainedCover.related[0].detail.includes('does not maintain solution changes'));
assert(maintainedCover.baselines.every(a=>a.query.includes('enumeration O(|C|)')));
