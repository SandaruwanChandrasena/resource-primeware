import Link from "next/link";
import { setResourceActive } from "@/actions/resources";
import { PlusIcon } from "@/components/app-icons";
import ConfirmButton from "@/components/confirm-button";
import ResourceFilters from "@/components/resource-filters";
import StatusPill from "@/components/status-pill";
import SubmitButton from "@/components/submit-button";
import type { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { RESOURCE_TYPE_LABELS, type ResourceSort } from "@/lib/resource-types";
import { resourceFilterSchema } from "@/lib/validation";

export const metadata = { title: "Resources | Resource Reservation" };

// Each sort choice -> database order. Name breaks ties.
const ORDER_BY = {
  oldest: [{ createdAt: "asc" }, { name: "asc" }],
  newest: [{ createdAt: "desc" }, { name: "asc" }],
  name: [{ name: "asc" }],
} satisfies Record<ResourceSort, Prisma.ResourceOrderByWithRelationInput[]>;

// Same width for Activate and Deactivate, so Edit buttons line up.
const TOGGLE_CLASS =
  "flex w-24 items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-60";

type AdminResourcesPageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminResourcesPage({ searchParams }: AdminResourcesPageProps) {
  await requireAdmin();
  const { q, type, status, sort } = resourceFilterSchema.parse(await searchParams);

  const [resources, total, activeTotal] = await Promise.all([
    db.resource.findMany({
      where: {
        ...(q && {
          OR: [{ name: { contains: q, mode: "insensitive" } }, { location: { contains: q, mode: "insensitive" } }],
        }),
        ...(type && { type }),
        ...(status && { isActive: status === "active" }),
      },
      orderBy: ORDER_BY[sort],
      include: {
        // Future confirmed bookings (D50).
        _count: {
          select: { reservations: { where: { status: "CONFIRMED", startTime: { gte: new Date() } } } },
        },
      },
    }),
    db.resource.count(),
    db.resource.count({ where: { isActive: true } }),
  ]);
  const isFiltered = Boolean(q || type || status);

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Resources</h1>
        <p className="mt-1 text-sm text-gray-500">
          {isFiltered
            ? `Showing ${resources.length} of ${total} resources.`
            : `${activeTotal} active of ${total} total.`}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ResourceFilters q={q} type={type ?? ""} status={status ?? ""} sort={sort} />
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
            {resources.map((r) => {
              const upcoming = r._count.reservations;
              return (
                <tr key={r.id} className={r.isActive ? "" : "bg-gray-50/60 text-gray-500"}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{r.name}</div>
                    {r.description && <div className="max-w-xs truncate text-xs text-gray-500">{r.description}</div>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{RESOURCE_TYPE_LABELS[r.type]}</td>
                  <td className="whitespace-nowrap px-4 py-3">{r.location}</td>
                  <td className="px-4 py-3 tabular-nums">{r.capacity ?? "—"}</td>
                  <td className="px-4 py-3 tabular-nums">{upcoming}</td>
                  <td className="px-4 py-3">
                    <StatusPill tone={r.isActive ? "green" : "gray"}>{r.isActive ? "Active" : "Inactive"}</StatusPill>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/resources/${r.id}/edit`}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Edit
                      </Link>
                      {r.isActive ? (
                        <ConfirmButton
                          action={setResourceActive.bind(null, r.id, false)}
                          label="Deactivate"
                          className={`${TOGGLE_CLASS} border-red-200 text-red-700 hover:bg-red-50`}
                          title={`Deactivate ${r.name}?`}
                          message={
                            upcoming > 0
                              ? `People can't make new bookings for it. Its ${upcoming} upcoming booking(s) will stay, so cancel them by hand if needed.`
                              : "People can't make new bookings for it. You can activate it again later."
                          }
                          confirmLabel="Deactivate"
                          pendingText="Deactivating..."
                        />
                      ) : (
                        // Activate is safe and easy to undo, so no confirm box.
                        <form action={setResourceActive.bind(null, r.id, true)}>
                          <SubmitButton className={`${TOGGLE_CLASS} border-brand-100 text-brand-700 hover:bg-brand-50`}>
                            Activate
                          </SubmitButton>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {resources.length === 0 && (
          <p className="p-6 text-sm text-gray-500">
            {isFiltered ? "No resources match your search." : "No resources yet."}
          </p>
        )}
      </div>
    </section>
  );
}