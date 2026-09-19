import { redirect, notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatIls } from "@/lib/money";
import { getActivePaymentProvider } from "@/lib/payment";
import { approveMockPayment } from "@/server/actions/checkout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
      <h1 className="text-display-md">תשלום להזמנה #{order.orderNumber}</h1>

      <Card>
        <p className="text-muted-foreground">סכום לתשלום</p>
        <p className="text-3xl font-bold text-accent">{formatIls(order.totalAgorot)}</p>
      </Card>

      {payment.mode === "mock" && (
        <Card className="text-center">
          <p className="mb-4 text-muted-foreground">
            מצב פיתוח: אין חיבור אמיתי לסליקה. לחצו לאישור תשלום מדומה כדי להשלים את ההזמנה.
          </p>
          <form action={approveMockPayment.bind(null, order.id)}>
            <Button type="submit" className="w-full">
              אשר תשלום (מדומה)
            </Button>
          </form>
        </Card>
      )}

      {payment.mode === "tranzila" && payment.iframeUrl && (
        <Card className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-4 text-accent" />
            <span>תשלום מאובטח</span>
          </div>
          <div className="overflow-hidden rounded-md bg-white p-1">
            <iframe
              src={payment.iframeUrl}
              title="תשלום מאובטח"
              className="h-[600px] w-full rounded-sm"
            />
          </div>
        </Card>
      )}
    </div>
  );
}
