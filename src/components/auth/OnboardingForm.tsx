"use client";

import { useActionState } from "react";
import { completeOnboarding } from "@/server/actions/customer-auth";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input, Label } from "@/components/ui/input";
import { ErrorBanner } from "@/components/ui/error-banner";

export function OnboardingForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction] = useActionState(completeOnboarding, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}

      <div>
        <Label htmlFor="name">שם מלא</Label>
        <Input id="name" name="name" type="text" autoComplete="name" required autoFocus />
      </div>
      <div>
        <Label htmlFor="email">אימייל (לא חובה)</Label>
        <Input id="email" name="email" type="email" autoComplete="email" />
      </div>

      {state?.error && <ErrorBanner>{state.error}</ErrorBanner>}

      <SubmitButton pendingLabel="שומר..." className="w-full">
        המשך
      </SubmitButton>
    </form>
  );
}
