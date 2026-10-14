import type { Role } from "@/generated/prisma/client";
import { getInitials, ROLE_LABELS } from "@/lib/config/user-display";
import { formatLongDate } from "@/lib/utils/colombo-time";

type ProfileDetailsProps = {
  user: {
    name: string;
    email: string;
    phone: string | null;
    department: string | null;
    role: Role;
    createdAt: Date;
  };
};

// Read-only: only an admin edits accounts (D9).
export default function ProfileDetails({ user }: ProfileDetailsProps) {
  const rows = [
    { label: "Email", value: user.email },
    { label: "Phone", value: user.phone ?? "—" },
    { label: "Department", value: user.department ?? "—" },
    { label: "Member since", value: formatLongDate(user.createdAt) },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xl font-semibold text-brand-700 ring-2 ring-brand-600/40 ring-offset-2">
          {getInitials(user.name)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{user.name}</p>
          {/* Role is not a status, so brand blue, not a D44 color. */}
          <span className="mt-1 inline-flex rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-600/20">
            {ROLE_LABELS[user.role]}
          </span>
        </div>
      </div>

      <dl className="mt-6 divide-y divide-gray-100 text-sm">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid gap-1 py-3 sm:grid-cols-[140px_1fr]"
          >
            <dt className="font-medium text-gray-500">{row.label}</dt>
            <dd className="break-words text-gray-900">{row.value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 text-xs text-gray-500">
        To change these details, ask an administrator.
      </p>
    </div>
  );
}
