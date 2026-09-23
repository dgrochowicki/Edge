# `data/form/` — v2 fresh-form window cache

One file per **match day** (the day of the predictions it feeds, not the day of the maps in it): `data/form/YYYY-MM-DD.json`. This is the raw window METHOD_V2 §6–9 is computed from — not only the derived score. Reason (METHOD_V2 §15): without the raw window an audit (§18, claude's periodic role per §21) can only re-read gpt's summary, not recompute it. It is also the cache: a team playing on consecutive days is collected once per day, not once per match.

## When a file is written

Once per calendar day that has at least one v2 prediction, before the deterministic calculation in METHOD_V2 §11. If a team's window was already collected on an earlier day within its 30-day validity and nothing changed, this file may reuse that team's entry rather than re-fetching it — that is what makes it a cache, not just a log.

## File shape

```json
{
  "date": "2026-10-03",
  "teams": {
    "Team A": {
      "core_roster_asof": "2026-10-03",
      "window": [
        {
          "date": "2026-09-28",
          "opponent": "Team X",
          "opponent_rank_band": "6-10",
          "map": "Mirage",
          "rounds_won": 13,
          "rounds_lost": 9,
          "result": "win",
          "weight_recency": 0.71,
          "weight_opponent": 1.10
        },
        {
          "date": "2026-09-21",
          "opponent": "Team Y",
          "opponent_rank_band": "21-30",
          "map": "Inferno",
          "rounds_won": null,
          "rounds_lost": null,
          "result": "loss",
          "weight_recency": 0.35,
          "weight_opponent": 0.90
        }
      ],
      "fresh_input": "round_diff",
      "fresh_map_score": 3.42
    },
    "Team B": { "...": "same shape" }
  }
}
```

## Field notes

- **`teams.<name>.core_roster_asof`** — the date this window's "current core roster" (METHOD_V2 §9.1/§10) was determined as of. Used to decide whether a cached entry is still valid for a later match day, or needs re-collection after a roster change.
- **`window`** — one entry per map, **most recent first**, already filtered to: current core roster only (§10 window-reset/partial-weight rules applied), age ≤ 30 days, capped at 8 series / 20 maps, in-scope opponents only (tier-2/qualifier maps are never in this list — §6).
  - `opponent_rank_band` — HLTV ranking band **as published immediately before that match's date** (§8): `top5`, `6-10`, `11-20`, `21-30`, `31+`, or `unknown`.
  - `rounds_won` / `rounds_lost` — `null` together when the round score wasn't available for that map; `result` (`"win"`/`"loss"`) is still recorded either way, since the map-result fallback (§9.2) needs it even without a round score.
  - `weight_recency` — `0.5 ** (days_ago / 14)`, precomputed for that map relative to `date` (§7).
  - `weight_opponent` — the table in §8, looked up from `opponent_rank_band`.
- **`fresh_input`** — `"round_diff"` if round-score coverage was ≥ 80% of this team's window maps (§9.2), else `"map_result_fallback"`. Matches the `fresh_input_pick` / `fresh_input_opponent` fields in the prediction's ledger entry (`docs/METHOD_V2.md` §16).
- **`fresh_map_score`** — the derived `FreshMapScore` for this team on this match day, per §9.1 (or the `+1`/`-1` fallback average if `fresh_input` is `map_result_fallback`). This is what gets differenced into `FreshDiff` in §11 — stored here too so a re-run of §11 doesn't need to recompute it from the raw window, only look it up.

## What this file is not

- Not a substitute for the prediction's own `fresh_map_score_pick` / `fresh_map_score_opponent` / `fresh_diff` fields (`docs/METHOD_V2.md` §16) — those live in `data/bets.json` per prediction. This file is the *evidence* those numbers came from.
- Not edited after the fact. If a later audit finds an error in a stored window, the finding is recorded as a QA note per METHOD_V2 §22 (audit policy) — the file is not silently corrected, and the prediction it fed stays immutable regardless.
- Not required for v1. v1 entries (`method_version: "v1"`) have no corresponding file here and never will — v1 didn't collect round-level form data at all.
