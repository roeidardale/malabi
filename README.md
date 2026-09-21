# Malabi

A local, functional rebuild of [malabi-expres.co.il](https://www.malabi-expres.co.il/) (authorized by the site owner) — a storefront + admin panel for a delivery business in Ashkelon, Israel. Local-only, not deployed.

## Stack

- **Framework**: Next.js 16.3.5 (App Router, Turbopack), TypeScript, React 19
- **Database**: PostgreSQL via Prisma 6.19.3
- **Auth**: `iron-session` cookies (separate customer and admin sessions), `bcryptjs` password hashing
- **Styling**: Tailwind v4, RTL Hebrew layout, dark theme
- **Payments**: pluggable provider (`src/lib/payment/`) — mock provider (auto-approve, default) and a Tranzila provider (built, unconfigured)

## Getting started

```bash
npm install
cp .env.example .env      # then fill in SESSION_SECRET etc.
docker compose up -d       # start local Postgres
npx prisma migrate dev
npm run dev-seed           # optional: seed sample data
npm run seed-content       # about/contact/terms pages + sample news
npm run create-admin       # create the first admin user
npm run dev
```

App runs at `http://localhost:3000`. Admin panel is at `/admin`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm run start` | Production build/serve |
| `npm run lint` | ESLint |
| `npm run create-admin` | Interactive CLI to create an admin user |
| `npm run dev-seed` | Seed local dev data |
| `npm run scrape` | Crawl the live site's public pages to (re)populate categories/products |
| `npm run backfill-variants` | Give variant-less products a default variant (so they can be ordered) |
| `npm run dev-prices` | DEV ONLY: placeholder prices for unpriced variants (`priceSource=PLACEHOLDER`) |
| `npm run category-images` | Download category photos/labels from the live site |
| `npm run check-media` | Audit that every product/category photo exists on disk |
| `npm run seed-content` | Seed static pages and sample news posts |
| `npm run e2e` | Playwright end-to-end suite (own DB + server on :3100; uses system Chromium or `npx playwright install chromium`) |

## Project structure

```
src/app/(storefront)/   customer-facing site: landing, browsing, /cart, checkout
src/app/admin/          admin panel (categories, products, news, orders, dispatch, staff), gated by src/proxy.ts
src/app/api/            route handlers (e.g. payment callback)
src/app/login/          register/          customer auth
src/lib/                money, session, payment provider helpers
src/server/actions/     server actions (auth, cart, checkout, admin products)
prisma/                 schema + migrations (PostgreSQL)
scripts/                create-admin, dev-seed, scrape
e2e/                    Playwright specs + isolated test DB seed
docs/                   overview, features, roadmap, issues, backlog, changelog
```

## Status

Docs live in [`docs/`](docs/README.md): start with the index, then follow [`docs/ROADMAP.md`](docs/ROADMAP.md) to production.
