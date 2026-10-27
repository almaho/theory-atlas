const fs=require('fs'),vm=require('vm'),assert=require('assert');
const read=n=>fs.readFileSync(__dirname+'/'+n,'utf8'),data=JSON.parse(read('../../../data/focus/vertex-mpc.json')),input=JSON.parse(read('input-research.json')),patch=JSON.parse(read('research-patch.json')),reg=JSON.parse(read('registration.json'));
function renderer(d=data){const c={window:{},document:{getElementById:()=>({textContent:JSON.stringify({focus:{'vertex-mpc':d}})})},AbortController};vm.runInNewContext(read('../../../src/vertex-mpc.js'),c);return c.window.AtlasPairRenderers['vertex-mpc']}
const R=renderer(),rows=[...data.verifiedRecords,...data.relatedResults],by=id=>rows.find(r=>r.id===id);
for(const name of['mount','summarySVG','diagramSVG','records','release'])assert.equal(typeof R[name],'function');
assert.equal(rows.length,7);assert.equal(Object.keys(data.sources).length,6);assert.equal(patch.upsertSlices.length,4);assert.equal(reg.routes.filter(r=>r.visible).length,1);assert(data.canonicalAliases);assert(reg.canonicalAliases);
for(const s of input.slices)for(const r of s.results){assert(by(r.id));const updated=patch.upsertSlices.find(x=>x.id===s.id).results.find(x=>x.id===r.id);assert(updated);assert.equal(updated.plot,null);}
assert(rows.every(r=>r.kind==='algorithm'));assert(data.lowerBoundStatus.includes('No verified'));assert(data.lowerBoundStatus.includes('component-stable'));
assert.equal(by('vertex-result-43').contract,'degree-list');assert.equal(by('vertex-result-43').theorem,'Theorem 4 (degree+1 list coloring)');
assert.equal(by('vertex-result-41').totalMemory,'O(nΔ)');assert.equal(by('vertex-result-41').variants.uniform.totalMemory,'O(m+n)');
assert(by('vertex-mpc-chang-et-al-low-memory-2019').qualification.includes('Explicit list storage'));assert(by('vertex-mpc-czumaj-davies-parter-2021').localWork.includes('exp(n^φ)'));
assert(by('vertex-extended-vertex-mpc-linear-memory-delta-plus-one-9').totalMemory.startsWith('Not specified'));assert(by('vertex-mpc-ack-2019').localWork.includes('Polynomial-time'));
const deg=by('vertex-extra-60');assert.equal(deg.panel,'degeneracy');assert.equal(deg.localMemory,'O(n log²n) bits');assert(deg.totalMemory.includes('O(n²log²n)'));assert(deg.quality.includes('κ+1'));assert(deg.assumptions.some(a=>a.includes('κ=ω(log n)')));assert(deg.notes.includes('Congested Clique'));
assert(!reg.pointFields);for(const panel of Object.values(data.figureAxes))for(const axis of Object.values(panel)){assert(axis.label);assert.equal(axis.kind,'categorical');assert(axis.categories.length);}
assert.equal(R.records().length,7);assert.equal(R.records({publication:'published'}).length,7);assert.equal(R.records({contract:'degree-list'}).length,2);
const fakePreprint=JSON.parse(JSON.stringify(data));Object.values(fakePreprint.sources).forEach(s=>s.publicationStatus='preprint');const F=renderer(fakePreprint);assert.equal(F.records({publication:'published'}).length,0);
const sizes=[[738,548],[330,245],[360,245],[1000,548],[60,50],[180,130],[299,245],[300,245],[700,540],[700,500],[738,240],[500,548],[1200,800]];
let checked=0;for(const[w,h]of sizes)for(const contract of['all','degree-list','degeneracy']){
 const svg=R.summarySVG('vertex-mpc',w,h,{contract});assert(!/NaN|undefined/.test(svg));assert(svg.includes('viewBox="0 0 '+w+' '+h+'"'));
 for(const m of svg.matchAll(/data-center-x="([^"]+)" data-center-y="([^"]+)"/g)){assert(+m[1]>=0&&+m[1]<=w);assert(+m[2]>=0&&+m[2]<=h);}
 for(const m of svg.matchAll(/<text x="([^"]+)" y="([^"]+)"/g)){assert(+m[1]>=0&&+m[1]<=w);assert(+m[2]>=0&&+m[2]<=h,'text outside '+w+'x'+h);}
 assert.equal((svg.match(/data-kind="algorithm"/g)||[]).length,R.records({contract}).length);assert(!svg.includes('data-kind="lower"'));assert(!R.summarySVG('vertex-mpc',w,h,{contract,level:'overview'}).includes('<text '));checked++;
}
const large=R.summarySVG('vertex-mpc',738,548),compact=R.summarySVG('vertex-mpc',330,245);
assert(large.includes('data-detail-level="detail"'));assert(compact.includes('data-detail-level="compact"'));
for(const svg of[large,compact])for(const formula of['>O(n^φ)<','>O(n)<','>Õ(n)<','>√loglog n<','>logloglog n<','κ+o(κ)','exp(n^φ)'])assert(svg.includes(formula));
assert(large.includes('No verified MPC lower bound'));assert(R.diagramSVG({contract:'degeneracy'}).includes('data-contract="degeneracy"'));assert(!R.diagramSVG({contract:'degeneracy'}).includes('data-contract="delta-list"'));
assert(R.diagramSVG({}).includes('role="button" tabindex="0"'));assert(!F.summarySVG('vertex-mpc',738,548,{publication:'published'}).includes('data-kind="algorithm"'));
assert(read('../../../src/vertex-mpc.css').includes('.vmpc-scroll{overflow-x:auto'));assert(read('../../../src/vertex-mpc.css').includes('.vmpc-plot{min-width:680px}'));
for(const name of['surface','ink','muted','line','green'])assert(read('../../../src/vertex-mpc.css').includes('var(--'+name+')'));
assert(read('../../../src/vertex-mpc.css').includes('.vmpc-map .vmpc-tick'));assert(read('../../../src/vertex-mpc.css').includes('.vmpc-point[aria-pressed=false] .vmpc-selection{display:none}'));
function fakeRoot(){
 const nodes={},events={},signals=[],points=rows.map(r=>({dataset:{vmpcResult:r.id},setAttribute(k,v){this[k]=v}}));
 const root={isConnected:true,innerHTML:'',classList:{add(){},remove(){},toggle(){}},setAttribute(){},querySelector:s=>nodes[s]||(nodes[s]={innerHTML:'',value:''}),querySelectorAll:()=>points,addEventListener(n,f,o){events[n]=f;signals.push(o.signal)}};
 return{root,nodes,events,signals,points};
}
const target=id=>({closest:s=>s==='[data-vmpc-result]'||s==='.vmpc-point'?{dataset:{vmpcResult:id}}:null});
const f=fakeRoot();let publication;const instance=R.mount(f.root,'vertex-mpc',{onPublicationChange:p=>publication=p});
assert(f.nodes['.vmpc-theorem'].innerHTML.includes('exp(n^φ)'));let prevented=false;
f.events.keydown({key:'Enter',target:target('vertex-result-41'),preventDefault(){prevented=true}});assert(prevented);assert(f.nodes['.vmpc-theorem'].innerHTML.includes('O(nΔ)'));assert(f.nodes['.vmpc-theorem'].innerHTML.includes('Theorem 3'));assert(f.nodes['.vmpc-theorem'].innerHTML.includes('O(m+n)'));assert.equal(f.points.find(p=>p.dataset.vmpcResult==='vertex-result-41')['aria-pressed'],'true');
f.events.click({target:target('vertex-mpc-chang-et-al-low-memory-2019')});assert(f.nodes['.vmpc-theorem'].innerHTML.includes('Explicit list storage'));
f.events.keydown({key:' ',target:target('vertex-extra-60'),preventDefault(){}});assert(f.nodes['.vmpc-theorem'].innerHTML.includes('κ+1'));assert(f.nodes['.vmpc-theorem'].innerHTML.includes('O(n²log²n)'));
f.events.change({target:{value:'degree-list',classList:{contains:s=>s==='vmpc-contract'}}});assert(f.nodes['.vmpc-subtitle'].textContent.includes('d(v)+1'));assert(!f.nodes['.vmpc-plot'].innerHTML.includes('data-contract="uniform"'));assert(f.nodes['.vmpc-theorem'].innerHTML.includes('d(v)+1'));
f.events.change({target:{value:'published',classList:{contains:s=>s==='vmpc-publication'}}});assert.equal(publication,'published');instance.redraw();assert.equal(f.nodes['.vmpc-contract'].value,'degree-list');assert(f.nodes['.vmpc-theorem'].innerHTML.includes('https://arxiv.org/html/2112.00604#S8'));
R.release(f.root);assert(f.signals.every(s=>s.aborted));R.mount(f.root);const second=f.signals.slice(3);R.mount(f.root);assert(second.every(s=>s.aborted));R.release(f.root);
const g=fakeRoot();F.mount(g.root,'vertex-mpc',{publication:'published'});assert(g.nodes['.vmpc-theorem'].innerHTML.includes('No theorem'));g.events.change({target:{value:'all',classList:{contains:s=>s==='vmpc-publication'}}});assert(g.nodes['.vmpc-theorem'].innerHTML.includes('algorithm'));assert(g.nodes['.vmpc-plot'].innerHTML.includes('aria-pressed="true"'));F.release(g.root);
console.log(JSON.stringify({status:'pass',originalRecords:7,papers:6,viewports:checked,paletteScopes:true,memoryAccounting:true,expensiveLocalWork:true,degeneracySeparate:true,publicationFilter:true,keyboardInspector:true,lifecycle:true,overviewTextNodes:0,themeVariables:true,narrowContainerScroll:true}));
