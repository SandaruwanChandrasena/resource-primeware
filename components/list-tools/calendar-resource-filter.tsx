"use client";

import SelectMenu from "@/components/ui/select-menu";
import { useUrlQuery } from "@/lib/utils/url-query";

type CalendarResourceFilterProps = {
  resources: { id: string; name: string }[];
  value: string;
};

// "All resources" or one resource for the calendar. The choice lives in the URL (D54).
export default function CalendarResourceFilter({
  resources,
  value,
}: CalendarResourceFilterProps) {
  const { update } = useUrlQuery();

  return (
    <SelectMenu
      label="Filter calendar by resource"
      size="sm"
      className="w-44"
      value={value}
      onChange={(v) => update({ resource: v || undefined })}
      options={[
        { value: "", label: "All resources" },
        ...resources.map((r) => ({ value: r.id, label: r.name })),
      ]}
    />
  );
}
