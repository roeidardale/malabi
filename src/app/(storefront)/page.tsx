import { LayoutGrid } from "lucide-react";
import { getStorefrontCategories } from "@/lib/categoryTree";
import { getPublishedPosts } from "@/lib/posts";
import { CategoryTile } from "@/components/storefront/CategoryTile";
import { Hero } from "@/components/storefront/Hero";
import { PostCard } from "@/components/storefront/PostCard";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

const HERO_TILE_COUNT = 3;

export default async function HomePage() {
  const [categories, posts] = await Promise.all([getStorefrontCategories(), getPublishedPosts()]);

  return (
    <div className="flex flex-col gap-12">
      <Hero showcase={categories.filter((c) => c.imageUrl).slice(0, HERO_TILE_COUNT)} />

      {posts.length > 0 && (
        <section aria-labelledby="news">
          <h2 id="news" className="mb-4 font-display text-2xl sm:text-3xl">
            חדשות ועדכונים
          </h2>
          <div
            className={cn("grid gap-4 md:grid-cols-2", posts.length > 2 && "lg:grid-cols-3")}
          >
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={{
                  id: post.id,
                  title: post.title,
                  body: post.body,
                  imageUrl: post.imageUrl,
                  isPinned: post.isPinned,
                  publishedAt: post.publishedAt.toISOString(),
                }}
              />
            ))}
          </div>
        </section>
      )}

      <section id="categories" aria-labelledby="categories-heading" className="scroll-mt-32">
        <h2 id="categories-heading" className="mb-4 font-display text-2xl sm:text-3xl">
          קטגוריות
        </h2>

        {categories.length === 0 ? (
          <EmptyState
            icon={LayoutGrid}
            title="אין קטגוריות זמינות כרגע"
            description="נסו לרענן את הדף בעוד כמה רגעים."
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
            {categories.map((category, index) => (
              <CategoryTile key={category.id} category={category} priority={index < 4} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
