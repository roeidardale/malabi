import Link from "next/link";
import { MapPin, MessageCircle, ShieldCheck } from "lucide-react";
import type { Category } from "@prisma/client";
import { formatIls, MIN_ORDER_AGOROT } from "@/lib/money";
import { WHATSAPP_URL } from "@/lib/routes";
import { buttonVariants } from "@/components/ui/button";
import { ImageTile } from "@/components/ui/image-tile";

const facts = [
  { icon: MapPin, text: "משלוחים באשקלון והסביבה" },
  { icon: ShieldCheck, text: `מינימום הזמנה ${formatIls(MIN_ORDER_AGOROT)}` },
];

// The middle tile sits higher so the row reads as bottles standing at different heights.
const TILE_OFFSETS = ["md:mt-8", "md:-mt-2", "md:mt-8"];

export function Hero({ showcase }: { showcase: Pick<Category, "id" | "name" | "imageUrl" | "fullSlugPath">[] }) {
  return (
    <section className="grid items-center gap-8 overflow-hidden rounded-xl border border-border bg-surface-deep px-6 py-10 sm:px-10 md:grid-cols-[1.1fr_1fr] md:py-12">
      <div className="flex flex-col items-start gap-5">
        <h1 className="font-display text-4xl leading-[1.1] sm:text-5xl">
          משלוחי אלכוהול ונשנושים באשקלון, עד הדלת
        </h1>
        <p className="max-w-md text-body text-muted-foreground">
          בירות, יינות ומשקאות חריפים, וכל מה שצריך לצד זה. בוחרים, מוסיפים לסל ואנחנו מגיעים.
        </p>

        <div className="flex flex-wrap gap-3">
          <a href="#categories" className={buttonVariants({ variant: "primary", size: "lg" })}>
            לכל הקטגוריות
          </a>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "secondary", size: "lg" })}
          >
            <MessageCircle className="size-5" aria-hidden />
            הזמנה בוואטסאפ
          </a>
        </div>

        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
          {facts.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-1.5">
              <Icon className="size-4 text-accent" aria-hidden />
              {text}
            </li>
          ))}
        </ul>
      </div>

      {showcase.length > 0 && (
        <div className="grid grid-cols-3 gap-3" aria-hidden>
          {showcase.map((category, index) => (
            <Link
              key={category.id}
              href={`/${category.fullSlugPath}`}
              tabIndex={-1}
              className={TILE_OFFSETS[index % TILE_OFFSETS.length]}
            >
              <ImageTile
                src={category.imageUrl}
                alt=""
                aspect="portrait"
                sizes="(min-width: 768px) 15vw, 28vw"
                priority
                className="shadow-md"
              />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
