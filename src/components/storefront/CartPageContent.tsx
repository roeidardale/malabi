import Link from "next/link";
import { getCartSummary } from "@/lib/cart";
import { formatIls, MIN_ORDER_AGOROT } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { removeCartItem, updateCartItemQuantity } from "@/server/actions/cart";

/**
 * Shared cart page body, rendered both from the dedicated
 * `/סל-קניות` route and as a fallback from the `[...slug]` catch-all (see
 * the comment there for why the fallback exists).
 */
export async function CartPageContent() {
  const { items, subtotalAgorot, meetsMinimum } = await getCartSummary();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-2xl font-bold">הסל שלך ריק</h1>
        <p className="text-muted">עדיין לא הוספת מוצרים לסל הקניות.</p>
        <Link href="/">
          <Button variant="primary">חזרה לחנות</Button>
        </Link>
      </div>
    );
  }

  const remainingAgorot = Math.max(0, MIN_ORDER_AGOROT - subtotalAgorot);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">סל קניות</h1>

      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-surface p-4"
          >
            <div>
              <p className="font-semibold">{item.productVariant.product.name}</p>
              <p className="text-sm text-muted">{item.productVariant.name}</p>
              <p className="text-sm text-accent">{formatIls(item.unitPriceAgorot)}</p>
            </div>

            <div className="flex items-center gap-2">
              <form action={updateCartItemQuantity}>
                <input type="hidden" name="cartItemId" value={item.id} />
                <input type="hidden" name="quantity" value={item.quantity - 1} />
                <Button type="submit" variant="secondary" className="h-8 w-8 p-0" aria-label="הפחת כמות">
                  −
                </Button>
              </form>

              <span className="w-6 text-center">{item.quantity}</span>

              <form action={updateCartItemQuantity}>
                <input type="hidden" name="cartItemId" value={item.id} />
                <input type="hidden" name="quantity" value={item.quantity + 1} />
                <Button type="submit" variant="secondary" className="h-8 w-8 p-0" aria-label="הוסף כמות">
                  +
                </Button>
              </form>

              <form action={removeCartItem}>
                <input type="hidden" name="cartItemId" value={item.id} />
                <Button type="submit" variant="ghost" className="text-danger">
                  הסר
                </Button>
              </form>
            </div>

            <p className="font-semibold">{formatIls(item.unitPriceAgorot * item.quantity)}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
        <div className="flex items-center justify-between text-lg font-semibold">
          <span>סה&quot;כ לתשלום</span>
          <span>{formatIls(subtotalAgorot)}</span>
        </div>

        {meetsMinimum ? (
          <p className="text-sm text-accent">✓ ההזמנה עומדת בתנאי המינימום</p>
        ) : (
          <p className="text-sm text-danger">
            עוד {formatIls(remainingAgorot)} להזמנה מינימלית (מינימום {formatIls(MIN_ORDER_AGOROT)})
          </p>
        )}

        {meetsMinimum ? (
          <Link href="/checkout">
            <Button variant="primary" className="w-full">
              המשך לתשלום
            </Button>
          </Link>
        ) : (
          <Button variant="primary" disabled className="w-full">
            המשך לתשלום
          </Button>
        )}
      </div>
    </div>
  );
}
