# Graph theory atlas

## LCA matching: algorithms and lower bounds — 20 October 2026

The **LCA · matching** figure compares local matching queries under adjacency-list access. Near-optimal algorithms and lower bounds share an additive guarantee, |M| ≥ OPT − εn, and a vertex-partner output contract. LRY’s stronger multiplicative edge-membership algorithm converts to partner lookup with an extra factor Δ. Its simplified upper bound is (Δ/ε)^{O(1/ε²)} polylog n; BRR gives Δ^{Ω(1/ε)} in the stated window ε ≤ 0.01 and log⁴ n ≤ Δ ≤ n^ε. The figure uses axes, grid lines, and labeled theorem markers in separate panels. Guarantee columns and general-degree formula lanes are explicitly categorical; no numerical values are assigned to hidden exponents. The BRR window is stated directly next to its marker.

Adaptive guarantees keep their n-dependence and probability qualifiers visible. A separate full-width fixed-Δ,ε panel places four historical results on their n-dependence lanes. Both panels explicitly label X (matching guarantee) and Y (query cost); `figureAxes` records the category labels and scope notes in the source data. The fixed-tree/non-adaptive comparison is omitted from the displayed figure and evidence list, as requested; its two source records remain archived in `skippedRecords`. The exact degree dependence of the deterministic EMR results remains exponential in the theorem inspector. Theorems are selectable for precise output, oracle, accuracy, probability, and source details.

Global size estimation uses a total query budget and is shown only as related material. In particular, the 2026 non-adaptive size lower bound uses multigraphs and does not constrain the main simple-graph LCA figure. Cross-referenced results awaiting an original-theorem or conversion check are not promoted into the principal comparison.

The focused figure and full-atlas Matching × LCA cell use `src/lca.js` and `src/lca.css`, backed by `data/focus/matching-lca.json`. The four source-setting routes open the same scoped comparison; the chart chooser has one canonical LCA entry. The full-atlas thumbnail uses the same two panels and theorem coordinates. At low zoom, annotations disappear and the plotted markers remain. Build validation checks source references and complete theorem scopes, and renderer regressions check routing, scope separation, color semantics, semantic zoom, and lifecycle cleanup.

## Distributed LOCAL matching — 20 October 2026

The **LOCAL · matching** figure contains 14 principal theorems in two point-and-grid panels: exact maximality and approximation without maximality. X is the deterministic/randomized regime; Y is a set of explicitly labeled round-bound formulas. These multivariate formulas are categorical rows, not a universal ordering in n, Δ and ε. Green circles are algorithms and red diamonds are lower bounds. Lower bounds valid in both regimes have two linked points. Maximality hardness does not imply hardness for every half-approximation algorithm.

The maximal panel includes PR 2001, Fischer 2017, Ghaffari–Grunau 2023, BEPS 2012, the Fischer improvement to BEPS, Balliu et al. 2021, and Khoury–Schild 2025. The approximation panel includes Harris's weighted bounds, Ghaffari–Grunau's unweighted approximation, BCGS's expected guarantee, Davies–Peck's May 2026 preprint with its weaker success probability, and the KMW constant-factor lower bound. Restricted regular-graph statements and CONGEST results are kept in related scopes. This is a curated, source-checked comparison, not an exhaustive survey.

`data/focus/matching-local.json` records the theorem contracts and both axes. `src/local.js` and `src/local.css` render both focused and full-atlas figures. Published-only removes the preprint consistently from the plot, thumbnail and evidence. Tiny atlas cells retain point geometry without labels; large cells restore formula ticks. Narrow screens scroll the plot internally. The three source routes share one canonical LOCAL chart.

## MPC matching — 20 October 2026

The **MPC · matching** figure groups ten scoped entries in three plots: general-graph maximality, sparse-graph maximality, and approximation. Seven algorithm statements and three applications of one conditional lower-bound theorem are shown. X records per-machine memory categories; Y records symbolic round formulas. Full local and total space, graph restrictions, success probability and exact theorem citations are available by selecting a point. Four related results retain other memory and graph scopes.

Near-linear memory and strongly sublinear memory n^δ, for fixed 0<δ<1, are different columns. The BHH mildly sublinear corollary is preserved in a separate source slice and related result, including its extra log log log n round term. It is not plotted as an arbitrary fixed-exponent memory result. The main algorithms include GU 2019, CDP 2020/2021 and 2024, BHH 2019/2023, GGJ 2020, and GGM 2022. Weighted and unweighted approximation are labeled per point.

Hollow dashed red diamonds identify conditional lower bounds. CDP's Ω(log log n) theorem assumes the connectivity conjecture, strongly sublinear local memory, polynomial global space, component-stable randomized computation and the stated success requirement. Hard instances can be forests. Its maximal-matching consequences are shown in the relevant graph panels; this is not an unconditional barrier for all MPC algorithms. The component-unstable deterministic algorithm remains explicitly labeled.

