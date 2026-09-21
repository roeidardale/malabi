import { ErrorBanner } from "@/components/ui/error-banner";
import { createPost } from "@/server/actions/admin-posts";
import { PostForm } from "@/components/admin/PostForm";
import { requireAdmin } from "@/server/actions/admin-guard";

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin(["OWNER"]);
  const { error } = await searchParams;

  return (
    <div>
      <h1 className="mb-6 text-display-md">פוסט חדש</h1>

      {error ? <ErrorBanner className="mb-4 max-w-xl">{error}</ErrorBanner> : null}

      <PostForm action={createPost} />
    </div>
  );
}
