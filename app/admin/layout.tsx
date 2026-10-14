import Navbar from "@/components/navbar";
import { requireAdmin } from "@/lib/auth-guard";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  return (
    <>
      <Navbar name={user.name} role={user.role} />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </>
  );
}