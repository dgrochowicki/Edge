#!/usr/bin/env python3
"""One-off: add `p_v2` to every v2 prediction that lacks it (METHOD_V2 §13, E2).

Usage: python3 scripts/backfill_p_v2.py [path-to-bets.json] [--dry-run]

p_v2 = round(clamp(p_market + total_adjustment_pp / 100,
                   p_market - 0.05, p_market + 0.05), 4)

A deterministic function of fields already in each entry -- it changes no
prediction, only records the method's probability that `estimated_probability`
(= round(1/fair_odds, 4)) blurs by fair-odds rounding. Decision record:
docs/decisions/2026-10-11-v2-ocena-e2.md.

The key is inserted right after `total_adjustment_pp`. The file is written back
with the ledger's own formatting (indent=2, ensure_ascii=False, no trailing
newline), so the diff is exactly one added line per backfilled entry.
Entries that already have `p_v2` are left untouched (safe to re-run).
"""
import json
import sys
from pathlib import Path


def p_v2_of(p):
    pm = p["p_market"]
    raw = pm + p["total_adjustment_pp"] / 100
    return round(min(pm + 0.05, max(pm - 0.05, raw)), 4)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    dry = "--dry-run" in sys.argv[1:]
    path = Path(args[0]) if args else Path(__file__).resolve().parent.parent / "data" / "bets.json"
    text = path.read_text(encoding="utf-8")
    data = json.loads(text)
    if json.dumps(data, indent=2, ensure_ascii=False) != text.rstrip("\n"):
        sys.exit("Ledger formatting differs from indent=2/ensure_ascii=False -- refusing to rewrite. Check the file.")

    changed = []
    new_preds = []
    for p in data["predictions"]:
        if p.get("method_version") != "v2" or "p_v2" in p:
            new_preds.append(p)
            continue
        val = p_v2_of(p)
        q = {}
        for k, v in p.items():
            q[k] = v
            if k == "total_adjustment_pp":
                q["p_v2"] = val
        if "p_v2" not in q:
            sys.exit(f"{p['id']}: no total_adjustment_pp field")
        changed.append((p["id"], p["p_market"], p["total_adjustment_pp"], val, p["estimated_probability"]))
        new_preds.append(q)
    data["predictions"] = new_preds

    print(f"{len(changed)} entries {'would get' if dry else 'got'} p_v2:")
    for pid, pm, tot, val, est in changed:
        print(f"  {pid}: p_market {pm:.4f} + {tot:+.4f} pp -> p_v2 {val:.4f}   (estimated_probability {est:.4f}, diff {100*(est-val):+.2f} pp)")
    if not dry and changed:
        out = json.dumps(data, indent=2, ensure_ascii=False)
        if text.endswith("\n"):
            out += "\n"
        path.write_text(out, encoding="utf-8")


if __name__ == "__main__":
    main()
