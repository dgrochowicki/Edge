#!/usr/bin/env python3
"""Validate data/bets.json against the ledger schema (docs/METHOD_V2.md §13, §16;
docs/REPORT_TEMPLATE.md section 4). Originally written for the v2 freeze task list,
since removed (history in git).

Usage: python3 scripts/validate_bets.py [path-to-bets.json] [--all]

By default only method_version in {"v2", "v3"} predictions are checked (v1 is a
frozen archive, see docs/archive/METHOD_V1.md). Pass --all for a full-ledger
integrity check, e.g. after a schema or validator change.

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
    - p_v2 present and == round(clamp(p_market + total_adjustment_pp/100,
      p_market -/+ 0.05), 4)                                   (E2, 2026-10-11)
    - fair_odds == round(1/p_v2, 2) and pick is the higher-value side
      (METHOD_V2 §13). Entries dated before E2_EFFECTIVE were computed under
      E1 conventions: a mismatch there is a `pre_e2` flag, not an error
      (EPL S24: 5 flags -- fair computed from unrounded intermediates in
      P-2026-10-04-G7 / P-2026-10-05-G3, pick on the lower-value side in
      P-2026-10-03-G3 / -G4 / P-2026-10-10-G1; entries immutable).

Additional rules for method_version == "v3" (docs/decisions/2026-10-19-v3-trzy-zrodla.md):
    - full v3 field set present: p_own, p_own_opponent, own_timestamp,
      p_cons, p_cons_opponent, cons_books, cons_spread_pp, cons_timestamp,
      p_sts, value_cons_pct, value_own_pct, gap_own_pp, label, stake_u
    - p_own, p_own_opponent in [0.10, 0.90] and sum to 1.0 (+/- 0.0001)
    - p_cons, p_cons_opponent both set or both null (null pair requires
      data_quality to include "consensus_missing"); when set, sum to 1.0
    - cons_books: a list with >= 3 entries when p_cons is not null
    - label in {BET, PASS, STS_OFF, OWN_DISAGREES}; decision == "BET" iff
      label == "BET" (a v3 BET is always the gpt recommendation -- whether the
      operator actually staked it lives in `coupons`, not here)
    - gap_own_pp == round((p_own - p_cons) * 100, 1) when p_cons is not null
    - value_cons_pct == round((market_odds_at_analysis * p_cons - 1) * 100, 1)
      and value_own_pct == round((market_odds_at_analysis * p_own - 1) * 100, 1)
      when the inputs are present (pick's own odds/probabilities)
    - label == "BET" requires: value_cons_pct >= 5.0, p_own >= p_cons (pick
      side), cons_spread computed from >= 3 books, and none of the blocking
      flags (odds_seen_before_own, consensus_missing, stale_consensus,
      uncertain_roster) in data_quality
    - stake_u > 0 when decision == "BET", stake_u in {0, None} when "PASS"
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
E2_EFFECTIVE = "2026-10-12"  # first match day after the E2 decision (docs/decisions/2026-10-11-v2-ocena-e2.md)

V3_REQUIRED_FIELDS = [
    "p_own", "p_own_opponent", "own_timestamp",
    "p_cons", "p_cons_opponent", "cons_books", "cons_spread_pp", "cons_timestamp",
    "p_sts", "value_cons_pct", "value_own_pct", "gap_own_pp", "label", "stake_u",
]
V3_LABEL_VALUES = {"BET", "PASS", "STS_OFF", "OWN_DISAGREES"}
V3_BET_BLOCKING_FLAGS = {"odds_seen_before_own", "consensus_missing", "stale_consensus", "uncertain_roster"}
V3_BET_THRESHOLD_PCT = 5.0


def expected_p_v2(p):
    pm = p["p_market"]
    return round(min(pm + 0.05, max(pm - 0.05, pm + p["total_adjustment_pp"] / 100)), 4)


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

            pv2 = p.get("p_v2")
            if pv2 is None:
                errors.append((pid, "v2 entry missing p_v2 (run scripts/backfill_p_v2.py for pre-E2 entries)"))
            elif p_market is not None and p.get("total_adjustment_pp") is not None:
                exp = expected_p_v2(p)
                if abs(pv2 - exp) > 0.00005:
                    errors.append((pid, f"p_v2 {pv2} != round(clamp(p_market + total_adjustment_pp/100), 4) = {exp}"))
                post_e2 = p.get("date", "") >= E2_EFFECTIVE
                problems = []
                if fair and abs(fair - round(1 / pv2, 2)) > 0.005:
                    problems.append(f"fair_odds {fair} != round(1/p_v2, 2) = {round(1 / pv2, 2)}")
                odds, odds_o = p.get("market_odds_at_analysis"), p.get("market_odds_opponent")
                if odds and odds_o and 0 < pv2 < 1:
                    v_pick = odds / round(1 / pv2, 2) - 1
                    v_opp = odds_o / round(1 / (1 - pv2), 2) - 1
                    if v_opp > v_pick + 0.001:
                        problems.append(f"pick has lower value ({100*v_pick:+.1f}%) than the other side ({100*v_opp:+.1f}%)")
                for msg in problems:
                    if post_e2:
                        errors.append((pid, msg))
                    else:
                        flags.append((pid, "pre_e2", msg))

        elif p.get("method_version") == "v3":
            missing = [f for f in V3_REQUIRED_FIELDS if f not in p]
            if missing:
                errors.append((pid, f"v3 entry missing fields: {', '.join(missing)}"))

            dq = p.get("data_quality") or []
            p_own, p_own_opp = p.get("p_own"), p.get("p_own_opponent")
            if p_own is not None and p_own_opp is not None:
                if not (0.10 <= p_own <= 0.90) or not (0.10 <= p_own_opp <= 0.90):
                    errors.append((pid, f"p_own/p_own_opponent out of [0.10,0.90]: {p_own}, {p_own_opp}"))
                if abs(p_own + p_own_opp - 1.0) > 0.0001:
                    errors.append((pid, f"p_own + p_own_opponent != 1.0: {p_own} + {p_own_opp}"))

            p_cons, p_cons_opp = p.get("p_cons"), p.get("p_cons_opponent")
            if (p_cons is None) != (p_cons_opp is None):
                errors.append((pid, f"p_cons/p_cons_opponent must both be set or both null (got {p_cons!r}, {p_cons_opp!r})"))
            elif p_cons is None:
                if "consensus_missing" not in dq:
                    errors.append((pid, "p_cons null but data_quality missing 'consensus_missing'"))
            else:
                if abs(p_cons + p_cons_opp - 1.0) > 0.0001:
                    errors.append((pid, f"p_cons + p_cons_opponent != 1.0: {p_cons} + {p_cons_opp}"))
                books = p.get("cons_books")
                if not isinstance(books, list) or len(books) < 3:
                    errors.append((pid, f"cons_books has fewer than 3 entries: {books!r}"))

            label = p.get("label")
            if label not in V3_LABEL_VALUES:
                errors.append((pid, f"bad label: {label!r}"))
            decision = p.get("decision")
            if label is not None and decision in ("BET", "PASS"):
                if (decision == "BET") != (label == "BET"):
                    errors.append((pid, f"decision {decision!r} inconsistent with label {label!r}"))

            if p_cons is not None and p_own is not None:
                gap = p.get("gap_own_pp")
                exp_gap = round((p_own - p_cons) * 100, 1)
                if gap is not None and abs(gap - exp_gap) > 0.1:
                    errors.append((pid, f"gap_own_pp {gap} != round((p_own-p_cons)*100,1) = {exp_gap}"))

            odds = p.get("market_odds_at_analysis")
            value_cons, value_own = p.get("value_cons_pct"), p.get("value_own_pct")
            if odds is not None and p_cons is not None and value_cons is not None:
                exp_vc = round((odds * p_cons - 1) * 100, 1)
                if abs(value_cons - exp_vc) > 0.1:
                    errors.append((pid, f"value_cons_pct {value_cons} != round((odds*p_cons-1)*100,1) = {exp_vc}"))
            if odds is not None and p_own is not None and value_own is not None:
                exp_vo = round((odds * p_own - 1) * 100, 1)
                if abs(value_own - exp_vo) > 0.1:
                    errors.append((pid, f"value_own_pct {value_own} != round((odds*p_own-1)*100,1) = {exp_vo}"))

            if label == "BET":
                blocking = V3_BET_BLOCKING_FLAGS & set(dq)
                if blocking:
                    errors.append((pid, f"label BET but blocking data_quality flags present: {sorted(blocking)}"))
                if value_cons is not None and value_cons < V3_BET_THRESHOLD_PCT:
                    errors.append((pid, f"label BET but value_cons_pct {value_cons} < {V3_BET_THRESHOLD_PCT}"))
                if p_own is not None and p_cons is not None and p_own < p_cons:
                    errors.append((pid, f"label BET but p_own {p_own} < p_cons {p_cons}"))
                books = p.get("cons_books")
                if not isinstance(books, list) or len(books) < 3:
                    errors.append((pid, "label BET but cons_books has fewer than 3 entries"))

            stake_u = p.get("stake_u")
            if decision == "BET":
                if not (isinstance(stake_u, (int, float)) and stake_u > 0):
                    errors.append((pid, f"decision BET requires stake_u > 0, got {stake_u!r}"))
            elif decision == "PASS" and stake_u not in (0, None):
                errors.append((pid, f"decision PASS expects stake_u 0 or null, got {stake_u!r}"))

    return errors, flags


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    check_all = "--all" in sys.argv[1:]
    path = Path(args[0]) if args else Path(__file__).resolve().parent.parent / "data" / "bets.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    preds = data.get("predictions", [])
    if not check_all:
        preds = [p for p in preds if p.get("method_version") in ("v2", "v3")]

    errors, flags = validate(preds)

    print(f"Validated {len(preds)} predictions.")
    legacy = [f for f in flags if f[1] == "legacy_rounding"]
    pre_e2 = [f for f in flags if f[1] == "pre_e2"]
    print(f"  legacy_rounding flags: {len(legacy)}")
    by_agent = {}
    for pid, _, _ in legacy:
        p = next(x for x in preds if x["id"] == pid)
        by_agent[p.get("agent")] = by_agent.get(p.get("agent"), 0) + 1
    if by_agent:
        print(f"    by agent: {by_agent}")
    print(f"  pre_e2 flags (E1-era conventions, informational): {len(pre_e2)}")
    for pid, _, msg in pre_e2:
        print(f"    {pid}: {msg}")
    print(f"  hard errors: {len(errors)}")
    for pid, msg in errors:
        print(f"    {pid}: {msg}")

    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
