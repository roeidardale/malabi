"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Minus, Plus, ShoppingCart } from "lucide-react";
import { DEFAULT_VARIANT_NAME } from "@/lib/catalog";
import { formatIls } from "@/lib/money";
import { CART_PATH } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { addToCart } from "@/server/actions/cart";

export type PurchasableVariant = {
  id: string;
  name: string;
  priceAgorot: number;
  isDefault: boolean;
};

// Up to this many options render as tap-friendly chips; more become a select.
const MAX_CHIP_OPTIONS = 4;
const MAX_QUANTITY = 99;

export function AddToCart({
  productName,
  variants,
}: {
  productName: string;
  variants: PurchasableVariant[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(
    () => (variants.find((variant) => variant.isDefault) ?? variants[0])?.id ?? "",
  );
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const selected = variants.find((variant) => variant.id === selectedId);

  if (!selected) {
    return <p className="text-sm text-muted-foreground">אין אפשרויות זמינות כרגע</p>;
  }

  const priced = selected.priceAgorot > 0;
  // A single variant has nothing to choose between; show its name only if it
  // carries real info (a size, say) rather than the generic placeholder.
  const showOptions = variants.length > 1;
  const showSingleVariantLabel = variants.length === 1 && selected.name !== DEFAULT_VARIANT_NAME;

  function handleAdd() {
    if (!selected) return;
    startTransition(async () => {
      const result = await addToCart(selected.id, quantity);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`${productName} נוסף לסל`, {
        action: { label: "לסל", onClick: () => router.push(CART_PATH) },
      });
      setQuantity(1);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    });
  }

  return (
    <div className="flex flex-col gap-2.5">
      {variants.length > MAX_CHIP_OPTIONS ? (
        <Select
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
          aria-label={`אפשרות עבור ${productName}`}
        >
          {variants.map((variant) => (
            <option key={variant.id} value={variant.id}>
              {variant.name}
            </option>
          ))}
        </Select>
      ) : showOptions ? (
        <div role="radiogroup" aria-label={`אפשרות עבור ${productName}`} className="flex flex-wrap gap-1.5">
          {variants.map((variant) => {
            const active = variant.id === selectedId;
            return (
              <button
                key={variant.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSelectedId(variant.id)}
                className={cn(
                  "h-8 rounded-full border px-3 text-sm transition-colors duration-fast focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  active
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-border text-muted-foreground hover:border-accent/60 hover:text-foreground",
                )}
              >
                {variant.name}
              </button>
            );
          })}
        </div>
      ) : showSingleVariantLabel ? (
        <p className="text-sm text-muted-foreground">{selected.name}</p>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <span className="text-heading text-accent" data-testid="price">
          {priced ? formatIls(selected.priceAgorot * quantity) : "מחיר בקרוב"}
        </span>

        <div className="flex items-center rounded-md border border-border">
          <button
            type="button"
            aria-label="הפחת כמות"
            disabled={quantity <= 1}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="inline-flex size-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
          >
            <Minus className="size-4" aria-hidden />
          </button>
          <span className="w-6 text-center text-sm tabular-nums" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            aria-label="הוסף כמות"
            disabled={quantity >= MAX_QUANTITY}
            onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}
            className="inline-flex size-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
          >
            <Plus className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      <Button
        type="button"
        variant="primary"
        onClick={handleAdd}
        disabled={!priced || isPending}
        className="w-full"
      >
        {added ? (
          <>
            <Check className="size-4" aria-hidden />
            נוסף לסל
          </>
        ) : (
          <>
            <ShoppingCart className="size-4" aria-hidden />
            {isPending ? "מוסיף..." : "הוסף לסל"}
          </>
        )}
      </Button>
    </div>
  );
}
