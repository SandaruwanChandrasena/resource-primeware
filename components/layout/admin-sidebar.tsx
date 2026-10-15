"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/actions/auth";
import AppLogo from "@/components/layout/app-logo";
import NotificationBell from "@/components/layout/notification-bell";
import ProfileLink, { AVATAR_GLOW } from "@/components/layout/profile-link";
import {
  DashboardIcon,
  LogoutIcon,
  ResourcesIcon,
  UsersIcon,
} from "@/components/layout/app-icons";
import SubmitButton from "@/components/ui/submit-button";
import UserAvatar from "@/components/ui/user-avatar";

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

type AdminSidebarProps = { name: string; imageName: string | null };

export default function AdminSidebar({ name, imageName }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="relative z-20 flex flex-col gap-3 border-b border-gray-200 bg-white p-3 md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:gap-6 md:border-b-0 md:border-r md:p-4">
      <div className="flex items-center justify-between">
        <AppLogo href="/admin" />
        <div className="flex items-center gap-2">
          {/* Bell on every screen size; z-20 on the sidebar keeps its list on top. */}
          <NotificationBell placement="sidebar" />
          {/* Phones: avatar + log out in the top bar. */}
          <div className="flex items-center gap-2 md:hidden">
            <ProfileLink
              name={name}
              imageName={imageName}
              href="/admin/profile"
              active={pathname === "/admin/profile"}
            />
            <form action={logout}>
              <SubmitButton
                aria-label="Log out"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900 text-white transition-colors hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:opacity-60"
              >
                <LogoutIcon />
              </SubmitButton>
            </form>
          </div>
        </div>
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
        {/* The name is already shown here, so the avatar only glows. */}
        <Link
          href="/admin/profile"
          aria-current={pathname === "/admin/profile" ? "page" : undefined}
          title="My profile"
          className="group -m-1 flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg p-1 transition-colors hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
        >
          <UserAvatar
            name={name}
            imageName={imageName}
            size="md"
            className={`ring-2 ring-brand-600/40 ring-offset-2 transition-all duration-300 group-hover:scale-105 group-hover:ring-brand-600/70 group-active:scale-95 motion-reduce:transition-none ${AVATAR_GLOW}`}
          />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{name}</span>
            <span className="block text-xs text-gray-500 group-hover:text-brand-700">
              Administrator · My profile
            </span>
          </span>
        </Link>
        <form action={logout} className="shrink-0">
          <SubmitButton
            aria-label="Log out"
            title="Log out"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900 text-white transition-colors hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:opacity-60"
          >
            <LogoutIcon />
          </SubmitButton>
        </form>
      </div>
    </aside>
  );
}
