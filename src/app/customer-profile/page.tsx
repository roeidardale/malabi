import Link from "next/link";
import { ProfileForm } from "@/components/auth/ProfileForm";
import { Button } from "@/components/ui/button";
import { requireCustomer } from "@/server/actions/customer-guard";
import { logoutCustomer } from "@/server/actions/customer-auth";

export default async function CustomerProfilePage() {
  const customer = await requireCustomer();

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 p-4 py-10">
      <Link href="/" className="text-sm text-muted-foreground hover:text-accent">
        → בית
      </Link>

      <div className="rounded-lg border border-border bg-surface p-6">
        <h1 className="mb-6 text-display-md">האזור האישי שלי</h1>
        <ProfileForm
          customer={{ name: customer.name ?? "", email: customer.email ?? "", phone: customer.phone }}
        />
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-6">
        <Link href="/sales-history" className="text-accent hover:underline">
          היסטוריית הזמנות ←
        </Link>
        <Link href="/addresses" className="text-accent hover:underline">
          כתובות שמורות ←
        </Link>
      </div>

      <form action={logoutCustomer} className="flex justify-end">
        <Button type="submit" variant="secondary">
          התנתקות
        </Button>
      </form>
    </main>
  );
}
