import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Server-rendered prev/next pager driven by a `?page=` search param. */
export function Pagination({
  basePath,
  page,
  pageCount,
}: {
  basePath: string;
  page: number;
  pageCount: number;
}) {
  if (pageCount <= 1) return null;

  const hrefFor = (target: number) => (target === 1 ? basePath : `${basePath}?page=${target}`);
  const linkClass =
    "inline-flex h-10 items-center gap-1 rounded-md border border-border px-4 text-sm transition-colors hover:border-accent";

  return (
    <nav aria-label="עמודים" className="flex items-center justify-center gap-3">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={linkClass} rel="prev">
          <ChevronRight className="size-4" aria-hidden />
          הקודם
        </Link>
      ) : (
        <span className={cn(linkClass, "pointer-events-none opacity-40")}>
          <ChevronRight className="size-4" aria-hidden />
          הקודם
        </span>
      )}

      <span className="text-sm text-muted-foreground">
        עמוד {page} מתוך {pageCount}
      </span>

      {page < pageCount ? (
        <Link href={hrefFor(page + 1)} className={linkClass} rel="next">
          הבא
          <ChevronLeft className="size-4" aria-hidden />
        </Link>
      ) : (
        <span className={cn(linkClass, "pointer-events-none opacity-40")}>
          הבא
          <ChevronLeft className="size-4" aria-hidden />
        </span>
      )}
    </nav>
  );
}
