# Edge — METHOD_V2 (frozen)

**Status:** FROZEN AND ACTIVE — approved by operator 2026-09-23
**Revision:** v2.0 valuation + evaluation protocol **E2** (2026-10-11). Valuation (§4–§12, §14) is unchanged since the freeze; E2 replaces how the sample is judged (§18–§20) and tightens the ledger record (§13, §16). `method_version` stays `"v2"`. Decision record: `docs/decisions/2026-10-11-v2-ocena-e2.md`. The protocol in force from 2026-09-23 to 2026-10-11 is referred to as E1.
**Authors:** gpt (draft), claude (review), consolidated by claude
**Supersedes:** `METHOD_V2_GPT_DRAFT.md`, `METHOD_V2_CLAUDE_REVIEW.md`, `METHOD_V2_GPT_RESPONSE_TO_CLAUDE.md`, the prior rollout-specification draft, and the pre-v2 working notebook — all removed post-freeze, folded in here; history in git.
**Binding document for the active method.** `PLAYBOOK.md` keeps scope, staking and general discipline; where the two disagree on probability estimation, this document wins.

**Freeze record:**

```text
freeze_date:           2026-09-23
freeze_commit_sha:     22fc9211409aff8c89ea8bae23466a6753c67f16
first_eligible_event:  ESL Pro League Season 24 (Katowice), start 2026-10-03 --
                        CONFIRMED by operator 2026-10-03. Was UNVERIFIED 2026-09-24
                        ("PGL Fall 2026" candidate could not be confirmed); trail in
                        docs/decisions/2026-09-23-v2-freeze.md. Resolved 2026-10-08:
                        PGL Fall 2026 (1-11.10) was cancelled -- it conflicted with
                        EPL S24's own 3-11.10 slot, which is why it never appeared on
                        PGL's own event listing.
first_v2_prediction_id: P-2026-10-03-G1 (report reports/2026-10-03-gpt.md)
```

No v2 prediction may predate the freeze commit. No historical v1 match is ever rescored as v2.

---

## 1. Purpose

v2 tests one question:

> Does a small, explicit, mechanically computed adjustment to the de-vigged STS market contain information beyond that market?

v2 is **not** an attempt to place more bets. During validation every v2 BET is paper-only.

Under E2 the question is answered primarily by whether the market moves toward v2's adjustment before the match (§18.1), because the adjustments v2 actually produces are too small for a Brier comparison to detect any plausible signal (§18.2, and `reports/summaries/ESL-Pro-League-S24-2026-summary.md` §6).

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

## 13. Fair odds, value, pick, decision

```text
p_v2      = round(clamp(p_market + total_adjustment_pp / 100,
                        p_market - 0.05, p_market + 0.05), 4)
fair_odds = round(1 / p_v2, 2)
value     = market_odds / fair_odds - 1
estimated_probability = round(1 / fair_odds, 4)
```

**Precision and order (E2).** `p_market`, `fresh_map_score_*`, `fresh_diff`, `fresh_adjustment_pp`, `total_adjustment_pp` and `p_v2` are recorded to 4 decimals, and each step is computed from the recorded, rounded value of the previous step — so any auditor can reproduce an entry from the ledger alone.

**`p_v2` is the method's probability; `estimated_probability` is not.** Rounding fair odds to 2 decimals moves `estimated_probability` away from `p_v2` by up to ~0.3 pp on short favourites — the same size as a typical adjustment, and on EPL S24 enough to reverse its sign once. All §18 metrics are therefore computed on `p_v2`. `estimated_probability` is kept for display and v1 compatibility only.

