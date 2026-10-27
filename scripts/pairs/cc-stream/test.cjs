'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const data=JSON.parse(fs.readFileSync(__dirname+'/../../../data/focus/cc-stream.json','utf8')),original=JSON.parse(fs.readFileSync(__dirname+'/input-research.json','utf8')),patch=JSON.parse(fs.readFileSync(__dirname+'/research-patch.json','utf8')),reg=JSON.parse(fs.readFileSync(__dirname+'/registration.json','utf8')),js=fs.readFileSync(__dirname+'/../../../src/cc-stream.js','utf8'),css=fs.readFileSync(__dirname+'/../../../src/cc-stream.css','utf8');
function load(f=data){const context={window:{},document:{getElementById(){return{textContent:JSON.stringify({focus:{'cc-stream':f}})}}},AbortController,Set};vm.runInNewContext(js,context);return context.window.AtlasPairRenderers['cc-stream']}
const api=load(),all=[...data.verifiedRecords,...data.relatedResults],by=id=>all.find(r=>r.id===id);
assert.equal(original.papers.length,14);assert.equal(all.length,24);assert.equal(new Set(all.map(r=>r.id)).size,24);
for(const s of original.slices){const next=patch.upsertSlices.find(x=>x.id===s.id);assert(next,'Slice lost');assert(reg.routes.some(r=>r.sliceId===s.id));for(const r of s.results){assert(next.results.some(x=>x.id===r.id),'Research result lost');assert(by(r.id),'Inspection result lost')}}
for(const row of all){for(const key of ['sourceId','graph','output','probability','theorem','displayBound','quality','verificationUrl','exactBound'])assert(row[key],row.id+' missing '+key);assert(data.sources[row.sourceId]);assert(row.verificationUrl.startsWith('https://'))}
assert.equal(reg.routes.filter(r=>r.visible).length,2,'Two scoped atlas facets');
assert.equal(data.verifiedRecords.length,11);assert.equal(data.relatedResults.length,13);
assert(!data.verifiedRecords.some(r=>r.panel==='partition'&&r.kind==='lower'),'Do not invent a partition barrier');
assert.equal(by('cc-stream-5-linear').evidenceStatus,'abstract_verified');assert.equal(by('cc-stream-5-linear').panel,'related');
assert.equal(by('cc-stream-mapreduce-3plus').evidenceStatus,'corroborated_primary_citation');
assert.equal(by('cc-stream-ahn-3-multipass').evidenceStatus,'theorem_scope_qualified');
assert(by('cc-stream-turnstile-alphabest').displayBound.includes('polynomial recovery'));
assert(by('cc-stream-det-summary').resourceModel.includes('synopsis'));
assert(by('cc-stream-queryefficient-2020').bound.includes('O(n+Q)'));assert.equal(by('cc-stream-queryefficient-2020').evidenceStatus,'derived_from_verified_theorem');
assert(by('cc-stream-bhaskara-2018').output.includes('not an explicit'));
assert(by('cc-stream-value-mixed-lb').quality.includes('η<6/5−c'));
assert(data.valueParameters.eta<6/5-data.valueParameters.c);
assert(by('cc-stream-value-assadi-3-additive').probability.includes('with high probability'));
assert(by('cc-stream-value-assadi-3-additive').displayBound.includes('2^{1/δ}'));
assert(by('cc-stream-ahn-weighted-log').bound.includes('ε^{−3}'));
assert.equal(by('cc-stream-value-additive-lb').exponent,data.valueParameters.epsilon);
assert.equal(by('cc-stream-node-arrival-2026').exponent,(3+data.valueParameters.alpha)/4);
for(const dimension of Object.values(data.figureAxes))for(const axis of [dimension.x,dimension.y])if(!axis.categories){assert.equal(axis.min,axis.ticks[0]);assert.equal(axis.max,axis.ticks.at(-1))}
for(const [r,f,p]of [[1,11,3],[2,17/3,5],[4,29/7,9],[32,197/63,65]]){const v=api.familyPoint(r);assert.equal(v.passes,p);assert(Math.abs(v.factor-f)<1e-12)}
for(const r of [0,-1,1.5,NaN])assert.throws(()=>api.familyPoint(r));
for(const e of [0,.25,1,NaN])assert.throws(()=>api.epsilonFor({epsilon:e}));
for(const e of data.epsilonChoices){assert(e>0&&e<.25);const g=api.geometry('cc-stream-partition',1100,650,{focus:true,epsilon:e});assert.equal(g.points.length,9);const cm=g.points.find(p=>p.id==='cc-stream-pivot-3plus'),dy=g.points.find(p=>p.id==='cc-stream-turnstile-3plus'),ca=g.points.find(p=>p.id==='cc-stream-combinatorial-1847');assert.equal(cm.factor,3+e);assert.equal(ca.factor,24/13+e);assert.equal(cm.x,dy.x);assert.equal(cm.y,dy.y);assert.equal(dy.passes,1)}
for(const key of ['cc-stream-partition','cc-stream-value'])for(const [w,h]of [[100,80],[160,90],[450,100],[110,280],[240,170],[330,245],[500,260],[738,548],[1100,650]]){
 const svg=api.summarySVG(key,w,h),g=api.geometry(key,w,h);assert(!/NaN|Infinity|undefined/.test(svg));assert(g.left<g.right&&g.top<g.bottom);
 for(const p of g.points)assert(p.x>=0&&p.x<=w&&p.y>=0&&p.y<=h,key+' point outside '+w+'x'+h);
 assert.equal((svg.match(/data-center-x=/g)||[]).length,key.includes('value')?7:9);
 if(w<240||h<170)assert(!/<text/.test(svg),'Overview annotations must be absent');
 else{assert(svg.includes('data-axis="x"'));assert(svg.includes('data-axis="y"'))}
 if(key.includes('value')){assert(svg.includes('data-kind="lower"'));assert(svg.includes('data-kind="upper"'))}else assert(!svg.includes('data-kind="lower"'));
}
assert(!/<text/.test(api.summarySVG('cc-stream-value',738,548,{level:'overview'})));
const fg=api.geometry('cc-stream-partition',1100,650,{focus:true});assert(Math.abs((fg.py(2)-fg.py(4))-(fg.py(4)-fg.py(8)))<1e-9);
const vg=api.geometry('cc-stream-value',1100,650,{focus:true});assert(Math.abs((vg.px(.25)-vg.px(0))-(vg.px(.5)-vg.px(.25)))<1e-9);
assert.equal(vg.points.find(p=>p.id==='cc-stream-node-arrival-2026').exponent,.875);
const focus=api.diagramSVG({key:'cc-stream-value'});assert(focus.includes('role="group"'));assert.equal((focus.match(/role="button"/g)||[]).length,7);assert(focus.includes('words'));assert(focus.includes('bits'));
const copy=JSON.parse(JSON.stringify(data));copy.sources['liu-2026-node-arrival'].publicationStatus='preprint';const filtered=load(copy);assert.equal(filtered.records({publication:'published'}).length,21);assert(!filtered.summarySVG('cc-stream-value',700,500,{publication:'published'}).includes('data-cc-stream-result="cc-stream-node-arrival-2026"'));
assert(css.includes('var(--red)')&&css.includes('var(--green)'));
function host(){const classes=new Set(),children=new Map(),listeners={};return{isConnected:true,innerHTML:'',classList:{add(...names){names.forEach(n=>classes.add(n))},remove(...names){names.forEach(n=>classes.delete(n))},toggle(n,on){on?classes.add(n):classes.delete(n)}},setAttribute(){},querySelector(sel){if(!children.has(sel))children.set(sel,{innerHTML:'',value:'',style:{}});return children.get(sel)},querySelectorAll(){return[]},addEventListener(name,fn,options){listeners[name]={fn,signal:options.signal}},classes,listeners}}
const root=host();let changed=null;api.mount(root,'cc-stream-partition',{onPublicationChange:v=>changed=v});
assert(root.querySelector('.cc-stream-plot').innerHTML.includes('data-panel="partition"'));
root.listeners.click.fn({target:{closest(sel){return sel==='[data-cc-stream-panel]'?{dataset:{ccStreamPanel:'value'}}:null}}});assert(root.querySelector('.cc-stream-plot').innerHTML.includes('data-panel="value"'));
root.listeners.click.fn({target:{closest(sel){return sel==='[data-cc-stream-result]'?{dataset:{ccStreamResult:'cc-stream-value-mixed-lb'}}:null}}});assert(root.querySelector('.cc-stream-theorem').innerHTML.includes('η&lt;6/5−c'));
let prevented=false;root.listeners.keydown.fn({key:'Enter',preventDefault(){prevented=true},target:{closest(){return{dataset:{ccStreamResult:'cc-stream-focs22-3plus',ccStreamR:'4'}}}}});assert(prevented);assert(root.querySelector('.cc-stream-theorem').innerHTML.includes('Selected r=4: 9 passes'));
root.listeners.change.fn({target:{value:'0.2',classList:{contains:n=>n==='cc-stream-epsilon'}}});assert.equal(root.querySelector('.cc-stream-epsilon').value,.2);
root.listeners.change.fn({target:{value:'published',classList:{contains:n=>n==='cc-stream-publication'}}});assert.equal(changed,'published');
const old=root.listeners.click.signal;api.mount(root,'cc-stream-value');assert(old.aborted);const next=root.listeners.click.signal;api.release(root);assert(next.aborted);assert(!root.classes.has('cc-stream-view'));
console.log('CC streaming tests passed: 14 sources, 24 preserved records, 9 routes, 2 visible facets; exact parameter formulas and scope corrections; 18 thumbnail geometries; filters, keyboard/click inspection, lifecycle.');
