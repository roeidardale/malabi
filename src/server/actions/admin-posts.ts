"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hasUpload, ImageUploadError, saveUploadedImage } from "@/server/media";
import { requireAdmin } from "./admin-guard";

const MAX_TITLE_LENGTH = 120;
const MAX_BODY_LENGTH = 2000;

function errorRedirect(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function parsePublishedAt(value: FormDataEntryValue | null): Date {
  const raw = String(value ?? "").trim();
  const date = raw ? new Date(raw) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

/** Reads and validates the fields shared by create and update. */
function readPostFields(formData: FormData, errorPath: string) {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!title || !body) {
    errorRedirect(errorPath, "כותרת ותוכן הם שדות חובה");
  }
  if (title.length > MAX_TITLE_LENGTH) {
    errorRedirect(errorPath, `הכותרת ארוכה מדי (עד ${MAX_TITLE_LENGTH} תווים)`);
  }
  if (body.length > MAX_BODY_LENGTH) {
    errorRedirect(errorPath, `התוכן ארוך מדי (עד ${MAX_BODY_LENGTH} תווים)`);
  }

  return {
    title,
    body,
    isPublished: formData.get("isPublished") === "on",
    isPinned: formData.get("isPinned") === "on",
    publishedAt: parsePublishedAt(formData.get("publishedAt")),
  };
}

async function saveImage(postId: string, formData: FormData, errorPath: string) {
  const image = formData.get("image");
  if (!hasUpload(image)) return undefined;
  try {
    return await saveUploadedImage("posts", postId, image);
  } catch (error) {
    if (error instanceof ImageUploadError) errorRedirect(errorPath, error.message);
    throw error;
  }
}

function refreshStorefront() {
  revalidatePath("/");
}

export async function createPost(formData: FormData): Promise<void> {
  await requireAdmin(["OWNER"]);

  const fields = readPostFields(formData, "/admin/news/new");
  const post = await prisma.post.create({ data: fields });

  const imageUrl = await saveImage(post.id, formData, "/admin/news/new");
  if (imageUrl) {
    await prisma.post.update({ where: { id: post.id }, data: { imageUrl } });
  }

  refreshStorefront();
  redirect("/admin/news");
}

export async function updatePost(id: string, formData: FormData): Promise<void> {
  await requireAdmin(["OWNER"]);

  const current = await prisma.post.findUnique({ where: { id } });
  if (!current) errorRedirect("/admin/news", "הפוסט לא נמצא");

  const errorPath = `/admin/news/${id}`;
  const fields = readPostFields(formData, errorPath);

  let imageUrl = current!.imageUrl;
  if (formData.get("removeImage") === "on") imageUrl = null;
  imageUrl = (await saveImage(id, formData, errorPath)) ?? imageUrl;

  await prisma.post.update({ where: { id }, data: { ...fields, imageUrl } });

  refreshStorefront();
  redirect("/admin/news");
}

export async function togglePostPublished(id: string, nextPublished: boolean): Promise<void> {
  await requireAdmin(["OWNER"]);
  await prisma.post.update({ where: { id }, data: { isPublished: nextPublished } });
  refreshStorefront();
  redirect("/admin/news");
}

export async function deletePost(id: string): Promise<void> {
  await requireAdmin(["OWNER"]);
  await prisma.post.delete({ where: { id } });
  refreshStorefront();
  redirect("/admin/news");
}
