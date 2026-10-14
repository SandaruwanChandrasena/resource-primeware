"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth-guard";
import { createBooking } from "@/lib/services/booking-rules";
import { bookingSchema } from "@/lib/validation";

type BookingField = "date" | "startTime" | "endTime" | "purpose";

export type BookingFormState =
  | {
      error?: string;
      isClash?: boolean;
      success?: string;
      submittedAt?: number;
      fieldErrors?: Partial<Record<string, string[]>>;
      values?: Record<BookingField, string>;
    }
  | undefined;

// Members and admins can both book (D27), so any logged-in user.
export async function bookResource(
  _prev: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const user = await requireUser();
  const values = {
    date: String(formData.get("date") ?? ""),
    startTime: String(formData.get("startTime") ?? ""),
    endTime: String(formData.get("endTime") ?? ""),
    purpose: String(formData.get("purpose") ?? ""),
  };

  const parsed = bookingSchema.safeParse({
    ...values,
    resourceId: formData.get("resourceId"),
  });
  if (!parsed.success) {
    const fieldErrors = z.flattenError(parsed.error).fieldErrors;
    return {
      error: fieldErrors.resourceId?.[0] ?? "Please fix the marked fields.",
      fieldErrors,
      values,
    };
  }

  // The owner is always the logged-in user, never a value from the form.
  const result = await createBooking({ ...parsed.data, userId: user.id });
  if (!result.ok) {
    return result.field
      ? { fieldErrors: { [result.field]: [result.error] }, values }
      : { error: result.error, isClash: result.isClash, values };
  }

  revalidatePath("/member", "layout");
  return { success: result.message, submittedAt: Date.now() };
}
