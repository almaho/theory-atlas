const fs=require('fs'),vm=require('vm'),assert=require('assert');
const read=n=>fs.readFileSync(__dirname+'/'+n,'utf8'),data=JSON.parse(read('../../../data/focus/vertex-query-list.json')),input=JSON.parse(read('input-research.json')),patch=JSON.parse(read('research-patch.json')),reg=JSON.parse(read('registration.json'));
function renderer(d=data){const c={window:{},document:{getElementById:()=>({textContent:JSON.stringify({focus:{'vertex-query_list':d}})})},AbortController};vm.runInNewContext(read('../../../src/vertex-query-list.js'),c);return c.window.AtlasPairRenderers['vertex-query_list']}
const R=renderer(),row=data.verifiedRecords[0];
for(const name of['mount','summarySVG','diagramSVG','records','release'])assert.equal(typeof R[name],'function');
assert.equal(data.verifiedRecords.length,1);assert.equal(Object.keys(data.sources).length,1);assert.equal(row.id,input.slices[0].results[0].id);assert.equal(patch.upsertSlices[0].results[0].plot,null);assert(reg.canonicalAliases);
assert.equal(row.queryComplexity,'Q=n+2m ≤ n(Δ+1) ≤ n²');assert(row.derivation.some(x=>x.includes('one terminal call')));assert(row.assumptions.some(x=>x.includes('does not need Δ')));assert(row.assumptions.some(x=>x.includes('No degree or pair')));assert(row.assumptions.some(x=>x.includes('When m=0')));assert(row.notes.includes('not a new author-stated optimality theorem'));
assert.equal(row.kind,'algorithm');assert(data.lowerBoundStatus.includes('No applicable neighbor-only'));assert(data.lowerBoundStatus.includes('quantum'));assert.equal(data.figureAxes.greedy.y.categories[0].label,'n+2m');assert(!reg.pointFields);
const source=Object.values(data.sources)[0];assert(source.versionNote.includes('only v1'));assert(!source.versionNote.includes('v3'));assert.equal(source.publicationStatus,'preprint');assert.equal(R.records().length,1);assert.equal(R.records({publication:'published'}).length,0);
const sizes=[[738,548],[330,245],[360,245],[1000,548],[60,50],[180,130],[299,245],[300,245],[730,548],[738,240],[500,548],[1200,800]];
for(const[w,h]of sizes){
 const svg=R.summarySVG('vertex-query_list',w,h);assert(!/NaN|undefined/.test(svg));assert(svg.includes('viewBox="0 0 '+w+' '+h+'"'));
 for(const m of svg.matchAll(/data-center-x="([^"]+)" data-center-y="([^"]+)"/g)){assert(+m[1]>=0&&+m[1]<=w);assert(+m[2]>=0&&+m[2]<=h);}
 for(const m of svg.matchAll(/<text x="([^"]+)" y="([^"]+)"/g)){assert(+m[1]>=0&&+m[1]<=w);assert(+m[2]>=0&&+m[2]<=h);}
 assert.equal((svg.match(/data-kind="algorithm"/g)||[]).length,1);assert(!svg.includes('data-kind="lower"'));assert(!R.summarySVG('vertex-query_list',w,h,{level:'overview'}).includes('<text '));
 assert(!R.summarySVG('vertex-query_list',w,h,{publication:'published'}).includes('data-kind="algorithm"'));
}
const large=R.summarySVG('vertex-query_list',738,548),compact=R.summarySVG('vertex-query_list',330,245);
assert(large.includes('data-detail-level="detail"'));assert(compact.includes('data-detail-level="compact"'));
for(const svg of[large,compact]){assert(svg.includes('>n+2m<'));assert(svg.includes('>Δ+1<'));assert(!svg.includes('RAM time'));}
for(const formula of['n calls','Θ(n) calls','Θ(n²) calls','m=0','m=O(n)','m=Θ(n²)'])assert(large.includes(formula));
assert(R.diagramSVG({}).includes('role="button" tabindex="0"'));assert(read('../../../src/vertex-query-list.css').includes('.vql-scroll{overflow-x:auto'));assert(read('../../../src/vertex-query-list.css').includes('.vql-plot{min-width:680px}'));assert(read('../../../src/vertex-query-list.css').includes('.vql-map .vql-tick'));
for(const name of['surface','ink','muted','line','green'])assert(read('../../../src/vertex-query-list.css').includes('var(--'+name+')'));
// Exhaustively verify the exact oracle accounting and greedy guarantee on all labeled graphs through n=5.
function scanGreedy(n,edges){
 const lists=Array.from({length:n},()=>[]);for(const[u,v]of edges){lists[u].push(v);lists[v].push(u)}lists.forEach(a=>a.reverse());
 let calls=0,endTests=0;const color=Array(n).fill(0),mark=Array(n+1).fill(-1);
 const neighbor=(v,j)=>{calls++;if(j>lists[v].length){endTests++;return null}return lists[v][j-1]};
 for(let v=0;v<n;v++){for(let j=1;;j++){const u=neighbor(v,j);if(u===null)break;if(color[u])mark[color[u]]=v}let c=1;while(mark[c]===v)c++;color[v]=c}
 return{calls,endTests,color,delta:Math.max(0,...lists.map(x=>x.length))};
}
let graphs=0;
for(let n=1;n<=5;n++){const pairs=[];for(let u=0;u<n;u++)for(let v=u+1;v<n;v++)pairs.push([u,v]);for(let mask=0;mask<2**pairs.length;mask++){const edges=pairs.filter((_,i)=>mask&(1<<i)),result=scanGreedy(n,edges);assert.equal(result.calls,n+2*edges.length);assert.equal(result.endTests,n);assert(result.calls<=n*(result.delta+1));assert(result.calls<=n*n);assert(result.color.every(c=>c>=1&&c<=result.delta+1));for(const[u,v]of edges)assert.notEqual(result.color[u],result.color[v]);graphs++;}}
function fakeRoot(){const nodes={},events={},signals=[];return{nodes,events,signals,root:{isConnected:true,innerHTML:'',classList:{add(){},remove(){},toggle(){}},setAttribute(){},querySelector:s=>nodes[s]||(nodes[s]={innerHTML:'',value:''}),addEventListener(n,f,o){events[n]=f;signals.push(o.signal)}}}}
const f=fakeRoot();let publication;const instance=R.mount(f.root,'vertex-query_list',{onPublicationChange:p=>publication=p});
assert(f.nodes['.vql-theorem'].innerHTML.includes('O(n+m)'));assert(f.nodes['.vql-theorem'].innerHTML.includes('one terminal call'));assert(f.nodes['.vql-theorem'].innerHTML.includes('O(n) auxiliary words'));assert(f.nodes['.vql-theorem'].innerHTML.includes('https://arxiv.org/html/2502.06024#S1'));
const target={closest:s=>s==='[data-vql-result]'||s==='.vql-point'?{dataset:{vqlResult:row.id}}:null};let prevented=false;f.events.keydown({key:'Enter',target,preventDefault(){prevented=true}});assert(prevented);f.events.keydown({key:' ',target,preventDefault(){}});f.events.click({target});
f.events.change({target:{value:'published',classList:{contains:s=>s==='vql-publication'}}});assert.equal(publication,'published');assert(f.nodes['.vql-theorem'].innerHTML.includes('No theorem'));assert(!f.nodes['.vql-plot'].innerHTML.includes('data-kind="algorithm"'));instance.redraw();assert.equal(f.nodes['.vql-publication'].value,'published');
f.events.change({target:{value:'all',classList:{contains:s=>s==='vql-publication'}}});assert(f.nodes['.vql-theorem'].innerHTML.includes('Deterministic'));R.release(f.root);assert(f.signals.every(s=>s.aborted));R.mount(f.root);const second=f.signals.slice(3);R.mount(f.root);assert(second.every(s=>s.aborted));R.release(f.root);
console.log(JSON.stringify({status:'pass',originalRecords:1,papers:1,viewports:sizes.length,exhaustiveGraphs:graphs,exactNeighborCount:true,isolates:true,greedyPalette:true,queryOnlyMainAxes:true,publicationFilter:true,keyboardInspector:true,lifecycle:true,overviewTextNodes:0,themeVariables:true,narrowContainerScroll:true}));
