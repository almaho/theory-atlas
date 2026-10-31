'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),src=path.join(root,'src');
const style=fs.readFileSync(path.join(src,'style.css'),'utf8');
const hex=v=>v.length===3?v.split('').map(c=>c+c).join(''):v;
const neutral=v=>{v=hex(v);const rgb=[0,2,4].map(i=>parseInt(v.slice(i,i+2),16));return Math.max(...rgb)-Math.min(...rgb)<=3;};
for(const token of ['bg','surface','ink','muted','line','blue','soft','unknown']){
 const m=style.match(new RegExp('--'+token+':light-dark\\((#[a-f0-9]+),(#[a-f0-9]+)\\)'));assert(m,token);
 assert(neutral(m[1].slice(1))&&neutral(m[2].slice(1)),token+' is neutral in both themes');
}
assert(style.includes('--green:light-dark(#167548,#71d7a0)'));assert(style.includes('--red:light-dark(#b4444e,#fa959d)'));
const skip=new Set(['style.css','focus.css','dynamic-more.css','dynamic-more.js','streaming-more.js']);
for(const name of fs.readdirSync(src)){
 if(!/\.(js|css)$/.test(name)||name.startsWith('fine-grained')||skip.has(name))continue;
 for(const m of fs.readFileSync(path.join(src,name),'utf8').matchAll(/#([a-f0-9]{6})\b/gi))assert(neutral(m[1]),name+' retains nonsemantic hue '+m[0]);
}
function check(value,file){if(Array.isArray(value))value.forEach(v=>check(v,file));else if(value&&typeof value==='object')for(const[k,v]of Object.entries(value)){if(k==='color'&&typeof v==='string')for(const m of v.matchAll(/#([a-f0-9]{6})\b/gi))assert(neutral(m[1]),file);else check(v,file);}}
for(const name of fs.readdirSync(path.join(root,'data/focus')).filter(n=>n.endsWith('.json')))check(JSON.parse(fs.readFileSync(path.join(root,'data/focus',name),'utf8')),name);
const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/catalog.json'),'utf8')),mis=JSON.parse(fs.readFileSync(path.join(root,'data/research/mis.json'),'utf8')),max=JSON.parse(fs.readFileSync(path.join(root,'data/research/maximum_is.json'),'utf8'));
assert(catalog.problems.some(p=>p.id==='maximum_is'));assert.equal(max.slices.length,4);
assert.deepEqual(new Set(max.slices.map(s=>s.model)),new Set(['online','stochastic','stream','local']));
const moved=['mis-online-zeta-upper','mis-online-zeta-det-lower','mis-online-zeta-rand-lower',...JSON.parse(fs.readFileSync(path.join(root,'data/focus/maximum_is-stochastic.json'),'utf8')).verifiedRecords.map(r=>r.id)];
for(const id of moved){assert(!mis.slices.some(s=>s.results.some(r=>r.id===id)));assert(max.slices.some(s=>s.results.some(r=>r.id===id)));}
assert(!fs.existsSync(path.join(root,'dist/fine-grained.html')));
console.log('Semantic palette and objective split PASS: neutral setup accents, stable green/red meanings, four maximum-IS settings, no duplicated moved claims.');

