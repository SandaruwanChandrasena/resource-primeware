"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth-guard";
import { demoDelay } from "@/lib/demo-delay";
import { cancelOwnBooking, createBooking } from "@/lib/services/booking-rules";
import { bookingSchema } from "@/lib/validation";

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