`data/focus/matching-mpc.json`, `src/mpc.js` and `src/mpc.css` provide the common focused/full-atlas figure. At normal atlas focus zoom, the chart restores the actual formula tick labels; at overview it removes text. Collocated sparse upper and lower bounds remain distinct markers. The primary-source audit is a bounded update of the existing MPC settings, not an exhaustive new literature survey.

## Fully dynamic matching: edges and size — 20 October 2026

The dynamic view is a **shared two-dimensional landscape**: approximation β on the horizontal axis and update time on the vertical axis. Green marks algorithm guarantees throughout the atlas. Circles denote maintained matching edges; squares denote size estimates. Red is reserved for lower bounds, with the conditional exact-matching lower bound shown in a separately scoped card. Both dynamic entry points open this comparison, with edges-only, size-only, adaptive-safe, and deterministic filters.

The map covers 12 principal explicit-edge results and seven size results, with shared coordinates for inherited guarantees and historical BGS, BHN, BS, and BLM results. Short citations and approximation formulas appear directly beside the points. Open markers denote limiting approximation families; dotted markers denote oblivious-only results. W denotes worst-case update time; A denotes amortized (including expected amortized). Selecting a paper opens its exact update formula, conditions, reporting cost, and primary source. The review does not claim an exhaustive bibliography.

Runtime lanes are explicitly schematic asymptotic classes for fixed ε. Bounds use m≤n² and Δ≤n for the n-only envelope; original density-sensitive formulas remain in details. The approximation axis is broken before the symbolic near-optimal column. BLM has a symbolic arrow rather than an invented constant, BKS has no invented exponent, and ORS-dependent algorithms appear in a named formula panel inside both the main figure and full-atlas preview, with direct paper links. Behnezhad–Ghafari (FOCS 2024) retains the exact ORSₙ(Θ(ε²n)) parameter. Behnezhad’s stronger-than-2/3 size result is labeled **bipartite only** in a separate inset. The supplied second-slide static-query results are not mislabeled as dynamic updates.

From the full atlas, use **Dynamic · edges** or **Dynamic · size**, or open **Matching × Dynamic** and select the corresponding setting. The overview thumbnail and expanded figure use the same point data and theorem-kind colors. Zooming out progressively removes paper labels, axis annotations, and historical points; the smallest charts show only essential geometry. Result/setting count badges are removed from chart tiles. Streaming and the remaining atlas charts follow the same overview/compact/detail behavior. Accessible labels and the selected-cell details retain result counts. Publication, output, and adversary filters update the map, its citations, evidence list, and selected theorem. Narrow screens scroll the figure horizontally to preserve readable labels. Streaming figures use the same canonical green algorithm and red lower-bound palette, with sparse endpoint summaries at medium zoom and exact bounds at large zoom.

Maintaining an explicit matching is different from estimating its size, and from printing every edge after every update. Exact maximal matching is also different from exact maximum matching. Conditional exact-matching lower bounds do not shade the constant-factor approximation maps.

The combined streaming view includes general and bipartite variants, each with both pass budgets and a separately scoped greedy-first 2/3 barrier.

## Focused figures and full-atlas integration — 20 October 2026

Streaming now has **one shared figure for one-pass and at-most-two-pass results**. The horizontal axis is the guaranteed matching fraction β = |M|/OPT, with discrete pass-budget lanes: at most two passes above, one pass below. A labeled axis break omits 0.70–0.82 and enlarges the densely populated 0.48–0.70 range. The memory budget, arbitrary-order insertion-only arrivals, and explicit edge output are fixed. A general/bipartite switch changes the algorithm history while retaining lower bounds that already hold on bipartite inputs.

Green circles show algorithms; hollow circles show limiting ratios. Red diamonds and thin dashed exclusion rays show strict lower-bound ceilings. The design follows the dynamic figure with thin axes, grid lines, and citations near the exact theorem coordinates. The one-pass lane includes all six recorded milestones, and the two-pass lane includes the applicable general or bipartite milestones. Coincident results are separately selectable in the theorem panel. The restricted greedy-first 2/3 barrier, RS-conditional bounds, and exact-output tradeoffs are scoped separately below the figure.

At one pass, greedy attains 1/2 and the July 2026 Assadi–Jiang–Xiang Part II preprint excludes every fixed constant improvement. Published-only restores the published ceiling (8−2√10)/3. At two passes the (2−√2−ε) algorithm approaches its endpoint from below, while the unconditional lower bound excludes fixed ratios strictly above 8/9. Equality at the red thresholds is not ruled out.

Choose **Streaming · 1 + 2 passes** or **Streaming · bipartite** in the focused view or full atlas. Both use the same renderer, filters, and theorem details. Graph changes keep the full-atlas selection synchronized; publication changes update the thumbnail and evidence table too. The three legacy streaming source routes continue to work. The full-atlas thumbnail reuses the same axis geometry. At low zoom, both pass lanes retain only their frontier markers; labels return when there is room. Narrow screens scroll within the plot instead of squeezing the paper labels.

