"use client";

import { Button } from "@/components/ui/Button";

export function DeleteButton({
  label = "מחיקה",
  confirmMessage = "למחוק את הפריט? הפעולה בלתי הפיכה.",
}: {
  label?: string;
  confirmMessage?: string;
}) {
  return (
    <Button
      type="submit"
      variant="danger"
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {label}
    </Button>
  );
}
