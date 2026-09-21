# Roadmap to production

Work top to bottom. `[ ]` open, `[x]` done. Items tagged **(client)** need input from the business owner.

## Phase 0 — Local setup sanity
- [ ] Create first owner: `npm run create-admin`
- [x] Re-scrape or hand-add empty categories: `אלכוהול/וודקה`, `וויסקי`, `ליקרים`
- [x] Decide category alias ownership (some branches show 0 direct products — see [KNOWN-ISSUES](KNOWN-ISSUES.md))

## Phase 1 — Real catalog data  *(blocks any real use)*
- [ ] Get price export **(client)**
- [ ] Write `scripts/import-prices.ts` (match on `Product.sourceProductKey` / `ProductVariant.sourceOptionValue`); fallback: type prices via `/admin/products/[id]`
- [ ] Verify dashboard "variants missing a price" reaches 0

## Phase 2 — Business rules
- [ ] Delivery fee: replace hardcoded `DELIVERY_FEE_AGOROT = 0` in `src/lib/money.ts` (flat fee vs zones) **(client)**
- [ ] Business hours (~09:30–24:00): setting + checkout check + display on site **(client)**
- [ ] Cart merge on login (currently last-guest-cart-wins)

## Phase 3 — Customer phone login + addresses
- [ ] Choose SMS vendor **(client)**
- [ ] Pluggable SMS provider (mirror `src/lib/payment/`)
- [ ] Phone + OTP login replacing email/password
- [ ] `Address` model + saved-address book, used in checkout

## Phase 4 — Real payments
- [ ] Get Tranzila sandbox terminal, set `TRANZILA_TERMINAL` **(client)**
- [ ] Verify iframe params + callback field names in `src/lib/payment/tranzilaProvider.ts` against current Tranzila docs
- [ ] Test approve **and** decline round-trip via callback route
- [ ] Confirm Apple Pay / Google Pay enabled on terminal
- [ ] Callback: verify authenticity + idempotency (no double-marking PAID)

## Phase 5 — Hardening (pre-launch)
- [ ] Rate limiting on `registerCustomer` / `loginCustomer` / `loginAdmin` (and OTP once added)
- [ ] Input validation + upload restrictions (type/size) audit; server-action authz audit
- [ ] Sanitize `StaticPage.bodyHtml` if editors become less trusted
- [ ] Automated tests: unit (`money.ts`, cart subtotal/minimum), Playwright guest checkout + admin CRUD
- [ ] Run `npm run lint` and `npm run build` clean
- [ ] Security review pass (`/security-review`)

## Phase 6 — Go-live
- [ ] Choose hosting + managed Postgres **(client/you)**
- [ ] Production env/secrets (strong `SESSION_SECRET`, `PAYMENT_PROVIDER=tranzila`, prod `DATABASE_URL`)
- [ ] `prisma migrate deploy` on prod; seed catalog + prices; create owner
- [ ] Domain, HTTPS, secure cookies verified
- [ ] Backups + error monitoring
- [ ] Legal pages reviewed (terms, privacy) **(client)**
- [ ] Smoke test full order on prod with a real small payment; then launch

## Out of scope
- Full permission-matrix RBAC (three-role model is intentional)
