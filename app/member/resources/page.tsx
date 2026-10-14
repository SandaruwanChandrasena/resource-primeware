import Link from "next/link";
import ResourcePhoto from "@/components/resource-photo";
import SearchFilters from "@/components/search-filters";
import SortSelect from "@/components/sort-select";
import TablePagination from "@/components/table-pagination";
import ViewToggle from "@/components/view-toggle";
import type { Prisma } from "@/generated/prisma/client";
import { requireMember } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { CARD_PAGE_SIZES, DEFAULT_CARD_PAGE_SIZE } from "@/lib/pagination";
import {
  RESOURCE_ORDER_BY,
  RESOURCE_SORT_LABELS,
  RESOURCE_TYPE_LABELS,
} from "@/lib/resource-types";
import { memberResourceFilterSchema } from "@/lib/validation";

export const metadata = { title: "Resources | Resource Reservation" };

const bookButton =
  "rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700";

type MemberResourcesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MemberResourcesPage({
  searchParams,
}: MemberResourcesPageProps) {
  await requireMember();
  const { q, type, sort, view, page, size } = memberResourceFilterSchema.parse(
    await searchParams,
  );

  // Only active resources can be booked (D50).
  const where: Prisma.ResourceWhereInput = {
    isActive: true,
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
      ],
    }),
    ...(type && { type }),
  };
  const total = await db.resource.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / size));
  const currentPage = Math.min(page, totalPages);

  const resources = await db.resource.findMany({
    where,
    orderBy: RESOURCE_ORDER_BY[sort],
    skip: (currentPage - 1) * size,
    take: size,
    select: {
      id: true,
      name: true,
      type: true,
      location: true,
      capacity: true,
      description: true,
      imageName: true,
    },
  });
  const from = total === 0 ? 0 : (currentPage - 1) * size + 1;
  const to = (currentPage - 1) * size + resources.length;

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Book a resource</h1>
        <p className="mt-1 text-sm text-gray-500">
          Pick a room, equipment or vehicle, then choose a time.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4">
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
        <ViewToggle view={view} />
      </div>

      {resources.length === 0 ? (
        <p className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500">
          {q || type
            ? "No resources match your search."
            : "No resources are available right now."}
        </p>
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((r) => (
            <div
              key={r.id}
              className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white"
            >
              <ResourcePhoto
                imageName={r.imageName}
                type={r.type}
                variant="card"
              />
              <div className="flex flex-1 flex-col gap-2 p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  {RESOURCE_TYPE_LABELS[r.type]}
                </p>
                <p className="font-semibold">{r.name}</p>
                <p className="text-sm text-gray-500">
                  {r.location}
                  {r.capacity ? ` · ${r.capacity} people` : ""}
                </p>
                {r.description && (
                  <p className="line-clamp-2 text-sm text-gray-600">
                    {r.description}
                  </p>
                )}
                <Link
                  href={`/member/resources/${r.id}`}
                  className={`mt-auto self-start ${bookButton}`}
                >
                  Book
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
          {resources.map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-gray-50"
            >
              <ResourcePhoto
                imageName={r.imageName}
                type={r.type}
                variant="row"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{r.name}</p>
                <p className="truncate text-sm text-gray-500">
                  {RESOURCE_TYPE_LABELS[r.type]} · {r.location}
                  {r.capacity ? ` · ${r.capacity} people` : ""}
                </p>
              </div>
              <Link
                href={`/member/resources/${r.id}`}
                className={`shrink-0 ${bookButton}`}
              >
                Book
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
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
        <TablePagination
          page={currentPage}
          pageSize={size}
          total={total}
          sizes={CARD_PAGE_SIZES}
          defaultSize={DEFAULT_CARD_PAGE_SIZE}
        />
      </div>
    </section>
  );
}
