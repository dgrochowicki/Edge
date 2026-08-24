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

### From the roster-change sequence (25–26 Jul)

- **Observed signal beats predicted signal.** Betting against an "overvalued favourite with a rebuilt roster" is only justified when the new lineup has *already shown* weakness at this level — not on the assumption that a roster change will cause it. Liquid (25 Jul) had a hard, fresh result behind it (a 2:0 over Vitality on debut) and would have won; Wildcard vs a rebuilt MongolZ (26 Jul) rested only on the hypothesis that the new players would underperform, and the bet lost — MongolZ went on to the final. A roster change is uncertainty, not direction.
- **Good calibration can still lose a single bet.** On the day the Wildcard bet lost, Edge's Brier over the four matches still beat the de-vigged market baseline. A well-priced bet on a ~0.60 favourite's opponent loses ~40% of the time by construction. One settled BET is variance, not a verdict — the sample-size discipline applies to bets too.

### From EWC 2026 (post-tournament review)

- **The benchmark is the de-vigged market, never 0.25.** Beating 0.25 (always-50%) only proves an agent picks favourites; on tier-1 the market does that for free. Every calibration claim must be scored against the de-vigged market baseline on the paired sample. This is now a pre-publication check for summaries.
- **A low BET count is not self-evidently correct discipline.** Claude placed 0 BET across all of EWC. That is consistent with well-calibrated caution *and* with over-anchoring to the market — Brier and hit rate cannot tell them apart. Only CLV and a larger BET sample resolve it. Do not report 0 BET as proof of discipline.
- **Fresh-form vs market anchoring is the main v1→v2 axis, but not yet a rule.** The three EWC divergences (FUT>MOUZ, Spirit>Vitality won for the aggressive side; Legacy>Spirit lost) are three visible stories, not a signal. "Hot underdog = raise probability" is exactly the over-correction the Legacy bet fell into. v2 needs a *measurable* fresh-form signal (recent-opponent quality, results after a roster change, recency decay, maps vs top-tier, roster stability) tested on a fresh sample — designed on paper, not fitted to EWC results.

## Daily Discipline

The unit of success for a day is not a won coupon. It is one more trustworthy observation in the current method's sample.

Each day:

- Log every analysed market (BET and PASS) with `agent`, `method_version`, estimated probability, fair odds, market odds at analysis, decision, confidence, and stake if BET.
- Settle results after matches (`won` / `lost` / `void`).
- Record closing odds only when it can be done without disrupting the process; a missing snapshot stays null (see Closing snapshot).
- New ideas and observations are logged as notes or hypotheses — they do not change the active method's rules mid-flight.

A day is correctly closed when every prediction is logged with correct `agent` and `method_version`, reports remain immutable after publication, and played matches are settled. What a day is explicitly *not* for: switching method version, changing BET/PASS thresholds, fitting probabilities to earlier results, editing published predictions, or declaring the method works or fails on that day's evidence.

## Pre-Publication Checklist

Before any daily report or summary is published (delivered as a file), the author runs this checklist. Every item has caused a real, named error in the project; the checklist is the memory of those errors, not a formality. A report that fails any item is not published until fixed — because reports are immutable once out, a caught error here is cheap and a missed one costs a whole append.

For every match analysed:

- **Match format.** BO1 / BO3 / BO5 is verified against the source and stated correctly. Format is an input to the analysis (Decision Framework step 2), not decoration. *(FUT–Spirit was logged BO5-as-BO3 in the EWC final report.)*
- **Market favorite direction.** The team described in prose as the market favorite is the one with the lower STS odds. The `Gram na` (pick) column and the STS odds pair must agree with the prose — a pick at the higher price is an underdog and the text must say so. *(A prior report described the wrong team as market favorite while the JSON said otherwise.)*
- **Odds display order.** In the section-1 table the STS odds pair reads in match-name order (`A vs B` → `odds A / odds B`), not pick-first.
- **Prose ↔ JSON consistency.** Pick, decision (BET/PASS), fair odds and estimated probability in the prose match the JSON block exactly. `estimated_probability` equals `round(1 / fair_odds, 4)`.
- **Scope.** Every logged match is in-scope tier-1 CS2 (see Calibration & CLV Protocol → Scope). Out-of-scope matches are absent entirely, not logged as PASS.
- **Calendar completeness.** The full bracket of every active tournament up to tier-2 was checked before the short list — a narrow date filter has repeatedly hidden qualifying matches.
- **Data gaps named, not assumed.** Missing odds or timestamps are recorded as missing (`brak odczytu`, `STS nie oferuje`), never as assumed values. `odds_timestamp` is the time odds were read, not the report time.

