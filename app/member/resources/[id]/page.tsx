import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import BookingForm from "@/components/booking-form";
import ResourcePhoto from "@/components/resource-photo";
import { requireMember } from "@/lib/auth-guard";
import { CLOSE_TIME, MAX_DAYS_AHEAD, OPEN_TIME } from "@/lib/booking-settings";
import { addDays, todayInColombo } from "@/lib/colombo-time";
import { db } from "@/lib/db";
import { RESOURCE_TYPE_LABELS } from "@/lib/resource-types";

export const metadata = { title: "Book | Resource Reservation" };

// Next 16: params and searchParams are Promises.
type BookResourcePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BookResourcePage({
  params,
  searchParams,
}: BookResourcePageProps) {
  await requireMember();
  const { id } = await params;

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
  const query = await searchParams;
  const text = (key: string) =>
    typeof query[key] === "string" ? query[key] : "";
  const today = todayInColombo();
  const initial = {
    date: /^\d{4}-\d{2}-\d{2}$/.test(text("date")) ? text("date") : today,
    startTime: text("startTime"),
    endTime: text("endTime"),
    purpose: text("purpose").slice(0, 200),
  };

  return (
    <section className="flex max-w-3xl flex-col gap-6">
      <div>
        <Link
          href="/member/resources"
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          ← All resources
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          Book {resource.name}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {RESOURCE_TYPE_LABELS[resource.type]} · {resource.location}
          {resource.capacity ? ` · ${resource.capacity} people` : ""}
        </p>
        {resource.description && (
          <p className="mt-2 text-sm text-gray-600">{resource.description}</p>
        )}
      </div>

      <ResourcePhoto
        imageName={resource.imageName}
        type={resource.type}
        variant="hero"
      />

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        {resource.isActive ? (
          <>
            <p className="mb-5 text-sm text-gray-500">
              Times are in Sri Lanka time. You can book from {OPEN_TIME} to{" "}
              {CLOSE_TIME}, up to {MAX_DAYS_AHEAD} days ahead.
            </p>
            <BookingForm
              reviewPath={`/member/resources/${resource.id}/review`}
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
    </section>
  );
}
