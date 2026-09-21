import Link from "next/link";

type Crumb = { id: string; name: string; fullSlugPath: string };

export function Breadcrumbs({
  items,
  trailingLabel,
}: {
  items: Crumb[];
  trailingLabel?: string;
}) {
  return (
    <nav
      className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
      aria-label="נתיב ניווט"
    >
      <Link href="/" className="hover:text-accent">
        בית
      </Link>
      {items.map((item) => (
        <span key={item.id} className="flex items-center gap-2">
          <span aria-hidden>/</span>
          <Link href={`/${item.fullSlugPath}`} className="hover:text-accent">
            {item.name}
          </Link>
        </span>
      ))}
      {trailingLabel && (
        <span className="flex items-center gap-2">
          <span aria-hidden>/</span>
          <span className="text-foreground">{trailingLabel}</span>
        </span>
      )}
    </nav>
  );
}
