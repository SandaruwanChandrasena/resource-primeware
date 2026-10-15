import Link from "next/link";

export type BarRow = {
  id: string;
  label: string;
  value: number;
  valueText: string;
  subText?: string;
  href: string;
  tooltip: string;
};

type BarChartProps = {
  title: string;
  badge: string;
  info: string;
  rows: BarRow[];
  tone: "brand" | "red";
  emptyText: string;
};

// Bar colors follow the status colors (D44): red (rose) = problem.
const TONES = {
  brand: "bg-brand-600 group-hover:bg-brand-700",
  red: "bg-rose-500 group-hover:bg-rose-600",
};

// Reusable horizontal bar chart. Plain CSS, no chart library (D11).
export default function BarChart({
  title,
  badge,
  info,
  rows,
  tone,
  emptyText,
}: BarChartProps) {
  const max = Math.max(...rows.map((r) => r.value), 0);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{title}</h2>
        {/* Short badge on screen; the full rule is in the hover title. */}
        <span
          title={info}
          className="shrink-0 cursor-help rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600"
        >
          {badge}
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">{emptyText}</p>
      ) : (
        <ul className="mt-5 flex flex-col gap-4">
          {rows.map((r, i) => (
            <li key={r.id}>
              <Link
                href={r.href}
                title={r.tooltip}
                className="group grid grid-cols-[1.5rem_7rem_1fr_auto] items-center gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 sm:grid-cols-[1.5rem_9rem_1fr_auto]"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-500">
                  {i + 1}
                </span>
                <span className="truncate text-sm font-medium text-gray-700 group-hover:text-brand-700">
                  {r.label}
                </span>
                <span className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                  {/* Longest bar = 100%. At least 4% so a small value is still seen. */}
                  <span
                    className={`block h-full rounded-full transition-colors ${TONES[tone]}`}
                    style={{ width: `${Math.max(4, (r.value / max) * 100)}%` }}
                  />
                </span>
                <span className="min-w-14 text-right text-sm font-semibold tabular-nums text-gray-700">
                  {r.valueText}
                </span>
                {r.subText && (
                  <span className="col-start-3 -mt-2 text-xs text-gray-400">
                    {r.subText}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
