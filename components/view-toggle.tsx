"use client";

import { useUrlQuery } from "@/lib/url-query";

type View = "grid" | "list";

const VIEWS: { value: View; label: string; path: string }[] = [
  {
    value: "grid",
    label: "Grid view",
    path: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  },
  { value: "list", label: "List view", path: "M4 6h16M4 12h16M4 18h16" },
];

// Reusable Grid / List switch. "grid" is the default, kept out of the URL.
export default function ViewToggle({ view }: { view: View }) {
  const { update } = useUrlQuery();

  return (
    <div
      role="group"
      aria-label="View"
      className="flex rounded-lg border border-gray-300 bg-white p-0.5"
    >
      {VIEWS.map((v) => {
        const active = v.value === view;
        return (
          <button
            key={v.value}
            type="button"
            aria-pressed={active}
            aria-label={v.label}
            title={v.label}
            onClick={() =>
              update({ view: v.value === "grid" ? undefined : v.value })
            }
            className={`flex h-8 w-8 items-center justify-center rounded-md ${
              active
                ? "bg-brand-50 text-brand-700"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="h-4 w-4"
            >
              <path d={v.path} />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
