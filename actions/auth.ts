"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/session";
import { loginSchema } from "@/lib/validation";

export type LoginState = { error?: string; email?: string } | undefined;

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, email: String(formData.get("email") ?? "") };
  }

  const { email, password } = parsed.data;
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, role: true, password: true, isActive: true },
  });

  // Same message for wrong email or wrong password (D39).
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return { error: "Invalid email or password.", email };
  }

  // Password was correct, so it is safe to say why (D39).
  if (!user.isActive) {
    return { error: "Your account is disabled. Please contact the admin.", email };
  }

  await createSession({ userId: user.id, role: user.role });
  redirect(user.role === "ADMIN" ? "/admin" : "/member");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}