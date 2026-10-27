#!/usr/bin/env python3
"""Preview proposed axis and coordinate assignments for editorial review.

This script never edits research records. A symbolic expression may contain
important qualifiers (epsilon, density, output type, memory) that a regex
cannot validate against a paper or a setting. Edit reviewed coordinates in
data/research/*.json, then run build.py --check.

Conventions (see docs/research-contract.md):
  x  is a property of the PROBLEM (the quality dimension, if the task has one)
  y  is a property of the MODEL   (the resource it charges)
  a task with a fixed guarantee (maximality) has no quality dimension -> mode "1d"
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROBLEMS = ("matching", "mis", "cc", "edge", "vertex")

# ---------------------------------------------------------------- resource axes
N_TICKS = [0, 0.5, 1, 1.5, 2]
N_LABELS = ["polylog", "\u221an", "n", "n^{3/2}", "n\u00b2"]

DYNAMIC = {"label": "Update-time exponent q in \u00d5(n^q) (lower is faster)", "kind": "exponent",
           "min": 0, "max": 1.5, "ticks": [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5],
           "tickLabels": ["polylog", "n^{1/4}", "\u221an", "n^{3/4}", "n", "n^{5/4}", "n^{3/2}"]}
SPACE = {"label": "Space exponent p in \u00d5(n^p) bits", "kind": "exponent",
         "min": 0, "max": 2, "ticks": N_TICKS, "tickLabels": N_LABELS}
PASSES = {"label": "Passes", "kind": "passes", "min": 1, "max": 8, "ticks": [1, 2, 3, 4, 6, 8]}
QUERIES = {"label": "Query exponent p in \u00d5(n^p)", "kind": "exponent",
           "min": 0, "max": 2, "ticks": N_TICKS, "tickLabels": N_LABELS}
MPC = {"label": "Round ladder", "kind": "rounds", "min": 0, "max": 5, "ticks": [0, 1, 2, 3, 4, 5],
       "tickLabels": ["O(1)", "log\u00b3log n", "log log n", "log^k log n", "\u221alog n", "\u2265 log n"]}
LOCAL_N = {"label": "Round ladder in n", "kind": "rounds", "min": 0, "max": 5, "ticks": [0, 1, 2, 3, 4, 5],
           "tickLabels": ["O(1)", "log* n", "polyloglog n", "\u221alog n", "log n", "polylog n"]}
LOCAL_D = {"label": "\u0394-dependence exponent t in \u00d5(\u0394^t)", "kind": "exponent",
           "min": 0, "max": 1, "ticks": [0, 0.25, 0.5, 0.75, 1],
           "tickLabels": ["polylog \u0394", "\u0394^{1/4}", "\u221a\u0394", "\u0394^{3/4}", "\u0394"]}
LCA = {"label": "Probe ladder in \u0394 (per answered query)", "kind": "probes", "min": 0, "max": 4,
       "ticks": [0, 1, 2, 3, 4],
       "tickLabels": ["polylog n", "poly(\u0394)", "\u0394^{O(log log \u0394)}", "\u0394^{O(log \u0394)}", "\u0394^{O(log\u00b2\u0394)}"]}

# ------------------------------------------------------------------- x (quality)
PALETTE_RATIO = {"label": "Palette ratio r = q/\u0394", "kind": "palette", "min": 1, "max": 2.25,
                 "ticks": [1, 1.25, 1.5, 1.75, 2, 2.25],
                 "tickLabels": ["\u0394", "5\u0394/4", "3\u0394/2", "7\u0394/4", "2\u0394"]}
PALETTE_SLACK = {"label": "Palette slack c in q = \u0394 + c", "kind": "palette", "min": 0, "max": 8,
                 "ticks": [0, 1, 2, 3, 4, 6, 8]}

FIXED_GUARANTEE = ("task guarantee", "maximality", "maximality guarantee")
SLACK_HINTS = ("\u0394+c", "\u0394+C", "\u0394_t\u2264\u0394_t+C", "\u0394+O(\u03b1)", "q=\u0394 ")


SUPERS = str.maketrans({"\u2070": "0", "\u00b9": "1", "\u00b2": "2", "\u00b3": "3", "\u2074": "4",
                        "\u2075": "5", "\u2076": "6", "\u2077": "7", "\u2078": "8", "\u2079": "9"})


def norm(s):
    """Fold unicode superscripts to ^n so one set of regexes reads every bound."""
    out, prev = [], ""
    for ch in (s or ""):
        d = ch.translate(SUPERS)
        if d != ch and prev not in ("^", ""):
            out.append("^")
        out.append(d)
        prev = out[-1]
    return "".join(out).replace("\u207b", "-")


# ------------------------------------------------------------------- bound readers
AMBIGUOUS = ("min{", "min(", "max{", "max(", "T(poly", "\u03b2(G)", "2^p", "n^{1+1/")


def regime_dependent(b):
    """A bound whose value flips with an unstated regime (min/max of incomparable
    terms, a free parameter) must not be auto-placed; it needs a human reading."""
    t = norm(b)
    return any(h in t for h in AMBIGUOUS)


def exponent_in_n(b):
    """Exponent p such that the bound is \u00d5(n^p). None when it cannot be read off."""
    if regime_dependent(b):
        return None
    t = norm(b)
    if "\u03b2(G)" in t or "T(poly" in t or "2^p" in t or "/p" in t or "b log" in t:
        return None  # parameter-dependent; stays symbolic
    m = re.search(r"n\^?\{?\(?(\d+)\s*/\s*(\d+)\)?\}?", t)
    if m:
        return int(m.group(1)) / int(m.group(2))
    if re.search(r"n\^?\{?\(?1\s*[-+]\s*o\(1\)\)?\}?", t):
        return 1.0
    if re.search(r"n\^?\{?\(?2\s*-\s*o\(1\)\)?\}?", t) or re.search(r"[\u03a9O\u00d5]\(n\^?2\)", t):
        return 2.0
    m = re.search(r"n\^?\{?(\d+)\}?(?![\d/])", t)
    if m and "log" not in t[max(0, m.start() - 6):m.start()]:
        return float(m.group(1))
    if re.search(r"(\u221am|sqrt\(m\)|m\^?\{?\(?1/2)", t):
        return 1.0  # dense convention m = \u0398(n\u00b2)
    m = re.search(r"m\^?\{?\(?(\d+)\s*/\s*(\d+)\)?\}?", t)
    if m:
        return 2 * int(m.group(1)) / int(m.group(2))
    if re.search(r"(\u221an|sqrt\(n\))", t):
        return 0.5
    if re.search(r"[\u03a9O\u00d5]\(\s*n\s*(log|polylog|\))", t) or "n log n) bits" in t:
        return 1.0
    if re.search(r"[nm]\^", t):
        return None  # a power of n or m we could not read; never fall through to polylog
    if re.search(r"\u0394\^|poly\(\u0394\)|O\(\u0394\)|\u0394\s*[\u00b7*]", t):
        return None  # \u0394-dominated; not an n-exponent
    if re.search(r"[O\u00d5]\(1\)", t) or "log" in t:
        return 0.0   # polylogarithmic in n (\u0394 \u2264 n, so log \u0394 lands here too)
    return None


def passes_count(b):
    if regime_dependent(b):
        return None
    t = norm(b)
    if "log log n" in t:
        return 3.0  # O(log log n) passes, charted at the small-constant end
    m = re.search(r"(\d+)\s*pass", t)
    return float(m.group(1)) if m else None


def round_ladder(b):
    """MPC: 0 O(1) | 1 log\u00b3log n | 2 log log n | 3 log^k log n | 4 \u221alog n | 5 log n and above."""
    if regime_dependent(b):
        return None
    t = norm(b)
    if "log log n /" in t or "log log n/" in t:
        return 2.0
    if "log n /" in t or "log n/" in t:
        return 5.0
    if "log log log" in t:
        return 1.0
    if re.search(r"log\^\d+\s*log", t):
        return 3.0
    if "log log" in t:
        return 2.0
    if re.search(r"(\u221a\(?log|sqrt\(log)", t):
        return 4.0
    if "polylog" in t or "poly(log" in t or re.search(r"log\^\d+\s*n", t):
        return 5.0
    if "log n" in t or "log \u0394" in t:
        return 5.0
    if re.search(r"[O\u00d5]\(1\)", t):
        return 0.0
    return None


def local_ladder(b):
    """LOCAL in n: 0 O(1) | 1 log* n | 2 polyloglog n | 3 \u221alog n | 4 log n | 5 polylog n."""
    if regime_dependent(b):
        return None
    t = norm(b)
    if "log log n /" in t or "log log n/" in t:
        return 2.0
    if "log n /" in t or "log n/" in t:
        return 4.0
    if "log* n" in t or "log*n" in t or "log^* n" in t:
        return 1.0
    if "log log" in t or re.search(r"log\^\d+\s*log", t):
        return 2.0
    if re.search(r"(\u221a\(?log n|sqrt\(log n)", t):
        return 3.0
    if "polylog" in t or "poly(log" in t or re.search(r"log\^\{?\(?[\d/]", t):
        return 5.0
    if "log n" in t:
        return 4.0
    if re.search(r"[O\u00d5]\(1\)", t):
        return 0.0
    return None


def delta_exponent(b):
    if regime_dependent(b):
        return None
    if re.search(r"(bounded|constant)\s*\u0394", norm(b)):
        return None
    t = norm(b)
    if re.search(r"\u0394\^?\{?\(?(\d+)\s*/\s*(\d+)", t):
        m = re.search(r"\u0394\^?\{?\(?(\d+)\s*/\s*(\d+)", t)
        return min(1.0, int(m.group(1)) / int(m.group(2)))
    if re.search(r"(\u221a\u0394|sqrt\(\u0394\))", t):
        return 0.5
    if re.search(r"O\(\u0394[\s)\u00b7*]", t) or re.search(r"\u0394\s*\+", t):
        return 1.0
    if "log \u0394" in t or "log\u0394" in t or "polylog" in t:
        return 0.0
    return None


def lca_ladder(b):
    if regime_dependent(b):
        return None
    if re.search(r"(bounded|constant)\s*\u0394", norm(b)):
        return None
    t = norm(b)
    if "log^2 \u0394" in t or "log^{2}" in t or "\u0394^2" in t or "2^{O(\u0394" in t:
        return 4.0
    if re.search(r"\u0394\^?\{?O\(log \u0394", t):
        return 3.0
    if re.search(r"\u0394\^?\{?O\(log log \u0394", t):
        return 2.0
    if "poly(\u0394)" in t or re.search(r"\u0394\^", t):
        return 1.0
    if "polylog" in t or "poly(log" in t:
        return 0.0
    return None


def palette_ratio(text):
    t = norm(text)
    if re.search(r"2\u0394\s*[-\u2212]\s*1", t):
        return 2.0
    if "3\u0394/2" in t or "\u230a3\u0394/2\u230b" in t:
        return 1.5
    if "(1+\u03b5)\u0394" in t or "(1 + \u03b5)\u0394" in t:
        return 1.1
    if re.search(r"\u0394\s*\+\s*(o\(\u0394\)|O\(\u221a|\u221a\u0394)", t):
        return 1.05
    if re.search(r"\u0394\s*\+\s*1", t) or "\u0394+1" in t:
        return 1.0
    return None


RECOURSE = {"label": "Recourse per update", "kind": "recourse", "min": 0, "max": 3, "ticks": [0, 1, 2, 3],
            "tickLabels": ["O(1)", "log n", "log\u00b2 n", "poly"]}


def recourse_level(b):
    if regime_dependent(b):
        return None
    t = norm(b)
    if re.search(r"log\^?\{?\(?[2-9]", t):
        return 2.0
    if "log n" in t or "log \u0394" in t:
        return 1.0
    if re.search(r"O\(1\)|amortized 1|\bconstant\b", t):
        return 0.0
    return None


APPROX = {"label": "Approximation factor \u03b1 (lower is better)", "kind": "approximation", "min": 1, "max": 3,
          "ticks": [1, 1.5, 2, 2.5, 3]}
CC_APPROX = {"label": "Approximation factor \u03b1 = cost / OPT", "kind": "approximation", "min": 1, "max": 6,
             "ticks": [1, 2, 3, 4, 5, 6]}


def approx_factor(text):
    """\u03b1 \u2265 1. None when the guarantee names no numeric constant."""
    t = norm(text)
    if "\u03b1_best" in t or "O(1)-approx" in t or "Constant-factor" in t or "O(log" in t:
        return None
    m = re.search(r"\u03b1\s*[=\u2248<>]\s*(\d+(?:\.\d+)?)", t)
    if m:
        return float(m.group(1))
    if "2\u22122/13" in t or "2-2/13" in t:
        return 1.847
    m = re.search(r"\((\d+(?:\.\d+)?)\s*[+\u2212-]\s*(?:\u03b5|\u03b5\u2080)\)", t)
    if m:
        return float(m.group(1))
    m = re.search(r"(?:^|[\s\u2264])(\d+(?:\.\d+)?)[\u00b7*]?\s*(?:-approx|\u00b7OPT|\u00d7OPT)", t)
    if m:
        return float(m.group(1))
    m = re.search(r"(\d+(?:\.\d+)?)-approx", t)
    if m:
        return float(m.group(1))
    return None


def palette_slack(text):
    t = norm(text)
    m = re.search(r"\u0394\s*\+\s*(\d+)", t)
    return float(m.group(1)) if m else None


# --------------------------------------------------------------------- assignment
def resource_axis(slice_, model):
    label = norm(slice_.get("yAxis", {}).get("label", "")).lower()
    bounds = " ".join(norm(r["bound"]) for r in slice_["results"])
    if model == "dynamic":
        if "recourse" in label:
            return RECOURSE, recourse_level
        return DYNAMIC, exponent_in_n
    if model == "stream":
        if "pass" in label:
            return PASSES, passes_count
        return SPACE, exponent_in_n
    if model == "mpc":
        return MPC, round_ladder
    if model == "lca":
        return LCA, lca_ladder
    if model == "local":
        return (LOCAL_D, delta_exponent) if re.search(r"\u0394\^|\u221a\u0394|O\(\u0394", bounds) else (LOCAL_N, local_ladder)
    return QUERIES, exponent_in_n


def main():
    report = []
    for problem in PROBLEMS:
        path = ROOT / "data" / "research" / f"{problem}.json"
        record = json.loads(path.read_text())
        for s in record["slices"]:
            if s["model"] in ("online", "stochastic"):
                continue  # Competitive ratios and recourse need explicitly curated axes.
            if any(r.get("plot") for r in s["results"]):
                continue  # already hand-placed; never overwrite verified coordinates
            model = s["model"]
            orig_y = norm(s.get("yAxis", {}).get("label", "")).lower()
            axis, read_y = resource_axis(s, model)
            xlabel = norm(s.get("xAxis", {}).get("label", "")).lower()
            # A quality dimension the slice itself pins down is not a dimension:
            # fixed maximality, or a fixed additive-error budget, collapses to a line.
            additive = "additive" in xlabel and "multiplicative" not in xlabel
            one_d = any(h in xlabel for h in FIXED_GUARANTEE) or additive

            if one_d:
                s.pop("xAxis", None)
                s.pop("yAxis", None)
                s["mode"] = "1d"
                s["axis"] = dict(axis)
                if additive:
                    s.setdefault("parameters", {})["coordinateConvention"] = (
                        "The additive error budget \u03b5n\u00b2 is held fixed by this slice, so quality is not a free "
                        "dimension here; the line charts only the resource. Each result keeps its exact \u03b5 dependence "
                        "in its bound.")
                placed = 0
                for r in s["results"]:
                    v = read_y(r["bound"])
                    if v is None or not (axis["min"] <= v <= axis["max"]):
                        r["plot"] = None
                        continue
                    r["plot"] = {"v": v, "closure": "right" if r["kind"] == "upper" else "left",
                                 "strict": False, "label": r["bound"][:28]}
                    placed += 1
                report.append((problem, model, s["id"], "1d", placed, len(s["results"])))
                continue

            s["yAxis"] = dict(axis)
            read_x = None
            if problem in ("edge", "vertex"):
                use_slack = any(h.lower() in xlabel for h in SLACK_HINTS) or "recourse" in orig_y
                s["xAxis"] = dict(PALETTE_SLACK if use_slack else PALETTE_RATIO)
                read_x = palette_slack if use_slack else palette_ratio
            elif problem == "cc":
                s["xAxis"] = dict(CC_APPROX)
                read_x = approx_factor
            elif problem == "matching":
                s["xAxis"] = dict(APPROX)
                read_x = approx_factor
            placed = 0
            for r in s["results"]:
                y = read_y(r["bound"])
                x = read_x(r["guarantee"] + " " + r["bound"]) if read_x else None
                if read_x is None or x is None or y is None:
                    r["plot"] = None
                    continue
                if not (s["xAxis"]["min"] <= x <= s["xAxis"]["max"] and axis["min"] <= y <= axis["max"]):
                    r["plot"] = None
                    continue
                r["plot"] = {"x": x, "y": y, "closure": "upper-right" if r["kind"] == "upper" else "lower-left",
                             "strictX": False, "strictY": False, "label": r["bound"][:28]}
                placed += 1
            report.append((problem, model, s["id"], "2d", placed, len(s["results"])))
        # Candidate projections are deliberately kept in memory. In particular,
        # a palette Δ+1 cannot be plotted at q/Δ=1, and O(log log n) passes
        # cannot be plotted as a constant number of passes.

    placed = sum(r[4] for r in report)
    total = sum(r[5] for r in report)
    print(f"Preview only: {len(report)} slices analyzed; {placed}/{total} candidate coordinates. No files changed.")
    for row in report:
        if row[4] == 0:
            print("  unplaced:", row[2])


if __name__ == "__main__":
    main()
