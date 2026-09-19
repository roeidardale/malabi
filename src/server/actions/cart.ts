"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getOrCreateCartSession } from "@/lib/cart";

function readString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.length > 0 ? value : null;
}

export async function addToCart(formData: FormData) {
  const variantId = readString(formData, "variantId");
  if (!variantId) return;

  const quantityRaw = Number(formData.get("quantity"));
  const quantity = Number.isFinite(quantityRaw) && quantityRaw > 0 ? Math.floor(quantityRaw) : 1;

  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
  });
  if (!variant || !variant.isActive) return;

  const session = await getOrCreateCartSession();

  const existing = await prisma.cartItem.findUnique({
    where: {
      cartSessionId_productVariantId: {
        cartSessionId: session.id,
        productVariantId: variantId,
      },
    },
  });

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: {
        quantity: existing.quantity + quantity,
        unitPriceAgorot: variant.priceAgorot,
      },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartSessionId: session.id,
        productVariantId: variantId,
        quantity,
        unitPriceAgorot: variant.priceAgorot,
      },
    });
  }

  revalidatePath("/", "layout");
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
