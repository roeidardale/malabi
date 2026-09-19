import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function upsertCategory(name: string, slug: string, parentId: string | null, parentPath: string | null) {
  const fullSlugPath = parentPath ? `${parentPath}/${slug}` : slug;
  return prisma.category.upsert({
    where: { fullSlugPath },
    update: { name, parentId },
    create: { name, slug, parentId, fullSlugPath },
  });
}

async function main() {
  const alcohol = await upsertCategory("אלכוהול", "אלכוהול", null, null);
  const beers = await upsertCategory("בירות", "בירות", alcohol.id, alcohol.fullSlugPath);
  const vodka = await upsertCategory("וודקה", "וודקה", alcohol.id, alcohol.fullSlugPath);

  const beer = await prisma.product.upsert({
    where: { categoryId_slug: { categoryId: beers.id, slug: "בלאנק" } },
    update: {},
    create: {
      name: "בלאנק",
      slug: "בלאנק",
      categoryId: beers.id,
      descriptionShort: '330 מ"ל',
      isActive: true,
    },
  });

  await prisma.productVariant.upsert({
    where: { productId_sourceOptionValue: { productId: beer.id, sourceOptionValue: "dev-bottle" } },
    update: {},
    create: {
      productId: beer.id,
      name: "בקבוק בירה",
      priceAgorot: 1500,
      priceSource: "MANUAL",
      sourceOptionValue: "dev-bottle",
      isDefault: true,
    },
  });

  await prisma.productVariant.upsert({
    where: { productId_sourceOptionValue: { productId: beer.id, sourceOptionValue: "dev-six-pack" } },
    update: {},
    create: {
      productId: beer.id,
      name: "שישייה",
      priceAgorot: 6500,
      priceSource: "MANUAL",
      sourceOptionValue: "dev-six-pack",
    },
  });

  const vodkaProduct = await prisma.product.upsert({
    where: { categoryId_slug: { categoryId: vodka.id, slug: "אבסולוט" } },
    update: {},
    create: {
      name: "אבסולוט",
      slug: "אבסולוט",
      categoryId: vodka.id,
      descriptionShort: "700 מ\"ל",
      isActive: true,
    },
  });

  await prisma.productVariant.upsert({
    where: { productId_sourceOptionValue: { productId: vodkaProduct.id, sourceOptionValue: "dev-bottle" } },
    update: {},
    create: {
      productId: vodkaProduct.id,
      name: "בקבוק",
      priceAgorot: 12000,
      priceSource: "MANUAL",
      sourceOptionValue: "dev-bottle",
      isDefault: true,
    },
  });

  const staticPages: { slug: string; title: string; bodyHtml: string }[] = [
    { slug: "אודות", title: "אודות", bodyHtml: "<p>מלבי אקספרס - משלוחי אלכוהול באשקלון והסביבה.</p>" },
    { slug: "צור-קשר", title: "צור קשר", bodyHtml: "<p>טלפון: 052-3311457</p>" },
    { slug: "תקנון", title: "תקנון", bodyHtml: "<p>מינימום הזמנה: 35 ₪.</p>" },
  ];

  for (const page of staticPages) {
    await prisma.staticPage.upsert({
      where: { slug: page.slug },
      update: { title: page.title, bodyHtml: page.bodyHtml },
      create: page,
    });
  }

  console.log("Dev seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
