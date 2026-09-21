# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md
@docs/README.md

## What this is

Malabi is a local-only, functional rebuild of malabi-expres.co.il (authorized by the site owner): a Hebrew/RTL storefront + admin/dispatch panel for a delivery business in Ashkelon, Israel. Not deployed. `docs/ROADMAP.md` (imported above via `docs/README.md`'s index) is the authoritative "what's next" list — check it before starting new work, and update it/`FEATURES.md`/`KNOWN-ISSUES.md`/`CHANGELOG.md` per the workflow it describes.

## Commands

```bash
npm run dev                    # dev server, localhost:3000
npm run build / start          # production build/serve
npm run lint                   # ESLint

npx prisma migrate dev         # apply a new migration (then RESTART next dev, see below)
npm run create-admin           # interactive: create an admin user (first OWNER)
npm run dev-seed               # seed local dev data
npm run seed-content           # static pages (about/contact/terms) + sample news
npm run dev-prices             # DEV ONLY: placeholder prices for unpriced variants
npm run backfill-variants      # give variant-less products a default variant
npm run check-media            # audit product/category photos exist on disk
npm run scrape                 # crawl live site to (re)populate categories/products
npm run category-images        # download category photos/labels from live site

npm run e2e                    # full Playwright suite (own DB, server on :3100)
npx playwright test e2e/admin.spec.ts              # single spec file
npx playwright test -g "some test name"            # by title
npx playwright test --project=desktop              # desktop-only (also: mobile)
```

Building while `next dev` is running clobbers `.next` — use `NEXT_DIST_DIR=.next-build npm run build` in that case (the e2e server already does the equivalent via `NEXT_DIST_DIR=.next-e2e`, see `package.json`).

There is no unit test runner configured yet (`docs/ROADMAP.md` Phase 5); correctness today is enforced by TypeScript, ESLint, and the Playwright e2e suite.

## Architecture

**Route groups**: `src/app/(storefront)/` is the customer site; `src/app/admin/(protected)/` is the admin panel, gated by `src/proxy.ts` (this Next.js version renamed `middleware.ts` → `proxy.ts` — see `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`). The proxy only checks *presence* of the `malabi_admin_session` cookie for routing; real session validation and per-role authorization happens server-side in `src/server/actions/admin-guard.ts` (`requireAdmin(allowedRoles?)`), which is called from each admin server action/page. Role mismatches redirect to that role's home (`ROLE_HOME`), never loop.

**Two independent auth systems**: customer (`malabi_customer_session`) and admin (`malabi_admin_session`) are separate `iron-session` cookies with no shared identity — see `src/lib/session.ts`. Don't assume a logged-in admin is also a `Customer` or vice versa.

**Three admin roles**, enforced by `requireAdmin` + `src/lib/orderTransitions.ts`:
- `OWNER` — full access (categories, products, orders, dispatch, staff)
- `DELIVERY_MANAGER` — orders + dispatch, can move `PAID → PREPARING → OUT_FOR_DELIVERY` (+ `CANCELLED`)
- `DRIVER` — only their own assigned deliveries, can move `OUT_FOR_DELIVERY → DELIVERED`

Order status is a one-way state machine: `PENDING_PAYMENT → PAID → PREPARING → OUT_FOR_DELIVERY → DELIVERED` (or `CANCELLED` from most states) — always go through `orderTransitions.ts`, don't write `Order.status` directly.

**Money is integer agorot everywhere** (`src/lib/money.ts`; 1 shekel = 100 agorot). Format with `formatIls`/`agorotToShekelString`, never divide by 100 ad hoc.

**Cart pricing is re-derived, never trusted from storage**: `CartItem.unitPriceAgorot` is only an add-time snapshot. Always price via `priceCartItems()` in `src/lib/cart.ts`, which re-reads current `ProductVariant.priceAgorot` and sets aside deactivated/unpriced lines as unavailable. This applies through checkout too — order line items are snapshotted (`OrderItem.*Snapshot`) only at the moment of order creation.

**Cart sessions must not be created during rendering** — cookies are read-only in Server Components/pages. `getOrCreateCartSession()` is Server-Action-only; page/layout reads use `findCartSession()` / `getCartSummary()`. Creating a cart during render silently inserts an orphan `CartSession` on every page view.

**Payments are a pluggable provider** (`src/lib/payment/`, `PaymentProvider.ts` interface): `mockProvider` (default, auto-approves) and `tranzilaProvider` (built but unverified — field names aren't confirmed against a live terminal, see `docs/KNOWN-ISSUES.md`). Selected via `PAYMENT_PROVIDER` env var; falls back to mock if `TRANZILA_TERMINAL` is empty. Callback route: `src/app/api/payment/tranzila/callback/route.ts`.

**Categories are a self-referential tree** (`Category.parentId` / `children`) with a denormalized, unique `fullSlugPath` that must cascade-update on rename/move (see `src/server/actions/admin-categories.ts`). `getCategoryProducts` (`src/lib/categoryTree.ts`) includes descendant-category products, which is what makes hub/parent categories show products even when items are only directly attached to a leaf.

**Hebrew slugs, ASCII route folders**: catalog slugs are Hebrew (e.g. `/אלכוהול/בירות/בלאנק`) and resolve fine as dynamic values, but literal Hebrew *route folders* were unreliable under Turbopack, so folders/redirects stay ASCII (`/cart`, `/about`, etc.). Any redirect to a Hebrew path must be wrapped in `encodeURI(...)` or the `Location` header throws `ERR_INVALID_CHAR`; a `redirects()` entry in `next.config.ts` needs its `source` percent-encoded too (a literal Hebrew source won't match).

**Scraper pipeline** (`scripts/scrape/`, entry `index.ts`): crawls the live site (respects robots.txt) via `crawlCategories.ts` → `parseCategoryPage.ts`/`parseProductBlock.ts` → `upsertToDb.ts`, downloading photos via `downloadImages.ts` into `public/media/`. The live site doesn't publish prices, so scraped variants carry `priceSource = PLACEHOLDER` until a real price import exists (`ProductVariant.priceSource`, tracked on the admin dashboard); `npm run dev-prices` is dev-only filler, not for real data. `Product.sourceProductKey` / `ProductVariant.sourceOptionValue` are the intended match keys for a future real price import (see `docs/ROADMAP.md` Phase 1).

**E2E suite** (`e2e/`, `playwright.config.ts`): runs against its own database (`malabi_e2e`, created via `e2e/prepare-db.ts`) on port 3100, forced to `workers: 1` because specs share state — `admin.spec.ts` mutates content that `storefront.spec.ts` reads. `e2e/env.ts` holds the shared DB/port/admin-credential constants.

## Dev gotchas (see `docs/KNOWN-ISSUES.md` for the full/current list)

- **Restart `next dev` after every `prisma migrate dev`** — a running server keeps the stale generated Prisma client, so new columns silently read as `undefined`.
- After clearing the cart in a server action, call `revalidatePath("/", "layout")` so the header cart badge refreshes (see `src/server/actions/checkout.ts`).
