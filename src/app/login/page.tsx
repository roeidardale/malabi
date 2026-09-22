import Link from "next/link";
import { PhoneLoginFlow } from "@/components/auth/PhoneLoginFlow";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6">
        <Link href="/" className="mb-6 inline-block text-sm text-muted-foreground hover:text-accent">
          → בית
        </Link>
        <h1 className="mb-6 text-display-md">התחברות</h1>
        <PhoneLoginFlow redirectTo={redirectTo} />
      </div>
    </main>
  );
}
