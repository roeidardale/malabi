# Malabi

A local, functional rebuild of [malabi-expres.co.il](https://www.malabi-expres.co.il/) (authorized by the site owner) — a storefront + admin panel for a delivery business in Ashkelon, Israel. Local-only, not deployed.

## Stack

- **Framework**: Next.js 16.3.5 (App Router, Turbopack), TypeScript, React 19
- **Database**: SQLite via Prisma 6.19.3
- **Auth**: `iron-session` cookies (separate customer and admin sessions), `bcryptjs` password hashing
- **Styling**: Tailwind v4, RTL Hebrew layout, dark theme
- **Payments**: pluggable provider (`src/lib/payment/`) — mock provider (auto-approve, default) and a Tranzila provider (built, unconfigured)

## Getting started

```bash
npm install
cp .env.example .env      # then fill in SESSION_SECRET etc.
npx prisma migrate dev
npm run dev-seed           # optional: seed sample data
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

## Project structure

```
src/app/(storefront)/   customer-facing site: browsing, cart, checkout
src/app/admin/          admin panel (categories, products, orders), gated by src/proxy.ts
src/app/api/            route handlers (e.g. payment callback)
src/app/login/          register/          customer auth
src/lib/                money, session, payment provider helpers
src/server/actions/     server actions (auth, cart, checkout, admin products)
prisma/                 schema + migrations (SQLite)
scripts/                create-admin, dev-seed, scrape
docs/                   project status, TODO, and upgrade notes
```

## Status

See [`docs/STATUS.md`](docs/STATUS.md) for what's built and how, and [`docs/TODO.md`](docs/TODO.md) for what's left (real prices, Tranzila payment setup, delivery fees, etc.).
