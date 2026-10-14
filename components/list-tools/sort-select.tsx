"use client";

import SelectMenu, { toOptions } from "@/components/ui/select-menu";
import { useUrlQuery } from "@/lib/utils/url-query";

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
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <span aria-hidden="true">Sort</span>
      <SelectMenu
        label="Sort"
        size="sm"
        options={toOptions(options)}
        value={value}
        onChange={(v) =>
          update({ sort: v === defaultValue ? undefined : v, page: undefined })
        }
        className="w-36"
      />
    </div>
  );
}
