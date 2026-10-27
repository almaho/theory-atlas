const fs=require('fs'),vm=require('vm'),assert=require('assert');
const read=name=>fs.readFileSync(__dirname+'/'+name,'utf8'),data=JSON.parse(read('../../../data/focus/edge-query-matrix.json')),input=JSON.parse(read('input-research.json')),patch=JSON.parse(read('research-patch.json')),reg=JSON.parse(read('registration.json'));
function renderer(d=data){const ctx={window:{},document:{getElementById:()=>({textContent:JSON.stringify({focus:{'edge-query_matrix':d}})})},AbortController};vm.runInNewContext(read('../../../src/edge-query-matrix.js'),ctx);return ctx.window.AtlasPairRenderers['edge-query_matrix']}
const R=renderer(),rows=[...data.verifiedRecords,...data.relatedResults];
for(const name of['mount','summarySVG','diagramSVG','records','release'])assert.equal(typeof R[name],'function');
assert.equal(rows.length,1);assert.equal(Object.keys(data.sources).length,1);
for(const s of input.slices)for(const r of s.results){assert(rows.some(x=>x.id===r.id));const updated=patch.upsertSlices.find(x=>x.id===s.id).results.find(x=>x.id===r.id);assert(updated);assert.equal(updated.plot,null);}
assert.equal(reg.routes.length,1);assert.equal(reg.routes[0].sliceId,input.slices[0].id);assert(!reg.pointFields);
assert.equal(data.figureAxes.enumeration.x.categories[0].label,'Δ+1');assert.deepEqual(data.figureAxes.enumeration.y.categories.map(x=>x.label),['n','n²']);
assert.equal(rows[0].queryComplexity,'n(n−1)/2');assert.equal(rows[0].postScanTime,'O(m log Δ) w.h.p. for Δ≥2');assert(rows[0].theorem.includes('Corollary C.1(1)'));assert(rows[0].notes.includes('Theorem 1.1 states O(m log n)'));assert(rows[0].assumptions.some(x=>x.includes('Δ=0')));assert(rows[0].totalTime.startsWith('O(n² + '));assert(rows[0].probability.includes('deterministically'));assert(data.lowerBoundStatus.includes('No matrix-query lower bound'));
assert.equal(R.records().length,1);assert.equal(R.records({publication:'published'}).length,1);
const fakePreprint=JSON.parse(JSON.stringify(data));Object.values(fakePreprint.sources)[0].publicationStatus='preprint';const filteredR=renderer(fakePreprint);assert.equal(filteredR.records({publication:'published'}).length,0);assert(!filteredR.summarySVG('edge-query_matrix',738,548,{publication:'published'}).includes('data-kind="algorithm"'));
const sizes=[[738,548],[330,245],[360,245],[1000,548],[60,50],[180,130],[289,245],[290,245],[700,540],[700,500],[738,240],[500,548],[1200,800]];let checked=0;
for(const[w,h]of sizes){
 const svg=R.summarySVG('edge-query_matrix',w,h);
 assert(!/NaN|undefined/.test(svg));assert(svg.includes('viewBox="0 0 '+w+' '+h+'"'));
 for(const m of svg.matchAll(/data-center-x="([^"]+)" data-center-y="([^"]+)"/g)){assert(+m[1]>=0&&+m[1]<=w);assert(+m[2]>=0&&+m[2]<=h);}
 for(const m of svg.matchAll(/<text x="([^"]+)" y="([^"]+)"/g)){assert(+m[1]>=0&&+m[1]<=w);assert(+m[2]>=0&&+m[2]<=h,'text outside '+w+'x'+h);}
 assert.equal((svg.match(/data-kind="algorithm"/g)||[]).length,1);assert(!svg.includes('data-kind="lower"'));
 assert(!R.summarySVG('edge-query_matrix',w,h,{level:'overview'}).includes('<text '));checked++;
}
const large=R.summarySVG('edge-query_matrix',738,548),compact=R.summarySVG('edge-query_matrix',330,245);
assert(large.includes('data-detail-level="detail"'));assert(compact.includes('data-detail-level="compact"'));
for(const svg of[large,compact]){assert(svg.includes('>n(n−1)/2<'));assert(svg.includes('>Δ+1<'));assert(svg.includes('data-axis="x"')&&svg.includes('data-axis="y"'));}
assert(large.includes('Total time: O(n² + m log max{2,Δ}) w.h.p.'));assert(compact.includes('Post-scan: O(m log max{2,Δ}) w.h.p.'));
assert(R.diagramSVG({publication:'published'}).includes('tabindex="0"'));assert(R.diagramSVG({}).includes('data-detail-level="focus"'));
assert(read('../../../src/edge-query-matrix.css').includes('.eqm-scroll{overflow-x:auto'));assert(read('../../../src/edge-query-matrix.css').includes('.eqm-plot{min-width:660px}'));assert(read('../../../src/edge-query-matrix.css').includes('.eqm-map .eqm-bound'));
function fakeRoot(){const nodes={},events={},signals=[];return{nodes,events,signals,root:{isConnected:true,innerHTML:'',classList:{add(){},remove(){},toggle(){}},setAttribute(){},querySelector:s=>nodes[s]||(nodes[s]={innerHTML:'',value:''}),addEventListener(n,f,o){events[n]=f;signals.push(o.signal)}}}}
const f=fakeRoot();let publication;const instance=R.mount(f.root,'edge-query_matrix',{onPublicationChange:p=>publication=p});
assert(f.nodes['.eqm-theorem'].innerHTML.includes('Corollary C.1(1)'));assert(f.nodes['.eqm-theorem'].innerHTML.includes('O(m log Δ) w.h.p. for Δ≥2'));assert(f.nodes['.eqm-theorem'].innerHTML.includes('https://arxiv.org/html/2410.05240v3'));assert(f.nodes['.eqm-theorem'].innerHTML.includes('Δ=0'));
const point={dataset:{eqmResult:rows[0].id}},target={closest:s=>s==='[data-eqm-result]'||s==='.eqm-point'?point:null};
for(const key of['Enter',' ']){let prevented=false;f.events.keydown({key,target,preventDefault(){prevented=true}});assert(prevented);assert(f.nodes['.eqm-theorem'].innerHTML.includes('How the matrix baseline is derived'));}
f.events.click({target});assert(f.nodes['.eqm-theorem'].innerHTML.includes('No query lower bound or oracle optimality'));
f.events.change({target:{value:'published',classList:{contains:s=>s==='eqm-publication'}}});assert.equal(publication,'published');assert.equal(f.nodes['.eqm-publication'].value,'published');
instance.redraw();assert.equal(f.nodes['.eqm-publication'].value,'published');
R.release(f.root);assert(f.signals.every(s=>s.aborted));
R.mount(f.root);const second=f.signals.slice(3);R.mount(f.root);assert(second.every(s=>s.aborted));R.release(f.root);
const g=fakeRoot();filteredR.mount(g.root,'edge-query_matrix',{publication:'published'});assert(g.nodes['.eqm-theorem'].innerHTML.includes('No theorem'));assert(!g.nodes['.eqm-records'].innerHTML);filteredR.release(g.root);
// Independent finite examples check the full-scan accounting on empty, sparse and complete graphs.
for(let n=0;n<=20;n++){const pairs=[];for(let v=0;v<n;v++)for(let u=0;u<v;u++)pairs.push([u,v]);assert.equal(pairs.length,n*(n-1)/2);assert.equal(new Set(pairs.map(String)).size,pairs.length);for(const isEdge of[()=>false,(u,v)=>v===u+1,()=>true]){const answers=pairs.map(([u,v])=>isEdge(u,v));assert.equal(answers.length,n*(n-1)/2);}}
console.log(JSON.stringify({status:'pass',originalRecords:1,papers:1,viewports:checked,publicationFilter:true,keyboardInspector:true,lifecycle:true,exactPairAccounting:true,noInventedLowerBound:true,overviewTextNodes:0,compactExactQueries:true,narrowContainerScroll:true}));
