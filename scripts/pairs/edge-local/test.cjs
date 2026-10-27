const fs=require('fs'),vm=require('vm'),assert=require('assert');
const read=name=>fs.readFileSync(__dirname+'/'+name,'utf8'),data=JSON.parse(read('../../../data/focus/edge-local.json')),input=JSON.parse(read('input-research.json')),patch=JSON.parse(read('research-patch.json')),reg=JSON.parse(read('registration.json'));
const context={window:{},document:{getElementById:()=>({textContent:JSON.stringify({focus:{'edge-local':data}})})},AbortController};
vm.runInNewContext(read('../../../src/edge-local.js'),context);const R=context.window.AtlasPairRenderers['edge-local'],all=[...data.verifiedRecords,...data.relatedResults];
for(const method of['mount','summarySVG','diagramSVG','records','release'])assert.equal(typeof R[method],'function');
assert.equal(all.length,17);assert.equal(new Set(all.map(r=>r.id)).size,17);assert.equal(Object.keys(data.sources).length,12);
for(const s of input.slices)for(const r of s.results){assert(all.some(x=>x.id===r.id),'missing '+r.id);const p=patch.upsertSlices.find(x=>x.id===s.id).results.find(x=>x.id===r.id);assert(p);assert.equal(p.plot,null);}
assert.equal(R.records().length,17);assert.equal(R.records({publication:'published'}).length,16);assert.equal(reg.routes.length,7);assert(!reg.pointFields);
for(const r of all){assert(data.figureAxes[r.panel]);assert(r.quality&&r.output&&r.graph&&r.theorem&&r.probability&&r.displayBound&&r.assumptions.length);assert(data.sources[r.sourceId].verificationUrl.startsWith('https://'));}
for(const panel of Object.values(data.figureAxes))for(const a of[panel.x,panel.y]){assert(a.label);assert(a.categories.length);assert.equal(new Set(a.categories).size,a.categories.length);}
assert.equal(data.mainComparison.fixedDegree,'Δ ≥ 3 is a constant independent of n.');
const byId=Object.fromEntries(all.map(r=>[r.id,r]));
assert(byId['edge-local-dhawan24-random'].probability.includes('1−1/poly(n)'));assert(!byId['edge-local-dhawan24-random'].probability.includes('1/Δ'));
assert.equal(byId['edge-local-bernshteyn22-vizing'].displayBound,'poly(Δ, log n)');
assert(byId['local-near-delta-disc26'].quality.includes('O(√log n)'));assert(byId['local-near-delta-disc26'].assumptions.some(x=>x.includes('Δ ≥ c√log n')));
assert(byId['edge-local-bbko22'].displayBound.includes('log¹²Δ'));
assert(byId['edge-local-jakob25-random'].displayBound.includes('log¹²Δ'));
for(let delta=3;delta<100;delta++)assert(Math.floor(3*delta/2)<=2*delta-2);
const sizes=[[738,548],[330,245],[1000,570],[360,245],[200,140],[60,50],[290,210],[500,548],[738,245],[1200,800]],keys=['edge-local','edge-local-variable','edge-local-multigraph'];let checked=0;
for(const key of keys)for(const[w,h]of sizes){
const svg=R.summarySVG(key,w,h);assert(!/NaN|undefined/.test(svg));assert(svg.includes('viewBox="0 0 '+w+' '+h+'"'));
for(const m of svg.matchAll(/data-center-x="([^"]+)" data-center-y="([^"]+)"/g)){assert(+m[1]>=0&&+m[1]<=w);assert(+m[2]>=0&&+m[2]<=h);}
for(const m of svg.matchAll(/<text x="([^"]+)" y="([^"]+)"/g)){assert(+m[1]>=0&&+m[1]<=w,'textX '+m[1]+'/'+w);assert(+m[2]>=0&&+m[2]<=h,'textY '+m[2]+'/'+h);}
if(w===738&&h===548)assert(svg.includes('data-detail-level="detail"'));
if(w===330&&h===245){assert(svg.includes('data-detail-level="compact"'));if(key==='edge-local')assert(svg.includes('>2Δ−1<')&&svg.includes('>2Δ−2<'));}
assert(!R.summarySVG(key,w,h,{level:'overview'}).includes('<text '));
checked++;
}
const main=R.summarySVG('edge-local',738,548),compact=R.summarySVG('edge-local',330,245),multi=R.summarySVG('edge-local-multigraph',738,548);
assert.equal((main.match(/data-kind="algorithm"/g)||[]).length,4);assert.equal((main.match(/data-kind="lower"/g)||[]).length,2);
assert(main.includes('Θ(log n)')&&main.includes('Θ(log log n)'));assert(!compact.includes('Θ('));assert(main.includes('data-axis="x"')&&main.includes('data-axis="y"'));
assert.equal((multi.match(/data-edge-local-context="multigraph-transfer"/g)||[]).length,2);assert(multi.includes('data-axis="x"')&&multi.includes('data-axis="y"'));
assert(!R.summarySVG('edge-local-variable',738,548,{publication:'published'}).includes('data-edge-local-result="local-near-delta-disc26"'));
assert(R.summarySVG('edge-local-variable',738,548).includes('data-edge-local-result="local-near-delta-disc26"'));assert(R.summarySVG('edge-local-variable',738,548).includes('data-axis="y"'));
assert(read('../../../src/edge-local.css').includes('.edge-local-scroll{overflow-x:auto'));assert(read('../../../src/edge-local.css').includes('@media(max-width:780px)'));
const nodes={},events={},signals=[],tabs=['bounded','variable','multigraph'].map(view=>({dataset:{edgeLocalView:view},setAttribute(k,v){this[k]=v}}));
const root={isConnected:true,innerHTML:'',classList:{add(){},remove(){},toggle(){}},setAttribute(){},querySelector:s=>nodes[s]||(nodes[s]={innerHTML:'',value:''}),querySelectorAll:()=>tabs,addEventListener(n,f,o){events[n]=f;signals.push(o.signal)}};
let changed;R.mount(root,'edge-local',{onPublicationChange:p=>changed=p});
assert(nodes['.edge-local-theorem'].innerHTML.includes('Corollary 3'));assert(nodes['.edge-local-records'].innerHTML.includes('local-near-delta-disc26'));
function target(type,id,mode='deterministic',context='fixed-degree'){const node={dataset:type==='view'?{edgeLocalView:id}:{edgeLocalResult:id,edgeLocalMode:mode,edgeLocalContext:context}};return{closest:s=>s==='[data-edge-local-view]'?(type==='view'?node:null):s==='[data-edge-local-result]'?(type==='result'?node:null):s==='.edge-local-point'?(type==='result'?node:null):null};}

