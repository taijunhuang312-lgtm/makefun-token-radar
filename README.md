# Token Radar

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/taijunhuang312-lgtm/makefun-token-radar/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/taijunhuang312-lgtm/makefun-token-radar/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

A token launch radar: 200 pre-token protocols, ranked by implied value, with a
farm plan for each one. Built for make.fun's "Build the best token launch
radar" bounty.

## What it does

The snapshot holds 758 protocols from DefiLlama's public index (fetched
2026-11-14). The board ranks 200 of them — every protocol on the 40-protocol
watchlist, plus the 160 strongest pre-token protocols below the watchlist
floor — by an implied value the model derives from the snapshot's own
figures: TVL, seven-day growth, and how long the protocol has run with no
token recorded. Each row carries seven concrete farm steps, each with what it
costs and how long it takes. Protocols whose token already trades are set
aside with their market caps shown, never ranked.

The dashboard is a plain page with no network: a sortable, filterable board,
a detail view for every protocol (model breakdown plus farm plan), and a
method panel that states the formula and the calibration table in full.

## The model (radar-2)

```
multiple   = the category's median market-cap-to-TVL ratio among the
             snapshot's live-token protocols (at least 3 comparables, or
             exactly 2 that agree within one order of magnitude), else the
             global median 0.2138 across 128 comparables; clamped to [0.01, 1.5]
implied    = max(1, round(tvl_usd x multiple
             x (1 + clamp(change_7d, -60, 120) / 100 x 0.5)
             x (0.6 + min(age_days, 1095) / 1095 x 0.4)))
```

No protocol name is special-cased; the same function scores every row. The
full calibration table, the null handling, and the caveats are in METHOD.md.

Implied value is an estimate, never a price. It says what a token would be
worth if the protocol's record stayed as it is; it does not predict whether
or when a token launches, and no row claims a protocol "has no token" — the
wording is "records no token", because a protocol may have a token its
DefiLlama record does not carry.

## Run it

Node.js 22.18 or later, no dependencies to install:

```sh
mkdir -p out
MAKEFUN_OUTPUT_DIR=out node main.ts --input /path/to/snapshot.json
```

That writes `board.json`, `data.js`, `dashboard/`, `screenshots/` and
`dossier.json` into `out/`. Run it twice and the output is byte-identical.

## Layout

- `main.ts` — reads the snapshot, builds the board, writes the output.
- `lib/model.ts` — the radar-2 model, the board builder, the farm plans.
- `dashboard/` — `index.html`, `app.css`, `app.js`: the page, offline.
- `screenshots/` — the board, a detail view, and a filtered view, 1440×900.
- `vendor/makefun-board.ts` — the dossier library from the competition kit.
- `METHOD.md` — the method note: formula, calibration, caveats.

## License

MIT. See LICENSE.
