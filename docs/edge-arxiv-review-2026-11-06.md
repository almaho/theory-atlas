# Dynamic edge coloring: 6 November 2026 review

The published comparison now includes Ghaffari–Peng's new near-Δ coloring guarantee and the corrections in Sadeh–Kaplan v3. Both are labeled preprints. This review checks primary theorem statements, model definitions, and changed statements; it is not an independent verification of the proofs.

## Constant expected update time with an ε-only degree threshold

[Ghaffari–Peng, arXiv:2611.06611v1](https://arxiv.org/abs/2611.06611v1), [Theorem 1](https://arxiv.org/html/2611.06611v1#Thmtheorem1), gives poly(1/ε) worst-case expected time per edge insertion or deletion for a proper (1+ε)Δ edge coloring. The graph is simple, Δ is a fixed known bound throughout the update sequence, 0<ε<1, and Δ must exceed a threshold Δε=Õ(ε⁻²). The hidden logarithms concern 1/ε. The adversary is oblivious.

This removes the dependence on n in the earlier BCPS degree requirement. It does not specify the ε polynomial exponent, so the BCPS explicit ε bound remains a useful historical comparison. The new marker appears in the existing near-Δ row and ε-only update-time column. The aligned recourse position stays blank because no separate recourse theorem is being added. Theorem 4 and Section 6.2.3 support the implementation contract; O(log n)-bit values and unit-cost sampling/access are used.

The marker is green and uses the existing general-graph circle. Its source inspection includes the degree threshold, oblivious-adversary condition, expected-per-update quantifier, and versioned theorem link. No adaptive-adversary or deterministic/w.h.p. worst-case-time claim is inferred.

## Revised recourse statements

[Sadeh–Kaplan, arXiv:2602.09497v3](https://arxiv.org/abs/2602.09497v3), revised 4 November, reports an off-by-one correction in Theorem B.13 and a corrected proof of Theorem B.11. Comparing the full v2/v3 theorem statements yields these public-data changes:

- [Theorem 2.8](https://arxiv.org/html/2602.09497v3#S2.Thmtheorem8): general ε>0 recourse is O(log_{1+ε} n), with O(ε⁻¹ log n) as the small-ε simplification. This is deterministic worst-case recourse per update, with O(m) update time. The known arboricity bound and local current-degree palette remain required.
- [Theorem 2.6](https://arxiv.org/html/2602.09497v3#S2.Thmtheorem6): the structural extension lower bound now explicitly requires n≥Δ+C+2. It remains in related comparisons: its prescribed coloring may be unreachable under an algorithm's invariants, so it is not a universal dynamic expected/amortized lower bound.
- [Theorem 2.5](https://arxiv.org/html/2602.09497v3#S2.Thmtheorem5): the current atlas already required C≤Δ−2. Its displayed recourse formula and conservative C≥Δ/φ+0.724 threshold remain unchanged.

Theorem B.13 changes the feasibility numerator from b(C−1)+2 to b(C−1)+1. Theorem B.16 changes the lower endpoint of its auxiliary offset range from 0.462 to 0.609; the atlas's 0.724 sufficient offset survives. These are recorded as revision context, not new plotted bounds. The existing open question about smaller palettes and shift-tree recourse remains valid.

Primary retrieval and detailed evidence: `../arxiv-2026-11-06-edge-review.json` in the parent work directory. Build, regression, browser and publication verification are recorded with the parent release.
