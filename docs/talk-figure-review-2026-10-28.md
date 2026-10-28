# Talk-informed figure review · 28 October 2026

Alma requested clearer figures informed by researchers' talks, keeping bounds first and examples expandable. This review inspected the actual slide pages below. The atlas uses original SVG illustrations and layouts; it does not reproduce slide images. Videos listed at the end were located, but no claim is made to have inspected their frames.

## Inspected slides and design decisions

| Area | Primary talk slides inspected | Useful visual device | Application |
| --- | --- | --- | --- |
| Dynamic matching | [Mitrović–Sheu, SPAA 2025](https://whsheu.github.io/slides/MS25_slides_long.pdf), pp. 12, 35–37, 46–47 | Keep the graph fixed while exposing structure; separate parameter dependence | Original graph examples below the bounds; plain ORS interval lines at the right of the original dynamic plot, as explicitly requested |
| Correlation clustering | [Wirth–Veldt](https://users.monash.edu/~gfarr/research/slides/Wirth-cc-awirth-2018-12-03.pdf), pp. 4, 10, 12, 14–16 | Signed edges, soft cluster boundaries, conflicting triangles | Expandable triangle with exact disagreement counts; a distinct noisy-hidden-partition example for stochastic recovery |
| Online stochastic matching | [Waggoner, January 2015](https://bowaggoner.com/talks/2015/online-stochastic-matching--jan2015--slides.pdf), pp. 5–11, 23–25 | Reuse a bipartite graph across arrival, attempt and success states | Design reference only: stochastic rewards are not the atlas's independent edge-survival model |
| LCA / MIS | [Medina, ADGA 2017](https://adga-workshop.org/2017/medina.pdf), pp. 30, 33, 36, 39; [Even, WOLA 2018](https://people.csail.mit.edu/joanne/WOLA18-slides/Even.pdf), pp. 8, 12 | Fixed priorities, dependency exploration, consistent local answers; radius versus probes | Expandable greedy-MIS dependency example; shared matching-LCA axes with nonadaptive squares and explicit output contracts |
| Online coloring | [Blikstad, Deterministic Online Bipartite Edge Coloring](https://blikstad.gitlab.io/slides/Deterministic_Online_Bipartite_Edge_Coloring.pdf), pp. 40, 50, 57 | Same graph geometry across different adversary setups; arriving-vertex palette | Fixed-graph edge/vertex coloring examples and explicit model explanations |
| Fine-grained dynamic problems | [Jin, STOC 2022](https://ce-jin.github.io/slides/stoc22slides.pdf), pp. 28–30, 32; [Henzinger, NUS 2021](https://researchweek.comp.nus.edu.sg/slides2021/Monika%20Henzinger.pdf), p. 25 | Feasible/forbidden parameter regions and a matrix-to-graph gadget | Recorded for a later explanatory inset; no fine-grained theorem or reduction changes in this batch |

## Scope safeguards

- The early Mitrović–Sheu slides contain an older simplified bound. Existing corrected theorem data, not that slide formula, controls the plotted ORS intervals.
- ORS lines show the range of a parameterized **algorithm upper bound** under current extremal ORS estimates. Their bottom endpoints are not runtime lower bounds. The main plot's asymptotic lanes are schematic; exact epsilon/delta factors remain in the inspector.
- Online competitive fractions use green attainable prefixes and red impossible suffixes. The interval between the strongest reviewed endpoints is unresolved. Cost/recourse has the opposite direction. Unspecified delta improvements remain symbolic.
- Stochastic budget bounds are not ceilings on approximation. Maximum degree, expected total queries and adaptive testing remain distinct resource contracts. Numeric epsilon/p exploration is attached to an explicit historical formula, not to unspecified big-O constants.
- Matching LCA keeps nonadaptive squares distinct from adaptive-allowed circles/diamonds; the nonadaptive barrier does not transfer to adaptive algorithms.
- The adjacency-list comparison keeps general, bipartite and additive-slack setups in different halo colors. The promoted BKS result retains `estimate ≥ (2/3)OPT − (2/3)epsilon n`; it is not a pure 2/3 guarantee. [Theorem 1.3(2)](https://arxiv.org/html/2212.00189v2).
- Jin's slide-32 arrows include generalization/online variants; they must not be imported as fine-grained reductions.

## Missing matrix-query result

The requested n^(3/2) to n^(4/3) improvement is for **estimating the size of a generated greedy MIS**, not maximum matching, maximum independent set, or outputting all MIS vertices. Two independent October 2026 preprints were reviewed:

- [Kiss–Kooroshnezhad, arXiv:2610.03588v2](https://arxiv.org/abs/2610.03588v2), Theorem 1.1 and Lemma 3.5: expected Õ(n^(4/3)/epsilon²) time, high-probability correctness, one-sided estimate below the chosen greedy MIS size.
- [Mahabadi–Tarnawski, arXiv:2610.06053v1](https://arxiv.org/abs/2610.06053v1), Theorem 1.1 and §3.4: capped/amplified worst-case Õ(n^(4/3)/epsilon²) time, high-probability correctness, estimate above the chosen greedy MIS size. The selected permutation need not be uniform.

The historical [MRTV result](https://arxiv.org/abs/2510.11627) remains visible. Published-only filtering must restore that historical frontier and its accuracy/scan crossover.

## Located videos, not frame-reviewed

- [Behnezhad–Ghafari, FOCS 2024](https://www.youtube.com/watch?v=fXuHBmMMZPE)
- [Soheil Behnezhad, Simons, 30 July 2024](https://simons.berkeley.edu/talks/soheil-behnezhad-northeastern-university-2024-07-30)
- [Sepehr Assadi, Simons, 30 July 2024](https://simons.berkeley.edu/talks/sepehr-assadi-university-waterloo-2024-07-30)
- [Stochastic matching with few queries, Simons](https://simons.berkeley.edu/talks/stochastic-matching-few-queries)

The broader review remains finite: inspect the remaining figure families for comparable axes and readable semantic zoom, and use specialized diagrams where they improve understanding. This batch does not claim to redesign every pair or to exhaust the literature. The interrupted daily arXiv metadata check is checkpointed separately and is not marked successful.

## Validation

- Build: 303 sources, 184 scoped settings, 527 result records, 54 visible cells. The public visible bibliography contains 285 papers and 508 scoped results.
- Complete renderer, navigation/source and fine-grained regressions passed. 475 focused result identities resolve, 421 with recorded arXiv links, and zero unresolved sources. Older original sources remain when no arXiv record was verified.
- New checks cover online frontier direction and symbolic gaps; stochastic formula evaluation, monotonicity and controls; coincident MIS curves with publication-aware scan cap; rich LCA formula ticks and partner conversion; and independently enumerated explanatory examples.
- Browser inspected focused dynamic, LCA, adjacency-list, online, stochastic and MIS-matrix figures, weighted online/stochastic variants, the stochastic p explorer, and expandable MIS example.
- All six changed figure families mount inside the full atlas. Focused routes and full-atlas detail keep document width at 360px, with wide charts scrolling internally. Overview and selected-cell fading inspected; browser warning/error log empty. Responsive override reset.
- Exported the actual six thumbnail renderers at 330×245 and 738×548 for visual inspection. Corrected right-edge adjacency-list labels and restored rich LCA formula ticks before final build.
