"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/security/auth-guard";
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
