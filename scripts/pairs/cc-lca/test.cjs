'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const data=JSON.parse(fs.readFileSync(__dirname+'/../../../data/focus/cc-lca.json','utf8')),original=JSON.parse(fs.readFileSync(__dirname+'/input-research.json','utf8')),patch=JSON.parse(fs.readFileSync(__dirname+'/research-patch.json','utf8')),reg=JSON.parse(fs.readFileSync(__dirname+'/registration.json','utf8')),js=fs.readFileSync(__dirname+'/../../../src/cc-lca.js','utf8'),css=fs.readFileSync(__dirname+'/../../../src/cc-lca.css','utf8');
function load(f=data){const context={window:{},document:{getElementById(){return{textContent:JSON.stringify({focus:{'cc-lca':f}})}}},AbortController,Set};vm.runInNewContext(js,context);return context.window.AtlasPairRenderers['cc-lca'];}
const api=load(),all=api.records(),by=id=>all.find(r=>r.id===id);
assert.equal(original.papers.length,2);assert.equal(original.slices.length,2);assert.equal(all.length,5);assert.equal(new Set(all.map(r=>r.id)).size,5);
for(const s of original.slices){const next=patch.upsertSlices.find(x=>x.id===s.id);assert(next,'Original slice lost');assert(reg.routes.some(r=>r.sliceId===s.id));for(const r of s.results){assert(next.results.some(x=>x.id===r.id),'Original research ID lost');assert(by(r.id),'Original inspection ID lost');}}
assert.equal(patch.upsertPapers.length,2,'Correction context must not overwrite the shared 2020 paper');
for(const r of all){for(const key of ['sourceId','graph','output','quality','theorem','displayBound','exactBound','preprocessing','parameterDomain','probability','seedSpace','sourceUrl'])assert(r[key],r.id+' missing '+key);assert(data.sources[r.sourceId]);assert(r.sourceUrl.startsWith('https://'));assert.equal(r.plot,null);}
assert.equal(by('cc-lca-pruned-3plus').probability,'Expected objective bound; not a high-probability quality statement');
assert.equal(by('cc-lca-bonchi-four').modes.length,2);assert(by('cc-lca-bonchi-four').probeComplexity.includes('upper bounds follow'));
assert(by('cc-lca-bonchi-one-additive').preprocessing.includes('2^{poly(1/ε)}'));assert.equal(by('cc-lca-bonchi-one-additive').plotRole,'symbolic-inset');
assert.equal(all.filter(r=>r.kind==='lower').length,2);
for(const r of all.filter(r=>r.kind==='lower')){assert.equal(r.panel,'matrix');assert(/non-adaptive/i.test(r.bound));assert(r.correctionSource.endsWith('#S2'));assert.equal(r.evidenceStatus,'theorem_scope_corrected');}
assert.equal(by('cc-lca-bonchi-constant-lb').specializes,'cc-lca-bonchi-lb');assert(by('cc-lca-bonchi-constant-lb').parameterDomain.includes('10^7/n'));assert(by('cc-lca-bonchi-lb').parameterDomain.includes('1/(100c)'));
assert.equal(reg.routes.filter(r=>r.visible).length,1);assert.equal(reg.canonicalAliases['cc-lca-matrix-additive'],'cc-lca');
for(const s of patch.upsertSlices)for(const a of [s.xAxis,s.yAxis]){assert.equal(a.min,a.ticks[0]);assert.equal(a.max,a.ticks.at(-1));assert.equal(a.tickLabels.length,a.ticks.length);}
for(const [w,h]of [[100,80],[160,90],[450,100],[110,280],[240,170],[260,220],[330,245],[500,260],[738,548],[1000,680]]){
 const g=api.geometry(w,h),svg=api.summarySVG('cc-lca',w,h);
 assert(g.left<g.right&&g.top<g.bottom);assert(!/NaN|Infinity|undefined/.test(svg));assert.equal(g.points.length,4);assert.equal(g.insets.length,2);
 for(const p of g.points){assert(p.x>=0&&p.x<=w&&p.y>=0&&p.y<=h,'Point out of frame');if(p.x2)assert(p.x2<=w);}
 for(const b of g.insets)assert(b.x>=0&&b.x+b.w<=w&&b.y>=0&&b.y+b.h<=h,'Inset out of frame');
 assert(svg.includes('data-kind="lower"')&&svg.includes('data-kind="upper"'));
 if(w<260||h<220)assert(!/<text/.test(svg),'Tiny summaries must hide annotations');else{assert(svg.includes('data-axis="x"'));assert(svg.includes('data-axis="y"'));}
 assert.equal((svg.match(/data-position="unranked"/g)||[]).length,2);
 const upper=g.points.find(p=>p.mode==='prepared'),lower=g.points.find(p=>p.kind==='lower');assert.equal(upper.x,lower.x);assert.notEqual(upper.y,lower.y,'Lower/algorithm markers must not occlude');
 const band=g.points.find(p=>p.role==='band');assert.equal(band.x,g.px('inverse'));assert.equal(band.x2,g.px('n-inverse'));
}
assert.throws(()=>api.geometry(0,80));assert.throws(()=>api.geometry(100,NaN));
assert(!/<text/.test(api.summarySVG('cc-lca',738,548,{level:'overview'})));
const focus=api.diagramSVG();assert.equal((focus.match(/role="button"/g)||[]).length,6);assert(focus.includes('After preprocessing'));assert(focus.includes('After preprocessing · see theorem details'));assert(focus.includes('non-adaptive'));
assert.equal(api.records({publication:'published'}).length,1);const filtered=api.summarySVG('cc-lca',738,548,{publication:'published'});assert(!filtered.includes('data-kind="lower"'));assert(!filtered.includes('data-cclca-result="cc-lca-bonchi-four"'));assert(filtered.includes('data-cclca-result="cc-lca-pruned-3plus"'));
assert(css.includes('var(--green)')&&css.includes('var(--red)'));assert(css.includes('light-dark('));
function host(){const classes=new Set(),children=new Map(),listeners={};return{isConnected:true,innerHTML:'',classList:{add(...names){names.forEach(n=>classes.add(n));},remove(...names){names.forEach(n=>classes.delete(n));},toggle(n,on){on?classes.add(n):classes.delete(n);}},setAttribute(){},querySelector(sel){if(!children.has(sel))children.set(sel,{innerHTML:'',value:''});return children.get(sel);},addEventListener(name,fn,options){listeners[name]={fn,signal:options.signal};},classes,listeners};}
const root=host();let changed=null;api.mount(root,'cc-lca',{onPublicationChange:v=>changed=v});
assert(root.querySelector('.cclca-theorem').innerHTML.includes('Pruned Pivot'));
root.listeners.click.fn({target:{closest(){return{dataset:{cclcaResult:'cc-lca-bonchi-four',cclcaMode:'no-preprocessing'}};}}});assert(root.querySelector('.cclca-theorem').innerHTML.includes('No shared graph preprocessing'));
root.listeners.click.fn({target:{closest(){return{dataset:{cclcaResult:'cc-lca-bonchi-four',cclcaMode:'prepared'}};}}});assert(root.querySelector('.cclca-theorem').innerHTML.includes('Prepare once'));
let prevented=false;root.listeners.keydown.fn({key:'Enter',preventDefault(){prevented=true;},target:{closest(){return{dataset:{cclcaResult:'cc-lca-bonchi-constant-lb'}};}}});assert(prevented);assert(root.querySelector('.cclca-theorem').innerHTML.includes('2020 scope correction'));assert(root.querySelector('.cclca-theorem').innerHTML.includes('10^7/n'));
root.listeners.change.fn({target:{value:'published',classList:{contains:n=>n==='cclca-publication'}}});assert.equal(changed,'published');assert(root.querySelector('.cclca-theorem').innerHTML.includes('Pruned Pivot'));assert(!root.querySelector('.cclca-records').innerHTML.includes('cc-lca-bonchi'));
const old=root.listeners.click.signal;api.mount(root,'cc-lca');assert(old.aborted);const next=root.listeners.click.signal;api.release(root);assert(next.aborted);assert(!root.classes.has('cclca-view'));
console.log('CC LCA tests passed: all 5 original records and 2 slices preserved; scoped lower bounds, separate preprocessing, symbolic axes, 10 summary sizes, filtering, policy/keyboard inspection, and lifecycle.');
