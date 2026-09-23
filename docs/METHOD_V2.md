# Edge — METHOD_V2 (frozen)

**Status:** FROZEN AND ACTIVE — approved by operator 2026-09-23
**Authors:** gpt (draft), claude (review), consolidated by claude
**Supersedes:** `METHOD_V2_GPT_DRAFT.md`, `METHOD_V2_CLAUDE_REVIEW.md`, `METHOD_V2_GPT_RESPONSE_TO_CLAUDE.md`, the prior rollout-specification draft, and the pre-v2 working notebook — all removed post-freeze, folded in here; history in git.
**Binding document for the active method.** `PLAYBOOK.md` keeps scope, staking and general discipline; where the two disagree on probability estimation, this document wins.

**Freeze record:**

```text
freeze_date:           2026-09-23
freeze_commit_sha:     22fc9211409aff8c89ea8bae23466a6753c67f16
first_eligible_event:  UNVERIFIED as of 2026-09-24 -- "PGL Fall 2026" (2026-10-01 to
                        2026-10-11) was the initial candidate from web search, but a
                        second pass found it absent from PGL's own event listing
                        (pglesports.com shows Bucharest, Cluj-Napoca, Astana, PGL
                        Masters Bucharest 22-31.10, Major Singapore -- no "Fall") while
                        Liquipedia search results keep surfacing it -- contradictory,
                        and direct fetch to both Liquipedia and HLTV is blocked in this
                        session. Operator must confirm the real first tier-1 event
                        before 2026-10-01 (candidates to check: whatever PGL's Oct 1-11
                        page actually is under its real name, or ESL Pro League S24 if
                        that turns out to start first). See
                        docs/decisions/2026-09-23-v2-freeze.md for the full trail.
first_v2_prediction_id: (none yet -- filled in when the first v2 entry is logged)
```

No v2 prediction may predate the freeze commit. No historical v1 match is ever rescored as v2.

---

## 1. Purpose

v2 tests one question:

> Does a small, explicit, mechanically computed adjustment to the de-vigged STS market contain information beyond that market?

v2 is **not** an attempt to place more bets. During validation every v2 BET is paper-only.

## 2. Method status

```text
v1  = archived historical baseline. No new v1 predictions after the v2 freeze.
v2  = the only actively calculated method.
benchmark = contemporaneous de-vigged STS market.
real money = none, for any version, until an explicit operator decision.
```

v1 entries stay in `data/bets.json` permanently and are never rescored, deleted or mixed into v2 statistics.

## 3. Scope

Unchanged from v1 (`PLAYBOOK.md` → Scope): CS2 only, tier-1 / S-Tier only, moneyline as the default market, STS as the bookmaker. Qualifiers, tier-2/3, academy and B-teams are out of scope and receive no entry at all.

## 4. Architecture

```text
de-vigged STS market
→ fresh-form signal (mechanical)
→ roster handling (window rules + one objective penalty)
→ capped adjustment
→ p_v2
→ fair odds
→ value
→ BET / PASS
```

Every step is deterministic. Given the same factual snapshot and these frozen parameters, any executor must arrive at the same `p_v2`. There is no discretionary component.

## 5. Market prior

```text
raw_A = 1 / odds_A
raw_B = 1 / odds_B
p_market_A = raw_A / (raw_A + raw_B)
p_market_B = 1 - p_market_A
```

v2 never starts from rankings, reputation or H2H. The market is the prior; everything else is an adjustment to it.

## 6. Fresh-form window

Only maps played by the **current core roster** (section 9), within:

- maximum age: **30 days** before match date
- maximum: **8 series** and **20 maps**, most recent first
- minimum for full adjustment: 3 series and 6 maps
- below 3 series / 6 maps: adjustment multiplied by **0.5**
- below 2 series / 4 maps: **no fresh adjustment** (`fresh_adjustment_pp = 0`)

Out-of-scope matches (tier-2, qualifiers) are **not** used in the window.

## 7. Recency weight

```text
weight_recency = 0.5 ** (days_ago / 14)
```

1.00 today, 0.71 at 7 days, 0.50 at 14 days, 0.25 at 28 days. Maps older than 30 days are excluded entirely.

## 8. Opponent quality weight

Based on the opponent's **HLTV ranking published immediately before that match's date**, recorded in the snapshot.

| Opponent rank | Weight |
|---|---:|
| Top 5 | 1.20 |
| 6–10 | 1.10 |
| 11–20 | 1.00 |
| 21–30 | 0.90 |
| 31+ | 0.80 |
| unknown | 1.00 |

HLTV is the single source. VRS is not used here — the two systems disagreed by up to five places during StarSeries Fall 2026, and a frozen method needs one source.

## 9. Map performance

### 9.1 Primary input — round differential

```text
RD_map     = rounds_won - rounds_lost
RD_capped  = clamp(RD_map, -8, +8)
WRD_map    = RD_capped × weight_recency × weight_opponent

FreshMapScore = sum(WRD_map) / sum(weight_recency × weight_opponent)
```

### 9.2 Fallback and coverage rule

Per team, independently:

