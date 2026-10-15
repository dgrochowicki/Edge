# Edge Roadmap

Last updated: 2026-10-14 — added priority research proposal: independent **blind-first** match pricing before bookmaker odds are revealed. The existing frozen v2 valuation and E2 evaluation protocol remain unchanged. Previous update: 2026-10-11 — first v2 tournament (EPL S24, 41 predictions) audited; v2 evaluation switched to protocol E2 (closing-line slope β as primary, valuation unchanged). See `docs/METHOD_V2.md`, `docs/decisions/2026-10-11-v2-ocena-e2.md`, `reports/summaries/ESL-Pro-League-S24-2026-summary.md`.

## Purpose

This roadmap records the intended direction of Edge without turning untested ideas into methodology.

The repository remains the source of truth. Rules belong in `docs/PLAYBOOK.md`, current shared context belongs in `docs/PROJECT_MEMORY.md`, daily analysis belongs in `reports/`, and recorded decisions belong in `data/bets.json`.

Roadmap items describe planned work. They are not active rules until they are implemented and, where relevant, added to the playbook.

## Current stage — v2 data collection

**v1 is closed.** Both agents reached their 150-prediction checkpoint during StarLadder StarSeries Fall 2026 (2026-09-19/20): claude not validated (+0.00020 vs market, n=150), gpt formally validated (−0.00034 vs market, n=150) — but neither difference is distinguishable from zero at that sample size (95% CI roughly ±0.0045–0.006). Full analysis: `reports/summaries/v1-checkpoint-150.md`. v1 entries stay in `data/bets.json` permanently as the archive; no new `method_version: "v1"` predictions are logged after the freeze.

**v2 is the active method**, frozen 2026-09-23 (`docs/METHOD_V2.md`, `docs/decisions/2026-09-23-v2-freeze.md`). Edge is now testing whether v2's mechanical fresh-form adjustment to the de-vigged market contains information beyond that market — the same underlying question v1 tested, with a different, deterministic estimation method and one canonical prediction per match instead of two independent ones.

Already in place:

- daily reports for the reviewed offer,
- explicit BET and PASS decisions,
- separation of official recommendations from user bets,
- fixed initial stake of `1u = 2 PLN`,
- prediction logging for every fully analysed market,
- Calibration & CLV Protocol,
- dashboard views for results, reports, logs, and calibration progress.

**Since 2026-10-11 (E2):** the question is decided by whether the market moves toward v2's adjustment before the match (slope β, K1 at 100 / K2 at 200 valid observations), not by Brier at 150 — at v2's adjustment sizes Brier has no power. After EPL S24: 41 settled, 28 valid β observations, so K1 is roughly four tier-1 tournaments away. **The binding constraint is closing-odds coverage**, not the prediction count.

The immediate priority is not adding more features. It is collecting clean, comparable data.

## Priority research proposal — independent blind-first pricing (2026-10-14)

**Status: DISCONTINUED 2026-10-15, after one day of `blind_pilot_v0`.** The protocol (`docs/decisions/2026-10-14-blind-pilot.md`) was approved and launched 2026-10-14/15, then closed after 2 of 4 fixtures were contaminated by incidental exposure to community consensus data in general web search results during Phase A — a structural, recurring risk, not a one-off, that made the pilot's own ≥90%-valid-lock quality bar unreachable. See the decision record §9 for the full closure note and what would need fixing before anyone restarts this line of work. This section is kept as the historical record of the motivation; `docs/METHOD_V2.md`, E2 and the existing reporting were never changed by this experiment.

### Why test this?

Edge's original practical aim was to detect **prices where the bookmaker may be wrong**. Yet frozen V2 starts with STS de-vig probabilities and can move only ±5 percentage points, typically much less. That is a valid, narrowly defined research experiment, but it is structurally unlikely to yield many +8% BETs after STS margin. Knowing the odds before a discretionary assessment also risks **anchoring**: the analyst may explain the bookmaker's favourite instead of estimating the match independently.

This is a **hypothesis**, not evidence that blind estimates will be more accurate or more profitable. The bookmaker may have the better estimate. The test asks whether a truly pre-price forecast adds information beyond the contemporaneous market, without using that market as its prior.

### Proposed workflow — no odds until the independent forecast is locked

