'use strict';
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const base = __dirname + '/../../../';
const data = JSON.parse(fs.readFileSync(base+'data/focus/cc-local.json','utf8'));
const original = JSON.parse(fs.readFileSync(__dirname+'/input-research.json','utf8'));
const patch = JSON.parse(fs.readFileSync(__dirname+'/research-patch.json','utf8'));
const source = fs.readFileSync(base+'src/cc-local.js','utf8');
const css = fs.readFileSync(base+'src/cc-local.css','utf8');
function load(focus=data) {
  const context={window:{},document:{getElementById(){
    return {textContent:JSON.stringify({focus:{'cc-local':focus}})};
  }},AbortController,Set};
  vm.runInNewContext(source,context);
  return context.window.AtlasPairRenderers['cc-local'];
}
const api=load(), curve=data.verifiedRecords[0];
assert.equal(api.records().length,6);
assert.equal(Object.keys(data.sources).length,5);
assert.equal(data.verifiedRecords.filter(r=>r.id===curve.id).length,1,
  'Curve samples must not become independent research records');
for(const slice of original.slices) {
  const next=patch.upsertSlices.find(s=>s.id===slice.id);
  assert(next);
  for(const result of slice.results) {
    assert(next.results.some(r=>r.id===result.id),'Original research result lost');
    assert(data.verifiedRecords.some(r=>r.id===result.id),'Original inspection record lost');
  }
}
for(const row of data.verifiedRecords) {
  for(const key of ['id','sourceId','graph','objective','setup','quality','probability',
      'theorem','resourceModel','exactBound','verificationUrl','assumptions']) assert(row[key],row.id+' '+key);
  assert(data.sources[row.sourceId]);
  assert(patch.upsertSlices.some(s=>s.results.some(r=>r.id===row.id)));
  assert.equal(row.kind,'upper');
}
assert.equal(patch.upsertSlices.length,5);
assert.equal(patch.routeIntegration.additionalSliceIds.length,4);
assert(data.lowerBoundStatus.includes('No general'));
assert.equal(data.lowerBoundAudit.generalLocalRoundLowerBoundInSuppliedSource,false);
assert(!data.verifiedRecords.some(r=>r.kind==='lower'));
assert(curve.exactBound.includes('n^{−Ω(1)}'));
assert(curve.exactBound.includes('2r−1'));
assert(!curve.exactBound.includes('2^r'));
const fn=data.verifiedRecords.find(r=>r.id==='cc-local-fn18-pivot');
assert.equal(fn.panel,'min-baselines');
assert(fn.probability.includes('distinct probability'));
assert(fn.notes.includes('not a lower bound for all'));
const derived=data.verifiedRecords.find(r=>r.id==='cc-local-calm21-deterministic');
assert.equal(derived.evidenceStatus,'derived_from_verified_theorem');
assert(derived.exactBound.includes('1442'));
assert(derived.notes.includes('Six rounds'));
assert(derived.notes.includes('additional initial ID exchange'));
assert(derived.resourceModel.includes('unrestricted'));
const agree=data.verifiedRecords.filter(r=>r.panel==='max-agreement');
assert.equal(agree.length,3);
assert(agree.every(r=>r.objective==='max-agreement'));
assert.equal(agree.filter(r=>r.setup==='weighted').length,1);
assert.equal(agree.filter(r=>r.setup==='minorfree').length,2);
assert(agree.filter(r=>r.setup==='minorfree').every(r=>r.notes.includes('not bounded polynomially')));
const anchors=[[1,3,11],[2,5,17/3],[4,9,29/7],[16,33,101/31],[128,257,773/255]];
for(const [r,rounds,factor] of anchors) {
  const p=api.pointForR(r); assert.equal(p.rounds,rounds);
  assert(Math.abs(p.leadingFactor-factor)<1e-12);
}
for(const r of [0,-1,1.5,NaN,Infinity]) assert.throws(()=>api.pointForR(r));
assert.equal(api.pointForR(256).rounds,513);
const focus=api.diagramSVG({selectedR:16});
assert.equal((focus.match(/data-cc-local-r=/g)||[]).length,8);
assert.equal((focus.match(/role="button"/g)||[]).length,13);
assert(focus.includes('data-objective="min-disagreement"'));
assert(focus.includes('data-objective="max-agreement"'));
assert(focus.includes('data-rank-correction="true"'));
assert(focus.includes('data-reference="3"'));
assert(focus.includes('Factor 1442'));
assert(focus.includes('data-x-scale="symbolic-cost"'));
assert(!focus.includes('data-kind="lower"'));
assert.equal((api.diagramSVG({selectedR:5}).match(/data-cc-local-r=/g)||[]).length,9);
for(const [w,h] of [[160,90],[110,280],[450,90],[240,160],[330,245],[500,260],[738,548],[1000,850]]) {
  const svg=api.summarySVG('cc-local',w,h),g=api.layoutGeometry(w,h);
  assert(!/NaN|Infinity|undefined/.test(svg),w+'×'+h);
  assert(g.top<g.bottom);
  assert(g.left<g.right);
  assert(g.maxTop<g.maxBottom);
  for(const p of [...g.points,...g.agreement]) {
    assert(p.x>=0&&p.x<=w&&p.y>=0&&p.y<=h,'Point outside '+w+'×'+h);
  }
  for(const c of g.cards) {
    assert(c.w>0&&c.h>0&&c.x+c.w<=w&&c.y+c.h<=h);
  }
  for(const row of data.verifiedRecords) assert(svg.includes('data-result-id="'+row.id+'"'));
  assert.equal((svg.match(/data-cc-local-r=/g)||[]).length,8);
  if(g.tiny) assert(!/<text/.test(svg),'Overview must hide all text');
  else {
    assert(svg.includes('MIN'));
    assert(svg.includes('MAX'));
    assert(svg.includes('data-axis="x"'));
    assert(svg.includes('data-axis="y"'));
  }
}
assert(!/<text/.test(api.summarySVG('cc-local',738,548,{level:'overview'})));
const geometry=api.layoutGeometry(1000,850,{focus:true});
assert(Math.abs((geometry.px(3.125)-geometry.px(3.03125))-
  (geometry.px(3.5)-geometry.px(3.125)))<1e-9);
