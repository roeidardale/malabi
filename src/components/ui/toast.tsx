"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      dir="rtl"
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            "!bg-surface-raised !border !border-border !text-foreground !rounded-md !shadow-md",
          description: "!text-muted-foreground",
          actionButton: "!bg-accent !text-accent-foreground",
          cancelButton: "!bg-surface !text-foreground",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
export { toast } from "sonner";