For summary / phase reports, additionally:

- **Benchmark is de-vigged market, not 0.25.** Any calibration claim compares Brier against the de-vigged market baseline on the paired sample, not against the 0.25 coin-flip line. 0.25 may be mentioned but is never the headline benchmark.
- **Checkpoint counted per agent × method_version.** Sample-size and validation-stage claims are per (agent × version), never pooled. A pooled total crossing 150 validates nobody.

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

### Scope (what gets analysed at all)

**Edge is CS2-only.** Other esports (LoL, Dota 2, etc.) are out of scope — the project's edge comes from deep, game-specific knowledge of Counter-Strike (rosters, transfers, form, map pools), which does not transfer to games the analyst does not follow at the same level. Without that qualitative signal there is nothing but copying the market, so non-CS2 matches get no analysis and no ledger entry.

Within CS2, Edge analyses only **tier-1 matches** — primarily BLAST events and equivalent S-Tier tournaments (Valve Tier 1). Everything below that is out of scope and receives **no analysis, no fair-odds figure, and no ledger entry**: tier-2/tier-3 events, closed/open qualifiers (including StarLadder, CCT, Thunderpick, NODWIN, Urban Riga, and similar), academy or B-teams (e.g. *paiN Academy*), and non-BLAST events that are not S-Tier.

Out-of-scope matches are not "PASS" — PASS is a valuation decision for an in-scope match with no edge. An out-of-scope match is never valued in the first place: it does not get an `estimated_probability`, `fair_odds`, a row in the valuation table, or a JSON entry. If a day has no in-scope matches (e.g. a break in the tier-1 calendar), the correct result is **NO QUALIFYING MATCHES** with an empty predictions block — not a set of tier-2 valuations that happen to end in PASS. Logging out-of-scope matches, even as PASS, contaminates the calibration sample with a different data-quality and predictability regime and is not permitted.

**Why tier-1 specifically:** tier-1 markets are deep — bookmakers invest analyst time proportional to betting volume, so lines are sharp and de-vigged prices are a meaningful baseline. Tier-2/3 markets are thin and loose; a "value" figure there reflects bookmaker inattention, not a calibrated edge, and mixing both regimes corrupts the Brier comparison.

**In-scope tournaments (reference list — judge by tier/series, not exact edition name):**

Scope is defined by the *series/organiser at tier-1 (S-Tier, Valve Tier 1)* — edition names and dates change each season, so match the series, not the string. In scope:

- **Valve Majors** — the two official Majors each year (2026: IEM Cologne in June, PGL Major Singapore in November). Highest priority.
- **BLAST** top events — Bounty (Winter/Summer seasons), BLAST Open, BLAST Rivals. (Current: BLAST Bounty S2, Malta LAN 30 Jul–2 Aug.)
- **IEM** (Intel Extreme Masters) main events — e.g. IEM Kraków, IEM Rio, IEM Atlanta, IEM China. (Not IEM regional/Challenger — those are tier-2.)
- **ESL Pro League** — the season main events / finals (roughly two seasons a year; S23 spring, S24 ~Oct).
- **PGL** main events — PGL Bucharest, PGL Cluj-Napoca, PGL Astana, PGL Masters, plus any PGL Major.
- **Esports World Cup** CS2 (Aug) and other confirmed S-Tier internationals (e.g. FISSURE Playground main events, StarLadder StarSeries *main events*).

**Explicitly out of scope**, regardless of which teams play: any qualifier (closed or open) including qualifiers *to* a tier-1 event (the qualifier itself is lower-tier — e.g. StarLadder StarSeries qualifiers are out even though the September main event is in); tier-2/3 circuits (CCT, Thunderpick World Championship, NODWIN, Urban Riga, United21, ESL Challenger, ESEA Premier, regional IEM); academy / B-teams (e.g. paiN Academy); and any event not at S-Tier. When unsure whether an event is tier-1, check its Liquipedia tier — "S-Tier" / "Valve Tier 1" is in scope, anything below is not.

