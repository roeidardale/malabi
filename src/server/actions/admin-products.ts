"use server";

import { redirect } from "next/navigation";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { shekelsToAgorot } from "@/lib/money";
import { requireAdmin } from "./admin-guard";

function errorRedirect(redirectPath: string, message: string): never {
  redirect(`${redirectPath}?error=${encodeURIComponent(message)}`);
}

function sanitizeFilename(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._-]/g, "_");
  return base || "image";
}

export async function createProduct(formData: FormData): Promise<void> {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const descriptionShort = String(formData.get("descriptionShort") ?? "").trim() || null;
  const descriptionLong = String(formData.get("descriptionLong") ?? "").trim() || null;
  const isActive = formData.get("isActive") === "on";
  const sortOrder = Number(formData.get("sortOrder") ?? 0) || 0;

  if (!name || !slug || !categoryId) {
    errorRedirect("/admin/products/new", "שם, סלאג וקטגוריה הם שדות חובה");
  }

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    errorRedirect("/admin/products/new", "קטגוריה לא נמצאה");
  }

  let product;
  try {
    product = await prisma.product.create({
      data: {
        name,
        slug,
        categoryId,
        descriptionShort,
        descriptionLong,
        isActive,
        sortOrder,
      },
    });
  } catch {
    errorRedirect("/admin/products/new", "כבר קיים מוצר עם סלאג זהה בקטגוריה זו");
  }

  redirect(`/admin/products/${product.id}`);
}

export async function updateProduct(id: string, formData: FormData): Promise<void> {
  await requireAdmin();

  const current = await prisma.product.findUnique({ where: { id } });
  if (!current) {
    errorRedirect("/admin/products", "מוצר לא נמצא");
  }

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const descriptionShort = String(formData.get("descriptionShort") ?? "").trim() || null;
  const descriptionLong = String(formData.get("descriptionLong") ?? "").trim() || null;
  const isActive = formData.get("isActive") === "on";
  const sortOrder = Number(formData.get("sortOrder") ?? 0) || 0;

  if (!name || !slug || !categoryId) {
    errorRedirect(`/admin/products/${id}`, "שם, סלאג וקטגוריה הם שדות חובה");
  }

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    errorRedirect(`/admin/products/${id}`, "קטגוריה לא נמצאה");
  }

  let imageUrl = current!.imageUrl;
  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    const dir = path.join(process.cwd(), "public", "media", "products", id);
    await mkdir(dir, { recursive: true });
    const filename = `${Date.now()}-${sanitizeFilename(image.name)}`;
    const buffer = Buffer.from(await image.arrayBuffer());
    await writeFile(path.join(dir, filename), buffer);
    imageUrl = `/media/products/${id}/${filename}`;
  }

  try {
    await prisma.product.update({
      where: { id },
      data: {
        name,
        slug,
        categoryId,
        descriptionShort,
        descriptionLong,
        isActive,
        sortOrder,
        imageUrl,
      },
    });
  } catch {
    errorRedirect(`/admin/products/${id}`, "כבר קיים מוצר עם סלאג זהה בקטגוריה זו");
  }

  redirect(`/admin/products/${id}`);
}

export async function deleteProduct(id: string): Promise<void> {
  await requireAdmin();

  try {
    await prisma.$transaction([
      prisma.productVariant.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id } }),
    ]);
  } catch {
    errorRedirect("/admin/products", "לא ניתן למחוק מוצר עם וריאנטים המשויכים להזמנות");
  }

  redirect("/admin/products");
}

export async function upsertVariant(
  productId: string,
  variantId: string | null,
  formData: FormData
): Promise<void> {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const priceShekels = Number(formData.get("price") ?? 0);
  const sku = String(formData.get("sku") ?? "").trim() || null;
  const isActive = formData.get("isActive") === "on";
  const isDefault = formData.get("isDefault") === "on";
  const sortOrder = Number(formData.get("sortOrder") ?? 0) || 0;

  if (!name || Number.isNaN(priceShekels) || priceShekels < 0) {
    errorRedirect(`/admin/products/${productId}`, "שם ומחיר תקין הם שדות חובה לוריאנט");
  }

  const priceAgorot = shekelsToAgorot(priceShekels);

  if (isDefault) {
    await prisma.productVariant.updateMany({
      where: { productId, isDefault: true },
      data: { isDefault: false },
    });
  }

  if (variantId) {
    await prisma.productVariant.update({
      where: { id: variantId },
      data: { name, priceAgorot, sku, isActive, isDefault, sortOrder, priceSource: "MANUAL" },
    });
  } else {
    await prisma.productVariant.create({
      data: {
        productId,
        name,
        priceAgorot,
        sku,
        isActive,
        isDefault,
        sortOrder,
        priceSource: "MANUAL",
      },
    });
  }

  redirect(`/admin/products/${productId}`);
}

export async function deleteVariant(productId: string, variantId: string): Promise<void> {
  await requireAdmin();

  try {
    await prisma.productVariant.delete({ where: { id: variantId } });
  } catch {
    errorRedirect(`/admin/products/${productId}`, "לא ניתן למחוק וריאנט המשויך להזמנות קיימות");
  }

  redirect(`/admin/products/${productId}`);
}
