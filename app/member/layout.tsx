import MemberNavbar from "@/components/layout/member-navbar";
import { requireMember } from "@/lib/auth-guard";

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const user = await requireMember();

  return (
    <div className="relative min-h-screen">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-linear-to-b from-brand-100 to-transparent"
      />
      <MemberNavbar name={user.name} />
      <main className="relative mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}