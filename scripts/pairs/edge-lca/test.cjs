'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const at=name=>path.join(__dirname,name),local=fs.existsSync(at('focus.json'));
const data=JSON.parse(fs.readFileSync(local?at('focus.json'):at('../../../data/focus/edge-lca.json'),'utf8'));
const source=fs.readFileSync(local?at('renderer.js'):at('../../../src/edge-lca.js'),'utf8');
const patch=JSON.parse(fs.readFileSync(at('research-patch.json'),'utf8')),reg=JSON.parse(fs.readFileSync(at('registration.json'),'utf8')),input=JSON.parse(fs.readFileSync(at('input-research.json'),'utf8'));
function load(d=data){const c={window:{},document:{getElementById(){return{textContent:JSON.stringify({focus:{'edge-lca':d}})}}},AbortController,Set};vm.runInNewContext(source,c);return c.window.AtlasPairRenderers['edge-lca'];}
const api=load(),rr=api.records(),row=rr[0];
assert.equal(rr.length,1);assert.equal(data.relatedResults.length,0);
assert.deepEqual(rr.map(r=>r.id),input.slices.flatMap(s=>s.results.map(r=>r.id)));
assert.equal(patch.upsertSlices[0].id,input.slices[0].id);assert.equal(patch.upsertSlices[0].results[0].id,row.id);assert.equal(patch.upsertSlices[0].results[0].plot,null);
assert(!('min' in patch.upsertSlices[0].yAxis),'Remove the false polynomial/quasipolynomial cost ladder');
for(const dim of ['x','y'])assert(data.figureAxes[row.panel][dim].categories.some(c=>c.id===row[reg.pointFields[dim]]));
for(const field of ['quality','graph','output','probability','oracle','adaptivity','state','parameters','theorem'])assert(row[field]);
assert.equal(row.kind,'upper');assert(row.bound.includes('D^{O(√D log^{5/2}D)} · log* m'));assert(row.palette.includes('≤'));assert(row.graph.includes('2≤D≤2Δ−2'));assert(row.theorem.includes('Theorem 5.1'));assert(row.theorem.includes('second case'));
assert(row.oracle.includes('Direct'));assert(row.oracle.includes('probe convention'));assert(row.adaptivity.includes('does not assert'));assert(row.assumptions[0].includes('outside this probe count'));assert(row.state.includes('No information retained'));assert(row.notes.includes('not the degree Δ'));assert(data.lowerBoundStatus.includes('No lower-bound point'));
for(const [edges,delta,D]of [[[[0,1],[1,2],[2,3]],2,2],[[[0,1],[0,2],[0,3],[0,4]],4,3],[[[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]],3,4]]){
 const deg={};edges.forEach(([u,v])=>{deg[u]=(deg[u]||0)+1;deg[v]=(deg[v]||0)+1});
 assert.equal(Math.max(...Object.values(deg)),delta);assert.equal(Math.max(...edges.map(([u,v])=>deg[u]+deg[v]-2)),D);assert(D+1<=2*delta-1);
}
for(const [w,h]of [[120,90],[110,280],[450,90],[240,160],[330,220],[330,245],[500,260],[738,548],[1000,640]]){
 const s=api.summarySVG('edge-lca',w,h),g=api.layoutGeometry(w,h);
 assert(!/NaN|Infinity|undefined/.test(s));assert.equal((s.match(/data-elca-result=/g)||[]).length,1);assert(!s.includes('data-kind="lower"'));assert(!s.includes('data-frontier'));
 for(const p of g.points)assert(p.x>g.left&&p.x<g.right&&p.y>g.top&&p.y<g.bottom);
 if(w<300||h<230)assert(!/<text/.test(s));else{assert(s.includes('Direct line-graph oracle'));assert(s.includes('data-axis="x"'));assert(s.includes('data-axis="y"'));assert(s.includes('log* m'));if(w>=650&&h>=480)assert(s.includes('baseline-shift="super"'));else assert(s.includes('F(D): theorem factor'));}
}
assert(!/<text/.test(api.summarySVG('edge-lca',738,548,{level:'overview'})));
assert(api.summarySVG('edge-lca',330,245,{level:'detail'}).includes('data-detail-level="compact"'));
assert.equal(api.diagramSVG({publication:'all'}),api.diagramSVG('edge-lca',{publication:'all'}));
assert.equal((api.diagramSVG().match(/role="button"/g)||[]).length,1);
const changed=JSON.parse(JSON.stringify(data));changed.sources[row.sourceId].publicationStatus='preprint';const filtered=load(changed);
assert.equal(filtered.records({publication:'published'}).length,0);assert(filtered.diagramSVG({publication:'published'}).includes('No sources'));assert(!/<text/.test(filtered.summarySVG('edge-lca',160,90,{publication:'published'})));
function host(){const classes=new Set(),children=new Map(),listeners={};return{isConnected:true,innerHTML:'',classList:{add(...s){s.forEach(v=>classes.add(v))},remove(...s){s.forEach(v=>classes.delete(v))},toggle(v,on){on?classes.add(v):classes.delete(v)}},setAttribute(){},querySelector(s){if(!children.has(s))children.set(s,{innerHTML:'',value:''});return children.get(s)},addEventListener(t,f,o){listeners[t]={fn:f,signal:o.signal}},classes,listeners};}
const root=host();let chosen=null;api.mount(root,'edge-lca',{onPublicationChange:v=>chosen=v});
const detail=()=>root.querySelector('.elca-theorem').innerHTML;
for(const phrase of ['Theorem 5.1','Direct oracle','No information retained','does not assert','Read primary theorem','derivation'])assert(detail().includes(phrase),phrase);
let prevented=false;root.listeners.keydown.fn({key:'Enter',preventDefault(){prevented=true},target:{closest(){return{dataset:{elcaResult:row.id}}}}});assert(prevented);
root.listeners.click.fn({target:{closest(){return{dataset:{elcaResult:row.id}}}}});assert(detail().includes('Theorem 5.1'));
root.listeners.change.fn({target:{value:'published',classList:{contains:c=>c==='elca-publication'}}});assert.equal(chosen,'published');
const signal=root.listeners.click.signal;api.mount(root);assert(signal.aborted);const fresh=root.listeners.click.signal;api.release(root);assert(fresh.aborted);assert(!root.classes.has('elca-view'));
const escaped=JSON.parse(JSON.stringify(data));escaped.verifiedRecords[0].notes='<script>alert(1)</script>';const eapi=load(escaped),eroot=host();eapi.mount(eroot);assert(!eroot.querySelector('.elca-theorem').innerHTML.includes('<script>'));assert(eroot.querySelector('.elca-theorem').innerHTML.includes('&lt;script&gt;'));
console.log('Edge LCA regression PASS: original record/slice; exact palette/probe derivation and oracle scope; no fabricated lower; 9 thumbnail geometries and no-text overview; object/key diagram signatures; publication filtering, theorem inspection, keyboard, lifecycle, escaping.');
