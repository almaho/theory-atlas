# Online model and submodels

Online is a separate computational model: input is revealed over time and an algorithm must make decisions without knowing future arrivals. Streaming memory bounds and dynamic update-time bounds do not automatically imply online competitive guarantees.

The first bounded review concerns matching. Its main representation includes adversarial and random arrival order, edge and vertex arrivals, and aligned panels for irrevocable decisions, preemption, and recourse. The 27 October extension also reviews independent sets, correlation clustering, edge coloring and vertex coloring; each has separate source-scoped panels.

## Record the setup explicitly

| Dimension | Required distinctions |
| --- | --- |
| Arrival type | Edge arrivals; one-sided bipartite vertex arrivals; two-sided or general vertex arrivals; fully online deadlines when applicable |
| Revealed information | Previously known side of a bipartite graph, incident edges revealed at arrival, weights, degree promises, and any knowledge of future vertices or distributions |
| Arrival process | Arbitrary adversarial order; uniformly random permutation of a fixed input; stochastic sampling models separately |
| Adversary | Oblivious or adaptive, including whether decisions or random choices are observed |
| Decision policy | Irrevocable acceptance/rejection; preemption allowing removal of accepted edges; bounded recourse allowing stated revisions |
| Recourse accounting | Per arrival or total; worst case or amortized; edge or vertex operations; whether discarded items may be recovered |
| Objective | Cardinality or weight for matching; disagreement or agreement for clustering; exact palette or ratio to a named coloring benchmark |
| Probability | Deterministic, expected guarantee, or high-probability guarantee; randomness of both the algorithm and arrival process |

Preemption and recourse are not interchangeable. A theorem must state which earlier decisions may change and how those changes are counted. One-sided vertex arrival is not the same as unrestricted vertex arrival or a fully online deadline model.

## Competitive axes

For maximum-cardinality matching, prefer the retained fraction **β = E[ALG]/OPT**, with greater β better. A green algorithm marker certifies a guarantee at least β; a red impossibility marker bounds the competitive fraction an algorithm can achieve. The term "lower bound" describes algorithmic impossibility even when its numerical statement is an upper bound on β. Preserve finite-size corrections, strict endpoints, and the source's adversary assumptions.

For minimization, use **α = E[cost]/OPT ≥ 1**, with smaller α better, and retain any additive term. Coloring may instead compare palette size with Δ or χ; these are different benchmarks. State the objective and direction on each figure instead of silently normalizing different contracts.

Aligned panels can share a numeric quality axis only when the objective and ratio convention agree. Panel headers and setup labels preserve differences in arrivals, graph class, and permitted revisions. Symbolic improvements such as 1/2 + δ require a labeled anchor or symbolic annotation, not an invented numerical δ.

## Maximal versus maximum independent set

The existing MIS row means **maximal independent set**, a feasibility/maximality task. Online maximum-independent-set cardinality competition is a different optimization problem. The user chose both objectives, in separate panels. Maximality uses a zero-revision greedy figure. Maximum-size competition uses neighborhood-independence-dependent ratios; no ratio is attributed to the maximality feasibility task.

## Scope and presentation

Algorithms remain green and impossibility bounds red. Setup colors may distinguish arrival types or graph classes without replacing these meanings. Each theorem retains a direct primary-paper link and its exact assumptions. Focused and full-atlas views use the same figure; semantic zoom removes annotations before they become unreadable. An unreviewed cell is a coverage gap, not a claim that no result exists.

## Separate weighted row and stochastic column

Weighted matching is a separate problem row. Edge-weighted matching leads its online figure; offline-vertex-weighted results occupy their own labeled panel. Other weighted cells await future design and source review.

The Stochastic column begins with Azarmehr–Behnezhad–Ghafari–Rubinfeld, *Stochastic Matching via In-n-Out Local Computation Algorithms* (STOC 2025). Its input is a known graph with independent edge survival, not a random permutation of online arrivals. Nonadaptive edge testing and adaptive probes within the specialized in/out LCA are distinct operations.


## Online and stochastic extension — 27 October 2026

The user approved random-graph, planted/noisy and semirandom inputs in separately labeled Stochastic panels. They also approved all three online clustering decision policies (irrevocable, merge-only, reassignments), with minimum-disagreement and maximum-agreement objectives separate.

Eight previously empty cells now have 42 main results across 17 paper identities. Stochastic matching retains its independent-edge-survival interpretation; the new cells do not inherit that model. Random arrival order of a fixed graph stays in Online.

Source and representation notes: [online-stochastic-review-2026-10-27.md](online-stochastic-review-2026-10-27.md). The shared renderer uses separate numeric, asymptotic-reference, and symbolic-category axes. Hollow points locate limits, not guessed finite-parameter constants. Green algorithms and red lower bounds remain consistent in focus and full-atlas views.
