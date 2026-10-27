/* Paper access shared by every interactive graph figure and fine-grained plot. */
(()=>{
  'use strict';
  const el=document.getElementById('atlas-data')||document.getElementById('fg-data');
  if(!el)return;
  const data=JSON.parse(el.textContent),records=new Map(),knownArxiv=new Map();
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const titleKey=s=>String(s||'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
  function arxivURL(value){
    const m=String(value||'').match(/^https?:\/\/(?:export\.)?arxiv\.org\/(?:abs|pdf|html)\/(\d{4}\.\d{4,5}(?:v\d+)?|[a-z.-]+\/\d{7}(?:v\d+)?)(?:\.pdf)?(?:[?#].*)?$/i);
    return m?'https://arxiv.org/abs/'+m[1]:null;
  }
  function primary(r){return r.sourceUrl||r.url||r.fullTextUrl||r.publicationUrl||null}
  function arxiv(r){return [r.arxivUrl,r.url,r.sourceUrl,r.fullTextUrl,r.publicationUrl].map(arxivURL).find(Boolean)||knownArxiv.get(titleKey(r.title))||null}
  function collect(value){
    if(!value||typeof value!=='object')return;
    if(value.title){const u=arxiv(value);if(u)knownArxiv.set(titleKey(value.title),u);}
    Object.values(value).forEach(collect);
  }
  collect(data);
  function add(id,r){if(!id)return;const old=records.get(id)||[];if(!old.some(p=>primary(p)===primary(r)&&p.title===r.title))records.set(id,[...old,r]);}
  function walk(value,sources={}){
    if(!value||typeof value!=='object')return;
    sources=value.sources||sources;
    if(value.id&&(value.sourceId||primary(value)||value.derived))add(value.id,{...sources[value.sourceId],...value});
    Object.values(value).forEach(v=>walk(v,sources));
  }
  Object.values(data.focus||{}).forEach(v=>walk(v));
  for(const rec of data.research||[]){const ps=new Map(rec.papers.map(p=>[p.id,p]));for(const s of rec.slices)for(const r of s.results)add('research:'+rec.problem+':'+r.id,{...ps.get(r.paperId),...r});}
  for(const n of data.nodes||[]){
    for(const [i,r] of n.baselines.entries())add('fg:'+n.id+':algorithm:'+i,{...data.sources[r.sourceId],...r});
    if(n.lower)add('fg:'+n.id+':lower',{...data.sources[n.lower.sourceId],...n.lower});
  }
  const paperIdentity=r=>arxiv(r)?.replace(/v[0-9]+$/,'')||primary(r)?.split('#')[0]||titleKey(r.title);
  function resolve(ids){const out=[];for(const id of ids)for(const r of records.get(id)||[]){if(!out.some(p=>paperIdentity(p)===paperIdentity(r)))out.push(r);}return out;}
  function referenceHTML(r){
    const a=arxiv(r),url=primary(r),title=r.title||r.shortName||r.shortLabel||'Source statement';
    if(!url)return '<article><strong>'+esc(title)+'</strong><p>Elementary derivation; no separate paper is attributed. See the theorem details.</p></article>';
    const search='https://arxiv.org/search/?query='+encodeURIComponent(title)+'&searchtype=title';
    return '<article><strong>'+esc(title)+'</strong>'+(r.authors?'<p>'+esc(Array.isArray(r.authors)?r.authors.join(', '):r.authors)+'</p>':'')+'<div class="paper-actions">'+(a?'<a href="'+esc(a)+'" target="_blank" rel="noopener noreferrer">arXiv ↗</a>':'<a href="'+esc(search)+'" target="_blank" rel="noopener noreferrer">Find on arXiv ↗</a>')+'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">Cited source ↗</a></div>'+(a?'':'<small>No arXiv identifier recorded; the first link searches by title.</small>')+'</article>';
  }
  window.AtlasPapers={resolve,arxivURL,arxiv,referenceHTML};
  if(!document.addEventListener)return;
  const card=document.createElement('aside');card.className='paper-popover';card.hidden=true;card.setAttribute('role','dialog');card.setAttribute('aria-label','Papers for selected result');document.body.append(card);
  let owner=null,pinned=false,timer=0;
  const hide=()=>{card.hidden=true;pinned=false;owner=null;clearTimeout(timer);};
  function target(node){
    for(let e=node;e&&e!==document.body;e=e.parentElement){
      if(!e.closest?.('svg')||e.closest('#stage'))continue;
      const attrs=Array.from(e.attributes||[]).filter(a=>/^data-(?:[\w-]+-)?result$/.test(a.name));
      if(attrs.length)return {element:e,ids:[...new Set([...(e.getAttribute('data-row-ids')||'').split(','),...attrs.map(a=>a.value)].filter(Boolean))]};
    }
    return null;
  }
  function show(hit,sticky=false){
    const rows=resolve(hit.ids);if(!rows.length)return;
    clearTimeout(timer);owner=hit.element;pinned=sticky||pinned;
    const box=owner.getBoundingClientRect();
    card.innerHTML='<header><span>Paper'+(rows.length>1?'s at this point':'')+'</span><button type="button" aria-label="Close paper links">×</button></header>'+rows.map(referenceHTML).join('');
    card.hidden=false;const w=card.offsetWidth,h=card.offsetHeight;
    card.style.left=Math.max(10,Math.min(innerWidth-w-10,box.left+box.width/2-w/2))+'px';
    card.style.top=Math.max(10,Math.min(innerHeight-h-10,box.bottom+8))+'px';
  }
  document.addEventListener('pointerover',e=>{if(pinned||card.contains(e.target))return;const hit=target(e.target);if(hit)show(hit);});
  document.addEventListener('pointerout',e=>{if(pinned||card.contains(e.relatedTarget)||owner?.contains(e.relatedTarget))return;clearTimeout(timer);timer=setTimeout(hide,220);});
  card.addEventListener('pointerenter',()=>clearTimeout(timer));
  card.addEventListener('click',e=>{if(e.target.closest('button'))hide();});
  document.addEventListener('click',e=>{if(card.contains(e.target))return;const hit=target(e.target);if(hit)show(hit,true);else hide();},true);
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&!card.hidden){e.stopImmediatePropagation();hide();return;}
    if((e.key==='Enter'||e.key===' ')&&!card.contains(e.target)){const hit=target(e.target);if(hit){show(hit,true);queueMicrotask(()=>card.querySelector('a')?.focus());}}
  },true);
  document.addEventListener('focusin',e=>{if(card.contains(e.target))return;const hit=target(e.target);if(hit&&!pinned)show(hit);});
  window.addEventListener('resize',hide);window.addEventListener('scroll',()=>{if(!pinned)hide();},true);
})();
