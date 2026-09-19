"use client";

import { useState } from "react";
import type { ProductVariant } from "@prisma/client";
import { formatIls } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { addToCart } from "@/server/actions/cart";

export function VariantSelector({ variants }: { variants: ProductVariant[] }) {
  const [selectedId, setSelectedId] = useState("");

  const selectedVariant = variants.find((variant) => variant.id === selectedId) ?? null;

  if (variants.length === 0) {
    return <p className="text-sm text-muted-foreground">אין אפשרויות זמינות כרגע</p>;
  }

  return (
    <form action={addToCart} className="flex flex-col gap-2">
      <Select
        name="variantId"
        value={selectedId}
        onChange={(event) => setSelectedId(event.target.value)}
        aria-label="בחר אפשרות"
      >
        <option value="" disabled>
          בחר אפשרות
        </option>
        {variants.map((variant) => (
          <option key={variant.id} value={variant.id}>
            {variant.name}
          </option>
        ))}
      </Select>

      <input type="hidden" name="quantity" value={1} />

      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-accent">
          {selectedVariant ? formatIls(selectedVariant.priceAgorot) : "–"}
        </span>
        <Button type="submit" variant="primary" disabled={!selectedVariant} className="text-sm">
          הוסף לסל
        </Button>
      </div>
    </form>
  );
}
