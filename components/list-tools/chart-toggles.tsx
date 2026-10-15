"use client";

import { useState } from "react";
import { useUrlQuery } from "@/lib/utils/url-query";

type ChartToggle = { value: string; label: string };
type ChartTogglesProps = { charts: ChartToggle[]; hidden: string[] };

// Checkboxes to show or hide dashboard charts. Hidden ones live in the URL (D54).
export default function ChartToggles({ charts, hidden }: ChartTogglesProps) {
  const { update } = useUrlQuery();
  // Local copy, so the tick changes at once (the page reloads after).
  const [off, setOff] = useState(hidden);

  function toggle(value: string, show: boolean) {
    const next = show ? off.filter((v) => v !== value) : [...off, value];
    setOff(next);
    // All shown = default = nothing in the URL.
    update({ hide: next.join(",") || undefined });
  }

  return (
    <fieldset className="flex flex-wrap items-center gap-x-5 gap-y-2">
      <legend className="sr-only">Charts to show</legend>
      <span className="text-sm font-medium text-gray-700">Show charts:</span>
      {charts.map((c) => (
        <label
          key={c.value}
          className="flex cursor-pointer items-center gap-2 text-sm text-gray-700"
        >
          <input
            type="checkbox"
            checked={!off.includes(c.value)}
            onChange={(e) => toggle(c.value, e.target.checked)}
            className="h-4 w-4 accent-brand-600"
          />
          {c.label}
        </label>
      ))}
    </fieldset>
  );
}
