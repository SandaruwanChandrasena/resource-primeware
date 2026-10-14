import Link from "next/link";
import { logout } from "@/actions/auth";

type NavbarProps = { name: string; role: "ADMIN" | "MEMBER" };

export default function Navbar({ name, role }: NavbarProps) {
  const home = role === "ADMIN" ? "/admin" : "/member";

  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href={home} className="flex items-center gap-2 font-semibold text-gray-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-sm font-bold text-white">
            R
          </span>
          <span>Resource Reservation</span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-gray-900">{name}</p>
            <p className="text-xs text-gray-500">{role === "ADMIN" ? "Administrator" : "Member"}</p>
          </div>

          <form action={logout}>
            <button
              type="submit"
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Log out
            </button>
          </form>
        </div>
      </nav>
    </header>
  );
}