"use client";

import { useActionState, useState } from "react";
import { bookResource, type BookingFormState } from "@/actions/bookings";
import SelectMenu from "@/components/select-menu";
import SubmitButton from "@/components/submit-button";
import { TIME_SLOTS } from "@/lib/booking-settings";
import { nowTimeInColombo } from "@/lib/colombo-time";

const inputClass =
  "rounded-lg border border-gray-300 px-3 py-2 font-normal focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100";
const labelClass = "flex flex-col gap-1.5 text-sm font-medium";

type BookingFormProps = { resourceId: string; today: string; maxDate: string };

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <span className="text-xs font-normal text-red-600">{message}</span>;
}

const toOptions = (times: string[]) =>
  times.map((t) => ({ value: t, label: t }));

type BookingFieldsProps = BookingFormProps & {
  state: BookingFormState;
  formAction: (formData: FormData) => void;
};

function BookingFields({
  resourceId,
  today,
  maxDate,
  state,
  formAction,
}: BookingFieldsProps) {
  const values = state?.values ?? {
    date: today,
    startTime: "",
    endTime: "",
    purpose: "",
  };
  const [date, setDate] = useState(values.date);
  const [start, setStart] = useState(values.startTime);
  const [end, setEnd] = useState(values.endTime);
  const fieldError = (field: string) => state?.fieldErrors?.[field]?.[0];

  // Today: hide start times that have passed. The server checks too.
  const now = nowTimeInColombo();
  const startTimes = TIME_SLOTS.slice(0, -1).filter(
    (t) => date !== today || t > now,
  );
  // End must be after start.
  const endTimes = TIME_SLOTS.slice(1).filter((t) => !start || t > start);

  function changeStart(value: string) {
    setStart(value);
    if (end && end <= value) setEnd("");
  }

  function changeDate(value: string) {
    setDate(value);
    if (value === today && start && start <= now) {
      setStart("");
      setEnd("");
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="resourceId" value={resourceId} />

      {state?.error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {state.error}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-3">
        <label className={labelClass}>
          Date
          <input
            name="date"
            type="date"
            required
            min={today}
            max={maxDate}
            value={date}
            onChange={(e) => changeDate(e.target.value)}
            className={inputClass}
          />
          <FieldError message={fieldError("date")} />
        </label>

        {/* Divs, not labels: a label would re-open the menu on click. */}
        <div className={labelClass}>
          <span>Start time</span>
          <SelectMenu
            name="startTime"
            label="Start time"
            placeholder="Start"
            options={toOptions(startTimes)}
            value={start}
            onChange={changeStart}
            invalid={!!fieldError("startTime")}
          />
          <FieldError message={fieldError("startTime")} />
        </div>

        <div className={labelClass}>
          <span>End time</span>
          <SelectMenu
            name="endTime"
            label="End time"
            placeholder="End"
            options={toOptions(endTimes)}
            value={end}
            onChange={setEnd}
            invalid={!!fieldError("endTime")}
          />
          <FieldError message={fieldError("endTime")} />
        </div>
      </div>

      <label className={labelClass}>
        Purpose
        <textarea
          name="purpose"
          rows={2}
          required
          minLength={3}
          maxLength={200}
          placeholder="e.g. Weekly team meeting"
          defaultValue={values.purpose}
          className={inputClass}
        />
        <FieldError message={fieldError("purpose")} />
      </label>

      <div className="flex justify-end border-t border-gray-100 pt-5">
        <SubmitButton
          pendingText="Booking..."
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          Book now
        </SubmitButton>
      </div>
    </form>
  );
}

// Booking form. Shared later by the admin (D27).
export default function BookingForm(props: BookingFormProps) {
  const [state, formAction] = useActionState<BookingFormState, FormData>(
    bookResource,
    undefined,
  );

  return (
    <div className="flex flex-col gap-4">
      {state?.success && (
        <p
          role="status"
          className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700"
        >
          {state.success}
        </p>
      )}
      {/* A new key after each booking gives a fresh, empty form. */}
      <BookingFields
        key={state?.submittedAt ?? 0}
        state={state}
        formAction={formAction}
        {...props}
      />
    </div>
  );
}
