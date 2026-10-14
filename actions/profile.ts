"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/security/auth-guard";
import { deleteImage, saveImage } from "@/lib/services/image-files";
import { demoDelay } from "@/lib/utils/demo-delay";
import { passwordChangeSchema } from "@/lib/validation";

export type PasswordChangeState =
  | {
      error?: string;
      fieldErrors?: Partial<
        Record<"newPassword" | "confirmPassword", string[]>
      >;
      success?: string;
    }
  | undefined;

// The user id comes from the login session, never from the form (D67).
export async function changeMyPassword(
  _prev: PasswordChangeState,
  formData: FormData,
): Promise<PasswordChangeState> {
  const user = await requireUser();
  await demoDelay();

  const parsed = passwordChangeSchema.safeParse({
    newPassword: String(formData.get("newPassword") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });
  if (!parsed.success) {
    return {
      error: "Please fix the marked fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  // The hash is read only here, on the server (D26).
  const current = await db.user.findUnique({
    where: { id: user.id },
    select: { password: true },
  });
  if (!current) return { error: "Your account was not found." };

  if (await bcrypt.compare(parsed.data.newPassword, current.password)) {
    return {
      error: "Please fix the marked fields.",
      fieldErrors: {
        newPassword: ["Choose a password different from your current one."],
      },
    };
  }

  const hash = await bcrypt.hash(parsed.data.newPassword, 10);
  await db.user.update({ where: { id: user.id }, data: { password: hash } });

  return { success: "Your password was changed." };
}

export type PhotoState =
  | { error?: string; success?: string; attempt?: number }
  | undefined;

// Upload or replace your own profile photo (D77). Same checks as D69.
export async function updateMyPhoto(
  _prev: PhotoState,
  formData: FormData,
): Promise<PhotoState> {
  const user = await requireUser();
  await demoDelay();
  const attempt = Date.now();

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0)
    return { error: "Choose a photo first.", attempt };

  const saved = await saveImage("user-images", file);
  if ("error" in saved) return { error: saved.error, attempt };

  try {
    await db.user.update({
      where: { id: user.id },
      data: { imageName: saved.name },
    });
  } catch (error) {
    // The save failed, so remove the photo we just stored.
    await deleteImage("user-images", saved.name);
    throw error;
  }

  // Remove the old file only after the database points to the new one.
  await deleteImage("user-images", user.imageName);

  // The avatar is in the layout (navbar/sidebar), so refresh it too.
  revalidatePath("/", "layout");
  return { success: "Your photo was saved.", attempt };
}

export async function removeMyPhoto() {
  const user = await requireUser();
  await demoDelay();
  if (!user.imageName) return;

  await db.user.update({ where: { id: user.id }, data: { imageName: null } });
  await deleteImage("user-images", user.imageName);
  revalidatePath("/", "layout");
}
