import Link from "next/link";
import {
  BookingsIcon,
  ResourcesIcon,
  UsersIcon,
} from "@/components/layout/app-icons";
import ResourcePhoto from "@/components/ui/resource-photo";
import StatusPill from "@/components/ui/status-pill";
import UserAvatar from "@/components/ui/user-avatar";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/security/auth-guard";
import {
  addDays,
  formatLongDate,
  formatTime,
  toUtc,
  todayInColombo,
  weekStartInColombo,
} from "@/lib/utils/colombo-time";

export const metadata = { title: "Admin dashboard | Resource Reservation" };

// Shown on the dashboard; the full list is on the Bookings page.
const TODAY_LIMIT = 10;

type StatCardProps = {
  label: string;
  value: number;
  hint: string;
  href: string;
  icon: (props: { className?: string }) => React.ReactNode;
};

// One number card. The whole card is a link to the details.
function StatCard({ label, value, hint, href, icon: Icon }: StatCardProps) {
  return (
    <Link
      href={href}
      className="group flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-brand-600/40 hover:bg-brand-50/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
    >
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight">
          {value}
        </p>
        <p className="mt-1 text-xs text-gray-500 group-hover:text-brand-700">
          {hint}
        </p>
      </div>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
        <Icon className="h-5 w-5" />
      </span>
    </Link>
  );
}

export default async function AdminDashboardPage() {
  // Pages check again: layouts alone are not a security check.
  const user = await requireAdmin();
  const now = new Date();

  // Day and week edges in Sri Lanka time (D19). Week = Monday to Sunday.
  const today = todayInColombo();
  const dayStart = toUtc(today, "00:00");
  const dayEnd = toUtc(addDays(today, 1), "00:00");
  const weekStart = weekStartInColombo();
  const weekFrom = toUtc(weekStart, "00:00");
  const weekTo = toUtc(addDays(weekStart, 7), "00:00");

  // The database counts; it never sends all rows (fast as data grows).
  const [todayCount, weekCount, resourceCount, userCount, todayBookings] =
    await Promise.all([
      db.reservation.count({
        where: {
          status: "CONFIRMED",
          startTime: { gte: dayStart, lt: dayEnd },
        },
      }),
      db.reservation.count({
        where: {
          status: "CONFIRMED",
          startTime: { gte: weekFrom, lt: weekTo },
        },
      }),
      db.resource.count({ where: { isActive: true } }),
      db.user.count({ where: { isActive: true } }),
      // Cancelled ones are not counted or listed.
      db.reservation.findMany({
        where: {
          status: "CONFIRMED",
          startTime: { gte: dayStart, lt: dayEnd },
        },
        orderBy: { startTime: "asc" },
        take: TODAY_LIMIT,
        select: {
          id: true,
          startTime: true,
          endTime: true,
          purpose: true,
          resource: {
            select: { name: true, type: true, location: true, imageName: true },
          },
          user: { select: { name: true, department: true, imageName: true } },
        },
      }),
    ]);

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back, {user.name}. Today is {formatLongDate(now)}.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Bookings today"
          value={todayCount}
          hint="View all bookings"
          href="/admin/bookings"
          icon={BookingsIcon}
        />
        <StatCard
          label="Bookings this week"
          value={weekCount}
          hint="Monday to Sunday"
          href="/admin/bookings"
          icon={BookingsIcon}
        />
        <StatCard
          label="Active resources"
          value={resourceCount}
          hint="Manage resources"
          href="/admin/resources?status=active"
          icon={ResourcesIcon}
        />
        <StatCard
          label="Active users"
          value={userCount}
          hint="Manage users"
          href="/admin/users?status=active"
          icon={UsersIcon}
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <h2 className="text-base font-semibold">Today&apos;s bookings</h2>
            <p className="text-sm text-gray-500">
              Sorted by start time. Sri Lanka time.
            </p>
          </div>
          <Link
            href="/admin/bookings"
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            View all bookings
          </Link>
        </div>

        <div className="overflow-x-auto border-t border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Time</th>
                <th className="px-4 py-3 font-semibold">Resource</th>
                <th className="px-4 py-3 font-semibold">Booked by</th>
                <th className="px-4 py-3 font-semibold">Purpose</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {todayBookings.map((b) => {
                const started = b.startTime <= now;
                const ended = b.endTime <= now;
                return (
                  <tr key={b.id} className="transition-colors hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                      {formatTime(b.startTime)} – {formatTime(b.endTime)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ResourcePhoto
                          imageName={b.resource.imageName}
                          type={b.resource.type}
                          variant="thumb"
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
                    <td
                      className="max-w-xs truncate px-4 py-3"
                      title={b.purpose}
                    >
                      {b.purpose}
                    </td>
                    <td className="px-4 py-3">
                      {ended ? (
                        <StatusPill tone="gray">Completed</StatusPill>
                      ) : started ? (
                        <StatusPill tone="green">In progress</StatusPill>
                      ) : (
                        <StatusPill tone="green">Upcoming</StatusPill>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {todayBookings.length === 0 && (
            <p className="px-4 py-10 text-center text-sm text-gray-500">
              No bookings today.
            </p>
          )}
        </div>

        {todayCount > TODAY_LIMIT && (
          <p className="border-t border-gray-200 px-4 py-3 text-sm text-gray-500">
            Showing the first {TODAY_LIMIT} of {todayCount}.{" "}
            <Link
              href="/admin/bookings"
              className="font-medium text-brand-700 hover:underline"
            >
              See all
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
