"use client";

import { useActionState } from "react";
import { updateCustomerProfile } from "@/server/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

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
        <Label htmlFor="email">אימייל</Label>
        <Input id="email" type="email" defaultValue={customer.email} disabled readOnly />
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
        <Label htmlFor="phone">טלפון</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          defaultValue={customer.phone}
          required
        />
      </div>
      <div>
        <Label htmlFor="newPassword">סיסמה חדשה</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          placeholder="השאירו ריק אם אינכם רוצים לשנות"
          minLength={8}
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
