# Token Launch Radar

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/taijunhuang312-lgtm/makefun-token-radar/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/taijunhuang312-lgtm/makefun-token-radar/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

A token launch radar for make.fun's "Build the best token launch radar" bounty ($1,325 in USDC).

It ranks protocols that record no token yet by an implied value — what a token
would be worth if the protocol's record stayed as it is — from the sealed
DefiLlama snapshot, and gives every protocol concrete steps to farm it.

## How it works

- `main.ts` (Node 22, standard library only) reads `/input/snapshot.json`,
  scores every pre-token protocol, writes the ranked board to
  `/output/board.json`, writes the dashboard's data (`data.js`), copies
  `dashboard/` and `screenshots/` to `/output`, and writes
  `/output/dossier.json`.
- `dashboard/` is a static page (no framework, no network): a ranked board,
  a detail view per protocol, and a filter. Each row carries farm steps.

## Run it locally

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input <path to snapshot.json>
```

## Status

Phase 0: pipeline proof — the kit's starter running end to end.
Phase 1: category-calibrated implied-value model (radar-2) — the multiple for each
category is the median market-cap-to-TVL ratio of that category's live-token protocols
in the same snapshot (at least 3 comparables, or two that agree within an order of
magnitude; otherwise the global median 0.2138), clamped to [0.01, 1.5]; see METHOD.md
for the full formula and calibration table. Board, detail view and farm plans (7 steps)
updated to match; screenshots retaken. The dashboard and farm plans will be rebuilt
in later phases.
