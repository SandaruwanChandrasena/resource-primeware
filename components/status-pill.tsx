const TONES = {
  green: "bg-green-50 text-green-700 ring-green-600/20",
  red: "bg-red-50 text-red-700 ring-red-600/20",
  gray: "bg-gray-100 text-gray-600 ring-gray-500/20",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
} as const;

type StatusPillProps = { tone: keyof typeof TONES; children: React.ReactNode };

export default function StatusPill({ tone, children }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}