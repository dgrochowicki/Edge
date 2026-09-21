# Edge — METHOD_V2 draft for cross-agent review

**Status:** DRAFT — not frozen, not active  
**Author:** GPT  
**Purpose:** concrete proposal for v2 methodology before review by the second agent  
**Important:** this document must not be used for live or shadow predictions until it is reviewed, revised, frozen in Git and assigned a freeze commit SHA.

---

# 1. Goal of v2

The purpose of v2 is not to make more BETs.

The purpose is:

> **to produce probability estimates that contain measurable information beyond the de-vigged STS market.**

v1 showed that simply starting from the market and making loosely qualitative adjustments produced probabilities that were effectively market-equivalent.

v2 therefore keeps the market as the prior, but introduces a small number of explicit, reproducible adjustments based on fresh information.

---

# 2. Core architecture

For every eligible match:

```text
de-vig market probability
→ fresh-form score
→ roster-context adjustment
→ capped probability adjustment
→ p_v2
→ fair odds
→ value
→ BET / PASS
```

The active scope remains:

- CS2 only
- tier-1 / S-Tier only
- moneyline as the default market
- STS odds as the bookmaker source
- no qualifiers / tier-2 / tier-3 / academy teams

---

# 3. Market prior

For teams A and B with STS odds `odds_A` and `odds_B`:

```text
raw_A = 1 / odds_A
raw_B = 1 / odds_B

p_market_A = raw_A / (raw_A + raw_B)
p_market_B = 1 - p_market_A
```

This de-vigged probability is the starting point.

v2 never starts from rankings, analyst intuition or historical H2H.

---

# 4. Fresh-form window

v2 uses only matches played by the **current core roster**.

Default window:

- maximum age: **30 days**
- preferred emphasis: most recent **14 days**
- maximum number of series: **8**
- maximum number of maps: **20**

If fewer than 3 series / 6 maps of usable current-roster data exist, fresh-form adjustment is reduced by 50%.

If fewer than 2 series / 4 maps exist, no fresh-form adjustment is allowed.

---

# 5. Recency decay

Every map receives a recency weight:

```text
weight_recency = 0.5 ** (days_ago / 14)
```

Interpretation:

- today: 1.00
- 7 days ago: ~0.71
- 14 days ago: 0.50
- 28 days ago: 0.25

Maps older than 30 days are excluded.

The 14-day half-life is fixed for v2.0 and must not be changed after freeze.

---

# 6. Opponent quality weight

Opponent strength is approximated using the opponent's current tier/ranking band at match time.

Use the following fixed multiplier:

| Opponent level | Weight |
|---|---:|
| Top 5 | 1.20 |
| Rank 6–10 | 1.10 |
| Rank 11–20 | 1.00 |
| Rank 21–30 | 0.90 |
| Rank 31+ | 0.80 |

If ranking data is unavailable, use `1.00`.

This component exists only to avoid treating a dominant map against #40 the same as a dominant map against #3.

---

# 7. Map-performance component

## 7.1 Preferred input: round differential

If reliable map round scores are available, use:

```text
RD_map = rounds_won - rounds_lost
```

Cap each map's round differential:

```text
RD_capped = clamp(RD_map, -8, +8)
```

The cap prevents one extreme stomp from dominating the signal.

Weighted round differential:

```text
WRD_map = RD_capped × weight_recency × weight_opponent
```

Team fresh map score:

```text
FreshMapScore = sum(WRD_map) / sum(weight_recency × weight_opponent)
```

This produces an opponent- and recency-adjusted average round differential.

## 7.2 Fallback if round scores are unavailable

Use map result only:

```text
map_win = +1
map_loss = -1
```

Then weight using the same recency and opponent multipliers.

A report must explicitly record whether the match used:

- `fresh_input: round_diff`
or
- `fresh_input: map_result_fallback`

Mixed input within one team's window is not allowed.

---

# 8. Current-roster rule

A roster reset is triggered when any of these occurs:

- two or more starting players changed,
- IGL changed,
- primary AWP changed,
- stand-in replaces a starter,
- major role restructuring is confirmed.

After a reset:

- pre-change maps receive zero weight,
- the fresh-form sample starts again from zero.

A one-player change that is neither IGL nor primary AWP does not fully reset the sample, but pre-change maps receive only **50% weight**.

Coach changes alone do not reset the sample.

---

# 9. Roster disruption adjustment

This component is separate from fresh form.

Maximum allowed direct adjustment:

| Situation | Adjustment |
|---|---:|
| Stable full roster | 0 pp |
| One ordinary roster change <14 days | -1 pp |
| New IGL or primary AWP <14 days | -2 pp |
| Stand-in | -2 pp |
| Two+ starters changed <30 days | -3 pp |

These adjustments apply to the affected team's probability.

If current-roster performance already contains at least 5 series after the change, roster penalty is halved.

If current-roster performance contains at least 8 series after the change, roster penalty becomes 0.

No positive roster bonus exists in v2.0.

---

# 10. Converting FreshMapScore into probability adjustment

