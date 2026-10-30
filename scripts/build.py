#!/usr/bin/env python3
"""Validate source records and compile the standalone, offline atlas."""
import argparse
import json
import math
from pathlib import Path
from fine_grained import build_fine_grained
from site_pages import site_navigation, site_theme, build_site_pages

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
PROBLEMS = ("matching", "weighted_matching", "mis", "cc", "edge", "vertex")


def require(condition, message):
    if not condition:
        raise ValueError(message)


def validate(catalog, research):
    problems = {p["id"] for p in catalog["problems"]}
    models = {m["id"] for m in catalog["models"]}
    require(problems == set(PROBLEMS), "Catalog problem IDs differ from research files")
    require(len(models) == len(catalog["models"]), "Duplicate model ID")
    for m in catalog["models"]:
        require(all(m.get("access", {}).get(k) for k in ("interface", "operations", "resource")), f"Model access metadata missing: {m['id']}")
    require(len(catalog["relations"]) == len({e["id"] for e in catalog["relations"]}), "Duplicate relation")
    for edge in catalog["relations"]:
        require(edge["from"] in problems and edge["to"] in problems, f"Bad relation: {edge['id']}")
    all_papers = set()
    all_slices = set()
    all_results = set()
    for record in research:
        pid = record["problem"]
        require(pid in problems, f"Unknown problem {pid}")
        require(record["reviewedThrough"], f"Missing review date: {pid}")
        covered = {c["model"] for c in record["coverage"]}
        require(covered == models, f"Missing model coverage: {pid}: {models - covered}")
        paper_ids = set()
        for p in record["papers"]:
            key = (pid, p["id"])
            require(key not in all_papers, f"Duplicate paper {key}")
            all_papers.add(key)
            paper_ids.add(p["id"])
            require(p["url"].startswith("https://"), f"Missing primary URL: {key}")
            require(p["publicationStatus"] in ("conference", "journal", "preprint"), f"Bad publicationStatus: {key}")
        for s in record["slices"]:
            sid = s["id"]
            require(sid not in all_slices, f"Duplicate slice: {sid}")
            all_slices.add(sid)
            require(s["problem"] == pid and s["model"] in models, f"Bad slice scope: {sid}")
            require(s["task"] and s["assumptions"], f"Missing task or assumptions: {sid}")
            axes = [s.get("axis")] if s.get("mode") == "1d" else [s.get("xAxis"), s.get("yAxis")]
            for axis in axes:
                require(isinstance(axis, dict) and axis.get("label"), f"Axis missing: {sid}")
                if isinstance(axis.get("min"), (int, float)) and isinstance(axis.get("max"), (int, float)):
                    ticks = axis.get("ticks")
                    require(isinstance(ticks, list) and len(ticks) >= 2, f"Numeric axis needs explicit ticks: {sid}")
                    require(all(isinstance(v, (int, float)) and math.isfinite(v) for v in ticks), f"Invalid ticks: {sid}")
                    require(ticks == sorted(set(ticks)) and ticks[0] == axis["min"] and ticks[-1] == axis["max"], f"Tick range/order mismatch: {sid}")
            one_d = s.get("mode") == "1d"
            if one_d:
                axis = s.get("axis")
                require(isinstance(axis, dict) and axis.get("label"), f"1D slice needs an axis: {sid}")
                require("xAxis" not in s and "yAxis" not in s, f"1D slice must not carry xAxis/yAxis: {sid}")
                numeric = all(isinstance(axis.get(k), (int, float)) and math.isfinite(axis[k]) for k in ("min", "max"))
                if numeric:
                    require(axis["min"] < axis["max"], f"Reversed 1D axis: {sid}")
                    labels = axis.get("tickLabels")
                    if labels is not None:
                        require(isinstance(labels, list) and len(labels) == len(axis.get("ticks", [])), f"tickLabels must match ticks: {sid}")
                for r in s["results"]:
                    require(r["id"] not in all_results, f"Duplicate result: {r['id']}")
                    all_results.add(r["id"])
                    require(r["paperId"] in paper_ids, f"Unknown paper: {sid} {r['paperId']}")
                    require(r["kind"] in ("upper", "lower"), f"Unknown result kind: {r['id']}")
                    require(r["bound"] and r["guarantee"] and r["sourceLocation"], f"Incomplete result: {r['id']}")
                    plot = r.get("plot")
                    if plot is not None:
                        require(numeric, f"Cannot project symbolic result: {r['id']}")
                        require("x" not in plot and "y" not in plot, f"1D plot must use v, not x/y: {r['id']}")
                        v = plot.get("v")
                        require(isinstance(v, (int, float)) and math.isfinite(v) and axis["min"] <= v <= axis["max"], f"Plot outside axis: {r['id']}")
                        expected = ("right", "point") if r["kind"] == "upper" else ("left", "point")
                        require(plot.get("closure") in expected, f"Bad 1D closure: {r['id']}")
                continue
            x, y = s["xAxis"], s["yAxis"]
            numeric = all(isinstance(a.get(k), (int, float)) and math.isfinite(a[k]) for a in (x, y) for k in ("min", "max"))
            for a in (x, y):
                labels = a.get("tickLabels")
                if labels is not None:
                    require(isinstance(labels, list) and len(labels) == len(a.get("ticks", [])), f"tickLabels must match ticks: {sid}")
            if numeric:
                require(all(isinstance(a[k], (int, float)) and math.isfinite(a[k]) for a in (x, y) for k in ("min", "max")), f"Invalid numeric axis: {sid}")
                require(x["min"] < x["max"] and y["min"] < y["max"], f"Reversed numeric axis: {sid}")
            for r in s["results"]:
                require(r["id"] not in all_results, f"Duplicate result: {r['id']}")
                all_results.add(r["id"])
                require(r["paperId"] in paper_ids, f"Unknown paper: {sid} {r['paperId']}")
                require(r["kind"] in ("upper", "lower"), f"Unknown result kind: {r['id']}")
                require(r["bound"] and r["guarantee"] and r["sourceLocation"], f"Incomplete result: {r['id']}")
                plot = r.get("plot")
                if plot is not None:
                    require(numeric, f"Cannot project symbolic result: {r['id']}")
                    require(all(isinstance(plot[k], (int, float)) and math.isfinite(plot[k]) and a["min"] <= plot[k] <= a["max"] for k, a in (("x", x), ("y", y))), f"Plot outside axes: {r['id']}")
                    require(plot["closure"] in (("upper-right", "point") if r["kind"] == "upper" else ("lower-left", "point")), f"Bad plot closure: {r['id']}")
    return {"papers": len(all_papers), "slices": len(all_slices), "results": len(all_results)}