Focused source files: `data/focus/matching-stream*.json`, `src/streaming.js`, `src/streaming.css`, `src/focus.js`, and `src/focus.css`. Build with `python3 scripts/build.py`; run renderer regressions with `node scripts/test_renderer.cjs`. Primary-source review dates apply only to the curated settings, not the entire atlas.

A zoomable, source-linked landscape of graph algorithms and lower bounds. It currently covers matching, maximal independent set, correlation clustering, edge coloring, and vertex coloring in dynamic, streaming, local computation, LOCAL, MPC, adjacency-list query, adjacency-matrix query, and combined/other query settings. Research records were reviewed through 2026-09-27. This is a **scoped, evolving collection**, not a proof that every variant or new result has been found.

## Open or build

Open `dist/index.html` in a browser; it works offline with no server. To regenerate it after editing data or styles:

```bash
python3 scripts/build.py
```

The build validates paper references, unique IDs, complete model coverage, axis compatibility, and plotted coordinates. `python3 scripts/build.py --check` only validates. No package installation or JavaScript build tool is needed.

## Explore

The overview has one small chart for each problem × model. Counts are available in the selected-cell details and accessible labels. Search the entire atlas by paper title, author, model, assumption, or bound in the field above the landscape. Select a search result to zoom directly to its cell and setting. You can also click a chart, use a mouse wheel or pinch to zoom, and drag to pan.

Below a zoomed chart, **Research in this cell** lists every setting and every result in a structured table: evidence type, exact quality/output guarantee, exact resource formula, and primary paper/theorem. An access panel names the oracle or update interface, operations, output, and axis values. Search or filter within the cell and click a setting heading to display its chart. Settings distinguish cases such as insertion-only versus turnstile streaming and adjacency-list versus adjacency-matrix queries. Expand **Definitions & relationships** for constructions between problems.

The horizontal coordinate is the problem’s quality measure (approximation factor, or palette size for colorings); the vertical coordinate is the model’s resource (update time, space, passes, rounds, probes, or queries). Rounds and probes use named asymptotic categories. Maximality construction has no approximation axis and uses a single resource line. Green shows a reviewed achievable bound, red a reviewed lower-bound barrier, and gray a region that remains open or cannot be classified. A gray chart can still have many formula records in the table. Each colored region applies **only to the selected comparable setting**. Zoom into a cell to read the numeric ticks and scoped results; `docs/research-contract.md` defines the plotting rules.

The curated dynamic matching settings use the shared schematic landscape described above. Their source records retain exact update formulas and do not assert numeric coordinates for unknown exponents or unrelated lower bounds.

## Add a paper

Find a matching `id` in `data/research/PROBLEM.json` under `slices`. Then use:

```bash
python3 scripts/add_paper.py \
  --problem matching \
  --slice matching-stream-singlepass-insertion-explicit \
  --title "Example Paper Title" \
  --authors "First Author,Second Author" \
  --year 2027 --venue "SODA 2027" --status conference \
  --url "https://example.org/primary-paper" \
  --kind upper --bound "O(n polylog n) bits" \
  --guarantee "2-approximate explicit matching" \
  --source-location "Theorem 1.1"
python3 scripts/build.py
```

The CLI inserts a **candidate** with `plot: null`, `evidenceStatus: needs_full_text`, and `verifiedOn: review pending`. Read the actual theorem and check assumptions, update those fields, and set `frontierStatus` to `current_best_verified`, `baseline`, or `historical` only after comparing like for like. Add a new slice manually whenever the task, oracle, graph class, pass count, error mode, or adversary changes. Follow [`docs/research-contract.md`](docs/research-contract.md) for the record shape and plotting conditions.

For a new problem or model, extend `data/catalog.json`, add its corresponding research file (or coverage entries), and change `PROBLEMS` in `scripts/build.py` plus the CLI choices; the overview layout and navigation infer the new grid from data. New relationships go into `catalog.json` with their direction, transformation, overhead, and source. Run `python3 scripts/assign_axes.py` to preview candidate axis assignments without changing records. A numeric coordinate requires checking the actual paper’s parameters, access rules, and output task.

## Source layout

| Location | Purpose |
| --- | --- |
| `data/catalog.json` | Definitions, models, and problem relationships |
| `data/research/*.json` | Papers, comparable setting slices, results, evidence and bounds |
| `docs/research-contract.md` | Research and plotting rules |
| `src/index.html`, `src/style.css`, `src/app.js` | Interface source |
| `scripts/build.py` | Validate and create the standalone site |
| `scripts/add_paper.py` | Safely append a candidate paper |
| `dist/index.html` | Self-contained deployed and offline artifact |

The atlas intentionally distinguishes maximal independent set from maximum independent set, explicit matching output from matching-size estimation, χ(G) approximation from Δ-based coloring palettes, and adjacency-list from adjacency-matrix oracle access. Do not merge a conference version and an incompatible later preprint into one unqualified frontier claim. Conference acceptance and current best status are recorded separately. The source collection contains historical and baseline results to show progress and relationships, as well as reported current best bounds.
