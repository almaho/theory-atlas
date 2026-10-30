/* Keep the live renderer and its event handlers; move its figure ahead of prose. */
(()=>{
  'use strict';
  const data=JSON.parse(document.getElementById('atlas-data').textContent);
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function questionHTML(problem,model){
    const q=data.openProblems?.settings?.[problem+':'+model]||data.openProblems?.problems?.[problem];
    if(!q)return '';
    const family=data.problems.find(p=>p.id===problem)?.name||problem;
    const scope=q.models?.includes(model)?'In this setting':'Across the '+family.toLowerCase()+' problem family';
    return `<section class="problem-open-question" aria-label="Open problem for ${esc(family)}"><p class="open-problem-kicker">Open problem · ${esc(family)}</p><h3>${esc(q.title)}</h3><p class="open-problem-question">${esc(q.question)}</p><p><b>Setup.</b> ${esc(q.setup)}</p><p class="open-problem-context">${esc(scope)}. ${esc(q.context)}</p><p class="open-problem-source">${q.sources.map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a>`).join(' · ')}</p><p class="open-problem-status">${esc(q.status)}</p></section>`;
  }
  function mount(root,problem,model){
    if(root.querySelector('.problem-visualization'))return;
    const svg=root.querySelector('svg');
    if(!svg)return;
    // Every renderer owns its chart host. Retain that host (including responsive
    // variants), rather than copying an SVG and losing updates or paper clicks.
    let plot=svg.closest('[class*="-scroll"]');
    if(!plot||!root.contains(plot))plot=svg.parentElement===root?svg:svg.parentElement;
    const legend=[...root.querySelectorAll('[class]')].find(el=>[...el.classList].some(c=>c.endsWith('-legend'))&&!el.closest('details'));
    const figure=document.createElement('section');
    figure.className='problem-visualization';
    figure.setAttribute('aria-label','Bounds figure');
    if(legend&&!plot.contains(legend))figure.append(legend);
    figure.append(plot);
    root.prepend(figure);
    figure.insertAdjacentHTML('afterend',questionHTML(problem,model));
    root.classList.add('figure-first');
  }
  window.AtlasFigureFirst={mount,questionHTML};
})();
