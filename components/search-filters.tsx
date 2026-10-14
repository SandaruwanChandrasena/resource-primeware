"use client";

import { useRef } from "react";
import { SearchIcon } from "@/components/app-icons";
import Spinner from "@/components/spinner";
import { useUrlQuery } from "@/lib/url-query";

type SearchFiltersProps = {
  q: string;
  placeholder: string;
  filter: { param: string; label: string; allLabel: string; value: string; options: Record<string, string> };
};

const fieldClass =
  "rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100";

// Reusable: search box + one dropdown filter. Values live in the URL.
export default function SearchFilters({ q, placeholder, filter }: SearchFiltersProps) {
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
      [filter.param]: String(data.get(filter.param) ?? "") || undefined,
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
    (form.elements.namedItem(filter.param) as HTMLSelectElement).value = "";
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
          placeholder={placeholder}
          aria-label={placeholder}
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
        name={filter.param}
        defaultValue={filter.value}
        onChange={apply}
        aria-label={filter.label}
        className={fieldClass}
      >
        <option value="">{filter.allLabel}</option>
        {Object.entries(filter.options).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      {(q || filter.value) && (
        <button type="button" onClick={clearAll} className="px-2 py-2 text-sm font-medium text-brand-700 hover:underline">
          Clear
        </button>
      )}
    </form>
  );
}