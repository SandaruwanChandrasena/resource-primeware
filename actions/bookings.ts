"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/security/auth-guard";
import { demoDelay } from "@/lib/utils/demo-delay";
import { cancelOwnBooking, createBooking } from "@/lib/services/booking-rules";
import { joinWaitlist } from "@/lib/services/waitlist";
import { bookingSchema, waitlistSchema } from "@/lib/validation";

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
