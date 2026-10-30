'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
const html=read('dist/index.html'),data=JSON.parse(html.match(/<script id="atlas-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
for(const page of ['index','vision','people']){
 const content=read('dist/'+page+'.html'),nav=content.match(/<nav class="view-nav"[\s\S]*?<\/nav>/)[0];
 assert(!content.includes('/* SITE_CSS */')&&!content.includes('<!-- SITE_NAV -->'));
 assert.equal((nav.match(/aria-current="page"/g)||[]).length,1);
 for(const href of ['index.html#atlas','vision.html','people.html'])assert(nav.includes('href="'+href+'"'));
 assert(!nav.includes('Focused')&&!nav.includes('fine-grained'));
 for(const [,href]of content.matchAll(/href="([^"#:]+\.html)(?:#[^"]*)?"/g)){
  if(!href.includes('://'))assert(fs.existsSync(path.join(root,'dist',href)),page+': local navigation target exists');
 }
 assert.equal((content.match(/<main\b/g)||[]).length,1,page+': one main landmark');
}
assert(!html.includes('id="focus-view"')&&!html.includes('id="show-focus"'));
assert(/<main id="atlas" aria-label=/.test(html),'The atlas is visible before JS initializes');
assert(!html.includes('Jump to a focused figure'));
assert(read('src/vision.html').includes('As AI advances'));
assert(read('src/vision.html').includes('Think in abstractions'));
assert(read('src/vision.html').includes('by our community'));
assert(read('src/people.html').includes('Alma Ghafari'));
assert(read('src/people.html').includes('PROJECT INITIATOR'));
assert(read('src/people.html').includes('https://github.com/almaho/theory-atlas/issues'));
assert(!fs.existsSync(path.join(root,'dist/fine-grained.html')),'Fine-grained stays removed');

const c={window:{},document:{getElementById:id=>id==='atlas-data'?{textContent:JSON.stringify(data)}:null}};
vm.createContext(c);vm.runInContext(read('src/focus.js'),c);const api=c.window.AtlasFocus;
for(const route of api.settings()){
 const old=api.routeForHash('#focus-'+route.key),current=api.routeForHash('#atlas/'+route.key);
 assert.deepEqual(old,current,'Old figure links open the same atlas setting');
 assert.equal(old.sliceId,route.sliceId);
}
assert.equal(api.routeForHash('#focus-unknown'),null);
assert.equal(api.routeForHash('#atlas/%E0%A4%A'),null,'Invalid URL encoding does not crash navigation');
assert.equal(api.routeForHash('#focus-two').key,'one','Legacy two-pass alias uses the combined streaming view');

function boot(hash){
 const events=[],listeners=new Map(),home=[],location={hash};
 const context={location,encodeURIComponent,CustomEvent:class{constructor(type,options={}){this.type=type;this.detail=options.detail;}},document:{querySelectorAll:()=>[{},{}].map(()=>({addEventListener:(type,f)=>home.push(f)}))}};
 context.window={AtlasFocus:api,history:{replaceState:(_,title,url)=>{location.hash=url;}},addEventListener:(type,f)=>listeners.set(type,f),dispatchEvent:e=>events.push(e)};
 vm.runInNewContext(read('src/navigation.js'),context);return {events,listeners,home,location};
}
const initial=boot('');assert.equal(initial.location.hash,'#atlas');assert.equal(initial.events[0].type,'atlas:overview');
const direct=boot('#focus-cc-local');assert.equal(direct.location.hash,'#atlas/cc-local');assert.equal(direct.events[0].type,'atlas:open-setting');
assert.equal(direct.events[0].detail.sliceId,api.routeForHash('#focus-cc-local').sliceId);
direct.listeners.get('atlas:selection')({detail:{sliceId:api.routeForHash('#focus-dynamic-edges').sliceId}});
assert.equal(direct.location.hash,'#atlas/dynamic-edges','Selected settings can be shared without a separate mode');
let prevented=false;direct.home[0]({preventDefault(){prevented=true}});assert(prevented);assert.equal(direct.location.hash,'#atlas');assert.equal(direct.events.at(-1).type,'atlas:overview');
direct.listeners.get('atlas:selection')({detail:{sliceId:null}});assert.equal(direct.location.hash,'#atlas');
assert.equal(boot('#focus-does-not-exist').events[0].type,'atlas:overview');
// Announce selection changes from the renderer, including chart tabs and wheel zoom.
const appSource=read('src/app.js'),detailStart=appSource.indexOf('  function updateDetail(){');
const announcementSource=appSource.slice(detailStart,appSource.indexOf('    if(app.classList)',detailStart))+'}';
let currentCell={screen:{w:800}},currentSlice={id:'first'};
const announcements=[];
const announcementContext={selectedCell:()=>currentCell,selectedSlice:()=>currentSlice,camera:{k:4},base:1,W:1280,detail:{},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail}},dispatchEvent:e=>announcements.push(e.detail.sliceId)};
vm.createContext(announcementContext);vm.runInContext(announcementSource+'\nupdateDetail();updateDetail();',announcementContext);
currentSlice={id:'second'};vm.runInContext('updateDetail();',announcementContext);
currentCell=null;vm.runInContext('updateDetail();',announcementContext);
assert.deepEqual(announcements,['first','second',null],'URLs follow changed tabs/selections and overview, without per-frame history updates');
console.log('Site pages PASS: shared navigation, atlas default, all 60 legacy figure links, canonical setting routes, Vision/People content and local links; no separate figure mode or fine-grained page.');
require('./test_site_theme.cjs');
require('./test_open_problems.cjs');
