/* Reproducible graph traces for the Behnezhad–Ghafari walkthrough.
 * Dynamic bookkeeping follows Algorithm 2. MatchAndCertify outputs are an
 * explicitly labelled small-instance contract illustration, not a replacement
 * implementation of the paper's approximation-boosting framework.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ORSWalkthrough = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const PAPER = 'https://arxiv.org/html/2404.06069v4';
  const SOURCES = {
    dynamic: {label: 'Algorithm 2 · dynamic updates', url: PAPER + '#S4.SS2.pic1.tab1'},
    sampling: {label: 'Algorithm 1 · RandomSampling', url: PAPER + '#S4.SS1.pic1.tab1'},
    certificate: {label: 'Lemma 6 · MatchAndCertify', url: PAPER + '#Thmlemma6'}
  };
  const V = Array.from({length: 16}, (_, i) => i);
  const NOTES = {
    dynamic: 'Algorithm 2 bookkeeping on 16 vertices. MatchAndCertify is a contract illustration: an exact small-graph solver supplies example outputs; the paper’s boosting routine and running time are not simulated. ε = 1/2, refresh every 4 updates, phase threshold t = 16 chosen for this lesson.',
    sampling: 'Algorithm 1 on a 16-vertex example, δ = 1/4. Samples are uniform subsets without replacement, capped by |U′|; the paper does not specify replacement. The displayed budgets are 1 and 4. This trace stops within the two printed rounds and makes no claim about the pseudocode’s final-budget convention.'
  };
  const edge = (u, v) => u < v ? u + '-' + v : v + '-' + u;
  const endpoints = e => e.split('-').map(Number);
  const sorted = iterable => Array.from(iterable).sort((a, b) => {
    const [u, v] = endpoints(a), [x, y] = endpoints(b);
    return u - x || v - y;
  });
  const list = iterable => sorted(iterable).join(', ') || '∅';
  const clone = value => JSON.parse(JSON.stringify(value));
  function greedyMatching(edges) {
    const used = new Set(), matching = [];
    for (const e of sorted(edges)) {
      const [u, v] = endpoints(e);
      if (!used.has(u) && !used.has(v)) {
        used.add(u); used.add(v); matching.push(e);
      }
    }
    return matching;
  }
  // Exhaustive dynamic programming is only the small-instance contract oracle.
  function exactMatching(edges, n = 16) {
    const adjacency = Array.from({length: n}, () => []);
    for (const e of sorted(edges)) {
      const [u, v] = endpoints(e);
      adjacency[u].push(v); adjacency[v].push(u);
    }
    const memo = new Map([[0, []]]);
    function solve(mask) {
      if (memo.has(mask)) return memo.get(mask);
      let v = 0;
      while (!(mask & (1 << v))) v++;
      const rest = mask & ~(1 << v);
      let best = solve(rest);
      for (const u of adjacency[v]) if (rest & (1 << u)) {
        const candidate = [edge(v, u), ...solve(rest & ~(1 << u))];
        if (candidate.length > best.length) best = candidate;
      }
      memo.set(mask, best);
      return best;
    }
    return sorted(solve((1 << n) - 1));
  }
  function validMatching(matching, edges) {
    const available = new Set(edges), used = new Set();
    for (const e of matching) {
      const [u, v] = endpoints(e);
      if (!available.has(e) || u === v || used.has(u) || used.has(v)) return false;
      used.add(u); used.add(v);
    }
    return true;
  }
  function dynamicTrace() {
    const epsilon = 0.5, batch = 4, phaseLength = 16;
    const edges = new Set(), add = new Set(), deleted = new Set(), cert = new Set();
    let matching = [], count = 0, update = 0, phase = 1;
    const frames = [];
    function emit(kind, title, description, extra = {}) {
      frames.push(clone({chapter: 'dynamic', kind, title, description,
        source: SOURCES.dynamic, modeNote: NOTES.dynamic, vertices: V,
        edges: sorted(edges), matching: sorted(matching), pastMatching: [],
        add: sorted(add), deleted: sorted(deleted), cert: sorted(cert),
        available: [], samples: [], activeVertex: null, activeEdge: null,
        counters: {n: 16, epsilon, batch, phaseLength, update, phaseUpdate: count,
          phase, matched: matching.length, certificates: cert.size}, ...extra}));
    }
    emit('start', 'Start with an empty graph', 'G is the live graph. The three auxiliary edge sets and the maintained matching M_G begin empty.');
    const insertions = V.slice(0, 8).map(v => edge(v, v + 8)).concat([
      '0-1', '1-2', '2-3', '3-4', '4-5', '5-6', '6-7', '0-2'
    ]);
    const events = insertions.map(e => ({type: 'insert', edge: e})).concat([
      {type: 'delete', edge: '0-8'},
      {type: 'insert', edge: '0-8'},
      {type: 'delete', edge: '1-9'},
      {type: 'insert', edge: '1-3'},
      {type: 'delete', edge: '2-10'},
      {type: 'insert', edge: '2-10'},
      {type: 'delete', edge: '3-11'},
      {type: 'insert', edge: '1-9'}
    ]);
    for (const event of events) {
      const e = event.edge;
      if (event.type === 'insert') {
        if (edges.has(e)) throw new Error('Invalid duplicate insertion: ' + e);
        edges.add(e); add.add(e); deleted.delete(e);
      } else {
        if (!edges.has(e)) throw new Error('Invalid deletion: ' + e);
        edges.delete(e); add.delete(e); matching = matching.filter(x => x !== e); deleted.add(e);
      }
      update++; count++;
      emit('update', (event.type === 'insert' ? 'Insert ' : 'Delete ') + e,
        event.type === 'insert'
          ? 'Add the edge to G and G_add; remove its deletion marker if present. M_G waits for the next refresh.'
          : 'Remove the edge from G, G_add, and M_G. Keep it in H_cert if cached; G_del prevents reuse while it is absent.',
        {event, activeEdge: e});
      if (count === phaseLength) {
        add.clear(); deleted.clear(); cert.clear(); count = 0; phase++;
        emit('phase-reset', 'Start a new phase', 'Clear G_add, G_del, and H_cert. The live graph G and current matching remain. Counter 0 triggers a refresh immediately.');
      }
      if (count % batch !== 0) continue;
      const dense = sorted([...edges].filter(e => !add.has(e)));
      const sparse = sorted(new Set([...add, ...cert].filter(e => !deleted.has(e))));
      const optimum = exactMatching(edges), sparseGreedy = greedyMatching(sparse);
      const additiveError = (epsilon / 2) * V.length;
      const useSparse = sparseGreedy.length >= optimum.length - additiveError;
      const outputMatching = useSparse ? sparseGreedy : optimum;
      const outputCertificate = useSparse ? [] : exactMatching(dense.filter(e => !sparse.includes(e)));
      const box = {
        name: 'MatchAndCertify · contract illustration',
        sourceUrl: SOURCES.certificate.url,
        input: 'E_dense = G − G_add = {' + list(dense) + '}; E_sparse = (G_add ∪ H_cert) − G_del = {' + list(sparse) + '}; accuracy ε/2 = 1/4.',
        output: '', inputEdges: sorted(new Set([...dense, ...sparse])),
        denseEdges: dense, sparseEdges: sparse, outputEdges: [], certificateEdges: [],
        implementation: 'An exact 16-vertex solver chooses valid example outputs. This box does not execute the paper’s boosting framework or model its cost.'
      };
      emit('call', 'Prepare both graph access views', 'Old live edges provide matrix access; recent and reusable edges provide list access. Their union is exactly G.',
        {source: SOURCES.certificate, dense, sparse, box, oracleOptimum: optimum.length, additiveError});
      box.output = 'M = {' + list(outputMatching) + '}; M_C = {' + list(outputCertificate) + '}. ' +
        (useSparse ? 'A sparse matching meets the displayed additive contract.' : 'The example returns dense edges as a reusable certificate.');
      box.outputEdges = outputMatching; box.certificateEdges = outputCertificate;
      emit('return', 'Receive a matching and its certificate', 'M will become the maintained answer. M_C is separate bookkeeping for future calls and the time analysis.',
        {source: SOURCES.certificate, dense, sparse, outputMatching, outputCertificate, box,
          oracleOptimum: optimum.length, additiveError, contractCase: useSparse ? 'C1' : 'C2'});
      outputCertificate.forEach(e => cert.add(e));
      matching = outputMatching;
      emit('commit', outputCertificate.length ? 'Store the certificate; publish M' : 'Publish the refreshed matching',
        outputCertificate.length
          ? 'Union M_C into H_cert. Later refreshes try these stored edges before seeking another certificate.'
          : 'Replace M_G by M. H_cert stays available, including any stale edges excluded by G_del.',
        {source: SOURCES.certificate, dense, sparse, outputMatching, outputCertificate, box,
          oracleOptimum: optimum.length, additiveError, contractCase: useSparse ? 'C1' : 'C2'});
    }
    emit('done', 'The state is ready for the next update', 'Replay the same update sequence, or open the sampling view to inspect how the paper searches an induced subgraph.');
    return frames;
  }
  function randomGenerator(seed) {
    let state = Number(seed) >>> 0;
    return function () {
      state += 0x6D2B79F5;
      let t = Math.imul(state ^ state >>> 15, 1 | state);
      t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function uniformSubset(values, k, random) {
    const copy = values.slice();
    for (let i = 0; i < Math.min(k, copy.length); i++) {
      const j = i + Math.floor(random() * (copy.length - i));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, Math.min(k, copy.length));
  }
  function samplingTrace(seed = DEFAULT_SEED) {
    seed = Number(seed) >>> 0;
    const delta = 0.25, target = delta * delta * V.length;
    const edges = V.slice(0, 8).map(v => edge(v, v + 8)), edgeSet = new Set(edges);
    const available = new Set(V), random = randomGenerator(seed), frames = [];
    let matching = [], pastMatching = [], iteration = 0, budget = 1, queries = 0;
    function emit(kind, title, description, extra = {}) {
      frames.push(clone({chapter: 'sampling', kind, title, description,
        source: SOURCES.sampling, modeNote: NOTES.sampling, vertices: V,
        edges, matching, pastMatching, add: [], deleted: [], cert: [],
        available: [...available], samples: [], activeVertex: null, activeEdge: null,
        counters: {n: 16, delta, target, seed, iteration, budget, queries,
          roundSize: matching.length, totalMatched: matching.length + pastMatching.length}, ...extra}));
    }
    emit('start', 'Choose an induced subgraph', 'Here U = V and G[U] is eight disjoint edges. Its maximum matching has size 8 ≥ δn = 4. All 16 vertices start available.');
    for (let round = 1; round <= 2; round++) {
      iteration = round;
      matching = [];
      emit('round', 'Round ' + iteration + ' · sample budget ' + budget, 'Start M_i empty. Keep U′ from the previous round; matched endpoints never return.');
      for (const v of [...available]) {
        if (!available.has(v)) continue;
        const samplePool = [...available];
        const samples = uniformSubset(samplePool, budget, random);
        emit('sample', 'Sample from U′ for vertex ' + v, 'Draw ' + samples.length + ' of the ' + samplePool.length + ' available vertices uniformly. The outer circle marks v; squares mark the sampled vertices.',
          {activeVertex: v, samples, samplePool, samplingOutcome: 'not-tested'});
        const u = samples.find(u => u !== v && edgeSet.has(edge(u, v)) && available.has(u));
        queries += samples.length;
        const found = u !== undefined;
        const probeVertex = found ? u : samples.find(u => u !== v);
        emit('query', found ? 'The sample contains a neighbor' : 'No usable edge in this sample',
          found ? 'The matrix query for ' + edge(u, v) + ' is positive and both endpoints are available.'
            : 'A sampled vertex may be a non-neighbor or v itself. Leave U′ and M_i unchanged.',
          {activeVertex: v, samples, samplePool, samplingOutcome: found ? 'hit' : 'miss',
            activeEdge: probeVertex === undefined ? null : edge(v, probeVertex),
            queryEdges: samples.map(u => edge(v, u)), hit: found});
        if (found) {
          matching.push(edge(v, u)); available.delete(v); available.delete(u);
          emit('accept', 'Keep edge ' + edge(v, u), 'Add the edge to M_i and remove both endpoints from U′. Their matched state persists while the remaining vertices are processed.',
            {activeVertex: v, samples, samplePool, activeEdge: edge(v, u), samplingOutcome: 'accepted'});
        }
      }
      emit('round-end', '|M_' + iteration + '| = ' + matching.length + ' · target ' + target,
        matching.length >= target ? 'This round meets |M_i| ≥ δ²n. Return this round’s matching.'
          : iteration < 2 ? 'This round is too small. Increase b by n^(2δ) = 4 and continue on the remaining vertices.' : 'This round is too small and the two printed rounds are exhausted.');
      if (matching.length >= target) {
        emit('result', 'Return M_' + iteration, 'The returned matching is a building block for MatchAndCertify. It is not by itself the full near-optimal dynamic answer.',
          {result: matching, success: true});
        return frames;
      }
      pastMatching = [...pastMatching, ...matching];
      if (iteration < 2) budget *= 4;
    }
    emit('no-return', 'No return in the two displayed rounds', 'This seed did not reach the target within the printed loop. Choose a different seed to inspect another trace; this demonstration does not silently add an extra round.', {success: false});
    return frames;
  }
  // A first-round miss followed by a successful second round exposes budget growth.
  const DEFAULT_SEED = 0;
  return {dynamicTrace, samplingTrace, DEFAULT_SEED, SOURCES, NOTES,
    _test: {edge, exactMatching, greedyMatching, validMatching, randomGenerator, uniformSubset}};
});
