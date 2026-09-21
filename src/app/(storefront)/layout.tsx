import Link from "next/link";
import type { ReactNode } from "react";
import { MessageCircle } from "lucide-react";
import { getCartSummary } from "@/lib/cart";
import { getStorefrontCategories } from "@/lib/categoryTree";
import { formatIls, MIN_ORDER_AGOROT } from "@/lib/money";
import { STATIC_PAGE_PATHS, WHATSAPP_URL } from "@/lib/routes";
import { getCustomerSession } from "@/lib/session";
import { CartLink } from "@/components/storefront/CartLink";
import { CategoryRail } from "@/components/storefront/CategoryRail";
import { MobileNav } from "@/components/storefront/MobileNav";

export default async function StorefrontLayout({ children }: { children: ReactNode }) {
  const [{ itemCount }, customerSession, categories] = await Promise.all([
    getCartSummary(),
    getCustomerSession(),
    getStorefrontCategories(),
  ]);
  const isLoggedIn = Boolean(customerSession.customerId);

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-border bg-surface-deep/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
          <Link href="/" className="font-display text-2xl text-accent">
            מלבי אקספרס
          </Link>

          <div className="flex items-center gap-2">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden h-10 items-center gap-2 rounded-md border border-border px-3 text-sm text-foreground transition-colors hover:border-accent md:inline-flex"
            >
              <MessageCircle className="size-4" aria-hidden />
              הזמנה בוואטסאפ
            </a>
            <Link
              href={isLoggedIn ? "/customer-profile" : "/login"}
              className="hidden h-10 items-center rounded-md border border-border px-3 text-sm text-foreground transition-colors hover:border-accent md:inline-flex"
            >
              {isLoggedIn ? "החשבון שלי" : "התחברות"}
            </Link>
            <CartLink itemCount={itemCount} />
            <MobileNav isLoggedIn={isLoggedIn} whatsappUrl={WHATSAPP_URL} />
          </div>
        </div>

        <CategoryRail
          categories={categories.map((category) => ({
            id: category.id,
            name: category.name,
            href: `/${category.fullSlugPath}`,
          }))}
        />
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>

      <footer className="border-t border-border bg-surface-deep">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <p className="font-display text-xl text-accent">מלבי אקספרס</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              משלוחי אלכוהול ונשנושים באשקלון והסביבה. מינימום הזמנה {formatIls(MIN_ORDER_AGOROT)}.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm" aria-label="קישורים">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              צרו קשר בוואטסאפ
            </a>
            <Link href={STATIC_PAGE_PATHS.about} className="text-muted-foreground hover:text-accent">
              אודות
            </Link>
            <Link href={STATIC_PAGE_PATHS.contact} className="text-muted-foreground hover:text-accent">
              צור קשר
            </Link>
            <Link href={STATIC_PAGE_PATHS.terms} className="text-muted-foreground hover:text-accent">
              תקנון
            </Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
