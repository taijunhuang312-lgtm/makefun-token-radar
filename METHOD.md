# Method — Token Radar model radar-2

How the board's implied values are computed, from the snapshot's own figures, and what the
numbers do not claim. This is the working document for the model; the dashboard's method panel
states the same formula in shorter form.

## Snapshot

- Source: DefiLlama `https://api.llama.fi/protocols`, fetched 2026-11-14T01:18:33.201Z.
- `as_of` 2026-11-14. 758 protocols at or above $5,000,000 TVL. Watchlist floor $50,000,000.
- Watchlist: 40 protocols. Board: 200 rows — all 40 watchlist slugs plus the 160
  rankable pre-token protocols below the floor, by TVL.
- A protocol is **rankable** when it records no token (`mcap_usd`, `gecko_id` and `symbol`
  all null), its category is not CEX, and its name carries no version marker. Live-token
  protocols are set aside with their market caps shown; they are never ranked on the board.

## Formula

For each ranked protocol:

```
multiple   = the category multiple (see Calibration), clamped to [0.01, 1.5]
growth     = clamp(change_7d, -60, 120)            (change_7d null counts as 0)
growthMult = 1 + (growth / 100) x 0.5
maturity   = 0.6 + min(age_days, 1095) / 1095 x 0.4 (age_days unknown counts as 365)
implied    = max(1, round(tvl_usd x multiple x growthMult x maturity))
```

`age_days` is whole days from `listed_at` to `as_of`, clamped at zero. Rows are ranked by
implied value descending, ties broken by slug ascending. No protocol name is special-cased
anywhere: the same function scores every row.

## Calibration — the category multiple

The multiple is the **median** `mcap_usd / tvl_usd` among the snapshot's live-token
protocols, computed from the same snapshot at run time (function `calibrate` in
`lib/model.ts`). A comparable is a live-token protocol with a positive market cap on a
positive TVL.

- **Global median: 0.2138 across 128 comparables.** 16 of the snapshot's 144 live-token
  protocols record a market cap of $0 or less (a dead record, not a comparable) and are
  excluded; no protocol has a non-positive TVL.
- **Category median** is used when the category has at least 3 comparables, or exactly 2
  that agree within one order of magnitude (their ratio at most 10x). Two observations
  that agree corroborate each other; two that disagree by an order of magnitude say at
  least one is a data artefact — a stale TVL, or a token whose value comes from elsewhere —
  so neither is trusted and the global median is used instead.
- The multiple is clamped to [0.01, 1.5]. The floor binds on one category (Staking Pool,
  median 0.0018 → 0.01); the cap binds on one (Derivatives, median 2.1619 → 1.5).

Why the median, not the mean: the mean ratio across the 128 comparables is 4.48, driven
by a handful of records whose TVL is a small slice of the protocol's footprint (one
prediction-market token at 400x, an exchange token at 69x, a basis-trading token at 36x).
The median is robust to those; the mean would be absurd.

Why no size taper: the size effect was tested. The correlation between log(TVL) and
log(ratio) across the 128 comparables is −0.41 overall, but it is inconsistent within
categories (Lending +0.25, Dexs +0.29, RWA −0.84, Liquid Staking −0.63), so a blanket
taper would be a fudge, not a finding. The category median already carries the size mix
of that category's comparables. No chain-count or other factor is used: one protocol
lists 176 chains, a data quirk, not a signal.

### Calibration table (this snapshot)