assert(Math.abs((geometry.py(8)-geometry.py(32))-
  (geometry.py(32)-geometry.py(128)))<1e-9);
assert(css.includes('.cc-local-algorithm { fill:var(--green)'));
for(const setup of ['complete','weighted','minorfree']) assert(css.includes('.cc-local-setup-'+setup));
const changed=JSON.parse(JSON.stringify(data));
for(const paper of Object.values(changed.sources))paper.publicationStatus='preprint';
const filtered=load(changed);
assert.equal(filtered.records({publication:'published'}).length,0);
assert(!filtered.diagramSVG({publication:'published'}).includes('data-result-id='));
assert.equal(api.records({publication:'published'}).length,6);
function host() {
  const classes=new Set(),children=new Map(),listeners={};
  return {isConnected:true,innerHTML:'',classList:{
    add(...names){names.forEach(n=>classes.add(n));},
    remove(...names){names.forEach(n=>classes.delete(n));},
    toggle(n,on){on?classes.add(n):classes.delete(n);}
  },setAttribute(){},querySelector(sel){
    if(!children.has(sel))children.set(sel,{innerHTML:'',value:''});
    return children.get(sel);
  },addEventListener(name,fn,options){listeners[name]={fn,signal:options.signal};},classes,listeners};
}
const root=host();let publication=null;
api.mount(root,'cc-local',{onPublicationChange:value=>publication=value});
assert(root.innerHTML.includes('cc-local-setup-legend'));
assert(root.querySelector('.cc-local-theorem').innerHTML.includes('8/31'));
root.listeners.click.fn({target:{closest(){return{dataset:{ccLocalR:'4'}};}}});
assert(root.querySelector('.cc-local-theorem').innerHTML.includes('8/7'));
let prevented=false;
root.listeners.keydown.fn({key:'Enter',preventDefault(){prevented=true;},
  target:{closest(){return{dataset:{ccLocalResult:'cc-local-calm21-deterministic'}};}}});
assert(prevented);
assert(root.querySelector('.cc-local-theorem').innerHTML.includes('1442'));
assert(root.querySelector('.cc-local-theorem').innerHTML.includes('derived_from_verified_theorem'));
for(const row of data.verifiedRecords.slice(1)) {
  root.listeners.click.fn({target:{closest(){return{dataset:{ccLocalResult:row.id}};}}});
  const html=root.querySelector('.cc-local-theorem').innerHTML;
  assert(html.includes(row.verificationUrl),'Theorem link missing');
  assert(html.includes('Paper ↗'),'Direct paper link missing');
}
root.listeners.change.fn({target:{value:'5',classList:{contains:c=>c==='cc-local-r-input'}}});
assert(root.querySelector('.cc-local-theorem').innerHTML.includes('8/9'));
const invalid={value:'0',classList:{contains:c=>c==='cc-local-r-input'}};
root.listeners.change.fn({target:invalid});assert.equal(invalid.value,5);
root.listeners.change.fn({target:{value:'published',classList:{contains:c=>c==='cc-local-publication'}}});
assert.equal(publication,'published');
const previous=root.listeners.click.signal;api.mount(root);assert(previous.aborted);
const current=root.listeners.click.signal;api.release(root);assert(current.aborted);
assert(!root.classes.has('cc-local-view'));
console.log('CC LOCAL expansion tests passed: six records / five sources; original curve; distinct objectives; deterministic derivation; fixed-epsilon symbolic costs; finite geometry at eight sizes; text-free overview; publication filtering; source links; click/keyboard/r controls; lifecycle.');
