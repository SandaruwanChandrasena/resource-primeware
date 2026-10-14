import Link from "next/link";
import { setResourceActive } from "@/actions/resources";
import { PlusIcon } from "@/components/app-icons";
import StatusPill from "@/components/status-pill";
import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { RESOURCE_TYPE_LABELS } from "@/lib/resource-types";

export const metadata = { title: "Resources | Resource Reservation" };

export default async function AdminResourcesPage() {
  await requireAdmin();

  // Active first, then A-Z. Also count future confirmed bookings (D50).
  const resources = await db.resource.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          reservations: {
            where: { status: "CONFIRMED", startTime: { gte: new Date() } },
          },
        },
      },
    },
  });
  const activeCount = resources.filter((r) => r.isActive).length;

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resources</h1>
          <p className="mt-1 text-sm text-gray-500">
            {activeCount} active of {resources.length} total.
          </p>
        </div>
        <Link
          href="/admin/resources/new"
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <PlusIcon className="h-4 w-4" />
          Add resource
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Location</th>
              <th className="px-4 py-3 font-semibold">Capacity</th>
              <th className="px-4 py-3 font-semibold">Upcoming bookings</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {resources.map((r) => (
              <tr
                key={r.id}
                className={r.isActive ? "" : "bg-gray-50/60 text-gray-500"}
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{r.name}</div>
                  {r.description && (
                    <div className="max-w-xs truncate text-xs text-gray-500">
                      {r.description}
                    </div>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {RESOURCE_TYPE_LABELS[r.type]}
                </td>
                <td className="whitespace-nowrap px-4 py-3">{r.location}</td>
                <td className="px-4 py-3 tabular-nums">{r.capacity ?? "—"}</td>
                <td className="px-4 py-3 tabular-nums">
                  {r._count.reservations}
                </td>
                <td className="px-4 py-3">
                  <StatusPill tone={r.isActive ? "green" : "gray"}>
                    {r.isActive ? "Active" : "Inactive"}
                  </StatusPill>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/resources/${r.id}/edit`}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Edit
                    </Link>
                    {/* Fixed width, so every Edit button lines up. */}
                    <form
                      action={setResourceActive.bind(null, r.id, !r.isActive)}
                    >
                      <button
                        type="submit"
                        className={`w-24 rounded-lg border px-3 py-1.5 text-center text-xs font-medium ${
                          r.isActive
                            ? "border-red-200 text-red-700 hover:bg-red-50"
                            : "border-brand-100 text-brand-700 hover:bg-brand-50"
                        }`}
                      >
                        {r.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {resources.length === 0 && (
          <p className="p-6 text-sm text-gray-500">No resources yet.</p>
        )}
      </div>
    </section>
  );
}
