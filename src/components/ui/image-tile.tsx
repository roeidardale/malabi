import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

type Aspect = "square" | "4/3" | "portrait";

const aspectClasses: Record<Aspect, string> = {
  square: "aspect-square",
  "4/3": "aspect-[4/3]",
  portrait: "aspect-[3/4]",
};

export function ImageTile({
  src,
  alt,
  aspect = "square",
  sizes,
  priority,
  className,
}: {
  src?: string | null;
  alt: string;
  aspect?: Aspect;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-surface-deep",
        aspectClasses[aspect],
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes ?? "(min-width: 1024px) 20vw, 45vw"}
          className="object-cover"
          priority={priority}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
          <ImageOff className="size-6" />
          <span className="text-xs">אין תמונה</span>
        </div>
      )}
    </div>
  );
}
