(()=>{
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const talks={
 matching:['Matching: keep the picture fixed as the algorithm changes','Mitrović–Sheu · SPAA 2025 slides, pp. 35–37','https://whsheu.github.io/slides/MS25_slides_long.pdf#page=35'],
 weighted_matching:['Weight and size are different objectives','Mitrović–Sheu · separate parameter costs, slide 12','https://whsheu.github.io/slides/MS25_slides_long.pdf#page=12'],
 mis:['One graph, two meanings of independent set','Medina · ADGA 2017, slides 30–39','https://adga-workshop.org/2017/medina.pdf#page=30'],
 cc:['Count disagreements on the graph','Wirth–Veldt · correlation clustering, slides 4 and 12','https://users.monash.edu/~gfarr/research/slides/Wirth-cc-awirth-2018-12-03.pdf#page=4'],
 edge:['Adjacent edges need different colors','Blikstad · Online Edge Coloring, slides 50 and 57','https://blikstad.gitlab.io/slides/Deterministic_Online_Bipartite_Edge_Coloring.pdf#page=50'],
 vertex:['Adjacent vertices need different colors','Blikstad · fixed-geometry setup comparisons, slide 50','https://blikstad.gitlab.io/slides/Deterministic_Online_Bipartite_Edge_Coloring.pdf#page=50']
};
const modelText={
 dynamic:['Change → repair → answer','An edge insertion or deletion changes the input. Update time counts repair work; reporting the full answer may cost extra.'],
 stream:['Arrive → remember → pass again','The input is read as a stream. Space measures what is retained; passes count rereading the input.'],
 online:['Arrive → decide → next arrival','The future is hidden. Whether earlier decisions may change is a separate setup, labeled in each panel.'],
 stochastic:['Random input → allowed observations → output','Randomness is part of the input model. Edge survival, noisy labels, random graphs and semirandom inputs are distinct setups.'],
 lca:['One output query → probes → consistent answer','A query asks for part of one global solution. Probe cost counts allowed input accesses, not the size of that global solution.'],
 local:['Local messages → rounds → local outputs','Vertices communicate along graph edges. The plotted cost counts synchronous rounds; a round can contain many operations.'],
 mpc:['Split input → communicate → next round','Machines hold separate pieces of the graph. Round bounds depend on local and total memory.'],
 query_list:['Choose a vertex → inspect neighbors','The exact list oracle is part of the setup. Count graph queries separately from later computation.'],
 query_matrix:['Choose a pair → ask if it is an edge','Each pair query reveals one adjacency entry. Finding a full solution and estimating its size are different outputs.']
};
const line=(a,b,cls='',label='')=>`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" class="vg-edge ${cls}"/>${label?`<text x="${(a[0]+b[0])/2}" y="${(a[1]+b[1])/2-8}" class="vg-weight">${label}</text>`:''}`;
const node=(p,i,fill='var(--surface)',ring=false)=>`${ring?`<circle cx="${p[0]}" cy="${p[1]}" r="23" class="vg-query-ring"/>`:''}<circle cx="${p[0]}" cy="${p[1]}" r="14" fill="${fill}" stroke="var(--muted)"/><text x="${p[0]}" y="${p[1]+4}" class="vg-node-label">${i}</text>`;
function example(problem,model,step){
 let points=[[45,75],[125,75],[205,75],[285,75],[365,75],[445,75]],edges=[[0,1],[1,2],[2,3],[3,4],[4,5]],selected=[],vertices=[],colored=false,caption='',buttons=['Input','Show a solution'],svg='';
 if(problem==='matching'){
  selected=step?[0,2,4]:[];caption=step?'Three disjoint edges form a matching. Its size is 3; on this graph that is optimal.':'A matching selects edges that do not share endpoints. Keep the graph fixed and reveal the selected edges.';
 }else if(problem==='weighted_matching'){
  buttons=['Maximum size','Maximum weight'];selected=step?[1,3]:[0,2,4];caption=step?'Two edges have total weight 18. This beats the three-edge matching of weight 3.':'Three edges give maximum cardinality, but their total weight is only 3.';
 }else if(problem==='mis'&&model==='lca'){
  points=[[60,75],[180,75],[300,75],[420,75]];edges=[[0,1],[1,2],[2,3]];buttons=['Query v₁','Follow lower priorities','Return consistent answers'];
  selected=step?[0,1,2]:[];vertices=step===2?[1,3]:[];
  caption=step===0?'Ask whether v₁ belongs to the greedy MIS. The fixed priorities are 4, 3, 2, 1.':step===1?'Follow smaller-priority neighbors: v₁ → v₂ → v₃ → v₄. These are dependencies, not a radius bound.':'v₄ is in, v₃ is out, v₂ is in, v₁ is out. Reusing the priorities keeps later answers consistent.';
  points.forEach((p,i)=>svg+=`<text x="${p[0]}" y="120" class="vg-weight">priority ${4-i}</text>`);
 }else if(problem==='mis'){
  points=[[240,75],[100,30],[100,125],[380,75]];edges=[[0,1],[0,2],[0,3]];buttons=['Maximal: 1 vertex','Maximum: 3 vertices'];vertices=step?[1,2,3]:[0];
  caption=step?'The three leaves form a maximum independent set. Maximum means largest possible.':'The center alone is maximal: no other vertex can be added. Maximal does not mean maximum.';
 }else if(problem==='cc'&&model==='stochastic'){
  points=[[160,30],[300,30],[230,135]];edges=[[0,1],[1,2],[0,2]];buttons=['Hidden partition','A noisy observation'];
  svg+='<rect x="130" y="3" width="200" height="58" rx="28" class="vg-hull"/>';
  caption=step?'An observed sign can disagree with the hidden partition. Recovery asks for the hidden groups under the stated noise model, not a generic approximation guarantee for arbitrary signs.':'The hidden partition groups A with B and leaves C separate. The figure above measures the resources needed to recover such groups from noisy observations.';
 }else if(problem==='cc'){
  points=[[160,30],[300,30],[230,135]];edges=[[0,1],[1,2],[0,2]];buttons=['One cluster','Split off C','Three clusters'];
  const hull=step===0?'<rect x="124" y="3" width="212" height="155" rx="55" class="vg-hull"/>':step===1?'<rect x="130" y="3" width="200" height="58" rx="28" class="vg-hull"/>':'';svg+=hull;
  caption=step===0?'A and C have a negative edge inside the cluster: 1 disagreement.':step===1?'B and C have a positive edge across clusters: 1 disagreement.':'Both positive edges cross clusters: 2 disagreements. This conflicting triangle cannot have zero cost.';
 }else{
  colored=!!step;caption=problem==='edge'?(step?'Two edge colors suffice for this path. Edges meeting at a vertex have different colors.':'Color the edges. The number of colors is the palette size, not the runtime.'):(step?'Two vertex colors suffice for this path. Every edge joins different colors.':'Color the vertices. This example explains a proper coloring; it is not a general two-color guarantee.');
 }
 const palette=['#b6a1ef','#e4bb75'];
 edges.forEach(([a,b],i)=>{
  let cls=selected.includes(i)?'vg-chosen':'';
  const negative=problem==='cc'&&(model==='stochastic'?i>0&&!(step&&i===1):i===2);
  if(problem==='cc')cls=(negative?'vg-negative ':'')+(model==='stochastic'?(step&&i===1?'vg-disagreement':''):((step===0&&i===2)||(step===1&&i===1)||(step===2&&i<2)?'vg-disagreement':''));
  let e=line(points[a],points[b],cls,problem==='weighted_matching'?[1,9,1,9,1][i]:problem==='cc'?(negative?'−':'+'):'');
  if(problem==='edge'&&colored)e=e.replace('class="vg-edge ',`style="stroke:${palette[i%2]};stroke-width:5" class="vg-edge `);
  svg+=e;
 });
 points.forEach((p,i)=>svg+=node(p,problem==='cc'?'ABC'[i]:i+1,vertices.includes(i)?'var(--green)':problem==='vertex'&&colored?palette[i%2]:'var(--surface)',problem==='mis'&&model==='lca'&&i===(step===1?3:0)));
 return {svg:`<svg viewBox="0 0 490 170" role="img" aria-label="${esc(caption)}">${svg}</svg>`,caption,buttons};
}
function mount(root,setting){
 const {problem,model}=setting,talk=talks[problem],info=modelText[model];if(!talk||!info)return;
 const guide=document.createElement('details');guide.className='vg-guide';guide.dataset.problem=problem;guide.dataset.model=model;guide.dataset.step='0';
 const source=model==='lca'&&problem==='mis'?['Medina · greedy-MIS dependency explanation, slides 30–39',talk[2]]:[talk[1],talk[2]];
 guide.innerHTML=`<summary>Visual guide · ${esc(problem==='cc'&&model==='stochastic'?'Hidden groups and noisy observations':talk[0])}</summary><div class="vg-body"><div class="vg-example"></div><div class="vg-reading"><h3>${esc(info[0])}</h3><p>${esc(info[1])}</p><h3>Read the bound figure</h3><p><b class="vg-green">Green</b> shows an algorithm's guarantee. <b class="vg-red">Red</b> shows a barrier under its stated assumptions. A gap between them is not a proved frontier.</p><p>Compare marks only within the same setup. Symbolic formula positions are categories unless the axis explicitly gives a numeric scale.</p><p class="vg-source">Original illustrative drawing, inspired by <a href="${esc(source[1])}" target="_blank" rel="noopener noreferrer">${esc(source[0])} ↗</a>. Current bounds come from the paper links in the figure.</p></div></div>`;
 root.append(guide);render(guide);
}
function render(guide){const r=example(guide.dataset.problem,guide.dataset.model,+guide.dataset.step);guide.querySelector('.vg-example').innerHTML=`<div class="vg-steps" role="group" aria-label="Illustration steps">${r.buttons.map((b,i)=>`<button type="button" data-vg-step="${i}" aria-pressed="${+guide.dataset.step===i}">${esc(b)}</button>`).join('')}</div>${r.svg}<p aria-live="polite">${esc(r.caption)}</p><small>Illustration of the problem; not an implementation or runtime claim.</small>`;}
document.addEventListener('click',e=>{const b=e.target.closest('[data-vg-step]');if(!b)return;const guide=b.closest('.vg-guide');if(guide){guide.dataset.step=b.dataset.vgStep;render(guide);}});
window.AtlasVisualGuides={mount,example};
})();
