import { notFound } from "next/navigation";
import { z } from "zod";
import ResourceForm from "@/components/forms/resource-form";
import StatusPill from "@/components/ui/status-pill";
import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db";

export const metadata = { title: "Edit resource | Resource Reservation" };

// Next 16: params is a Promise.
type EditResourcePageProps = { params: Promise<{ id: string }> };

export default async function EditResourcePage({
  params,
}: EditResourcePageProps) {
  await requireAdmin();
  const { id } = await params;

  // A bad id would crash the uuid column, so show 404 instead.
  if (!z.uuid().safeParse(id).success) notFound();

  const resource = await db.resource.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      type: true,
      location: true,
      capacity: true,
      description: true,
      imageName: true,
      isActive: true,
    },
  });
  if (!resource) notFound();

  return (
    <section className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Edit resource</h1>
          <StatusPill tone={resource.isActive ? "green" : "gray"}>
            {resource.isActive ? "Active" : "Inactive"}
          </StatusPill>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Change the details of {resource.name}.
        </p>
      </div>
      <ResourceForm resource={resource} />
    </section>
  );
}
