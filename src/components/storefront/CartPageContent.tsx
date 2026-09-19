import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { getCartSummary } from "@/lib/cart";
import { formatIls, MIN_ORDER_AGOROT } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
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
      <EmptyState
        icon={ShoppingCart}
        title="הסל שלך ריק"
        description="עדיין לא הוספת מוצרים לסל הקניות."
        action={
          <Link href="/">
            <Button variant="primary">חזרה לחנות</Button>
          </Link>
        }
        className="py-16"
      />
    );
  }

  const remainingAgorot = Math.max(0, MIN_ORDER_AGOROT - subtotalAgorot);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-display-md">סל קניות</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:items-start">
        <div className="flex flex-col gap-4 md:col-span-2">
          {items.map((item) => (
            <Card key={item.id} className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-semibold">{item.productVariant.product.name}</p>
                <p className="text-sm text-muted-foreground">{item.productVariant.name}</p>
                <p className="text-sm text-accent">{formatIls(item.unitPriceAgorot)}</p>
              </div>

              <div className="flex items-center gap-2">
                <form action={updateCartItemQuantity}>
                  <input type="hidden" name="cartItemId" value={item.id} />
                  <input type="hidden" name="quantity" value={item.quantity - 1} />
                  <Button type="submit" variant="secondary" size="icon-sm" aria-label="הפחת כמות">
                    −
                  </Button>
                </form>

                <span className="w-6 text-center">{item.quantity}</span>

                <form action={updateCartItemQuantity}>
                  <input type="hidden" name="cartItemId" value={item.id} />
                  <input type="hidden" name="quantity" value={item.quantity + 1} />
                  <Button type="submit" variant="secondary" size="icon-sm" aria-label="הוסף כמות">
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
            </Card>
          ))}
        </div>

        <Card className="flex flex-col gap-3 md:sticky md:top-20">
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
        </Card>
      </div>
    </div>
  );
}
