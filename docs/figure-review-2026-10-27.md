# Figure review · 27 October 2026

Review of all 54 visible problem/model pairs after removing the Combined column. This is a representation and source-navigation audit of recorded evidence, not a new exhaustive literature review. Combined research remains archived with its original access assumptions.

41 populated pairs have curated figures (52 selectable views); streaming edge coloring remains deferred by user request; 12 cells have no researched results. Empty cells remain explicitly unreviewed.

Green denotes algorithms and red denotes lower bounds. Setup colors and marker shapes have a separate legend. Incompatible output contracts and cost models retain distinct panels. Symbolic bounds are not assigned arbitrary numerical exponents.

The atlas uses text-free thumbnails, then compact axes, then an interactive figure in the same canvas area. Surrounding figures fade progressively to 8% opacity. Returning to all pairs restores full contrast.

| Problem | Model | Representation / review decision |
|---|---|---|
| Matching | Dynamic | Approximation versus update cost; edges and size distinguished by shape; symbolic ORS lane. |
| Matching | Streaming | Approximation versus pass budget; separate turnstile, bounded-deletion and arboricity views. |
| Matching | Online | Competitive fraction on aligned arrival/order/decision-rule rows. |
| Matching | Stochastic | Separate adaptive/non-adaptive panels; guarantee and query-budget formulas; necessary-budget lower-bound bands. |
| Matching | LCA | Approximation versus probe cost; symbolic degree-dependent ranges; explicit Non-adaptive tag. |
| Matching | LOCAL | Approximation versus elapsed rounds; deterministic/randomized panels and graph-class labels. |
| Matching | MPC | Rounds versus memory regime; conditional barriers retain stability/connectivity labels. |
| Matching | Adjacency list | Matching-size guarantee versus queries; access and additive-error contracts explicit. |
| Matching | Adjacency matrix | Matching-size guarantee versus queries; approximation/error contracts explicit. |
| Weighted matching | Dynamic | Unreviewed; no frontier claimed. |
| Weighted matching | Streaming | Single semi-streaming theorem baseline; axes retained pending compact-card preference. |
| Weighted matching | Online | Aligned competitive-ratio panels; edge/vertex weighting distinct. |
| Weighted matching | Stochastic | Adaptive/non-adaptive panels with weight and query-budget assumptions. |
| Weighted matching | LCA | Unreviewed; no frontier claimed. |
| Weighted matching | LOCAL | Approximation versus rounds with weight/degree dependence. |
| Weighted matching | MPC | Single near-linear-memory baseline; axes retained pending compact-card preference. |
| Weighted matching | Adjacency list | Unreviewed; no frontier claimed. |
| Weighted matching | Adjacency matrix | Unreviewed; no frontier claimed. |
| MIS | Dynamic | Output-contract rows with update cost; explicit and implicit maintenance separate. |
| MIS | Streaming | Space/round tradeoffs faceted by arrival and output contract. |
| MIS | Online | Unreviewed; no frontier claimed. |
| MIS | Stochastic | Unreviewed; no frontier claimed. |
| MIS | LCA | Symbolic probe-cost axis with setup colors; membership, size and greedy output distinguished; Non-adaptive panel. |
| MIS | LOCAL | Elapsed-round rows with deterministic/randomized setup labels. |
| MIS | MPC | Memory/round rows with graph-class colors and conditional assumptions. |
| MIS | Adjacency list | Query-cost versus independent-set size parameter; matching lower-bound range. |
| MIS | Adjacency matrix | Error ε versus queries; fixed-accuracy reference; estimation/construction distinct. |
| Correlation clustering | Dynamic | Approximation versus updates; probability/adversary and node/edge-update distinctions. |
| Correlation clustering | Streaming | Approximation/pass views for partition output; separate value-estimation view. |
| Correlation clustering | Online | Unreviewed; no frontier claimed. |
| Correlation clustering | Stochastic | Unreviewed; no frontier claimed. |
| Correlation clustering | LCA | Per-label query cost versus quality; preprocessing in details; after-preprocessing label visible. |
| Correlation clustering | LOCAL | Disagreement-minimization and agreement-maximization panels; graph families labeled. |
| Correlation clustering | MPC | Round rows with parameter/graph scope; communication-only results scoped separately. |
| Correlation clustering | Adjacency list | Positive-list cost band; negative/full signed lists remain related results. |
| Correlation clustering | Adjacency matrix | Precision tradeoffs with separate additive and mixed-error contracts. |
| Edge coloring | Dynamic | Aligned update-time and recoloring-recourse panels; palette visible. |
| Edge coloring | Streaming | Deferred by user request; archival evidence inspectable. |
| Edge coloring | Online | Unreviewed; no frontier claimed. |
| Edge coloring | Stochastic | Unreviewed; no frontier claimed. |
| Edge coloring | LCA | Prominently labeled direct line-graph-oracle baseline. |
| Edge coloring | LOCAL | Bounded-degree palette/round comparison; separate multigraph view. |
| Edge coloring | MPC | Memory/round rows with stability and expensive-local-computation labels. |
| Edge coloring | Adjacency list | Shared O(n+m) query cost versus palette; computation in details. |
| Edge coloring | Adjacency matrix | Matrix-scan baseline; no invented query improvement. |
| Vertex coloring | Dynamic | Palette/update-cost rows with distinct adversaries. |
| Vertex coloring | Streaming | Separate construction and chromatic-gap decision views. |
| Vertex coloring | Online | Unreviewed; no frontier claimed. |
| Vertex coloring | Stochastic | Unreviewed; no frontier claimed. |
| Vertex coloring | LCA | Probe formulas by setup; random k-colorable graphs as related card. |
| Vertex coloring | LOCAL | Palette/round rows with variable Δ and bounded-degree reference. |
| Vertex coloring | MPC | Memory/round comparison with distinct degeneracy row. |
| Vertex coloring | Adjacency list | Neighbor-scan query baseline; computation in details. |
| Vertex coloring | Adjacency matrix | k-dependent query tradeoff with constant-k reference and valid-parameter range. |

## Changes resulting from the review

- Removed repeated deterministic/randomized and memory-axis labels from compact matching LOCAL/MPC panels to prevent collisions with the next panel title. Full figures retain their labels.
- Reduced setup-outline widths on streaming correlation-clustering thumbnails so green algorithm markers remain recognizable.
- Added paper access to every recorded result-marker identity in focused figures, embedded atlas figures, generic charts and fine-grained update plots. Coincident records from the same paper share one source card.
- Added 25 title-matched arXiv identities verified against official arXiv metadata. 388 of 430 focused marker instances have a recorded direct arXiv URL. Other papers retain their cited source plus an explicitly labeled arXiv title search; no identifier is guessed.

## Validation

`scripts/test_navigation_sources.cjs` checks 54 visible cells, 52 routes, all 430 marker identities, finite geometry at overview/compact/detail sizes, text-free overview, fading/restoration, hidden-column exclusion, and fine-grained source identities. The complete existing renderer suite also passes.

Browser review covers the six problem-family galleries, continuous atlas focus and return, keyboard source-card access, duplicate-paper grouping, fine-grained source cards, narrow layouts, and browser error logs. Deployment evidence is retained in the release records.

The optional compact-card preference for single-result pairs remains open; existing one-point figures are retained meanwhile.
