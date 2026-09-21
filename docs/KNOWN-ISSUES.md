# Known issues & dev gotchas

## Open
1. **Scraper category aliasing**: live site cross-lists products under multiple category URLs; scraper pinned each to the first seen, so some branches (e.g. "night deliveries" hub) show 0 direct products. Data complete, just under a sibling. Resolved: category pages now list descendant products (`getCategoryProducts` in `src/lib/categoryTree.ts`).
2. **Three categories scraped empty** (`אלכוהול/וודקה`, `וויסקי`, `ליקרים`): actually a different card layout with per-size views (`?ca=5m/7m/1l`), now parsed (`parseSimpleProductBlock`). Fixed; each size is its own product with one variant, and shared items (e.g. shot syringes) repeat per size.
3. **Tranzila unverified**: field names come from general knowledge, not a live terminal → ROADMAP Phase 4.
4. **No rate limiting** on auth → ROADMAP Phase 5. (E2E smoke suite exists: `npm run e2e`.)
5. Admin products list has no pagination (fine at ~430 rows).

6. **23 products have no photo** — the live site has none either; they show a placeholder tile.
7. **Catalog slugs are Hebrew** (`/אלכוהול/בירות/בלאנק`). Route *folders* and redirects are ASCII (`/cart`, `/about`) because a literal Hebrew route folder was unreliable under Turbopack; dynamic slug values resolve fine.

## Dev gotchas
- **Restart `next dev` after any `prisma migrate dev`.** A running dev server keeps the old generated client; new columns silently read as `undefined` (e.g. every login failed after adding `role`/`isActive`).
- **Redirects to Hebrew paths** must be wrapped in `encodeURI(...)`, otherwise `ERR_INVALID_CHAR` on the `Location` header. A `redirects()` **source** in `next.config.ts` must be percent-encoded (a literal Hebrew source never matches).
- **Never call `getOrCreateCartSession()` while rendering** — cookies are read-only there, so it inserts an orphan `CartSession` on every page view. Reads use `findCartSession()` / `getCartSummary()`; only Server Actions create carts.
- **Never trust `CartItem.unitPriceAgorot`** (add-time snapshot). Price via `priceCartItems()` in `src/lib/cart.ts`.
- `npm run build` while `next dev` runs clobbers `.next`; build with `NEXT_DIST_DIR=.next-build npm run build`.
- After clearing the cart in a server action, call `revalidatePath("/", "layout")` so the header badge refreshes (see `src/server/actions/checkout.ts`).
- Prisma relative sqlite-style paths resolved against `schema.prisma` — no longer relevant on Postgres.

## Fixed (kept for reference)
- Stale cart badge through checkout transitions → fixed with `revalidatePath` above.
- `<img>` → `next/image`, mobile nav (done in the frontend rework commit).
- 403/536 products had no variant (couldn't be added to cart) → default variant backfill + scraper change.
- Missing category photos, cropped product photos, stale storefront, no landing/news page (see CHANGELOG).
- Cart route at literal Hebrew path 404ing → `/cart`.
