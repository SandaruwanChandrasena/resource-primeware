import Link from "next/link";
import { setUserActive } from "@/actions/users";
import { PlusIcon } from "@/components/layout/app-icons";
import ConfirmButton from "@/components/ui/confirm-button";
import FilterTabs from "@/components/list-tools/filter-tabs";
import SearchFilters from "@/components/list-tools/search-filters";
import SortSelect from "@/components/list-tools/sort-select";
import StatusPill from "@/components/ui/status-pill";
import SubmitButton from "@/components/ui/submit-button";
import TablePagination from "@/components/list-tools/table-pagination";
import type { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import {
  ROLE_LABELS,
  USER_SORT_LABELS,
  getInitials,
  type UserSort,
} from "@/lib/user-display";
import { userFilterSchema } from "@/lib/validation";

export const metadata = { title: "Users | Resource Reservation" };

// Each sort choice -> database order. Name breaks ties.
const ORDER_BY = {
  oldest: [{ createdAt: "asc" }, { name: "asc" }],
  newest: [{ createdAt: "desc" }, { name: "asc" }],
  name: [{ name: "asc" }],
} satisfies Record<UserSort, Prisma.UserOrderByWithRelationInput[]>;

// Same width for Activate and Deactivate, so Edit buttons line up.
const TOGGLE_CLASS =
  "flex w-24 items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-60";

type AdminUsersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  const admin = await requireAdmin();
  const { q, role, status, sort, page, size } = userFilterSchema.parse(
    await searchParams,
  );

  // Search + role apply to every tab; the tab adds the status.
  const baseWhere: Prisma.UserWhereInput = {
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    }),
    ...(role && { role }),
  };
  const [allCount, activeCount] = await Promise.all([
    db.user.count({ where: baseWhere }),
    db.user.count({ where: { ...baseWhere, isActive: true } }),
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

  // Safe fields only: never the password hash (D26).
  const users = await db.user.findMany({
    where: { ...baseWhere, ...(status && { isActive: status === "active" }) },
    orderBy: ORDER_BY[sort],
    skip: (currentPage - 1) * size,
    take: size,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      department: true,
      role: true,
      isActive: true,
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
  const to = (currentPage - 1) * size + users.length;

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="mt-1 text-sm text-gray-500">
          Staff accounts. Only admins can add new people.
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
            placeholder="Search name or email"
            filter={{
              param: "role",
              label: "Filter by role",
              allLabel: "All roles",
              value: role ?? "",
              options: ROLE_LABELS,
            }}
          />
          <Link
            href="/admin/users/new"
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <PlusIcon className="h-4 w-4" />
            Add user
          </Link>
        </div>

        <div className="overflow-x-auto border-y border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Department</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Upcoming bookings</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => {
                const isSelf = u.id === admin.id;
                const upcoming = u._count.reservations;
                return (
                  <tr
                    key={u.id}
                    className={`transition-colors hover:bg-gray-50 ${u.isActive ? "" : "bg-gray-50/60 text-gray-500"}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                            u.isActive
                              ? "bg-brand-100 text-brand-700"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {getInitials(u.name)}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 font-medium text-gray-900">
                            {u.name}
                            {isSelf && (
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {u.department ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                      {u.phone ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {ROLE_LABELS[u.role]}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{upcoming}</td>
                    <td className="px-4 py-3">
                      <StatusPill tone={u.isActive ? "green" : "gray"}>
                        {u.isActive ? "Active" : "Inactive"}
                      </StatusPill>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/users/${u.id}/edit`}
                          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Edit
                        </Link>
                        {isSelf ? (
                          // D49: no Deactivate on your own row. Empty space keeps Edit lined up.
                          <span className="w-24" aria-hidden="true" />
                        ) : u.isActive ? (
                          <ConfirmButton
                            action={setUserActive.bind(null, u.id, false)}
                            label="Deactivate"
                            className={`${TOGGLE_CLASS} border-red-200 bg-white text-red-700 hover:bg-red-50`}
                            title={`Deactivate ${u.name}?`}
                            message={
                              upcoming > 0
                                ? `They will be logged out at once and can't sign in. Their ${upcoming} upcoming booking(s) will stay, so cancel them by hand if needed.`
                                : "They will be logged out at once and can't sign in. You can activate them again later."
                            }
                            confirmLabel="Deactivate"
                            pendingText="Deactivating..."
                          />
                        ) : (
                          // Activate is safe and easy to undo, so no confirm box.
                          <form action={setUserActive.bind(null, u.id, true)}>
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
          {users.length === 0 && (
            <p className="px-4 py-10 text-center text-sm text-gray-500">
              No users match your search.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span className="tabular-nums">
              Showing {from}–{to} of {total}
            </span>
            <SortSelect
              options={USER_SORT_LABELS}
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
