// Gives every product that has no variants a single default variant, so it
// can be added to the cart. Idempotent. Never touches products that already
// have variants.
//
//   npm run backfill-variants

import { PrismaClient } from "@prisma/client";
import { DEFAULT_VARIANT_NAME, DEFAULT_VARIANT_SOURCE_VALUE } from "./lib/defaultVariant";

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    where: { variants: { none: {} } },
    select: { id: true },
  });

  if (products.length === 0) {
    console.log("Every product already has at least one variant.");
    return;
  }

  const { count } = await prisma.productVariant.createMany({
    data: products.map(({ id }) => ({
      productId: id,
      name: DEFAULT_VARIANT_NAME,
      sourceOptionValue: DEFAULT_VARIANT_SOURCE_VALUE,
      priceAgorot: 0,
      priceSource: "MANUAL",
      isDefault: true,
      sortOrder: 0,
      isActive: true,
    })),
    skipDuplicates: true,
  });

  console.log(`Created ${count} default variants for ${products.length} variant-less products.`);
}

main()
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