```text
if round-score coverage >= 80% of maps in that team's window:
    use round differential, computed on the maps that have scores
else:
    use map-result fallback (+1 win / -1 loss) for that team's whole window
```

Recorded per prediction as `fresh_input_pick` and `fresh_input_opponent`, values `round_diff` or `map_result_fallback`.

## 10. Roster rules

**Window reset** (previous maps receive zero weight) when any of these happened:

- two or more starters changed,
- IGL changed,
- primary AWP changed.

**Partial weight:** one ordinary player change (neither IGL nor primary AWP) → pre-change maps receive **50%** weight.

**Coach change alone:** no effect on the window.

**Direct penalty — the only one in v2.0:**

```text
stand-in, or confirmed absence of a starting player: -2 pp
everything else:                                     0 pp
```

Everything else about roster disruption is already handled by the window rules above; adding further penalties would double-count it.

## 11. Adjustment

```text
FreshDiff            = FreshMapScore_pick - FreshMapScore_opponent
fresh_adjustment_pp  = clamp(0.5 × FreshDiff, -4, +4)

adjustment_pick = fresh_adjustment_pick
                + roster_penalty_pick
                - roster_penalty_opponent

p_v2_pick = clamp(p_market_pick + adjustment_pick/100,
                  p_market_pick - 0.05,
                  p_market_pick + 0.05)

p_v2_opponent = 1 - p_v2_pick
```

**No exceptional adjustment above ±5 pp exists in v2.0.** Raising this limit requires v2.1 or later.

**Note on the 0.5 coefficient.** It is not calibrated on anything — no dataset supports this exact value. It is frozen a priori on purpose: **v2.0 tests the direction of the signal, not its magnitude.** If the direction survives, the scale becomes the subject of v2.1, estimated on v2 data, never hand-picked.

## 12. Missing or insufficient data

If the window cannot be built (no usable maps, no reliable rosters, no ranking data):

```text
fresh_adjustment_pp = 0
p_v2 = p_market
```

**The prediction is still produced and logged**, with `data_quality` naming what was missing. Skipping such matches would silently select the sample toward matches with rich data.

## 13. Fair odds, value, decision

```text
fair_odds = 1 / p_v2                     (2 decimals; probability 4 decimals)
value     = market_odds / fair_odds - 1
```

**BET** requires `value >= +8%` and a complete factual snapshot, both market prices, sufficient fresh-form quality and no data-quality warning. Otherwise **PASS**. Stake rules unchanged from `PLAYBOOK.md`. All v2 BETs are **paper-only** during validation.

Known and accepted consequence: with an ±5 pp cap, a +8% threshold and STS margins of 7.5–8.3%, a BET is arithmetically possible only when the pick's de-vig is **≤ ~0.41**, i.e. odds from roughly **2.37** upward. v2.0 will therefore produce few BETs, nearly all on underdogs. This is why BET count, BET ROI and BET CLV are **descriptive only** and are **not** promotion gates for v2.0.

## 14. Confidence

| Confidence | Condition |
|---|---|
| 3–4 | weak or incomplete fresh sample |
| 5 | ordinary complete sample |
| 6 | strong complete sample, clear mechanical adjustment |
| 7 | strong sample and large value |
| 8+ | not expected in v2.0 |

Confidence never changes probability or staking.

## 15. Factual snapshot and stored form window

Before any calculation, record: date, event, stage, BO format, expected rosters, stand-ins and roster changes with dates, HLTV ranking bands, the full list of window maps per team (date, opponent, opponent rank band, map, round score if available), both STS prices and the exact odds timestamp.

**The window itself is persisted**, not only its derived score:

```text
data/form/YYYY-MM-DD.json
```

Reason: without the raw window, an audit (section 18) cannot recompute anything and can only re-read the same summary. The stored window is also the cache — a team playing on consecutive days is collected once per day, not once per match.

## 16. Ledger fields

```text
id, date, report, game, match, market, pick,
market_odds_at_analysis, market_odds_opponent, odds_timestamp,
p_market,
fresh_input_pick, fresh_input_opponent,
fresh_map_score_pick, fresh_map_score_opponent, fresh_diff,
fresh_adjustment_pp, roster_penalty_pick, roster_penalty_opponent, total_adjustment_pp,
estimated_probability, fair_odds, value_pct, decision, confidence,
closing_odds, closing_odds_opponent,
result, data_quality,
agent, method_version: "v2"
```

`estimated_probability == round(1 / fair_odds, 4)` stays enforced. No `mode` field: `method_version` separates the samples, and real P&L lives in `coupons`, not `predictions`.

## 17. Closing odds

Closing prices are recorded **for both sides**, as close to match start as practical, for **every** prediction — not only BETs. A missing snapshot stays `null` forever; backfilling after the result is known is prohibited.

This is the only change to the operator's routine: one reading, two numbers.

## 18. Metrics

Computed per `agent × method_version`, never pooled across versions:

1. **Brier** of v2 and of the de-vigged market on the paired sample; `advantage = market_brier − v2_brier`, always with a bootstrap 95% CI.
2. **Closing-line movement (primary early metric):**

```text
move = (p_market_close − p_market_analysis) × sign(p_v2 − p_market_analysis)
```

