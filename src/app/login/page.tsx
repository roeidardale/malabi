import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6">
        <Link href="/" className="mb-6 inline-block text-sm text-muted hover:text-accent">
          → בית
        </Link>
        <h1 className="mb-6 text-2xl font-bold">התחברות</h1>
        <LoginForm />
      </div>
    </main>
  );
}
