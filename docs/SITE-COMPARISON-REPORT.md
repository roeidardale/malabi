# Old site vs. new app — issues, gaps & enhancements

Comparison of the live legacy site **malabi-expres.co.il** against the rebuilt **Malabi** webapp,
done while exercising the new app. Every finding is listed here; nothing is split across other docs.

- **Date:** 2026-09-23
- **Method:** crawled the legacy site (server-rendered HTML + raw source), read the new app's
  source, probed the running dev server and a **production build** (port 3001) over HTTP, and ran
  the Playwright e2e suite.
- **Environment:** new app local, `PAYMENT_PROVIDER=mock`, Tranzila empty. Catalog = 57 categories /
  429 products; 3 orders / 2 customers; 3 static pages; 0 news posts.
- **Severity:** `Blocker` = blocks real use · `High` = serious gap · `Medium` · `Low` · `Enhancement`.

> Mapping note: items also live in `docs/ROADMAP.md` / `docs/KNOWN-ISSUES.md` / `docs/BACKLOG.md`;
> the ID column below is just for tracking in this report. Every finding below (except CMP-16 and
> CMP-20, marked "no action needed") has been filed as a GitHub issue — see the Issue column.

---

## 0. Test evidence (what was actually run)

| Check | Result |
| --- | --- |
| `npm run e2e` (desktop + mobile, 28 tests) | ✅ **28/28 pass** — landing, browse, add-to-cart, live re-pricing, min-order gate, guest checkout, admin news CRUD + authz |
| `NEXT_DIST_DIR=.next-build npm run build` | ✅ Builds clean (TS + 24 static pages) |
| Production `next start` route probe | ✅ `/about` `/cart` `/checkout` `/login` 200; `/customer-profile` `/sales-history` `/addresses` `/onboarding` → 307 `/login`; `/admin/*` → 307 `/admin/login` |
| Legacy redirects | ✅ `/סל-קניות/` → `/cart`, `/register` → `/login`; ❌ `/basket`, `/אודות`, `/צור-קשר`, `/תקנון`, `/משחקי-אלכוהול`, `/מבצעי-קיץ-26`, top-level product slugs → soft-404 |
| DB audit (429 products / 89 variants) | ⚠️ **403 products have 0 variants; 86/89 variants are ₪0** |
| `notFound()` status | 200 (streamed) + `noindex` — documented behavior for this Next version; see CMP-22/23 |

The e2e suite passes because it seeds **its own** DB with healthy test data. The dev DB the app is
actually serving is in a broken catalog state (below) — that is the single biggest real-world gap.

---

## 1. Summary table

