'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../../..'),ID='weighted-matching-stream';
const data=JSON.parse(fs.readFileSync(path.join(root,'data/focus',ID+'.json'),'utf8'));
const source=fs.readFileSync(path.join(root,'src',ID+'.js'),'utf8');
const registration=JSON.parse(fs.readFileSync(path.join(__dirname,'registration.json'),'utf8'));
const patch=JSON.parse(fs.readFileSync(path.join(__dirname,'research-patch.json'),'utf8'));
const old=JSON.parse(fs.readFileSync(path.join(root,'data/focus/matching-streaming-more.json'),'utf8'));
const original=old.verifiedRecords.find(r=>r.id==='matching-stream-assadi25-weighted-specialization'),row=data.verifiedRecords[0];
function load(d=data){const context={window:{},document:{getElementById(){return{textContent:JSON.stringify({focus:{[ID]:d}})}}},AbortController};vm.runInNewContext(source,context);return context.window.AtlasPairRenderers[ID];}
const api=load();assert(api);assert.equal(data.problem,'weighted_matching');assert.equal(data.model,'stream');assert.equal(data.verifiedRecords.length,1);assert.equal(row.kind,'upper');assert.equal(row.originRecordId,original.id);
for(const f of ['quality','displayBound','bound','graph','output','stream','space','passes','probability','theorem','notes','evidenceStatus','sourceUrl'])assert.equal(row[f],original[f],f);
assert(row.graph.includes('positive integer edge weights'));assert(row.quality.includes('(1−ε)'));assert(row.space.includes('bits'));assert(row.stream.includes('insertion-only'));assert(data.lowerBoundStatus.includes('streams with deletions'));
assert.equal(data.sources[row.sourceId].url,old.sources.assadi25.url);assert.equal(data.sources[row.sourceId].verifiedOn,old.sources.assadi25.verifiedOn);
assert.equal(registration.routes[0].problem,'weighted_matching');assert.equal(registration.routes[0].sliceId,patch.upsertSlices[0].id);assert.equal(patch.upsertSlices[0].results[0].id,row.id);assert.equal(patch.upsertSlices[0].results.length,1);
assert.equal(patch.upsertSlices[0].results[0].paperId,patch.upsertPapers[0].id);assert.equal(patch.upsertSlices[0].results[0].plot,null);
for(const [w,h]of [[120,90],[110,280],[450,90],[240,160],[330,220],[330,245],[500,260],[738,548],[1000,640]]){
 const s=api.summarySVG(ID,w,h),g=api.layoutGeometry(w,h);
 assert(!/NaN|Infinity|undefined/.test(s));assert.equal((s.match(/data-wstr-result=/g)||[]).length,1);assert(!s.includes('data-kind="lower"'));assert(!s.includes('data-frontier'));
 for(const p of g.points)assert(p.x>g.left&&p.x<g.right&&p.y>g.top&&p.y<g.bottom);
 if(w<300||h<230)assert(!/<text/.test(s));else{assert(s.includes('data-axis="x"'));assert(s.includes('data-axis="y"'));assert(s.includes('O(log n/ε) passes'));assert(s.includes('No comparable lower bound reviewed'));assert(s.includes('O(n log² n/ε) bits'));}
}
assert(!/<text/.test(api.summarySVG(ID,738,548,{level:'overview'})));assert(api.summarySVG(ID,330,245,{level:'detail'}).includes('data-detail-level="compact"'));
assert.equal(api.diagramSVG({publication:'all'}),api.diagramSVG(ID,{publication:'all'}));assert.equal((api.diagramSVG().match(/role="button"/g)||[]).length,1);
assert(api.diagramSVG().includes('arbitrary-order insertions'));assert(!api.diagramSVG().includes('fixed ε'));
const changed=JSON.parse(JSON.stringify(data));changed.sources[row.sourceId].publicationStatus='preprint';changed.verifiedRecords[0].publicationStatus='preprint';const filtered=load(changed);
assert.equal(filtered.records({publication:'published'}).length,0);assert(filtered.diagramSVG({publication:'published'}).includes('No sources'));assert(!/<text/.test(filtered.summarySVG(ID,160,90,{publication:'published'})));
function host(){const classes=new Set(),children=new Map(),listeners={};return{isConnected:true,innerHTML:'',classList:{add(...s){s.forEach(v=>classes.add(v))},remove(...s){s.forEach(v=>classes.delete(v))},toggle(v,on){on?classes.add(v):classes.delete(v)}},setAttribute(){},querySelector(s){if(!children.has(s))children.set(s,{innerHTML:'',value:''});return children.get(s)},addEventListener(t,f,o){listeners[t]={fn:f,signal:o.signal}},classes,listeners};}
const h=host();let selectedPublication=null;api.mount(h,ID,{onPublicationChange:v=>selectedPublication=v});
const detail=()=>h.querySelector('.wstr-theorem').innerHTML;
for(const phrase of ['Section 4','positive integer edge weights','O(log n/ε) passes','O(n log² n/ε) bits','arbitrary-order insertion-only','1−exp(−Θ(n))','Read primary theorem','2026-10-20'])assert(detail().includes(phrase),phrase);
let prevented=false;h.listeners.keydown.fn({key:'Enter',preventDefault(){prevented=true},target:{closest(){return{dataset:{wstrResult:row.id}}}}});assert(prevented);
h.listeners.click.fn({target:{closest(){return{dataset:{wstrResult:row.id}}}}});assert(detail().includes('Section 4'));
h.listeners.change.fn({target:{value:'published',classList:{contains:c=>c==='wstr-publication'}}});assert.equal(selectedPublication,'published');
const signal=h.listeners.click.signal;api.mount(h);assert(signal.aborted);const next=h.listeners.click.signal;api.release(h);assert(next.aborted);assert(!h.classes.has('wstr-view'));
const escaped=JSON.parse(JSON.stringify(data));escaped.verifiedRecords[0].notes='<script>alert(1)</script>';const eh=host();load(escaped).mount(eh);assert(!eh.querySelector('.wstr-theorem').innerHTML.includes('<script>'));assert(eh.querySelector('.wstr-theorem').innerHTML.includes('&lt;script&gt;'));
console.log('Weighted streaming regression PASS: weighted theorem preserved, positive integer weights and insertion-only passes/bit-space explicit, no fabricated lower, nine thumbnail sizes, semantic zoom, theorem inspection, source filter, keyboard/lifecycle/escaping.');
