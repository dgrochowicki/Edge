# Edge Roadmap

Last updated: 2026-08-24

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

### Method versioning path (v1 → v2)

Edge is currently running method `v1`. When a recurring observation is strong enough to justify a new way of estimating fair odds, it becomes `v2` — but only through a controlled path that keeps the test honest. The point of this subsection is that the path is written down before it is walked, so no step is skipped under the pressure of a good-looking result.

**Where we are now.** EWC 2026 is a frozen `v1` sample. Both agents are still in preliminary signal on their own per-agent counts (claude 86, gpt 83 settled), so `v1` keeps running unchanged through the next tier-1 events to grow its sample toward the per-agent 150 checkpoint. No rule changes mid-flight.

**What `docs/PRE-V2.md` is.** A working notebook, not a method. It collects the hypotheses EWC surfaced — chiefly a *measurable* fresh-form signal (recent-opponent quality, results after a roster change, recency decay, maps vs top-tier, roster stability) and the open question of whether the probability→BET conversion threshold is optimally cautious or over-anchored to the market. Everything in it is explicitly labelled non-active: every prediction still carries `method_version: v1`. The file exists so these ideas are not lost and not turned into rules prematurely.

**What we do with it.** The pre-v2 notebook is developed *on paper, in parallel* with continued v1 collection — deliberately not fitted to EWC outcomes, since designing rules after seeing which bets won is overfitting. Each candidate signal must be operationalised into something computable before the match, with a defined sample, primary metric, and minimum size (Phase 3 discipline). Its benchmark is the de-vigged market Brier on a paired sample, never the 0.25 coin-flip line.

**When and how it becomes v2 — via a shadow run.** When the definition is closed on paper and the open questions in `PRE-V2.md` are resolved, v2 does **not** immediately replace v1. The recommended default path (confirmed at the v1 150 checkpoint, not pre-decided) is to run v2 as a **shadow / paper model in parallel with v1 on the same matches**:

- `v1` stays the **official** method. It keeps its normal BET/PASS decisions, may drive real-money play, and continues collecting toward its own per-agent 150 checkpoint — so its pre-registered verdict is actually reached, not abandoned at ~100.
- `v2` runs as a **shadow** re-valuation of the *same* matches: its own probability and BET/PASS under its own rules, but purely research — never real money.
- Both versions receive **one shared factual snapshot** (matches, format, rosters, form, and the same STS odds at the same `odds_timestamp`) and then value it independently. The research is done once; only the valuation is duplicated.

Why shadow rather than a clean switch. A straight cutover would leave v1 stranded below 150 and would compare v1 and v2 across *different* periods, teams, and meta phases — confounding the method difference with the calendar. Shadow removes that: v1 and v2 score identical matches against an identical market, so the only variable is the method. That upgrades the question from "does v2 beat the market?" to also "does v2 beat v1 on the same paired sample?" — a genuine A/B, and the stronger evidence. And because v2's rules were frozen on paper first, its shadow entries are genuinely out-of-sample from day one.

Sample counting is unchanged by sharing matches. v2 still needs its **own** 150 settled predictions and 50 BET snapshots, per agent × version — it does **not** inherit v1's sample just because the matches overlap. v1 entries are never deleted; they remain the archive of what the method looked like before, excluded from v2 metrics.

Data and reporting shape (spec for the maintainer's coding agent, not implemented by the analyst agents):

- Every shadow entry carries `method_version: "v2"` **and** a mode flag (e.g. `mode: "shadow"`) so the dashboard never counts a shadow BET as real play or folds it into operator P&L or the shared CLV pool.
- Paired entries must be linkable: same `match` + `date` + identical `odds_timestamp` and odds snapshot across the v1 and v2 rows, so "v2 vs v1 on the paired sample" is computable later.
- Reporting stays lean, not doubled: v1 remains the full official report (`reports/2026-xx-xx-{agent}.md`); v2 is a deliberately thin shadow file (`reports/shadow/2026-xx-xx-{agent}-v2.md`) — valuation table, decisions, and JSON block only, reusing the v1 report's prose, calendar, and roster work rather than repeating it.

Only the version bump itself (approved method into `PLAYBOOK.md`, recorded in `PROJECT_MEMORY.md` and as a decision note in `docs/decisions/`) marks the moment the first `method_version: "v2"` entry is logged. Whether v2 later graduates from shadow to the official method is a separate decision, taken once v1 reaches its 150 verdict and v2 has enough paired shadow data to judge. A v2 bump is a real methodology change, so it should also trigger the dashboard-versioning work noted in Phase 4.

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

- `docs/PRE-V2.md` — working notebook seeding the future v2 method (non-active; see Phase 3 → Method versioning path). Graduates into `PLAYBOOK.md` as v2 when its definition is closed.

The structure should grow only when a real need appears.
