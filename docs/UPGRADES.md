# Things that should or could be upgraded

Not blocking — the app works end-to-end without these. Ordered roughly by value for effort.

## Should do soon

- **Images via `next/image`.** Storefront/admin product images currently render as plain `<img>` tags (flagged with `eslint-disable @next/next/no-img-element`). Switching to `next/image` gets automatic resizing, lazy-loading, and format optimization for free — worth doing once the real product photo set is finalized (410 images currently ~11MB unoptimized).
- **`scripts/import-prices.ts`.** Planned but never built (see `docs/TODO.md`). Without it, the only way to bulk-set real prices is manual admin entry, which doesn't scale past a handful of products.
- **Automated tests.** There are none right now — every milestone was verified manually (curl smoke tests, a couple of Playwright passes, direct DB checks) during the build, but nothing runs on its own going forward. Cheapest wins:
  - Unit tests for `src/lib/money.ts` (agorot math) and the cart subtotal/minimum-order logic — pure functions, easy to test, and exactly the kind of thing that silently breaks during a refactor.
  - One Playwright end-to-end test for the guest checkout path (browse → add to cart → checkout → mock-pay → confirmation) and one for the admin CRUD path, since those are the highest-value flows.
- **Admin variant editor.** Currently one form per row (add/edit/delete each submit independently) rather than a single client-managed multi-row form. Functional, but editing several variants on one product is more clicks than it needs to be.

## Worth considering

- **Cart merge on login.** Right now logging in just re-points the guest cart to the customer (see `docs/TODO.md`). A real merge (combine quantities for matching variants across the guest cart and any existing customer cart) is a small, self-contained improvement if multi-device checkout ever matters.
- **Rate limiting on auth.** `registerCustomer`/`loginCustomer`/`loginAdmin` have no throttling. Not urgent for a local single-user app, but cheap insurance if this ever runs somewhere less trusted.
- **Sanitize `StaticPage.bodyHtml`.** It's rendered via `dangerouslySetInnerHTML` in the catch-all router. Currently fine — only an admin can write it, same trust level as any CMS — but if editing ever opens up to less-trusted users, run it through a sanitizer first.
- **Category/product ordering UI.** `sortOrder` exists on both models but there's no drag-and-drop or bulk-reorder UI in admin yet — it's a plain number field.
- **Order notifications.** The original site leans on WhatsApp for customer contact (there's already a click-to-chat link in the header/footer). A "notify customer on status change" step (WhatsApp deep link, SMS, or just email) would close the loop after an admin updates order status.

## Longer-term / only if scope grows

- **Move off SQLite** if this ever needs multiple concurrent writers or a real deployment target (Postgres via the same Prisma models — no schema redesign needed, just a datasource swap).
- **Re-evaluate Prisma major version.** Pinned to 6.19.3 after Prisma's `latest` npm tag pointed at an 8.x release candidate that pulled in a vulnerable dev-tooling dependency chain (`@prisma/dev`/`alchemy`/`hono`, all unrelated to the SQLite runtime path used here) and required a new driver-adapter config model (`prisma.config.ts`) instead of the classic `datasource { url = env(...) }`. Worth revisiting once Prisma 7/8 stabilize on npm's `latest` tag and the driver-adapter migration path is worth the churn.
- **RBAC for admin**, if more than one admin user with different permission levels is ever needed — current model is a single flat `AdminUser` table by design.