def load_pairs(focus, catalog, research):
    """Load independently authored figures through one validated registration file."""
    manifest = json.loads((DATA / "focus" / "pairs.json").read_text())
    require(manifest.get("version") == 1, "Unsupported focused-pair manifest version")
    pairs = manifest.get("pairs", [])
    require(isinstance(pairs, list), "Focused pairs must be a list")
    slices = {s["id"]: s for p in research for s in p["slices"]}
    ids, keys, registered_slices = set(), set(), set()
    for pair in pairs:
        pid = pair.get("id")
        require(pid and pid not in ids and pid not in focus, f"Duplicate focused pair: {pid}")
        ids.add(pid)
        for field, folder in (("dataFile", DATA / "focus"), ("javascript", ROOT / "src"), ("css", ROOT / "src")):
            name = pair.get(field, "")
            path = (folder / name).resolve()
            require(name and folder.resolve() in path.parents and path.is_file(), f"Missing or invalid pair {field}: {pid}")
        record = json.loads((DATA / "focus" / pair["dataFile"]).read_text())
        rows = record.get("verifiedRecords", [])
        all_rows = rows + record.get("relatedResults", [])
        require(rows and len({r["id"] for r in all_rows}) == len(all_rows), f"Missing or duplicate pair results: {pid}")
        require(record.get("sourceVerification"), f"Missing pair source verification: {pid}")
        source_ids = record.get("sources", {})
        for row in all_rows:
            rid = row["id"]
            require(row.get("sourceId") in source_ids, f"Unknown pair source: {pid}/{rid}")
            require(row.get("kind") in ("algorithm", "upper", "lower"), f"Invalid pair result kind: {pid}/{rid}")
            require(all(row.get(k) for k in ("quality", "output", "graph", "theorem", "probability")), f"Incomplete pair theorem scope: {pid}/{rid}")
            require(row.get("displayBound") or row.get("queryComplexity") or row.get("bound"), f"Missing pair resource bound: {pid}/{rid}")
            require(source_ids[row["sourceId"]].get("url", "").startswith("https://"), f"Invalid pair primary URL: {pid}/{rid}")
        if not any(r["kind"] == "lower" for r in rows):
            require(record.get("lowerBoundStatus"), f"Algorithm-only pair must record its lower-bound evidence gap: {pid}")
        axes = record.get("figureAxes", {})
        axes = {p["id"]: p for p in axes} if isinstance(axes, list) else axes
        require(axes, f"Missing pair axes: {pid}")
        for panel, dimensions in axes.items():
            for dimension in ("x", "y"):
                axis = dimensions.get(dimension, {})
                categories = axis.get("categories", [])
                require(axis.get("label"), f"Missing pair axis label: {pid}/{panel}/{dimension}")
                if categories:
                    names = [c.get("id") if isinstance(c, dict) else c for c in categories]
                    require(all(names) and len(set(names)) == len(names), f"Duplicate pair categories: {pid}/{panel}/{dimension}")
                else:
                    ticks = axis.get("ticks", [])
                    require(all(isinstance(axis.get(k), (int, float)) and math.isfinite(axis[k]) for k in ("min", "max")), f"Pair axis needs categories or numeric range: {pid}/{panel}/{dimension}")
                    require(axis["min"] < axis["max"] and len(ticks) >= 2, f"Invalid numeric pair axis: {pid}/{panel}/{dimension}")
                    require(all(isinstance(t, (int, float)) and math.isfinite(t) for t in ticks) and ticks == sorted(set(ticks)) and ticks[0] == axis["min"] and ticks[-1] == axis["max"], f"Invalid pair ticks: {pid}/{panel}/{dimension}")
        for row in rows:
            panel = axes.get(row.get("panel"))
            require(panel, f"Unknown pair panel: {pid}/{row['id']}")
            for dimension, field in pair.get("pointFields", {}).items():
                axis = panel[dimension]
                if axis.get("categories"):
                    names = {c.get("id") if isinstance(c, dict) else c for c in axis["categories"]}
                    require(row.get(field) in names, f"Unrecorded pair coordinate: {pid}/{row['id']}/{field}")
                else:
                    value = row.get(field)
                    require(isinstance(value, (int, float)) and math.isfinite(value) and axis["min"] <= value <= axis["max"], f"Pair coordinate outside axis: {pid}/{row['id']}/{field}")
        routes = pair.get("routes", [])
        require(routes and any(r.get("visible") for r in routes), f"No visible pair route: {pid}")
        local_keys = {r.get("key") for r in routes}
        require(None not in local_keys and len(local_keys) == len(routes), f"Duplicate pair route: {pid}")
        for route in routes:
            key, sid = route["key"], route.get("sliceId")
            require(key not in keys and sid not in registered_slices, f"Duplicate focused pair route/slice: {pid}/{key}")
            keys.add(key)
            registered_slices.add(sid)
            source_slice = slices.get(sid)
            require(source_slice and all(route.get(k) == source_slice[k] for k in ("problem", "model")), f"Pair route scope mismatch: {pid}/{key}")
            require(route.get("label") and isinstance(route.get("visible"), bool), f"Incomplete pair route: {pid}/{key}")
        for alias, target in pair.get("canonicalAliases", {}).items():
            require(alias in local_keys and target in local_keys and alias != target, f"Invalid pair alias: {pid}/{alias}")
            require(target not in pair.get("canonicalAliases", {}), f"Pair aliases must resolve directly: {pid}/{alias}")
            require(next(r for r in routes if r["key"] == target)["visible"], f"Pair alias must target a visible route: {pid}/{alias}")
        require(all(pair.get("axisSummary", {}).get(k) for k in ("x", "y")), f"Missing pair axis summary: {pid}")
        focus[pid] = record
    return pairs


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Validate without writing output")
    args = parser.parse_args()
    catalog = json.loads((DATA / "catalog.json").read_text())
    research = [json.loads((DATA / "research" / f"{p}.json").read_text()) for p in PROBLEMS]
    counts = validate(catalog, research)
    focus = {key: json.loads((DATA / "focus" / filename).read_text()) for key, filename in (
        ("one", "matching-stream.json"), ("two", "matching-stream-two-pass.json"), ("bipartite", "matching-stream-two-pass-bipartite.json"),
        ("dynamic-edges", "matching-dynamic-edges.json"), ("dynamic-size", "matching-dynamic-size.json"))}
    for key, record in focus.items():
        require(len({r["id"] for r in record["results"]}) == len(record["results"]), f"Duplicate focus result: {key}")
        require(any(r["kind"] == "algorithm" for r in record["results"]), f"No algorithm: {key}")
        if not key.startswith("dynamic-"):
            require(any(r["kind"] == "barrier" for r in record["results"]), f"Incomplete frontier: {key}")
        else:
            require(record.get("summaryResultId") in {r["id"] for r in record["results"]}, f"Missing dynamic summary: {key}")
        for r in record["results"]:
            require(0 < r["ratio"] <= 1 and r["url"].startswith("https://"), f"Invalid focus result: {r['id']}")
    lca = json.loads((DATA / "focus" / "matching-lca.json").read_text())
    lca_rows = lca["verifiedRecords"]
    require(len({r["id"] for r in lca_rows}) == len(lca_rows), "Duplicate LCA focus result")
    require(any(r["kind"] == "algorithm" for r in lca_rows) and any(r["kind"] == "lower" for r in lca_rows), "LCA comparison needs algorithms and lower bounds")
    for r in lca_rows:
        require(r.get("sourceId") in lca["sources"], f"Unknown LCA source: {r['id']}")
        require(all(r.get(k) for k in ("quality", "output", "graph", "oracle", "adaptivity", "queryComplexity", "theorem")), f"Incomplete LCA scope: {r['id']}")
        require(lca["sources"][r["sourceId"]]["url"].startswith("https://"), f"Invalid LCA primary URL: {r['id']}")
    focus["lca"] = lca
    for panel, axes in lca["figureAxes"].items():
        require(all(axes.get(k, {}).get("label") and axes[k].get("categories") for k in ("x", "y")), f"LCA axes missing: {panel}")
    local = json.loads((DATA / "focus" / "matching-local.json").read_text())
    local_rows = local["verifiedRecords"]
    require(len({r["id"] for r in local_rows}) == len(local_rows), "Duplicate LOCAL focus result")
    require(any(r["kind"] == "algorithm" for r in local_rows) and any(r["kind"] == "lower" for r in local_rows), "LOCAL needs algorithms and lower bounds")
    for r in local_rows:
        require(r.get("sourceId") in local["sources"], f"Unknown LOCAL source: {r['id']}")
        require(all(r.get(k) for k in ("quality", "output", "graph", "roundComplexity", "randomization", "theorem")), f"Incomplete LOCAL scope: {r['id']}")
        require(local["sources"][r["sourceId"]]["url"].startswith("https://"), f"Invalid LOCAL primary URL: {r['id']}")
    for dimension in ("x", "y"):
        require(local["axes"][dimension].get("label") and local["axes"][dimension].get("categories"), f"LOCAL axis missing: {dimension}")
    focus["local"] = local
    mpc = json.loads((DATA / "focus" / "matching-mpc.json").read_text())
    mpc_rows = mpc["verifiedRecords"]
    require(len({r["id"] for r in mpc_rows}) == len(mpc_rows), "Duplicate MPC focus result")
    require(any(r["kind"] == "algorithm" for r in mpc_rows) and any(r["kind"] == "lower" for r in mpc_rows), "MPC needs algorithms and scoped lower bounds")
    for r in mpc_rows:
        require(r.get("sourceId") in mpc["sources"], f"Unknown MPC source: {r['id']}")
        require(all(r.get(k) for k in ("quality", "output", "graph", "localMemory", "totalMemory", "roundComplexity", "randomization", "theorem")), f"Incomplete MPC scope: {r['id']}")
        require(mpc["sources"][r["sourceId"]]["url"].startswith("https://"), f"Invalid MPC primary URL: {r['id']}")
        if r["kind"] == "lower":
            require(r.get("conditional") is True and r.get("condition") and r.get("componentStability"), f"MPC conditional lower-bound assumptions missing: {r['id']}")
    for dimension in ("x", "y"):
        require(mpc["axes"][dimension].get("label") and mpc["axes"][dimension].get("categories"), f"MPC axis missing: {dimension}")
    focus["mpc"] = mpc
    query_list = json.loads((DATA / "focus" / "matching-query-list.json").read_text())
    query_rows = query_list["verifiedRecords"]
    query_all = query_rows + query_list.get("relatedResults", [])
    require(len({r["id"] for r in query_all}) == len(query_all), "Duplicate adjacency-list result")
    require(any(r["kind"] == "algorithm" for r in query_rows) and any(r["kind"] == "lower" for r in query_rows), "Adjacency-list comparison needs algorithms and lower bounds")
    for r in query_all:
        require(r.get("sourceId") in query_list["sources"], f"Unknown adjacency-list source: {r['id']}")
        require(all(r.get(k) for k in ("quality", "output", "graph", "oracle", "adaptivity", "queryComplexity", "theorem")), f"Incomplete adjacency-list scope: {r['id']}")
        require(query_list["sources"][r["sourceId"]]["url"].startswith("https://"), f"Invalid adjacency-list primary URL: {r['id']}")
    for panel, axes in query_list["axes"].items():
        require(all(axes.get(k, {}).get("label") and axes[k].get("categories") for k in ("x", "y")), f"Adjacency-list axes missing: {panel}")
        for dimension in ("x", "y"):
            categories = axes[dimension]["categories"]
            require(all(c.get("id") and c.get("label") for c in categories) and len({c["id"] for c in categories}) == len(categories), f"Invalid adjacency-list categories: {panel}.{dimension}")
    for r in query_rows:
        axes = query_list["axes"].get(r.get("panel"), {})
        require(r.get("qualityFamily") in {c["id"] for c in axes.get("x", {}).get("categories", [])}, f"Unrecorded adjacency-list guarantee category: {r['id']}")
        require(r.get("resourceLane") in {c["id"] for c in axes.get("y", {}).get("categories", [])}, f"Unrecorded adjacency-list resource category: {r['id']}")
    focus["query-list"] = query_list
    pairs = load_pairs(focus, catalog, research)
    visible_models = [m for m in catalog["models"] if m.get("visible", True)]
    open_problems = json.loads((ROOT / "src" / "open-problems.json").read_text())
    require(set(open_problems["problems"]) == set(PROBLEMS), "Every problem family needs a sourced open question")
    for problem, question in open_problems["problems"].items():
        require(all(question.get(k) for k in ("title", "setup", "question", "context", "status", "sources")), f"Incomplete open question: {problem}")
        require(all(s.get("title") and s.get("url", "").startswith("https://") for s in question["sources"]), f"Open question needs a primary-source link: {problem}")
    project = {**catalog, "openProblems": open_problems, "models": visible_models, "ccComparison": json.loads((DATA / "cc-comparison.json").read_text()), "paperLinks": json.loads((DATA / "paper-links.json").read_text()), "research": research, "focus": focus, "focusPairs": pairs, "reviewedThrough": max(d["reviewedThrough"] for d in research)}
    if not args.check:
        template = (ROOT / "src" / "index.html").read_text()
        css = (ROOT / "src" / "style.css").read_text() + "\n" + (ROOT / "src" / "focus.css").read_text() + "\n" + (ROOT / "src" / "dynamic.css").read_text() + "\n" + (ROOT / "src" / "streaming.css").read_text() + "\n" + (ROOT / "src" / "lca.css").read_text() + "\n" + (ROOT / "src" / "local.css").read_text() + "\n" + (ROOT / "src" / "mpc.css").read_text() + "\n" + (ROOT / "src" / "query-list.css").read_text()
        css += "\n" + (ROOT / "src" / "paper-links.css").read_text() + "\n" + (ROOT / "src" / "visual-guides.css").read_text() + "\n" + (ROOT / "src" / "cc-comparison.css").read_text() + "\n" + (ROOT / "src" / "site.css").read_text()
        css += "\n" + "\n".join((ROOT / "src" / name).read_text() for name in dict.fromkeys(p["css"] for p in pairs))
        css += "\n" + (ROOT / "src" / "figure-first.css").read_text()
        js = "\n".join((ROOT / "src" / name).read_text() for name in ["app.js", "dynamic.js", "streaming.js", "lca.js", "local.js", "mpc.js", "query-list.js", *dict.fromkeys(p["javascript"] for p in pairs), "visual-guides.js", "cc-comparison.js", "focus.js", "paper-links.js", "figure-first.js", "navigation.js"])
        payload = json.dumps(project, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c").replace("&", "\\u0026")
        for needle in ("/* ATLAS_CSS */", "/* ATLAS_JS */", "/* ATLAS_DATA */", "<!-- SITE_NAV -->", "<!-- SITE_THEME -->"):
            require(template.count(needle) == 1, f"Template marker missing or duplicated: {needle}")
        html = template.replace("/* ATLAS_CSS */", css).replace("/* ATLAS_JS */", js).replace("/* ATLAS_DATA */", payload).replace("<!-- SITE_NAV -->", site_navigation("atlas")).replace("<!-- SITE_THEME -->", site_theme(ROOT))
        output = ROOT / "dist" / "index.html"
        output.parent.mkdir(exist_ok=True)
        output.write_text(html)
        print(f"Wrote {output} ({output.stat().st_size:,} bytes)")
    build_site_pages(ROOT, write=not args.check)
    # Fine-grained page is paused; retain and validate its research without publishing it.
    build_fine_grained(ROOT, write=False)
    if not args.check:
        (ROOT / "dist" / "fine-grained.html").unlink(missing_ok=True)
    print(f"Validated: {counts['papers']} sources; {counts['slices']} scoped settings; {counts['results']} results; {len(catalog['problems']) * len(visible_models)} cells.")


if __name__ == "__main__":
    main()
