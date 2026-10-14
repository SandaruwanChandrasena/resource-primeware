import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  formatDate,
  formatTime,
  toColomboDate,
  toUtc,
} from "@/lib/utils/colombo-time";
import type { WaitlistRequest } from "@/lib/validation";

// "Notify me" list (D3, D4, D78). Shared by member and admin cancels.

export type JoinWaitlistResult = { ok: boolean; message: string };

// Add the user to the list for this resource and time.
export async function joinWaitlist(
  userId: string,
  request: WaitlistRequest,
): Promise<JoinWaitlistResult> {
  const start = toUtc(request.date, request.startTime);
  const end = toUtc(request.date, request.endTime);
  if (start <= new Date())
    return { ok: false, message: "This time has already passed." };

  const resource = await db.resource.findUnique({
    where: { id: request.resourceId },
    select: { isActive: true },
  });
  if (!resource?.isActive)
    return { ok: false, message: "This resource is not available right now." };

  // If the time is free now, booking is better than waiting.
  const clash = await db.reservation.findFirst({
    where: {
      resourceId: request.resourceId,
      status: "CONFIRMED",
      startTime: { lt: end },
      endTime: { gt: start },
    },
    select: { id: true },
  });
  if (!clash)
    return { ok: false, message: "This time is free now. You can book it." };

  const key = {
    userId,
    resourceId: request.resourceId,
    startTime: start,
    endTime: end,
  };
  const existing = await db.waitlistEntry.findUnique({
    where: { userId_resourceId_startTime_endTime: key },
    select: { status: true },
  });
  if (existing?.status === "WAITING")
    return { ok: true, message: "You're already on the list for this time." };

  // New entry, or an old NOTIFIED one goes back to WAITING (unique row).
  await db.waitlistEntry.upsert({
    where: { userId_resourceId_startTime_endTime: key },
    create: key,
    update: { status: "WAITING", createdAt: new Date() },
  });
  return {
    ok: true,
    message: "Done. We'll tell you with the bell when this time is free.",
  };
}

type FreedSlot = {
  resourceId: string;
  resourceName: string;
  start: Date;
  end: Date;
};

// Runs INSIDE the cancel transaction (D6): all or nothing.
// Tells waiting people only when their WHOLE time is now free (D78).
export async function notifyWaiting(
  tx: Prisma.TransactionClient,
  freed: FreedSlot,
) {
  const entries = await tx.waitlistEntry.findMany({
    where: {
      resourceId: freed.resourceId,
      status: "WAITING",
      startTime: { lt: freed.end, gt: new Date() },
      endTime: { gt: freed.start },
    },
    select: { id: true, userId: true, startTime: true, endTime: true },
  });

  const toNotify: typeof entries = [];
  for (const entry of entries) {
    // Another booking may still block part of their time.
    const stillBlocked = await tx.reservation.findFirst({
      where: {
        resourceId: freed.resourceId,
        status: "CONFIRMED",
        startTime: { lt: entry.endTime },
        endTime: { gt: entry.startTime },
      },
      select: { id: true },
    });
    if (!stillBlocked) toNotify.push(entry);
  }
  if (toNotify.length === 0) return 0;

  await tx.waitlistEntry.updateMany({
    where: { id: { in: toNotify.map((e) => e.id) } },
    data: { status: "NOTIFIED" },
  });

  // Everyone waiting is told; the first to book wins (D4).
  await tx.notification.createMany({
    data: toNotify.map((entry) => {
      const params = new URLSearchParams({
        date: toColomboDate(entry.startTime),
        startTime: formatTime(entry.startTime),
        endTime: formatTime(entry.endTime),
      });
      return {
        userId: entry.userId,
        message: `${freed.resourceName} is now free on ${formatDate(entry.startTime)}, ${formatTime(entry.startTime)}–${formatTime(entry.endTime)}. Book it now.`,
        // Book form with the time filled in (members book here; admin page comes in Stage 6).
        link: `/member/resources/${freed.resourceId}?${params}`,
      };
    }),
  });
  return toNotify.length;
}
