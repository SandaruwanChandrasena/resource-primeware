import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/security/auth-guard";

// Bell API (D5, D16): the browser asks every 30 s; Postman can call it too.
const LIST_SIZE = 10;

// GET /api/notifications -> your last 10 notifications + unread count.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not logged in" }, { status: 401 });

  const [items, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: LIST_SIZE,
      select: {
        id: true,
        message: true,
        link: true,
        isRead: true,
        createdAt: true,
      },
    }),
    db.notification.count({ where: { userId: user.id, isRead: false } }),
  ]);

  return Response.json(
    { unreadCount, items },
    { headers: { "Cache-Control": "no-store" } },
  );
}

// Body: { "id": "<uuid>" } for one, or { "all": true } for all.
const markReadSchema = z.union([
  z.object({ id: z.uuid() }),
  z.object({ all: z.literal(true) }),
]);

// PATCH /api/notifications -> mark as read. Only your own (userId in the filter).
export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not logged in" }, { status: 401 });

  const body: unknown = await request.json().catch(() => null);
  const parsed = markReadSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'Send { "id": "<uuid>" } or { "all": true }.' },
      { status: 400 },
    );
  }

  const where =
    "id" in parsed.data
      ? { id: parsed.data.id, userId: user.id }
      : { userId: user.id, isRead: false };
  const result = await db.notification.updateMany({
    where,
    data: { isRead: true },
  });

  return Response.json({ updated: result.count });
}
