const fs=require('fs'),vm=require('vm'),assert=require('assert');
const data=JSON.parse(fs.readFileSync(__dirname+'/../../../data/focus/mis-mpc.json','utf8')),input=JSON.parse(fs.readFileSync(__dirname+'/input-research.json','utf8')),patch=JSON.parse(fs.readFileSync(__dirname+'/research-patch.json','utf8'));
const context={window:{},document:{getElementById:()=>({textContent:JSON.stringify({focus:{'mis-mpc':data}})})},AbortController};vm.runInNewContext(fs.readFileSync(__dirname+'/../../../src/mis-mpc.js','utf8'),context);const R=context.window.AtlasPairRenderers['mis-mpc'];
assert.equal(R.records().length,13);assert.equal(R.records({publication:'published'}).length,11);
const every=[...data.verifiedRecords,...data.relatedResults],map=new Map(every.map(r=>[r.id,r]));
for(const s of input.slices)for(const r of s.results){assert(map.has(r.id),'Original ID lost '+r.id);assert(patch.upsertSlices.some(t=>t.results.some(z=>z.id===r.id)));}
assert(map.get('mis-mpc-ghaffari-et-al-rounds').displayBound.includes('log log Δ'));assert(map.get('mis-mpc-ghaffari-uitto-2019-lowspace').displayBound.includes('√log log n'));
assert(data.verifiedRecords.filter(r=>r.kind==='lower').every(r=>r.conditional&&r.componentStability==='component-stable required'&&r.setup!=='trees'&&r.setup!=='bounded'));
assert(data.relatedResults.some(r=>r.id==='mis-mpc-bfu19-extra-global-memory'&&r.totalMemory.includes('1+2ε/3')));
for(const r of data.verifiedRecords){assert(data.figureAxes[r.panel]);assert(data.setups.some(s=>s.id===r.setup));assert(data.lanes.some(s=>s.id===r.plotLane));assert(r.localMemory&&r.totalMemory&&r.theorem&&r.probability);}
const counts=[];for(const [w,h] of [[180,110],[330,245],[500,260],[738,548],[180,548],[738,110]]){const svg=R.summarySVG('mis-mpc',w,h,{});assert(!/NaN|undefined/.test(svg));for(const m of svg.matchAll(/data-center-x="([^"]+)" data-center-y="([^"]+)"/g)){assert(+m[1]>0&&+m[1]<w);assert(+m[2]>0&&+m[2]<h);}const n=(svg.match(/<text /g)||[]).length;counts.push(n);if(w<220||h<140)assert.equal(n,0);assert(svg.includes('data-marker="lower"'));}
assert(counts[1]<counts[2]&&counts[2]<counts[3]);const svg=R.diagramSVG();assert(svg.includes('data-axis="x"')&&svg.includes('data-axis="y"'));for(const r of data.verifiedRecords)assert(svg.includes('data-mis-mpc-result="'+r.id+'"'));
const nodes={},events={},signals=[];const root={isConnected:true,classList:{add(){},remove(){},toggle(){}},setAttribute(){},querySelector:s=>nodes[s]||(nodes[s]={innerHTML:'',value:'',hidden:false}),addEventListener(n,f,o){events[n]=f;signals.push(o.signal)}};let changed;
R.mount(root,'mis-mpc',{onPublicationChange:p=>changed=p});assert(nodes['.mim-theorem'].innerHTML.includes('Connectivity conjecture'));
events.click({target:{closest:()=>({dataset:{misMpcResult:'mis-mpc-latypov-constant-degree-tree'}})}});assert(nodes['.mim-theorem'].innerHTML.includes('constant maximum degree'));
events.change({target:{classList:{contains:()=>true},value:'published'}});assert.equal(changed,'published');assert(!nodes['.mim-plot-host'].innerHTML.includes('mis-mpc-latypov'));
R.release(root);assert(signals.every(s=>s.aborted));console.log(JSON.stringify({status:'pass',main:13,related:2,originalPreserved:input.slices.flatMap(s=>s.results).length,publicationCounts:[13,11],textCounts:counts,viewports:6}));
