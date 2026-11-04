'use strict';
const assert=require('assert');

// Exhaustive tiny matching oracle, independent of the reductions being checked.
function optimum(leftCount,edges){
 const adj=Array.from({length:leftCount},()=>[]);
 for(const [u,v,w]of edges)adj[u].push([v,w]);
 const memo=new Map();
 function solve(u,used){
  if(u===leftCount)return 0;
  const key=u+':'+used;if(memo.has(key))return memo.get(key);
  let best=solve(u+1,used);
  for(const [v,w]of adj[u])if(!(used&(1<<v)))best=Math.max(best,w+solve(u+1,used|(1<<v)));
  memo.set(key,best);return best;
 }
 return solve(0,0);
}

// Section A.1.1: every two-set instance, inserted subset and selected query.
// Unit weights transfer the exact cardinality gap to exact optimum weight.
let unitCases=0;
const n=2;
for(let family=0;family<1<<(n*n);family++)for(let X=0;X<1<<n;X++)for(let q=0;q<n;q++){
 const edges=[];
 for(let i=0;i<n;i++){
  edges.push([1+i,1+i,1],[1+n+i,1+n+i,1]);
  for(let j=0;j<n;j++)if(family&(1<<(i*n+j)))edges.push([1+i,1+n+j,1]);
  if(X&(1<<i))edges.push([1+n+i,0,1]);
 }
 edges.push([0,1+q,1]);
 const intersects=Array.from({length:n},(_,j)=>Boolean((X&(1<<j))&&(family&(1<<(q*n+j))))).some(Boolean);
 assert.equal(optimum(2*n+1,edges),2*n+Number(intersects));unitCases++;
}

// Section A.2.4's weight-complement step, on all 3-vertex DAGs with edge
// lengths 1..3. This checks the translation, not the large planar core or proof.
let weightedCases=0;
for(let a=0;a<=3;a++)for(let b=0;b<=3;b++)for(let c=0;c<=3;c++){
 const distance=Math.min(a&&b?a+b:Infinity,c||Infinity);if(!Number.isFinite(distance))continue;
 const K=10,coreSize=3,edges=Array.from({length:coreSize},(_,i)=>[i,i,K]);
 if(a)edges.push([0,1,K-a]);if(b)edges.push([1,2,K-b]);if(c)edges.push([0,2,K-c]);
 edges.push([3,0,K],[2,3,K]);
 assert.equal(optimum(4,edges),(coreSize+1)*K-distance);weightedCases++;
}
console.log('Weighted exact reduction checks PASS: '+unitCases+' unit-weight disjointness gadgets; '+weightedCases+' small weight-complement DAGs. These are scope checks, not a proof verification.');
