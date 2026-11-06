# Bipartite matching queries — 6 November 2026

Primary source: Edith Cohen and Mohammad Roghani, [Optimal LCA and Sublinear Estimation for Bipartite Matching in Δ^{O(1/ε)} Queries, arXiv v1](https://arxiv.org/abs/2611.06024v1). This is a preprint. The theorem statements, model, final work caps, estimation proof, and bipartite output projection were inspected; this is not an independent verification of the complete proof.

## Local mate queries

[Theorem 1.1(a)](https://arxiv.org/html/2611.06024v1#S1.Thmtheorem1), completed in [Section 9.3](https://arxiv.org/html/2611.06024v1#S9.SS3), gives a randomized local oracle for an integral matching on bipartite simple unweighted graphs. For known n≥2, degree bound Δ≥2, and 0<ε<1/2, every mate query uses (2Δ)^{O(1/ε)} graph queries and separately the same order of computational work, both worst case. The matching has size at least (1−ε)OPT with probability at least 0.9. Feasibility and consistency hold for every tape and every query order, including adaptive orders. A bipartition is not supplied or discovered globally.

The [Section 2.1 model](https://arxiv.org/html/2611.06024v1#S2.SS1) uses degree/indexed-neighbor queries and a shared randomness oracle. No preprocessing or persistent state is required, but random-seed length, storage and addressing are not charged. This is an adaptive-probe algorithm, not a non-adaptive algorithm. Its final worst-case budget must not be confused with the intermediate sampler's expected budget.

The existing [BRR23 Theorem 1](https://arxiv.org/html/2311.09359v1#S1.Thmtheorem1) lower-bounds partner access by Δ^{Ω(1/ε)} for additive deficit εn, even on bipartite inputs, when 0<ε≤0.01 and log⁴n≤Δ≤n^ε. The new multiplicative guarantee implies that additive target. Matching exponent order is claimed only in this window. The general integral-matching LRY bound remains in the figure.

## Total queries for size estimation

[Theorem 1.1(b) and Algorithm 7](https://arxiv.org/html/2611.06024v1#S8) give a bipartite maximum-matching-size estimate within ±εn using (2Δ)^{O(1/ε)}log(2/ζ) total queries and work, with probability at least 1−ζ. This uses fresh randomness and uniform vertex samples, not the shared-seed local oracle. The figure fixes constant confidence.

[BRR23 Theorem 2](https://arxiv.org/html/2311.09359v1#S1.Thmtheorem2) supplies the degree-dependent size-estimation lower bound in the same parameter window. The source's (1,εn) notation and a two-sided estimate can be aligned by constant-factor accuracy rescaling. Do not silently identify the exact parameter endpoints. The new panel is separate from unrestricted-degree, general-graph additive estimation.

## Output boundaries

On general graphs, the new local algorithm returns half-integral fractional weights, and the estimator targets the fractional matching optimum. These are not integral matching improvements. The deterministic LOCAL consequence likewise concerns fractional output. Those claims are recorded in the external research evidence but are not inserted into the integral figures.

## Representation and source traceability

Green and red retain algorithm and lower-bound roles. Triangles mark bipartite adaptive matching in the LCA figure, including the BRR hard-instance marker. Squares still mean non-adaptive probes. The shared symbolic Δ^{O(1/ε)} / Δ^{Ω(1/ε)} row compares exponent orders without choosing constants. The list-query figure has a separate bipartite additive panel and keeps its two cost markers at every semantic-zoom level. Public preprint filtering excludes CR26; all markers retain primary-source inspection links.
