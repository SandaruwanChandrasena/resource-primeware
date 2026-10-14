import Navbar from "@/components/navbar";
import { requireMember } from "@/lib/auth-guard";

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const user = await requireMember();

  return (
    <>
      <Navbar name={user.name} role={user.role} />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </>
  );
}