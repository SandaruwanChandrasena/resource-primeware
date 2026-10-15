import BookResourceView from "@/components/booking/book-resource-view";
import { requireAdmin } from "@/lib/security/auth-guard";

export const metadata = { title: "Book | Resource Reservation" };

type AdminBookPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// Admin books in their OWN name (D27). Same form and rules as members.
export default async function AdminBookPage({
  params,
  searchParams,
}: AdminBookPageProps) {
  await requireAdmin();
  const { id } = await params;

  return (
    <BookResourceView
      id={id}
      query={await searchParams}
      reviewPath={`/admin/resources/${id}/book/review`}
      backHref="/admin/resources"
      backLabel="Resources"
    />
  );
}
