"use client";

import { useActionState, useState } from "react";
import { requestOtp, verifyOtp } from "@/server/actions/customer-auth";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input, Label } from "@/components/ui/input";
import { ErrorBanner } from "@/components/ui/error-banner";

export function PhoneLoginFlow({ redirectTo }: { redirectTo?: string }) {
  const [requestState, requestAction] = useActionState(requestOtp, undefined);
  const [verifyState, verifyAction] = useActionState(verifyOtp, undefined);
  // True while the phone-entry step is being shown; either we haven't sent a
  // code yet, or the customer explicitly asked to change the number.
  const [wantsPhoneStep, setWantsPhoneStep] = useState(false);

  const showCodeStep = Boolean(requestState?.success && requestState.phone) && !wantsPhoneStep;

  if (!showCodeStep) {
    return (
      <form
        action={requestAction}
        onSubmit={() => setWantsPhoneStep(false)}
        className="flex flex-col gap-4"
      >
        <div>
          <Label htmlFor="phone">מספר טלפון נייד</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="050-1234567"
            required
          />
        </div>

        {requestState?.error && <ErrorBanner>{requestState.error}</ErrorBanner>}

        <SubmitButton pendingLabel="שולח קוד..." className="w-full">
          שליחת קוד אימות
        </SubmitButton>
      </form>
    );
  }

  return (
    <form action={verifyAction} className="flex flex-col gap-4">
      <input type="hidden" name="phone" value={requestState?.phone ?? ""} />
      {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}

      <p className="text-sm text-muted-foreground">שלחנו קוד אימות ל-{requestState?.phone}</p>

      <div>
        <Label htmlFor="code">קוד אימות</Label>
        <Input
          id="code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          required
          autoFocus
        />
      </div>

      {requestState?.error && <ErrorBanner>{requestState.error}</ErrorBanner>}
      {verifyState?.error && <ErrorBanner>{verifyState.error}</ErrorBanner>}

      <SubmitButton pendingLabel="מאמת..." className="w-full">
        התחברות
      </SubmitButton>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => setWantsPhoneStep(true)}
          className="text-muted-foreground hover:text-accent"
        >
          שינוי מספר טלפון
        </button>
        <button
          type="submit"
          formAction={requestAction}
          formNoValidate
          className="text-accent hover:underline"
        >
          שליחת קוד חדש
        </button>
      </div>
    </form>
  );
}
