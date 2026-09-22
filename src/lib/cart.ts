import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { MIN_ORDER_AGOROT } from "@/lib/money";

const CART_COOKIE_NAME = "malabi_cart_token";
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const cartInclude = {
  items: {
    include: {
      productVariant: {
        include: { product: true },
      },
    },
    orderBy: { createdAt: "asc" as const },
  },
};

/**
 * Looks up the cart for the current visitor without creating anything. Safe to
 * call while rendering (layouts/pages), where cookies cannot be written.
 */
export async function findCartSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CART_COOKIE_NAME)?.value;
  if (!token) return null;

  return prisma.cartSession.findUnique({
    where: { token },
    include: cartInclude,
  });
}

/**
 * Finds the visitor's cart, or creates one and sets the cookie. Only call this
 * from a Server Action or Route Handler: cookies are read-only during render,
 * and creating a row there would leave an orphan session on every page view.
 */
export async function getOrCreateCartSession() {
  const existing = await findCartSession();
  if (existing) return existing;

  const token = crypto.randomUUID();
  const session = await prisma.cartSession.create({
    data: { token },
    include: cartInclude,
  });

  const cookieStore = await cookies();
  cookieStore.set(CART_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: CART_COOKIE_MAX_AGE,
    path: "/",
  });

  return session;
}

/**
 * Links the current guest cart session (identified by the cart cookie) to a
 * newly authenticated customer, so items added before login survive into
 * their account -- and merges it with any cart the customer already has from
 * a prior login elsewhere, instead of orphaning one side. Call this right
 * after setting the customer session cookie in a Server Action (login).
 */
export async function associateCartWithCustomer(customerId: string) {
  const current = await findCartSession();
  const priorSessions = await prisma.cartSession.findMany({
    where: { customerId, ...(current ? { id: { not: current.id } } : {}) },
    include: cartInclude,
  });

  if (!current) {
    // No guest cart on this device/browser -- if the customer already has a
    // cart from elsewhere, surface it here by adopting its cookie.
    const [prior] = priorSessions;
    if (prior) {
      const cookieStore = await cookies();
      cookieStore.set(CART_COOKIE_NAME, prior.token, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: CART_COOKIE_MAX_AGE,
        path: "/",
      });
    }
    return;
  }

  if (current.customerId && current.customerId !== customerId) {
    // Shared-device edge case: this cookie's cart already belongs to a
    // different customer. Don't risk mixing carts -- leave it alone.
    return;
  }

  await prisma.$transaction(async (tx) => {
    // Tracks merged quantities as we go (not just current.items' initial
    // snapshot), so two prior sessions sharing a variant merge correctly
    // instead of racing to create() the same (cartSessionId, variant) row.
    const merged = new Map(current.items.map((i) => [i.productVariantId, { id: i.id, quantity: i.quantity }]));

    for (const prior of priorSessions) {
      for (const item of prior.items) {
        const existing = merged.get(item.productVariantId);
        if (existing) {
          const updated = await tx.cartItem.update({
            where: { id: existing.id },
            data: { quantity: existing.quantity + item.quantity },
          });
          merged.set(item.productVariantId, { id: updated.id, quantity: updated.quantity });
        } else {
          const created = await tx.cartItem.create({
            data: {
              cartSessionId: current.id,
              productVariantId: item.productVariantId,
              quantity: item.quantity,
              unitPriceAgorot: item.unitPriceAgorot,
            },
          });
          merged.set(item.productVariantId, { id: created.id, quantity: created.quantity });
        }
      }
      await tx.cartSession.delete({ where: { id: prior.id } });
    }

    if (current.customerId !== customerId) {
      await tx.cartSession.update({ where: { id: current.id }, data: { customerId } });
    }
  });
}

type PriceableItem = {
  quantity: number;
  unitPriceAgorot: number;
  productVariant: { isActive: boolean; priceAgorot: number; product: { isActive: boolean } };
};

/**
 * Prices a cart at today's catalog prices. `CartItem.unitPriceAgorot` is only
 * the price at the moment of adding; trusting it would charge stale prices
 * after an admin edit. Lines whose variant/product was deactivated, or that
 * have no price, come back as `unavailable` and never count toward totals.
 */
export function priceCartItems<T extends PriceableItem>(items: T[]) {
  const available: T[] = [];
  const unavailable: T[] = [];

  for (const item of items) {
    const { productVariant } = item;
    if (!productVariant.isActive || !productVariant.product.isActive || productVariant.priceAgorot <= 0) {
      unavailable.push(item);
    } else {
      available.push({ ...item, unitPriceAgorot: productVariant.priceAgorot });
    }
  }

  const subtotalAgorot = available.reduce((sum, item) => sum + item.unitPriceAgorot * item.quantity, 0);
  return { available, unavailable, subtotalAgorot };
}

export async function getCartSummary() {
  const session = await findCartSession();
  const { available, unavailable, subtotalAgorot } = priceCartItems(session?.items ?? []);
  const itemCount = available.reduce((sum, item) => sum + item.quantity, 0);

  return {
    session,
    items: available,
    unavailableItems: unavailable,
    subtotalAgorot,
    itemCount,
    meetsMinimum: subtotalAgorot >= MIN_ORDER_AGOROT,
  };
}
