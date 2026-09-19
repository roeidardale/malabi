"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function StaffActiveToggle({
  isActive,
  memberName,
}: {
  isActive: boolean;
  memberName: string;
}) {
  const anchorRef = useRef<HTMLSpanElement>(null);

  if (isActive) {
    return (
      <span ref={anchorRef} className="inline-block">
        <ConfirmDialog
          trigger={
            <Button type="button" variant="secondary">
              השבתה
            </Button>
          }
          title="השבתת איש צוות"
          description={`להשבית את ${memberName}? החשבון לא יוכל להתחבר עד להפעלה מחדש.`}
          confirmLabel="השבתה"
          variant="danger"
          onConfirm={() => anchorRef.current?.closest("form")?.requestSubmit()}
        />
      </span>
    );
  }

  return (
    <Button type="submit" variant="secondary">
      הפעלה
    </Button>
  );
}
