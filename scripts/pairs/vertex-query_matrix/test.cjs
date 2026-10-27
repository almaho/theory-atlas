const fs=require('fs'),vm=require('vm'),assert=require('assert');
const read=n=>fs.readFileSync(__dirname+'/'+n,'utf8'),data=JSON.parse(read('../../../data/focus/vertex-query-matrix.json')),input=JSON.parse(read('input-research.json')),patch=JSON.parse(read('research-patch.json')),reg=JSON.parse(read('registration.json'));
function renderer(d=data){const c={window:{},document:{getElementById:()=>({textContent:JSON.stringify({focus:{'vertex-query_matrix':d}})})},AbortController};vm.runInNewContext(read('../../../src/vertex-query-matrix.js'),c);return c.window.AtlasPairRenderers['vertex-query_matrix']}
const R=renderer(),rows=[...data.verifiedRecords,...data.relatedResults],upper=rows.find(r=>r.kind==='algorithm'),lower=rows.find(r=>r.kind==='lower');
for(const name of['mount','summarySVG','diagramSVG','records','release'])assert.equal(typeof R[name],'function');
assert.equal(rows.length,2);assert.equal(Object.keys(data.sources).length,1);
for(const s of input.slices)for(const r of s.results){assert(rows.some(x=>x.id===r.id));const updated=patch.upsertSlices.find(x=>x.id===s.id).results.find(x=>x.id===r.id);assert(updated);assert.equal(updated.plot,null);}
assert.equal(Object.keys(upper.variants).length,2);assert(upper.variants.randomized.expectation.includes('E_{G∼U} E_r'));assert.equal(upper.variants.randomized.displayBound,'O(nk)');assert.equal(upper.variants.deterministic.displayBound,'Õ(nk)');
assert.equal(upper.kRange,'2 ≤ k ≤ n^(1/37)');assert.equal(lower.kRange,'2 ≤ k ≤ n^(1/3)');assert(lower.theorem.includes('Theorem 9'));assert(lower.probability.includes('every random string'));
assert(upper.assumptions.some(a=>a.includes('never FAIL')));assert(upper.output.includes('Unused colors are allowed'));assert(lower.assumptions.some(a=>a.includes('k=1')));
assert(data.figureAxes.average.x.categories.some(c=>c.label==='n^(1/37)'));assert.deepEqual(data.figureAxes.average.y.categories.map(c=>c.label),['1','polylog n']);assert(!reg.pointFields);
assert.equal(data.userSetupChoice.confirmedOn,'2026-10-27');
assert.equal(R.records().length,2);assert.equal(R.records({publication:'published'}).length,2);
const fakePreprint=JSON.parse(JSON.stringify(data));Object.values(fakePreprint.sources)[0].publicationStatus='preprint';const F=renderer(fakePreprint);assert.equal(F.records({publication:'published'}).length,0);
const sizes=[[738,548],[330,245],[360,245],[1000,548],[60,50],[180,130],[289,245],[290,245],[700,540],[700,500],[738,240],[500,548],[1200,800]];let checked=0;
for(const resource of['queries','time'])for(const[w,h]of sizes){
 const svg=R.summarySVG('vertex-query_matrix',w,h,{resource});
 assert(!/NaN|undefined/.test(svg));assert(svg.includes('viewBox="0 0 '+w+' '+h+'"'));assert(svg.includes('data-resource="'+resource+'"'));
 for(const m of svg.matchAll(/data-center-x="([^"]+)" data-center-y="([^"]+)"/g)){assert(+m[1]>=0&&+m[1]<=w);assert(+m[2]>=0&&+m[2]<=h);}
 for(const m of svg.matchAll(/<text x="([^"]+)" y="([^"]+)"/g)){assert(+m[1]>=0&&+m[1]<=w);assert(+m[2]>=0&&+m[2]<=h,'text outside '+w+'x'+h);}
 assert.equal((svg.match(/data-kind="algorithm"/g)||[]).length,2);assert.equal((svg.match(/data-kind="lower"/g)||[]).length,1);
 const cut=+svg.match(/class="vqm-cut" d="M([^ ]+)/)[1];
 for(const line of svg.matchAll(/class="vqm-upper-line" d="M[^H]+H([^"]+)"/g))assert(+line[1]<=cut+.01,'upper range crossed endpoint');
 const end=+svg.match(/class="vqm-lower-line" d="M[^H]+H([^"]+)"/)[1];assert(end>cut,'lower-only extension missing');
 assert(!R.summarySVG('vertex-query_matrix',w,h,{resource,level:'overview'}).includes('<text '));checked++;
}
const large=R.summarySVG('vertex-query_matrix',738,548),compact=R.summarySVG('vertex-query_matrix',330,245);
assert(large.includes('data-detail-level="detail"'));assert(compact.includes('data-detail-level="compact"'));
for(const svg of[large,compact])for(const formula of['>O(nk)<','>Õ(nk)<','>Ω(nk)<','>n^(1/37)<','>n^(1/3)<'])assert(svg.includes(formula));
assert(large.includes('Average pair queries / (nk)'));assert(R.diagramSVG({resource:'time'}).includes('Average total time / (nk)'));
assert(R.diagramSVG({}).includes('role="button" tabindex="0"'));assert(!F.summarySVG('vertex-query_matrix',738,548,{publication:'published'}).includes('data-kind="algorithm"'));
assert(read('../../../src/vertex-query-matrix.css').includes('.vqm-scroll{overflow-x:auto'));assert(read('../../../src/vertex-query-matrix.css').includes('.vqm-plot{min-width:660px}'));
for(const name of['surface','ink','muted','line','green','red'])assert(read('../../../src/vertex-query-matrix.css').includes('var(--'+name+')'));
assert(read('../../../src/vertex-query-matrix.css').includes('.vqm-map .vqm-low-label'));assert(read('../../../src/vertex-query-matrix.css').includes('.vqm-point[aria-pressed=false] .vqm-selection{display:none}'));
function fakeRoot(){
 const nodes={},events={},signals=[],tabs=['queries','time'].map(resource=>({dataset:{vqmResource:resource},setAttribute(k,v){this[k]=v}})),points=[['algorithm','randomized'],['algorithm','deterministic'],['lower','both']].map(([kind,mode])=>({dataset:{vqmResult:kind==='algorithm'?upper.id:lower.id,vqmMode:mode},setAttribute(k,v){this[k]=v}}));
 const root={isConnected:true,innerHTML:'',classList:{add(){},remove(){},toggle(){}},setAttribute(){},querySelector:s=>nodes[s]||(nodes[s]={innerHTML:'',value:''}),querySelectorAll:s=>s==='[data-vqm-resource]'?tabs:points,addEventListener(n,f,o){events[n]=f;signals.push(o.signal)}};
 return{root,nodes,events,signals,points,tabs};
}
function target(type,value,mode='randomized'){const n={dataset:type==='tab'?{vqmResource:value}:{vqmResult:value,vqmMode:mode}};return{closest:s=>s==='[data-vqm-resource]'?(type==='tab'?n:null):(s==='[data-vqm-result]'||s==='.vqm-point')&&type==='point'?n:null}}
const f=fakeRoot();let publication;const instance=R.mount(f.root,'vertex-query_matrix',{onPublicationChange:p=>publication=p});
assert(f.nodes['.vqm-theorem'].innerHTML.includes('Theorem 1; Algorithm 11'));assert(f.nodes['.vqm-theorem'].innerHTML.includes('Query upper bounds follow'));
let prevented=false;f.events.keydown({key:'Enter',target:target('point',upper.id,'deterministic'),preventDefault(){prevented=true}});assert(prevented);assert(f.nodes['.vqm-theorem'].innerHTML.includes('Theorem 2; Algorithm 13'));assert.equal(f.points[1]['aria-pressed'],'true');assert.equal(f.points[0]['aria-pressed'],'false');
f.events.click({target:target('point',lower.id,'both')});assert(f.nodes['.vqm-theorem'].innerHTML.includes('Theorem 9'));assert(f.nodes['.vqm-theorem'].innerHTML.includes('every random string'));assert(f.nodes['.vqm-theorem'].innerHTML.includes('n^(1/3)'));
f.events.click({target:target('tab','time')});assert(f.nodes['.vqm-plot'].innerHTML.includes('data-resource="time"'));assert(f.nodes['.vqm-subtitle'].textContent.includes('Average total time'));assert(f.nodes['.vqm-theorem'].innerHTML.includes('query lower bound also bounds total time'));
f.events.keydown({key:' ',target:target('point',upper.id,'randomized'),preventDefault(){}});assert(f.nodes['.vqm-theorem'].innerHTML.includes('E_{G∼U} E_r T(G,r)'));
f.events.change({target:{value:'published',classList:{contains:s=>s==='vqm-publication'}}});assert.equal(publication,'published');instance.redraw();assert(f.nodes['.vqm-plot'].innerHTML.includes('data-resource="time"'));assert(f.nodes['.vqm-theorem'].innerHTML.includes('https://arxiv.org/html/2607.26592v1'));
R.release(f.root);assert(f.signals.every(s=>s.aborted));R.mount(f.root);const second=f.signals.slice(3);R.mount(f.root);assert(second.every(s=>s.aborted));R.release(f.root);
const g=fakeRoot();F.mount(g.root,'vertex-query_matrix',{publication:'published'});assert(g.nodes['.vqm-theorem'].innerHTML.includes('No theorem'));g.events.change({target:{value:'all',classList:{contains:s=>s==='vqm-publication'}}});assert(g.nodes['.vqm-theorem'].innerHTML.includes('randomized algorithm'));assert(g.nodes['.vqm-plot'].innerHTML.includes('aria-pressed="true"'));F.release(g.root);
console.log(JSON.stringify({status:'pass',originalRecords:2,upperVariants:2,papers:1,viewports:checked,queryTimeSeparation:true,validityEndpoints:true,publicationFilter:true,keyboardInspector:true,lifecycle:true,zeroErrorScope:true,overviewTextNodes:0,themeVariables:true,narrowContainerScroll:true}));
