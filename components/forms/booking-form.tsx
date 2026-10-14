"use client";

import Form from "next/form";
import { useState } from "react";
import SelectMenu from "@/components/ui/select-menu";
import { TIME_SLOTS } from "@/lib/config/booking-settings";
import { nowTimeInColombo } from "@/lib/utils/colombo-time";

const inputClass =
  "rounded-lg border border-gray-300 px-3 py-2 font-normal focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100";
const labelClass = "flex flex-col gap-1.5 text-sm font-medium";

export type BookingFormValues = {
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
};

type BookingFormProps = {
  reviewPath: string;
  today: string;
  maxDate: string;
  initial: BookingFormValues;
};

const toOptions = (times: string[]) =>
  times.map((t) => ({ value: t, label: t }));

// Step 1 of booking: pick the time. "Review booking" opens the review page.
// Shared later by the admin (D27).
export default function BookingForm({
  reviewPath,
  today,
  maxDate,
  initial,
}: BookingFormProps) {
  const [date, setDate] = useState(initial.date);
  const [start, setStart] = useState(initial.startTime);
  const [end, setEnd] = useState(initial.endTime);

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
    // next/form: a normal GET form, but it moves to the next page without a full reload.
    <Form action={reviewPath} className="flex flex-col gap-5">
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
          />
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
          />
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
          defaultValue={initial.purpose}
          className={inputClass}
        />
      </label>

      <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
        {(!start || !end) && (
          <span className="text-xs text-gray-500">
            Choose a start and end time.
          </span>
        )}
        <button
          type="submit"
          disabled={!start || !end}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          Review booking
        </button>
      </div>
    </Form>
  );
}
