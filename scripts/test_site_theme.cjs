'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'src/theme.js'),'utf8');
function boot(saved,systemDark=false,blocked=false){
 const docEvents={},winEvents={},media={matches:systemDark,addEventListener:(type,fn)=>media.change=fn};
 const storage={value:saved,getItem(){if(blocked)throw Error('storage denied');return this.value;},setItem(key,value){if(blocked)throw Error('storage denied');this.value=value;}};
 const buttons=['light','dark'].map(value=>({dataset:{siteTheme:value},attrs:{},setAttribute(k,v){this.attrs[k]=v;},addEventListener(type,fn){this[type]=fn;}}));
 const element={dataset:{},style:{}};
 const c={document:{documentElement:element,querySelectorAll:()=>buttons,addEventListener:(type,fn)=>docEvents[type]=fn},window:{matchMedia:()=>media,localStorage:storage,addEventListener:(type,fn)=>winEvents[type]=fn}};
 vm.runInNewContext(source,c);docEvents.DOMContentLoaded();
 return {element,buttons,storage,media,winEvents};
}
let a=boot(null,true);assert.equal(a.element.dataset.theme,'dark','Unselected appearance uses the original dark palette');
a.buttons[0].click();assert.equal(a.element.style.colorScheme,'light');assert.equal(a.storage.value,'light');
assert.deepEqual(a.buttons.map(b=>b.attrs['aria-pressed']),['true','false']);
assert.equal(boot(null,false).element.dataset.theme,'dark','The default is dark regardless of the OS');
let b=boot(a.storage.value,true);assert.equal(b.element.dataset.theme,'light','Preference survives a new page load');
b.winEvents.storage({key:'theory-atlas-appearance',newValue:'dark'});assert.equal(b.element.dataset.theme,'dark','Other-tab choices sync');
b.storage.value='light';b.winEvents.pageshow();assert.equal(b.element.dataset.theme,'light','Restored pages refresh their preference');
b.winEvents.storage({key:'theory-atlas-appearance',newValue:null});assert.equal(b.element.dataset.theme,'dark','Clearing choice restores the dark default');
a=boot('invalid',false);assert.equal(a.element.dataset.theme,'dark','Invalid stored appearance uses the dark default');
a=boot(null,false,true);a.buttons[1].click();a.winEvents.pageshow();assert.equal(a.element.dataset.theme,'dark','Blocked storage does not break the switch');
for(const page of ['index','vision','people']){
 const html=fs.readFileSync(path.join(root,'dist',page+'.html'),'utf8');
 assert(html.includes(source)&&html.indexOf(source)<html.indexOf('<style>'),'Appearance initializes before styles');
 assert.equal((html.match(/data-site-theme="light"/g)||[]).length,1);
 assert.equal((html.match(/data-site-theme="dark"/g)||[]).length,1);
 assert(!html.includes('<!-- SITE_THEME -->')&&!html.includes('<!-- SITE_APPEARANCE -->'));
 const nav=html.match(/<nav class="view-nav"[\s\S]*?<\/nav>/)[0],footer=html.match(/<footer[\s\S]*?<\/footer>/)[0];
 assert(!nav.includes('data-site-theme')&&footer.includes('data-site-theme="light"'),'Appearance controls belong at the bottom, not in navigation');
 assert(!html.includes('Whiteboard')&&!html.includes('Chalkboard'),'Board labels are removed');
}
const css=fs.readFileSync(path.join(root,'src/style.css'),'utf8');
function colors(name){return css.match(new RegExp('--'+name+':light-dark\\((#[0-9a-f]+),(#[0-9a-f]+)\\)')).slice(1);}
function luminance(hex){if(hex.length===4)hex='#'+[...hex.slice(1)].map(c=>c+c).join('');const rgb=hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;}
for(const surface of ['bg','surface'])for(const ink of ['ink','muted','blue','green','red'])for(const mode of [0,1]){
 const vals=[luminance(colors(surface)[mode]),luminance(colors(ink)[mode])].sort((x,y)=>x-y);
 assert((vals[1]+.05)/(vals[0]+.05)>=4.5,`${ink} on ${surface}: readable in both modes`);
}
console.log('Appearance PASS: original dark default, persistent choice, cross-tab/back navigation, denied storage, footer controls on every page and text/semantic-color contrast.');
