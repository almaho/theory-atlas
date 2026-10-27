'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const at=name=>path.join(__dirname,name);
const local=fs.existsSync(at('focus.json'));
const data=JSON.parse(fs.readFileSync(local?at('focus.json'):at('../../../data/focus/edge-mpc.json'),'utf8'));
const source=fs.readFileSync(local?at('renderer.js'):at('../../../src/edge-mpc.js'),'utf8');
const patch=JSON.parse(fs.readFileSync(at('research-patch.json'),'utf8'));
const reg=JSON.parse(fs.readFileSync(at('registration.json'),'utf8'));
const input=JSON.parse(fs.readFileSync(at('input-research.json'),'utf8'));
function load(d=data){const c={window:{},document:{getElementById(){return{textContent:JSON.stringify({focus:{'edge-mpc':d}})}}},AbortController,Set};vm.runInNewContext(source,c);return c.window.AtlasPairRenderers['edge-mpc'];}
const api=load(),rr=api.records();
assert.equal(rr.length,3);assert.equal(data.relatedResults.length,0);
assert.deepEqual(rr.map(r=>r.id).sort(),input.slices.flatMap(s=>s.results.map(r=>r.id)).sort());
for(const slice of input.slices){const next=patch.upsertSlices.find(s=>s.id===slice.id);assert(next);assert.deepEqual(next.results.map(r=>r.id),slice.results.map(r=>r.id));assert(next.results.every(r=>r.plot===null&&r.evidenceStatus==='theorem_verified'));}
for(const row of rr){assert(data.figureAxes[row.panel]);for(const [dim,f]of Object.entries(reg.pointFields))assert(data.figureAxes[row.panel][dim].categories.some(c=>c.id===row[f]));for(const f of ['quality','graph','output','probability','theorem','localSpace','totalSpace','localComputation'])assert(row[f]);}
const lower=rr.find(r=>r.kind==='lower'),upper=rr.find(r=>r.id==='edge-mpc-cdp24-upper'),linear=rr.find(r=>r.panel==='linear');
assert.equal(lower.conditional,true);assert(lower.hypothesis.includes('Connectivity conjecture'));assert(lower.stability.includes('Deterministic component-stable'));assert(lower.graph.includes('forests'));assert(lower.bound.includes('log(log_Δ n)'));
assert(!upper.conditional);assert(upper.stability.includes('Component-unstable'));assert(upper.localComputation.includes('n^{poly(Δ)}'));assert(upper.degree.includes('(log log n)^{o(1)}'));assert(upper.notes.includes('sufficiently large fixed'));assert(upper.probability.includes('Deterministic'));
assert(linear.theorem.includes('Corollary 2'));assert(linear.localSpace.includes('words'));assert(linear.totalSpace.includes('O(m)'));assert(linear.notes.includes('log n'));assert(linear.probability.includes('1−1/poly(n)'));
assert.equal(api.records({memory:'linear'}).length,1);assert.equal(api.records({memory:'lowspace'}).length,2);
for(const [w,h]of [[120,90],[110,280],[450,90],[240,160],[330,245],[500,260],[738,548],[1000,660]]){
 const svg=api.summarySVG('edge-mpc',w,h),g=api.layoutGeometry(w,h);
 assert(!/NaN|Infinity|undefined/.test(svg));assert.equal((svg.match(/data-empc-result=/g)||[]).length,3);
 assert.equal((svg.match(/data-kind="lower"/g)||[]).length,1);assert.equal((svg.match(/data-conditional="true"/g)||[]).length,1);
 for(const p of g.points)assert(p.x>0&&p.x<w&&p.y>0&&p.y<h,'Marker out of viewBox');
 if(w<300||h<210)assert(!/<text/.test(svg),'Overview must omit visible text');
 else{assert(svg.includes('symbolic'));assert(svg.includes('data-axis="x"'));assert(svg.includes('poly(Δ)'));assert(/conditional/i.test(svg));}
 if(w>=650&&h>=480){assert(svg.includes('baseline-shift="super"'));assert(svg.includes('even forests'));assert(svg.includes('Stable · deterministic'));assert(svg.includes('Unstable · deterministic'));}
}
assert(!/<text/.test(api.summarySVG('edge-mpc',738,548,{level:'overview'})));
assert(api.summarySVG('edge-mpc',330,245,{level:'detail'}).includes('data-detail-level="compact"'),'Requested detail must not override fit constraints');
const focus=api.diagramSVG();assert.equal((focus.match(/role="button"/g)||[]).length,3);assert(!focus.includes('data-frontier'));assert(focus.includes('No common frontier'));
const changed=JSON.parse(JSON.stringify(data));changed.sources[upper.sourceId].publicationStatus='preprint';
const filtered=load(changed);assert.equal(filtered.records({publication:'published'}).length,1);assert(!filtered.diagramSVG({publication:'published'}).includes('data-kind="lower"'));
changed.sources[linear.sourceId].publicationStatus='preprint';const empty=load(changed);assert.equal(empty.records({publication:'published'}).length,0);assert(empty.diagramSVG({publication:'published'}).includes('No sources'));assert(!/<text/.test(empty.summarySVG('edge-mpc',160,90,{publication:'published'})));
function host(){const classes=new Set(),children=new Map(),listeners={};return{isConnected:true,innerHTML:'',classList:{add(...s){s.forEach(v=>classes.add(v))},remove(...s){s.forEach(v=>classes.delete(v))},toggle(v,on){on?classes.add(v):classes.delete(v)}},setAttribute(){},querySelector(s){if(!children.has(s))children.set(s,{innerHTML:'',value:''});return children.get(s)},addEventListener(t,f,o){listeners[t]={fn:f,signal:o.signal}},classes,listeners};}
const root=host();let chosen=null;api.mount(root,'edge-mpc-lowspace',{onPublicationChange:v=>chosen=v});
assert(root.querySelector('.empc-theorem').innerHTML.includes('Theorem 21'));assert(root.querySelector('.empc-theorem').innerHTML.includes('n^{poly(Δ)}'));
root.listeners.click.fn({target:{closest(){return{dataset:{empcResult:lower.id}}}}});assert(root.querySelector('.empc-theorem').innerHTML.includes('Required hypothesis'));assert(root.querySelector('.empc-theorem').innerHTML.includes('even for forests'));assert(root.querySelector('.empc-theorem').innerHTML.includes('Read primary theorem'));
let prevented=false;root.listeners.keydown.fn({key:'Enter',preventDefault(){prevented=true},target:{closest(){return{dataset:{empcResult:linear.id}}}}});assert(prevented);assert(root.querySelector('.empc-theorem').innerHTML.includes('Corollary 2'));
root.listeners.change.fn({target:{value:'published',classList:{contains:c=>c==='empc-publication'}}});assert.equal(chosen,'published');
const signal=root.listeners.click.signal;api.mount(root);assert(signal.aborted);const fresh=root.listeners.click.signal;api.release(root);assert(fresh.aborted);assert(!root.classes.has('empc-view'));
const escapeData=JSON.parse(JSON.stringify(data));escapeData.verifiedRecords[0].notes='<script>alert(1)</script>';const eapi=load(escapeData),eroot=host();eapi.mount(eroot);assert(!eroot.querySelector('.empc-theorem').innerHTML.includes('<script>'));assert(eroot.querySelector('.empc-theorem').innerHTML.includes('&lt;script&gt;'));
console.log('Edge MPC regression PASS: 3 original IDs; theorem scopes, conditional stability, words and computation costs; exact categorical axes; 8 thumbnail sizes; no-text overview; publication filters; source inspection; keyboard; lifecycle; escaping.');
