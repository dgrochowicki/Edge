#!/usr/bin/env python3
"""Validate data/bets.json against the schema rules in docs/V2_FREEZE_TASKS.md #7.

Usage: python3 scripts/validate_bets.py [path-to-bets.json]

Exit code 0 if there are zero hard errors (legacy_rounding flags are not
errors -- see docs/PLAYBOOK.md -> Calibration & CLV Protocol -> Checkpoint
population and counting rule). Non-zero if any prediction has a hard error.

Rules (all predictions, any method_version):
    - id unique
    - decision in {BET, PASS}
    - result in {won, lost, void, pending}
    - 0 < estimated_probability < 1 (when present)
    - odds fields (fair_odds, market_odds_at_analysis, market_odds_opponent,
      closing_odds, closing_odds_opponent), when present, are > 1
    - market_odds_at_analysis and market_odds_opponent both present
    - |estimated_probability - 1/fair_odds| <= 0.005
        (a value in (0.0001, 0.005] is flagged legacy_rounding, not an error --
         23 confirmed v1 entries from 2026-07-21..2026-08-30, all agent=claude,
         see docs/decisions/2026-09-23-v2-freeze.md)

Additional rules for method_version == "v2":
    - full v2 field set present: p_market, fresh_input_pick, fresh_input_opponent,
      fresh_map_score_pick, fresh_map_score_opponent, fresh_diff,
      fresh_adjustment_pp, roster_penalty_pick, roster_penalty_opponent,
      total_adjustment_pp, closing_odds_opponent, data_quality
    - |estimated_probability - p_market| <= 0.0501
    - fresh_adjustment_pp in [-4, 4]
    - roster_penalty_pick, roster_penalty_opponent in {0, -2}
    - fresh_input_pick, fresh_input_opponent in {round_diff, map_result_fallback}
    - closing_odds and closing_odds_opponent both set or both null
"""
import json
import sys
from pathlib import Path

ODDS_FIELDS = ["fair_odds", "market_odds_at_analysis", "market_odds_opponent", "closing_odds", "closing_odds_opponent"]
V2_REQUIRED_FIELDS = [
    "p_market", "fresh_input_pick", "fresh_input_opponent",
    "fresh_map_score_pick", "fresh_map_score_opponent", "fresh_diff",
    "fresh_adjustment_pp", "roster_penalty_pick", "roster_penalty_opponent",
    "total_adjustment_pp", "closing_odds_opponent", "data_quality",
]
FRESH_INPUT_VALUES = {"round_diff", "map_result_fallback"}
ROSTER_PENALTY_VALUES = {0, -2}


def validate(preds):
    errors = []  # list of (id, message)
    flags = []   # list of (id, flag_name, detail)
    seen_ids = set()

    for i, p in enumerate(preds):
        pid = p.get("id") or f"(no id, index {i})"

        if not p.get("id"):
            errors.append((pid, "missing id"))
        elif p["id"] in seen_ids:
            errors.append((pid, "duplicate id"))
        else:
            seen_ids.add(p["id"])

        if p.get("decision") not in ("BET", "PASS"):
            errors.append((pid, f"bad decision: {p.get('decision')!r}"))
        if p.get("result") not in ("won", "lost", "void", "pending"):
            errors.append((pid, f"bad result: {p.get('result')!r}"))

        ep = p.get("estimated_probability")
        if ep is not None and not (0 < ep < 1):
            errors.append((pid, f"estimated_probability out of range: {ep}"))

        for k in ODDS_FIELDS:
            v = p.get(k)
            if v is not None and v <= 1:
                errors.append((pid, f"{k} <= 1: {v}"))

        if p.get("market_odds_at_analysis") is None:
            errors.append((pid, "missing market_odds_at_analysis"))
        if p.get("market_odds_opponent") is None:
            errors.append((pid, "missing market_odds_opponent"))

        fair = p.get("fair_odds")
        if ep is not None and fair:
            diff = abs(ep - 1 / fair)
            if diff > 0.005:
                errors.append((pid, f"estimated_probability != 1/fair_odds (diff {diff:.4f} > 0.005)"))
            elif diff > 0.0001:
                flags.append((pid, "legacy_rounding", f"diff={diff:.4f}"))

        if p.get("method_version") == "v2":
            missing = [f for f in V2_REQUIRED_FIELDS if f not in p]
            if missing:
                errors.append((pid, f"v2 entry missing fields: {', '.join(missing)}"))

            p_market = p.get("p_market")
            if ep is not None and p_market is not None:
                d = abs(ep - p_market)
                if d > 0.0501:
                    errors.append((pid, f"|estimated_probability - p_market| = {d:.4f} > 0.0501"))

            fap = p.get("fresh_adjustment_pp")
            if fap is not None and not (-4 <= fap <= 4):
                errors.append((pid, f"fresh_adjustment_pp out of [-4,4]: {fap}"))

            for k in ("roster_penalty_pick", "roster_penalty_opponent"):
                v = p.get(k)
                if v is not None and v not in ROSTER_PENALTY_VALUES:
                    errors.append((pid, f"{k} not in {{0,-2}}: {v}"))

            for k in ("fresh_input_pick", "fresh_input_opponent"):
                v = p.get(k)
                if v is not None and v not in FRESH_INPUT_VALUES:
                    errors.append((pid, f"{k} not in {FRESH_INPUT_VALUES}: {v!r}"))

            co, coo = p.get("closing_odds"), p.get("closing_odds_opponent")
            if (co is None) != (coo is None):
                errors.append((pid, f"closing_odds/closing_odds_opponent must both be set or both null (got {co!r}, {coo!r})"))

    return errors, flags


def main():
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent / "data" / "bets.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    preds = data.get("predictions", [])

    errors, flags = validate(preds)

    print(f"Validated {len(preds)} predictions.")
    print(f"  legacy_rounding flags: {len(flags)}")
    by_agent = {}
    for pid, _, _ in flags:
        p = next(x for x in preds if x["id"] == pid)
        by_agent[p.get("agent")] = by_agent.get(p.get("agent"), 0) + 1
    if by_agent:
        print(f"    by agent: {by_agent}")
    print(f"  hard errors: {len(errors)}")
    for pid, msg in errors:
        print(f"    {pid}: {msg}")

    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
