import Link from "next/link";
import type { ReactNode } from "react";
import { getCartSummary } from "@/lib/cart";
import { getCustomerSession } from "@/lib/session";
import { MobileNav } from "@/components/storefront/MobileNav";

const WHATSAPP_URL = "https://api.whatsapp.com/send?phone=972523311457";

export default async function StorefrontLayout({ children }: { children: ReactNode }) {
  const { itemCount } = await getCartSummary();
  const customerSession = await getCustomerSession();
  const isLoggedIn = Boolean(customerSession.customerId);

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="text-xl font-bold text-accent">
            מלבי אקספרס
          </Link>

          <nav className="hidden items-center gap-3 md:flex">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-foreground transition-colors hover:border-accent"
            >
              הזמנה בוואטסאפ
            </a>

            <Link
              href="/סל-קניות"
              className="relative inline-flex items-center gap-2 rounded-md border border-border bg-surface-deep px-3 py-2 text-sm text-foreground transition-colors hover:border-accent"
            >
              <span>סל קניות</span>
              {itemCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-accent-foreground">
                  {itemCount}
                </span>
              )}
            </Link>

            <Link
              href={isLoggedIn ? "/customer-profile" : "/login"}
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-foreground transition-colors hover:border-accent"
            >
              {isLoggedIn ? "החשבון שלי" : "התחברות"}
            </Link>
          </nav>

          <MobileNav
            itemCount={itemCount}
            isLoggedIn={isLoggedIn}
            whatsappUrl={WHATSAPP_URL}
          />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>

      <footer className="border-t border-border bg-surface-deep px-4 py-6 text-center text-sm text-muted-foreground">
        <p>מלבי אקספרס — משלוחי אלכוהול באשקלון והסביבה</p>
        <nav className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
            צרו קשר בוואטסאפ
          </a>
          <Link href="/אודות" className="hover:text-accent hover:underline">
            אודות
          </Link>
          <Link href="/צור-קשר" className="hover:text-accent hover:underline">
            צור קשר
          </Link>
          <Link href="/תקנון" className="hover:text-accent hover:underline">
            תקנון
          </Link>
        </nav>
      </footer>
    </>
  );
}
