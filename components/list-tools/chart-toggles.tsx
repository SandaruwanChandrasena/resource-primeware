"use client";

import { useState } from "react";
import { useUrlQuery } from "@/lib/utils/url-query";

type ChartToggle = { value: string; label: string };
type ChartTogglesProps = { charts: ChartToggle[]; hidden: string[] };

// Chips to show or hide dashboard charts. Hidden ones live in the URL (D54).
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
    <fieldset className="flex flex-wrap items-center gap-2">
      <legend className="sr-only">Charts to show</legend>
      {charts.map((c) => {
        const on = !off.includes(c.value);
        return (
          // Real checkbox stays (keyboard + screen readers); the chip is its look.
          <label
            key={c.value}
            className={`flex cursor-pointer select-none items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-600 ${
              on
                ? "border-brand-100 bg-brand-50 text-brand-700"
                : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            <input
              type="checkbox"
              checked={on}
              onChange={(e) => toggle(c.value, e.target.checked)}
              className="sr-only"
            />
            <span aria-hidden="true">{on ? "✓" : "+"}</span>
            {c.label}
          </label>
        );
      })}
    </fieldset>
  );
}
