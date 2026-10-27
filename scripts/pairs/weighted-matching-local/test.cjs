'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const at=n=>path.join(__dirname,n),data=JSON.parse(fs.readFileSync(at('../../../data/focus/weighted-matching-local.json'),'utf8')),source=fs.readFileSync(at('../../../src/weighted-matching-local.js'),'utf8'),reg=JSON.parse(fs.readFileSync(at('registration.json'),'utf8')),patch=JSON.parse(fs.readFileSync(at('research-patch.json'),'utf8'));
const ID='weighted-matching-local';
function load(d=data){const c={window:{},document:{getElementById(){return{textContent:JSON.stringify({focus:{[ID]:d}})}}},AbortController,Set};vm.runInNewContext(source,c);return c.window.AtlasPairRenderers[ID];}
const api=load(),rows=api.records();
assert.equal(rows.length,3);assert.equal(api.related().length,1);
assert.equal(rows.filter(r=>r.kind==='upper').length,2);assert.equal(rows.filter(r=>r.kind==='lower').length,1);
assert(rows.every(r=>r.model==='LOCAL'));assert.equal(api.related()[0].model,'CONGEST');
assert(rows[0].bound.includes('ε⁻⁴ log² Δ'));assert(rows[1].bound.includes('ε⁻²(log log n)²'));
assert(rows[2].graph.includes('weight equal to 1'));assert(rows[2].notes.includes('unchanged rounds'));assert(rows[2].quality.includes('constant'));
assert(rows[1].probability.includes('n^(−c)'));assert(rows[2].probability.includes('expected approximation'));
assert.equal(api.records({randomness:'deterministic'}).length,2);assert.equal(api.records({randomness:'randomized'}).length,2);
for(const mode of ['deterministic','randomized'])assert(api.records({randomness:mode}).some(r=>r.kind==='lower'));
for(const r of [...data.verifiedRecords,...data.relatedResults])for(const k of ['quality','output','graph','theorem','probability'])assert(r[k],r.id+'/'+k);
for(const r of data.verifiedRecords)for(const [dim,field]of Object.entries(reg.pointFields))assert(data.figureAxes[r.panel][dim].categories.some(v=>v.id===r[field]));
assert.equal(reg.routes[0].problem,'weighted_matching');assert.equal(reg.routes[0].sliceId,patch.upsertSlices[0].id);
assert.deepEqual(patch.upsertSlices[0].results.map(r=>r.id),rows.map(r=>r.id));assert(patch.upsertSlices[0].results.every(r=>r.plot===null));
for(const [w,h]of [[90,60],[110,280],[450,90],[240,160],[330,220],[330,245],[500,280],[738,548],[1000,560]]){
 const svg=api.summarySVG(ID,w,h),g=api.layoutGeometry(w,h);
 assert(!/NaN|Infinity|undefined/.test(svg));assert.equal((svg.match(/data-wml-result=/g)||[]).length,3);
 assert.equal((svg.match(/data-kind="lower"/g)||[]).length,1);
 for(const p of g.rows){assert(p.x>=0&&p.y>=0&&p.w>0&&p.h>0);assert(p.x+p.w<=w);assert(p.y+p.h<=h);}
 if(w<300||h<245)assert(!/<text/.test(svg));else{assert(svg.includes('data-axis="x"'));assert(svg.includes('data-axis="y"'));assert(svg.includes('log'));}
}
assert(!/<text/.test(api.summarySVG(ID,738,548,{level:'overview'})));
assert(api.summarySVG(ID,330,245,{level:'detail'}).includes('data-detail-level="compact"'));
assert.equal(api.diagramSVG({randomness:'all'}),api.diagramSVG(ID,{randomness:'all'}));assert.equal((api.diagramSVG().match(/role="button"/g)||[]).length,3);
const pre=JSON.parse(JSON.stringify(data));Object.values(pre.sources).forEach(s=>s.publicationStatus='preprint');const filtered=load(pre);
assert.equal(filtered.records({publication:'published'}).length,0);assert(filtered.diagramSVG({publication:'published'}).includes('No results'));
assert(!/<text/.test(filtered.summarySVG(ID,120,80,{publication:'published'})));
function host(){const classes=new Set(),children=new Map(),listeners={};return{isConnected:true,innerHTML:'',classList:{add(...s){s.forEach(v=>classes.add(v))},remove(...s){s.forEach(v=>classes.delete(v))},toggle(v,on){on?classes.add(v):classes.delete(v)}},setAttribute(){},querySelector(s){if(!children.has(s))children.set(s,{innerHTML:'',value:''});return children.get(s)},addEventListener(t,f,o){listeners[t]={fn:f,signal:o.signal}},classes,listeners};}
const root=host();let changed;api.mount(root,ID,{onPublicationChange:v=>changed=v});
const detail=()=>root.querySelector('.wml-theorem').innerHTML;assert(detail().includes('Theorem 1.3'));assert(detail().includes('Paper record'));
const event=id=>({target:{closest(){return{dataset:{wmlResult:id}}}}});
root.listeners.click.fn(event(rows[2].id));assert(detail().includes('unit-weight transfer'));assert(detail().includes('KMW Theorem 20'));assert(detail().includes('unchanged rounds'));
let prevented=false;root.listeners.keydown.fn({...event(rows[0].id),key:'Enter',preventDefault(){prevented=true}});assert(prevented);assert(detail().includes('deterministic'));
root.listeners.click.fn(event(api.related()[0].id));assert(detail().includes('Related algorithm · CONGEST'));
root.listeners.change.fn({target:{value:'randomized',classList:{contains:c=>c==='wml-randomness'}}});assert(!root.querySelector('.wml-related').innerHTML);assert(root.querySelector('.wml-plot').innerHTML.includes('KMW'));
root.listeners.change.fn({target:{value:'published',classList:{contains:c=>c==='wml-publication'}}});assert.equal(changed,'published');
const signal=root.listeners.click.signal;api.mount(root);assert(signal.aborted);const fresh=root.listeners.click.signal;api.release(root);assert(fresh.aborted);assert(!root.classes.has('wml-view'));
const escaped=JSON.parse(JSON.stringify(data));escaped.verifiedRecords[0].notes='<script>x</script>';const ea=load(escaped),er=host();ea.mount(er);assert(er.querySelector('.wml-theorem').innerHTML.includes('&lt;script&gt;'));assert(!er.querySelector('.wml-theorem').innerHTML.includes('<script>'));
console.log('Weighted LOCAL PASS: exact source extraction and transfer scope; 3 main/1 related results; categorical axes and null plots; 9 atlas sizes and text-free overview; randomness/publication filters; source inspection and related card; keyboard, lifecycle and escaping.');
