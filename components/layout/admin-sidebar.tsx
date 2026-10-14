"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/actions/auth";
import AppLogo from "@/components/layout/app-logo";
import {
  DashboardIcon,
  LogoutIcon,
  ResourcesIcon,
  UsersIcon,
} from "@/components/layout/app-icons";
import SubmitButton from "@/components/ui/submit-button";
import { getInitials } from "@/lib/config/user-display";

// Add one line here when a new admin page is built (D48).
const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: DashboardIcon },
  { href: "/admin/resources", label: "Resources", icon: ResourcesIcon },
  { href: "/admin/users", label: "Users", icon: UsersIcon },
];

// "/admin" must match exactly; other links also match their sub-pages.
function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminSidebar({ name }: { name: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col gap-3 border-b border-gray-200 bg-white p-3 md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:gap-6 md:border-b-0 md:border-r md:p-4">
      <div className="flex items-center justify-between">
        <AppLogo href="/admin" />
        <form action={logout} className="md:hidden">
          <SubmitButton
            aria-label="Log out"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          >
            <LogoutIcon />
          </SubmitButton>
        </form>
      </div>

      <div>
        <p className="mb-2 hidden px-3 text-xs font-semibold uppercase tracking-wider text-gray-400 md:block">
          Main menu
        </p>
        <nav
          aria-label="Admin"
          className="flex gap-1 overflow-x-auto md:flex-col"
        >
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand-600 text-white"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto hidden items-center gap-3 rounded-xl bg-gray-50 p-3 md:flex">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
          {getInitials(name)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="text-xs text-gray-500">Administrator</p>
        </div>
        <form action={logout} className="ml-auto">
          <SubmitButton
            aria-label="Log out"
            title="Log out"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-200 hover:text-gray-900"
          >
            <LogoutIcon />
          </SubmitButton>
        </form>
      </div>
    </aside>
  );
}
