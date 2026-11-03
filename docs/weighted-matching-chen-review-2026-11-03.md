# Chen 2611.02105v1: weighted matching review

Reviewed 3 November 2026 against the [primary full text](https://arxiv.org/html/2611.02105v1), not only its abstract. Jiale Chen, *Faster Semi-Streaming and Dynamic Approximate Maximum Weight Matchings in General Graphs: A Unified Framework*, [arXiv:2611.02105v1](https://arxiv.org/abs/2611.02105v1), 1 November 2026. This is a preprint. The theorem statements, model definitions and the relevant proof sections were inspected; the mathematical proofs were not independently verified.

## Shared scope

The paper uses general undirected graphs with positive integer edge weights in [1,W], W≤n^{O(1)}. Section 1.3 uses a word RAM with Θ(log n)-bit words and permits the assumption ε=n^{-O(1)}: sufficiently small error already gives exact weight for polynomially bounded integer weights. The paper's μ(G) is maximum matching **cardinality**, distinct from its maximum matching weight μ_w(G). Its Õ and Θ̃ notation suppresses only polylog(1/ε), not log n.

## Streaming: included

[Theorem 1.1(2)](https://arxiv.org/html/2611.02105v1#S1.Thmlemma1) states a deterministic (1−ε)-approximate maximum-weight matching algorithm using **O(ε⁻² log(1/ε)) passes** and **O(μ(G) ε⁻² log² n) bits**. The arbitrary-order edge stream is insertion-only; multiple passes are allowed. The algorithm returns matching edges. Section 4.2 combines the weight-dependent algorithm in Lemma 4.4 with the cited weight reduction. Neither Theorem 1.1 nor Lemma 4.4 separately specifies the ≤1/4 restriction used by the dynamic theorem, so that restriction was not transferred to streaming.

Added `weighted-stream-chen26` beside the existing Assadi result. Both guarantee retained weight 1−ε, but their pass and space formulas differ in n, μ and ε. The chart therefore uses exact **symbolic categories**, not a numeric frontier or a claim of unconditional dominance. The new deterministic result uses a diamond; the existing randomized result uses a circle. Both remain algorithm green. “Preprint” appears on the figure and the inspected theorem. No lower bound for another stream contract was imported.

Theorem 1.1(1) also states an unweighted O(ε⁻²)-pass, O(μ(G) ε⁻² log n)-bit algorithm; that addition belongs to the root agent's unweighted streaming review.

## Fully dynamic: included as an oracle reduction

[Theorem 1.4](https://arxiv.org/html/2611.02105v1#S1.Thmlemma4), for 0<ε≤1/4, concerns an initially empty general graph with fully dynamic edge insertions/deletions and at most n vertices and m edges. It explicitly maintains a (1−ε)-approximate maximum-weight matching.

Given a base algorithm with amortized cost U_b(N,M,ρ) that explicitly maintains a (1−ρ)-approximate cardinality matching in **bipartite unweighted graphs against adaptive updates**, the claimed weighted update bound is

`Õ(ε⁻⁴) · U_b(Õ(nε⁻²), Õ((m+n)ε⁻²), Θ̃(ε))`.

The reduction is deterministic and preserves determinism of the base algorithm. It is **not a standalone update-time bound**. The base sizes and requested accuracy must be substituted before numerical comparison. Section 6.6.2 gives a size multiplier O(ε⁻² log³(1/ε)) and base accuracy Θ(ε/log³(1/ε)); Section 6 footnote 6 normalizes U_b as monotone in size/accuracy and uses U_b=Ω(1/ρ).

Added `weighted-dynamic-chen26-reduction` to the categorical approximation panel, with a diamond, a separator, a “base required” label, a preprint label and full formula inspection. The scalar approximation height shows only the retained-weight guarantee. No ε-only overhead was plotted as though it were the whole update time. Existing exact weight queries and their OMv barrier remain separate; no new lower bound was claimed.

## Partial dynamic: retained in this review, not plotted

Theorem 1.2 gives an incremental deterministic total-time bound O((mε⁻³+nε⁻⁶)log³n) over m insertions from an initially empty graph. Theorem 1.3 gives a decremental high-probability total-time bound O((mε⁻⁸+nε⁻⁴⁷)log^{O(1)}n), starting from an n-vertex, m-edge graph. These are not fully dynamic update bounds and were not inserted into the current fully dynamic figure.

## Verification

The weighted streaming and dynamic pair regressions passed after the changes: source/model fields; preprint filtering; deterministic/reduction shapes; ten main dynamic records plus four related records; theorem inspection and links; approximation interaction; text-free overview; nine streaming and eleven dynamic thumbnail sizes; keyboard handling, escaping and disposal. Browser layout inspection and the global build/release are the parent agent's responsibility. No commit or publication was performed by this review agent.
