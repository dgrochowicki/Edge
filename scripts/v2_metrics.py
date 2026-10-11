#!/usr/bin/env python3
"""v2 evaluation metrics, protocol E2 (docs/METHOD_V2.md §18-§20).

Usage: python3 scripts/v2_metrics.py [path-to-bets.json] [--agent gpt] [--until YYYY-MM-DD] [--from YYYY-MM-DD]

Reference implementation for audits and summaries. Every number comes from
data/bets.json; nothing is read from reports. Probabilities used: `p_v2`
(falls back to the §13 formula from p_market + total_adjustment_pp if a
v2 entry predates the field). Bootstrap seed is fixed so reruns agree.

Prints:
  - counters: settled predictions, valid closing snapshots, valid beta observations
  - primary: beta (closing-line slope) with 95% CI; K1/K2 status computed on the
    FIRST 100 / 200 valid observations ordered by (date, id), per §19
  - descriptive: Brier v2 vs market + paired 95% CI; mean closing move on the
    |adj| >= 1 pp and >= 3 pp subsamples; calibration buckets; adjustment stats; BET count
"""
import json
import random
import sys
from pathlib import Path

NBOOT = 20000
SEED = 20261011
K1, K2, K1_UPPER = 100, 200, 0.5


def devig(a, b):
    ra, rb = 1 / a, 1 / b
    return ra / (ra + rb)


def p_v2_of(p):
    if isinstance(p.get("p_v2"), (int, float)):
        return p["p_v2"]
    pm = p["p_market"]
    return round(min(pm + 0.05, max(pm - 0.05, pm + p["total_adjustment_pp"] / 100)), 4)


def pct(xs, q):
    return xs[min(len(xs) - 1, int(q * len(xs)))]


def boot_ci(n, stat, rng):
    vals = []
    for _ in range(NBOOT):
        idx = [rng.randrange(n) for _ in range(n)]
        v = stat(idx)
        if v is not None:
            vals.append(v)
    vals.sort()
    return pct(vals, 0.025), pct(vals, 0.975)


def beta_stat(obs):
    def f(idx):
        den = sum(obs[i][0] ** 2 for i in idx)
        return None if den == 0 else sum(obs[i][0] * obs[i][1] for i in idx) / den
    return f


