import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export type MediaKind = "products" | "categories" | "posts";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// SVG is deliberately excluded: it can carry scripts and these files are served
// from the site's own origin.
const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export class ImageUploadError extends Error {}

/** True when the form actually carried a file (browsers send an empty File when none is picked). */
export function hasUpload(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

/**
 * Validates and stores an uploaded image under public/media/{kind}/{ownerId}/
 * and returns the public path to save on the model's `imageUrl`.
 * Throws ImageUploadError (with a user-facing Hebrew message) on bad input.
 */
export async function saveUploadedImage(
  kind: MediaKind,
  ownerId: string,
  file: File,
): Promise<string> {
  const extension = EXTENSION_BY_MIME[file.type];
  if (!extension) {
    throw new ImageUploadError("סוג הקובץ אינו נתמך. יש להעלות JPG, PNG, WebP או GIF");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new ImageUploadError("התמונה גדולה מדי (עד 5MB)");
  }

  const dir = path.join(process.cwd(), "public", "media", kind, ownerId);
  await mkdir(dir, { recursive: true });
  const filename = `${Date.now()}.${extension}`;
  await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
  return `/media/${kind}/${ownerId}/${filename}`;
}
