# Stochastic matching review · 3 November 2026

Source: Soheil Behnezhad, [Stochastic Matching with Polynomial Degree, arXiv:2611.03367v1](https://arxiv.org/abs/2611.03367v1), submitted 2 November 2026. Preprint; primary theorem/model statements and algorithm inspected, proof not independently verified.

## Compatible additions

[Theorem 1 and Algorithm 1](https://arxiv.org/html/2611.03367v1#Thmtheorem1): on a known finite simple undirected unweighted graph with uniform independent edge-survival probability p∈(0,1], sample-and-union chooses H before observing the test realization. Its maximum degree is O(log(1/ε)/(p ε⁴)); E μ(H∩Gₚ) ≥ (1−ε) E μ(Gₚ). Expectation includes simulations and test realization. This is not a per-realization or high-probability approximation statement. The plotted budget counts maximum queried degree, not total computation.

[Appendix A, Theorem 3](https://arxiv.org/html/2611.03367v1#Thmtheorem3): for every p∈(0,1/2] and sufficiently small ε, bipartite hard instances require Ω(1/(p ε)) maximum degree. Randomized bounded-degree sparsifiers independent of the test realization are included. This does not constrain adaptive testing.

[Remark 4.1](https://arxiv.org/html/2611.03367v1#S4) states that refining the analysis of the same efficient sample-and-union algorithm gives O(log(1/ε)·(1/(p ε²)+1/ε³)). This is recorded in details; the plotted point retains numbered Theorem 1.

[Appendix B](https://arxiv.org/html/2611.03367v1#A2) describes O(1/(p ε²)+1/ε³) using exact edge-selection marginals and explicitly claims no efficient exact computation of those marginals. It is qualified in theorem details, not substituted for the efficient sample-and-union point.

## Representation and checks

Two preprint rows join the existing unweighted non-adaptive near-optimal setting: green circle for the algorithm and red budget annotation for necessity. The algorithm gets its own symbolic formula band; no hidden big-O constant is assigned a numeric coordinate. Published-only filtering removes both new rows. Historical algorithms and the earlier small-p lower bound remain visible with their own assumptions.

Pair tests cover all 29 records and 13 sources, 18 thumbnail geometries, source filters, theorem inspection, and new ε/graph/model restrictions. Full build and browser review belong to the parent release workflow.
