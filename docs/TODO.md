# What's left to do

Ordered roughly by what blocks real use of the site.

## Blocking real use

- [ ] **Set real prices.** All 89 scraped variants have `priceAgorot: 0`. Two ways in, per the original plan:
  1. Export product/price data from the real Merchello admin and bulk-import it (via a script matched on `Product.sourceProductKey` / `ProductVariant.sourceOptionValue` — **`scripts/import-prices.ts` was planned but never built**; it still needs to be written).
  2. Type them in by hand via `/admin/products/[id]` — slower, but works today with no new code.
- [ ] **Create the first admin user** — run `npm run create-admin` and follow the prompts. No `AdminUser` rows exist yet.
- [ ] **Re-scrape (or hand-add) the empty categories** — `אלכוהול/וודקה`, `וויסקי`, `ליקרים` came back with 0 products because the live site was serving a different page template at scrape time. Re-run `npm run scrape` later, or add these products manually via the admin panel.
- [ ] **Resolve the duplicate-category aliasing** if the specific category structure matters to you — some branches (e.g. the "night deliveries" hub) show 0 direct products because their products are pinned to a sibling alias category instead. The data is all there; it's a question of which branch should "own" the shared products. See `docs/STATUS.md` for detail.

## Needed for real payments

- [ ] Get a Tranzila sandbox/test terminal and set `TRANZILA_TERMINAL` in `.env` (currently empty → app always uses the mock provider).
- [ ] Confirm the iframe query parameters and callback field names (`Response`, transaction id field, etc.) in `src/lib/payment/tranzilaProvider.ts` against Tranzila's **current** docs — they were implemented from general knowledge of the Tranzila hosted-iframe pattern, not verified against a live terminal.
- [ ] Test a real approve/decline round-trip through `src/app/api/payment/tranzila/callback/route.ts`.

## Business logic gaps

- [ ] **Delivery fee**: `DELIVERY_FEE_AGOROT` is hardcoded to `0` in `src/lib/money.ts`. The real site likely has real delivery pricing/zones — decide the rule and wire it in.
- [ ] **Business hours**: the real site posts operating hours (~09:30–24:00); nothing in this rebuild enforces or displays them. Either add a `Settings` row/env var and a check in checkout, or skip it if not needed locally.
- [ ] **Cart merge on login**: if a customer already has an older cart from a previous session/device, logging in on a new guest cart just re-points the *current* cart to them (last-guest-cart-wins) rather than merging line items. Only matters if the same person checks out from multiple devices before logging in.

## Polish

- [ ] Wire a mobile nav / hamburger menu if the header ever needs it at small widths (not yet tested at very narrow viewports).
- [ ] Swap `<img>` for `next/image` across storefront/admin product images (currently plain `<img>` with `eslint-disable` comments — see `docs/UPGRADES.md`).
- [ ] Admin products list has no pagination — fine at 430 rows, worth revisiting if the catalog grows much further.

## Explicitly out of scope (per the approved plan)

- Public deployment — this is local-only by design.
- A full RBAC system for admin — single `AdminUser` model, no roles, is intentional.
