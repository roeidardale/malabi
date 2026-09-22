"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteAddress, setDefaultAddress } from "@/server/actions/addresses";
import { AddressForm, type AddressFormValues } from "@/components/addresses/AddressForm";

export function AddressList({ addresses }: { addresses: AddressFormValues[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {addresses.length === 0 && !adding && (
        <div className="rounded-lg border border-border bg-surface p-6 text-center text-muted-foreground">
          עדיין לא שמרת כתובות
        </div>
      )}

      {addresses.map((address) =>
        editingId === address.id ? (
          <div key={address.id} className="rounded-lg border border-border bg-surface p-4">
            <AddressForm address={address} onDone={() => setEditingId(null)} />
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setEditingId(null)}>
              ביטול
            </Button>
          </div>
        ) : (
          <div key={address.id} className="rounded-lg border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{address.label}</span>
                  {address.isDefault && (
                    <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">
                      ברירת מחדל
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {address.street}, {address.city}
                </p>
                {address.notes && <p className="text-sm text-muted-foreground">{address.notes}</p>}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => setEditingId(address.id)}>
                עריכה
              </Button>
              {!address.isDefault && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setDefaultAddress(address.id)}
                >
                  הגדר כברירת מחדל
                </Button>
              )}
              <ConfirmDialog
                trigger={
                  <Button variant="danger" size="sm">
                    מחיקה
                  </Button>
                }
                title="מחיקת כתובת"
                description={`למחוק את הכתובת "${address.label}"?`}
                confirmLabel="מחיקה"
                variant="danger"
                onConfirm={() => deleteAddress(address.id)}
              />
            </div>
          </div>
        ),
      )}

      {adding ? (
        <div className="rounded-lg border border-border bg-surface p-4">
          <AddressForm onDone={() => setAdding(false)} />
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => setAdding(false)}>
            ביטול
          </Button>
        </div>
      ) : (
        <Button variant="secondary" onClick={() => setAdding(true)}>
          הוספת כתובת
        </Button>
      )}
    </div>
  );
}
