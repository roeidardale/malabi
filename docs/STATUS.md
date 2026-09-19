# Malabi Express local rebuild — status

A local, functional rebuild of https://www.malabi-expres.co.il/ (authorized by the site owner), built with Next.js 16.3.5 + TypeScript + Tailwind v4 + Prisma 6.19.3 (SQLite). Local-only — not deployed.

## Stack

- **Framework**: Next.js 16.3.5, App Router, Turbopack
- **DB**: SQLite via Prisma 6.19.3 (`prisma/dev.db`, `prisma/schema.prisma`)
- **Auth**: `iron-session` cookies, two independent sessions (`malabi_customer_session`, `malabi_admin_session`), `bcryptjs` for password hashing
- **Styling**: Tailwind v4 (CSS-first `@theme` config in `src/app/globals.css`), RTL Hebrew, dark theme, brand accent `#FFC93F`
- **Payments**: pluggable provider (`src/lib/payment/`) — `mockProvider` (auto-approve, active by default) and `tranzilaProvider` (built, unconfigured)

## What's built

### Data & content
- Full Prisma schema: `AdminUser`, `Customer`, `Category` (self-referential tree), `Product`, `ProductVariant`, `CartSession`/`CartItem`, `Order`/`OrderItem`, `StaticPage`. Money stored as integer agorot throughout.
- Scraper (`scripts/scrape/`, run via `npm run scrape`) crawled the live site's public pages (respecting `robots.txt`) and populated:
  - **57 categories**, **430 products**, **89 variants**, **410 product images** (`public/media/products/`)
  - All scraped variant prices are placeholders (₪0.00, `priceSource: "MANUAL"`) — prices are never scraped (the live pricing endpoint lives under the disallowed `/umbraco/` path)

### Storefront (`src/app/(storefront)/`)
- Home page, category/subcategory browsing, product detail with variant selection, breadcrumbs
- Cart (`/סל-קניות`): add/update/remove, 35₪ minimum-order gate, guest sessions via cookie
- Checkout → payment → confirmation flow, with order numbers, snapshot line items, and a mock payment step that works out of the box
- About/Contact/Terms pages, served from the `StaticPage` table via the catch-all router
- Header links to cart and account (login or profile depending on session state), footer links to static pages + WhatsApp

### Customer accounts
- Register/login/logout, profile editing, order history (`/sales-history`)
- Cart items from a guest session carry over automatically on login/registration

### Admin panel (`src/app/admin/`, gated by `src/proxy.ts`)
- Login, dashboard (counts + "variants missing a price" widget)
- Categories CRUD, with cascading `fullSlugPath` updates down the tree on rename/move
- Products + variants CRUD, including image upload
- Orders list/detail with status updates (`PENDING_PAYMENT → PAID → PREPARING → OUT_FOR_DELIVERY → DELIVERED`/`CANCELLED`)
- First admin user is created via `npm run create-admin` (interactive CLI) — none exists yet

## How it was built

Four independent milestones (scraper, storefront+cart, admin panel, customer accounts) were built in parallel by separate agents against a shared foundation (schema, session/password/money helpers, UI kit, theme). After all four landed, an integration pass:
- Fixed a DB path bug (`DATABASE_URL` was resolving to a nested `prisma/prisma/dev.db` instead of `prisma/dev.db` — Prisma resolves relative paths against `schema.prisma`'s own directory, not the project root)
- Fixed a crash: `redirect()` to a raw Hebrew path throws `ERR_INVALID_CHAR` on the `Location` header (HTTP headers must be ASCII) — needs `encodeURI(...)`
- Wired cart-to-customer association on login/registration
- Added header/footer navigation between the storefront, accounts, and static pages
- Built checkout + payment (the one milestone not parallelized, since it depends on the cart implementation)
- Confirmed static pages render through the catch-all router

All work is verified with `npx tsc --noEmit` (clean) and `npm run build` (clean, all routes compile) as of this pass.

## Known issues found during the build (see `docs/TODO.md` and `docs/UPGRADES.md` for what to do about them)

1. **Turbopack + literal non-ASCII route segments**: a dedicated `app/(storefront)/סל-קניות/page.tsx` route sometimes 404s at runtime and falls through to the `[...slug]` catch-all instead. Worked around with a same-path fallback inside the catch-all; not a true fix.
2. **Scraper category aliasing**: the live site cross-lists identical products under multiple category URLs (e.g. two different paths both leading to the same snacks). The scraper pins a product to whichever category it saw first, so some category branches show 0 direct products (their products live under a sibling alias instead). Data is complete, just organized under one branch rather than duplicated.
3. **Three categories scraped empty**: `אלכוהול/וודקה`, `וויסקי`, `ליקרים` had 0 products at scrape time — the live site was serving a different page template (a cross-sell widget) for these at that moment, not the standard catalog markup the scraper targets.
4. Tranzila integration is built but **unconfigured and unverified** — falls back to the mock provider automatically.
5. **Fixed during browser testing**: the header's cart badge stayed stale (showing the pre-checkout item count) through the checkout → pay → confirmation client-side transitions, because `createOrderFromCart` cleared the cart in the database but never told Next.js to refresh the shared `(storefront)` layout that renders the badge — it only caught up on a full page reload. Fixed by adding `revalidatePath("/", "layout")` right after the cart is cleared in `src/server/actions/checkout.ts`. Verified with a real browser (Playwright + a manually-located cached Chromium build, since neither the sandbox nor the Playwright plugin's expected Chrome install were available) that the badge now clears immediately.

## Manual browser verification (this pass)

Ran a full click-through against `npm run dev` with a real headless Chromium: home → category → subcategory → product grid (real scraped images render correctly) → variant select → add to cart → cart page (quantity controls, minimum-order gating) → full checkout → mock payment approval → confirmation page (correct order number, line items, total) → static pages (about/contact/terms) → admin login → customer login. Zero console/page errors. One real bug found and fixed (the cart badge staleness above). All test orders/customers/cart sessions created during this pass were deleted afterward — the database is back to just the real scraped catalog (57 categories / 430 products / 89 variants, 0 orders/customers/admins).
