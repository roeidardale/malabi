# Overview

## The project
**Malabi** is a functional rebuild of [malabi-expres.co.il](https://www.malabi-expres.co.il/) (authorized by the site owner): a storefront + admin/dispatch panel for a delivery business in Ashkelon, Israel (alcohol, snacks, night deliveries). Hebrew, RTL, dark theme, brand accent `#FFC93F`.

Original pain points it solves: no worker dashboard, and drivers couldn't tell whether an order was paid.

**Status:** local-only, not deployed. Goal: take it to production (see [ROADMAP](ROADMAP.md)).

## Stack
- Next.js 16.3.5 (App Router, Turbopack), React 19, TypeScript, Tailwind v4
- PostgreSQL via Prisma 6.19.3 (pinned — see [BACKLOG](BACKLOG.md))
- Auth: `iron-session` cookies, two independent sessions (`malabi_customer_session`, `malabi_admin_session`), `bcryptjs`
- Payments: pluggable provider in `src/lib/payment/` — `mockProvider` (default) and `tranzilaProvider` (unverified)
- Money: integer **agorot** everywhere

## Layout
```
src/app/(storefront)/   customer site: browse, cart, checkout
src/app/admin/          admin panel, gated by src/proxy.ts
src/app/api/            route handlers (payment callback)
src/app/login|register|customer-profile|sales-history/   customer auth & account
src/lib/                money, cart, session, password, orderTransitions, payment/
src/server/actions/     server actions (auth, cart, checkout, admin-*)
prisma/                 schema + migrations
scripts/                create-admin, dev-seed, scrape/
```

## Data model (Prisma)
`AdminUser` (role, isActive), `Customer`, `Category` (self-referential tree), `Product`, `ProductVariant`, `CartSession`/`CartItem`, `Order`/`OrderItem` (+ `assignedDriverId`), `StaticPage`.

## Roles
| Role | Can do |
| --- | --- |
| `OWNER` | everything: dashboard, categories, products, orders, dispatch, staff |
| `DELIVERY_MANAGER` | orders + dispatch; may move PAID→PREPARING→OUT_FOR_DELIVERY (+CANCELLED) |
| `DRIVER` | own assigned deliveries only; may mark OUT_FOR_DELIVERY→DELIVERED |

Guard: `requireAdmin(allowedRoles?)` in `src/server/actions/admin-guard.ts`. Transition rules: `src/lib/orderTransitions.ts`. Role-mismatch redirects to that role's home (`ROLE_HOME`), never loops.

Order status flow: `PENDING_PAYMENT → PAID → PREPARING → OUT_FOR_DELIVERY → DELIVERED` (or `CANCELLED`).

## Environment (`.env`)
`DATABASE_URL`, `SESSION_SECRET`, `PAYMENT_PROVIDER` (`mock`|tranzila), `TRANZILA_TERMINAL`.

## Commands
`npm run dev | build | start | lint | create-admin | dev-seed | scrape` — details in root README.
