"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { resourceSchema, type ResourceInput } from "@/lib/validation";

export type ResourceFormState =
  | {
      error?: string;
      fieldErrors?: Partial<Record<keyof ResourceInput, string[]>>;
      values?: Record<keyof ResourceInput, string>;
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
  const { values, parsed } = readForm(formData);
  if (!parsed.success) {
    return {
      error: "Please fix the marked fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values,
    };
  }

  try {
    await db.resource.create({ data: parsed.data });
  } catch (error) {
    return { error: friendlyDbError(error), values };
  }

  // redirect() must stay outside try/catch (it works by throwing).
  revalidatePath("/admin/resources");
  redirect("/admin/resources");
}

export async function updateResource(
  resourceId: string,
  _prev: ResourceFormState,
  formData: FormData,
): Promise<ResourceFormState> {
  await requireAdmin();
  const id = z.uuid().parse(resourceId);
  const { values, parsed } = readForm(formData);
  if (!parsed.success) {
    return {
      error: "Please fix the marked fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values,
    };
  }

  try {
    await db.resource.update({ where: { id }, data: parsed.data });
  } catch (error) {
    return { error: friendlyDbError(error), values };
  }

  revalidatePath("/admin/resources");
  redirect("/admin/resources");
}

export async function setResourceActive(resourceId: string, isActive: boolean) {
  await requireAdmin();
  const { id, isActive: active } = toggleSchema.parse({
    id: resourceId,
    isActive,
  });

  await db.resource.updateMany({ where: { id }, data: { isActive: active } });
  revalidatePath("/admin/resources");
}
