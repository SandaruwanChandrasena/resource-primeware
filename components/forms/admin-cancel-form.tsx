"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  cancelBookingByAdmin,
  type AdminCancelState,
} from "@/actions/bookings";
import PendingLabel from "@/components/ui/pending-label";

type AdminCancelFormProps = {
  reservationId: string;
  summary: string;
  ownerName: string;
  reasonRequired: boolean;
};

// Inside the form, so it can read the pending state.
function DialogButtons({ onCancel }: { onCancel: () => void }) {
  const { pending } = useFormStatus();

  return (
    <div className="mt-6 flex justify-end gap-3">
      <button
        type="button"
        onClick={onCancel}
        disabled={pending}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
      >
        Keep booking
      </button>
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
      >
        <PendingLabel pending={pending} pendingText="Cancelling...">
          Cancel booking
        </PendingLabel>
      </button>
    </div>
  );
}

// Admin "Cancel" button + box with a reason for the owner (D29).
export default function AdminCancelForm({
  reservationId,
  summary,
  ownerName,
  reasonRequired,
}: AdminCancelFormProps) {
  const [state, formAction] = useActionState<AdminCancelState, FormData>(
    cancelBookingByAdmin,
    undefined,
  );
  const [length, setLength] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const reasonId = useId();
  const close = () => dialogRef.current?.close();

  // Done: close the box. The page reloads with the new status.
  useEffect(() => {
    if (state?.ok) dialogRef.current?.close();
  }, [state]);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
      >
        Cancel
      </button>

      {/* Native dialog: focus trap and Esc key come for free. */}
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClick={(e) => e.target === e.currentTarget && close()}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-gray-200 bg-white p-6 text-left text-gray-900 shadow-xl backdrop:bg-gray-900/40"
      >
        <form action={formAction}>
          <input type="hidden" name="reservationId" value={reservationId} />
          <h2 id={titleId} className="text-lg font-semibold">
            Cancel this booking?
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {summary}. Booked by {ownerName}. People on the &quot;Notify
            me&quot; list will be told the time is free.
          </p>

          <label
            htmlFor={reasonId}
            className="mt-4 block text-sm font-medium text-gray-700"
          >
            Reason {reasonRequired ? "(sent to the owner)" : "(optional)"}
          </label>
          <textarea
            id={reasonId}
            name="reason"
            rows={3}
            maxLength={200}
            required={reasonRequired}
            minLength={5}
            onChange={(e) => setLength(e.target.value.length)}
            placeholder="e.g. The room is needed for an urgent board meeting."
            className="mt-1 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
          <p className="mt-1 text-right text-xs tabular-nums text-gray-500">
            {length}/200
          </p>

          {state?.error && (
            <p
              role="alert"
              className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {state.error}
            </p>
          )}

          <DialogButtons onCancel={close} />
        </form>
      </dialog>
    </>
  );
}
