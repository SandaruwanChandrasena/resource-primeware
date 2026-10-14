"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/actions/auth";
import AppLogo from "@/components/layout/app-logo";
import { LogoutIcon } from "@/components/layout/app-icons";
import ProfileLink from "@/components/layout/profile-link";
import SubmitButton from "@/components/ui/submit-button";

// Add one line here when a new member page is built (D48).
const NAV_ITEMS = [
  { href: "/member", label: "Home" },
  { href: "/member/resources", label: "Resources" },
  { href: "/member/bookings", label: "My bookings" },
];

// "/member" must match exactly; other links also match their sub-pages.
function isActive(pathname: string, href: string) {
  if (href === "/member") return pathname === "/member";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function MemberNavbar({ name }: { name: string }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200/80 bg-white/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <AppLogo href="/member" hideTextOnMobile />

        <nav aria-label="Member" className="flex gap-1 overflow-x-auto">
          {NAV_ITEMS.map(({ href, label }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-gray-600 hover:bg-white/70 hover:text-gray-900"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <ProfileLink
            name={name}
            href="/member/profile"
            active={pathname === "/member/profile"}
          />
          <form action={logout}>
            <SubmitButton
              aria-label="Log out"
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              <LogoutIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Log out</span>
            </SubmitButton>
          </form>
        </div>
      </div>
    </header>
  );
}