assert(nodes['.edge-local-scope'].innerHTML.includes('simple graphs'));
assert(nodes['.edge-local-scope'].innerHTML.includes('fixed Δ ≥ 3'));
events.click({target:target('view','multigraph')});
assert.equal(nodes['.edge-local-title'].textContent,'Edge coloring with parallel edges');
assert(nodes['.edge-local-scope'].innerHTML.includes('loopless multigraphs'));
assert(!nodes['.edge-local-scope'].innerHTML.includes('simple graphs'));
events.click({target:target('view','variable')});
assert(nodes['.edge-local-scope'].innerHTML.includes('variable; restrictions per theorem'));
assert(!nodes['.edge-local-scope'].innerHTML.includes('fixed Δ'));
events.click({target:target('view','bounded')});
events.click({target:target('result','edge-local-bbko22','randomized','deterministic-reuse')});assert(nodes['.edge-local-theorem'].innerHTML.includes('correctness probability 1'));
let prevented=false;events.keydown({key:'Enter',preventDefault(){prevented=true},target:target('result','local-two-delta-minus-two-lower-2020','randomized')});assert(prevented);assert(nodes['.edge-local-theorem'].innerHTML.includes('Ω(log log n)'));
events.click({target:target('view','multigraph')});assert(nodes['.edge-local-plot'].innerHTML.includes('data-view="multigraph"'));
events.click({target:target('result','local-two-delta-minus-two-lower-2020','randomized','multigraph-transfer')});assert(nodes['.edge-local-theorem'].innerHTML.includes('simple trees belong'));
for(const r of all){events.click({target:target('result',r.id,r.mode==='randomized'?'randomized':'deterministic','source-list')});assert(nodes['.edge-local-theorem'].innerHTML.includes(r.theorem));assert(nodes['.edge-local-theorem'].innerHTML.includes(r.verificationUrl));}
events.click({target:target('result','local-near-delta-disc26','deterministic','source-list')});events.change({target:{classList:{contains:s=>s==='edge-local-publication'},value:'published'}});assert.equal(changed,'published');assert(!nodes['.edge-local-records'].innerHTML.includes('data-edge-local-result="local-near-delta-disc26"'));assert(!nodes['.edge-local-theorem'].innerHTML.includes('DISC 2026'));
R.release(root);assert(signals.every(s=>s.aborted));
R.mount(root,'edge-local');const second=signals.slice(3);R.mount(root,'edge-local');assert(second.every(s=>s.aborted));R.release(root);
console.log(JSON.stringify({status:'pass',originalRecords:17,papers:12,viewports:checked,publicationFilter:true,allTheoremsInspectable:true,keyboard:true,lifecycle:true,boundedDegreeScope:true,multigraphLowerTransfer:true,overviewTextNodes:0,compactExactPalettes:true,narrowContainerScroll:true}));
