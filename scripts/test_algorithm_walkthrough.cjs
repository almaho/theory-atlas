'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const engine = require('../src/ors-walkthrough-engine.js');
const {validMatching, exactMatching, edge} = engine._test;
const dynamic = engine.dynamicTrace();
assert.deepEqual(dynamic, engine.dynamicTrace(), 'Dynamic replay must reproduce every state');
function baseChecks(trace) {
  for (const frame of trace) {
    assert.equal(frame.vertices.length, 16);
    assert.equal(new Set(frame.edges).size, frame.edges.length);
    assert(validMatching(frame.matching, frame.edges), `${frame.kind}: invalid displayed matching`);
    assert(validMatching(frame.pastMatching, frame.edges), `${frame.kind}: invalid retained matching`);
    assert(frame.source.url.startsWith('https://arxiv.org/html/2404.06069v4#'));
    assert(frame.title && frame.description && frame.modeNote);
    for (const e of frame.edges) {
      const [u, v] = e.split('-').map(Number);
      assert(u < v && u >= 0 && v < 16, 'Graph is simple and undirected');
      assert.equal(edge(u, v), e);
    }
  }
}
baseChecks(dynamic);
assert.equal(dynamic.filter(f => f.kind === 'update').length, 24);
let previous = dynamic[0];
for (const f of dynamic.slice(1)) {
  if (f.kind === 'update') {
    const e = f.event.edge, inserted = f.event.type === 'insert';
    const expectedEdges = new Set(previous.edges), expectedAdd = new Set(previous.add), expectedDeleted = new Set(previous.deleted);
    if (inserted) {expectedEdges.add(e); expectedAdd.add(e); expectedDeleted.delete(e);}
    else {expectedEdges.delete(e); expectedAdd.delete(e); expectedDeleted.add(e);}
    assert.deepEqual(new Set(f.edges), expectedEdges);
    assert.deepEqual(new Set(f.add), expectedAdd);
    assert.deepEqual(new Set(f.deleted), expectedDeleted);
    assert.deepEqual(f.cert, previous.cert, 'Updates do not erase certificate cache');
    assert.deepEqual(f.matching, inserted ? previous.matching : previous.matching.filter(x => x !== e));
    assert.equal(f.counters.phaseUpdate, previous.counters.phaseUpdate + 1);
  }
  if (f.kind === 'phase-reset') {
    assert.equal(previous.counters.phaseUpdate, 16);
    assert.equal(f.counters.phaseUpdate, 0);
    for (const key of ['add', 'deleted', 'cert']) assert.deepEqual(f[key], []);
    assert.deepEqual(f.edges, previous.edges);
    assert.deepEqual(f.matching, previous.matching);
  }
  if (f.kind === 'call') {
    assert.equal(f.counters.phaseUpdate % 4, 0);
    assert.deepEqual(new Set([...f.dense, ...f.sparse]), new Set(f.edges), 'Access views cover exactly the live graph');
    assert.deepEqual(new Set(f.dense), new Set(f.edges.filter(e => !f.add.includes(e))));
    assert.deepEqual(new Set(f.sparse), new Set([...f.add, ...f.cert].filter(e => !f.deleted.includes(e))));
    assert.match(f.box.implementation, /does not execute/);
    assert.match(f.box.name, /contract illustration/);
    assert.equal(f.box.outputEdges.length, 0, 'Do not expose oracle output before its return frame');
    assert.deepEqual(new Set(f.box.inputEdges), new Set(f.edges));
  }
  if (f.kind === 'return') {
    assert(validMatching(f.outputMatching, f.edges));
    assert(validMatching(f.outputCertificate, f.dense));
    assert(f.outputCertificate.every(e => !f.sparse.includes(e)), 'Certificate excludes sparse access edges');
    assert(f.outputMatching.length >= exactMatching(f.edges).length - f.additiveError);
    assert.deepEqual(f.matching, previous.matching, 'Oracle return must not prematurely replace M_G');
    assert.deepEqual(f.box.outputEdges, f.outputMatching);
    assert.deepEqual(f.box.certificateEdges, f.outputCertificate);
  }
  if (f.kind === 'commit') {
    assert.equal(previous.kind, 'return');
    assert.deepEqual(f.matching, previous.outputMatching);
    assert.deepEqual(new Set(f.cert), new Set([...previous.cert, ...previous.outputCertificate]));
  }
  previous = f;
}
const deletedCached = dynamic.find(f => f.kind === 'update' && f.counters.update === 17);
assert(deletedCached.deleted.includes('0-8') && deletedCached.cert.includes('0-8') && !deletedCached.edges.includes('0-8'));
const reinserted = dynamic.find(f => f.kind === 'update' && f.counters.update === 18);
assert(!reinserted.deleted.includes('0-8') && reinserted.add.includes('0-8') && reinserted.edges.includes('0-8'));
const refreshed = dynamic.find(f => f.kind === 'call' && f.counters.update === 20);
assert(refreshed.cert.includes('1-9') && !refreshed.sparse.includes('1-9'), 'Cached deleted edges must be filtered from sparse input');
assert(dynamic.some(f => f.kind === 'return' && f.contractCase === 'C2' && f.outputCertificate.length > 0));
assert(dynamic.some(f => f.kind === 'call' && f.counters.update > 16 && f.sparse.some(e => f.cert.includes(e))));
const sampling = engine.samplingTrace();
assert.deepEqual(sampling, engine.samplingTrace(engine.DEFAULT_SEED), 'Replay preserves all sampled vertices');
assert.notDeepEqual(sampling, engine.samplingTrace(engine.DEFAULT_SEED + 1), 'Changing seed must produce a new trace');
assert.equal(sampling.at(-1).kind, 'result');
assert.equal(sampling.at(-1).counters.iteration, 2, 'Default lesson shows budget growth');
assert(sampling.some(f => f.kind === 'round-end' && f.counters.iteration === 1 && f.matching.length === 0));
for (let seed = 0; seed < 100; seed++) {
  const trace = engine.samplingTrace(seed);
  baseChecks(trace);
  let prior = trace[0];
  for (const f of trace.slice(1)) {
    assert(f.counters.iteration <= 2, 'Do not silently extend the printed round limit');
    if (f.kind === 'sample') {
      assert.deepEqual(f.available, f.samplePool);
      assert(f.samples.every(v => f.available.includes(v)));
      assert.equal(new Set(f.samples).size, f.samples.length, 'Sampling convention is without replacement');
      assert.equal(f.samples.length, Math.min(f.counters.budget, f.available.length));
      assert(f.available.includes(f.activeVertex));
    }
    if (f.kind === 'accept') {
      assert.equal(prior.kind, 'query');
      assert(prior.hit);
      const [u, v] = f.activeEdge.split('-').map(Number);
      assert(prior.available.includes(u) && prior.available.includes(v));
      assert(prior.samples.includes(u) || prior.samples.includes(v));
      assert.deepEqual(new Set(f.available), new Set(prior.available.filter(x => x !== u && x !== v)));
      assert.equal(f.matching.length, prior.matching.length + 1);
    }
    if (f.kind === 'query' && !f.hit) assert.deepEqual(f.available, prior.available);
    if (f.kind === 'result') {
      assert(f.matching.length >= f.counters.target);
      assert.deepEqual(f.result, f.matching);
      assert(validMatching(f.result, f.edges));
    }
    prior = f;
  }
  assert(['result', 'no-return'].includes(trace.at(-1).kind), 'Trace must report its actual terminal state');
}
// Frames must be independent snapshots: stepping backward cannot mutate earlier state.
const edited = engine.dynamicTrace();
edited[1].edges.push('0-15');
assert.deepEqual(edited[0].edges, []);
const browser = {window: {}};
vm.runInNewContext(fs.readFileSync(path.join(root, 'src/ors-walkthrough-engine.js'), 'utf8'), browser);
assert.equal(typeof browser.window.ORSWalkthrough.dynamicTrace, 'function');
console.log('Algorithm walkthrough: 45 dynamic frames, source-linked contracts, update/reset/cache invariants, and 100 seeded sampling traces verified.');
