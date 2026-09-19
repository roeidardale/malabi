import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6">
        <Link href="/" className="mb-6 inline-block text-sm text-muted-foreground hover:text-accent">
          → בית
        </Link>
        <h1 className="mb-6 text-display-md">הרשמה</h1>
        <RegisterForm />
      </div>
    </main>
  );
}
