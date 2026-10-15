import BookingCalendar from "@/components/booking/booking-calendar";
import { requireAdmin } from "@/lib/security/auth-guard";

export const metadata = { title: "Calendar | Resource Reservation" };

type AdminCalendarPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// Admin calendar: the same shared calendar members see on their home page.
export default async function AdminCalendarPage({
  searchParams,
}: AdminCalendarPageProps) {
  const admin = await requireAdmin();

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
        <p className="mt-1 text-sm text-gray-500">
          Every confirmed booking. Hover or tap a booking to see who booked it.
          Times are in Sri Lanka time.
        </p>
      </div>
      <BookingCalendar
        query={await searchParams}
        basePath="/admin/calendar"
        currentUserId={admin.id}
      />
    </section>
  );
}
