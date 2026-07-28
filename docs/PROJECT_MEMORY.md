# Edge Project Memory

## Repository Status

Current version: v0.1
Last updated: 2026-07-17

Recent changes:
- Added EDGE-003 and EDGE-004
- Added source field to bets.json
- Reports are the source of historical analysis
- Settled EDGE-005 (lost) and EDGE-006 (won)

This document contains the current shared context, decisions, operating rules, open questions, and known data for the Edge project.

A new assistant instance should read this file before producing reports or modifying the methodology.

## Project Goal

Edge is a data-driven esports betting research project.

The objective is to determine whether a repeatable decision process can identify mispriced odds over a meaningful sample.

The project is not judged by a few winning or losing coupons. It is judged by recorded decisions, market prices, closing prices where available, and long-term performance.

## Current User Context

- Bookmaker: STS
- Currency: PLN
- Initial unit: 1u = 2 PLN
- Primary esport: Counter-Strike 2
- Secondary scope: major League of Legends and Dota 2 competitions
- Daily report target time: 09:00 Europe/Warsaw
- Maximum recommended bets per daily report: 1–3
- It is acceptable to recommend no bets
- Reports should be concise and decision-oriented

## Daily Report Format

Preferred table columns:

| Time | Match | Pick | STS odds | Fair odds | Value | Risk | Decision | Confidence | Stake |
|---|---|---|---:|---:|---|---|---|---:|---:|

Requirements:

- Review the full relevant daily offer, not only the most obvious matches.
- Write full matchup names.
- Clearly distinguish prediction from betting decision.
- Use BET or PASS explicitly.
- Never force a Bet of the Day.
- End with either Bet of the Day or No Bet of the Day.
- Include a short reason for each important decision.
- Do not present uncertain live information as confirmed.
- Daily report procedure: search the web for today's schedule, rosters and news before writing; ask the user for STS odds; never invent odds.

## Established Rules

### Betting rules

- No fillers.
- Every leg must be good enough to stand as a single bet.
- PASS is a valid decision.
- Do not chase losses.
- Keep stakes fixed during the initial validation phase.
- Do not increase stake because a previous coupon lost.
- Low odds do not automatically mean low risk.
- Do not combine selections merely to create a more attractive accumulator price.

### Analytical rules

- A correct winner prediction is not automatically a good bet.
- A losing bet is not automatically a bad pre-match decision.
- Judge decisions using information and prices available before the match.
- Separate prediction accuracy from betting value.
- Record exact odds for BET and PASS markets.
- Do not create a new rule from one match.
- Treat post-match explanations as hypotheses until supported by data.
- Check whether information such as stand-ins, roster changes, or map advantages is already reflected in the market price.

## Known Real-Money Results

### EDGE-001 — 2026-07-13

Stake: 2 PLN  
Combined odds: 2.60  
Potential return: 4.58 PLN  
Result: Lost  
Net result: -2 PLN

Selections:

- GenOne ML @1.18 — won
- The Last Resort ML @1.95 — lost 1:2
- Just Players ML @1.13 — lost 0:2

Main lesson:

- No fillers.
- Very short-priced selections increased coupon failure risk without providing meaningful value.

### EDGE-002 — 2026-07-15

Stake: 2 PLN  
Combined odds: 3.22  
Potential STS return: 5.66 PLN  
Result: Lost  
Net result: -2 PLN

Selections:

- HEROIC vs 3DMAX Over 2.5 maps @1.95 — won
- Wildcard ML vs Gentle Mates @1.65 — lost 0:2

Main lesson:

- The map-total read was good.
- The effect of Gentle Mates using a stand-in may have been overstated.

### EDGE-003 / EDGE-004 clarification — 2026-07-16

EDGE-003 was a 3-leg accumulator that lost because one leg failed while the other two were still pending or won. To keep exposure on the two surviving selections, EDGE-004 was placed on those same two events as a new 2-leg accumulator, which won. This was a deliberate re-entry, not chasing losses. `data/bets.json` is the source of truth for all coupon figures (odds, stakes, returns); wherever this document previously stated different numbers for EDGE-003/004, the bets.json values are correct.

## Other Reviewed Matches

### NiP vs K27 — 2026-07-15

Final score: NiP 2:0  
Maps:
- Ancient 13:8
- Nuke 13:8

Decisions:
- NiP ML — PASS
- Over 2.5 maps @2.00 — PASS

The over PASS was correct.

The moneyline decision cannot be fully reviewed unless the exact offered price is preserved.

### EDGE-005 — 2026-07-17

Stake: 2 PLN
Odds: 2.00
Potential return: 3.52 PLN
Result: Lost
Net result: -2 PLN

Selections:

- Phantom vs K27 ML @2.00 — lost

### EDGE-006 — 2026-07-17

Stake: 2 PLN
Odds: 2.00
Potential return: 3.52 PLN
Result: Won
Net result: +1.52 PLN

Selections:

- Heroic vs NiP ML @2.00 — won

### paiN vs Phantom — 2026-07-15

Final score: paiN 1:2 Phantom

