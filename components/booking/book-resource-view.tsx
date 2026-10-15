import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import BookingForm from "@/components/forms/booking-form";
import { UsersIcon } from "@/components/layout/app-icons";
import ResourcePhoto from "@/components/ui/resource-photo";
import {
  CLOSE_TIME,
  MAX_DAYS_AHEAD,
  OPEN_TIME,
} from "@/lib/config/booking-settings";
import { addDays, todayInColombo } from "@/lib/utils/colombo-time";
import { db } from "@/lib/db";
import { RESOURCE_TYPE_LABELS } from "@/lib/config/resource-types";

type BookResourceViewProps = {
  id: string;
  query: Record<string, string | string[] | undefined>;
  // Where "Review booking" goes, and the back link. Member and admin differ.
  reviewPath: string;
  backHref: string;
  backLabel: string;
};

// Booking step 1 (form). Shared by the member and admin pages; they check the role.
export default async function BookResourceView({
  id,
  query,
  reviewPath,
  backHref,
  backLabel,
}: BookResourceViewProps) {
  // A bad id would crash the uuid column, so show 404 instead.
  if (!z.uuid().safeParse(id).success) notFound();

  const resource = await db.resource.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      type: true,
      location: true,
      capacity: true,
      description: true,
      imageName: true,
      isActive: true,
    },
  });
  if (!resource) notFound();

  // "Change" on the review page comes back here with the values in the URL.
  const text = (key: string) =>
    typeof query[key] === "string" ? query[key] : "";
  const today = todayInColombo();
  const initial = {
    date: /^\d{4}-\d{2}-\d{2}$/.test(text("date")) ? text("date") : today,
    startTime: text("startTime"),
    endTime: text("endTime"),
    purpose: text("purpose").slice(0, 200),
  };

  // Small grey "chip" for the resource facts.
  const chip =
    "inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700";

  return (
    <section className="flex max-w-6xl flex-col gap-6">
      <div className="flex flex-col items-start gap-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:border-brand-600/40 hover:text-brand-700"
        >
          <span aria-hidden="true">←</span> {backLabel}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          Book {resource.name}
        </h1>
      </div>

      {/* Big screens: resource card on the left, form on the right. Phones: stacked. */}
      <div className="grid items-start gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-xl border border-gray-200 bg-white lg:sticky lg:top-24">
          <div className="p-3">
            <ResourcePhoto
              imageName={resource.imageName}
              type={resource.type}
              variant="hero"
            />
          </div>
          <div className="flex flex-col gap-3 px-5 pb-5 pt-2">
            <h2 className="text-lg font-semibold tracking-tight">
              {resource.name}
            </h2>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                {RESOURCE_TYPE_LABELS[resource.type]}
              </span>
              <span className={chip}>{resource.location}</span>
              {resource.capacity ? (
                <span className={chip}>
                  <UsersIcon className="h-3.5 w-3.5" />
                  {resource.capacity} people
                </span>
              ) : null}
            </div>
            {resource.description && (
              <p className="text-sm leading-relaxed text-gray-600">
                {resource.description}
              </p>
            )}
          </div>
        </aside>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          {resource.isActive ? (
            <>
              <h2 className="text-lg font-semibold tracking-tight">
                Choose a time
              </h2>
              {/* Booking rules in one short line (D64). */}
              <p className="mb-5 mt-1 text-sm text-gray-500">
                Sri Lanka time · {OPEN_TIME}–{CLOSE_TIME} · up to{" "}
                {MAX_DAYS_AHEAD} days ahead
              </p>
              <BookingForm
                reviewPath={reviewPath}
                today={today}
                maxDate={addDays(today, MAX_DAYS_AHEAD)}
                initial={initial}
              />
            </>
          ) : (
            // D50: no new bookings for an inactive resource.
            <p className="text-sm text-gray-500">
              This resource is not available for booking right now.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
