# Graph theory atlas

An interactive, source-linked atlas of graph algorithms and lower bounds. Explore matching, weighted matching, maximal independent set, correlation clustering, edge coloring, and vertex coloring across ten computational models, including Online and Stochastic.

Algorithms are green; lower bounds are red. Select a result for its theorem, assumptions, output contract, and primary paper. Zooming out removes detail while preserving the shape of each comparison.

## View the atlas

Open the **[live atlas](https://almaho.github.io/theory-atlas/#atlas)**, or use [the standalone HTML](dist/index.html) offline. Source and history are in [almaho/theory-atlas](https://github.com/almaho/theory-atlas).

The separate **[fine-grained complexity page](https://almaho.github.io/theory-atlas/fine-grained.html)** has 22 problems and 20 directed reductions. It includes a connection map, a bounds atlas, and an **[update-time figure](https://almaho.github.io/theory-atlas/fine-grained.html#updates)** for seven fully dynamic graph contracts. The dynamic figure has only update time on its axis, with separate fixed-pair and arbitrary-pair query guarantees. Its dense-scale reference evaluates algorithm costs at m=Θ(n²), while lower-bound instances may be sparse. Every red region is conditional on ordinary Boolean OMv and the displayed query budget; stronger hinted-OMv barriers are not imported. Toggle the map between algorithmic consequences and reduction direction, then inspect each arrow’s input transformation, exponent accounting, theorem, and source.

The October 2026 APSP/3SUM preprints are labeled claims, with their theorem statements inspected but proofs not independently verified here. Historical conditional implications remain distinct from the status of their premises. The displayed algorithm baselines are not asserted to be current best bounds.

## Run locally

Python 3 and Node.js 24 are sufficient; no package installation is required.

```sh
python3 scripts/build.py
node scripts/test_renderer.cjs
python3 -m http.server 8765 --bind 127.0.0.1
```

Then open `http://127.0.0.1:8765/dist/#atlas`.

## Current scope

The atlas has 60 problem/model cells. The original researched queue covered 36 completed pairs; new online and stochastic figures extend that collection. Streaming edge coloring was deferred. Cells without a completed source review are explicitly labeled, including the weighted-matching cells outside reviewed Online, Stochastic, LOCAL, MPC and Streaming setups.

This is an evolving research collection, not an exhaustive bibliography. Review dates and qualifications belong to individual settings and sources. Incompatible graph classes, output contracts, probability guarantees, and resource models remain visibly distinguished.

The dynamic-matching figure includes Behnezhad–Ghafari’s **Fully Dynamic Matching and Ordered Ruzsa-Szemerédi Graphs** (FOCS 2024) in its main ORS-dependent algorithm panel, together with subsequent work. Its parameter-dependent update cost is shown explicitly in both focused and full-atlas views.

## Iterate

1. Edit the relevant records in `data/research/` and the corresponding curated figure data in `data/focus/`.
2. Keep theorem assumptions and source links attached to each result.
3. Update the renderer in `src/` when its representation changes.
4. Run the build and renderer checks; inspect both the focused figure and full atlas.
5. Commit the verified source and rebuilt `dist/` on `main`, then run `python3 scripts/publish.py`. The command checks the committed build, pushes the source, and publishes `dist/` to the `gh-pages` branch. GitHub Pages updates the live site from that branch.

The optional [Actions workflow example](docs/pages-workflow-example.yml) can later replace branch publishing if workflow authorization is enabled.

See [the research contract](docs/research-contract.md) for data rules and [figure notes](docs/figure-notes.md) for detailed design and source-history notes.

## Source layout

| Path | Contents |
| --- | --- |
| `data/catalog.json` | Problems, models, definitions, and relationships |
| `data/research/` | Papers, result records, and comparable scopes |
| `data/focus/` | Curated figure data and theorem inspections |
| `data/fine-grained.json` | Scoped problems, conditional bounds, source status, directed reductions |
| `src/` | Shared interface and figure renderers |
| `scripts/build.py` | Validation and standalone HTML build |
| `scripts/test_renderer.cjs` | Renderer and scope regressions |
| `dist/index.html` | Self-contained website and offline artifact |
| `dist/fine-grained.html` | Self-contained fine-grained complexity page |

Daily arXiv review is scheduled through the current Codex chat at 09:00 America/New_York. [The update policy](docs/arxiv-update-policy.md) records the user-authorized verification and publication process. Its persistent checkpoint is `../arxiv-monitor-state.json`; the first scheduled search is separate from the source review that produced this release.

Stochastic matching includes adaptive and non-adaptive edge testing, historical and near-optimal algorithms, and necessary query budgets. Maximum degree and expected normalized total queries remain separate. Correlation clustering in LOCAL includes separate minimum-disagreement and maximum-agreement panels with explicit graph and communication setups.
