import Link from "next/link";
import { setResourceActive } from "@/actions/resources";
import { PlusIcon } from "@/components/layout/app-icons";
import ConfirmButton from "@/components/ui/confirm-button";
import FilterTabs from "@/components/list-tools/filter-tabs";
import ResourcePhoto from "@/components/ui/resource-photo";
import SearchFilters from "@/components/list-tools/search-filters";
import SortSelect from "@/components/list-tools/sort-select";
import StatusPill from "@/components/ui/status-pill";
import SubmitButton from "@/components/ui/submit-button";
import TablePagination from "@/components/list-tools/table-pagination";
import type { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/security/auth-guard";
import { db } from "@/lib/db";
import {
  RESOURCE_ORDER_BY,
  RESOURCE_SORT_LABELS,
  RESOURCE_TYPE_LABELS,
} from "@/lib/config/resource-types";
import { resourceFilterSchema } from "@/lib/validation";

export const metadata = { title: "Resources | Resource Reservation" };

// Same width for Activate and Deactivate, so Edit buttons line up.
const TOGGLE_CLASS =
  "flex w-24 items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-60";

type AdminResourcesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminResourcesPage({
  searchParams,
}: AdminResourcesPageProps) {
  await requireAdmin();
  const { q, type, status, sort, page, size } = resourceFilterSchema.parse(
    await searchParams,
  );

  // Search + type apply to every tab; the tab adds the status.
  const baseWhere: Prisma.ResourceWhereInput = {
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
      ],
    }),
    ...(type && { type }),
  };
  const [allCount, activeCount] = await Promise.all([
    db.resource.count({ where: baseWhere }),
    db.resource.count({ where: { ...baseWhere, isActive: true } }),
  ]);
  const inactiveCount = allCount - activeCount;
  const total =
    status === "active"
      ? activeCount
      : status === "inactive"
        ? inactiveCount
        : allCount;

  // A page number past the end goes to the last page.
  const totalPages = Math.max(1, Math.ceil(total / size));
  const currentPage = Math.min(page, totalPages);

  // Only one page of rows comes from the database.
  const resources = await db.resource.findMany({
    where: { ...baseWhere, ...(status && { isActive: status === "active" }) },
    orderBy: RESOURCE_ORDER_BY[sort],
    skip: (currentPage - 1) * size,
    take: size,
    include: {
      // Future confirmed bookings (D50).
      _count: {
        select: {
          reservations: {
            where: { status: "CONFIRMED", startTime: { gte: new Date() } },
          },
        },
      },
    },
  });
  const from = total === 0 ? 0 : (currentPage - 1) * size + 1;
  const to = (currentPage - 1) * size + resources.length;

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Resources</h1>
        <p className="mt-1 text-sm text-gray-500">
          Rooms, equipment and vehicles that people can book.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <FilterTabs
          param="status"
          current={status ?? ""}
          tabs={[
            { value: "", label: "All", count: allCount },
            { value: "active", label: "Active", count: activeCount },
            { value: "inactive", label: "Inactive", count: inactiveCount },
          ]}
        />

        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <SearchFilters
            q={q}
            placeholder="Search name or location"
            filter={{
              param: "type",
              label: "Filter by type",
              allLabel: "All types",
              value: type ?? "",
              options: RESOURCE_TYPE_LABELS,
            }}
          />
          <Link
            href="/admin/resources/new"
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <PlusIcon className="h-4 w-4" />
            Add resource
          </Link>
        </div>

        <div className="overflow-x-auto border-y border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Location</th>
                <th className="px-4 py-3 font-semibold">Capacity</th>
                <th className="px-4 py-3 font-semibold">Upcoming bookings</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {resources.map((r) => {
                const upcoming = r._count.reservations;
                return (
                  <tr
                    key={r.id}
                    className={`transition-colors hover:bg-gray-50 ${r.isActive ? "" : "bg-gray-50/60 text-gray-500"}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ResourcePhoto
                          imageName={r.imageName}
                          type={r.type}
                          variant="thumb"
                          muted={!r.isActive}
                        />
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900">
                            {r.name}
                          </div>
                          {r.description && (
                            <div className="max-w-xs truncate text-xs text-gray-500">
                              {r.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {RESOURCE_TYPE_LABELS[r.type]}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {r.location}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {r.capacity ?? "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{upcoming}</td>
                    <td className="px-4 py-3">
                      <StatusPill tone={r.isActive ? "green" : "gray"}>
                        {r.isActive ? "Active" : "Inactive"}
                      </StatusPill>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {/* Admin books in their own name (D27). Inactive: same-size gap keeps buttons lined up. */}
                        {r.isActive ? (
                          <Link
                            href={`/admin/resources/${r.id}/book`}
                            className="flex w-14 items-center justify-center rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
                          >
                            Book
                          </Link>
                        ) : (
                          <span className="w-14" aria-hidden="true" />
                        )}
                        <Link
                          href={`/admin/resources/${r.id}/edit`}
                          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Edit
                        </Link>
                        {r.isActive ? (
                          <ConfirmButton
                            action={setResourceActive.bind(null, r.id, false)}
                            label="Deactivate"
                            className={`${TOGGLE_CLASS} border-red-200 bg-white text-red-700 hover:bg-red-50`}
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
                          <form
                            action={setResourceActive.bind(null, r.id, true)}
                          >
                            <SubmitButton
                              className={`${TOGGLE_CLASS} border-brand-100 bg-white text-brand-700 hover:bg-brand-50`}
                            >
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
            <p className="px-4 py-10 text-center text-sm text-gray-500">
              {allCount === 0 && !q && !type
                ? "No resources yet."
                : "No resources match your search."}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span className="tabular-nums">
              Showing {from}–{to} of {total}
            </span>
            <SortSelect
              options={RESOURCE_SORT_LABELS}
              value={sort}
              defaultValue="oldest"
            />
          </div>
          <TablePagination page={currentPage} pageSize={size} total={total} />
        </div>
      </div>
    </section>
  );
}
