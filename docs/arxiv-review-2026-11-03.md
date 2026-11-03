# arXiv review · 3 November 2026

The completed search covers updates from 25 October 2026, 14:03:34 UTC through 3 November 2026, 14:03:52 UTC: a seven-day overlap from the last complete checkpoint (1 November). Both cs.DS/cs.CC and the targeted related-category feeds were paginated beyond the interval boundary. The local evidence ledger records all 478 retrieved ID/version pairs and their individual dispositions; 262 required fresh screening.

## Compatible additions

Five records from two preprints join four existing figures. The primary theorem statements and computational models were inspected; the mathematical proofs were not independently verified. Source versions and preprint status remain visible, and publication filters exclude these records.

- [Behnezhad, Stochastic Matching with Polynomial Degree, 2611.03367v1](https://arxiv.org/abs/2611.03367v1): non-adaptive unweighted matching in independent uniform edge realizations. Theorem 1 gives maximum queried degree O(log(1/ε)/(p ε⁴)) for expected retained fraction 1−ε. Appendix A, Theorem 3 gives Ω(1/(p ε)) necessity, for p≤1/2 and sufficiently small ε, already on bipartite graphs. The efficient refinement in Remark 4.1 and the exact-marginal construction in Appendix B are qualified separately in details. See [the stochastic review](stochastic-matching-review-2026-11-03.md).
- [Chen, Faster Semi-Streaming and Dynamic Approximate Maximum Weight Matchings in General Graphs: A Unified Framework, 2611.02105v1](https://arxiv.org/abs/2611.02105v1): [Theorem 1.1](https://arxiv.org/html/2611.02105v1#S1.Thmlemma1) gives deterministic (1−ε)-approximate matching in arbitrary-order insertion streams. Unweighted: O(ε⁻²) passes and O(μ(G) ε⁻² log n) bits. Weighted: O(ε⁻² log(1/ε)) passes and O(μ(G) ε⁻² log² n) bits. Here μ is maximum matching cardinality; weighted inputs have positive integer weights bounded polynomially in n. Fixed ε gives semi-streaming space. [Theorem 1.4](https://arxiv.org/html/2611.02105v1#S1.Thmlemma4) is a fully dynamic weighted reduction requiring an adaptive bipartite cardinality-matching base algorithm. Its full oracle formula is shown, not just its ε overhead. Incremental and decremental guarantees remain outside the fully dynamic figure. See [the weighted review](weighted-matching-chen-review-2026-11-03.md).

The unweighted streaming point joins the existing general-graph multipass panel alongside its applicable pass lower bound. The new weighted streaming result has a deterministic diamond beside the randomized circle. Stochastic necessity remains red and non-adaptive; the dynamic reduction has its own labeled diamond category. Symbolic formula spacing does not claim numerical dominance when n, ε, p, μ, or the base algorithm differ.

## Pending setup choice and exclusions

[Ghosh–Janfaza, Square-Root Pass Semi-Streaming Algorithms for Digraph Problems, 2611.03594v1](https://arxiv.org/abs/2611.03594v1) studies proper (Δ_out+1) coloring of DAGs. The main theorem, supplied-topological-order improvement and one-pass lower bound have been reviewed. Alma was asked whether to add a separate panel, a related result, or defer it. No DAG result is published while this choice is pending. The repeated-edge multipass lower bound has a different stream contract from the no-repeat upper bounds and must stay separate.

[Mukherjee, Fluid Limits and Upper Bounds for Randomized Greedy Matching, 2611.01177v1](https://arxiv.org/abs/2611.01177v1), Theorems 1.2–1.5, gives approximation ceilings for the particular MRG and RDO algorithms. These are not general query, pass, or update lower bounds; no such transfer is plotted.

Online-only work remains deferred because Alma removed that column. The earlier colorability-testing and restricted-girth streaming exclusions persist. The fine-grained page remains archived and absent from publication. No changed version of an existing plotted bibliography paper was found in today's fresh versions.

## Validation

The full build and renderer regression suite pass, including the four affected figures, publication filters, source links, shape identities, semantic zoom and the existing algorithm walkthrough. Browser inspection covers the complete atlas overview, all four enlarged figures, narrow-screen scrolling and paper inspection. The dynamic formula footnote was moved to prevent crowding. Deployment and exact byte parity for all four live HTML pages are recorded separately in the local release evidence after publication.
