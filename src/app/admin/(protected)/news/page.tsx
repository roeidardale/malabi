import Link from "next/link";
import { Newspaper } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorBanner } from "@/components/ui/error-banner";
import { deletePost, togglePostPublished } from "@/server/actions/admin-posts";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { requireAdmin } from "@/server/actions/admin-guard";

export default async function AdminNewsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin(["OWNER"]);
  const { error } = await searchParams;

  const posts = await prisma.post.findMany({
    orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-display-md">חדשות ועדכונים</h1>
        <Link href="/admin/news/new">
          <Button variant="primary">פוסט חדש</Button>
        </Link>
      </div>

      {error ? <ErrorBanner className="mb-4">{error}</ErrorBanner> : null}

      {posts.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title="אין פוסטים עדיין"
          description="פוסטים מפורסמים מופיעים בדף הבית של האתר."
        />
      ) : (
        <Table>
          <TableHeader>
            <tr>
              <th>כותרת</th>
              <th>תאריך פרסום</th>
              <th>מוצמד</th>
              <th>סטטוס</th>
              <th>פעולות</th>
            </tr>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell>{post.title}</TableCell>
                <TableCell className="text-muted-foreground">
                  {post.publishedAt.toLocaleDateString("he-IL")}
                </TableCell>
                <TableCell>{post.isPinned ? <Badge tone="accent">מוצמד</Badge> : "—"}</TableCell>
                <TableCell>
                  <form action={togglePostPublished.bind(null, post.id, !post.isPublished)}>
                    <button type="submit">
                      <Badge tone={post.isPublished ? "success" : "neutral"}>
                        {post.isPublished ? "מפורסם" : "טיוטה"}
                      </Badge>
                    </button>
                  </form>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/news/${post.id}`}>
                      <Button variant="secondary">עריכה</Button>
                    </Link>
                    <form action={deletePost.bind(null, post.id)}>
                      <DeleteButton confirmMessage="למחוק את הפוסט? הפעולה בלתי הפיכה." />
                    </form>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
