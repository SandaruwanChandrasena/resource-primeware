import Link from "next/link";

type StatCardProps = {
  label: string;
  value: string | number;
  hint: string;
  href?: string;
  icon: (props: { className?: string }) => React.ReactNode;
};

// One summary card (admin dashboard + member home). With href, the whole card is a link.
export default function StatCard({
  label,
  value,
  hint,
  href,
  icon: Icon,
}: StatCardProps) {
  const body = (
    <>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        {/* Numbers big; text (e.g. a resource name) a bit smaller and cut if long. */}
        <p
          className={`mt-2 truncate font-bold tracking-tight ${typeof value === "number" ? "text-3xl tabular-nums" : "text-xl"}`}
        >
          {value}
        </p>
        <p className="mt-1 truncate text-xs text-gray-500 group-hover:text-brand-700">
          {hint}
        </p>
      </div>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
        <Icon className="h-5 w-5" />
      </span>
    </>
  );
  const box =
    "flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white p-5";

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
