import type { Category } from "@prisma/client";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input, Label, Select } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { ImageTile } from "@/components/ui/image-tile";

export function CategoryForm({
  action,
  category,
  parentOptions,
}: {
  action: (formData: FormData) => void | Promise<void>;
  category?: Category | null;
  parentOptions: Category[];
}) {
  return (
    <form action={action} className="flex max-w-xl flex-col gap-4">
      <FormField id="name" label="שם">
        <Input name="name" defaultValue={category?.name} required />
      </FormField>

      <FormField id="slug" label="סלאג">
        <Input name="slug" defaultValue={category?.slug} required />
      </FormField>

      <FormField id="parentId" label="קטגוריית אב">
        <Select name="parentId" defaultValue={category?.parentId ?? ""}>
          <option value="">— ללא (קטגוריית שורש) —</option>
          {parentOptions
            .filter((option) => option.id !== category?.id)
            .map((option) => (
              <option key={option.id} value={option.id}>
                {option.fullSlugPath}
              </option>
            ))}
        </Select>
      </FormField>

      <FormField id="sortOrder" label="סדר מיון">
        <Input name="sortOrder" type="number" defaultValue={category?.sortOrder ?? 0} />
      </FormField>

      <div className="flex flex-col gap-2">
        <Label htmlFor="image">תמונת קטגוריה</Label>
        {category?.imageUrl ? (
          <ImageTile
            src={category.imageUrl}
            alt={category.name}
            aspect="portrait"
            className="w-24"
            sizes="96px"
          />
        ) : null}
        <input
          id="image"
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="block w-full text-sm text-muted-foreground file:me-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-2 file:text-accent-foreground"
        />
        <p className="text-xs text-muted-foreground">קבצי תמונה בלבד, עד 5MB</p>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="isActive"
          name="isActive"
          type="checkbox"
          defaultChecked={category?.isActive ?? true}
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
