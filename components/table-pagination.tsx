"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@/components/app-icons";
import Spinner from "@/components/spinner";
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZES,
  getPageNumbers,
} from "@/lib/pagination";
import { useUrlQuery } from "@/lib/url-query";

type TablePaginationProps = { page: number; pageSize: number; total: number };

const pageButton =
  "flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium tabular-nums";

// Reusable: rows per page + page buttons. Page and size live in the URL.
export default function TablePagination({
  page,
  pageSize,
  total,
}: TablePaginationProps) {
  const { update, pending } = useUrlQuery();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const goTo = (p: number) => update({ page: p === 1 ? undefined : String(p) });

  return (
    <div className="flex flex-wrap items-center gap-4">
      {pending && <Spinner className="h-4 w-4 text-gray-400" />}

      <label className="flex items-center gap-2 text-sm text-gray-500">
        Rows per page
        <select
          value={pageSize}
          // New size starts again at page 1.
          onChange={(e) =>
            update({
              size:
                Number(e.target.value) === DEFAULT_PAGE_SIZE
                  ? undefined
                  : e.target.value,
              page: undefined,
            })
          }
          className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>

      <nav aria-label="Pages" className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => goTo(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className={`${pageButton} text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent`}
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>

        {getPageNumbers(page, totalPages).map((p, i) =>
          p === "gap" ? (
            <span key={`gap-${i}`} className="px-1 text-gray-400">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => goTo(p)}
              aria-current={p === page ? "page" : undefined}
              className={`${pageButton} ${p === page ? "bg-brand-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => goTo(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          className={`${pageButton} text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent`}
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </nav>
    </div>
  );
}
