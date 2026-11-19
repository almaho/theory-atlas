(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const number=x=>Number.isInteger(x)?String(x):x.toFixed(2).replace(/0+$/,'').replace(/\.$/,'');
  const ratioText=x=>(Math.abs(x-Number(number(x)))>1e-9?'≈ ':'')+number(x);
  const svg=(w,h,title,body)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${title}">${body}</svg>`;
  const line=(x1,y1,x2,y2,cls='ps-graph-edge')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls}"/>`;
  const node=(x,y,label,selected=false)=>`<circle cx="${x}" cy="${y}" r="12" class="ps-node${selected?' ps-selected-node':''}"/><text x="${x}" y="${y+5}" text-anchor="middle">${label}</text>`;
  const press=(ids,active)=>ids.forEach(id=>$(id).setAttribute('aria-pressed',String(id===active)));
  const path={k:5,epsilon:.2,inserted:false,flipped:false};
  function drawPath(){
    const w=Math.max(250,$('ps-path-graph').clientWidth),k=path.k;
    const point=i=>[22+Math.floor(i/2)*(w-44)/k,i%2?135:35];
    let drawing='';
    for(let i=0;i<=2*k;i++){
      const [x1,y1]=point(i),[x2,y2]=point(i+1),missing=i===2*k&&!path.inserted;
      const selected=path.flipped?i%2===0:i%2===1;
      drawing+=line(x1,y1,x2,y2,missing?'ps-missing-edge':selected?'ps-selected-edge':'ps-graph-edge');
    }
    for(let i=0;i<=2*k+1;i++){
      const [x,y]=point(i);drawing+=`<circle cx="${x}" cy="${y}" r="7" class="ps-node"/>`;
      if((w-44)/k>33||i===0||i===2*k+1)drawing+=`<text x="${x}" y="${y+(i%2?26:-16)}" text-anchor="middle">${i}</text>`;
    }
    $('ps-path-graph').innerHTML=svg(w,180,`Path on ${2*k+2} vertices. ${path.inserted?'All edges present.':'Final edge absent.'} Matching has ${path.flipped?k+1:k} edges.`,drawing);
    const size=path.flipped?k+1:k,opt=path.inserted?k+1:k,ratio=opt/size,valid=ratio<=1+path.epsilon+1e-10;
    $('ps-k-value').value=String(k);
    $('ps-path-state').textContent=path.flipped?'After the flip':path.inserted?'After insertion':'Before insertion';
    $('ps-insert').disabled=path.inserted;$('ps-flip').disabled=!path.inserted||path.flipped;
    const metrics=[['Matching size',size],['Optimum size',opt],['OPT / |M|',ratioText(ratio)],['Changed memberships',path.flipped?2*k+1:0]];
    $('ps-path-metrics').innerHTML=metrics.map(([label,value])=>`<div class="ps-metric"><span>${label}</span><strong>${value}</strong></div>`).join('');
    const feedback=$('ps-path-feedback');feedback.className='ps-feedback '+(valid?'good':'bad');
    feedback.textContent=path.flipped?`The matching is optimum again. The flip removed ${k} edges and inserted ${k+1}.`:!path.inserted?`The starting matching is optimum. Will inserting one edge force a repair at target ${number(1+path.epsilon)}?`:valid?`Target met. Ratio ${ratioText(ratio)} is at most ${number(1+path.epsilon)}. The promise allows you to keep the old matching.`:`Target missed. Ratio ${ratioText(ratio)} exceeds ${number(1+path.epsilon)}. Here the integer-valued target requires ${k+1} matching edges.`;
  }
  function resetPath(){path.inserted=false;path.flipped=false;drawPath()}
  $('ps-k').addEventListener('input',e=>{path.k=+e.target.value;resetPath()});
  $('ps-epsilon').addEventListener('change',e=>{path.epsilon=+e.target.value;drawPath()});
  $('ps-insert').addEventListener('click',()=>{path.inserted=true;drawPath()});
  $('ps-flip').addEventListener('click',()=>{path.flipped=true;drawPath()});
  $('ps-reset').addEventListener('click',resetPath);
  function depth(){const r=+$('ps-depth').value;$('ps-depth-value').value=String(r);$('ps-depth-result').innerHTML=`No augmenting path of length ≤ ${2*r-1}<br>OPT / |M| ≤ ${r+1}/${r}<span>Approximation factor 1 + 1/${r} ≈ ${number(1+1/r)}.<br>Equivalent retained fraction: |M| / OPT ≥ ${r}/${r+1}.<br>A tight witness has ${2*r+1} path edges and ${r} matched edges.</span>`}
  $('ps-depth').addEventListener('input',depth);
  let weightChoice='outer';
  function weighted(){const v=+$('ps-weight').value,w=Math.max(250,$('ps-weight-graph').clientWidth),xs=[24,(w-48)/3+24,2*(w-48)/3+24,w-24];let body='';for(let i=0;i<3;i++){body+=line(xs[i],58,xs[i+1],58,(weightChoice==='middle'?i===1:i!==1)?'ps-selected-edge':'ps-graph-edge');body+=`<text x="${(xs[i]+xs[i+1])/2}" y="31" text-anchor="middle">${i===1?number(v):1}</text>`}xs.forEach((x,i)=>body+=node(x,58,String.fromCharCode(97+i)));$('ps-weight-graph').innerHTML=svg(w,112,`Path with edge weights 1, ${number(v)}, 1. ${weightChoice==='middle'?'Middle edge':'Outer edges'} selected.`,body);$('ps-weight-value').value=number(v);const value=weightChoice==='middle'?v:2,opt=Math.max(2,v);$('ps-weight-result').textContent=`Selected weight ${number(value)} · optimum ${number(opt)} · ratio ${ratioText(opt/value)}.`;press(['ps-outer','ps-middle'],`ps-${weightChoice}`)}
  $('ps-weight').addEventListener('input',weighted);$('ps-outer').addEventListener('click',()=>{weightChoice='outer';weighted()});$('ps-middle').addEventListener('click',()=>{weightChoice='middle';weighted()});
  let starChoice='center';
  function star(){const d=+$('ps-leaves').value,w=Math.max(250,$('ps-star-graph').clientWidth),cx=w/2,cy=95,r=66;let body='';const points=Array.from({length:d},(_,i)=>[cx+r*Math.cos(-Math.PI/2+2*Math.PI*i/d),cy+r*Math.sin(-Math.PI/2+2*Math.PI*i/d)]);points.forEach(([x,y])=>body+=line(cx,cy,x,y));points.forEach(([x,y],i)=>body+=node(x,y,i+1,starChoice==='leaves'));body+=node(cx,cy,'c',starChoice==='center');$('ps-star-graph').innerHTML=svg(w,190,`Star with ${d} leaves. ${starChoice==='center'?'Center':'All leaves'} selected.`,body);$('ps-leaves-value').value=String(d);$('ps-star-result').textContent=`Both choices are maximal. Selected size ${starChoice==='center'?1:d} · maximum size ${d} · ratio ${starChoice==='center'?d:1}.`;press(['ps-center','ps-all-leaves'],starChoice==='center'?'ps-center':'ps-all-leaves')}
  $('ps-leaves').addEventListener('input',star);$('ps-center').addEventListener('click',()=>{starChoice='center';star()});$('ps-all-leaves').addEventListener('click',()=>{starChoice='leaves';star()});
  let colorState=0;
  function coloring(){const edge=$('ps-color-edge');edge.className='ps-color-edge'+(colorState?' connected':'')+(colorState===1?' conflict':'');edge.textContent=colorState?'':'no edge';$('ps-color-u').className='ps-color-node'+(colorState===2?' changed':'');$('ps-color-u').setAttribute('aria-label',colorState===2?'u, color 2':'u, color 1');$('ps-color-v').setAttribute('aria-label','v, color 1');$('ps-color-insert').disabled=colorState>0;$('ps-color-repair').disabled=colorState!==1;$('ps-color-result').textContent=['The two vertices may share a color while they are nonadjacent.','The inserted edge has equally colored endpoints. One conflict needs repair.','u takes a color absent from its neighbors. One vertex recolored; finding the color may require scanning its neighborhood.'][colorState]}
  $('ps-color-insert').addEventListener('click',()=>{colorState=1;coloring()});$('ps-color-repair').addEventListener('click',()=>{colorState=2;coloring()});$('ps-color-reset').addEventListener('click',()=>{colorState=0;coloring()});
  let edgeState=0;
  function edgeColoring(){const w=Math.max(250,$('ps-edge-graph').clientWidth),xs=[24,(w-48)/3+24,2*(w-48)/3+24,w-24],classes=['edge-red',edgeState===1?'edge-neutral':edgeState===2?'edge-green':'ps-missing-edge',edgeState===2?'edge-red':'edge-green'];let body='';for(let i=0;i<3;i++){body+=line(xs[i],63,xs[i+1],63,classes[i]);body+=`<text x="${(xs[i]+xs[i+1])/2}" y="32" text-anchor="middle">${i===0?'red':i===1?(edgeState===1?'third':edgeState===2?'green':'uncolored'):(edgeState===2?'red':'green')}</text>`}xs.forEach((x,i)=>body+=node(x,63,String.fromCharCode(97+i)));$('ps-edge-graph').innerHTML=svg(w,115,'Four-vertex path, with edge color labels.',body);$('ps-edge-result').textContent=['No common free color at the middle edge. The graph is still 2-edge-colorable.','Third color: one new edge colored, no old colors changed.','Two colors: recolor the right edge red, then color the middle edge green.'][edgeState]}
  $('ps-edge-extra').addEventListener('click',()=>{edgeState=1;edgeColoring()});$('ps-edge-recolor').addEventListener('click',()=>{edgeState=2;edgeColoring()});$('ps-edge-reset').addEventListener('click',()=>{edgeState=0;edgeColoring()});
  let cluster='all';
  function triangle(){const w=Math.max(250,$('ps-triangle-graph').clientWidth),cx=w/2,points=[[cx-85,145],[cx,35],[cx+85,145]];let body='';if(cluster==='all')body+=`<ellipse cx="${cx}" cy="104" rx="114" ry="100" class="ps-cluster-ring"/>`;if(cluster==='pair')body+=`<ellipse cx="${cx-43}" cy="90" rx="35" ry="93" transform="rotate(38 ${cx-43} 90)" class="ps-cluster-ring"/>`;if(cluster==='single')points.forEach(([x,y])=>body+=`<circle cx="${x}" cy="${y}" r="25" class="ps-cluster-ring"/>`);[[0,1,'+'],[1,2,'+'],[0,2,'−']].forEach(([a,b,sign])=>{const p=points[a],q=points[b];body+=line(...p,...q);body+=`<text x="${(p[0]+q[0])/2+(a===0&&b===1?-12:12)}" y="${(p[1]+q[1])/2+(b===2&&a===0?25:0)}" text-anchor="middle" class="ps-sign">${sign}</text>`});points.forEach(([x,y],i)=>body+=node(x,y,String.fromCharCode(97+i)));$('ps-triangle-graph').innerHTML=svg(w,215,'Signed triangle: ab positive, bc positive, ac negative. Dashed outlines show clusters.',body);document.querySelectorAll('[data-ps-cluster]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.psCluster===cluster)));$('ps-triangle-result').textContent=cluster==='all'?'1 disagreement: the negative edge ac lies inside the cluster.':cluster==='pair'?'1 disagreement: the positive edge bc crosses clusters.':'2 disagreements: both positive edges cross clusters.'}
  document.querySelectorAll('[data-ps-cluster]').forEach(b=>b.addEventListener('click',()=>{cluster=b.dataset.psCluster;triangle()}));
  function drawAll(){drawPath();weighted();star();edgeColoring();triangle()}
  let frame;window.addEventListener('resize',()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(drawAll)});
  drawAll();depth();coloring();
})();
