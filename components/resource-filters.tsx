"use client";

import { usePathname, useRouter } from "next/navigation";
import { useRef, useTransition } from "react";
import Spinner from "@/components/spinner";
import { RESOURCE_SORT_LABELS, RESOURCE_TYPE_LABELS, type ResourceSort } from "@/lib/resource-types";

type ResourceFiltersProps = { q: string; type: string; status: string; sort: ResourceSort };

const fieldClass =
  "rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100";

// Search + filters live in the URL, so refresh and Back keep them.
export default function ResourceFilters({ q, type, status, sort }: ResourceFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const formRef = useRef<HTMLFormElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [pending, startTransition] = useTransition();
  const hasFilters = Boolean(q || type || status || sort !== "oldest");

  // Read the form and update the URL. Skip empty and default values.
  function apply() {
    clearTimeout(timerRef.current);
    const form = formRef.current;
    if (!form) return;

    const params = new URLSearchParams();
    for (const [key, value] of new FormData(form)) {
      const text = String(value).trim();
      if (text && !(key === "sort" && text === "oldest")) params.set(key, text);
    }
    const query = params.toString();
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }));
  }

  // Live search: wait 300 ms after the last key.
  function applySoon() {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(apply, 300);
  }

  function clearAll() {
    const form = formRef.current;
    if (!form) return;
    for (const name of ["q", "type", "status"]) {
      (form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement).value = "";
    }
    (form.elements.namedItem("sort") as HTMLSelectElement).value = "oldest";
    apply();
  }

  return (
    <form
      ref={formRef}
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
      className="flex flex-wrap items-center gap-2"
    >
      <input
        name="q"
        type="search"
        defaultValue={q}
        onChange={applySoon}
        maxLength={80}
        placeholder="Search name or location"
        aria-label="Search resources"
        className={`${fieldClass} w-full sm:w-64`}
      />
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
      >
        {pending && <Spinner />}
        Search
      </button>

      <select name="type" defaultValue={type} onChange={apply} aria-label="Filter by type" className={fieldClass}>
        <option value="">All types</option>
        {Object.entries(RESOURCE_TYPE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <select name="status" defaultValue={status} onChange={apply} aria-label="Filter by status" className={fieldClass}>
        <option value="">All statuses</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>

      <select name="sort" defaultValue={sort} onChange={apply} aria-label="Sort" className={fieldClass}>
        {Object.entries(RESOURCE_SORT_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      {hasFilters && (
        <button type="button" onClick={clearAll} className="px-2 py-2 text-sm font-medium text-brand-700 hover:underline">
          Clear
        </button>
      )}
    </form>
  );
}