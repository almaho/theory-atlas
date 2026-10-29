# arXiv review — 29 October 2026

The first completed monitoring search covers updates from 22 October 00:00 UTC through 29 October 13:07:52 UTC. Both API queries reached beyond the starting boundary: cs.DS/cs.CC, and targeted matching/coloring/MIS/clustering searches in related categories. The retained metadata contains 232 distinct ID/version records. All were screened; two papers received theorem/model review, and two remain pending. Search feeds, dispositions and checkpoint live in `../arxiv-2026-10-29-search.json`, `../arxiv-2026-10-29-review.json` and `../arxiv-monitor-state.json`. No retrieved base ID matched the existing graph bibliography before integration. The interrupted 28 October scan is not counted as a successful check.

## Dynamic vertex coloring

[Gil–Halldórsson, v2](https://arxiv.org/abs/2610.26182v2), [Theorem 1.1](https://arxiv.org/html/2610.26182v2#S1.Thmtheorem1), gives fully dynamic (Δ+1)-coloring against an adaptive adversary with Õ(√n) worst-case update time with high probability and at most three recolorings per update. The displayed comparison uses a fixed known degree bound and starts with an empty graph. Sections 4.2–4.3 establish initialization/time/recourse conventions; the section 4.4 extension tracks maximum degree observed so far, not necessarily current degree. The new adaptive worst-case column separates this guarantee from amortized bounds. This is labeled a preprint; a technique limitation is not plotted as a lower bound.

## Streaming matching

[Liu–Naidu–Nguyen–Sundaresan, v1](https://arxiv.org/abs/2610.36577v1), [Theorem 1](https://arxiv.org/html/2610.36577v1#Thmtheorem1), excludes every fixed competitive fraction above 1−3⁻ᵖ for every fixed constant p in O(n polylog n) bits, already for bipartite unweighted insertion-only edge streams. Section 7.5 and Appendix A.2 retain success above 1/2 by a fixed margin and require a valid input matching on every run. Outputs are edges, not size estimates. Fixed small ε yields Ω(log(1/ε)) passes; no ε(n) claim is made. The p=2 specialization coincides with the older 8/9 ceiling and does not strengthen it. Separate general/bipartite records and theorem inspection preserve these conventions. Red lower-bound marks appear alongside green algorithms.

## Review limits and validation

Theorem statements and models were checked, not proofs independently verified. Pending: [k-colorability testing v2](https://arxiv.org/abs/2610.31489v2), whose induced-subgraph sample count must not be confused with graph queries; and [hypergraph list coloring v3](https://arxiv.org/abs/2606.18048v3), whose graph specialization and streaming model require review. Neither pending claim is plotted.

Build and complete renderer regressions pass, including source links, preprint filtering, exact contracts, 60 atlas routes, and semantic zoom. Browser checks cover the coincident two-pass sources, multipass panels, the new dynamic column, overview, and 360px containment with horizontal chart scrolling. Five scoped records from two sources were added; visible totals are 287 papers and 513 results. Atlas/Vision/People navigation and the common clustering approximation scale remain intact. Fine-grained research remains archived and its page is not published.
