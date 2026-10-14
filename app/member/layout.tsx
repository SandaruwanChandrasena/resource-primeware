import MemberNavbar from "@/components/layout/member-navbar";
import { requireMember } from "@/lib/security/auth-guard";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireMember();

  return (
    <div className="relative min-h-screen">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-linear-to-b from-brand-100 to-transparent"
      />
      <MemberNavbar name={user.name} imageName={user.imageName} />
      {/* Wider on big screens (D79); same width as the navbar. */}
      <main className="relative mx-auto max-w-[96rem] px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
