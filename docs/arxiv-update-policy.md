# Daily arXiv review

Alma authorized daily arXiv review and verified website updates on 2026-10-27. The active chat automation is `update-theory-atlas-from-arxiv`, scheduled daily at 09:00 America/New_York. The older finite-queue automation remains paused.

## Search and checkpoint

Read `../arxiv-monitor-state.json` from the project root. Search new and revised arXiv submissions in cs.DS and cs.CC, with targeted related-category searches for the problems and models already represented in the graph atlas. The fine-grained page is paused and excluded from monitoring and publication until Alma resumes it. Include weighted and stochastic matching. The first run covers the preceding seven days; subsequent runs overlap the last successful search by seven days. Follow pagination and rate limits, record search intervals and query coverage, and do not claim a complete check when retrieval was partial.

Deduplicate by base arXiv ID and version, and compare against existing bibliography records. A new version can correct, retract, or strengthen an older result. Keep candidate dispositions (`integrated`, `already_covered`, `irrelevant`, `needs_review`, `needs_setup_choice`) with source/version, date, and reason. Update the successful checkpoint only after a complete search; deployment status is recorded separately.

## Evidence before publication

Read full theorem statements and model definitions. Preserve graph/input classes, objectives and outputs, query interfaces, approximation thresholds, parameter regimes, randomness, adversaries, resource units, and theorem locations. Abstracts identify candidates; they are insufficient evidence for plotted bounds. Preprints keep a visible status and version. A claimed resolution of a conjecture must be clearly distinguished from a historical conditional implication and from an independently checked or published result.

If fine-grained work is explicitly resumed in the future, store the reduction direction and exact algorithmic consequence separately. Record input-size transformation, exponent loss, reduction cost, decision versus reporting, and computational model. A path of edges is not automatically composable. Never infer equivalence from a one-way reduction.

Use green for algorithms and red for lower bounds, with distinct graph/setup colors. Do not put incompatible contracts on one numerical axis. Ask Alma only when a new setup or ambiguous comparison requires a substantive choice; retain the candidate and continue independent review.

## Release

Inspect active work and the Git tree before editing. Preserve concurrent edits. Update data, affected figures and source inspection; run the build, relevant regression checks, browser layout checks and semantic-zoom checks. Publish only the reviewed committed build using `scripts/publish.py`, then verify Pages deployment and byte parity for every deployed page. Refresh offline artifacts and release evidence. Do not force-push or change authentication, repository visibility, or branch protections.

No relevant verified change means no site change. Report published additions/corrections, required setup choices, or failures; routine unchanged checks stay quiet. Keep this process bounded to the atlas's represented topics rather than adding arbitrary research areas automatically.
