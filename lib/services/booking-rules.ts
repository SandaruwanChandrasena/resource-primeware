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

export type BookingRequest = {
  resourceId: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
};

export type BookingProblem = {
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

// All rules except saving. Used by the review page and by createBooking.
export async function checkBooking(
  request: BookingRequest,
): Promise<
  { ok: true; start: Date; end: Date; resourceName: string } | BookingProblem
> {
  const start = toUtc(request.date, request.startTime);
  const end = toUtc(request.date, request.endTime);

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
  if (request.date > addDays(todayInColombo(), MAX_DAYS_AHEAD)) {
    return {
      ok: false,
      field: "date",
      error: `You can book up to ${MAX_DAYS_AHEAD} days ahead.`,
    };
  }

  const resource = await db.resource.findUnique({
    where: { id: request.resourceId },
    select: { name: true, isActive: true },
  });
  if (!resource) return { ok: false, error: "This resource no longer exists." };
  // D50: an inactive resource gets no new bookings.
  if (!resource.isActive)
    return {
      ok: false,
      error: "This resource is not available for booking right now.",
    };

  // Code check, so the message can say what clashes (D2).
  const clash = await findClash(request.resourceId, start, end);
  if (clash)
    return {
      ok: false,
      isClash: true,
      error: clashMessage(resource.name, clash),
    };

  return { ok: true, start, end, resourceName: resource.name };
}

export async function createBooking(
  request: BookingRequest & { userId: string },
): Promise<{ ok: true; id: string } | BookingProblem> {
  const check = await checkBooking(request);
  if (!check.ok) return check;

  // Demo only: makes the gap wide, to show two people booking at once.
  await demoDelay();

  try {
    const booking = await db.reservation.create({
      data: {
        resourceId: request.resourceId,
        userId: request.userId,
        startTime: check.start,
        endTime: check.end,
        purpose: request.purpose,
      },
      select: { id: true },
    });
    return { ok: true, id: booking.id };
  } catch (error) {
    // Someone booked the same time a moment ago; the database blocked it (D1).
    if (!isOverlapError(error)) throw error;
    const winner = await findClash(request.resourceId, check.start, check.end);
    return {
      ok: false,
      isClash: true,
      error: winner
        ? clashMessage(check.resourceName, winner)
        : "Someone just booked this time. Please choose another time.",
    };
  }
}

// Cancel = change the status, never delete (D7). Who and when are saved (D28).
// One transaction, so Stage 5 can notify waiting people in the same step (D6).
export async function cancelOwnBooking(reservationId: string, userId: string) {
  return db.$transaction(async (tx) => {
    const result = await tx.reservation.updateMany({
      // Only your own, still confirmed, and not started yet.
      where: {
        id: reservationId,
        userId,
        status: "CONFIRMED",
        startTime: { gt: new Date() },
      },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelledById: userId,
      },
    });
    return result.count === 1;
  });
}
