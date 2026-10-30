# Weighted matching query models — 30 October 2026

Both requested empty cells have separate explicit-edges and additive-estimation panels. This is a bounded baseline review, not an exhaustive frontier.

[Edmonds (1965)](https://nvlpubs.nist.gov/nistpubs/jres/69B/jresv69Bn1-2p125_A1b.pdf): Sections 1–4, Theorems (P)/(M), and weighted algorithm §7. It solves a fully known graph. Query scans are elementary compositions: n+2m weighted-neighbor replies (including one terminal reply per vertex); n(n−1)/2 unordered weighted-pair replies. Optimization on the stored graph uses no further oracle calls. Query and computation costs remain distinct.

[Nguyen–Onak (FOCS 2008)](https://people.csail.mit.edu/konak/download/publications/Nguyen_Onak-constant_time_approximation.pdf#page=3): Definition 3, Model §1.4, Maximum Weight Matching statement §1.5. Weights [0,1], bounded degree Δ, additive εn error, success ≥2/3. The weighted proof is explicitly omitted in this conference version. We retain f(Δ,ε), independent of n, and do not invent a parameter exponent or claim independent proof verification.

Matrix simulation answers each list request by reading a row and ordering present neighbors by label, caching the row. At most (n−1)f(Δ,ε) pair queries, with the same additive and probability guarantees. This is an elementary simulation, not a matrix theorem stated by Nguyen–Onak.

## Derived lower bound

Let N=n(n−1)/2. Give the algorithm the entire topology of K_n for free. Choose a uniform hidden edge e*, assign it weight H=ceil(n/β), and give every other edge weight 1, for a fixed 0<β≤1. A matching omitting e* has weight at most floor(n/2), while β·OPT≥βH≥n, so every successful β-approximate matching must contain e*. Fix the algorithm’s random coins. Until it reads e*, its transcript is identical to the all-unit-weight graph. Its at-most-q probes inspect at most q distinct edges along that transcript; its no-hit output contains at most floor(n/2) further candidate edges. Thus success over the uniform hidden edge is at most (q+floor(n/2))/N. Averaging over the coins preserves this bound. Success probability at least 2/3 on every input requires q≥2N/3−floor(n/2)=Ω(n²). A weighted-neighbor query or pair query reveals at most one edge weight; duplicated reads do not help. This is a worst-case query-budget bound for explicit matching output, with polynomial weight range H=O(n) when β is fixed. It does not assert a lower bound for εn-additive scalar estimation.

Stored separately in derivedBounds, with its full proof inspectable; no fictitious paperId. This does not constrain additive scalar estimation. Main symbolic axes keep the contracts separate; text hides at overview. Root must run pair/global/browser checks before publication.
