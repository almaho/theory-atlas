(()=>{
  'use strict';
  const data=JSON.parse(document.getElementById('atlas-data').textContent);
  const app=document.getElementById('atlas'),stage=document.getElementById('stage'),detail=document.getElementById('detail');
  const problemById=new Map(data.problems.map(x=>[x.id,x]));
  const modelById=new Map(data.models.map(x=>[x.id,x]));
  const relations=data.relations||[];
  const researchByProblem=new Map(data.research.map(x=>[x.problem,x]));
  const L={left:265,top:95,cw:330,ch:245,gx:22,gy:22};
  const WORLD={w:L.left+data.models.length*(L.cw+L.gx),h:L.top+data.problems.length*(L.ch+L.gy)};
  const state={selected:null,selectedSlice:null,cutoff:'all',relation:null,kind:'all',query:''};
  const camera={x:0,y:0,k:1};let base=1,W=960,H=630,raf=0,detailKey='',drag=null,suppressClickUntil=0;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
  const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const link=(u,t)=>u?`<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(t)} ↗</a>`:esc(t);
  const papers=new Map(data.research.flatMap(d=>d.papers.map(p=>[d.problem+':'+p.id,p])));
  const cells=[],labels=[];
  const selectedCell=()=>cells.find(c=>c.id===state.selected);
  const allSlices=c=>researchByProblem.get(c.p.id)?.slices.filter(s=>s.model===c.m.id)||[];
  const visibleResults=s=>(s?.results||[]).filter(r=>state.cutoff==='all'||papers.get(s.problem+':'+r.paperId)?.publicationStatus!=='preprint');
  const cellResults=c=>allSlices(c).flatMap(s=>visibleResults(s).map(r=>({s,r})));
  const plotted=s=>visibleResults(s).filter(r=>r.plot&&r.evidenceStatus!=='needs_full_text');
  function selectedSlice(c){const slices=allSlices(c);return slices.find(s=>s.id===state.selectedSlice)||slices.find(s=>curatedKey(s))||slices.find(s=>plotted(s).length)||slices[0]||null}
  data.problems.forEach((p,r)=>data.models.forEach((m,col)=>{
    const c={p,m,r,col,id:p.id+':'+m.id,x:L.left+col*(L.cw+L.gx),y:L.top+r*(L.ch+L.gy)};
    const el=document.createElement('div');el.className='cell';el.innerHTML=`<div class="plot" style="height:100%"></div><button type="button" data-cell="${c.id}" aria-label="Zoom into ${esc(p.name)}, ${esc(m.name)}"></button>`;
    c.el=el;c.plot=el.querySelector('.plot');c.button=el.querySelector('button');stage.append(el);cells.push(c);
  }));
  data.problems.forEach((p,r)=>{const el=document.createElement('div');el.className='axis-label problem';el.textContent=p.short;if(p.id==='cc'){el.classList.add('ccx-row-label');el.innerHTML='<span>'+esc(p.short)+'</span><span class="ccx-row-scale">α: 1 · 2 · 3 · 4 →</span>';}stage.append(el);labels.push({el,x:20,y:L.top+r*(L.ch+L.gy),w:L.left-40,h:L.ch})});
  data.models.forEach((m,i)=>{const el=document.createElement('div');el.className='axis-label';el.title=m.name;el.innerHTML=`<div><span class="axis-name">${esc(m.name)}</span><small>${esc(m.measure)}</small></div>`;stage.append(el);labels.push({el,name:m.name,short:({query_list:'Adj. list',query_matrix:'Adj. matrix',query_combined:'Combined'})[m.id]||m.name,x:L.left+i*(L.cw+L.gx),y:15,w:L.cw,h:65})});

  let plotSerial=0;
  let mountedDetail=null;
  function chartDetail(w,h){return w<220||h<140?'overview':w<420||h<240?'compact':'detail'}
  function chartGeometry(w,h){
    const level=chartDetail(w,h),t=clamp((w-165)/235,0,1),tiny=level==='overview';
    return {level,left:tiny?Math.min(10,w*.12):20+45*t,right:tiny?Math.min(10,w*.12):12+8*t,top:tiny?Math.min(10,h*.14):12+30*t,bottom:tiny?Math.min(10,h*.14):22+32*t};
  }
  function chartLabel(value,width){const text=String(value||''),max=Math.max(8,Math.floor(width/7));return text.length>max?text.slice(0,max-1)+'…':text}
  function curatedKey(s){const api=globalThis.AtlasFocus;return s&&typeof api?.keyForSlice==='function'&&typeof api?.summarySVG==='function'&&typeof api?.mount==='function'?api.keyForSlice(s.id):null}
  function disposeDetail(){if(typeof mountedDetail==='function')mountedDetail();else mountedDetail?.destroy?.();mountedDetail=null}
  function scrollToSelectedChart(){(!detail.hidden?detail:stage).scrollIntoView({block:'start',behavior:reduce?'instant':'smooth'})}
  function chartScopeHTML(c,s,slices,curated){
    const choices=(globalThis.AtlasFocus?.settings?.()||[]).filter(q=>slices.some(v=>v.id===q.sliceId));
    const canonicalKey=k=>globalThis.AtlasFocus?.canonicalKey?.(k)||(k==='two'?'one':k),activeKey=canonicalKey(curated),sameChart=q=>q.id===s?.id||(activeKey&&canonicalKey(curatedKey(q))===activeKey);
    const chartSlices=slices.filter(q=>!curatedKey(q)||canonicalKey(curatedKey(q))===curatedKey(q));
    const chartLabel=q=>({one:'One + two passes · general matching',bipartite:'One + two passes · bipartite matching',lca:'LCA matching · algorithms and lower bounds',local:'LOCAL matching · algorithms and lower bounds',mpc:'MPC matching · memory and round bounds','query-list':'Adjacency-list matching size · algorithms and lower bounds'})[curatedKey(q)]||globalThis.AtlasFocus?.labelForKey?.(curatedKey(q))||q.label;
    const tabs=choices.length?`<nav class="curated-settings" aria-label="Chart settings">${choices.map(q=>`<button type="button" data-slice="${esc(q.sliceId)}" aria-pressed="${q.sliceId===s?.id||canonicalKey(q.key)===activeKey}">${esc(q.label)}</button>`).join('')}</nav>`:'';
    const selector=`${tabs}${curated&&choices.length?'<details class="all-chart-settings"><summary>All chart settings</summary>':''}<label>Chart setting <select id="slice-select">${chartSlices.map(q=>`<option value="${esc(q.id)}" ${sameChart(q)?'selected':''}>${esc(chartLabel(q))}</option>`).join('')}</select></label>${curated&&choices.length?'</details>':''}`;
    if(curated)return `<div class="chart-scope curated-chart-scope"><details class="chart-setting-menu"><summary>Change setting</summary>${selector}</details><div id="detail-chart" class="atlas-focus-chart" aria-label="Selected setting knowledge map"></div></div>`;
    return `<div class="chart-scope"><details class="chart-setting-menu"><summary>Change setting</summary>${selector}</details><div id="detail-chart" class="detail-chart" aria-label="Detailed bound chart"></div>${accessPanel(c,s)}<p>${esc(s?.task||c.p.quality)}</p><div class="pills">${(s?.assumptions||[]).map(a=>`<span class="pill">${esc(a)}</span>`).join('')}</div><p class="note">${esc(s?(s.mode==='1d'?`Single resource line: ${s.axis?.label||c.m.measure}. The guarantee is fixed by the task, so there is no quality axis. This line represents only the selected setting.`:`${s.xAxis?.label||'Quality'} versus ${s.yAxis?.label||c.m.measure}. This plot represents only the selected setting.`):'Select a setting to see its graph.')}</p><div id="plot-key">${plotKey(s)}</div><div id="inspect" class="inspect">${plotted(s).length?'Click the chart to inspect a region.':'Symbolic bounds are listed with their assumptions below.'}</div></div>`;
  }
  function mountDetailChart(c,s,chart){
    const curated=curatedKey(s);
    if(curated){mountedDetail=globalThis.AtlasFocus.mount(chart,curated,{embedded:true,publication:state.cutoff,onGraphChange:graph=>{state.selectedSlice=graph==='bipartite'?'matching-stream-twopass-bipartite-lower':'matching-stream-singlepass-insertion-explicit';detailKey='';render()},onPublicationChange:publication=>{state.cutoff=publication;detailKey='';render()},onWeightingChange:weight=>{const target=cells.find(item=>item.id===(weight==='weighted'?'weighted_matching:online':'matching:online'));focus(target,weight==='weighted'?'matching-online-weighted-irrevocable':'matching-online-irrevocable',false)}});return}
    const chartWidth=Math.max(320,Math.min(900,detail.clientWidth-44));chart.innerHTML=plot(c,chartWidth,460);chart.addEventListener('click',e=>inspectEvent(c,e,chart.querySelector('svg')));
  }
  function axisTicks(a,count=4){
    if(Array.isArray(a?.ticks)&&a.ticks.length)return a.ticks.filter(v=>Number.isFinite(v)&&v>=a.min&&v<=a.max);
    return Array.from({length:count+1},(_,i)=>a.min+(a.max-a.min)*i/count);
  }
  function tickText(a,v,i){const t=a?.tickLabels;return (Array.isArray(t)&&t[i]!=null)?String(t[i]):formatNumber(v)}
  function plot1d(c,w,h,s){
    const a=s.axis||{},ok=Number.isFinite(a.min)&&Number.isFinite(a.max)&&a.min<a.max;
    const {level,left,right,top,bottom}=chartGeometry(w,h),full=level==='detail',tiny=level==='overview';
    const pw=Math.max(8,w-left-right),ph=Math.max(8,h-top-bottom),cy=top+ph*.52,band=Math.max(10,Math.min(34,ph*.22));
    const x=v=>left+(v-a.min)/(a.max-a.min)*pw;
    const rs=ok?plotted(s).filter(r=>Number.isFinite(r.plot?.v)):[];
    const uid='line-'+c.p.id+'-'+c.m.id+'-'+(++plotSerial);
    const uppers=rs.filter(r=>r.kind==='upper'&&r.plot.closure==='right'),lowers=rs.filter(r=>r.kind==='lower'&&r.plot.closure==='left');
    const bestUp=uppers.length?Math.min(...uppers.map(r=>r.plot.v)):null;
    const bestLow=lowers.length?Math.max(...lowers.map(r=>r.plot.v)):null;
    let svg=`<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(c.p.name+' in '+c.m.name+'. One-dimensional resource line: '+(a.label||c.m.measure)+'. Green is achievable, red is ruled out, gray is open.')}" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="${uid}-hatch" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 8 L8 0" stroke="var(--red)" stroke-width=".8" opacity=".42"/></pattern></defs>`;
    svg+=`<rect x="${left}" y="${cy-band}" width="${pw}" height="${band*2}" fill="var(--unknown)"/>`;
    if(bestLow!=null){const strict=lowers.filter(r=>r.plot.v===bestLow).every(r=>r.plot.strict),rx=clamp(x(bestLow),left,left+pw)-left-(strict?1:0),at=`x="${left}" y="${cy-band}" width="${Math.max(0,rx)}" height="${band*2}"`;svg+=`<rect ${at} fill="var(--red-fill)"/><rect ${at} fill="url(#${uid}-hatch)"/>`}
    if(bestUp!=null){const strict=uppers.filter(r=>r.plot.v===bestUp).every(r=>r.plot.strict),px=clamp(x(bestUp),left,left+pw)+(strict?1:0);svg+=`<rect x="${px}" y="${cy-band}" width="${Math.max(0,left+pw-px)}" height="${band*2}" fill="var(--green-fill)"/>`}
    svg+=`<path d="M${left} ${cy} H${left+pw}" stroke="var(--muted)" stroke-width="1"/>`;
    if(ok&&!tiny){const allTicks=axisTicks(a,5),tk=full?allTicks:[allTicks[0],allTicks.at(-1)];tk.forEach((v,i)=>{const px=x(v);svg+=`<path d="M${px} ${cy-band} V${cy+band}" stroke="var(--line)" stroke-width="1"/><path d="M${px} ${cy+band} v5" stroke="var(--muted)" stroke-width="1"/>`;if(full)svg+=`<text x="${px}" y="${cy+band+18}" text-anchor="${i===0?'start':i===tk.length-1?'end':'middle'}">${esc(tickText(a,v,i))}</text>`})}
    for(const r of rs){const px=clamp(x(r.plot.v),left+3,left+pw-3),radius=tiny?3:full?6:4;svg+=resultGroup(s,r,full);svg+=r.kind==='lower'?`<path d="M${px} ${cy-radius} L${px+radius} ${cy} L${px} ${cy+radius} L${px-radius} ${cy} Z" fill="${r.plot.strict?'var(--surface)':'var(--red)'}" stroke="var(--red)"><title>${esc(r.bound)}</title></path>`:`<circle cx="${px}" cy="${cy}" r="${tiny?2.5:full?5:3}" fill="${r.plot.strict?'var(--surface)':'var(--green)'}" stroke="var(--green)"><title>${esc(r.bound)}</title></circle>`;svg+='</g>';if(full&&rs.length<=2&&r.plot.label)svg+=`<text x="${px}" y="${cy-band-7}" text-anchor="middle" class="plot-label">${esc(r.plot.label.slice(0,22))}</text>`}
    if(full){svg+=`<text data-axis="x" x="${left+pw/2}" y="${h-8}" text-anchor="middle">${esc(a.label||c.m.measure)}</text>`;if(bestLow!=null)svg+=`<text x="${left+4}" y="${cy-band-7}" text-anchor="start" fill="var(--red)">ruled out</text>`;if(bestUp!=null)svg+=`<text x="${left+pw-4}" y="${cy+band+18}" text-anchor="end" fill="var(--green)">achievable →</text>`;svg+=`<text x="${left}" y="${top+11}" text-anchor="start">${esc(s.taskShort||'fixed guarantee — resource line only')}</text>`}
    else if(!tiny)svg+=`<text data-axis="x" x="${left+pw/2}" y="${h-9}" text-anchor="middle">${esc(chartLabel(c.m.measure,pw))}</text>`;
    if(!rs.length&&full)svg+=`<text x="${left+pw/2}" y="${cy+4}" text-anchor="middle">No placeable bound yet</text>`;
    return svg+'</svg>';
  }
  function evidencePlot(c,w,h,s){
    const rs=visibleResults(s),upper=rs.filter(r=>r.kind==='upper').length,lower=rs.filter(r=>r.kind==='lower').length,level=chartDetail(w,h),full=level==='detail',tiny=level==='overview';
    const title=rs.length?`${rs.length} results · formulas below`:'Not reviewed yet',mid=w/2,pad=Math.min(10,w*.1,h*.1);
    let svg=`<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(c.p.name+' in '+c.m.name+'. '+title+'. Evidence is not placed on numeric axes.')}" xmlns="http://www.w3.org/2000/svg"><rect x="${pad}" y="${pad}" width="${Math.max(0,w-2*pad)}" height="${Math.max(0,h-2*pad)}" rx="4" fill="var(--unknown)"/>`;
    if(tiny){
      const kinds=[...(upper?['upper']:[]),...(lower?['lower']:[])],step=Math.min(22,w*.2),cy=h/2,r=Math.min(3.5,w*.045,h*.07);
      kinds.forEach((kind,i)=>{const px=mid+(i-(kinds.length-1)/2)*step;svg+=kind==='upper'?`<circle cx="${px}" cy="${cy}" r="${r}" fill="var(--green)"/>`:`<path d="M${px} ${cy-r}l${r} ${r}l${-r} ${r}l${-r} ${-r}Z" fill="var(--red)"/>`});
    }else if(full){
      svg+=`<text x="${mid}" y="${h*.23}" text-anchor="middle">${esc(title)}</text>`;
      if(rs.length)svg+=`<circle cx="33" cy="${h*.43-4}" r="4" fill="var(--green)"/><text x="45" y="${h*.43}">${upper} algorithm bounds</text><path d="M33 ${h*.64-9}l5 5l-5 5l-5-5Z" fill="var(--red)"/><text x="45" y="${h*.64}">${lower} ${lower===1?'lower bound':'lower bounds'}</text><text x="${mid}" y="${h*.81}" text-anchor="middle">No shared numeric coordinates</text><text x="${mid}" y="${h*.89}" text-anchor="middle">See the evidence table</text>`;
    }else{
      svg+=`<text x="${mid}" y="${h*.3}" text-anchor="middle">${rs.length?'Symbolic bounds':'No scoped result'}</text>`;
      if(upper)svg+=`<circle cx="${mid-44}" cy="${h*.51-4}" r="3.5" fill="var(--green)"/><text x="${mid-32}" y="${h*.51}">Algorithms</text>`;
      if(lower)svg+=`<path d="M${mid-44} ${h*.71-8}l4 4l-4 4l-4-4Z" fill="var(--red)"/><text x="${mid-32}" y="${h*.71}">Lower bounds</text>`;
    }
    return svg+'</svg>';
  }
  function plot(c,w,h){
    const s=selectedSlice(c),level=chartDetail(w,h);
    if(!s)return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(c.p.name+' in '+c.m.name+'. No researched setting entered yet.')}" xmlns="http://www.w3.org/2000/svg"><rect x="12" y="12" width="${Math.max(0,w-24)}" height="${Math.max(0,h-24)}" fill="var(--unknown)"/>${level==='overview'?'':`<text x="${w/2}" y="${h/2}" text-anchor="middle" fill="var(--muted)" font-size="12">Not reviewed yet</text>`}</svg>`;
    const curated=curatedKey(s);if(curated)return globalThis.AtlasFocus.summarySVG(curated,w,h,{publication:state.cutoff,level});
    const coordinates=plotted(s).some(r=>s.mode==='1d'?Number.isFinite(r.plot.v):Number.isFinite(r.plot.x)&&Number.isFinite(r.plot.y));
    if(!coordinates)return evidencePlot(c,w,h,s);
    if(s.mode==='1d')return plot1d(c,w,h,s);
    const axisX=s?.xAxis||{label:c.p.axisLabel||'Guarantee',kind:'symbolic'},axisY=s?.yAxis||{label:c.m.measure,kind:'symbolic'};
    const numeric=[axisX,axisY].every(a=>Number.isFinite(a.min)&&Number.isFinite(a.max)&&a.min<a.max);
    if(!numeric)return evidencePlot(c,w,h,s);
    const {left,right,top,bottom}=chartGeometry(w,h),full=level==='detail',tiny=level==='overview',large=full&&w>=480,pw=Math.max(8,w-left-right),ph=Math.max(8,h-top-bottom);
    const x=v=>left+(v-axisX.min)/(axisX.max-axisX.min)*pw,y=v=>top+ph-(v-axisY.min)/(axisY.max-axisY.min)*ph;
    const uid='chart-'+c.p.id+'-'+c.m.id+'-'+(++plotSerial);
    const results=plotted(s);const projectable=numeric?results.filter(r=>Number.isFinite(r.plot.x)&&Number.isFinite(r.plot.y)):[];
    const xTicks=numeric?axisTicks(axisX,5):[],yTicks=numeric?axisTicks(axisY,5):[];
    let svg=`<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(c.p.name+' in '+c.m.name+'. '+axisX.label+' versus '+axisY.label+'. '+results.length+' plotted results. Green is achievable, red is a lower-bound barrier, and gray is open or incomparable.')}" xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="${uid}-clip"><rect x="${left}" y="${top}" width="${pw}" height="${ph}"/></clipPath><pattern id="${uid}-hatch" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 8 L8 0" stroke="var(--red)" stroke-width=".8" opacity=".42"/></pattern></defs><rect data-chart-frame="" x="${left}" y="${top}" width="${pw}" height="${ph}" fill="var(--unknown)"/><g clip-path="url(#${uid}-clip)">`;
    for(const r of projectable){const b=r.plot;if(b.closure==='upper-right'&&r.kind==='upper')svg+=`<rect x="${x(b.x)}" y="${y(axisY.max)}" width="${x(axisX.max)-x(b.x)}" height="${y(b.y)-y(axisY.max)}" fill="var(--green-fill)"/>`;if(b.closure==='lower-left'&&r.kind==='lower'){const rx=Math.max(0,x(b.x)-x(axisX.min)-(b.strictX?1:0)),rh=Math.max(0,y(axisY.min)-y(b.y)-(b.strictY?1:0)),a=`x="${x(axisX.min)}" y="${y(b.y)+(b.strictY?1:0)}" width="${rx}" height="${rh}"`;svg+=`<rect ${a} fill="var(--red-fill)"/><rect ${a} fill="url(#${uid}-hatch)"/>`;if(rh<2&&rx>2)svg+=`<path d="M${x(axisX.min)} ${y(b.y)} H${x(b.x)}" stroke="var(--red)" stroke-width="3"/>`}}
    const frontier=s?.frontier;
    if(numeric&&frontier?.upperSteps?.length>1){const pts=frontier.upperSteps.map(p=>`${x(p.x)},${y(p.y)}`).join(' ');const first=frontier.upperSteps[0];const area=[...frontier.upperSteps,{x:axisX.max,y:axisY.max},{x:first.x,y:axisY.max}].map(p=>`${x(p.x)},${y(p.y)}`).join(' ');svg+=`<polygon points="${area}" fill="var(--green-fill)" opacity=".7"/><polyline points="${pts}" fill="none" stroke="var(--green)" stroke-width="${full?4:2}" stroke-linejoin="round"/>`}
    if(numeric&&frontier?.lowerBoundary?.length>1){const pts=frontier.lowerBoundary.map(p=>`${x(p.x)},${y(p.y)}`).join(' ');svg+=`<polyline points="${pts}" fill="none" stroke="var(--red)" stroke-width="${full?4:2}" stroke-dasharray="7 5"/>`;const p=frontier.lowerBoundary[Math.floor(frontier.lowerBoundary.length/2)];if(full)svg+=`<text x="${x(p.x)+10}" y="${y(p.y)}" fill="var(--red)" text-anchor="start">conditional lower-bound wall</text>`}
    if(numeric&&full){for(const v of yTicks)svg+=`<path d="M${left} ${y(v)} H${w-right}" stroke="var(--line)" stroke-width="1"/>`;for(const v of xTicks)svg+=`<path d="M${x(v)} ${top} V${h-bottom}" stroke="var(--line)" stroke-width="1"/>`}
    svg+='</g>';
    svg+=`<path d="M${left} ${top} V${h-bottom} H${w-right}" fill="none" stroke="var(--muted)" stroke-width="1"/>`;
    if(numeric){for(const r of projectable){const b=r.plot,px=clamp(x(b.x),left+3,w-right-3),py=clamp(y(b.y),top+3,h-bottom-3),radius=tiny?3:full?5:4;svg+=resultGroup(s,r,full);svg+=r.kind==='lower'?`<path d="M${px} ${py-radius} L${px+radius} ${py} L${px} ${py+radius} L${px-radius} ${py} Z" fill="${b.strictX||b.strictY?'var(--surface)':'var(--red)'}" stroke="var(--red)"/>`:`<circle cx="${px}" cy="${py}" r="${full?5:2.5}" fill="var(--green)"/>`;svg+='</g>';if(full&&b.label){const rightSide=b.x>axisX.min+(axisX.max-axisX.min)*.72,tx=rightSide?px-9:px+9,ta=rightSide?'end':'start',ty=py<top+24?py+16:py-9;svg+=`<text x="${tx}" y="${ty}" text-anchor="${ta}" class="plot-label">${esc(b.label)}</text>`}}
      if(full){xTicks.forEach((v,i)=>{const isEdge=i===0||i===xTicks.length-1;svg+=`<text x="${x(v)}" y="${h-bottom+19}" text-anchor="${isEdge?(i===0?'start':'end'):'middle'}">${esc(tickText(axisX,v,i))}</text>`});yTicks.forEach((v,i)=>{svg+=`<text x="${left-9}" y="${y(v)+4}" text-anchor="end">${esc(tickText(axisY,v,i))}</text>`})}
    }
    if(full){svg+=`<text data-axis="x" x="${left+pw/2}" y="${h-10}" text-anchor="middle">${esc(axisX.label)}</text><text data-axis="y" transform="translate(17 ${top+ph/2}) rotate(-90)" text-anchor="middle">${esc(axisY.label)}</text>`;if(large)svg+=`<text x="${left}" y="25">${esc(c.p.short+' / '+c.m.name)}</text>`}
    else if(!tiny){svg+=`<text data-axis="x" x="${left+pw/2}" y="${h-10}" text-anchor="middle">${esc(chartLabel(c.p.axisShort||'quality',pw))}</text><text data-axis="y" transform="translate(15 ${top+ph/2}) rotate(-90)" text-anchor="middle">${esc(chartLabel(c.m.measure,ph))}</text>`}
    return svg+'</svg>';
  }
  function resultGroup(s,r,interactive){return '<g data-paper-result="'+esc('research:'+s.problem+':'+r.id)+'"'+(interactive?' role="button" tabindex="0" aria-label="Paper and theorem: '+esc(r.bound)+'"':'')+'>'}
  function formatNumber(v){return String(Math.round(v*100)/100)}
  function setLocation(c){document.getElementById('location').textContent=c?`${c.p.name} × ${c.m.name}`:'Problem × model'}
  function constrain(a){a.k=clamp(a.k,base,Math.max(3.5,base*9));const sw=WORLD.w*a.k,sh=WORLD.h*a.k;a.x=sw<W?(W-sw)/2:clamp(a.x,W-sw-24,24);a.y=sh<H?(H-sh)/2:clamp(a.y,H-sh-24,24);return a}
  function contextOpacity(selected,zoom){return selected||!state.selected?1:1-.92*clamp((zoom-1.15)/1.7,0,1)}
  function render(){for(const c of cells){const x=camera.x+c.x*camera.k,y=camera.y+c.y*camera.k,w=L.cw*camera.k,h=L.ch*camera.k;c.screen={x,y,w,h};const visible=x<W&&y<H&&x+w>0&&y+h>0;c.el.hidden=!visible;if(!visible)continue;Object.assign(c.el.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px',opacity:contextOpacity(state.selected===c.id,camera.k/base)});c.el.classList.toggle('selected',state.selected===c.id);const count=cellResults(c).length;c.button.setAttribute('aria-pressed',String(state.selected===c.id));c.button.setAttribute('aria-label',`Zoom into ${c.p.name}, ${c.m.name}: ${count} results across ${allSlices(c).length} settings`);c.el.dataset.chartLevel=chartDetail(w,h);c.plot.innerHTML=plot(c,w,h)}for(const l of labels){const x=camera.x+l.x*camera.k,y=camera.y+l.y*camera.k,w=l.w*camera.k,h=l.h*camera.k;l.el.hidden=x+w<0||x>W||y+h<0||y>H;Object.assign(l.el.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px'});const name=l.el.querySelector('.axis-name');if(name)name.textContent=w<180?l.short:l.name;const sm=l.el.querySelector('small');if(sm)sm.hidden=w<180||h<55}document.getElementById('zoom-value').textContent=(camera.k/base).toFixed(1)+'×';document.getElementById('zoom-out').disabled=camera.k<=base*1.001;updateDetail()}
  function move(target,animate=true){cancelAnimationFrame(raf);constrain(target);if(!animate||reduce){Object.assign(camera,target);render();return}const start={...camera},t0=performance.now();const tick=t=>{const u=Math.min(1,(t-t0)/420),v=1-(1-u)**3;camera.x=start.x+(target.x-start.x)*v;camera.y=start.y+(target.y-start.y)*v;camera.k=start.k+(target.k-start.k)*v;render();if(u<1)raf=requestAnimationFrame(tick)};raf=requestAnimationFrame(tick)}
  function focus(c,sliceId=null,scroll=true,preserveDetail=false){if(!c)return;const sameSelection=state.selected===c.id&&state.selectedSlice===sliceId;state.selected=c.id;state.selectedSlice=sliceId;if(!preserveDetail||!sameSelection)detailKey='';const k=Math.min((W-32)/L.cw,(H-32)/L.ch);move({k,x:W/2-(c.x+L.cw/2)*k,y:H/2-(c.y+L.ch/2)*k});setLocation(c);document.getElementById('live').textContent=`Exploring ${c.p.name} in ${c.m.name}: ${cellResults(c).length} results across ${allSlices(c).length} settings.`;if(scroll)setTimeout(()=>{if(state.selected===c.id)scrollToSelectedChart()},reduce?0:470)}
  function fit(){state.selected=null;state.selectedSlice=null;detailKey='';move({k:base,x:W<650?8:(W-WORLD.w*base)/2,y:(H-WORLD.h*base)/2});setLocation(null);document.getElementById('live').textContent='Select a plot to examine results.'}
  function zoom(factor,px=W/2,py=H/2,animate=true){const k=clamp(camera.k*factor,base,Math.max(3.5,base*9));const target={k,x:px-(px-camera.x)*k/camera.k,y:py-(py-camera.y)*k/camera.k};if(k<base*1.12){state.selected=null;state.selectedSlice=null;setLocation(null)}move(target,animate)}
  function at(x,y){return cells.find(c=>c.screen&&x>=c.screen.x&&x<=c.screen.x+c.screen.w&&y>=c.screen.y&&y<=c.screen.y+c.screen.h)}
  function maybeSelectCenter(){if(camera.k<=base*1.25)return;const c=at(W/2,H/2);if(c&&c.id!==state.selected){state.selected=c.id;state.selectedSlice=null;detailKey='';setLocation(c);updateDetail()}}
  function sourceRow(s,r){
    const paper=papers.get(s.problem+':'+r.paperId),kind=r.kind==='upper'?'upper':'lower';
    const status=({current_best_verified:'Reported frontier',candidate:'Candidate',baseline:'Baseline',historical:'Historical'})[r.frontierStatus]||r.frontierStatus;
    const checked=({verified:'Full text checked',abstract_verified:'Abstract checked',needs_full_text:'Full text review pending'})[r.evidenceStatus]||r.evidenceStatus;
    const coord=curatedKey(s)?'See enlarged figure':r.plot?(s.mode==='1d'?`${s.axis?.kind==='exponent'?'exponent ':''}${formatNumber(r.plot.v)}${s.axis?.tickLabels?.includes(tickText(s.axis,r.plot.v,axisTicks(s.axis).indexOf(r.plot.v)))?` (${tickText(s.axis,r.plot.v,axisTicks(s.axis).indexOf(r.plot.v))})`:''}`:`${s.xAxis?.kind==='palette'?'palette':'quality'} ${formatNumber(r.plot.x)}; ${s.yAxis?.kind==='ordinal'?'round tier':s.yAxis?.kind==='exponent'?'resource exponent':'resource'} ${formatNumber(r.plot.y)}`):'Formula only';
    return `<tr class="result-row ${kind}"><td><span class="tag ${kind}">${kind==='upper'?'Algorithm':'Lower bound'}</span><small>${esc(coord)}</small></td><td>${esc(r.guarantee)}</td><td><strong>${esc(r.bound)}</strong>${r.notes?`<small>${esc(r.notes)}</small>`:''}</td><td>${paper?link(paper.url,paper.title):esc(r.paperId)}<small>${esc(paper?.authors?.join(', ')||'')} · ${esc(paper?.venue||'')} ${esc(paper?.year||'')} · ${esc(paper?.publicationStatus||'')} · ${esc(status)} · ${esc(checked)} · ${esc(r.sourceLocation||'')}</small></td></tr>`
  }
  function axisSummary(s){const curated=s?.skippedInCuratedView?null:curatedKey(s);if(curated)return globalThis.AtlasFocus.axisSummary?.(curated)||`Guaranteed fraction β = |M| / OPT; ${curated==='one'?'one pass':'two passes'} and O(n polylog n) bits fixed`;const a=s?.mode==='1d'?s.axis:s?.yAxis,b=s?.mode==='1d'?null:s?.xAxis;const describe=x=>x?`${x.label}${Number.isFinite(x.min)&&Number.isFinite(x.max)?` [${tickText(x,x.min,0)} … ${tickText(x,x.max,axisTicks(x).length-1)}]`:''}`:'Unspecified';return b?`${describe(b)} · ${describe(a)}`:describe(a)}
  function accessPanel(c,s){const a=c.m.access||{};return `<dl class="access-grid"><div><dt>Access</dt><dd>${esc(a.interface||c.m.name)}</dd></div><div><dt>Operations</dt><dd>${esc(a.operations||c.m.settings)}</dd></div><div><dt>Output</dt><dd>${esc(s?.task||c.p.quality)}</dd></div><div><dt>Measured axes</dt><dd>${esc(axisSummary(s))}</dd></div></dl>`}
  function relationHTML(){const e=relations.find(x=>x.id===state.relation);return e?`<h3>${esc(e.formula)}</h3><p>${esc(e.detail)}</p><p class="subtle">${esc(e.overhead)}</p>${link(e.url,e.source)}`:''}
  function plotKey(s){const rs=plotted(s),notes=[s?.parameters?.coordinateConvention,s?.parameters?.openGap].filter(Boolean);const cards=rs.length?`<div class="plot-key">${rs.map(r=>`<div class="plot-key-row"><span class="plot-marker ${r.kind}">${r.kind==='upper'?'●':'◆'}</span><div><strong>${r.kind==='upper'?'Algorithm':'Lower bound'}</strong><span>${esc(r.bound)}</span><small>${esc(r.guarantee)}</small></div></div>`).join('')}</div>`:'<p class="small">No result has compatible coordinates for this chart yet. The complete symbolic records are listed below.</p>';return cards+(notes.length?`<div class="plot-key-note">${notes.map(n=>`<p>${esc(n)}</p>`).join('')}</div>`:'')}
  function updateDetail(){
    const c=selectedCell(),show=c&&camera.k/base>=2.75&&c.screen.w>=Math.min(420,W-32);detail.hidden=!show;
    const routeSlice=c?selectedSlice(c)?.id||null:null;
    if(updateDetail.routeSlice!==routeSlice){updateDetail.routeSlice=routeSlice;globalThis.dispatchEvent?.(new CustomEvent('atlas:selection',{detail:{sliceId:routeSlice}}))}
    if(app.classList)app.classList.toggle('has-spotlight',!!show);
    if(!show){detailKey='';disposeDetail();return}
    const slices=allSlices(c),s=selectedSlice(c),rec=researchByProblem.get(c.p.id),curated=curatedKey(s);
    const key=c.id+':'+(s?.id||'')+':'+state.cutoff+':'+(curated||'');if(key===detailKey)return;detailKey=key;disposeDetail();
    const es=relations.filter(e=>e.from===c.p.id||e.to===c.p.id);
    if(!es.some(e=>e.id===state.relation))state.relation=es[0]?.id||null;
    const total=cellResults(c).length,unique=new Set(cellResults(c).map(({r})=>r.paperId)).size,coverage=rec?.coverage.find(v=>v.model===c.m.id);
    detail.innerHTML=`<div class="detail-head"><div><h2>${esc(c.p.name)} × ${esc(c.m.name)}</h2><p class="cell-total">${total} results · ${unique} papers · ${slices.length} comparable settings</p>${!curated&&coverage?.note?`<p class="coverage-note">${esc(coverage.note)}</p>`:''}</div><button type="button" id="detail-overview">← All problem–model pairs</button></div>
      ${chartScopeHTML(c,s,slices,curated)}
      <details class="definitions"><summary>Definitions & relationships</summary><div class="definition-grid"><div><h3>${esc(c.p.name)}</h3><p>${esc(c.p.definition)}</p><p class="small">${esc(c.p.quality)}</p><p class="small">${esc(c.p.variants)}</p></div><div><h3>${esc(c.m.name)}</h3><p>${esc(c.m.definition)}</p><p class="small">${esc(c.m.settings)}</p></div></div><div class="related">${es.map(e=>`<button type="button" data-relation="${esc(e.id)}" aria-pressed="${e.id===state.relation}">${esc(e.label)}</button>`).join('')}</div><div id="relationship" class="relationship">${relationHTML()}</div></details>
      <div class="bibliography"><div class="bibliography-head"><div><h3>Research in this cell</h3><p>Every setting is listed below. Click a setting heading to show its comparable chart above.</p></div><output id="filtered-count"></output></div><div class="filters"><label>Find within this cell <input id="local-query" type="search" autocomplete="off" placeholder="Title, author, bound, assumption…" value="${esc(state.query)}"></label><label>Result type <select id="kind-select"><option value="all" ${state.kind==='all'?'selected':''}>Algorithms and lower bounds</option><option value="upper" ${state.kind==='upper'?'selected':''}>Algorithms</option><option value="lower" ${state.kind==='lower'?'selected':''}>Lower bounds</option></select></label><label>Publication <select id="cutoff-select"><option value="all" ${state.cutoff==='all'?'selected':''}>Published and preprints</option><option value="published" ${state.cutoff==='published'?'selected':''}>Published only</option></select></label></div><div id="results-list"></div>${rec?.searchSummary?`<p class="small research-scope">Research scope: ${esc(rec.searchSummary)}</p>`:''}</div>`;
    const chart=detail.querySelector('#detail-chart');if(chart){mountDetailChart(c,s,chart);globalThis.AtlasFigureFirst?.mount(chart,c.p.id,c.m.id)}
    updateResultList();
  }
  function updateResultList(){
    const c=selectedCell(),out=detail.querySelector('#results-list');if(!c||!out)return;
    const tokens=state.query.toLowerCase().trim().split(/\s+/).filter(Boolean),slices=allSlices(c);
    let shown=0;const refs=new Set();
    const blocks=slices.filter(s=>!s.skippedInCuratedView).map(s=>{
      const filtered=visibleResults(s).filter(r=>{
        if(state.kind!=='all'&&r.kind!==state.kind)return false;
        const p=papers.get(s.problem+':'+r.paperId);
        const hay=[s.label,s.task,...(s.assumptions||[]),p?.title,p?.authors?.join(' '),p?.venue,r.bound,r.guarantee,r.notes,r.sourceLocation].join(' ').toLowerCase();
        return tokens.every(t=>hay.includes(t));
      }).sort((a,b)=>{
        const order={current_best_verified:0,candidate:1,baseline:2,historical:3};
        return (order[a.frontierStatus]??4)-(order[b.frontierStatus]??4)||(papers.get(s.problem+':'+b.paperId)?.year||0)-(papers.get(s.problem+':'+a.paperId)?.year||0);
      });
      shown+=filtered.length;for(const r of filtered)refs.add(r.paperId);
      return `<section class="setting-group" id="setting-${esc(s.id)}"><div class="setting-heading"><button type="button" data-slice="${esc(s.id)}" aria-current="${s.id===selectedSlice(c)?.id?'true':'false'}">${esc(s.label)} <span>↗ chart</span></button><strong>${filtered.length} ${filtered.length===1?'result':'results'}</strong></div><p class="setting-task">${esc(s.task)}</p><p class="setting-assumptions">${(s.assumptions||[]).map(esc).join(' · ')}</p><p class="setting-access"><strong>Interface:</strong> ${esc(modelById.get(s.model)?.access?.interface||s.model)} · <strong>Access:</strong> ${esc(modelById.get(s.model)?.access?.operations||'See assumptions')} · <strong>Axes:</strong> ${esc(axisSummary(s))}</p>${filtered.length?`<div class="results-scroll"><table class="results-table"><caption>${esc(s.label)}: ${filtered.length} scoped results</caption><thead><tr><th scope="col">Evidence</th><th scope="col">Quality / output</th><th scope="col">Resource bound</th><th scope="col">Primary paper and theorem</th></tr></thead><tbody>${filtered.map(r=>sourceRow(s,r)).join('')}</tbody></table></div>`:'<p class="empty-setting">No result matches the current filters in this setting.</p>'}</section>`;
    });
    out.innerHTML=blocks.join('');
    detail.querySelector('#filtered-count').textContent=`${shown} results · ${refs.size} papers`;
  }
  function inspectEvent(c,event,svg){
    const matrix=svg?.getScreenCTM();if(!matrix)return;
    const point=svg.createSVGPoint();point.x=event.clientX;point.y=event.clientY;
    const local=point.matrixTransform(matrix.inverse()),box=svg.viewBox.baseVal;
    inspect({...c,screen:{x:box.x,y:box.y,w:box.width,h:box.height}},local.x,local.y);
  }
  function contains1d(r,value){
    const b=r.plot;if(!b||!Number.isFinite(b.v))return false;
    if(b.closure==='point')return Math.abs(value-b.v)<1e-9;
    if(b.closure==='right')return b.strict?value>b.v:value>=b.v;
    if(b.closure==='left')return b.strict?value<b.v:value<=b.v;
    return false;
  }
  function inspect(c,px,py){const out=document.getElementById('inspect');if(!out)return;const s=selectedSlice(c);
    if(!plotted(s).length){out.textContent='These results remain as formulas. Read their assumptions and bounds in the evidence table; no numeric region is classified.';return}
    if(s?.mode==='1d'){const a=s.axis||{};if(!(Number.isFinite(a.min)&&Number.isFinite(a.max))){out.textContent='This setting has symbolic resource bounds; the full records are listed below.';return}
      const w=c.screen.w,{left,right}=chartGeometry(w,c.screen.h),xx=px-c.screen.x;if(xx<left||xx>w-right)return;
      const V=a.min+(xx-left)/(w-left-right)*(a.max-a.min),rs=plotted(s).filter(r=>Number.isFinite(r.plot?.v));
      const up=rs.filter(r=>r.kind==='upper'&&contains1d(r,V)),lo=rs.filter(r=>r.kind==='lower'&&contains1d(r,V));
      out.textContent=`${a.label} ≈ ${formatNumber(V)}: ${up.length?`achievable (${up.sort((p,q)=>q.plot.v-p.plot.v)[0].bound})`:lo.length?`ruled out (${lo.sort((p,q)=>p.plot.v-q.plot.v)[0].bound})`:'open in this collection'}.`;return}
    const numeric=s&&[s.xAxis,s.yAxis].every(a=>Number.isFinite(a?.min)&&Number.isFinite(a?.max)&&a.min<a.max);if(!numeric){out.textContent='This setting has symbolic resource bounds; the full assumptions and source records are listed below.';return}const w=c.screen.w,h=c.screen.h,{left,right,top,bottom}=chartGeometry(w,h),xx=px-c.screen.x,yy=py-c.screen.y;if(xx<left||xx>w-right||yy<top||yy>h-bottom)return;const X=s.xAxis.min+(xx-left)/(w-left-right)*(s.xAxis.max-s.xAxis.min),Y=s.yAxis.max-(yy-top)/(h-top-bottom)*(s.yAxis.max-s.yAxis.min);
    const rs=plotted(s).filter(r=>{const b=r.plot;if(!b)return false;if(b.closure==='upper-right')return(b.strictX?X>b.x:X>=b.x)&&(b.strictY?Y>b.y:Y>=b.y);if(b.closure==='lower-left')return(b.strictX?X<b.x:X<=b.x)&&(b.strictY?Y<b.y:Y<=b.y);return Math.hypot((X-b.x)/(s.xAxis.max-s.xAxis.min),(Y-b.y)/(s.yAxis.max-s.yAxis.min))<.045});const upper=rs.filter(r=>r.kind==='upper'),lower=rs.filter(r=>r.kind==='lower');out.textContent=`${s.xAxis.label} ≈ ${X.toFixed(3)}; ${s.yAxis.label} ≈ ${Y.toFixed(2)}: ${upper.length?`achievable (${upper[0].bound})`:lower.length?`ruled out (${lower[0].bound})`:'unclassified in this collection'}.`;
  }
  const searchIndex=data.research.flatMap(rec=>rec.slices.filter(s=>modelById.has(s.model)).flatMap(s=>s.results.map(r=>({rec,s,r,p:papers.get(rec.problem+':'+r.paperId)}))));
  function searchAtlas(){const q=document.getElementById('global-query').value.toLowerCase().trim(),out=document.getElementById('global-results');if(q.length<2){out.hidden=true;out.innerHTML='';return}const terms=q.split(/\s+/).filter(Boolean);const found=searchIndex.filter(({rec,s,r,p})=>terms.every(t=>[problemById.get(rec.problem)?.name,modelById.get(s.model)?.name,s.label,s.task,...(s.assumptions||[]),p?.title,p?.authors?.join(' '),p?.venue,r.bound,r.guarantee,r.notes,r.sourceLocation].join(' ').toLowerCase().includes(t)));const top=found.slice(0,50);out.hidden=false;out.innerHTML=`<div class="search-head"><strong>${found.length} matching results</strong><span>${found.length>50?'Showing first 50 · refine your search':'Click a result to zoom into its setting'}</span></div>${top.map(({rec,s,r,p})=>`<button type="button" class="search-hit" data-search-cell="${esc(rec.problem+':'+s.model)}" data-search-slice="${esc(s.id)}"><strong>${esc(p?.title||r.paperId)}</strong><span>${esc(problemById.get(rec.problem)?.name)} × ${esc(modelById.get(s.model)?.name)} · ${esc(s.label)} · ${esc(p?.year||'')}</span><small>${esc(r.bound)}</small></button>`).join('')||'<p class="small">Try an author, model, paper title, or theorem bound.</p>'}`}
  app.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.id==='overview'||b.id==='detail-overview'){fit();if(b.id==='detail-overview')stage.scrollIntoView({block:'start',behavior:'smooth'});return}if(b.id==='zoom-in'){if(camera.k<base*1.1){focus(cells.find(c=>c.id==='matching:stream'));return}zoom(1.45);maybeSelectCenter();return}if(b.id==='zoom-out'){zoom(1/1.5);return}if(b.dataset.searchCell){const c=cells.find(x=>x.id===b.dataset.searchCell);document.getElementById('global-query').value='';document.getElementById('global-results').hidden=true;focus(c,b.dataset.searchSlice);return}if(b.dataset.slice){state.selectedSlice=b.dataset.slice;detailKey='';render();scrollToSelectedChart();return}if(b.dataset.relation){state.relation=b.dataset.relation;detail.querySelectorAll('[data-relation]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.relation===state.relation)));document.getElementById('relationship').innerHTML=relationHTML();return}if(b.dataset.cell){if(performance.now()<suppressClickUntil)return;const c=cells.find(x=>x.id===b.dataset.cell);if(c.id===state.selected&&camera.k/base>=1.75){if(curatedKey(selectedSlice(c)))scrollToSelectedChart();else inspectEvent(c,e,c.plot.querySelector('svg'))}else focus(c)}});
  app.addEventListener('input',e=>{if(e.target.id==='global-query')searchAtlas();if(e.target.id==='local-query'){state.query=e.target.value;updateResultList()}});
  window.addEventListener('atlas:open-setting',e=>{const sid=e.detail?.sliceId,c=cells.find(c=>allSlices(c).some(s=>s.id===sid));if(c)focus(c,sid)});
  window.addEventListener('atlas:overview',()=>fit());
  app.addEventListener('change',e=>{if(e.target.id==='cutoff-select'){state.cutoff=e.target.value;detailKey='';render()}if(e.target.id==='kind-select'){state.kind=e.target.value;updateResultList()}if(e.target.id==='slice-select'){state.selectedSlice=e.target.value;detailKey='';render()}});
  app.addEventListener('focusin',e=>{const b=e.target.closest('[data-cell]');if(!b)return;const c=cells.find(x=>x.id===b.dataset.cell),r=c.screen;if(r.x<0||r.y<0||r.x+r.w>W||r.y+r.h>H)focus(c)});
  stage.addEventListener('wheel',e=>{e.preventDefault();const r=stage.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,c=at(x,y);if(c&&e.deltaY<0){state.selected=c.id;state.selectedSlice=null;setLocation(c)}zoom(Math.exp(-clamp(e.deltaY*(e.deltaMode===1?16:1),-180,180)*.0035),x,y,false);maybeSelectCenter()},{passive:false});
  detail.addEventListener('wheel',e=>{if(!e.ctrlKey)return;e.preventDefault();zoom(Math.exp(-clamp(e.deltaY,-180,180)*.0035),W/2,H/2,false)},{passive:false});
  const pointers=new Map();let gesture=null;
  stage.addEventListener('pointerdown',e=>{if(e.button!==0)return;cancelAnimationFrame(raf);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1)gesture={startX:e.clientX,startY:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:false};if(pointers.size===2){const [a,b]=[...pointers.values()];gesture={pinch:Math.hypot(a.x-b.x,a.y-b.y),moved:true};stage.setPointerCapture(e.pointerId)}});
  stage.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId)||!gesture)return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2){const [a,b]=[...pointers.values()],distance=Math.hypot(a.x-b.x,a.y-b.y),r=stage.getBoundingClientRect();zoom(distance/Math.max(1,gesture.pinch),(a.x+b.x)/2-r.left,(a.y+b.y)/2-r.top,false);gesture.pinch=distance;gesture.moved=true;maybeSelectCenter();return}const dx=e.clientX-gesture.lastX,dy=e.clientY-gesture.lastY;if(Math.hypot(e.clientX-gesture.startX,e.clientY-gesture.startY)>5){gesture.moved=true;stage.classList.add('dragging');if(!stage.hasPointerCapture(e.pointerId))stage.setPointerCapture(e.pointerId);move({x:camera.x+dx,y:camera.y+dy,k:camera.k},false);maybeSelectCenter()}gesture.lastX=e.clientX;gesture.lastY=e.clientY});
  function end(e){if(gesture?.moved)suppressClickUntil=performance.now()+160;pointers.delete(e.pointerId);if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);if(pointers.size===1){const pt=[...pointers.values()][0];gesture={startX:pt.x,startY:pt.y,lastX:pt.x,lastY:pt.y,moved:true}}else gesture=null;stage.classList.remove('dragging')}
  stage.addEventListener('pointerup',end);stage.addEventListener('pointercancel',end);
  stage.addEventListener('keydown',e=>{const b=e.target.closest('[data-cell]');if(!b)return;const c=cells.find(x=>x.id===b.dataset.cell),dirs={ArrowRight:[0,1],ArrowLeft:[0,-1],ArrowDown:[1,0],ArrowUp:[-1,0]};if(dirs[e.key]){e.preventDefault();const [dr,dc]=dirs[e.key],n=cells.find(x=>x.r===clamp(c.r+dr,0,data.problems.length-1)&&x.col===clamp(c.col+dc,0,data.models.length-1));focus(n);setTimeout(()=>n.button.focus({preventScroll:true}),reduce?0:430)}if(e.key==='Escape'){e.preventDefault();fit()}});
  app.addEventListener('keydown',e=>{if(e.key==='Escape'&&!e.target.closest('select'))fit()});
  function resize(){if(!stage.clientWidth)return;cancelAnimationFrame(raf);W=stage.clientWidth;H=W<650?450:Math.min(580,Math.max(490,W*.52));stage.style.height=H+'px';base=Math.max(W<650?.28:0,Math.min((W-20)/WORLD.w,(H-18)/WORLD.h));if(!state.selected){camera.k=base;camera.x=W<650?8:(W-WORLD.w*base)/2;camera.y=(H-WORLD.h*base)/2;render()}else focus(selectedCell(),state.selectedSlice,false,true)}
  const counts={papers:new Set(searchIndex.map(x=>x.rec.problem+':'+x.r.paperId)).size,results:searchIndex.length};
  document.getElementById('coverage').textContent=`${counts.papers} papers · ${counts.results} scoped bounds · reviewed through ${data.reviewedThrough}`;
  document.getElementById('global-hint').textContent=`${counts.papers} papers · ${counts.results} results`;
  new ResizeObserver(()=>{if(Math.abs(stage.clientWidth-W)>.5||!cells[0].screen)resize()}).observe(stage);resize();
})();
