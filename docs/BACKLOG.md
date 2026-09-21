# Backlog (not blocking launch)

Roughly by value for effort.

## Worth doing soon after launch
- **Admin variant editor**: one client-managed multi-row form instead of a form per row.
- **Category/product ordering UI**: `sortOrder` exists but is a plain number field; add drag-and-drop/bulk reorder.
- **Order notifications**: notify customer on status change (WhatsApp deep link, SMS, or email); site already leans on WhatsApp.
- **Admin products pagination** once catalog grows.

## Longer-term
- **Prisma major upgrade**: pinned to 6.19.3 because `latest` pointed at an 8.x RC with a vulnerable dev-tooling chain and a new driver-adapter config (`prisma.config.ts`). Revisit when 7/8 stabilize.
- **Full RBAC** only if per-permission ACLs are ever required.
