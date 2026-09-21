"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buildFullSlugPath } from "@/lib/categoryTree";
import { hasUpload, ImageUploadError, saveUploadedImage } from "@/server/media";
import { requireAdmin } from "./admin-guard";

function errorRedirect(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

/** Saves the optional uploaded image; returns the new path, or `fallback` when nothing was uploaded. */
async function resolveImage(
  formData: FormData,
  categoryId: string,
  fallback: string | null,
  errorPath: string,
): Promise<string | null> {
  const image = formData.get("image");
  if (!hasUpload(image)) return fallback;
  try {
    return await saveUploadedImage("categories", categoryId, image);
  } catch (error) {
    if (error instanceof ImageUploadError) errorRedirect(errorPath, error.message);
    throw error;
  }
}

export async function createCategory(formData: FormData): Promise<void> {
  await requireAdmin(["OWNER"]);

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const parentIdRaw = String(formData.get("parentId") ?? "").trim();
  const parentId = parentIdRaw === "" ? null : parentIdRaw;
  const sortOrder = Number(formData.get("sortOrder") ?? 0) || 0;
  const isActive = formData.get("isActive") === "on";

  if (!name || !slug) {
    errorRedirect("/admin/categories/new", "שם וסלאג הם שדות חובה");
  }

  let parentPath: string | null = null;
  if (parentId) {
    const parent = await prisma.category.findUnique({ where: { id: parentId } });
    if (!parent) {
      errorRedirect("/admin/categories/new", "קטגוריית אב לא נמצאה");
    }
    parentPath = parent!.fullSlugPath;
  }

  const fullSlugPath = buildFullSlugPath(parentPath, slug);

  let category;
  try {
    category = await prisma.category.create({
      data: { name, slug, parentId, fullSlugPath, sortOrder, isActive },
    });
  } catch {
    errorRedirect("/admin/categories/new", "כבר קיימת קטגוריה עם סלאג/נתיב זהה");
  }

  const imageUrl = await resolveImage(formData, category.id, null, "/admin/categories/new");
  if (imageUrl) {
    await prisma.category.update({ where: { id: category.id }, data: { imageUrl } });
  }

  redirect("/admin/categories");
}

export async function updateCategory(id: string, formData: FormData): Promise<void> {
  await requireAdmin(["OWNER"]);

  const current = await prisma.category.findUnique({ where: { id } });
  if (!current) {
    errorRedirect("/admin/categories", "קטגוריה לא נמצאה");
  }

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const parentIdRaw = String(formData.get("parentId") ?? "").trim();
  const parentId = parentIdRaw === "" ? null : parentIdRaw;
  const sortOrder = Number(formData.get("sortOrder") ?? 0) || 0;
  const isActive = formData.get("isActive") === "on";

  if (!name || !slug) {
    errorRedirect(`/admin/categories/${id}`, "שם וסלאג הם שדות חובה");
  }

  const imageUrl = await resolveImage(formData, id, current!.imageUrl, `/admin/categories/${id}`);

  if (parentId === id) {
    errorRedirect(`/admin/categories/${id}`, "קטגוריה לא יכולה להיות אב של עצמה");
  }

  let parentPath: string | null = null;
  if (parentId) {
    const parent = await prisma.category.findUnique({ where: { id: parentId } });
    if (!parent) {
      errorRedirect(`/admin/categories/${id}`, "קטגוריית אב לא נמצאה");
    }
    parentPath = parent!.fullSlugPath;

    // Prevent moving a category underneath one of its own descendants.
    if (
      parent!.fullSlugPath === current!.fullSlugPath ||
      parent!.fullSlugPath.startsWith(`${current!.fullSlugPath}/`)
    ) {
      errorRedirect(`/admin/categories/${id}`, "לא ניתן להעביר קטגוריה תחת אחד מצאצאיה");
    }
  }

  const oldPath = current!.fullSlugPath;
  const newPath = buildFullSlugPath(parentPath, slug);

  try {
    if (newPath !== oldPath) {
      // Recompute this category's fullSlugPath and cascade the change to
      // every descendant whose path is prefixed by the old path.
      const descendants = await prisma.category.findMany({
        where: { fullSlugPath: { startsWith: `${oldPath}/` } },
      });

      await prisma.$transaction([
        prisma.category.update({
          where: { id },
          data: { name, slug, parentId, sortOrder, isActive, imageUrl, fullSlugPath: newPath },
        }),
        ...descendants.map((descendant) =>
          prisma.category.update({
            where: { id: descendant.id },
            data: { fullSlugPath: newPath + descendant.fullSlugPath.slice(oldPath.length) },
          })
        ),
      ]);
    } else {
      await prisma.category.update({
        where: { id },
        data: { name, slug, parentId, sortOrder, isActive, imageUrl },
      });
    }
  } catch {
    errorRedirect(`/admin/categories/${id}`, "כבר קיימת קטגוריה עם סלאג/נתיב זהה");
  }

  redirect("/admin/categories");
}

export async function toggleCategoryActive(id: string, nextActive: boolean): Promise<void> {
  await requireAdmin(["OWNER"]);
  await prisma.category.update({ where: { id }, data: { isActive: nextActive } });
  redirect("/admin/categories");
}

export async function deleteCategory(id: string): Promise<void> {
  await requireAdmin(["OWNER"]);

  const [childCount, productCount] = await Promise.all([
    prisma.category.count({ where: { parentId: id } }),
    prisma.product.count({ where: { categoryId: id } }),
  ]);

  if (childCount > 0 || productCount > 0) {
    errorRedirect(
      "/admin/categories",
      "לא ניתן למחוק קטגוריה עם תתי-קטגוריות או מוצרים משויכים"
    );
  }

  await prisma.category.delete({ where: { id } });
  redirect("/admin/categories");
}
