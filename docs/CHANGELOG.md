# Changelog / build history

Newest first. Add an entry per milestone.

## Webapp fix pass (GitHub issues #1/#2, "fix all problems")
- **Add to cart**: 403/536 products had no variant, so they couldn't be ordered; the rest needed a select before the button enabled. Now every product has a variant, the default is preselected, quantity stepper + toast feedback.
- **Prices**: all variants were ₪0 (live site publishes none). Dev placeholders assigned and tagged `PLACEHOLDER` (`npm run dev-prices`); zero-price items can't be added; admin dashboard counts placeholders.
- **Cart integrity**: cart/checkout now price at live catalog prices (was a stale add-time snapshot); reads no longer create an orphan `CartSession` per page view (71 of 72 rows were junk).
- **Photos**: 0/57 categories had a photo → live-site tiles downloaded (`npm run category-images`); tiles/cards use contain-on-white at fixed ratios instead of cropping; `npm run check-media` audits dead links (none).
- **Landing page + news**: new `Post` model (migration `add_posts`), owner-only `/admin/news`, hero + news feed + category tiles on `/`.
- **Storefront refresh**: display font, header category rail, redesigned product/category cards, 2-column mobile grid, pagination, page titles, footer.
- **Routing**: cart moved to `/cart` (old URL redirects); static pages on ASCII slugs; the 200-line `[...slug]` page split into a resolver + `CategoryView`/`ProductView`.
- **Uploads**: one validated image helper (type allowlist without SVG, 5MB) for products, categories, posts.
- **Tests**: Playwright e2e (`npm run e2e`, desktop + Pixel 5, own `malabi_e2e` DB and server on :3100) covering landing, browsing, add to cart, pagination, cart/checkout, live prices, admin news CRUD.
- Skipped by decision (next phase): phone/SMS customer login (issue #1/#2), real prices, Tranzila.

## Phase 0 local setup
Category pages list descendant products. Scraper now parses the size-filtered card layout (`?ca=` views), filling וודקה/וויסקי/ליקרים (54/38/32 products). `.env` created, Postgres up via docker compose; scripts load `.env` via `tsx --env-file`.

## Frontend rework (commit 01b7881, f3cf298)
Shared design system, `next/image`, mobile nav, admin polish; uploaded product media added.

## Postgres migration (commit bc0eaec)
SQLite → PostgreSQL (local via `docker compose`).

## Roles, dispatch, staff (commit bc67889)
Added `AdminRole`, `isActive`, `Order.assignedDriverId`, dispatch board, driver deliveries, staff management, order transition rules.
Verified end-to-end in headless Chromium: owner full access; delivery manager confined to orders/dispatch (redirected, no loops); illegal PAID→DELIVERED rejected; legal PAID→PREPARING→OUT_FOR_DELIVERY works; driver sees only assigned orders with payment badge and can mark delivered. Test data deleted afterwards.

## Manual browser verification pass
Full click-through: home → category → product → variant → cart → checkout → mock payment → confirmation → static pages → admin & customer login. Zero console errors; one bug found (stale cart badge) and fixed.

## Initial build
Four milestones built in parallel (scraper, storefront+cart, admin, customer accounts) on a shared foundation (schema, session/password/money helpers, UI kit, theme), then an integration pass: fixed `redirect()` with Hebrew paths (`encodeURI`), wired guest-cart→customer, header/footer nav, built checkout+payment, confirmed static pages via catch-all. Verified with `tsc --noEmit` and `npm run build`.
