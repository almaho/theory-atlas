# Dynamic matching and vertex cover review — 27 October 2026

This batch adds eight problems and seven connections to the fine-grained page, now 30 problems, 27 connections, 22 primary sources and 14 fully dynamic update rows. It also makes the three ORS-dependent matching algorithms prominent in the graph atlas.

## ORS intervals

The published extremal range is L = n^{Ω_c(1/log log n)} through U = O(n / log^{poly(1/c)} n), with the upper denominator an iterated logarithm. Source: [Behnezhad–Ghafari, full version §1.2](https://arxiv.org/html/2404.06069v4#S1.SS2), including its cited extremal constructions.

Each green band displays the image [F(L), F(U)] of that range under an algorithm's upper-bound formula. This is not an interval of proved actual runtime, and F(L) is not an update-time lower bound. Bar lengths are schematic. Exact endpoint substitutions, parameter dependence and paper links are inspectable.

- [Behnezhad–Ghafari, FOCS 2024](https://arxiv.org/pdf/2404.06069v2#page=4): F(R) = Õ(√(n^{1+ε}R)); R = ORS_n(Θ(ε²n)); retained fraction 1−ε.
- [Assadi–Khanna–Kiss, SODA 2025](https://arxiv.org/html/2406.13573v2): fixed-δ reformulation Aε,δ n^δ R, with Aε,δ = (1/ε)^{O(1/(εδ))}.
- [Mitrović–Sheu, SPAA 2025](https://arxiv.org/html/2503.01147v2#S7.SS3): Bε,δ n^δ R, with Bε,δ = (1/ε)^{O(1/δ)}. Table 2 verifies the preceding comparison. The polynomial ε dependence is for fixed δ, not claimed simultaneously with n^{o(1)}.

The ORS matching-size coefficient depends on accuracy and hierarchy/runtime parameters. Leading n powers shown on the bands suppress only fixed-parameter factors; the exact F(L), F(U) remain in theorem details.

## Exact dynamic connections

The chain from ordinary Boolean OMv / OuMv through directed reachability to bipartite perfect matching and exact matching/cover values uses the split-vertex construction in [Abboud–Vassilevska Williams, FOCS 2014](https://arxiv.org/pdf/1402.0054). The ordinary-OMv update/query barrier is [Henzinger–Krinninger–Nanongkai–Saranurak, STOC 2015](https://arxiv.org/abs/1511.06773), Corollary 3.4 and the following matching/cover discussion.

The update-only plot retains the joint condition: no simultaneous U=O(n^{1−η}) and Q=O(n^{2−δ}) for fixed positive η,δ, with polynomial preprocessing. It does not silently drop the query restriction. König's equality τ=ν applies to bipartite graphs and transfers scalar size only. It does not construct a cover or solve general-graph exact vertex cover.

[van den Brand–Kumar–Zhang, ICALP 2026](https://arxiv.org/html/2605.09917v1), Theorems 1.1/1.3, supplies the exact scalar algorithm Õ((ν+1)^{1.405}); its dense-scale reference is Õ(n^{1.405}). Preprocessing and high-probability worst-case conditions remain inspectable.

Approximate matching size uses [Bhattacharya–Kiss–Saranurak, FOCS 2023](https://arxiv.org/html/2302.05030v3). Approximate explicit edges retain the three ORS formulas. No exact unit-gap lower bound is transferred to fixed-accuracy approximation. The ORS arrow is a structural dependence, visibly dashed and fixed under direction toggling.

## Approximate maintained covers

User selected exact cover size and approximate maintained covers as distinct main setups.

- [Solomon, FOCS 2016](https://arxiv.org/pdf/1604.08491#page=16), Theorem 4.7: maximal matching in O(1) expected-amortized update time against oblivious updates. The endpoints give a maintained 2-approximate cover. This needs maximality; arbitrary approximate maximum matching does not suffice.
- [Bhattacharya–Kulkarni, SODA 2019](https://arxiv.org/pdf/1805.03498v2#page=3), Theorem 1.1: deterministic (2+ε)-cover in O(1/ε²) amortized update time. Corollary A.5 and Appendix B maintain vertex weights; membership bits and a cover list add constant work per processed weight change. This augmentation is identified as elementary. Full enumeration costs O(|C|).
- [Bhattacharya–Henzinger–Nanongkai–Wu, SODA 2021](https://arxiv.org/pdf/2002.11171v2#page=4), Theorem 1.1 and its Remark: O(log² n/ε³) worst-case update with a cover produced on demand. It does not report maintained cover changes. It remains a related-result card; the f=2, C=1, internal ε/2 specialization and edge-versus-vertex log parameter are explicit.

No nonconstant update lower bound is invented for constant-amortized approximate cover algorithms.

## Validation

Full renderer suite and source-identity checks pass. Fine-grained tests independently verify 256 diameter gadgets, 512 OuMv update states, 512 matching/cover states including dense padding, and all 64 four-vertex graphs for the maximal-matching cover construction. A nonmaximal approximate matching counterexample guards the output distinction.

Browser inspection verified compact and focused ORS bands, paper links, exact and approximate update rows, connection directions, and the output-model caveats. All three fine-grained views stayed at document width 360px in a narrow viewport. No browser errors or warnings were observed.
