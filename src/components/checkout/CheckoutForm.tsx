"use client";

import { useActionState } from "react";
import { createOrderFromCart, type CheckoutActionState } from "@/server/actions/checkout";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input, Textarea } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { ErrorBanner } from "@/components/ui/error-banner";
import { DEFAULT_DELIVERY_CITY } from "@/lib/money";

const initialState: CheckoutActionState = {};

export function CheckoutForm() {
  const [state, action] = useActionState(createOrderFromCart, initialState);

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormField id="customerName" label="שם מלא">
        <Input name="customerName" required autoComplete="name" />
      </FormField>

      <FormField id="customerPhone" label="טלפון">
        <Input name="customerPhone" required autoComplete="tel" />
      </FormField>

      <FormField id="customerEmail" label="אימייל (לא חובה)">
        <Input name="customerEmail" type="email" autoComplete="email" />
      </FormField>

      <FormField id="deliveryStreet" label="כתובת למשלוח">
        <Input name="deliveryStreet" required autoComplete="street-address" />
      </FormField>

      <FormField id="deliveryCity" label="עיר">
        <Input name="deliveryCity" defaultValue={DEFAULT_DELIVERY_CITY} required />
      </FormField>

      <FormField id="deliveryNotes" label="הערות למשלוח (לא חובה)">
        <Textarea name="deliveryNotes" rows={3} />
      </FormField>

      {state?.error && <ErrorBanner>{state.error}</ErrorBanner>}

      <SubmitButton pendingLabel="שולח..." className="mt-2">
        המשך לתשלום
      </SubmitButton>
    </form>
  );
}
