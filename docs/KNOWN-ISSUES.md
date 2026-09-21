# Known issues & dev gotchas

## Open
1. **Turbopack + literal non-ASCII route segment**: `app/(storefront)/סל-קניות/page.tsx` sometimes 404s and falls to the `[...slug]` catch-all. Worked around with a fallback inside the catch-all; not a true fix.
2. **Scraper category aliasing**: live site cross-lists products under multiple category URLs; scraper pinned each to the first seen, so some branches (e.g. "night deliveries" hub) show 0 direct products. Data complete, just under a sibling. Resolved: category pages now list descendant products (`getCategoryProducts` in `src/lib/categoryTree.ts`).
3. **Three categories scraped empty** (`אלכוהול/וודקה`, `וויסקי`, `ליקרים`): actually a different card layout with per-size views (`?ca=5m/7m/1l`), now parsed (`parseSimpleProductBlock`). Fixed; each size is its own product with one variant, and shared items (e.g. shot syringes) repeat per size.
4. **Tranzila unverified**: field names come from general knowledge, not a live terminal → ROADMAP Phase 4.
5. **No automated tests**; **no rate limiting** on auth → ROADMAP Phase 5.
6. Admin products list has no pagination (fine at ~430 rows).

## Dev gotchas
- **Restart `next dev` after any `prisma migrate dev`.** A running dev server keeps the old generated client; new columns silently read as `undefined` (e.g. every login failed after adding `role`/`isActive`).
- **Redirects to Hebrew paths** must be wrapped in `encodeURI(...)`, otherwise `ERR_INVALID_CHAR` on the `Location` header.
- After clearing the cart in a server action, call `revalidatePath("/", "layout")` so the header badge refreshes (see `src/server/actions/checkout.ts`).
- Prisma relative sqlite-style paths resolved against `schema.prisma` — no longer relevant on Postgres.

## Fixed (kept for reference)
- Stale cart badge through checkout transitions → fixed with `revalidatePath` above.
- `<img>` → `next/image`, mobile nav (done in the frontend rework commit).
