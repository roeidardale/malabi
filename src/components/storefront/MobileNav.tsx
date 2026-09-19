"use client";

import Link from "next/link";
import { Menu, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";

export function MobileNav({
  itemCount,
  isLoggedIn,
  whatsappUrl,
}: {
  itemCount: number;
  isLoggedIn: boolean;
  whatsappUrl: string;
}) {
  return (
    <div className="flex items-center gap-2 md:hidden">
      <Link
        href="/סל-קניות"
        className="relative inline-flex size-10 items-center justify-center rounded-md border border-border bg-surface-deep text-foreground"
        aria-label="סל קניות"
      >
        <ShoppingCart className="size-5" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -end-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-accent-foreground">
            {itemCount}
          </span>
        )}
      </Link>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="secondary" size="icon" aria-label="תפריט">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>תפריט</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-2 px-4">
            <SheetClose asChild>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-border px-3 py-2 text-sm text-foreground transition-colors hover:border-accent"
              >
                הזמנה בוואטסאפ
              </a>
            </SheetClose>
            <SheetClose asChild>
              <Link
                href={isLoggedIn ? "/customer-profile" : "/login"}
                className="rounded-md border border-border px-3 py-2 text-sm text-foreground transition-colors hover:border-accent"
              >
                {isLoggedIn ? "החשבון שלי" : "התחברות"}
              </Link>
            </SheetClose>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
