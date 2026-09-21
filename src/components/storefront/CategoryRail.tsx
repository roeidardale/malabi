"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type RailCategory = { id: string; name: string; href: string };

/** Horizontally scrollable category shortcuts under the header. */
export function CategoryRail({ categories }: { categories: RailCategory[] }) {
  const pathname = decodeURIComponent(usePathname());

  if (categories.length === 0) return null;

  return (
    <nav aria-label="קטגוריות" className="border-t border-border">
      <ul className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((category) => {
          const active = pathname === category.href || pathname.startsWith(`${category.href}/`);
          return (
            <li key={category.id} className="shrink-0">
              <Link
                href={category.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-8 items-center rounded-full border px-3.5 text-sm transition-colors duration-fast",
                  active
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border text-foreground hover:border-accent hover:text-accent",
                )}
              >
                {category.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
