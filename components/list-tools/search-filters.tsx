"use client";

import { useRef, useState } from "react";
import { SearchIcon } from "@/components/layout/app-icons";
import PendingLabel from "@/components/ui/pending-label";
import SelectMenu, { toOptions } from "@/components/ui/select-menu";
import { useUrlQuery } from "@/lib/utils/url-query";

type SearchFiltersProps = {
  q: string;
  placeholder: string;
  filter: {
    param: string;
    label: string;
    allLabel: string;
    value: string;
    options: Record<string, string>;
  };
};

// Reusable: search box + one dropdown filter. Values live in the URL.
export default function SearchFilters({
  q,
  placeholder,
  filter,
}: SearchFiltersProps) {
  const { update, pending } = useUrlQuery();
  const [filterValue, setFilterValue] = useState(filter.value);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const filterOptions = [
    { value: "", label: filter.allLabel },
    ...toOptions(filter.options),
  ];

  // Update the URL. A new search starts at page 1.
  function apply(next: { q?: string; filter?: string } = {}) {
    clearTimeout(timerRef.current);
    const text = (next.q ?? inputRef.current?.value ?? "").trim();
    const chosen = next.filter ?? filterValue;
    update({
      q: text || undefined,
      [filter.param]: chosen || undefined,
      page: undefined,
    });
  }

  // Live search: wait 300 ms after the last key.
  function applySoon() {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => apply(), 300);
  }

  function clearAll() {
    if (inputRef.current) inputRef.current.value = "";
    setFilterValue("");
    apply({ q: "", filter: "" });
  }

  return (
    <form
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
          ref={inputRef}
          type="search"
          defaultValue={q}
          onChange={applySoon}
          maxLength={80}
          placeholder={placeholder}
          aria-label={placeholder}
          className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
      >
        <PendingLabel pending={pending}>Search</PendingLabel>
      </button>

      <SelectMenu
        label={filter.label}
        options={filterOptions}
        value={filterValue}
        onChange={(v) => {
          setFilterValue(v);
          apply({ filter: v });
        }}
        className="w-40"
      />

      {/* Always takes space, so nothing moves when it appears. */}
      <button
        type="button"
        onClick={clearAll}
        className={`px-2 py-2 text-sm font-medium text-brand-700 hover:underline ${q || filter.value ? "" : "invisible"}`}
      >
        Clear
      </button>
    </form>
  );
}
