"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";

// Bound values come back from the browser, so we check them.
const toggleSchema = z.object({ id: z.uuid(), isActive: z.boolean() });

export async function setResourceActive(resourceId: string, isActive: boolean) {
  await requireAdmin();
  const { id, isActive: active } = toggleSchema.parse({ id: resourceId, isActive });

  await db.resource.updateMany({ where: { id }, data: { isActive: active } });
  revalidatePath("/admin/resources");
}