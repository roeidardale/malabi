import { loginAdmin } from "@/server/actions/admin-auth";
import { ErrorBanner } from "@/components/ui/error-banner";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm p-8">
        <h1 className="mb-1 text-center text-display-md text-accent">
          מלבי אקספרס
        </h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">כניסת מנהלים</p>

        {error ? <ErrorBanner className="mb-4">{error}</ErrorBanner> : null}

        <form action={loginAdmin} className="flex flex-col gap-4">
          <FormField id="email" label="אימייל">
            <Input name="email" type="email" autoComplete="username" required />
          </FormField>
          <FormField id="password" label="סיסמה">
            <Input name="password" type="password" autoComplete="current-password" required />
          </FormField>
          <SubmitButton pendingLabel="מתחבר..." className="mt-2 w-full">
            התחברות
          </SubmitButton>
        </form>
      </Card>
    </div>
  );
}
