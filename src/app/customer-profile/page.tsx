import Link from "next/link";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/auth/ProfileForm";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/session";
import { logoutCustomer } from "@/server/actions/auth";

export default async function CustomerProfilePage() {
  const session = await getCustomerSession();
  if (!session.customerId) {
    redirect("/login");
  }

  const customer = await prisma.customer.findUnique({
    where: { id: session.customerId },
  });

  if (!customer) {
    redirect("/login");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 p-4 py-10">
      <Link href="/" className="text-sm text-muted-foreground hover:text-accent">
        → בית
      </Link>

      <div className="rounded-lg border border-border bg-surface p-6">
        <h1 className="mb-6 text-display-md">האזור האישי שלי</h1>
        <ProfileForm
          customer={{ name: customer.name, email: customer.email, phone: customer.phone }}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-6">
        <Link href="/sales-history" className="text-accent hover:underline">
          היסטוריית הזמנות ←
        </Link>
        <form action={logoutCustomer}>
          <Button type="submit" variant="secondary">
            התנתקות
          </Button>
        </form>
      </div>
    </main>
  );
}
