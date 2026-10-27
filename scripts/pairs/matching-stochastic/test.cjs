'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),id='matching-stochastic';
const data=JSON.parse(fs.readFileSync(path.join(root,'data/focus',id+'.json'),'utf8'));
const source=fs.readFileSync(path.join(root,'src',id+'.js'),'utf8');
const registration=JSON.parse(fs.readFileSync(path.join(__dirname,'registration.json'),'utf8'));
function load(d=data){const c={window:{},document:{getElementById(){return{textContent:JSON.stringify({focus:{[id]:d}})}}},AbortController,Set};vm.runInNewContext(source,c);return c.window.AtlasPairRenderers[id];}

const api=load(),all=data.verifiedRecords,by=Object.fromEntries(all.map(r=>[r.id,r]));
assert.equal(all.length,27);assert.equal(Object.keys(data.sources).length,12);
assert.equal(api.records().length,17);assert.equal(api.records({key:'weighted-matching-stochastic'}).length,10);
assert.equal(registration.routes.filter(r=>r.visible).length,2);
assert(by['stochastic-abgr25-near-optimal'].bound.includes('Oε(1)'));
assert.equal(by['stochastic-abgr25-near-optimal'].symbolic,'minus');
assert(by['stochastic-bbd22-lower-unweighted'].notes.includes('p≤p₀'));
assert(by['stochastic-bbd22-lower-unweighted'].bound.includes('1/(εp)'));
assert(by['stochastic-dkp23-weighted'].notes.includes('NOT maximum'));
assert(by['stochastic-dkp23-weighted'].panel.endsWith('expected'));
assert(by['stochastic-bfhr19-weighted'].bound.includes('log(1/p)'));
assert(by['stochastic-bd20-near'].bound.includes('unspecified'));
assert(by['stochastic-akl16-adaptive'].probability.includes('OPT(G)=ω(1/p)'));
assert(by['stochastic-akl17-half-plus'].symbolic==='plus');
assert.equal(by['stochastic-akl17-half-plus'].beta,.5);
for(const r of all){
 for(const k of ['quality','output','graph','theorem','probability','sourceLocation','evidenceStatus','oracle'])assert(r[k],r.id+'/'+k);
 assert.equal(r.plot,null);assert(r.sourceUrl.startsWith('https://'));
 assert(data.figureAxes[r.panel].y.categories.some(c=>c.id===r.id));
 if(r.kind==='lower'){assert(r.annotation);assert.equal(r.beta,null);assert(!r.panel.endsWith('adaptive'));}
}
for(const key of ['matching-stochastic','weighted-matching-stochastic']){
 const rr=api.records({key});
 for(const [w,h]of [[40,40],[110,280],[450,90],[180,110],[240,180],[330,245],[500,260],[738,548],[1100,1200]]){
  const svg=api.summarySVG(key,w,h),g=api.layoutGeometry(w,h,{key});
  assert(!/NaN|Infinity|undefined/.test(svg));assert.equal((svg.match(/data-mst-result=/g)||[]).length,rr.length);
  assert.equal((svg.match(/data-marker="lower"/g)||[]).length,rr.filter(r=>r.kind==='lower').length);
  for(const p of g.points){assert(p.x>0&&p.x<g.w&&p.y>0&&p.y<g.h,JSON.stringify({key,w,h,p}));if(p.row.annotation)assert.equal(p.x,g.tiny?g.left:g.left+4);}
  if(w<300||h<230)assert(!/<text/.test(svg));
  for(const b of g.blocks){
   const numeric=b.points.filter(p=>!p.row.annotation&&Number.isFinite(p.row.beta)).sort((a,b)=>a.row.beta-b.row.beta);
   for(let i=1;i<numeric.length;i++)assert(numeric[i].x>=numeric[i-1].x);
  }
 }
 assert(!/<text/.test(api.summarySVG(key,1100,800,{level:'overview'})));
 assert.equal((api.diagramSVG(key).match(/role="button"/g)||[]).length,rr.length);
}
assert(api.diagramSVG().includes('Non-adaptive'));assert(api.diagramSVG().includes('Adaptive edge'));
const changed=JSON.parse(JSON.stringify(data));Object.values(changed.sources).forEach(s=>s.publicationStatus='preprint');
const empty=load(changed);assert.equal(empty.records({publication:'published'}).length,0);assert(empty.diagramSVG({publication:'published'}).includes('No sources'));
function host(){const children=new Map(),classes=new Set(),listeners={};return{isConnected:true,innerHTML:'',classes,listeners,classList:{add(...v){v.forEach(s=>classes.add(s))},remove(...v){v.forEach(s=>classes.delete(s))},toggle(s,on){on?classes.add(s):classes.delete(s)}},setAttribute(){},querySelector(s){if(!children.has(s))children.set(s,{innerHTML:'',value:''});return children.get(s)},addEventListener(t,fn,o){listeners[t]={fn,signal:o.signal}}};}

const h=host();let changedPublication;api.mount(h,'matching-stochastic',{onPublicationChange:p=>changedPublication=p});
const details=()=>h.querySelector('.mst-theorem').innerHTML;
assert(details().includes('Theorem 1'));assert(details().includes('Published paper'));
for(const key of ['matching-stochastic','weighted-matching-stochastic']){
 api.mount(h,key);
 for(const r of api.records({key})){h.listeners.click.fn({target:{closest(){return{dataset:{mstResult:r.id}}}}});assert(details().includes(r.sourceUrl));assert(details().includes(r.theorem.replace(/&/g,'&amp;')));}
}
api.mount(h,'matching-stochastic',{onPublicationChange:p=>changedPublication=p});
let prevented=false;h.listeners.keydown.fn({key:'Enter',preventDefault(){prevented=true},target:{closest(){return{dataset:{mstResult:'stochastic-bbd22-lower-unweighted'}}}}});
assert(prevented);assert(details().includes('Theorem 7.3'));assert(details().includes('No adaptive-testing transfer'));
h.listeners.change.fn({target:{value:'published',classList:{contains:s=>s==='mst-publication'}}});assert.equal(changedPublication,'published');
const old=h.listeners.click.signal;api.mount(h);assert(old.aborted);const fresh=h.listeners.click.signal;api.release(h);assert(fresh.aborted);
const unsafe=JSON.parse(JSON.stringify(data));unsafe.verifiedRecords.find(r=>r.id==='stochastic-abgr25-near-optimal').notes='<script>x</script>';const safe=load(unsafe),sh=host();safe.mount(sh);assert(sh.querySelector('.mst-theorem').innerHTML.includes('&lt;script&gt;'));
console.log('Stochastic matching PASS: 27 scoped records/12 sources; weighted/unweighted routes; adaptive versus nonadaptive, maximum-degree versus expected-total budget; symbolic anchors and red cost annotations; 18 zoom geometries; source filters, all theorem inspections, keyboard and lifecycle.');
