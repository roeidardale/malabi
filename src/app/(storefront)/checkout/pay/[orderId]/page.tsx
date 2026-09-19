import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatIls } from "@/lib/money";
import { getActivePaymentProvider } from "@/lib/payment";
import { approveMockPayment } from "@/server/actions/checkout";
import { Button } from "@/components/ui/Button";

export default async function PayPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    notFound();
  }

  if (order.status !== "PENDING_PAYMENT") {
    redirect(`/checkout/confirmation/${order.id}`);
  }

  const provider = getActivePaymentProvider();
  const payment = await provider.createPayment(order);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <h1 className="text-2xl font-bold">תשלום להזמנה #{order.orderNumber}</h1>

      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="text-muted">סכום לתשלום</p>
        <p className="text-3xl font-bold text-accent">{formatIls(order.totalAgorot)}</p>
      </div>

      {payment.mode === "mock" && (
        <div className="rounded-lg border border-border bg-surface p-6 text-center">
          <p className="mb-4 text-muted">
            מצב פיתוח: אין חיבור אמיתי לסליקה. לחצו לאישור תשלום מדומה כדי להשלים את ההזמנה.
          </p>
          <form action={approveMockPayment.bind(null, order.id)}>
            <Button type="submit" className="w-full">
              אשר תשלום (מדומה)
            </Button>
          </form>
        </div>
      )}

      {payment.mode === "tranzila" && payment.iframeUrl && (
        <div className="overflow-hidden rounded-lg border border-border">
          <iframe
            src={payment.iframeUrl}
            title="תשלום מאובטח"
            className="h-[600px] w-full bg-white"
          />
        </div>
      )}
    </div>
  );
}
