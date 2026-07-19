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

Edge currently focuses on:

- Counter-Strike 2
- League of Legends
- Dota 2

CS2 is the primary market during the initial testing phase.

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
│   └── bets.json
├── dashboard/
│   ├── reports.html
│   ├── logs.html
│   ├── dashboard.js
│   ├── reports.js
│   ├── logs.js
│   ├── styles.css
│   └── icons/
├── docs/
│   ├── PLAYBOOK.md
│   ├── PROJECT_MEMORY.md
│   └── ROADMAP.md
└── reports/
```

The structure will grow only when a real need appears.

## Current status

Edge is in its initial validation phase.

The sample is far too small to draw conclusions. Early results are treated as data points, not proof that the method works or fails.

## Disclaimer

Edge is an experimental analytics project, not financial advice and not a promise of profit. Betting involves risk. Only money that can be lost without affecting everyday life should ever be used.
