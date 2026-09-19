import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      tone: {
        neutral: "border-border bg-surface text-muted-foreground",
        accent: "border-accent/40 bg-accent/15 text-accent",
        success: "border-emerald-500/40 bg-emerald-500/15 text-emerald-400",
        warning: "border-amber-500/40 bg-amber-500/15 text-amber-400",
        danger: "border-danger/40 bg-danger/15 text-danger",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

function Badge({
  className,
  tone,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ tone, className }))}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
