const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');
const read = file => JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const data = read('data/focus/matching-online.json');
const catalog = read('data/catalog.json');
const ctx = {window:{},document:{getElementById:()=>({textContent:JSON.stringify({focus:{'matching-online':data}})})},AbortController};
vm.runInNewContext(fs.readFileSync(path.join(root,'src/matching-online.js'),'utf8'),ctx);
const api = ctx.window.AtlasPairRenderers['matching-online'];
assert(catalog.models.some(m=>m.id==='online'));
assert(catalog.models.some(m=>m.id==='stochastic'));
assert(catalog.problems.some(p=>p.id==='weighted_matching'));
const weightedResearch=read('data/research/weighted_matching.json');
assert(weightedResearch.slices.every(s=>s.model==='online'));
assert(weightedResearch.coverage.filter(c=>c.model!=='online').every(c=>c.status==='not_assessed'));
for(const key of ['matching-online','matching-online-weighted']) {
  for(const [w,h] of [[40,40],[180,110],[240,180],[330,245],[500,260],[738,548],[1100,800]]) {
    const svg=api.summarySVG(key,w,h);
    assert(!svg.includes('NaN'));
    if(w<300||h<230)assert.equal((svg.match(/<text\b/g)||[]).length,0);
    const geometry=api.layoutGeometry(w,h,{key});
    for(const p of geometry.points) {
      assert(p.x>=0&&p.x<=w&&p.y>=0&&p.y<=h,`${key} ${p.id}: bounded geometry`);
      assert.equal(p.row.weighting,key.endsWith('-weighted')?'weighted':'unweighted');
      assert(!p.row.related,'Related scopes must not enter main rows');
    }
  }
}
const find=id=>data.verifiedRecords.find(r=>r.id==='online-'+id);
assert.equal(find('ranking').value,1-1/Math.E);
assert.equal(find('ranking-lower').value,find('ranking').value);
assert.equal(find('edge-lower').value,.5);
assert(find('edge-lower').assumptions.some(s=>s.includes('prefix')));
assert(find('irrevocable-random-edge').symbolicBonus);
assert.equal(find('irrevocable-random-edge').value,.5,'Unknown delta must remain symbolic');
assert.equal(find('recourse-8').value,.7);
assert.equal(find('recourse-16').value,10/13);
assert(find('recourse-16-lower').probability.includes('deterministic'));
assert.equal(find('we-random-vertex-upper').value,1/Math.E);
assert(find('we-random-vertex-upper').displayBound.includes('−1/n'));
assert(find('we-random-vertex-upper').asymptoticLimit);
assert(data.panels.find(p=>p.id==='weighted-irrevocable').rows.find(r=>r.id==='we-vertex-random').label.includes('One-sided'));
assert(find('we-random-edge-upper').notes.includes('Information-theoretic'));
assert(find('wp-d-lower').probability.includes('deterministic'));
assert(!data.verifiedRecords.some(r=>r.kind==='lower'&&r.value===.7027),'Analysis-framework ceiling is not all-algorithm hardness');
const published=api.records({key:'matching-online',publication:'published'});
assert(!published.some(r=>r.id==='online-preempt-half'));
assert(published.some(r=>r.id==='online-preempt-published'));
assert(!api.summarySVG('matching-online',738,548).includes('online-preempt-ks-historical'));
assert(!api.summarySVG('matching-online-weighted',738,548).includes('online-we-adversarial-related'));

function host(){const children=new Map();return {innerHTML:'',isConnected:true,listeners:[],classList:{add(){},remove(){},toggle(){}},setAttribute(){},querySelector(s){if(!children.has(s))children.set(s,{innerHTML:'',value:'',textContent:''});return children.get(s);},querySelectorAll(){return[];},addEventListener(type,fn,options){this.listeners.push({type,fn,options});}};}
for(const key of ['matching-online','matching-online-weighted']){
  const h=host(),instance=api.mount(h,key);
  const click=h.listeners.find(l=>l.type==='click');
  for(const row of api.records({key})){
    click.fn({target:{closest:s=>s==='[data-online-result]'?{dataset:{onlineResult:row.id}}:null}});
    const html=h.querySelector('.mon-theorem').innerHTML;
    assert(html.includes(row.theorem.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')));
    assert(html.includes('Read paper'));
    assert(html.includes(row.sourceUrl||row.url));
  }
  instance.destroy();assert(h.listeners.every(l=>l.options.signal.aborted));
}
console.log('Online matching PASS: separate weighted row; arrival/order/decision contracts; ratio direction; symbolic gains; recourse units; source filters; finite geometry and textless overview; inspection and lifecycle.');