Decision:
- paiN ML @1.36 — PASS

This PASS was justified because the short price did not compensate for the risk.

## Calibration & Method Decisions

### Preliminary threshold reached (gpt), continue collecting — 2026-07-26

gpt passed the preliminary-signal threshold (50 settled predictions with a probability estimate). **[Corrected 2026-07-27: the figure originally recorded here (72) was inflated by 25 non-CS2 entries (LoL/Dota) later removed — see the scope-cleanup entry below. gpt's true CS2 settled count is ~52; it has only just crossed 50, not reached the midpoint to 150.]** claude is at 30, still in Collection.

**Decision: keep collecting to the validation checkpoint (150) per the existing staging. Do NOT enable per-agent calibration or surface a per-agent verdict at 50.** Crossing 50 only means "preliminary signal," not "evaluate." The real verdict (Brier vs market baseline) is computed at 150 on each version's own sample, as pre-registered.

This resolves "Change C" from spec-v4 (source-per-agent + UI): C was reframed from a progress-counter task into this methodological choice, and the choice is "wait." Changes A, B, D of that spec were implemented; C is intentionally deferred. Spec files (v3, v4) and the dated daily-plan note can be removed — this entry is the durable record.

No method change: everything stays `method_version: v1`. At current report cadence gpt is expected to reach 150 in roughly 3–4 weeks, claude somewhat later.

### Scope discipline reaffirmed — out-of-scope matches get no ledger entry — 2026-07-27

On 2026-07-27 (a break in the BLAST calendar, no tier-1 matches), the gpt report valued two tier-3 matches (ex-RUSTEC vs ex-RUBY; ODDIK vs paiN Academy) with full `estimated_probability`, fair odds, and prepared JSON entries (P-2026-07-27-G1/G2), ending both in PASS. These are out of scope (tier-3, academy team). The claude report for the same day correctly returned NO QUALIFYING MATCHES with an empty block.

**Root cause:** the playbook's Logging rule said "every market that receives a full analysis is logged" but never defined *which matches merit analysis at all*. gpt followed the letter (valued → logged) but valued out-of-scope matches. Gap closed: a **Scope** subsection was added to PLAYBOOK before Logging, stating Edge analyses only tier-1/S-Tier (primarily BLAST); tier-2/3, qualifiers (StarLadder/CCT/Thunderpick/NODWIN/etc.), academy/B-teams, and non-BLAST non-S-Tier get no analysis, no fair odds, no JSON entry. Out-of-scope ≠ PASS.

**Action:** do NOT merge P-2026-07-27-G1/G2 into `data/bets.json` — they would contaminate gpt's calibration sample with a different tier/data-quality regime. This is also a concrete argument for per-agent calibration: agents can differ in scope interpretation, and pooling would spread one agent's out-of-scope noise into the shared verdict.

### Edge is CS2-only — non-CS2 entries removed, scope narrowed — 2026-07-27

A review of gpt's history (prompted by the 27 Jul scope issue) found gpt had been logging non-CS2 matches since 13 Jul: **25 entries — 15 LoL, 9 Dota 2, 1 with no game** — all under `agent: gpt`. claude's data was clean (CS2 only). The playbook's required-fields line had listed `game (cs2 | lol | dota2)`, so these were technically permitted by the letter — but the project's edge is CS2-specific knowledge, and the analyst does not follow LoL/Dota at that level, so those entries were pure market-copying noise, not signal.

**Decisions:**
1. Edge is now **CS2-only**. The `game` field is restricted to `cs2`; LoL/Dota/other are out of scope. PLAYBOOK Scope section and required-fields updated accordingly.
2. The 25 non-CS2 entries are **deleted permanently** from `data/bets.json` (not archived — immutability covers method versions of in-scope data, not out-of-scope games that never belonged). Exact IDs were listed in `docs/cs2-cleanup-2026-07-27.md` (removed from `docs/` after execution, per the usual one-off-spec cleanup).

**Effect on the sample:** gpt drops from 84 to 59 CS2 predictions, and from ~74 to ~52 settled-with-estimate. gpt has therefore *only just* crossed the preliminary threshold (50), not approached the midpoint to 150 — the earlier "72" was inflated. claude unaffected (31 CS2, 31 settled). Per-agent, per-version staging unchanged; both agents still collect to 150 on their CS2 samples. Note: one deleted entry was a Dota 2 BET (P-2026-07-14-01, LGD vs MOUZ, "won") — removing it also removes a non-CS2 result from gpt's P&L.

### Pre-protocol / non-tier-1 predictions archived (Variant B) — 2026-07-28

A 28 Jul audit found `predictions` still wasn't a clean tier-1 sample even after the CS2-only cleanup: 16 entries from 13–20 Jul predate both the BLAST Bounty start and claude joining (21 Jul is the agents' common start date), and dozens more from 21–26 Jul were matches analysed alongside BLAST but belonging to parallel lower-tier events (mainly the StarLadder StarSeries EU Closed Qualifier, plus one EPL S8 final and a handful of other tier-2/3 matches) — same scope violation as the 27 Jul gpt incident, just not yet caught for these dates.

