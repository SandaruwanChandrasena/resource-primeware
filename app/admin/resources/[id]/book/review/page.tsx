import ReviewBookingView from "@/components/booking/review-booking-view";
import { requireAdmin } from "@/lib/security/auth-guard";

export const metadata = { title: "Review booking | Resource Reservation" };

type AdminReviewPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// Admin review page. No "Notify me": an admin can cancel with a block (D81).
export default async function AdminReviewPage({
  params,
  searchParams,
}: AdminReviewPageProps) {
  const user = await requireAdmin();
  const { id } = await params;

  return (
    <ReviewBookingView
      id={id}
      query={await searchParams}
      user={user}
      bookPath={`/admin/resources/${id}/book`}
      allowNotifyMe={false}
    />
  );
}