1. **Scope and match list.** Select all eligible upcoming tier-1 CS2 moneyline matches prospectively, according to a predeclared schedule; do not cherry-pick only attractive pairings. Verify competition, exact match date/time, BO format, rosters, stand-ins and known changes. Keep a record of any match not assessed and why.
2. **Blind research.** The estimating analyst receives only fixtures and factual match information. Do **not** show STS odds, prices from HLTV/other bookmakers, de-vig probabilities, community betting forecasts or line-movement information. Avoid odds-bearing search snippets and pages. If a source mixes team news with odds, use an odds-free source instead. Record sources and uncertainties; never invent missing map/roster facts.
3. **Independent match estimate.** Using an agreed, repeatable pre-registered framework, assess recent tier-1 form and opponent quality, current roster, relevant map pool, likely veto when genuinely known, LAN/context and data reliability. Record *both sides* as one coherent probability estimate (`p_A + p_B = 1`), fair odds for each side, a defensible uncertainty range, confidence and specific factual reasons. The estimate must **not** be V2's market prior with a different label; its detailed estimator must be specified before use, not improvised after seeing prices or outcomes.
4. **Lock before reveal.** Save the prediction with fixture ID, event, date, BO, analyst, data cutoff, timestamp in Europe/Warsaw, supporting sources, roster status, uncertainty, `p_A`, `p_B`, fair odds and `odds_seen_before_lock: false`. Deliver an immutable file to the operator or commit it **before** any odds are revealed. Record a content hash or repository commit/time so later comparison can verify the original forecast. No retroactive editing or replacing the locked estimate.
5. **Reveal the price.** Only after the operator has the locked file does the user supply a contemporaneous pair of STS ML odds with an exact timestamp. Store both odds and calculate market de-vig, overround, fair/value on both sides. Pick the larger calculated value for descriptive comparison; do not change the underlying blind probabilities. If STS prices are unavailable, keep the blind prediction and mark price metrics missing — never substitute guessed prices.
6. **Information check and post-lock handling.** If the gap suggests an overlooked roster change or another verifiable fact, record the finding separately. Do **not** silently revise the initial forecast; a corrected new view, if useful, must be separately dated and excluded from the primary blind-forecast score. Collect both closing odds before match start where possible, then settle the result.
7. **Evaluate prospectively.** Score **every eligible locked forecast**, not just candidate bets. Record Brier and log loss against outcomes, compare the blind probabilities against same-match de-vigged STS market probabilities, inspect calibration, missing-data rates and prediction dispersion; examine CLV for any pre-specified paper selections when valid two-sided opening/closing snapshots exist. Report paired uncertainty intervals and sample counts. Do not reuse V2's β checkpoints as if they validate a different method.

### Blindness and sample integrity

- **A match whose STS/other bookmaker odds were already exposed to the estimating analyst is not blind.** This includes the four Thunderpick matches analysed on 2026-10-14; never relabel their predictions as independent or use them in the blind sample. A clean estimating context is required for future games. Switching chats alone is not a guarantee if the estimating context still contains price information.
- **Separate the contexts/roles.** An odds-free analyst prepares and locks the forecast; only then does the operator (or a separate price-handling workflow) reveal and calculate STS value. The currently scheduled V2 morning routine may continue independently, but its published odds and analyses must not reach the blind estimator before lock. If strict separation cannot be guaranteed, label the observation `blindness_compromised` and exclude it from the primary sample.
- **No outcome-informed selection.** Register the fixture pool, exclusions and missing observations ahead of time. All timestamps, evidence versions and original probabilities remain available for audit. Do not reconstruct a pre-match forecast after seeing the result.
- **No leaked model baseline.** Public power rankings and factual performance records may be used if allowed by the protocol, but any data derived from current betting prices or another market-implied forecast must be treated as exposure. The protocol must distinguish permitted objective match data from price proxies.

### Trial size, evidence and decision gates

