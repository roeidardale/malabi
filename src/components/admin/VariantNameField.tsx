"use client";

import { useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { DEFAULT_VARIANT_NAME } from "@/lib/catalog";

// Used only for a product's very first variant: most products are sold as a
// single item with one price, and shouldn't need an invented variant name
// for that — checking this submits the DEFAULT_VARIANT_NAME sentinel, which
// the storefront (AddToCart) then renders with no variant picker at all.
export function VariantNameField() {
  const [singleOption, setSingleOption] = useState(true);
  const [customName, setCustomName] = useState("");
  const checkboxId = useId();

  return (
    <div className="flex flex-col gap-1">
      <Input
        name="name"
        placeholder="שם אפשרות (למשל 500 מ״ל)"
        value={singleOption ? DEFAULT_VARIANT_NAME : customName}
        onChange={(event) => setCustomName(event.target.value)}
        readOnly={singleOption}
        required
        className="w-40"
      />
      <label htmlFor={checkboxId} className="flex items-center gap-1 text-xs text-muted-foreground">
        <input
          id={checkboxId}
          type="checkbox"
          checked={singleOption}
          onChange={(event) => setSingleOption(event.target.checked)}
          className="h-4 w-4"
        />
        למוצר אפשרות אחת בלבד (ללא בחירה בחנות)
      </label>
    </div>
  );
}
