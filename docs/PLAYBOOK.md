# Edge Playbook

## Purpose

This playbook defines how Edge evaluates esports betting opportunities.

It is an operating document. It should change only when new evidence justifies a change.

## Core Objective

Edge does not try to predict every result.

Edge tries to make the best possible betting decision using the information and price available before the match.

## Decision Framework

Each reviewed market should follow this sequence:

1. Verify the event.
2. Verify the match format.
3. Verify expected rosters and known substitutions.
4. Review recent team level and opponent quality.
5. Review map pool or game-specific matchup factors.
6. Estimate win probability.
7. Convert probability into fair odds.
8. Compare fair odds with bookmaker odds.
9. Account for uncertainty and market margin.
10. Decide BET or PASS.
11. Record the decision before the match.
12. Review the decision after the match without rewriting the pre-match logic.

## BET Requirements

A market may be marked BET only when:

- the bookmaker odds are meaningfully above estimated fair odds,
- the underlying information is sufficiently reliable,
- the risk is understood,
- the selection would be acceptable as a single,
- the decision is not being forced to create action,
- the stake fits the current bankroll rules.

## PASS Conditions

Use PASS when:

- the price is too short,
- the estimated edge is too small,
- roster or format information is uncertain,
- the market appears efficient,
- the match is too volatile,
- the analysis depends on one weak assumption,
- the selection is attractive only as a filler,
- there is no reliable advantage.

## Coupon Rules

- Every leg must qualify independently as a BET.
- Never add a selection only to increase the combined odds.
- Do not lower the quality threshold because a coupon needs another leg.
- Track the result of each leg separately.
- Track recommended selections as singles for analytical purposes, even if the user combines them.

## Stake Rules

Initial phase:

- 1u = 2 PLN
- Default real-money stake: 1u
- No stake increase after losses
- No chasing
- No martingale
- No confidence-based stake escalation until the confidence scale is validated

## Confidence

Confidence refers to confidence that value exists, not confidence that the selection will win.

Suggested scale:

- 1–3: weak thesis, normally PASS
- 4–5: uncertain, normally PASS
- 6: small possible edge
- 7: reasonable value
- 8: strong value with reliable information
- 9: exceptional setup
- 10: should be used extremely rarely

Confidence must not replace probability or fair odds.

## Fair Odds

Fair odds should be derived from estimated probability:

```text
fair_odds = 1 / estimated_probability
```

Example:

```text
estimated probability = 0.60
fair odds = 1.67
```

A bookmaker price above fair odds may indicate value, but uncertainty must be included before recommending a bet.

## Market Review

### Moneyline

Check:

- team strength,
- recent opponent quality,
- roster stability,
- map-pool compatibility,
- match format,
- motivation and tournament context,
- price sensitivity.

### Over 2.5 Maps

Check:

- BO3 format,
- whether each team has a realistic map advantage,
- map veto structure,
- likelihood of one-sided maps,
- recent sweep frequency,
- roster uncertainty,
- whether both teams can win their likely map pick.

Do not assume that a balanced matchup automatically produces three maps.

### Map Handicap

Check:

- favourite consistency,
- underdog map floor,
- veto,
- likelihood of overtime or close losses,
- difference between match win probability and map-margin probability.

## Stand-In and Roster Changes

Do not automatically fade a team using a stand-in.

Evaluate:

- player quality,
- role fit,
- communication burden,
- preparation time,
- map-pool changes,
- whether the stand-in has played with the core before,
- whether the bookmaker already adjusted the price.

Roster disruption is a factor, not a complete betting thesis.

## Post-Match Review

Review should answer:

- Was the factual pre-match information correct?
- Was the probability estimate reasonable?
- Was the market choice appropriate?
- Did the result expose a structural analytical mistake?
- Was the loss normal variance?
- Was the price still good regardless of the result?
- Did the closing line move in the expected direction?
- Should any rule change?

Do not mark every winning PASS as a mistake.

Do not mark every losing BET as a bad decision.

## Required Records

For every real bet:

- date,
- esport,
- competition,
- match,
- market,
- pick,
- bookmaker,
- odds taken,
- opening odds if available,
- closing odds if available,
- fair odds,
- estimated edge,
- confidence,
- stake,
- result,
- gross return,
- net result,
- report reference,
- review notes.

For every important PASS:

- match,
- market,
- available odds,
- fair odds if estimated,
- reason for PASS,
- final result,
- post-match review.

## Current Lessons

### From EDGE-001

