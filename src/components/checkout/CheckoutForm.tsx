"use client";

import { useActionState } from "react";
import { createOrderFromCart, type CheckoutActionState } from "@/server/actions/checkout";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { DEFAULT_DELIVERY_CITY } from "@/lib/money";

const initialState: CheckoutActionState = {};

export function CheckoutForm() {
  const [state, action, pending] = useActionState(createOrderFromCart, initialState);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="customerName">שם מלא</Label>
        <Input id="customerName" name="customerName" required autoComplete="name" />
      </div>

      <div>
        <Label htmlFor="customerPhone">טלפון</Label>
        <Input id="customerPhone" name="customerPhone" required autoComplete="tel" />
      </div>

      <div>
        <Label htmlFor="customerEmail">אימייל (לא חובה)</Label>
        <Input id="customerEmail" name="customerEmail" type="email" autoComplete="email" />
      </div>

      <div>
        <Label htmlFor="deliveryStreet">כתובת למשלוח</Label>
        <Input id="deliveryStreet" name="deliveryStreet" required autoComplete="street-address" />
      </div>

      <div>
        <Label htmlFor="deliveryCity">עיר</Label>
        <Input id="deliveryCity" name="deliveryCity" defaultValue={DEFAULT_DELIVERY_CITY} required />
      </div>

      <div>
        <Label htmlFor="deliveryNotes">הערות למשלוח (לא חובה)</Label>
        <Textarea id="deliveryNotes" name="deliveryNotes" rows={3} />
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? "שולח..." : "המשך לתשלום"}
      </Button>
    </form>
  );
}
