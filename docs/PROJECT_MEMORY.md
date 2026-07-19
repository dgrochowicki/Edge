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
11. Before producing any report, follow the Calibration & CLV Protocol section in `docs/PLAYBOOK.md` — every analyzed market is appended to the `predictions` array in `data/bets.json`, including PASS decisions and `market_odds_opponent`.
