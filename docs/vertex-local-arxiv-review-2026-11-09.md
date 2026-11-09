# Vertex coloring × LOCAL: 9 November 2026 source review

The figure now contains two additional deterministic ordinary-palette algorithms by Marc Fuchs and Fabian Kuhn. Both are arXiv preprints and both satisfy the stronger CONGEST bandwidth restriction. They appear as green squares, with their exact round formulas and preprint labels. The existing red cycle and palette-sparsified-network lower bounds retain their original scope.

## Sources and provenance

- [Greedy-Like Defective Coloring: Distributed Algorithms and Applications, v3](https://arxiv.org/abs/2608.02386v3), originally submitted 3 August 2026, revised 6 November 2026 at 16:35:32 UTC. The daily related-category search found this revision on 9 November.
- [Distributed (Δ+1)-Coloring in O(√Δ + log* n) Rounds, v1](https://arxiv.org/abs/2610.16575v1), submitted 12 October 2026 at 10:54:45 UTC. This paper is outside the daily overlap interval: it was discovered through the explicit subsequent-work citation in the first paper. Reviewing that bounded citation prevents a superseded round bound from being presented as the current best degree dependence.

Neither paper was already represented in the repository bibliography. No publication acceptance is inferred from arXiv metadata.

## What the two points mean

| Figure record | Displayed task | Deterministic rounds | Primary theorem |
| --- | --- | --- | --- |
| `vertex-local-deterministic-fuchs-kuhn-2026-two-sweep` | Proper coloring from the common palette [Δ+1] | O(√Δ log⁴Δ + log* n) | [Theorem 2.3](https://arxiv.org/html/2608.02386v3#S2.Thmtheorem3) |
| `vertex-local-deterministic-fuchs-kuhn-2026-sqrt-degree` | Proper coloring from the common palette [Δ+1] | O(√Δ + log* n) | [Theorem 1.1](https://arxiv.org/html/2610.16575v1#S1.Thmtheorem1) |

The graph is finite, simple and undirected. Each vertex must output its own proper color. Nodes have unique O(log n)-bit identifiers; communication is synchronous. CONGEST messages have O(log n) bits per edge per round. Internally computed orientations do not make communication one-way. Initial auxiliary coloring is computed within the displayed O(log* n) term.

The first point is historical relative to the second, and is an alternative bandwidth-efficient construction rather than an improvement over the existing FHK16 LOCAL log^(5/2)Δ factor. The n-dependent GG24 result remains a complementary algorithm: the categorical rows do not claim one universal ordering in n and Δ.

## Full list statements and computation

For [Two-Sweep Theorem 2.3 and its §5 proof](https://arxiv.org/html/2608.02386v3#S5), lists must contain at least degree(v)+1 colors and must all use a common universe of size C=O(Δ). The proof invokes its Theorem 2.2 and Theorem 4 of Fuchs–Kuhn, DISC 2023. An initial q=O(Δ²)-coloring is computed first. Its messages are O(log q+log C+log n)=O(log n). The plotted ordinary palette is a valid specialization; the theorem does not provide the same bound for arbitrarily large list universes.

For [the successor's Theorem 1.1 and §3.4 proof](https://arxiv.org/html/2610.16575v1#S3.SS4), degree+1 lists from [C], with C≥Δ+1, take O(√Δ log(1+C/Δ)+log* n) deterministic LOCAL rounds. The same bound holds in CONGEST if C≤poly(n). Every vertex knows Δ and C. Its general-C proof obtains a common hash family by deterministic exhaustive local search; a probabilistic existence proof does not make the distributed algorithm randomized.

[Theorem A.1](https://arxiv.org/html/2610.16575v1#A1.Thmtheorem1) instead uses explicit hash functions. Its general-C bound is √Δ · 2^{O((loglog(4+C/Δ))³)} + O(log* n). Each hash evaluation has polynomial cost in log C from the common parameters and index. For C=O(Δ), this alternative still gives O(√Δ+log* n) rounds and avoids the exhaustive family search. This claim is about the stated hash implementation; it does not assert a new global local-computation bound or an MPC theorem.

The main x-axis is now called “Displayed coloring contract.” This avoids implying that the two ordinary-palette points describe unrestricted degree+1 lists. Their complete list guarantees and computation assumptions remain in theorem details.

## Version review and excluded transfers

The v2/v3 comparison found no changed proper-coloring formulas in Theorems 2.3 or 2.4 and no withdrawal notice. The revision extends the ε range of Theorem 2.1, clarifies encodings and message accounting, and adds a three-bucket defective-coloring improvement in Theorem 6.11. It also acknowledges the later √Δ-round paper.

Theorem 2.5 is a limitation of the Two-Sweep defective-coloring framework with a fixed common candidate family and fixed deterministic global tie-breaking functions depending only on the specified local neighbor counts. It is not a universal LOCAL round lower bound, nor a lower bound for proper coloring. No red point is added from this theorem.

Theorem 2.4 concerns bounded neighborhood independence and has separate θ-dependent terms. It is recorded in review evidence but not projected onto the general-graph main view. Defective-coloring results remain research input; no proper-coloring or MPC consequence is guessed from them.

## Implementation and validation handoff

Changed data: `data/focus/vertex-local.json` and `data/research/vertex.json`. The figure now has 17 records from 13 primary sources, 11 main-view records and 10 distinct runtime rows. Published-only coverage remains unchanged: the additions are preprints. The pair renderer and regression test are handled separately by the coordinating agent.

Detailed theorem and version evidence is saved outside the repository at `work/arxiv-2026-11-09-coloring-review.json`, with downloaded primary HTML and a v2/v3 theorem-block comparison. The review does not update the monitor checkpoint or publish the website.
