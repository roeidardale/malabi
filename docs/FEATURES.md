# What's built

## Catalog & content
- Scraper (`npm run scrape`, respects robots.txt) populated **57 categories, 430 products, 89 variants, 410 images** (`public/media/products/`).
- All variant prices are **₪0 placeholders** (live pricing endpoint is disallowed by robots.txt).
- Static pages (about/contact/terms) served from `StaticPage` via catch-all router.

## Storefront
- Home, category/subcategory browsing, product page with variants, breadcrumbs
- Cart: add/update/remove, ₪35 minimum-order gate, guest cart via cookie
- Checkout → payment → confirmation, order numbers, snapshot line items
- Shared design system, `next/image`, mobile nav
- Header: cart badge + account link; footer: static pages + WhatsApp

## Customer accounts
- Email/password register, login, logout, profile edit, order history (`/sales-history`)
- Guest cart attaches to customer on login/register

## Admin panel (`/admin`)
- Login; dashboard (counts + "variants missing price") — owner only
- Categories CRUD with cascading `fullSlugPath` on rename/move
- Products + variants CRUD, image upload
- Orders list/detail with role-aware status updates
- **Dispatch** (`/admin/dispatch`): open orders with payment badges, assign/unassign driver
- **My deliveries** (`/admin/my-deliveries`): driver's orders, payment status prominent, one-tap "delivered"
- **Staff** (`/admin/staff`): owner creates accounts by role, activate/deactivate (no self-deactivation)
- First owner via `npm run create-admin`

## Payments
- Provider abstraction `src/lib/payment/`; mock auto-approves. Tranzila provider + callback route `src/app/api/payment/tranzila/callback/route.ts` exist but are **unconfigured/unverified**; falls back to mock when `TRANZILA_TERMINAL` is empty.
