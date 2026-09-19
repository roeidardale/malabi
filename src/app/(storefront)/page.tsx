import Link from "next/link";
import { getTopLevelCategories } from "@/lib/categoryTree";
import { formatIls, MIN_ORDER_AGOROT } from "@/lib/money";

export default async function HomePage() {
  const categories = await getTopLevelCategories();

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-xl border border-border bg-surface px-6 py-10 text-center sm:text-start">
        <h1 className="text-3xl font-bold sm:text-4xl">משלוחי אלכוהול באשקלון והסביבה</h1>
        <p className="mt-3 text-muted">מבחר בירות, יינות ומשקאות חריפים — עד הבית, מהר.</p>
      </section>

      <div className="rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent">
        מינימום הזמנה: {formatIls(MIN_ORDER_AGOROT)}
      </div>

      <section>
        <h2 className="mb-4 text-xl font-semibold">קטגוריות</h2>

        {categories.length === 0 ? (
          <p className="text-muted">אין קטגוריות זמינות כרגע.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/${category.slug}`}
                className="group flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-4 text-center transition-colors hover:border-accent"
              >
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-md bg-surface-deep">
                  {category.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={category.imageUrl}
                      alt={category.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-muted">אין תמונה</span>
                  )}
                </div>
                <span className="font-medium group-hover:text-accent">{category.name}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