- Start with an operational **pilot of 30–50 consecutive eligible, truly blind matches** to learn whether we can generate consistent, auditable independent estimates and whether gaps from STS are systematic. This is **not enough to claim profitability or a statistically established edge**. Log all PASS-equivalent and candidate selections without real-money staking.
- Before pilot launch, pre-register a baseline, a minimum acceptable data completeness level, candidate-value definition, thresholds used *only for paper selection*, primary performance metric(s), uncertainty calculation, and clear stop/continue rules. Do not import the V2 +8% BET gate, ±5 pp cap or E2 promotion policy by default; any new policy needs independent justification and operator approval.
- At the pilot review, distinguish three outcomes: (a) independent estimates appear promising but require a larger, fresh validation sample; (b) no demonstrated advantage over the paired STS market; (c) quality/blindness too weak for a conclusion. Even outcome (a) **does not authorize real-money BETs or promotion**.
- If the analyst simply produces bigger deviations from the market with worse Brier/log loss or no credible closing-line signal, do not interpret the extra BET candidates as success. The goal is **useful mispricing detection**, not bet volume.

### Storage and compatibility (proposal, not a schema migration)

- Keep the pilot outside the canonical V2 ledger and immutable daily V2 reports; propose separate paths such as `research/blind/YYYY-MM-DD-blind.md` (locked forecast) and `data/blind/YYYY-MM-DD.json` (post-reveal prices, validation metadata, outcomes), subject to the launch protocol.
- Use a separate experiment identity (e.g. `blind_pilot_v0`) and a separate scoring population. **Do not write these predictions into `data/bets.json` as `method_version: "v2"`**, do not mix them into v2 K1/K2, and do not change `docs/REPORT_TEMPLATE.md` v2.1 simply to accommodate the pilot.
- Suggested fields: `experiment_id`, `fixture_id`, `match`, `event`, `scheduled_start`, `bo`, `analyst`, `forecast_timestamp`, `data_cutoff`, `p_A`, `p_B`, `fair_A`, `fair_B`, `uncertainty`, `source_refs`, `roster_notes`, `data_quality`, `odds_seen_before_lock`, `lock_hash_or_commit`; the separate post-lock record holds `sts_odds_A`, `sts_odds_B`, `odds_timestamp`, `p_market_A`, both sides' value, `closing_odds_A/B`, `result`, `excluded_from_primary_sample` and its reason. The actual schema requires approval before use.

### Next implementation tasks

- [ ] Agree and document an odds-free estimation procedure, including data sources, probability calibration strategy and what to do when roster/veto details are unknown.
- [ ] Agree the clean separation between an odds-free forecaster and V2's odds-handling workflow; establish a verifiable pre-reveal lock.
- [ ] Approve the prospective pilot protocol, exact data schema, scoring, selection rule and 30–50-match review plan in `docs/decisions/`; only then launch.
- [ ] Run the first uncontaminated eligible fixtures as **paper research** while keeping V2 frozen and independent.
- [ ] Audit the first 5–10 locks for accidental odds exposure, traceability and timestamp correctness; fix only the process prospectively, without rewriting forecasts.
- [ ] Review the full pilot, including blind Brier/log loss versus the **paired STS market**, candidate CLV coverage and uncertainty; decide whether a larger out-of-sample validation is justified.

## Phase 1 — data integrity

Before drawing conclusions, make the dataset reliable enough to audit.

- Add an explicit schema version to `data/bets.json`.
- Document the data model in `docs/DATA_MODEL.md` once the current prediction and coupon structures stabilise.
- Validate required prediction fields, ID uniqueness, allowed enum values, and the relationship `estimated_probability = 1 / fair_odds`.
- Keep predictions, placed bets, and coupons conceptually separate:
  - a prediction records the model's pre-match view,
  - a bet records money actually staked,
  - a coupon records how one or more bets were combined by the user.
- Preserve the distinction between `official_recommendation` and `user_bet` in every performance view.
- Add a repeatable settlement workflow for results, voids, returns, and net P&L.
- Add a repeatable closing-odds workflow, prioritising BETs and then the highest-confidence PASSes.
- Never fabricate or reconstruct missing historical prices after results are known; unknown values remain `null`.
- Gradually migrate legacy `observed_passes` into the unified prediction structure only when the required historical fields are genuinely known.

### Completion signal

A report can be traced to its predictions, every placed bet can be traced to a pre-match decision, and dashboard metrics can be reproduced directly from repository data.

## Phase 2 — calibration and edge validation

