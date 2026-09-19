import { loginAdmin } from "@/server/actions/admin-auth";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8">
        <h1 className="mb-1 text-center text-2xl font-bold text-accent">
          מלבי אקספרס
        </h1>
        <p className="mb-6 text-center text-sm text-muted">כניסת מנהלים</p>

        {error ? (
          <p className="mb-4 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <form action={loginAdmin} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="email">אימייל</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <Label htmlFor="password">סיסמה</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <Button type="submit" variant="primary" className="mt-2 w-full">
            התחברות
          </Button>
        </form>
      </div>
    </div>
  );
}
