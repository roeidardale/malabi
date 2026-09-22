# Backlog (not blocking launch)

Roughly by value for effort.

## Worth doing soon after launch
- **Admin variant editor**: one client-managed multi-row form instead of a form per row.
- **Category/product ordering UI**: `sortOrder` exists but is a plain number field; add drag-and-drop/bulk reorder.
- **Order notifications**: notify customer on status change (WhatsApp deep link, SMS, or email); site already leans on WhatsApp. Could reuse `src/lib/sms/` now that a live Twilio account exists.
- **Admin products pagination** once catalog grows.
- **Phone-number-change flow** for customers — `/customer-profile` shows phone read-only today since it's the login identity; changing it would need its own verify-the-new-number sub-flow.
- **Resend-cooldown countdown UI** on `/login` — the 60s cooldown is enforced server-side today with a plain error message, no client-side timer.
- **Automated e2e coverage of the real OTP round-trip** via Twilio test credentials/magic numbers, if that becomes worth the setup — see [KNOWN-ISSUES](KNOWN-ISSUES.md) #10.

## Longer-term
- **Prisma major upgrade**: pinned to 6.19.3 because `latest` pointed at an 8.x RC with a vulnerable dev-tooling chain and a new driver-adapter config (`prisma.config.ts`). Revisit when 7/8 stabilize.
- **Full RBAC** only if per-permission ACLs are ever required.
