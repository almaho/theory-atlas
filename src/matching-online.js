(() => {
  'use strict';
  const ID = 'matching-online';
  const data = JSON.parse(document.getElementById('atlas-data').textContent).focus[ID];
  if (!data) return;
  const instances = new Set();
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number = value => String(Math.round(value * 100) / 100);
  const shorten = (value, limit) => String(value ?? '').length > limit ? String(value).slice(0, limit - 1) + '…' : String(value ?? '');
  const text = (x, y, value, cls = 'label', anchor = 'start', attrs = '') => `<text x="${number(x)}" y="${number(y)}" class="mon-${cls}" text-anchor="${anchor}" ${attrs}>${esc(value)}</text>`;
  const line = (x1, y1, x2, y2, cls = 'grid') => `<path d="M${number(x1)} ${number(y1)}L${number(x2)} ${number(y2)}" class="mon-${cls}"/>`;
  const weightingFor = (key = ID, options = {}) => options.weighting || options.view || (key.endsWith('-weighted') ? 'weighted' : 'unweighted');
  const panelsFor = options => data.panels.filter(panel => (panel.weighting || 'unweighted') === weightingFor(options.key || ID, options));
  const allRecords = () => [...data.verifiedRecords, ...(data.relatedResults || []).map(row => ({...row, related:true}))];
  function records(options = {}) {
    const panelIds = new Set(panelsFor(options).map(panel => panel.id));
    return allRecords().map(row => ({...data.sources[row.sourceId], ...row})).filter(row =>
      panelIds.has(row.panel) && (options.publication !== 'published' || row.publicationStatus !== 'preprint'));
  }
  function levelFor(width, height, options, interactive) {
    if (interactive) return 'focus';
    const levels = ['overview', 'compact', 'detail'];
    const available = width < 300 || height < 230 ? 0 : width < 650 || height < 420 ? 1 : 2;
    const requested = levels.indexOf(options.level);
    return levels[Math.min(available, requested < 0 ? available : requested)];
  }
  function layoutGeometry(width, height, options = {}, interactive = false) {
    const w = Math.max(40, Number(width) || 738), h = Math.max(40, Number(height) || 548);
    const level = levelFor(w, h, options, interactive), focus = level === 'focus';
    const tiny = level === 'overview', compact = level === 'compact';
    const top = tiny ? 2 : compact ? 4 : 10, bottom = tiny ? 2 : compact ? 5 : 10;
    const gap = tiny ? 3 : compact ? 4 : focus ? 12 : 8;
    const left = tiny ? w * .18 : compact ? w * .39 : focus ? 330 : Math.min(240, w * .33);
    const right = w - (tiny ? 6 : compact ? 12 : focus ? 35 : 22);
    const panels = panelsFor(options), weights = panels.map(panel => panel.rows.length + 2.4);
    const unit = (h - top - bottom - gap * Math.max(0, panels.length - 1)) / (weights.reduce((a, b) => a + b, 0) || 1);
    const rr = records(options).filter(row => !row.related); let y = top;
    const geometryPanels = panels.map((panel, index) => {
      const panelHeight = unit * weights[index], header = tiny ? 2 : compact ? 16 : focus ? 72 : 40;
      const footer = tiny ? 2 : compact ? 8 : focus ? 42 : 32;
      const plotTop = y + header, axisY = y + panelHeight - footer;
      const rowHeight = Math.max(1, (axisY - plotTop) / Math.max(1, panel.rows.length));
      const min = Number.isFinite(panel.min) ? panel.min : panel.axisType === 'cost' ? 0 : .4;
      const max = Number.isFinite(panel.max) ? panel.max : 1;
      const x = value => panel.axisType === 'cost'
        ? left + (right - left) * (.24 + .52 * Math.max(0, Math.min(1, value)))
        : left + (right - left) * Math.max(0, Math.min(1, (value - min) / (max - min || 1)));
      const rows = panel.rows.map((row, rowIndex) => ({...row, y: plotTop + rowHeight * (rowIndex + .5)}));
      const points = rr.filter(row => row.panel === panel.id).map(row => {
        const lane = rows.find(candidate => candidate.id === row.row);
        if (!lane || !Number.isFinite(row.value)) return null;
        const offset = Math.min(focus ? 5 : compact ? 2 : tiny ? 1.1 : 3, rowHeight * .18);
        return {id: row.id, x: x(row.value), y: lane.y + (row.kind === 'lower' ? offset : -offset), row, lane};
      }).filter(Boolean);
      const result = {panel, top: y, height: panelHeight, left, right, plotTop, axisY, rowHeight, min, max, rows, points, x};
      y += panelHeight + gap;
      return result;
    });
    return {w, h, level, panels: geometryPanels, points: geometryPanels.flatMap(panel => panel.points)};
  }
  function marker(point, geometry, options, interactive) {
    const row = point.row, lower = row.kind === 'lower', tiny = geometry.level === 'overview';
    const compact = geometry.level === 'compact', radius = tiny ? 1.8 : compact ? 2.8 : interactive ? 6 : 4;
    const x = point.x, y = point.y, selected = options.selected === row.id;
    const label = `${row.shortLabel}; ${row.quality}; ${row.displayBound}${row.symbolicBonus ? '; position is a symbolic anchor at one half, not a numeric value for delta' : ''}`;
    let svg = `<g class="mon-point${lower ? ' mon-lower' : ' mon-upper'}" data-online-result="${esc(row.id)}" data-result-id="${esc(row.id)}" data-kind="${lower ? 'lower' : 'upper'}" data-panel="${esc(row.panel)}" data-point-x="${number(x)}" data-point-y="${number(y)}"${interactive ? ` role="button" tabindex="0" aria-pressed="${selected}"` : ''} aria-label="${esc(label)}"><title>${esc(label)}</title>`;
    if (interactive) svg += `<circle class="mon-hit" cx="${number(x)}" cy="${number(y)}" r="15"/>`;
    if (selected && interactive) svg += `<circle class="mon-selection" cx="${number(x)}" cy="${number(y)}" r="12"/>`;
    svg += lower
      ? `<path class="mon-marker-lower" d="M${number(x)} ${number(y-radius)}l${radius} ${radius}l${-radius} ${radius}l${-radius} ${-radius}Z"/>`
      : `<circle class="mon-marker-upper${row.symbolicBonus || row.asymptoticLimit ? ' mon-symbolic' : ''}" cx="${number(x)}" cy="${number(y)}" r="${radius}"/>`;
    if (row.symbolicBonus) {
      const length = tiny ? 4 : compact ? 9 : 20;
      svg += `<path class="mon-symbolic-arrow" d="M${number(x+radius+2)} ${number(y)}h${length}m-4 -3l4 3l-4 3"/>`;
      if (!tiny) svg += text(x + radius + length + 6, y + (compact ? 2 : 4), row.displayBound.includes('δ′') ? '½+δ′' : '½+δ', 'bonus');
    }
    return svg + '</g>';
  }
  function chart(width, height, options = {}, interactive = false) {
    const geometry = layoutGeometry(width, height, options, interactive);
    const {w, h, level} = geometry, tiny = level === 'overview', compact = level === 'compact', focus = level === 'focus';
    const weighting = weightingFor(options.key || ID, options);
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" class="mon-${interactive ? 'map' : 'summary'}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" data-detail-level="${level}" data-weighting="${weighting}" role="${interactive ? 'group' : 'img'}" aria-label="${weighting} online matching: algorithms and impossibility bounds in aligned decision-policy panels"><title>Online matching · ${weighting} decisions and guarantees</title><desc>Green circles are algorithms; red diamonds are impossibility bounds. Competitive fraction beta increases to the right. Arrival assumptions and decision policies remain separate. Recourse-cost categories are symbolic, not a numeric runtime scale. Symbolic one-half-plus-delta improvements are not assigned a numerical delta.</desc>`;
    for (const panelGeometry of geometry.panels) {
      const p = panelGeometry, panel = p.panel;
      svg += `<g data-policy="${esc(panel.id)}" data-panel="${esc(panel.id)}" data-axis-type="${esc(panel.axisType)}">`;
      if (p.top > 10) svg += line(tiny ? 3 : 12, p.top - (compact ? 2 : 5), w - (tiny ? 3 : 12), p.top - (compact ? 2 : 5), 'divider');
      if (!tiny) {
        svg += text(compact ? 7 : 18, p.top + (compact ? 11 : focus ? 24 : 16), shorten(panel.title, compact ? 40 : 90), 'policy-title');
        if (!compact) svg += text(18, p.top + (focus ? 45 : 33), shorten(panel.subtitle, focus ? 145 : 115), 'subtitle');
        if (focus) svg += text(p.left, p.top + 64, panel.axisLabel, 'axis-label', 'start', 'data-axis="x"');
      }
      svg += line(p.left, p.plotTop, p.left, p.axisY, 'axis') + line(p.left, p.axisY, p.right, p.axisY, 'axis');
      let ticks;
      if (panel.axisType === 'cost') ticks = [{value:0,label:'n log n'},{value:1,label:'n log² n'}];
      else if (compact) ticks = [{value:p.min,label:p.min === 0 ? '0' : '.4'},{value:1,label:'1'}];
      else ticks = (panel.ticks || (p.min < .4 ? [0,.25,.5,.75,1] : [.5,1-1/Math.E,.75,1])).filter(value => value >= p.min && value <= p.max).map(value => ({value,label:Math.abs(value-(1-1/Math.E))<.0001?'1−1/e':value===.5?'½':value===.75?'¾':String(value)}));
      for (const tick of ticks) {
        const x = p.x(tick.value);
        svg += line(x, p.plotTop, x, p.axisY);
        if (!tiny) svg += text(x, p.axisY + (compact ? 7 : focus ? 22 : 14), tick.label, 'tick', tick.value === 1 && panel.axisType !== 'cost' ? 'end' : 'middle');
      }
      for (const row of p.rows) {
        svg += line(p.left, row.y, p.right, row.y, 'row-rule');
        if (tiny) continue;
        const labelX = compact ? 8 : 23, maxLength = compact ? 25 : focus ? 43 : 33;
        const label = focus ? row.label : row.compactLabel || row.label;
        svg += text(labelX, row.y + (compact ? 2.5 : focus ? 1 : 3), shorten(label, maxLength), `row-label mon-setup-${row.setup || 'vertex'}`, 'start', `data-row="${esc(row.id)}"`);
        if (focus && row.note) svg += text(labelX, row.y + 19, shorten(row.note, 47), 'row-note');
      }
      for (const point of p.points) {
        svg += marker(point, geometry, options, interactive);
        if (focus && !point.row.symbolicBonus) {
          const rightAligned = point.x > p.right - 155;
          const labelX = Math.max(p.left + 4, Math.min(p.right - 4, point.x + (rightAligned ? -9 : 9)));
          svg += text(labelX, point.y + (point.row.kind === 'lower' ? 13 : -10), shorten(point.row.shortLabel, 28), point.row.kind === 'lower' ? 'lower-label' : 'upper-label', rightAligned ? 'end' : 'start');
        }
      }
      if (focus) svg += text(p.right, p.axisY + 39, panel.axisType === 'cost' ? 'Total recourse · symbolic cost categories' : 'β = expected matching / offline optimum · better →', 'axis-direction', 'end');
      else if (!tiny && !compact) svg += text(p.right, p.axisY + 28, panel.axisType === 'cost' ? 'Total replacements · symbolic categories' : 'Retained '+(weighting === 'weighted' ? 'weight' : 'cardinality')+' β · better →', 'tick', 'end', 'data-axis="x"');
      if (!tiny && !p.points.length) svg += text((p.left+p.right)/2, (p.plotTop+p.axisY)/2, compact ? 'Filtered' : 'No sources match this filter', 'empty', 'middle');
      svg += '</g>';
    }
    return svg + '</svg>';
  }
  function diagramSVG(key = ID, options = {}) {
    if (typeof key === 'object') {options = key || {}; key = options.key || ID;}
    return chart(1100, 1100, {...options, key, weighting:weightingFor(key, options)}, true);
  }
  function summarySVG(key, width, height, options = {}) {
    return chart(width, height, {...options, key, weighting:weightingFor(key, options)}, false);
  }
  function release(root) {
    for (const instance of instances) if (!instance.root.isConnected || instance.root === root) instance.destroy();
  }
  function mount(root, key = ID, options = {}) {
    release(root);
    for (const name of ['StreamingMatching','DynamicMatching','LCAMatching','LocalMatching','MPCMatching','ListQueryMatching']) window[name]?.release(root);
    for (const [id, renderer] of Object.entries(window.AtlasPairRenderers || {})) if (id !== ID) renderer.release?.(root);
    const controller = new AbortController();
    let publication = options.publication || 'all', weighting = weightingFor(key, options), selected;
    const current = () => ({key, publication, weighting, selected});
    root.classList.add('focus-view', 'mon-view'); root.classList.toggle('f-embedded', !!options.embedded);
    root.setAttribute('aria-label', 'Online matching: competitive guarantees and permitted revisions');
    root.innerHTML = `<p class="f-kicker">MATCHING × ONLINE</p><header class="f-hero"><div><h1>What can be promised without seeing the future?</h1><p>Compare algorithms and impossibility bounds under explicit arrival and decision rules.</p></div></header><div class="mon-toolbar"><div class="mon-views" aria-label="Matching weight model"><button type="button" data-online-weighting="unweighted">Unweighted</button><button type="button" data-online-weighting="weighted">Weighted</button></div><label>Sources <select class="mon-publication" aria-label="Online matching publication filter"><option value="all">All reviewed sources</option><option value="published">Published only</option></select></label></div><div class="mon-legend"><span><i class="mon-key-upper"></i>Algorithm guarantee</span><span><i class="mon-key-lower"></i>Impossibility bound</span><span class="mon-setup-vertex">Vertex arrivals</span><span class="mon-setup-edge">Edge arrivals</span></div><p class="mon-active-scope"></p><div class="mon-scroll" tabindex="0" aria-label="Online matching figure; scroll horizontally on narrow screens"><div class="mon-plot"></div></div><div class="mon-reading"><p><b>Competitive fraction.</b> β = E[ALG]/OPT; larger is better. A red marker limits what algorithms can guarantee. Matching markers can certify tightness only within the same row and assumptions.</p><p><b>Decision rules.</b> Irrevocable acceptance, preemption, and bounded recourse permit different revisions. Arrival type and order remain visible in every row. An open ½+δ marker is symbolic: its short arrow does not specify δ.</p><p><b>Exact recourse.</b> The cost panel uses labeled categories, not a numerical competitive-ratio scale. Inspect a theorem for its precise recourse accounting and graph restrictions.</p></div><section class="mon-theorem" aria-live="polite" aria-label="Selected online matching theorem"></section><details class="mon-evidence"><summary>All results and primary-paper links</summary><div class="mon-records"></div></details><p class="mon-coverage">${esc(data.coverageNote)}</p>`;
    function inspect() {
      const row = records(current()).find(candidate => candidate.id === selected), target = root.querySelector('.mon-theorem');
      if (!row) {target.innerHTML = '<p>No sources match this filter.</p>'; return;}
      const type = row.kind === 'lower' ? 'Impossibility bound' : 'Algorithm guarantee';
      const authors = Array.isArray(row.authors) ? row.authors.join(', ') : row.authors || '';
      const source = row.sourceUrl || row.url;
      target.innerHTML = `<div class="mon-detail-head"><span class="${row.kind === 'lower' ? 'mon-red' : 'mon-green'}">${type}</span><strong>${esc(row.shortLabel)}</strong><a href="${esc(source)}" target="_blank" rel="noopener noreferrer">Read paper ↗</a></div><div class="mon-detail-grid"><div><small>Recorded bound</small><strong>${esc(row.displayBound)}</strong></div><div><small>Output</small><strong>${esc(row.output)}</strong></div><div><small>Probability</small><strong>${esc(row.probability)}</strong></div></div><p><b>Guarantee.</b> ${esc(row.quality)}</p><p><b>Graph.</b> ${esc(row.graph)}</p>${row.resource ? `<p><b>Accounting.</b> ${esc(row.resource)}</p>` : ''}<p>${esc(row.notes)}</p><details><summary>Theorem, assumptions, and source</summary><h3>${esc(row.title)}</h3><p>${esc(authors)} · ${esc(row.venue)} · ${esc(row.year)}</p><p><b>${esc(row.theorem)}</b></p><ul>${(row.assumptions || []).map(assumption => `<li>${esc(assumption)}</li>`).join('')}</ul><p><a href="${esc(source)}" target="_blank" rel="noopener noreferrer">Inspect primary theorem ↗</a></p></details>`;
    }
    function render() {
      const rr = records(current());
      if (!rr.some(row => row.id === selected)) selected = rr[0]?.id;
      root.querySelector('.mon-publication').value = publication;
      root.querySelectorAll('[data-online-weighting]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.onlineWeighting === weighting)));
      root.querySelector('.mon-active-scope').textContent = `${weighting === 'weighted' ? 'Weighted matching · vertex weights and edge weights separate · weighted recourse awaits review' : 'Unweighted matching · D = deterministic; R = randomized'} · source assumptions govern each comparison`;
      root.querySelector('.mon-plot').innerHTML = diagramSVG(key, current());
      root.querySelector('.mon-records').innerHTML = rr.map(row => `<div class="mon-record ${row.kind === 'lower' ? 'mon-record-lower' : ''}"><button type="button" data-online-result="${esc(row.id)}" aria-pressed="${selected === row.id}"><strong>${esc(row.shortLabel)}</strong><span>${esc(row.displayBound)}</span><small>${esc(row.quality)}</small></button><a href="${esc(row.sourceUrl || row.url)}" target="_blank" rel="noopener noreferrer">Read paper ↗</a></div>`).join('');
      inspect();
    }
    function select(event) {
      const button = event.target.closest('[data-online-result]');
      if (!button || !records(current()).some(row => row.id === button.dataset.onlineResult)) return;
      selected = button.dataset.onlineResult; render();
    }
    root.addEventListener('click', event => {
      const tab = event.target.closest('[data-online-weighting]');
      if (tab) {
        weighting = tab.dataset.onlineWeighting; selected = undefined; render();
        options.onWeightingChange?.(weighting);
      } else select(event);
    }, {signal:controller.signal});
    root.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      if (event.target.closest('.mon-point')) {event.preventDefault(); select(event);}
    }, {signal:controller.signal});
    root.addEventListener('change', event => {
      if (!event.target.classList.contains('mon-publication')) return;
      publication = event.target.value; render(); options.onPublicationChange?.(publication);
    }, {signal:controller.signal});
    render();
    const instance = {root, settingKey:key, get weighting() {return weighting;}, get view() {return weighting;}, redraw:render,
      destroy() {controller.abort(); root.classList.remove('mon-view'); instances.delete(instance);}};
    instances.add(instance); return instance;
  }
  window.AtlasPairRenderers = window.AtlasPairRenderers || {};
  window.AtlasPairRenderers[ID] = {records, diagramSVG, summarySVG, mount, release, layoutGeometry};
})();
