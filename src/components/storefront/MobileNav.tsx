"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
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
  isLoggedIn,
  whatsappUrl,
}: {
  isLoggedIn: boolean;
  whatsappUrl: string;
}) {
  return (
    <div className="md:hidden">
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
