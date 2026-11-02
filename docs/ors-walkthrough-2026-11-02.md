# Behnezhad–Ghafari algorithm walkthrough

Alma requested a replayable graph animation reachable from an atlas result. She confirmed the target paper and the undirected input setup; arrows indicate algorithm flow.

Source: [Fully Dynamic Matching and Ordered Ruzsa–Szemerédi Graphs, arXiv v4](https://arxiv.org/abs/2404.06069v4).

## Executed and illustrated components

- Dynamic chapter executes [Algorithm 2](https://arxiv.org/html/2404.06069v4#S4.SS2.pic1.tab1) bookkeeping. It starts with an empty graph on 16 vertices and processes 24 valid insertions/deletions. With ε = 1/2, refreshes occur every four updates. The teaching phase threshold t = 16 is explicitly not the balanced asymptotic threshold.
- The [MatchAndCertify](https://arxiv.org/html/2404.06069v4#Thmlemma6) call is a **contract illustration**, clearly labeled in the visible scope, box, and methods. A small exact-matching oracle chooses illustrative outputs. Neither approximation boosting nor the theorem's running time is simulated. The sparse-greedy branch is selected by a numerical additive-contract check, not by a claimed execution of the paper's internal oracle calls.
- Sampling chapter executes the printed sampling loop on a graph of eight disjoint edges, n = 16 and δ = 1/4. Seed 0 deliberately illustrates an unsuccessful first round and success after budget growth. Replay retains every random choice; new run changes the seed.
- Uniform subsets without replacement, capped by the current available set, are this visualization's stated sampling convention. The source leaves replacement unspecified. The printed loop's final budget differs from the proof's full-scan discussion; unsuccessful runs are shown as no return rather than silently adding a round.

## Preserved distinctions

H_cert is a union of certificates and need not itself be a matching. Deleted edges remain cached and are filtered through G_del. Reinsertion removes a deletion marker. Phase reset keeps G and M_G, clears auxiliaries, resets the counter, and immediately triggers a refresh. The certificate and output matching are drawn separately. ORS is an analysis parameter, not a restriction on the displayed input graph.

Source-labeled dependency boxes retain inputs and outputs for boosting (McGregor 2005; Bhattacharya–Kiss–Saranurak 2023), matching-size estimation (Behnezhad 2021), and the additive-to-multiplicative wrapper (Kiss 2022, based on vertex sparsification). V4 discusses the estimator but omits an explicit call site in its algorithm description, so the animation does not invent one.

## Verification

`scripts/test_algorithm_walkthrough.cjs` checks all update/reset/cache transitions, matching validity, black-box numerical contracts and certificate exclusion, immutable replay, and 100 sampling seeds. The full renderer suite includes these tests and checks the atlas result's walkthrough link. Browser checks cover desktop/mobile, both themes, stepping, playback completion, replay, changing seeds, the no-return state, and navigation from the atlas. The standalone page is self-contained and included in offline exports.
