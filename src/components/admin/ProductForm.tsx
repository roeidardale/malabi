import type { Category, Product } from "@prisma/client";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { ImageTile } from "@/components/ui/image-tile";

export function ProductForm({
  action,
  product,
  categories,
  includeImage = false,
}: {
  action: (formData: FormData) => void | Promise<void>;
  product?: Product | null;
  categories: Category[];
  includeImage?: boolean;
}) {
  return (
    <form action={action} className="flex max-w-xl flex-col gap-4">
      <FormField id="name" label="שם">
        <Input name="name" defaultValue={product?.name} required />
      </FormField>

      <FormField id="slug" label="סלאג">
        <Input name="slug" defaultValue={product?.slug} required />
      </FormField>

      <FormField id="categoryId" label="קטגוריה">
        <Select name="categoryId" defaultValue={product?.categoryId ?? ""} required>
          <option value="" disabled>
            בחר קטגוריה
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.fullSlugPath}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField id="descriptionShort" label="תיאור קצר">
        <Input name="descriptionShort" defaultValue={product?.descriptionShort ?? ""} />
      </FormField>

      <FormField id="descriptionLong" label="תיאור מלא">
        <Textarea name="descriptionLong" rows={5} defaultValue={product?.descriptionLong ?? ""} />
      </FormField>

      <FormField id="sortOrder" label="סדר מיון">
        <Input name="sortOrder" type="number" defaultValue={product?.sortOrder ?? 0} />
      </FormField>

      {includeImage ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="image">תמונת מוצר</Label>
          {product?.imageUrl ? (
            <ImageTile
              src={product.imageUrl}
              alt={product.name}
              className="w-24"
              sizes="96px"
            />
          ) : null}
          <input
            id="image"
            name="image"
            type="file"
            accept="image/*"
            className="block w-full text-sm text-muted-foreground file:me-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-2 file:text-accent-foreground"
          />
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <input
          id="isActive"
          name="isActive"
          type="checkbox"
          defaultChecked={product?.isActive ?? true}
          className="h-4 w-4"
        />
        <label htmlFor="isActive" className="text-sm text-muted-foreground">
          פעיל
        </label>
      </div>

      <SubmitButton pendingLabel="שומר..." className="mt-2 self-start">
        שמירה
      </SubmitButton>
    </form>
  );
}
