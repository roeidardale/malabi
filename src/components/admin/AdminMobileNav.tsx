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

export function AdminMobileNav({
  navItems,
  logoutAction,
}: {
  navItems: { href: string; label: string }[];
  logoutAction: () => void;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="secondary" size="icon" aria-label="תפריט ניהול">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>ניהול — מלבי אקספרס</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-1 flex-col gap-1 px-4">
          {navItems.map((item) => (
            <SheetClose asChild key={item.href}>
              <Link
                href={item.href}
                className="rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-surface"
              >
                {item.label}
              </Link>
            </SheetClose>
          ))}
        </nav>
        <form action={logoutAction} className="px-4">
          <Button type="submit" variant="ghost" className="w-full justify-start">
            התנתקות
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
