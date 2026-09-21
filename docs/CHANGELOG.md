# Changelog / build history

Newest first. Add an entry per milestone.

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
