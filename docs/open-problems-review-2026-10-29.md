# Open directions below the figures

Reviewed 29 October 2026. `src/open-problems.json` covers all six visible problem families. The `models` field identifies directly relevant settings; an empty list denotes a broader foundational question. Under another setting, the card is labeled as a question across the problem family and retains its explicit setup.

These cards do not turn missing atlas results into lower bounds. Paper-stated questions and editorial questions inferred from a bounds gap have distinct status text. No algorithm or lower-bound marks are added.

- Matching: Reviewed Introduction and Theorem 1 of Liu–Naidu–Nguyen–Sundaresan v1. Preserve fixed ε, insertion-only streams, and matching-edge output. Do not extend the lower bound to size estimation.
- Weighted matching: Reviewed Introduction and Theorem 1 of the ICALP 2025 version of Derakhshan–Saneian. The question fixes degree O(1/p); the unweighted polynomial-in-1/p result does not settle this regime.
- MIS: Reviewed Open Question 1, Theorem 1, and following discussion in Khoury–Schild v1. STOC 2026 proceedings confirm publication. Their girth restriction leaves the general-graph question open; their result refutes the older tree conjecture.
- Correlation clustering: Reviewed Theorem 1.3 of García-Soriano–Schohn v2. The question is an editorial inference from its gap bounds. Preserve complete unweighted MinDisagree and cluster LP scope; 4/3 is not universal computational hardness.
- Edge coloring: Reviewed Section 3 of Sadeh–Kaplan v2. The question concerns extending the shift-tree technique. It does not claim small-palette edge coloring itself is unsolved.
- Vertex coloring: Reviewed Theorem 1.1 and the discussion of improving √n in Gil–Halldórsson v2. A random-color-trial limitation is not a general lower bound. Preserve preprint status.

Exact source and theorem URLs are retained in the JSON. Primary theorem statements and surrounding definitions were read, and targeted searches screened for obvious later resolutions. This is a scoped review, not an exhaustive certification of current openness.

Follow-up research candidate: Khoury–Schild's STOC 2026 restricted-girth MIS algorithm may deserve a new plotted entry after a dedicated theorem and model review. This UI release adds its open question, not an unreviewed bound marker.
