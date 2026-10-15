"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin, requireUser } from "@/lib/security/auth-guard";
import { demoDelay } from "@/lib/utils/demo-delay";
import {
  cancelBookingAsAdmin,
  cancelOwnBooking,
  createBooking,
} from "@/lib/services/booking-rules";
import { joinWaitlist } from "@/lib/services/waitlist";
import {
  adminCancelSchema,
  bookingSchema,
  waitlistSchema,
} from "@/lib/validation";

export type ConfirmBookingState =
  | { error?: string; isClash?: boolean }
  | undefined;

// "Confirm booking" on the review page. Members and admins can book (D27).
export async function confirmBooking(
  _prev: ConfirmBookingState,
  formData: FormData,
): Promise<ConfirmBookingState> {
  const user = await requireUser();

  // The review page sends hidden fields, so check them all again.
  const parsed = bookingSchema.safeParse({
    resourceId: formData.get("resourceId"),
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    purpose: formData.get("purpose"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // The owner is always the logged-in user, never a value from the form.
  const result = await createBooking({ ...parsed.data, userId: user.id });
  if (!result.ok) return { error: result.error, isClash: result.isClash };

  revalidatePath("/member", "layout");
  redirect(`/member/bookings?newId=${result.id}`);
}

// Cancel one of your own upcoming bookings.
export async function cancelMyBooking(reservationId: string) {
  const user = await requireUser();
  const id = z.uuid().parse(reservationId);
  await demoDelay();

  // false = already cancelled, started, or not yours: the page just shows the real state.
  await cancelOwnBooking(id, user.id);
  revalidatePath("/member", "layout");
}

export type NotifyMeState = { ok: boolean; message: string } | undefined;

// "Notify me" on the clash message (D3). The user comes from the session (D67).
export async function notifyMe(
  _prev: NotifyMeState,
  formData: FormData,
): Promise<NotifyMeState> {
  const user = await requireUser();
  await demoDelay();

  const parsed = waitlistSchema.safeParse({
    resourceId: formData.get("resourceId"),
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
  });
  if (!parsed.success)
    return { ok: false, message: parsed.error.issues[0].message };

  return joinWaitlist(user.id, parsed.data);
}

export type AdminCancelState = { ok: boolean; error?: string } | undefined;

// Admin cancels any booking, with a reason (D10, D29).
export async function cancelBookingByAdmin(
  _prev: AdminCancelState,
  formData: FormData,
): Promise<AdminCancelState> {
  const admin = await requireAdmin();
  await demoDelay();

  const parsed = adminCancelSchema.safeParse({
    reservationId: formData.get("reservationId"),
    reason: formData.get("reason"),
    keepBlocked: formData.get("keepBlocked"),
  });
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };

  // The admin always comes from the session, never the form (D67).
  const result = await cancelBookingAsAdmin(
    parsed.data.reservationId,
    admin.id,
    parsed.data.reason,
    parsed.data.keepBlocked,
  );
  if (!result.ok) return { ok: false, error: result.error };

  // Admin list, dashboard and the owner's My bookings all change.
  revalidatePath("/admin", "layout");
  revalidatePath("/member", "layout");
  return { ok: true };
}
