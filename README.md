> **Archiwum (v1–v3, lipiec–październik 2026). Aktywny projekt i księga kuponów: [dgrochowicki/Edge_2.0](https://github.com/dgrochowicki/Edge_2.0).**

Current version: v0.1
Last updated: 2026-07-16

# Edge

Edge is a data-driven esports betting research project.

The goal is not to predict every match correctly or to place bets every day. The goal is to test whether a repeatable, disciplined process can identify genuinely mispriced odds over a meaningful sample.

## Core principles

- **Value over winners** — a correct prediction is not automatically a good bet.
- **No forced bets** — passing is a valid and often preferable decision.
- **No fillers** — every selection must be strong enough to stand as a single bet.
- **Small, fixed stakes** — the initial unit size is `1u = 2 PLN`.
- **No chasing losses** — stake size is not increased after a losing day.
- **Evidence over intuition** — every bet, pass, result, and review should be recorded.
- **Process over short-term outcomes** — decisions are judged by the information available before the match, not only by the final score.

## Current scope

Edge is CS2-only: tier-1 (S-Tier / Valve Tier 1) Counter-Strike 2 matches, primarily BLAST events. Other esports and lower-tier CS2 events (qualifiers, tier-2/3 circuits, academy/B-teams) are out of scope and receive no analysis or ledger entry — see `docs/PLAYBOOK.md`'s Scope section for the full rule.

## Daily workflow

1. Review the full relevant betting offer.
2. Estimate fair probabilities and fair odds.
3. Compare them with available bookmaker odds.
4. Select no more than 1–3 bets.
5. Record every real-money bet before the match.
6. Record results and conduct a post-match review.
7. Track performance by market, odds range, competition, and decision type.

## Key metrics

The project will track:

- Total stake
- Net profit or loss
- ROI
- Hit rate
- Average odds
- Performance by market
- Closing Line Value, where available
- Prediction accuracy
- Quality of BET and PASS decisions

## Repository structure

```text
Edge/
├── README.md
├── index.html
├── data/
│   ├── bets.json             -- the ledger (single maintainer)
│   └── form/                 -- v2 fresh-form windows, one file per match day
├── dashboard/
│   ├── research.html
│   ├── reports.html
│   ├── logs.html
│   ├── data.js
│   ├── shared-metrics.js
│   ├── sidebar.js
│   ├── dashboard.js
│   ├── research.js
│   ├── reports.js
│   ├── logs.js
│   ├── styles.css
│   └── favicon.svg
├── docs/
│   ├── METHOD_V2.md          -- active method (v2.0 valuation + evaluation protocol E2)
│   ├── METODA.md             -- de-vig / value explainer (Polish)
│   ├── PLAYBOOK.md
│   ├── PROJECT_MEMORY.md
│   ├── REPORT_TEMPLATE.md
│   ├── ROADMAP.md
│   ├── archive/METHOD_V1.md  -- frozen v1 rules
│   ├── audit/                -- audit notes and QA notes
│   └── decisions/            -- dated decision records
├── scripts/
│   ├── validate_bets.py      -- ledger schema validator
│   ├── v2_metrics.py         -- reference v2 metrics (beta, Brier, coverage)
│   └── backfill_p_v2.py      -- one-off p_v2 backfill (E2)
└── reports/
```

The structure will grow only when a real need appears.

## Current status

v1 is closed (archived after its 150-prediction checkpoint, 2026-09-19/20). v2 is the active method: gpt produces one canonical prediction per match, claude audits once per tournament. Since 2026-10-11 v2 is judged by how far the market moves toward its adjustment before each match (closing-line slope β, checkpoints at 100 and 200 valid observations), not by Brier at 150. Details: `docs/METHOD_V2.md`, `docs/ROADMAP.md`.

After the first v2 tournament (ESL Pro League S24) the sample is far too small to draw conclusions. Early results are treated as data points, not proof that the method works or fails.

## Disclaimer

Edge is an experimental analytics project, not financial advice and not a promise of profit. Betting involves risk. Only money that can be lost without affecting everyday life should ever be used.
