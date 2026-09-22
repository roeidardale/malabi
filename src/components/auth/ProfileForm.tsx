"use client";

import { useActionState } from "react";
import { updateCustomerProfile } from "@/server/actions/customer-auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

interface ProfileFormProps {
  customer: {
    name: string;
    email: string;
    phone: string;
  };
}

export function ProfileForm({ customer }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateCustomerProfile, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="phone">טלפון</Label>
        <Input id="phone" type="tel" defaultValue={customer.phone} disabled readOnly />
      </div>
      <div>
        <Label htmlFor="name">שם מלא</Label>
        <Input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          defaultValue={customer.name}
          required
        />
      </div>
      <div>
        <Label htmlFor="email">אימייל (לא חובה)</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={customer.email}
        />
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p role="status" className="text-sm text-accent">
          הפרטים עודכנו בהצלחה
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "שומר..." : "שמירת שינויים"}
      </Button>
    </form>
  );
}
