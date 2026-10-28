# Correlation clustering: a comparable overview

Alma requested that the zoomed-out atlas carry an interpretable comparison across settings, and chose the actual approximation factor α rather than a normalized score. She also requested removal of the entire fine-grained complexity page for now.

## Display contract

- Eight clustering models use the same **linear α=1–4 coordinate system** in their summaries and focused views. α=1 is optimal. The map contains 61 existing verified records across nine views, including the separate streaming cost-estimate view.
- Blue panels minimize disagreements with no additive error. Purple panels show the multiplicative coefficient of a mixed guarantee, with the additive error retained in the row and inspector. Gold panels maximize agreements, with α defined as the reciprocal of the source guaranteed fraction. An expected guarantee is not changed into a sample-by-sample guarantee.
- Green circles indicate general-input algorithms, squares mark restricted graph classes, and a triangle identifies the exponential-computation exact baseline. Lower bounds remain red diamonds. These shape distinctions survive the overview.
- Resource/setup rows are categorical. Their order and spacing do not assert an ordering of query costs, rounds, memory, update guarantees, or computational effort. The detailed resource plots remain expandable.
- The shared ε=1/8 reference applies only to plotted multiplicative factors. It does not specialize additive-error parameters or lower-bound ranges. The integer-phase LOCAL and streaming references use r=16; LOCAL retains its vanishing correction with an arrow and explanation.
- Unknown constants, growing factors, and the factor 1442 remain outside the numeric axis. They are inspectable, not assigned fake coordinates or clipped to 4.
- Green retains algorithm meaning; red retains lower-bound meaning. Resource lower bounds are placed at a stated guarantee target, not represented as approximation impossibility thresholds. Online competitive barriers retain their separate objective and decision rule.
- Stochastic clustering remains a recovery figure. It has no approximation ratio to transfer to this scale.
- Narrow screens show the complete approximation axis; selecting a marker reveals its cost, assumptions and paper. Desktop and full-atlas zoom expose those annotations directly.

`data/cc-comparison.json` transcribes the already reviewed focus records. It does not add new literature claims. The total-query annotation for the Bonchi et al. additive algorithm follows by applying its polynomial-probe local routine to all n vertices; exponential computation remains separately identified in the original theorem view.

## Fine-grained page

The graph-atlas navigation no longer links to it, and the build removes `dist/fine-grained.html`. Source, data, and mathematical regression checks remain archived. The daily arXiv automation excludes this page until Alma explicitly resumes it.

## Validation

The regression suite checks shared coordinates across models and zoom levels, all record/source identities, additive and agreement scopes, reciprocal barrier direction, symbolic factors, LOCAL's residual term, publication filtering, standalone SVG validity, and absence of the published fine-grained page. Existing pair renderers and archived mathematical checks still run.

Browser review covers the full overview and enlarged Dynamic, LCA and adjacency-matrix cells, lower-bound inspection and paper links, expandable original resource plots, and all nine comparison routes at 360px. The narrow viewport has no document overflow; browser error/warning logs are empty. Preview PNGs are exports of the actual summary renderers.
