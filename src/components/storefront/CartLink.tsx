import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { CART_PATH } from "@/lib/routes";

/** Header cart button. Always visible (mobile and desktop) with a live item count. */
export function CartLink({ itemCount }: { itemCount: number }) {
  return (
    <Link
      href={CART_PATH}
      aria-label={itemCount > 0 ? `סל קניות, ${itemCount} פריטים` : "סל קניות"}
      className="relative inline-flex h-10 items-center gap-2 rounded-md border border-border bg-surface-deep px-3 text-sm text-foreground transition-colors hover:border-accent"
    >
      <ShoppingCart className="size-5" aria-hidden />
      <span className="hidden sm:inline">סל קניות</span>
      {itemCount > 0 && (
        <span
          data-testid="cart-count"
          className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-accent-foreground"
        >
          {itemCount}
        </span>
      )}
    </Link>
  );
}
