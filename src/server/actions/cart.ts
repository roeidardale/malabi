"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getOrCreateCartSession } from "@/lib/cart";
import { requireCustomer } from "./customer-guard";

function readString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.length > 0 ? value : null;
}

const MAX_QUANTITY_PER_ADD = 99;

export type AddToCartResult =
  | { ok: true; itemCount: number }
  | { ok: false; error: string };

export async function addToCart(variantId: string, quantity: number): Promise<AddToCartResult> {
  const safeQuantity = Number.isFinite(quantity)
    ? Math.min(MAX_QUANTITY_PER_ADD, Math.max(1, Math.floor(quantity)))
    : 1;

  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: { select: { isActive: true } } },
  });
  if (!variant || !variant.isActive || !variant.product.isActive) {
    return { ok: false, error: "המוצר אינו זמין כרגע" };
  }
  if (variant.priceAgorot <= 0) {
    return { ok: false, error: "אין עדיין מחיר למוצר זה" };
  }

  const session = await getOrCreateCartSession();

  await prisma.cartItem.upsert({
    where: {
      cartSessionId_productVariantId: {
        cartSessionId: session.id,
        productVariantId: variantId,
      },
    },
    update: {
      quantity: { increment: safeQuantity },
      unitPriceAgorot: variant.priceAgorot,
    },
    create: {
      cartSessionId: session.id,
      productVariantId: variantId,
      quantity: safeQuantity,
      unitPriceAgorot: variant.priceAgorot,
    },
  });

  const { _sum } = await prisma.cartItem.aggregate({
    where: { cartSessionId: session.id },
    _sum: { quantity: true },
  });

  revalidatePath("/", "layout");
  return { ok: true, itemCount: _sum.quantity ?? 0 };
}

export async function updateCartItemQuantity(formData: FormData) {
  const cartItemId = readString(formData, "cartItemId");
  if (!cartItemId) return;

  const quantity = Number(formData.get("quantity"));
  const session = await getOrCreateCartSession();

  if (!Number.isFinite(quantity) || quantity <= 0) {
    await prisma.cartItem.deleteMany({
      where: { id: cartItemId, cartSessionId: session.id },
    });
  } else {
    await prisma.cartItem.updateMany({
      where: { id: cartItemId, cartSessionId: session.id },
      data: { quantity: Math.floor(quantity) },
    });
  }

  revalidatePath("/", "layout");
}

export async function removeCartItem(formData: FormData) {
  const cartItemId = readString(formData, "cartItemId");
  if (!cartItemId) return;

  const session = await getOrCreateCartSession();

  await prisma.cartItem.deleteMany({
    where: { id: cartItemId, cartSessionId: session.id },
  });

  revalidatePath("/", "layout");
}

export type ReorderResult =
  | { ok: true; addedCount: number; unavailableCount: number }
  | { ok: false; error: string };

/** Re-adds a past order's items to the current cart, same upsert-with-increment shape as addToCart. */
export async function reorderFromOrder(orderId: string): Promise<ReorderResult> {
  const customer = await requireCustomer();

  const order = await prisma.order.findUnique({
    where: { id: orderId, customerId: customer.id },
    include: { items: { include: { productVariant: { include: { product: true } } } } },
  });
  if (!order) {
    return { ok: false, error: "ההזמנה לא נמצאה" };
  }

  const session = await getOrCreateCartSession();
  let addedCount = 0;
  let unavailableCount = 0;

  for (const item of order.items) {
    const variant = item.productVariant;
    if (!variant || !variant.isActive || !variant.product.isActive || variant.priceAgorot <= 0) {
      unavailableCount += 1;
      continue;
    }

    await prisma.cartItem.upsert({
      where: {
        cartSessionId_productVariantId: {
          cartSessionId: session.id,
          productVariantId: variant.id,
        },
      },
      update: {
        quantity: { increment: item.quantity },
        unitPriceAgorot: variant.priceAgorot,
      },
      create: {
        cartSessionId: session.id,
        productVariantId: variant.id,
        quantity: item.quantity,
        unitPriceAgorot: variant.priceAgorot,
      },
    });
    addedCount += 1;
  }

  revalidatePath("/", "layout");
  return { ok: true, addedCount, unavailableCount };
}