- No fillers.
- Low odds do not guarantee safety.
- Every coupon leg must qualify as a single.

### From EDGE-002

- Map totals may sometimes be a better expression of a balanced BO3 thesis than the match winner.
- Stand-in impact can be overestimated.
- Short-priced favourites can still be poor bets.
- Exact odds for PASS decisions must be preserved.

## Change Policy

The playbook should not change because of one surprising result.

A rule may be updated when:

- repeated evidence supports the change,
- a data review identifies a consistent bias,
- the existing rule is unclear or contradictory,
- a new market requires an explicit process.

Every meaningful change should be committed with a short explanation.

## Calibration & CLV Protocol

This section answers the two questions the rest of the playbook depends on: are Edge's probability estimates calibrated, and do identified prices beat the closing line? Until both have answers, every fair-odds figure is an unvalidated estimate.

### Logging

Every market that receives a full analysis in a daily report is appended to the `predictions` array in `data/bets.json` — **both BET and PASS**. Logging only BETs creates selection bias. A logged entry means Edge produced an estimated probability for it.

Required fields per entry: `id` (P-YYYY-MM-DD-NN), `date`, `report`, `game` (cs2 | lol | dota2), `match`, `market`, `pick`, `estimated_probability` (must equal 1 / fair_odds), `fair_odds`, `market_odds_at_analysis`, `market_odds_opponent` (the other side's price at the same moment — required, since without it the de-vigged market baseline cannot be computed), `odds_timestamp`, `closing_odds` (null at creation), `decision`, `confidence`, `result` (`pending` at creation).

### Closing snapshot

As close to match start as practical, record `closing_odds` for the pick (same bookmaker: STS). A snapshot 1–2 hours before start is acceptable. **Never fill closing odds after the result is known** — a missing value stays null forever; a backfilled one is corrupted data. Priority: all BETs first, then highest-confidence PASSes.

### Settlement

After the match, set `result` to `won` / `lost` / `void` — meaning: did the **pick** win, regardless of the decision.

### Metrics

- **Brier score**: mean of `(estimated_probability − outcome)²` over settled entries; outcome is 1 if the pick won, else 0. Lower is better; 0.25 equals always saying 50%.
- **Market baseline**: de-vigged market probability `p = (1/odds_pick) / (1/odds_pick + 1/odds_opponent)`, scored the same way on the same matches. Edge's estimates add information only if their Brier beats this baseline over a real sample. If they do not, fair odds should be anchored to the de-vigged market price.
- **Calibration table**: entries bucketed by estimated probability (50–60%, 60–70%, …) vs actual win rate per bucket. Systematic gaps reveal over- or under-confidence.
- **CLV**: `(odds_at_analysis / closing_odds − 1) × 100` for entries with a closing price. Consistently positive CLV on BETs is the strongest early evidence of edge; consistently negative CLV predicts long-term losses regardless of recent results.

### Historical backfill

Entries reconstructed from already-published reports carry `"recording_mode": "historical_backfill"` and a `data_quality` array naming what is missing (e.g. `missing_opponent_odds`, `unknown_exact_timestamp`, `missing_market_odds`, `fair_odds_not_recorded`). The required-fields rule applies in full to new entries only; backfilled entries are exempt but must declare their gaps explicitly. Missing information is never reconstructed from memory or assumption — a missing value stays null, and entries lacking a probability estimate are excluded from calibration metrics.

### Verdict staging

Metrics are surfaced in stages tied to the sample-size discipline above: Collection (0–49 settled eligible predictions — nothing computed), Preliminary signal (50–99), Emerging pattern (100–149), Validation checkpoint (150+). The Brier failure condition is evaluated only at the validation checkpoint and only on the paired sample — settled entries that have both a probability estimate and both market prices, so Edge and the market are always scored on identical matches. The CLV checkpoint is independent: it triggers at 50 closing snapshots on BETs regardless of how many predictions are settled, since closing lines are known before results.

### Sample size discipline

Under 50 settled predictions: compute nothing, conclude nothing. 50–100: preliminary signal. 100–300: patterns worth discussing. 300+: conclusions may carry weight. Do not create or change rules from a smaller sample.

### Failure conditions (pre-registered)

- If after 150 settled predictions Edge's Brier score is not better than the market baseline, the probability-estimation method is considered not validated.
- If after 50 closing snapshots on BETs the average CLV is negative, the selection method is considered not validated.

Either failure means: stop real-money bets, keep logging paper predictions, and revise the method — or accept "no edge found" as the project's result. That outcome is a valid finding, not a failure of the project.
