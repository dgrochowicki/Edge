# Edge Roadmap

Last updated: 2026-07-19

## Purpose

This roadmap records the intended direction of Edge without turning untested ideas into methodology.

The repository remains the source of truth. Rules belong in `docs/PLAYBOOK.md`, current shared context belongs in `docs/PROJECT_MEMORY.md`, daily analysis belongs in `reports/`, and recorded decisions belong in `data/bets.json`.

Roadmap items describe planned work. They are not active rules until they are implemented and, where relevant, added to the playbook.

## Current stage — validation and data collection

Edge is currently testing whether its pre-match probability estimates and BET/PASS decisions add information beyond the bookmaker market.

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

Collect enough settled predictions to evaluate whether Edge is better than a de-vigged market baseline.

Milestones:

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

## Phase 4 — dashboard as an audit tool

The dashboard should help inspect the process, not merely display wins and losses.

Planned improvements:

- filters for esport, market, competition, odds range, confidence, decision, and source,
- drill-down from a metric to the underlying predictions and report,
- explicit sample-size warnings on every segmented metric,
- prediction-versus-outcome views,
- market-baseline comparison at both overall and segment level,
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

The structure should grow only when a real need appears.