**Pick (E2).** The pick is the side with the higher value (the other side's value uses `1 − p_v2` and its own odds). On a tie within 0.1 pp: the side `total_adjustment_pp` favours; with a zero adjustment: the market favourite. Brier and §18.1 are symmetric in the side chosen, but BET is not — a pick on the worse side could hide a qualifying bet on the other.

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
p_v2, estimated_probability, fair_odds, value_pct, decision, confidence,
closing_odds, closing_odds_opponent,
result, data_quality,
agent, method_version: "v2"
```

`estimated_probability == round(1 / fair_odds, 4)` stays enforced. `p_v2` added in E2 (2026-10-11); the 41 EPL S24 entries received it retroactively via `scripts/backfill_p_v2.py` — a deterministic function of fields already recorded, not a change to any prediction. No `mode` field: `method_version` separates the samples, and real P&L lives in `coupons`, not `predictions`.

## 17. Closing odds

Closing prices are recorded **for both sides**, as close to match start as practical, for **every** prediction — not only BETs. A missing snapshot stays `null` forever; backfilling after the result is known is prohibited.

This is the only change to the operator's routine: one reading, two numbers.

**Priority when time is short (E2):** largest `|total_adjustment_pp|` first — an observation's weight in §18.1 grows with the square of its adjustment. Matches with a zero adjustment do not enter §18.1 at all, but their closing is still recorded when possible, since coverage is reported over all predictions.

## 18. Metrics (E2)

Computed per `agent × method_version`, never pooled across versions. Every probability-based metric uses `p_v2` (§13). Reference implementation: `scripts/v2_metrics.py`.

### 18.1 Primary — closing-line slope β

```text
for every v2 prediction with a valid two-sided closing snapshot and p_v2 != p_market:
    a_i = (p_v2 − p_market) × 100                    pp, pick side, recorded 4-dp values
    m_i = (devig(closing pair) − devig(analysis pair)) × 100
                                                      pp, pick side, §5 de-vig on raw odds,
                                                      so an unchanged price is exactly 0
β = Σ a_i·m_i / Σ a_i²                                regression through the origin
95% CI: bootstrap over (a_i, m_i) pairs, 20 000 resamples
```

β = 1: the market moves all the way to `p_v2` by the close. β = 0: it ignores the adjustment. β < 0: it moves against it. Independent of match outcome, and every non-zero adjustment contributes in proportion to its size.

Why this and not Brier: with the adjustments v2.0 actually produces (EPL S24 median 0.5 pp, mean square ≈ 0.8 pp²), the expected Brier gain of a perfectly correct v2 is ≈ 0.00008, against a 95% CI half-width of ≈ 0.0012 at n = 150. β's half-width is ≈ 0.44 at n = 100 and ≈ 0.31 at n = 200 (closing-move spread ≈ 2.0 pp). Full reasoning: `docs/decisions/2026-10-11-v2-ocena-e2.md` §2–3.

### 18.2 Descriptive

1. **Brier** of `p_v2` and of the de-vigged market on the paired sample; `advantage = market_brier − v2_brier` with a paired bootstrap 95% CI. Used only as the safety condition in §20.
2. **Mean closing move** toward the adjustment, `move = m_i × sign(a_i)`, on the `|a_i| ≥ 1` and `|a_i| ≥ 3` subsamples (the E1 primary metric), plus the toward / against / flat counts.
3. Calibration buckets (10 pp) against outcomes and against the market.
4. Mean absolute deviation from market and the distribution of `total_adjustment_pp`.
5. BET count, paper ROI, paper CLV.

Coverage is always reported: `valid_closing_snapshots / all_predictions`, and the number of valid β observations.

## 19. Validation stages

Two counters per `agent × method_version`, both reported:

- **settled predictions** — 0–49 collection, 50–99 preliminary, 100–149 emerging, 150+ (needed for promotion, §20);
- **valid β observations** (§18.1) — checkpoints **K1 at 100** and **K2 at 200**.

Each checkpoint is computed on the **first n valid observations ordered by `date`, then `id`**, on the day the counter crosses n, and is never recomputed at a later n.

## 20. Checkpoints, promotion and stopping (E2)

**K1 (n = 100 valid β observations):**

- lower bound of the β CI > 0 → **signal detected**; go to the promotion decision;
- upper bound of the β CI < 0.5 → **no useful signal**; v2 collection stops;
- otherwise → continue to K2.

**K2 (n = 200, final):** lower bound > 0 → signal detected; otherwise **no detectable edge** and v2 collection stops. No extension past K2.

The 0.5 bound: if the market does not move even halfway toward adjustments whose median is 0.5 pp, a real effect would still be too small to clear an ~8% STS margin and the +8% BET threshold.

**v2 may be promoted to real-money use only if all hold:**

1. signal detected at K1 or K2;
2. at least 150 settled v2 predictions;
3. the 95% CI for `market_brier − v2_brier` does **not** lie entirely below zero (v2 must not be demonstrably worse than the market);
4. no major systematic calibration failure (§18.2 item 3);
5. no serious data-quality issue found in audit;
6. operator explicitly approves.

A detected signal says the *direction* of the adjustment carries information. Its *size* (the 0.5 coefficient) then becomes the subject of a valuation v2.1, estimated on v2 data, never hand-picked (§11 note).

Stopping v2 collection closes the question v2.0 asks, not the project.

**Superseded (E1, 2026-09-23 → 2026-10-11):** Brier at 150 settled as the gate (`market_brier − v2_brier > 0`, robustness to removing two extremes, strong evidence via Brier CI or mean move at n ≥ 100), and the stop rule "Brier CI contains zero and half-width ≤ 0.003". Retired because, at the adjustment sizes v2.0 produces, it could not detect a signal and its stop rule would fire regardless of the truth.

## 21. Roles

- **gpt — primary v2 analyst.** Daily execution: repo read, schedule, factual snapshot, form window, deterministic calculation, official report, JSON entry.
- **claude — independent auditor.** Does not produce a parallel daily prediction. Audits once per tournament or every 20–30 predictions: snapshot correctness, roster classification, round scores, ranking bands, weights, arithmetic, schema, and the metrics computed from the ledger.
- **repo agent** — ledger integrity, settlements, schema validation, dashboard.
- **operator (Dom)** — freeze, methodology disputes, real-money status, promotion, and supplying odds and closing snapshots.

There is **one canonical v2 prediction per match**. Two agents computing the same deterministic formula would not be two independent observations; the sample grows by one per match.

## 22. Audit policy

An issue found **before** the match is corrected before publication. An issue found **after** the match never rewrites the prediction: the entry stays immutable, the finding is recorded as a QA note, and the affected observation may be flagged for exclusion from formal validation. Methodology changes always require a new version.

## 23. Frozen parameters

Not changeable without a version bump (valuation) or a new evaluation-protocol revision with a decision record (evaluation): 30-day window, 14-day half-life, 8-series / 20-map caps, minimum-sample rules, opponent weights and their source, ±8-round cap, 0.5 × FreshDiff, ±4 pp fresh cap, ±5 pp total cap, −2 pp stand-in penalty, window reset rules, 80% coverage rule, +8% BET threshold, pick rule and precision (§13), β definition and bootstrap (§18.1), K1 = 100 / K2 = 200 checkpoints and the 0.5 bound, 150-settled promotion floor, promotion and stop criteria (§20).

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
- **2026-10-11** — first audit (claude, §21) after ESL Pro League S24, 41 predictions: execution reproduced 41/41; Brier advantage +0.00056, 95% CI [−0.00176, +0.00288]. Structural finding: at the adjustment sizes v2.0 produces (median 0.5 pp) the E1 Brier gate has no power and the E1 stop rule would fire regardless of the truth — the stop rule was claude's own addition at freeze, sized for adjustments near the caps. Operator approved the fix the same day: evaluation protocol E2 (β as primary, K1/K2, Brier as safety only), `p_v2` field, pick rule, fixed precision. Valuation unchanged. `reports/summaries/ESL-Pro-League-S24-2026-summary.md`, `docs/decisions/2026-10-11-v2-ocena-e2.md`.
