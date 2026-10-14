import Link from "next/link";
import { cancelMyBooking } from "@/actions/bookings";
import { PlusIcon } from "@/components/layout/app-icons";
import ConfirmButton from "@/components/ui/confirm-button";
import FilterTabs from "@/components/list-tools/filter-tabs";
import ResourcePhoto from "@/components/ui/resource-photo";
import SortSelect from "@/components/list-tools/sort-select";
import StatusPill from "@/components/ui/status-pill";
import TablePagination from "@/components/list-tools/table-pagination";
import type { Prisma } from "@/generated/prisma/client";
import { requireMember } from "@/lib/auth-guard";
import { BOOKING_SORT_LABELS } from "@/lib/booking-settings";
import { formatDate, formatTime } from "@/lib/colombo-time";
import { db } from "@/lib/db";
import { myBookingsFilterSchema } from "@/lib/validation";

export const metadata = { title: "My bookings | Resource Reservation" };

const EMPTY_TEXT = {
  upcoming: "You have no upcoming bookings.",
  past: "No past bookings yet.",
  cancelled: "No cancelled bookings.",
};

type MyBookingsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MyBookingsPage({
  searchParams,
}: MyBookingsPageProps) {
  const user = await requireMember();
  const { tab, sort, newId, page, size } = myBookingsFilterSchema.parse(
    await searchParams,
  );
  const currentTab = tab ?? "upcoming";
  const now = new Date();

  // Upcoming = not ended yet. Past = ended. Cancelled = any time.
  const tabWhere = {
    upcoming: { status: "CONFIRMED", endTime: { gt: now } },
    past: { status: "CONFIRMED", endTime: { lte: now } },
    cancelled: { status: "CANCELLED" },
  } satisfies Record<string, Prisma.ReservationWhereInput>;

  const [upcomingCount, pastCount, cancelledCount] = await Promise.all([
    db.reservation.count({ where: { userId: user.id, ...tabWhere.upcoming } }),
    db.reservation.count({ where: { userId: user.id, ...tabWhere.past } }),
    db.reservation.count({ where: { userId: user.id, ...tabWhere.cancelled } }),
  ]);
  const total = {
    upcoming: upcomingCount,
    past: pastCount,
    cancelled: cancelledCount,
  }[currentTab];

  // Upcoming: soonest first. Past and cancelled: latest first.
  const defaultSort = currentTab === "upcoming" ? "soonest" : "latest";
  const currentSort = sort ?? defaultSort;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const currentPage = Math.min(page, totalPages);

  const bookings = await db.reservation.findMany({
    where: { userId: user.id, ...tabWhere[currentTab] },
    orderBy: { startTime: currentSort === "soonest" ? "asc" : "desc" },
    skip: (currentPage - 1) * size,
    take: size,
    select: {
      id: true,
      startTime: true,
      endTime: true,
      purpose: true,
      status: true,
      resource: {
        select: { name: true, type: true, location: true, imageName: true },
      },
    },
  });

  // Just booked? Show it at the top (only if it is yours).
  const newBooking = newId
    ? await db.reservation.findFirst({
        where: { id: newId, userId: user.id },
        select: {
          startTime: true,
          endTime: true,
          resource: { select: { name: true } },
        },
      })
    : null;

  const from = total === 0 ? 0 : (currentPage - 1) * size + 1;
  const to = (currentPage - 1) * size + bookings.length;

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My bookings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Times are in Sri Lanka time.
          </p>
        </div>
        <Link
          href="/member/resources"
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <PlusIcon className="h-4 w-4" />
          Book a resource
        </Link>
      </div>

      {newBooking && (
        <p
          role="status"
          className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          <span className="font-semibold">Booking confirmed:</span>{" "}
          {newBooking.resource.name} on {formatDate(newBooking.startTime)},{" "}
          {formatTime(newBooking.startTime)}–{formatTime(newBooking.endTime)}.
        </p>
      )}

      <div className="rounded-xl border border-gray-200 bg-white">
        <FilterTabs
          param="tab"
          current={tab ?? ""}
          tabs={[
            { value: "", label: "Upcoming", count: upcomingCount },
            { value: "past", label: "Past", count: pastCount },
            { value: "cancelled", label: "Cancelled", count: cancelledCount },
          ]}
        />

        <div className="overflow-x-auto border-b border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Resource</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Time</th>
                <th className="px-4 py-3 font-semibold">Purpose</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.map((b) => {
                const started = b.startTime <= now;
                const ended = b.endTime <= now;
                const canCancel = b.status === "CONFIRMED" && !started;
                const when = `${formatDate(b.startTime)}, ${formatTime(b.startTime)}–${formatTime(b.endTime)}`;
                return (
                  <tr
                    key={b.id}
                    className={`transition-colors hover:bg-gray-50 ${b.id === newId ? "bg-green-50/70" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ResourcePhoto
                          imageName={b.resource.imageName}
                          type={b.resource.type}
                          variant="thumb"
                          muted={b.status === "CANCELLED"}
                        />
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900">
                            {b.resource.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {b.resource.location}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {formatDate(b.startTime)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                      {formatTime(b.startTime)} – {formatTime(b.endTime)}
                    </td>
                    <td
                      className="max-w-xs truncate px-4 py-3"
                      title={b.purpose}
                    >
                      {b.purpose}
                    </td>
                    <td className="px-4 py-3">
                      {b.status === "CANCELLED" ? (
                        <StatusPill tone="gray">Cancelled</StatusPill>
                      ) : ended ? (
                        <StatusPill tone="gray">Completed</StatusPill>
                      ) : started ? (
                        <StatusPill tone="green">In progress</StatusPill>
                      ) : (
                        <StatusPill tone="green">Confirmed</StatusPill>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        {canCancel ? (
                          <ConfirmButton
                            action={cancelMyBooking.bind(null, b.id)}
                            label="Cancel"
                            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                            title="Cancel this booking?"
                            message={`${b.resource.name}, ${when}. After you cancel, other people can book this time.`}
                            confirmLabel="Cancel booking"
                            cancelLabel="Keep booking"
                            pendingText="Cancelling..."
                          />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {bookings.length === 0 && (
            <p className="px-4 py-10 text-center text-sm text-gray-500">
              {EMPTY_TEXT[currentTab]}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span className="tabular-nums">
              Showing {from}–{to} of {total}
            </span>
            <SortSelect
              options={BOOKING_SORT_LABELS}
              value={currentSort}
              defaultValue={defaultSort}
            />
          </div>
          <TablePagination page={currentPage} pageSize={size} total={total} />
        </div>
      </div>
    </section>
  );
}
