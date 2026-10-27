/* Integration checks using the exact data and renderers shipped to readers. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
const data=JSON.parse(html.match(/<script id="atlas-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
assert.equal(data.models.length,9);
assert(!data.models.some(m=>m.id==='query_combined'));
assert(data.research.some(r=>r.slices.some(s=>s.model==='query_combined')),'Removed column research remains archived without changing its oracle assumptions');
const context={window:{},document:{getElementById:id=>id==='atlas-data'?{textContent:JSON.stringify(data)}:null},AbortController,Set};
vm.createContext(context);
for(const name of ['dynamic.js','streaming.js','lca.js','local.js','mpc.js','query-list.js',...data.focusPairs.map(p=>p.javascript),'paper-links.js'])vm.runInContext(fs.readFileSync(path.join(root,'src',name),'utf8'),context);
const coordinator=fs.readFileSync(path.join(root,'src/focus.js'),'utf8').split("  const featured=")[0]+'})();';
vm.runInContext(coordinator,context);
const api=context.window.AtlasFocus,papers=context.window.AtlasPapers;
assert(!api.settings().some(s=>s.model==='query_combined'),'Hidden model cannot appear in either figure picker');
assert.equal(api.keyForSlice('cc-query-combined-ssac'),null);
assert.equal(papers.arxivURL('https://arxiv.org/pdf/2404.06069v2#page=4'),'https://arxiv.org/abs/2404.06069v2');
assert.equal(papers.arxivURL('https://arxiv.org/abs/cs/0502011'),'https://arxiv.org/abs/cs/0502011');
assert.equal(papers.arxivURL('https://example.org/arxiv.org/abs/1234.5678'),null);
assert.equal(papers.arxivURL('https://arxiv.org.evil.example/abs/1234.5678'),null);
assert(papers.referenceHTML({title:'A publisher-only source',url:'https://doi.org/example'}).includes('Find on arXiv'),'Unknown arXiv IDs are never invented');
assert(papers.referenceHTML({title:'Elementary derivation',derived:true}).includes('no separate paper'));
const legacy={dynamic:context.window.DynamicMatching,streaming:context.window.StreamingMatching,lca:context.window.LCAMatching,local:context.window.LocalMatching,mpc:context.window.MPCMatching,query_list:context.window.ListQueryMatching};
const figures=[],unresolved=[],missingArxiv=new Map();let dots=0,arxiv=0;
for(const route of api.settings()){
  const renderer=route.pairId?context.window.AtlasPairRenderers[route.pairId]:legacy[route.type];
  const svg=renderer.diagramSVG({key:route.key,graph:route.key==='bipartite'?'bipartite':'general'});
  assert(!svg.includes('NaN'),route.key+': finite figure geometry');
  const ids=new Set([...svg.matchAll(/data-(?:[\w-]+-)?result="([^"]+)"/g)].map(m=>m[1]));
  for(const id of ids){const rows=papers.resolve([id]);dots++;if(!rows.length)unresolved.push({route:route.key,id});else if(rows.some(p=>papers.arxiv(p)))arxiv++;else for(const p of rows)if(p.title)missingArxiv.set(p.title,{title:p.title,url:p.sourceUrl||p.url});}
  for(const [w,h] of [[180,110],[330,245],[738,548]]){
    const summary=api.summarySVG(route.key,w,h);assert(!summary.includes('NaN'),route.key+': finite thumbnail');
    if(w===180)assert(!/<text\b/.test(summary),route.key+': overview stays uncluttered');
  }
  figures.push({key:route.key,problem:route.problem,model:route.model,dots:ids.size});
}
assert.deepEqual(unresolved,[],'Every interactive result must resolve to its cited source or an explicitly labeled derivation');
const app=fs.readFileSync(path.join(root,'src/app.js'),'utf8');
const fade=app.match(/function contextOpacity\([^]*?\n  function render/)[0].replace(/\n  function render$/,'');
const fadeContext={state:{selected:'matching:dynamic'},clamp:(v,a,b)=>Math.min(b,Math.max(a,v))};vm.createContext(fadeContext);vm.runInContext(fade,fadeContext);
assert.equal(fadeContext.contextOpacity(true,4),1,'Selected cell keeps full contrast');
assert.equal(fadeContext.contextOpacity(false,1),1,'Overview keeps all figures legible');
assert(fadeContext.contextOpacity(false,2)>fadeContext.contextOpacity(false,3),'Surroundings fade progressively');
assert(fadeContext.contextOpacity(false,4)<.1,'Other figures recede at close zoom');
fadeContext.state.selected=null;assert.equal(fadeContext.contextOpacity(false,4),1,'Overview restores every figure');
assert(app.includes('rec.slices.filter(s=>modelById.has(s.model))'),'Search cannot navigate to the removed column');
const fg=JSON.parse(fs.readFileSync(path.join(root,'data/fine-grained.json'),'utf8'));
const fgContext={window:{},document:{getElementById:id=>id==='fg-data'?{textContent:JSON.stringify(fg)}:null}};vm.createContext(fgContext);vm.runInContext(fs.readFileSync(path.join(root,'src/paper-links.js'),'utf8'),fgContext);
for(const row of fg.dynamicView.rows){if(row.threshold!=null)assert(fgContext.window.AtlasPapers.resolve(['fg:'+row.nodeId+':lower']).length);else assert.equal(fgContext.window.AtlasPapers.resolve(['fg:'+row.nodeId+':lower']).length,0);for(const i of row.algorithmIndices)assert(fgContext.window.AtlasPapers.resolve(['fg:'+row.nodeId+':algorithm:'+i]).length);}
console.log(JSON.stringify({status:'pass',visibleCells:data.models.length*data.problems.length,focusedFigures:figures.length,resultMarkers:dots,markersWithRecordedArxiv:arxiv,unresolvedSources:0,checks:'progressive fading; archived-column exclusion; all figure marker identities; no guessed arXiv IDs; fine-grained algorithm/lower identities'}));
if(process.argv.includes('--report'))fs.writeFileSync(path.join(root,'../figure-source-audit-2026-10-27.json'),JSON.stringify({figures,resultMarkers:dots,markersWithRecordedArxiv:arxiv,missingArxiv:[...missingArxiv.values()]},null,2)+'\n');

if(process.argv.includes('--gallery')){
 const css=html.match(/<style>([\s\S]*?)<\/style>/)[1],ps=new Map(data.problems.map(p=>[p.id,p.name]));
 let body='<h1>All-pair figure review · 27 October 2026</h1><p>Actual full-atlas summaries at 330 × 245. Expand any card for its 738 × 548 detail rendering.</p><nav>'+data.problems.map(p=>'<a href="#'+p.id+'">'+p.name+'</a>').join(' · ')+'</nav>';
 const report=[];
 for(const p of data.problems){
  body+='<section id="'+p.id+'"><h2>'+p.name+'</h2><div class="review-grid">';
  for(const m of data.models){
   const rec=data.research.find(r=>r.problem===p.id),slices=rec.slices.filter(s=>s.model===m.id);
   const routes=api.settings().filter(r=>r.problem===p.id&&r.model===m.id);
   const route=routes[0],status=route?'curated':slices.length?'archival evidence; scoped figure deferred':'no researched result';
   report.push({problem:p.id,model:m.id,status,results:slices.reduce((n,s)=>n+s.results.length,0),views:routes.map(r=>r.key)});
   body+='<article><h3>'+m.name+'</h3>';
   if(route)body+='<div class="thumb">'+api.summarySVG(route.key,330,245)+'</div><details><summary>Detail rendering</summary><div class="large">'+api.summarySVG(route.key,738,548)+'</div></details><p>'+api.axisSummary(route.key)+'</p>';
   else body+='<div class="unreviewed">'+status+'</div>';
   body+='</article>';
  }
  body+='</div></section>';
 }
 const folder=path.join(root,'.openai');fs.mkdirSync(folder,{recursive:true});
 fs.writeFileSync(path.join(folder,'figure-review.html'),'<!doctype html><meta charset="utf-8"><style>'+css+'body{padding:25px;max-width:1200px;margin:auto}nav{position:sticky;top:0;z-index:10;background:var(--surface);padding:14px}h2{margin:25px 0 14px}.review-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}.review-grid article{border:1px solid var(--line);padding:12px;border-radius:8px;min-width:0}.thumb{width:330px;height:245px}.large{width:738px}.review-grid details{overflow:auto}.review-grid p{font-size:11px;margin-top:12px;color:var(--muted)}.unreviewed{height:245px;display:grid;place-items:center;color:var(--muted)}</style>'+body);
 fs.writeFileSync(path.join(root,'../all-pair-figure-review-2026-10-27.json'),JSON.stringify(report,null,2)+'\n');
}
