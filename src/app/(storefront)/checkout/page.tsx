import { redirect } from "next/navigation";
import { getCartSummary } from "@/lib/cart";
import { formatIls } from "@/lib/money";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { Card } from "@/components/ui/card";

export default async function CheckoutPage() {
  const { items, subtotalAgorot, meetsMinimum } = await getCartSummary();

  if (items.length === 0 || !meetsMinimum) {
    redirect(encodeURI("/סל-קניות"));
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8">
      <h1 className="text-display-md">פרטי משלוח ותשלום</h1>

      <Card>
        <h2 className="mb-3 text-heading">סיכום הזמנה</h2>
        <ul className="flex flex-col gap-2 text-sm">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between text-muted-foreground">
              <span>
                {item.productVariant.product.name} — {item.productVariant.name} × {item.quantity}
              </span>
              <span className="text-foreground">{formatIls(item.unitPriceAgorot * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 font-bold">
          <span>סה&quot;כ</span>
          <span className="text-accent">{formatIls(subtotalAgorot)}</span>
        </div>
      </Card>

      <CheckoutForm />
    </div>
  );
}
