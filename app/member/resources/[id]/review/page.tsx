import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import BookingConfirm from "@/components/forms/booking-confirm";
import ResourcePhoto from "@/components/ui/resource-photo";
import { requireMember } from "@/lib/security/auth-guard";
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

export const metadata = { title: "Review booking | Resource Reservation" };

type ReviewBookingPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ReviewBookingPage({
  params,
  searchParams,
}: ReviewBookingPageProps) {
  const user = await requireMember();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const resource = await db.resource.findUnique({
    where: { id },
    select: { name: true, type: true, location: true, imageName: true },
  });
  if (!resource) notFound();

  const query = await searchParams;
  const text = (key: string) =>
    typeof query[key] === "string" ? query[key] : "";
  const values = {
    date: text("date"),
    startTime: text("startTime"),
    endTime: text("endTime"),
    purpose: text("purpose").trim(),
  };
  const changeHref = `/member/resources/${id}?${new URLSearchParams(values)}`;

  // Same rules as the final save, so problems show before you confirm.
  const parsed = bookingSchema.safeParse({ ...values, resourceId: id });
  const check = parsed.success
    ? await checkBooking(parsed.data)
    : { ok: false as const, error: parsed.error.issues[0].message };
  const start = parsed.success ? toUtc(values.date, values.startTime) : null;
  const end = parsed.success ? toUtc(values.date, values.endTime) : null;

  const rows =
    start && end
      ? [
          {
            label: "Resource",
            value: `${resource.name} · ${RESOURCE_TYPE_LABELS[resource.type]} · ${resource.location}`,
          },
          { label: "Date", value: formatLongDate(start) },
          {
            label: "Time",
            value: `${formatTime(start)} – ${formatTime(end)} (${formatDuration((end.getTime() - start.getTime()) / 60000)})`,
          },
          { label: "Purpose", value: values.purpose },
          {
            label: "Booked by",
            value: user.department
              ? `${user.name} (${user.department})`
              : user.name,
          },
        ]
      : [];

  return (
    <section className="flex max-w-3xl flex-col gap-6">
      <div>
        <Link
          href={changeHref}
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          ← Change details
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          Review your booking
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Check the details, then confirm. Times are in Sri Lanka time.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <ResourcePhoto
          imageName={resource.imageName}
          type={resource.type}
          variant="card"
        />

        <div className="flex flex-col gap-5 p-6">
          {rows.length > 0 && (
            <dl className="divide-y divide-gray-100 text-sm">
              {rows.map((row) => (
                <div
                  key={row.label}
                  className="grid gap-1 py-3 sm:grid-cols-[140px_1fr]"
                >
                  <dt className="font-medium text-gray-500">{row.label}</dt>
                  <dd className="text-gray-900">{row.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {check.ok ? (
            <>
              <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                This time is free.
              </p>
              <BookingConfirm
                resourceId={id}
                values={values}
                changeHref={changeHref}
              />
            </>
          ) : (
            <>
              <p
                role="alert"
                className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {check.error}
              </p>
              <div className="flex justify-end">
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
