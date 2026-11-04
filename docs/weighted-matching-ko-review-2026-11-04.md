# Exact dynamic weighted matching: Ko v3

Reviewed 4 November 2026. Young Kun Ko, [*Unconditional Boolean Dynamic Lower Bounds from Disjointness*, arXiv:2610.10904v3](https://arxiv.org/abs/2610.10904v3), 2 November 2026. Preprint: statements, computational model and reduction contracts checked; the proof has not been independently verified.

## Recorded statement and scope

[Lemma A.1](https://arxiv.org/html/2610.10904v3#A1.Thmtheorem1), with [Section A.2.4](https://arxiv.org/html/2610.10904v3#A1.SS2.SSS4), gives `u+q = Ω((log N/log(uw))²)` for exact optimum-weight queries, already on planar bipartite graphs with positive polynomial integer weights and insertions only. Thus `max(u,q) = Ω((log N/log log N)²)`; constant expected query time implies this lower bound on worst-case update time. Fully dynamic algorithms inherit the insertion-only restriction.

[Section 2.1](https://arxiv.org/html/2610.10904v3#S2.SS1): zero error, `w=Θ(log N)` bits for both cells and addresses; updates worst-case over inputs/tapes, queries expected per fixed history. Preprocessing is unrestricted and uncharged; retained input-dependent information is charged memory. This does not cover amortized updates, Monte Carlo algorithms or approximation. Final-query updates prevent a query-only bound.

## Representation and checks

The exact panel has a separate symbolic red hexagon strip; no exponent-zero placement. Conditional OMv remains an open red diamond. Preprint filtering, source inspection and semantic zoom retain these distinctions. Approximate guarantees are unchanged; its oracle-reduction marker is a plus, distinct from the conditional OMv diamond.

Pair regression checks all 11 main records across 12 viewport sizes. Independent exhaustive checks cover 128 tiny unit-weight instances of [A.1.1](https://arxiv.org/html/2610.10904v3#A1.SS1.SSS1) and 57 small weight-complement DAGs for A.2.4. They test the reduction interpretation, not the asymptotic lower-bound proof or full planar construction.