| ID | Sev | Area | Finding | Issue |
| --- | --- | --- | --- | --- |
| CMP-01 | High | Catalog | 403/429 products have no variant → can't be added to cart | [#3](https://github.com/roeidardale/malabi/issues/3) |
| CMP-02 | High | Catalog | Only 3 variants priced; 86 are ₪0 → catalog effectively unbuyable | [#3](https://github.com/roeidardale/malabi/issues/3) |
| CMP-03 | High | Catalog | Whole legacy categories empty (whiskey, liqueurs, vapes, bundles, most snacks) | [#4](https://github.com/roeidardale/malabi/issues/4) |
| CMP-04 | Medium | Catalog | 0 published news posts → landing news section hidden | [#5](https://github.com/roeidardale/malabi/issues/5) |
| CMP-05 | High | Storefront | No product search (legacy had autosearch) | [#6](https://github.com/roeidardale/malabi/issues/6) |
| CMP-06 | High | Storefront | No business-hours / closed-gate (legacy closed 23:00–09:30, no alcohol after 23:00) | [#7](https://github.com/roeidardale/malabi/issues/7) |
| CMP-07 | High | Storefront | Delivery fee/zones/nationwide not implemented (hardcoded ₪0) | [#8](https://github.com/roeidardale/malabi/issues/8) |
| CMP-08 | Medium | Storefront | No promotions/deals page or compare-at (sale) price | [#9](https://github.com/roeidardale/malabi/issues/9) |
| CMP-09 | Medium | Storefront | No contact form (legacy had name/phone/email/subject/message) | [#10](https://github.com/roeidardale/malabi/issues/10) |
| CMP-10 | Medium | Content | Home omits delivery-time promise, nationwide info, store address, trust badges | [#11](https://github.com/roeidardale/malabi/issues/11) |
| CMP-11 | Medium | Content | No Facebook/Instagram links | [#12](https://github.com/roeidardale/malabi/issues/12) |
| CMP-12 | Medium | Content | No phone (tel:) or email in header/footer | [#12](https://github.com/roeidardale/malabi/issues/12) |
| CMP-13 | Medium | Content | Terms/about copy far thinner than legacy business terms | [#13](https://github.com/roeidardale/malabi/issues/13) |
| CMP-14 | Low | Content | No newsletter signup / marketing consent | [#14](https://github.com/roeidardale/malabi/issues/14) |
| CMP-15 | Medium | Compliance | No 18+ acknowledgement at checkout despite alcohol/tobacco/vape sales | [#15](https://github.com/roeidardale/malabi/issues/15) |
| CMP-16 | Low | Catalog | Legacy per-size quick links (`?ca=5m/7m/1l`) not needed (variant chips cover it) | — no action needed |
| CMP-17 | Medium | UX | Account pages sit outside the storefront shell → no header/cart/categories | [#16](https://github.com/roeidardale/malabi/issues/16) |
| CMP-18 | Low | UX | Mobile menu exposes only WhatsApp + account (no categories/static links) | [#17](https://github.com/roeidardale/malabi/issues/17) |
| CMP-19 | Low | UX | Logged-in header hides order-history/logout (legacy exposed them directly) | [#17](https://github.com/roeidardale/malabi/issues/17) |
| CMP-20 | Low | UX | Add-to-cart toast is fine; legacy modal offered "continue" + "to cart" (nice-to-have) | — no action needed |
| CMP-21 | High | SEO | No `robots.txt` / `sitemap.xml`; catch-all serves 404 HTML at 200 for both | [#18](https://github.com/roeidardale/malabi/issues/18) |
| CMP-22 | Medium | SEO | Unmatched URLs return HTTP 200 (streamed `notFound()`); unknown `/api/*` too | [#19](https://github.com/roeidardale/malabi/issues/19) |
| CMP-23 | Medium | SEO | Legacy product/landing URLs not redirected (top-level product slugs, Hebrew pages, `/basket`) | [#19](https://github.com/roeidardale/malabi/issues/19) |
| CMP-24 | Medium | SEO | No Open Graph/Twitter images, no Product/Offer/Breadcrumb JSON-LD | [#20](https://github.com/roeidardale/malabi/issues/20) |
| CMP-25 | Low | SEO | `generateMetadata` sets title (product also description) only — no canonical/OG | [#20](https://github.com/roeidardale/malabi/issues/20) |
| CMP-26 | High | Payments | Delivery fee ₪0 + Tranzila unverified; legacy also had card-at-door + Bit | [#8](https://github.com/roeidardale/malabi/issues/8) |
| CMP-27 | Low | Payments | Legacy ₪20 fee if no ID at delivery — no equivalent logic | [#21](https://github.com/roeidardale/malabi/issues/21) |
| CMP-28 | Enhancement | UX | Floating WhatsApp button (legacy had one), accessibility widget (legacy had tabnav) | [#22](https://github.com/roeidardale/malabi/issues/22) |

---

## 2. Detailed findings

### CMP-01 — 403 of 429 products cannot be added to cart (High)
**Evidence (live DB):**
```
total: 429  active: 429  noVariants: 403  noActiveVariants: 403
variants: 89 (26 products have any variant)
```
`AddToCart` renders `אין אפשרויות זמינות כרגע` when a product has no active variants
(`src/components/storefront/AddToCart.tsx:43-45`), so 94% of the catalog has no buy button.
Reproduced: `/אלכוהול/קוקטיילים/פחית-וודקה-חמוציות` returns 200 but no `הוסף לסל`.

**Fix:** run `npm run backfill-variants` (gives every variant-less product one default `יחידה`
variant). Root-cause check: the scraper's `ensureDefaultVariant()`/`upsertVariant()` in
`scripts/scrape/upsertToDb.ts` does create variants, so this DB was likely populated by an older
run — re-scrape or backfill. Add a **"מוצרים ללא וריאנט"** counter to the owner dashboard
(`src/app/admin/(protected)/page.tsx`) so this state is visible instead of silent.

### CMP-02 — Only 3 of 89 variants have a price (High)
86 variants are `priceAgorot = 0` → they render `מחיר בקרוב` with a disabled button
(`AddToCart.tsx:47,108,140`). Even after backfill, the catalog stays unbuyable until real prices
land. This is known (Phase 1 — awaiting the client price export), but the running app gives a
shopper a full catalog with nothing to buy. **Fix:** import confirmed prices
(`npm run import-prices --apply`) and/or `npm run dev-prices` for local demos; surface the
dashboard counters ("וריאנטים ללא מחיר" / "מחירי דמו להחלפה") more prominently.

### CMP-03 — Entire legacy categories have zero products (High)
Legacy nav advertises categories that have **no products at all** in the current DB:

| Legacy category | Products in new DB |
| --- | --- |
| `אלכוהול/וויסקי` | 0 |
| `אלכוהול/ליקרים` | 0 |
| `אלכוהול/אלכוהול-שונות` | 0 |
| `אלכוהול/חבילות-אלכוהול/חבילות-וודקה` (+700/ליטר/500) | 0 |
| `אלכוהול/חבילות-אלכוהול/חבילות-וויסקי` | 0 |
| `אלכוהול/שונות-תת-קטגוריה/אלקטרוניות-חד-פעמיות` | 0 |
| `נישנושים ומאנצ'` children (chocolate, ice-cream, gummies, cookies, snacks, nuts) | 0 |

Because `getStorefrontCategories`/`getCategoryByPath` hide empty categories
(`src/lib/categoryTree.ts:13-44`), these simply vanish from the new storefront — shoppers cannot buy
whiskey, liqueurs, vape disposables, or most snack sub-categories that the old site sells.
**Fix:** re-scrape those branches (or hand-add) and confirm counts; add a scrape coverage report.

### CMP-04 — No published news posts (Medium)
`posts: 0`, so `HomePage`'s `posts.length > 0` guard hides the "חדשות ועדכונים" section entirely
(`src/app/(storefront)/page.tsx:19`). Legacy home surfaced promos/updates. **Fix:** `npm run
seed-content` or publish via `/admin/news`; consider seeding at least one "welcome" post on deploy.

### CMP-05 — No product search (High)
Legacy header had `#autosearch` (`placeholder="חיפוש מוצרים"`). The new app has **no search route**
(`find src/app -type d -iname search` → nothing; `grep` finds `חיפוש` only in the admin product
filter). `/search` returns the 404 page. **Fix:** add a header search input (+ `/search?q=`) with a
`contains`/`mode: insensitive` Prisma query over product name/description, and/or client
autocomplete. This is a core storefront affordance on a 400+ product catalog.

### CMP-06 — No business hours / closed gate (High)
Legacy site: open 09:30–24:00; **closed 23:00–09:30**, and **after 23:00 no alcohol** (snacks/soda/
tobacco only). Nothing in the new app implements hours: `grep -riE "businessHours|openingHours|
isOpen|openNow|שעות פעילות"` in `src` → **0 hits**, and checkout accepts orders 24/7. Already on
`ROADMAP.md` Phase 2. **Fix:** a settings value + checkout guard + a storefront "hours" notice,
mirroring the legacy limited-mode rules (alcohol cutoff ≠ full close).

### CMP-07 — Delivery fee / zones / nationwide missing (High)
`DELIVERY_FEE_AGOROT = 0` (`src/lib/money.ts:15`) and applied blindly in
`src/server/actions/checkout.ts:106,120`. `DEFAULT_DELIVERY_CITY = "אשקלון"` with a free-text city
and no zone validation. Legacy terms (`old cart page`):
- Ashkelon express: **up to 30 min, ₪20 and up**
- nationwide: **up to 5 business days, ₪49**
- Ashkelon delivery window 20–45 min from confirmation

**Fix:** fee/zone model + checkout calculation + delivery-time/zone display (ROADMAP Phase 2).

### CMP-08 — No promotions / sale prices (Medium)
Legacy has a dedicated `/מבצעי-קיץ-26/` page of bundle cards showing an original price struck
through (e.g. `₪105 ₪0`). The new schema has **no compare-at / original price** field
(`grep compareAt|salePrice|discount` → 0 hits in `prisma/schema.prisma`) and no merchandising page.
**Fix:** add `compareAtAgorot` (or a `Promotion`/collection model) + a featured/deals section on the
home page and a tag on `ProductCard`.

### CMP-09 — No contact form (Medium)
Legacy `/צור-קשר/` had a working form (שם / טלפון / דוא"ל / נושא / תוכן + validation) plus hours.
The new `/contact` is a static `StaticPage` (`scripts/seed-content.ts`) with a WhatsApp link and a
`tel:` number. **Fix:** add a contact form (server action + optional email/notification) or make
WhatsApp the explicitly primary channel and link it more prominently.

### CMP-10 — Home omits key business info (Medium)
Legacy home carried: "קליק אחד ועד 25 דקות", nationwide up to 4–5 business days, address
**הנשיא 4 אפרידר אשקלון**, and trust badges (אספקה במועד / התאמה אישית / קנייה מאובטחת). The new
hero has only a headline, one line of copy, 2 facts (Ashkelon, ₪35 min) and 3 category tiles
(`src/components/storefront/Hero.tsx`). **Fix:** add a delivery-time promise, nationwide note,
address, and 3 trust badges to the hero/footer.

### CMP-11 — No Facebook/Instagram links (Medium)
Legacy linked `facebook.com/malbiex` and `instagram.com/malabi_expres/`. New app only uses
`WHATSAPP_URL` (`src/lib/routes.ts:3`); no social links in header/footer. **Fix:** add both (and the
legacy `wa.me/message/...` deep link if preferred over the phone-number link).

### CMP-12 — No phone/email in header or footer (Medium)
Legacy header had a persistent customer-service phone (tel:052-3311457) and footer listed phone +
email + card icons. New header has WhatsApp/account/cart only (`src/app/(storefront)/layout.tsx`)
and the footer has WhatsApp + 3 static links. **Fix:** add `tel:` + `mailto:` to the footer (and a
small phone icon in the header on desktop).

### CMP-13 — Terms/about copy much thinner than legacy (Medium)
Legacy תקנון covered: 18+ and ID-at-delivery, card + cardholder ID verification, cancellation fee,
delivery windows, "prices in store may differ", newsletter consent, IP/ownership. New terms
(`scripts/seed-content.ts`) are 4 short sections and already flagged "needs owner/legal review"
(ROADMAP Phase 6). **Fix:** port the owner's real clauses (content task, not code).

### CMP-14 — No newsletter signup (Low)
Legacy terms reference newsletter/marketing consent; neither site shows a prominent signup, but the
new app has no subscribe endpoint at all (no `Subscriber` model). **Fix:** optional footer signup +
consent copy once email/SMS marketing is in scope. → BACKLOG.

### CMP-15 — No 18+ acknowledgement at checkout (Medium)
The catalog includes alcohol, cigarettes and disposable vapes. Legacy relies on courier ID checks;
new terms mention 18+ (`seed-content.ts`) but **checkout has no age confirmation** and `Order` has no
age-verification field. **Fix:** add a required "אני מעל גיל 18" checkbox at checkout (and on the
alcohol/vape categories), storing confirmation on the order.

### CMP-16 — Legacy per-size quick links (Low / informational)
Legacy used `?ca=5m|7m|1l|sl` links per size; the new app models sizes as variant chips/selects
(`AddToCart.tsx`) which is cleaner. No action; just note the legacy query links still resolve to the
same product (query ignored), so no redirect is required for `?ca=`.

### CMP-17 — Account pages outside the storefront shell (Medium)
`/login`, `/onboarding`, `/customer-profile`, `/sales-history`, `/addresses` live directly under
`src/app/` and **do not** use `(storefront)/layout.tsx`. Result: once a shopper logs in they lose the
header, cart badge, category rail and footer, and get bare "→ בית / → האזור האישי" back-links.
Legacy kept the full header on these pages. **Fix:** move them into the storefront layout (or a
shared shell) so header/cart/footer persist.

### CMP-18 — Mobile menu is sparse (Low)
`MobileNav` renders only "הזמנה בוואטסאפ" and account/login (`src/components/storefront/MobileNav.tsx`).
Legacy mobile nav exposed the full category tree and static links. Category chips are reachable via
the horizontal rail, but אודות/צור קשר/תקנון/היסטוריה are not. **Fix:** add category + static links to
the sheet.

### CMP-19 — Logged-in header hides order history/logout (Low)
Legacy header exposed "ההזמנות שלי", "פרטים אישיים", "התנתקות" directly. New header shows a single
"החשבון שלי" link to the profile page, where order history/addresses/logout live. **Fix:** a small
account dropdown/menu in the header.

### CMP-20 — Add-to-cart feedback (Low)
Legacy showed a modal with both "רוצה לקנות עוד / המשך הזמנה" and "סיום הזמנה / מעבר לעגלת קניות".
New toast has a "לסל" action (`AddToCart.tsx:58-60`), which is fine — optional nicety only.

### CMP-21 — No robots.txt / sitemap.xml (High)
Neither file exists (`find src -iname 'robots*' -o -iname 'sitemap*'` → nothing), and because the
root catch-all `src/app/(storefront)/[...slug]/page.tsx` matches **every** path, both `/robots.txt`
and `/sitemap.xml` return the **404 HTML page with HTTP 200** (verified in the production build).
Legacy had a real `robots.txt`. **Fix:** add `app/robots.ts` + `app/sitemap.ts` (generated from
categories + active products + static pages), and confirm they take precedence over the catch-all.

### CMP-22 — Soft-404s return HTTP 200 (Medium)
Unmatched URLs return 200 with the default 404 page and `noindex` (verified in prod):
`/this-page-does-not-exist`, `/api/nope`, `/cart/nope`, `/robots.txt`. This is documented behavior
for **streamed** `notFound()` in this Next version
(`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/not-found.md:13` —
"Next.js will return a `200` HTTP status code for streamed responses, and `404` for non-streamed").
It's not an app bug, but it is an SEO/monitoring smell. **Fix/consider:** enable
`experimental.globalNotFound` with `app/global-not-found.tsx` for unmatched routes, keep unknown
`/api/*` outside the catch-all, and monitor soft-404s. At minimum add robots/sitemap (CMP-21) so
crawlers stop reading the 404 HTML.

### CMP-23 — Legacy URLs are not redirected (Medium)
Verified soft-404 in production:
- Old **product** URLs are top-level single segments (e.g. `/4-מזרקי-צייסר/?ca=sl`,
  `/קומבינת-700/`) — `resolveStorefrontPath` treats a single segment as a static page, so they miss.
- Legacy static/landing Hebrew paths: `/אודות`, `/צור-קשר`, `/תקנון`, `/משחקי-אלכוהול`,
  `/עירבוב-ושתיה-קלה`, `/מבצעי-קיץ-26`.
- Legacy `/basket` (their checkout) and trailing-slash variants.

**Fix:** add `redirects()` entries (percent-encoded sources — see `next.config.ts` note) and/or a
fallback that resolves a single-segment product slug to its category path. This matters for old
bookmarks, Google's index and the price-report `source_url`s.

### CMP-24 — No OG images / structured data (Medium)
No `opengraph-image`/`twitter-image` files and no JSON-LD. Shared links render as plain text; Google
gets no `Product`/`Offer`/`BreadcrumbList` rich results. **Fix:** add `opengraph-image.tsx` (root +
per product/category) and JSON-LD on `ProductView`/`CategoryView`.

### CMP-25 — Thin metadata (Low)
Root metadata (`src/app/layout.tsx:19-22`) is a title + generic description; `generateMetadata` in
`[...slug]/page.tsx` sets only title (+ product description). **Fix:** add `metadataBase`,
canonical URLs, OG fields, and per-category descriptions.

### CMP-26 — Payments: fee ₪0 and Tranzila unverified (High)
`DELIVERY_FEE_AGOROT = 0` and `PAYMENT_PROVIDER=mock`. Tranzila field names are unverified
(KNOWN-ISSUES #3, ROADMAP Phase 4). Legacy additionally accepted **card-on-delivery via courier
terminal** and **Bit (₪5 fee)**. The new online-iframe flow is an **improvement**, but the business
must confirm whether pay-on-delivery stays. **Fix:** ROADMAP Phase 2 (fee) + Phase 4 (verify
Tranzila, approve/decline round-trip, callback idempotency).

### CMP-27 — No "no-ID at delivery" fee logic (Low)
Legacy charged ₪20 if the recipient couldn't show ID (or refused the order). New terms mention
refusal but there's no courier-side fee mechanism. **Fix:** business decision; if kept, needs a
dispatch/order adjustment path.

### CMP-28 — Enhancements worth adopting (Enhancement)
- **Floating WhatsApp button** (legacy had a persistent one; new has header/footer links only).
- **Accessibility widget** — legacy loaded "tabnav"; Israeli sites are expected to be accessible. At
  minimum verify keyboard/focus/contrast (the e2e suite already checks no horizontal scroll).
- **Related/recently-viewed products** on the product page (legacy used bundles/promos as upsell).
- **Order status notifications** to the customer (WhatsApp/SMS via existing `src/lib/sms/`) —
  BACKLOG.
- **Web app manifest / apple icon** (only `favicon.ico` today).

---

## 3. What the new app does better than the old (keep)

- **Guest checkout** without forcing account creation; legacy funneled to membership.
- **Phone + OTP login** replaces email/password; one flow for new + returning customers.
- **Saved address book** with per-order override and "save this address".
- **Live re-pricing**: cart/checkout re-read current prices and set unpriced/deactivated lines aside
  (`priceCartItems`), instead of trusting stored snapshots.
- **Availability handling** with an "unavailable items" section and checkout block.
- **Snapshot order line items** at creation time.
- **Worker/admin panel that never existed before** — dashboard, orders, dispatch, my-deliveries,
  staff, role-based access (`OWNER`/`DELIVERY_MANAGER`/`DRIVER`) — this was the owner's stated pain.
- **Driver payment visibility** and one-tap "delivered".
- **News CMS** for the landing page.
- **Shared design system** + `next/image` + mobile nav.

---

## 4. Suggested order of work

1. **CMP-01/02/03/04** — make the catalog real/complete (backfill variants, import prices, re-scrape
   missing branches, seed a news post). Nothing else matters if the shelves are empty.
2. **CMP-21/23** — robots.txt + sitemap + legacy redirects (cheap, high SEO/migration value).
3. **CMP-05/06/07** — search, business hours, delivery fee/zones (core storefront behavior).
4. **CMP-17** — bring account pages into the storefront shell.
5. **CMP-08/09/10/11/12/15** — merchandising, contact, home info, socials, age gate.
6. **CMP-13/24/25** — legal copy + metadata/OG/structured data.
7. Remaining Low/Enhancement items → BACKLOG.

---

## 5. Reproduction commands

```bash
# catalog state
node --env-file=.env -e '
const {PrismaClient}=require("@prisma/client"); const p=new PrismaClient();
(async()=>{
  console.log({
    products: await p.product.count(),
    variants: await p.productVariant.count(),
    noVariants: await p.product.count({ where: { variants: { none: {} } } }),
    variantsZero: await p.productVariant.count({ where: { priceAgorot: 0 } }),
  });
  await p.$disconnect();
})()'

# legacy URL behavior (production build)
NEXT_DIST_DIR=.next-build npm run build && NEXT_DIST_DIR=.next-build npx next start -p 3001 &
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3001/robots.txt          # 200 + 404 HTML
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3001/nope-does-not-exist # 200 (soft 404)

# full behavioral suite
npm run e2e
```