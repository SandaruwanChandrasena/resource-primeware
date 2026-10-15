import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import BookingConfirm from "@/components/forms/booking-confirm";
import NotifyMeButton from "@/components/forms/notify-me-button";
import ResourcePhoto from "@/components/ui/resource-photo";
import {
  formatDuration,
  formatLongDate,
  formatTime,
  toUtc,
} from "@/lib/utils/colombo-time";
import { db } from "@/lib/db";
import { RESOURCE_TYPE_LABELS } from "@/lib/config/resource-types";
import { checkBooking } from "@/lib/services/booking-rules";
import { bookingSchema } from "@/lib/validation";

type ReviewBookingViewProps = {
  id: string;
  query: Record<string, string | string[] | undefined>;
  // The logged-in person: the booking is always in their name (D67).
  user: { name: string; department: string | null };
  // "Change" goes back to this form page.
  bookPath: string;
  // Members can wait for a clash; admins cancel with a block instead (D81).
  allowNotifyMe: boolean;
};

// Booking step 2 (review). Shared by the member and admin pages; they check the role.
export default async function ReviewBookingView({
  id,
  query,
  user,
  bookPath,
  allowNotifyMe,
}: ReviewBookingViewProps) {
  if (!z.uuid().safeParse(id).success) notFound();

  const resource = await db.resource.findUnique({
    where: { id },
    select: { name: true, type: true, location: true, imageName: true },
  });
  if (!resource) notFound();

  const text = (key: string) =>
    typeof query[key] === "string" ? query[key] : "";
  const values = {
    date: text("date"),
    startTime: text("startTime"),
    endTime: text("endTime"),
    purpose: text("purpose").trim(),
  };
  const changeHref = `${bookPath}?${new URLSearchParams(values)}`;

  // Same rules as the final save, so problems show before you confirm.
  const parsed = bookingSchema.safeParse({ ...values, resourceId: id });
  const check = parsed.success
    ? await checkBooking(parsed.data)
    : { ok: false as const, error: parsed.error.issues[0].message };
  const start = parsed.success ? toUtc(values.date, values.startTime) : null;
  const end = parsed.success ? toUtc(values.date, values.endTime) : null;

  // Date tile, e.g. "THU / 15 / Oct". The date string is already a Sri Lanka day.
  const day = parsed.success ? new Date(`${values.date}T00:00:00Z`) : null;
  const dayPart = (o: Intl.DateTimeFormatOptions) =>
    day ? day.toLocaleString("en-GB", { ...o, timeZone: "UTC" }) : "";

  // Small grey "chip" for the resource facts.
  const chip =
    "inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700";

  return (
    <section className="flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col items-start gap-3">
        <Link
          href={changeHref}
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:border-brand-600/40 hover:text-brand-700"
        >
          <span aria-hidden="true">←</span> Change details
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          Review your booking
        </h1>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {/* Resource: small photo + name + facts (no big empty banner). */}
        <div className="flex items-center gap-4 border-b border-gray-100 p-5">
          <ResourcePhoto
            imageName={resource.imageName}
            type={resource.type}
            variant="row"
          />
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold tracking-tight">
              {resource.name}
            </p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                {RESOURCE_TYPE_LABELS[resource.type]}
              </span>
              <span className={chip}>{resource.location}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5 p-5">
          {/* When: the most important part, so it is the biggest. */}
          {start && end && (
            <div className="flex items-center gap-4 rounded-xl bg-brand-50/60 p-4">
              <div className="flex w-16 shrink-0 flex-col items-center overflow-hidden rounded-lg border border-brand-100 bg-white text-center">
                <span className="w-full bg-brand-600 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                  {dayPart({ weekday: "short" })}
                </span>
                <span className="text-2xl font-bold leading-tight text-gray-900">
                  {dayPart({ day: "numeric" })}
                </span>
                <span className="pb-1 text-xs font-medium text-gray-500">
                  {dayPart({ month: "short" })}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold tabular-nums tracking-tight text-gray-900">
                  {formatTime(start)} – {formatTime(end)}
                </p>
                <p className="mt-0.5 text-sm text-gray-500">
                  {formatLongDate(start)} ·{" "}
                  {formatDuration((end.getTime() - start.getTime()) / 60000)} ·
                  Sri Lanka time
                </p>
              </div>
            </div>
          )}

          {start && end && (
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Purpose
                </dt>
                <dd className="mt-1 break-words text-gray-900">
                  {values.purpose}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Booked by
                </dt>
                <dd className="mt-1 text-gray-900">
                  {user.name}
                  {user.department && (
                    <span className="text-gray-500"> · {user.department}</span>
                  )}
                </dd>
              </div>
            </dl>
          )}

          {check.ok ? (
            <>
              <p className="flex items-center gap-2 rounded-lg border border-green-100 bg-green-50 px-3 py-2.5 text-sm font-medium text-green-700">
                <span
                  aria-hidden="true"
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-xs text-white"
                >
                  ✓
                </span>
                This time is free.
              </p>
              <div className="border-t border-gray-100 pt-5">
                <BookingConfirm
                  resourceId={id}
                  values={values}
                  changeHref={changeHref}
                  allowNotifyMe={allowNotifyMe}
                />
              </div>
            </>
          ) : (
            <>
              <p
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700"
              >
                <span
                  aria-hidden="true"
                  className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-600 text-xs text-white"
                >
                  !
                </span>
                {check.error}
              </p>
              <div className="flex flex-wrap items-start justify-between gap-3 border-t border-gray-100 pt-5">
                {/* Only a clash can be waited for; other problems need a change (D3). */}
                {allowNotifyMe && "isClash" in check && check.isClash ? (
                  <NotifyMeButton
                    resourceId={id}
                    date={values.date}
                    startTime={values.startTime}
                    endTime={values.endTime}
                  />
                ) : (
                  <span />
                )}
                <Link
                  href={changeHref}
                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                >
                  Change details
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
