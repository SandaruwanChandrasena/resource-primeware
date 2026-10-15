import Link from "next/link";
import BookingCalendar from "@/components/booking/booking-calendar";
import {
  BellIcon,
  BookingsIcon,
  PlusIcon,
  ResourcesIcon,
} from "@/components/layout/app-icons";
import StatCard from "@/components/ui/stat-card";
import { db } from "@/lib/db";
import { requireMember } from "@/lib/security/auth-guard";
import {
  formatDate,
  formatLongDate,
  formatTime,
} from "@/lib/utils/colombo-time";

export const metadata = { title: "My home | Resource Reservation" };

type MemberHomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MemberHomePage({
  searchParams,
}: MemberHomePageProps) {
  // Pages check again: layouts alone are not a security check.
  const user = await requireMember();
  const now = new Date();

  // Your own summary only (D12, D67). Counts are done by the database.
  const [upcomingCount, nextBooking, waitingCount] = await Promise.all([
    db.reservation.count({
      where: { userId: user.id, status: "CONFIRMED", endTime: { gt: now } },
    }),
    db.reservation.findFirst({
      where: { userId: user.id, status: "CONFIRMED", endTime: { gt: now } },
      orderBy: { startTime: "asc" },
      select: {
        startTime: true,
        endTime: true,
        resource: { select: { name: true } },
      },
    }),
    // "Notify me" times that have not started yet (D78).
    db.waitlistEntry.count({
      where: { userId: user.id, status: "WAITING", startTime: { gt: now } },
    }),
  ]);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          {/* First name only: friendlier and shorter. */}
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user.name.split(" ")[0]}
          </h1>
          {/* One short line: department · date. */}
          <p className="mt-1 text-sm text-gray-500">
            {user.department ? `${user.department} · ` : ""}
            {formatLongDate(now)}
          </p>
        </div>
        <Link
          href="/member/resources"
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
        >
          <PlusIcon className="h-4 w-4" />
          Book a resource
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Upcoming bookings"
          value={upcomingCount}
          hint="View all"
          href="/member/bookings"
          icon={BookingsIcon}
          tone="blue"
        />
        <StatCard
          label="Next booking"
          value={nextBooking ? nextBooking.resource.name : "None yet"}
          hint={
            nextBooking
              ? `${formatDate(nextBooking.startTime)}, ${formatTime(nextBooking.startTime)}–${formatTime(nextBooking.endTime)}`
              : "Book a resource to start"
          }
          href={nextBooking ? "/member/bookings" : "/member/resources"}
          icon={ResourcesIcon}
          tone="violet"
        />
        <StatCard
          label="Waiting for"
          value={waitingCount}
          icon={BellIcon}
          tone="amber"
        />
      </div>

      {/* Everyone's bookings: a clear view of what is taken (the business problem). */}
      <BookingCalendar
        query={await searchParams}
        basePath="/member"
        currentUserId={user.id}
      />
    </section>
  );
}
