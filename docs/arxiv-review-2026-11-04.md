# Daily arXiv review · 4 November 2026

The complete cs.DS/cs.CC and targeted related-category search covers 27 October 14:03:52 UTC through 4 November 15:41:34 UTC, retaining seven days of overlap. All 537 retrieved versions were triaged: 167 fresh and 370 carried forward with unchanged metadata. No withdrawal or correction notice was found in the versions matched to existing bibliography sources. Version-level dispositions and query pages are stored in the workspace daily ledger.

## Exact dynamic matching

Young Kun Ko’s [arXiv:2610.10904v3](https://arxiv.org/abs/2610.10904v3) supplies a new, explicitly labeled preprint lower bound. [Section 2.1](https://arxiv.org/html/2610.10904v3#S2.SS1), [Lemma A.1](https://arxiv.org/html/2610.10904v3#A1.Thmtheorem1), and [Appendix A.1.1](https://arxiv.org/html/2610.10904v3#A1.SS1.SSS1) give an exact matching-size/perfect-detection tradeoff already on bipartite insertion-only inputs. The weighted transfer is documented in the companion [weighted review](weighted-matching-ko-review-2026-11-04.md).

For graph size n and w = Θ(log n), the stated bound is u + q = Ω((log n / log(uw))²). In particular, q = O(1) requires u = Ω((log n / log log n)²). Updates are worst-case over inputs and tapes; queries are expected for each fixed valid input history. Correctness holds for every input and random tape. Cells and addresses have w bits, all persistent input-dependent information is charged, and preprocessing is unrestricted and uncharged. Final queries in the reduction perform updates, so this is not a query-only lower bound. Fully dynamic algorithms must support these insertion histories.

Three research records cover the two existing unweighted routes and the weighted exact panel. Red hexagons distinguish this zero-error model from red OMv diamonds. Symbolic strips preserve the bounds without inventing polynomial-axis coordinates or projecting exact hardness onto approximation curves. No amortized-update, bounded-error, or approximation lower bound is asserted. Publication filtering removes the preprint. Paper/source inspection, compact figures and text-free overviews preserve the distinction.

Statements, models and reduction contracts were reviewed; the full information-theoretic proof was not independently verified. Exhaustive small matching-gadget tests check the reduction interpretation only: 12,420 unweighted and 132 weighted instances plus baseline and oracle checks.

## Correlation clustering and deferred setups

The [CC review](cc-arxiv-review-2026-11-04.md) updates the public open-question source to 2607.27829v3 and qualifies the archived Combined record: the fast implementation is randomized with expected time, whereas polynomial-time rounding can be derandomized. Approximation factors and the shared CC scale are unchanged. Combined remains hidden.

Constrained correlation clustering (2611.04784v1) awaits a new-setup choice. Sequential MaxAgree (2609.35453v2) supplies no streaming resource guarantee and was not substituted into the streaming figure. Alma excluded crash-tolerant LOCAL (2611.04898v1) for now. The prior DAG streaming-coloring question remains pending. Online and fine-grained research remain archived.

Build, full renderer/source/shape/open-problem regression, independent gadget checks, desktop and mobile layouts, source inspection, publication filters and semantic zoom passed before release. Deployment and artifact evidence are recorded separately in the workspace release manifest.
