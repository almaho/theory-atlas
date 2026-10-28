'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
const data=JSON.parse(html.match(/<script id="atlas-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const c={window:{},document:{getElementById:()=>({textContent:JSON.stringify(data)})},Set};vm.createContext(c);
for(const name of ['cc-comparison.js','paper-links.js'])vm.runInContext(fs.readFileSync(path.join(root,'src',name),'utf8'),c);
const api=c.window.AtlasCCComparison,epsilon=1/8;
assert.equal(data.ccComparison.epsilon,epsilon);
assert(!api.idFor('cc-stochastic'),'Recovery is not an approximation ratio');
assert(!api.idFor('cc-query_combined'),'Removed column remains excluded');
let markers=0;
for(const [key,pair]of Object.entries(data.ccComparison.pairs)){
 const source=data.focus[key],ids=new Set(source.verifiedRecords.map(r=>r.id));
 assert.equal(new Set(pair.records.map(r=>r.id)).size,pair.records.length);
 assert.deepEqual(new Set(pair.records.map(r=>r.id)),ids,key+': every verified record is accounted for');
 const routes=key==='cc-stream'?['cc-stream-partition','cc-stream-value']:[key];
 for(const route of routes){
  for(const [w,h]of [[90,65],[180,110],[330,245],[738,548],[1000,900]]){
   const g=api.geometry(route,w,h),svg=api.summarySVG(route,w,h);
   const stack=[];for(const [tag,name]of svg.matchAll(/<\/?([a-zA-Z][\w:-]*)\b[^>]*>/g)){if(tag.startsWith('</'))assert.equal(stack.pop(),name,'SVG elements close in order');else if(!tag.endsWith('/>'))stack.push(name);}assert.equal(stack.length,0,'SVG is balanced for standalone export');
   assert(!/NaN|undefined/.test(svg),route+': finite, fully labeled output');
   if(w<=180)assert(!/<text\b/.test(svg),'Overview removes unreadable text');
   assert.equal(g.px(1),w*.36);assert.equal(g.px(4),w*.94);
   for(const p of g.points){
    assert(p.alpha>=1&&p.alpha<=4,route+': no clipping or invented off-scale position');
    assert(p.x>=g.left&&p.x<=g.right&&p.y>=0&&p.y<h);
    assert(Math.abs((p.x-g.left)/(g.right-g.left)-(p.alpha-1)/3)<1e-12,'Linear coordinate is identical across all models and zoom levels');
    assert(c.window.AtlasPapers.resolve([p.id]).length,route+': every dot resolves to a paper');
    markers++;
   }
   for(const r of g.symbolic)assert(!g.points.some(p=>p.id===r.id),'Unknown factors have no numerical coordinate');
  }
  const full=api.diagramSVG(route),filtered=api.records(route,{publication:'published'});
  assert(filtered.every(r=>r.publicationStatus!=='preprint'));
  for(const r of api.records(route))assert(full.includes('data-ccx-result="'+r.id+'"'),'No theorem disappears in the comparison');
 }
}
function find(key,id){return api.records(key).find(r=>r.id===id).comparison;}
assert.equal(api.factor(find('cc-dynamic','cc-dyn-pruned-3plus')),3+epsilon);
assert.equal(api.factor(find('cc-lca','cc-lca-pruned-3plus')),3+epsilon);
assert.equal(api.factor(find('cc-mpc','cc-mpc-pruned-3plus')),3+epsilon);
assert.equal(api.factor(find('cc-stream-partition','cc-stream-turnstile-3plus')),3+epsilon);
assert.equal(find('cc-lca','cc-lca-bonchi-four').group,'additive','4OPT+εn² must not be presented as a pure factor 4');
assert.equal(find('cc-query_matrix','cc-query-matrix-pure-scan-cap').group,'pure','Exact exponential scan remains explicit');
assert.equal(api.factor(find('cc-online','cc-online-max-greedy')),2);
assert(Math.abs(api.factor(find('cc-online','cc-online-max-rand-lower'))-1/.834)<1e-12,'Upper retained fraction becomes lower approximation factor');
assert(api.diagramSVG('cc-local').includes('ccx-residual'),'LOCAL vanishing correction is visible, not silently dropped');
assert(!html.includes('href="fine-grained.html"'));
assert(!fs.existsSync(path.join(root,'dist/fine-grained.html')));
assert(fs.existsSync(path.join(root,'src/fine-grained.html')),'Paused work remains recoverable');
const focus=fs.readFileSync(path.join(root,'src/focus.js'),'utf8');
assert(focus.includes('compare.mount(root,key,options,rendererFor(key))'));
assert(focus.includes('compare.summarySVG(key,w,h,options)'),'Full atlas uses the same shared coordinate system');
console.log('Clustering comparison PASS: 8 models; all verified records accounted for; '+markers+' marker geometries; common linear alpha, reciprocal agreement factors, additive scope, residual correction, filters, sources and removed-page guards.');

assert(api.summarySVG('cc-mpc',330,245).includes('data-graph-shape="square"'),'Restricted graph classes remain visible in the overview');
assert(api.summarySVG('cc-query_matrix',330,245).includes('data-graph-shape="triangle"'),'Exponential computation baseline has a distinct marker');
