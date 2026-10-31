const fs=require('fs'),vm=require('../../atlas-test-vm.cjs'),assert=require('assert/strict'),path=require('path');
const root=path.resolve(__dirname,'../../..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const ID='maximum_is-stream',data=JSON.parse(read('data/focus/maximum_is-stream.json')),code=read('src/maximum-is-stream.js');
const ctx={window:{},document:{getElementById:()=>({textContent:JSON.stringify({focus:{[ID]:data}})})},AbortController};
vm.runInNewContext(code,ctx);const R=ctx.window.AtlasPairRenderers[ID];
assert.equal(R.records().length,2);assert.equal(R.records(ID,{publication:'published'}).length,0);
const [up,lo]=data.verifiedRecords;assert.equal(up.tMax,1);assert.equal(lo.tMax,.5);
assert(up.endOpen&&lo.endOpen);assert.equal(up.range,'1 ≤ β ≤ n/log₂ n');assert.equal(lo.range,'1 ≤ β ≤ √n/(36 log₂ n)');
assert.match(up.theorem,/folklore/);assert.match(lo.theorem,/1.2/);assert.match(lo.notes,/Version 2 narrows/);
for(const r of data.verifiedRecords){assert.match(r.oracle,/insertion–deletion/);assert.match(r.output,/Explicit independent/);assert.match(r.probability,/Deterministic/);assert.match(r.computation,/[Uu]nrestricted/);assert.equal(data.sources[r.sourceId].version,'2609.18635v2');}
assert.match(data.axisNote,/offset does not encode a numerical gap/);
for(const[w,h]of [[1,1],[60,50],[180,130],[299,245],[330,245],[738,548],[900,510],[1100,700]]){
 const s=R.summarySVG(ID,w,h),g=R.layoutGeometry(w,h);assert(!/NaN|undefined/.test(s));assert.equal((s.match(/data-mxs-result=/g)||[]).length,2);
 assert(!R.summarySVG(ID,w,h,{level:'overview'}).includes('<text '));
 for(const p of g.points)for(const q of[p.start,p.end,p.marker]){assert(q.x>=0&&q.x<=w);assert(q.y>=0&&q.y<=h);}
 assert(g.points[0].end.x>g.points[1].end.x);
}
assert.equal((R.diagramSVG().match(/role="button"/g)||[]).length,2);assert(!R.diagramSVG({publication:'published'}).includes('data-mxs-result='));
const nodes={},events={},signals=[],host={isConnected:true,innerHTML:'',classList:{add(){},remove(){},toggle(){}},querySelector:s=>nodes[s]||(nodes[s]={innerHTML:'',value:'',focus(){}}),addEventListener(n,f,o){events[n]=f;signals.push(o.signal)}};
let publication;R.mount(host,ID,{onPublicationChange:p=>publication=p});assert(nodes['.mxs-theorem'].innerHTML.includes('Theorem A.1'));
let prevented=false;events.keydown({key:'Enter',target:{closest:()=>({dataset:{mxsResult:lo.id}})},preventDefault(){prevented=true}});assert(prevented);assert(nodes['.mxs-theorem'].innerHTML.includes('Theorem 1.2'));
events.change({target:{value:'published',classList:{contains:s=>s==='mxs-publication'}}});assert.equal(publication,'published');assert(!nodes['.mxs-plot'].innerHTML.includes('data-mxs-result='));
R.release(host);assert(signals.every(s=>s.aborted));
// Independent exhaustive verification of the graph partition construction.
const pop=m=>{let c=0;for(;m;m&=m-1)c++;return c};
function independent(mask,edges){return edges.every(([u,v])=>!(mask&(1<<u))||!(mask&(1<<v)))}
function optimum(n,edges,allowed=(1<<n)-1){let best=0;for(let s=allowed;;s=(s-1)&allowed){if(pop(s)>pop(best)&&independent(s,edges))best=s;if(s===0)break;}return best}
let graphs=0,partitions=0,updates=0;
for(let n=1;n<=5;n++){const pairs=[];for(let u=0;u<n;u++)for(let v=u+1;v<n;v++)pairs.push([u,v]);
 for(let graph=0;graph<2**pairs.length;graph++){const edges=pairs.filter((_,i)=>graph&(1<<i)),opt=pop(optimum(n,edges));
  for(let beta=1;beta<=n;beta++){const groups=Array.from({length:beta},()=>[]);for(let v=0;v<n;v++)groups[v%beta].push(v);const stored=new Set();
   const update=(u,v,insert)=>{if(u%beta===v%beta){const k=u+','+v;if(insert)stored.add(k);else stored.delete(k);}updates++};
   for(const[u,v]of pairs)update(u,v,true);for(let i=0;i<pairs.length;i++)if(!(graph&(1<<i)))update(...pairs[i],false);
   let found=0;for(const g of groups){const allowed=g.reduce((a,v)=>a|(1<<v),0),inEdges=[...stored].map(k=>k.split(',').map(Number)),candidate=optimum(n,inEdges,allowed);if(pop(candidate)>pop(found))found=candidate;}
   assert(independent(found,edges));assert(pop(found)*beta>=opt);assert(groups.reduce((a,g)=>a+g.length*g.length,0)<=n*n/beta+2*n+beta);partitions++;
  }graphs++;
 }}
const L=2**20;for(const t of[0,.1,.25,.49,.499])assert(t*L<=L/2-Math.log2(36*L));for(const t of[0,.5,.9,.999])assert(t*L<=L-Math.log2(L));
assert(!(.5*L<=L/2-Math.log2(36*L)));assert(!(L<=L-Math.log2(L)));
console.log(JSON.stringify({status:'pass',pair:ID,graphs,partitions,updates,viewports:8,sourceScope:true,keyboardAndLifecycle:true}));

