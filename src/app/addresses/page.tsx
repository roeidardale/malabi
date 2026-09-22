import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/server/actions/customer-guard";
import { AddressList } from "@/components/addresses/AddressList";

export default async function AddressesPage() {
  const customer = await requireCustomer();

  const addresses = await prisma.address.findMany({
    where: { customerId: customer.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 p-4 py-10">
      <Link href="/customer-profile" className="text-sm text-muted-foreground hover:text-accent">
        → האזור האישי
      </Link>

      <h1 className="text-display-md">כתובות שמורות</h1>

      <AddressList addresses={addresses} />
    </main>
  );
}