The model does not use arbitrary analyst-chosen probability movements.

For team A vs team B:

```text
FreshDiff = FreshMapScore_A - FreshMapScore_B
```

Convert to a probability adjustment:

```text
fresh_adjustment_pp = 0.5 × FreshDiff
```

Then cap:

```text
fresh_adjustment_pp = clamp(fresh_adjustment_pp, -4 pp, +4 pp)
```

Examples:

```text
FreshDiff = +2.0 → +1.0 pp
FreshDiff = +5.0 → +2.5 pp
FreshDiff = +10.0 → +4.0 pp cap
```

This is intentionally conservative.

The goal of v2.0 is not to replace the market with a standalone model. The goal is to test whether fresh, measurable information adds incremental value.

---

# 11. Total probability adjustment

For team A:

```text
adjustment_A =
fresh_adjustment_A
+ roster_adjustment_A
- roster_adjustment_B
```

Then:

```text
p_v2_A = p_market_A + adjustment_A
```

Final standard cap:

```text
p_v2_A must remain within ±5 pp of p_market_A
```

Therefore:

```text
p_v2_A = clamp(
    p_market_A + adjustment_A,
    p_market_A - 0.05,
    p_market_A + 0.05
)
```

The opponent probability is:

```text
p_v2_B = 1 - p_v2_A
```

---

# 12. Exceptional adjustment

v2.0 allows **no exceptional adjustment above ±5 pp**.

Reason:

The first objective is to test whether a modest systematic deviation from market improves information quality.

If ±5 pp proves too restrictive, that can be evaluated in a future method version.

Changing this limit after v2.0 starts requires `v2.1` or `v3`.

---

# 13. H2H

Historical H2H does **not** directly move probability.

It may be used only to understand:

- recurring veto interaction,
- stylistic mismatch,
- whether the same current rosters have recently played.

A recent H2H result may already enter the fresh-form calculation through its maps.

Therefore it must not be double-counted as an additional probability adjustment.

---

# 14. Fatigue / travel / tournament workload

No direct probability adjustment is allowed for:

- number of maps played that day,
- "momentum",
- travel narrative,
- short rest,
- long tournament run,

unless there is an explicit objective condition such as:

- confirmed illness,
- player absence,
- emergency stand-in,
- technical or logistical disruption with credible source.

This removes one of the main narrative channels that caused unstable v1 adjustments.

---

# 15. BO3 vs BO5

The same probability model is used for BO3 and BO5.

No manual "BO5 favours the better team" probability bonus is permitted.

Format effects should already be reflected in:

- the market prior,
- available map-level evidence,
- the resulting price.

If a future version builds a map-simulation layer, format can be modelled explicitly there.

---

# 16. Fair odds

For the selected side:

```text
fair_odds = 1 / p_v2
```

Probability is stored to 4 decimal places.

Fair odds are stored to 2 decimal places.

---

# 17. Value

```text
value = market_odds / fair_odds - 1
```

Displayed as percentage:

```text
value_pct = value × 100
```

---

# 18. BET / PASS rule

v2.0 keeps the same decision threshold as v1.

### BET

Allowed only when:

```text
value >= +8%
```

and all of the following are true:

- full factual snapshot verified,
- no unresolved roster uncertainty,
- no missing opponent price,
- fresh-form input quality is sufficient,
- probability movement has an explicit mechanical basis,
- no data-quality warning invalidates the calculation.

### PASS

Use PASS when:

- value < +8%,
- value is negative,
- data quality is insufficient,
- roster state is uncertain,
- fresh-form sample is below minimum usable threshold.

No stake escalation.

If real-money use is disabled during v2 validation, BET means **paper BET only**.

---

# 19. Confidence

Confidence measures confidence that the estimated value is real.

Suggested mechanical guide:

| Confidence | Condition |
|---|---|
| 3–4 | weak / incomplete fresh sample |
| 5 | ordinary complete sample |
| 6 | strong complete sample, clear mechanical adjustment |
| 7 | strong sample + large value |
| 8+ | not expected in v2.0 |

Confidence does not change probability.

Confidence does not change staking.

---

# 20. Required factual snapshot

Before v2 probability is calculated, record:

- date
- event
- stage
- BO format
- expected rosters
- stand-ins / recent roster changes
- ranking bands
- last 30 days of current-roster tier-1 maps
- map scores if available
- opponent ranking band for each map
- STS odds for both sides
- exact odds timestamp

No probability calculation is allowed before this snapshot is complete enough to satisfy minimum-data rules.

---

# 21. Required v2 prediction fields

Each prediction should include at least:

```text
id
date
report
game
match
market
pick
market_odds_at_analysis
market_odds_opponent
odds_timestamp

p_market
fresh_input
fresh_map_score_pick
fresh_map_score_opponent
fresh_diff
fresh_adjustment_pp
roster_adjustment_pp
total_adjustment_pp

estimated_probability
fair_odds
value_pct
decision
confidence

closing_odds
closing_odds_opponent
result

agent
method_version: "v2"
```

---

