"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getOrCreateCartSession } from "@/lib/cart";

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
