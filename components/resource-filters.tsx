"use client";

import { useRef } from "react";
import { SearchIcon } from "@/components/app-icons";
import Spinner from "@/components/spinner";
import { RESOURCE_TYPE_LABELS } from "@/lib/resource-types";
import { useUrlQuery } from "@/lib/url-query";

type ResourceFiltersProps = { q: string; type: string };

const fieldClass =
  "rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100";

// Search box + type filter. Values live in the URL.
export default function ResourceFilters({ q, type }: ResourceFiltersProps) {
  const { update, pending } = useUrlQuery();
  const formRef = useRef<HTMLFormElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Read the form and update the URL. New search starts at page 1.
  function apply() {
    clearTimeout(timerRef.current);
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    update({
      q: String(data.get("q") ?? "").trim() || undefined,
      type: String(data.get("type") ?? "") || undefined,
      page: undefined,
    });
  }

  // Live search: wait 300 ms after the last key.
  function applySoon() {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(apply, 300);
  }

  function clearAll() {
    const form = formRef.current;
    if (!form) return;
    (form.elements.namedItem("q") as HTMLInputElement).value = "";
    (form.elements.namedItem("type") as HTMLSelectElement).value = "";
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
      <div className="relative w-full sm:w-72">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          name="q"
          type="search"
          defaultValue={q}
          onChange={applySoon}
          maxLength={80}
          placeholder="Search name or location"
          aria-label="Search resources"
          className={`${fieldClass} w-full pl-9`}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
      >
        {pending && <Spinner />}
        Search
      </button>

      <select
        name="type"
        defaultValue={type}
        onChange={apply}
        aria-label="Filter by type"
        className={fieldClass}
      >
        <option value="">All types</option>
        {Object.entries(RESOURCE_TYPE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      {(q || type) && (
        <button
          type="button"
          onClick={clearAll}
          className="px-2 py-2 text-sm font-medium text-brand-700 hover:underline"
        >
          Clear
        </button>
      )}
    </form>
  );
}
