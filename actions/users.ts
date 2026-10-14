"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/security/auth-guard";
import { demoDelay } from "@/lib/utils/demo-delay";
import {
  userCreateSchema,
  userUpdateSchema,
  type UserInput,
} from "@/lib/validation";

type UserField = keyof UserInput;

export type UserFormState =
  | {
      error?: string;
      fieldErrors?: Partial<Record<UserField, string[]>>;
      values?: Record<Exclude<UserField, "password">, string>;
    }
  | undefined;

// Bound values come back from the browser, so we check them.
const toggleSchema = z.object({ id: z.uuid(), isActive: z.boolean() });

// Keep typed text for the form. The password is never sent back.
function readForm(formData: FormData) {
  const values = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    department: String(formData.get("department") ?? ""),
    role: String(formData.get("role") ?? ""),
  };
  return { values, password: String(formData.get("password") ?? "") };
}

// Known DB errors -> friendly text (D52). Unknown errors are thrown.
function friendlyDbError(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return "A user with this email already exists.";
    if (error.code === "P2025") return "This user no longer exists.";
  }
  throw error;
}

export async function createUser(
  _prev: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  await requireAdmin();
  await demoDelay();
  const { values, password } = readForm(formData);
  const parsed = userCreateSchema.safeParse({ ...values, password });
  if (!parsed.success) {
    return {
      error: "Please fix the marked fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values,
    };
  }

  // Only the hash is saved, never the password (D26).
  const hash = await bcrypt.hash(parsed.data.password, 10);
  try {
    await db.user.create({ data: { ...parsed.data, password: hash } });
  } catch (error) {
    return { error: friendlyDbError(error), values };
  }

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function updateUser(
  userId: string,
  _prev: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const admin = await requireAdmin();
  const id = z.uuid().parse(userId);
  await demoDelay();
  const { values, password } = readForm(formData);
  const parsed = userUpdateSchema.safeParse({ ...values, password });
  if (!parsed.success) {
    return {
      error: "Please fix the marked fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values,
    };
  }

  // D49: an admin can't remove their own admin role.
  if (id === admin.id && parsed.data.role !== "ADMIN") {
    return { error: "You can't remove your own admin role.", values };
  }

  // Empty password = keep the old one; else save the new hash.
  const { password: newPassword, ...data } = parsed.data;
  const passwordData = newPassword
    ? { password: await bcrypt.hash(newPassword, 10) }
    : {};
  try {
    await db.user.update({ where: { id }, data: { ...data, ...passwordData } });
  } catch (error) {
    return { error: friendlyDbError(error), values };
  }

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function setUserActive(userId: string, isActive: boolean) {
  const admin = await requireAdmin();
  const { id, isActive: active } = toggleSchema.parse({ id: userId, isActive });

  // D49: the button is hidden, but the server checks too.
  if (id === admin.id && !active)
    throw new Error("You can't deactivate your own account.");

  await demoDelay();
  await db.user.updateMany({ where: { id }, data: { isActive: active } });
  revalidatePath("/admin/users");
}
