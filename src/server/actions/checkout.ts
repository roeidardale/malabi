"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getOrCreateCartSession, priceCartItems } from "@/lib/cart";
import { getCustomerSession } from "@/lib/session";
import { MIN_ORDER_AGOROT, DELIVERY_FEE_AGOROT, DEFAULT_DELIVERY_CITY } from "@/lib/money";
import { getActivePaymentProvider } from "@/lib/payment";
import { upsertCustomerAddress } from "@/lib/addresses";

export interface CheckoutActionState {
  error?: string;
}

const checkoutSchema = z
  .object({
    customerName: z.string().trim().min(1, "יש להזין שם מלא"),
    customerPhone: z.string().trim().min(1, "יש להזין מספר טלפון"),
    customerEmail: z.email("כתובת אימייל לא תקינה").optional().or(z.literal("")),
    // Either a saved address is selected, or free-text street/city are filled in.
    selectedAddressId: z.string().trim().optional().or(z.literal("")),
    deliveryStreet: z.string().trim().optional().or(z.literal("")),
    deliveryCity: z.string().trim().optional().or(z.literal("")),
    deliveryNotes: z.string().trim().optional().or(z.literal("")),
    saveAsNewAddress: z.string().optional(),
    newAddressLabel: z.string().trim().optional().or(z.literal("")),
  })
  .refine((data) => Boolean(data.selectedAddressId) || Boolean(data.deliveryStreet), {
    message: "יש להזין כתובת למשלוח",
    path: ["deliveryStreet"],
  });

async function nextOrderNumber(tx: Prisma.TransactionClient) {
  const last = await tx.order.findFirst({ orderBy: { orderNumber: "desc" } });
  return (last?.orderNumber ?? 1000) + 1;
}

export async function createOrderFromCart(
  _prevState: CheckoutActionState | undefined,
  formData: FormData,
): Promise<CheckoutActionState> {
  const parsed = checkoutSchema.safeParse({
    customerName: formData.get("customerName"),
    customerPhone: formData.get("customerPhone"),
    customerEmail: formData.get("customerEmail") ?? "",
    selectedAddressId: formData.get("selectedAddressId") ?? "",
    deliveryStreet: formData.get("deliveryStreet") ?? "",
    deliveryCity: formData.get("deliveryCity") || DEFAULT_DELIVERY_CITY,
    deliveryNotes: formData.get("deliveryNotes") ?? "",
    saveAsNewAddress: formData.get("saveAsNewAddress") ?? undefined,
    newAddressLabel: formData.get("newAddressLabel") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "הפרטים שהוזנו אינם תקינים" };
  }

  const cartSession = await getOrCreateCartSession();
  if (cartSession.items.length === 0) {
    return { error: "הסל שלך ריק" };
  }

  const { available: items, unavailable, subtotalAgorot } = priceCartItems(cartSession.items);
  if (unavailable.length > 0) {
    return { error: "חלק מהמוצרים בסל אינם זמינים כרגע. חזרו לסל והסירו אותם כדי להמשיך." };
  }

  if (subtotalAgorot < MIN_ORDER_AGOROT) {
    return { error: "לא הגעת לסכום ההזמנה המינימלי" };
  }

  const customerSession = await getCustomerSession();
  const data = parsed.data;

  let deliveryStreet = data.deliveryStreet || "";
  let deliveryCity = data.deliveryCity || DEFAULT_DELIVERY_CITY;
  let addressId: string | null = null;

  if (data.selectedAddressId) {
    if (!customerSession.customerId) {
      return { error: "יש להתחבר כדי להשתמש בכתובת שמורה" };
    }
    const address = await prisma.address.findUnique({
      where: { id: data.selectedAddressId, customerId: customerSession.customerId },
    });
    if (!address) {
      return { error: "הכתובת שנבחרה לא נמצאה" };
    }
    deliveryStreet = address.street;
    deliveryCity = address.city;
    addressId = address.id;
  } else if (data.saveAsNewAddress === "on" && customerSession.customerId) {
    const created = await upsertCustomerAddress(customerSession.customerId, {
      label: data.newAddressLabel || "כתובת שמורה",
      street: deliveryStreet,
      city: deliveryCity,
    });
    addressId = created.id;
  }

  const order = await prisma.$transaction(async (tx) => {
    const orderNumber = await nextOrderNumber(tx);
    const totalAgorot = subtotalAgorot + DELIVERY_FEE_AGOROT;

    const created = await tx.order.create({
      data: {
        orderNumber,
        customerId: customerSession.customerId ?? null,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail || null,
        deliveryStreet,
        deliveryCity,
        deliveryNotes: data.deliveryNotes || null,
        addressId,
        subtotalAgorot,
        deliveryFeeAgorot: DELIVERY_FEE_AGOROT,
        totalAgorot,
        items: {
          create: items.map((item) => ({
            productVariantId: item.productVariantId,
            productNameSnapshot: item.productVariant.product.name,
            variantNameSnapshot: item.productVariant.name,
            quantity: item.quantity,
            unitPriceAgorot: item.unitPriceAgorot,
            lineTotalAgorot: item.unitPriceAgorot * item.quantity,
          })),
        },
      },
      include: { items: true },
    });

    await tx.cartItem.deleteMany({ where: { cartSessionId: cartSession.id } });

    return created;
  });

  const provider = getActivePaymentProvider();
  await provider.createPayment(order);

  // The cart is now empty -- refresh the shared storefront layout (cart
  // badge) so it doesn't keep showing the pre-checkout item count across the
  // checkout -> pay -> confirmation client-side transitions.
  revalidatePath("/", "layout");

  redirect(`/checkout/pay/${order.id}`);
}

export async function approveMockPayment(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.status !== "PENDING_PAYMENT") {
    redirect(`/checkout/confirmation/${orderId}`);
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "PAID",
      paymentStatus: "APPROVED",
      paymentProvider: "mock",
      paymentTransactionId: `mock_${Date.now()}`,
    },
  });

  redirect(`/checkout/confirmation/${orderId}`);
}
