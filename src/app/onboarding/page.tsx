import { OnboardingForm } from "@/components/auth/OnboardingForm";
import { requireCustomer } from "@/server/actions/customer-guard";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  await requireCustomer();
  const { redirectTo } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6">
        <h1 className="mb-2 text-display-md">כמה פרטים לפני שממשיכים</h1>
        <p className="mb-6 text-sm text-muted-foreground">נשאל רק פעם אחת</p>
        <OnboardingForm redirectTo={redirectTo} />
      </div>
    </main>
  );
}
