"use client";

import { useActionState } from "react";
import { notifyMe, type NotifyMeState } from "@/actions/bookings";
import { BellIcon } from "@/components/layout/app-icons";
import SubmitButton from "@/components/ui/submit-button";

type NotifyMeButtonProps = {
  resourceId: string;
  date: string;
  startTime: string;
  endTime: string;
};

// Shown with the clash message: "tell me when this time is free" (D3).
export default function NotifyMeButton(props: NotifyMeButtonProps) {
  const [state, formAction] = useActionState<NotifyMeState, FormData>(
    notifyMe,
    undefined,
  );

  // After a good answer, the button is replaced by the message.
  if (state?.ok) {
    return (
      <p
        role="status"
        className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700"
      >
        <BellIcon className="h-4 w-4 shrink-0" />
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="resourceId" value={props.resourceId} />
      <input type="hidden" name="date" value={props.date} />
      <input type="hidden" name="startTime" value={props.startTime} />
      <input type="hidden" name="endTime" value={props.endTime} />

      {state && !state.ok && (
        <p
          role="alert"
          className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700"
        >
          {state.message}
        </p>
      )}

      <SubmitButton
        pendingText="Saving..."
        className="flex items-center justify-center gap-2 self-start rounded-lg border border-brand-100 bg-white px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-60"
      >
        <BellIcon className="h-4 w-4" />
        Notify me when it&apos;s free
      </SubmitButton>
    </form>
  );
}