Main sample: all predictions with a valid two-sided closing snapshot and `|p_v2 − p_market| >= 1 pp`. Statistic: mean `move`, tested by bootstrap. Reported separately for the `>= 3 pp` subsample. The binary directional rate stays as a readable secondary number only.

Below **n = 100** valid observations this metric is descriptive only. Rationale: a binary sign test at n = 30 has ~29% power against a true 60% rate; at n = 100 it has ~62%.

3. Calibration buckets (10 pp) against outcomes and against the market.
4. Mean absolute deviation from market.
5. BET count, paper ROI, paper CLV — descriptive.

Coverage is always reported: `valid_closing_snapshots / all_predictions`.

## 19. Validation stages

Per `agent × method_version`: 0–49 collection, 50–99 preliminary signal, 100–149 emerging pattern, **150+ formal checkpoint**.

The checkpoint is computed on the **first 150 settled predictions ordered by `date`, then `id`**, on the day the counter crosses 150, and is never recomputed at a later n.

## 20. Promotion, rejection and stopping

**v2 may be promoted to real-money use only if all hold:**

1. at least 150 settled v2 predictions,
2. `market_brier − v2_brier > 0`,
3. removing the two most extreme observations does not change the sign,
4. no major systematic calibration failure,
5. no serious data-quality issue,
6. the closing-line metric is not materially negative once n ≥ 100,
7. operator explicitly approves.

**Strong-evidence condition — at least one of:**

- the bootstrap 95% CI for `market_brier − v2_brier` lies entirely above zero, or
- the mean closing-line `move` is significantly above zero at n ≥ 100.

**Negative safety rule.** If `market_brier − v2_brier < 0` at the checkpoint, v2 is not promoted, regardless of the closing-line result.

**Stop rule (claude's addition; needs operator sign-off at freeze).** If at the checkpoint the CI for the Brier difference contains zero *and* its half-width is ≤ 0.003, the result is recorded as **"no detectable edge"** and v2 collection stops rather than continuing indefinitely. Without this, an inconclusive method can absorb years of work while never failing.

## 21. Roles

- **gpt — primary v2 analyst.** Daily execution: repo read, schedule, factual snapshot, form window, deterministic calculation, official report, JSON entry.
- **claude — independent auditor.** Does not produce a parallel daily prediction. Audits once per tournament or every 20–30 predictions: snapshot correctness, roster classification, round scores, ranking bands, weights, arithmetic, schema, and the metrics computed from the ledger.
- **repo agent** — ledger integrity, settlements, schema validation, dashboard.
- **operator (Dom)** — freeze, methodology disputes, real-money status, promotion, and supplying odds and closing snapshots.

There is **one canonical v2 prediction per match**. Two agents computing the same deterministic formula would not be two independent observations; the sample grows by one per match.

## 22. Audit policy

An issue found **before** the match is corrected before publication. An issue found **after** the match never rewrites the prediction: the entry stays immutable, the finding is recorded as a QA note, and the affected observation may be flagged for exclusion from formal validation. Methodology changes always require a new version.

## 23. Frozen parameters

Not changeable without a version bump: 30-day window, 14-day half-life, 8-series / 20-map caps, minimum-sample rules, opponent weights and their source, ±8-round cap, 0.5 × FreshDiff, ±4 pp fresh cap, ±5 pp total cap, −2 pp stand-in penalty, window reset rules, 80% coverage rule, +8% BET threshold, 1 pp and 3 pp closing-line thresholds, n = 100 and n = 150 rules, promotion and stop criteria.

Reporting cosmetics may change freely.

## 24. Known limitations of v2.0

Coarse ranking bands; round differential not normalised per map or side; no pistol-round handling; no map-veto simulation; no Elo/VRS regression; no uncertainty distribution around `p_v2`; no separate BO5 model; the 0.5 coefficient is not calibrated.

These are accepted because the question is narrow. If a small, explicit fresh-form adjustment does not beat the market, adding complexity is unlikely to rescue the hypothesis.

**Candidates for v2.1+, deliberately excluded now:** round differential normalised by map and side, opponent quality as a continuous VRS/Elo term, calibrated FreshDiff scaling estimated on v2 data, BET-threshold revision, map-level simulation for BO5, cross-bookmaker line comparison (line shopping cut the effective margin from 8.3% to 4.6% on the one match where it was measured).

## 25. Decision log

- **2026-09-19** — v1 checkpoint at 150: claude not validated (+0.00020), gpt validated (−0.00034); neither difference distinguishable from zero. `reports/summaries/v1-checkpoint-150.md`.
- **2026-09-21** — gpt draft of v2.
- **2026-09-21** — claude review: promotion criteria without power, BET arithmetically impossible under the caps, determinism collapses the agent A/B, roster penalties too subjective.
- **2026-09-23** — gpt response: accepted; one canonical sample, gpt primary / claude auditor.
- **2026-09-23** — claude accepts all seven open points, including dropping parallel live v1. Reason: v1 proved indistinguishable from the market, so a live v1 comparison adds no inferential value that the contemporaneous market benchmark does not already provide — and running both from one executor would contaminate the baseline.
