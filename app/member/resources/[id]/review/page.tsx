import ReviewBookingView from "@/components/booking/review-booking-view";
import { requireMember } from "@/lib/security/auth-guard";

export const metadata = { title: "Review booking | Resource Reservation" };

type ReviewBookingPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// Member review page. The shared view does the work.
export default async function ReviewBookingPage({
  params,
  searchParams,
}: ReviewBookingPageProps) {
  const user = await requireMember();
  const { id } = await params;

  return (
    <ReviewBookingView
      id={id}
      query={await searchParams}
      user={user}
      bookPath={`/member/resources/${id}`}
      allowNotifyMe
    />
  );
}
