import Link from "next/link";
import { getInitials } from "@/lib/config/user-display";

type ProfileLinkProps = { name: string; href: string; active?: boolean };

// Soft blue glow, shared with the admin sidebar card.
export const AVATAR_GLOW =
  "shadow-[0_0_10px_color-mix(in_oklab,var(--color-brand-600)_35%,transparent)] hover:shadow-[0_0_16px_color-mix(in_oklab,var(--color-brand-600)_55%,transparent)]";

// Round avatar with a glow. On hover it widens and shows the first name (D76).
// Hover: light blue + small grow; click: small press, so it feels clickable.
export default function ProfileLink({
  name,
  href,
  active = false,
}: ProfileLinkProps) {
  const firstName = name.split(" ").filter(Boolean)[0] ?? name;

  return (
    <Link
      href={href}
      aria-label="My profile"
      aria-current={active ? "page" : undefined}
      title="My profile"
      className={`group flex shrink-0 cursor-pointer items-center rounded-full bg-white p-0.5 ring-2 ring-brand-600/40 transition-all duration-500 ease-out hover:bg-brand-50 hover:ring-brand-600/70 active:scale-95 focus:outline-none focus-visible:ring-brand-600 motion-reduce:transition-none ${AVATAR_GLOW}`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none">
        {getInitials(name)}
      </span>
      {/* Width 0 -> full: the avatar slides left as the name appears. */}
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium text-brand-700 opacity-0 transition-all duration-500 ease-out group-hover:max-w-32 group-hover:px-2.5 group-hover:opacity-100 group-focus-visible:max-w-32 group-focus-visible:px-2.5 group-focus-visible:opacity-100 motion-reduce:transition-none">
        {firstName}
      </span>
    </Link>
  );
}
