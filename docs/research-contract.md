# Research record contract

Audit date: 2026-09-27. All content must be grounded in primary sources. This is a scoped research atlas, not a claim that every variant is surveyed exhaustively.

Each researcher writes only `data/research/PROBLEM.json` plus optional `docs/PROBLEM-research.md`. Use problem IDs matching, weighted_matching, mis, cc, edge, vertex. Models: dynamic, stream, online, stochastic, lca, local, mpc, query_list, query_matrix, query_combined. Pure adjacency-list, pure adjacency-matrix, and combined/other query interfaces are separate model columns. Keep combined access out of the pure list/matrix cells.

Online maximization figures use β=E[ALG]/OPT, larger is better. Green marks an achievable fraction; red is an impossibility ceiling, still stored as kind `lower`. Do not apply generic approximation-factor region closures to this reversed quality convention. Weighted matching has its own atlas row; edge and vertex weights remain separately labeled. Stochastic edge realization, random-order online arrivals, and distributional arrivals are distinct input models. Online and Stochastic axes require manual source-based curation.

JSON format:
```
{
  "problem": "matching",
  "reviewedThrough": "2026-09-27",
  "searchSummary": "Brief scope and remaining limitations",
  "coverage": [{"model":"dynamic","status":"researched|partial|not_assessed","note":"..."}],
  "papers": [{"id":"stable-author-year-topic","title":"...","authors":["..."],"year":2026,"venue":"STOC 2026 or arXiv","publicationStatus":"conference|journal|preprint","url":"https://...","verifiedOn":"2026-09-27"}],
  "slices": [{
    "id":"matching-stream-insertion-explicit",
    "problem":"matching", "model":"stream", "label":"One pass, insertion-only, explicit matching",
    "task":"Exact objective and output type",
    "assumptions":["..."],
    "xAxis":{"label":"Approximation factor α","kind":"approximation|palette|guarantee","min":1,"max":3},
      "yAxis":{"label":"Space exponent p in Õ(n^p) bits","kind":"exponent|runtime|rounds|queries|symbolic","min":0.5,"max":2.1},
    "parameters":{"epsilon":"fixed constant"},
    "results":[{
      "id":"unique-result-id", "paperId":"paper-id", "kind":"upper|lower",
      "bound":"Exact symbolic asymptotic expression", "guarantee":"Exact approximation/task guarantee",
      "sourceLocation":"Theorem/section/abstract", "evidenceStatus":"verified|abstract_verified|needs_full_text",
      "frontierStatus":"current_best_verified|candidate|baseline|historical",
      "notes":"Scope, later improvements, limits; NEVER infer SOTA from publication year alone",
      "plot": null
    }]
  }]
}
```

## Axis conventions

The x-axis belongs to the **problem** (its quality dimension); the y-axis belongs to the **model** (the resource it charges). Use these labeled scales only where the theorem and setting justify them. Each setting records its actual oracle, guarantee, and resource separately.

| Problem | x-axis |
| --- | --- |
| matching | α = OPT/\|M\|, 1 → 2.25 on the dynamic frontier, otherwise 1 → 3 |
| cc | α = cost/OPT, 1 → 6 |
| edge, vertex | palette ratio r = q/Δ, 1 → 2; q=Δ+1 corresponds to 1+1/Δ, never to exactly 1. Additive palettes may instead use slack q−Δ. Specify Δ before assigning a fixed ratio. |
| mis | none — see 1D below |

| Model | y-axis |
| --- | --- |
| dynamic | update-time exponent q in Õ(n^q), 0 → 1.5; `m` converted under the stated dense convention. Slices that charge recourse use the recourse ladder O(1) / log n / log² n / poly |
| stream | space exponent p in Õ(n^p) bits, 0 → 2; pass-count slices use passes, 1 → 8 |
| query_list, query_matrix, query_combined | query exponent p in Õ(n^p), 0 → 2 |
| mpc | ordered asymptotic categories: O(1), log log log n, log log n, (log log n)^k, √log n, ≥ log n |
| local | Δ-dependence exponent t in Õ(Δ^t) when the slice's bounds are Δ-parameterized; otherwise the round ladder in n: O(1), log\* n, polyloglog n, √log n, log n, polylog n |
| lca | probe ladder in Δ: polylog n, poly(Δ), Δ^{O(log log Δ)}, Δ^{O(log Δ)}, Δ^{O(log²Δ)} |

Ladder axes carry a `tickLabels` array parallel to `ticks`; the renderer prints those strings instead of the raw index.

## One-dimensional slices

For a maximality construction task, the guarantee is fixed, so it has no approximation coordinate. An additive estimation/optimization task still has an accuracy parameter and retains a quality axis. Such a slice sets `"mode": "1d"`, omits `xAxis`/`yAxis`, and carries a single `axis` (the model's resource axis above). Its results use `"plot": {"v": …, "closure": "right"|"left"|"point", "strict": false, "label": "…"}`. The chart is a number line: green from the best algorithm rightward (more resource is still enough), red from the barrier leftward (less is ruled out), gray between them. `closure: "right"` is only for upper bounds and `"left"` only for lower bounds.

A bound whose value depends on an unstated regime is never placed automatically. That covers `min{…}` and `max{…}` of incomparable terms, free parameters (s, Q, λ, p passes, β(G)), unparsed powers of n or m, and results stated only for bounded or constant Δ. `scripts/assign_axes.py` prints unreviewed coordinate suggestions without changing research files. A curator must check the full paper and exact access assumptions before adding a plot coordinate.

`plot` is optional/null when the bound cannot honestly be placed numerically (e.g. ORS, Δ dependence, log-star vs log-log, unspecified epsilon exponent). When warranted, use `{ "x":2, "y":1, "closure":"upper-right|lower-left|point", "strictX":false, "strictY":false }`. A numeric axis may also declare an explicit `ticks` array; use it when a frontier needs stable, interpretable constants rather than automatic interpolation. Coordinates must match axes and a fixed common slice; explain quantifiers in notes. Upper-right closure means larger approximation factor and greater resource budget remain achievable. Lower-left excludes smaller resources and better quality; only encode theorem-supported closure. A numeric y-axis may represent passes, rounds, queries, runtime, or space; label the unit and fixed regime in the slice. A slice may optionally include `frontier.upperSteps` and `frontier.lowerBoundary` for a visible step/frontier or barrier; these are annotations and must not assert interpolation between incomparable results. For coloring, numeric palette ratio q/Δ is allowed ONLY under stated Δ regime; otherwise symbolic. Approximation conventions normalize to α≥1 but retain original ratio in guarantee. Never plot a generic maximality task on a fictitious approximation axis.

Preserve randomized/deterministic, expected/w.h.p., adversarial assumptions, explicit/value output, passes, graph class, and query access. Separate incompatible results into separate slices. Include lower bounds when verified; don't fabricate red areas. Older results may still be best; newer papers can be historical or incomparable. Prefer broad, well-supported coverage across all model cells, prioritizing substantive breadth and accuracy; record honest coverage gaps. Bibliographic links and theorem locators are mandatory. Search official latest conference lists and primary paper sources; use stronger search for SOTA verification. Each source summary should stay within its retrieval word limit. No long quotations.
