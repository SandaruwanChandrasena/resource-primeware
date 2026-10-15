import BookResourceView from "@/components/booking/book-resource-view";
import { requireMember } from "@/lib/security/auth-guard";

export const metadata = { title: "Book | Resource Reservation" };

// Next 16: params and searchParams are Promises.
type BookResourcePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// Member booking form. The shared view does the work.
export default async function BookResourcePage({
  params,
  searchParams,
}: BookResourcePageProps) {
  await requireMember();
  const { id } = await params;

  return (
    <BookResourceView
      id={id}
      query={await searchParams}
      reviewPath={`/member/resources/${id}/review`}
      backHref="/member/resources"
      backLabel="All resources"
    />
  );
}
