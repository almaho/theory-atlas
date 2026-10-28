'use strict';
module.exports=function(ID){
 const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),root=path.resolve(__dirname,'..');
 const data=JSON.parse(fs.readFileSync(path.join(root,'data/focus',ID+'.json'),'utf8'));
 const src=fs.readFileSync(path.join(root,'src/scoped-landscapes.js'),'utf8');
 function load(d=data){const c={window:{},document:{getElementById:()=>({textContent:JSON.stringify({focus:{[ID]:d}})})},AbortController};vm.runInNewContext(src,c);return c.window.AtlasPairRenderers[ID];}
 const api=load();assert(api);assert(data.sourceVerification.length);assert(!fs.readFileSync(path.join(root,'src/scoped-landscapes.css'),'utf8').includes('var(--text)'));
 for(const r of [...data.verifiedRecords,...data.relatedResults]){
  assert(data.sources[r.sourceId].url.startsWith('https://'));assert(r.theorem&&r.quality&&r.graph&&r.probability);assert(data.sources[r.sourceId].verifiedOn);
  if(data.verifiedRecords.includes(r)){const p=data.panels.find(p=>p.id===r.panel);assert(p);if(p.categories)assert(p.categories.some(c=>c.id===r.at));else assert(r.at>=p.min&&r.at<=p.max);}
 }
 assert.equal(api.diagramSVG({publication:'all'}),api.diagramSVG(ID,{publication:'all'}));
 for(const [w,h]of [[120,90],[180,110],[240,160],[330,245],[400,300],[738,548],[1000,600]]){
  const s=api.summarySVG(ID,w,h),g=api.layoutGeometry(w,h);
  assert(!/NaN|Infinity|undefined/.test(s));
  assert.equal((s.match(/data-scope-result=/g)||[]).length,data.verifiedRecords.length);
  for(const p of g.points)assert(p.x>=0&&p.x<=w&&p.y>=0&&p.y<h,ID+' '+JSON.stringify(p));
  if(w<300||h<220)assert(!/<text\b/.test(s));
 }
 assert(!/<text\b/.test(api.summarySVG(ID,738,548,{level:'overview'})));
 assert(api.summarySVG(ID,330,245,{level:'detail'}).includes('data-detail-level="compact"'));
 const published=api.diagramSVG({publication:'published'});
 for(const r of data.verifiedRecords){assert(api.diagramSVG().includes('data-scope-result="'+r.id+'"'));assert.equal(published.includes('data-scope-result="'+r.id+'"'),r.publicationStatus!=='preprint');}
 function host(){const children=new Map(),listeners={},classes=new Set();return{isConnected:true,innerHTML:'',classList:{add(...a){a.forEach(x=>classes.add(x))},remove(...a){a.forEach(x=>classes.delete(x))},toggle(x,on){on?classes.add(x):classes.delete(x)}},setAttribute(){},querySelector(s){if(!children.has(s))children.set(s,{innerHTML:'',value:''});return children.get(s)},addEventListener(t,f,o){listeners[t]={fn:f,signal:o.signal}},children,listeners,classes};}
 const h=host();let pub;api.mount(h,ID,{onPublicationChange:v=>pub=v});
 for(const r of [...data.verifiedRecords,...data.relatedResults]){
  h.listeners.click.fn({target:{closest(){return{dataset:{scopeResult:r.id}}}}});
  const detail=h.querySelector('.sl-inspector').innerHTML;assert(detail.includes(r.theorem.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')));assert(detail.includes(data.sources[r.sourceId].url.replaceAll('&','&amp;')));
 }
 let prevented=false;h.listeners.keydown.fn({key:'Enter',preventDefault(){prevented=true},target:{closest(){return{dataset:{scopeResult:data.verifiedRecords[0].id}}}}});assert(prevented);
 h.listeners.change.fn({target:{value:'published',classList:{contains:x=>x==='sl-publication'}}});assert.equal(pub,'published');
 const signal=h.listeners.click.signal;api.mount(h);assert(signal.aborted);const next=h.listeners.click.signal;api.release(h);assert(next.aborted);
 const evil=JSON.parse(JSON.stringify(data));evil.verifiedRecords[0].notes='<script>no</script>';const eh=host();load(evil).mount(eh);assert(eh.querySelector('.sl-inspector').innerHTML.includes('&lt;script&gt;'));
 if(ID==='mis-online'){
  // Exhaust every graph on five vertices and every prefix of the canonical
  // arrival order. A relabeling covers every possible fixed arrival order.
  for(let mask=0;mask<1024;mask++){const adj=Array.from({length:5},()=>new Set());let bit=0;for(let i=0;i<5;i++)for(let j=i+1;j<5;j++,bit++)if(mask&(1<<bit)){adj[i].add(j);adj[j].add(i);}const chosen=[];for(let v=0;v<5;v++){const old=chosen.slice();if(!chosen.some(u=>adj[v].has(u)))chosen.push(v);assert(old.every(x=>chosen.includes(x)));for(let u=0;u<=v;u++)assert(chosen.includes(u)||chosen.some(x=>adj[u].has(x)));for(const u of chosen)assert(!chosen.some(x=>adj[u].has(x)));}}
  assert(data.verifiedRecords.find(r=>r.id==='mis-online-maximal-greedy').at===0);
 }
 if(ID==='cc-online'){assert(data.verifiedRecords.find(r=>r.id==='cc-online-recourse-upper').notes.includes('entire sequence'));assert(data.verifiedRecords.find(r=>r.id==='cc-online-max-random').displayBound.includes('10^{−14}'));}
 if(ID==='edge-online')assert(data.verifiedRecords.find(r=>r.id==='edge-online-known-lower').notes.includes('Subleading'));
 if(ID==='vertex-online'){assert(data.verifiedRecords.find(r=>r.id==='vertex-online-rand-upper').at===1.034);assert(data.verifiedRecords.find(r=>r.id==='vertex-online-random').computation.includes('Exponential'));}
 if(ID==='mis-stochastic')assert(data.verifiedRecords.filter(r=>r.kind==='lower').every(r=>/only|class/.test(r.notes)));
 if(ID==='cc-stochastic'){assert(data.verifiedRecords.find(r=>r.id==='cc-stochastic-fixed-lower').probability.includes('15/16'));assert(data.verifiedRecords.find(r=>r.id==='cc-stochastic-noise-lower').setup.includes('δ<1/8'));}
 if(ID==='edge-stochastic')assert(data.verifiedRecords.find(r=>r.kind==='lower').notes.includes('not a running-time lower bound'));
 if(ID==='vertex-stochastic')assert(data.verifiedRecords.find(r=>r.kind==='lower').quality.includes('NP⊆RP'));
 console.log(ID+' PASS: theorem/source scope; all marker links; seven sizes; text-free overview; publication filtering; keyboard/inspection/lifecycle.');
};
