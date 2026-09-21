import { notFound } from "next/navigation";
import { ErrorBanner } from "@/components/ui/error-banner";
import { prisma } from "@/lib/prisma";
import { updatePost } from "@/server/actions/admin-posts";
import { PostForm } from "@/components/admin/PostForm";
import { requireAdmin } from "@/server/actions/admin-guard";

export default async function EditPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin(["OWNER"]);
  const { id } = await params;
  const { error } = await searchParams;

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) notFound();

  return (
    <div>
      <h1 className="mb-6 text-display-md">עריכת פוסט</h1>

      {error ? <ErrorBanner className="mb-4 max-w-xl">{error}</ErrorBanner> : null}

      <PostForm action={updatePost.bind(null, post.id)} post={post} />
    </div>
  );
}
