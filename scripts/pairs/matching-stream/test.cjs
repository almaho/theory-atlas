const fs=require('fs'),vm=require('vm'),assert=require('assert');
const data=JSON.parse(fs.readFileSync(__dirname+'/../../../data/focus/matching-streaming-more.json','utf8'));
const input=JSON.parse(fs.readFileSync(__dirname+'/input-research.json','utf8'));
const patch=JSON.parse(fs.readFileSync(__dirname+'/research-patch.json','utf8'));
const document={getElementById(id){assert.equal(id,'atlas-data');return{textContent:JSON.stringify({focus:{'matching-stream':data}})};}};
const context={document,window:{},AbortController,Set,console};vm.runInNewContext(fs.readFileSync(__dirname+'/../../../src/streaming-more.js','utf8'),context);
const api=context.window.AtlasPairRenderers['matching-stream'];
const routes=['matching-stream-insertion','matching-stream-insertion-bipartite','matching-stream-turnstile','matching-stream-onepass','matching-stream-bounded','matching-stream-bounded-approx','matching-stream-arboricity'];
const r=id=>data.verifiedRecords.find(r=>r.id===id);
assert.equal(patch.upsertSlices.length,7);assert.equal(data.verifiedRecords.length,20);
for(const s of input.slices)for(const entry of s.results)assert(r(entry.id),'Original result missing '+entry.id);
for(const entry of data.verifiedRecords){for(const f of ['sourceId','kind','graph','output','stream','bound','quality','space','passes','theorem','probability','assumptions'])assert(entry[f],entry.id+' missing '+f);assert(data.sources[entry.sourceId]);assert(data.figureAxes.some(p=>p.id===entry.panel));}
// Material model/regression assertions, independent of renderer internals.
assert(r('matching-stream-ajjst22').passes.includes('log n'));
assert(r('matching-stream-assadi-shah22').bound.startsWith('O('));assert(!r('matching-stream-assadi-shah22').bound.includes('Õ'));
assert(r('matching-stream-dark-konrad20').quality.includes('0<ε<1/3'));
assert(r('matching-stream-kdd25-det-lower').assumptions.some(x=>x.includes('K≤n/2')));
assert(r('matching-stream-kdd25-random-lower').assumptions.some(x=>x.includes('valid matchings')));
assert(r('matching-stream-kdd25-approx-upper').bound.includes('K/ε'));
assert(!r('matching-stream-kdd25-approx-lower').bound.includes('ε'));
assert(r('matching-stream-dynamic-passes-boosted').bound.includes('f(ε)'));
assert.equal(r('matching-stream-mcgregor26-arboricity').output,'size estimate only');
assert.notEqual(r('matching-stream-akl17-arboricity-lower').panel,r('matching-stream-mcgregor26-arboricity').panel);
for(const graph of ['general','bipartite']){
 const lower=r('matching-stream-lnns26-'+graph);
 assert.equal(lower.kind,'lower');assert.equal(lower.publicationStatus,'preprint');assert.equal(lower.output,'matching edges; not size estimation');
 assert(lower.assumptions.some(x=>x.includes('including failed')));assert(lower.assumptions.some(x=>x.includes('independent of n')));
 assert(lower.notes.includes('No equality impossibility'));assert(lower.probability.includes('1/2+ζ'));
 const two=JSON.parse(fs.readFileSync(__dirname+'/../../../data/focus/matching-stream-two-pass'+(graph==='bipartite'?'-bipartite':'')+'.json','utf8'));
 const projected=two.results.find(x=>x.id.startsWith('lnns2026'));assert(projected);assert(projected.strict);
 assert.equal(projected.ratio,1-Math.pow(3,-2));assert.equal(projected.ratio,8/9);
 assert(projected.notes.includes('does not improve'));assert(projected.notes.includes('valid matching'));
}
assert(!api.records({publication:'published'}).some(x=>x.sourceId==='mcgregor26'));
assert(!api.records({publication:'published'}).some(x=>x.sourceId==='lnns26'));
assert.equal(api.records({key:'matching-stream-insertion'}).filter(x=>x.sourceId==='lnns26').length,2);
assert(api.records({publication:'published',key:'matching-stream-arboricity'}).some(x=>x.sourceId==='akl17'));
for(const key of routes){
 const diag=api.diagramSVG(key);assert(diag.includes('Y ·'));assert(diag.includes('X ·'));assert(!diag.includes('NaN'));assert(diag.includes('role="button"'));assert(diag.includes('tabindex="0"'));
 for(const [w,h]of [[180,110],[330,245],[500,260],[738,548],[1100,700],[360,120]])for(const publication of ['all','published']){
  const svg=api.summarySVG(key,w,h,{publication});assert(!/NaN|undefined|Infinity/.test(svg));assert(svg.includes(`viewBox="0 0 ${w} ${h}"`));
  for(const match of svg.matchAll(/data-center-x="([\d.]+)" data-center-y="([\d.]+)"/g)){assert(+match[1]>=0&&+match[1]<=w,`${key}: x ${match[1]} outside ${w}`);assert(+match[2]>=0&&+match[2]<=h,`${key}: y ${match[2]} outside ${h}`);}
  if(w<220||h<140)assert(!svg.includes('<text'),'Tiny figure has annotations');
  if(w>=650&&h>=360)assert(svg.includes('symbolic resource formulas'));
  if(publication==='published')assert(!svg.includes('matching-stream-mcgregor26'));
 }
}
function fakeRoot(){let html='';const elements=new Map(),handlers=[];const classes=new Set();return{isConnected:true,classList:{add(...s){s.forEach(x=>classes.add(x));},remove(...s){s.forEach(x=>classes.delete(x));},toggle(s,v){v?classes.add(s):classes.delete(s);}},setAttribute(){},set innerHTML(v){html=v;},get innerHTML(){return html;},querySelector(s){if(!elements.has(s))elements.set(s,{innerHTML:'',value:'',hidden:false});return elements.get(s);},addEventListener(type,fn,opts){handlers.push({type,fn,signal:opts.signal});},elements,handlers,classes};}
const root=fakeRoot();let publication;
const first=api.mount(root,'matching-stream-arboricity',{onPublicationChange:p=>publication=p});
assert(root.querySelector('.mstr-theorem').innerHTML.includes('McGregor'));
root.handlers.find(h=>h.type==='change').fn({target:{classList:{contains:x=>x==='mstr-publication-select'},value:'published'}});
assert.equal(publication,'published');assert(root.querySelector('.mstr-theorem').innerHTML.includes('AKL'));
assert(!root.querySelector('.mstr-plot-host').innerHTML.includes('mcgregor26'));
api.mount(root,'matching-stream-bounded');assert(root.handlers.slice(0,3).every(h=>h.signal.aborted));
const activeClick=root.handlers.filter(h=>h.type==='click'&&!h.signal.aborted)[0];activeClick.fn({target:{closest:()=>({dataset:{mstrResult:'matching-stream-kdd25-det-lower'}})}});
assert(root.querySelector('.mstr-theorem').innerHTML.includes('K≤n/2'));
api.release(root);assert(root.handlers.every(h=>h.signal.aborted));assert(!root.classes.has('mstr-view'));
console.log('Streaming pair checks passed: 20 records, 7 routes, 84 summaries, source scope/filtering, theorem selection and release lifecycle.');
