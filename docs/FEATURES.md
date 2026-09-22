# What's built

## Catalog & content
- Scraper (`npm run scrape`, respects robots.txt) populated **57 categories, 536 products, 513 product photos** (`public/media/products/`). Single-item products get one default "יחידה" variant (`npm run backfill-variants` for existing data).
- Category photos come from the live site's nav tiles (`npm run category-images`), falling back to a product photo, then the parent's. `npm run check-media` audits that every `imageUrl` exists on disk.
- **Prices are dev placeholders** (`priceSource = PLACEHOLDER`, `npm run dev-prices`); the live site doesn't publish prices. The admin dashboard counts placeholders left to replace.
- Static pages (`/about`, `/contact`, `/terms`) live in `StaticPage`, seeded by `npm run seed-content` (wording needs owner/legal review).

## Storefront
- Landing page: hero, **news & updates** feed, category photo tiles; header category rail
- Category/subcategory browsing (empty categories hidden, 24 products per page), product page, breadcrumbs, per-page titles
- Photos shown whole on a white tile at fixed ratios (no cropping)
- One-click add to cart: variant preselected, quantity stepper, toast feedback; unpriced products can't be added
- Cart at `/cart` (old `/סל-קניות` redirects): add/update/remove, ₪35 minimum-order gate, guest cart via cookie. Cart and checkout always price at the **current** catalog price; deactivated/unpriced lines are set aside as unavailable
- Checkout → payment → confirmation, order numbers, snapshot line items
- Shared design system, `next/image`, mobile nav
- Header: cart badge + account link; footer: static pages + WhatsApp

## Customer accounts
- Phone + SMS OTP login (Twilio Verify) at `/login`, replacing email/password — no separate register step, one flow covers both new and returning customers
- First-time customers are asked for their name (and optional email) exactly once, at `/onboarding`, right after their first successful code verification
- Profile edit (name/email; phone is the fixed login identity), logout, order history with a one-click "reorder" that re-adds a past order's still-available items to the cart (`/sales-history`)
- Saved address book (`/addresses`): multiple labeled addresses per customer, one marked default; checkout prefills the default but always offers a one-off different address for that order, with an optional "save as new address" checkbox
- Guest cart merges into the customer's account on login: if they already have a cart from another device/session, quantities combine instead of one side being lost

## Admin panel (`/admin`)
- Login; dashboard (counts + "variants missing price") — owner only
- Categories CRUD with cascading `fullSlugPath` on rename/move
- Products + variants CRUD, image upload (JPG/PNG/WebP/GIF, ≤5MB; shared validator `src/server/media.ts`)
- **News & updates** (`/admin/news`, owner): posts with title, body, image, publish date, pinned/published — shown on the landing page
- Orders list/detail with role-aware status updates
- **Dispatch** (`/admin/dispatch`): open orders with payment badges, assign/unassign driver
- **My deliveries** (`/admin/my-deliveries`): driver's orders, payment status prominent, one-tap "delivered"
- **Staff** (`/admin/staff`): owner creates accounts by role, activate/deactivate (no self-deactivation)
- First owner via `npm run create-admin`

## Payments
- Provider abstraction `src/lib/payment/`; mock auto-approves. Tranzila provider + callback route `src/app/api/payment/tranzila/callback/route.ts` exist but are **unconfigured/unverified**; falls back to mock when `TRANZILA_TERMINAL` is empty.

## SMS (OTP login)
- Provider abstraction `src/lib/sms/`, mirroring the payment one. `twilioVerifyProvider` is the only implementation, live-configured (`TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`/`TWILIO_VERIFY_SERVICE_SID` in `.env`) and verified end-to-end with a real phone. Twilio Verify owns code generation, delivery, expiry, and wrong-attempt lockout; this app only tracks send timestamps (`OtpRequestLog`) for its own cooldown/hourly-cap.
