import "server-only";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/session";

/**
 * Re-checks customer auth server-side, mirroring requireAdmin in
 * admin-guard.ts: trust nothing from the session cookie but the id, re-fetch
 * from the DB, and redirect (not throw) on failure.
 */
export async function requireCustomer(): Promise<{
  id: string;
  name: string | null;
  email: string | null;
  phone: string;
}> {
  const session = await getCustomerSession();
  if (!session.customerId) {
    redirect("/login");
  }

  const customer = await prisma.customer.findUnique({
    where: { id: session.customerId },
    select: { id: true, name: true, email: true, phone: true },
  });

  if (!customer) {
    session.destroy();
    redirect("/login");
  }

  return customer;
}
