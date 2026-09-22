"use client";

import { useState } from "react";
import { useActionState } from "react";
import { createOrderFromCart, type CheckoutActionState } from "@/server/actions/checkout";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { ErrorBanner } from "@/components/ui/error-banner";
import { DEFAULT_DELIVERY_CITY } from "@/lib/money";

const initialState: CheckoutActionState = {};

interface CheckoutAddress {
  id: string;
  label: string;
  street: string;
  city: string;
  notes: string | null;
  isDefault: boolean;
}

interface CheckoutCustomer {
  name: string | null;
  email: string | null;
  phone: string;
  addresses: CheckoutAddress[];
}

export function CheckoutForm({ customer }: { customer: CheckoutCustomer | null }) {
  const [state, action] = useActionState(createOrderFromCart, initialState);

  const defaultAddress = customer?.addresses.find((a) => a.isDefault) ?? customer?.addresses[0] ?? null;
  const [selectedAddressId, setSelectedAddressId] = useState<string>(defaultAddress?.id ?? "new");
  const [saveAsNewAddress, setSaveAsNewAddress] = useState(false);

  const showAddressPicker = Boolean(customer && customer.addresses.length > 0);
  const showFreeTextAddress = !showAddressPicker || selectedAddressId === "new";

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormField id="customerName" label="שם מלא">
        <Input name="customerName" required autoComplete="name" defaultValue={customer?.name ?? ""} />
      </FormField>

      <FormField id="customerPhone" label="טלפון">
        <Input name="customerPhone" required autoComplete="tel" defaultValue={customer?.phone ?? ""} />
      </FormField>

      <FormField id="customerEmail" label="אימייל (לא חובה)">
        <Input
          name="customerEmail"
          type="email"
          autoComplete="email"
          defaultValue={customer?.email ?? ""}
        />
      </FormField>

      {showAddressPicker && (
        <div className="flex flex-col gap-2">
          <Label>כתובת למשלוח</Label>
          {customer!.addresses.map((address) => (
            <label
              key={address.id}
              className="flex items-start gap-2 rounded-md border border-border p-3 text-sm"
            >
              <input
                type="radio"
                name="selectedAddressId"
                value={address.id}
                checked={selectedAddressId === address.id}
                onChange={() => setSelectedAddressId(address.id)}
                className="mt-1"
              />
              <span>
                <span className="font-medium">{address.label}</span>
                <br />
                <span className="text-muted-foreground">
                  {address.street}, {address.city}
                </span>
              </span>
            </label>
          ))}
          <label className="flex items-center gap-2 rounded-md border border-border p-3 text-sm">
            <input
              type="radio"
              name="selectedAddressId"
              value=""
              checked={selectedAddressId === "new"}
              onChange={() => setSelectedAddressId("new")}
            />
            כתובת אחרת למשלוח הזה
          </label>
        </div>
      )}

      {showFreeTextAddress && (
        <>
          <FormField id="deliveryStreet" label="כתובת למשלוח">
            <Input name="deliveryStreet" required autoComplete="street-address" />
          </FormField>

          <FormField id="deliveryCity" label="עיר">
            <Input name="deliveryCity" defaultValue={DEFAULT_DELIVERY_CITY} required />
          </FormField>

          {customer && (
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  name="saveAsNewAddress"
                  checked={saveAsNewAddress}
                  onChange={(e) => setSaveAsNewAddress(e.target.checked)}
                  className="size-4"
                />
                שמירת כתובת זו לפעם הבאה
              </label>
              {saveAsNewAddress && (
                <FormField id="newAddressLabel" label="שם לכתובת (למשל בית, עבודה)">
                  <Input name="newAddressLabel" type="text" required />
                </FormField>
              )}
            </div>
          )}
        </>
      )}

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
