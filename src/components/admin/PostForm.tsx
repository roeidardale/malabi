import type { Post } from "@prisma/client";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { ImageTile } from "@/components/ui/image-tile";

/** `datetime-local` inputs want `YYYY-MM-DDTHH:mm` in local time. */
function toDateTimeLocal(date: Date): string {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function PostForm({
  action,
  post,
}: {
  action: (formData: FormData) => void | Promise<void>;
  post?: Post | null;
}) {
  return (
    <form action={action} className="flex max-w-xl flex-col gap-4">
      <FormField id="title" label="כותרת">
        <Input name="title" defaultValue={post?.title} maxLength={120} required />
      </FormField>

      <FormField id="body" label="תוכן" hint="עד 2000 תווים. ירידות שורה נשמרות.">
        <Textarea name="body" rows={6} defaultValue={post?.body} maxLength={2000} required />
      </FormField>

      <div className="flex flex-col gap-2">
        <Label htmlFor="image">תמונה (אופציונלי)</Label>
        {post?.imageUrl ? (
          <>
            <ImageTile
              src={post.imageUrl}
              alt={post.title}
              aspect="4/3"
              fit="cover"
              className="w-40"
              sizes="160px"
            />
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input name="removeImage" type="checkbox" className="h-4 w-4" />
              הסרת התמונה הנוכחית
            </label>
          </>
        ) : null}
        <input
          id="image"
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="block w-full text-sm text-muted-foreground file:me-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-2 file:text-accent-foreground"
        />
        <p className="text-xs text-muted-foreground">JPG, PNG, WebP או GIF, עד 5MB</p>
      </div>

      <FormField
        id="publishedAt"
        label="תאריך פרסום"
        hint="פוסט עם תאריך עתידי יופיע באתר רק מאותו רגע."
      >
        <Input
          name="publishedAt"
          type="datetime-local"
          defaultValue={toDateTimeLocal(post?.publishedAt ?? new Date())}
        />
      </FormField>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            name="isPublished"
            type="checkbox"
            defaultChecked={post?.isPublished ?? true}
            className="h-4 w-4"
          />
          מפורסם באתר
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            name="isPinned"
            type="checkbox"
            defaultChecked={post?.isPinned ?? false}
            className="h-4 w-4"
          />
          הצמדה לראש הרשימה
        </label>
      </div>

      <SubmitButton pendingLabel="שומר..." className="mt-2 self-start">
        שמירה
      </SubmitButton>
    </form>
  );
}