### Logging

Every **in-scope** market that receives a full analysis in a daily report is appended to the `predictions` array in `data/bets.json` — **both BET and PASS**. Logging only BETs creates selection bias. A logged entry means Edge produced an estimated probability for it. Out-of-scope matches are excluded entirely (see Scope above).

Required fields per entry: `id` (P-YYYY-MM-DD-NN), `date`, `report`, `game` (always `cs2` — Edge is CS2-only; see Scope), `match`, `market`, `pick`, `estimated_probability` (must equal 1 / fair_odds), `fair_odds`, `market_odds_at_analysis`, `market_odds_opponent` (the other side's price at the same moment — required, since without it the de-vigged market baseline cannot be computed), `odds_timestamp`, `closing_odds` (null at creation), `decision`, `confidence`, `result` (`pending` at creation).

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

Metrics are surfaced in stages tied to the sample-size discipline above: Collection (0–49 settled eligible predictions — nothing computed), Preliminary signal (50–99), Emerging pattern (100–149), Validation checkpoint (150+). **These stages and the 150 checkpoint are counted per agent, not pooled.** Each agent (gpt, claude) is an independent experiment with its own probability estimates, its own calibration curve, and its own Brier score, so each reaches every stage on its own settled sample. The unit of a sample is therefore (agent × method_version): e.g. `gpt × v1` and `claude × v1` are counted and evaluated separately, and one reaching 150 says nothing about the other. Agents cross the checkpoint at different times (gpt well before claude at current volumes) — that is expected; each gets its verdict when its own sample matures. The Brier failure condition is evaluated only at the validation checkpoint and only on the paired sample — settled entries that have both a probability estimate and both market prices, so Edge and the market are always scored on identical matches. The CLV checkpoint is independent: it triggers at 50 closing snapshots on BETs regardless of how many predictions are settled, since closing lines are known before results.

### Sample size discipline

Under 50 settled predictions: compute nothing, conclude nothing. 50–100: preliminary signal. 100–300: patterns worth discussing. 300+: conclusions may carry weight. Do not create or change rules from a smaller sample.

### Failure conditions (pre-registered)

- If after 150 settled predictions (counted per agent) an agent's Brier score is not better than the market baseline, that agent's probability-estimation method is considered not validated. Each agent is evaluated on its own sample.
- If after 50 closing snapshots on BETs the average CLV is negative, the selection method is considered not validated.

Either failure means: stop real-money bets, keep logging paper predictions, and revise the method — or accept "no edge found" as the project's result. That outcome is a valid finding, not a failure of the project.

### Method versioning

A red verdict (Brier not beating the market at 150, or negative CLV at 50 snapshots) does not end the project — it ends the *current method*. Revising and trying again is the correct scientific move, but only under one strict rule that prevents fooling ourselves.

**Every method revision starts a fresh, separate sample. Never re-evaluate a changed method on the data that produced the old verdict.**

Tuning a method until the past numbers look good is overfitting: it fits the noise of matches already played and will not survive on new ones. It is the most common way people manufacture an illusion of edge. The defence is procedural, not a matter of willpower.

Rules:

- Each prediction carries a `method_version` field (e.g. `"v1"`, `"v2"`). All entries logged under one version belong to one experiment.
- When the method changes in any way that affects how fair odds are estimated (new model, new inputs, different scope of events, different market types), bump the version. Cosmetic changes (wording, formatting) do not bump it.
- A new version's failure conditions are evaluated **only** on entries with that version — its own fresh 150 settled predictions for Brier, its own 50 snapshots for CLV. The counter effectively resets per version.
- Old-version entries are never deleted. They become the archive of "what did not work" and stay in the dataset, excluded from the new version's metrics.
- The metrics dashboard evaluates each version independently. A version is validated, not validated, or still collecting — on its own data only.
- Document each version bump in PROJECT_MEMORY: what changed, why, and the verdict that triggered it. This is the project's research log.

This turns Edge into an open-ended research loop — collect, get a verdict, revise, collect again — where every iteration is an honest, independent test rather than a retrofit of the last one. The project can run this loop indefinitely as a learning exercise, with or without ever placing real money.
