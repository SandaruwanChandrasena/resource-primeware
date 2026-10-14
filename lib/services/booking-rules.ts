import { MAX_DAYS_AHEAD } from "@/lib/booking-settings";
import {
  addDays,
  formatDate,
  formatTime,
  toUtc,
  todayInColombo,
} from "@/lib/colombo-time";
import { db } from "@/lib/db";
import { demoDelay } from "@/lib/demo-delay";

// Shared booking rules for members and admins (D53).

export type NewBooking = {
  resourceId: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
};

export type BookingResult =
  | { ok: true; message: string }
  | {
      ok: false;
      error: string;
      field?: "date" | "startTime" | "endTime";
      isClash?: boolean;
    };

// First confirmed booking that overlaps [start, end). Touching edges are fine.
function findClash(resourceId: string, start: Date, end: Date) {
  return db.reservation.findFirst({
    where: {
      resourceId,
      status: "CONFIRMED",
      startTime: { lt: end },
      endTime: { gt: start },
    },
    orderBy: { startTime: "asc" },
    select: {
      startTime: true,
      endTime: true,
      user: { select: { department: true } },
    },
  });
}

type Clash = NonNullable<Awaited<ReturnType<typeof findClash>>>;

// D2: time range and department only, not the person's name.
function clashMessage(resourceName: string, clash: Clash) {
  const department = clash.user.department ? ` (${clash.user.department})` : "";
  return `${resourceName} is already booked from ${formatTime(clash.startTime)} to ${formatTime(clash.endTime)} on ${formatDate(clash.startTime)}${department}.`;
}

// True when PostgreSQL's overlap rule (reservations_no_overlap) said no.
function isOverlapError(error: unknown) {
  const parts = [String(error)];
  if (error && typeof error === "object") {
    const e = error as { message?: unknown; meta?: unknown; cause?: unknown };
    parts.push(
      String(e.message),
      JSON.stringify(e.meta ?? null),
      String(e.cause),
    );
  }
  const text = parts.join(" ");
  return text.includes("reservations_no_overlap") || text.includes("23P01");
}

export async function createBooking(input: NewBooking): Promise<BookingResult> {
  const start = toUtc(input.date, input.startTime);
  const end = toUtc(input.date, input.endTime);

  // D20: end after start, nothing in the past, not too far ahead.
  if (end <= start)
    return {
      ok: false,
      field: "endTime",
      error: "End time must be after start time.",
    };
  if (start <= new Date()) {
    return {
      ok: false,
      field: "startTime",
      error: "This time has already passed. Choose a later time.",
    };
  }
  if (input.date > addDays(todayInColombo(), MAX_DAYS_AHEAD)) {
    return {
      ok: false,
      field: "date",
      error: `You can book up to ${MAX_DAYS_AHEAD} days ahead.`,
    };
  }

  const resource = await db.resource.findUnique({
    where: { id: input.resourceId },
    select: { name: true, isActive: true },
  });
  if (!resource) return { ok: false, error: "This resource no longer exists." };
  // D50: an inactive resource gets no new bookings.
  if (!resource.isActive)
    return {
      ok: false,
      error: "This resource is not available for booking right now.",
    };

  // Code check first, so the message can say what clashes (D2).
  const clash = await findClash(input.resourceId, start, end);
  if (clash)
    return {
      ok: false,
      isClash: true,
      error: clashMessage(resource.name, clash),
    };

  // Demo only: makes the gap wide, to show two people booking at once.
  await demoDelay();

  try {
    await db.reservation.create({
      data: {
        resourceId: input.resourceId,
        userId: input.userId,
        startTime: start,
        endTime: end,
        purpose: input.purpose,
      },
    });
  } catch (error) {
    // Someone booked the same time a moment ago; the database blocked it (D1).
    if (!isOverlapError(error)) throw error;
    const winner = await findClash(input.resourceId, start, end);
    return {
      ok: false,
      isClash: true,
      error: winner
        ? clashMessage(resource.name, winner)
        : "Someone just booked this time. Please choose another time.",
    };
  }

  return {
    ok: true,
    message: `Booked ${resource.name} on ${formatDate(start)}, ${formatTime(start)}–${formatTime(end)}.`,
  };
}
