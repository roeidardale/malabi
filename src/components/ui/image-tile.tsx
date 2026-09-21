import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

type Aspect = "square" | "4/3" | "portrait";

const aspectClasses: Record<Aspect, string> = {
  square: "aspect-square",
  "4/3": "aspect-[4/3]",
  portrait: "aspect-[4/5]",
};

/**
 * A fixed-ratio photo frame. Photos are shown whole (`contain`) on a white
 * shelf so tall bottles are never cropped and every tile is the same size
 * regardless of the source image's dimensions. Use `fit="cover"` only for
 * lifestyle/banner imagery where cropping is fine.
 */
export function ImageTile({
  src,
  alt,
  aspect = "square",
  fit = "contain",
  sizes,
  priority,
  className,
}: {
  src?: string | null;
  alt: string;
  aspect?: Aspect;
  fit?: "contain" | "cover";
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md",
        src ? "bg-white" : "bg-surface-deep",
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
          className={fit === "contain" ? "object-contain p-2" : "object-cover"}
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
