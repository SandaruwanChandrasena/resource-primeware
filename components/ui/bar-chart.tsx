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
  description: string;
  rows: BarRow[];
  tone: "brand" | "red";
  emptyText: string;
};

// Bar colors follow the status colors (D44): red = problem.
const TONES = {
  brand: "bg-brand-600 group-hover:bg-brand-700",
  red: "bg-red-500 group-hover:bg-red-600",
};

// Reusable horizontal bar chart. Plain CSS, no chart library (D11).
export default function BarChart({
  title,
  description,
  rows,
  tone,
  emptyText,
}: BarChartProps) {
  const max = Math.max(...rows.map((r) => r.value), 0);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="text-sm text-gray-500">{description}</p>

      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">{emptyText}</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {rows.map((r) => (
            <li key={r.id}>
              <Link
                href={r.href}
                title={r.tooltip}
                className="group grid grid-cols-[8rem_1fr_auto] items-center gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 sm:grid-cols-[10rem_1fr_auto]"
              >
                <span className="truncate text-sm font-medium text-gray-700 group-hover:text-brand-700">
                  {r.label}
                </span>
                <span className="h-3 overflow-hidden rounded-full bg-gray-100">
                  {/* Longest bar = 100%. At least 4% so a small value is still seen. */}
                  <span
                    className={`block h-full rounded-full transition-colors ${TONES[tone]}`}
                    style={{ width: `${Math.max(4, (r.value / max) * 100)}%` }}
                  />
                </span>
                <span className="min-w-16 text-right text-sm tabular-nums text-gray-600">
                  {r.valueText}
                </span>
                {r.subText && (
                  <span className="col-start-2 -mt-2 text-xs text-gray-500">
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