Collect enough settled predictions to evaluate whether Edge is better than a de-vigged market baseline. **v1 completed this phase and reached its verdict on 2026-09-19/20** (see Current stage). v2 keeps the settled-count ladder from `docs/METHOD_V2.md` §19 (150 settled is the promotion floor), but since E2 (2026-10-11) its verdict comes from a metric v1 did not have: **the closing-line slope β, with checkpoints K1 at 100 and K2 at 200 valid observations** (§18.1, §20) — how far the market moves toward v2's adjustment before the match, independent of outcome. Brier is reported but descriptive, plus one safety condition.

Milestones (v1, historical — v2 uses the same ladder, see above):

- **Under 50 settled predictions:** collection only; no conclusions.
- **50–100:** preliminary calibration and CLV signal.
- **100–150:** investigate repeated biases, but avoid major rule changes.
- **150 settled predictions:** evaluate the pre-registered Brier-score failure condition.
- **50 BET closing snapshots:** evaluate the pre-registered average-CLV failure condition.
- **100–300:** patterns may justify controlled playbook experiments.
- **300+:** conclusions may carry meaningful weight if data quality remained consistent.

Planned analysis:

- Edge Brier score versus de-vigged market Brier score,
- calibration buckets comparing estimated probability with actual win rate,
- CLV distribution and average CLV for BET decisions,
- BET versus PASS decision quality,
- confidence-score calibration,
- performance by esport, market, odds range, competition, and source.

### Decision gate

If Edge does not beat the market baseline or produces negative BET CLV at the pre-registered checkpoints, pause real-money betting and continue with paper predictions while the method is revised. "No edge found" remains a valid project outcome.

## Phase 3 — structured research

Turn recurring observations into testable hypotheses rather than new rules based on individual matches.

Initial research backlog:

- Does Edge overestimate the impact of stand-ins and roster disruption?
- Are balanced CS2 BO3 matches better expressed through map totals than moneylines?
- Are short favourites systematically overpriced?
- What minimum estimated edge should be required before a BET?
- Does the current confidence scale predict decision quality or CLV?
- Which markets produce the strongest calibration and CLV: moneyline, map totals, or handicaps?
- How should PASS decisions be scored without hindsight bias?
- Does performance change materially between official recommendations and user-selected bets?

Each investigation should define:

- the hypothesis before reviewing outcomes,
- the eligible sample,
- the primary metric,
- the minimum sample size,
- the result and any methodology change it supports.

Meaningful methodology changes should later be recorded as short decision notes in `docs/decisions/` so the reason and evidence are not lost.

### Method versioning path (v1 → v2) — resolved 2026-09-23

Edge ran `v1` from 2026-07-21 to its 150-checkpoint verdict on 2026-09-19/20 (see Current stage, above). The path from there to `v2` was **not** the shadow run this section originally planned — that plan is superseded and kept here only as history.

**What actually happened.** At the v1 checkpoint, both agents' Brier scores were statistically indistinguishable from the de-vigged market (95% CI spanning zero for both). This changed the shadow plan's own premise: a live `v1` running alongside `v2` would have compared v2 against a baseline that is itself indistinguishable from the market — giving no information a direct "v2 vs contemporaneous market" comparison doesn't already give, at roughly double the daily cost (two valuations per match instead of one). The operator decided (2026-09-23, `docs/decisions/2026-09-23-v2-freeze.md`) that **v2 replaces v1 outright**: v1 is frozen as the historical archive, no new v1 predictions are logged, and v2 is scored against the contemporaneous de-vigged STS market — the same benchmark v1 was scored against, not against v1 itself.

