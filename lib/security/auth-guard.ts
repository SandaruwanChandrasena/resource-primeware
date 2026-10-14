import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { readSession } from "@/lib/security/session";

// One DB lookup per request, even if many places call it.
export const getCurrentUser = cache(async () => {
  const session = await readSession();
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      imageName: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) return null;
  return user;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/member");
  return user;
}

export async function requireMember() {
  const user = await requireUser();
  if (user.role !== "MEMBER") redirect("/admin");
  return user;
}
