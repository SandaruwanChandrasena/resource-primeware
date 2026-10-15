import Link from "next/link";

// Icon tile colors. Each card can have its own color; default is brand blue.
const TONES = {
  blue: "bg-brand-100 text-brand-700",
  violet: "bg-violet-100 text-violet-700",
  emerald: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
};

type StatCardProps = {
  label: string;
  value: string | number;
  hint: string;
  href?: string;
  icon: (props: { className?: string }) => React.ReactNode;
  tone?: keyof typeof TONES;
};

// One summary card (admin dashboard + member home). With href, the whole card is a link.
export default function StatCard({
  label,
  value,
  hint,
  href,
  icon: Icon,
  tone = "blue",
}: StatCardProps) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TONES[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
      {/* Numbers big; text (e.g. a resource name) a bit smaller and cut if long. */}
      <p
        className={`truncate font-bold tracking-tight text-gray-900 ${typeof value === "number" ? "text-3xl tabular-nums" : "text-xl"}`}
      >
        {value}
      </p>
      <p
        className={`truncate text-xs ${href ? "font-medium text-brand-600 group-hover:text-brand-700" : "text-gray-500"}`}
      >
        {hint}
        {href && <span aria-hidden="true"> →</span>}
      </p>
    </>
  );
  const box =
    "flex min-w-0 flex-col gap-1.5 rounded-xl border border-gray-200 bg-white p-5";

  return href ? (
    <Link
      href={href}
      className={`group ${box} transition-colors hover:border-brand-600/40 hover:bg-brand-50/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600`}
    >
      {body}
    </Link>
  ) : (
    <div className={box}>{body}</div>
  );
}
