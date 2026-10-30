# Daily arXiv review — 30 October 2026

## Retrieval

Searched updated-order cs.DS/cs.CC and targeted related categories with seven-day overlap, from 22 October 13:07:52 UTC through 30 October 13:31:36 UTC. Core required two 200-entry pages; related search one. Both passed the dated boundary. Deduplicated total: 321 ID/version records; 115 not in the previous completed ledger. Raw feeds and every disposition are retained in ../arxiv-2026-10-30-review.json. Two bibliography matches were unchanged versions. No claim of independent proof certification.

## Integrated

[Assadi–Yazdanyar, arXiv:2610.38787v1](https://arxiv.org/html/2610.38787v1), Theorem 1, §2, §4.4–4.5 and §5.4: explicit fully dynamic (Δ+1)-coloring, O(√n log³n) amortized update time with high probability. Fixed n, initially empty graph, known fixed degree bound; adaptive adversary may inspect past random choices. Analysis covers polynomially many updates. Small degrees use greedy O(Δ). No constant recourse or separate query guarantee is asserted. The √n technique discussion is not a lower bound.

New green preprint point in the adaptive/amortized column; Gil–Halldórsson's worst-case point and recourse-three claim stay separate. Label to appear SODA 2027, still preprint. Statement/model checked, not independently proof-certified.

## Reviewed, awaiting setup choices

- [Xu, 2610.31489v2](https://arxiv.org/html/2610.31489v2), Theorem1.1/§2/Proposition7.2: dense k-colorability property testing. O(k log k/ε) uniformly sampled vertices; reading induced pairs gives derived O(min(n²,k²log²k/ε²)) queries. Always accepts k-colorable graphs, rejects εn²-edge-deletion-far graphs with probability≥2/3; no full coloring. Sample lower bounds must not be squared into matrix-query lower bounds. V2 changes the title; checked main statement unchanged.
- [Dhawan–Methuku–Vo, 2606.18048v3](https://arxiv.org/html/2606.18048v3), Corollary1.10/§7.2: k=2 gives girth≥5 graphs, one insertion-only pass, palette max{(1+ε)Δ/(γlogΔ), C′√log n}, Õ(nΔ^{2γ}) space, final coloring success≥1−1/n; fixed ε>0, γ∈(0,1), largeΔ. Polynomial postprocessing; source does not specify bit/word space convention. No distributed LOCAL theorem inferred. V2-to-v3 statement unchanged.
- [2609.18635v2](https://arxiv.org/html/2609.18635v2), Theorem1.2/§4.1 and AppendixA: maximum-size independent set, not maximal MIS. Deterministic one-pass insertion-deletion lower Ω(n²/(βlog n)) bits, 1≤β≤√n/(36log n), paired with O(n²/β)-bit deterministic algorithm using unrestricted computation. V1's broader β<n/log n range was narrowed after proof errors. This paper was absent from the site, so no plotted correction was needed. Do not assert an insertion-only lower bound from this review.

Alma was asked whether these belong in separate panels or related-result cards. None is plotted while that decision is pending.

## Related research outside current resource axes

[Li–Li–Zhang, 2610.40591v1](https://arxiv.org/html/2610.40591v1), Theorem1: randomized combinatorial exact general-graph matching in n^{2+o(1)} time WHP. [Inoue et al., 2610.39753v1](https://arxiv.org/html/2610.39753v1), Theorem1/§3/Lemma11: deterministic planar4-coloring in O(n) word-RAM time. These are static CPU-time advances. No new CPU-time column was introduced and their runtimes are not mislabeled as improved query counts.

Induced matching, label-tree constrained explainable clustering, graphon limits and structural coloring statements remain outside the current objective/resource comparisons. Fine-grained source remains untouched and unpublished.

## Verification

Vertex-dynamic regression checks include the new preprint, fixed degree, initial graph, polynomial-length sequence and separation from worst-case/recourse guarantees. Full publish regression, browser theorem/source click, published-only filter, selected full-atlas chart and text-free overview are required before release. Live parity and deployment evidence are recorded in ../current-release-evidence.json.
