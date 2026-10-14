"use client";

import { useUrlQuery } from "@/lib/url-query";

type SortSelectProps = {
  options: Record<string, string>;
  value: string;
  defaultValue: string;
};

// Reusable sort dropdown. The default value is kept out of the URL.
export default function SortSelect({
  options,
  value,
  defaultValue,
}: SortSelectProps) {
  const { update } = useUrlQuery();

  return (
    <label className="flex items-center gap-2 text-sm text-gray-500">
      Sort
      <select
        value={value}
        onChange={(e) =>
          update({
            sort: e.target.value === defaultValue ? undefined : e.target.value,
            page: undefined,
          })
        }
        className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
      >
        {Object.entries(options).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}
