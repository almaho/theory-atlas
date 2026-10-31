/* Shape identifies a setup. Color identifies the mathematical role of a bound. */
(()=>{
  'use strict';
  const target=typeof window==='undefined'?globalThis:window;
  const shapes=['circle','square','triangle','diamond','hexagon','plus','triangle-down'];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const n=x=>Math.round(x*10000)/10000;
  function path(x,y,r,shape){
    const polygon=points=>'M'+points.map(([dx,dy])=>n(x+dx*r)+' '+n(y+dy*r)).join('L')+'Z';
    if(shape==='square')return polygon([[-.9,-.9],[.9,-.9],[.9,.9],[-.9,.9]]);
    if(shape==='triangle')return polygon([[0,-1.15],[1.1,.9],[-1.1,.9]]);
    if(shape==='triangle-down')return polygon([[-1.1,-.9],[1.1,-.9],[0,1.15]]);
    if(shape==='diamond')return polygon([[0,-1.2],[1.2,0],[0,1.2],[-1.2,0]]);
    if(shape==='hexagon')return polygon([[1,0],[.5,.866],[-.5,.866],[-1,0],[-.5,-.866],[.5,-.866]]);
    if(shape==='plus')return polygon([[-.35,-1],[.35,-1],[.35,-.35],[1,-.35],[1,.35],[.35,.35],[.35,1],[-.35,1],[-.35,.35],[-1,.35],[-1,-.35],[-.35,-.35]]);
    return 'M'+n(x+r)+' '+n(y)+'A'+n(r)+' '+n(r)+' 0 1 0 '+n(x-r)+' '+n(y)+'A'+n(r)+' '+n(r)+' 0 1 0 '+n(x+r)+' '+n(y)+'Z';
  }
  function mark(x,y,size,shape='circle',kind='algorithm',attrs='',options={}){
    if(![x,y,size].every(Number.isFinite)||size<=0)throw new Error('Invalid atlas marker coordinates');
    if(!shapes.includes(shape))throw new Error('Unknown atlas marker shape: '+shape);
    const lower=kind==='lower'||String(kind).includes('lower')||String(kind).includes('barrier'),role=lower?'lower':'algorithm',color='var(--'+(lower?'red':'green')+')';
    const open=options.open||options.conditional;
    return '<path class="atlas-bound-symbol" data-marker="'+role+'" data-center-x="'+x+'" data-center-y="'+y+'" data-setup-shape="'+shape+'" d="'+path(x,y,size,shape)+'" fill="'+(open?'none':color)+'" stroke="'+color+'" stroke-width="'+(options.strokeWidth||1.3)+'"'+(open?' data-open-marker="true"':'')+(options.conditional?' stroke-dasharray="2 1"':'')+(attrs?' '+attrs:'')+'/>';
  }
  function key(shape,label){
    return '<span class="atlas-shape-key"><svg viewBox="0 0 38 20" aria-hidden="true">'+mark(10,10,5,shape,'algorithm')+mark(27,10,5,shape,'lower')+'</svg><span>'+esc(label)+'</span></span>';
  }
  target.AtlasSymbols={mark,key,path,shapes};
})();
