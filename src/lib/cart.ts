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
 * Reads the `malabi_cart_token` cookie, finds (or creates) the matching
 * CartSession row, and returns it with items -> productVariant -> product
 * included so callers can render without extra queries.
 *
 * Note: setting a cookie is only allowed while handling a Server Action or
 * Route Handler. When this is called during a plain Server Component render
 * (e.g. from the storefront layout to compute the cart badge) the cookie
 * write is a no-op wrapped in try/catch -- the session still exists in the
 * DB, and the cookie gets persisted on the next request that goes through a
 * Server Action (e.g. the first "add to cart" click).
 */
export async function getOrCreateCartSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CART_COOKIE_NAME)?.value;

  if (token) {
    const existing = await prisma.cartSession.findUnique({
      where: { token },
      include: cartInclude,
    });
    if (existing) return existing;
  }

  const newToken = crypto.randomUUID();
  const session = await prisma.cartSession.create({
    data: { token: newToken },
    include: cartInclude,
  });

  try {
    cookieStore.set(CART_COOKIE_NAME, newToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: CART_COOKIE_MAX_AGE,
      path: "/",
    });
  } catch {
    // Cookies can only be mutated inside a Server Action or Route Handler.
    // Safe to ignore here; see doc comment above.
  }

  return session;
}

/**
 * Links the current guest cart session (identified by the cart cookie) to a
 * newly authenticated customer, so items added before login/registration
 * survive into their account. Call this right after setting the customer
 * session cookie in a Server Action (register/login).
 */
export async function associateCartWithCustomer(customerId: string) {
  const session = await getOrCreateCartSession();
  if (session.customerId === customerId) return;

  await prisma.cartSession.update({
    where: { id: session.id },
    data: { customerId },
  });
}

export async function getCartSummary() {
  const session = await getOrCreateCartSession();

  const subtotalAgorot = session.items.reduce(
    (sum, item) => sum + item.unitPriceAgorot * item.quantity,
    0,
  );
  const itemCount = session.items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    session,
    items: session.items,
    subtotalAgorot,
    itemCount,
    meetsMinimum: subtotalAgorot >= MIN_ORDER_AGOROT,
  };
}
