import { prisma } from "@/lib/prisma";

/** Published news for the landing page: pinned first, then newest. */
export async function getPublishedPosts(limit = 6) {
  return prisma.post.findMany({
    where: { isPublished: true, publishedAt: { lte: new Date() } },
    orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
    take: limit,
  });
}