**What v2 actually is.** A single deterministic formula, not a discretionary judgment call: de-vigged market prior → mechanical fresh-form adjustment (round-differential window, recency- and opponent-weighted) → one objective roster penalty (stand-in only, −2 pp) → capped adjustment (±4 pp fresh, ±5 pp total) → `p_v2`. Full specification, frozen parameters, and validation criteria: `docs/METHOD_V2.md`. Because the formula is deterministic, there is **one canonical v2 prediction per match** — gpt executes it daily, claude audits periodically rather than computing a parallel independent estimate (§21 of the method; this is also why the "two independent agents" framing throughout this roadmap's older sections describes v1, not v2).

**Sample counting.** v2 needs its own 150 settled predictions to reach a checkpoint — it does not inherit anything from v1's sample. v1 entries are never deleted, rescored, or mixed into v2 metrics; they remain the archive of what the method looked like before the freeze.

**What's new relative to v1.** v2 adds a metric independent of match outcome (closing-line movement in the direction of the adjustment, `docs/METHOD_V2.md` §18.2) precisely because the v1 checkpoint showed that Brier-at-150 alone can leave the question unresolved. It also adds an explicit stop rule (§20), so an inconclusive method cannot absorb work indefinitely. The original form (Brier CI contains zero with half-width ≤ 0.003 at 150) was retired on 2026-10-11 after the first audit showed it would fire regardless of the truth at v2's adjustment sizes; under E2 collection stops at K1 if β's CI upper bound is < 0.5, and at K2 unless β's lower bound is > 0.

## Phase 4 — dashboard as an audit tool

The dashboard should help inspect the process, not merely display wins and losses.

Planned improvements:

- filters for esport, market, competition, odds range, confidence, decision, and source,
- drill-down from a metric to the underlying predictions and report,
- explicit sample-size warnings on every segmented metric,
- prediction-versus-outcome views,
- market-baseline comparison at both overall and segment level,
- per-`method_version` separation of all calibration metrics, so a future v2 sample never silently mixes into v1 (a visible version label is a low-cost first step),
- CLV completeness and missing-data indicators,
- separate views for model recommendations, user bets, and coupon construction,
- a research view for active hypotheses and their sample progress,
- data-quality warnings for missing opponent odds, closing odds, results, or broken report references.

The dashboard must continue to derive its numbers from repository data rather than maintaining a second manual source of truth.

## Phase 5 — workflow automation

Automation comes after the data model and reporting method are stable. Automating an unstable process would only produce bad data faster.

Possible later automation:

- prepare the daily report workspace before 09:00 Europe/Warsaw,
- collect schedules, formats, roster news, and reliable match context,
- generate prediction IDs and validate report-linked JSON entries,
- remind about missing STS odds for both sides of an analysed market,
- capture closing-price snapshots before match start,
- settle results after matches finish,
- run data-integrity checks and refresh dashboard metrics,
- flag predictions or bets that need manual review.

Exact STS prices should remain user-provided or directly verified; Edge must never infer or invent bookmaker odds.

## Phase 6 — controlled expansion

Expansion should happen only after the core process has enough evidence.

Potential directions:

- increase League of Legends and Dota 2 coverage after the CS2 workflow is stable,
- add new market types only with an explicit analysis checklist,
- compare results across bookmakers only if price collection becomes reliable,
- consider variable staking only after probability calibration and edge are validated,
- consider a dedicated application or database only when repository-backed JSON becomes a real operational constraint.

## Explicit non-goals for the current phase

- Maximising the number of daily bets.
- Optimising accumulator odds.
- Increasing stakes after short-term success.
- Building a complex app before the method is validated.
- Treating dashboard polish as evidence that the betting model works.
- Changing the playbook because of one surprising match.

## Suggested documentation backlog

Create these files only when their contents become necessary:

- `docs/DATA_MODEL.md` — field definitions, entities, relationships, enums, and migration rules.
- `docs/METRICS.md` — exact formulas, inclusion criteria, sample-size rules, and dashboard definitions.
- `docs/HANDOFF.md` — a compact checklist for continuing the project in a new assistant session or environment.
- `docs/decisions/` — evidence-backed records of meaningful methodology or architecture changes.

Already created:

- `docs/METHOD_V2.md` — the active method (frozen 2026-09-23). Superseded the working notebook that seeded it, removed at freeze once its job was done (per Phase 3 → Method versioning path above).
- `docs/archive/METHOD_V1.md` — frozen snapshot of v1's rules, for interpreting the 313 `method_version: "v1"` entries in `data/bets.json`.
- `docs/decisions/` — three entries: `2026-09-19-v1-checkpoint-150.md` (v1 verdict, operator decisions), `2026-09-23-v2-freeze.md` (v2 freeze approval) and `2026-10-11-v2-ocena-e2.md` (evaluation protocol E2, `p_v2` field, pick rule).

The structure should grow only when a real need appears.
