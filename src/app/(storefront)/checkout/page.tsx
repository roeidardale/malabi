import { redirect } from "next/navigation";
import { getCartSummary } from "@/lib/cart";
import { CART_PATH } from "@/lib/routes";
import { formatIls } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/session";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { Card } from "@/components/ui/card";

export default async function CheckoutPage() {
  const [{ items, unavailableItems, subtotalAgorot, meetsMinimum }, customerSession] = await Promise.all([
    getCartSummary(),
    getCustomerSession(),
  ]);

  if (items.length === 0 || unavailableItems.length > 0 || !meetsMinimum) {
    redirect(CART_PATH);
  }

  // Guest checkout stays fully supported: `customer` is null unless logged in,
  // and CheckoutForm renders the plain guest form in that case.
  const customer = customerSession.customerId
    ? await prisma.customer.findUnique({
        where: { id: customerSession.customerId },
        include: { addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] } },
      })
    : null;

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

      <CheckoutForm customer={customer} />
    </div>
  );
}
