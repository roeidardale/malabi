// Audits catalog photos: every product/category `imageUrl` must point at a
// file that exists under public/. Exits non-zero if any are dead, so it can
// gate CI. Products with no imageUrl at all are reported but are not failures
// (the storefront shows a placeholder tile for them).
//
//   npm run check-media

import { access } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function exists(publicPath: string): Promise<boolean> {
  try {
    await access(path.join(process.cwd(), "public", decodeURIComponent(publicPath)));
    return true;
  } catch {
    return false;
  }
}

async function audit(label: string, rows: { name: string; imageUrl: string | null }[]) {
  const withoutImage = rows.filter((row) => !row.imageUrl);
  const dead: string[] = [];
  for (const row of rows) {
    if (row.imageUrl && !(await exists(row.imageUrl))) dead.push(`${row.name} -> ${row.imageUrl}`);
  }
  console.log(
    `${label}: ${rows.length} total, ${rows.length - withoutImage.length} with a photo, ` +
      `${withoutImage.length} without, ${dead.length} dead link(s)`,
  );
  for (const name of withoutImage.map((row) => row.name).slice(0, 40)) console.log(`  no photo: ${name}`);
  for (const line of dead) console.log(`  DEAD: ${line}`);
  return dead.length;
}

async function main() {
  const [categories, products] = await Promise.all([
    prisma.category.findMany({ where: { isActive: true }, select: { name: true, imageUrl: true } }),
    prisma.product.findMany({ where: { isActive: true }, select: { name: true, imageUrl: true } }),
  ]);
  const dead = (await audit("Categories", categories)) + (await audit("Products", products));
  if (dead > 0) process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error("Media check failed:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
