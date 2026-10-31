# Maximum independent set row and semantic colors — 31 October 2026

Alma excluded dense k-colorability testing (2610.31489v2) and deferred the girth≥5 streaming coloring specialization (2606.18048v3). Neither is plotted. She requested a separate maximum independent set row if results exist in other models. The initial row contains Streaming, Online, LOCAL and Stochastic; five remaining cells are explicitly unreviewed.

## Objective split
Five already reviewed maximum-cardinality records moved from the maximal MIS row, keeping their IDs: three online bounded-neighborhood-independence competitive results (De–Singh), and two random-graph fixed-radius density results (Rahman–Virág). The original MIS row retains maximality and prescribed greedy behavior. No maximum-size lower bound constrains maximality.

## New primary-source review
- [Diddapur v2](https://arxiv.org/html/2609.18635v2): Theorem 1.2, §4.1, Appendix A. One-pass deterministic insertion–deletion streams, simple unweighted graphs with known vertex set, explicit independent set, unlimited computation. New lower Ω(n²/(β log₂n)) bits for 1≤β≤√n/(36log₂n), sufficiently large n. Folklore upper O(n²/β) bits for 1≤β≤n/log₂n. Version 2 narrowed the lower-bound range after corrections; no insertion-only lower asserted. Preprint statement/model reviewed, proof not independently certified.
- [Konrad–Zamaraev MFCS 2019](https://drops.dagstuhl.de/storage/00lipics/lipics-vol138-mfcs2019/LIPIcs.MFCS.2019.21/LIPIcs.MFCS.2019.21.pdf), Theorems 16–17: deterministic chordal-graph (1+ε)-approximation in O(ε⁻¹log(1/ε)log* n) LOCAL rounds, 0<ε<1/2. Even paths require Ω(1/ε) rounds for randomized expected-approximation algorithms. Tree decomposition is computed, not supplied. [arXiv](https://arxiv.org/abs/1805.04544).
- [Kawarabayashi–Khoury–Schild–Schwartzman](https://arxiv.org/html/1906.11524v2), Theorem 2, §3: unit-weight specialization gives a randomized (1+ε)Δ approximation in poly(log log n)/ε rounds WHP. CONGEST implies LOCAL; unique IDs and polynomial upper bound on n. Separate weaker approximation target, no transferred near-optimal lower bound. [arXiv](https://arxiv.org/abs/1906.11524).

## Figure semantics
Streaming uses fixed β=n^t and leading bit-space exponent s=2−t. Both curves share that exponent; a small screen offset distinguishes green/red, not a claimed numerical gap. Exact formulas and finite-n ranges remain visible. Open ends denote t<1 for the upper and t<1/2 for the lower. No region is shaded from unspecified constants.

LOCAL uses symbolic round formulas with explicit approximation and graph-class labels. The source-linked open direction below the row concerns the deterministic streaming logarithmic gap and is labeled as an inferred gap, not an independently certified open problem.

## Colors
Following Alma's latest request, algorithm marks remain green and lower bounds red. Categorical accents, setup halos, panel borders, labels and navigation are neutral. Labels/panels and line styles retain scope distinctions. Signed-edge examples retain +/− and dashed negative edges; graph coloring illustrations use two neutral tones. Archived fine-grained sources are unchanged.

## Validation
Full build/regressions cover routes, source resolution, semantic zoom, publication filters, keyboard behavior and lifecycle. Streaming partition construction independently checked on all 1,099 labeled graphs through n=5, 5,405 partitions and 79,218 insertion/deletion updates. Browser checks and release/deployment evidence are recorded in work/current-release-evidence.json.

