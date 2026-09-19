"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginCustomer } from "@/server/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginCustomer, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="email">אימייל</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
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

      {state?.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "מתחבר..." : "התחברות"}
      </Button>

      <p className="text-center text-sm text-muted">
        עדיין אין לך חשבון?{" "}
        <Link href="/register" className="text-accent hover:underline">
          הרשמה
        </Link>
      </p>
    </form>
  );
}
