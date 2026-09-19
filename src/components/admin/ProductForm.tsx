import type { Category, Product } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";

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
    <form
      action={action}
      className="flex max-w-xl flex-col gap-4"
    >
      <div>
        <Label htmlFor="name">שם</Label>
        <Input id="name" name="name" defaultValue={product?.name} required />
      </div>

      <div>
        <Label htmlFor="slug">סלאג</Label>
        <Input id="slug" name="slug" defaultValue={product?.slug} required />
      </div>

      <div>
        <Label htmlFor="categoryId">קטגוריה</Label>
        <Select
          id="categoryId"
          name="categoryId"
          defaultValue={product?.categoryId ?? ""}
          required
        >
          <option value="" disabled>
            בחר קטגוריה
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.fullSlugPath}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="descriptionShort">תיאור קצר</Label>
        <Input
          id="descriptionShort"
          name="descriptionShort"
          defaultValue={product?.descriptionShort ?? ""}
        />
      </div>

      <div>
        <Label htmlFor="descriptionLong">תיאור מלא</Label>
        <Textarea
          id="descriptionLong"
          name="descriptionLong"
          rows={5}
          defaultValue={product?.descriptionLong ?? ""}
        />
      </div>

      <div>
        <Label htmlFor="sortOrder">סדר מיון</Label>
        <Input
          id="sortOrder"
          name="sortOrder"
          type="number"
          defaultValue={product?.sortOrder ?? 0}
        />
      </div>

      {includeImage ? (
        <div>
          <Label htmlFor="image">תמונת מוצר</Label>
          {product?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className="mb-2 h-24 w-24 rounded-md border border-border object-cover"
            />
          ) : null}
          <input
            id="image"
            name="image"
            type="file"
            accept="image/*"
            className="block w-full text-sm text-muted file:me-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-2 file:text-black"
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
        <Label htmlFor="isActive" className="mb-0">
          פעיל
        </Label>
      </div>

      <Button type="submit" variant="primary" className="mt-2 self-start">
        שמירה
      </Button>
    </form>
  );
}
