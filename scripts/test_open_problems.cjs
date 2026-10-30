'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('dist/index.html'),data=JSON.parse(html.match(/<script id="atlas-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const context={window:{},document:{getElementById:()=>({textContent:JSON.stringify(data)})}};
vm.runInNewContext(read('src/figure-first.js'),context);
assert.deepEqual(Object.keys(data.openProblems.problems).sort(),data.problems.map(p=>p.id).sort());
let cards=0;
for(const p of data.problems)for(const model of data.models){
 const q=data.openProblems.settings?.[p.id+':'+model.id]||data.openProblems.problems[p.id],card=context.window.AtlasFigureFirst.questionHTML(p.id,model.id);
 assert(card.includes('class="problem-open-question"')&&card.includes('Setup.'));
 assert(q.sources.every(s=>card.includes(s.url)),'Each open question links to its primary source');
 assert(card.includes(q.models.includes(model.id)?'In this setting':'Across the'),'Cross-model questions retain their family-level label');
 assert(q.status.includes('cited')||q.status.includes('bounds gap'),'Paper-stated and inferred questions remain distinguished');cards++;
}
const people=read('dist/people.html');
assert(!people.includes('Principal Investigator')&&!people.includes('Soheil Behnezhad'),'People keeps the current Alma-only profile choice');
const dynamicQuestion=context.window.AtlasFigureFirst.questionHTML('weighted_matching','dynamic');
assert(dynamicQuestion.includes('explicit (1−ε)')&&dynamicQuestion.includes('fully dynamic'),'Weighted dynamic has its own correctly scoped open direction');
assert(!dynamicQuestion.includes('independent edge survival'),'Dynamic question does not inherit the stochastic setup');
assert(!people.includes('A community effort,<br>taking shape.')&&!people.includes('An initiative by'));
const photos=JSON.parse(read('src/assets/people/sources.json'));
for(const photo of photos){
 assert(!photo.profileUrl.includes('simons')&&!photo.imageUrl.includes('simons'));
 assert(people.includes('href="'+photo.profileUrl+'" target="_blank" rel="noopener noreferrer">'+photo.name+'</a>'),'Names themselves link to personal websites');
 const original=fs.readFileSync(path.join(root,'src/assets/people',photo.filename)).toString('base64');
 assert(people.includes('data:'+photo.mimeType+';base64,'+original),'Published portrait is the current personal-site asset');
}
console.log('Open problems PASS: six sourced family questions, setup labels on all '+cards+' setting pages, inference/preprint qualifications, and current personal-site portraits with linked names.');
