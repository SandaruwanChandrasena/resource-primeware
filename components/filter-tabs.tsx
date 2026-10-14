"use client";

import { useUrlQuery } from "@/lib/url-query";

type FilterTab = { value: string; label: string; count: number };
type FilterTabsProps = { param: string; tabs: FilterTab[]; current: string };

// Reusable tabs with counts, e.g. All (8) · Active (7) · Inactive (1).
export default function FilterTabs({ param, tabs, current }: FilterTabsProps) {
  const { update } = useUrlQuery();

  return (
    <div className="flex gap-1 overflow-x-auto border-b border-gray-200 px-4">
      {tabs.map((tab) => {
        const active = tab.value === current;
        return (
          <button
            key={tab.value}
            type="button"
            aria-pressed={active}
            // A new tab starts again at page 1.
            onClick={() =>
              update({ [param]: tab.value || undefined, page: undefined })
            }
            className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium ${
              active
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${
                active
                  ? "bg-brand-50 text-brand-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
