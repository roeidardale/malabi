import * as React from "react";
import { cn } from "@/lib/utils";

function Card({
  className,
  interactive = false,
  ...props
}: React.ComponentProps<"div"> & { interactive?: boolean }) {
  return (
    <div
      data-slot="card"
      className={cn(
        "rounded-md border border-border bg-surface p-4",
        interactive &&
          "transition-colors transition-transform duration-fast ease-out hover:border-accent/60 hover:bg-surface-raised active:translate-y-px",
        className,
      )}
      {...props}
    />
  );
}

export { Card };
