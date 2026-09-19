// scripts/scrape/downloadImages.ts
//
// Downloads a product's image (already-resolved absolute URL on the live
// site) to public/media/products/{productId}/{filename}, and returns the
// local public path to store on `Product.imageUrl`. Idempotent: skips the
// network fetch if the file already exists on disk.

import { access, mkdir, writeFile } from "fs/promises";
import path from "path";
import { fetchBuffer } from "./httpClient";

const PUBLIC_MEDIA_ROOT = path.join(process.cwd(), "public", "media", "products");

function sanitizeFilename(name: string): string {
  const cleaned = name.replace(/[/\\?%*:|"<>]/g, "_").trim();
  return cleaned.length > 0 ? cleaned : "image";
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function downloadProductImage(
  productId: string,
  imageUrl: string,
): Promise<string | null> {
  let url: URL;
  try {
    url = new URL(imageUrl);
  } catch {
    console.warn(`  [image] invalid image URL, skipping: ${imageUrl}`);
    return null;
  }

  const rawBasename = decodeURIComponent(path.basename(url.pathname));
  const filename = sanitizeFilename(rawBasename);
  const dir = path.join(PUBLIC_MEDIA_ROOT, productId);
  const filePath = path.join(dir, filename);
  const publicPath = `/media/products/${productId}/${filename}`;

  if (await fileExists(filePath)) {
    return publicPath;
  }

  try {
    await mkdir(dir, { recursive: true });
    const { buffer } = await fetchBuffer(url.href);
    await writeFile(filePath, buffer);
    return publicPath;
  } catch (err) {
    console.warn(
      `  [image] failed to download ${imageUrl}: ${err instanceof Error ? err.message : String(err)}`,
    );
    return null;
  }
}
