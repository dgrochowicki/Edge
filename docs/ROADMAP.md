# Edge Roadmap

Last updated: 2026-09-23 — v1 closed at its 150 checkpoint, v2 frozen and active. See `docs/archive/METHOD_V1.md`, `docs/METHOD_V2.md`, `docs/decisions/2026-09-23-v2-freeze.md`.

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

The immediate priority is not adding more features. It is collecting clean, comparable data.

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

Collect enough settled predictions to evaluate whether Edge is better than a de-vigged market baseline. **v1 completed this phase and reached its verdict on 2026-09-19/20** (see Current stage). v2 restarts the same milestone ladder from zero, per `docs/METHOD_V2.md` §19, plus one metric v1 did not have: **at n ≥ 100 valid two-sided closing snapshots, the closing-line movement metric gets its first read** (§18.2) — a bootstrap-tested mean movement of `p_market` toward v2's adjustment, independent of match outcome, reported alongside Brier rather than replacing it.

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

**What's new relative to v1.** v2 adds a metric independent of match outcome (closing-line movement in the direction of the adjustment, `docs/METHOD_V2.md` §18.2) precisely because the v1 checkpoint showed that Brier-at-150 alone can leave the question unresolved. It also adds an explicit stop rule (§20): if at 150 the confidence interval both contains zero and is already narrow (half-width ≤ 0.003), the result is recorded as "no detectable edge" and collection stops, rather than continuing indefinitely on an inconclusive method.

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
- `docs/decisions/` — now two entries: `2026-09-19-v1-checkpoint-150.md` (v1 verdict, operator decisions) and `2026-09-23-v2-freeze.md` (v2 freeze approval).

The structure should grow only when a real need appears.
