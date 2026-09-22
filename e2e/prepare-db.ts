// Creates (if needed), migrates and re-seeds the e2e database. Runs as part of
// the e2e web server command, before `next dev` starts.

import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { ADMIN, CUSTOMER, E2E_DB_NAME } from "./env";

async function ensureDatabase() {
  const maintenance = new PrismaClient({ datasourceUrl: process.env.E2E_MAINTENANCE_URL });
  try {
    const found = await maintenance.$queryRaw<{ datname: string }[]>`
      SELECT datname FROM pg_database WHERE datname = ${E2E_DB_NAME}`;
    if (found.length === 0) {
      await maintenance.$executeRawUnsafe(`CREATE DATABASE "${E2E_DB_NAME}"`);
      console.log(`[e2e] created database ${E2E_DB_NAME}`);
    }
  } finally {
    await maintenance.$disconnect();
  }
}

function firstCategoryPhoto(): string | null {
  const root = path.join(process.cwd(), "public", "media", "categories");
  try {
    for (const dir of readdirSync(root)) {
      const [file] = readdirSync(path.join(root, dir));
      if (file) return `/media/categories/${dir}/${file}`;
    }
  } catch {
    // no category photos on disk: tiles fall back to the placeholder
  }
  return null;
}

async function seed(prisma: PrismaClient) {
  // Children before parents.
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cartSession.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.post.deleteMany();
  await prisma.staticPage.deleteMany();
  await prisma.otpRequestLog.deleteMany();
  await prisma.customer.deleteMany(); // cascades to Address
  await prisma.adminUser.deleteMany();

  const photo = firstCategoryPhoto();

  const root = await prisma.category.create({
    data: { name: "אלכוהול", slug: "alcohol", fullSlugPath: "alcohol" },
  });
  const beer = await prisma.category.create({
    data: {
      name: "בירות",
      slug: "beer",
      parentId: root.id,
      fullSlugPath: "alcohol/beer",
      imageUrl: photo,
      sortOrder: 1,
    },
  });
  const snacks = await prisma.category.create({
    data: {
      name: "נשנושים",
      slug: "snacks",
      parentId: root.id,
      fullSlugPath: "alcohol/snacks",
      imageUrl: photo,
      sortOrder: 2,
    },
  });
  const bulk = await prisma.category.create({
    data: {
      name: "מבחר גדול",
      slug: "bulk",
      parentId: root.id,
      fullSlugPath: "alcohol/bulk",
      imageUrl: photo,
      sortOrder: 3,
    },
  });
  // Nothing buyable inside: must never show up on the storefront.
  await prisma.category.create({
    data: { name: "קטגוריה ריקה", slug: "empty", fullSlugPath: "empty" },
  });

  await prisma.product.create({
    data: {
      name: "בירה לבדיקה",
      slug: "test-beer",
      categoryId: beer.id,
      descriptionShort: '330 מ"ל',
      variants: {
        create: [
          { name: "בקבוק", priceAgorot: 1400, isDefault: true, sortOrder: 0, sourceOptionValue: "bottle" },
          { name: "שישייה", priceAgorot: 7500, sortOrder: 1, sourceOptionValue: "six" },
        ],
      },
    },
  });
  await prisma.product.create({
    data: {
      name: "חטיף לבדיקה",
      slug: "test-snack",
      categoryId: snacks.id,
      variants: {
        create: [{ name: "יחידה", priceAgorot: 1200, isDefault: true, sourceOptionValue: "default" }],
      },
    },
  });
  await prisma.product.create({
    data: {
      name: "מוצר ללא מחיר",
      slug: "no-price",
      categoryId: snacks.id,
      variants: {
        create: [{ name: "יחידה", priceAgorot: 0, isDefault: true, sourceOptionValue: "default" }],
      },
    },
  });
  for (let i = 1; i <= 30; i++) {
    await prisma.product.create({
      data: {
        name: `מוצר ${String(i).padStart(2, "0")}`,
        slug: `bulk-${i}`,
        categoryId: bulk.id,
        sortOrder: i,
        variants: {
          create: [{ name: "יחידה", priceAgorot: 1000, isDefault: true, sourceOptionValue: "default" }],
        },
      },
    });
  }

  await prisma.post.create({
    data: {
      title: "עדכון לבדיקה",
      body: "זהו פוסט שנוצר עבור בדיקות אוטומטיות.",
      isPublished: true,
    },
  });
  await prisma.staticPage.create({
    data: { slug: "about", title: "אודות", bodyHtml: "<p>מלבי אקספרס: משלוחים באשקלון.</p>" },
  });

  await prisma.adminUser.create({
    data: {
      email: ADMIN.email,
      name: "E2E Admin",
      role: "OWNER",
      passwordHash: await bcrypt.hash(ADMIN.password, 10),
    },
  });

  await prisma.customer.create({
    data: { phone: CUSTOMER.phone, name: "E2E Customer" },
  });
}

async function main() {
  await ensureDatabase();
  execFileSync("npx", ["prisma", "migrate", "deploy"], { stdio: "inherit", env: process.env });

  const prisma = new PrismaClient();
  try {
    await seed(prisma);
    console.log("[e2e] database seeded");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("[e2e] database preparation failed:", error);
  process.exit(1);
});
