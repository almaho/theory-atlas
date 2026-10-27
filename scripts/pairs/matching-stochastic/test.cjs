'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),id='matching-stochastic';
const data=JSON.parse(fs.readFileSync(path.join(root,'data/focus',id+'.json'),'utf8'));
const source=fs.readFileSync(path.join(root,'src',id+'.js'),'utf8');
const registration=JSON.parse(fs.readFileSync(path.join(__dirname,'registration.json'),'utf8'));
function load(d=data){const c={window:{},document:{getElementById(){return{textContent:JSON.stringify({focus:{[id]:d}})}}},AbortController,Set};vm.runInNewContext(source,c);return c.window.AtlasPairRenderers[id];}
const api=load(),rows=api.records(),by=Object.fromEntries(rows.map(r=>[r.id,r]));
assert.equal(rows.length,4);assert.equal(rows.filter(r=>r.kind==='lower').length,1);
for(const r of rows){
 for(const k of ['quality','output','graph','theorem','probability','sourceLocation','evidenceStatus','oracle'])assert(r[k],r.id+'/'+k);
 assert.equal(r.plot,null);assert(r.sourceUrl.startsWith('https://arxiv.org/'));
 for(const [axis,field]of Object.entries(registration.pointFields))assert(data.figureAxes[r.panel][axis].categories.some(c=>c.id===r[field]));
}
assert.equal(registration.canonicalAliases['matching-stochastic-oracle'],id);
assert(by['stochastic-abgr25-near-optimal'].bound.includes('Maximum degree'));
assert(by['stochastic-abgr25-near-optimal'].bound.includes('Oε(1)'));
assert(by['stochastic-abgr25-near-optimal'].guarantee.includes('E μ(H∩Gₚ)'));
assert(by['stochastic-abgr25-degree-necessity'].bound.includes('Average degree'));
assert.equal(by['stochastic-abgr25-degree-necessity'].evidenceStatus,'author_stated_bound');
assert.equal(by['stochastic-abgr25-degree-necessity'].guaranteeKey,'constant');
assert(by['stochastic-abgr25-out'].probability.includes('deterministic'));
assert(by['stochastic-abgr25-in'].probability.includes('fixed realization'));
assert(by['stochastic-abgr25-out'].oracle.includes('reference matching probabilities'));
assert(by['stochastic-abgr25-out'].oracle.includes('adaptive'));
for(const a of Object.values(data.figureAxes))for(const dim of ['x','y'])assert(!('min' in a[dim]),'No numeric exponent projection');
for(const [w,h]of [[110,280],[450,90],[180,110],[330,245],[500,260],[738,548],[1000,680]]){
 const s=api.summarySVG(id,w,h),g=api.layoutGeometry(w,h);
 assert(!/NaN|Infinity|undefined/.test(s));assert.equal((s.match(/data-mst-result=/g)||[]).length,4);
 assert.equal((s.match(/data-kind="lower"/g)||[]).length,1);
 assert.equal((s.match(/data-marker="lower"/g)||[]).length,1,'Lower bounds retain the atlas diamond convention');
 for(const p of g.points)assert(p.x>0&&p.x<g.w&&p.y>0&&p.y<g.h);
 if(w<300||h<230)assert(!/<text/.test(s));else{
  assert(s.includes('average'));assert(s.includes('maximum'));assert(s.includes('deterministic')||s.includes('Deterministic'));
  assert(s.includes('expectation')||s.includes('Expectation'));assert(s.includes('reference'));assert(s.includes('poly(1/ε)'));
 }
}
assert(!/<text/.test(api.summarySVG(id,1000,680,{level:'overview'})));
assert(api.summarySVG(id,330,245,{level:'detail'}).includes('data-detail-level="compact"'));
assert.equal(api.diagramSVG(),api.diagramSVG(id,{}));
assert.equal((api.diagramSVG().match(/role="button"/g)||[]).length,4);
const changed=JSON.parse(JSON.stringify(data));Object.values(changed.sources).forEach(s=>s.publicationStatus='preprint');
const empty=load(changed);assert.equal(empty.records({publication:'published'}).length,0);
assert(empty.diagramSVG({publication:'published'}).includes('No sources'));assert(!/<text/.test(empty.summarySVG(id,180,110,{publication:'published'})));
function host(){const children=new Map(),classes=new Set(),listeners={};return{isConnected:true,innerHTML:'',classes,listeners,classList:{add(...v){v.forEach(s=>classes.add(s))},remove(...v){v.forEach(s=>classes.delete(s))},toggle(s,on){on?classes.add(s):classes.delete(s)}},setAttribute(){},querySelector(s){if(!children.has(s))children.set(s,{innerHTML:'',value:''});return children.get(s)},addEventListener(t,fn,o){listeners[t]={fn,signal:o.signal}}};}
const h=host();let changedPublication;api.mount(h,id,{onPublicationChange:p=>changedPublication=p});
const details=()=>h.querySelector('.mst-theorem').innerHTML;
assert(details().includes('Theorem 1'));assert(details().includes('Published paper'));
h.listeners.click.fn({target:{closest(){return{dataset:{mstResult:'stochastic-abgr25-in'}}}}});
assert(details().includes('Claim 6.10'));assert(details().includes('fixed realization'));assert(details().includes('private random tapes'));
let prevented=false;h.listeners.keydown.fn({key:'Enter',preventDefault(){prevented=true},target:{closest(){return{dataset:{mstResult:'stochastic-abgr25-degree-necessity'}}}}});
assert(prevented);assert(details().includes('Average degree'));assert(details().includes('Lower bound'));
h.listeners.change.fn({target:{value:'published',classList:{contains:s=>s==='mst-publication'}}});assert.equal(changedPublication,'published');
const old=h.listeners.click.signal;api.mount(h);assert(old.aborted);const fresh=h.listeners.click.signal;api.release(h);assert(fresh.aborted);assert(!h.classes.has('mst-view'));
const unsafe=JSON.parse(JSON.stringify(data));unsafe.verifiedRecords[0].notes='<script>x</script>';const safe=load(unsafe),sh=host();safe.mount(sh);assert(sh.querySelector('.mst-theorem').innerHTML.includes('&lt;script&gt;'));assert(!sh.querySelector('.mst-theorem').innerHTML.includes('<script>'));
console.log('Stochastic matching PASS: scoped degree necessity/construction, in/out probability contracts, symbolic axes, seven zoom geometries, source filters, theorem inspection, keyboard, escaping and lifecycle.');
