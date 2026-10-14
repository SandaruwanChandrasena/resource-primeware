"use client";

import Link from "next/link";
import { useActionState } from "react";
import { confirmBooking, type ConfirmBookingState } from "@/actions/bookings";
import SubmitButton from "@/components/submit-button";
import type { BookingFormValues } from "@/components/booking-form";

type BookingConfirmProps = {
  resourceId: string;
  values: BookingFormValues;
  changeHref: string;
};

// Step 2 of booking: the "Confirm" button on the review page.
export default function BookingConfirm({
  resourceId,
  values,
  changeHref,
}: BookingConfirmProps) {
  const [state, formAction] = useActionState<ConfirmBookingState, FormData>(
    confirmBooking,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {/* Someone may book this time while you read the page; the server checks again. */}
      {state?.error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {state.error}
        </p>
      )}

      <input type="hidden" name="resourceId" value={resourceId} />
      <input type="hidden" name="date" value={values.date} />
      <input type="hidden" name="startTime" value={values.startTime} />
      <input type="hidden" name="endTime" value={values.endTime} />
      <input type="hidden" name="purpose" value={values.purpose} />

      <div className="flex justify-end gap-3">
        <Link
          href={changeHref}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Change
        </Link>
        {!state?.isClash && (
          <SubmitButton
            pendingText="Booking..."
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            Confirm booking
          </SubmitButton>
        )}
      </div>
    </form>
  );
}
