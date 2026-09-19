import type { ProductVariant } from "@prisma/client";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
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
    <Table>
      <TableHeader>
        <tr>
          <th>שם</th>
          <th>מחיר (₪)</th>
          <th>מק&quot;ט</th>
          <th>ברירת מחדל</th>
          <th>פעיל</th>
          <th>פעולות</th>
        </tr>
      </TableHeader>
      <TableBody>
        {variants.map((variant) => (
          <TableRow key={variant.id}>
            <VariantRowFields
              action={upsertVariant.bind(null, productId, variant.id)}
              variant={variant}
              deleteAction={deleteVariant.bind(null, productId, variant.id)}
            />
          </TableRow>
        ))}
        <TableRow>
          <VariantRowFields action={upsertVariant.bind(null, productId, null)} isNew />
        </TableRow>
      </TableBody>
    </Table>
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
    <TableCell colSpan={6}>
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
        <label className="flex items-center gap-1 text-xs text-muted-foreground">
          <input
            type="checkbox"
            name="isDefault"
            defaultChecked={variant?.isDefault ?? false}
            className="h-4 w-4"
          />
          ברירת מחדל
        </label>
        <label className="flex items-center gap-1 text-xs text-muted-foreground">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={variant?.isActive ?? true}
            className="h-4 w-4"
          />
          פעיל
        </label>
        <input type="hidden" name="sortOrder" value={variant?.sortOrder ?? 0} />
        <SubmitButton variant="secondary" pendingLabel="שומר...">
          {isNew ? "הוספה" : "שמירה"}
        </SubmitButton>
      </form>
      {deleteAction ? (
        <form action={deleteAction} className="mt-1 inline-block">
          <DeleteButton label="מחיקת וריאנט" confirmMessage="למחוק את הוריאנט?" />
        </form>
      ) : null}
    </TableCell>
  );
}
