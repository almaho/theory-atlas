# Correlation-clustering source review · 4 November 2026

Primary theorem statements, algorithms, and computational-model sections were inspected. The proofs and computer-generated certificates were not independently verified. All three sources remain preprints.

## Existing source: corrected randomness qualification

[García-Soriano–Schohn, arXiv:2607.27829v3](https://arxiv.org/html/2607.27829v3) preserves the factor 1.3865 in [Theorem 1.3](https://arxiv.org/html/2607.27829v3#S1.Thmtheorem3) and the stated near-linear composition following Corollary 1.4. The graph is complete, signed and unweighted; the objective is minimizing disagreements. Degree, neighbor and pair queries are available.

The existing Combined-query record incorrectly described the rounding as deterministic within that fast composition. [Theorem 7.1](https://arxiv.org/html/2607.27829v3#S7.Thmtheorem1) gives expected sublinear rounding time. Its following paragraph expressly excludes that implementation from the polynomial-time derandomization. Research and archived figure data now distinguish these guarantees. The factor and symbolic time formula are unchanged; Combined remains hidden.

The public open-question link now cites v3. The [introductory gap statement](https://arxiv.org/html/2607.27829v3#S1.SS1) still gives [4/3, 1.3865] for the cluster LP. This is not an approximation-hardness interval for all algorithms.

## Sequential MaxAgree: no streaming substitution

[García-Soriano–Miyauchi, arXiv:2609.35453v2](https://arxiv.org/html/2609.35453v2), [Theorem 4.5](https://arxiv.org/html/2609.35453v2#S4.Thmtheorem5), gives an expected 0.7818 approximation for weighted MaxAgree by solving the standard SDP and applying four- and five-spoke rounding. [Theorem 5.1](https://arxiv.org/html/2609.35453v2#S5.Thmtheorem1) gives a UGC-conditional 0.802+ε approximation barrier. The 0.78187 ceiling elsewhere concerns particular rounding mixtures, not all algorithms.

These are sequential computation guarantees. The paper does not establish the space and running time of the existing Ahn et al. streaming record, so its 0.7666(1−ε) factor is unchanged. Nor does MaxAgree transfer to the shared MinDisagree approximation scale.

## Constrained MinDisagree: setup choice pending

[Cao–Xu, arXiv:2611.04784v1](https://arxiv.org/html/2611.04784v1), [Theorem 1.1](https://arxiv.org/html/2611.04784v1#S1.Thmtheorem1), considers feasible complete unweighted signed graphs with hard must-link and cannot-link constraints. For fixed ε, its randomized algorithm returns a feasible partition with expected cost at most (2+ε)OPT in (n/ε)^{O(ε⁻²)} time.

[Theorem 1.2](https://arxiv.org/html/2611.04784v1#S1.Thmtheorem2) gives √2−ε NP-hardness and 2−ε hardness conditional on UGC. The latter remains conditional here. The hard constraints change the problem; this is not a factor-2 lower bound for ordinary correlation clustering. There is no query, round, streaming-space or update-time theorem to substitute into existing panels. A separate setup is pending Alma's choice.

## Validation

The existing Combined-query regression passes, covering 32 viewport configurations, source filtering, theorem inspection, keyboard interaction and cleanup. Source JSON parses and `git diff --check` passes. The shared release build and the built open-question check are handled by the parent task after this review.
