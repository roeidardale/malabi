import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { tranzilaProvider } from "@/lib/payment/tranzilaProvider";

export async function GET(request: NextRequest) {
  const result = tranzilaProvider.verifyCallback(request.nextUrl.searchParams);

  const order = await prisma.order.findUnique({ where: { id: result.orderId } });
  if (!order) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (result.approved) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        paymentStatus: "APPROVED",
        paymentTransactionId: result.transactionId ?? null,
      },
    });
  } else {
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "DECLINED" },
    });
  }

  return NextResponse.redirect(new URL(`/checkout/confirmation/${order.id}`, request.url));
}