**Decision (Variant B, by user): the calibration sample keeps only tier-1 CS2 dated ≥21 Jul.** Everything else is not deleted but **moved to a new top-level array `archived_predictions`** (immutability: exclude from measurement, don't destroy data). Existing code only ever iterates `predictions`, so the archive is invisible to every counter/calibration function without touching their logic — a boolean `archived` flag was explicitly rejected because it would need an `if not archived` added at every call site, and missing just one would leak a bad entry back into the sample.

**The first drafted list (44 IDs, formerly `docs/edge-archive-preprotocol-spec.md`) was built by team-name pattern matching and was wrong in both directions.** A line-by-line audit against the actual report text (each claude report tags every match's tournament explicitly, e.g. "HOTU vs GamerLegion (17:00, BLAST)") found: 5 IDs on the list were genuine BLAST tier-1 matches misclassified as parallel/tier-2 (P-2026-07-21-C2/C3, P-2026-07-22-C4/C7/G4) — a "tier-1 team vs obscure-sounding opponent" pattern that turned out to just be BLAST's own bracket, not a tell for a parallel event; and 8 genuine tier-2 StarLadder-qualifier entries were missing from the list entirely. Two 21 Jul entries (gpt: magic vs Walczaki, HOTU vs HEROIC) stayed genuinely ambiguous — no report tags them and the surrounding evidence conflicted — user decided to archive both. The corrected, user-approved 47-ID list (formerly `docs/edge-archive-preprotocol-spec-v2.md`) was executed and both spec files removed from `docs/` afterward — the full ID list and reasoning above are the durable record.

**Result:** `predictions` 90 → **43** (all `game: cs2`, all dated ≥21 Jul, all with market odds), `archived_predictions` **47** (gpt 39, claude 8). `coupons` untouched (22) — coupons are the real-money layer and were never in scope for this cleanup regardless of which prediction they correspond to; `summary`/P&L unaffected. **Both agents drop back below the preliminary threshold** (gpt 52→**20**, claude 23) — the "gpt crossed 50" reached on 26–27 Jul was itself an artifact of tier-2/3 noise in the sample, not real progress toward the 150 checkpoint. Collection continues from here on the clean tier-1 sample; no counter should cite pre-28 Jul settled figures again.

**`observed_passes` cleared too (2→0), same date.** Its only two entries (NiP vs K27, paiN vs Phantom, both 15 Jul) were the exact same pre-protocol matches as `P-2026-07-15-01`/`P-2026-07-15-04` above. The mechanism is undocumented in PLAYBOOK and was never used past 15 Jul, so rather than build a parallel `archived_observed_passes` array for two rows, they were simply removed — the underlying matches aren't lost, they're fully preserved with more context in `archived_predictions`.

## Current Running Result

- Coupons: 6
- Won: 2
- Lost: 4
- Voided: 0
- Total staked: 12 PLN
- Gross return: 8.41 PLN
- Net result: -3.59 PLN
- ROI: -29.9%

This sample is not statistically meaningful.

## Metrics to Track

Required:

- Total stake
- Gross return
- Net result
- ROI
- Number of bets
- Hit rate
- Average odds
- Performance by market
- Performance by odds range
- Performance by competition
- Performance by esport
- Performance by decision confidence

Desired when available:

- Closing Line Value
- Opening odds
- Closing odds
- Fair probability
- Market-implied probability
- Estimated edge
- Prediction accuracy
- BET decision accuracy
- PASS decision review

## Research Questions

- Does Edge overestimate the impact of stand-ins?
- Are balanced BO3 matches better suited to map-total markets than moneylines?
- Are short favourites systematically overpriced?
- What minimum estimated edge should trigger a BET?
- Should all recommended selections be tracked as hypothetical singles, even when the user plays an accumulator?
- How should PASS decisions be evaluated without hindsight bias?
- Which markets produce the best ROI: moneyline, totals, or map handicaps?
- How should confidence be calibrated?

## Repository Structure

```text
Edge/
├── README.md
├── data/
│   └── bets.json
├── docs/
│   ├── PROJECT_MEMORY.md
│   └── PLAYBOOK.md
└── reports/
    ├── 2026-07-13.md
    ├── 2026-07-15.md
    └── 2026-07-16.md
```

## Instructions for Future Assistant Instances

Before creating a report:

1. Read `README.md`.
2. Read `docs/PROJECT_MEMORY.md`.
3. Read `docs/PLAYBOOK.md`.
4. Read the most recent reports.
5. Read `data/bets.json`.
6. Verify the current schedule, rosters, format, and bookmaker odds using current sources.
7. Do not rely on conversation memory when repository data is available.
8. Update the repository files after results are known.
9. Never invent missing odds, results, or historical decisions.
10. Clearly mark assumptions and incomplete information.
11. Before producing any report, follow the Calibration & CLV Protocol section in `docs/PLAYBOOK.md` — every analyzed market is appended to the `predictions` array in `data/bets.json`, including PASS decisions
and `market_odds_opponent`.
 