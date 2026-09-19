import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { getTopLevelCategories } from "@/lib/categoryTree";
import { formatIls, MIN_ORDER_AGOROT } from "@/lib/money";
import { Card } from "@/components/ui/card";
import { ImageTile } from "@/components/ui/image-tile";
import { EmptyState } from "@/components/ui/empty-state";

export default async function HomePage() {
  const categories = await getTopLevelCategories();

  return (
    <div className="flex flex-col gap-8">
      <section className="animate-in fade-in slide-in-from-bottom-4 duration-moment ease-out rounded-xl border border-border bg-surface px-6 py-10 text-center sm:px-10 sm:text-start">
        <h1 className="text-display-md sm:text-display-lg">
          משלוחי אלכוהול באשקלון והסביבה
        </h1>
        <p className="mt-3 text-body text-muted-foreground">
          מבחר בירות, יינות ומשקאות חריפים — עד הבית, מהר.
        </p>
      </section>

      <div className="rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent shadow-accent">
        מינימום הזמנה: {formatIls(MIN_ORDER_AGOROT)}
      </div>

      <section>
        <h2 className="mb-4 text-heading">קטגוריות</h2>

        {categories.length === 0 ? (
          <EmptyState
            icon={LayoutGrid}
            title="אין קטגוריות זמינות כרגע"
            description="נסו לרענן את הדף בעוד כמה רגעים."
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {categories.map((category) => (
              <Link key={category.id} href={`/${category.slug}`}>
                <Card
                  interactive
                  className="group flex flex-col items-center gap-3 text-center"
                >
                  <ImageTile
                    src={category.imageUrl}
                    alt={category.name}
                    className="w-24"
                    sizes="96px"
                  />
                  <span className="font-medium group-hover:text-accent">
                    {category.name}
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