def main():
    argv = sys.argv[1:]
    opts = {}
    pos = []
    i = 0
    while i < len(argv):
        if argv[i].startswith("--"):
            opts[argv[i][2:]] = argv[i + 1]
            i += 2
        else:
            pos.append(argv[i])
            i += 1
    path = Path(pos[0]) if pos else Path(__file__).resolve().parent.parent / "data" / "bets.json"
    agent = opts.get("agent", "gpt")
    preds = [p for p in json.loads(path.read_text(encoding="utf-8"))["predictions"]
             if p.get("method_version") == "v2" and p.get("agent") == agent
             and p["date"] <= opts.get("until", "9999") and p["date"] >= opts.get("from", "0000")]
    preds.sort(key=lambda p: (p["date"], p["id"]))
    rng = random.Random(SEED)

    rows = []
    for p in preds:
        # stored p_market (4 dp, §13) so a zero adjustment is exactly zero
        pm = p["p_market"] if isinstance(p.get("p_market"), (int, float)) else round(
            devig(p["market_odds_at_analysis"], p["market_odds_opponent"]), 4)
        pv = p_v2_of(p)
        pc = None
        if p.get("closing_odds") and p.get("closing_odds_opponent"):
            pc = devig(p["closing_odds"], p["closing_odds_opponent"])
        y = {"won": 1, "lost": 0}.get(p.get("result"))
        # closing move compares the two de-vigged pairs directly (no rounding),
        # so an unchanged price is exactly zero movement
        mv = None if pc is None else (pc - devig(p["market_odds_at_analysis"], p["market_odds_opponent"])) * 100
        rows.append(dict(id=p["id"], pm=pm, pv=pv, pc=pc, mv=mv, y=y, a=round((pv - pm) * 100, 4),
                         bet=p.get("decision") == "BET"))

    settled = [r for r in rows if r["y"] is not None]
    closing = [r for r in rows if r["pc"] is not None]
    obs = [(r["a"], r["mv"]) for r in closing if r["a"] != 0]

    print(f"v2 x {agent}: {len(rows)} predictions, {len(settled)} settled")
    print(f"closing coverage: {len(closing)}/{len(rows)}" + (f" ({100*len(closing)/len(rows):.0f}%)" if rows else ""))
    print(f"valid beta observations: {len(obs)}  (K1 at {K1}, K2 at {K2})")

    print("\n== Primary: closing-line slope beta (§18.1) ==")
    if obs:
        b = beta_stat(obs)(range(len(obs)))
        lo, hi = boot_ci(len(obs), beta_stat(obs), rng)
        print(f"beta = {b:+.3f}   95% CI [{lo:+.3f}, {hi:+.3f}]   n = {len(obs)}   (descriptive until K1)")
    for k, label in ((K1, "K1"), (K2, "K2")):
        if len(obs) >= k:
            sub = obs[:k]
            b = beta_stat(sub)(range(k))
            lo, hi = boot_ci(k, beta_stat(sub), random.Random(SEED))
            if lo > 0:
                verdict = "SIGNAL DETECTED"
            elif label == "K1" and hi < K1_UPPER:
                verdict = "NO USEFUL SIGNAL -- stop v2 collection"
            elif label == "K1":
                verdict = "inconclusive -- continue to K2"
            else:
                verdict = "NO DETECTABLE EDGE -- stop v2 collection"
            print(f"{label} (first {k}): beta {b:+.3f} CI [{lo:+.3f}, {hi:+.3f}] -> {verdict}")
        else:
            print(f"{label}: not reached ({len(obs)}/{k})")

    print("\n== Descriptive (§18.2) ==")
    if settled:
        bm = sum((r["pm"] - r["y"]) ** 2 for r in settled) / len(settled)
        bv = sum((r["pv"] - r["y"]) ** 2 for r in settled) / len(settled)
        d = [(r["pm"] - r["y"]) ** 2 - (r["pv"] - r["y"]) ** 2 for r in settled]
        lo, hi = boot_ci(len(d), lambda idx: sum(d[i] for i in idx) / len(idx), rng)
        print(f"Brier v2 {bv:.5f}  market {bm:.5f}  advantage {bm-bv:+.5f}  95% CI [{lo:+.5f}, {hi:+.5f}]  n={len(settled)}")
        print("  safety (§20 pt 3): " + ("FAIL -- CI entirely below zero" if hi < 0 else "ok"))
    for thr in (1, 3):
        mv = [m * (1 if a > 0 else -1) for a, m in obs if abs(a) >= thr]
        if mv:
            lo, hi = boot_ci(len(mv), lambda idx: sum(mv[i] for i in idx) / len(idx), rng)
            print(f"mean move toward adj, |adj| >= {thr} pp: {sum(mv)/len(mv):+.2f} pp  CI [{lo:+.2f}, {hi:+.2f}]  "
                  f"n={len(mv)}  toward/against/flat {sum(x>0 for x in mv)}/{sum(x<0 for x in mv)}/{sum(x==0 for x in mv)}")
        else:
            print(f"mean move toward adj, |adj| >= {thr} pp: n=0")
    adj = sorted(abs(r["a"]) for r in rows)
    if adj:
        print(f"|adjustment| pp: median {adj[len(adj)//2]:.2f}, mean {sum(adj)/len(adj):.2f}, max {adj[-1]:.2f}, "
              f"mean square {sum(x*x for x in adj)/len(adj):.3f}, zero {sum(x < 1e-9 for x in adj)}")
    print("calibration buckets (folded to the side p_v2 favours):")
    bk = {}
    for r in settled:
        p, y, m = (r["pv"], r["y"], r["pm"]) if r["pv"] >= 0.5 else (1 - r["pv"], 1 - r["y"], 1 - r["pm"])
        bk.setdefault(min(int(p * 10), 9), []).append((p, m, y))
    for k in sorted(bk):
        v = bk[k]
        print(f"  {k*10}-{k*10+10}%: n={len(v)}  v2 {sum(x[0] for x in v)/len(v):.3f}  market {sum(x[1] for x in v)/len(v):.3f}  hit {sum(x[2] for x in v)/len(v):.3f}")
    print(f"BET: {sum(r['bet'] for r in rows)}")


if __name__ == "__main__":
    main()
