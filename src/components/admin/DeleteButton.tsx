"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DeleteButton({
  label = "מחיקה",
  confirmMessage = "למחוק את הפריט? הפעולה בלתי הפיכה.",
}: {
  label?: string;
  confirmMessage?: string;
}) {
  const anchorRef = useRef<HTMLSpanElement>(null);

  return (
    <span ref={anchorRef} className="inline-block">
      <ConfirmDialog
        trigger={
          <Button type="button" variant="danger">
            {label}
          </Button>
        }
        title="אישור מחיקה"
        description={confirmMessage}
        confirmLabel="מחיקה"
        variant="danger"
        onConfirm={() => anchorRef.current?.closest("form")?.requestSubmit()}
      />
    </span>
  );
}
