import Link from "next/link";
import type { Category } from "@prisma/client";
import { ImageTile } from "@/components/ui/image-tile";

/** A category as a photo "poster": whole photo on white, name on a dark bar beneath. */
export function CategoryTile({
  category,
  priority,
}: {
  category: Pick<Category, "name" | "imageUrl" | "fullSlugPath">;
  priority?: boolean;
}) {
  return (
    <Link
      href={`/${category.fullSlugPath}`}
      className="group flex flex-col overflow-hidden rounded-md border border-border bg-surface transition-colors duration-fast hover:border-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <ImageTile
        src={category.imageUrl}
        alt=""
        aspect="portrait"
        className="rounded-none"
        sizes="(min-width: 768px) 22vw, (min-width: 640px) 30vw, 45vw"
        priority={priority}
      />
      <span className="px-3 py-2.5 text-center font-semibold transition-colors group-hover:text-accent">
        {category.name}
      </span>
    </Link>
  );
}
