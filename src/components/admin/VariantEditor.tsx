import type { ProductVariant } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { agorotToShekelString } from "@/lib/money";
import { upsertVariant, deleteVariant } from "@/server/actions/admin-products";
import { DeleteButton } from "@/components/admin/DeleteButton";

export function VariantEditor({
  productId,
  variants,
}: {
  productId: string;
  variants: ProductVariant[];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full text-start text-sm">
        <thead>
          <tr className="border-b border-border text-muted">
            <th className="px-3 py-2 text-start">שם</th>
            <th className="px-3 py-2 text-start">מחיר (₪)</th>
            <th className="px-3 py-2 text-start">מק&quot;ט</th>
            <th className="px-3 py-2 text-start">ברירת מחדל</th>
            <th className="px-3 py-2 text-start">פעיל</th>
            <th className="px-3 py-2 text-start">פעולות</th>
          </tr>
        </thead>
        <tbody>
          {variants.map((variant) => (
            <tr key={variant.id} className="border-b border-border/50">
              <VariantRowFields
                action={upsertVariant.bind(null, productId, variant.id)}
                variant={variant}
                deleteAction={deleteVariant.bind(null, productId, variant.id)}
              />
            </tr>
          ))}
          <tr>
            <VariantRowFields action={upsertVariant.bind(null, productId, null)} isNew />
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function VariantRowFields({
  action,
  variant,
  deleteAction,
  isNew = false,
}: {
  action: (formData: FormData) => void | Promise<void>;
  variant?: ProductVariant;
  deleteAction?: (formData: FormData) => void | Promise<void>;
  isNew?: boolean;
}) {
  const formId = variant ? `variant-${variant.id}` : "variant-new";
  return (
    <>
      <td className="px-3 py-2" colSpan={6}>
        <form id={formId} action={action} className="flex flex-wrap items-center gap-2">
          <Input
            name="name"
            placeholder="שם וריאנט"
            defaultValue={variant?.name}
            required
            className="w-40"
          />
          <Input
            name="price"
            type="number"
            step="0.01"
            min="0"
            placeholder="מחיר בש״ח"
            defaultValue={variant ? agorotToShekelString(variant.priceAgorot) : undefined}
            required
            className="w-28"
          />
          <Input
            name="sku"
            placeholder="מק״ט"
            defaultValue={variant?.sku ?? ""}
            className="w-32"
          />
          <label className="flex items-center gap-1 text-xs text-muted">
            <input
              type="checkbox"
              name="isDefault"
              defaultChecked={variant?.isDefault ?? false}
              className="h-4 w-4"
            />
            ברירת מחדל
          </label>
          <label className="flex items-center gap-1 text-xs text-muted">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={variant?.isActive ?? true}
              className="h-4 w-4"
            />
            פעיל
          </label>
          <input type="hidden" name="sortOrder" value={variant?.sortOrder ?? 0} />
          <Button type="submit" variant="secondary">
            {isNew ? "הוספה" : "שמירה"}
          </Button>
        </form>
        {deleteAction ? (
          <form action={deleteAction} className="mt-1 inline-block">
            <DeleteButton
              label="מחיקת וריאנט"
              confirmMessage="למחוק את הוריאנט?"
            />
          </form>
        ) : null}
      </td>
    </>
  );
}
