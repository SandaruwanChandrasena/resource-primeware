import ResourceForm from "@/components/forms/resource-form";
import { requireAdmin } from "@/lib/auth-guard";

export const metadata = { title: "Add resource | Resource Reservation" };

export default async function NewResourcePage() {
  await requireAdmin();

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add resource</h1>
        <p className="mt-1 text-sm text-gray-500">
          Add a room, equipment or vehicle that people can book.
        </p>
      </div>
      <ResourceForm />
    </section>
  );
}