| Category | Median | n | Min | Max | Used? |
|---|---:|---:|---:|---:|---|
| AI Agents | 0.6047 | 2 | 0.3213 | 0.8881 | yes — two agree |
| Basis Trading | 0.6544 | 7 | 0.0441 | 36.1701 | yes |
| Bridge | 0.5567 | 6 | 0.0080 | 1.6033 | yes |
| CDP | 0.1687 | 3 | 0.0080 | 0.2460 | yes |
| CEX | 0.0748 | 9 | 0.0065 | 69.4220 | computed, no board row is a CEX |
| Canonical Bridge | 0.7464 | 8 | 0.0003 | 14.5468 | yes |
| Chain | 3.0264 | 1 | 3.0264 | 3.0264 | no — global |
| Collateral Management | 12.1602 | 1 | 12.1602 | 12.1602 | no — global |
| Cross Chain Bridge | 1.2205 | 4 | 0.1954 | 3.6201 | yes |
| DOR | 0.0898 | 1 | 0.0898 | 0.0898 | no — global |
| Decentralized AI | 2.0604 | 1 | 2.0604 | 2.0604 | no — global |
| Derivatives | 2.1619 | 2 | 1.3764 | 2.9473 | yes — two agree, capped to 1.5 |
| Dexs | 0.3424 | 11 | 0.0218 | 3.1823 | yes |
| Dual-Token Stablecoin | 0.0316 | 1 | 0.0316 | 0.0316 | no — global |
| Indexes | 0.1477 | 3 | 0.0514 | 2.0646 | yes |
| Launchpad | 0.1306 | 1 | 0.1306 | 0.1306 | no — global |
| Lending | 0.1324 | 15 | 0.0083 | 18.9563 | yes |
| Leveraged Farming | 0.1725 | 1 | 0.1725 | 0.1725 | no — global |
| Liquid Restaking | 0.1828 | 2 | 0.0205 | 0.3451 | no — two disagree 16.9x, global |
| Liquid Staking | 0.0406 | 9 | 0.0040 | 1.6549 | yes |
| Liquidity Manager | 0.0150 | 1 | 0.0150 | 0.0150 | no — global |
| NFT Marketplace | 2.0017 | 1 | 2.0017 | 2.0017 | no — global |
| Onchain Capital Allocator | 0.0125 | 2 | 0.0059 | 0.0191 | yes — two agree |
| Options | 1.5145 | 1 | 1.5145 | 1.5145 | no — global |
| Payments | 0.1813 | 2 | 0.1399 | 0.2227 | yes — two agree |
| Prediction Market | 400.2045 | 1 | 400.2045 | 400.2045 | no — global |
| Privacy | 0.9691 | 3 | 0.0340 | 1.6348 | yes |
| RWA | 0.2748 | 9 | 0.0359 | 1.0065 | yes |
| Restaking | 0.0246 | 2 | 0.0175 | 0.0318 | yes — two agree |
| Risk Curators | 2.9747 | 1 | 2.9747 | 2.9747 | no — global |
| Staking Pool | 0.0018 | 2 | 0.0006 | 0.0029 | yes — two agree, floored to 0.01 |
| Token Locker | 9.5204 | 2 | 0.0652 | 18.9756 | no — two disagree 291x, global |
| Yield | 0.1914 | 9 | 0.0013 | 1.0566 | yes |
| Yield Aggregator | 0.1510 | 4 | 0.0314 | 0.4793 | yes |

142 of the 200 board rows use their category's median; 58 use the global median. Categories
with no live-token comparable at all (CeDeFi, Farm, Anchor BTC, Decentralized BTC and others)
use the global median as well.

## Farm plans

Each row carries 7 steps, derived from the protocol's own record — its category (the action),
its first chain (where the funds go), its TVL tier (the capital: $250 at $5B+, $150 at $1B+,
$100 at $100M+, $50 below) and its age (the hold: 60 days under 180 days old, 45 under a
year, 30 above; 30 when the age is unknown). Every step states what to do, what it costs and
how long it takes, and ends `Cost: … Time: …`. The dashboard regenerates the same plan from
the same row, so the page and `board.json` agree.

## What the numbers do not claim

- **Implied value is an estimate, never a price.** It is what a token would be worth if
  the protocol's record stayed as it is. It does not predict whether or when a token
  launches, and no row claims a protocol "has no token" — the language is "records no
  token", because a protocol may have a token its DefiLlama record does not carry.
- **Thin categories are the weak point.** 29 board rows are Risk Curators, whose only live
  comparable is an oracle token (ratio 2.97) — the global median is used instead, which is
  honest but says nothing about curators specifically. Onchain Capital Allocator rows rest
  on two comparables; their implied values are small and should be read as such.
- **The snapshot is one day.** `as_of` 2026-11-14. TVL and growth are that day's figures;
  a protocol's record may have moved since.
- **The biggest rows rest on the global median.** The top two rows (Steakhouse Financial
  $464.9M, Gauntlet $276.9M) are Risk Curators scored at the global median 0.2138. That is
  the stated fallback, not a category finding, and the board's detail view says so on
  every row.
