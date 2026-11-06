# Dynamic MIS update — 6 November 2026

Chen, Fan and Zhang, [arXiv:2611.05932v1](https://arxiv.org/abs/2611.05932v1), is a preprint. Theorem 1.1 and Sections 4.2.2–4.5 were inspected; this is not an independent proof verification.

For an initially empty undirected graph and a sequence-wide edge cap m, the paper maintains an explicit maximal independent set in Õ(m^(5/8)) amortized time with high probability over polynomial-length adaptive sequences. Correctness holds for every random tape. Initialization costs O(n). Updates report membership changes; listing the full set additionally costs its output size. The adversary sees the reported MISs, not private samples, traversal order or running times.

The existing fully dynamic panel now includes this randomized bound alongside deterministic bounds. Its square marker denotes fully dynamic adaptive updates for both green algorithms and red conditional hardness. The separate insertion-only panel retains its triangle. Formulas remain symbolic categories, not a cross-parameter numerical ranking.

[Bernstein et al., Theorem 1.1 and Hypothesis 2.2](https://arxiv.org/html/2510.20341v1#S1) supply the existing combinatorial-BMM conditional lower bound. Applying it to a fully dynamic algorithm uses only the fact that such an algorithm must process insertion-only histories. No unconditional or oblivious lower bound is inferred.
