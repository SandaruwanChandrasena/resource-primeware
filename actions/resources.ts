"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { demoDelay } from "@/lib/demo-delay";
import { deleteResourceImage, saveResourceImage } from "@/lib/resource-images";
import { resourceSchema, type ResourceInput } from "@/lib/validation";

export type ResourceFormState =
  | {
      error?: string;
      fieldErrors?: Partial<Record<keyof ResourceInput | "image", string[]>>;
      values?: Record<keyof ResourceInput, string>;
      attempt?: number;
    }
  | undefined;

// Bound values come back from the browser, so we check them.
const toggleSchema = z.object({ id: z.uuid(), isActive: z.boolean() });

// Keep the raw text, so the form can show it again after an error.
function readForm(formData: FormData) {
  const values = {
    name: String(formData.get("name") ?? ""),
    type: String(formData.get("type") ?? ""),
    location: String(formData.get("location") ?? ""),
    capacity: String(formData.get("capacity") ?? ""),
    description: String(formData.get("description") ?? ""),
  };
  return { values, parsed: resourceSchema.safeParse(values) };
}

// Photo field: a new file, "remove the photo", or no change.
function readPhoto(formData: FormData) {
  const file = formData.get("image");
  return {
    file: file instanceof File && file.size > 0 ? file : null,
    remove: formData.get("removeImage") === "on",
  };
}

// Known DB errors -> friendly text (D52). Unknown errors are thrown.
function friendlyDbError(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002")
      return "A resource with this name already exists.";
    if (error.code === "P2025") return "This resource no longer exists.";
  }
  throw error;
}

export async function createResource(
  _prev: ResourceFormState,
  formData: FormData,
): Promise<ResourceFormState> {
  await requireAdmin();
  await demoDelay();
  const attempt = Date.now();
  const { values, parsed } = readForm(formData);
  if (!parsed.success) {
    return {
      error: "Please fix the marked fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values,
      attempt,
    };
  }

  // Check the text fields first, then save the photo.
  const { file } = readPhoto(formData);
  let imageName: string | null = null;
  if (file) {
    const saved = await saveResourceImage(file);
    if ("error" in saved)
      return { fieldErrors: { image: [saved.error] }, values, attempt };
    imageName = saved.name;
  }

  try {
    await db.resource.create({ data: { ...parsed.data, imageName } });
  } catch (error) {
    // The save failed, so remove the photo we just stored.
    await deleteResourceImage(imageName);
    return { error: friendlyDbError(error), values, attempt };
  }

  // redirect() must stay outside try/catch (it works by throwing).
  revalidatePath("/admin/resources");
  revalidatePath("/member/resources");
  redirect("/admin/resources");
}

export async function updateResource(
  resourceId: string,
  _prev: ResourceFormState,
  formData: FormData,
): Promise<ResourceFormState> {
  await requireAdmin();
  const id = z.uuid().parse(resourceId);
  await demoDelay();
  const attempt = Date.now();
  const { values, parsed } = readForm(formData);
  if (!parsed.success) {
    return {
      error: "Please fix the marked fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values,
      attempt,
    };
  }

  const current = await db.resource.findUnique({
    where: { id },
    select: { imageName: true },
  });
  if (!current)
    return { error: "This resource no longer exists.", values, attempt };

  const { file, remove } = readPhoto(formData);
  let newImage: string | null = null;
  if (file) {
    const saved = await saveResourceImage(file);
    if ("error" in saved)
      return { fieldErrors: { image: [saved.error] }, values, attempt };
    newImage = saved.name;
  }
  const imageName = newImage ?? (remove ? null : current.imageName);

  try {
    await db.resource.update({
      where: { id },
      data: { ...parsed.data, imageName },
    });
  } catch (error) {
    await deleteResourceImage(newImage);
    return { error: friendlyDbError(error), values, attempt };
  }

  // Remove the old file only after the database points to the new one.
  if (imageName !== current.imageName)
    await deleteResourceImage(current.imageName);

  revalidatePath("/admin/resources");
  revalidatePath("/member/resources", "layout");
  redirect("/admin/resources");
}

export async function setResourceActive(resourceId: string, isActive: boolean) {
  await requireAdmin();
  const { id, isActive: active } = toggleSchema.parse({
    id: resourceId,
    isActive,
  });
  await demoDelay();

  await db.resource.updateMany({ where: { id }, data: { isActive: active } });
  revalidatePath("/admin/resources");
  revalidatePath("/member/resources", "layout");
}
