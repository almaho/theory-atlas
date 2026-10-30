# Weighted matching × fully dynamic — 30 October 2026

The formerly empty cell now separates approximate maintained edges from exact optimum-weight queries. Nine main points, four related contracts, seven primary sources; bounded review, not an exhaustive frontier.

Primary statements checked:
- [Gupta–Peng, FOCS 2013](https://arxiv.org/abs/1304.0378): Theorem 1.3 and §4.2. Deterministic worst-case near-optimal weighted matching; fixed-accuracy O(√m log R), exponential accuracy dependence. Reparameterize η=ε/(1−ε).
- [Bernstein–Dudeja–Langley, STOC 2021](https://aditidudeja.github.io/weightedMatching.pdf): Theorems 5.11–5.12. General weighted: 1/2−ε randomized adaptive-adversary worst-case high-probability time; 2/3−ε deterministic amortized. R is aspect ratio. No arXiv ID verified; author PDF and DOI supplied.
- [Bernstein–Chen–Dudeja–Langley–Sidford–Tu, SODA 2025](https://arxiv.org/abs/2410.18936): v2 Lemma 6.7, Theorem 3.5, §2. Explicit near-optimal matching, polynomial ε cost and weight range; amortized time.
- [Bernstein–Chen, 2025 preprint](https://arxiv.org/abs/2510.19049): v1 Corollaries 1.3/1.5, Theorems 1.1/6.5. General weighted to bipartite cardinality reduction, randomized adaptive amortized. ORS-dependent formula separate with parameters explicit.
- [Chen, 2026 preprint](https://arxiv.org/abs/2608.27805): v2 Corollaries 3.5/4.14/4.17, Theorem 4.15. Separate value estimates, explicit matchings, degree/arboricity bounds.
- [Gabow](https://arxiv.org/abs/1611.07541): introduction, §§2–3, Theorem 3.4. Static O(n(m+n log n)) in arithmetic model. Derived wrappers recompute after updates or on queries. Lazy O(1) updates assume O(n²)-space direct-address storage. Baselines, not best-known claims.
- [HKNS, STOC 2015](https://arxiv.org/abs/1511.06773): Corollary 3.4, following matching reductions. Under OMv/polynomial preprocessing, u=O(m^(1/2−δ)) and q=O(m^(1−δ)) cannot coexist for exact matching; unit weights transfer the result. This is not unconditional Ω(n) or approximation hardness.

Green algorithms; red lower bound. Deterministic circles, randomized triangles. Numeric retained-weight scale and ε loss strokes. Approximate formulas categorically spaced; exact panel dense reference m=Θ(n²) with query-cost rows. Overview hides text and preserves marks. Each marker opens primary source details.

Pending review: Sankowski SODA 2007 specialized exact bipartite bounded-integer algorithm is known secondhand; no primary statement recovered, so not plotted. Exact green points explicitly baseline. No approximation lower bound verified. Partially dynamic/offline results remain outside main panels.

Pair tests cover scope, source filtering, geometry at 11 sizes, ε controls, source links, keyboard, escaping and disposal. Parent validates global build and browser before publishing.

