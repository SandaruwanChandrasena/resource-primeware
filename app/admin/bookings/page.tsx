import AdminCancelForm from "@/components/forms/admin-cancel-form";
import FilterTabs from "@/components/list-tools/filter-tabs";
import SearchFilters from "@/components/list-tools/search-filters";
import SortSelect from "@/components/list-tools/sort-select";
import TablePagination from "@/components/list-tools/table-pagination";
import ResourcePhoto from "@/components/ui/resource-photo";
import StatusPill from "@/components/ui/status-pill";
import UserAvatar from "@/components/ui/user-avatar";
import type { Prisma } from "@/generated/prisma/client";
import { BOOKING_SORT_LABELS } from "@/lib/config/booking-settings";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/security/auth-guard";
import { formatDate, formatTime } from "@/lib/utils/colombo-time";
import { adminBookingsFilterSchema } from "@/lib/validation";

export const metadata = { title: "All bookings | Resource Reservation" };

const EMPTY_TEXT = {
  upcoming: "No upcoming bookings match your search.",
  past: "No past bookings match your search.",
  cancelled: "No cancelled bookings match your search.",
};

type AdminBookingsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminBookingsPage({
  searchParams,
}: AdminBookingsPageProps) {
  const admin = await requireAdmin();
  const { tab, q, resource, sort, page, size, newId } =
    adminBookingsFilterSchema.parse(await searchParams);
  const currentTab = tab ?? "upcoming";
  const now = new Date();

  // Search (resource, person or department) + resource apply to every tab.
  const baseWhere: Prisma.ReservationWhereInput = {
    ...(q && {
      OR: [
        { resource: { name: { contains: q, mode: "insensitive" } } },
        { user: { name: { contains: q, mode: "insensitive" } } },
        { user: { department: { contains: q, mode: "insensitive" } } },
      ],
    }),
    ...(resource && { resourceId: resource }),
  };

  // Same tabs as "My bookings": Upcoming = not ended yet.
  const tabWhere = {
    upcoming: { status: "CONFIRMED", endTime: { gt: now } },
    past: { status: "CONFIRMED", endTime: { lte: now } },
    cancelled: { status: "CANCELLED" },
  } satisfies Record<string, Prisma.ReservationWhereInput>;

  const [upcomingCount, pastCount, cancelledCount, resources] =
    await Promise.all([
      db.reservation.count({ where: { ...baseWhere, ...tabWhere.upcoming } }),
      db.reservation.count({ where: { ...baseWhere, ...tabWhere.past } }),
      db.reservation.count({ where: { ...baseWhere, ...tabWhere.cancelled } }),
      // Inactive ones too: their old bookings still show here.
      db.resource.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
    ]);
  const total = {
    upcoming: upcomingCount,
    past: pastCount,
    cancelled: cancelledCount,
  }[currentTab];

  // Upcoming: soonest first. Past and cancelled: latest first (D72).
  const defaultSort = currentTab === "upcoming" ? "soonest" : "latest";
  const currentSort = sort ?? defaultSort;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const currentPage = Math.min(page, totalPages);

  // One page only from the database (D55). Safe user fields only (D26).
  const bookings = await db.reservation.findMany({
    where: { ...baseWhere, ...tabWhere[currentTab] },
    orderBy: { startTime: currentSort === "soonest" ? "asc" : "desc" },
    skip: (currentPage - 1) * size,
    take: size,
    select: {
      id: true,
      userId: true,
      startTime: true,
      endTime: true,
      purpose: true,
      status: true,
      cancelReason: true,
      resource: {
        select: { name: true, type: true, location: true, imageName: true },
      },
      user: { select: { name: true, department: true, imageName: true } },
      cancelledBy: { select: { name: true } },
    },
  });

  // Just booked by this admin? Show it at the top (D66).
  const newBooking = newId
    ? await db.reservation.findFirst({
        where: { id: newId, userId: admin.id },
        select: {
          startTime: true,
          endTime: true,
          resource: { select: { name: true } },
        },
      })
    : null;

  const resourceOptions = Object.fromEntries(
    resources.map((r) => [r.id, r.name]),
  );
  const from = total === 0 ? 0 : (currentPage - 1) * size + 1;
  const to = (currentPage - 1) * size + bookings.length;

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">All bookings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Every booking by every person. To book yourself, use Book on the
          Resources page. Times are in Sri Lanka time.
        </p>
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

        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <SearchFilters
            q={q}
            placeholder="Search resource, person or department"
            filter={{
              param: "resource",
              label: "Filter by resource",
              allLabel: "All resources",
              value: resource ?? "",
              options: resourceOptions,
            }}
          />
        </div>

        <div className="overflow-x-auto border-y border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Resource</th>
                <th className="px-4 py-3 font-semibold">Booked by</th>
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
                const when = `${b.resource.name}, ${formatDate(b.startTime)}, ${formatTime(b.startTime)}–${formatTime(b.endTime)}`;
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
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          name={b.user.name}
                          imageName={b.user.imageName}
                          size="md"
                        />
                        <div className="min-w-0">
                          <div className="whitespace-nowrap font-medium text-gray-900">
                            {b.user.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {b.user.department ?? "—"}
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
                        <div className="max-w-xs">
                          <StatusPill tone="gray">Cancelled</StatusPill>
                          {/* Who cancelled and why (D28, D29). */}
                          <div
                            className="mt-1 truncate text-xs text-gray-500"
                            title={b.cancelReason ?? undefined}
                          >
                            by {b.cancelledBy?.name ?? "—"}
                            {b.cancelReason && `: ${b.cancelReason}`}
                          </div>
                        </div>
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
                          <AdminCancelForm
                            reservationId={b.id}
                            summary={when}
                            ownerName={b.user.name}
                            reasonRequired={b.userId !== admin.id}
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
