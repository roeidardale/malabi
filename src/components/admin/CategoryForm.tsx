import type { Category } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";

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
      <div>
        <Label htmlFor="name">שם</Label>
        <Input id="name" name="name" defaultValue={category?.name} required />
      </div>

      <div>
        <Label htmlFor="slug">סלאג</Label>
        <Input id="slug" name="slug" defaultValue={category?.slug} required />
      </div>

      <div>
        <Label htmlFor="parentId">קטגוריית אב</Label>
        <Select id="parentId" name="parentId" defaultValue={category?.parentId ?? ""}>
          <option value="">— ללא (קטגוריית שורש) —</option>
          {parentOptions
            .filter((option) => option.id !== category?.id)
            .map((option) => (
              <option key={option.id} value={option.id}>
                {option.fullSlugPath}
              </option>
            ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="sortOrder">סדר מיון</Label>
        <Input
          id="sortOrder"
          name="sortOrder"
          type="number"
          defaultValue={category?.sortOrder ?? 0}
        />
      </div>

      <div>
        <Label htmlFor="imageUrl">כתובת תמונה (אופציונלי)</Label>
        <Input id="imageUrl" name="imageUrl" defaultValue={category?.imageUrl ?? ""} />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="isActive"
          name="isActive"
          type="checkbox"
          defaultChecked={category?.isActive ?? true}
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
