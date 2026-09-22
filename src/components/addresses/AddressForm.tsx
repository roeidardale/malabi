"use client";

import { useActionState } from "react";
import { createAddress, updateAddress, type AddressActionState } from "@/server/actions/addresses";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { ErrorBanner } from "@/components/ui/error-banner";
import { DEFAULT_DELIVERY_CITY } from "@/lib/money";

export interface AddressFormValues {
  id: string;
  label: string;
  street: string;
  city: string;
  notes: string | null;
  isDefault: boolean;
}

export function AddressForm({
  address,
  onDone,
}: {
  address?: AddressFormValues;
  onDone?: () => void;
}) {
  const action = address ? updateAddress.bind(null, address.id) : createAddress;
  const [state, formAction] = useActionState<AddressActionState | undefined, FormData>(
    async (prevState, formData) => {
      const result = await action(prevState, formData);
      if (!result.error) onDone?.();
      return result;
    },
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div>
        <Label htmlFor="label">שם לכתובת (למשל בית, עבודה)</Label>
        <Input id="label" name="label" type="text" defaultValue={address?.label} required />
      </div>
      <div>
        <Label htmlFor="street">כתובת</Label>
        <Input id="street" name="street" type="text" autoComplete="street-address" defaultValue={address?.street} required />
      </div>
      <div>
        <Label htmlFor="city">עיר</Label>
        <Input id="city" name="city" type="text" defaultValue={address?.city ?? DEFAULT_DELIVERY_CITY} required />
      </div>
      <div>
        <Label htmlFor="notes">הערות (לא חובה)</Label>
        <Textarea id="notes" name="notes" rows={2} defaultValue={address?.notes ?? ""} />
      </div>
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input type="checkbox" name="isDefault" defaultChecked={address?.isDefault} className="size-4" />
        כתובת ברירת מחדל
      </label>

      {state?.error && <ErrorBanner>{state.error}</ErrorBanner>}

      <SubmitButton pendingLabel="שומר...">{address ? "שמירת שינויים" : "הוספת כתובת"}</SubmitButton>
    </form>
  );
}
