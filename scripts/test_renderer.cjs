/* Regression checks for renderer geometry and bound semantics. No browser dependencies. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../src/app.js'), 'utf8');
const start = source.indexOf('  let plotSerial=0;');
const end = source.indexOf('  const searchIndex=');
assert(start >= 0 && end > start, 'Renderer section is available');
const output = { textContent: '' };
const context = {
  currentSlice: null,
  clamp: (v, min, max) => Math.max(min, Math.min(max, v)),
  esc: value => String(value ?? ''),
  visibleResults: slice => slice?.results || [],
  plotted: slice => (slice?.results || []).filter(r => r.plot && r.evidenceStatus !== 'needs_full_text'),
  selectedSlice: () => context.currentSlice,
  cellResults: () => context.currentSlice.results.map(r => ({r})),
  state: { selected: null }, camera: { k: 1 }, base: 1,
  document: { getElementById: () => output }
};
vm.createContext(context);
vm.runInContext(source.slice(start, end), context);
const cell = { id: 'matching:stream', p: {id: 'matching', name: 'Matching', short: 'Matching'}, m: {id: 'stream', name: 'Streaming', measure: 'Space'} };
const upper = {kind: 'upper', bound: 'Algorithm', plot: {x: 2, y: 1, closure: 'upper-right'}};
const textCount = svg => (svg.match(/<text\b/g) || []).length;
const visibleText = svg => [...svg.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)].map(match => match[1].replace(/<[^>]*>/g, '')).join(' ');
const svgAttributes = tag => Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(match => [match[1], match[2]]));
function assertPointLandscape(svg, name) {
  for (const [tag] of svg.matchAll(/<rect\b[^>]*fill="var\(--(?:green|red)(?:-fill)?\)"[^>]*>/g)) {
    const a=svgAttributes(tag);
    assert(a['data-marker'] && +a.width>0 && +a.height>0 && +a.width<=20 && +a.height<=20, `${name}: colored rectangles may be small point markers, not theorem cards`);
  }
  assert(!svg.includes('NaN'), `${name}: point geometry has finite coordinates`);
}
const detailSizes = [[180, 110], [330, 245], [500, 260]];
function assertSemanticZoom(render, name) {
  const figures = detailSizes.map(([width, height]) => render(width, height));
  assert.equal(textCount(figures[0]), 0, `${name}: overview contains no visible SVG text`);
  assert(textCount(figures[1]) > 0 && textCount(figures[2]) > textCount(figures[1]), `${name}: annotation detail grows from overview to compact to detail`);
  for (const [width, height] of [[180, 245], [500, 110]]) {
    assert.equal(textCount(render(width, height)), 0, `${name}: either a narrow or a short cell uses a textless overview`);
  }
  for (const figure of figures) assert(!figure.includes('NaN'), `${name}: semantic zoom retains valid coordinates`);
  return figures;
}
context.currentSlice = {
  xAxis: {label: 'Approximation', min: 1, max: 3},
  yAxis: {label: 'Space', min: 0, max: 2},
  results: [upper]
};
const overview = context.plot(cell, 300, 245);
const detail = context.plot(cell, 900, 460);
const ids = [...(overview + detail).matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
assert.equal(ids.length, new Set(ids).size, 'Overview and detail must not share SVG definition IDs');

const lower2d = {kind: 'lower', bound: 'Barrier', plot: {x: 1.5, y: .5, closure: 'lower-left', strictX: true}};
context.currentSlice = {...context.currentSlice, results: [{...upper, plot: {...upper.plot, label: 'Algorithm theorem'}}, lower2d]};
const numericLevels = assertSemanticZoom((w, h) => context.plot(cell, w, h), 'Non-curated numeric chart');
assert(numericLevels.every(svg => svg.includes('var(--green)') && svg.includes('var(--red)')), 'Numeric algorithms and barriers retain green/red semantics at every zoom level');
assert(!visibleText(numericLevels[1]).includes('Algorithm theorem') && visibleText(numericLevels[2]).includes('Algorithm theorem'), 'Paper annotations appear only when there is room to read them');
assert.equal(context.chartDetail(420, 240), 'detail', 'A readable 420×240 cell can show detail');
assert.equal(context.chartDetail(419, 240), 'compact', 'Detail requires enough width');
assert.equal(context.chartDetail(420, 239), 'compact', 'Detail also requires enough height');
const renderedCell = {
  ...cell, x: 0, y: 0,
  el: {style: {}, dataset: {}, classList: {toggle() {}}},
  button: {attrs: {}, setAttribute(name, value) {this.attrs[name] = value;}},
  plot: {innerHTML: ''}
};
const savedUpdateDetail = context.updateDetail;
Object.assign(context, {cells: [renderedCell], labels: [], L: {cw: 330, ch: 245}, W: 800, H: 600, allSlices: () => [context.currentSlice], updateDetail() {}});
Object.assign(context.camera, {x: 0, y: 0, k: .5});
context.render();
assert.equal(renderedCell.el.dataset.chartLevel, 'overview', 'Atlas layout derives semantic zoom from the actual displayed cell dimensions');
assert.equal(textCount(renderedCell.plot.innerHTML), 0, 'A zoomed-out atlas cell has no text or result-count overlay');
assert(renderedCell.button.attrs['aria-label'].includes('2 results'), 'Result counts remain available to assistive technology');
context.updateDetail = savedUpdateDetail;
context.camera.k = 1;

const oneDimensional = (kind, closure, v, strict = false) => ({kind, bound: 'Test bound', plot: {v, closure, strict}});
assert.equal(context.contains1d(oneDimensional('lower', 'left', 2, true), 2), false, 'Strict lower bound leaves its endpoint unclassified');
assert.equal(context.contains1d(oneDimensional('lower', 'left', 2, true), 1.9), true);
assert.equal(context.contains1d(oneDimensional('upper', 'right', 1, true), 1), false);
assert.equal(context.contains1d(oneDimensional('upper', 'right', 1), 1), true);
assert.equal(context.contains1d(oneDimensional('upper', 'point', 1), 1.5), false, 'A point is not an upper closure');
context.currentSlice = {mode: '1d', axis: {label: 'Exponent', min: 0, max: 2}, results: [oneDimensional('upper', 'point', 1)]};
assert(!context.plot(cell, 500, 260).includes('fill="var(--green-fill)"'), 'Point-only records must not shade a feasible region');
context.currentSlice = {...context.currentSlice, results: [oneDimensional('lower', 'left', 2, true)]};
context.inspect({...cell, screen: {x: 0, y: 0, w: 500, h: 260}}, 480, 100);
assert(output.textContent.includes('open in this collection'), 'Endpoint inspection respects a strict lower bound');
context.currentSlice = {...context.currentSlice, results: [oneDimensional('upper', 'right', 1), oneDimensional('lower', 'left', .5, true)]};
const lineLevels = assertSemanticZoom((w, h) => context.plot(cell, w, h), 'Non-curated resource line');
assert(lineLevels.every(svg => svg.includes('var(--green)') && svg.includes('var(--red)')), 'Resource-line algorithms and barriers retain green/red semantics at every zoom level');

// A viewBox rendered at 1.5× scale and translated by (10, 20):
// hit testing must pass user-space coordinates and viewBox dimensions onward.
let inspected;
context.inspect = (...args) => { inspected = args; };
context.inspectEvent(cell, {clientX: 160, clientY: 320}, {
  getScreenCTM: () => ({inverse: () => ({a: 1/1.5, d: 1/1.5, e: -10/1.5, f: -20/1.5})}),
  createSVGPoint: () => ({x: 0, y: 0, matrixTransform(m) {return {x: this.x*m.a+m.e, y: this.y*m.d+m.f};}}),
  viewBox: {baseVal: {x: 0, y: 0, width: 900, height: 460}}
});
assert(Math.abs(inspected[1] - 100) < 1e-9 && Math.abs(inspected[2] - 200) < 1e-9);
assert.equal(inspected[0].screen.w, 900);
assert.equal(inspected[0].screen.h, 460);

context.currentSlice = {xAxis: {min: 1, max: 3}, yAxis: {min: 0, max: 2}, results: [{kind: 'upper', bound: 'Formula', plot: null}]};
const symbolic = context.plot(cell, 500, 260);
assert(symbolic.includes('1 algorithm bounds'), 'Unplaced evidence remains visible');
assert(symbolic.includes('No shared numeric coordinates'));
assert(!symbolic.includes('data-chart-frame'), 'Unplaced evidence is not drawn as an empty numeric/open region');
context.currentSlice.results.push({kind: 'lower', bound: 'Conditional formula', plot: null});
const symbolicLevels = assertSemanticZoom((w, h) => context.plot(cell, w, h), 'Non-curated symbolic evidence');
assert(symbolicLevels[0].includes('var(--green)') && symbolicLevels[0].includes('var(--red)'), 'Unplaced bounds keep semantic markers in the textless overview');
assert(!/\d+ (?:results|algorithm bounds|lower bounds)/.test(visibleText(symbolicLevels[1])), 'Compact symbolic cells do not overlay result counts');
context.currentSlice = null;
assert.equal(textCount(context.plot(cell, 180, 110)), 0, 'Unresearched overview cells contain no text');
assert.equal(textCount(context.plot(cell, 500, 110)), 0, 'Unresearched short cells also suppress text');

// Curated settings must use the same threshold figures in the full atlas,
// preserving publication filtering and removing the older numeric plane.
const calls = [];
let destroyed = 0;
context.AtlasFocus = {
  keyForSlice: id => id === 'curated-one' ? 'one' : null,
  summarySVG: (...args) => {calls.push(['summary', ...args]); return '<svg data-curated="one"></svg>';},
  mount: (...args) => {calls.push(['mount', ...args]); return {destroy: () => destroyed++};}
};
context.currentSlice = {id: 'curated-one', label: 'One-pass matching', results: []};
context.state.cutoff = 'published';
assert.equal(context.plot(cell, 330, 245), '<svg data-curated="one"></svg>');
assert.equal(calls[0][1], 'one');
assert.equal(calls[0][4].publication, 'published');
assert.equal(calls[0][4].level, 'compact', 'The full atlas passes its display detail level to curated renderers');
const scopeHTML = context.chartScopeHTML(cell, context.currentSlice, [context.currentSlice], 'one');
assert(scopeHTML.includes('slice-select') && scopeHTML.includes('atlas-focus-chart'));
assert(!scopeHTML.includes('class="detail-chart"'), 'Embedded figures must not inherit the legacy 300px SVG minimum height');
assert(!scopeHTML.includes('id="plot-key"') && !scopeHTML.includes('id="inspect"') && !scopeHTML.includes('access-grid'));
const host = {};
context.mountDetailChart(cell, context.currentSlice, host);
assert.equal(calls[1][1], host);
assert.equal(calls[1][2], 'one');
assert.equal(calls[1][3].publication, 'published');
assert.equal(calls[1][3].embedded, true);
const savedRender = context.render;
let callbackRenders = 0;
context.render = () => callbackRenders++;
calls[1][3].onGraphChange('bipartite');
assert.equal(context.state.selectedSlice, 'matching-stream-twopass-bipartite-lower', 'Embedded graph changes select the matching atlas scope');
calls[1][3].onGraphChange('general');
assert.equal(context.state.selectedSlice, 'matching-stream-singlepass-insertion-explicit', 'Returning to general graphs uses the canonical combined route');
calls[1][3].onPublicationChange('all');
assert.equal(context.state.cutoff, 'all', 'Embedded source changes synchronize the atlas publication filter');
assert.equal(callbackRenders, 3, 'Scope and publication changes refresh the atlas rather than leaving stale thumbnails');
context.render = savedRender;
context.state.cutoff = 'published';
context.disposeDetail();
context.disposeDetail();
assert.equal(destroyed, 1, 'Changing settings disconnects the previous embedded figure exactly once');
delete context.AtlasFocus;
assert.equal(context.curatedKey(context.currentSlice), null, 'Missing or late-loaded focus API safely falls back');

// Exercise the real focused renderer as well as the atlas adapter. These small
// element fixtures supply geometry and track lifecycle; browser QA covers layout.
const focusSource = fs.readFileSync(path.join(__dirname, '../src/focus.js'), 'utf8');
const bootstrap = focusSource.indexOf("  const root=document.getElementById('focus-view')");
assert(bootstrap > 0, 'Focused renderer API is separable from page navigation');
const focusData = {
  one: JSON.parse(fs.readFileSync(path.join(__dirname, '../data/focus/matching-stream.json'), 'utf8')),
  two: JSON.parse(fs.readFileSync(path.join(__dirname, '../data/focus/matching-stream-two-pass.json'), 'utf8')),
  bipartite: JSON.parse(fs.readFileSync(path.join(__dirname, '../data/focus/matching-stream-two-pass-bipartite.json'), 'utf8')),
  'dynamic-edges': JSON.parse(fs.readFileSync(path.join(__dirname, '../data/focus/matching-dynamic-edges.json'), 'utf8')),
  'dynamic-size': JSON.parse(fs.readFileSync(path.join(__dirname, '../data/focus/matching-dynamic-size.json'), 'utf8')),
  lca: JSON.parse(fs.readFileSync(path.join(__dirname, '../data/focus/matching-lca.json'), 'utf8')),
  local: JSON.parse(fs.readFileSync(path.join(__dirname, '../data/focus/matching-local.json'), 'utf8')),
  mpc: JSON.parse(fs.readFileSync(path.join(__dirname, '../data/focus/matching-mpc.json'), 'utf8')),
  'query-list': JSON.parse(fs.readFileSync(path.join(__dirname, '../data/focus/matching-query-list.json'), 'utf8'))
};
const pairManifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/focus/pairs.json'), 'utf8')).pairs;
for (const pair of pairManifest) focusData[pair.id] = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/focus', pair.dataFile), 'utf8'));
const featuredFixture = {innerHTML: '', addEventListener() {}};
const observers = [];
const focusContext = {
  AbortController,
  document: {getElementById: id => id === 'featured-settings' ? featuredFixture : ({textContent: JSON.stringify({focus: focusData, focusPairs: pairManifest})})},
  window: {innerWidth: 1000},
  ResizeObserver: class {
    constructor(callback) {this.callback = callback; this.disconnects = 0; observers.push(this);}
    observe(root) {this.root = root;}
    disconnect() {this.disconnects++;}
  }
};
vm.createContext(focusContext);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/dynamic.js'), 'utf8'), focusContext);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/streaming.js'), 'utf8'), focusContext);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/lca.js'), 'utf8'), focusContext);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/local.js'), 'utf8'), focusContext);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/mpc.js'), 'utf8'), focusContext);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/query-list.js'), 'utf8'), focusContext);
for (const pair of pairManifest) vm.runInContext(fs.readFileSync(path.join(__dirname, '../src', pair.javascript), 'utf8'), focusContext);
vm.runInContext(focusSource.slice(0, bootstrap) + '\n})();', focusContext);
const realFocus = focusContext.window.AtlasFocus;
function focusHost(width = 760) {
  const children = new Map();
  return {
    isConnected: true, hidden: false, clientWidth: width, innerHTML: '', attrs: {}, listeners: [],
    classList: {add() {}, toggle() {}, remove() {}},
    setAttribute(name, value) {this.attrs[name] = value;},
    querySelector(selector) {
      if (!children.has(selector)) children.set(selector, {innerHTML: '', clientWidth: width, attrs: {}, setAttribute(name, value) {this.attrs[name] = value;}});
      return children.get(selector);
    },
    querySelectorAll(selector) {
      if (selector === '[data-dynamic-output]') return [...this.innerHTML.matchAll(/data-dynamic-output="([^"]+)"/g)].map(match => {
        const child = this.querySelector(`[data-dynamic-output="${match[1]}"]`);
        child.dataset = {dynamicOutput: match[1]};
        return child;
      });
      if (selector === '[data-streaming-graph]') return [...this.innerHTML.matchAll(/data-streaming-graph="([^"]+)"/g)].map(match => {
        const child = this.querySelector(`[data-streaming-graph="${match[1]}"]`);
        child.dataset = {streamingGraph: match[1]};
        return child;
      });
      return [];
    },
    addEventListener(type, listener, options) {this.listeners.push({type, listener, options});}
  };
}
const streamPlot = host => host.querySelector('.s-plot-host').innerHTML;
const streamTheorem = host => host.querySelector('.s-theorem').innerHTML;
function streamClick(host, attribute, value) {
  const datasetKey = attribute === 'result' ? 'streamingResult' : 'streamingGraph';
  host.listeners.find(event => event.type === 'click').listener({target: {closest: selector => selector === `[data-streaming-${attribute}]` ? {dataset: {[datasetKey]: value}} : null}});
}
const settings = [
  ['one', 'matching-stream-singlepass-insertion-explicit'],
  ['two', 'matching-stream-twopass-general'],
  ['bipartite', 'matching-stream-twopass-bipartite-lower'],
  ['dynamic-edges', 'matching-dynamic-frontier'],
  ['dynamic-size', 'matching-dynamic-value-polylog']
];
context.AtlasFocus = realFocus;
for (const [key, id] of settings) {
  context.currentSlice = {id, label: key, results: []};
  assert.equal(context.curatedKey(context.currentSlice), key, `${id} uses its own focused renderer`);
  const summaries = assertSemanticZoom((w, h) => context.plot(cell, w, h), `${key} curated atlas chart`);
  assert(summaries.every(svg => svg.includes('var(--green)')), `${key} algorithm guarantees remain green throughout semantic zoom`);
  assert(summaries.every(svg => !/\d+ (?:results|papers)/.test(visibleText(svg))), `${key} summaries do not overlay result or paper counts`);
  if (key.startsWith('dynamic-')) {
    assert(summaries.every(svg => !svg.includes('var(--red)')), 'Dynamic approximate guarantees never acquire an unscoped lower-bound region');
    assert(!summaries[1].includes('summary-paper') && summaries[2].includes('summary-paper'), 'Dynamic author labels appear only in the detail thumbnail');
    const marks = svg => (svg.match(/\bdata-center-x=/g) || []).length || (svg.match(/<circle\b/g) || []).length;
    assert(marks(summaries[0]) < marks(summaries[1]), 'Dynamic overview selects representative guarantees instead of shrinking every paper marker');
  } else {
    assert(summaries.every(svg => svg.includes('var(--red)')), `${key} streaming lower bounds remain red at every zoom level`);
    assert(summaries.every(svg => /<circle\b[^>]*stroke="var\(--green\)"/.test(svg) && /<path\b[^>]*stroke="var\(--red\)"/.test(svg)), 'Streaming algorithm circles and lower-bound diamonds survive the zoom transition');
  }
  for (const width of [180, 330]) {
    const summary = context.plot(cell, width, 245);
    assert(summary.includes('<svg') && !summary.includes('NaN'), `${key} has a valid atlas thumbnail at ${width}px`);
    if (!key.startsWith('dynamic-')) {
      assert(summary.includes('data-pass="1"') && summary.includes('data-pass="2"'), 'Every streaming atlas thumbnail retains both pass budgets');
      assert(!summary.includes('kn2021-greedy-first'), 'The restricted barrier is absent from the unrestricted thumbnail');
    }
  }
  const host = focusHost();
  context.mountDetailChart(cell, context.currentSlice, host);
  if (key.startsWith('dynamic-')) assert(host.innerHTML.includes('d-landscape'), `${key} mounts the complete figure inside the atlas`);
  else {
    const plot = streamPlot(host);
    assert(plot.includes('class="s-map"') && plot.includes('data-pass="1"') && plot.includes('data-pass="2"'), `${key} mounts both pass budgets inside the atlas`);
    assert(plot.includes(key === 'bipartite' ? 'abr2024-bipartite' : 'abr2024'), `${key} uses its graph-class scope`);
    assert(!plot.includes('kn2021-greedy-first'), 'Restricted-class lower bounds cannot shade the main pass diagram');
  }
  context.disposeDetail();
  assert(host.listeners[0].options.signal.aborted, `${key} releases event handlers when leaving the setting`);
  for (const observer of observers.filter(observer => observer.root === host)) assert.equal(observer.disconnects, 1, `${key} releases its resize observer when leaving the setting`);
}
const research = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/research/matching.json'), 'utf8'));
const streamSlices = research.slices.filter(slice => slice.model === 'stream');
const bipartiteSlice = streamSlices.find(slice => slice.id === settings[2][1]);
const chooser = context.chartScopeHTML(cell, bipartiteSlice, streamSlices, 'bipartite');
for (const [, id] of [settings[0], settings[2]]) assert(chooser.includes(`data-slice="${id}"`), 'General and bipartite combined figures are discoverable inside the full atlas');
assert(!chooser.includes(`data-slice="${settings[1][1]}"`), 'The legacy two-pass route does not create a redundant setting chip');
assert(!chooser.includes(`value="${settings[1][1]}"`), 'The chart dropdown folds the legacy two-pass alias into one combined choice');
assert.equal((chooser.match(/aria-pressed="true"/g) || []).length, 1, 'Only the selected setting chip is active');
const aliasChooser = context.chartScopeHTML(cell, streamSlices.find(slice => slice.id === settings[1][1]), streamSlices, 'two');
assert(aliasChooser.includes(`data-slice="${settings[0][1]}" aria-pressed="true"`), 'Opening the legacy two-pass route activates the combined general chip');
assert(aliasChooser.includes(`<option value="${settings[0][1]}" selected>`), 'The combined general dropdown option is selected for the legacy route');
assert.equal((aliasChooser.match(/<option\b[^>]*\bselected\b/g) || []).length, 1, 'The legacy route does not activate multiple chart options');
assert(context.axisSummary(bipartiteSlice).includes('bipartite'), 'Bibliography axis description preserves graph-class scope');
const dynamicSlices = research.slices.filter(slice => slice.model === 'dynamic');
const dynamicChooser = context.chartScopeHTML(cell, dynamicSlices.find(slice => slice.id === settings[3][1]), dynamicSlices, 'dynamic-edges');
for (const [, id] of settings.slice(3)) assert(dynamicChooser.includes(`data-slice="${id}"`), 'Edges and size figures are directly discoverable inside the dynamic cell');

// Dispatch the same setting event used by the standalone figure's atlas button.
// Execute the real atlas listener so legacy and current links reach the intended cell.
const eventStart = source.indexOf("  window.addEventListener('atlas:open-setting'");
const eventEnd = source.indexOf("  app.addEventListener('change'", eventStart);
assert(eventStart >= 0 && eventEnd > eventStart, 'The focused-figure atlas route is available');
const opened = [], routeListeners = new Map();
const routeContext = {
  cells: [{id: 'matching:stream'}, {id: 'matching:dynamic'}],
  allSlices: cell => cell.id.endsWith(':stream') ? streamSlices : dynamicSlices,
  focus: (cell, id) => opened.push([cell.id, id]),
  window: {addEventListener: (name, listener) => routeListeners.set(name, listener)}
};
vm.createContext(routeContext);
vm.runInContext(source.slice(eventStart, eventEnd), routeContext);
for (const [key, id] of settings) {
  routeListeners.get('atlas:open-setting')({detail: {sliceId: id}});
  assert.deepEqual(opened.at(-1), [key.startsWith('dynamic-') ? 'matching:dynamic' : 'matching:stream', id], `${key} opens its exact setting in the full atlas`);
}
routeListeners.get('atlas:open-setting')({detail: {sliceId: 'unknown-setting'}});
assert.equal(opened.length, settings.length, 'An unknown setting event cannot select an unrelated atlas cell');

// The shared streaming map compares pass budgets, while graph class and source
// status change the eligible theorem set without mixing restricted barriers.
const standalone = focusHost();
const embedded = focusHost();
const graphChanges = [], publicationChanges = [];
const first = realFocus.mount(standalone, 'one', {onGraphChange: graph => graphChanges.push(graph), onPublicationChange: publication => publicationChanges.push(publication)});
const second = realFocus.mount(embedded, 'one', {embedded: true, publication: 'published'});
assert.equal(graphChanges.length + publicationChanges.length, 0, 'Mounting does not emit user-change callbacks');
const streamAPI = focusContext.window.StreamingMatching;
const streamEvidence = host => host.querySelector('.s-evidence-list').innerHTML;
const streamGroups = host => [...streamPlot(host).matchAll(/<g class="s-plot-result"[\s\S]*?<\/g>/g)].map(match => match[0]);
const streamGroup = (host, id) => streamGroups(host).find(group => {
  const attrs = svgAttributes(group.match(/^<g\b[^>]*>/)[0]);
  return attrs['data-streaming-result'] === id || attrs['data-row-ids']?.split(',').includes(id);
});
const pointLocation = html => {
  const tag = html?.match(/<[^>]*\bdata-center-x="[^"]+"[^>]*\bdata-center-y="[^"]+"[^>]*>/)?.[0];
  assert(tag, 'A plotted result exposes the position of its actual marker');
  const attrs = svgAttributes(tag), point = {x: Number(attrs['data-center-x']), y: Number(attrs['data-center-y'])};
  assert(Number.isFinite(point.x) && Number.isFinite(point.y), 'Marker positions are finite');
  return point;
};
const barrier = (graph, publication, pass) => streamAPI.records({graph, publication}).filter(row => row.passes === pass && row.kind === 'barrier').reduce((a, b) => a.ratio < b.ratio ? a : b);
assert.equal(barrier('general', 'all', 1).ratio, .5, 'All-source one-pass frontier includes the half-optimality theorem');
assert.equal(barrier('general', 'published', 1).id, 'ajx2026a', 'Published-only one-pass frontier uses the published blueprint theorem');
assert(Math.abs(barrier('general', 'published', 1).ratio - (8 - 2*Math.sqrt(10))/3) < 1e-12);
assert(streamEvidence(standalone).includes('ajx2026b') && !streamEvidence(embedded).includes('ajx2026b'), 'Publication filtering removes the preprint from the actual embedded evidence');
assert(streamPlot(standalone).includes('ajx2026b') && !streamPlot(embedded).includes('ajx2026b'), 'Publication filtering removes the same preprint from the shared pass diagram');
assert(standalone.querySelector('.s-comparison').innerHTML.includes('½ is optimal') && embedded.querySelector('.s-comparison').innerHTML.includes('0.5585'), 'Publication filtering updates the one-pass frontier interpretation');
assert(!streamEvidence(embedded).includes('kmm2014'), 'Publication filtering also removes the general-graph preprint on the two-pass lane');
for (const graph of ['general', 'bipartite']) {
  streamClick(standalone, 'graph', graph);
  assert.equal(graphChanges.at(-1), graph, 'The mounted graph control reports its scope to the atlas coordinator');
  assert.equal(first.settingKey, graph === 'bipartite' ? 'bipartite' : 'one', 'The live instance exposes the canonical route for its selected graph');
  const rows = streamAPI.records({graph}), plot = streamPlot(standalone);
  assertPointLandscape(plot, `${graph} streaming map`);
  assert(plot.includes('data-pass="1"') && plot.includes('data-pass="2"'), `${graph}: both pass lanes remain in the mounted figure`);
  assert(/break/i.test(plot) && (plot.includes('0.70') || plot.includes('.70')) && (plot.includes('0.82') || plot.includes('.82')), 'The streaming map discloses the compressed beta interval');
  assert(standalone.querySelector(`[data-streaming-graph="${graph}"]`).attrs['aria-pressed'] === 'true', 'Graph controls expose the actual selected scope');
  for (const row of rows) assert(streamEvidence(standalone).includes(`data-streaming-result="${row.id}"`), `${row.id} is individually inspectable even when points coincide`);
  const plottedRows = rows.map(row => {
    const group = streamGroup(standalone, row.id);
    assert(group, `${row.id} appears as a point in the combined streaming map`);
    const attrs = svgAttributes(group.match(/^<g\b[^>]*>/)[0]);
    assert.equal(Number(attrs['data-beta']), row.ratio, `${row.id} retains its exact theorem ratio`);
    assert.equal(Number(attrs['data-pass']), row.passes, `${row.id} retains its theorem's pass budget`);
    return {...row, ...pointLocation(group)};
  });
  for (const pass of [1, 2]) {
    const lane = plottedRows.filter(row => row.passes === pass);
    assert(lane.every(row => row.y === lane[0].y), `All ${pass}-pass markers sit on their actual categorical pass lane`);
    for (const a of lane) for (const b of lane) {
      if (a.ratio === b.ratio) assert.equal(a.x, b.x, 'Coincident streaming guarantees preserve one horizontal coordinate');
      else if (a.ratio < b.ratio) assert(a.x < b.x, 'Increasing beta always moves a streaming marker rightward');
    }
  }
  assert(plottedRows.find(row => row.passes === 2).y < plottedRows.find(row => row.passes === 1).y, 'Larger pass budgets sit above one pass, so fewer passes is downward');
  const current = graph === 'bipartite' ? 'abr2024-bipartite' : 'abr2024';
  assert(streamGroup(standalone, current)?.includes('fill="var(--surface)" stroke="var(--green)"'), 'The two-pass limiting algorithm endpoint is hollow');
  assert(streamGroup(standalone, 'greedy').includes('fill="var(--green)" stroke="var(--green)"'), 'The attained half guarantee is filled');
  const twoBarrier = barrier(graph, 'all', 2);
  assert.equal(twoBarrier.ratio, 8/9, 'The unrestricted two-pass ceiling is 8/9 for both graph scopes');
  assert(streamGroup(standalone, twoBarrier.id).includes('fill="var(--surface)" stroke="var(--red)"'), 'The universal lower-bound endpoint remains open');
  const special = standalone.querySelector('.s-specials').innerHTML;
  for (const id of ['kn2021-greedy-first', 'assadi2022-rs', 'ar2020-exact']) {
    assert(special.includes(`data-streaming-result="${id}"`) && !plot.includes(id), `${id} is separated from the unrestricted numerical frontier`);
  }
  assert(special.includes('GREEDY-FIRST CLASS ONLY'), 'The restricted 2/3 theorem explicitly states its algorithm-class restriction');
  streamClick(standalone, 'result', 'kn2021-greedy-first');
  assert(streamTheorem(standalone).includes('Restricted-class lower bound') && streamTheorem(standalone).includes('first pass'), 'The restricted theorem opens with its restriction intact');
}
assert(streamGroup(standalone, 'bksw2023-bipartite'), 'Bipartite deterministic results share the limiting two-pass coordinate');
streamClick(standalone, 'result', 'bksw2023-bipartite');
assert(streamTheorem(standalone).includes('bipartite') && streamTheorem(standalone).includes('deterministic'), 'Coincident bipartite results remain individually inspectable');
streamClick(standalone, 'graph', 'general');
assert(!streamPlot(standalone).includes('bksw2023-bipartite') && !streamEvidence(standalone).includes('ehm2016-bipartite'), 'General-graph scope does not inherit bipartite-only algorithm guarantees');
let keyboardPrevented = false;
standalone.listeners.find(event => event.type === 'keydown').listener({key: 'Enter', preventDefault() {keyboardPrevented = true;}, target: {closest: selector => selector === '.s-plot-result' ? {dataset: {streamingResult: 'abr2024'}} : null}});
assert(keyboardPrevented && streamTheorem(standalone).includes('At most 2 passes') && streamTheorem(standalone).includes('limiting ratio'), 'Keyboard theorem selection preserves pass budget and endpoint semantics');
streamClick(standalone, 'result', 'ajx2026b');
standalone.listeners.find(event => event.type === 'change').listener({target: {value: 'published', classList: {contains: name => name === 's-publication-select'}}});
assert.equal(publicationChanges.at(-1), 'published', 'The mounted source control reports its filter to the atlas coordinator');
assert(!streamPlot(standalone).includes('ajx2026b') && !streamTheorem(standalone).includes('Greedy is Optimal'), 'Changing the mounted publication filter replaces a now-ineligible selection');
const allSummary = streamAPI.summarySVG('one', 500, 260);
const publishedSummary = streamAPI.summarySVG('one', 500, 260, {publication: 'published'});
for (const [width, height] of detailSizes) assertPointLandscape(streamAPI.summarySVG('one', width, height), 'Streaming atlas thumbnail');
const summaryBarriers = svg => [...svg.matchAll(/<g\b[^>]*data-beta="[^"]+"[^>]*>/g)].map(match => svgAttributes(match[0])).filter(attrs => attrs['data-kind'] === 'barrier' && attrs['data-pass'] === '1').map(attrs => Number(attrs['data-beta']));
assert(summaryBarriers(allSummary).includes(.5) && summaryBarriers(publishedSummary).includes(barrier('general', 'published', 1).ratio), 'Atlas thumbnails use the same publication-dependent one-pass threshold');
assert.equal(textCount(streamAPI.summarySVG('one', 180, 110, {level: 'detail'})), 0, 'Requesting detail cannot force prose into a tiny streaming thumbnail');
const focusedIds = [...(standalone.innerHTML + embedded.innerHTML).matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(focusedIds.length, new Set(focusedIds).size, 'Standalone and embedded figures have distinct accessible heading IDs');
const priorHandlers = [...embedded.listeners];
const replacement = realFocus.mount(embedded, 'two');
assert(priorHandlers.every(event => event.options.signal.aborted), 'Remounting a streaming host aborts its previous handlers');
standalone.isConnected = false;
const finalInstance = realFocus.mount(focusHost(), 'two');
assert(standalone.listeners.every(event => event.options.signal.aborted), 'Mounting cleans up event handlers on figures detached by atlas rerendering');
replacement.destroy();
finalInstance.destroy();

// The shared map must distinguish output, approximation, runtime and graph scope.
const edgesHost = focusHost(), sizeHost = focusHost();
const edgesInstance = realFocus.mount(edgesHost, 'dynamic-edges');
const sizeInstance = realFocus.mount(sizeHost, 'dynamic-size');
const plotHTML = host => host.querySelector('.d-plot-host').innerHTML;
const evidenceHTML = host => host.querySelector('.d-evidence-list').innerHTML;
const resultIds = html => [...html.matchAll(/data-dynamic-result="([^"]+)"/g)].map(match => match[1]);
function groupHTML(host, id) {
  return [...plotHTML(host).matchAll(/<g class="d-plot-result"[\s\S]*?<\/g>/g)].map(match => match[0]).find(html => html.includes(`data-group="${id}"`));
}
function clickResult(host, id) {
  host.listeners.find(event => event.type === 'click').listener({target: {closest: selector => selector === '[data-dynamic-result]' ? {dataset: {dynamicResult: id}} : null}});
}
function chooseOutput(host, output) {
  host.listeners.find(event => event.type === 'click').listener({target: {closest: selector => selector === '[data-dynamic-output]' ? {dataset: {dynamicOutput: output}} : null}});
}
function chooseScope(host, value) {
  host.listeners.find(event => event.type === 'change').listener({target: {value, classList: {contains: name => name === 'd-scope-select'}}});
}
const allDynamicRecords = ['dynamic-edges', 'dynamic-size'].flatMap(key => [...focusData[key].results, ...focusData[key].relatedResults]);
for (const [key, host] of [['dynamic-edges', edgesHost], ['dynamic-size', sizeHost]]) {
  const plot = plotHTML(host);
  assert(plot.includes('class="d-map"') && plot.includes('UPDATE TIME') && plot.includes('GUARANTEED FRACTION'), `${key} embeds the actual two-axis map`);
  assert(/<circle\b[^>]*data-output="edges"[^>]*stroke="var\(--green\)"/.test(plot) && /<rect\b[^>]*data-output="size"[^>]*stroke="var\(--green\)"/.test(plot), 'Both atlas routes show green edge circles and size squares');
  assert(plot.includes('data-group="dynamic-edges-gp13"') && plot.includes('data-group="bks2023-size"'), 'The shared map includes explicit and size-only near-optimal results');
  for (const row of allDynamicRecords) assert(evidenceHTML(host).includes(`data-dynamic-result="${row.id}"`), `${row.id} remains inspectable in the complete evidence list`);
  assert(!plot.includes('var(--red') && !plot.includes('var(--f-red'), 'Approximate dynamic maps do not inherit streaming impossibility shading');
  assert(!resultIds(plot).includes('dynamic-exact-omv'), 'Exact conditional hardness is not projected onto an approximate frontier');
  assert(host.innerHTML.includes('β-axis is broken') && plot.includes('exponent unspecified'), 'Schematic near-optimal and unspecified-exponent lanes are disclosed');
  const specials = host.querySelector('.d-specials').innerHTML;
  assert(specials.includes('d-lower-bound') && specials.includes('EXACT MATCHING ONLY') && resultIds(specials).includes('dynamic-exact-omv'), 'The exact conditional lower bound remains visible in its separately scoped card');
  for (const id of ['dynamic-edges-akk25', 'dynamic-edges-bg24', 'dynamic-edges-ms25-ors']) {
    const entry=[...plot.matchAll(/<g class="d-plot-result"[\s\S]*?<\/g>/g)].map(m=>m[0]).find(html=>html.includes(`data-dynamic-result="${id}"`));
    assert(entry && entry.includes(`data-ors-result="${id}"`) && !entry.includes('data-beta='), 'ORS algorithms appear in the main figure without invented n-only runtime coordinates');
    const record=allDynamicRecords.find(r=>r.id===id);
    assert(specials.includes(`href="${record.url}"`), 'Each ORS paper has a direct source link');
  }
  assert(plot.includes('Behnezhad–Ghafari · FOCS 2024') && plot.includes('ORSₙ(Θ(ε²n))'), 'The main plot visibly attributes the BG24 algorithm and preserves its matching-size parameter');
  for(const row of allDynamicRecords)assert(evidenceHTML(host).includes(`href="${row.url}"`), 'Every recorded paper is linked directly from the evidence list');
  assert(specials.includes('BIPARTITE ONLY') && specials.includes('beh2023-size-bipartite'), 'The bipartite result has a separate labeled card');
  assert(!resultIds(plot).includes('beh2023-size-bipartite'), 'Bipartite-only quality is not projected as a general-graph bound');
  const symbolic = [...plot.matchAll(/<g class="d-plot-result"[\s\S]*?<\/g>/g)].map(match => match[0]).find(html => html.includes('data-dynamic-result="dynamic-edges-blm20"'));
  assert(symbolic && symbolic.includes('symbolic') && !symbolic.includes('data-beta=') && !symbolic.includes('<circle'), 'BLM uses a symbolic improvement arrow, not an invented numeric approximation point');
}
assert(edgesHost.innerHTML.includes('actual matching M') && sizeHost.innerHTML.includes('a number ν'), 'The output contracts remain explicit in the shared legend');
const dynamicIds = [...(edgesHost.innerHTML + sizeHost.innerHTML).matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(dynamicIds.length, new Set(dynamicIds).size, 'Simultaneous dynamic figures use distinct accessible heading and theorem IDs');
clickResult(sizeHost, 'bks2023-size');
assert(sizeHost.querySelector('.d-theorem').innerHTML.includes('implicit mate query'), 'The size theorem preserves its separate edge-query limitation');
clickResult(sizeHost, 'beh2023-size-bipartite');
assert(sizeHost.querySelector('.d-theorem').innerHTML.includes('BIPARTITE ONLY'), 'Inspecting a separate graph-class result preserves its scope');

// Inherited guarantees share the original coordinate; toggling output changes
// the record and marker shape, not the quality or the update-time position.
const combinedGP = groupHTML(edgesHost, 'dynamic-edges-gp13');
assert(/<circle\b[^>]*data-output="edges"/.test(combinedGP) && /<rect\b[^>]*data-output="inherited-size"/.test(combinedGP), 'A circle inside a square marks a shared edge/size guarantee');
assert(/<circle[^>]*fill="var\(--surface\)"/.test(groupHTML(edgesHost, 'dynamic-edges-gssu22')), 'BS16/GSSU22 approach two thirds and must share an open limiting marker');
assert(/<circle[^>]*data-output="edges"[^>]*fill="var\(--green\)"/.test(groupHTML(edgesHost, 'dynamic-edges-ns13')), 'The attained NS13 two-thirds guarantee keeps a filled green marker');
chooseOutput(edgesHost, 'dynamic-edges');
const edgesGP = groupHTML(edgesHost, 'dynamic-edges-gp13');
assert(!plotHTML(edgesHost).includes('data-group="bks2023-size"') && !evidenceHTML(edgesHost).includes('abr2024-size'), 'Edges filter excludes size-only evidence and points');
chooseOutput(edgesHost, 'dynamic-size');
const sizeGP = groupHTML(edgesHost, 'dynamic-edges-gp13');
assert(sizeGP.includes('data-dynamic-result="gp2013-size"') && /<rect\b[^>]*data-output="size"[^>]*stroke="var\(--green\)"/.test(sizeGP), 'Size filter selects a green square for the inherited-size record');
const markerCenter = html => {
  const marker = html.match(/<(?:circle|rect)\b[^>]*data-output="(?:edges|size)"[^>]*>/)?.[0];
  assert(marker, 'A result group has an actual output marker');
  return ['x', 'y'].map(axis => Number(marker.match(new RegExp(`data-center-${axis}="([^"]+)"`))[1]));
};
assert.deepEqual(markerCenter(edgesGP), markerCenter(sizeGP), 'Inherited size and edge guarantees have identical two-dimensional coordinates regardless of marker shape');
assert(!plotHTML(edgesHost).includes('data-group="dynamic-edges-cks26-det"') && !evidenceHTML(edgesHost).includes('dynamic-edges-cks26-det'), 'Size filter excludes edge-only records');
assert.equal(edgesHost.querySelector('[data-dynamic-output="dynamic-size"]').attrs['aria-pressed'], 'true', 'Output toggle exposes its active state accessibly');
assert(!groupHTML(edgesHost, 'dynamic-edges-gssu22').includes('BS’16'), 'Size-only coincident labels do not attribute excluded edge-only results');
chooseOutput(edgesHost, 'both');

const oblivious = focusData['dynamic-edges'].results.find(row => row.adversary === 'oblivious');
clickResult(edgesHost, oblivious.id);
assert(edgesHost.querySelector('.d-theorem').innerHTML.includes(oblivious.title), 'Clicking evidence opens the selected primary theorem');
chooseScope(edgesHost, 'adaptive');
assert(!evidenceHTML(edgesHost).includes(`data-dynamic-result="${oblivious.id}"`) && !resultIds(plotHTML(edgesHost)).includes('dynamic-edges-blm20'), 'Adaptive filter removes oblivious evidence and the symbolic oblivious result');
assert(!edgesHost.querySelector('.d-theorem').innerHTML.includes('oblivious'), 'Filtering resets a selected theorem that no longer qualifies');
assert(!groupHTML(edgesHost, 'dynamic-edges-bgs11').includes('BGS’11') && !groupHTML(edgesHost, 'dynamic-edges-bgs11').includes('S’16'), 'Adaptive labels do not leave excluded oblivious authors on the polylog point');
assert(resultIds(edgesHost.querySelector('.d-specials').innerHTML).includes('dynamic-exact-omv'), 'Adaptive filtering keeps the separately scoped exact lower bound');
const randomized = focusData['dynamic-edges'].results.find(row => row.adversary === 'adaptive' && row.randomization === 'randomized');
clickResult(edgesHost, randomized.id);
chooseScope(edgesHost, 'deterministic');
assert(!edgesHost.querySelector('.d-theorem').innerHTML.includes('randomized'), 'Deterministic filtering also resets excluded selection');
assert(!resultIds(plotHTML(edgesHost)).includes('abr2024-size') && !resultIds(plotHTML(edgesHost)).includes('dynamic-edges-cks26-rand'), 'Deterministic map excludes randomized markers');
assert(!edgesHost.querySelector('.d-specials').innerHTML.includes('beh2023-size-bipartite'), 'Separate-scope cards respect the same randomness filter');
assert(resultIds(edgesHost.querySelector('.d-specials').innerHTML).includes('dynamic-exact-omv'), 'Deterministic algorithm filtering does not erase conditional hardness evidence');
clickResult(edgesHost, 'dynamic-exact-omv');
assert(edgesHost.querySelector('.d-theorem').innerHTML.includes('d-lower-type') && edgesHost.querySelector('.d-theorem').innerHTML.includes('Conditional lower bound · exact only'), 'Inspecting the red lower-bound card keeps its exact-only scope');
chooseScope(edgesHost, 'all');
let keyPrevented = false;
edgesHost.listeners.find(event => event.type === 'keydown').listener({key: 'Enter', preventDefault() {keyPrevented = true;}, target: {closest: selector => selector === '.d-plot-result' ? {dataset: {dynamicResult: 'abr2024-size'}} : null}});
assert(keyPrevented && edgesHost.querySelector('.d-theorem').innerHTML.includes('Azarmehr'), 'Keyboard activation opens the same theorem as a plot click');

// Unmapped evidence must never gain invented coordinates. Publication filtering
// applies both to mapped results and to evidence-only records.
const publicationData = JSON.parse(JSON.stringify(focusData));
publicationData['dynamic-size'].results.push({...publicationData['dynamic-size'].results[0], id: 'fixture-preprint', publicationStatus: 'preprint'});
publicationData['dynamic-size'].results.find(row => row.id === 'abr2024-size').publicationStatus = 'preprint';
const publicationContext = {AbortController, ResizeObserver: focusContext.ResizeObserver, window: {}, document: {getElementById: () => ({textContent: JSON.stringify({focus: publicationData})})}};
vm.createContext(publicationContext);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/dynamic.js'), 'utf8'), publicationContext);
const publicationAPI = publicationContext.window.DynamicMatching;
const withPreprints = focusHost(), publishedOnly = focusHost();
const allInstance = publicationAPI.mount(withPreprints, 'dynamic-size');
const publishedInstance = publicationAPI.mount(publishedOnly, 'dynamic-size', {publication: 'published'});
assert(evidenceHTML(withPreprints).includes('fixture-preprint') && !plotHTML(withPreprints).includes('fixture-preprint'), 'Unmapped synthetic evidence is listed without invented coordinates');
assert(!evidenceHTML(publishedOnly).includes('fixture-preprint'), 'Publication filter excludes evidence-only preprints');
assert(resultIds(plotHTML(withPreprints)).includes('abr2024-size') && !resultIds(plotHTML(publishedOnly)).includes('abr2024-size'), 'Publication filter also removes mapped preprints');
assert(groupHTML(publishedOnly, 'dynamic-edges-gp13'), 'Published mapped results remain visible when another theorem is filtered');
for(const [width,height] of [[738,548],[480,356],[330,245]]){
  const preview=publicationAPI.summarySVG('dynamic-edges',width,height);
  assert(preview.includes('data-ors-result="dynamic-edges-bg24"') && preview.includes('Behnezhad–Ghafari'), 'Full-atlas detail and compact views preserve the ORS result and author label');
}
assert(!publicationAPI.summarySVG('dynamic-edges',150,100).includes('<text'), 'Overview hides ORS annotations with the rest of the chart');
assert(!resultIds(publicationAPI.diagramSVG({output:'dynamic-size'})).includes('dynamic-edges-bg24'), 'Size-only filter does not misclassify the ORS edge-maintenance theorem');
assert(!resultIds(publicationAPI.diagramSVG({scope:'deterministic'})).includes('dynamic-edges-bg24'), 'Deterministic filter removes the randomized ORS theorem');
clickResult(edgesHost,'dynamic-edges-bg24');
assert(edgesHost.querySelector('.d-theorem').innerHTML.includes('Alma Ghafari') && edgesHost.querySelector('.d-theorem').innerHTML.includes('Read paper'), 'BG24 is inspectable by its main-figure result ID with a direct paper link');
assert.notEqual(publicationAPI.summarySVG('dynamic-size', 330, 245), publicationAPI.summarySVG('dynamic-size', 330, 245, {publication: 'published'}), 'Atlas thumbnail uses the same publication-filtered point set');
allInstance.destroy(); publishedInstance.destroy();

const reused = focusHost();
realFocus.mount(reused, 'one');
const streamHandlers = [...reused.listeners];
realFocus.mount(reused, 'dynamic-size');
const dynamicObserver = observers.at(-1);
assert(streamHandlers.every(event => event.options.signal.aborted), 'Switching from streaming to dynamic releases the streaming handlers');
realFocus.mount(reused, 'two').destroy();
assert.equal(dynamicObserver.disconnects, 1, 'Switching from dynamic to streaming releases the dynamic observer');
assert(reused.listeners.every(event => event.options.signal.aborted), 'Switching renderer families and closing releases every event handler');
edgesInstance.destroy(); sizeInstance.destroy();

// LCA uses point landscapes within explicitly scoped probe contracts. Named
// symbolic cost lanes and categorical accuracy columns must not imply invented
// exponents, numerical approximation quality, or a global size-query budget.
const lcaAPI = focusContext.window.LCAMatching;
const lcaData = focusData.lca;
const lcaSlices = research.slices.filter(slice => slice.model === 'lca');
const lcaSettings = [
  ['lca', 'matching-lca-bounded-degree-nearopt', 'lca-brr23-nearoptimal-lower'],
  ['lca-nonadaptive', 'matching-lca-nonadaptive-constant', 'lca-brr23-nearoptimal-lower'],
  ['lca-maximal', 'matching-lca-bounded-degree-maximal', 'lca-gha22-maximal'],
  ['lca-adaptive', 'matching-lca-adaptive-constant', 'lca-kmnft19-constant']
];
const lcaCell = {id: 'matching:lca', p: cell.p, m: {id: 'lca', name: 'Local Computation', measure: 'Probes per local query'}};
const lcaPlot = host => host.querySelector('.l-plot-host').innerHTML;
const lcaTheorem = host => host.querySelector('.l-theorem').innerHTML;
const lcaEvidence = host => host.querySelector('.l-evidence-list').innerHTML;
function lcaClick(host, id) {
  host.listeners.find(event => event.type === 'click').listener({target: {closest: selector => selector === '[data-lca-result]' ? {dataset: {lcaResult: id}} : null}});
}
for (const [key, id, initialId] of lcaSettings) {
  context.currentSlice = lcaSlices.find(slice => slice.id === id);
  assert(context.currentSlice, `${id} retains its research route`);
  assert.equal(context.curatedKey(context.currentSlice), key, `${id} resolves to the shared LCA renderer`);
  const summaries = assertSemanticZoom((w, h) => context.plot(lcaCell, w, h), `${key} curated atlas chart`);
  for (const summary of summaries) {
    assertPointLandscape(summary, `${key} LCA atlas thumbnail`);
    assert(summary.includes('var(--green)') && summary.includes('var(--red)'), `${key} keeps algorithms green and lower bounds red at every zoom`);
    for (const panel of ['adaptive', 'history']) assert(summary.includes(`data-panel="${panel}"`), `${key} retains the ${panel} scope at every zoom`);
    assert(!summary.includes('data-beta='), 'Symbolic LCA evidence never acquires an invented numerical beta coordinate');
    assert(!/\d+ (?:results|papers)/.test(visibleText(summary)), 'LCA thumbnails omit result-count overlays');
  }
  const host = focusHost();
  context.mountDetailChart(lcaCell, context.currentSlice, host);
  assert(lcaPlot(host).includes('data-panel="nearoptimal"') && lcaPlot(host).includes('data-panel="history"'), `${key} mounts both scoped panels inside the full atlas`);
  assert(lcaTheorem(host).includes(lcaData.sources[lcaData.verifiedRecords.find(row => row.id === initialId).sourceId].title), `${key} initially inspects its corresponding theorem`);
  for (const row of lcaData.verifiedRecords) {
    assert(lcaEvidence(host).includes(`data-lca-result="${row.id}"`), `${row.id} is inspectable in the full atlas`);
  }
  context.disposeDetail();
  assert(host.listeners.every(event => event.options.signal.aborted), `${key} releases event handlers when leaving the atlas setting`);
  for (const observer of observers.filter(observer => observer.root === host)) assert.equal(observer.disconnects, 1, `${key} releases its resize observer exactly once`);
}
const lcaVisibleSettings = realFocus.settings().filter(setting => setting.type === 'lca');
assert.equal(lcaVisibleSettings.length, 1, 'The combined LCA figure has one visible setting chip');
assert.equal(lcaVisibleSettings[0].key, 'lca');
for (const [key, id] of lcaSettings) {
  const chooser = context.chartScopeHTML(lcaCell, lcaSlices.find(slice => slice.id === id), lcaSlices, key);
  assert(chooser.includes('data-slice="matching-lca-bounded-degree-nearopt" aria-pressed="true"'), `${key} activates the canonical LCA chip`);
  assert(chooser.includes('<option value="matching-lca-bounded-degree-nearopt" selected>'), `${key} selects the canonical LCA dropdown entry`);
  for (const [, alias] of lcaSettings.slice(1)) {
    assert(!chooser.includes(`data-slice="${alias}"`) && !chooser.includes(`value="${alias}"`), 'LCA aliases remain deep-linkable without redundant chart controls');
  }
}
const lcaOpened = [], lcaRouteListeners = new Map();
const lcaRouteContext = {
  cells: [lcaCell], allSlices: () => lcaSlices,
  focus: (cell, id) => lcaOpened.push([cell.id, id]),
  window: {addEventListener: (name, listener) => lcaRouteListeners.set(name, listener)}
};
vm.createContext(lcaRouteContext);
vm.runInContext(source.slice(eventStart, eventEnd), lcaRouteContext);
for (const [key, id] of lcaSettings) {
  lcaRouteListeners.get('atlas:open-setting')({detail: {sliceId: id}});
  assert.deepEqual(lcaOpened.at(-1), ['matching:lca', id], `${key} opens its exact theorem scope in the full atlas`);
}

const shahSizeUpper = lcaData.relatedResults.find(row => row.id === 'size-shah26-nonadaptive-upper');
assert(shahSizeUpper.graph.includes('simple') && !/multigraph/i.test(shahSizeUpper.graph), 'Shah non-adaptive size upper bound is retained only for verified simple graphs');
const lcaRecord = id => [...lcaData.verifiedRecords, ...lcaData.skippedRecords].find(row => row.id === id);
assert.equal(lcaData.verifiedRecords.length, 8, 'The eight requested local-output results are plotted');
assert.equal(lcaData.skippedRecords.length, 2, 'Fixed-tree sources remain archived outside the requested comparison');
assert(lcaData.verifiedRecords.every(row => !row.id.startsWith('size-')), 'Global size-query bounds are excluded from the local-output record set');
assert.equal(lcaRecord('lca-brr23-nearoptimal-lower').qualityType, 'additive', 'The near-optimal lower bound uses additive epsilon*n error');
assert.equal(lcaRecord('lca-lry15-nearoptimal').qualityType, 'multiplicative', 'The local upper bound retains its stronger multiplicative contract');
assert(lcaRecord('lca-brr23-nearoptimal-lower').graph.includes('log^4 n') && lcaRecord('lca-brr23-nearoptimal-lower').graph.includes('n^epsilon'), 'The BRR degree window remains part of its theorem scope');
assert(lcaRecord('lca-brr23-nearoptimal-lower').output.includes('partner'), 'The BRR local-query lower bound preserves its partner interface');
assert(lcaRecord('lca-abgs25-nonadaptive-lower').adaptivity.includes('non-adaptive'), 'ABGS hardness is explicitly restricted to non-adaptive probes');
assert(lcaRecord('lca-abgs25-nonadaptive-lower').output.includes('edge membership'), 'ABGS is not silently upgraded to a global size-query lower bound');
assert.equal(lcaRecord('lca-kmnft19-constant').qualityType, 'multiplicative_in_expectation', 'The unspecified constant approximation is labeled in expectation');
assert(lcaRecord('lca-gha22-maximal').queryComplexity.includes('poly(Delta)'), 'The maximal-matching theorem retains its unspecified polynomial degree dependence');
assert(lcaRecord('lca-emr14-maximal').queryComplexity.includes('Delta^{O(Delta^2)}'), 'EMR maximality retains its actual non-polynomial degree dependence');
assert(lcaRecord('lca-emr14-nearoptimal').queryComplexity.includes('2^{Delta^{O(1/epsilon)}}'), 'EMR near-optimality retains its exponential degree dependence');
for (const slice of lcaSlices) {
  for (const row of slice.results) assert(!row.plot, `${row.id} has no invented numeric LCA coordinates in the research layer`);
}

const lcaHost = focusHost();
const lcaPublicationChanges = [];
const lcaInstance = realFocus.mount(lcaHost, 'lca', {onPublicationChange: value => lcaPublicationChanges.push(value)});
const mainLcaPlot = lcaPlot(lcaHost);
assertPointLandscape(mainLcaPlot, 'Full LCA map');
assert(mainLcaPlot.includes('var(--green)') && mainLcaPlot.includes('var(--red)'), 'The full LCA map visibly combines algorithm and lower-bound colors');
assert(!mainLcaPlot.includes('data-beta=') && !mainLcaPlot.includes('NaN'), 'The main LCA figure uses valid symbolic geometry without numerical approximation coordinates');
assert(mainLcaPlot.includes('ε ≤ 0.01') && mainLcaPlot.includes('log⁴ n ≤ Δ ≤ n^ε'), 'The near-optimal lower-bound parameter window is visible in the diagram itself');
assert(mainLcaPlot.includes('Edge membership → partner') && lcaHost.innerHTML.includes('simplified bound absorbs this factor'), 'The shared near-optimal comparison discloses the edge-to-partner conversion');
const adaptivePanel = mainLcaPlot.slice(mainLcaPlot.indexOf('data-panel="adaptive"'), mainLcaPlot.indexOf('data-panel="history"'));
assert(adaptivePanel && !adaptivePanel.includes('lca-abgs25-nonadaptive-lower'), 'The non-adaptive lower bound is never projected into the adaptive panel');
const lcaGroups = svg => [...svg.matchAll(/<g\b[^>]*\bdata-lca-result="[^"]+"[^>]*>/g)].map(match => svgAttributes(match[0]));
const lcaGroupHTML = (svg, id) => [...svg.matchAll(/<g\b[^>]*\bdata-lca-result="[^"]+"[^>]*>[\s\S]*?<\/g>/g)].map(match => match[0]).find(group => svgAttributes(group.match(/^<g\b[^>]*>/)[0])['data-lca-result'] === id);
const mainLcaGroups = lcaGroups(mainLcaPlot);
for (const row of lcaData.verifiedRecords) {
  const groups = mainLcaGroups.filter(group => group['data-lca-result'] === row.id);
  assert(groups.length, `${row.id} appears as an actual point in the LCA landscape`);
  assert(groups.every(group => group['data-guarantee-family'] && group['data-resource-lane']), `${row.id} exposes its categorical accuracy and symbolic cost family`);
  pointLocation(lcaGroupHTML(mainLcaPlot, row.id));
}
const lcaFamilies = id => mainLcaGroups.filter(group => group['data-lca-result'] === id).map(group => group['data-guarantee-family']);
assert(lcaFamilies('lca-brr23-nearoptimal-lower').every(family => family === 'additive-nearoptimal'), 'BRR hardness is plotted only for additive deficit, never as beta=1-epsilon');
assert(lcaFamilies('lca-kmnft19-constant').every(family => family === 'constant-unspecified'), 'KMNFT retains its unspecified constant-quality family');
const lryGroup = lcaGroupHTML(mainLcaPlot, 'lca-lry15-nearoptimal');
const derivedPartnerTag = lryGroup.match(/<circle\b[^>]*\bdata-derived="partner"[^>]*>/)?.[0];
assert(lcaFamilies('lca-lry15-nearoptimal').includes('multiplicative-nearoptimal') && derivedPartnerTag?.includes('data-guarantee-family="additive-nearoptimal"'), 'LRY shows its original multiplicative result and the separately identified derived additive partner guarantee');
assert(derivedPartnerTag.includes('fill="var(--surface)"'), 'The LRY partner point is outlined to identify its reduction');
const lryPoint = pointLocation(lryGroup), partnerPoint = pointLocation(derivedPartnerTag), brrPoint = pointLocation(lcaGroupHTML(mainLcaPlot, 'lca-brr23-nearoptimal-lower'));
assert.equal(lryPoint.y, partnerPoint.y, 'The absorbed partner conversion preserves the displayed simplified cost family');
assert.equal(partnerPoint.x, brrPoint.x, 'LRY partner upper and BRR lower share the additive guarantee column');
assert.notEqual(lryPoint.x, partnerPoint.x, 'LRY original multiplicative and derived additive contracts remain distinct');
for (const row of lcaData.skippedRecords) {
  assert(!mainLcaPlot.includes(row.id) && !lcaEvidence(lcaHost).includes(row.id), 'Fixed-tree results are skipped in the visible LCA figure and evidence');
  for (const [w, h] of detailSizes) assert(!lcaAPI.summarySVG('lca', w, h).includes(row.id), 'Skipped fixed-tree points do not return at atlas zoom levels');
}
assert(!mainLcaPlot.includes('data-panel="nonadaptive"'), 'The removed fixed-tree panel stays absent');
for (const axes of Object.values(lcaData.figureAxes)) {
  for (const dimension of ['x', 'y']) assert(axes[dimension].label && axes[dimension].categories.length >= 2, 'Both LCA axes have recorded labels and categories');
}
assert(mainLcaPlot.includes('data-axis="x"') && mainLcaPlot.includes('data-axis="y"'), 'Both LCA axes are visibly labelled');
assert(context.axisSummary(lcaSlices[0]).includes('X:') && context.axisSummary(lcaSlices[0]).includes('Y:'), 'Full-atlas bibliography records both LCA axes');
assert(mainLcaPlot.includes('data-scope="fixed-Delta-epsilon"'), 'Historical n-dependence is restricted to fixed degree and accuracy');
assert(mainLcaPlot.includes('class="l-axis"') && mainLcaPlot.includes('class="l-grid"'), 'LCA main figure uses axes and point geometry');
for (const [width, height] of detailSizes) {
  const summary = lcaAPI.summarySVG('lca', width, height), groups = lcaGroups(summary);
  for (const row of lcaData.verifiedRecords) {
    const group = groups.find(group => group['data-lca-result'] === row.id), fullGroup = mainLcaGroups.find(group => group['data-lca-result'] === row.id);
    assert(group, `${row.id} remains visible as geometry at every atlas zoom level`);
    assert.equal(group['data-guarantee-family'], fullGroup['data-guarantee-family'], 'Atlas LCA markers preserve the focused guarantee category');
    assert.equal(group['data-resource-lane'], fullGroup['data-resource-lane'], 'Atlas LCA markers preserve the focused symbolic resource family');
    pointLocation(lcaGroupHTML(summary, row.id));
  }
}
for (const row of lcaData.verifiedRecords) {
  lcaClick(lcaHost, row.id);
  const theorem = lcaTheorem(lcaHost);
  assert(theorem.includes(lcaData.sources[row.sourceId].title), `${row.id} opens its primary-source inspection`);
  assert(theorem.includes(row.theorem), `${row.id} preserves its theorem citation`);
}
const globalSizeRows = lcaData.relatedResults.filter(row => row.id.startsWith('size-'));
assert(globalSizeRows.length > 0, 'Global size evidence remains available in a separate scope');
for (const row of globalSizeRows) {
  assert(!mainLcaPlot.includes(`data-lca-result="${row.id}"`), `${row.id} is not projected onto a per-output-query diagram`);
  if (row.evidenceStatus === 'cross_reference_verified' || row.evidenceStatus === 'needs_conversion_check') {
    assert(!lcaHost.querySelector('.l-size-results').innerHTML.includes(`data-lca-result="${row.id}"`), `${row.id} is not promoted to a primary result without a verified theorem`);
  } else {
    assert(lcaHost.querySelector('.l-size-results').innerHTML.includes(`data-lca-result="${row.id}"`), `${row.id} remains inspectable in the separate total-probe output section`);
  }
}
let lcaKeyPrevented = false;
lcaHost.listeners.find(event => event.type === 'keydown').listener({key: 'Enter', preventDefault() {lcaKeyPrevented = true;}, target: {closest: selector => selector === '.l-plot-result' ? {dataset: {lcaResult: 'lca-brr23-nearoptimal-lower'}} : null}});
assert(lcaKeyPrevented && lcaTheorem(lcaHost).includes(lcaData.sources.brr23.title), 'Keyboard activation opens the same local lower-bound theorem');
lcaHost.listeners.find(event => event.type === 'change').listener({target: {value: 'published', classList: {contains: name => name === 'l-publication-select'}}});
assert.deepEqual(lcaPublicationChanges, ['published'], 'The embedded LCA publication control reports its state to the full atlas');
assert.equal(textCount(lcaAPI.summarySVG('lca', 180, 110, {level: 'detail'})), 0, 'Explicit detail cannot force text into a tiny LCA thumbnail');
lcaInstance.destroy();

const lcaFilteredData = JSON.parse(JSON.stringify(lcaData));
lcaFilteredData.sources.brr23.publicationStatus = 'preprint';
lcaFilteredData.verifiedRecords.find(row => row.id === 'lca-brr23-nearoptimal-lower').publicationStatus = 'preprint';
lcaFilteredData.verifiedRecords.push({...lcaFilteredData.verifiedRecords[0], id: 'lca-fixture-unmapped'});
const lcaFilteredContext = {AbortController, ResizeObserver: focusContext.ResizeObserver, window: {}, document: {getElementById: () => ({textContent: JSON.stringify({focus: {lca: lcaFilteredData}})})}};
vm.createContext(lcaFilteredContext);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/lca.js'), 'utf8'), lcaFilteredContext);
const filteredLcaAPI = lcaFilteredContext.window.LCAMatching;
const lcaAllHost = focusHost(), lcaPublishedHost = focusHost();
const lcaAllInstance = filteredLcaAPI.mount(lcaAllHost, 'lca');
const lcaPublishedInstance = filteredLcaAPI.mount(lcaPublishedHost, 'lca', {publication: 'published'});
assert(lcaEvidence(lcaAllHost).includes('lca-brr23-nearoptimal-lower') && !lcaEvidence(lcaPublishedHost).includes('lca-brr23-nearoptimal-lower'), 'LCA publication filtering removes preprints from the evidence list');
assert(lcaPlot(lcaAllHost).includes('lca-brr23-nearoptimal-lower') && !lcaPlot(lcaPublishedHost).includes('lca-brr23-nearoptimal-lower'), 'LCA publication filtering removes the same lower bound from the figure');
assert(!lcaTheorem(lcaPublishedHost).includes(lcaData.sources.brr23.title), 'An excluded initial LCA theorem is replaced by an eligible result');
assert(lcaEvidence(lcaAllHost).includes('lca-fixture-unmapped') && !lcaPlot(lcaAllHost).includes('lca-fixture-unmapped'), 'Unmapped LCA evidence is inspectable without gaining invented chart coordinates');
assert.notEqual(filteredLcaAPI.summarySVG('lca', 500, 260), filteredLcaAPI.summarySVG('lca', 500, 260, {publication: 'published'}), 'The atlas LCA thumbnail observes the same publication eligibility as the focused figure');
lcaAllInstance.destroy(); lcaPublishedInstance.destroy();

const reusedLcaHost = focusHost();
realFocus.mount(reusedLcaHost, 'lca');
const lcaHandlers = [...reusedLcaHost.listeners];
realFocus.mount(reusedLcaHost, 'one');
assert(lcaHandlers.every(event => event.options.signal.aborted), 'Switching from LCA to streaming releases the LCA instance');
const streamedLcaHandlers = [...reusedLcaHost.listeners];
realFocus.mount(reusedLcaHost, 'lca');
assert(streamedLcaHandlers.every(event => event.options.signal.aborted), 'Switching from streaming to LCA releases the streaming instance');
realFocus.mount(reusedLcaHost, 'dynamic-edges').destroy();
assert(reusedLcaHost.listeners.every(event => event.options.signal.aborted), 'Closing after LCA and dynamic switches releases all handlers');

// Distributed LOCAL shares one family across atlas entry points, with explicit
// symbolic round bounds and separate maximality/approximation contracts.
context.state.cutoff = 'all';
const localAPI = focusContext.window.LocalMatching, localData = focusData.local;
const localCell = {id: 'matching:local', p: cell.p, m: {id: 'local', name: 'LOCAL', measure: 'Communication rounds'}};
const localSlices = research.slices.filter(slice => slice.model === 'local');
const localSettings = [['local', 'matching-local-maximal'], ['local-weighted', 'matching-local-weighted-approx'], ['local-congest', 'matching-local-congest-weighted']];
const localPlot = host => host.querySelector('.loc-plot-host').innerHTML;
const localTheorem = host => host.querySelector('.loc-theorem').innerHTML;
for (const [key, id] of localSettings) {
  context.currentSlice = localSlices.find(slice => slice.id === id);
  assert(context.currentSlice && context.curatedKey(context.currentSlice) === key, `${id} resolves to the LOCAL family`);
  assert.equal(realFocus.canonicalKey(key), 'local');
  const summaries = assertSemanticZoom((w, h) => context.plot(localCell, w, h), `${key} full-atlas figure`);
  for (const svg of summaries) {
    assertPointLandscape(svg, 'LOCAL full-atlas point plot');
    assert(svg.includes('var(--green)') && svg.includes('var(--red)'), 'LOCAL algorithms and lower bounds retain their colors at every zoom');
    if (textCount(svg)) {
      for (const row of localData.verifiedRecords) assert(svg.includes(`data-local-result="${row.id}"`), `${row.id} returns when atlas detail fits`);
    } else {
      const points = (svg.match(/data-local-result=/g) || []).length;
      assert(points >= 6 && points <= 8, 'Overview shows fewer representative points to avoid dense marker clusters');
    }
    assert(!/\d+ (?:results|papers)/.test(visibleText(svg)), 'LOCAL thumbnails omit count badges');
  }
  const host = focusHost();
  context.mountDetailChart(localCell, context.currentSlice, host);
  assert(localPlot(host).includes('data-panel="maximal"') && localPlot(host).includes('data-panel="approximation"'), 'Both LOCAL contracts appear in the full atlas');
  const chooser = context.chartScopeHTML(localCell, context.currentSlice, localSlices, key);
  assert(chooser.includes('<option value="matching-local-maximal" selected>'), 'LOCAL aliases select one canonical chart');
  context.disposeDetail();
  assert(host.listeners.every(event => event.options.signal.aborted), 'Leaving LOCAL releases its event handlers');
}
assert.equal(realFocus.settings().filter(setting => setting.type === 'local').length, 1, 'One visible LOCAL entry avoids duplicate combined figures');
const richLocal = localAPI.summarySVG('local', 1000, 700);
assert(textCount(richLocal) > textCount(localAPI.summarySVG('local', 500, 260)), 'Large LOCAL atlas cells restore formula tick labels');
assert(richLocal.includes('loc-summary-scope') && richLocal.includes('in expectation'), 'Readable LOCAL atlas cells retain per-theorem output and probability scope');
assert(!localAPI.summarySVG('local', 500, 260).includes('loc-summary-scope'), 'Smaller LOCAL cells remove scope notes before they overlap');
assert(richLocal.includes('log') && richLocal.includes('data-axis="y"'), 'Large LOCAL atlas cells show both resource formulas and their axis label');
const localHost = focusHost(), localChanges = [];
const localInstance = realFocus.mount(localHost, 'local', {onPublicationChange: value => localChanges.push(value)});
const localDiagram = localPlot(localHost);
assertPointLandscape(localDiagram, 'LOCAL focused map');
assert(!localDiagram.includes('data-beta='), 'LOCAL does not assign a fabricated numeric approximation coordinate');
assert(localDiagram.includes('Y · COMMUNICATION ROUNDS') && localDiagram.includes('X · RANDOMIZATION REGIME'), 'Both LOCAL axes are explicit');
assert(localHost.innerHTML.includes('lower bound does not rule out'), 'Maximality lower bounds are explicitly distinct from approximation hardness');
for (const row of localData.verifiedRecords) {
  const group = [...localDiagram.matchAll(/<g\b[^>]*\bdata-local-result="[^"]+"[^>]*>[\s\S]*?<\/g>/g)].map(m => m[0]).find(g => svgAttributes(g.match(/^<g\b[^>]*>/)[0])['data-local-result'] === row.id);
  assert(group, `${row.id} has a theorem marker`);
  pointLocation(group);
  const attrs = svgAttributes(group.match(/^<g\b[^>]*>/)[0]);
  assert(attrs['data-round-lane'] && attrs['data-randomization'], 'LOCAL marker retains round formula and randomness scope');
  localHost.listeners.find(event => event.type === 'click').listener({target: {closest: selector => selector === '[data-local-result]' ? {dataset: {localResult: row.id}} : null}});
  assert(localTheorem(localHost).includes(localData.sources[row.sourceId].title), `${row.id} opens its primary paper`);
  assert(localTheorem(localHost).includes(row.theorem), `${row.id} retains the exact theorem pointer`);
}
for (const row of localData.relatedResults) assert(!localDiagram.includes(`data-local-result="${row.id}"`), 'Restricted models stay outside the general-LOCAL axes');
const preprints = localData.verifiedRecords.filter(row => (row.publicationStatus || localData.sources[row.sourceId].publicationStatus) === 'preprint');
assert(preprints.length, 'The 2026 update is identified as a preprint');
localHost.listeners.find(event => event.type === 'change').listener({target: {value: 'published', classList: {contains: name => name === 'loc-publication-select'}}});
assert.deepEqual(localChanges, ['published']);
for (const row of preprints) {
  assert(!localPlot(localHost).includes(`data-local-result="${row.id}"`), 'Published-only filters preprints from the figure');
  assert(!localHost.querySelector('.loc-evidence-list').innerHTML.includes(`data-local-result="${row.id}"`), 'Published-only filters preprints from evidence');
  assert(!localAPI.summarySVG('local', 500, 260, {publication: 'published'}).includes(row.id), 'Published-only filters the matching atlas thumbnail');
}
localInstance.destroy();
const reusedLocalHost = focusHost();
realFocus.mount(reusedLocalHost, 'local');
const localHandlers = [...reusedLocalHost.listeners];
realFocus.mount(reusedLocalHost, 'lca');
assert(localHandlers.every(event => event.options.signal.aborted), 'Switching LOCAL to LCA releases the prior figure');
realFocus.mount(reusedLocalHost, 'local');
realFocus.mount(reusedLocalHost, 'dynamic-edges').destroy();
assert(reusedLocalHost.listeners.every(event => event.options.signal.aborted), 'Family switches release all handlers');

// MPC separates local-memory regimes and preserves conditional hardness.
context.state.cutoff = 'all';
const mpcAPI = focusContext.window.MPCMatching, mpcData = focusData.mpc;
const mpcCell = {id: 'matching:mpc', p: cell.p, m: {id: 'mpc', name: 'MPC', measure: 'Parallel rounds'}};
const mpcSlices = research.slices.filter(slice => slice.model === 'mpc');
const mpcSettings = [['mpc', 'matching-mpc-nearlinear-memory'], ['mpc-weighted', 'matching-mpc-bmatching'], ['mpc-sublinear', 'matching-mpc-sublinear-maximal'], ['mpc-mild', 'matching-mpc-mildly-sublinear-maximal']];
const mpcPlot = host => host.querySelector('.mpc-plot-host').innerHTML;
const mpcTheorem = host => host.querySelector('.mpc-theorem').innerHTML;
const mpcGroup = (svg,id) => [...svg.matchAll(/<g\b[^>]*\bdata-mpc-result="[^"]+"[^>]*>[\s\S]*?<\/g>/g)].map(m=>m[0]).find(g=>svgAttributes(g.match(/^<g\b[^>]*>/)[0])['data-mpc-result']===id);
for (const [key, id] of mpcSettings) {
  context.currentSlice = mpcSlices.find(slice => slice.id === id);
  assert(context.currentSlice && context.curatedKey(context.currentSlice) === key, `${id} opens the MPC figure`);
  assert.equal(realFocus.canonicalKey(key), 'mpc');
  const summaries = assertSemanticZoom((w,h) => context.plot(mpcCell,w,h), `${key} full-atlas figure`);
  for (const svg of summaries) {
    assertPointLandscape(svg, 'MPC full-atlas map');
    assert(svg.includes('var(--green)') && svg.includes('var(--red)'), 'MPC keeps algorithms and scoped lower bounds at every zoom');
    assert(svg.includes('data-conditional="true"') && svg.includes('component-stable'), 'Tiny MPC overview retains conditional marker semantics and accessible scope');
    if (textCount(svg)) for (const row of mpcData.verifiedRecords) assert(svg.includes(`data-mpc-result="${row.id}"`), `${row.id} returns when atlas details fit`);
  }
  const host = focusHost();
  context.mountDetailChart(mpcCell,context.currentSlice,host);
  assert(mpcPlot(host).includes('data-panel="maximal-general"') && mpcPlot(host).includes('data-panel="maximal-sparse"') && mpcPlot(host).includes('data-panel="approximate"'), 'General, sparse, and approximate contracts remain separate');
  if(key==='mpc-weighted')assert(mpcTheorem(host).includes(mpcData.sources[mpcData.verifiedRecords.find(r=>r.id==='mpc-ggm22-weighted').sourceId].title),'Weighted source route initially selects the weighted theorem');
  if(key==='mpc-mild')assert(mpcTheorem(host).includes('log log log n'),'Mild-memory route opens its separately scoped corollary');
  assert(context.chartScopeHTML(mpcCell,context.currentSlice,mpcSlices,key).includes('<option value="matching-mpc-nearlinear-memory" selected>'), 'One canonical MPC entry activates across source routes');
  context.disposeDetail();
  assert(host.listeners.every(e=>e.options.signal.aborted), 'MPC unmount releases handlers');
}
assert.equal(realFocus.settings().filter(s=>s.type==='mpc').length,1,'One visible MPC picker');
const mpcHost = focusHost(), mpcChanges=[];
const mpcInstance=realFocus.mount(mpcHost,'mpc',{onPublicationChange:value=>mpcChanges.push(value)});
const mpcDiagram=mpcPlot(mpcHost);
assertPointLandscape(mpcDiagram,'MPC focused plot');
assert(mpcDiagram.includes('data-axis="x"') && mpcDiagram.includes('data-axis="y"'),'MPC records both axes in the figure');
assert(mpcHost.innerHTML.includes('not unconditional') && mpcHost.innerHTML.includes('Mildly sublinear'), 'Conditional hardness and memory distinction are visible');
for (const row of mpcData.verifiedRecords) {
  assert(['sublinear','nearlinear'].includes(row.memoryRegime), 'Main MPC figure uses only verified memory regimes');
  assert(row.localMemory && row.totalMemory && row.theorem && row.roundComplexity,'Every MPC point records both memory resources and source theorem');
  const group=mpcGroup(mpcDiagram,row.id);assert(group,`${row.id} appears as a point`);pointLocation(group);
  const attrs=svgAttributes(group.match(/^<g\b[^>]*>/)[0]);
  assert.equal(attrs['data-memory-regime'],row.memoryRegime,'MPC marker preserves its memory contract');
  if (row.kind==='lower') {
    assert(row.conditional && row.condition && row.componentStability,'MPC lower bound assumptions cannot be dropped');
    assert.equal(row.memoryRegime,'sublinear','No lower bound is extended into the near-linear column');
    assert(group.includes('fill="var(--surface)"') && group.includes('stroke-dasharray='),'Conditional lower bounds are hollow dashed markers');
  }
  mpcHost.listeners.find(e=>e.type==='click').listener({target:{closest:selector=>selector==='[data-mpc-result]'?{dataset:{mpcResult:row.id}}:null}});
  assert(mpcTheorem(mpcHost).includes(mpcData.sources[row.sourceId].title),`${row.id} opens its primary source`);
  assert(mpcTheorem(mpcHost).includes(row.theorem),`${row.id} retains its theorem reference`);
  if (row.kind==='lower') assert(mpcTheorem(mpcHost).includes('Conditional.') && mpcTheorem(mpcHost).includes('component-stable'),'Selected MPC hardness displays its restrictions');
}
for (const row of mpcData.relatedResults) assert(!mpcDiagram.includes(`data-mpc-result="${row.id}"`),`${row.id} stays outside unrelated main axes`);
for (const svg of [mpcDiagram, ...detailSizes.map(([w,h])=>mpcAPI.summarySVG('mpc',w,h))]) {
  const upper=pointLocation(mpcGroup(svg,'mpc-ggj20-maximal')), lower=pointLocation(mpcGroup(svg,'mpc-cdp24-forest-lower'));
  assert.equal(upper.y,lower.y,'Sparse upper and conditional lower share their explicit asymptotic round lane');
  assert(Math.abs(upper.x-lower.x)>=9.9,'Coincident sparse results remain visually distinct at every zoom');
}
assert(!mpcData.verifiedRecords.some(r=>r.id==='mpc-bhh19-mild'),'Mildly sublinear memory is not promoted into the fixed-exponent memory column');
assert(!mpcSlices.find(s=>s.id==='matching-mpc-sublinear-maximal').results.some(r=>r.id==='matching-mpc-bhh23-mildsublinear'),'Research no longer misclassifies the mildly-sublinear bound');
for(const slice of mpcSlices)for(const row of slice.results)assert.equal(row.plot,null,'MPC symbolic bounds do not create invented numeric feasibility regions');
const richMpc=mpcAPI.summarySVG('mpc',738,548);
assert(richMpc.includes('mpc-summary-formula') && richMpc.includes('data-axis="y"'),'Normal enlarged atlas cell restores MPC formula ticks');
assert(textCount(richMpc)>textCount(mpcAPI.summarySVG('mpc',330,245)),'MPC has more annotations only when they fit');
mpcHost.listeners.find(e=>e.type==='change').listener({target:{value:'published',classList:{contains:n=>n==='mpc-publication-select'}}});
assert.deepEqual(mpcChanges,['published'],'MPC source filter synchronizes atlas state');
mpcInstance.destroy();
const filteredMpcData=JSON.parse(JSON.stringify(mpcData));
const mpcPreprint=filteredMpcData.verifiedRecords.find(r=>r.kind==='algorithm');
filteredMpcData.sources[mpcPreprint.sourceId].publicationStatus='preprint';
for(const row of filteredMpcData.verifiedRecords.filter(r=>r.sourceId===mpcPreprint.sourceId))row.publicationStatus='preprint';
const filteredMpcContext={AbortController,window:{},document:{getElementById:()=>({textContent:JSON.stringify({focus:{mpc:filteredMpcData}})})}};
vm.createContext(filteredMpcContext);vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/mpc.js'),'utf8'),filteredMpcContext);
const filteredMpcAPI=filteredMpcContext.window.MPCMatching;
const mpcFilteredHost=focusHost(),mpcFilteredInstance=filteredMpcAPI.mount(mpcFilteredHost,'mpc',{publication:'published'});
assert(!mpcPlot(mpcFilteredHost).includes(mpcPreprint.id) && !mpcFilteredHost.querySelector('.mpc-evidence-list').innerHTML.includes(mpcPreprint.id),'MPC filtering updates plotted and listed evidence together');
assert(!filteredMpcAPI.summarySVG('mpc',738,548,{publication:'published'}).includes(mpcPreprint.id),'MPC atlas filters the same preprint');
mpcFilteredInstance.destroy();
const mpcReused=focusHost();realFocus.mount(mpcReused,'mpc');const mpcHandlers=[...mpcReused.listeners];realFocus.mount(mpcReused,'local');
assert(mpcHandlers.every(e=>e.options.signal.aborted),'MPC-to-LOCAL switch releases previous instance');
realFocus.mount(mpcReused,'mpc');realFocus.mount(mpcReused,'one').destroy();
assert(mpcReused.listeners.every(e=>e.options.signal.aborted),'MPC family switches release every handler');


// Adjacency-list matching estimates one global size; its costs must not become
// per-LCA-query costs, numeric exponents, or a shared simple/multigraph frontier.
const queryAPI=focusContext.window.ListQueryMatching, queryData=focusData['query-list'];
const queryCell={id:'matching:query_list',p:cell.p,m:{id:'query_list',name:'Adjacency list',measure:'Total queries'}};
const querySlices=research.slices.filter(slice=>slice.model==='query_list');
const querySettings=[['query-list','matching-query-list-value-multiplicative'],['query-list-additive','matching-query-list-additive-lb'],['query-list-nonadaptive','matching-query-list-nonadaptive'],['query-list-bipartite','matching-query-list-bipartite-superlinear'],['query-list-mixed','matching-query-list-mixed-value']];
const queryPlot=host=>host.querySelector('.ql-plot-host').innerHTML;
const queryTheorem=host=>host.querySelector('.ql-theorem').innerHTML;
const queryGroup=(svg,id)=>[...svg.matchAll(/<g\b[^>]*\bdata-query-list-result="[^"]+"[^>]*>[\s\S]*?<\/g>/g)].map(m=>m[0]).find(g=>svgAttributes(g.match(/^<g\b[^>]*>/)[0])['data-query-list-result']===id);
for(const [key,id] of querySettings){
  context.currentSlice=querySlices.find(slice=>slice.id===id);
  assert(context.currentSlice && context.curatedKey(context.currentSlice)===key,`${id} opens the list-query figure`);
  assert.equal(realFocus.canonicalKey(key),'query-list');
  const summaries=assertSemanticZoom((w,h)=>context.plot(queryCell,w,h),`${key} adjacency-list atlas figure`);
  for(const svg of summaries){
    assertPointLandscape(svg,'Adjacency-list atlas plot');
    assert(svg.includes('var(--green)') && svg.includes('var(--red)'),'Both theorem kinds retain color in every adjacency-list zoom level');
    if(textCount(svg))for(const r of queryData.verifiedRecords)assert(svg.includes(`data-query-list-result="${r.id}"`),`${r.id} remains present at readable zoom`);
    else assert((svg.match(/data-query-list-result=/g)||[]).length<queryData.verifiedRecords.length,'Overview reduces the number of markers, without shrinking detailed text');
  }
  const host=focusHost();context.mountDetailChart(queryCell,context.currentSlice,host);
  for(const panel of Object.keys(queryData.axes))assert(queryPlot(host).includes(`data-panel="${panel}"`),`${panel} stays separately scoped inside the atlas`);
  const chooser=context.chartScopeHTML(queryCell,context.currentSlice,querySlices,key);
  assert(chooser.includes('<option value="matching-query-list-value-multiplicative" selected>'),'Every adjacency-list source route activates the combined chart');
  for(const [,alias] of querySettings.slice(1))assert(!chooser.includes(`value="${alias}"`),'Hidden list-query aliases do not duplicate chart controls');
  context.disposeDetail();assert(host.listeners.every(e=>e.options.signal.aborted),'Leaving an adjacency-list atlas figure releases its handlers');
}
assert.equal(realFocus.settings().filter(s=>s.type==='query_list').length,1,'Adjacency-list figure has one visible picker entry');
assert(realFocus.axisSummary('query-list').includes('total time') && realFocus.axisSummary('query-list').includes('multigraph'),'Recorded atlas axes preserve global resource and graph scope');
const queryHost=focusHost(),queryChanges=[];
const queryInstance=realFocus.mount(queryHost,'query-list',{onPublicationChange:value=>queryChanges.push(value)});
const queryDiagram=queryPlot(queryHost);
assertPointLandscape(queryDiagram,'Adjacency-list focused map');
assert.equal((queryDiagram.match(/data-axis="x"/g)||[]).length,4,'Every adjacency-list facet labels its horizontal axis');
assert.equal((queryDiagram.match(/data-axis="y"/g)||[]).length,4,'Every adjacency-list facet labels its vertical axis');
assert(!queryDiagram.includes('data-beta=') && !queryDiagram.includes('data-exponent='),'Symbolic list-query statements do not invent numeric coordinates');
assert(queryHost.innerHTML.includes('one edge-membership or partner query') && queryHost.innerHTML.includes('global maximum matching size'),'Global size and local-output query costs are explicitly distinguished');
assert(queryDiagram.includes('∀δ &gt; 0 ∃ε(δ) &gt; 0') && queryDiagram.includes('η = η(γ) &gt; 0'),'The additive and non-adaptive lower-bound quantifiers remain visible');
assert(queryDiagram.includes('Upper: simple graphs') && queryDiagram.includes('lower: multigraphs'),'Different non-adaptive graph scopes remain visible on the figure');
for(const row of queryData.verifiedRecords){
  const group=queryGroup(queryDiagram,row.id);assert(group,`${row.id} appears as an inspectable point`);pointLocation(group);
  const attrs=svgAttributes(group.match(/^<g\b[^>]*>/)[0]);
  assert.equal(attrs['data-guarantee-family'],row.qualityFamily);
  assert.equal(attrs['data-resource-lane'],row.resourceLane);
  assert(group.includes(row.kind==='lower'?'var(--red)':'var(--green)'),`${row.id} preserves bound-kind color`);
  const axes=queryData.axes[row.panel];
  assert(axes.x.categories.some(c=>c.id===row.qualityFamily) && axes.y.categories.some(c=>c.id===row.resourceLane),'Every point belongs to recorded axis categories');
  queryHost.listeners.find(e=>e.type==='click').listener({target:{closest:selector=>selector==='[data-query-list-result]'?{dataset:{queryListResult:row.id}}:null}});
  assert(queryTheorem(queryHost).includes(queryData.sources[row.sourceId].title),`${row.id} opens its primary source`);
  assert(queryTheorem(queryHost).includes(row.theorem),`${row.id} retains its exact theorem pointer`);
}
for(const row of queryData.relatedResults)assert(!queryDiagram.includes(`data-query-list-result="${row.id}"`),'Related tradeoffs stay outside the main categorical figure');
for(const slice of querySlices)for(const row of slice.results)assert.equal(row.plot,null,'Query-list research records do not fabricate a universal numeric feasibility region');
const richQuery=queryAPI.summarySVG('query-list',738,548);
assert(richQuery.includes('ql-summary-formula') && richQuery.includes('data-axis="y"'),'Normal enlarged atlas cell shows query formula ticks and axes');
assert(richQuery.includes('upper: simple / lower: multi') && richQuery.includes('∀δ &gt; 0 ∃ε(δ) &gt; 0'),'Normal atlas cells retain graph scope and quantifier distinctions');
assert(textCount(richQuery)>textCount(queryAPI.summarySVG('query-list',500,260)),'More formula detail appears only when it fits');
assert.equal(textCount(queryAPI.summarySVG('query-list',180,110,{level:'detail'})),0,'A requested detail level cannot force labels into tiny query-list cells');
let queryKeyPrevented=false;
queryHost.listeners.find(e=>e.type==='keydown').listener({key:'Enter',preventDefault(){queryKeyPrevented=true;},target:{closest:selector=>selector==='.ql-plot-result'?{dataset:{queryListResult:'list-brr24-additive-lower'}}:null}});
assert(queryKeyPrevented && queryTheorem(queryHost).includes('ε(δ)'),'Keyboard activation opens the exact additive lower-bound statement');
queryHost.listeners.find(e=>e.type==='change').listener({target:{value:'published',classList:{contains:n=>n==='ql-publication-select'}}});
assert.deepEqual(queryChanges,['published'],'Adjacency-list publication changes synchronize with the atlas');
queryInstance.destroy();
const filteredQueryData=JSON.parse(JSON.stringify(queryData)),queryPreprint=filteredQueryData.verifiedRecords.find(r=>r.id==='list-brr24-additive-lower');
filteredQueryData.sources[queryPreprint.sourceId].publicationStatus='preprint';queryPreprint.publicationStatus='preprint';
const filteredQueryContext={AbortController,window:{},document:{getElementById:()=>({textContent:JSON.stringify({focus:{'query-list':filteredQueryData}})})}};
vm.createContext(filteredQueryContext);vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/query-list.js'),'utf8'),filteredQueryContext);
const filteredQueryAPI=filteredQueryContext.window.ListQueryMatching,filteredQueryHost=focusHost();
const filteredQueryInstance=filteredQueryAPI.mount(filteredQueryHost,'query-list-additive',{publication:'published'});
assert(!queryPlot(filteredQueryHost).includes(queryPreprint.id) && !filteredQueryHost.querySelector('.ql-evidence-list').innerHTML.includes(queryPreprint.id),'Published-only removes the same adjacency-list result from plot and evidence');
assert(!filteredQueryAPI.summarySVG('query-list',738,548,{publication:'published'}).includes(queryPreprint.id),'Atlas summary applies the same publication filter');
assert(!queryTheorem(filteredQueryHost).includes(queryData.sources[queryPreprint.sourceId].title),'A filtered-out initial lower bound is replaced by an eligible theorem');
filteredQueryInstance.destroy();
for(const [otherAPI,key] of [[focusContext.window.StreamingMatching,'one'],[focusContext.window.DynamicMatching,'dynamic-edges'],[focusContext.window.LCAMatching,'lca'],[focusContext.window.LocalMatching,'local'],[focusContext.window.MPCMatching,'mpc']]){
  const host=focusHost();queryAPI.mount(host);const oldQueryHandlers=[...host.listeners];otherAPI.mount(host,key);
  assert(oldQueryHandlers.every(e=>e.options.signal.aborted),'Every direct family mount releases adjacency-list handlers');
  const otherHandlers=host.listeners.filter(e=>!e.options.signal.aborted);queryAPI.mount(host).destroy();
  assert(otherHandlers.every(e=>e.options.signal.aborted),'Adjacency-list mounting releases every other family');
}


// Independently authored problem/model pairs share the same atlas routing and lifecycle.
const pairProblems=[...new Set(pairManifest.flatMap(pair=>pair.routes.map(route=>route.problem)))];
const pairSliceMap=new Map(pairProblems.flatMap(problem=>JSON.parse(fs.readFileSync(path.join(__dirname,'../data/research',problem+'.json'),'utf8')).slices).map(slice=>[slice.id,slice]));
for(const pair of pairManifest){
  const api=focusContext.window.AtlasPairRenderers[pair.id];
  assert(api && typeof api.mount==='function' && typeof api.summarySVG==='function',`${pair.id} registers its renderer`);
  for(const route of pair.routes){
    const slice=pairSliceMap.get(route.sliceId);assert(slice,`${route.key} has a real researched slice`);
    assert.equal(realFocus.keyForSlice(route.sliceId),route.key);
    assert.equal(realFocus.canonicalKey(route.key),pair.canonicalAliases[route.key]||route.key);
    assert.equal(realFocus.settings().some(x=>x.key===route.key),route.visible,'Only visible routes enter pickers');
    assert(realFocus.axisSummary(route.key).includes('X:')&&realFocus.axisSummary(route.key).includes('Y:'),'Both axes recorded for each alias');
    if(route.visible)assert(featuredFixture.innerHTML.includes(`data-search-cell="${route.problem}:${route.model}" data-search-slice="${route.sliceId}"`),'Featured route uses real problem/model');
    context.currentSlice=slice;
    const pairCell={id:route.problem+':'+route.model,p:{id:route.problem},m:{id:route.model}};
    for(const [w,h] of [[180,110],[330,245],[500,260],[738,548]]){
      const svg=context.plot(pairCell,w,h);assertPointLandscape(svg,route.key);
      assert.equal(svg,realFocus.summarySVG(route.key,w,h,{publication:context.state.cutoff,level:context.chartDetail(w,h)}),'Full atlas delegates to the same figure');
      if(w<220)assert.equal(textCount(svg),0,'Overview has no labels or count badges');
      if(w>=650)assert(textCount(svg)>0,'Readable atlas figure restores formulas');
    }
    const host=focusHost();context.mountDetailChart(pairCell,slice,host);assert(host.innerHTML.includes('theorem'),'Full atlas mounts source inspection');context.disposeDetail();assert(host.listeners.every(e=>e.options.signal.aborted),'Leaving pair detail aborts listeners');
  }
}
// Every direction of pair/legacy switching releases the former view.
const switchKeys=['matching-query_matrix','matching-stream-turnstile','matching-dynamic','one','dynamic-edges','lca','local','mpc','query-list'];
for(const from of switchKeys)for(const to of switchKeys){
  if(from===to)continue;
  const host=focusHost();realFocus.mount(host,from);const previous=[...host.listeners];realFocus.mount(host,to).destroy();
  assert(previous.every(e=>e.options.signal.aborted),`${from} → ${to} leaves no live handlers`);
}
assert.equal(realFocus.labelForKey(null),null,'Uncurated setting labels retain their original text');
// A future non-matching pair needs only a registration entry, not another coordinator branch.
const syntheticPair={id:'fixture-mis-lca',routes:[{key:'fixture-mis-lca',sliceId:'fixture-mis-slice',problem:'mis',model:'lca',label:'MIS · local probes',visible:true}],canonicalAliases:{},axisSummary:{x:'Output guarantee',y:'Local probes'}};
const syntheticFeatured={innerHTML:''},syntheticCalls=[];
const syntheticContext={window:{AtlasPairRenderers:{'fixture-mis-lca':{mount:(...args)=>{syntheticCalls.push(args);return{destroy(){}}},summarySVG:()=>'<svg data-fixture="mis"></svg>',release(){}}}},document:{getElementById:id=>id==='featured-settings'?syntheticFeatured:{textContent:JSON.stringify({focusPairs:[syntheticPair]})}}};
vm.createContext(syntheticContext);vm.runInContext(focusSource.slice(0,bootstrap)+'\n})();',syntheticContext);
assert(syntheticFeatured.innerHTML.includes('data-search-cell="mis:lca"'),'Registry features arbitrary problem/model pairs');
assert.equal(syntheticContext.window.AtlasFocus.keyForSlice('fixture-mis-slice'),'fixture-mis-lca');
assert.equal(syntheticContext.window.AtlasFocus.summarySVG('fixture-mis-lca',180,110),'<svg data-fixture="mis"></svg>');
syntheticContext.window.AtlasFocus.mount(focusHost(),'fixture-mis-lca');assert.equal(syntheticCalls.length,1);
// Run pair-specific exact-theorem and geometry regressions against the installed modules.
for(const pair of pairManifest)require('node:child_process').execFileSync(process.execPath,[path.join(__dirname,'pairs',pair.id,'test.cjs')],{stdio:'inherit'});
console.log('Renderer regression checks passed: legacy and registered pair routes, semantic zoom, source filters, exact contracts, and cross-family lifecycle.');


// Opening the hidden atlas can resize it during an in-flight focus animation.
// Cancel the stale animation and fit the selected cell to the actual stage.
const resizeSource=source.slice(source.indexOf('  function resize(){'),source.indexOf('  const counts='));
const resizeChecks=[],resizeContext={stage:{clientWidth:1278,style:{}},raf:42,W:960,H:630,base:1,WORLD:{w:3081,h:1430},camera:{k:1},state:{selected:'matching:query_matrix',selectedSlice:'matching-query-matrix-mixed-value'},cancelAnimationFrame:id=>resizeChecks.push(['cancel',id]),selectedCell:()=>({id:'matching:query_matrix'}),focus:(cell,slice,scroll,preserve)=>resizeChecks.push(['focus',cell.id,slice,scroll,preserve]),render:()=>resizeChecks.push(['render'])};
vm.createContext(resizeContext);vm.runInContext(resizeSource+'\nresize();',resizeContext);
assert.deepEqual(resizeChecks,[['cancel',42],['focus','matching:query_matrix','matching-query-matrix-mixed-value',false,true]],'A revealed atlas cancels stale geometry and refits the selected slice without scrolling');
assert.equal(resizeContext.stage.style.height,'580px');
assert.equal(resizeContext.H,580);
resizeChecks.length=0;resizeContext.state.selected=null;vm.runInContext('resize();',resizeContext);
assert.deepEqual(resizeChecks,[['cancel',42],['render']],'Overview resize cancels the animation before laying out the grid');

// Resizing the same selection preserves the mounted view; changing settings does not.
const preserveSource=source.slice(source.indexOf('  function focus('),source.indexOf('  function fit('));
const preserveCell={id:'edge:local',x:10,y:20,p:{name:'Edge coloring'},m:{name:'LOCAL'}};
const preserveContext={state:{selected:'edge:local',selectedSlice:'bounded'},detailKey:'mounted-secondary-view',W:1280,H:580,L:{cw:390,ch:290},move(){},setLocation(){},cellResults:()=>[],allSlices:()=>[],document:{getElementById:()=>({textContent:''})},preserveCell};
vm.createContext(preserveContext);vm.runInContext(preserveSource+"\nfocus(preserveCell,'bounded',false,true);",preserveContext);
assert.equal(preserveContext.detailKey,'mounted-secondary-view','Same-cell resize retains the current chart instance and its theorem/tab state');
vm.runInContext("focus(preserveCell,'other-slice',false,true);",preserveContext);
assert.equal(preserveContext.detailKey,'','A changed slice still invalidates the mounted chart');
preserveContext.detailKey='mounted-secondary-view';
vm.runInContext("focus(preserveCell,'other-slice',false);",preserveContext);
assert.equal(preserveContext.detailKey,'','An explicit focus action still refreshes the chart');
