# Roadmap to production

Work top to bottom. `[ ]` open, `[x]` done. Items tagged **(client)** need input from the business owner.

## Phase 0 — Local setup sanity
- [ ] Create first owner: `npm run create-admin`
- [x] Re-scrape or hand-add empty categories: `אלכוהול/וודקה`, `וויסקי`, `ליקרים`
- [x] Decide category alias ownership (some branches show 0 direct products — see [KNOWN-ISSUES](KNOWN-ISSUES.md))

## Phase 1 — Real catalog data  *(blocks any real use)*
- [ ] Get price export **(client)** — sent as `malabi-price-report-for-client.xlsx` for confirmation; awaiting reply
- [x] Write `scripts/import-prices.ts` — matches CSV rows to the catalog by category/product/variant name (the price report has no `sourceProductKey`/`sourceOptionValue`); defaults to a dry run, `--apply` to write. **Not run yet** — waiting on the client's confirmed prices back; fallback: type prices via `/admin/products/[id]`
- [ ] Replace dev placeholder prices (dashboard "מחירי דמו להחלפה" must reach 0; `npm run dev-prices` is DEV ONLY)
- [ ] Verify dashboard "variants missing a price" reaches 0

## Phase 2 — Business rules
- [ ] Delivery fee: replace hardcoded `DELIVERY_FEE_AGOROT = 0` in `src/lib/money.ts` (flat fee vs zones) **(client)**
- [ ] Business hours (~09:30–24:00): setting + checkout check + display on site **(client)**
- [x] Cart merge on login — `associateCartWithCustomer` in `src/lib/cart.ts` now merges a prior cart (from another device/session) into the current one instead of orphaning it

## Phase 3 — Customer phone login + addresses
- [x] Choose SMS vendor **(client)** — Twilio Verify, live account configured
- [x] Pluggable SMS provider (`src/lib/sms/`, mirrors `src/lib/payment/`'s shape)
- [x] Phone + OTP login replacing email/password (`src/server/actions/customer-auth.ts`); name/email asked once via `/onboarding`
- [x] `Address` model + saved-address book (`/addresses`), used in checkout (default prefill + per-order override + reorder from `/sales-history`)

## Phase 4 — Real payments
- [ ] Get Tranzila sandbox terminal, set `TRANZILA_TERMINAL` **(client)**
- [ ] Verify iframe params + callback field names in `src/lib/payment/tranzilaProvider.ts` against current Tranzila docs
- [ ] Test approve **and** decline round-trip via callback route
- [ ] Confirm Apple Pay / Google Pay enabled on terminal
- [ ] Callback: verify authenticity + idempotency (no double-marking PAID)

## Phase 5 — Hardening (pre-launch)
- [ ] Rate limiting on `loginAdmin` and `requestOtp`/`verifyOtp` — OTP sends already have a phone-scoped cooldown + hourly cap (`OtpRequestLog`); still no IP-based/global throttling anywhere
- [ ] Input validation + upload restrictions (type/size) audit; server-action authz audit
- [ ] Sanitize `StaticPage.bodyHtml` if editors become less trusted
- [x] Playwright e2e: guest checkout, cart pricing, admin news CRUD (`npm run e2e`)
- [ ] Unit tests (`money.ts`, cart subtotal/minimum) and e2e for the rest of admin CRUD
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