# 22. Closing-line metric

v2 should track closing odds on **both sides** whenever possible.

For every prediction with a valid closing snapshot, compute de-vigged closing probability.

Primary line-movement diagnostic:

```text
direction_correct =
sign(p_v2 - p_market_at_analysis)
==
sign(p_market_close - p_market_at_analysis)
```

Only include cases where:

```text
abs(p_v2 - p_market_at_analysis) >= 0.03
```

That means at least a 3 percentage-point model deviation.

Minimum sample before interpretation:

```text
n >= 30 valid deviations with closing snapshot
```

This metric is **diagnostic, not promotion-gating by itself**.

Coverage must always be reported:

```text
valid_closing_snapshots / all_predictions
```

---

# 23. Primary evaluation metrics

v2 is evaluated against the de-vigged market.

Required metrics:

1. Brier score v2
2. Brier score de-vigged market
3. Brier Advantage:

```text
market_brier - v2_brier
```

4. calibration buckets
5. average absolute deviation from market
6. line-movement direction accuracy for deviations >=3 pp
7. BET count
8. paper BET ROI
9. paper BET CLV where available

No metric is interpreted without sample size.

---

# 24. Validation stages

Per `agent × method_version`:

```text
0–49      Collection
50–99     Preliminary signal
100–149   Emerging pattern
150+      Formal checkpoint
```

At 150:

- compute paired Brier vs market,
- compute uncertainty / bootstrap interval,
- report whether the difference is practically meaningful,
- do not use a sign-only pass/fail without uncertainty commentary.

Because v1 showed that n=150 may still be underpowered, the 150 checkpoint is a formal review point, not automatic proof of edge.

---

# 25. Promotion rule

v2 cannot become active for real-money decisions unless all are satisfied:

1. at least 150 settled v2 predictions per agent,
2. Brier Advantage vs Market > 0,
3. bootstrap analysis does not show the result is dominated by one or two matches,
4. calibration has no major systematic failure,
5. no major data-quality issue,
6. paper BET sample is not strongly negative,
7. line-movement diagnostic is not materially worse than chance when enough samples exist,
8. operator explicitly approves promotion.

If evidence remains inconclusive:

> v2 stays paper-only.

If v2 is clearly worse than market:

> v2 is frozen as failed and any revised method starts a fresh version.

---

# 26. Freeze procedure

Before the first v2 prediction:

1. review this draft with the second agent,
2. resolve disagreements,
3. create final `docs/METHOD_V2.md`,
4. add required schema changes,
5. verify dashboard support,
6. record freeze date,
7. record Git commit SHA,
8. record first eligible event after freeze,
9. start sample from zero.

No v2 prediction may predate the freeze commit.

---

# 27. What must not change after freeze

Without a version bump, do not change:

- 30-day window,
- 14-day half-life,
- 8-series / 20-map cap,
- minimum sample rules,
- opponent quality weights,
- roster reset rules,
- roster penalties,
- `0.5 × FreshDiff` mapping,
- ±4 pp fresh cap,
- ±5 pp total market-deviation cap,
- +8% BET threshold,
- closing-line diagnostic threshold of 3 pp,
- validation checkpoint rules.

Any of these changes requires a new method version.

---

# 28. Known limitations of this draft

This draft deliberately chooses simplicity over sophistication.

Major limitations:

- opponent ranking bands are coarse,
- round differential is not map-normalized,
- no side-adjustment,
- no pistol-round adjustment,
- no map-specific simulation,
- no direct VRS/Elo regression,
- no uncertainty distribution around p_v2,
- no separate BO5 model.

These are acceptable for v2.0 because the immediate research question is narrower:

> Does a small, explicit, measurable fresh-form adjustment improve on the market?

If not, adding complexity is unlikely to rescue the core hypothesis.

---

# 29. Questions for second-agent review

Please respond specifically to:

1. Is the 30-day / 14-day-half-life structure reasonable?
2. Is `0.5 × FreshDiff` too weak, too strong or conceptually wrong?
3. Should the fresh adjustment cap be ±4 pp?
4. Should total deviation from market be capped at ±5 pp?
5. Are the opponent-quality weights too coarse?
6. Should one-player roster changes partially reset historical maps?
7. Are roster penalties too subjective to belong in v2.0?
8. Should round differential be mandatory, or should fallback map-result mode exist?
9. Should BO5 remain fully market-anchored with no format adjustment?
10. Should the +8% BET threshold remain unchanged?
11. Is the line-movement diagnostic well defined?
12. Are 30 closing observations enough even for a preliminary diagnostic?
13. What would you remove from this draft to reduce overfitting risk?
14. What essential measurable input is missing?
15. Which parameters must be decided by operator rather than analyst?

---

# 30. Proposed status after review

If both agents agree on the final rules:

```text
v1 = archived research baseline
v2 = frozen paper method
active real-money version = none
benchmark = de-vigged STS market
```

The next qualifying tier-1 match after the freeze commit becomes:

```text
first v2 observation
```

No historical v1 match is retroactively scored as v2.
