#!/usr/bin/env python3
"""Add a sourced, unplotted result to an existing problem/model slice."""
import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def slug(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:60]


def unique(candidate, existing):
    value = candidate
    i = 2
    while value in existing:
        value = f"{candidate}-{i}"
        i += 1
    return value


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--problem", required=True, choices=("matching", "mis", "cc", "edge", "vertex"))
    p.add_argument("--slice", required=True, help="ID from data/research/PROBLEM.json")
    p.add_argument("--title", required=True)
    p.add_argument("--authors", required=True, help="Comma-separated names")
    p.add_argument("--year", type=int, required=True)
    p.add_argument("--venue", required=True)
    p.add_argument("--status", choices=("preprint", "conference", "journal"), default="preprint")
    p.add_argument("--url", required=True, help="HTTPS URL to a primary paper or proceedings")
    p.add_argument("--kind", choices=("upper", "lower"), required=True)
    p.add_argument("--bound", required=True, help="Symbolic theorem bound, including parameters")
    p.add_argument("--guarantee", required=True, help="Exact task, approximation, palette, or lower bound")
    p.add_argument("--source-location", required=True, help="Theorem number, abstract, or section")
    p.add_argument("--notes", default="Review task, assumptions, and comparability before assigning frontier status.")
    args = p.parse_args()
    if not args.url.startswith("https://"):
        p.error("--url must be HTTPS")
    path = ROOT / "data" / "research" / f"{args.problem}.json"
    data = json.loads(path.read_text())
    match = next((s for s in data["slices"] if s["id"] == args.slice), None)
    if match is None:
        p.error(f"No slice '{args.slice}' for {args.problem}; inspect the JSON and create a scoped slice first if needed")
    paper_id = unique(slug(f"{args.title}-{args.year}"), {s["id"] for s in data["papers"]})
    result_id = unique(slug(f"{paper_id}-{args.kind}"), {r["id"] for s in data["slices"] for r in s["results"]})
    data["papers"].append({"id": paper_id, "title": args.title, "authors": [a.strip() for a in args.authors.split(",") if a.strip()], "year": args.year, "venue": args.venue, "publicationStatus": args.status, "url": args.url, "verifiedOn": "review pending"})
    match["results"].append({"id": result_id, "paperId": paper_id, "kind": args.kind, "bound": args.bound, "guarantee": args.guarantee, "sourceLocation": args.source_location, "evidenceStatus": "needs_full_text", "frontierStatus": "candidate", "notes": args.notes, "plot": None})
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    print(f"Added paper {paper_id} and candidate result {result_id} to {args.slice}.")
    print("Verify the theorem and scope, then set evidenceStatus/verifiedOn and rebuild.")


if __name__ == "__main__":
    main()
