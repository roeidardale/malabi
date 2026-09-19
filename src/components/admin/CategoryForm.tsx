import type { Category } from "@prisma/client";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input, Select } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";

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

      <FormField
        id="imageUrl"
        label="כתובת תמונה (אופציונלי)"
        hint="נתיב מקומי בלבד, למשל /media/categories/שם-קובץ.jpg"
      >
        <Input name="imageUrl" defaultValue={category?.imageUrl ?? ""} />
      </FormField>

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
