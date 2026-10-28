# Online and stochastic expansion — 27 October 2026

Eight cells were added with 42 main theorem records and one related output/runtime variant. Research was independently checked by three subagents, then data fields, source links and figures were reviewed together. This is a bounded review, not an exhaustive frontier claim.

| Pair | Representation | Important scope |
| --- | --- | --- |
| Online × MIS | Zero-revision maximality; symbolic maximum-size ratio versus neighborhood independence ζ | User selected both objectives. Greedy maximality is an elementary consequence of vertex-arrival greedy. Maximum-size results are a 2026 preprint. |
| Online × correlation clustering | Separate disagreement ratio, agreement fraction, random-order Pivot, and per-vertex recourse panels | Merge-only may merge whole clusters but never split. Recourse counts moves per vertex across the entire sequence, not moves per arrival. |
| Online × edge coloring | Limiting palette ratio q/Δ, separated arrival models and degree knowledge | Unknown final degree still requires a known sufficiently large lower bound for the CPW algorithm. No adaptive claim is added to CPW. |
| Online × vertex coloring | Bipartite log₂n coefficients; symbolic k=4 and random-order panels | KYY v2 uses1.034, not1.027. Random-order result has exponential computation. Preprint labels remain explicit. |
| Stochastic × MIS | Expected parallel-greedy iterations; normalized density for fixed-radius local maximum IS | The red iteration bounds constrain one prescribed algorithm. The red density bound constrains a local algorithm class. Neither is a universal MIS complexity barrier. |
| Stochastic × correlation clustering | Fixed-noise tight query reference, then full noise/cluster-count formulas | Persistent noise across repeated queries; correct probability(1+δ)/2. Large-cluster recovery and exact-recovery lower bounds have distinct promises. |
| Stochastic × edge coloring | Failure exponent for Δ-coloring G(n,1/2) | Red is unavoidable infeasibility on class-2 inputs, not computational runtime hardness. Algorithm takes O(n⁴). |
| Stochastic × vertex coloring | Fixed-k semirandom density reference | Planted balanced classes, random cross-part edges, adversarial additions only. Red assumes NP is not contained in RP. |

Each focus file records primary sources, exact theorem locators, graph/output/probability conditions and source-review dates. The eight registrations and research patches are in scripts/pairs/. Exact formulas appear beside focus markers; zoomed-out summaries remove detail before text becomes cramped.

## Derivations and verification caveats

- Online greedy maintains maximality without revisions: each rejected vertex has an accepted neighbor that remains accepted. Tests exhaust every graph on five labeled vertices and every prefix; relabeling covers arrival orders.
- Online random-order Pivot implements the random-pivot process via the first positive existing pivot. The original expectation theorem and later explicit online interpretation are identified.
- The precise LST bipartite coefficient is inspected in KYY Theorems3.14/5.1. The original LST paper and later exact-formula verification are separate links; the latter is not mislabeled as the original source.
- No arXiv identifier is guessed for older primary PDFs. The universal paper card offers a primary source and an explicitly labeled title search where needed.
- CFK Theorem1 restates Calkin–Frieze; Theorem2 supplies complementary iteration bounds. The graph is supplied, unlike joint random-graph generation. The joint generator remains in its existing LCA related-result card.
- Xia–Huang's balanced k=2 lower bound is a conditioning corollary of §5's independent fair-label distribution. Both clusters lie in[n/3,2n/3] except with probability≤2exp(−n/18). Success15/16 leaves slack above the theorem's7/8. Truncation at n² queries gives o(1) extra failure for any hypothetical o(nlogn)-query method, and negligible off-promise expected work. The source theorem is not asserted verbatim for balanced inputs.
- The full noisy-query upper recovers only clusters≥Ω(k⁴logn/δ²). The lower is displayed only for0<δ<1/8; it is not extrapolated to noiseless queries.
- Semirandom coloring reference fixes k≥3 with k dividing n. Exact variable-k formulas remain visible; unknown constants are not assigned numerical locations.

## Validation

Full renderer regression includes all eight new figures, seven sizes per figure, text-free overview, source filtering, theorem inspection, keyboard and lifecycle checks. All472 focused result identities resolve;418 have directly recorded arXiv links. Exact scope guards cover maximal versus maximum IS, expected versus worst-case recourse, preprint coefficients, exponential local computation, restricted-algorithm lower bounds, and noisy-recovery success conditions.

Desktop browser checks opened all eight figures inside the full atlas. Every main marker was present, no text extended beyond its SVG, and no page overflow was observed. Compact summaries were inspected together. Mobile/source-link checks and live byte parity are recorded in work/current-release-evidence.json when the release is published.
